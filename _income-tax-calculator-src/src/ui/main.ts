import './styles.css';
import rulesFile from '../../rules/ty2026-27.json';
import { buildRules, type RawRuleFile } from '../engine/index.ts';
import { ENTITIES, type Entity } from './schema.ts';
import { mountSheet } from './sheet.ts';
import { mountEntitySheet } from './entitySheet.ts';
import { DISCLAIMER, DISCLAIMER_TITLE, disclaimerHtml } from './extras.ts';

const R = buildRules(rulesFile as unknown as RawRuleFile);
const meta = rulesFile.meta as { extracted_on: string; verified_on?: string };

type Screen = 'entity' | 'sheet' | 'not-covered';
const state: { screen: Screen; back: Screen; entity: Entity | null } = { screen: 'entity', back: 'entity', entity: null };

const app = document.getElementById('app') as HTMLElement;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const ICONS: Record<Entity, string> = {
  individual: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  huf: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6M22 20c0-3.3-2.7-6-6-6M8 20c0-2.2 1.8-4 4-4s4 1.8 4 4"/>',
  firm: '<path d="M8 11l3 3 5-6"/><path d="M3 12l4-4 4 3 5-4 5 5-9 9z"/>',
  company_private: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
  company_public: '<path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10l10-6 10 6z"/>',
  section8: '<path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9z"/>',
};
const icon = (e: Entity) => `<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[e]}</svg></span>`;

function entityHtml(): string {
  return `<h2>Who is the tax being computed for?</h2><p class="lede">Tax Year 2026-27 under the Income-tax Act, 2025. Residents only. Each choice opens a computation sheet you fill in directly.</p>
    <div class="options two">${ENTITIES.map((e) => `<button class="option ${state.entity === e.id ? 'on' : ''}" data-entity="${e.id}">${icon(e.id)}<span><b>${esc(e.label)}</b><small>${esc(e.hint)}</small></span></button>`).join('')}</div>
    ${disclaimerHtml(true)}`;
}

function notCoveredHtml(): string {
  const items = [
    'Non-residents, DTAA relief and foreign tax credit', 'Clubbing of income',
    'Set-off and carry-forward of losses (other than current-year house-property loss); business losses are ignored with a warning',
    'Interest for late filing (s.423) and the late-filing fee (s.428)', 'TDS / TCS computation', 'Transfer pricing',
    'Presumptive income from goods carriages (s.58(2) Table Sl.2)',
    'Trusts and institutions other than Section 8 companies', ...R.notCovered,
    'Tax on a registered Section 8 company\'s taxable regular income — the applicable rate has not been confirmed, so only the amounts are shown',
    'Item-wise checking of Schedule XV investments and Schedule III exemptions — aggregate figures are taken as entered',
    'The 10% qualifying limit on donations for firms and companies — enter the allowable amount',
    'Waiver of advance-tax interest for capital gains, winnings, new business income and dividend',
  ];
  return `<h2>Not covered in this version</h2><p class="lede">Where the sheet asks about one of these, ticking it adds a warning to the result. The rest are simply outside what is computed.</p>
    <ul class="notes plain">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    <h3>Assumptions awaiting confirmation</h3><p class="note">The computation uses these readings of the law. Each is a single entry in the rules file and can be changed without touching the code.</p>
    <ul class="notes plain">${(rulesFile.rules as { id: string; desc: string; extract: string }[]).filter((r) => r.id.startsWith('Z-') && /ASSUMED/.test(r.extract)).map((r) => `<li><b>${r.id}</b> ${esc(r.desc)}</li>`).join('')}</ul>
    <div class="actions"><button class="btn quiet" data-nav="close">Back</button></div>`;
}

function render(): void {
  const wide = state.screen !== 'entity';
  document.body.classList.toggle('is-wide', wide);
  const body = state.screen === 'sheet' ? '<div id="sheet-root"></div>' : state.screen === 'not-covered' ? notCoveredHtml() : entityHtml();
  const verified = meta.verified_on ? `, verified on ${esc(meta.verified_on)}` : '';
  app.innerHTML = `<div class="tool-card ${wide ? 'wide' : ''}">
      <div class="tool-top no-print"><span class="tool-name">Income Tax Calculator</span><span class="law-chip">TY 2026-27 · Finance Act 2026</span></div>
      <div class="fade-in">${body}</div>
      <p class="tool-foot">Rules version: TY 2026-27, Finance Act 2026${verified}. Not tax advice — consult a qualified professional before any decision.
        <a href="#calculator" data-nav="not-covered" class="no-print">What is not covered</a></p>
    </div>
    <div class="toast" role="status" hidden></div>`;

  const sheetRoot = document.getElementById('sheet-root');
  if (sheetRoot && state.entity) {
    const cb = { back: () => go('entity'), notify: toast };
    if (state.entity === 'individual' || state.entity === 'huf') mountSheet(sheetRoot, state.entity, R, cb);
    else mountEntitySheet(sheetRoot, state.entity, R, cb);
  }
  const ver = document.getElementById('rules-version');
  if (ver) ver.innerHTML = `<b>${esc(DISCLAIMER_TITLE)}.</b> ${esc(DISCLAIMER)} Rules version: TY 2026-27, Finance Act 2026${verified}.`;
}

function go(screen: Screen): void {
  state.screen = screen;
  render();
  const card = document.getElementById('calculator');
  if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start' });
  const h = app.querySelector('h2') as HTMLElement | null;
  h?.setAttribute('tabindex', '-1');
  h?.focus({ preventScroll: true });
}

/** Short message at the bottom of the screen. Updates only the toast, so the sheet keeps its focus and scroll. */
function toast(message: string): void {
  const t = app.querySelector('.toast') as HTMLElement | null;
  if (!t) return;
  t.textContent = message;
  t.hidden = false;
  window.setTimeout(() => { t.hidden = true; }, 2500);
}

function openNotCovered(ev: Event): void {
  ev.preventDefault();
  if (state.screen !== 'not-covered') state.back = state.screen;
  go('not-covered');
  document.getElementById('calculator')?.scrollIntoView({ block: 'start' });
}

app.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-entity],[data-nav]');
  if (!el) return;
  if (el.dataset.entity) {
    state.entity = el.dataset.entity as Entity;
    go('sheet');
  } else if (el.dataset.nav === 'not-covered') openNotCovered(ev);
  else if (el.dataset.nav === 'close') go(state.back);
});

// The footer link sits outside the calculator card.
document.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-nav="not-covered"]');
  if (el && !app.contains(el)) openNotCovered(ev);
});

render();
