// Partnership firm and LLP ("firm" includes LLP, s.2(45)).

import { pct, ratio, roundStatutory, type Paise } from './money.ts';
import type { Rules } from './rules.ts';
import { Trace, type TraceLine } from './trace.ts';
import { presumptiveIncome, type PresumptiveInput } from './presumptive.ts';
import {
  emptyProfile, flatLiability, liabilityOn, reduceProfile, totalOf, validateAmounts,
  type FlatLiability, type Liability, type Profile, type Scheme,
} from './core.ts';

export interface EntityIncome {
  /** Income at the entity's normal rate, excluding dividend (business income after all allowable expenses, other sources, normal-rate gains). */
  normalIncome: Paise;
  dividend?: Paise;
  stcgListedEquity196?: Paise;
  ltcgOther197?: Paise;
  ltcgListedEquity198?: Paise;
  /** Winnings (s.194 Sl.1), online-game winnings and VDA income. */
  winningsAndVda?: Paise;
}

export interface FirmInput extends EntityIncome {
  resident: boolean;
  /** A limited liability partnership cannot use presumptive taxation. */
  isLlp?: boolean;
  /** Presumptive income u/s 58, added to normal-rate income. */
  presumptive?: PresumptiveInput;
  /** Chapter VIII deductions other than Chapter VIII-C (e.g. donations). */
  otherDeductions?: Paise;
  /** Chapter VIII-C deductions (other than s.149) and s.46 deduction. Triggers AMT. */
  chapterVIIIC?: Paise;
  amtCreditBroughtForward?: Paise;
  flags?: Partial<Record<'carriedForwardLosses' | 'foreignTaxCredit' | 'unexplainedIncome', boolean>>;
}

export interface AltTaxResult {
  deemedIncome: Paise;
  regularTax: Paise;
  alt: FlatLiability;
  applies: boolean;
  creditGenerated: Paise;
  creditSetOff: Paise;
}

export interface EntityResult {
  status: 'ok';
  totalIncome: Paise;
  profile: Profile;
  liability: Liability;
  /** AMT (firm) or MAT (company) comparison, when relevant. */
  alternateTax: AltTaxResult | null;
  taxPayable: Paise;
  trace: TraceLine[];
  warnings: string[];
  notes: string[];
}

export type NotSupported = { status: 'not_supported'; reason: string };

const n = (x: Paise | undefined): Paise => x ?? 0;

/** Build the income profile, apply deductions, round total income; shared by firm and company. */
export function buildEntityProfile(inc: EntityIncome, deductions: { label: string; amount: Paise; ref: string }[], R: Rules, t: Trace): { profile: Profile; totalIncome: Paise } {
  let p = emptyProfile();
  p.normal = inc.normalIncome; p.dividend = n(inc.dividend);
  p.g196 = n(inc.stcgListedEquity196); p.g197 = n(inc.ltcgOther197); p.g198 = n(inc.ltcgListedEquity198);
  p.flat30 = n(inc.winningsAndVda);
  t.add('Income at normal rate (excluding dividend)', p.normal, '');
  if (p.dividend > 0) t.add('Dividend income', p.dividend, R.ref('A-58'));
  if (p.g196 > 0) t.add('Short-term capital gains — listed equity (STT paid)', p.g196, R.ref('A-48'));
  if (p.g198 > 0) t.add('Long-term capital gains — listed equity (STT paid)', p.g198, R.ref('A-49'));
  if (p.g197 > 0) t.add('Long-term capital gains — other assets', p.g197, R.ref('A-50'));
  if (p.flat30 > 0) t.add('Winnings, online-game winnings and virtual digital assets', p.flat30, R.ref('A-52'));
  t.add('Gross total income', totalOf(p), 's.122(10)');

  for (const d of deductions) {
    if (d.amount <= 0) continue;
    const r = reduceProfile(p, d.amount, ['normal', 'dividend']);
    p = r.profile;
    t.add(`Less: ${d.label}`, -(d.amount - r.unabsorbed), d.ref);
    if (r.unabsorbed > 0) t.add('Deduction restricted to normal-rate income', r.unabsorbed, R.ref('Z-13'), R.assumption('Z-13'));
  }

  const unrounded = totalOf(p);
  const totalIncome = roundStatutory(unrounded, R.roundMultiple);
  const delta = totalIncome - unrounded;
  if (delta > 0) p = { ...p, normal: p.normal + delta };
  else if (delta < 0) p = reduceProfile(p, -delta, ['normal', 'dividend', 'flat30', 'g196', 'g197', 'g198']).profile;
  t.add('Total income (rounded to nearest Rs. 10)', totalIncome, R.ref('E-02'));
  return { profile: p, totalIncome };
}

export function traceLiability(t: Trace, p: Profile, l: Liability, rateLabel: string, rateRef: string, surchargeRef: string, reliefRef: string | null, R: Rules): void {
  const b = l.base;
  t.add(`Tax on normal-rate income ${rateLabel}`, b.slabTax, rateRef);
  if (p.g196 > 0) t.add(`Tax on short-term capital gains (listed equity) @ ${R.special.stcg196Pct}%`, b.t196, R.ref('A-48'));
  if (p.g197 > 0) t.add(`Tax on long-term capital gains (other assets) @ ${R.special.ltcg197Pct}%`, b.t197, R.ref('A-50'));
  if (p.g198 > 0) t.add(`Tax on long-term capital gains (listed equity) @ ${R.special.ltcg198Pct}% above the exemption`, b.t198, R.ref('A-49'));
  if (p.flat30 > 0) t.add(`Tax on winnings / online games / VDA @ ${R.special.flatPct}%`, b.tFlat, R.ref('A-52'));
  t.add('Income-tax', b.total, '');
  if (l.surchargeBeforeRelief > 0) {
    t.add(`Surcharge @ ${l.rateOther}%`, l.surchargeBeforeRelief, surchargeRef);
    if (l.marginalRelief > 0 && reliefRef) t.add('Less: marginal relief', -l.marginalRelief, reliefRef);
  }
  t.add(`Health and Education Cess @ ${R.cessPct}%`, l.cess, R.ref('E-01'));
  t.add('Tax liability under normal provisions', l.total, '');
}

export function computeFirm(input: FirmInput, R: Rules): EntityResult | NotSupported {
  if (!input.resident) return { status: 'not_supported', reason: 'Non-resident firms are not supported in this version.' };
  validateAmounts(input);
  const t = new Trace();

  const viiiC = n(input.chapterVIIIC);
  const bar = input.isLlp ? 'A limited liability partnership is not eligible for presumptive taxation' : null;
  const presumptive = presumptiveIncome(input.presumptive, { claimsChapterVIIIC: viiiC > 0, businessBar: bar, professionBar: bar }, R, t);
  const { profile, totalIncome } = buildEntityProfile({ ...input, normalIncome: input.normalIncome + presumptive }, [
    { label: 'Chapter VIII deductions (other than Chapter VIII-C)', amount: n(input.otherDeductions), ref: 's.122' },
    { label: 'Chapter VIII-C profit-linked deductions / s.46', amount: viiiC, ref: R.ref('B-10') },
  ], R, t);

  const scheme: Scheme = {
    normalTax: (i) => pct(i, R.firm.ratePct),
    exemptionLimit: null,
    surcharge: { kind: 'slab', slabs: R.firm.surcharge, capPct: null },
  };
  const liab = liabilityOn(profile, scheme, R);
  traceLiability(t, profile, liab, `@ ${R.firm.ratePct}%`, R.ref('B-02'), R.ref('B-03'), R.ref('B-04'), R);

  let gross = liab.total;
  let alternateTax: AltTaxResult | null = null;
  let creditSetOff = 0;
  const creditBf = n(input.amtCreditBroughtForward);
  if (viiiC > 0 || creditBf > 0) {
    if (R.comparisonBase !== 'tax_before_surcharge_cess') throw new Error(`Comparison base "${R.comparisonBase}" is not implemented`);
    const ati = totalIncome + viiiC;
    const alt = flatLiability(ati, R.amt.ratePct, R.firm.surcharge, R);
    const regularTax = liab.base.total;
    const applies = viiiC > 0 && alt.tax > regularTax;
    alternateTax = { deemedIncome: ati, regularTax, alt, applies, creditGenerated: 0, creditSetOff: 0 };
    if (viiiC > 0) {
      t.add('Adjusted total income for AMT', ati, R.ref('B-10'));
      t.add(`Alternate minimum tax @ ${R.amt.ratePct}% (compared with income-tax above)`, alt.tax, R.ref('B-10'), R.assumption('Z-08'));
    }
    if (applies) {
      alternateTax.creditGenerated = alt.tax - regularTax;
      gross = alt.total;
      t.add('AMT payable with surcharge and cess (replaces normal liability)', alt.total, R.ref('B-10'));
      t.add('AMT credit carried forward', alternateTax.creditGenerated, R.ref('A-67'));
    } else if (creditBf > 0) {
      creditSetOff = Math.min(creditBf, Math.max(0, regularTax - (viiiC > 0 ? alt.tax : 0)), gross);
      alternateTax.creditSetOff = creditSetOff;
      if (creditSetOff > 0) t.add('Less: AMT credit brought forward set off', -creditSetOff, R.ref('A-67'), R.assumption('Z-15'));
    }
  }

  const taxPayable = roundStatutory(gross - creditSetOff, R.roundMultiple);
  t.add('Tax payable (rounded to nearest Rs. 10)', taxPayable, R.ref('E-02'));

  if (input.flags?.carriedForwardLosses) t.warn('Set-off of carried-forward losses is not covered.');
  if (input.flags?.foreignTaxCredit) t.warn('Foreign tax credit / DTAA relief is not covered.');
  if (input.flags?.unexplainedIncome) t.warn('Income taxable under s.195 is not covered.');

  return {
    status: 'ok', totalIncome, profile, liability: liab, alternateTax, taxPayable,
    trace: t.lines, warnings: t.warnings,
    notes: ['No rebate and no basic-exemption adjustment for firms; the Rs. 1,25,000 exemption on s.198 gains applies.'],
  };
}

export interface RemunerationResult {
  bookProfit: Paise;
  maximumAllowable: Paise;
  allowed: Paise;
  disallowed: Paise;
  trace: TraceLine[];
}

/**
 * Optional helper: allowable remuneration to working partners (s.35(e)(iii)).
 * `bookProfitBeforeRemuneration` may be negative (loss). Remuneration must be authorised by the deed.
 */
export function partnerRemuneration(bookProfitBeforeRemuneration: Paise, remunerationPaidToWorkingPartners: Paise, R: Rules): RemunerationResult {
  const t = new Trace();
  const r = R.firm.remuneration;
  const bp = bookProfitBeforeRemuneration;
  t.add('Book profit before partners\' remuneration', bp, R.ref('B-08'));
  let limit: Paise;
  if (bp <= 0) {
    limit = r.floor;
    t.add('Loss: fixed limit', limit, R.ref('B-06'));
  } else {
    const first = Math.min(bp, r.firstSlab);
    const onFirst = Math.max(r.floor, pct(first, r.firstPct));
    const onBalance = pct(bp - first, r.balancePct);
    t.add(`On first slab of book profit: higher of floor or ${r.firstPct}%`, onFirst, R.ref('B-06'));
    t.add(`On balance book profit @ ${r.balancePct}%`, onBalance, R.ref('B-06'));
    limit = onFirst + onBalance;
  }
  const allowed = Math.min(remunerationPaidToWorkingPartners, limit);
  t.add('Maximum allowable remuneration', limit, R.ref('B-06'));
  t.add('Remuneration allowed', allowed, R.ref('B-06'));
  t.add('Remuneration disallowed', remunerationPaidToWorkingPartners - allowed, R.ref('B-06'));
  return { bookProfit: bp, maximumAllowable: limit, allowed, disallowed: remunerationPaidToWorkingPartners - allowed, trace: t.lines };
}

/** Optional helper: allowable interest to a partner — simple interest at the statutory rate on the capital for the months outstanding. */
export function partnerInterest(capital: Paise, months: number, interestPaid: Paise, monthsInYear: number, R: Rules): { maximumAllowable: Paise; allowed: Paise; disallowed: Paise; ref: string } {
  const limit = ratio(pct(capital, R.firm.interestPctPerAnnum), months, monthsInYear);
  const allowed = Math.min(interestPaid, limit);
  return { maximumAllowable: limit, allowed, disallowed: interestPaid - allowed, ref: R.ref('B-07') };
}
