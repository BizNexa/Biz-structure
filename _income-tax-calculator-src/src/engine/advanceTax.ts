// Advance-tax schedule (s.408) and estimated interest for default (s.424) and deferment (s.425).

import { pct, type Paise } from './money.ts';
import type { Rules } from './rules.ts';
import { validateAmounts } from './core.ts';

export interface AdvanceTaxInput {
  /** Tax payable for the year (after rebate, surcharge, cess and credits). */
  taxPayable: Paise;
  /** Tax deducted or collected at source during the year. */
  tdsTcs?: Paise;
  /** Declares income u/s 58(2) Table Sl. 1 or 3 (presumptive): single instalment by 15 March. */
  presumptive?: boolean;
  /** Resident individual aged 60 or more with no business or profession income. */
  seniorWithoutBusinessIncome?: boolean;
  /** Advance tax actually paid, cumulative, by each of the four due dates. Omit to see the schedule only. */
  cumulativePaid?: [Paise, Paise, Paise, Paise];
  /** Months (or part) from 1 April after the tax year to the date of payment / determination, for s.424. */
  monthsOfDefault?: number;
}

export interface InstalmentLine {
  due: string;
  cumulativePct: number;
  cumulativeAmount: Paise;
  instalment: Paise;
  paid: Paise | null;
  shortfall: Paise | null;
  defermentInterest: Paise | null;
}

export interface AdvanceTaxResult {
  liable: boolean;
  reason: string;
  netTax: Paise;
  schedule: InstalmentLine[];
  /** null when payments were not supplied. */
  defermentInterest: Paise | null;
  defaultInterest: Paise | null;
  refs: string[];
  notes: string[];
}

export function computeAdvanceTax(input: AdvanceTaxInput, R: Rules): AdvanceTaxResult {
  validateAmounts(input);
  const A = R.advance;
  const netTax = Math.max(0, input.taxPayable - (input.tdsTcs ?? 0));
  const refs = [R.ref('E-03'), R.ref('E-05'), R.ref('E-08'), R.ref('E-09')];
  const notes = [
    'Estimate only. Interest on shortfall caused by capital gains, winnings, first-time business income or dividend is waived if the tax is paid in the remaining instalments or by 31 March; that waiver is not applied here.',
    R.assumption('Z-10'),
  ];
  const none = (reason: string): AdvanceTaxResult =>
    ({ liable: false, reason, netTax, schedule: [], defermentInterest: null, defaultInterest: null, refs, notes });

  if (input.seniorWithoutBusinessIncome) return none(`Resident individual aged ${A.exemptSeniorAge} or more without business income: no advance tax (${R.ref('E-04')}).`);
  if (netTax < A.minLiability) return none(`Tax payable after TDS/TCS is below the advance-tax threshold (${R.ref('E-03')}).`);

  const paid = input.cumulativePaid ?? null;
  const last = A.instalments.length - 1;
  const schedule: InstalmentLine[] = [];
  let previous = 0;
  let deferment = 0;

  A.instalments.forEach((inst, i) => {
    if (input.presumptive && i !== last) return;
    const cumulativeAmount = pct(netTax, inst.cumulativePct);
    const d = A.deferment[i];
    if (!d) throw new Error(`No deferment rule for instalment ${inst.due}`);
    let shortfall: Paise | null = null;
    let interest: Paise | null = null;
    const paidHere = paid ? (paid[i] as Paise) : null;
    if (paidHere !== null) {
      const safe = d.safeHarbourPct !== null && !input.presumptive && paidHere >= pct(netTax, d.safeHarbourPct);
      shortfall = safe ? 0 : Math.max(0, cumulativeAmount - paidHere);
      interest = pct(shortfall, d.interestPct);
      deferment += interest;
    }
    schedule.push({
      due: inst.due, cumulativePct: inst.cumulativePct, cumulativeAmount,
      instalment: cumulativeAmount - previous, paid: paidHere, shortfall, defermentInterest: interest,
    });
    previous = cumulativeAmount;
  });

  let defaultInterest: Paise | null = null;
  if (paid && input.monthsOfDefault !== undefined) {
    const totalPaid = paid[last] as Paise;
    defaultInterest = totalPaid >= pct(netTax, A.defaultMinPaidPct)
      ? 0
      : pct(netTax - totalPaid, A.defaultInterestPctPerMonth * input.monthsOfDefault);
  }

  return {
    liable: true,
    reason: input.presumptive ? `Presumptive income: whole amount by the last instalment (${R.ref('E-06')}).` : `Four instalments (${R.ref('E-05')}).`,
    netTax, schedule, defermentInterest: paid ? deferment : null, defaultInterest, refs, notes,
  };
}
