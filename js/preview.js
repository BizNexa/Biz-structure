const APP_CONFIG = Object.freeze({
  productName: 'Biz Matrix',
  supportEmail: 'nexifydigital03@gmail.com',
  freePreviewPercent: 35,
  premiumMode: 'contact',
  paymentEnabled: false
});

function previewLimit(total) {
  return Math.floor(Math.max(0, total) * APP_CONFIG.freePreviewPercent / 100);
}

function getPreviewItems(items, sectionKey, totalItems = items.length) {
  const total = Math.max(items.length, totalItems);
  const visibleItems = items.slice(0, previewLimit(total));
  return { visibleItems, totalItems: total, remainingCount: total - visibleItems.length, sectionKey };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function createUnlockEmail() {
  const assessment = typeof state !== 'undefined' && state.rec?.key ? ENTITIES[state.rec.key].name : 'Not completed';
  const body = ['Name:', 'Email:', `Assessment: ${assessment}`, 'Requested report: Full Biz Matrix report', `Date: ${new Date().toLocaleDateString('en-IN')}`, 'Additional information:'].join('\n');
  return `mailto:${APP_CONFIG.supportEmail}?subject=${encodeURIComponent('Biz Matrix - Full Report Access Request')}&body=${encodeURIComponent(body)}`;
}

const AccessProvider = Object.freeze({ getUnlockHref: createUnlockEmail, requestUnlock: () => { window.location.href = createUnlockEmail(); } });

function previewNotice(preview) {
  return `<p class="preview-count">35% free preview: ${preview.visibleItems.length} of ${preview.totalItems} items</p>`;
}

function LockedPremiumSection(remainingCount, label = 'items') {
  if (!remainingCount) return '';
  return `<aside class="locked-premium" aria-label="Full report access"><h3>Full Report</h3><p>${remainingCount} additional ${escapeHtml(label)} are included in the full report.</p><a class="btn primary" href="${escapeHtml(createUnlockEmail())}">Contact Us to Unlock</a></aside>`;
}

function analysisPreview(e) {
  const ownership = state.answers.ownership;
  return getPreviewItems([
    ['Structural compatibility gate', ownership === 'shares' ? 'Share-capital ownership selected: LLP and Partnership are excluded from the primary recommendation.' : ownership === 'partners' ? 'Partner-contribution ownership selected: share-capital company structures are excluded from the primary recommendation.' : 'Direct single-owner control selected: the engine evaluates proprietorship and OPC routes.'],
    ['Legal identity', e.legal], ['Liability', e.liability]
  ], 'analysis', 10);
}

function summaryPreview(e) {
  return getPreviewItems([['Liability', e.liability, 'shield'], ['Compliance', e.compliance, 'calendar']], 'summary', 8);
}

function overviewPreview(e) {
  return getPreviewItems([['Ownership model', e.ownership]], 'overview', 4);
}

function documentsPreview(e) {
  return getPreviewItems(e.docs.flatMap(([group, items], gi) => items.map((item, ii) => ({ group, item, id: `${gi}_${ii}` }))), 'documents', e.docsTotal);
}

function compliancePreview(e) {
  return getPreviewItems(e.comp, 'compliance', e.compTotal);
}

function matrixPreview() {
  return getPreviewItems([
    ['Legal Status', 'Separate legal entity', 'Separate legal entity', 'No separate legal identity', 'No separate legal entity', 'Separate legal entity', 'Separate legal entity', 'Separate legal entity'],
    ['Liability', 'Limited', 'Limited, subject to exceptions', 'Unlimited', 'Unlimited joint & several', 'Limited', 'Limited', 'Limited']
  ], 'matrix', 8);
}

function actionsPreview(e) {
  return getPreviewItems([
    ['Confirm the structural decision', `Review the ${e.name} recommendation against founder, liability, funding and compliance requirements.`],
    ['Prepare incorporation documents', 'Prepare the documents in your preview checklist and request the full report for the remaining requirements.']
  ], 'actions', 6);
}

function alternativesPreview() {
  return getPreviewItems(alternativeStructures(state.answers, state.rec.key), 'alternatives');
}

function metricCards(e) {
  const preview = summaryPreview(e);
  document.getElementById('metrics').innerHTML = preview.visibleItems.map(([title, value, icon]) => `<div class="card metric"><div class="ico" style="width:22px;height:22px" aria-hidden="true">${ICONS[icon]}</div><div class="metric-label">${escapeHtml(title)}</div><div class="metric-value">${escapeHtml(value)}</div></div>`).join('') + LockedPremiumSection(preview.remainingCount, 'summary items');
}

function renderDashboard() {
  const e = ENTITIES[state.rec.key];
  document.getElementById('printBtn').disabled = false;
  document.getElementById('heroTitle').textContent = e.name;
  document.getElementById('heroDesc').textContent = e.best;
  document.getElementById('recTitle').textContent = e.name;
  document.getElementById('recDesc').textContent = `${e.name} is the current structural fit based on your assessment.`;
  document.getElementById('score').textContent = state.rec.fit;
  const circumference = 2 * Math.PI * 78;
  document.getElementById('ringFg').style.strokeDashoffset = circumference - state.rec.fit / 100 * circumference;
  document.getElementById('recPills').innerHTML = `<span class="pill green">Current fit ${state.rec.fit}/100</span><span class="pill gray">FY 2026-27</span>`;
  const driverPreview = getPreviewItems(drivers(state.answers, state.rec.key), 'drivers');
  document.getElementById('drivers').innerHTML = driverPreview.visibleItems.map((text, i) => `<div class="driver"><div class="driver-num">${i + 1}</div><div class="driver-text">${escapeHtml(text)}</div></div>`).join('') + `<p class="driver-text">${driverPreview.remainingCount} additional drivers in the full report.</p>`;
  metricCards(e);
  document.getElementById('executive').textContent = `${e.name} is the current best structural fit based on the information provided. Verify applicable requirements before incorporation or commencement.`;
  const overview = overviewPreview(e);
  document.getElementById('overviewCards').innerHTML = overview.visibleItems.map(([title, text]) => `<div class="text-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`).join('') + LockedPremiumSection(overview.remainingCount, 'executive summary items');
  document.getElementById('answers').innerHTML = ALLQ.map(q => `<div class="answer-item"><div class="answer-cat">${escapeHtml(q.cat)}</div><div class="answer-val">${escapeHtml(optionLabel(q, state.answers[q.id]))}</div></div>`).join('');
  renderAnalysis(e); renderDocs(e); renderCompliance(e); renderRegs(); renderMatrix(); renderAction(e); buildPrint(e);
  document.getElementById('assessment').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  activateTab('overview');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAnalysis(e) {
  const preview = analysisPreview(e);
  document.getElementById('analysis').innerHTML = previewNotice(preview) + preview.visibleItems.map(([title, text], i) => `<div class="analysis-item"><h4>${String(i + 1).padStart(2, '0')}. ${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p></div>`).join('') + LockedPremiumSection(preview.remainingCount, 'analysis items');
  const alternatives = alternativesPreview();
  document.getElementById('alternatives').innerHTML = alternatives.visibleItems.map(([key]) => `<div class="alt"><div class="alt-title">${escapeHtml(ENTITIES[key].name)}</div><p class="alt-desc">${escapeHtml(ENTITIES[key].best)}</p></div>`).join('') + LockedPremiumSection(alternatives.remainingCount, 'alternative structures') + (alternatives.totalItems ? '' : '<p>No structurally compatible alternative.</p>');
}

function renderDocs(e) {
  state.docs = {};
  const preview = documentsPreview(e);
  const groups = new Map();
  preview.visibleItems.forEach(doc => {
    state.docs[doc.id] = false;
    if (!groups.has(doc.group)) groups.set(doc.group, []);
    groups.get(doc.group).push(doc);
  });
  document.getElementById('documents').innerHTML = previewNotice(preview) + [...groups].map(([name, docs]) => `<div class="doc-group"><h4>${escapeHtml(name)}</h4>${docs.map(doc => `<label class="check"><input type="checkbox" data-doc="${doc.id}"><span>${escapeHtml(docText(doc.item))}</span></label>`).join('')}</div>`).join('') + LockedPremiumSection(preview.remainingCount, 'documents');
  updateDocs();
  document.querySelectorAll('[data-doc]').forEach(input => {
    input.onchange = () => { state.docs[input.dataset.doc] = input.checked; input.closest('.check').classList.toggle('done', input.checked); updateDocs(); };
  });
}

function updateDocs() {
  const total = Object.keys(state.docs).length;
  const completed = Object.values(state.docs).filter(Boolean).length;
  document.getElementById('docCount').textContent = `${completed} / ${total} preview items`;
  document.getElementById('docProgress').style.width = `${total ? completed / total * 100 : 0}%`;
}

function renderCompliance(e) {
  const preview = compliancePreview(e);
  const filter = document.getElementById('compFilter').value;
  const rows = preview.visibleItems.filter(item => filter === 'all' || item[0] === filter);
  document.getElementById('compliance').innerHTML = previewNotice(preview) + (rows.length ? `<div class="annual-table-wrap"><table class="annual-table"><thead><tr><th>Category</th><th>Compliance</th><th>Timing</th><th>Applicability</th><th>Action</th><th>Control</th></tr></thead><tbody>${rows.map(x => `<tr>${[x[0], x[2], x[1], x[4] || 'Subject to applicable conditions.', x[3], x[5] || 'Verify the current notification.'].map(text => `<td>${escapeHtml(text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="empty-preview">No preview obligations match this category.</p>') + LockedPremiumSection(preview.remainingCount, 'compliance obligations');
}

function renderRegs() { RG.render(); RG.snap(); }

const MATRIX_COLUMNS = ['Parameter', 'Private Limited', 'LLP', 'Proprietorship', 'Partnership', 'OPC', 'Public Limited', 'Section 8'];
function renderMatrix() {
  const preview = matrixPreview();
  document.getElementById('matrixHead').innerHTML = `<tr>${MATRIX_COLUMNS.map(x => `<th>${escapeHtml(x)}</th>`).join('')}</tr>`;
  document.getElementById('matrixBody').innerHTML = preview.visibleItems.map(row => `<tr>${row.map(x => `<td>${escapeHtml(x)}</td>`).join('')}</tr>`).join('');
  document.getElementById('matrixGate').innerHTML = previewNotice(preview) + LockedPremiumSection(preview.remainingCount, 'comparison rows');
}

function renderAction(e) {
  const preview = actionsPreview(e);
  document.getElementById('actionPlan').innerHTML = previewNotice(preview) + preview.visibleItems.map(([title, text], i) => `<div class="action"><div class="action-num">${String(i + 1).padStart(2, '0')}</div><div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p></div></div>`).join('') + LockedPremiumSection(preview.remainingCount, 'action steps');
}

function registrationPrintHtml(preview) {
  return `<table class="print-table"><thead><tr><th>No.</th><th>Registration</th><th>Status</th><th>Purpose / provisions</th><th>Scope</th></tr></thead><tbody>${preview.visibleItems.map(x => `<tr><td>${x.i}</td><td>${escapeHtml(x.r.n)}</td><td>${{ 2: 'Mandatory', 1: 'Conditional', 3: 'Advisory' }[x.v]}</td><td>${escapeHtml(x.r.d)}<br>${escapeHtml(x.y.join('; '))}</td><td>${escapeHtml(x.r.r)}</td></tr>`).join('')}</tbody></table>${printGate(preview, 'registration reviews')}`;
}

function printGate(preview, label) {
  return `<p class="print-preview-note">35% free preview: ${preview.visibleItems.length} of ${preview.totalItems} items. ${preview.remainingCount} additional ${escapeHtml(label)} in the full report. Contact ${APP_CONFIG.supportEmail}. Official website: https://bizmatrix.in/</p>`;
}

function buildPrint(e) {
  const section = (title, html) => `<div class="print-page"><div class="print-section-title">${title}</div>${html}</div>`;
  const cards = preview => `<div class="print-grid2">${preview.visibleItems.map(([title, text]) => `<div class="pcard"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p></div>`).join('')}</div>`;
  const summary = summaryPreview(e), overview = overviewPreview(e), analysis = analysisPreview(e), docs = documentsPreview(e), comp = compliancePreview(e), matrix = matrixPreview(), actions = actionsPreview(e);
  document.getElementById('printReport').innerHTML = `<div class="print-page print-cover"><div><div class="print-brand"><div class="print-mark">BM</div><div><b>Biz Matrix</b><div class="print-small">FY 2026-27 - 35% Free Preview</div></div></div><div class="print-title">${escapeHtml(e.name)}</div><div class="print-sub">Business Structure &amp; Registration Intelligence - Preview Report</div><div class="print-kpis">${summary.visibleItems.map(([title, text]) => `<div class="pkpi"><div class="pkpi-label">${escapeHtml(title)}</div><div class="pkpi-value">${escapeHtml(text)}</div></div>`).join('')}</div><div class="pcard"><h4>Executive Decision</h4><p>${escapeHtml(e.name)} is the current structural fit based on your answers.</p></div><div class="pcard"><h4>Important limitation</h4><p>Preliminary decision support only. Verify current law and applicable requirements before acting.</p></div><div class="pcard"><h4>Full report access</h4><p>${APP_CONFIG.supportEmail}</p><p>https://bizmatrix.in/</p></div></div></div>`
    + section('Executive Summary Preview', cards(summary) + printGate(summary, 'summary items') + cards(overview) + printGate(overview, 'executive summary items'))
    + section('Assessment Inputs', `<div class="print-grid2">${ALLQ.map(q => `<div class="pcard"><h4>${escapeHtml(q.cat)}</h4><p>${escapeHtml(optionLabel(q, state.answers[q.id]))}</p></div>`).join('')}</div>`)
    + section('Detailed Analysis Preview', cards(analysis) + printGate(analysis, 'analysis items'))
    + section('Document Checklist Preview', `<div class="print-grid2">${docs.visibleItems.map(doc => `<div class="pcard"><h4>${escapeHtml(doc.group)}</h4><p>${state.docs[doc.id] ? '[Done]' : '[ ]'} ${escapeHtml(docText(doc.item))}</p></div>`).join('')}</div>` + printGate(docs, 'documents'))
    + section('Compliance Preview', `<table class="print-table"><thead><tr><th>Category</th><th>Timing</th><th>Obligation</th><th>Action</th></tr></thead><tbody>${comp.visibleItems.map(x => `<tr>${[x[0], x[1], x[2], x[3]].map(text => `<td>${escapeHtml(text)}</td>`).join('')}</tr>`).join('')}</tbody></table>` + printGate(comp, 'compliance obligations'))
    + section('Registration Preview', RG.printHtml())
    + section('Entity Matrix Preview', `<table class="print-table"><thead><tr>${MATRIX_COLUMNS.map(x => `<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>${matrix.visibleItems.map(row => `<tr>${row.map(x => `<td>${escapeHtml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>` + printGate(matrix, 'comparison rows'))
    + section('Action Plan Preview', cards(actions) + printGate(actions, 'action steps'));
}

function renderConflict() {
  document.getElementById('printReport').innerHTML = '';
  document.getElementById('printBtn').disabled = true;
  ['heroTitle', 'recTitle'].forEach(id => { document.getElementById(id).textContent = 'Compatibility Check Required'; });
  ['heroDesc', 'recDesc', 'executive'].forEach(id => { document.getElementById(id).textContent = 'The ownership and funding requirements do not produce a compatible structure. Start a new assessment to review them.'; });
  ['metrics', 'overviewCards', 'recPills', 'drivers', 'heroPills', 'snap', 'answers', 'matrixGate'].forEach(id => { document.getElementById(id).innerHTML = ''; });
  ['analysis', 'alternatives', 'documents', 'compliance', 'rgOut', 'actionPlan'].forEach(id => { document.getElementById(id).innerHTML = '<p>Resolve the compatibility issue to generate this section.</p>'; });
  document.getElementById('score').textContent = '-';
  document.getElementById('ringFg').style.strokeDashoffset = 2 * Math.PI * 78;
  document.getElementById('docCount').textContent = '0 / 0';
  document.getElementById('docProgress').style.width = '0%';
  document.getElementById('assessment').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  activateTab('overview');
}

document.addEventListener('DOMContentLoaded', () => {
  const originalQuestion = renderQuestion;
  renderQuestion = function () {
    originalQuestion();
    document.querySelectorAll('.option').forEach(option => {
      option.tabIndex = 0;
      option.setAttribute('role', ALLQ[state.i].type === 'multi' ? 'checkbox' : 'radio');
      const sync = () => document.querySelectorAll('.option').forEach(x => x.setAttribute('aria-checked', String(x.classList.contains('selected'))));
      option.addEventListener('click', sync);
      option.addEventListener('keydown', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); option.click(); } });
      sync();
    });
    const select = document.getElementById('selq');
    if (select) select.setAttribute('aria-label', ALLQ[state.i].title);
  };
  renderQuestion();
  const originalNew = document.getElementById('newBtn').onclick;
  document.getElementById('newBtn').onclick = function () {
    originalNew.call(this);
    if (!state.rec) {
      document.getElementById('printReport').innerHTML = '';
      document.getElementById('compFilter').value = 'all';
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
    }
  };
  const originalTab = activateTab;
  activateTab = function (name) {
    originalTab(name);
    document.querySelectorAll('.tab').forEach(tab => {
      const selected = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.getElementById('menuBtn').setAttribute('aria-expanded', String(document.getElementById('sidebar').classList.contains('open')));
  };
  document.querySelector('.tabs').setAttribute('role', 'tablist');
  document.querySelectorAll('.tab').forEach((tab, index, all) => {
    tab.setAttribute('role', 'tab');
    tab.id = `tab-${tab.dataset.tab}`;
    tab.setAttribute('aria-controls', `panel-${tab.dataset.tab}`);
    const panel = document.getElementById(`panel-${tab.dataset.tab}`);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % all.length : event.key === 'ArrowLeft' ? (index - 1 + all.length) % all.length : event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1 : -1;
      if (target < 0) return;
      event.preventDefault(); activateTab(all[target].dataset.tab); all[target].focus();
    });
  });
  document.getElementById('menuBtn').onclick = () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', String(sidebar.classList.contains('open')));
  };
  document.querySelectorAll('.nav-icon,[data-icon]').forEach(x => x.setAttribute('aria-hidden', 'true'));
  document.getElementById('printBtn').insertAdjacentHTML('afterbegin', '<span class="nav-icon" aria-hidden="true">' + ICONS.file + '</span>');
  activateTab('overview');
});
