const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const requireTool = createRequire(path.join(process.env.BIZ_TOOL_ROOT || path.join(process.env.TEMP, 'bizmatrix-tools'), 'package.json'));
const { parseHTML } = requireTool('linkedom');
const root = path.resolve(__dirname, '..');
const { window, document } = parseHTML(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
window.scrollTo = () => {};
window.innerWidth = 1280;
window.print = () => {};
const errors = [];
const context = vm.createContext({ window, document, console: { log: console.log, warn: console.warn, error: (...args) => errors.push(args.join(' ')) }, setTimeout, clearTimeout, requestAnimationFrame: callback => callback(), URL, Blob });
const evaluate = code => vm.runInContext(code, context);
evaluate(fs.readFileSync(path.join(root, 'js/preview.js'), 'utf8'));
evaluate(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'));
document.dispatchEvent(new window.Event('DOMContentLoaded'));
const select = document.getElementById('compFilter');
Object.defineProperty(select, 'value', { value: 'all', writable: true });

assert.equal(evaluate('ALLQ.length'), 19);
document.getElementById('nextQ').click();
assert.match(document.getElementById('qMsg').textContent, /answer this question/);
const profile = { objective: 'profit', founders: 'two_to_six', liability: 'critical', funding: 'vc', compliance: 'high', business: 'startup', ownership: 'shares', scale: 'growth', foreign: 'none', sector: 'svc', state: 'Maharashtra', supply: 's', workforce: '20', ec: 'y', contract: 'n', premises: 'r', interstate: 'n', packaged: 'n', plant: ['n'] };
for (let index = 0; index < 19; index++) {
  const question = evaluate('ALLQ[state.i]');
  const answer = profile[question.id];
  if (question.type === 'select') {
    const input = document.getElementById('selq');
    Object.defineProperty(input, 'value', { value: answer, writable: true });
    input.dispatchEvent(new window.Event('change'));
  } else {
    for (const value of Array.isArray(answer) ? answer : [answer]) document.querySelector(`.option[data-v="${value}"]`).click();
  }
  document.getElementById('nextQ').click();
}
assert.equal(evaluate('state.rec.key'), 'private_limited');
assert.equal(document.querySelectorAll('#analysis .analysis-item').length, 3);
assert.equal(document.querySelectorAll('#documents [data-doc]').length, 7);
assert.equal(document.querySelectorAll('#actionPlan .action').length, 2);
assert.equal(document.querySelectorAll('#matrixBody tr').length, 2);
assert.equal(document.querySelectorAll('#compliance tbody tr').length, 4);
assert.ok(evaluate('ENTITIES.private_limited.comp.some(x=>x[0]==="Annual")'), 'Updated annual compliance must have preview coverage');
assert.equal(document.querySelectorAll('.site-footer').length, 2);
assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://bizmatrix.in/');
const firstCheck = document.querySelector('[data-doc]');
firstCheck.checked = true; firstCheck.dispatchEvent(new window.Event('change'));
assert.match(document.getElementById('docCount').textContent, /^1 \/ 7/);
const firstRegistration = document.querySelector('[data-d]');
assert.ok(firstRegistration); firstRegistration.click();
assert.ok(document.querySelector(`[data-d="${firstRegistration.dataset.d}"]`).classList.contains('on'));
const registrationIds = () => [...document.querySelectorAll('[data-d]')].map(x => x.dataset.d);
const allowedIds = new Set(evaluate('RG.getPreview().visibleItems.map(x=>String(x.i))'));
for (const filter of ['2', '1', '3', '0', 'all']) {
  document.querySelector(`[data-rf="${filter}"]`).click();
  registrationIds().forEach(id => assert.ok(allowedIds.has(id), 'Filters must not expand the preview'));
}
const search = document.getElementById('rgQ');
search.value = 'Telecom'; search.dispatchEvent(new window.Event('input'));
assert.equal(document.querySelectorAll('[data-d]').length, 0);
search.value = ''; search.dispatchEvent(new window.Event('input'));
for (const category of ['Initial', 'Annual', 'Tax', 'Audit', 'Event Based', 'all']) {
  select.value = category; select.dispatchEvent(new window.Event('change'));
  assert.ok(document.querySelectorAll('#compliance tbody tr').length <= 4);
}
for (const key of evaluate('Object.keys(ENTITIES)')) {
  evaluate(`state.rec={key:${JSON.stringify(key)},fit:80,ranking:[]}; renderDashboard()`);
  const info = evaluate(`({docs:ENTITIES[${JSON.stringify(key)}].docsTotal,comp:ENTITIES[${JSON.stringify(key)}].compTotal})`);
  assert.ok(document.querySelectorAll('#documents [data-doc]').length <= Math.floor(info.docs * .35));
  assert.ok(document.querySelectorAll('#compliance tbody tr').length <= Math.floor(info.comp * .35));
  const printSections = [...document.querySelectorAll('#printReport .print-page')];
  const compliancePrint = printSections.find(x => /Compliance Preview/.test(x.querySelector('.print-section-title')?.textContent || ''));
  assert.equal(compliancePrint.querySelectorAll('tbody tr').length, Math.floor(info.comp * .35));
  assert.equal(document.querySelectorAll('#analysis .analysis-item').length, 3);
  assert.ok(evaluate('RG.getPreview().visibleItems.length <= Math.floor(RG.getPreview().totalItems*.35)'));
}
const generated = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
for (const lockedText of ['INC-14', 'Projected statement for next 3 years', 'Telecommunications Act, 2023 and the 2025 Rules', 'Section 8 Company Licence (Form INC-12)']) {
  assert.ok(!generated.includes(lockedText), `Locked detail must not ship: ${lockedText}`);
}
evaluate(`state.answers=${JSON.stringify({ ...profile, founders: 'one', ownership: 'single', funding: 'vc' })}; generate()`);
assert.ok(evaluate('state.rec.conflict'));
assert.equal(document.getElementById('printReport').innerHTML, '');
assert.ok(document.getElementById('printBtn').disabled);
document.getElementById('newBtn').click(); document.getElementById('newBtn').click();
assert.equal(evaluate('state.i'), 0);
assert.ok(!document.getElementById('assessment').classList.contains('hidden'));
assert.equal(document.getElementById('printReport').innerHTML, '');
assert.deepEqual(errors, []);
console.log('Passed: 19-question flow, seven entity previews, filter limits, checklist state, print limits, omitted premium data, conflict and reset.');
