// Live computation sheet for a firm / LLP, a company (private or public) and a Section 8 company.
// Same layout as the individual sheet: heads of income in order, drop-downs to add items, live totals.

import {
  rupees, computeFirm, computeCompany, computeSection8, computeAdvanceTax, partnerRemuneration, partnerInterest,
  type Rules, type Paise, type TraceLine, type EntityResult, type CompanyInput, type FirmInput,
} from '../engine/index.ts';
import {
  esc, P, fmt, sum, money, check, out, del, row, head, sub, colgroup, get, set, traceAmt, parseAmount, type Amt,
} from './sheet.ts';
import {
  businessRows, businessOutputs, businessClick, afterModeChange, booksTotal, presumptiveForEngine, usesPresumptive,
  normalise, freshPresumptive, freshBusiness, type Business, type Presumptive, type BizModes, type BizOptions,
} from './business.ts';
import { disclaimerHtml, sheetGuide, summaryBarHtml, setSummaryBar, handleJump, printSheet } from './extras.ts';

export type EntityKind = 'firm' | 'company_private' | 'company_public' | 'section8';

interface Row { type: string; amount: Amt }

interface EState {
  resident: 'yes' | 'no';
  llp: boolean;
  registeredNpo: '' | 'yes' | 'no';
  regime: 'normal' | 's200' | 's201';
  noTurnover: boolean;
  turnover: Amt;
  spv: boolean;
  presumptive: Presumptive;
  businesses: Business[];
  biz?: BizModes;
  partners: { remPaid: Amt; remNotAllowed: Amt; intPaid: Amt; capital: Amt };
  gains: { stcg196: Amt; stcgOther: Amt; ltcg198: Amt; ltcg197: Amt };
  other: Row[];
  deductions: Row[];
  dividendForS148: Amt;
  dividendDistributed: Amt;
  bookProfit: Amt;
  matCreditBf: Amt;
  amtCreditBf: Amt;
  npo: { regular: Amt; applied: Amt; donationsToNpos: Amt; deemed: Amt; accumulated: Amt; anonymous: Amt; totalDonations: Amt; religious: boolean; otherSpecified: Amt };
  paid: { tds: Amt; advance: Amt; selfAssessment: Amt };
  flags: Record<string, boolean>;
}

interface Item { id: string; label: string; section: string; old?: string; help?: string; firm?: boolean; company?: boolean; normalOnly?: boolean }

const OTHER_SOURCES: Item[] = [
  { id: 'interest', label: 'Interest income (bank, deposits, bonds, refund)', section: 's.92' },
  { id: 'dividend', label: 'Dividends', section: 's.92', help: 'No deduction is allowed against dividend.' },
  { id: 'rental', label: 'Rent from plant, machinery or furniture let out', section: 's.92' },
  { id: 'lottery', label: 'Winnings: lotteries, races, card games, betting', section: 's.194 Sl.1', help: 'Taxed at 30%, no deduction.' },
  { id: 'online', label: 'Net winnings from online games', section: 's.194 Sl.5', help: 'Taxed at 30%.' },
  { id: 'vda', label: 'Income from transfer of virtual digital assets', section: 's.194 Sl.4', help: 'Taxed at 30%.' },
  { id: 'otherIncome', label: 'Any other income', section: 's.92' },
];

const DEDUCTIONS: Item[] = [
  { id: 'donations', label: 'Donations — enter the amount allowable after the s.133 limits', section: 's.133', old: '80G', firm: true, company: true, normalOnly: true },
  { id: 'research', label: 'Donation for scientific research / rural development', section: 's.135', old: '80GGA', firm: true, company: true, normalOnly: true, help: 'Not allowed where there is business income.' },
  { id: 'political', label: 'Contribution to political party / electoral trust (not in cash)', section: 's.137 / 136', old: '80GGB / 80GGC', firm: true, company: true, normalOnly: true },
  { id: 'd146', label: 'Deduction for additional employee cost', section: 's.146', old: '80JJAA', firm: true, company: true },
  { id: 'viiiC', label: 'Profit-linked deductions (Chapter VIII-C, other than s.149)', section: 's.138–152', old: '80-IA to 80RRB', firm: true, company: true, normalOnly: true, help: 'For a firm this triggers the alternate minimum tax check.' },
];

const FLAGS: [string, string][] = [
  ['carriedForwardLosses', 'Brought-forward losses / unabsorbed depreciation to be set off'],
  ['foreignTaxCredit', 'Foreign income, DTAA relief or foreign tax credit'],
  ['unexplainedIncome', 'Income taxable under s.195'],
];

const STORE = 'itc-entity-sheet-v1';
const fresh = (): EState => ({
  resident: 'yes', llp: false, registeredNpo: '', regime: 'normal', noTurnover: false, turnover: undefined, spv: false,
  presumptive: freshPresumptive(),
  businesses: [freshBusiness('business', 1)],
  biz: { presBusiness: false, presProfession: false, books: true },
  partners: { remPaid: undefined, remNotAllowed: undefined, intPaid: undefined, capital: undefined },
  gains: { stcg196: undefined, stcgOther: undefined, ltcg198: undefined, ltcg197: undefined },
  other: [], deductions: [], dividendForS148: undefined, dividendDistributed: undefined,
  bookProfit: undefined, matCreditBf: undefined, amtCreditBf: undefined,
  npo: { regular: undefined, applied: undefined, donationsToNpos: undefined, deemed: undefined, accumulated: undefined, anonymous: undefined, totalDonations: undefined, religious: false, otherSpecified: undefined },
  paid: { tds: undefined, advance: undefined, selfAssessment: undefined },
  flags: {},
});

const states: Partial<Record<EntityKind, EState>> = (() => {
  try { return JSON.parse(localStorage.getItem(STORE) ?? '{}') as Partial<Record<EntityKind, EState>>; } catch { return {}; }
})();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(states)); } catch { /* storage unavailable */ } };

let root: HTMLElement | null = null;
let rules: Rules | null = null;
let kind: EntityKind = 'firm';
let callbacks: { back: () => void; notify: (m: string) => void } = { back: () => undefined, notify: () => undefined };
const st = () => states[kind] as EState;

const isFirm = () => kind === 'firm';
const isNpoSheet = () => kind === 'section8' && st().registeredNpo === 'yes';
const isCompanySheet = () => kind === 'company_private' || kind === 'company_public' || (kind === 'section8' && st().registeredNpo === 'no');
const concessional = () => isCompanySheet() && st().regime !== 'normal';
const rowAmt = (rows: Row[], id: string) => sum(rows.filter((r) => r.type === id).map((r) => P(r.amount)));
/** A firm other than an LLP may use presumptive income (s.58(11)); companies and LLPs use books only. */
const bizOptions = (s: EState): BizOptions => {
  const open = isFirm() && !s.llp;
  return { presBusiness: open, presProfession: open, firmNote: isFirm() };
};

const sel = (path: string, value: string, options: [string, string][]) =>
  `<select class="cell-in" data-s="${path}">${options.map(([v, l]) => `<option value="${v}" ${value === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

function adder(list: 'other' | 'deductions', items: Item[], used: string[], placeholder: string): string {
  const opts = items
    .filter((it) => list === 'other' || ((isFirm() ? it.firm : it.company) && !(concessional() && it.normalOnly) && !used.includes(it.id)))
    .map((it) => `<option value="${it.id}">${esc((it.old ? `${it.section} (${it.old}) — ` : '') + it.label)}</option>`).join('');
  return `<tr class="adder no-print"><td class="p" colspan="4"><select class="add-select" data-add="${list}" aria-label="${esc(placeholder)}"><option value="">+ ${esc(placeholder)}</option>${opts}</select></td></tr>`;
}

// ───────────────────────── partner remuneration and interest (firm)
function partnerFigures(s: EState, R: Rules) {
  const books = booksTotal(s, bizOptions(s));
  const interest = partnerInterest(P(s.partners.capital), 12, P(s.partners.intPaid), 12, R);
  const interestDisallowed = s.partners.capital === undefined ? 0 : interest.disallowed;
  const bookProfit = books + interestDisallowed + P(s.partners.remPaid);
  const rem = partnerRemuneration(bookProfit, P(s.partners.remPaid), R);
  return { books, interestAllowed: interest.maximumAllowable, interestDisallowed, bookProfit, remLimit: rem.maximumAllowable, remDisallowed: rem.disallowed };
}

// ───────────────────────── engine call
type Computed =
  | { status: 'ok'; r: EntityResult; businessIncome: Paise; loss: boolean; partner: ReturnType<typeof partnerFigures> | null; presumptive: boolean }
  | { status: 'npo'; trace: TraceLine[]; warnings: string[]; notes: string[]; taxPayable: Paise | null; blocked: string | null; totalIncome: Paise }
  | { status: 'none'; message: string };

function computeAll(R: Rules): Computed {
  const s = st();
  if (s.resident === 'no') return { status: 'none', message: 'Non-residents are not supported in this version. Change the residential status to continue.' };
  if (kind === 'section8' && s.registeredNpo === '') return { status: 'none', message: 'Answer the registration question to continue.' };

  if (isNpoSheet()) {
    const n = s.npo;
    const r = computeSection8({ registeredNpo: true, resident: true, npo: {
      regularIncome: P(n.regular), appliedForObjects: P(n.applied), donationsToOtherNpos: P(n.donationsToNpos), deemedApplication: P(n.deemed),
      accumulated: P(n.accumulated), anonymousDonations: P(n.anonymous), totalDonationsReceived: P(n.totalDonations), whollyReligious: n.religious,
      otherSpecifiedIncome: P(n.otherSpecified) } }, R);
    if (r.status === 'not_supported') return { status: 'none', message: r.reason };
    if (r.status === 'blocked') return { status: 'npo', trace: r.trace, warnings: r.warnings, notes: [], taxPayable: null, blocked: r.reason, totalIncome: r.taxableRegularIncome + r.specifiedIncome };
    if (!('specifiedIncome' in r)) return { status: 'none', message: 'Unexpected result.' };
    return { status: 'npo', trace: r.trace, warnings: r.warnings, notes: r.notes, taxPayable: r.taxPayable, blocked: null, totalIncome: r.totalIncome };
  }

  const partner = isFirm() ? partnerFigures(s, R) : null;
  const books = partner ? partner.books + partner.interestDisallowed + partner.remDisallowed + P(s.partners.remNotAllowed) : booksTotal(s, bizOptions(s));
  const businessIncome = Math.max(0, books);
  const otherNormal = rowAmt(s.other, 'interest') + rowAmt(s.other, 'rental') + rowAmt(s.other, 'otherIncome') + P(s.gains.stcgOther);
  const common = {
    resident: true, normalIncome: businessIncome + otherNormal, dividend: rowAmt(s.other, 'dividend'),
    stcgListedEquity196: P(s.gains.stcg196), ltcgListedEquity198: P(s.gains.ltcg198), ltcgOther197: P(s.gains.ltcg197),
    winningsAndVda: rowAmt(s.other, 'lottery') + rowAmt(s.other, 'online') + rowAmt(s.other, 'vda'),
  };
  const flags = { carriedForwardLosses: Boolean(s.flags.carriedForwardLosses), foreignTaxCredit: Boolean(s.flags.foreignTaxCredit), unexplainedIncome: Boolean(s.flags.unexplainedIncome) };
  const d = s.deductions;
  let r: EntityResult | { status: 'not_supported'; reason: string };
  if (isFirm()) {
    const input: FirmInput = {
      ...common, isLlp: s.llp,
      presumptive: presumptiveForEngine(s, bizOptions(s)),
      otherDeductions: rowAmt(d, 'donations') + rowAmt(d, 'research') + rowAmt(d, 'political') + rowAmt(d, 'd146'),
      chapterVIIIC: rowAmt(d, 'viiiC'), amtCreditBroughtForward: P(s.amtCreditBf), flags,
    };
    r = computeFirm(input, R);
  } else {
    const input: CompanyInput = {
      ...common, companyType: kind === 'company_public' ? 'public' : 'private', regime: s.regime,
      turnoverTaxYear2024_25: s.noTurnover ? null : P(s.turnover),
      dividendReceivedForS148: P(s.dividendForS148), dividendDistributed: P(s.dividendDistributed),
      deduction146: rowAmt(d, 'd146'),
      otherChapterVIIIDeductions: rowAmt(d, 'donations') + rowAmt(d, 'research') + rowAmt(d, 'political') + rowAmt(d, 'viiiC'),
      matCreditBroughtForward: P(s.matCreditBf), isSpecialPurposeVehicle: s.spv,
      flags: { ...flags, s201NonManufacturingIncome: Boolean(s.flags.s201NonManufacturingIncome) },
      ...(s.regime === 'normal' && s.bookProfit !== undefined ? { bookProfit: P(s.bookProfit) } : {}),
    };
    r = computeCompany(input, R);
  }
  if (r.status !== 'ok') return { status: 'none', message: r.reason };
  return { status: 'ok', r, businessIncome, loss: books < 0, partner, presumptive: usesPresumptive(s, bizOptions(s)) };
}

const titleOf = (s: EState) => isFirm() ? (s.llp ? 'Limited liability partnership' : 'Partnership firm')
  : kind === 'section8' ? 'Section 8 company' : kind === 'company_public' ? 'Public limited company' : 'Private limited company';

// ───────────────────────── layout
function businessBlock(s: EState, rows: string[]): void {
  if (rules) rows.push(...businessRows(s, bizOptions(s), rules));
  if (isFirm() && (normalise(s).books || s.llp)) {
    rows.push(sub('Partners — remuneration and interest (s.35(e))'));
    rows.push(row('Interest to partners debited to P &amp; L a/c', money('partners.intPaid', s.partners.intPaid), '', '', 'indent'));
    rows.push(row('Partners\' capital on which interest is paid (full year)', money('partners.capital', s.partners.capital), '', '', 'indent'));
    rows.push(row('Interest allowable at 12% simple per annum (s.35(e)(iv))', '', out('p.intAllowed'), '', 'indent muted'));
    rows.push(row('Add: interest to partners in excess of the limit', '', out('p.intDis'), '', 'indent'));
    rows.push(row('Remuneration to working partners debited (authorised by the deed)', money('partners.remPaid', s.partners.remPaid), '', '', 'indent'));
    rows.push(row('Book profit for remuneration (s.35(e)(v)(A))', '', out('p.bookProfit'), '', 'indent muted'));
    rows.push(row('Maximum remuneration allowable (s.35(e)(iii))', '', out('p.remLimit'), '', 'indent muted'));
    rows.push(row('Add: remuneration in excess of the limit', '', out('p.remDis'), '', 'indent'));
    rows.push(row('Add: remuneration to non-working partners / not authorised by the deed (s.35(e)(i), (ii))', money('partners.remNotAllowed', s.partners.remNotAllowed), out('p.remNot'), '', 'indent'));
  }
}

function sheetHtml(): string {
  const s = st();
  const rows: string[] = [];
  const title = titleOf(s);

  // ── Assessee
  rows.push(`<tr class="colheads"><td class="p">Particulars</td><td class="i">Your entry</td><td class="a">Working</td><td class="t">Amount</td></tr>`);
  rows.push(head('Assessee', '', 'assessee'));
  rows.push(row('Residential status', sel('resident', s.resident, [['yes', 'Resident'], ['no', 'Non-resident']])));
  if (isFirm()) rows.push(row('Constitution', sel('llp', s.llp ? 'yes' : 'no', [['no', 'Partnership firm'], ['yes', 'Limited liability partnership (LLP)']])));
  if (kind === 'section8') {
    rows.push(row('Registered as a non-profit organisation under s.332?', sel('registeredNpo', s.registeredNpo, [['', 'Select'], ['yes', 'Yes — compute under Part XVII-B'], ['no', 'No — tax as a company']]), '', '', 'regime-row'));
  }
  if (isCompanySheet()) {
    rows.push(row('<b>Tax regime</b>', sel('regime', s.regime, [['normal', 'Normal provisions (MAT applies)'], ['s200', 'Section 200 — 22%'], ['s201', 'Section 201 — 15%']]), '', '', 'regime-row'));
    if (s.regime === 'normal') {
      rows.push(row(`Total turnover / gross receipts in tax year 2024-25 (25% up to Rs. 400 crore) ${check('noTurnover', s.noTurnover, 'no turnover that year')}`, s.noTurnover ? '' : money('turnover', s.turnover)));
    } else {
      rows.push(row(check('spv', s.spv, 'Special purpose vehicle referred to in Schedule V, Note 2'), ''));
    }
  }
  if (s.resident === 'no' || (kind === 'section8' && s.registeredNpo === '')) {
    const msg = s.resident === 'no' ? '<div class="banner warn"><strong>Non-residents are not supported.</strong> Change the residential status to continue.</div>' : '';
    return `${top(title)}${msg}<div class="xl-wrap"><table class="xl">${colgroup()}<tbody>${rows.join('')}</tbody></table></div>${footer()}`;
  }

  if (isNpoSheet()) {
    const n = s.npo;
    rows.push(head('Regular income (s.335) and its application', out('h.regular'), 'regular'));
    rows.push(row('Regular income — excluding corpus and anonymous donations', '', money('npo.regular', n.regular)));
    rows.push(row('Applied for the registered purposes in India (s.341(1)(a))', money('npo.applied', n.applied), '', '', 'indent'));
    rows.push(row('Donations to other registered NPOs — counted at 85% (s.341(1)(b))', money('npo.donationsToNpos', n.donationsToNpos), '', '', 'indent'));
    rows.push(row('Deemed application opted u/s 341(5)', money('npo.deemed', n.deemed), '', '', 'indent'));
    rows.push(row('Accumulated or set apart u/s 342', money('npo.accumulated', n.accumulated), '', '', 'indent'));
    rows.push(row('Taxable regular income (s.336)', '', '', out('npo.taxableRegular'), 'total'));
    rows.push(head('Specified income (s.337)', out('h.specified'), 'specified'));
    rows.push(row('Anonymous donations received', money('npo.anonymous', n.anonymous), '', '', 'indent'));
    rows.push(row('Total donations received in the year', money('npo.totalDonations', n.totalDonations), '', '', 'indent'));
    rows.push(row(check('npo.religious', n.religious, 'Created or established wholly for religious purposes'), '', '', '', 'indent'));
    rows.push(row('Other specified income (s.337 Table, Sl. 2 to 13)', money('npo.otherSpecified', n.otherSpecified), '', '', 'indent'));
  } else {
    rows.push(head('Profits and Gains of Business or Profession', out('h.business'), 'business'));
    businessBlock(s, rows);

    rows.push(head('Capital Gains', out('h.gains'), 'gains'));
    rows.push(row('Short-term capital gains — listed equity / equity funds, STT paid (s.196, 20%)', money('gains.stcg196', s.gains.stcg196)));
    rows.push(row('Short-term capital gains — other assets (normal rate)', money('gains.stcgOther', s.gains.stcgOther)));
    rows.push(row('Long-term capital gains — listed equity / equity funds, STT paid (s.198, 12.5% above Rs. 1,25,000)', money('gains.ltcg198', s.gains.ltcg198)));
    rows.push(row('Long-term capital gains — other assets (s.197, 12.5%)', money('gains.ltcg197', s.gains.ltcg197)));

    rows.push(head('Income from Other Sources', out('h.other'), 'other'));
    s.other.forEach((r, i) => {
      const it = OTHER_SOURCES.find((x) => x.id === r.type) as Item;
      rows.push(row(`${del('other', i)}${esc(it.label)} <span class="sec">${esc(it.section)}</span>${it.help ? `<small>${esc(it.help)}</small>` : ''}`, money(`other.${i}.amount`, r.amount), '', '', 'item'));
    });
    rows.push(adder('other', OTHER_SOURCES, [], 'Add income from other sources'));

    rows.push(row('<b>Gross total income</b>', '', '', out('gti'), 'total'));
    rows.push(head(`Deductions under Chapter VIII${concessional() ? ' <span class="tag-new">concessional regime: only s.146 and s.148</span>' : ''}`, out('h.ded'), 'ded'));
    s.deductions.forEach((r, i) => {
      const it = DEDUCTIONS.find((x) => x.id === r.type) as Item;
      if (concessional() && it.normalOnly) return;
      rows.push(row(`${del('deductions', i)}${esc(it.section)}${it.old ? ` (${esc(it.old)})` : ''}: ${esc(it.label)}${it.help ? `<small>${esc(it.help)}</small>` : ''}`, money(`deductions.${i}.amount`, r.amount), '', '', 'item'));
    });
    rows.push(adder('deductions', DEDUCTIONS, s.deductions.map((r) => r.type), 'Add a deduction'));
    if (isCompanySheet()) {
      rows.push(row('s.148 (80M): dividend from companies / business trusts included above', money('dividendForS148', s.dividendForS148), '', '', 'indent'));
      rows.push(row('Dividend distributed at least one month before the return due date', money('dividendDistributed', s.dividendDistributed), out('ded.s148'), '', 'indent'));
    }
    rows.push(row('<b>Total income</b> (rounded off u/s 516)', '', '', out('ti'), 'total'));

    if (isCompanySheet() && s.regime === 'normal') {
      rows.push(head('Minimum alternate tax (s.206(1))', '', 'mat'));
      rows.push(row('Book profit as computed u/s 206(1)(c) to (e)', '', money('bookProfit', s.bookProfit, { placeholder: 'leave blank to skip' })));
    }
  }

  rows.push(head('Tax on total income', out('h.tax'), 'tax'));
  rows.push('</tbody><tbody data-out-rows="tax"></tbody><tbody>');
  rows.push(head('Taxes paid', out('h.paid'), 'paid'));
  rows.push(row('TDS / TCS', money('paid.tds', s.paid.tds)));
  rows.push(row('Advance tax', money('paid.advance', s.paid.advance)));
  rows.push(row('Self-assessment tax paid', money('paid.selfAssessment', s.paid.selfAssessment)));
  if (isFirm()) rows.push(row('AMT credit brought forward', money('amtCreditBf', s.amtCreditBf), '', '', 'muted'));
  if (isCompanySheet()) rows.push(row(`MAT credit brought forward as on 31-3-2026${s.regime === 'normal' ? ' (set off only under s.200 / s.201)' : ''}`, money('matCreditBf', s.matCreditBf), '', '', 'muted'));
  rows.push(row('<b data-out="balance.label">Balance tax payable</b>', '', '', out('balance'), 'total grand'));

  const flagList: [string, string][] = isNpoSheet() ? [] : [...FLAGS, ...(isCompanySheet() && s.regime === 's201' ? [['s201NonManufacturingIncome', 'Income other than from manufacturing (taxed at 22% / 30% under s.201)'] as [string, string]] : [])];
  const flags = flagList.length ? `<details class="flags no-print" ${Object.values(s.flags).some(Boolean) ? 'open' : ''}><summary>Situations not computed in this version — tick any that apply</summary>
    <div class="flag-grid">${flagList.map(([k, l]) => check(`flags.${k}`, Boolean(s.flags[k]), l)).join('')}</div></details>` : '';

  return `${top(title)}<div id="sheet-warnings"></div>
    <div class="xl-wrap" id="sheet"><table class="xl">${colgroup()}<tbody>${rows.join('')}</tbody></table></div>
    ${flags}
    <section class="block" id="alt" hidden><h3 id="alt-title"></h3><div id="alt-body"></div></section>
    <section class="block" id="advance"><h3>Advance tax</h3><div id="advance-body"></div></section>
    <section class="block" id="notes" hidden><h3>Notes</h3><ul class="notes" id="notes-body"></ul></section>
    ${footer()}`;
}

const top = (title: string) => `<div class="sheet-top no-print">
    <div><h2>Computation of total income — ${esc(title)}</h2><p class="lede">Tax Year 2026-27. Type figures straight into the sheet; totals update as you type.</p></div>
    <div class="tools"><button class="btn sm" data-sact="print">Print / Save PDF</button></div>
  </div>
  ${sheetGuide(isNpoSheet() ? [['regular', 'Regular income'], ['specified', 'Specified income'], ['tax', 'Tax']] : [['business', 'Business'], ['gains', 'Capital gains'], ['other', 'Other sources'], ['ded', 'Deductions'], ['tax', 'Tax']])}`;
const footer = () => `${disclaimerHtml()}<div class="actions no-print"><button class="btn quiet" data-sact="back">Change entity</button><button class="btn quiet" data-sact="reset">Clear sheet</button></div>${summaryBarHtml()}`;

// ───────────────────────── live figures
function update(): void {
  if (!root || !rules) return;
  const R = rules;
  const s = st();
  const c = computeAll(R);
  const o: Record<string, string> = {};
  const neg = (p: Paise | null) => (p === null ? '' : fmt(-Math.abs(p)));
  let trace: TraceLine[] = [];
  let warnings: string[] = [];
  let taxPayable: Paise = 0;

  if (c.status === 'none') {
    (root.querySelector('#sheet-warnings') as HTMLElement | null)?.replaceChildren();
    return;
  }

  if (c.status === 'npo') {
    trace = c.trace; warnings = [...c.warnings]; taxPayable = c.taxPayable ?? 0;
    o['h.regular'] = fmt(P(s.npo.regular));
    o['npo.taxableRegular'] = fmt(traceAmt(trace, 'Taxable regular income') ?? 0);
    o['h.specified'] = fmt(traceAmt(trace, 'Specified income') ?? 0);
    if (c.blocked) warnings.unshift(c.blocked);
  } else {
    const r = c.r;
    trace = r.trace; warnings = [...r.warnings]; taxPayable = r.taxPayable;
    if (c.loss) warnings.push('The business shows a loss. Set-off and carry-forward of business losses are not covered; the loss has been ignored.');
    Object.assign(o, businessOutputs(s, trace, R));
    if (c.partner) {
      o['p.intAllowed'] = s.partners.capital === undefined ? '<small>enter capital</small>' : fmt(c.partner.interestAllowed);
      o['p.intDis'] = fmt(c.partner.interestDisallowed);
      o['p.bookProfit'] = fmt(c.partner.bookProfit);
      o['p.remLimit'] = fmt(c.partner.remLimit);
      o['p.remDis'] = fmt(c.partner.remDisallowed);
      o['p.remNot'] = fmt(P(s.partners.remNotAllowed));
    }
    const presumptive = (traceAmt(trace, 'Presumptive business income') ?? 0) + (traceAmt(trace, 'Presumptive professional income') ?? 0);
    o['h.business'] = fmt(c.businessIncome + presumptive);
    o['h.gains'] = fmt(P(s.gains.stcg196) + P(s.gains.stcgOther) + P(s.gains.ltcg198) + P(s.gains.ltcg197));
    o['h.other'] = fmt(sum(s.other.map((x) => P(x.amount))));
    const gti = traceAmt(trace, 'Gross total income') ?? 0;
    o.gti = fmt(gti);
    o['ded.s148'] = neg(traceAmt(trace, 'Less: Inter-corporate dividend deduction'));
    const gi = trace.findIndex((l) => l.label.startsWith('Gross total income'));
    const ti = trace.findIndex((l) => l.label.startsWith('Total income (rounded'));
    const dedTotal = trace.slice(gi + 1, ti).filter((l) => l.label.startsWith('Less:')).reduce((acc, l) => acc + Math.abs(l.amount ?? 0), 0);
    o['h.ded'] = dedTotal ? fmt(-dedTotal) : '0';
    o.ti = fmt(r.totalIncome);

    // MAT / AMT comparison
    const alt = r.alternateTax;
    const altBox = root.querySelector('#alt') as HTMLElement;
    if (alt && (alt.deemedIncome > 0 || alt.creditSetOff > 0)) {
      const k = isFirm() ? 'AMT' : 'MAT';
      altBox.hidden = false;
      (root.querySelector('#alt-title') as HTMLElement).textContent = `${k} comparison`;
      (root.querySelector('#alt-body') as HTMLElement).innerHTML = `<div class="scroll"><table class="sheet compact cmp"><tbody>
        <tr><td>Income-tax under normal provisions (before surcharge and cess)</td><td class="num">${fmt(alt.regularTax)}</td></tr>
        ${alt.deemedIncome > 0 ? `<tr><td>${k === 'MAT' ? 'Book profit' : 'Adjusted total income'}</td><td class="num">${fmt(alt.deemedIncome)}</td></tr>
        <tr><td>${k === 'MAT' ? 'Minimum alternate tax' : 'Alternate minimum tax'} (before surcharge and cess)</td><td class="num">${fmt(alt.alt.tax)}</td></tr>
        <tr class="total"><td>Payable under</td><td class="num">${alt.applies ? k : 'Normal provisions'}</td></tr>` : ''}
        ${alt.creditGenerated > 0 ? `<tr><td>${k} credit carried forward</td><td class="num">${fmt(alt.creditGenerated)}</td></tr>` : ''}
        ${alt.creditSetOff > 0 ? `<tr><td>${k} credit set off this year</td><td class="num">${fmt(alt.creditSetOff)}</td></tr>` : ''}
        </tbody></table></div>${k === 'MAT' && alt.applies ? '<p class="note">MAT is final from this tax year: no credit arises for later years.</p>' : ''}`;
    } else altBox.hidden = true;

    const notes = root.querySelector('#notes') as HTMLElement;
    notes.hidden = r.notes.length === 0;
    (root.querySelector('#notes-body') as HTMLElement).innerHTML = r.notes.map((m) => `<li>${esc(m)}</li>`).join('');
  }

  // tax lines straight from the engine trace
  const start = trace.findIndex((l) => l.label.startsWith('Total income (rounded'));
  const end = trace.findIndex((l) => l.label.startsWith('Tax payable (rounded'));
  const taxLines = start >= 0 ? trace.slice(start + 1, end >= 0 ? end + 1 : undefined) : [];
  const taxBody = root.querySelector('[data-out-rows="tax"]');
  if (taxBody) taxBody.innerHTML = taxLines.length ? taxLines.map((l) => {
    const strong = /^(Income-tax$|Tax liability|Tax payable|AMT payable|MAT payable|Tax on specified)/.test(l.label);
    return `<tr class="${strong ? 'strong' : ''} ${l.amount === null ? 'muted' : ''}"><td class="p">${esc(l.label)}<span class="sec">${esc(l.ref)}</span>${l.note ? `<small>${esc(l.note)}</small>` : ''}</td><td class="i"></td><td class="a">${l.amount === null ? '' : fmt(l.amount)}</td><td class="t">${/^Tax payable/.test(l.label) ? fmt(l.amount ?? 0) : ''}</td></tr>`;
  }).join('') : `<tr class="muted"><td class="p" colspan="4">${c.status === 'npo' && c.blocked ? 'Tax not computed — see the message above.' : 'No tax lines yet.'}</td></tr>`;
  o['h.tax'] = c.status === 'npo' && c.blocked ? '—' : fmt(taxPayable);

  const paid = P(s.paid.tds) + P(s.paid.advance) + P(s.paid.selfAssessment);
  o['h.paid'] = paid ? fmt(-paid) : '0';
  const balance = taxPayable - paid;
  o.balance = c.status === 'npo' && c.blocked ? '—' : fmt(Math.abs(balance));
  o['balance.label'] = balance < 0 ? 'Refund due' : 'Balance tax payable';

  for (const [k, v] of Object.entries(o)) root.querySelectorAll(`[data-out="${k}"]`).forEach((el) => { el.innerHTML = v; });
  const w = root.querySelector('#sheet-warnings') as HTMLElement;
  w.innerHTML = warnings.length ? `<div class="banner warn"><strong>Check before relying on this figure</strong><ul>${warnings.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : '';

  const blocked = c.status === 'npo' && Boolean(c.blocked);
  setSummaryBar(root, blocked
    ? '<div class="sb-verdict">Tax not computed — see the message at the top of the sheet.</div>'
    : `<div class="sb-item win"><span>Tax payable</span><b>₹ ${fmt(taxPayable)}</b></div><div class="sb-item"><span>${balance < 0 ? 'Refund due' : 'Balance payable'}</span><b>₹ ${fmt(Math.abs(balance))}</b></div><a href="#h-tax" class="btn sm" data-jump="h-tax">See tax working</a>`);
  const adv = computeAdvanceTax({ taxPayable, tdsTcs: P(s.paid.tds), presumptive: c.status === 'ok' && c.presumptive }, R);
  (root.querySelector('#advance-body') as HTMLElement).innerHTML = c.status === 'npo' && c.blocked ? '<p class="note">Shown once tax can be computed.</p>' : !adv.liable ? `<p class="note">${esc(adv.reason)}</p>`
    : `<p class="note">${esc(adv.reason)} Tax after TDS/TCS: ₹ ${fmt(adv.netTax)}.</p><div class="scroll"><table class="sheet compact"><thead><tr><th>Due on or before</th><th class="num">Cumulative</th><th class="num">Instalment (₹)</th><th class="num">Cumulative (₹)</th></tr></thead><tbody>
      ${adv.schedule.map((i) => `<tr><td>${esc(i.due)}</td><td class="num">${i.cumulativePct}%</td><td class="num">${fmt(i.instalment)}</td><td class="num">${fmt(i.cumulativeAmount)}</td></tr>`).join('')}</tbody></table></div>`;
}

function render(): void {
  if (!root) return;
  const y = window.scrollY;
  root.innerHTML = sheetHtml();
  update();
  window.scrollTo({ top: y });
}

// ───────────────────────── events

function onInput(ev: Event): void {
  const el = ev.target as HTMLInputElement;
  const s = st();
  if (el.dataset.f) {
    const { value, error } = parseAmount(el.value);
    el.classList.toggle('bad', Boolean(error));
    el.title = error ?? '';
    if (error) return;
    set(s, el.dataset.f, value);
  } else if (el.dataset.t) set(s, el.dataset.t, el.value);
  else return;
  save();
  update();
}

function onChange(ev: Event): void {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  const s = st();
  if (el instanceof HTMLSelectElement && el.dataset.add) {
    if (!el.value) return;
    const list = el.dataset.add === 'other' ? s.other : s.deductions;
    list.push({ type: el.value, amount: undefined });
    save(); render();
    (root?.querySelector(`[data-f="${el.dataset.add}.${list.length - 1}.amount"]`) as HTMLInputElement | null)?.focus();
    return;
  }
  if (el instanceof HTMLSelectElement && el.dataset.s) {
    if (el.dataset.s === 'llp') s.llp = el.value === 'yes';
    else set(s, el.dataset.s, el.value);
    save(); render(); return;
  }
  if (el instanceof HTMLInputElement && el.type === 'checkbox' && el.dataset.c) {
    set(s, el.dataset.c, el.checked);
    if (el.dataset.c.startsWith('biz.')) afterModeChange(s);
    save(); render(); return;
  }
  if (el instanceof HTMLInputElement && el.dataset.f && !el.classList.contains('bad')) {
    const v = get(s, el.dataset.f) as Amt;
    el.value = v === undefined ? '' : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
}

function onClick(ev: Event): void {
  const t = ev.target as HTMLElement;
  const s = st();
  if (handleJump(t)) { ev.preventDefault(); return; }
  const delBtn = t.closest<HTMLElement>('[data-del]');
  if (delBtn) {
    const [list, idx] = (delBtn.dataset.del as string).split('.');
    (s[list as keyof EState] as unknown[]).splice(Number(idx), 1);
    save(); render(); return;
  }
  if (businessClick(s, t)) { save(); render(); return; }
  const push = t.closest<HTMLElement>('[data-push]');
  if (push && push.dataset.push === 'businesses') {
    const k = (push.dataset.kind as 'business' | 'profession') ?? 'business';
    s.businesses.push(freshBusiness(k, s.businesses.filter((b) => b.kind === k).length + 1));
    save(); render(); return;
  }
  const act = t.closest<HTMLElement>('[data-sact]')?.dataset.sact;
  if (act === 'print' && root) {
    const extra = ['#alt', '#advance', '#notes'].map((id) => root?.querySelector(id) as HTMLElement | null)
      .filter((b): b is HTMLElement => Boolean(b) && !b?.hidden)
      .map((b) => `<section class="pv-block"><h2>${esc(b.querySelector('h3')?.textContent ?? '')}</h2>${(b.querySelector('h3')?.nextElementSibling as HTMLElement | null)?.outerHTML ?? ''}</section>`).join('');
    printSheet(root, { title: titleOf(s), details: [['Assessee', titleOf(s)], ['Residential status', 'Resident'], ['Tax year', '2026-27 (1 April 2026 – 31 March 2027)']], extraHtml: extra });
  }
  if (act === 'back') callbacks.back();
  if (act === 'reset' && window.confirm('Clear every figure on this sheet?')) { states[kind] = fresh(); save(); render(); }
}

/** Mount the sheet for a firm, company or Section 8 company. State is kept per entity across mounts and reloads. */
export function mountEntitySheet(el: HTMLElement, k: EntityKind, R: Rules, cb: { back: () => void; notify: (m: string) => void }): void {
  root = el; rules = R; kind = k; callbacks = cb;
  if (!states[k]) states[k] = fresh();
  normalise(states[k] as EState);
  el.addEventListener('input', onInput);
  el.addEventListener('change', onChange);
  el.addEventListener('click', onClick);
  render();
}
