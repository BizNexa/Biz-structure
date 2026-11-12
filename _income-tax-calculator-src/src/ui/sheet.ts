// Live computation sheet for an individual or HUF, laid out like a CA's computation.
// Every line is worked out under BOTH regimes side by side (new regime u/s 202 and the old regime);
// the comparison and the lower regime are shown at the end.

import {
  rupees, toRupees, computeIndividual, computeAdvanceTax,
  type Rules, type Paise, type IndividualInput, type RegimeResult, type TraceLine, type Regime,
} from '../engine/index.ts';
import { pct, ratio } from '../engine/money.ts';
import {
  businessRows, businessOutputs, businessClick, afterModeChange, booksTotal, presumptiveForEngine, hasBusinessIncome, usesPresumptive,
  normalise, freshPresumptive, freshBusiness, type Business, type Presumptive, type BizModes, type BizOptions,
} from './business.ts';
import { disclaimerHtml, sheetGuide, summaryBarHtml, setSummaryBar, handleJump, printSheet } from './extras.ts';

type Kind = 'individual' | 'huf';
export type Amt = number | undefined; // rupees as typed; converted to paise for the engine

interface Employer { name: string; gross: Amt; exempt: Amt; pt: Amt }
interface SelfOcc { name: string; interest: Amt; higher: boolean }
interface LetOut { name: string; share: Amt; gav: Amt; municipal: Amt; interest: Amt; arrears: Amt }
interface Row { type: string; amount: Amt; flag?: boolean; choice?: string; extra?: Amt }
interface Exempt { desc: string; amount: Amt }

interface SheetState {
  kind: Kind;
  resident: 'yes' | 'no';
  ageBand: 'below60' | '60to79' | '80plus';
  optOutInForce: boolean;
  optOutWithdrawnEarlier: boolean;
  employers: Employer[];
  selfOcc: SelfOcc[];
  letOut: LetOut[];
  presumptive: Presumptive;
  businesses: Business[];
  biz?: BizModes;
  gains: { stcg196: Amt; stcgOther: Amt; ltcg198: Amt; ltcg197: Amt };
  other: Row[];
  deductions: Row[];
  amtCreditBf: Amt;
  paid: { tds: Amt; advance: Amt; selfAssessment: Amt };
  exempt: Exempt[];
  flags: Record<string, boolean>;
}

// ───────────────────────── drop-down catalogues
interface Item { id: string; label: string; section: string; old?: string; only?: Kind; oldRegimeOnly?: boolean; help?: string }

const OTHER_SOURCES: Item[] = [
  { id: 'savings', label: 'Interest on savings bank account', section: 's.92' },
  { id: 'deposit', label: 'Interest on fixed / recurring / post-office deposits', section: 's.92' },
  { id: 'otherInterest', label: 'Other interest (bonds, NSC, KVP, income-tax refund)', section: 's.92' },
  { id: 'dividend', label: 'Dividends', section: 's.92', help: 'No deduction is allowed against dividend.' },
  { id: 'familyPension', label: 'Family pension', section: 's.92, 93(1)(d)', only: 'individual' },
  { id: 'gift', label: 'Gifts / property received without adequate consideration', section: 's.92(2)' },
  { id: 'rental', label: 'Rent from plant, machinery or furniture let out', section: 's.92' },
  { id: 'lottery', label: 'Winnings: lotteries, races, card games, betting', section: 's.194 Sl.1', help: 'Taxed at 30%, no deduction.' },
  { id: 'online', label: 'Net winnings from online games', section: 's.194 Sl.5', help: 'Taxed at 30%. Compute under Rule 135.' },
  { id: 'vda', label: 'Income from transfer of virtual digital assets', section: 's.194 Sl.4', help: 'Taxed at 30%; only cost of acquisition is deductible.' },
  { id: 'otherIncome', label: 'Any other income', section: 's.92' },
];

const DEDUCTIONS: Item[] = [
  { id: 's123', label: 'Life insurance, PF, PPF, ELSS, tuition fees etc. (Schedule XV)', section: 's.123', old: '80C', oldRegimeOnly: true },
  { id: 'pensionOwn', label: 'Own contribution to notified pension scheme (additional)', section: 's.124(3)', old: '80CCD(1B)', only: 'individual', oldRegimeOnly: true },
  { id: 'employerPension', label: 'Employer contribution to notified pension scheme', section: 's.124(1)', old: '80CCD(2)', only: 'individual' },
  { id: 'agniveerOwn', label: 'Own subscription to Agniveer Corpus Fund', section: 's.125(1)', old: '80CCH', only: 'individual', oldRegimeOnly: true },
  { id: 'agniveerGovt', label: 'Central Government contribution to Agniveer Corpus Fund', section: 's.125(2)', old: '80CCH', only: 'individual' },
  { id: 'healthSelf', label: 'Health insurance / medical — self, spouse, children (HUF: members)', section: 's.126', old: '80D', oldRegimeOnly: true },
  { id: 'healthParents', label: 'Health insurance / medical — parents', section: 's.126', old: '80D', only: 'individual', oldRegimeOnly: true },
  { id: 'dependant', label: 'Maintenance of dependant with disability', section: 's.127', old: '80DD', oldRegimeOnly: true },
  { id: 'medical', label: 'Medical treatment of specified diseases', section: 's.128', old: '80DDB', oldRegimeOnly: true },
  { id: 'eduLoan', label: 'Interest on higher-education loan', section: 's.129', old: '80E', only: 'individual', oldRegimeOnly: true },
  { id: 'house130', label: 'Interest on housing loan sanctioned 2016-17', section: 's.130', old: '80EE', only: 'individual', oldRegimeOnly: true },
  { id: 'house131', label: 'Interest on housing loan sanctioned 2019-20 to 2021-22', section: 's.131', old: '80EEA', only: 'individual', oldRegimeOnly: true },
  { id: 'evLoan', label: 'Interest on electric-vehicle loan', section: 's.132', old: '80EEB', only: 'individual', oldRegimeOnly: true },
  { id: 'donFull', label: 'Donations — 100%, no qualifying limit', section: 's.133(1)(a)', old: '80G', oldRegimeOnly: true },
  { id: 'donHalf', label: 'Donations — 50%, no qualifying limit', section: 's.133(1)(b)', old: '80G', oldRegimeOnly: true },
  { id: 'donFullLimit', label: 'Donations — 100%, subject to 10% limit', section: 's.133(2)', old: '80G', oldRegimeOnly: true },
  { id: 'donHalfLimit', label: 'Donations — 50%, subject to 10% limit', section: 's.133(2)', old: '80G', oldRegimeOnly: true },
  { id: 'rent', label: 'Rent paid (no house-rent allowance received)', section: 's.134', old: '80GG', oldRegimeOnly: true },
  { id: 'research', label: 'Donation for scientific research / rural development', section: 's.135', old: '80GGA', oldRegimeOnly: true },
  { id: 'political', label: 'Contribution to political party (not in cash)', section: 's.137', old: '80GGC', oldRegimeOnly: true },
  { id: 'selfDisability', label: 'Person with disability (self)', section: 's.154', old: '80U', only: 'individual', oldRegimeOnly: true },
  { id: 'viiiC', label: 'Profit-linked deductions (Chapter VIII-C, other than s.149)', section: 's.138–152', old: '80-IA to 80RRB', oldRegimeOnly: true, help: 'Triggers the alternate minimum tax check (old regime).' },
];

/** Engine deduction labels, to show the amount allowed against each entered row. */
const ENGINE_LABEL: Record<string, string> = {
  s123: 'Life insurance, PF etc.', pensionOwn: 'Own contribution to pension scheme', employerPension: 'Employer contribution to pension scheme',
  agniveerOwn: 'Own subscription to Agniveer', agniveerGovt: 'Central Government contribution to Agniveer', healthSelf: 'Health insurance / medical — self',
  healthParents: 'Health insurance / medical — parents', dependant: 'Dependant with disability', medical: 'Medical treatment of specified diseases',
  eduLoan: 'Interest on higher-education loan', house130: 'Interest on housing loan (s.130)', house131: 'Interest on housing loan (s.131)',
  evLoan: 'Interest on electric-vehicle loan', rent: 'Rent paid', research: 'Donations for scientific', political: 'Contributions to political parties',
  selfDisability: 'Person with disability', viiiC: 'Chapter VIII-C',
};

const FLAGS: [string, string][] = [
  ['carriedForwardLosses', 'Brought-forward losses to be set off'],
  ['foreignTaxCredit', 'Foreign income, DTAA relief or foreign tax credit'],
  ['agriculturalIncome', 'Net agricultural income above Rs. 5,000'],
  ['landBuildingAcquiredBefore23Jul2024', 'Long-term gain on land or building acquired before 23 July 2024'],
  ['clubbing', 'Income of spouse or minor child to be clubbed'],
  ['unexplainedIncome', 'Income taxable under s.195'],
];

// ───────────────────────── state
const STORE = 'itc-sheet-v1';
const fresh = (kind: Kind): SheetState => ({
  kind, resident: 'yes', ageBand: 'below60', optOutInForce: false, optOutWithdrawnEarlier: false,
  employers: kind === 'individual' ? [{ name: 'Employer-1', gross: undefined, exempt: undefined, pt: undefined }] : [],
  selfOcc: [], letOut: [],
  presumptive: freshPresumptive(),
  businesses: [],
  biz: { presBusiness: false, presProfession: false, books: false },
  gains: { stcg196: undefined, stcgOther: undefined, ltcg198: undefined, ltcg197: undefined },
  other: [], deductions: [], amtCreditBf: undefined,
  paid: { tds: undefined, advance: undefined, selfAssessment: undefined },
  exempt: [], flags: {},
});

const states: Partial<Record<Kind, SheetState>> = (() => {
  try { return JSON.parse(localStorage.getItem(STORE) ?? '{}') as Partial<Record<Kind, SheetState>>; } catch { return {}; }
})();
function save(): void {
  try { localStorage.setItem(STORE, JSON.stringify(states)); } catch { /* storage unavailable: the sheet still works */ }
}

// ───────────────────────── shared helpers (also used by the firm / company sheet and the business block)
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
export const P = (a: Amt): Paise => (a === undefined ? 0 : rupees(a));
export const fmt = (p: Paise) => {
  const r = toRupees(Math.abs(p)).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return p < 0 ? `(${r})` : r;
};
export const sum = (xs: Paise[]) => xs.reduce((a, b) => a + b, 0);

export function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}
export function set(obj: unknown, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop() as string;
  const target = keys.reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as Record<string, unknown>;
  target[last] = value;
}

/**
 * Number of table columns while a sheet is being drawn. The firm / company sheet has 4
 * (particulars | entry | working | total); this sheet has 5 (… | new regime | old regime).
 */
let COLS = 4;
export const span = () => COLS;

export const money = (path: string, value: Amt, opts: { placeholder?: string; disabled?: boolean } = {}) =>
  `<span class="in-wrap"><input class="cell-in num" type="text" inputmode="decimal" data-f="${path}" value="${value === undefined ? '' : esc(value.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}" placeholder="${esc(opts.placeholder ?? '0')}" ${opts.disabled ? 'disabled' : ''} aria-label="${esc(path)}"/></span>`;
export const text = (path: string, value: string, placeholder = '') =>
  `<input class="cell-in txt" type="text" data-t="${path}" value="${esc(value)}" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder || path)}"/>`;
export const check = (path: string, on: boolean, label: string) =>
  `<label class="cell-check"><input type="checkbox" data-c="${path}" ${on ? 'checked' : ''}/> ${esc(label)}</label>`;
export const out = (key: string) => `<span data-out="${key}"></span>`;
export const del = (list: string, i: number) => `<button class="row-del no-print" data-del="${list}.${i}" title="Remove" aria-label="Remove row">×</button>`;

/** One sheet row. With 5 columns the 4th cell is the new regime and `old` the old regime. */
export const row = (label: string, input = '', amount = '', total = '', cls = '', old = '') =>
  COLS === 5
    ? `<tr class="${cls}"><td class="p">${label}</td><td class="i">${input}</td><td class="a">${amount}</td><td class="t">${total}</td><td class="t o">${old}</td></tr>`
    : `<tr class="${cls}"><td class="p">${label}</td><td class="i">${input}</td><td class="a">${amount}</td><td class="t">${total}</td></tr>`;
export const head = (label: string, total: string, id: string, old = '') =>
  COLS === 5
    ? `<tr class="head" id="h-${id}"><td class="p" colspan="3">${label}</td><td class="t">${total}</td><td class="t o">${old}</td></tr>`
    : `<tr class="head" id="h-${id}"><td class="p" colspan="3">${label}</td><td class="t">${total}</td></tr>`;
export const sub = (label: string) => `<tr class="sub"><td class="p" colspan="${COLS}">${label}</td></tr>`;
export const colgroup = () => COLS === 5
  ? '<colgroup><col class="c-p"/><col class="c-i"/><col class="c-a"/><col class="c-t"/><col class="c-t"/></colgroup>'
  : '<colgroup><col class="c-p"/><col class="c-i"/><col class="c-a"/><col class="c-t"/></colgroup>';

export function traceAmt(lines: TraceLine[], prefix: string): Paise | null {
  const l = lines.find((x) => x.label.startsWith(prefix));
  return l && l.amount !== null ? l.amount : null;
}

export function parseAmount(raw: string): { value: Amt; error?: string } {
  const t = raw.replace(/[,\s₹]/g, '');
  if (t === '') return { value: undefined };
  if (t.startsWith('-')) return { value: undefined, error: 'Enter a positive figure. Losses are not covered except as shown.' };
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return { value: undefined, error: 'Digits only.' };
  return { value: Number(t) };
}

/** Share of co-owned property (percent, default 100). */
const shareOf = (lo: LetOut) => (lo.share === undefined ? 100 : lo.share);
const sharePaise = (p: Paise, lo: LetOut) => ratio(p, Math.round(shareOf(lo) * 100), 100 * 100);
const rowAmt = (rows: Row[], id: string) => sum(rows.filter((r) => r.type === id).map((r) => P(r.amount)));
const rowFlag = (rows: Row[], id: string) => rows.some((r) => r.type === id && r.flag);

// ───────────────────────── engine input
/** Presumptive business is open to individuals and HUFs; presumptive profession to individuals only (s.58(11)(b)). */
const bizOptions = (s: SheetState): BizOptions => ({ presBusiness: true, presProfession: s.kind === 'individual' });

function toInput(s: SheetState, R: Rules): { input: IndividualInput; businessLoss: Paise } {
  const ind = s.kind === 'individual';
  const d = s.deductions;
  const nav = sum(s.letOut.map((lo) => sharePaise(Math.max(0, P(lo.gav) - P(lo.municipal)), lo)));
  const soInterest = sum(s.selfOcc.map((so) => Math.min(P(so.interest), so.higher ? R.house.selfOccupiedCapHigher : R.house.selfOccupiedCapLower)));
  const bizOpts = bizOptions(s);
  const books = booksTotal(s, bizOpts);
  const ageMap = { below60: 0, '60to79': R.ages.senior, '80plus': R.ages.superSenior } as const;
  const disability = (id: string) => (d.find((r) => r.type === id)?.choice ?? 'none') as 'none' | 'disability' | 'severe';
  const ep = d.find((r) => r.type === 'employerPension');

  const input: IndividualInput = {
    kind: s.kind, resident: true,
    regimeHistory: { hasBusinessIncome: hasBusinessIncome(s, bizOpts), optOutInForce: s.optOutInForce, optOutWithdrawnEarlier: s.optOutWithdrawnEarlier },
    house: {
      letOutNetAnnualValue: nav, letOutInterest: sum(s.letOut.map((lo) => P(lo.interest))),
      selfOccupiedInterest: soInterest, selfOccupiedHigherLimit: true,
      arrearsRent: sum(s.letOut.map((lo) => P(lo.arrears))),
    },
    businessIncome: Math.max(0, books),
    presumptive: presumptiveForEngine(s, bizOpts),
    other: {
      savingsInterest: rowAmt(s.other, 'savings'), depositInterest: rowAmt(s.other, 'deposit'), dividend: rowAmt(s.other, 'dividend'),
      otherIncome: rowAmt(s.other, 'otherInterest') + rowAmt(s.other, 'gift') + rowAmt(s.other, 'rental') + rowAmt(s.other, 'otherIncome'),
    },
    gains: { stcgListedEquity196: P(s.gains.stcg196), stcgOtherNormalRate: P(s.gains.stcgOther), ltcgListedEquity198: P(s.gains.ltcg198), ltcgOther197: P(s.gains.ltcg197) },
    winnings: { lotteryEtc: rowAmt(s.other, 'lottery'), onlineGames: rowAmt(s.other, 'online'), vda: rowAmt(s.other, 'vda') },
    deductions: {
      s123: rowAmt(d, 's123'), pensionOwn124_3: rowAmt(d, 'pensionOwn'), agniveerOwn: rowAmt(d, 'agniveerOwn'),
      healthSelfFamily: rowAmt(d, 'healthSelf'), healthSelfFamilySenior: rowFlag(d, 'healthSelf'),
      healthParents: rowAmt(d, 'healthParents'), healthParentsSenior: rowFlag(d, 'healthParents'),
      dependantDisability: disability('dependant'), selfDisability: disability('selfDisability'),
      medicalTreatment128: rowAmt(d, 'medical'), medicalTreatmentPatientSenior: rowFlag(d, 'medical'),
      educationLoanInterest: rowAmt(d, 'eduLoan'), housingLoanInterest130: rowAmt(d, 'house130'), housingLoanInterest131: rowAmt(d, 'house131'),
      evLoanInterest: rowAmt(d, 'evLoan'),
      donationsFull: rowAmt(d, 'donFull'), donationsHalf: rowAmt(d, 'donHalf'), donationsFullWithLimit: rowAmt(d, 'donFullLimit'), donationsHalfWithLimit: rowAmt(d, 'donHalfLimit'),
      rentPaid134: rowAmt(d, 'rent'), researchDonations135: rowAmt(d, 'research'), politicalContributions137: rowAmt(d, 'political'),
      chapterVIIIC: rowAmt(d, 'viiiC'),
    },
    amtCreditBroughtForward: P(s.amtCreditBf),
    flags: s.flags,
  };
  if (ind) {
    input.age = ageMap[s.ageBand];
    input.familyPension = rowAmt(s.other, 'familyPension');
    input.salary = {
      gross: sum(s.employers.map((e) => P(e.gross))), exemptAllowancesOldRegime: sum(s.employers.map((e) => P(e.exempt))),
      professionalTax: sum(s.employers.map((e) => P(e.pt))),
      employerPensionContribution: ep ? P(ep.amount) : 0, employerIsGovernment: Boolean(ep?.flag),
      agniveerGovtContribution: rowAmt(d, 'agniveerGovt'),
      ...(ep && ep.extra !== undefined ? { basicPlusDA: P(ep.extra) } : {}),
    };
  }
  return { input, businessLoss: Math.min(0, books) };
}

// ───────────────────────── rendering
let root: HTMLElement | null = null;
let rules: Rules | null = null;
let current: Kind = 'individual';
let callbacks: { back: () => void; notify: (m: string) => void } = { back: () => undefined, notify: () => undefined };
const st = () => states[current] as SheetState;

const OLD_ONLY = '<span class="tag-old" title="Allowed only in the old regime">Old regime only</span>';

const adder = (list: string, items: Item[], used: string[], placeholder: string) => {
  const s = st();
  const opts = items
    .filter((it) => !it.only || it.only === s.kind)
    .filter((it) => list === 'other' || !used.includes(it.id))
    .map((it) => `<option value="${it.id}">${esc((it.old ? `${it.section} (${it.old}) — ` : '') + it.label + (it.oldRegimeOnly ? ' · old regime only' : ''))}</option>`).join('');
  return `<tr class="adder no-print"><td class="p" colspan="${COLS}"><select class="add-select" data-add="${list}" aria-label="${esc(placeholder)}"><option value="">+ ${esc(placeholder)}</option>${opts}</select></td></tr>`;
};
const findItem = (items: Item[], id: string) => items.find((x) => x.id === id) as Item;

function sheetHtml(): string {
  const s = st();
  const ind = s.kind === 'individual';
  const rows: string[] = [];
  COLS = 5;
  try {
    // ── Column headings and assessee
    rows.push(`<tr class="colheads"><td class="p">Particulars</td><td class="i">Your entry</td><td class="a">Working</td><td class="t">New regime<small>s.202 · default</small></td><td class="t o">Old regime<small>if opted out</small></td></tr>`);
    rows.push(head('Assessee', '', 'assessee'));
    rows.push(row('Residential status', `<select class="cell-in" data-s="resident"><option value="yes" ${s.resident === 'yes' ? 'selected' : ''}>Resident</option><option value="no" ${s.resident === 'no' ? 'selected' : ''}>Non-resident</option></select>`));
    if (ind) rows.push(row('Age at any time during the tax year', `<select class="cell-in" data-s="ageBand">${[['below60', 'Below 60 years'], ['60to79', '60 to 79 years'], ['80plus', '80 years or more']].map(([v, l]) => `<option value="${v}" ${s.ageBand === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`));
    if (s.resident === 'no') {
      return `${top(ind)}<div class="banner warn"><strong>Non-residents are not supported.</strong> This version computes tax for residents only. Change the residential status to continue.</div>
        <div class="xl-wrap"><table class="xl xl5">${colgroup()}<tbody>${rows.join('')}</tbody></table></div>${disclaimerHtml()}${bottom()}`;
    }

    // ── Salaries
    if (ind) {
      rows.push(head('Income from Salaries', out('n.salary'), 'salary', out('o.salary')));
      s.employers.forEach((e, i) => {
        rows.push(row(`${s.employers.length > 1 ? del('employers', i) : ''}${text(`employers.${i}.name`, e.name, `Employer-${i + 1}`)}`, '', '', '', 'item'));
        rows.push(row('Gross salary', money(`employers.${i}.gross`, e.gross), '', '', 'indent'));
        rows.push(row(`Exempt allowances (HRA, LTC etc.) ${OLD_ONLY}`, money(`employers.${i}.exempt`, e.exempt), '', '', 'indent'));
        rows.push(row(`Tax on employment (professional tax) ${OLD_ONLY}`, money(`employers.${i}.pt`, e.pt), '', '', 'indent'));
      });
      rows.push(row('<button class="linkbtn no-print" data-push="employers">+ Add another employer</button>', '', '', '', 'no-print'));
      rows.push(row('Total gross salary', '', out('salary.gross'), out('salary.gross'), '', out('salary.gross')));
      rows.push(row('Less: exempt allowances', '', '', '—', '', out('o.salary.exempt')));
      rows.push(row('Less: standard deduction u/s 19 (Table Sl.2)', '', '', out('n.salary.std'), '', out('o.salary.std')));
      rows.push(row('Less: tax on employment u/s 19 (Table Sl.1)', '', '', '—', '', out('o.salary.pt')));
    }

    // ── House property
    rows.push(head('Income from House Property', out('n.house'), 'house', out('o.house')));
    rows.push(sub(`Self-occupied property — interest on housing loan ${OLD_ONLY}`));
    s.selfOcc.forEach((so, i) => {
      rows.push(row(`${del('selfOcc', i)}${text(`selfOcc.${i}.name`, so.name, `Property-${i + 1}`)}`, '', '', '', 'item'));
      rows.push(row(`Interest on borrowed capital u/s 22(1)(b) ${check(`selfOcc.${i}.higher`, so.higher, 'acquired / built within 5 years (₹2 lakh limit)')}`, money(`selfOcc.${i}.interest`, so.interest), '', '—', 'indent', out(`so.${i}`)));
    });
    rows.push(row('<button class="linkbtn no-print" data-push="selfOcc">+ Add self-occupied property</button>', '', '', '', 'no-print'));
    rows.push(sub('Let-out property'));
    s.letOut.forEach((lo, i) => {
      rows.push(row(`${del('letOut', i)}${text(`letOut.${i}.name`, lo.name, `Property-${i + 1}`)}`, `<span class="share">your share %</span>${money(`letOut.${i}.share`, lo.share, { placeholder: '100' })}`, '', '', 'item'));
      rows.push(row('Gross annual value (rent for the year)', money(`letOut.${i}.gav`, lo.gav), '', '', 'indent'));
      rows.push(row('Less: municipal taxes paid', money(`letOut.${i}.municipal`, lo.municipal), '', '', 'indent'));
      rows.push(row('Net annual value — your share', '', out(`lo.${i}.nav`), '', 'indent'));
      rows.push(row('Less: standard deduction 30% u/s 22(1)(a)', '', out(`lo.${i}.std`), '', 'indent'));
      rows.push(row('Less: interest on housing loan u/s 22(1)(b) — your share', money(`letOut.${i}.interest`, lo.interest), '', '', 'indent'));
      rows.push(row('Add: arrears / unrealised rent received u/s 23 (less 30%)', money(`letOut.${i}.arrears`, lo.arrears), out(`lo.${i}.arrears`), '', 'indent'));
      rows.push(row('Income from this property', '', out(`lo.${i}.income`), '', 'indent strong'));
    });
    rows.push(row('<button class="linkbtn no-print" data-push="letOut">+ Add let-out property</button>', '', '', '', 'no-print'));
    rows.push(row('House-property loss set off against other income (s.109(1)(b); not allowed in the new regime)', '', '', out('n.house.setoff'), 'muted', out('o.house.setoff')));

    // ── Business / profession
    rows.push(head('Profits and Gains of Business or Profession', out('n.business'), 'business', out('o.business')));
    if (rules) rows.push(...businessRows(s, bizOptions(s), rules));
    if (hasBusinessIncome(s, bizOptions(s))) {
      rows.push(row(check('optOutInForce', s.optOutInForce, 'An opt-out of the new regime made in an earlier year is still in force'), '', '', '', 'indent'));
      rows.push(row(check('optOutWithdrawnEarlier', s.optOutWithdrawnEarlier, 'An earlier opt-out has already been withdrawn once (old regime no longer available)'), '', '', '', 'indent'));
    }

    // ── Capital gains
    rows.push(head('Capital Gains', out('n.gains'), 'gains', out('o.gains')));
    rows.push(row('Short-term gains — listed shares / equity funds, STT paid (taxed at 20%)', money('gains.stcg196', s.gains.stcg196)));
    rows.push(row('Short-term gains — other assets (taxed at slab rates)', money('gains.stcgOther', s.gains.stcgOther)));
    rows.push(row('Long-term gains — listed shares / equity funds, STT paid (12.5% above ₹1.25 lakh)', money('gains.ltcg198', s.gains.ltcg198)));
    rows.push(row('Long-term gains — other assets such as property, gold, unlisted shares (12.5%)', money('gains.ltcg197', s.gains.ltcg197)));

    // ── Other sources
    rows.push(head('Income from Other Sources', out('n.other'), 'other', out('o.other')));
    s.other.forEach((r, i) => {
      const it = findItem(OTHER_SOURCES, r.type);
      rows.push(row(`${del('other', i)}${esc(it.label)} <span class="sec">${esc(it.section)}</span>${it.help ? `<small>${esc(it.help)}</small>` : ''}`, money(`other.${i}.amount`, r.amount), '', '', 'item'));
    });
    rows.push(adder('other', OTHER_SOURCES, s.other.map((r) => r.type), 'Add income from other sources (interest, dividend, family pension …)'));
    if (s.other.some((r) => r.type === 'familyPension')) rows.push(row('Less: deduction from family pension u/s 93(1)(d)', '', '', out('n.other.fp'), 'muted', out('o.other.fp')));

    // ── GTI, deductions, total income
    rows.push(row('<b>Gross total income</b>', '', '', out('n.gti'), 'total', out('o.gti')));
    rows.push(head('Deductions under Chapter VIII <span class="tag-new">new regime allows only s.124(1) and s.125(2)</span>', out('n.ded'), 'ded', out('o.ded')));
    s.deductions.forEach((r, i) => {
      const it = findItem(DEDUCTIONS, r.type);
      let extra = '';
      if (r.type === 'healthSelf' || r.type === 'healthParents' || r.type === 'medical') extra = check(`deductions.${i}.flag`, Boolean(r.flag), r.type === 'medical' ? 'patient is a senior citizen' : 'insured person is a senior citizen');
      if (r.type === 'employerPension') extra = `${check(`deductions.${i}.flag`, Boolean(r.flag), 'Government employer')} <span class="share">Basic + DA</span>${money(`deductions.${i}.extra`, r.extra)}`;
      const choice = r.type === 'dependant' || r.type === 'selfDisability'
        ? `<select class="cell-in" data-s="deductions.${i}.choice">${[['disability', 'Disability'], ['severe', 'Severe disability']].map(([v, l]) => `<option value="${v}" ${(r.choice ?? 'disability') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`
        : money(`deductions.${i}.amount`, r.amount);
      rows.push(row(`${del('deductions', i)}${esc(it.section)}${it.old ? ` (${esc(it.old)})` : ''}: ${esc(it.label)} ${it.oldRegimeOnly ? OLD_ONLY : ''} ${extra}${it.help ? `<small>${esc(it.help)}</small>` : ''}`, choice, '', out(`n.ded.${i}`), 'item', out(`o.ded.${i}`)));
    });
    rows.push(adder('deductions', DEDUCTIONS, s.deductions.map((r) => r.type), 'Add a deduction (80C, 80D, NPS, home-loan interest, donations …)'));
    rows.push(row('s.153 (80TTA / 80TTB): interest on deposits — worked out from the interest entered above', '', '', '—', 'muted', out('o.ded.s153')));
    rows.push(row('<b>Total income</b> (rounded off u/s 516)', '', '', out('n.ti'), 'total', out('o.ti')));

    // ── Tax
    rows.push(head('Tax on total income', '', 'tax'));
    rows.push(`</tbody><tbody data-out-rows="tax"></tbody><tbody>`);
    rows.push(head('Taxes already paid', out('n.paid'), 'paid', out('o.paid')));
    rows.push(row('TDS / TCS', money('paid.tds', s.paid.tds)));
    rows.push(row('Advance tax', money('paid.advance', s.paid.advance)));
    rows.push(row('Self-assessment tax', money('paid.selfAssessment', s.paid.selfAssessment)));
    rows.push(row(`AMT credit brought forward ${OLD_ONLY}`, money('amtCreditBf', s.amtCreditBf), '', '', 'muted'));
    rows.push(row('<b>Balance tax payable / (refund due)</b>', '', '', out('n.balance'), 'total grand', out('o.balance')));

    // ── Memo
    rows.push(head('Incomes fully exempt (shown for record, not taxed)', '', 'exempt'));
    s.exempt.forEach((x, i) => rows.push(row(`${del('exempt', i)}${text(`exempt.${i}.desc`, x.desc, 'Description, e.g. agricultural income, PPF interest')}`, money(`exempt.${i}.amount`, x.amount), '', '', 'item')));
    rows.push(row('<button class="linkbtn no-print" data-push="exempt">+ Add exempt income</button>', '', '', '', 'no-print'));

    const flags = `<details class="flags no-print" ${Object.values(s.flags).some(Boolean) ? 'open' : ''}><summary>Situations not computed in this version — tick any that apply</summary>
      <div class="flag-grid">${FLAGS.map(([k, l]) => check(`flags.${k}`, Boolean(s.flags[k]), l)).join('')}</div></details>`;

    return `${top(ind)}
      <div id="sheet-warnings"></div>
      <div class="xl-wrap" id="sheet"><table class="xl xl5">${colgroup()}<tbody>${rows.join('')}</tbody></table></div>
      ${flags}
      <section class="block result-block" id="compare"><h3>Which regime is better for you?</h3><div id="compare-body"></div></section>
      <section class="block" id="advance"><h3>Advance tax instalments</h3><div id="advance-body"></div></section>
      ${disclaimerHtml()}
      ${bottom()}`;
  } finally {
    COLS = 4;
  }
}

const top = (ind: boolean) => `<div class="sheet-top no-print">
    <div><h2>Computation of total income — ${ind ? 'Individual' : 'Hindu Undivided Family'}</h2>
      <p class="lede">Tax Year 2026-27. Enter your figures once; every line is worked out under both the new and the old regime, and the comparison is at the end.</p></div>
    <div class="tools"><button class="btn sm" data-sact="print">Print / Save PDF</button></div>
  </div>
  ${sheetGuide([['salary', 'Salary'], ['house', 'House property'], ['business', 'Business'], ['gains', 'Capital gains'], ['other', 'Other sources'], ['ded', 'Deductions'], ['tax', 'Tax'], ['compare', 'Comparison']].filter(([id]) => ind || id !== 'salary') as [string, string][])}`;
const bottom = () => `<div class="actions no-print"><button class="btn quiet" data-sact="back">Change entity</button><button class="btn quiet" data-sact="reset">Clear sheet</button></div>${summaryBarHtml()}`;

// ───────────────────────── live figures
interface TaxLine { label: string; ref: string; n: Paise | null; o: Paise | null; cls?: string }

function taxLines(n: RegimeResult, o: RegimeResult, oldAllowed: boolean, R: Rules): TaxLine[] {
  const ln = n.liability;
  const lo = o.liability;
  const lines: TaxLine[] = [];
  const both = (label: string, ref: string, fn: (r: RegimeResult) => Paise, cls = '', always = false) => {
    const a = fn(n); const b = fn(o);
    if (always || a !== 0 || b !== 0) lines.push({ label, ref, n: a, o: b, cls });
  };
  both('Tax at slab rates on income taxed at normal rates', 'New s.202(1) · Old First Sch. Part I-B', (r) => r.liability.base.slabTax, '', true);
  both(`Tax on short-term gains u/s 196 @ ${R.special.stcg196Pct}%`, 's.196', (r) => r.liability.base.t196);
  both(`Tax on long-term gains u/s 197 @ ${R.special.ltcg197Pct}%`, 's.197', (r) => r.liability.base.t197);
  both(`Tax on long-term gains u/s 198 @ ${R.special.ltcg198Pct}% above the exemption`, 's.198', (r) => r.liability.base.t198);
  both(`Tax on winnings, online games and VDA @ ${R.special.flatPct}%`, 's.194', (r) => r.liability.base.tFlat);
  both('Income-tax before rebate', '', (r) => r.liability.base.total, 'strong', true);
  both('Less: rebate u/s 156', 's.156', (r) => -r.liability.rebate);
  both('Add: surcharge', 'First Sch. Part I-B Para F', (r) => r.liability.surchargeBeforeRelief);
  both('Less: marginal relief on surcharge', 'First Sch. Part I-B Para F', (r) => -r.liability.marginalRelief);
  both(`Add: Health and Education Cess @ ${R.cessPct}%`, 'Finance Act 2026 s.3(15)', (r) => r.liability.cess, '', true);
  lines.push({ label: 'Tax liability', ref: '', n: ln.total, o: lo.total, cls: 'strong' });
  if (o.amt?.applies) lines.push({ label: 'Alternate minimum tax payable instead (higher than regular tax)', ref: 's.206(2)', n: null, o: o.amt.amt.total });
  if (o.amt && o.amt.creditSetOff > 0) lines.push({ label: 'Less: AMT credit brought forward set off', ref: 's.206(2)(g)', n: null, o: -o.amt.creditSetOff });
  lines.push({ label: 'Tax payable (rounded off u/s 516)', ref: 's.516', n: n.taxPayable, o: oldAllowed ? o.taxPayable : o.taxPayable, cls: 'total' });
  return lines;
}

function update(): void {
  if (!root || !rules) return;
  const R = rules;
  const s = st();
  if (s.resident === 'no') { setSummaryBar(root, ''); return; }
  const { input, businessLoss } = toInput(s, R);
  const res = computeIndividual(input, R);
  if (res.status !== 'ok') return;
  const n = res.results.new;
  const od = res.results.old;
  const oldAllowed = res.allowedRegimes.includes('old');
  const o: Record<string, string> = {};
  const neg = (p: Paise | null) => (p === null || p === 0 ? '—' : fmt(-Math.abs(p)));
  const pair = (key: string, f: (r: RegimeResult) => string) => { o[`n.${key}`] = f(n); o[`o.${key}`] = f(od); };

  // salaries
  o['salary.gross'] = fmt(input.salary?.gross ?? 0);
  o['o.salary.exempt'] = neg(traceAmt(od.trace, 'Less: exempt allowances'));
  pair('salary.std', (r) => neg(traceAmt(r.trace, 'Less: standard deduction')));
  o['o.salary.pt'] = neg(traceAmt(od.trace, 'Less: tax on employment'));
  pair('salary', (r) => fmt(r.heads.salary));

  // house property
  s.selfOcc.forEach((so, i) => { o[`so.${i}`] = neg(Math.min(P(so.interest), so.higher ? R.house.selfOccupiedCapHigher : R.house.selfOccupiedCapLower)); });
  s.letOut.forEach((lo, i) => {
    const nav = sharePaise(Math.max(0, P(lo.gav) - P(lo.municipal)), lo);
    const std = pct(nav, R.house.standardDeductionPct);
    const arrears = P(lo.arrears) - pct(P(lo.arrears), R.house.arrearsDeductionPct);
    o[`lo.${i}.nav`] = fmt(nav);
    o[`lo.${i}.std`] = neg(std);
    o[`lo.${i}.arrears`] = P(lo.arrears) ? fmt(arrears) : '';
    o[`lo.${i}.income`] = fmt(nav - std - P(lo.interest) + arrears);
  });
  pair('house', (r) => fmt(r.heads.houseProperty));
  pair('house.setoff', (r) => { const v = traceAmt(r.trace, 'House-property loss set off'); return v === null ? '—' : fmt(v); });

  // business, gains, other sources (business figures do not depend on the regime)
  Object.assign(o, businessOutputs(s, n.trace, R));
  pair('business', (r) => fmt(r.heads.business));
  pair('gains', (r) => fmt(r.heads.capitalGains));
  pair('other.fp', (r) => neg(traceAmt(r.trace, 'Less: deduction from family pension')));
  pair('other', (r) => fmt(r.heads.otherSources));
  pair('gti', (r) => fmt(r.grossTotalIncome));

  // deductions: amount allowed under each regime against each entered row
  const allowedIn = (r: RegimeResult, row: Row): string => {
    if (row.type.startsWith('don')) {
      const first = s.deductions.find((q) => q.type.startsWith('don'));
      if (row !== first) return '<small>in the line above</small>';
      const v = r.deductions.find((d) => d.label === 'Donations')?.amount ?? 0;
      return v ? fmt(-v) : '—';
    }
    const key = ENGINE_LABEL[row.type];
    const v = key ? (r.deductions.find((d) => d.label.startsWith(key))?.amount ?? 0) : 0;
    return v ? fmt(-v) : '—';
  };
  s.deductions.forEach((r, i) => { o[`n.ded.${i}`] = allowedIn(n, r); o[`o.ded.${i}`] = allowedIn(od, r); });
  o['o.ded.s153'] = neg(od.deductions.find((d) => d.label.startsWith('Interest on deposits'))?.amount ?? 0);
  pair('ded', (r) => (r.chapterVIIIDeductions ? fmt(-r.chapterVIIIDeductions) : '—'));
  pair('ti', (r) => fmt(r.totalIncome));

  // taxes paid and balance
  const paid = P(s.paid.tds) + P(s.paid.advance) + P(s.paid.selfAssessment);
  pair('paid', () => (paid ? fmt(-paid) : '—'));
  pair('balance', (r) => fmt(r.taxPayable - paid));

  for (const [k, v] of Object.entries(o)) root.querySelectorAll(`[data-out="${k}"]`).forEach((el) => { el.innerHTML = v; });

  // tax section, both regimes
  const taxBody = root.querySelector('[data-out-rows="tax"]');
  if (taxBody) {
    taxBody.innerHTML = taxLines(n, od, oldAllowed, R).map((l) =>
      `<tr class="${l.cls ?? ''}"><td class="p">${esc(l.label)}${l.ref ? `<span class="sec">${esc(l.ref)}</span>` : ''}</td><td class="i"></td><td class="a"></td><td class="t">${l.n === null ? '—' : fmt(l.n)}</td><td class="t o">${l.o === null ? '—' : fmt(l.o)}</td></tr>`).join('');
  }
  root.querySelector('#sheet')?.classList.toggle('old-closed', !oldAllowed);

  // warnings from both regimes, once each
  const warnings = Array.from(new Set([...n.warnings, ...od.warnings]));
  if (businessLoss < 0) warnings.push('A business shows a loss. Set-off and carry-forward of business losses are not covered; the loss has been ignored.');
  if (s.selfOcc.length > 2) warnings.push('Only two houses can be treated as self-occupied (s.21(7)). Treat the rest as let out.');
  (root.querySelector('#sheet-warnings') as HTMLElement).innerHTML = warnings.length
    ? `<div class="banner warn"><strong>Check before relying on these figures</strong><ul>${warnings.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : '';

  // comparison at the end
  const better: Regime = res.recommended;
  const saving = res.saving;
  const verdict = !oldAllowed ? 'Only the new regime is available to you, because an earlier opt-out was already withdrawn while you have business income.'
    : saving === 0 ? 'Both regimes give the same tax.'
    : `The ${better} regime saves you ₹ ${fmt(saving)}.`;
  const card = (g: Regime, r: RegimeResult) => `<div class="rcard ${g === better ? 'win' : ''} ${g === 'old' && !oldAllowed ? 'closed' : ''}">
      <span class="tag">${g === 'new' ? 'New regime · s.202' : 'Old regime'}${g === better && oldAllowed && saving > 0 ? ' · lower' : ''}${g === 'old' && !oldAllowed ? ' · not available' : ''}</span>
      <strong>₹ ${fmt(r.taxPayable)}</strong><small>Total income ₹ ${fmt(r.totalIncome)} · effective rate ${r.totalIncome > 0 ? ((r.taxPayable / r.totalIncome) * 100).toFixed(2) : '0.00'}%</small></div>`;
  const line = (label: string, a: Paise, b: Paise, cls = '') => `<tr class="${cls}"><td>${label}</td><td class="num">${fmt(a)}</td><td class="num">${fmt(b)}</td></tr>`;
  (root.querySelector('#compare-body') as HTMLElement).innerHTML = `<div class="rcards">${card('new', n)}${card('old', od)}</div>
    <p class="verdict ${saving === 0 || !oldAllowed ? 'neutral' : ''}">${esc(verdict)}</p>
    <div class="scroll"><table class="sheet compact cmp"><thead><tr><th></th><th class="num">New regime</th><th class="num">Old regime</th></tr></thead><tbody>
    ${line('Gross total income', n.grossTotalIncome, od.grossTotalIncome)}
    ${line('Less: deductions under Chapter VIII', n.chapterVIIIDeductions, od.chapterVIIIDeductions)}
    ${line('Total income', n.totalIncome, od.totalIncome, 'total')}
    ${line('Income-tax before rebate', n.liability.base.total, od.liability.base.total)}
    ${line('Less: rebate u/s 156', n.liability.rebate, od.liability.rebate)}
    ${line('Surcharge (after marginal relief)', n.liability.surcharge, od.liability.surcharge)}
    ${line('Health and Education Cess', n.liability.cess, od.liability.cess)}
    ${line('Tax payable', n.taxPayable, od.taxPayable, 'total')}
    ${line('Balance payable / (refund) after taxes paid', n.taxPayable - paid, od.taxPayable - paid)}
    </tbody></table></div>${res.notes.length ? `<ul class="notes">${res.notes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}`;

  // advance tax on the regime that is lower (or the only one available)
  const basis = res.results[better];
  const adv = computeAdvanceTax({
    taxPayable: basis.taxPayable, tdsTcs: P(s.paid.tds),
    presumptive: usesPresumptive(s, bizOptions(s)),
    seniorWithoutBusinessIncome: s.kind === 'individual' && s.ageBand !== 'below60' && !input.regimeHistory?.hasBusinessIncome,
  }, R);
  (root.querySelector('#advance-body') as HTMLElement).innerHTML = (!adv.liable ? `<p class="note">${esc(adv.reason)}</p>`
    : `<p class="note">Worked out on the ${better} regime (the lower one). ${esc(adv.reason)} Tax after TDS/TCS: ₹ ${fmt(adv.netTax)}.</p><div class="scroll"><table class="sheet compact"><thead><tr><th>Due on or before</th><th class="num">Cumulative</th><th class="num">Instalment (₹)</th><th class="num">Cumulative (₹)</th></tr></thead><tbody>
      ${adv.schedule.map((i) => `<tr><td>${esc(i.due)}</td><td class="num">${i.cumulativePct}%</td><td class="num">${fmt(i.instalment)}</td><td class="num">${fmt(i.cumulativeAmount)}</td></tr>`).join('')}</tbody></table></div>`);

  // sticky summary
  setSummaryBar(root, `<div class="sb-item ${better === 'new' ? 'win' : ''}"><span>New regime</span><b>₹ ${fmt(n.taxPayable)}</b></div>
    <div class="sb-item ${better === 'old' && oldAllowed && saving > 0 ? 'win' : ''} ${oldAllowed ? '' : 'closed'}"><span>Old regime</span><b>₹ ${fmt(od.taxPayable)}</b></div>
    <div class="sb-verdict">${oldAllowed && saving > 0 ? `<b>${better === 'new' ? 'New' : 'Old'} regime</b> saves ₹ ${fmt(saving)}` : !oldAllowed ? 'Only the new regime is available' : 'Same tax in both'}</div>
    <a href="#compare" class="btn sm" data-jump="compare">See comparison</a>`);
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
    if (el.dataset.f.startsWith('presumptive.') || el.dataset.f.startsWith('businesses.')) {
      // The opt-out questions appear once there is business income.
      const had = root?.querySelector('[data-c="optOutInForce"]') !== null;
      const has = hasBusinessIncome(s, bizOptions(s));
      if (had !== has) {
        save(); render();
        const again = root?.querySelector(`[data-f="${el.dataset.f}"]`) as HTMLInputElement | null;
        again?.focus(); again?.setSelectionRange(again.value.length, again.value.length);
        return;
      }
    }
  } else if (el.dataset.t) {
    set(s, el.dataset.t, el.value);
  } else return;
  save();
  update();
}

function onChange(ev: Event): void {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  const s = st();
  if (el instanceof HTMLSelectElement && el.dataset.add) {
    if (!el.value) return;
    const list = el.dataset.add === 'other' ? s.other : s.deductions;
    list.push({ type: el.value, amount: undefined, ...(el.value === 'dependant' || el.value === 'selfDisability' ? { choice: 'disability' } : {}) });
    save(); render();
    const inputs = root?.querySelectorAll<HTMLInputElement>(`[data-f^="${el.dataset.add}.${list.length - 1}."]`);
    inputs?.[inputs.length - 1]?.focus();
    return;
  }
  if (el instanceof HTMLSelectElement && el.dataset.s) {
    set(s, el.dataset.s, el.value);
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

const AGE_LABEL = { below60: 'Below 60 years', '60to79': '60 to 79 years', '80plus': '80 years or more' } as const;

function onClick(ev: Event): void {
  const t = ev.target as HTMLElement;
  const s = st();
  if (handleJump(t)) { ev.preventDefault(); return; }
  const delBtn = t.closest<HTMLElement>('[data-del]');
  if (delBtn) {
    const [list, idx] = (delBtn.dataset.del as string).split('.');
    (s[list as keyof SheetState] as unknown[]).splice(Number(idx), 1);
    save(); render(); return;
  }
  if (businessClick(s, t)) { save(); render(); return; }
  const push = t.closest<HTMLElement>('[data-push]');
  if (push) {
    const list = push.dataset.push as string;
    if (list === 'employers') s.employers.push({ name: `Employer-${s.employers.length + 1}`, gross: undefined, exempt: undefined, pt: undefined });
    if (list === 'selfOcc') s.selfOcc.push({ name: `Property-${s.selfOcc.length + 1}`, interest: undefined, higher: true });
    if (list === 'letOut') s.letOut.push({ name: `Property-${s.letOut.length + 1}`, share: undefined, gav: undefined, municipal: undefined, interest: undefined, arrears: undefined });
    if (list === 'businesses') {
      const kind = (push.dataset.kind as 'business' | 'profession') ?? 'business';
      s.businesses.push(freshBusiness(kind, s.businesses.filter((b) => b.kind === kind).length + 1));
    }
    if (list === 'exempt') s.exempt.push({ desc: '', amount: undefined });
    save(); render(); return;
  }
  const act = t.closest<HTMLElement>('[data-sact]')?.dataset.sact;
  if (act === 'back') callbacks.back();
  if (act === 'reset' && window.confirm('Clear every figure on this sheet?')) { states[current] = fresh(current); save(); render(); }
  if (act === 'print' && root) {
    const compare = root.querySelector('#compare-body')?.innerHTML ?? '';
    const advance = root.querySelector('#advance-body')?.innerHTML ?? '';
    printSheet(root, {
      title: s.kind === 'individual' ? 'Individual' : 'Hindu Undivided Family',
      details: [
        ['Assessee', s.kind === 'individual' ? 'Individual' : 'Hindu Undivided Family'],
        ['Residential status', 'Resident'],
        ...(s.kind === 'individual' ? [['Age', AGE_LABEL[s.ageBand]] as [string, string]] : []),
        ['Tax year', '2026-27 (1 April 2026 – 31 March 2027)'],
      ],
      extraHtml: `<section class="pv-block"><h2>Regime comparison</h2>${compare}</section><section class="pv-block"><h2>Advance tax instalments</h2>${advance}</section>`,
    });
  }
}

/** Mount the sheet into `el`. State is kept per entity kind across mounts and page reloads. */
export function mountSheet(el: HTMLElement, kind: Kind, R: Rules, cb: { back: () => void; notify: (m: string) => void }): void {
  root = el;
  rules = R;
  current = kind;
  callbacks = cb;
  if (!states[kind]) states[kind] = fresh(kind);
  normalise(states[kind] as SheetState);
  el.addEventListener('input', onInput);
  el.addEventListener('change', onChange);
  el.addEventListener('click', onClick);
  render();
}
