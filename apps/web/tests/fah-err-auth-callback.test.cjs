const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
function source(relative) {
  return ts.createSourceFile(relative, fs.readFileSync(path.join(root, relative), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
const apiSource = source('lib/api.ts');
const errorClass = apiSource.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'ApiError');
const apiContext = { exports: {}, Error };
vm.runInNewContext(ts.transpileModule(errorClass.getText(apiSource), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, apiContext);
const { ApiError } = apiContext.exports;

async function renderError(error) {
  const file = source('app/auth/callback/page.tsx');
  const functions = file.statements.filter(node => ts.isFunctionDeclaration(node) && ['getCallbackMessage', 'AuthCallbackContent'].includes(node.name?.text));
  assert.equal(functions.length, 2, 'Actual callback component and existing query mapper are loaded');
  const effects = [], messages = [], toasts = [], posts = [];
  let stateIndex = 0;
  const context = {
    exports: {}, Error, ApiError,
    useRouter: () => ({ replace: () => assert.fail('Failed auth must not navigate') }),
    useSearchParams: () => new URLSearchParams('id_token=synthetic-id-token'),
    useState: initial => [initial, value => { if (stateIndex === 0) messages.push(value); }],
    useEffect: callback => effects.push(callback),
    apiFetch: (route, options) => { posts.push({ route, options }); return Promise.reject(error); },
    saveSession: () => assert.fail('Failed auth must not store a session'),
    toast: { error: message => toasts.push(message) },
    AuthShell: () => {}, AuthHeading: () => {}, Link: () => {}, Loader2: () => {}, CircleAlert: () => {},
    buttonStyles: () => '',
    require: name => { assert.equal(name, 'react/jsx-runtime'); return { jsx: () => null, jsxs: () => null }; }
  };
  context.useState = initial => {
    const index = stateIndex++;
    return [initial, value => { if (index === 0) messages.push(value); }];
  };
  const code = functions.map(node => node.getText(file)).join('\n');
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText, context);
  context.AuthCallbackContent();
  for (const effect of effects) effect();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(posts.length, 1);
  assert.equal(posts[0].route, '/api/auth/google');
  assert.equal(posts[0].options.method, 'POST');
  assert.equal(posts[0].options.skipAuth, true);
  assert.equal(posts[0].options.json.idToken, 'synthetic-id-token');
  return { messages, toasts };
}

for (const [status, expected] of [
  [409, 'Vui lòng đăng nhập bằng mật khẩu trước, sau đó liên kết Google trong hồ sơ bảo mật.'],
  [401, 'Email Google chưa được xác minh hoặc mã đăng nhập không hợp lệ.']
]) {
  test(`actual id_token callback maps typed POST Google ${status}`, async () => {
    const result = await renderError(new ApiError('http', 'POST', '/api/auth/google', status));
    assert.equal(result.messages[0], expected);
    assert.deepEqual(result.toasts, [expected]);
  });
}

test('callback never infers auth identity from arbitrary message or other endpoint/method', async () => {
  for (const error of [new Error('409 password private-marker'), new ApiError('http', 'POST', '/api/auth/login', 409), new ApiError('http', 'GET', '/api/auth/google', 401), new ApiError('http', 'POST', '/api/auth/google', 503)]) {
    const result = await renderError(error);
    assert.equal(result.messages[0], 'Không thể hoàn tất đăng nhập bằng Google. Vui lòng thử lại.');
    assert.doesNotMatch(result.toasts[0], /private-marker|password|409|503/);
  }
});
