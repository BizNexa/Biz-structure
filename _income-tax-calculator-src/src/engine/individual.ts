// Individual / proprietor and HUF. Computes both regimes and compares them.

import { pct, ratio, roundStatutory, type Paise } from './money.ts';
import type { ProfileKey, Rules } from './rules.ts';
import { Trace, type TraceLine } from './trace.ts';
import {
  emptyProfile, flatLiability, liabilityOn, reduceProfile, slabTax, totalOf, validateAmounts,
  type FlatLiability, type Liability, type Profile, type Scheme,
} from './core.ts';
import { presumptiveIncome, type PresumptiveInput } from './presumptive.ts';

export type Regime = 'new' | 'old';
export type DisabilityLevel = 'none' | 'disability' | 'severe';

export interface IndividualInput {
  kind: 'individual' | 'huf';
  resident: boolean;
  /** Age attained at any time during the tax year. Individuals only. */
  age?: number;
  regimeHistory?: {
    hasBusinessIncome: boolean;
    /** An opt-out of the new regime (s.202(4)(a)) made in an earlier year is still in force. */
    optOutInForce?: boolean;
    /** An earlier opt-out was already withdrawn once. */
    optOutWithdrawnEarlier?: boolean;
  };
  salary?: {
    /** Gross salary including the employer's pension-scheme contribution. */
    gross: Paise;
    exemptAllowancesOldRegime?: Paise;
    professionalTax?: Paise;
    /** Basic + DA (where terms of employment so provide), for the s.124 percentage cap. */
    basicPlusDA?: Paise;
    employerPensionContribution?: Paise;
    employerIsGovernment?: boolean;
    agniveerGovtContribution?: Paise;
  };
  familyPension?: Paise;
  house?: {
    /** Annual value of let-out property after municipal taxes. */
    letOutNetAnnualValue?: Paise;
    letOutInterest?: Paise;
    selfOccupiedInterest?: Paise;
    /** Conditions of s.22(2)(a) met (acquired/constructed within 5 years, lender certificate). */
    selfOccupiedHigherLimit?: boolean;
    /** Arrears of rent or unrealised rent received in the year (s.23). */
    arrearsRent?: Paise;
  };
  /** Profit from business or profession computed on books (after all adjustments). */
  businessIncome?: Paise;
  /** Presumptive income u/s 58. Cash receipts are used for the 5% cash test. */
  presumptive?: PresumptiveInput;
  other?: { savingsInterest?: Paise; depositInterest?: Paise; dividend?: Paise; otherIncome?: Paise };
  gains?: { stcgListedEquity196?: Paise; ltcgListedEquity198?: Paise; ltcgOther197?: Paise; stcgOtherNormalRate?: Paise };
  winnings?: { lotteryEtc?: Paise; onlineGames?: Paise; vda?: Paise };
  deductions?: {
    s123?: Paise;
    pensionOwn124_3?: Paise;
    agniveerOwn?: Paise;
    healthSelfFamily?: Paise;
    healthSelfFamilySenior?: boolean;
    healthParents?: Paise;
    healthParentsSenior?: boolean;
    dependantDisability?: DisabilityLevel;
    selfDisability?: DisabilityLevel;
    medicalTreatment128?: Paise;
    medicalTreatmentPatientSenior?: boolean;
    educationLoanInterest?: Paise;
    housingLoanInterest130?: Paise;
    housingLoanInterest131?: Paise;
    evLoanInterest?: Paise;
    donationsFull?: Paise;
    donationsHalf?: Paise;
    donationsFullWithLimit?: Paise;
    donationsHalfWithLimit?: Paise;
    rentPaid134?: Paise;
    researchDonations135?: Paise;
    politicalContributions137?: Paise;
    /** Chapter VIII-C (profit-linked) deductions other than s.149, and s.46. Triggers AMT. */
    chapterVIIIC?: Paise;
  };
  amtCreditBroughtForward?: Paise;
  /** Situations the engine does not compute; each raises a warning. */
  flags?: Partial<Record<
    'carriedForwardLosses' | 'foreignTaxCredit' | 'agriculturalIncome' | 'landBuildingAcquiredBefore23Jul2024' |
    'unexplainedIncome' | 'clubbing', boolean>>;
}

export interface AmtResult {
  adjustedTotalIncome: Paise;
  regularTax: Paise;
  amt: FlatLiability;
  applies: boolean;
  creditGenerated: Paise;
  creditSetOff: Paise;
}

export interface HeadTotals {
  salary: Paise;
  /** Can be negative (loss). */
  houseProperty: Paise;
  business: Paise;
  capitalGains: Paise;
  otherSources: Paise;
}

export interface RegimeResult {
  regime: Regime;
  /** Income under each head before inter-head set-off. */
  heads: HeadTotals;
  /** Chapter VIII deductions allowed, line by line. */
  deductions: { label: string; amount: Paise; ref: string }[];
  grossTotalIncome: Paise;
  chapterVIIIDeductions: Paise;
  totalIncome: Paise;
  profile: Profile;
  liability: Liability;
  amt: AmtResult | null;
  /** Final amount payable after credits, rounded u/s 516. */
  taxPayable: Paise;
  trace: TraceLine[];
  warnings: string[];
}

export type IndividualResult =
  | { status: 'not_supported'; reason: string }
  | {
      status: 'ok';
      results: Record<Regime, RegimeResult>;
      allowedRegimes: Regime[];
      recommended: Regime;
      /** Tax saved by the recommended regime against the other (0 if only one is allowed). */
      saving: Paise;
      notes: string[];
    };

const n = (x: Paise | undefined): Paise => x ?? 0;

function ageBand(input: IndividualInput, R: Rules): 'general' | 'senior' | 'superSenior' {
  if (input.kind !== 'individual' || input.age === undefined) return 'general';
  if (input.age >= R.ages.superSenior) return 'superSenior';
  if (input.age >= R.ages.senior) return 'senior';
  return 'general';
}

function schemeFor(input: IndividualInput, regime: Regime, R: Rules): Scheme {
  if (regime === 'new') {
    return {
      normalTax: (i) => slabTax(i, R.newRegime.slabs),
      exemptionLimit: R.newRegime.exemption,
      surcharge: { kind: 'slab', slabs: R.newRegime.surcharge, capPct: R.surchargeCapPct },
    };
  }
  const band = ageBand(input, R);
  const slabs = band === 'superSenior' ? R.oldRegime.slabsSuperSenior : band === 'senior' ? R.oldRegime.slabsSenior : R.oldRegime.slabsGeneral;
  const exemption = band === 'superSenior' ? R.oldRegime.exemptionSuperSenior : band === 'senior' ? R.oldRegime.exemptionSenior : R.oldRegime.exemptionGeneral;
  return {
    normalTax: (i) => slabTax(i, slabs),
    exemptionLimit: exemption,
    surcharge: { kind: 'slab', slabs: R.oldRegime.surcharge, capPct: R.surchargeCapPct },
  };
}

interface Deduction { label: string; amount: Paise; ref: string }

function disabilityAmount(level: DisabilityLevel | undefined, normal: Paise, severe: Paise): Paise {
  return level === 'severe' ? severe : level === 'disability' ? normal : 0;
}

/** Chapter VIII deductions for the regime. `base` is normal-rate income before these deductions. */
function chapterVIII(input: IndividualInput, regime: Regime, base: Paise, R: Rules, t: Trace): Deduction[] {
  const d = input.deductions ?? {};
  const s = input.salary;
  const isIndividual = input.kind === 'individual';
  const isSenior = isIndividual && input.age !== undefined && input.age >= R.ages.senior;
  const out: Deduction[] = [];
  const push = (label: string, amount: Paise, ref: string) => { if (amount > 0) out.push({ label, amount, ref }); };

  // Allowed in both regimes: employer's pension contribution and Central Govt's Agniveer contribution.
  if (isIndividual && s && n(s.employerPensionContribution) > 0) {
    const capPct = s.employerIsGovernment ? R.employerPensionPctGovt
      : regime === 'new' ? R.newRegime.employerPensionPctOther : R.oldRegime.employerPensionPctOther;
    if (s.basicPlusDA === undefined) t.warn('Employer pension contribution entered without Basic + DA; the s.124 percentage cap could not be applied and no deduction was given.');
    else push(`Employer contribution to pension scheme (cap ${capPct}% of salary)`, Math.min(n(s.employerPensionContribution), pct(s.basicPlusDA, capPct)), R.ref('A-25'));
  }
  if (isIndividual && s) push('Central Government contribution to Agniveer Corpus Fund', n(s.agniveerGovtContribution), R.ref('A-26'));

  if (regime === 'new') return out;

  push('Life insurance, PF etc. (Schedule XV)', Math.min(n(d.s123), R.ded.s123Cap), R.ref('A-27'));
  push('Health insurance / medical — self and family (or HUF members)',
    Math.min(n(d.healthSelfFamily), d.healthSelfFamilySenior ? R.ded.healthCapSenior : R.ded.healthCap), R.ref(isIndividual ? 'A-29' : 'A-30'));
  push('Dependant with disability', disabilityAmount(d.dependantDisability, R.ded.dependantDisability, R.ded.dependantSevere), R.ref('A-31'));
  push('Medical treatment of specified diseases',
    Math.min(n(d.medicalTreatment128), d.medicalTreatmentPatientSenior ? R.ded.medicalTreatmentCapSenior : R.ded.medicalTreatmentCap), R.ref('A-32'));
  push('Contributions to political parties / electoral trust', n(d.politicalContributions137), R.ref('A-40'));
  push('Chapter VIII-C profit-linked deductions / s.46', n(d.chapterVIIIC), R.ref('A-65'));

  if (isIndividual) {
    push('Own contribution to pension scheme (additional)', Math.min(n(d.pensionOwn124_3), R.ded.pensionOwnCap), R.ref('A-28'));
    push('Own subscription to Agniveer Corpus Fund', n(d.agniveerOwn), R.ref('A-26'));
    push('Health insurance / medical — parents',
      Math.min(n(d.healthParents), d.healthParentsSenior ? R.ded.healthCapSenior : R.ded.healthCap), R.ref('A-29'));
    push('Interest on higher-education loan', n(d.educationLoanInterest), R.ref('A-33'));
    push('Interest on housing loan (s.130)', Math.min(n(d.housingLoanInterest130), R.ded.housingLoan130Cap), R.ref('A-34'));
    push('Interest on housing loan (s.131)', Math.min(n(d.housingLoanInterest131), R.ded.housingLoan131Cap), R.ref('A-35'));
    push('Interest on electric-vehicle loan', Math.min(n(d.evLoanInterest), R.ded.evLoanCap), R.ref('A-36'));
    push('Person with disability (self)', disabilityAmount(d.selfDisability, R.ded.selfDisability, R.ded.selfSevere), R.ref('A-42'));
  } else {
    const ignored = n(d.pensionOwn124_3) + n(d.agniveerOwn) + n(d.healthParents) + n(d.educationLoanInterest) +
      n(d.housingLoanInterest130) + n(d.housingLoanInterest131) + n(d.evLoanInterest);
    if (ignored > 0 || (d.selfDisability && d.selfDisability !== 'none')) t.warn('Deductions available only to individuals were entered for an HUF and have been ignored.');
  }

  const savings = n(input.other?.savingsInterest);
  const deposits = n(input.other?.depositInterest);
  push('Interest on deposits', isSenior ? Math.min(savings + deposits, R.ded.seniorInterestCap) : Math.min(savings, R.ded.savingsInterestCap), R.ref('A-41'));

  if (n(d.researchDonations135) > 0) {
    if (n(input.businessIncome) > 0) t.warn('Research donations (s.135) are not deductible where there is business income; ignored.');
    else push('Donations for scientific / social-science research', d.researchDonations135 as Paise, R.ref('A-39'));
  }

  // Rent (s.134) and donations (s.133) depend on income after the other deductions.
  const soFar = () => out.reduce((a, x) => a + x.amount, 0);
  if (n(d.rentPaid134) > 0) {
    const income = Math.max(0, base - soFar());
    const rent = Math.max(0, Math.min(
      n(d.rentPaid134) - pct(income, R.ded.rentExcessPct),
      R.ded.rentMonthlyCap * R.ded.rentMonths,
      pct(income, R.ded.rentIncomeCapPct)));
    push('Rent paid (no house-rent allowance)', rent, R.ref('A-38'));
  }
  const limited = n(d.donationsFullWithLimit) + n(d.donationsHalfWithLimit);
  const donationsTotal = n(d.donationsFull) + n(d.donationsHalf) + limited;
  if (donationsTotal > 0) {
    const adjustedGti = Math.max(0, base - soFar());
    const ceiling = pct(adjustedGti, R.ded.donationQualifyingPct);
    // Where the ceiling bites, it is applied to full-rate donations first (more favourable).
    const fullLimited = Math.min(n(d.donationsFullWithLimit), ceiling);
    const halfLimited = Math.min(n(d.donationsHalfWithLimit), ceiling - fullLimited);
    const amount = pct(n(d.donationsFull) + fullLimited, R.ded.donationFullPct) + pct(n(d.donationsHalf) + halfLimited, R.ded.donationHalfPct);
    push('Donations', amount, R.ref('A-37'));
  }
  return out;
}

function computeRegime(input: IndividualInput, regime: Regime, R: Rules): RegimeResult {
  const t = new Trace();
  const rg = regime === 'new' ? R.newRegime : R.oldRegime;
  const isOld = regime === 'old';
  const p = emptyProfile();
  const heads: HeadTotals = { salary: 0, houseProperty: 0, business: 0, capitalGains: 0, otherSources: 0 };

  // ---- Salaries
  const s = input.salary;
  if (s && s.gross > 0) {
    t.add('Gross salary', s.gross, 's.15');
    let net = s.gross;
    if (isOld && n(s.exemptAllowancesOldRegime) > 0) {
      const ex = Math.min(net, n(s.exemptAllowancesOldRegime)); net -= ex;
      t.add('Less: exempt allowances (old regime only)', -ex, R.ref('A-23'));
    }
    const sd = Math.min(net, rg.stdDeduction); net -= sd;
    t.add('Less: standard deduction', -sd, R.ref('A-19'));
    if (isOld && n(s.professionalTax) > 0) {
      const pt = Math.min(net, n(s.professionalTax)); net -= pt;
      t.add('Less: tax on employment', -pt, R.ref('A-21'));
    }
    t.add('Income under the head Salaries', net, '');
    p.normal += net;
    heads.salary = net;
  }

  // ---- House property
  const h = input.house;
  if (h) {
    const nav = n(h.letOutNetAnnualValue);
    let hp = nav - pct(nav, R.house.standardDeductionPct) - n(h.letOutInterest);
    if (nav > 0 || n(h.letOutInterest) > 0) t.add('Let-out property: annual value less 30% and interest', hp, R.ref('A-45'));
    const arrears = n(h.arrearsRent);
    if (arrears > 0) {
      const net = arrears - pct(arrears, R.house.arrearsDeductionPct);
      hp += net;
      t.add(`Arrears / unrealised rent received, less ${R.house.arrearsDeductionPct}%`, net, R.ref('A-69'));
    }
    if (n(h.selfOccupiedInterest) > 0) {
      if (isOld) {
        const cap = Math.min(h.selfOccupiedHigherLimit ? R.house.selfOccupiedCapHigher : R.house.selfOccupiedCapLower, R.house.selfOccupiedAggregateCap);
        const allowed = Math.min(n(h.selfOccupiedInterest), cap);
        hp -= allowed;
        t.add('Self-occupied property: interest on borrowed capital', -allowed, R.ref('A-44'));
      } else {
        t.note('Self-occupied property interest is not deductible under the new regime', R.ref('A-23'));
      }
    }
    heads.houseProperty = hp;
    if (hp >= 0) {
      p.normal += hp;
      if (hp > 0) t.add('Income under the head House property', hp, '');
    } else if (isOld) {
      const allowed = Math.min(-hp, R.house.lossSetOffCap);
      t.add('Loss under the head House property', hp, '');
      t.add('House-property loss set off against other heads', -allowed, R.ref('A-68'),
        -hp > allowed ? 'Balance loss is carried forward (carry-forward is not tracked in v1)' : undefined);
      p.normal -= allowed; // absorbed properly once all heads are in
    } else {
      t.add('Loss under the head House property (no set-off against other heads in the new regime)', hp, R.ref('A-24'));
    }
  }

  // ---- Business, other sources, gains
  if (n(input.businessIncome) > 0) { p.normal += n(input.businessIncome); heads.business += n(input.businessIncome); t.add('Profits and gains of business or profession (as per books)', n(input.businessIncome), ''); }
  const presumptive = presumptiveIncome(input.presumptive, {
    claimsChapterVIIIC: n(input.deductions?.chapterVIIIC) > 0,
    professionBar: input.kind === 'huf' ? 'Presumptive taxation of professional income is available only to an individual or a firm, not an HUF' : null,
  }, R, t);
  if (presumptive > 0) { p.normal += presumptive; heads.business += presumptive; }
  const fp = n(input.familyPension);
  if (fp > 0) {
    const ded = Math.min(ratio(fp, R.familyPensionFraction.num, R.familyPensionFraction.den), rg.familyPensionCap);
    t.add('Family pension', fp, ''); t.add('Less: deduction from family pension', -ded, R.ref('A-20'));
    p.normal += fp - ded;
    heads.otherSources += fp - ded;
  }
  const o = input.other ?? {};
  const otherNormal = n(o.savingsInterest) + n(o.depositInterest) + n(o.otherIncome);
  if (otherNormal > 0) { p.normal += otherNormal; heads.otherSources += otherNormal; t.add('Interest and other income (other sources)', otherNormal, ''); }
  if (n(o.dividend) > 0) { p.dividend = n(o.dividend); heads.otherSources += p.dividend; t.add('Dividend income (no deduction allowed)', p.dividend, R.ref('A-58')); }
  const g = input.gains ?? {};
  if (n(g.stcgOtherNormalRate) > 0) { p.normal += n(g.stcgOtherNormalRate); t.add('Short-term capital gains taxable at normal rates', n(g.stcgOtherNormalRate), ''); }
  p.g196 = n(g.stcgListedEquity196); p.g197 = n(g.ltcgOther197); p.g198 = n(g.ltcgListedEquity198);
  if (p.g196 > 0) t.add('Short-term capital gains — listed equity (STT paid)', p.g196, R.ref('A-48'));
  if (p.g198 > 0) t.add('Long-term capital gains — listed equity (STT paid)', p.g198, R.ref('A-49'));
  if (p.g197 > 0) t.add('Long-term capital gains — other assets', p.g197, R.ref('A-50'));
  const w = input.winnings ?? {};
  p.flat30 = n(w.lotteryEtc) + n(w.onlineGames) + n(w.vda);
  if (p.flat30 > 0) t.add('Winnings, online-game winnings and virtual digital assets', p.flat30, `${R.ref('A-52')}, ${R.ref('A-53')}, ${R.ref('A-54')}`);
  heads.capitalGains = n(g.stcgOtherNormalRate) + p.g196 + p.g197 + p.g198;
  heads.otherSources += p.flat30;

  // A house-property loss was parked in `normal`; if it drove it negative, absorb the rest elsewhere (s.109).
  let profile = p;
  if (profile.normal < 0) {
    const excess = -profile.normal;
    const order: ProfileKey[] = ['dividend', 'g196', 'g197', 'g198'];
    const r = reduceProfile({ ...profile, normal: 0 }, excess, order);
    profile = r.profile;
    if (r.unabsorbed > 0) t.note('Part of the house-property loss could not be set off this year (carry-forward not tracked in v1)');
  }

  const gti = totalOf(profile);
  t.add('Gross total income', gti, 's.122(10)');

  // ---- Chapter VIII
  const base = profile.normal + profile.dividend;
  const deds = chapterVIII(input, regime, base, R, t);
  for (const x of deds) t.add(`Less: ${x.label}`, -x.amount, x.ref);
  const claimed = deds.reduce((a, x) => a + x.amount, 0);
  const afterDed = reduceProfile(profile, claimed, ['normal', 'dividend']);
  profile = afterDed.profile;
  const allowedDeductions = claimed - afterDed.unabsorbed;
  if (afterDed.unabsorbed > 0) t.add('Deductions restricted to normal-rate income', afterDed.unabsorbed, R.ref('Z-13'), R.assumption('Z-13'));

  // ---- Total income, rounded u/s 516
  const unrounded = totalOf(profile);
  const totalIncome = roundStatutory(unrounded, R.roundMultiple);
  const delta = totalIncome - unrounded;
  const keys: ProfileKey[] = ['normal', 'dividend', 'flat30', 'g196', 'g197', 'g198'];
  if (delta > 0) { const k = keys.find((key) => profile[key] > 0) ?? 'normal'; profile = { ...profile, [k]: profile[k] + delta }; }
  else if (delta < 0) profile = reduceProfile(profile, -delta, keys).profile;
  t.add('Total income (rounded to nearest Rs. 10)', totalIncome, R.ref('E-02'));

  // ---- Tax
  const scheme = schemeFor(input, regime, R);
  const first = liabilityOn(profile, scheme, R, 0);
  const b = first.base;

  let rebate = 0;
  if (input.kind === 'individual' && input.resident) {
    if (isOld) {
      if (totalIncome <= R.oldRegime.rebateLimit) {
        const excluded = R.oldRegime.rebateExcludedTax.includes('198') ? b.t198 : 0;
        rebate = Math.min(R.oldRegime.rebateMax, b.total - excluded);
      }
    } else if (totalIncome <= R.newRegime.rebateLimit) {
      rebate = Math.min(R.newRegime.rebateMax, b.slabTax);
    } else {
      const excess = totalIncome - R.newRegime.rebateLimit;
      const taxBase = R.newRegimeMarginalRebateBase === 'slab_tax_only' ? b.slabTax : b.total;
      if (taxBase > excess) rebate = Math.min(taxBase - excess, b.slabTax);
    }
  }
  const liab = rebate > 0 ? liabilityOn(profile, scheme, R, rebate) : first;

  const used = b.shortfallUsed.g196 + b.shortfallUsed.g197 + b.shortfallUsed.g198;
  if (used > 0) t.add('Unexhausted basic exemption set against capital gains', -used, R.ref('A-59'), R.assumption('Z-04'));
  t.add(`Tax on normal-rate income of ${fmt(b.normalRateIncome)} at ${regime} regime slab rates`, b.slabTax, R.ref(isOld ? 'A-04' : 'A-02'));
  if (profile.g196 > 0) t.add(`Tax on short-term capital gains (listed equity) @ ${R.special.stcg196Pct}%`, b.t196, R.ref('A-48'));
  if (profile.g197 > 0) t.add(`Tax on long-term capital gains (other assets) @ ${R.special.ltcg197Pct}%`, b.t197, R.ref('A-50'));
  if (profile.g198 > 0) t.add(`Tax on long-term capital gains (listed equity) @ ${R.special.ltcg198Pct}% above exemption of ${fmt(b.exemption198Used)}`, b.t198, R.ref('A-49'));
  if (profile.flat30 > 0) t.add(`Tax on winnings / online games / VDA @ ${R.special.flatPct}%`, b.tFlat, R.ref('A-52'));
  t.add('Income-tax before rebate', b.total, '');
  if (rebate > 0) t.add('Less: rebate', -rebate, R.ref(isOld ? 'A-11' : totalIncome <= R.newRegime.rebateLimit ? 'A-12' : 'A-13'));
  else if (input.kind === 'huf') t.note('No rebate: available to resident individuals only', R.ref('A-17'));
  if (liab.surchargeBeforeRelief > 0) {
    t.add(`Surcharge @ ${liab.rateOther}% (${liab.rateCapped}% on dividend and ss.196/197/198 gains)`, liab.surchargeBeforeRelief, R.ref(isOld ? 'A-60' : 'A-61'));
    if (liab.marginalRelief > 0) t.add('Less: marginal relief', -liab.marginalRelief, R.ref(isOld ? 'A-63' : 'A-64'), R.assumption('Z-05'));
  }
  t.add(`Health and Education Cess @ ${R.cessPct}%`, liab.cess, R.ref('E-01'));
  t.add('Tax liability under normal provisions', liab.total, '');

  // ---- AMT (old regime only; s.206(2)(d)(ii) excludes the new regime)
  let amt: AmtResult | null = null;
  let gross = liab.total;
  let creditSetOff = 0;
  const viiiC = isOld ? n(input.deductions?.chapterVIIIC) : 0;
  const creditBf = n(input.amtCreditBroughtForward);
  if (isOld && (viiiC > 0 || creditBf > 0)) {
    if (R.comparisonBase !== 'tax_before_surcharge_cess') throw new Error(`Comparison base "${R.comparisonBase}" is not implemented`);
    const ati = totalIncome + viiiC;
    const regularTax = b.total - rebate;
    const amtLiab = flatLiability(ati, R.amt.ratePct, R.amt.surchargeIndHuf, R);
    const inScope = viiiC > 0 && ati > R.amt.thresholdIndHuf;
    const applies = inScope && amtLiab.tax > regularTax;
    amt = { adjustedTotalIncome: ati, regularTax, amt: amtLiab, applies, creditGenerated: 0, creditSetOff: 0 };
    if (viiiC > 0) {
      t.add('Adjusted total income for AMT', ati, R.ref('A-66'));
      if (!inScope) t.note('AMT not applicable: adjusted total income does not exceed the threshold', R.ref('A-65'));
      else t.add(`Alternate minimum tax @ ${R.amt.ratePct}% (compared with income-tax of ${fmt(regularTax)})`, amtLiab.tax, R.ref('A-66'), R.assumption('Z-08'));
    }
    if (applies) {
      amt.creditGenerated = amtLiab.tax - regularTax;
      gross = amtLiab.total;
      t.add('AMT payable with surcharge and cess (replaces normal liability)', amtLiab.total, R.ref('A-66'));
      t.add('AMT credit carried forward', amt.creditGenerated, R.ref('A-67'));
    } else if (creditBf > 0) {
      const room = inScope ? regularTax - amtLiab.tax : regularTax;
      creditSetOff = Math.min(creditBf, Math.max(0, room), gross);
      amt.creditSetOff = creditSetOff;
      if (creditSetOff > 0) t.add('Less: AMT credit brought forward set off', -creditSetOff, R.ref('A-67'), R.assumption('Z-15'));
    }
  } else if (!isOld && creditBf > 0) {
    t.note('AMT credit brought forward is not set off in this computation under the new regime (not covered in v1)', R.ref('A-67'));
  }

  const taxPayable = roundStatutory(gross - creditSetOff, R.roundMultiple);
  t.add('Tax payable (rounded to nearest Rs. 10)', taxPayable, R.ref('E-02'));

  return {
    regime, heads, deductions: deds, grossTotalIncome: gti, chapterVIIIDeductions: allowedDeductions, totalIncome, profile,
    liability: liab, amt, taxPayable, trace: t.lines, warnings: t.warnings,
  };
}

/** Plain rupee figure for labels (not for arithmetic). */
function fmt(p: Paise): string {
  return `Rs. ${Math.trunc(roundStatutory(p, 1 * 100) / 100).toLocaleString('en-IN')}`;
}

export function computeIndividual(input: IndividualInput, R: Rules): IndividualResult {
  if (!input.resident) return { status: 'not_supported', reason: 'Non-residents are not supported in this version.' };
  validateAmounts(input);

  const results: Record<Regime, RegimeResult> = { new: computeRegime(input, 'new', R), old: computeRegime(input, 'old', R) };
  const notes: string[] = [];
  let allowed: Regime[] = ['new', 'old'];

  const hist = input.regimeHistory;
  if (hist?.hasBusinessIncome) {
    if (hist.optOutWithdrawnEarlier) {
      allowed = ['new'];
      notes.push(`An earlier opt-out was already withdrawn: with business income the old regime cannot be chosen again (${R.ref('A-09')}).`);
    } else if (hist.optOutInForce) {
      notes.push(`An opt-out is in force. Moving to the new regime uses the single permitted withdrawal, after which the old regime is closed while business income continues (${R.ref('A-09')}).`);
    } else {
      notes.push(`With business income, an opt-out must be made on or before the s.263(1) due date and then applies to later years (${R.ref('A-09')}).`);
    }
  } else {
    notes.push(`Without business income the choice is made each year with the return (${R.ref('A-10')}).`);
  }

  const flagText: Record<string, string> = {
    carriedForwardLosses: 'Set-off of carried-forward losses is not covered.',
    foreignTaxCredit: 'Foreign tax credit / DTAA relief is not covered.',
    agriculturalIncome: 'Agricultural income aggregation for rate purposes is not covered; tax may be understated.',
    landBuildingAcquiredBefore23Jul2024: 'The s.197(3) option (20% with indexation) for land/building acquired before 23-7-2024 is not covered; tax may be overstated.',
    unexplainedIncome: 'Income taxable under s.195 is not covered.',
    clubbing: 'Clubbing of income is not covered.',
  };
  for (const [k, on] of Object.entries(input.flags ?? {})) {
    if (on && flagText[k]) for (const r of Object.values(results)) r.warnings.push(flagText[k] as string);
  }

  const other = (r: Regime): Regime => (r === 'new' ? 'old' : 'new');
  let recommended: Regime = allowed[0] as Regime;
  if (allowed.length > 1 && results.old.taxPayable < results.new.taxPayable) recommended = 'old';
  const saving = allowed.length > 1 ? results[other(recommended)].taxPayable - results[recommended].taxPayable : 0;

  return { status: 'ok', results, allowedRegimes: allowed, recommended, saving, notes };
}
