const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
function load(relative, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const context = { exports: {}, Error, ...globals };
  vm.runInNewContext(code, context);
  return context.exports;
}
function setup(response) {
  class SessionExpiredError extends Error {}
  const auth = { SessionExpiredError, getValidAccessToken: async () => 'access', getStoredSession: () => ({ accessToken: 'access' }) };
  const google = load('lib/nckh-google-auth.ts');
  const api = load('lib/api.ts', {
    require: name => name === '@/lib/auth' ? auth : google,
    Headers, process: { env: {} },
    fetch: async () => { if (response instanceof Error) throw response; return response.clone(); }
  });
  const calls = { toast: [], console: [] };
  const toast = load('lib/toast.ts', {
    require: name => name === 'sonner' ? { toast: { error: (...args) => calls.toast.push(args) } }
      : name === '@/lib/api' ? api : name === '@/lib/auth' ? auth : google,
    console: { error: (...args) => calls.console.push(args) }
  });
  return { api, toast, calls, auth };
}
async function failure(env, method = 'apiFetch', route = '/api/profile?email=private@example.test#secret', options) {
  try { await env.api[method](route, options); }
  catch (error) { return error; }
  assert.fail('Request should reject');
}
function mapper(relative, names, deps) {
  const source = ts.createSourceFile(relative, fs.readFileSync(path.join(root, relative), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = source.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text));
  assert.equal(functions.length, names.length, 'Tests call existing source mappers');
  const code = functions.map(node => node.getText(source)).join('\n');
  const context = { ...deps };
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return context;
}

test('HTTP errors retain status/method/private-query-free path for JSON and blob', async () => {
  for (const method of ['apiFetch', 'apiFetchBlob']) {
    const env = setup(new Response(JSON.stringify({ title: 'Conflict', detail: 'sk-secret-raw' }), { status: 409 }));
    const error = await failure(env, method, undefined, method === 'apiFetch' ? { method: 'post', skipAuth: true } : undefined);
    assert.equal(typeof env.api.ApiError, 'function', 'API exports the typed ApiError boundary');
    assert.ok(error instanceof env.api.ApiError);
    assert.equal(error.status, 409);
    assert.equal(error.method, method === 'apiFetch' ? 'POST' : 'GET');
    assert.equal(error.path, '/api/profile');
    assert.equal(error.kind, 'http');
    assert.doesNotMatch(error.message, /sk-secret|Conflict|HTTP/);
  }
});

test('MVC field errors keep known field identity with safe Vietnamese guidance and trace', async () => {
  const traceId = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01';
  const env = setup(new Response(JSON.stringify({ errors: { Email: ['The Email field is required.'], Password: ['secret-payload'], Unknown: ['secret-payload'] }, traceId }), { status: 400 }));
  const error = await failure(env);
  assert.equal(error.status, 400);
  assert.ok(error.fieldErrors.Email[0].includes('email'));
  assert.ok(error.fieldErrors.Password[0].includes('mật khẩu'));
  assert.equal(error.fieldErrors.Unknown, undefined);
  assert.equal(error.traceId, traceId);
  assert.doesNotMatch(JSON.stringify(error), /secret-payload|The Email/);
});

test('oversized metadata and token-like trace IDs are discarded', async () => {
  const env = setup(new Response(JSON.stringify({ errors: { Email: Array(100).fill('private') }, traceId: 'Bearer secret-payload' }), { status: 400 }));
  const error = await failure(env);
  assert.equal(typeof error.fieldErrors, 'object', 'HTTP errors retain a bounded field-error map');
  assert.ok(error.fieldErrors.Email.length <= 3);
  assert.equal(error.traceId, undefined);
  assert.doesNotMatch(JSON.stringify(error), /private|secret-payload/);
});

for (const body of ['<h1>secret-payload</h1>', 'private@example.test', '{', JSON.stringify({ detail: 'sk-secret-payload' }), 'x'.repeat(40000)]) {
  test(`unexpected HTTP body is safe (${body.slice(0, 15)})`, async () => {
    const env = setup(new Response(body, { status: 503 }));
    for (const method of ['apiFetch', 'apiFetchBlob']) {
      const error = await failure(env, method);
      assert.equal(error.status, 503);
      assert.equal(error.kind, 'http');
      assert.doesNotMatch(error.message, /secret-payload|private@|<h1>|xxxx|503/);
    }
  });
}

test('network errors become safe ApiError; aborted requests remain cancellation', async () => {
  const env = setup(new TypeError('Failed to fetch secret-payload'));
  for (const method of ['apiFetch', 'apiFetchBlob']) {
    const error = await failure(env, method);
    assert.equal(error.kind, 'network');
    assert.equal(error.status, null);
    assert.doesNotMatch(error.message, /fetch|secret-payload/);
  }
  const abort = Object.assign(new Error('private cancellation'), { name: 'AbortError' });
  const canceled = setup(abort);
  assert.equal(await failure(canceled), abort);
  canceled.toast.showError(abort);
  assert.equal(canceled.calls.toast.length, 0);
});

test('invalid successful JSON is classified and does not expose body or parser text', async () => {
  const env = setup(new Response('<h1>secret-payload</h1>', { status: 200 }));
  const error = await failure(env);
  assert.equal(error.kind, 'invalid-response');
  assert.equal(error.status, 200);
  assert.doesNotMatch(error.message, /secret-payload|JSON|Unexpected/);
});

test('toast accepts safe ApiError and rejects raw errors/strings without raw console logging', async () => {
  const env = setup(new Response('private@example.test', { status: 500 }));
  const error = await failure(env);
  assert.equal(env.toast.readableError(error, 'Dự phòng.'), error.message);
  for (const raw of ['sk-secret-payload', '<b>private</b>', new Error('private@example.test')]) {
    assert.equal(env.toast.readableError(raw, 'Dự phòng.'), 'Dự phòng.');
    env.toast.showError(raw, 'Dự phòng.');
  }
  assert.deepEqual(env.calls.console, []);
  env.toast.showError(new env.auth.SessionExpiredError());
  assert.equal(env.calls.toast.length, 3);
});

test('login source mapper consumes status and leaves unknown errors generic', async () => {
  const env = setup(new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 }));
  const error = await failure(env, 'apiFetch', '/api/auth/login', { skipAuth: true });
  const { authErrorMessage, googleAuthErrorMessage } = mapper('app/login/page.tsx', ['authErrorMessage', 'googleAuthErrorMessage'], { ApiError: env.api.ApiError, readableError: env.toast.readableError });
  let message;
  assert.doesNotThrow(() => { message = authErrorMessage(error); }, 'Login mapper accepts the full error object');
  assert.equal(message, 'Email hoặc mật khẩu không đúng.');
  assert.doesNotMatch(authErrorMessage(new Error('401 password secret')), /Email hoặc/);
  const lockEnv = setup(new Response(null, { status: 423 }));
  const lock = await failure(lockEnv, 'apiFetch', '/api/auth/login', { skipAuth: true });
  const lockMapper = mapper('app/login/page.tsx', ['authErrorMessage'], { ApiError: lockEnv.api.ApiError, readableError: lockEnv.toast.readableError });
  // The mapper must not invent a duration absent from the HTTP contract.
  assert.match(lockMapper.authErrorMessage(lock), /Tài khoản bị khóa tạm thời/);
  assert.doesNotMatch(lockMapper.authErrorMessage(lock), /15 phút/);
  assert.doesNotMatch(googleAuthErrorMessage(new Error('password')), /Email này/);
});

test('registration source mapper never infers existing email from password wording', async () => {
  const env = setup(new Response(JSON.stringify({ detail: 'password already invalid' }), { status: 400 }));
  const error = await failure(env, 'apiFetch', '/api/auth/register', { skipAuth: true });
  const { registerErrorMessage } = mapper('app/register/page.tsx', ['registerErrorMessage'], { ApiError: env.api.ApiError, readableError: env.toast.readableError });
  let message;
  assert.doesNotThrow(() => { message = registerErrorMessage(error); }, 'Registration mapper accepts the full error object');
  assert.equal(message, 'Thông tin đăng ký không hợp lệ.');
  assert.doesNotMatch(registerErrorMessage(new Error('already password')), /Email đã tồn tại/);
});

test('security source mappers use the authenticated endpoint and operation', async () => {
  const env = setup(new Response(null, { status: 409 }));
  const source = mapper('components/account-security-panel.tsx', ['changePasswordError', 'googleLinkError', 'googleUnlinkError'], { ApiError: env.api.ApiError, readableError: env.toast.readableError });
  const link = await failure(env, 'apiFetch', '/api/auth/link-google', { method: 'POST' });
  const unlink = await failure(env, 'apiFetch', '/api/auth/link-google', { method: 'DELETE' });
  assert.match(source.googleLinkError(link), /email Google trùng/);
  assert.match(source.googleUnlinkError(unlink), /thiết lập mật khẩu/);
  assert.doesNotMatch(source.googleUnlinkError(link), /thiết lập mật khẩu/);
  assert.equal(source.changePasswordError(new Error('400 password')), 'Không đổi được mật khẩu.');
  assert.equal(source.googleLinkError(new Error('409 email')), 'Không liên kết được tài khoản Google.');
  assert.equal(source.googleUnlinkError(new Error('password')), 'Không hủy liên kết được tài khoản Google.');
});

test('Google conflict mapper requires verified endpoint and HTTP status', async () => {
  const env = setup(new Response('Login with password first, then link Google.', { status: 409 }));
  const source = mapper('app/login/page.tsx', ['googleAuthErrorMessage'], { ApiError: env.api.ApiError, readableError: env.toast.readableError });
  const conflict = await failure(env, 'apiFetch', '/api/auth/google', { skipAuth: true });
  assert.match(source.googleAuthErrorMessage(conflict), /Email này đã có tài khoản mật khẩu/);
  assert.doesNotMatch(source.googleAuthErrorMessage(await failure(env, 'apiFetch', '/api/auth/login', { skipAuth: true })), /Email này/);
});
