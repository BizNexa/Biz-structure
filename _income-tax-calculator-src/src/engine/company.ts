// Domestic companies — private and public share one engine. Regimes: normal provisions (with MAT), s.200, s.201.

import { pct, roundStatutory, type Paise } from './money.ts';
import type { Rules } from './rules.ts';
import { Trace } from './trace.ts';
import { flatLiability, liabilityOn, validateAmounts, type Scheme } from './core.ts';
import { buildEntityProfile, traceLiability, type AltTaxResult, type EntityIncome, type EntityResult, type NotSupported } from './firm.ts';

export type CompanyRegime = 'normal' | 's200' | 's201';

export interface CompanyInput extends EntityIncome {
  resident: boolean;
  companyType: 'private' | 'public';
  regime: CompanyRegime;
  /** Total turnover or gross receipts of tax year 2024-25; null if the company had none (e.g. incorporated later). Normal regime only. */
  turnoverTaxYear2024_25?: Paise | null;
  /** Dividend received from domestic/foreign companies or business trusts (part of `dividend`), for s.148. */
  dividendReceivedForS148?: Paise;
  /** Dividend distributed at least one month before the s.263(1) due date. */
  dividendDistributed?: Paise;
  /** s.146 deduction (additional employee cost) — allowed in every regime. */
  deduction146?: Paise;
  /** Other Chapter VIII deductions — normal regime only; forgone under s.200 / s.201. */
  otherChapterVIIIDeductions?: Paise;
  /** Book profit u/s 206(1)(c) as certified. Normal regime only. */
  bookProfit?: Paise;
  /** MAT credit carried forward under s.115JAA of the 1961 Act as on 31-3-2026. */
  matCreditBroughtForward?: Paise;
  /** Special purpose vehicle referred to in Schedule V Note 2 (25% surcharge under s.200/201). */
  isSpecialPurposeVehicle?: boolean;
  flags?: Partial<Record<'carriedForwardLosses' | 'foreignTaxCredit' | 'unexplainedIncome' | 's201NonManufacturingIncome', boolean>>;
}

const n = (x: Paise | undefined | null): Paise => x ?? 0;

export function computeCompany(input: CompanyInput, R: Rules): EntityResult | NotSupported {
  if (!input.resident) return { status: 'not_supported', reason: 'Foreign / non-resident companies are not supported in this version.' };
  validateAmounts(input);
  const t = new Trace();
  const C = R.company;
  const concessional = input.regime !== 'normal';

  // ---- Deductions
  const s148 = Math.min(n(input.dividendReceivedForS148), n(input.dividendDistributed), n(input.dividend));
  const deductions = [
    { label: 'Inter-corporate dividend deduction', amount: s148, ref: R.ref('C-16') },
    { label: 'Deduction for additional employee cost (s.146)', amount: n(input.deduction146), ref: R.ref('A-22') },
  ];
  if (!concessional) deductions.push({ label: 'Other Chapter VIII deductions', amount: n(input.otherChapterVIIIDeductions), ref: 's.122' });
  else if (n(input.otherChapterVIIIDeductions) > 0) t.note('Other Chapter VIII deductions are forgone under the concessional regime', R.ref('C-04'));

  const { profile, totalIncome } = buildEntityProfile(input, deductions, R, t);

  // ---- Rate and surcharge
  let ratePct: number;
  let rateRef: string;
  let scheme: Scheme;
  if (input.regime === 'normal') {
    const turnover = input.turnoverTaxYear2024_25;
    const within = turnover === null || turnover === undefined ? C.nilTurnoverWithinThreshold : turnover <= C.turnoverThreshold;
    ratePct = within ? C.rateWithinThresholdPct : C.rateOtherwisePct;
    rateRef = R.ref('C-01');
    if (turnover === null || turnover === undefined) t.note(R.assumption('Z-06'), R.ref('Z-06'));
    scheme = { normalTax: (i) => pct(i, ratePct), exemptionLimit: null, surcharge: { kind: 'slab', slabs: C.surcharge, capPct: null } };
  } else {
    ratePct = input.regime === 's200' ? C.s200RatePct : C.s201RatePct;
    rateRef = R.ref(input.regime === 's200' ? 'C-04' : 'C-05');
    const surPct = input.isSpecialPurposeVehicle ? C.concessionalSurchargeSpvPct : C.concessionalSurchargePct;
    scheme = { normalTax: (i) => pct(i, ratePct), exemptionLimit: null, surcharge: { kind: 'flat', pct: surPct } };
  }

  const liab = liabilityOn(profile, scheme, R);
  traceLiability(t, profile, liab, `@ ${ratePct}%`, rateRef, R.ref(concessional ? 'C-07' : 'C-02'), concessional ? null : R.ref('C-03'), R);

  // ---- MAT (normal regime only) and brought-forward MAT credit (s.200 / s.201 only)
  let gross = liab.total;
  let alternateTax: AltTaxResult | null = null;
  let creditSetOff = 0;
  const creditBf = n(input.matCreditBroughtForward);

  if (!concessional) {
    if (input.bookProfit !== undefined) {
      if (R.comparisonBase !== 'tax_before_surcharge_cess') throw new Error(`Comparison base "${R.comparisonBase}" is not implemented`);
      const bp = roundStatutory(input.bookProfit, R.roundMultiple);
      const alt = flatLiability(bp, C.matRatePct, C.surcharge, R);
      const regularTax = liab.base.total;
      const applies = alt.tax > regularTax;
      alternateTax = { deemedIncome: bp, regularTax, alt, applies, creditGenerated: 0, creditSetOff: 0 };
      t.add('Book profit', bp, R.ref('C-15'));
      t.add(`Minimum alternate tax @ ${C.matRatePct}% (compared with income-tax above)`, alt.tax, R.ref('C-10'), R.assumption('Z-08'));
      if (applies) {
        gross = alt.total;
        t.add('MAT payable with surcharge and cess (replaces normal liability)', alt.total, R.ref('C-11'));
        t.note('MAT is final: no credit arises for later years', R.ref('C-13'));
      }
    } else {
      t.warn('Book profit not entered: MAT comparison was not made.');
    }
    if (creditBf > 0) t.note('Brought-forward MAT credit can be set off only after opting for s.200 or s.201', R.ref('C-14'));
  } else {
    t.note('MAT does not apply under the concessional regime', R.ref('C-12'));
    if (creditBf > 0) {
      const capBase = C.matCreditCapBase === 'tax_surcharge_cess' ? liab.total : liab.base.total;
      const cap = pct(capBase, C.matCreditCapPct);
      creditSetOff = Math.min(creditBf, cap);
      alternateTax = { deemedIncome: 0, regularTax: liab.base.total, alt: flatLiability(0, C.matRatePct, C.surcharge, R), applies: false, creditGenerated: 0, creditSetOff };
      t.add(`Less: brought-forward MAT credit set off (limit ${C.matCreditCapPct}% of tax payable)`, -creditSetOff, R.ref('C-14'), R.assumption('Z-07'));
      if (creditBf > creditSetOff) t.add('MAT credit carried forward (subject to the 15-year limit)', creditBf - creditSetOff, R.ref('C-14'));
    }
  }

  const taxPayable = roundStatutory(gross - creditSetOff, R.roundMultiple);
  t.add('Tax payable (rounded to nearest Rs. 10)', taxPayable, R.ref('E-02'));

  // ---- Warnings and notes
  if (input.regime === 's201') {
    t.warn(`s.201 is available only to a company registered on or after 1-10-2019 that commenced manufacture on or before 31-3-2024 (${R.ref('C-06')}). Eligibility is not checked by the engine.`);
    if (input.flags?.s201NonManufacturingIncome) t.warn('Non-manufacturing income, short-term gains on non-depreciable assets and s.205(4) deemed income carry different rates under s.201; this split is not covered and tax may be understated.');
  }
  if (input.flags?.carriedForwardLosses) t.warn('Set-off of carried-forward losses is not covered.');
  if (input.flags?.foreignTaxCredit) t.warn('Foreign tax credit / DTAA relief is not covered.');
  if (input.flags?.unexplainedIncome) t.warn('Income taxable under s.195 is not covered.');

  const notes = ['No rebate and no basic-exemption adjustment for companies; the Rs. 1,25,000 exemption on s.198 gains applies.'];
  if (input.companyType === 'private') {
    notes.push(`Closely held company: loans or advances to a shareholder holding 10% or more of voting power (or to a concern in which the shareholder has substantial interest) are deemed dividend to the extent of accumulated profits (${R.ref('C-19')}).`);
    notes.push(`Closely held company: brought-forward losses lapse on a change in shareholding unless 51% of voting power is held by the same persons (${R.ref('C-20')}).`);
  } else {
    notes.push('Private-company restrictions on deemed dividend and on carry-forward of losses do not apply if the company is one in which the public are substantially interested. Rates are the same.');
  }
  notes.push(`On a buy-back the shareholder is taxed on capital gains; a promoter bears additional tax (${R.ref('C-17')}, ${R.ref('C-18')}).`);

  return { status: 'ok', totalIncome, profile, liability: liab, alternateTax, taxPayable, trace: t.lines, warnings: t.warnings, notes };
}
