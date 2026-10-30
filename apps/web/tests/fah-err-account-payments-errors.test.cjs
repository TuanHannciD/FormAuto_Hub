const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const files = {
  topup: 'app/dashboard/top-up/page.tsx', manual: 'app/admin/manual-credits/page.tsx',
  packages: 'app/admin/packages/page.tsx', payos: 'app/admin/payos-settings/page.tsx',
  ai: 'app/admin/ai-provider-settings/page.tsx', profile: 'components/account-profile-panel.tsx'
};
function handler(file, name, globals) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(found, `Existing production handler ${name}`);
  const context = { exports: {}, Error, ...globals };
  vm.runInNewContext(ts.transpileModule(`${found}\nexports.run = ${name};`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return context.exports.run;
}
function state() {
  const values = {};
  const messages = [];
  const globals = { toast: { success: text => messages.push(['success', text]), info: text => messages.push(['info', text]), error: text => messages.push(['error', text]) }, showError: (_, text) => messages.push(['error', text]) };
  for (const name of ['IsSubmittingManual', 'PaymentNote', 'EvidenceFileId', 'EvidenceName', 'HistoryPage', 'IsCreatingPayos', 'Orders', 'ConfirmedOrder', 'ConfirmedPayos', 'IsWorking', 'SelectedRequestId', 'RejectReason', 'IsSaving', 'Settings', 'ApiKey', 'ChecksumKey', 'CheckResult', 'Profile', 'FullName', 'UserOptions', 'IsLoadingUsers', 'UsersError', 'UsersReady', 'GrantUserId', 'GrantEmail', 'GrantCredits', 'GrantReason', 'HistoryRefresh', 'ConfirmedGrant', 'ConfirmedApproval', 'ConfirmedPackage', 'ConfirmedAction']) {
    globals[`set${name}`] = value => { values[name] = typeof value === 'function' ? value(values[name] ?? []) : value; };
  }
  return { values, messages, globals };
}
const event = { preventDefault() {} };
test('ERR015 manual order retains confirmed ID without reporting a failed POST when refresh rejects', async () => {
  const s = state(); let writes = 0;
  const result = { id: 'confirmed-order', paymentMethod: 'Manual', status: 'Pending' };
  await handler(files.topup, 'submitOrder', { ...s.globals, packageId: 'p1', paymentNote: 'fixture', evidenceFileId: '', isUploadingEvidence: false, submittingManualRef: { current: false },
    apiFetch: async () => { writes++; return result; }, loadData: async () => { throw Error('GET503'); }
  })(event);
  assert.equal(writes, 1);
  assert.equal(s.messages.filter(([kind]) => kind === 'error').length, 0, 'Read failure must not be reported as mutation failure');
  assert.equal(s.values.ConfirmedOrder?.id, result.id, 'Retain the confirmed result outside a failed history read');
});
test('ERR015 checkout navigation does not depend on a list refresh', async () => {
  const s = state(); let reads = 0; const location = { href: '' };
  await handler(files.topup, 'createPayosLink', { ...s.globals, packageId: 'p1', window: { location },
    apiFetch: async () => ({ topupOrderId: 'confirmed-payos', checkoutUrl: 'https://checkout.example.invalid/synthetic' }),
    loadData: async () => { reads++; throw Error('GET503'); }
  })();
  assert.equal(location.href, 'https://checkout.example.invalid/synthetic');
  assert.equal(s.values.ConfirmedPayos?.topupOrderId, 'confirmed-payos');
  assert.equal(s.messages.filter(([kind]) => kind === 'error').length, 0);
  assert.equal(reads, 0, 'Checkout does not need a potentially blocking GET');
});
for (const name of ['approveRequest', 'rejectRequest']) test(`ERR015 ${name} does not turn a confirmed decision into a mutation error`, async () => {
  const s = state(); let writes = 0;
  const receipt = { id: 'confirmed-request', status: name === 'approveRequest' ? 'Approved' : 'Rejected', creditTransactionId: 'confirmed-approval-credit-001', balanceAfter: 142 };
  await handler(files.manual, name, { ...s.globals, selectedRequest: { id: 'confirmed-request', paymentNote: 'fixture' }, rejectReason: 'fixture', workingRef: { current: false },
    apiFetch: async () => { writes++; return receipt; }, loadRequests: async () => { throw Error('GET503'); }
  })();
  assert.equal(writes, 1);
  assert.equal(s.messages.filter(([kind]) => kind === 'error').length, 0);
  assert.ok(s.values.ConfirmedAction?.includes('confirmed-request'), 'Keep confirmed request ID for reconciliation');
  if (name === 'approveRequest') {
    assert.equal(s.values.ConfirmedApproval?.id, receipt.id);
    assert.equal(s.values.ConfirmedApproval?.status, receipt.status);
    assert.equal(s.values.ConfirmedApproval?.creditTransactionId, receipt.creditTransactionId, 'Preserve confirmed ledger receipt independently of list refresh');
    assert.equal(s.values.ConfirmedApproval?.balanceAfter, receipt.balanceAfter);
  }
});
for (const editingId of [null, 'updated-package']) test(`ERR015 package ${editingId ? 'update' : 'create'} survives failed refresh`, async () => {
  const s = state();
  await handler(files.packages, 'savePackage', { ...s.globals, editingId, form: { name: 'Fixture' },
    apiFetch: async () => ({ id: editingId ?? 'created-package', name: 'Fixture' }), closeFormDialog() {}, loadData: async () => { throw Error('GET503'); }
  })(event);
  assert.equal(s.messages.filter(([kind]) => kind === 'error').length, 0);
  assert.equal(s.values.ConfirmedPackage?.id, editingId ?? 'created-package');
});
for (const file of [files.ai, files.payos]) test(`ERR015 ${file} preserves a local check result after refresh failure`, async () => {
  const s = state(); const result = { status: 'Ready', message: 'private-provider-fixture', checkedAt: '2026-10-30T00:00:00Z' };
  await handler(file, 'check', { ...s.globals, setIsChecking() {}, configurationCheckMessage: () => 'Đã đủ thông tin cấu hình; chưa kiểm tra kết nối.',
    apiFetch: async () => result, loadData: async () => { throw Error('GET503'); }
  })();
  assert.equal(s.messages.filter(([kind]) => kind === 'error').length, 0);
  assert.equal(s.values.CheckResult?.status, 'Ready');
  assert.ok(!JSON.stringify(s.messages).includes('private-provider-fixture'), 'Provider result text must not leak');
});
for (const file of [files.topup, files.manual, files.payos]) for (const mode of ['absent', 'reject']) test(`ERR022 ${file} clipboard ${mode} offers manual copy without rejecting`, async () => {
  const s = state();
  const navigator = mode === 'absent' ? {} : { clipboard: { writeText: async () => { throw Error('permission denied private-fixture'); } } };
  await assert.doesNotReject(handler(file, file === files.payos ? 'copyWebhookUrl' : 'copyId', {
    ...s.globals, navigator, id: 'synthetic-code', webhookUrl: 'https://app.example.invalid/api/payments/payos/webhook', setCopyError() {}
  }));
  assert.ok(s.messages.some(([kind, text]) => kind !== 'success' && /thủ công|bôi đen|sao chép/.test(text)), 'Actionable manual-copy feedback');
  assert.ok(!JSON.stringify(s.messages).includes('private-fixture'));
});
for (const file of [files.topup, files.manual, files.payos]) test(`ERR022 ${file} clipboard success confirms once`, async () => {
  const s = state(); const copied = [];
  await handler(file, file === files.payos ? 'copyWebhookUrl' : 'copyId', { ...s.globals, navigator: { clipboard: { writeText: async value => copied.push(value) } }, id: 'synthetic-code', webhookUrl: 'synthetic-url', setCopyError() {} })();
  assert.equal(copied.length, 1); assert.equal(s.messages.filter(([kind]) => kind === 'success').length, 1);
});
test('ERR021 profile direct submit is blocked while profile read is unknown', async () => {
  const s = state(); let writes = 0;
  await handler(files.profile, 'save', { ...s.globals, profile: null, isLoading: false, loadError: true, isSaving: false, fullName: '',
    apiFetch: async () => { writes++; return {}; }, getStoredSession: () => null, saveSession() {}
  })(event);
  assert.equal(writes, 0, 'Unknown profile must not be overwritten');
});
test('ERR021 rejected current admin search invalidates stale options and selection', async () => {
  const s = state(); const version = { current: 0 };
  const run = handler(files.manual, 'loadUsers', { ...s.globals, userSearchVersion: version, grantUserId: 'old-user', apiFetch: async () => { throw Error('GET503'); } });
  try { await run('different-user'); } catch {}
  assert.equal(s.values.UsersReady, false);
  assert.equal(s.values.GrantUserId, '');
  assert.equal(s.values.UserOptions?.length, 0);
  assert.ok(s.values.UsersError, 'Failed search is not a confirmed empty result');
});
test('ERR015 manual grant retains confirmed transaction ID and balance independently of history', async () => {
  const s = state(); let writes = 0;
  const result = { userId: 'fixture-user', userEmail: 'fixture@example.invalid', creditTransactionId: 'confirmed-credit-001', balanceAfter: 42 };
  await handler(files.manual, 'submitManualGrant', { ...s.globals, workingRef: { current: false }, usersReady: true, usersError: '', isLoadingUsers: false,
    grantUserId: result.userId, grantEmail: result.userEmail, userOptions: [{ id: result.userId, email: result.userEmail }], grantCredits: '12', grantReason: 'fixture',
    apiFetch: async () => { writes++; return result; }
  })(event);
  assert.equal(writes, 1);
  assert.equal(s.values.ConfirmedGrant?.creditTransactionId, result.creditTransactionId);
  assert.equal(s.values.ConfirmedGrant?.balanceAfter, 42);
});
for (const file of [files.ai, files.payos]) test(`ERR019 ${file} maps check status locally without echoing arbitrary messages`, () => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(source.includes('function configurationCheckMessage'), 'Local check needs audience-specific wording');
  const run = handler(file, 'configurationCheckMessage', {});
  assert.match(run('Ready'), /chưa kiểm tra kết nối/);
  assert.match(run('MissingConfiguration'), /[Tt]hiếu/);
  assert.match(run('InvalidConfiguration'), /không hợp lệ/);
  assert.ok(!run('private-fixture').includes('private-fixture'));
});
