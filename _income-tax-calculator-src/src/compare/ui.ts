import '../ui/styles.css';
import './compare.css';
import rulesFile from '../../rules/ty2026-27.json';
import { buildRules, rupees, type RawRuleFile, type TraceLine } from '../engine/index.ts';
import { compare, compareAcrossProfits, fmt, validate, type BusinessType, type CompareInput, type EntityCard, type RegimeChoice } from './compare.ts';

const R = buildRules(rulesFile as unknown as RawRuleFile);
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const track = (name: string, p: Record<string, unknown> = {}) => (window as unknown as { bmTrack?: (n: string, p?: object) => void }).bmTrack?.(name, p);

/* ---------- money input helpers (₹ with lakh / crore) ---------- */
const parseRs = (s: string): number => { const n = Number(String(s).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? Math.round(n) : 0; };
const groupIN = (n: number): string => { const neg = n < 0, s = String(Math.abs(Math.round(n))); const l3 = s.slice(-3), r = s.slice(0, -3); return (neg ? '-' : '') + (r ? r.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + l3 : l3); };
const words = (n: number): string => { const a = Math.abs(n); if (a >= 1e7) return `₹${+(n / 1e7).toFixed(2)} crore`; if (a >= 1e5) return `₹${+(n / 1e5).toFixed(2)} lakh`; return `₹${groupIN(n)}`; };
const rs = (p: number) => fmt(p).replace('Rs. ', '₹').replace('-Rs. ', '-₹');

interface OwnerState { share: number; other: number; regime: RegimeChoice; capital: number }
const state = {
  type: 'services' as BusinessType, turnover: 10000000, digital: 90, profitMode: 'amount' as 'amount' | 'margin', profit: 2000000, margin: 20,
  owners: [{ share: 50, other: 0, regime: 'auto', capital: 0 }, { share: 50, other: 0, regime: 'auto', capital: 0 }] as OwnerState[],
  extraction: 100, interestPct: 12, presumptive: 'auto' as 'auto' | 'no', companyRegime: 'concessional' as 'concessional' | 'normal',
};
let started = false, viewed = false, lastInput: CompareInput | null = null, lastResult: ReturnType<typeof compare> | null = null;

const profitRs = () => (state.profitMode === 'amount' ? state.profit : Math.round((state.turnover * state.margin) / 100));

function toInput(): CompareInput {
  return {
    businessType: state.type, turnover: rupees(state.turnover), digitalPct: state.digital, profit: rupees(profitRs()),
    owners: state.owners.map((o) => ({ sharePct: o.share, otherIncome: rupees(o.other), regime: o.regime, capital: rupees(o.capital) })),
    extractionPct: state.extraction, partnerInterestPct: state.interestPct, presumptive: state.presumptive, companyRegime: state.companyRegime,
  };
}

/* ---------- form ---------- */
const TYPES: [BusinessType, string, string][] = [
  ['trading', 'Trading', 'Buying and selling goods'], ['manufacturing', 'Manufacturing', 'Making goods'],
  ['services', 'Services', 'Agency, IT, repairs, consulting (not a listed profession)'], ['profession', 'Specified profession', 'Doctor, lawyer, CA, architect, engineer and similar'],
];
const money = (id: string, label: string, val: number, help = '') =>
  `<label class="field" for="${id}"><span class="label">${label}</span><span class="input"><span class="prefix">₹</span><input id="${id}" inputmode="numeric" autocomplete="off" value="${groupIN(val)}" /></span><span class="help" id="${id}-w">${words(val)}${help ? ' · ' + help : ''}</span></label>`;
const pctField = (id: string, label: string, val: number, help = '') =>
  `<label class="field" for="${id}"><span class="label">${label}</span><span class="cmp-range"><input type="range" id="${id}" min="0" max="100" step="5" value="${val}" /><output id="${id}-o">${val}%</output></span>${help ? `<span class="help">${help}</span>` : ''}</label>`;

function ownersHtml(): string {
  const n = state.owners.length;
  return state.owners.map((o, i) => `<div class="cmp-owner"><b>${n === 1 ? 'Owner' : `Owner ${i + 1}`}</b>
    ${n > 1 ? `<label class="field"><span class="label">Share of profit</span><span class="input"><input data-o="share" data-i="${i}" inputmode="decimal" value="${o.share}" /><span class="prefix">%</span></span></label>` : ''}
    <label class="field"><span class="label">Other income this year</span><span class="input"><span class="prefix">₹</span><input data-o="other" data-i="${i}" inputmode="numeric" value="${groupIN(o.other)}" /></span><span class="help">Salary elsewhere, interest, rent. Puts the owner in the right slab.</span></label>
  </div>`).join('');
}
function advancedOwnersHtml(): string {
  return state.owners.map((o, i) => `<div class="cmp-adv-row"><b>${state.owners.length === 1 ? 'Owner' : `Owner ${i + 1}`}</b>
    <label class="field"><span class="label">Tax regime</span><select data-o="regime" data-i="${i}">${[['auto', 'Lower of new / old'], ['new', 'New regime'], ['old', 'Old regime']].map(([v, l]) => `<option value="${v}" ${o.regime === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span class="label">Capital in a firm / LLP</span><span class="input"><span class="prefix">₹</span><input data-o="capital" data-i="${i}" inputmode="numeric" value="${groupIN(o.capital)}" /></span></label>
  </div>`).join('');
}

function renderForm(): void {
  const many = state.owners.length > 1;
  $('cmpForm').innerHTML = `
    <div class="cb-bar">
      <label class="cb-f"><span>Business</span><select id="fType">${TYPES.map(([v, l]) => `<option value="${v}" ${state.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="cb-f cb-money"><span>${state.type === 'profession' ? 'Yearly receipts' : 'Yearly turnover'}</span><span class="cb-in"><i>₹</i><input id="fTurnover" inputmode="numeric" autocomplete="off" value="${groupIN(state.turnover)}" /></span><small id="fTurnover-w">${words(state.turnover)}</small></label>
      <label class="cb-f cb-money cb-key"><span>Yearly profit <em title="Before paying the owners any salary, interest or remuneration">before owners' pay</em></span><span class="cb-in"><i>₹</i><input id="fProfit" inputmode="numeric" autocomplete="off" value="${groupIN(state.profit)}" /></span><small id="fProfit-w">${words(state.profit)}</small></label>
      <label class="cb-f"><span>Owners</span><select id="fOwners">${[1, 2, 3, 4, 5].map((n) => `<option ${state.owners.length === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="cb-f cb-range"><span>Take home <b id="fExtract-o">${state.extraction}%</b></span><input type="range" id="fExtract" min="0" max="100" step="5" value="${state.extraction}" /><small>of profit, the rest stays in the business</small></label>
    </div>
    <details class="cb-more"><summary>More options <small>owners' shares and other income, bank receipts, tax regime, partner capital, company regime</small></summary>
      <div class="cb-more-grid">
        <div class="cb-owners">${state.owners.map((o, i) => `<div class="cb-owner"><b>${many ? `Owner ${i + 1}` : 'Owner'}</b>
          ${many ? `<label class="cb-f"><span>Share</span><span class="cb-in"><input data-o="share" data-i="${i}" inputmode="decimal" value="${o.share}" /><i>%</i></span></label>` : ''}
          <label class="cb-f"><span>Other income</span><span class="cb-in"><i>₹</i><input data-o="other" data-i="${i}" inputmode="numeric" value="${groupIN(o.other)}" /></span></label>
          <label class="cb-f"><span>Regime</span><select data-o="regime" data-i="${i}">${[['auto', 'Best of new/old'], ['new', 'New'], ['old', 'Old']].map(([v, l]) => `<option value="${v}" ${o.regime === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          ${many ? `<label class="cb-f"><span>Capital (firm/LLP)</span><span class="cb-in"><i>₹</i><input data-o="capital" data-i="${i}" inputmode="numeric" value="${groupIN(o.capital)}" /></span></label>` : ''}
        </div>`).join('')}${many ? '<button type="button" class="btn quiet sm" id="fEqual">Split shares equally</button>' : ''}</div>
        <div class="cb-side">
          <label class="cb-f cb-range"><span>Received by bank / online <b id="fDigital-o">${state.digital}%</b></span><input type="range" id="fDigital" min="0" max="100" step="5" value="${state.digital}" /><small>The rest counts as cash (presumptive-tax limits)</small></label>
          <label class="cb-f"><span>Interest on partners' capital</span><span class="cb-in"><input id="fInt" inputmode="decimal" value="${state.interestPct}" /><i>% a year</i></span><small>Capped at ${R.firm.interestPctPerAnnum}%</small></label>
          <label class="cb-f"><span>Presumptive tax</span><select id="fPres"><option value="auto" ${state.presumptive === 'auto' ? 'selected' : ''}>Show where eligible</option><option value="no" ${state.presumptive === 'no' ? 'selected' : ''}>Do not consider</option></select></label>
          <label class="cb-f"><span>Company regime</span><select id="fCo"><option value="concessional" ${state.companyRegime === 'concessional' ? 'selected' : ''}>Concessional 22%</option><option value="normal" ${state.companyRegime === 'normal' ? 'selected' : ''}>Normal, with MAT</option></select></label>
        </div>
      </div>
    </details>
    <p class="error" id="cmpErr" role="alert"></p>`;
  const ft = document.getElementById('fType') as HTMLSelectElement; ft.onchange = () => { state.type = ft.value as BusinessType; renderForm(); changed(); };
  const keepOpen = sessionStorage.getItem('cmpMore') === '1'; const d = $('cmpForm').querySelector('details')!; d.open = keepOpen; d.ontoggle = () => { try { sessionStorage.setItem('cmpMore', d.open ? '1' : '0'); } catch { /* ignore */ } };
  bindForm();
}

function bindForm(): void {
  const f = $('cmpForm');
  f.querySelectorAll<HTMLButtonElement>('[data-type]').forEach((b) => (b.onclick = () => { state.type = b.dataset.type as BusinessType; renderForm(); changed(); }));
  f.querySelectorAll<HTMLButtonElement>('[data-pm]').forEach((b) => (b.onclick = () => { state.profitMode = b.dataset.pm as 'amount' | 'margin'; renderForm(); changed(); }));
  const moneyBind = (id: string, set: (v: number) => void) => {
    const el = document.getElementById(id) as HTMLInputElement | null; if (!el) return;
    el.oninput = () => { const v = parseRs(el.value); set(v); const w = document.getElementById(id + '-w'); if (w) w.textContent = words(v); changed(); };
    el.onblur = () => { el.value = groupIN(parseRs(el.value)); };
  };
  moneyBind('fTurnover', (v) => (state.turnover = Math.max(0, v)));
  moneyBind('fProfit', (v) => (state.profit = v));
  const range = (id: string, set: (v: number) => void, after?: () => void) => {
    const el = document.getElementById(id) as HTMLInputElement | null; if (!el) return;
    el.oninput = () => { set(Number(el.value)); { const o = document.getElementById(id + '-o'); if (o) o.textContent = el.value + '%'; } after?.(); changed(); };
  };
  range('fDigital', (v) => (state.digital = v));
  range('fExtract', (v) => (state.extraction = v));
  void range;//('fMargin', (v) => (state.margin = v), () => { const h = $('fMargin').closest('.field')?.querySelector('.help'); if (h) h.textContent = `= ${words(profitRs())}`; });
  ($('fOwners') as HTMLSelectElement).onchange = (e) => {
    const n = Number((e.target as HTMLSelectElement).value);
    const base = Math.floor((100 / n) * 100) / 100;
    state.owners = Array.from({ length: n }, (_, i) => ({ ...(state.owners[i] || { other: 0, regime: 'auto' as RegimeChoice, capital: 0 }), share: i === n - 1 ? +(100 - base * (n - 1)).toFixed(2) : base }));
    renderForm(); changed();
  };
  const eq = document.getElementById('fEqual'); if (eq) eq.onclick = () => { const n = state.owners.length, b = Math.floor((100 / n) * 100) / 100; state.owners.forEach((o, i) => (o.share = i === n - 1 ? +(100 - b * (n - 1)).toFixed(2) : b)); renderForm(); changed(); };
  f.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-o]').forEach((el) => {
    const i = Number(el.dataset.i), k = el.dataset.o as keyof OwnerState, o = state.owners[i]!;
    const h = () => {
      if (k === 'regime') o.regime = el.value as RegimeChoice;
      else if (k === 'share') o.share = Number(String(el.value).replace(/[^\d.]/g, '')) || 0;
      else (o as unknown as Record<string, number>)[k] = Math.max(0, parseRs(el.value));
      changed();
    };
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', h);
    if (k === 'other' || k === 'capital') el.addEventListener('blur', () => { (el as HTMLInputElement).value = groupIN(parseRs(el.value)); });
  });
  const num = (id: string, set: (v: number) => void) => { const el = document.getElementById(id) as HTMLInputElement | null; if (el) el.oninput = () => { set(Number(el.value) || 0); changed(); }; };
  num('fInt', (v) => (state.interestPct = Math.max(0, v)));
  ($('fPres') as HTMLSelectElement).onchange = (e) => { state.presumptive = (e.target as HTMLSelectElement).value as 'auto' | 'no'; changed(); };
  ($('fCo') as HTMLSelectElement).onchange = (e) => { state.companyRegime = (e.target as HTMLSelectElement).value as 'concessional' | 'normal'; changed(); };
}

let timer = 0;
function changed(): void {
  if (!started) { started = true; track('tool_started', { tool: 'entity_tax_comparison' }); }
  clearTimeout(timer); timer = window.setTimeout(run, 180);
}

/* ---------- results ---------- */
function traceTable(lines: TraceLine[]): string {
  return `<table class="cmp-trace"><tbody>${lines.map((l) => `<tr><td>${esc(l.label)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</td><td class="num">${l.amount === null ? '' : rs(l.amount)}</td><td class="ref">${esc(l.ref || '')}</td></tr>`).join('')}</tbody></table>`;
}

function cardHtml(c: EntityCard, lowest: boolean): string {
  if (!c.available) return `<article class="cmp-card off"><h3>${esc(c.name)}</h3><p class="cmp-na">${esc(c.reason || 'Not available')}</p></article>`;
  return `<article class="cmp-card ${lowest ? 'win' : ''}">
    ${lowest ? '<span class="cmp-badge">Lowest total tax</span>' : ''}
    <h3>${esc(c.name)}</h3>
    <p class="cmp-total"><span>Total tax</span><b>${rs(c.totalTax)}</b></p>
    <dl class="cmp-dl">
      <div><dt>Effective rate</dt><dd>${c.effectiveRatePct.toFixed(2)}%</dd></div>
      <div><dt>Business-level tax</dt><dd>${rs(c.entityTax)}</dd></div>
      <div><dt>Owners' tax</dt><dd>${rs(c.ownerTax)}</dd></div>
      <div><dt>Take-home after tax</dt><dd>${rs(c.takeHome)}</dd></div>
      <div><dt>Left in the business</dt><dd>${rs(c.retained)}</dd></div>
    </dl>
    <p class="cmp-basis">${esc(c.basis)}</p>
    ${c.alternative ? `<p class="cmp-alt">${esc(c.alternative.label)}: ${rs(c.alternative.totalTax)}</p>` : ''}
    ${c.warnings.map((w) => `<p class="cmp-warn">${esc(w)}</p>`).join('')}
    <details class="cmp-calc"><summary>Show calculation</summary>
      ${c.sections.map((s) => `<h4>${esc(s.title)}</h4>${traceTable(s.lines)}`).join('')}
      ${c.notes.length ? `<ul class="cmp-notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    </details>
  </article>`;
}

const COLORS: Record<EntityCard['key'], string> = { proprietor: '#2F6FA3', firm: '#C9A227', company: '#7A3E9D' };
const NAMES: Record<EntityCard['key'], string> = { proprietor: 'Proprietorship', firm: 'Firm / LLP', company: 'Pvt Ltd' };

function chartHtml(x: CompareInput): string {
  const L = 100000;
  const pts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200].map((v) => rupees(v * L));
  const data = compareAcrossProfits(x, pts, R);
  const keys = (['proprietor', 'firm', 'company'] as const).filter((k) => data.some((d) => d.totals[k] !== undefined));
  if (!keys.length) return '';
  const W = 640, H = 300, pl = 64, pr = 16, pt = 16, pb = 40;
  const maxX = pts[pts.length - 1]!, maxY = Math.max(...data.flatMap((d) => keys.map((k) => d.totals[k] ?? 0)), 1);
  const sx = (v: number) => pl + (v / maxX) * (W - pl - pr), sy = (v: number) => H - pb - (v / maxY) * (H - pt - pb);
  const lines = keys.map((k) => `<polyline fill="none" stroke="${COLORS[k]}" stroke-width="2.5" points="${data.map((d) => `${sx(d.profit).toFixed(1)},${sy(d.totals[k] ?? 0).toFixed(1)}`).join(' ')}"/>`).join('');
  // crossover: where the lowest structure changes between consecutive points
  const low = data.map((d) => keys.reduce((a, b) => ((d.totals[b] ?? Infinity) < (d.totals[a] ?? Infinity) ? b : a)));
  const marks: string[] = [];
  for (let i = 1; i < data.length; i++) if (low[i] !== low[i - 1]) {
    const xm = (data[i - 1]!.profit + data[i]!.profit) / 2;
    marks.push(`<line x1="${sx(xm)}" x2="${sx(xm)}" y1="${pt}" y2="${H - pb}" stroke="#9AA0A6" stroke-dasharray="4 4"/><text x="${sx(xm) + 4}" y="${pt + 12}" class="cmp-ax">${NAMES[low[i]!]} lowest from about ${words(data[i]!.profit / 100)}</text>`);
  }
  const yt = [0, 0.25, 0.5, 0.75, 1].map((f) => `<line x1="${pl}" x2="${W - pr}" y1="${sy(maxY * f)}" y2="${sy(maxY * f)}" stroke="var(--line)"/><text x="${pl - 6}" y="${sy(maxY * f) + 4}" text-anchor="end" class="cmp-ax">${words(Math.round((maxY * f) / 100))}</text>`).join('');
  const xt = [5, 50, 100, 150, 200].map((v) => `<text x="${sx(v * L * 100)}" y="${H - pb + 18}" text-anchor="middle" class="cmp-ax">₹${v >= 100 ? v / 100 + ' Cr' : v + 'L'}</text>`).join('');
  const cur = x.profit > 0 && x.profit <= maxX ? `<line x1="${sx(x.profit)}" x2="${sx(x.profit)}" y1="${pt}" y2="${H - pb}" stroke="var(--ink)" stroke-width="1"/><text x="${sx(x.profit) + 4}" y="${H - pb - 6}" class="cmp-ax">your profit</text>` : '';
  const table = `<table class="sr-only"><caption>Total tax by profit</caption><thead><tr><th>Profit</th>${keys.map((k) => `<th>${NAMES[k]}</th>`).join('')}</tr></thead><tbody>${data.map((d) => `<tr><td>${rs(d.profit)}</td>${keys.map((k) => `<td>${d.totals[k] !== undefined ? rs(d.totals[k]!) : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `<figure class="cmp-chart"><figcaption><b>Total tax as profit grows</b> <span>Your other inputs held constant · ₹5 lakh to ₹2 crore</span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of total tax for each structure from 5 lakh to 2 crore profit">${yt}${xt}${marks.join('')}${lines}${cur}</svg>
    <ul class="cmp-legend">${keys.map((k) => `<li><i style="background:${COLORS[k]}"></i>${NAMES[k]}</li>`).join('')}</ul>${table}</figure>`;
}

const ICON: Record<EntityCard['key'], string> = {
  proprietor: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  firm: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6M22 20c0-3.3-2.7-6-6-6M8 20c0-2.2 1.8-4 4-4s4 1.8 4 4"/>',
  company: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
};

/** Side-by-side comparison: one column per structure, one row per figure. */
function tableHtml(cards: EntityCard[], lowest: EntityCard['key'] | null, profit: number): string {
  const avail = cards.filter((c) => c.available);
  const minOf = (f: (c: EntityCard) => number) => Math.min(...avail.map(f));
  const maxOf = (f: (c: EntityCard) => number) => Math.max(...avail.map(f));
  const head = cards.map((c) => `<th scope="col" class="${c.key === lowest && avail.length > 1 ? 'win' : ''} ${c.available ? '' : 'off'}">
      <span class="ct-ico" style="--c:${COLORS[c.key]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[c.key]}</svg></span>
      <b>${esc(c.name)}</b>${c.key === lowest && avail.length > 1 ? '<em class="ct-badge">★ Lowest tax</em>' : ''}</th>`).join('');
  const na = (c: EntityCard) => `<td class="off">${esc(c.reason || 'Not available')}</td>`;
  const row = (label: string, help: string, f: (c: EntityCard) => string, best?: 'min' | 'max', val?: (c: EntityCard) => number, big = false) =>
    `<tr class="${big ? 'big' : ''}"><th scope="row">${label}${help ? `<small>${help}</small>` : ''}</th>${cards.map((c, i) => {
      if (!c.available) return big ? na(c) : '<td class="off">—</td>';
      void i;
      const isBest = best && val && avail.length > 1 && val(c) === (best === 'min' ? minOf(val) : maxOf(val));
      return `<td class="${isBest ? 'best' : ''}">${f(c)}</td>`;
    }).join('')}</tr>`;
  const split = (c: EntityCard) => {
    const p = Math.max(profit, 1), t = (c.totalTax / p) * 100, h = (c.takeHome / p) * 100, r = Math.max(0, 100 - t - h);
    return `<div class="ct-split" title="Tax ${t.toFixed(0)}%, take-home ${h.toFixed(0)}%, kept ${r.toFixed(0)}%"><i class="t" style="width:${t}%"></i><i class="h" style="width:${h}%"></i><i class="r" style="width:${r}%"></i></div>`;
  };
  const calc = (c: EntityCard) => `<details class="cmp-calc"><summary>Show calculation</summary>${c.sections.map((s) => `<h4>${esc(s.title)}</h4>${traceTable(s.lines)}`).join('')}${c.notes.length ? `<ul class="cmp-notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</details>`;
  return `<div class="ct-wrap" role="region" aria-label="Comparison table" tabindex="0"><table class="ct">
    <thead><tr><th scope="col" class="ct-corner">For your profit of <b>${rs(profit)}</b></th>${head}</tr></thead>
    <tbody>
      ${row('Total tax', 'Business tax + owners\' tax', (c) => `<span class="ct-big">${rs(c.totalTax)}</span>`, 'min', (c) => c.totalTax, true)}
      ${row('Effective tax rate', 'Total tax ÷ profit', (c) => `${c.effectiveRatePct.toFixed(1)}%`, 'min', (c) => c.effectiveRatePct)}
      ${row('Where your profit goes', '<span class="ct-key"><i class="t"></i>Tax <i class="h"></i>Take-home <i class="r"></i>Kept</span>', split)}
      ${row('Tax paid by the business', '', (c) => rs(c.entityTax))}
      ${row('Tax paid by the owners', 'Extra tax caused by this business', (c) => rs(c.ownerTax))}
      ${row('Take-home after tax', 'Cash in owners\' hands', (c) => rs(c.takeHome), 'max', (c) => c.takeHome)}
      ${row('Left in the business', '', (c) => rs(c.retained))}
      ${row('How it is paid out', '', (c) => `<span class="ct-small">${esc(c.basis)}</span>`)}
      ${row('Compared with', '', (c) => c.alternative ? `<span class="ct-small">${esc(c.alternative.label)}: <b>${rs(c.alternative.totalTax)}</b></span>` : '<span class="ct-small">—</span>')}
      ${cards.some((c) => c.warnings.length) ? row('Please note', '', (c) => c.warnings.map((w) => `<span class="ct-warn">${esc(w)}</span>`).join('') || '—') : ''}
      ${row('Working', 'Every line with its section', calc)}
    </tbody></table></div>`;
}

function run(): void {
  const x = toInput();
  const errs = validate(x);
  $('cmpErr').textContent = errs.join(' ');
  if (errs.length) return;
  const r = compare(x, R);
  lastInput = x; lastResult = r;
  const avail = r.cards.filter((c) => c.available);
  const win = r.cards.find((c) => c.key === r.lowest);
  const second = avail.filter((c) => c.key !== r.lowest).sort((a, b) => a.totalTax - b.totalTax)[0];
  $('cmpResult').innerHTML = `
    <div class="cmp-head">${win ? `<p class="cmp-kick">For your inputs</p><h2>${esc(win.name)} pays the least tax: ${rs(win.totalTax)}</h2>${second ? `<p>${rs(second.totalTax - win.totalTax)} a year less than ${esc(second.name)}.</p>` : ''}` : '<h2>Enter your figures</h2>'}</div>
    <div class="cb-tiles">${r.cards.map((c) => c.available
      ? `<div class="cb-tile ${c.key === r.lowest && avail.length > 1 ? 'win' : ''}" style="--c:${COLORS[c.key]}"><span class="ct-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[c.key]}</svg></span><p>${esc(c.name)}</p><b>${rs(c.totalTax)}</b><small>total tax · ${c.effectiveRatePct.toFixed(1)}% of profit</small>${c.key === r.lowest && avail.length > 1 ? '<em class="ct-badge">★ Lowest</em>' : (win ? `<i class="cb-more-tax">+${rs(c.totalTax - win.totalTax)} more</i>` : '')}</div>`
      : `<div class="cb-tile off"><span class="ct-ico" style="--c:#9AA0A6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[c.key]}</svg></span><p>${esc(c.name)}</p><b>Not possible</b><small>${esc(c.reason || '')}</small></div>`).join('')}</div>
    <h3 class="cb-sub">Detailed comparison</h3>
    ${tableHtml(r.cards, r.lowest, Math.max(0, x.profit))}
    ${chartHtml(x)}
    <div class="cmp-actions"><button type="button" class="btn quiet sm" id="cmpPdf">Download summary (PDF)</button></div>
    <details class="cmp-asm"><summary>Assumptions</summary><ul>${r.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></details>`;
  $('cmpPdf').onclick = downloadPdf;
  if (!viewed && started) { viewed = true; track('result_viewed', { tool: 'entity_tax_comparison', lowest: r.lowest }); }
}

/* ---------- PDF summary (jsPDF already on the site, loaded on demand) ---------- */
function loadPdfLib(): Promise<void> {
  const w = window as unknown as { jspdf?: unknown };
  if (w.jspdf) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = '../js/pdf.min.js'; s.onload = () => res(); s.onerror = rej; document.head.appendChild(s); });
}
async function downloadPdf(): Promise<void> {
  if (!lastInput || !lastResult) return;
  try { await loadPdfLib(); } catch { window.print(); return; }
  const { jsPDF } = (window as unknown as { jspdf: { jsPDF: new (o: object) => any } }).jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const M = 44, W = doc.internal.pageSize.getWidth();
  const clean = (s: string) => s.replace(/₹/g, 'Rs. ').replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '');
  let y = 54;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('Entity Tax Comparison - Tax Year 2026-27', M, y); y += 18;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100);
  doc.text(clean('Biz Matrix · Illustrative estimate under the Income-tax Act, 2025 as amended by the Finance Act, 2026. Not professional advice.'), M, y); y += 22;
  doc.setTextColor(30);
  const x = lastInput;
  const inputs = [['Business type', x.businessType], ['Turnover / receipts', clean(rs(x.turnover))], ['Received by bank or online', x.digitalPct + '%'], ['Profit before paying owners', clean(rs(x.profit))],
    ['Owners', x.owners.map((o, i) => `#${i + 1}: ${o.sharePct}%, other income ${clean(rs(o.otherIncome))}`).join('; ')], ['Take-home share', x.extractionPct + '%']];
  (doc as any).autoTable({ startY: y, head: [['Input', 'Value']], body: inputs, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [201, 162, 39], textColor: 20 }, margin: { left: M, right: M } });
  y = (doc as any).lastAutoTable.finalY + 16;
  const body = lastResult.cards.map((c) => c.available
    ? [c.name + (c.key === lastResult!.lowest ? ' (lowest)' : ''), clean(rs(c.entityTax)), clean(rs(c.ownerTax)), clean(rs(c.totalTax)), c.effectiveRatePct.toFixed(2) + '%', clean(rs(c.takeHome)), clean(rs(c.retained)), clean(c.basis)]
    : [c.name, '-', '-', '-', '-', '-', '-', clean(c.reason || '')]);
  (doc as any).autoTable({ startY: y, head: [['Structure', 'Business tax', 'Owners tax', 'Total tax', 'Effective', 'Take-home', 'Retained', 'Basis']], body, theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [201, 162, 39], textColor: 20 }, margin: { left: M, right: M } });
  y = (doc as any).lastAutoTable.finalY + 18;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Assumptions', M, y); y += 12;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  for (const a of lastResult.assumptions) { const l = doc.splitTextToSize(clean('- ' + a), W - 2 * M); if (y + l.length * 11 > 800) { doc.addPage(); y = 54; } doc.text(l, M, y); y += l.length * 11 + 2; }
  y += 8; const disc = doc.splitTextToSize(clean('Illustrative estimate for Tax Year 2026-27, not legal, tax or professional advice. Rates are read from the Biz Matrix rules file, which is under professional review. Confirm with a Chartered Accountant before choosing a structure or filing.'), W - 2 * M);
  doc.setTextColor(120); doc.text(disc, M, y);
  doc.save('Biz_Matrix_Entity_Tax_Comparison.pdf');
  track('report_download', { tool: 'entity_tax_comparison' });
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-cta]');
  if (a) track('cta_clicked', { tool: 'entity_tax_comparison', location: a.dataset.cta });
});

renderForm();
run();
