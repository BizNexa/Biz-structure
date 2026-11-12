// The ONLY place where statutory values enter the engine. Everything is read by rule ID
// from rules/ty2026-27.json; no rate or threshold is written in engine code.

import { rupees, type Paise } from './money.ts';

export interface RawRule {
  id: string;
  desc: string;
  value: any;
  sec2025: string;
  extract: string;
}

export interface RawRuleFile {
  meta: { title: string; status: string; extracted_on: string };
  rules: RawRule[];
}

export interface Slab {
  upto: Paise | null;
  ratePct: number;
}

export interface SurSlab {
  over: Paise;
  pct: number;
  /** true when the slab test uses total income EXCLUDING dividend and ss.196/197/198 gains. */
  exclCapped: boolean;
}

export type GainKey = 'g196' | 'g197' | 'g198';
export type ProfileKey = 'normal' | 'dividend' | 'flat30' | GainKey;

const profileKey = (k: string): ProfileKey => (/^\d/.test(k) ? `g${k}` : k) as ProfileKey;

export function buildRules(file: RawRuleFile) {
  const byId = new Map(file.rules.map((r) => [r.id, r]));
  const rule = (id: string): RawRule => {
    const r = byId.get(id);
    if (!r) throw new Error(`Rule ${id} is missing from the rules file`);
    return r;
  };
  const v = (id: string): any => rule(id).value;
  /** Section reference with rule ID, for trace lines. */
  const ref = (id: string): string => {
    const sec = rule(id).sec2025;
    return `${/^\d/.test(sec) ? 's.' : ''}${sec} [${id}]`;
  };
  const rs = (n: number | null): Paise | null => (n === null ? null : rupees(n));
  const slabs = (id: string): Slab[] =>
    (v(id) as any[]).map((s) => ({ upto: rs(s.upto), ratePct: s.rate_pct }));
  const surSlabs = (list: any[]): SurSlab[] =>
    list.map((s) => ({ over: rupees(s.over), pct: s.pct, exclCapped: Boolean(s.ti_excludes) }));
  const fraction = (text: string): { num: number; den: number } => {
    const [num, den] = text.split('/').map(Number);
    if (!num || !den) throw new Error(`Bad fraction "${text}"`);
    return { num, den };
  };

  const oldSurcharge = surSlabs(v('A-60'));

  return {
    meta: file.meta,
    ref,
    /** Text of assumption / decision rules, shown in traces. */
    assumption: (id: string): string => `${rule(id).desc} (${rule(id).extract})`,

    cessPct: v('E-01').pct as number,
    roundMultiple: rupees(v('E-02').multiple),

    ages: { senior: v('A-07').senior_age as number, superSenior: v('A-07').super_senior_age as number },

    newRegime: {
      slabs: slabs('A-02'),
      exemption: rupees(v('A-03')),
      rebateLimit: rupees(v('A-12').ti_limit),
      rebateMax: rupees(v('A-12').max_rebate),
      surcharge: surSlabs(v('A-61')),
      stdDeduction: rupees(v('A-19').new_regime),
      familyPensionCap: rupees(v('A-20').new_regime_cap),
      employerPensionPctOther: v('A-25').other_employer_new_regime_pct as number,
    },
    oldRegime: {
      slabsGeneral: slabs('A-04'),
      slabsSenior: slabs('A-05'),
      slabsSuperSenior: slabs('A-06'),
      exemptionGeneral: rupees(v('A-08').general_and_huf),
      exemptionSenior: rupees(v('A-08').resident_60_to_79),
      exemptionSuperSenior: rupees(v('A-08').resident_80_plus),
      rebateLimit: rupees(v('A-11').ti_limit),
      rebateMax: rupees(v('A-11').max_rebate),
      rebateExcludedTax: v('Z-01').old_regime_rebate_excluded_tax as string[],
      surcharge: oldSurcharge,
      stdDeduction: rupees(v('A-19').old_regime),
      familyPensionCap: rupees(v('A-20').old_regime_cap),
      employerPensionPctOther: v('A-25').other_employer_old_regime_pct as number,
    },
    surchargeCapPct: v('A-62').cap_pct as number,
    employerPensionPctGovt: v('A-25').central_or_state_govt_employer_pct as number,
    familyPensionFraction: fraction(v('A-20').fraction),
    newRegimeMarginalRebateBase: v('Z-03').new_regime_marginal_rebate_tax_base as string,

    house: {
      standardDeductionPct: v('A-45').standard_deduction_pct_of_annual_value as number,
      selfOccupiedCapHigher: rupees(v('A-44').cap_acquired_or_constructed_within_5_years_with_certificate),
      selfOccupiedCapLower: rupees(v('A-44').cap_otherwise),
      selfOccupiedAggregateCap: rupees(v('A-44').aggregate_cap_all_self_occupied),
      lossSetOffCap: rupees(v('A-68').cap),
      arrearsDeductionPct: v('A-69').deduction_pct as number,
    },

    presumptive: {
      business: {
        digitalPct: v('P-01').digital_pct as number,
        otherPct: v('P-01').other_pct as number,
        limit: rupees(v('P-01').turnover_limit),
        limitLowCash: rupees(v('P-01').turnover_limit_low_cash),
        cashLimitPct: v('P-01').cash_limit_pct_of_turnover as number,
      },
      profession: {
        pct: v('P-02').pct as number,
        limit: rupees(v('P-02').receipts_limit),
        limitLowCash: rupees(v('P-02').receipts_limit_low_cash),
        cashLimitPct: v('P-02').cash_limit_pct_of_receipts as number,
      },
    },

    ded: {
      s123Cap: rupees(v('A-27').cap),
      pensionOwnCap: rupees(v('A-28').cap),
      healthCap: rupees(v('A-29').self_family_insurance_cghs_checkup),
      healthCapSenior: rupees(v('A-29').senior_substitute_for_25000),
      dependantDisability: rupees(v('A-31').disability),
      dependantSevere: rupees(v('A-31').severe_disability),
      medicalTreatmentCap: rupees(v('A-32').cap),
      medicalTreatmentCapSenior: rupees(v('A-32').cap_if_patient_senior_citizen),
      housingLoan130Cap: rupees(v('A-34').cap),
      housingLoan131Cap: rupees(v('A-35').cap),
      evLoanCap: rupees(v('A-36').cap),
      donationFullPct: v('A-37').pct_full as number,
      donationHalfPct: v('A-37').pct_half as number,
      donationQualifyingPct: v('A-37').qualifying_limit_pct_of_adjusted_gti as number,
      rentExcessPct: v('A-38').excess_over_pct_of_total_income as number,
      rentMonthlyCap: rupees(v('A-38').monthly_cap),
      rentIncomeCapPct: v('A-38').pct_of_total_income_cap as number,
      rentMonths: v('Z-17').rent_months as number,
      savingsInterestCap: rupees(v('A-41').non_senior_individual_or_huf.cap),
      seniorInterestCap: rupees(v('A-41').senior_citizen_individual.cap),
      selfDisability: rupees(v('A-42').disability),
      selfSevere: rupees(v('A-42').severe_disability),
    },

    special: {
      stcg196Pct: v('A-48').rate_pct as number,
      ltcg198Pct: v('A-49').rate_pct as number,
      ltcg198Exemption: rupees(v('A-49').annual_exemption),
      ltcg197Pct: v('A-50').rate_pct as number,
      /** Lottery etc., online games and VDA all carry the same rate; checked at load. */
      flatPct: (() => {
        const rates = ['A-52', 'A-53', 'A-54'].map((id) => v(id).rate_pct as number);
        if (new Set(rates).size !== 1) throw new Error('Winnings / online games / VDA rates differ; engine expects one rate');
        return rates[0] as number;
      })(),
    },
    shortfallOrder: (v('Z-04').shortfall_order as string[]).map(profileKey) as GainKey[],
    reliefReductionOrder: (v('Z-05').reduction_order as string[]).map(profileKey),
    reliefOnExcludingThresholds: Boolean(v('Z-05').relief_on_excluding_thresholds),

    amt: {
      ratePct: v('A-66').rate_pct as number,
      thresholdIndHuf: rupees(v('A-65').adjusted_total_income_threshold_ind_huf),
      /** Surcharge on tax u/s 206 for individuals etc.: plain total-income slabs, no carve-out. */
      surchargeIndHuf: oldSurcharge.map((s) => ({ ...s, exclCapped: false })),
    },
    comparisonBase: v('Z-08').mat_amt_comparison_base as string,
    creditSetOffPoint: v('Z-15').credit_setoff_point as string,

    firm: {
      ratePct: v('B-02').rate_pct as number,
      surcharge: surSlabs([v('B-03')]),
      remuneration: {
        firstSlab: rupees(v('B-06').first_slab_book_profit),
        floor: rupees(v('B-06').first_slab_floor),
        firstPct: v('B-06').first_slab_pct as number,
        balancePct: v('B-06').balance_pct as number,
      },
      interestPctPerAnnum: v('B-07').rate_pct_simple_pa as number,
    },

    company: {
      turnoverThreshold: rupees(v('C-01').turnover_threshold),
      rateWithinThresholdPct: v('C-01').rate_if_not_exceeding_pct as number,
      rateOtherwisePct: v('C-01').rate_otherwise_pct as number,
      nilTurnoverWithinThreshold: Boolean(v('Z-06').nil_turnover_not_exceeding),
      surcharge: surSlabs(v('C-02')),
      s200RatePct: v('C-04').rate_pct as number,
      s201RatePct: v('C-05').rate_pct as number,
      concessionalSurchargePct: v('C-07').pct as number,
      concessionalSurchargeSpvPct: v('C-07').pct_if_special_purpose_vehicle_sch_V_note_2 as number,
      matRatePct: v('C-10').rate_pct as number,
      matCreditCapPct: v('C-14').set_off_cap_pct_of_tax_payable as number,
      matCreditCapBase: v('Z-07').mat_credit_cap_base as string,
    },

    npo: {
      specifiedIncomePct: v('D-02').specified_income_rate_pct as number,
      applicationThresholdPct: v('D-04').application_threshold_pct as number,
      donationToNpoPct: v('D-06').donation_to_other_npo_pct as number,
      anonymousFloor: rupees(v('D-10').exempt_floor),
      anonymousPctOfDonations: v('D-10').exempt_pct_of_total_donations as number,
      /** null until the CA rules on OPEN_QUESTIONS Q16. */
      regularIncomeRate: v('Z-11').npo_company_regular_income_rate as string | null,
    },

    advance: {
      minLiability: rupees(v('E-03').min_tax_payable),
      exemptSeniorAge: v('E-04').age as number,
      instalments: (v('E-05') as any[]).map((i) => ({ due: i.due as string, cumulativePct: i.cumulative_pct as number })),
      defaultInterestPctPerMonth: v('E-08').rate_pct_per_month_or_part as number,
      defaultMinPaidPct: v('E-08').min_paid_pct_of_assessed_tax as number,
      deferment: (v('E-09') as any[]).map((d) => ({
        due: d.due as string,
        requiredPct: d.required_pct as number,
        interestPct: d.interest_pct_of_shortfall as number,
        safeHarbourPct: (d.safe_harbour_paid_pct ?? null) as number | null,
      })),
    },

    notCovered: v('Z-12').not_covered as string[],
  };
}

export type Rules = ReturnType<typeof buildRules>;
