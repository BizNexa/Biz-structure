// "Profits and gains of business or profession" block, shared by the individual/HUF and firm/company sheets.
// The user first picks how the income is worked out; only those blocks are shown.

import type { Rules, Paise, PresumptiveInput, TraceLine } from '../engine/index.ts';
import { pct } from '../engine/money.ts';
import { esc, P, fmt, money, text, del, out, row, sub, span, traceAmt, type Amt } from './sheet.ts';

export interface Business {
  name: string;
  kind: 'business' | 'profession';
  netProfit: Amt;
  inadmissible: Amt;
  bookDep: Amt;
  deductible: Amt;
  itDep: Amt;
  /** Show the four book adjustments (opened by the user, or because one has a value). */
  showAdj?: boolean;
}

export interface Presumptive {
  /** Total business turnover / gross receipts. */
  bTotal?: Amt;
  /** Of which received by banking or online mode (6%). */
  bDigital: Amt;
  /** Kept for sheets saved before bTotal existed; read once and folded into bTotal. */
  bOther?: Amt;
  bCash: Amt;
  bClaimed: Amt;
  pReceipts: Amt;
  pCash: Amt;
  pClaimed: Amt;
}

export interface BizModes { presBusiness: boolean; presProfession: boolean; books: boolean }

export interface BizState { presumptive: Presumptive; businesses: Business[]; biz?: BizModes }

/** Which methods this entity may use. */
export interface BizOptions { presBusiness: boolean; presProfession: boolean; firmNote?: boolean }

export const freshPresumptive = (): Presumptive => ({ bTotal: undefined, bDigital: undefined, bCash: undefined, bClaimed: undefined, pReceipts: undefined, pCash: undefined, pClaimed: undefined });
export const freshBusiness = (kind: 'business' | 'profession', n: number): Business =>
  ({ name: `${kind === 'business' ? 'Business' : 'Profession'}-${n}`, kind, netProfit: undefined, inadmissible: undefined, bookDep: undefined, deductible: undefined, itDep: undefined });

const has = (...xs: Amt[]) => xs.some((x) => x !== undefined && x !== 0);
const hasAdj = (b: Business) => has(b.inadmissible, b.bookDep, b.deductible, b.itDep);

/** Bring an older saved sheet up to date and make sure the method choice exists. */
export function normalise(s: BizState): BizModes {
  const p = s.presumptive;
  if (p.bTotal === undefined && (has(p.bDigital) || has(p.bOther))) p.bTotal = (p.bDigital ?? 0) + (p.bOther ?? 0);
  delete p.bOther;
  if (!s.biz) {
    s.biz = {
      presBusiness: has(p.bTotal, p.bClaimed),
      presProfession: has(p.pReceipts, p.pClaimed),
      books: s.businesses.some((b) => has(b.netProfit) || hasAdj(b)),
    };
  }
  return s.biz;
}

export const adjustedProfit = (b: Business) => P(b.netProfit) + P(b.inadmissible) + P(b.bookDep) - P(b.deductible) - P(b.itDep);

/** Entities with no presumptive option (companies, LLPs) always use books. */
const booksOnly = (opts: BizOptions) => !opts.presBusiness && !opts.presProfession;
const booksOn = (s: BizState, opts: BizOptions) => booksOnly(opts) || normalise(s).books;

/** Book profit of all units, counted only when "books of account" is chosen. */
export function booksTotal(s: BizState, opts: BizOptions): Paise {
  return booksOn(s, opts) ? s.businesses.reduce((a, b) => a + adjustedProfit(b), 0) : 0;
}

/** Engine input for presumptive income, honouring the methods chosen. */
export function presumptiveForEngine(s: BizState, opts: BizOptions): PresumptiveInput | undefined {
  const m = normalise(s);
  const p = s.presumptive;
  const useB = opts.presBusiness && m.presBusiness;
  const useP = opts.presProfession && m.presProfession;
  if (!useB && !useP) return undefined;
  const total = P(p.bTotal);
  const digital = Math.min(P(p.bDigital), total);
  return {
    ...(useB ? { businessDigitalReceipts: digital, businessOtherReceipts: total - digital, businessCashReceipts: P(p.bCash), businessProfitClaimed: P(p.bClaimed) } : {}),
    ...(useP ? { professionReceipts: P(p.pReceipts), professionCashReceipts: P(p.pCash), professionProfitClaimed: P(p.pClaimed) } : {}),
  };
}

/** True when any business or professional income is being computed. */
export function hasBusinessIncome(s: BizState, opts: BizOptions): boolean {
  const m = normalise(s);
  return Boolean((opts.presBusiness && m.presBusiness && has(s.presumptive.bTotal, s.presumptive.bClaimed))
    || (opts.presProfession && m.presProfession && has(s.presumptive.pReceipts, s.presumptive.pClaimed))
    || (booksOn(s, opts) && s.businesses.some((b) => has(b.netProfit) || hasAdj(b))));
}

export const usesPresumptive = (s: BizState, opts: BizOptions) => {
  const m = normalise(s);
  return (opts.presBusiness && m.presBusiness) || (opts.presProfession && m.presProfession);
};

const help = (t: string) => `<span class="qhelp" tabindex="0" title="${esc(t)}" aria-label="${esc(t)}">?</span>`;
const chip = (key: keyof BizModes, on: boolean, title: string, note: string) =>
  `<label class="mode-chip ${on ? 'on' : ''}"><input type="checkbox" data-c="biz.${key}" ${on ? 'checked' : ''}/><b>${esc(title)}</b><small>${esc(note)}</small></label>`;

/** Rows for the block, between the head row and the next head. */
export function businessRows(s: BizState, opts: BizOptions, R: Rules): string[] {
  const m = normalise(s);
  const p = s.presumptive;
  const rows: string[] = [];
  const B = R.presumptive.business;
  const Pr = R.presumptive.profession;

  const chips = [
    opts.presBusiness ? chip('presBusiness', m.presBusiness, 'Presumptive — business', `${B.digitalPct}% / ${B.otherPct}% of turnover (s.58)`) : '',
    opts.presProfession ? chip('presProfession', m.presProfession, 'Presumptive — profession', `${Pr.pct}% of receipts (s.58)`) : '',
    chip('books', m.books, 'Books of account', 'Net profit as per P&L, adjusted'),
  ].join('');
  if (!booksOnly(opts)) rows.push(`<tr class="mode-row no-print"><td class="p" colspan="${span()}"><span class="mode-q">How is this income worked out? <small>Pick one or more.</small></span><div class="mode-chips">${chips}</div></td></tr>`);
  const books = booksOn(s, opts);
  if (!m.presBusiness && !m.presProfession && !books) {
    rows.push(row('<span class="muted-note">Choose a method above to enter business or professional income.</span>', '', '', '', 'muted'));
    return rows;
  }

  if (opts.presBusiness && m.presBusiness) {
    rows.push(sub(`Presumptive business income — s.58(2) Table Sl.1 (old 44AD)`));
    rows.push(row(`Total turnover / gross receipts ${help('All sales or receipts of the business for the tax year.')}`, money('presumptive.bTotal', p.bTotal), '', '', 'indent'));
    rows.push(row(`Of which received through bank, UPI, cheque or online ${help(`Taxed at ${B.digitalPct}%. Include amounts received by the return due date.`)}`, money('presumptive.bDigital', p.bDigital), '', '', 'indent'));
    rows.push(row(`Balance (cash and other modes) — taxed at ${B.otherPct}%`, '', out('pres.bOther'), '', 'indent muted'));
    rows.push(row(`Of which received in cash ${help(`If cash receipts are ${B.cashLimitPct}% of turnover or less, the limit is higher.`)}`, money('presumptive.bCash', p.bCash), out('pres.bLimit'), '', 'indent'));
    rows.push(row(`Actual profit, if higher <span class="opt">optional</span> ${help('Leave blank to offer the presumptive figure.')}`, '', money('presumptive.bClaimed', p.bClaimed), '', 'indent'));
    rows.push(row('Presumptive business income', '', out('pres.business'), '', 'indent strong'));
  }

  if (opts.presProfession && m.presProfession) {
    rows.push(sub(`Presumptive professional income — s.58(2) Table Sl.3 (old 44ADA)`));
    rows.push(row(`Gross receipts from the profession ${help('Legal, medical, engineering, architecture, accountancy, technical consultancy, interior decoration, IT, company secretary and other notified professions (s.62(4)).')}`, money('presumptive.pReceipts', p.pReceipts), '', '', 'indent'));
    rows.push(row(`Of which received in cash ${help(`If cash receipts are ${Pr.cashLimitPct}% of receipts or less, the limit is higher.`)}`, money('presumptive.pCash', p.pCash), out('pres.pLimit'), '', 'indent'));
    rows.push(row(`Actual profit, if higher <span class="opt">optional</span>`, '', money('presumptive.pClaimed', p.pClaimed), '', 'indent'));
    rows.push(row('Presumptive professional income', '', out('pres.profession'), '', 'indent strong'));
  }

  if (books) {
    if (!booksOnly(opts)) rows.push(sub('As per books of account'));
    s.businesses.forEach((b, i) => {
      const open = b.showAdj || hasAdj(b);
      const unit = b.kind === 'business' ? 'profit' : 'income';
      rows.push(row(`${s.businesses.length > 1 ? del('businesses', i) : ''}${text(`businesses.${i}.name`, b.name, b.kind === 'business' ? `Business-${i + 1}` : `Profession-${i + 1}`)}`, '', '', '', 'item'));
      rows.push(row(`Net ${unit} before tax as per P &amp; L a/c${opts.firmNote ? ' (after partners\' remuneration and interest)' : ''} ${help('The figure on the profit and loss account, before income-tax. Enter a loss as 0 — losses are not covered.')}`, '', money(`businesses.${i}.netProfit`, b.netProfit), '', 'indent'));
      if (open) {
        rows.push(row(`Add: expenses not allowed, and income not credited ${help('For example personal expenses, income-tax, penalties, cash payments above limits, unpaid statutory dues.')}`, money(`businesses.${i}.inadmissible`, b.inadmissible), '', '', 'indent'));
        rows.push(row('Add: depreciation charged in the books', money(`businesses.${i}.bookDep`, b.bookDep), '', '', 'indent'));
        rows.push(row(`Less: income taxed elsewhere, and other allowable deductions ${help('For example interest, dividend, rent or capital gains credited to the P&L (shown under their own heads), and expenses allowed but not debited.')}`, money(`businesses.${i}.deductible`, b.deductible), '', '', 'indent'));
        rows.push(row(`Less: depreciation as per the Act (s.33) ${help('Depreciation on the block of assets at the rates in the Rules.')}`, money(`businesses.${i}.itDep`, b.itDep), '', '', 'indent'));
      }
      rows.push(row(`${open ? '' : `<button class="linkbtn no-print" data-adj="${i}">+ Adjustments (disallowances, depreciation)</button>`}Adjusted ${unit} of ${esc(b.name || 'this unit')}`, '', out(`biz.${i}`), '', 'indent strong'));
    });
    rows.push(row('<button class="linkbtn no-print" data-push="businesses" data-kind="business">+ Add another business</button> <button class="linkbtn no-print" data-push="businesses" data-kind="profession">+ Add a profession</button>', '', '', '', 'no-print'));
  }
  return rows;
}

const pill = (ok: boolean, okText: string, badText: string) => `<span class="pill ${ok ? 'ok' : 'bad'}">${esc(ok ? okText : badText)}</span>`;
/** Rupee limit in words: crore from one crore up, otherwise lakh. */
const lakh = (p: Paise) => {
  const lakhs = p / 100 / 100000;
  return lakhs >= 100 ? `${(lakhs / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} crore` : `${lakhs.toLocaleString('en-IN', { maximumFractionDigits: 0 })} lakh`;
};

/** Figures for the data-out cells of the block. */
export function businessOutputs(s: BizState, trace: TraceLine[], R: Rules): Record<string, string> {
  const p = s.presumptive;
  const o: Record<string, string> = {};
  const total = P(p.bTotal);
  const digital = P(p.bDigital);
  o['pres.bOther'] = digital > total ? '<span class="pill bad">more than turnover</span>' : fmt(total - digital);
  const B = R.presumptive.business;
  const bLimit = P(p.bCash) <= pct(total, B.cashLimitPct) ? B.limitLowCash : B.limit;
  o['pres.bLimit'] = total ? pill(total <= bLimit, `within ₹${lakh(bLimit)} limit`, `over ₹${lakh(bLimit)} limit`) : '';
  const Pr = R.presumptive.profession;
  const rec = P(p.pReceipts);
  const pLimit = P(p.pCash) <= pct(rec, Pr.cashLimitPct) ? Pr.limitLowCash : Pr.limit;
  o['pres.pLimit'] = rec ? pill(rec <= pLimit, `within ₹${lakh(pLimit)} limit`, `over ₹${lakh(pLimit)} limit`) : '';
  o['pres.business'] = fmt(traceAmt(trace, 'Presumptive business income') ?? 0);
  o['pres.profession'] = fmt(traceAmt(trace, 'Presumptive professional income') ?? 0);
  s.businesses.forEach((b, i) => { o[`biz.${i}`] = fmt(adjustedProfit(b)); });
  return o;
}

/** Handle the "Adjustments" link and the method chips. Returns true when the sheet must be redrawn. */
export function businessClick(s: BizState, target: HTMLElement): boolean {
  const adj = target.closest<HTMLElement>('[data-adj]');
  if (adj) { const b = s.businesses[Number(adj.dataset.adj)]; if (b) b.showAdj = true; return true; }
  return false;
}

/** After a method chip changes: books switched on with no unit yet gets Business-1. */
export function afterModeChange(s: BizState): void {
  const m = normalise(s);
  if (m.books && s.businesses.length === 0) s.businesses.push(freshBusiness('business', 1));
}
