// Audit probe only: transpile existing source, use synthetic responses, never contact a server.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const ts = require(path.join(root, 'apps/web/node_modules/typescript'));
const hashes = {};
function source(relative) {
  const bytes = fs.readFileSync(path.join(root, relative));
  hashes[relative] = crypto.createHash('sha256').update(bytes).digest('hex');
  return bytes.toString('utf8');
}
function load(text, globals = {}) {
  const code = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {}, Error, TypeError, ...globals };
  vm.runInNewContext(code, context);
  return context.exports;
}
class SessionExpiredError extends Error {}
const logs = [], toasts = [], observations = [];
const toast = load(source('apps/web/lib/toast.ts'), {
  require: name => name === 'sonner' ? { toast: { error: message => toasts.push(message) } } : { SessionExpiredError },
  console: { error: (...args) => logs.push(args) }
});
const google = load(source('apps/web/lib/nckh-google-auth.ts'));
let responder;
const api = load(source('apps/web/lib/api.ts'), {
  require: name => name === '@/lib/auth' ? {
    SessionExpiredError, getValidAccessToken: async () => 'synthetic-access',
    getStoredSession: () => ({ accessToken: 'synthetic-access' }),
    clearStoredSession() {}, refreshSession: async () => null
  } : google,
  process: { env: {} }, Headers, fetch: async () => responder()
});
const loginPath = 'apps/web/app/login/page.tsx';
const loginSource = source(loginPath);
const ast = ts.createSourceFile(loginPath, loginSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const mapper = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'authErrorMessage');
assert.ok(mapper);
const login = load(mapper.getText(ast) + '\nexports.map = authErrorMessage;', { readableError: toast.readableError });
async function errorFor(response, method = 'apiFetch', endpoint = '/audit/synthetic', options = { skipAuth: true }) {
  responder = () => response.clone();
  try { await api[method](endpoint, options); } catch (error) { return error; }
  assert.fail('Expected rejection');
}
async function main() {
  const e = await errorFor(new Response(JSON.stringify({ title: 'Unauthorized', status: 401 }), { status: 401 }), 'apiFetch', '/api/auth/login');
  assert.equal(login.map(e.message), 'Unauthorized');
  assert.equal(e.status, undefined);
  observations.push({ id: 'PROBE-01', result: 'Verified', observed: { mappedLoginMessage: login.map(e.message), retainedStatus: false } });

  const validation = await errorFor(new Response(JSON.stringify({ title: 'One or more validation errors occurred.', status: 400, errors: { FormUrl: ['Synthetic field validation detail'] }, traceId: 'synthetic-trace' }), { status: 400 }));
  assert.equal(validation.message, 'One or more validation errors occurred.');
  assert.equal(validation.errors, undefined); assert.equal(validation.traceId, undefined);
  observations.push({ id: 'PROBE-02', result: 'Verified', observed: { message: validation.message, fieldDetailsRetained: false, traceRetained: false } });

  const html = '<html><body>Upstream unavailable</body></html>';
  const raw = await errorFor(new Response(html, { status: 502, headers: { 'content-type': 'text/html' } }));
  assert.equal(toast.readableError(raw, 'Không tải được dữ liệu.'), html);
  observations.push({ id: 'PROBE-03', result: 'Verified', observed: { readableMessage: html } });

  const detailResponse = () => new Response(JSON.stringify({ title: 'Synthetic conflict', detail: 'Synthetic data changed; reload first.' }), { status: 409 });
  const jsonError = await errorFor(detailResponse());
  const blobError = await errorFor(detailResponse(), 'apiFetchBlob');
  assert.equal(jsonError.message, 'Synthetic data changed; reload first.');
  assert.equal(blobError.message, 'Không tải được tệp. Mã lỗi HTTP 409.');
  observations.push({ id: 'PROBE-04', result: 'Verified', observed: { json: jsonError.message, download: blobError.message } });

  responder = () => { throw new TypeError('Failed to fetch'); };
  try { await api.apiFetch('/audit/synthetic', { skipAuth: true }); assert.fail(); }
  catch (error) {
    toast.showError(error, 'Không tải được dữ liệu.');
    assert.equal(toasts.at(-1), 'Failed to fetch'); assert.equal(logs.length, 0);
  }
  observations.push({ id: 'PROBE-05', result: 'Verified', observed: { toast: toasts.at(-1), diagnosticLogCalls: logs.length } });

  const result = { date: new Date().toISOString(), level: 'isolated mocked fetch + real transpiled source; no browser/API/DB/provider', hashes, observations };
  fs.writeFileSync(path.join(__dirname, 'shared-error-probe-results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`Verified: ${observations.length}/5 audit observations reproduced; no product fix asserted.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
