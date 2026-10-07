const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/auth.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const session = () => ({ userId: 'fixture', accessToken: 'old-access', refreshToken: 'old-refresh',
  accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
  refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() });
function setup(fetch) {
  let stored = JSON.stringify(session());
  const context = { exports: {}, process: { env: {} }, Event: class {}, fetch,
    window: { localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; }, removeItem: () => { stored = null; } }, dispatchEvent() {} } };
  vm.runInNewContext(code, context);
  return { auth: context.exports, stored: () => stored && JSON.parse(stored) };
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
const next = () => ({ ...session(), accessToken: 'new-access', refreshToken: 'new-refresh', accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString() });

test('parallel callers share one refresh and retain the new session', async () => {
  const gate = deferred(); let calls = 0;
  const env = setup(async () => { calls++; await gate.promise; return { ok: true, status: 200, json: async () => next() }; });
  const pending = Array.from({ length: 10 }, () => env.auth.getValidAccessToken());
  gate.resolve();
  assert.deepEqual(await Promise.all(pending), Array(10).fill('new-access'));
  assert.equal(calls, 1);
  assert.equal(env.stored().refreshToken, 'new-refresh');
  await env.auth.refreshSession('old-access');
  assert.equal(calls, 1, 'a late 401 for the old access token must reuse the new session');
});
test('503 and network failures preserve the session', async () => {
  for (const fetch of [async () => ({ ok: false, status: 503 }), async () => { throw new TypeError('network'); }]) {
    const env = setup(fetch);
    await assert.rejects(env.auth.refreshSession());
    assert.equal(env.stored().refreshToken, 'old-refresh');
  }
});
test('invalid refresh expires the session once for all parallel callers', async () => {
  const gate = deferred(); let calls = 0;
  const env = setup(async () => { calls++; await gate.promise; return { ok: false, status: 401 }; });
  const pending = Array.from({ length: 5 }, () => env.auth.refreshSession());
  gate.resolve();
  const outcomes = await Promise.allSettled(pending);
  assert.equal(calls, 1);
  assert.equal(env.stored(), null);
  assert.ok(outcomes.every(x => x.status === 'rejected' && x.reason instanceof env.auth.SessionExpiredError));
});
test('a stale refresh response cannot clear or overwrite a newer login', async () => {
  for (const status of [200, 401]) {
    const gate = deferred();
    const env = setup(async () => { await gate.promise; return { ok: status === 200, status, json: async () => next() }; });
    const pending = env.auth.refreshSession();
    env.auth.saveSession({ ...next(), refreshToken: 'different-login' });
    gate.resolve();
    await pending;
    assert.equal(env.stored().refreshToken, 'different-login');
  }
});
test('expired stored sessions do not attempt refresh', async () => {
  let calls = 0;
  const env = setup(async () => { calls++; });
  env.auth.saveSession({ ...session(), refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString() });
  await assert.rejects(env.auth.getValidAccessToken(), env.auth.SessionExpiredError);
  assert.equal(env.stored(), null);
  assert.equal(calls, 0);
});
