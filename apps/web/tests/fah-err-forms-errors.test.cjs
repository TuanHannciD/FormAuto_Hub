const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const cache = {};
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
function compile(source, globals = {}) {
  const context = { exports: {}, Error, ...globals, require(id) {
    if (id === 'react/jsx-runtime') return jsx;
    if (id === '@/components/ui') return Object.fromEntries(['Input', 'Badge', 'Button', 'Textarea'].map(x => [x, x]));
    if (id === '@/components/ui-styles') return { panelStyles: '' };
    if (id === '@/lib/utils') return { cn: (...parts) => parts.join(' ') };
    if (id === '@/components/dropdown-select') return { DropdownSelect: 'DropdownSelect' };
    if (id === 'lucide-react') return new Proxy({}, { get: (_, key) => key });
    if (id === '../_constants' || id === './_constants') return load('app/dashboard/forms/_constants.ts');
    if (id === '../_helpers') return load('app/dashboard/forms/_helpers.ts');
    if (id === './CheckboxSelectionFields') return { CheckboxSelectionFields: 'CheckboxSelectionFields' };
    throw new Error(`Unexpected import ${id}`);
  } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  return context.exports;
}
function load(file) { return cache[file] ??= compile(fs.readFileSync(path.join(root, file), 'utf8')); }
function handler(name, globals) {
  const file = 'app/dashboard/forms/page.tsx';
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(found, 'Exercise existing production save handler');
  return compile(`${found}\nexports.run = ${name};`, globals).run;
}
function nodes(tree, predicate, output = []) {
  if (!tree || typeof tree !== 'object') return output;
  if (Array.isArray(tree)) { tree.forEach(item => nodes(item, predicate, output)); return output; }
  if (predicate(tree)) output.push(tree);
  nodes(tree.props?.children, predicate, output);
  return output;
}
const editor = load('app/dashboard/forms/_components/RuleEditor.tsx').RuleEditor;
const helpers = load('app/dashboard/forms/_helpers.ts');
for (const fixture of [
  { type: 'Date', mode: 'DateRangeSequential', initial: { fromDate: '2026-10-01', toDate: '2026-10-31' } },
  { type: 'Time', mode: 'TimeRangeSequential', initial: { fromTime: '10:00', toTime: '12:00', stepMinutes: 60 } }
]) {
  for (const end of ['from', 'to']) {
    test(`ERR024 ${fixture.type} clearing ${end} remains empty in rendered input and stored config`, () => {
      const question = { id: 'q1', entryId: 'entry.1', questionType: fixture.type, label: 'Range fixture', options: [], required: true };
      let config = { mode: fixture.mode, configJson: JSON.stringify(fixture.initial) };
      const render = () => editor({ index: 0, expanded: true, question, value: config, onChange: next => { config = next; }, onToggle() {} });
      const index = end === 'from' ? 0 : 1;
      nodes(render(), n => n.type === 'Input' && n.props.type === fixture.type.toLowerCase())[index].props.onChange({ target: { value: '' } });
      const field = `${end}${fixture.type}`;
      assert.equal(JSON.parse(config.configJson)[field], '');
      assert.equal(nodes(render(), n => n.type === 'Input' && n.props.type === fixture.type.toLowerCase())[index].props.value, '', 'Cleared inputs must not display a value missing from the payload');
    });
  }
}
for (const [mode, config] of [
  ['DateRangeSequential', { fromDate: '', toDate: '2026-10-31' }],
  ['DateRangeSequential', { fromDate: '2026-11-01', toDate: '2026-10-31' }],
  ['TimeRangeSequential', { fromTime: '12:00', toTime: '10:00', stepMinutes: 60 }],
  ['TimeRangeSequential', { fromTime: '09:00', toTime: '10:00', stepMinutes: 4 }]
]) {
  test(`ERR024 direct save guard blocks invalid ${mode} ${JSON.stringify(config)}`, async () => {
    const requests = [];
    const messages = [];
    const question = { id: 'q1', questionType: mode.startsWith('Date') ? 'Date' : 'Time' };
    await handler('saveRulesAndGenerate', {
      ...helpers,
      analysis: { projectId: 'p1', questions: [question] },
      ruleConfigs: { q1: { mode, configJson: JSON.stringify(config) } },
      canGenerate: false, setBusy() {}, clearPreviewWorkflow() {},
      apiFetch: async (...args) => { requests.push(args); throw new Error('fixture boundary'); },
      showError: () => messages.push('error'), toast: { error: message => messages.push(message) }
    })();
    assert.equal(requests.length, 0, 'Invalid range must not write a rule or generate paid previews');
  });
}
