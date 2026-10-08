const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, globals) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const context = { exports: {}, ...globals };
  vm.runInNewContext(code, context);
  return context.exports;
}

const google = load('nckh-google-auth.ts', {});
function setup(responses, refreshResult = null) {
  let stored = { accessToken: 'valid-access' };
  const calls = { refresh: 0, clear: 0, fetch: 0 };
  class SessionExpiredError extends Error {}
  const auth = {
    SessionExpiredError,
    getValidAccessToken: async () => stored?.accessToken,
    getStoredSession: () => stored,
    refreshSession: async () => {
      calls.refresh++;
      if (refreshResult) stored = { accessToken: 'new-access' };
      return refreshResult;
    },
    clearStoredSession: () => { calls.clear++; stored = null; }
  };
  const api = load('api.ts', {
    require: name => name === '@/lib/auth' ? auth : google,
    process: { env: {} }, Headers,
    fetch: async () => responses[Math.min(calls.fetch++, responses.length - 1)].clone()
  });
  return { api, calls, auth, stored: () => stored };
}
const unauthorized = detail => new Response(JSON.stringify({ title: 'Unauthorized', detail }), { status: 401 });

test('known Google 401s preserve FormAuto session without refresh for JSON and downloads', async () => {
  for (const detail of [
    'Google account not linked.',
    'Google account not linked. Please link your Google account.',
    'Google account not linked or token expired. Please re-link your Google account.'
  ]) {
    for (const method of ['apiFetch', 'apiFetchBlob']) {
      const env = setup([unauthorized(detail)]);
      await assert.rejects(env.api[method]('/api/v1/nckh/forms'), google.NckhGoogleAuthorizationError);
      assert.equal(env.stored().accessToken, 'valid-access');
      assert.deepEqual(env.calls, { refresh: 0, clear: 0, fetch: 1 });
    }
  }
});

test('unknown, empty and malformed 401s still expire an invalid FormAuto session', async () => {
  for (const response of [new Response(null, { status: 401 }), new Response('{', { status: 401 }),
    new Response('null', { status: 401 }), unauthorized('Unknown unauthorized failure'),
    new Response(JSON.stringify({ detail: 'Google account not linked.' }), { status: 401 })]) {
    for (const method of ['apiFetch', 'apiFetchBlob']) {
      const env = setup([response]);
      await assert.rejects(env.api[method]('/api/v1/nckh/forms'), env.auth.SessionExpiredError);
      assert.equal(env.stored(), null);
      assert.deepEqual(env.calls, { refresh: 1, clear: 1, fetch: 1 });
    }
  }
});

test('Google-looking errors outside NCKH cannot bypass FormAuto session recovery', async () => {
  const env = setup([unauthorized('Google account not linked.')]);
  await assert.rejects(env.api.apiFetch('/api/profile'), env.auth.SessionExpiredError);
  assert.equal(env.calls.refresh, 1);
  assert.equal(env.stored(), null);
});

test('real JWT 401 refreshes once then preserves rotated session on a Google 401', async () => {
  for (const method of ['apiFetch', 'apiFetchBlob']) {
    const env = setup([new Response(null, { status: 401 }), unauthorized('Google account not linked.')], { accessToken: 'new-access' });
    await assert.rejects(env.api[method]('/api/v1/nckh/forms'), google.NckhGoogleAuthorizationError);
    assert.equal(env.stored().accessToken, 'new-access');
    assert.deepEqual(env.calls, { refresh: 1, clear: 0, fetch: 2 });
  }
});
