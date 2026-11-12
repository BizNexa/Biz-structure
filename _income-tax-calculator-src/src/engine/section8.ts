// Section 8 company. Not a registered non-profit organisation -> taxed exactly as a company.
// Registered u/s 332 -> Part XVII-B computation.

import { pct, roundStatutory, type Paise } from './money.ts';
import type { Rules } from './rules.ts';
import { Trace, type TraceLine } from './trace.ts';
import { flatLiability, validateAmounts, type FlatLiability } from './core.ts';
import { computeCompany, type CompanyInput } from './company.ts';
import type { EntityResult, NotSupported } from './firm.ts';

export interface NpoInput {
  /** Regular income u/s 335, excluding corpus donations and excluding anonymous donations. */
  regularIncome: Paise;
  /** Sums applied for the registered purposes in India (s.341(1)(a)), other than donations to other NPOs. */
  appliedForObjects: Paise;
  /** Donations (not corpus) paid to other registered NPOs — counted at the statutory percentage. */
  donationsToOtherNpos?: Paise;
  /** Deemed application opted for u/s 341(5). */
  deemedApplication?: Paise;
  /** Income accumulated or set apart u/s 342 with the prescribed statement. */
  accumulated?: Paise;
  anonymousDonations?: Paise;
  /** All donations received in the year, for the 5% test. */
  totalDonationsReceived?: Paise;
  /** NPO created wholly for religious purposes: anonymous donations are not specified income. */
  whollyReligious?: boolean;
  /** Other specified income u/s 337 Table Sl. 2-13. */
  otherSpecifiedIncome?: Paise;
}

export type Section8Input =
  | { registeredNpo: false; company: CompanyInput }
  | { registeredNpo: true; resident: boolean; npo: NpoInput };

export type NpoResult =
  | {
      status: 'ok';
      taxableRegularIncome: Paise;
      specifiedIncome: Paise;
      totalIncome: Paise;
      liability: FlatLiability;
      taxPayable: Paise;
      trace: TraceLine[];
      warnings: string[];
      notes: string[];
    }
  | {
      status: 'blocked';
      reason: string;
      taxableRegularIncome: Paise;
      specifiedIncome: Paise;
      trace: TraceLine[];
      warnings: string[];
    };

const n = (x: Paise | undefined): Paise => x ?? 0;

export function computeSection8(input: Section8Input, R: Rules): EntityResult | NpoResult | NotSupported {
  if (!input.registeredNpo) return computeCompany(input.company, R);
  if (!input.resident) return { status: 'not_supported', reason: 'Non-residents are not supported in this version.' };
  validateAmounts(input.npo);

  const t = new Trace();
  const N = R.npo;
  const x = input.npo;

  // ---- Taxable regular income (s.336)
  t.add('Regular income', x.regularIncome, R.ref('D-03'));
  const donationApplication = pct(n(x.donationsToOtherNpos), N.donationToNpoPct);
  const applied = x.appliedForObjects + donationApplication + n(x.deemedApplication);
  t.add('Applied for charitable or religious purposes in India', x.appliedForObjects, R.ref('D-06'));
  if (donationApplication > 0) t.add(`Donations to other registered NPOs, counted at ${N.donationToNpoPct}%`, donationApplication, R.ref('D-06'));
  if (n(x.deemedApplication) > 0) t.add('Deemed application (option u/s 341(5))', n(x.deemedApplication), R.ref('D-07'));
  if (n(x.accumulated) > 0) t.add('Accumulated or set apart (s.342)', n(x.accumulated), R.ref('D-08'));

  const required = pct(x.regularIncome, N.applicationThresholdPct);
  const appliedOrAccumulated = applied + n(x.accumulated);
  t.add(`${N.applicationThresholdPct}% of regular income`, required, R.ref('D-04'));
  const taxableRegular = Math.max(0, required - appliedOrAccumulated);
  t.add('Taxable regular income', taxableRegular, R.ref('D-04'));

  // ---- Specified income (s.337)
  let anonymousTaxable = 0;
  if (n(x.anonymousDonations) > 0 && !x.whollyReligious) {
    const exempt = Math.max(N.anonymousFloor, pct(n(x.totalDonationsReceived), N.anonymousPctOfDonations));
    anonymousTaxable = Math.max(0, n(x.anonymousDonations) - exempt);
    t.add('Anonymous donations', n(x.anonymousDonations), R.ref('D-10'));
    t.add(`Less: higher of the fixed floor or ${N.anonymousPctOfDonations}% of total donations`, -Math.min(exempt, n(x.anonymousDonations)), R.ref('D-10'));
  }
  const specified = anonymousTaxable + n(x.otherSpecifiedIncome);
  if (n(x.otherSpecifiedIncome) > 0) t.add('Other specified income', n(x.otherSpecifiedIncome), R.ref('D-11'));
  t.add('Specified income', specified, R.ref('D-10'));

  const warnings = t.warnings;
  t.warn('Capital gains treated as application (s.341(9)) and tax on accreted income (s.352) are not computed.');

  if (taxableRegular > 0 && N.regularIncomeRate === null) {
    return {
      status: 'blocked',
      reason: `The rate on taxable regular income of a Section 8 company registered as a non-profit organisation has not been confirmed (rule Z-11, open question Q16). Tax cannot be computed until it is.`,
      taxableRegularIncome: taxableRegular, specifiedIncome: specified, trace: t.lines, warnings,
    };
  }
  if (taxableRegular > 0) throw new Error(`Regular-income rate "${N.regularIncomeRate}" is set in the rules but not implemented in the engine`);

  // Only specified income is taxable: flat rate with domestic-company surcharge slabs (FA 2026 s.3(4)(b) Table Sl.6 covers s.334).
  const totalIncome = roundStatutory(specified, R.roundMultiple);
  const liability = flatLiability(totalIncome, N.specifiedIncomePct, R.company.surcharge, R);
  t.add('Total income (rounded to nearest Rs. 10)', totalIncome, R.ref('E-02'));
  t.add(`Tax on specified income @ ${N.specifiedIncomePct}%`, liability.tax, R.ref('D-02'));
  if (liability.surchargeBeforeRelief > 0) {
    t.add(`Surcharge @ ${liability.surchargeRate}%`, liability.surchargeBeforeRelief, R.ref('C-02'));
    if (liability.marginalRelief > 0) t.add('Less: marginal relief', -liability.marginalRelief, R.ref('C-03'));
  }
  t.add(`Health and Education Cess @ ${R.cessPct}%`, liability.cess, R.ref('E-01'));
  const taxPayable = roundStatutory(liability.total, R.roundMultiple);
  t.add('Tax payable (rounded to nearest Rs. 10)', taxPayable, R.ref('E-02'));

  return {
    status: 'ok', taxableRegularIncome: taxableRegular, specifiedIncome: specified, totalIncome, liability, taxPayable,
    trace: t.lines, warnings,
    notes: [
      `15% of regular income is deemed accumulated and must be kept in permitted modes (${R.ref('D-05')}).`,
      `Conversion, merger with a non-NPO, dissolution and similar events attract tax on accreted income at the maximum marginal rate (${R.ref('D-13')}).`,
    ],
  };
}
