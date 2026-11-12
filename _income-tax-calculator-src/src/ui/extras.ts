// Pieces shared by every computation sheet: disclaimer, quick-jump strip, sticky summary bar and the print layout.

export const DISCLAIMER_TITLE = 'Beta: not tax advice';
export const DISCLAIMER =
  'This calculator is in beta: its rates and rules are under professional review, so treat every figure as an estimate. ' +
  'It is for general information only and is not tax, legal or financial advice. ' +
  'Results depend on the figures you enter and may not reflect your full circumstances or later changes in law. ' +
  'Consult a qualified Chartered Accountant before filing, paying tax or making any decision. ' +
  'Biz Matrix accepts no liability for any loss arising from its use.';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const disclaimerHtml = (compact = false) =>
  `<aside class="disclaimer ${compact ? 'compact' : ''}" role="note"><b>${esc(DISCLAIMER_TITLE)}</b><p>${esc(DISCLAIMER)}</p></aside>`;

/** Legend and quick links at the top of a sheet. */
export function sheetGuide(sections: [id: string, label: string][]): string {
  return `<div class="sheet-guide no-print">
      <p class="legend"><span class="key-in">₹</span> Type your figures in the shaded boxes. <span class="key-out">123</span> Figures in plain text are worked out for you.</p>
      <nav class="jump" aria-label="Jump to section">${sections.map(([id, l]) => `<a href="#h-${id}" data-jump="h-${id}">${esc(l)}</a>`).join('')}</nav>
    </div>`;
}

/** Sticky bar at the bottom of the screen with the running result. */
export const summaryBarHtml = () => '<div class="sumbar no-print" id="sumbar" role="status" aria-live="polite"></div>';

export function setSummaryBar(root: HTMLElement, html: string): void {
  const bar = root.querySelector('#sumbar') as HTMLElement | null;
  if (bar) bar.innerHTML = html;
}

/** Smooth scroll for the quick-jump links (the sticky header would otherwise cover the heading). */
export function handleJump(target: HTMLElement): boolean {
  const a = target.closest<HTMLElement>('[data-jump]');
  if (!a) return false;
  const el = document.getElementById(a.dataset.jump as string);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  return true;
}

// ───────────────────────── print

/** Turn the live sheet into a clean, read-only table: entries become text, controls and empty lines go. */
function cleanTable(src: HTMLTableElement): HTMLTableElement {
  const t = src.cloneNode(true) as HTMLTableElement;
  t.className = 'pv-table';
  t.querySelectorAll('.no-print, tr.adder, tr.mode-row, button, .qhelp, .opt, .row-del').forEach((e) => e.remove());
  t.querySelectorAll('input[type=checkbox]').forEach((cb) => {
    const label = cb.closest('label');
    const on = (cb as HTMLInputElement).checked;
    if (label) { if (on) label.replaceWith(Object.assign(document.createElement('span'), { className: 'pv-tick', textContent: `✓ ${label.textContent?.trim() ?? ''}` })); else label.remove(); }
  });
  t.querySelectorAll('select').forEach((s) => {
    const sel = s as HTMLSelectElement;
    s.replaceWith(Object.assign(document.createElement('span'), { className: 'pv-val', textContent: sel.selectedOptions[0]?.text ?? '' }));
  });
  t.querySelectorAll('input, textarea').forEach((i) => {
    const v = (i as HTMLInputElement).value.trim();
    const span = document.createElement('span');
    span.className = (i as HTMLElement).classList.contains('txt') ? 'pv-name' : 'pv-val';
    span.textContent = v || ((i as HTMLElement).classList.contains('txt') ? ((i as HTMLInputElement).placeholder ?? '') : '');
    i.replaceWith(span);
  });
  // Drop lines that carry no figure at all.
  const empty = (td: Element) => {
    const s = td.textContent?.replace(/[\s₹]/g, '') ?? '';
    return s === '' || s === '0' || s === '—' || s === '(0)';
  };
  t.querySelectorAll('tr').forEach((tr) => {
    if (tr.classList.contains('head') || tr.classList.contains('sub') || tr.classList.contains('total')) return;
    const cells = Array.from(tr.children);
    if (cells.length > 1 && cells.slice(1).every(empty) && !tr.querySelector('.pv-tick')) tr.remove();
  });
  // Drop sub-headings left with nothing under them, and heads of sections that are empty and nil.
  const rows = () => Array.from(t.querySelectorAll('tr'));
  rows().forEach((tr, i, all) => {
    const next = all[i + 1];
    // A sub-heading must be followed by at least one unit or detail line.
    if (tr.classList.contains('sub') && !(next && (next.classList.contains('item') || next.classList.contains('indent')))) tr.remove();
  });
  rows().forEach((tr, i, all) => {
    const next = all[i + 1];
    if (tr.classList.contains('head') && Array.from(tr.children).slice(1).every(empty) && (!next || next.classList.contains('head') || next.classList.contains('total'))) tr.remove();
  });
  t.querySelectorAll('tr.item').forEach((tr) => {
    // A unit heading (employer, property, business) with no figures under it.
    const next = tr.nextElementSibling;
    if (!next || !next.classList.contains('indent')) {
      if (Array.from(tr.children).slice(1).every(empty)) tr.remove();
    }
  });
  return t;
}

export interface PrintInfo {
  title: string;
  details: [string, string][];
  /** Extra sections (comparison, MAT/AMT, advance tax) as HTML, already formatted. */
  extraHtml: string;
}

/** Build the print layout from the live sheet, print it, then remove it. */
export function printSheet(root: HTMLElement, info: PrintInfo): void {
  const table = root.querySelector('#sheet table') as HTMLTableElement | null;
  if (!table) { window.print(); return; }
  document.getElementById('print-root')?.remove();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const wrap = document.createElement('div');
  wrap.id = 'print-root';
  wrap.innerHTML = `
    <header class="pv-head">
      <img src="assets/bizmatrix-logo.png" alt="Biz Matrix" class="pv-logo"/>
      <div class="pv-head-r"><p class="pv-kicker">Computation of Total Income</p><p class="pv-sub">Tax Year 2026-27 · Income-tax Act, 2025</p></div>
    </header>
    <h1 class="pv-title">${esc(info.title)}</h1>
    <dl class="pv-details">${([...info.details, ['Prepared on', today]] as [string, string][]).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <section class="pv-sheet"></section>
    ${info.extraHtml}
    <footer class="pv-foot"><p class="pv-disc"><b>${esc(DISCLAIMER_TITLE)}.</b> ${esc(DISCLAIMER)}</p>
      <p class="pv-meta">Rules version: TY 2026-27, Finance Act 2026 · Amounts in Indian rupees · Generated with the Biz Matrix Income Tax Calculator, bizmatrix.in</p></footer>`;
  (wrap.querySelector('.pv-sheet') as HTMLElement).append(cleanTable(table));
  document.body.append(wrap);
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); wrap.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  // Let the logo load before the print dialog takes its snapshot.
  const img = wrap.querySelector('img') as HTMLImageElement;
  const go = () => window.setTimeout(() => window.print(), 50);
  if (img.complete) go(); else { img.addEventListener('load', go, { once: true }); img.addEventListener('error', go, { once: true }); }
}
