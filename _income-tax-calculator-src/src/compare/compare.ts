// Entity Tax Comparison: total tax (entity + owner level) of one business run as a proprietorship,
// a partnership firm / LLP, or a private limited company. Tax Year 2026-27.
// Pure functions on top of the calculator engine; every rate comes from rules/ty2026-27.json via `Rules`.

import {
  computeIndividual, computeFirm, computeCompany, partnerRemuneration, rupees,
  type Paise, type Rules, type TraceLine, type Regime,
} from '../engine/index.ts';
import { pct } from '../engine/money.ts';
import type { PresumptiveInput } from '../engine/presumptive.ts';

export type BusinessType = 'trading' | 'manufacturing' | 'services' | 'profession';
export type RegimeChoice = 'auto' | Regime;

export interface Owner {
  /** Profit-sharing / shareholding ratio, in percent. All owners together = 100. */
  sharePct: number;
  /** Owner's income from outside this business (salary elsewhere, interest, rent), taxed at normal rates. */
  otherIncome: Paise;
  regime?: RegimeChoice;
  /** Partner's capital in the firm/LLP, for interest on capital. */
  capital?: Paise;
}

export interface CompareInput {
  businessType: BusinessType;
  turnover: Paise;
  /** Share of receipts received by banking or online mode, 0–100. The rest is treated as cash. */
  digitalPct: number;
  /** Net profit before any payment to the owners (no partner remuneration/interest, no director salary). Can be negative. */
  profit: Paise;
  owners: Owner[];
  /** Share of the profit the owners want to take home this year, 0–100. */
  extractionPct: number;
  /** Interest on partners' capital, percent a year (capped at the s.35(e)(iv) limit). */
  partnerInterestPct?: number;
  presumptive?: 'auto' | 'no';
  companyRegime?: 'concessional' | 'normal';
  /** Faster, coarser optimisation (used for the chart). */
  fast?: boolean;
}

export interface Section { title: string; lines: TraceLine[] }

export interface EntityCard {
  key: 'proprietor' | 'firm' | 'company';
  name: string;
  available: boolean;
  reason?: string;
  /** What was computed, e.g. "Books of account, new regime" or "Optimised: remuneration Rs. 13,80,000". */
  basis: string;
  entityTax: Paise;
  ownerTax: Paise;
  totalTax: Paise;
  effectiveRatePct: number;
  takeHome: Paise;
  retained: Paise;
  /** Comparison figure (presumptive, "no remuneration", "all as dividend"). */
  alternative?: { label: string; totalTax: Paise };
  sections: Section[];
  notes: string[];
  warnings: string[];
}

export interface CompareResult { cards: EntityCard[]; lowest: EntityCard['key'] | null; assumptions: string[] }

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const share = (amount: Paise, p: number): Paise => pct(Math.max(0, amount), p);

/* ------------------------------------------------------------------ owner level */

interface OwnerPayout { business?: Paise; salary?: Paise; dividend?: Paise }
interface OwnerTax { tax: Paise; regime: Regime; withTax: Paise; baseTax: Paise; trace: TraceLine[]; notes: string[] }

function bestRegime(res: ReturnType<typeof computeIndividual>, choice: RegimeChoice | undefined): Regime {
  if (res.status !== 'ok') return 'new';
  if (choice && choice !== 'auto' && res.allowedRegimes.includes(choice)) return choice;
  return res.recommended;
}

/** Extra tax the owner pays because of what the business pays him: tax(other + payout) − tax(other alone). */
export function ownerIncrementalTax(o: Owner, p: OwnerPayout, R: Rules): OwnerTax {
  const other = { otherIncome: o.otherIncome, dividend: p.dividend || 0 };
  const withRes = computeIndividual({
    kind: 'individual', resident: true,
    regimeHistory: { hasBusinessIncome: (p.business || 0) > 0 },
    businessIncome: p.business || 0,
    salary: p.salary ? { gross: p.salary } : undefined,
    other,
  }, R);
  const baseRes = computeIndividual({ kind: 'individual', resident: true, other: { otherIncome: o.otherIncome } }, R);
  if (withRes.status !== 'ok' || baseRes.status !== 'ok') throw new Error('individual computation not supported');
  const reg = bestRegime(withRes, o.regime);
  const baseReg = bestRegime(baseRes, o.regime);
  const withTax = withRes.results[reg].taxPayable;
  const baseTax = baseRes.results[baseReg].taxPayable;
  return { tax: withTax - baseTax, regime: reg, withTax, baseTax, trace: withRes.results[reg].trace, notes: withRes.notes };
}

/* ------------------------------------------------------------------ presumptive */

interface Presumptive { eligibleProp: boolean; eligibleFirm: boolean; input: PresumptiveInput; ref: string; reason?: string }

function presumptiveFor(x: CompareInput, R: Rules): Presumptive {
  const turnover = Math.max(0, x.turnover);
  const digital = pct(turnover, Math.min(100, Math.max(0, x.digitalPct)));
  const cash = turnover - digital;
  const profit = Math.max(0, x.profit);
  if (x.businessType === 'profession') {
    const P = R.presumptive.profession;
    const limit = cash <= pct(turnover, P.cashLimitPct) ? P.limitLowCash : P.limit;
    const within = turnover <= limit;
    return { eligibleProp: within, eligibleFirm: within, ref: R.ref('P-02'),
      input: { professionReceipts: turnover, professionCashReceipts: cash, professionProfitClaimed: profit },
      reason: within ? undefined : 'Professional receipts exceed the presumptive limit.' };
  }
  const B = R.presumptive.business;
  const limit = cash <= pct(turnover, B.cashLimitPct) ? B.limitLowCash : B.limit;
  const within = turnover <= limit;
  return { eligibleProp: within, eligibleFirm: within, ref: R.ref('P-01'),
    input: { businessDigitalReceipts: digital, businessOtherReceipts: cash, businessCashReceipts: cash, businessProfitClaimed: profit },
    reason: within ? undefined : 'Turnover exceeds the presumptive limit.' };
}

/* ------------------------------------------------------------------ helpers */

function rate(total: Paise, profit: Paise): number {
  return profit > 0 ? Math.round((total / profit) * 10000) / 100 : 0;
}

function grid(lo: Paise, hi: Paise, steps: number, extra: Paise[]): Paise[] {
  const pts = new Set<Paise>([lo, hi]);
  if (hi > lo) for (let i = 1; i < steps; i++) pts.add(lo + Math.round(((hi - lo) * i) / steps));
  for (const e of extra) if (e >= lo && e <= hi) pts.add(e);
  return [...pts].sort((a, b) => a - b);
}

/** Minimise f over [lo, hi]: coarse grid plus threshold points, then a fine search around the best. */
function minimise<T extends { total: Paise }>(lo: Paise, hi: Paise, f: (v: Paise) => T, extra: Paise[], fast: boolean): { v: Paise; r: T } {
  const steps = fast ? 40 : 200;
  let best: { v: Paise; r: T } | null = null;
  const tryV = (v: Paise) => { const r = f(v); if (!best || r.total < best.r.total || (r.total === best.r.total && v > best.v)) best = { v, r }; };
  const pts = grid(lo, hi, steps, extra);
  pts.forEach(tryV);
  const step = Math.max(1, Math.round((hi - lo) / steps));
  const fine = fast ? rupees(10000) : rupees(1000);
  const b0 = best!.v;
  for (let v = Math.max(lo, b0 - step); v <= Math.min(hi, b0 + step); v += fine) tryV(v);
  return best!;
}

/** Owner-income thresholds where marginal rates change: slab edges, the rebate limit and surcharge thresholds. */
function thresholds(R: Rules): Paise[] {
  const t = R.newRegime.slabs.map((s) => s.upto).filter((u): u is Paise => u !== null);
  t.push(R.newRegime.rebateLimit, ...R.newRegime.surcharge.map((s) => s.over));
  return [...new Set(t)];
}

/* ------------------------------------------------------------------ 1. proprietorship */

function proprietor(x: CompareInput, R: Rules, pres: Presumptive): EntityCard {
  const card: EntityCard = { key: 'proprietor', name: 'Sole Proprietorship', available: true, basis: '', entityTax: 0, ownerTax: 0, totalTax: 0,
    effectiveRatePct: 0, takeHome: 0, retained: 0, sections: [], notes: [], warnings: [] };
  // A proprietorship has one owner. With several owners entered, show what one person would pay running the whole
  // business alone (owner 1's other income and regime), so the user can still compare.
  const o: Owner = x.owners.length === 1 ? x.owners[0]! : { sharePct: 100, otherIncome: x.owners[0]!.otherIncome, regime: x.owners[0]!.regime };
  if (x.owners.length > 1) {
    card.name = 'Sole Proprietorship (one owner)';
    card.notes.push(`A proprietorship has exactly one owner. Figures assume one person (owner 1, with owner 1's other income) owns the whole business and all ${fmt(Math.max(0, x.profit))} of profit.`);
  }
  const profit = Math.max(0, x.profit);
  const books = ownerIncrementalTax(o, { business: profit }, R);
  let used = books, basis = `Books of account, ${books.regime} regime`;
  if (pres.eligibleProp && x.presumptive !== 'no') {
    const withP = computeIndividual({ kind: 'individual', resident: true, regimeHistory: { hasBusinessIncome: true }, presumptive: pres.input, other: { otherIncome: o.otherIncome } }, R);
    const base = computeIndividual({ kind: 'individual', resident: true, other: { otherIncome: o.otherIncome } }, R);
    if (withP.status === 'ok' && base.status === 'ok') {
      const reg = bestRegime(withP, o.regime), breg = bestRegime(base, o.regime);
      const presTax = withP.results[reg].taxPayable - base.results[breg].taxPayable;
      card.alternative = { label: `Presumptive income (${pres.ref})`, totalTax: presTax };
      card.notes.push(`Presumptive income is the higher of the deemed percentage and the actual profit (${pres.ref}); it saves keeping full books and a tax audit, but never taxes less than the actual profit. Leaving the scheme within five years bars it for the next five (${R.ref('F-05')}).`);
      if (presTax < books.tax) { used = { ...books, tax: presTax, regime: reg, trace: withP.results[reg].trace }; basis = `Presumptive income, ${reg} regime`; }
    }
  } else if (!pres.eligibleProp) card.notes.push(`Presumptive taxation is not available: ${pres.reason} (${pres.ref}).`);
  card.basis = basis;
  card.ownerTax = used.tax;
  card.totalTax = used.tax;
  card.effectiveRatePct = rate(card.totalTax, x.profit);
  const afterTax = Math.max(0, x.profit) - card.totalTax;
  card.takeHome = Math.max(0, Math.min(pct(profit, x.extractionPct), afterTax));
  card.retained = afterTax - card.takeHome;
  card.sections.push({ title: 'Owner: all business profit is the proprietor\'s own income, taxed at slab rates', lines: used.trace });
  if (o.otherIncome > 0) card.sections.push({ title: 'Less: tax the owner would pay on other income alone', lines: [{ label: 'Tax on other income alone (deducted to show the extra tax caused by the business)', amount: -used.baseTax, ref: '' }] });
  if (x.profit < 0) card.warnings.push('The business shows a loss: no tax. Carry-forward of the loss is not modelled.');
  return card;
}

/* ------------------------------------------------------------------ 2. firm / LLP */

interface FirmEval { total: Paise; firmTax: Paise; partnerTax: Paise; remuneration: Paise; partners: OwnerTax[]; firmTrace: TraceLine[] }

function firm(x: CompareInput, R: Rules, pres: Presumptive): EntityCard {
  const card: EntityCard = { key: 'firm', name: 'Partnership Firm / LLP', available: true, basis: '', entityTax: 0, ownerTax: 0, totalTax: 0,
    effectiveRatePct: 0, takeHome: 0, retained: 0, sections: [], notes: [], warnings: [] };
  if (x.owners.length < 2) return { ...card, available: false, reason: 'A partnership firm or LLP needs at least two partners.' };

  const ratePct = Math.min(x.partnerInterestPct ?? R.firm.interestPctPerAnnum, R.firm.interestPctPerAnnum);
  const interest = x.owners.map((o) => pct(o.capital || 0, ratePct));
  const totalInterest = Math.min(sum(interest), Math.max(0, x.profit));
  const interestScale = sum(interest) > 0 ? totalInterest / sum(interest) : 0;
  const intEach = interest.map((i) => Math.round(i * interestScale));
  const bookProfit = x.profit - sum(intEach);
  const remLimit = partnerRemuneration(bookProfit, Number.MAX_SAFE_INTEGER / 2, R);
  const maxRem = Math.max(0, Math.min(remLimit.maximumAllowable, Math.max(0, bookProfit)));

  const evalRem = (rem: Paise): FirmEval => {
    const firmIncome = Math.max(0, bookProfit - rem);
    const f = computeFirm({ resident: true, normalIncome: firmIncome }, R);
    if (f.status !== 'ok') throw new Error(f.reason);
    const partners = x.owners.map((o, i) => ownerIncrementalTax(o, { business: share(rem, o.sharePct) + intEach[i]! }, R));
    const partnerTax = sum(partners.map((p) => p.tax));
    return { total: f.taxPayable + partnerTax, firmTax: f.taxPayable, partnerTax, remuneration: rem, partners, firmTrace: f.trace };
  };

  // threshold points: remuneration at which some partner's income reaches a slab / rebate / surcharge edge
  const extra: Paise[] = [];
  for (const thr of thresholds(R)) x.owners.forEach((o, i) => {
    if (o.sharePct > 0) extra.push(Math.round(((thr - o.otherIncome - intEach[i]!) * 100) / o.sharePct));
  });
  const best = minimise(0, maxRem, evalRem, extra, !!x.fast);
  const e = best.r;
  const baseline = evalRem(0);

  card.entityTax = e.firmTax; card.ownerTax = e.partnerTax; card.totalTax = e.total;
  card.basis = `Optimised: remuneration ${fmt(e.remuneration)}${sum(intEach) ? `, interest on capital ${fmt(sum(intEach))}` : ''}`;
  card.alternative = { label: 'With no partner remuneration', totalTax: baseline.total };
  card.effectiveRatePct = rate(card.totalTax, x.profit);
  const afterTax = Math.max(0, x.profit) - card.totalTax;
  card.takeHome = Math.max(0, Math.min(pct(Math.max(0, x.profit), x.extractionPct), afterTax));
  card.retained = afterTax - card.takeHome;

  card.sections.push({ title: 'Interest on partners\' capital and book profit', lines: [
    { label: `Interest on capital @ ${ratePct}% simple (limit ${R.firm.interestPctPerAnnum}%)`, amount: sum(intEach), ref: R.ref('B-07') },
    { label: 'Book profit before partners\' remuneration', amount: bookProfit, ref: R.ref('B-08') },
  ] });
  card.sections.push({ title: 'Maximum remuneration to working partners (must be authorised by the deed)', lines: remLimit.trace.filter((l) => !/allowed|disallowed/i.test(l.label) || /Maximum/.test(l.label)) });
  card.sections.push({ title: `Firm: taxed on book profit less remuneration of ${fmt(e.remuneration)}`, lines: e.firmTrace });
  e.partners.forEach((p, i) => card.sections.push({
    title: `Partner ${i + 1} (${x.owners[i]!.sharePct}%): remuneration and interest are business income (${R.ref('F-02')}); share of profit is exempt (${R.ref('F-03')})`,
    lines: [...p.trace, ...(p.baseTax ? [{ label: 'Less: tax on other income alone', amount: -p.baseTax, ref: '' }] : [])],
  }));

  card.notes.push(`Partners' remuneration is not "salary", so there is no standard deduction (${R.ref('F-01')}).`);
  card.notes.push(`Alternate Minimum Tax at 18.5% applies only if the firm claims profit-linked deductions (${R.ref('B-10')}); none are assumed here.`);
  if (pres.eligibleFirm && x.presumptive !== 'no') {
    const f = computeFirm({ resident: true, normalIncome: 0, presumptive: pres.input }, R);
    if (f.status === 'ok') card.notes.push(`A partnership firm (not an LLP) could instead declare presumptive income: tax ${fmt(f.taxPayable)}, with no deduction for partners' remuneration or interest against it (${pres.ref}; ${R.ref('F-04')}).`);
  }
  card.notes.push(`An LLP cannot use presumptive taxation (${R.ref('P-01')}). Otherwise firm and LLP are taxed the same ("firm" includes LLP, ${R.ref('B-01')}).`);
  if (x.profit < 0) card.warnings.push('The business shows a loss: no tax. Carry-forward of the loss is not modelled.');
  return card;
}

/* ------------------------------------------------------------------ 3. private limited */

interface CoEval { total: Paise; coTax: Paise; ownerTax: Paise; salary: Paise; dividend: Paise; retained: Paise; owners: OwnerTax[]; coTrace: TraceLine[]; coNotes: string[] }

function company(x: CompareInput, R: Rules): EntityCard {
  const regime = x.companyRegime === 'normal' ? 'normal' : 's200';
  const card: EntityCard = { key: 'company', name: x.owners.length === 1 ? 'Private Limited (One Person Company)' : 'Private Limited Company', available: true, basis: '',
    entityTax: 0, ownerTax: 0, totalTax: 0, effectiveRatePct: 0, takeHome: 0, retained: 0, sections: [], notes: [], warnings: [] };
  const profit = Math.max(0, x.profit);
  const E = pct(profit, Math.min(100, Math.max(0, x.extractionPct)));

  const evalSal = (S: Paise): CoEval => {
    const income = profit - S;
    const c = computeCompany({ resident: true, companyType: 'private', regime, normalIncome: income, turnoverTaxYear2024_25: null, bookProfit: income }, R);
    if (c.status !== 'ok') throw new Error(c.reason);
    const available = income - c.taxPayable;
    const D = Math.max(0, Math.min(E - S, available));
    const owners = x.owners.map((o) => ownerIncrementalTax(o, { salary: share(S, o.sharePct), dividend: share(D, o.sharePct) }, R));
    const ownerTax = sum(owners.map((o) => o.tax));
    return { total: c.taxPayable + ownerTax, coTax: c.taxPayable, ownerTax, salary: S, dividend: D, retained: available - D, owners, coTrace: c.trace, coNotes: c.notes };
  };

  const extra: Paise[] = [];
  for (const thr of thresholds(R)) x.owners.forEach((o) => {
    if (o.sharePct > 0) extra.push(Math.round(((thr + R.newRegime.stdDeduction - o.otherIncome) * 100) / o.sharePct));
  });
  const best = E > 0 ? minimise(0, E, evalSal, extra, !!x.fast) : { v: 0, r: evalSal(0) };
  const e = best.r;
  const allDividend = evalSal(0);

  card.entityTax = e.coTax; card.ownerTax = e.ownerTax; card.totalTax = e.total;
  card.basis = E > 0 ? `Optimised: director salary ${fmt(e.salary)}, dividend ${fmt(e.dividend)}` : 'All profit retained in the company';
  if (E > 0) card.alternative = { label: 'Taking it all as dividend', totalTax: allDividend.total };
  card.effectiveRatePct = rate(card.totalTax, x.profit);
  card.takeHome = e.salary + e.dividend - e.ownerTax;
  card.retained = e.retained;

  card.sections.push({ title: `Company (${regime === 's200' ? 'concessional regime' : 'normal provisions'}): taxed on profit less director salary of ${fmt(e.salary)}`, lines: e.coTrace });
  e.owners.forEach((p, i) => card.sections.push({
    title: `Owner ${i + 1} (${x.owners[i]!.sharePct}%): salary is "salary" income (standard deduction applies); dividend taxed at slab rates`,
    lines: [...p.trace, ...(p.baseTax ? [{ label: 'Less: tax on other income alone', amount: -p.baseTax, ref: '' }] : [])],
  }));
  card.notes.push(regime === 's200'
    ? `Concessional regime: 22% plus a flat 10% surcharge and 4% cess, no MAT, no specified deductions; once chosen it cannot be withdrawn (${R.ref('C-04')}, ${R.ref('C-07')}).`
    : `Normal provisions: rate by the tax year 2024-25 turnover test (a new company with no 2024-25 turnover is treated as within the Rs. 400 crore limit, ${R.ref('C-01')}; ${R.ref('Z-06')}); MAT at 14% on book profit, taken here as profit after salary (${R.ref('C-10')}).`);
  if (e.retained > 0) card.notes.push(`Profit retained in the company (${fmt(e.retained)}) has borne company tax only; when it is paid out later as dividend it is taxed again in the shareholders' hands (${R.ref('A-58')}).`);
  if (e.dividend > 0) card.notes.push(`The company deducts TDS at 10% on dividends (${R.ref('F-07')}); it is credited against the shareholder's tax shown above.`);
  card.notes.push(`The 15% concessional regime for new manufacturing companies is closed to companies that had not started manufacturing by 31 March 2024 (${R.ref('C-06')}), so it is not offered.`);
  if (x.profit < 0) card.warnings.push('The business shows a loss: no tax. Carry-forward of the loss is not modelled.');
  return card;
}

/* ------------------------------------------------------------------ main */

export function fmt(p: Paise): string {
  const r = Math.round(p / 100);
  const s = Math.abs(r).toString();
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  const body = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return (r < 0 ? '-Rs. ' : 'Rs. ') + body;
}

export function validate(x: CompareInput): string[] {
  const e: string[] = [];
  if (x.owners.length < 1 || x.owners.length > 5) e.push('Enter between 1 and 5 owners.');
  if (Math.abs(sum(x.owners.map((o) => o.sharePct)) - 100) > 0.001) e.push('Owners\' shares must add up to 100%.');
  if (x.owners.some((o) => o.sharePct < 0 || o.otherIncome < 0 || (o.capital || 0) < 0)) e.push('Amounts and shares cannot be negative.');
  if (x.turnover < 0) e.push('Turnover cannot be negative.');
  if (x.digitalPct < 0 || x.digitalPct > 100 || x.extractionPct < 0 || x.extractionPct > 100) e.push('Percentages must be between 0 and 100.');
  return e;
}

export function compare(x: CompareInput, R: Rules): CompareResult {
  const errors = validate(x);
  if (errors.length) throw new Error(errors.join(' '));
  const pres = presumptiveFor(x, R);
  const cards = [proprietor(x, R, pres), firm(x, R, pres), company(x, R)];
  const avail = cards.filter((c) => c.available);
  const lowest = avail.length ? avail.reduce((a, b) => (b.totalTax < a.totalTax ? b : a)).key : null;
  return {
    cards, lowest,
    assumptions: [
      'Resident owners and a resident business; tax year 2026-27 (1 April 2026 – 31 March 2027).',
      'Profit is the same under every structure. Real costs differ (audit, filings, director salary limits, PF/ESI on salary are ignored).',
      'Owner tax is the extra tax caused by this business: tax on (other income + money from the business) less tax on other income alone.',
      'Firm/LLP: remuneration paid to working partners is chosen to minimise total tax, up to the s.35(e)(iii) limit, split in the profit-sharing ratio, and authorised by the deed.',
      'Company: director salary and dividend are split in the shareholding ratio; salary is chosen to minimise total tax for the take-home amount you set.',
      'No brought-forward losses, MAT/AMT credits, capital gains or profit-linked deductions. A loss gives nil tax.',
      'Surcharge, marginal relief, 4% cess, the Rs. 12 lakh rebate and rounding to the nearest Rs. 10 follow the rules file.',
    ],
  };
}

/** Total tax of each structure across a range of profits, holding everything else constant (for the chart). */
export function compareAcrossProfits(x: CompareInput, profits: Paise[], R: Rules): { profit: Paise; totals: Partial<Record<EntityCard['key'], Paise>> }[] {
  return profits.map((p) => {
    const r = compare({ ...x, profit: p, fast: true }, R);
    const totals: Partial<Record<EntityCard['key'], Paise>> = {};
    r.cards.forEach((c) => { if (c.available) totals[c.key] = c.totalTax; });
    return { profit: p, totals };
  });
}
