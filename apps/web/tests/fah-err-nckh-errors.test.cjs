const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const workspace = 'app/dashboard/nckh/forms/[formId]/page.tsx';
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
function compile(source, globals = {}) {
  const context = { exports: {}, Error, ...globals, require(id) {
    if (id === 'react/jsx-runtime') return jsx;
    if (id === '@/lib/api') return api;
    if (id === '@/lib/auth') return { SessionExpiredError: class SessionExpiredError extends Error {} };
    if (id === '@/lib/nckh-google-auth') return google;
    if (id === '@/lib/toast') return { readableError: (error, fallback) => error instanceof api.ApiError ? error.message : fallback };
    if (id === './_constants') return {};
    if (id === '@/lib/labels') return { displayStatus: x => x };
    if (id === '@/components/ui') return { EmptyState: 'EmptyState', Button: 'Button', Alert: 'Alert' };
    if (id === '@/components/base-table') return { BaseTable: 'BaseTable' };
    throw new Error(`Unexpected import ${id}`);
  } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  return context.exports;
}
const google = compile(fs.readFileSync(path.join(root, 'lib/nckh-google-auth.ts'), 'utf8'));
const apiSource = ts.createSourceFile('api.ts', fs.readFileSync(path.join(root, 'lib/api.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const api = compile(apiSource.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'ApiError').getText(apiSource));
const helpers = compile(fs.readFileSync(path.join(root, 'app/dashboard/nckh/forms/[formId]/_helpers.ts'), 'utf8'));
function callback(name, globals) {
  const source = ts.createSourceFile(workspace, fs.readFileSync(path.join(root, workspace), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let fn;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) fn = node.initializer.arguments[0].getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(fn, `Existing production callback ${name}`);
  return compile(`exports.run = ${fn};`, globals).run;
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function harness(fetch) {
  const state = { variables: [], mappings: [], relations: [], positions: [], responses: null, dataset: null, panelError: null, isPanelLoading: false, modelDataOwner: '', modelDataValid: false, sliceErrors: {} };
  const refs = { modelRequestRef: { current: 0 }, selectedModelIdRef: { current: 'A' }, mountedRef: { current: true }, modelDataOwnerRef: { current: "" } };
  const globals = { ...refs, apiFetch: fetch, readableNckhError: helpers.readableNckhError };
  for (const key of Object.keys(state)) globals[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => { state[key] = typeof value === 'function' ? value(state[key]) : value; };
  return { state, ...refs, load: callback('loadModelData', globals) };
}
const payload = model => ({ items: [{ id: `variable-${model}`, modelId: model }], columns: [], hasStaleData: false, page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
test('ERR017 late A success cannot replace selected B slices or loading state', async () => {
  const a = deferred();
  const h = harness(url => url.includes('/A/') ? a.promise : Promise.resolve(payload('B')));
  const loadingA = h.load('A');
  h.selectedModelIdRef.current = 'B';
  await h.load('B');
  assert.equal(h.state.variables[0].modelId, 'B');
  a.resolve(payload('A')); await loadingA;
  assert.equal(h.state.variables[0].modelId, 'B', 'Late response must retain current model B');
  assert.equal(h.state.dataset.items[0].modelId, 'B');
});
test('ERR017 failed refresh removes old successful slices and invalidates mutation snapshot', async () => {
  let failed = false;
  const h = harness(url => failed && /\/(variables|dataset)\?/.test(url) ? Promise.reject(new api.ApiError('http', 'GET', url, 503)) : Promise.resolve(payload('A')));
  await h.load('A'); failed = true; await h.load('A');
  assert.equal(h.state.variables.length, 0, 'Rejected variable read must not retain old variables');
  assert.equal(h.state.dataset, null, 'Rejected dataset read must not retain old stale flag');
  assert.equal(h.state.modelDataValid, false);
  assert.ok(h.state.panelError);
});
test('ERR017 empty selection invalidates in-flight model request', async () => {
  const a = deferred(); const h = harness(() => a.promise);
  const pending = h.load('A'); h.selectedModelIdRef.current = ''; await h.load('');
  a.resolve(payload('A')); await pending;
  assert.equal(h.state.variables.length, 0);
  assert.equal(h.state.dataset, null);
  assert.equal(h.state.isPanelLoading, false);
});
test('ERR017 unmounted workspace ignores resolved model request', async () => {
  const a = deferred(); const h = harness(() => a.promise); const pending = h.load('A');
  h.mountedRef.current = false; a.resolve(payload('A')); await pending;
  assert.equal(h.state.variables.length, 0);
});
test('ERR018 typed import400 is URL guidance, generic invalid text never becomes Google auth', () => {
  const result = helpers.readableNckhError(new api.ApiError('http', 'POST', '/api/v1/nckh/forms/import', 400), 'Không nhập được form.');
  assert.match(result, /liên kết.*Google Form|URL.*Google Form/i);
  assert.doesNotMatch(result, /xác thực|hết hạn|liên kết lại/i);
  assert.equal(helpers.readableNckhError(new Error('Invalid consent conflict 401 secret'), 'Không nhập được form.'), 'Không nhập được form.');
});
test('ERR018 relation409 does not claim dataset stale; confirmed Google authorization retains relink guidance', () => {
  const result = helpers.readableNckhError(new api.ApiError('http', 'POST', '/api/v1/nckh/models/A/relations', 409), 'Không thêm được quan hệ.');
  assert.doesNotMatch(result, /chuẩn hóa|không còn đồng bộ/i);
  assert.match(helpers.readableNckhError(new google.NckhGoogleAuthorizationError('Google account not linked.'), 'Không tải được.'), /liên kết lại.*Google/i);
});
function nodes(tree, output = []) {
  if (!tree || typeof tree !== 'object') return output;
  if (Array.isArray(tree)) { tree.forEach(item => nodes(item, output)); return output; }
  output.push(tree); nodes(tree.props?.children, output); return output;
}
test('ERR021 unavailable dataset is not confirmed empty; successful empty dataset stays empty', () => {
  const component = compile(fs.readFileSync(path.join(root, 'app/dashboard/nckh/forms/[formId]/_components/dataset-preview.tsx'), 'utf8')).DatasetPreview;
  assert.equal(nodes(component({ dataset: null })).some(n => n.type === 'EmptyState'), false, 'Unknown dataset must not show known-empty advice');
  assert.equal(nodes(component({ dataset: { items: [], columns: [] } })).some(n => n.type === 'EmptyState'), true);
});
test('ERR017 mutation callback rejects stale model closure and unknown snapshot before request', () => {
  const pendingActionRef = { current: null }; const selectedModelIdRef = { current: 'B' }; const modelDataOwnerRef = { current: 'B' };
  const start = callback('beginPendingAction', { pendingActionRef, selectedModelIdRef, modelDataOwnerRef, selectedModelId: 'A', setPendingAction() {} });
  assert.equal(start('normalizeResponses'), false);
  const unknown = callback('beginPendingAction', { pendingActionRef, selectedModelIdRef, modelDataOwnerRef: { current: '' }, selectedModelId: 'B', setPendingAction() {} });
  assert.equal(unknown('createMapping'), false);
  assert.equal(pendingActionRef.current, null);
});
test('ERR017 older request finishing cannot stop current model loading', async () => {
  const a = deferred(); const b = deferred();
  const h = harness(url => url.includes('/A/') ? a.promise : b.promise);
  const loadA = h.load('A'); h.selectedModelIdRef.current = 'B'; const loadB = h.load('B');
  a.resolve(payload('A')); await loadA;
  assert.equal(h.state.isPanelLoading, true);
  assert.equal(h.state.variables.length, 0);
  b.resolve(payload('B')); await loadB;
  assert.equal(h.state.variables[0].modelId, 'B');
  assert.equal(h.state.modelDataValid, true);
  assert.equal(h.modelDataOwnerRef.current, 'B');
});
