const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repository = path.resolve(__dirname, '../../..');
const scripts = ['smoke-test.mjs', 'apps/web/smoke-test.mjs', 'apps/web/smoke-debug.mjs'];
const fixtureEnv = { SMOKE_BASE_URL: 'http://fixture.invalid:3987', SMOKE_EMAIL: 'synthetic@example.invalid', SMOKE_PASSWORD: 'synthetic-password' };
const privateMarker = 'private-fixture-payload';

async function execute(script, scenario = 'positive', env = fixtureEnv) {
  const calls = { urls: [], fills: [], clicks: [], logs: [], closed: 0 };
  const listeners = {};
  let currentUrl = '';
  function locator(kind, name = '') {
    const missing = scenario === 'missing-heading' && kind === 'heading'
      || scenario === 'missing-button' && kind === 'button' && name.includes('Phân tích');
    const item = {
      first: () => item, filter: () => item,
      count: async () => missing ? 0 : 1,
      isVisible: async () => !missing,
      waitFor: async () => { if (missing) throw new Error('Required fixture element missing'); },
      fill: async value => calls.fills.push({ selector: name, value }),
      click: async () => { calls.clicks.push(name); currentUrl = `${env.SMOKE_BASE_URL ?? 'http://fixture.invalid'}/dashboard`; },
      textContent: async () => name,
      allTextContents: async () => [name]
    };
    return item;
  }
  const page = {
    on: (event, listener) => { listeners[event] = listener; },
    goto: async url => {
      calls.urls.push(url);
      currentUrl = scenario === 'wrong-route' && url.includes('/dashboard/forms') ? `${env.SMOKE_BASE_URL}/login` : url;
      if (scenario === 'pageerror') listeners.pageerror?.(new Error(privateMarker));
      if (scenario === 'chunk-failure') listeners.response?.({ url: () => `${env.SMOKE_BASE_URL}/_next/static/chunks/required.js`, status: () => 404 });
      if (scenario === 'css-http-failure') listeners.response?.({ url: () => `${env.SMOKE_BASE_URL}/_next/static/css/required.css?v=1`, status: () => 404 });
      if (scenario === 'font-http-failure') listeners.response?.({ url: () => `${env.SMOKE_BASE_URL}/_next/static/media/font.woff2`, status: () => 404 });
      if (['font-navigation-abort', 'js-abort', 'css-abort', 'font-network-failure'].includes(scenario)) {
        const asset = scenario.startsWith('font') ? 'media/62a3c74fa0e47362-s.woff2' : scenario === 'js-abort' ? 'chunks/required.js?v=1' : 'css/required.css?v=1';
        listeners.requestfailed?.({ url: () => `${env.SMOKE_BASE_URL}/_next/static/${asset}`, failure: () => ({ errorText: scenario === 'font-network-failure' ? 'net::ERR_CONNECTION_RESET' : 'net::ERR_ABORTED' }) });
      }
      if (scenario === 'aborted-request') listeners.requestfailed?.({ url: () => `${env.SMOKE_BASE_URL}/hmr`, failure: () => ({ errorText: 'net::ERR_ABORTED' }) });
      return { status: () => 200, ok: () => true };
    },
    url: () => currentUrl,
    getByRole: (kind, options) => locator(kind, options?.name),
    locator: selector => locator(selector.includes('button') ? 'button' : 'input', selector),
    fill: async (selector, value) => calls.fills.push({ selector, value }),
    click: async selector => { calls.clicks.push(selector); currentUrl = `${env.SMOKE_BASE_URL ?? 'http://fixture.invalid'}/dashboard`; },
    waitForURL: async () => {}, waitForTimeout: async () => {},
    textContent: async () => 'FormAuto Option 2 Option 3 AI mặc định AI tùy chỉnh x2 x3 Điền prompt Prompt chung AI preview chỉ đọc Deepseek Ready',
    screenshot: async () => {},
    eval: async () => ['Option 2', 'Option 3'],
    evaluate: async callback => callback.toString().includes('innerHTML') ? privateMarker : callback.toString().includes('textContent') && !callback.toString().includes('Array.from') ? 'Option 2 Option 3' : [],
  };
  const browser = { newPage: async () => page, close: async () => { calls.closed++; } };
  const processFixture = { env: { ...env }, exitCode: 0 };
  const context = {
    chromium: { launch: async () => browser }, process: processFixture, URL,
    console: { log: (...args) => calls.logs.push(args.join(' ')), error: (...args) => calls.logs.push(args.join(' ')) }
  };
  const helperPath = path.join(repository, 'apps/web/scripts/legacy-smoke.mjs');
  if (fs.existsSync(helperPath)) {
    const helper = fs.readFileSync(helperPath, 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
    vm.runInNewContext(`${helper}\nthis.runLegacySmoke = runLegacySmoke;`, context);
  }
  const source = fs.readFileSync(path.join(repository, script), 'utf8').replace(/^import .*;\r?\n/gm, '');
  try { await vm.runInNewContext(`(async () => { ${source}\n})()`, context); }
  catch { processFixture.exitCode = 1; }
  return { ...calls, exitCode: processFixture.exitCode };
}

for (const script of scripts) {
  test(`${script}: positive fixture checks configured target and avoids form/provider mutations`, async () => {
    const result = await execute(script);
    assert.equal(result.exitCode, 0);
    assert.ok(result.urls.every(url => url.startsWith(fixtureEnv.SMOKE_BASE_URL)), 'Every route uses the explicit owned target');
    assert.ok(result.fills.some(item => item.value === fixtureEnv.SMOKE_EMAIL), 'Login uses supplied synthetic account');
    assert.ok(result.fills.some(item => item.value === fixtureEnv.SMOKE_PASSWORD));
    assert.ok(result.clicks.every(name => name === 'Đăng nhập' || name === 'form button[type="submit"]'), 'Only the login action may be clicked');
    assert.equal(result.closed, 1);
    assert.match(result.logs.join('\n'), /bounded smoke|smoke giới hạn/i);
    assert.doesNotMatch(result.logs.join('\n'), /private-fixture|synthetic-password|synthetic@/);
  });
  for (const scenario of ['missing-heading', 'missing-button', 'wrong-route', 'pageerror', 'chunk-failure']) {
    test(`${script}: ${scenario} fails with nonzero exit and safe output`, async () => {
      const result = await execute(script, scenario);
      assert.equal(result.exitCode, 1, `${scenario} must fail the executable entrypoint`);
      assert.equal(result.closed, 1, 'Owned browser closes after failure');
      assert.doesNotMatch(result.logs.join('\n'), /private-fixture|synthetic-password|synthetic@/);
    });
  }
  test(`${script}: missing configuration fails before opening target`, async () => {
    const result = await execute(script, 'positive', {});
    assert.equal(result.exitCode, 1);
    assert.equal(result.urls.length, 0);
    assert.doesNotMatch(result.logs.join('\n'), /private-fixture|synthetic-password|synthetic@/);
  });
  test(`${script}: unrelated aborted request does not become a failed required probe`, async () => {
    assert.equal((await execute(script, 'aborted-request')).exitCode, 0);
  });
  test(`${script}: navigation-cancelled WOFF2 font is not a failed JS/CSS probe`, async () => {
    const result = await execute(script, 'font-navigation-abort');
    assert.equal(result.exitCode, 0, 'Observed net::ERR_ABORTED font navigation is noncritical');
    assert.equal(result.closed, 1);
  });
  for (const scenario of ['js-abort', 'css-abort', 'css-http-failure', 'font-http-failure', 'font-network-failure']) {
    test(`${script}: ${scenario} remains a failed asset probe`, async () => {
      const result = await execute(script, scenario);
      assert.equal(result.exitCode, 1, 'Only explicit font navigation abort is excluded');
      assert.equal(result.closed, 1);
    });
  }
}
