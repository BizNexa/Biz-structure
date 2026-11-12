// Money is always an integer number of paise. No floating-point amounts anywhere in the engine.

export type Paise = number;

const PAISE_PER_RUPEE = 100;
const PERCENT = 100;
/** Rates are held to two decimal places of a percent (e.g. 12.5, 18.5, 9.5). */
const RATE_PRECISION = 100;

export const rupees = (r: number): Paise => assertPaise(Math.round(r * PAISE_PER_RUPEE));

export function assertPaise(n: number, what = 'amount'): Paise {
  if (!Number.isSafeInteger(n)) throw new Error(`${what} must be a whole number of paise, got ${n}`);
  return n;
}

/** Integer division of non-negative BigInts, rounding half up. */
function divHalfUp(num: bigint, den: bigint): bigint {
  return (num * 2n + den) / (den * 2n);
}

/** amount x ratePct / 100, rounded half up to the paisa. amount must be >= 0. */
export function pct(amount: Paise, ratePct: number): Paise {
  if (amount < 0) throw new Error(`pct() expects a non-negative amount, got ${amount}`);
  const scaledRate = BigInt(Math.round(ratePct * RATE_PRECISION));
  return Number(divHalfUp(BigInt(amount) * scaledRate, BigInt(PERCENT * RATE_PRECISION)));
}

/** amount x num / den, rounded half up. All arguments must be >= 0 and den > 0. */
export function ratio(amount: Paise, num: number, den: number): Paise {
  if (den <= 0) throw new Error('ratio() needs a positive denominator');
  return Number(divHalfUp(BigInt(amount) * BigInt(num), BigInt(den)));
}

/**
 * Statutory rounding (s.516): ignore paise, then round to the nearest multiple,
 * rounding up when the remainder is half the multiple or more.
 * `multiple` is given in paise (e.g. Rs. 10 = 1000 paise).
 */
export function roundStatutory(amount: Paise, multiple: Paise): Paise {
  const sign = amount < 0 ? -1 : 1;
  const abs = Math.abs(amount);
  const wholeRupees = abs - (abs % PAISE_PER_RUPEE);
  const rem = wholeRupees % multiple;
  const rounded = rem * 2 >= multiple ? wholeRupees - rem + multiple : wholeRupees - rem;
  return sign * rounded;
}

export const toRupees = (p: Paise): number => p / PAISE_PER_RUPEE;
