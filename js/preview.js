const APP_CONFIG = Object.freeze({
  productName: 'Biz Matrix',
  supportEmail: 'nexifydigital03@gmail.com',
  freePreviewPercent: 35,
  premiumMode: 'cashfree',
  paymentEnabled: true,
  pricePaise: 4900
});

function previewLimit(total) {
  return Math.floor(Math.max(0, total) * APP_CONFIG.freePreviewPercent / 100);
}

function getPreviewItems(items, sectionKey, totalItems = items.length) {
  const total = Math.max(items.length, totalItems);
  const visibleItems = AccessProvider.isPremium() ? items : items.slice(0, previewLimit(total));
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

const AccessProvider = Object.freeze({
  isPremium: () => window.BizPayments?.isPremium() === true,
  getUnlockHref: createUnlockEmail,
  requestUnlock: () => window.BizPayments?.openCheckout()
});

function previewNotice(preview) {
  return `<p class="preview-count">${AccessProvider.isPremium() ? 'Full report' : '35% free preview'}: ${preview.visibleItems.length} of ${preview.totalItems} items</p>`;
}

/* Free preview: the remaining 65% is shown blurred and inert, with one unlock card on top. */
function BlurredLock(innerHtml, remainingCount, label = 'items') {
  if (!remainingCount || AccessProvider.isPremium()) return '';
  return `<div class="bm-lock"><div class="bm-lock-content" aria-hidden="true" inert>${innerHtml}</div><div class="bm-lock-cta" role="group" aria-label="Locked content"><p><b>${remainingCount} more ${escapeHtml(label)}</b> in the full report</p><button type="button" class="btn primary" data-buy>Unlock for &#8377;49</button></div></div>`;
}
function lockSkeleton(n) {
  return Array.from({ length: Math.min(Math.max(n, 2), 5) }, (_, i) => `<div class="bm-skel"><span style="width:${38 + (i * 17) % 40}%"></span><span style="width:${70 + (i * 11) % 25}%"></span><span style="width:${50 + (i * 23) % 35}%"></span></div>`).join('');
}
function LockedPremiumSection(remainingCount, label = 'items') {
  return BlurredLock(lockSkeleton(remainingCount), remainingCount, label);
}
function LockedPremiumSectionOld(remainingCount, label = 'items') {
  if (!remainingCount) return '';
  return `<aside class="locked-premium" aria-label="Full report access"><h3>Full Report</h3><p>${remainingCount} additional ${escapeHtml(label)} are included in the full report.</p><button type="button" class="btn primary" data-buy>Unlock for &#8377;49</button></aside>`;
}

function analysisPreview(e) {
  const r = state.rec.engine || { eligible: [], excluded: {} };
  const gate = 'Eligible after the legal hard rules: ' + (r.eligible || []).map(x => BizEngine.NAME[x]).join(', ') + '. ' + Object.entries(r.excluded || {}).map(([x, ids]) => BizEngine.NAME[x] + ' excluded by ' + ids.join(', ')).join('; ') + '.';
  return getPreviewItems([
    ['Eligibility gate (hard rules)', gate],
    ['Legal identity', e.legal], ['Liability', e.liability],
    ['Founders and membership', e.members], ['Ownership and management', e.ownership],
    ['Funding routes', e.funding], ['Tax framework', e.tax], ['Compliance burden', e.compliance],
    ['Audit requirements', e.audit], ['Best-fit use cases', e.best]
  ], 'analysis', 10);
}

function summaryPreview(e) {
  return getPreviewItems([['Liability', e.liability, 'shield'], ['Compliance', e.compliance, 'calendar'], ['Legal status', e.legal, 'file'], ['Membership', e.members, 'file'], ['Ownership', e.ownership, 'file'], ['Funding', e.funding, 'file'], ['Audit', e.audit, 'file'], ['Tax', e.tax, 'file']], 'summary', 8);
}

function overviewPreview(e) {
  return getPreviewItems([['Ownership model', e.ownership], ['Funding routes', e.funding], ['Tax framework', e.tax], ['Audit requirements', e.audit]], 'overview', 4);
}

function documentsPreview(e) {
  return getPreviewItems(e.docs.flatMap(([group, items], gi) => items.map((item, ii) => ({ group, item, id: `${gi}_${ii}` }))), 'documents', e.docsTotal);
}

function compliancePreview(e) {
  return getPreviewItems(e.comp, 'compliance', e.compTotal);
}

function matrixPreview() {
  const keys = ['private_limited', 'llp', 'sole', 'partnership', 'opc', 'public_limited', 'section8'];
  return getPreviewItems([['Legal Status', 'legal'], ['Liability', 'liability'], ['Membership', 'members'], ['Ownership', 'ownership'], ['Funding', 'funding'], ['Compliance', 'compliance'], ['Audit', 'audit'], ['Tax', 'tax']].map(([label, field]) => [label, ...keys.map(key => ENTITIES[key]?.[field] || '')]), 'matrix', 8);
}

function actionsPreview(e) {
  return getPreviewItems([
    ['Confirm the structural decision', `Review the ${e.name} recommendation against founder, liability, funding and compliance requirements.`],
    ['Prepare incorporation documents', 'Prepare the documents in the checklist and confirm their applicability to your proposed entity.'],
    ['Complete entity formation', `Follow the ${e.name} formation route, including constitutional documents, ownership and management requirements.`],
    ['Complete applicable registrations', 'Review mandatory registrations first, then conditional and advisory registrations. Confirm the cited provisions, authority and verification route.'],
    ['Create the compliance calendar', 'Record each initial, annual and event-based obligation with its timing, scope and control.'],
    ['Review before commencement', 'Resolve outstanding documents and registrations, verify current official requirements and retain the full PDF with your planning records.']
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
  document.getElementById('printBtn').innerHTML = `<span class="nav-icon" aria-hidden="true">${ICONS.file}</span>${AccessProvider.isPremium() ? 'Download Full PDF' : 'Download PDF · ₹49'}`;
  document.getElementById('heroTitle').textContent = e.name;
  document.getElementById('heroDesc').textContent = e.best;
  document.getElementById('recTitle').textContent = e.name;
  const only = state.rec.confidence === 'only eligible structure';
  const flags = reviewFlags();
  document.getElementById('recDesc').textContent = only
    ? `${e.name} is the only structure that passes the legal hard rules for your answers.`
    : `${e.name} scored highest (${state.rec.fit}/100) across the rulebook's nine weighted factors. ${confidenceLabel()}: ${state.rec.margin} points ahead of ${ENTITIES[state.rec.runnerUp].name}.`;
  document.getElementById('score').textContent = only ? '✓' : state.rec.fit;
  const cap = document.querySelector('.ring-caption'); if (cap) cap.textContent = only ? 'Only eligible' : 'Fit score';
  const circumference = 2 * Math.PI * 78;
  document.getElementById('ringFg').style.strokeDashoffset = only ? 0 : circumference - state.rec.fit / 100 * circumference;
  const band = { clear: 'green', moderate: 'amber', 'near-tie': 'red' }[state.rec.confidence] || 'blue';
  document.getElementById('recPills').innerHTML = `<span class="pill ${band}">${escapeHtml(confidenceLabel())}</span>${flags.length ? `<span class="pill red">${flags.length} review flag${flags.length > 1 ? 's' : ''}</span>` : ''}<span class="pill gray">Rulebook v${BizEngine.VERSION} · law verified ${BizEngine.VERIFIED}</span>`;
  renderWhyResult();
  const driverPreview = getPreviewItems(drivers(state.answers, state.rec.key), 'drivers');
  document.getElementById('drivers').innerHTML = driverPreview.visibleItems.map((text, i) => `<div class="driver"><div class="driver-num">${i + 1}</div><div class="driver-text">${escapeHtml(text)}</div></div>`).join('') + (driverPreview.remainingCount ? `<p class="driver-text">${driverPreview.remainingCount} additional drivers in the full report.</p>` : '');
  metricCards(e);
  document.getElementById('executive').textContent = `${e.name} is the current best structural fit based on the information provided. Verify applicable requirements before incorporation or commencement.`;
  const overview = overviewPreview(e);
  document.getElementById('overviewCards').innerHTML = overview.visibleItems.map(([title, text]) => `<div class="text-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`).join('') + LockedPremiumSection(overview.remainingCount, 'executive summary items');
  document.getElementById('answers').innerHTML = ALLQ.filter(q => !qSkipped(q, state.answers)).map(q => `<div class="answer-item"><div class="answer-cat">${escapeHtml(q.cat)}</div><div class="answer-val">${escapeHtml(optionLabel(q, state.answers[q.id]))}</div></div>`).join('');
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
  const previous = state.docs;
  state.docs = {};
  const preview = documentsPreview(e);
  const groups = new Map();
  preview.visibleItems.forEach(doc => {
    state.docs[doc.id] = previous[doc.id] === true;
    if (!groups.has(doc.group)) groups.set(doc.group, []);
    groups.get(doc.group).push(doc);
  });
  document.getElementById('documents').innerHTML = previewNotice(preview) + [...groups].map(([name, docs]) => `<div class="doc-group"><h4>${escapeHtml(name)}</h4>${docs.map(doc => `<label class="check${state.docs[doc.id] ? ' done' : ''}"><input type="checkbox" data-doc="${doc.id}"${state.docs[doc.id] ? ' checked' : ''}><span>${escapeHtml(docText(doc.item))}</span></label>`).join('')}</div>`).join('') + LockedPremiumSection(preview.remainingCount, 'documents');
  updateDocs();
  document.querySelectorAll('[data-doc]').forEach(input => {
    input.onchange = () => { state.docs[input.dataset.doc] = input.checked; input.closest('.check').classList.toggle('done', input.checked); updateDocs(); };
  });
}

function updateDocs() {
  const total = Object.keys(state.docs).length;
  const completed = Object.values(state.docs).filter(Boolean).length;
  document.getElementById('docCount').textContent = `${completed} / ${total} ${AccessProvider.isPremium() ? 'items' : 'preview items'}`;
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
  return `<table class="print-table"><thead><tr><th>No.</th><th>Registration</th><th>Status</th><th>Purpose / provisions</th><th>Scope / verification</th></tr></thead><tbody>${preview.visibleItems.map(x => `<tr><td>${x.i}</td><td>${escapeHtml(x.r.n)}${x.obtained ? ' [Obtained]' : ''}</td><td>${{ 2: 'Mandatory', 1: 'Conditional', 3: 'Advisory' }[x.v]}</td><td>${escapeHtml(x.r.d)}<br>${escapeHtml(x.y.join('; '))}<br>${escapeHtml(x.provisions)}</td><td>${escapeHtml(x.r.r)}<br>${escapeHtml(x.authority)}<br>${escapeHtml(x.verification)}<br>${escapeHtml(x.sources)}</td></tr>`).join('')}</tbody></table>${printGate(preview, 'registration reviews')}`;
}

function printGate(preview, label) {
  if (AccessProvider.isPremium()) return '';
  return `<p class="print-preview-note">35% free preview: ${preview.visibleItems.length} of ${preview.totalItems} items. ${preview.remainingCount} additional ${escapeHtml(label)} in the full report. Full report: Rs. 49 at https://www.bizmatrix.in/assessment/</p>`;
}

function buildPrint(e) {
  const section = (title, html) => `<div class="print-page"><div class="print-section-title">${title}</div>${html}</div>`;
  const cards = preview => `<div class="print-grid2">${preview.visibleItems.map(([title, text]) => `<div class="pcard"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p></div>`).join('')}</div>`;
  const summary = summaryPreview(e), overview = overviewPreview(e), analysis = analysisPreview(e), docs = documentsPreview(e), comp = compliancePreview(e), matrix = matrixPreview(), actions = actionsPreview(e), alternatives = alternativesPreview();
  const premium = AccessProvider.isPremium(), suffix = premium ? '' : ' Preview';
  const decisionDrivers = getPreviewItems(drivers(state.answers, state.rec.key), 'drivers');
  document.getElementById('printReport').innerHTML = `<div class="print-page print-cover"><div><div class="print-brand"><img class="print-logo" src="../assets/bizmatrix-mark.png" alt=""><div><b>Biz Matrix</b><div class="print-small">FY 2026-27 - ${premium ? 'Full Report' : '35% Free Preview'}</div></div></div><div class="print-title">${escapeHtml(e.name)}</div><div class="print-sub">Business Structure &amp; Registration Intelligence - ${premium ? 'Full' : 'Preview'} Report</div><div class="print-kpis">${summary.visibleItems.map(([title, text]) => `<div class="pkpi"><div class="pkpi-label">${escapeHtml(title)}</div><div class="pkpi-value">${escapeHtml(text)}</div></div>`).join('')}</div><div class="pcard"><h4>Executive Decision</h4><p>${escapeHtml(e.name)} is the current structural fit based on your answers.</p></div><div class="pcard"><h4>Important limitation</h4><p>Preliminary decision support only. Verify current law and applicable requirements before acting.</p></div><div class="pcard"><h4>${premium ? 'Official website' : 'Full report: Rs. 49'}</h4><p>https://www.bizmatrix.in/</p><p>${APP_CONFIG.supportEmail}</p></div></div></div>`
    + section('Executive Summary' + suffix, cards(summary) + printGate(summary, 'summary items') + cards(overview) + printGate(overview, 'executive summary items') + cards({visibleItems: decisionDrivers.visibleItems.map((text, i) => [`Decision driver ${i + 1}`, text])}) + printGate(decisionDrivers, 'decision drivers'))
    + section('How We Decided', decisionPrintHtml())
    + section('Assessment Inputs', `<div class="print-grid2">${ALLQ.filter(q => !qSkipped(q, state.answers)).map(q => `<div class="pcard"><h4>${escapeHtml(q.cat)}</h4><p>${escapeHtml(optionLabel(q, state.answers[q.id]))}</p></div>`).join('')}</div>`)
    + section('Detailed Analysis' + suffix, cards(analysis) + printGate(analysis, 'analysis items'))
    + section('Alternative Structures' + suffix, (alternatives.totalItems ? cards({visibleItems: alternatives.visibleItems.map(([key]) => [ENTITIES[key].name, ENTITIES[key].best])}) : '<p>No structurally compatible alternative.</p>') + printGate(alternatives, 'alternative structures'))
    + section('Document Checklist' + suffix, `<div class="print-grid2">${docs.visibleItems.map(doc => `<div class="pcard"><h4>${escapeHtml(doc.group)}</h4><p>${state.docs[doc.id] ? '[Done]' : '[ ]'} ${escapeHtml(docText(doc.item))}</p></div>`).join('')}</div>` + printGate(docs, 'documents'))
    + section('Compliance' + suffix, `<table class="print-table"><thead><tr><th>Category</th><th>Timing</th><th>Obligation</th><th>Action</th>${premium ? '<th>Applicability</th><th>Control</th>' : ''}</tr></thead><tbody>${comp.visibleItems.map(x => `<tr>${(premium ? [x[0], x[1], x[2], x[3], x[4] || 'Subject to applicable conditions.', x[5] || 'Verify current requirements.'] : [x[0], x[1], x[2], x[3]]).map(text => `<td>${escapeHtml(text)}</td>`).join('')}</tr>`).join('')}</tbody></table>` + printGate(comp, 'compliance obligations'))
    + section('Registrations' + suffix, RG.printHtml())
    + section('Entity Matrix' + suffix, `<table class="print-table"><thead><tr>${MATRIX_COLUMNS.map(x => `<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>${matrix.visibleItems.map(row => `<tr>${row.map(x => `<td>${escapeHtml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>` + printGate(matrix, 'comparison rows'))
    + section('Action Plan' + suffix, cards(actions) + printGate(actions, 'action steps'));
}

function renderConflict() {
  document.getElementById('printReport').innerHTML = '';
  document.getElementById('printBtn').disabled = true;
  ['heroTitle', 'recTitle'].forEach(id => { document.getElementById(id).textContent = 'Compatibility Check Required'; });
  ['heroDesc', 'recDesc', 'executive'].forEach(id => { document.getElementById(id).textContent = ((state.rec && state.rec.message) || 'Your answers do not produce a compatible structure.') + ' Start a new assessment to review them, or talk to a professional.'; });
  const wr = document.getElementById('whyResult'); if (wr) wr.innerHTML = '';
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

/* ---- "Why this result" (Rulebook Part F: exclusions, factor breakdown, confidence, review flags) ---- */
function factorRows() {
  const r = state.rec.engine; if (!r || !r.breakdown) return [];
  const top = r.verdict, ru = r.runner_up;
  return BizEngine.FACTORS.map(f => ({ id: f.id, name: f.name, weight: f.weight, basis: f.basis, top: r.breakdown[top][f.id] / 10, ru: ru ? r.breakdown[ru][f.id] / 10 : null }));
}
function exclusionRows() {
  const r = state.rec.engine; if (!r) return [];
  return Object.entries(r.excluded || {}).map(([e, ids]) => ({ e: BizEngine.NAME[e], ids, plain: BizEngine.RULES[ids[0]].plain, cite: ids.map(id => BizEngine.RULES[id].cite).join('; ') }));
}
function renderWhyResult() {
  let host = document.getElementById('whyResult');
  if (!host) { host = document.createElement('div'); host.id = 'whyResult'; host.className = 'why-result'; const anchor = document.getElementById('overviewCards'); anchor.parentNode.insertBefore(host, anchor); }
  const r = state.rec.engine, flags = reviewFlags(), rows = factorRows(), ex = exclusionRows();
  const ru = r.runner_up ? BizEngine.NAME[r.runner_up] : null;
  const talk = flags.length || state.rec.confidence === 'near-tie';
  host.innerHTML = (talk ? `<div class="card talk-pro" role="note"><div><b>Talk to a professional before acting.</b><p>${state.rec.confidence === 'near-tie' ? 'The top two structures are within 5 points. Compare both below. ' : ''}${flags.filter(f => f !== 'TIE').length ? 'Your answers raise points that depend on your specific facts:' : ''}</p>${flags.filter(f => f !== 'TIE').length ? '<ul>' + flags.filter(f => f !== 'TIE').map(id => `<li><b>${id}</b> ${escapeHtml(BizEngine.RULES[id].plain)} <span class="cite">${escapeHtml(BizEngine.RULES[id].cite)}</span></li>`).join('') + '</ul>' : ''}</div><a class="btn primary" href="../contact/">Talk to a professional</a></div>` : '')
  + `<div class="card why-card"><div class="why-head"><h3>Why this result?</h3><span class="why-meta">Hard rules first, then 9 weighted factors · Rulebook v${BizEngine.VERSION}, law verified ${BizEngine.VERIFIED}</span></div>`
  + (rows.length ? `<div class="fx-legend"><span><i class="fx-a"></i>${escapeHtml(BizEngine.NAME[r.verdict])}</span>${ru ? `<span><i class="fx-b"></i>${escapeHtml(ru)}</span>` : ''}</div><div class="fx-list">${rows.map(f => `<div class="fx-row"><div class="fx-name">${escapeHtml(f.name)} <small>w${f.weight} · ${f.basis}</small></div><div class="fx-bars"><div class="fx-bar"><span class="fx-a" style="width:${f.top / f.weight * 100}%"></span></div>${f.ru !== null ? `<div class="fx-bar"><span class="fx-b" style="width:${f.ru / f.weight * 100}%"></span></div>` : ''}</div><div class="fx-val">${f.top.toFixed(1)}${f.ru !== null ? ' / ' + f.ru.toFixed(1) : ''}</div></div>`).join('')}</div>` : '<p class="why-only">Only one structure passed the legal hard rules, so no weighted score is shown: a score with no competitor measures nothing.</p>')
  + (ex.length ? `<h4 class="why-sub">Ruled out by law or regulation</h4><ul class="why-ex">${ex.map(x => `<li><b>${escapeHtml(x.e)}</b> <span class="rid">${x.ids.join(', ')}</span><br>${escapeHtml(x.plain)} <span class="cite">${escapeHtml(x.cite)}</span></li>`).join('')}</ul>` : '')
  + `<p class="why-disc">Structured decision support based on the law as verified on ${BizEngine.VERIFIED}. Not legal, tax or professional advice for your specific facts. <a href="../methodology/">How we decide</a></p></div>`;
}
function decisionPrintHtml() {
  const r = state.rec.engine, rows = factorRows(), ex = exclusionRows(), flags = reviewFlags();
  const ru = r.runner_up ? BizEngine.NAME[r.runner_up] : null;
  let h = `<div class="pcard"><h4>Result</h4><p>${escapeHtml(BizEngine.NAME[r.verdict])}: ${escapeHtml(confidenceLabel())}${r.margin != null ? ` (margin ${r.margin} points over ${escapeHtml(ru)})` : ''}. Engine v${BizEngine.VERSION}, law verified ${BizEngine.VERIFIED}.</p></div>`;
  if (rows.length) h += `<table class="print-table"><thead><tr><th>Factor</th><th>Weight</th><th>Basis</th><th>${escapeHtml(BizEngine.NAME[r.verdict])}</th>${ru ? `<th>${escapeHtml(ru)}</th>` : ''}</tr></thead><tbody>${rows.map(f => `<tr><td>${escapeHtml(f.name)}</td><td>${f.weight}</td><td>${f.basis}</td><td>${f.top.toFixed(1)}</td>${ru ? `<td>${f.ru.toFixed(1)}</td>` : ''}</tr>`).join('')}</tbody></table>`;
  if (ex.length) h += `<table class="print-table"><thead><tr><th>Structure</th><th>Rule</th><th>Reason</th><th>Citation</th></tr></thead><tbody>${ex.map(x => `<tr><td>${escapeHtml(x.e)}</td><td>${x.ids.join(', ')}</td><td>${escapeHtml(x.plain)}</td><td>${escapeHtml(x.cite)}</td></tr>`).join('')}</tbody></table>`;
  if (flags.length) h += `<div class="pcard"><h4>Talk to a professional</h4><ul>${flags.map(id => `<li>${id}: ${escapeHtml(BizEngine.RULES[id].plain)}</li>`).join('')}</ul></div>`;
  return h;
}
