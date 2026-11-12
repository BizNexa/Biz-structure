// Shared tax primitives: slab tax, special-rate tax, basic-exemption shortfall,
// surcharge (with the 15% cap), marginal relief, cess, and "flat tax on deemed income" (MAT/AMT/NPO).

import { pct, ratio, type Paise } from './money.ts';
import type { GainKey, ProfileKey, Rules, Slab, SurSlab } from './rules.ts';

/**
 * Total income split by how it is taxed.
 *  normal   – income at slab / entity rate, EXCLUDING dividend
 *  dividend – taxed like normal income, tracked separately for the surcharge cap
 *  flat30   – s.194 winnings, online-game winnings and VDA income
 *  g196/g197/g198 – capital gains under those sections
 */
export interface Profile {
  normal: Paise;
  dividend: Paise;
  flat30: Paise;
  g196: Paise;
  g197: Paise;
  g198: Paise;
}

export const emptyProfile = (): Profile => ({ normal: 0, dividend: 0, flat30: 0, g196: 0, g197: 0, g198: 0 });

export const totalOf = (p: Profile): Paise => p.normal + p.dividend + p.flat30 + p.g196 + p.g197 + p.g198;

/** Take `amount` out of the profile, exhausting keys in the given order. Returns the new profile and what could not be absorbed. */
export function reduceProfile(p: Profile, amount: Paise, order: readonly ProfileKey[]): { profile: Profile; unabsorbed: Paise } {
  const q = { ...p };
  let left = amount;
  for (const k of order) {
    const cut = Math.min(q[k], left);
    q[k] -= cut;
    left -= cut;
  }
  return { profile: q, unabsorbed: left };
}

export type SurchargeScheme =
  | { kind: 'slab'; slabs: SurSlab[]; capPct: number | null }
  | { kind: 'flat'; pct: number };

export interface Scheme {
  /** Tax on normal-rate income (normal + dividend). */
  normalTax: (income: Paise) => Paise;
  /** Maximum amount not chargeable; null where no shortfall adjustment is available. */
  exemptionLimit: Paise | null;
  surcharge: SurchargeScheme;
}

export function slabTax(income: Paise, slabs: readonly Slab[]): Paise {
  let tax = 0;
  let lower = 0;
  for (const s of slabs) {
    const upper = s.upto === null ? income : Math.min(income, s.upto);
    if (upper > lower) tax += pct(upper - lower, s.ratePct);
    if (s.upto === null || income <= s.upto) break;
    lower = s.upto;
  }
  return tax;
}

export interface BaseTax {
  normalRateIncome: Paise;
  shortfallUsed: Record<GainKey, Paise>;
  taxableGains: Record<GainKey, Paise>;
  exemption198Used: Paise;
  slabTax: Paise;
  t196: Paise;
  t197: Paise;
  t198: Paise;
  tFlat: Paise;
  total: Paise;
}

/** Income-tax before rebate, surcharge and cess. */
export function baseTaxes(p: Profile, scheme: Scheme, R: Rules): BaseTax {
  const normalRateIncome = p.normal + p.dividend;
  const taxableGains: Record<GainKey, Paise> = { g196: p.g196, g197: p.g197, g198: p.g198 };
  const shortfallUsed: Record<GainKey, Paise> = { g196: 0, g197: 0, g198: 0 };

  if (scheme.exemptionLimit !== null) {
    // ss.196(2), 197(2), 198(3): total income other than the gains falls short of the exemption limit.
    let shortfall = Math.max(0, scheme.exemptionLimit - (normalRateIncome + p.flat30));
    for (const k of R.shortfallOrder) {
      const cut = Math.min(taxableGains[k], shortfall);
      taxableGains[k] -= cut;
      shortfallUsed[k] = cut;
      shortfall -= cut;
    }
  }

  const exemption198Used = Math.min(taxableGains.g198, R.special.ltcg198Exemption);
  const st = scheme.normalTax(normalRateIncome);
  const t196 = pct(taxableGains.g196, R.special.stcg196Pct);
  const t197 = pct(taxableGains.g197, R.special.ltcg197Pct);
  const t198 = pct(taxableGains.g198 - exemption198Used, R.special.ltcg198Pct);
  const tFlat = pct(p.flat30, R.special.flatPct);

  return {
    normalRateIncome, shortfallUsed, taxableGains, exemption198Used,
    slabTax: st, t196, t197, t198, tFlat,
    total: st + t196 + t197 + t198 + tFlat,
  };
}

function highestRate(slabs: readonly SurSlab[], ti: Paise, tiExcl: Paise, skipExcluding: boolean): number {
  let rate = 0;
  for (const s of slabs) {
    if (skipExcluding && s.exclCapped) continue;
    if ((s.exclCapped ? tiExcl : ti) > s.over) rate = Math.max(rate, s.pct);
  }
  return rate;
}

interface RawLiability {
  base: BaseTax;
  surcharge: Paise;
  rateOther: number;
  rateCapped: number;
  cappedTax: Paise;
}

function rawLiability(p: Profile, scheme: Scheme, R: Rules, rebate: Paise): RawLiability {
  const base = baseTaxes(p, scheme, R);
  const taxAfterRebate = base.total - rebate;
  const sc = scheme.surcharge;

  if (sc.kind === 'flat') {
    return { base, surcharge: pct(taxAfterRebate, sc.pct), rateOther: sc.pct, rateCapped: sc.pct, cappedTax: 0 };
  }

  const ti = totalOf(p);
  if (sc.capPct === null) {
    const rate = highestRate(sc.slabs, ti, ti, false);
    return { base, surcharge: pct(taxAfterRebate, rate), rateOther: rate, rateCapped: rate, cappedTax: 0 };
  }

  // Individuals etc.: tax on dividend and on ss.196/197/198 gains carries surcharge of at most capPct.
  const tiExcl = p.normal + p.flat30;
  const dividendTax = base.normalRateIncome > 0 ? ratio(base.slabTax, p.dividend, base.normalRateIncome) : 0;
  const cappedTax = base.t196 + base.t197 + base.t198 + dividendTax;
  const otherTax = Math.max(0, taxAfterRebate - cappedTax);
  const rateOther = highestRate(sc.slabs, ti, tiExcl, false);
  const rateCapped = Math.min(sc.capPct, highestRate(sc.slabs, ti, tiExcl, true));
  return {
    base,
    surcharge: pct(otherTax, rateOther) + pct(Math.min(cappedTax, taxAfterRebate), rateCapped),
    rateOther, rateCapped, cappedTax,
  };
}

export interface Liability {
  base: BaseTax;
  rebate: Paise;
  surchargeBeforeRelief: Paise;
  marginalRelief: Paise;
  surcharge: Paise;
  rateOther: number;
  rateCapped: number;
  cess: Paise;
  /** income-tax − rebate + surcharge + cess, before statutory rounding and credits. */
  total: Paise;
}

function largestBelow(values: readonly Paise[], x: Paise): Paise | null {
  let best: Paise | null = null;
  for (const t of values) if (x > t && (best === null || t > best)) best = t;
  return best;
}

/** Tax, surcharge with marginal relief, and cess on a profile. */
export function liabilityOn(p: Profile, scheme: Scheme, R: Rules, rebate: Paise = 0): Liability {
  const raw = rawLiability(p, scheme, R, rebate);
  const taxAfterRebate = raw.base.total - rebate;
  const actual = taxAfterRebate + raw.surcharge;
  let payable = actual;

  const sc = scheme.surcharge;
  if (sc.kind === 'slab' && raw.surcharge > 0) {
    const ti = totalOf(p);

    // Relief by reference to the total-income threshold just crossed.
    const t = largestBelow(sc.slabs.map((s) => s.over), ti);
    if (t !== null) {
      const at = rawLiability(reduceProfile(p, ti - t, R.reliefReductionOrder).profile, scheme, R, 0);
      payable = Math.min(payable, at.base.total + at.surcharge + (ti - t));
    }

    // Relief by reference to the threshold tested on income excluding capped incomes.
    if (sc.capPct !== null && R.reliefOnExcludingThresholds) {
      const tiExcl = p.normal + p.flat30;
      const tx = largestBelow(sc.slabs.filter((s) => s.exclCapped).map((s) => s.over), tiExcl);
      if (tx !== null) {
        const at = rawLiability(reduceProfile(p, tiExcl - tx, ['normal', 'flat30']).profile, scheme, R, 0);
        payable = Math.min(payable, at.base.total + at.surcharge + (tiExcl - tx));
      }
    }
  }

  const marginalRelief = actual - payable;
  const surcharge = raw.surcharge - marginalRelief;
  const cess = pct(payable, R.cessPct);
  return {
    base: raw.base, rebate,
    surchargeBeforeRelief: raw.surcharge, marginalRelief, surcharge,
    rateOther: raw.rateOther, rateCapped: raw.rateCapped,
    cess, total: payable + cess,
  };
}

export interface FlatLiability {
  income: Paise;
  tax: Paise;
  surchargeRate: number;
  surchargeBeforeRelief: Paise;
  marginalRelief: Paise;
  surcharge: Paise;
  cess: Paise;
  total: Paise;
}

/** A single flat rate on a deemed income (MAT on book profit, AMT on adjusted total income, s.334 specified income). */
export function flatLiability(income: Paise, ratePct: number, slabs: readonly SurSlab[], R: Rules): FlatLiability {
  const tax = pct(income, ratePct);
  const surchargeRate = highestRate(slabs, income, income, false);
  const surchargeBeforeRelief = pct(tax, surchargeRate);
  let payable = tax + surchargeBeforeRelief;

  const t = largestBelow(slabs.map((s) => s.over), income);
  if (t !== null && surchargeBeforeRelief > 0) {
    const taxAt = pct(t, ratePct);
    const atThreshold = taxAt + pct(taxAt, highestRate(slabs, t, t, false));
    payable = Math.min(payable, atThreshold + (income - t));
  }

  const marginalRelief = tax + surchargeBeforeRelief - payable;
  const cess = pct(payable, R.cessPct);
  return {
    income, tax, surchargeRate, surchargeBeforeRelief, marginalRelief,
    surcharge: surchargeBeforeRelief - marginalRelief, cess, total: payable + cess,
  };
}

/** Reject negative or fractional amounts anywhere in an input object. */
export function validateAmounts(input: unknown, path = 'input'): void {
  if (typeof input === 'number') {
    if (!Number.isSafeInteger(input)) throw new Error(`${path}: must be a whole number of paise`);
    if (input < 0) throw new Error(`${path}: negative amounts are not accepted in v1 (losses are not covered, except house-property interest)`);
  } else if (input !== null && typeof input === 'object') {
    for (const [k, val] of Object.entries(input)) validateAmounts(val, `${path}.${k}`);
  }
}
