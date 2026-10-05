const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const requireTool = createRequire(path.join(process.env.BIZ_TOOL_ROOT || path.join(process.env.TEMP, 'bizmatrix-tools'), 'package.json'));
const { parseHTML } = requireTool('linkedom');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'saas-backend/private/catalog.json'), 'utf8'));
const profile = { objective: 'profit', founders: 'two_to_six', liability: 'critical', funding: 'vc', compliance: 'high', business: 'startup', ownership: 'shares', scale: 'growth', foreign: 'none', sector: 'svc', state: 'Maharashtra', supply: 's', workforce: '20', ec: 'y', contract: 'n', premises: 'r', interstate: 'n', packaged: 'n', plant: ['n'] };
const orderId = 'BIZ_' + 'a'.repeat(32);
const receipt = { orderId, paidAt: Date.now(), recoveryCode: 'BIZ-' + 'c'.repeat(43), amount: 4900, currency: 'INR' };

async function harness({ paid = false, returned = false, failed = false, includePdf = false, available = true } = {}) {
  const { window, document } = parseHTML(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const href = 'http://localhost:3000/' + (returned ? '?phonepe_order_id=' + orderId : '');
  const storage = new Map([['biz_report_unlocked', 'true'], ['premium', 'true'], ['bizmatrix.phonepe.session.v1', 'b'.repeat(43)]]);
  if (returned) storage.set('bizmatrix.assessment.v1', JSON.stringify({ answers: profile, docs: { '0_0': true } }));
  const calls = [], errors = [], downloads = [];
  let verified = paid;
  window.scrollTo = () => {};
  window.innerWidth = 1280;
  window.print = () => {};
  window.location = { href, assign(url) { downloads.push(url); } };
  window.history = { replaceState(_state, _title, url) { window.location.href = url; } };
  window.BIZ_API_BASE_URL = '';
  const getComputedStyle = element => ({ ...element.style, getPropertyValue: property => element.style[property] || '', display: 'table', paddingTop: '0', paddingRight: '0', paddingBottom: '0', paddingLeft: '0', fontSize: '12px', fontFamily: 'Arial', fontStyle: 'normal', fontWeight: 'normal', color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)', textAlign: 'left', verticalAlign: 'top' });
  window.getComputedStyle = getComputedStyle;
  const localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const fetch = async (url, options) => {
    const endpoint = url.replace('/api', ''); calls.push({ endpoint, options });
    let result, status = 200;
    if (endpoint === '/config') result = { available, amount: 4900, mode: 'sandbox' };
    else if (endpoint === '/session') result = { token: 'b'.repeat(43) };
    else if (endpoint === '/access') result = { premium: verified, receipt: verified ? receipt : null };
    else if (endpoint === '/premium/content') { status = verified ? 200 : 403; result = verified ? catalog : { error: 'Payment required' }; }
    else if (endpoint.endsWith('/verify')) { verified = !failed; result = { premium: verified, receipt: verified ? receipt : null, state: failed ? 'FAILED' : 'COMPLETED' }; }
    else if (endpoint === '/restore-access') { verified = true; result = { premium: true, receipt }; }
    else if (endpoint === '/orders') result = { orderId, amount: 4900, checkoutUrl: 'https://mercury.phonepe.com/checkout/test' };
    else throw new Error('Unexpected test endpoint: ' + endpoint);
    return { ok: status === 200, status, json: async () => result };
  };
  const context = vm.createContext({ window, document, navigator: { clipboard: { writeText: async () => {} } }, localStorage, fetch, AbortController, setTimeout, clearTimeout, requestAnimationFrame: callback => callback(), URL, Blob, TextEncoder, TextDecoder, atob, btoa, console: { log: console.log, warn: console.warn, error: (...args) => errors.push(args.join(' ')) } });
  const evaluate = code => vm.runInContext(code, context);
  if (includePdf) {
    evaluate(fs.readFileSync(path.join(root, 'js/pdf.min.js'), 'utf8'));
    window.jspdf = context.jspdf;
  }
  for (const file of ['preview.js', 'app.js', 'payments.js']) evaluate(fs.readFileSync(path.join(root, 'js', file), 'utf8'));
  Object.defineProperty(document.getElementById('compFilter'), 'value', { value: 'all', writable: true });
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await window.BizPaymentsReady;
  const tick = () => new Promise(resolve => setTimeout(resolve, 30));
  const assess = () => evaluate(`state.answers=${JSON.stringify(profile)};generate()`);
  return { window, document, calls, errors, downloads, storage, evaluate, assess, tick };
}

async function main() {
  const free = await harness(); free.assess();
  assert.equal(free.window.BizPayments.isPremium(), false, 'Local storage flags must not unlock content');
  assert.equal(free.document.querySelectorAll('#analysis .analysis-item').length, 3);
  assert.ok(!free.calls.some(call => call.endpoint === '/premium/content'));
  free.document.querySelector('[data-buy]').click(); await free.tick();
  const form = free.document.getElementById('purchaseForm');
  free.document.getElementById('buyerEmail').value = 'buyer@example.com';
  form.dispatchEvent(new free.window.Event('submit', { cancelable: true })); await free.tick();
  assert.match(free.downloads[0], /^https:\/\/mercury\.phonepe\.com/);
  assert.equal(JSON.parse(free.calls.find(call => call.endpoint === '/orders').options.body).amount, undefined);
  assert.equal(JSON.parse(free.storage.get('bizmatrix.assessment.v1')).answers.sector, 'svc');
  free.document.querySelector('[data-restore]').click();
  free.document.getElementById('accessCode').value = receipt.recoveryCode;
  free.document.getElementById('restoreForm').dispatchEvent(new free.window.Event('submit', { cancelable: true })); await free.tick();
  assert.equal(free.window.BizPayments.isPremium(), true, 'Restored access must load the protected catalog');
  assert.equal(free.document.querySelectorAll('#documents [data-doc]').length, 20);

  const unavailable = await harness({ available: false }); unavailable.assess();
  unavailable.document.querySelector('[data-buy]').click(); await unavailable.tick();
  assert.equal(unavailable.document.getElementById('payPhonePe').disabled, true);
  assert.match(unavailable.document.getElementById('paymentMessage').textContent, /unavailable/);
  assert.equal(unavailable.document.querySelectorAll('#documents [data-doc]').length, 7);

  const failed = await harness({ returned: true, failed: true });
  assert.equal(failed.window.BizPayments.isPremium(), false);
  assert.equal(failed.document.querySelectorAll('#documents [data-doc]').length, 7);
  assert.match(failed.document.getElementById('paymentMessage').textContent, /not completed/);

  const paid = await harness({ returned: true, includePdf: true });
  assert.equal(paid.window.BizPayments.isPremium(), true);
  assert.equal(paid.evaluate('state.rec.key'), 'private_limited', 'Payment return restores the assessment');
  assert.equal(paid.document.querySelectorAll('#analysis .analysis-item').length, 10);
  assert.equal(paid.document.querySelectorAll('#documents [data-doc]').length, 20);
  assert.match(paid.document.getElementById('docCount').textContent, /^1 \/ 20/);
  assert.equal(paid.document.querySelectorAll('#compliance tbody tr').length, 13);
  assert.equal(paid.document.querySelectorAll('#matrixBody tr').length, 8);
  assert.equal(paid.document.querySelectorAll('#actionPlan .action').length, 6);
  assert.equal(paid.document.querySelectorAll('#dashboard .locked-premium').length, 0);
  assert.equal(paid.document.getElementById('receiptCode').value, receipt.recoveryCode);
  assert.equal(paid.document.querySelectorAll('#printReport .print-preview-note').length, 0);
  assert.ok(paid.document.getElementById('printReport').textContent.includes('INC-20A'));
  assert.ok(!paid.window.location.href.includes('phonepe_order_id'));
  paid.document.querySelector('[data-rf="0"]').click();
  paid.evaluate('buildPrint(ENTITIES.private_limited)');
  assert.ok(paid.evaluate('RG.getPreview(true).visibleItems.length > 0'), 'PDF ignores the not-applicable view filter');
  for (const key of paid.evaluate('Object.keys(ENTITIES)')) {
    paid.evaluate(`state.rec={key:${JSON.stringify(key)},fit:80,ranking:[]};renderDashboard()`);
    const entity = catalog.entities[key];
    assert.equal(paid.document.querySelectorAll('#documents [data-doc]').length, entity.docsTotal);
    assert.equal(paid.document.querySelectorAll('#compliance tbody tr').length, entity.compTotal);
  }

  paid.evaluate('generate()');
  // jsPDF's table reader expects browser table collections; decorate the fresh print DOM.
  paid.evaluate(`const originalBuildPrint=buildPrint;buildPrint=function(e){originalBuildPrint(e);document.querySelectorAll('#printReport table').forEach(t=>{Object.defineProperty(t,'rows',{get:()=>[...t.querySelectorAll('tr')]});});document.querySelectorAll('#printReport tr').forEach(r=>Object.defineProperty(r,'cells',{get:()=>[...r.children]}));}`);
  paid.evaluate('pdfNow()');
  assert.ok(paid.window.__lastPdf, 'The full PDF must be created');
  const pdf = paid.window.__lastPdf.output('arraybuffer');
  assert.ok(pdf.byteLength > 60000);
  const pdfText = paid.window.__lastPdf.output();
  assert.ok(pdfText.includes('INC-20A'), 'Paid compliance must appear in the PDF');
  assert.equal(paid.document.querySelector('a[download]')?.download, 'Biz_Matrix_Full_Report.pdf');
  fs.writeFileSync(path.join(root, 'saas-backend/private/qa-full-report.pdf'), Buffer.from(pdf));
  assert.deepEqual(paid.errors, []);
  assert.deepEqual(free.errors, []);
  assert.deepEqual(failed.errors, []);
  console.log(`Passed: forged flags stay locked, checkout, failed/successful returns, assessment restore, full content for all seven structures and full PDF (${pdf.byteLength} bytes, ${paid.window.__lastPdf.getNumberOfPages()} pages).`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
