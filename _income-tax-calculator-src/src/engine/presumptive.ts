// Presumptive income u/s 58: business (Table Sl.1) and specified profession (Table Sl.3).
// Shared by individuals, HUFs and firms. Goods carriages (Sl.2) are not covered.

import { pct, type Paise } from './money.ts';
import type { Rules } from './rules.ts';
import type { Trace } from './trace.ts';

export interface PresumptiveInput {
  businessDigitalReceipts?: Paise;
  businessOtherReceipts?: Paise;
  /** Cash receipts, for the 5% cash test. */
  businessCashReceipts?: Paise;
  businessProfitClaimed?: Paise;
  professionReceipts?: Paise;
  professionCashReceipts?: Paise;
  professionProfitClaimed?: Paise;
}

const n = (x: Paise | undefined): Paise => x ?? 0;

/**
 * Higher of the presumptive amount and the profit claimed, for each of business and profession.
 * `businessBar` / `professionBar` give a reason when the assessee is not eligible; the figure is then
 * still shown (the CA may be testing it) but a warning is raised.
 */
export function presumptiveIncome(
  x: PresumptiveInput | undefined,
  opts: { claimsChapterVIIIC: boolean; businessBar?: string | null; professionBar?: string | null },
  R: Rules,
  t: Trace,
): Paise {
  if (!x) return 0;
  let total = 0;

  const digital = n(x.businessDigitalReceipts);
  const other = n(x.businessOtherReceipts);
  const turnover = digital + other;
  if (turnover > 0 || n(x.businessProfitClaimed) > 0) {
    const B = R.presumptive.business;
    const lowCash = n(x.businessCashReceipts) <= pct(turnover, B.cashLimitPct);
    const limit = lowCash ? B.limitLowCash : B.limit;
    const deemed = pct(digital, B.digitalPct) + pct(other, B.otherPct);
    const income = Math.max(deemed, n(x.businessProfitClaimed));
    t.add(`Presumptive business income: ${B.digitalPct}% of digital receipts + ${B.otherPct}% of other receipts, or profit claimed if higher`, income, R.ref('P-01'));
    if (turnover > limit) t.warn(`Business turnover exceeds the s.58 limit for presumptive taxation; the presumptive figure shown may not be available. Books of account and audit may be required (${R.ref('P-01')}).`);
    if (opts.claimsChapterVIIIC) t.warn(`An assessee claiming a Chapter VIII-C deduction is not an eligible assessee for presumptive business income (${R.ref('P-01')}).`);
    if (opts.businessBar) t.warn(`${opts.businessBar} (${R.ref('P-01')}).`);
    total += income;
  }

  const receipts = n(x.professionReceipts);
  if (receipts > 0 || n(x.professionProfitClaimed) > 0) {
    const P = R.presumptive.profession;
    const lowCash = n(x.professionCashReceipts) <= pct(receipts, P.cashLimitPct);
    const limit = lowCash ? P.limitLowCash : P.limit;
    const income = Math.max(pct(receipts, P.pct), n(x.professionProfitClaimed));
    t.add(`Presumptive professional income: ${P.pct}% of gross receipts, or profit claimed if higher`, income, R.ref('P-02'));
    if (receipts > limit) t.warn(`Professional receipts exceed the s.58 limit for presumptive taxation (${R.ref('P-02')}).`);
    if (opts.professionBar) t.warn(`${opts.professionBar} (${R.ref('P-02')}).`);
    total += income;
  }
  return total;
}
