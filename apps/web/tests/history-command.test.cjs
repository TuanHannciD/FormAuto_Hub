const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../app/dashboard/forms/history/_components/history-command.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const command = (id, projectId) => ({ contractVersion: 2, userId: 'user-a', projectId, commandId: id, batchId: null });
function load(storage) {
  const context = { exports: {}, localStorage: storage, require: () => ({ ApiError: class extends Error {} }) };
  vm.runInNewContext(source, context);
  return context.exports;
}
function createStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), get length() { return values.size; }, key: index => [...values.keys()][index] ?? null };
}

test('interleaved unresolved commands survive tab reload and exact removal', () => {
  const storage = createStorage();
  const tabA = load(storage), tabB = load(storage);
  const first = command('command-a', 'project-a'), second = command('command-b', 'project-b');
  tabA.storeHistoryCommand(first);
  tabB.storeHistoryCommand(second);
  const reloaded = load(storage);
  assert.equal(reloaded.readHistoryCommand('user-a').commandId, 'command-a', 'B must not overwrite unresolved A');
  reloaded.removeHistoryCommand(first);
  assert.equal(load(storage).readHistoryCommand('user-a').commandId, 'command-b', 'resolving A must retain B');
  assert.equal(load(storage).readHistoryCommand('user-b'), null, 'a different account must not see either command');
  tabA.removeHistoryCommand(first);
  assert.equal(load(storage).readHistoryCommand('user-a').commandId, 'command-b', 'stale repeated removal cannot remove B');
  tabB.removeHistoryCommand(second);
  assert.equal(load(storage).readHistoryCommand('user-a'), null);
});

test('legacy singleton is readable, deduplicated and removed only by its own command', () => {
  const storage = createStorage(), api = load(storage);
  const legacy = command('command-a', 'project-a'), second = command('command-b', 'project-b');
  const raw = JSON.stringify(legacy);
  storage.setItem('formauto.historyCommand.user-a', raw);
  api.storeHistoryCommand(legacy);
  api.storeHistoryCommand(second);
  assert.equal(api.readHistoryCommands('user-a').length, 2);
  api.removeHistoryCommand(second);
  assert.equal(storage.getItem('formauto.historyCommand.user-a'), raw, 'resolving B must not mutate legacy A');
  assert.equal(api.readHistoryCommand('user-a').commandId, 'command-a');
  api.removeHistoryCommand(legacy);
  assert.equal(storage.getItem('formauto.historyCommand.user-a'), null);
  assert.equal(api.readHistoryCommand('user-a'), null);
});

test('malformed and other-owner evidence is left untouched', () => {
  const storage = createStorage(), api = load(storage);
  storage.setItem('formauto.historyCommand.user-a', '{unreadable');
  storage.setItem('formauto.historyCommand.user-a.command.bad', '{unreadable');
  storage.setItem('formauto.historyCommand.user-a.command.other', JSON.stringify({ ...command('other', 'project-b'), userId: 'user-b' }));
  assert.equal(api.readHistoryCommand('user-a'), null);
  api.removeHistoryCommand(command('command-a', 'project-a'));
  assert.equal(storage.length, 3);
  assert.equal(storage.getItem('formauto.historyCommand.user-a'), '{unreadable');
});
