// Phase 2 test cases. EVERY expected figure is the assistant's own hand computation:
//   STATUS: UNVERIFIED — CA to confirm.
// `expected` is written as explicit arithmetic in rupees, independent of the engine.
// `working` explains the same arithmetic in words for the review sheet.

import {
  rupees, computeIndividual, computeFirm, computeCompany, computeSection8, computeAdvanceTax,
  partnerRemuneration, partnerInterest,
  type IndividualInput, type Rules, type Regime, type CompanyInput, type FirmInput, type NpoInput, type AdvanceTaxInput,
} from '../src/engine/index.ts';

export interface Case {
  id: string;
  group: string;
  title: string;
  working: string;
  /** Expected value in rupees. */
  expected: number;
  /** Returns the engine's figure in paise. */
  actual: (R: Rules) => number;
}

const L = 100000;      // one lakh
const CR = 10000000;   // one crore

// Reference slab figures used in the workings below.
/** New regime slab tax at 24,00,000: 20,000 + 40,000 + 60,000 + 80,000 + 1,00,000. */
const NEW_AT_24L = 0.05 * 4 * L + 0.10 * 4 * L + 0.15 * 4 * L + 0.20 * 4 * L + 0.25 * 4 * L; // 3,00,000
const newSlab = (ti: number) => NEW_AT_24L + 0.30 * (ti - 24 * L);          // valid for ti >= 24,00,000
/** Old regime (below 60) slab tax at 10,00,000: 12,500 + 1,00,000. */
const OLD_AT_10L = 0.05 * 2.5 * L + 0.20 * 5 * L; // 1,12,500
const oldSlab = (ti: number) => OLD_AT_10L + 0.30 * (ti - 10 * L);          // valid for ti >= 10,00,000
const CESS = 1.04;

const person = (extra: Partial<IndividualInput>): IndividualInput => ({ kind: 'individual', resident: true, age: 30, ...extra });
const huf = (extra: Partial<IndividualInput>): IndividualInput => ({ kind: 'huf', resident: true, ...extra });
const biz = (r: number, extra: Partial<IndividualInput> = {}) => person({ businessIncome: rupees(r), ...extra });

function reg(input: IndividualInput, regime: Regime, R: Rules) {
  const r = computeIndividual(input, R);
  if (r.status !== 'ok') throw new Error(r.reason);
  return r.results[regime];
}
const tax = (input: IndividualInput, regime: Regime) => (R: Rules) => reg(input, regime, R).taxPayable;
const ti = (input: IndividualInput, regime: Regime) => (R: Rules) => reg(input, regime, R).totalIncome;

const firmTax = (input: Omit<FirmInput, 'resident'>) => (R: Rules) => {
  const r = computeFirm({ resident: true, ...input }, R);
  if (r.status !== 'ok') throw new Error(r.reason);
  return r.taxPayable;
};
const co = (input: Partial<CompanyInput> & { normalIncome: number }): CompanyInput =>
  ({ resident: true, companyType: 'private', regime: 'normal', turnoverTaxYear2024_25: rupees(100 * CR), bookProfit: 0, ...input });
const coTax = (input: CompanyInput) => (R: Rules) => {
  const r = computeCompany(input, R);
  if (r.status !== 'ok') throw new Error(r.reason);
  return r.taxPayable;
};
const npoTax = (npo: NpoInput) => (R: Rules) => {
  const r = computeSection8({ registeredNpo: true, resident: true, npo }, R);
  if (r.status !== 'ok' || !('specifiedIncome' in r)) throw new Error(`NPO status ${r.status}`);
  return r.taxPayable;
};
const adv = (input: AdvanceTaxInput) => (R: Rules) => computeAdvanceTax(input, R);

// Inputs reused by several cases
const deductionHeavy: IndividualInput = person({
  salary: { gross: rupees(15 * L), professionalTax: rupees(2500) },
  house: { selfOccupiedInterest: rupees(2.5 * L), selfOccupiedHigherLimit: true },
  deductions: { s123: rupees(2 * L), pensionOwn124_3: rupees(60000), healthSelfFamily: rupees(30000), healthParents: rupees(60000), healthParentsSenior: true },
});
const donor: IndividualInput = person({
  businessIncome: rupees(30 * L),
  house: { selfOccupiedInterest: rupees(2 * L), selfOccupiedHigherLimit: true },
  deductions: { s123: rupees(1.5 * L), pensionOwn124_3: rupees(50000), healthSelfFamily: rupees(25000), healthParents: rupees(50000), healthParentsSenior: true, donationsFull: rupees(15 * L) },
});

export const cases: Case[] = [
  // ───────────────────────── A. Individual — new regime
  { id: 'IN-01', group: 'Individual — new regime', title: 'Salary 4,75,000', working: 'Salary 4,75,000 − standard deduction 75,000 = TI 4,00,000; nil slab.', expected: 0, actual: tax(person({ salary: { gross: rupees(475000) } }), 'new') },
  { id: 'IN-02', group: 'Individual — new regime', title: 'Salary 12,75,000 (rebate limit via standard deduction)', working: 'TI 12,00,000; slab tax 20,000 + 40,000 = 60,000; rebate 60,000.', expected: 0.05 * 4 * L + 0.10 * 4 * L - 60000, actual: tax(person({ salary: { gross: rupees(1275000) } }), 'new') },
  { id: 'IN-03', group: 'Individual — new regime', title: 'Business 11,99,990 (rebate limit − 10)', working: 'Slab tax 59,999; TI ≤ 12,00,000 so rebate equals the tax.', expected: 0, actual: tax(biz(1199990), 'new') },
  { id: 'IN-04', group: 'Individual — new regime', title: 'Business 12,00,000 (rebate limit exactly)', working: 'Slab tax 60,000; rebate 60,000.', expected: 0, actual: tax(biz(1200000), 'new') },
  { id: 'IN-05', group: 'Individual — new regime', title: 'Business 12,00,001 (rebate limit + 1)', working: 'TI rounds to 12,00,000 u/s 516; rebate 60,000.', expected: 0, actual: tax(biz(1200001), 'new') },
  { id: 'IN-06', group: 'Individual — new regime', title: 'Business 12,00,010 (rebate limit + 10, marginal rebate)', working: 'Slab tax 60,001.50 exceeds the excess of 10, so tax is capped at 10; cess 0.40; 10.40 rounds to 10.', expected: 10, actual: tax(biz(1200010), 'new') },
  { id: 'IN-07', group: 'Individual — new regime', title: 'Salary 12,85,000 (inside marginal-rebate band)', working: 'TI 12,10,000; slab tax 61,500; capped at excess 10,000; cess 400.', expected: 10000 * CESS, actual: tax(person({ salary: { gross: rupees(1285000) } }), 'new') },
  { id: 'IN-08', group: 'Individual — new regime', title: 'Business 12,70,580 (last step inside marginal band)', working: 'Slab tax 60,000 + 15% × 70,580 = 70,587 > excess 70,580, so tax 70,580; cess 2,823.20; 73,403.20 rounds to 73,400.', expected: 73400, actual: tax(biz(1270580), 'new') },
  { id: 'IN-09', group: 'Individual — new regime', title: 'Business 12,70,590 (first step outside marginal band)', working: 'Slab tax 70,588.50 < excess 70,590, so no rebate; cess 2,823.54; 73,412.04 rounds to 73,410.', expected: 73410, actual: tax(biz(1270590), 'new') },
  { id: 'IN-10', group: 'Individual — new regime', title: 'Business 20,00,000', working: '20,000 + 40,000 + 60,000 + 80,000 = 2,00,000; cess 8,000.', expected: (0.05 + 0.10 + 0.15 + 0.20) * 4 * L * CESS, actual: tax(biz(20 * L), 'new') },
  { id: 'IN-11', group: 'Individual — new regime', title: 'Business 24,00,000', working: 'Slab tax 3,00,000; cess 12,000.', expected: NEW_AT_24L * CESS, actual: tax(biz(24 * L), 'new') },
  { id: 'IN-12', group: 'Individual — new regime', title: 'Business 49,99,990 (50 lakh − 10)', working: 'Slab tax 10,80,000 − 3 = 10,79,997; no surcharge; cess 43,199.88; 11,23,196.88 rounds to 11,23,200.', expected: 1123200, actual: tax(biz(4999990), 'new') },
  { id: 'IN-13', group: 'Individual — new regime', title: 'Business 49,99,999 (50 lakh − 1)', working: 'TI rounds to 50,00,000; slab tax 10,80,000; cess 43,200.', expected: newSlab(50 * L) * CESS, actual: tax(biz(4999999), 'new') },
  { id: 'IN-14', group: 'Individual — new regime', title: 'Business 50,00,000 (surcharge threshold exactly)', working: 'Slab tax 3,00,000 + 30% × 26,00,000 = 10,80,000; "exceeds" not met, no surcharge; cess 43,200.', expected: newSlab(50 * L) * CESS, actual: tax(biz(50 * L), 'new') },
  { id: 'IN-15', group: 'Individual — new regime', title: 'Business 50,00,001 (50 lakh + 1)', working: 'TI rounds to 50,00,000.', expected: newSlab(50 * L) * CESS, actual: tax(biz(5000001), 'new') },
  { id: 'IN-16', group: 'Individual — new regime', title: 'Business 50,00,010 (50 lakh + 10, marginal relief)', working: 'Tax + 10% surcharge would be 11,88,003.30; limited to 10,80,000 + 10 = 10,80,010; cess 43,200.40; rounds to 11,23,210.', expected: 1123210, actual: tax(biz(5000010), 'new') },
  { id: 'IN-17', group: 'Individual — new regime', title: 'Business 51,61,190 (last step with marginal relief at 50 lakh)', working: 'Tax 11,28,357 × 1.10 = 12,41,192.70 > limit 10,80,000 + 1,61,190 = 12,41,190; cess 49,647.60; rounds to 12,90,840.', expected: 1290840, actual: tax(biz(5161190), 'new') },
  { id: 'IN-18', group: 'Individual — new regime', title: 'Business 51,61,200 (first step without marginal relief)', working: 'Tax 11,28,360 × 1.10 = 12,41,196 < limit 12,41,200; cess 49,647.84; 12,90,843.84 rounds to 12,90,840.', expected: 1290840, actual: tax(biz(5161200), 'new') },
  { id: 'IN-19', group: 'Individual — new regime', title: 'Business 1,00,00,000 (1 crore exactly)', working: 'Slab tax 25,80,000; surcharge 10% = 2,58,000; cess 1,13,520.', expected: newSlab(CR) * 1.10 * CESS, actual: tax(biz(CR), 'new') },
  { id: 'IN-20', group: 'Individual — new regime', title: 'Business 1,00,00,010 (1 crore + 10)', working: 'Limited to (25,80,000 × 1.10) + 10 = 28,38,010; cess 1,13,520.40; rounds to 29,51,530.', expected: 2951530, actual: tax(biz(CR + 10), 'new') },
  { id: 'IN-21', group: 'Individual — new regime', title: 'Business 2,00,00,000 (2 crore exactly)', working: 'Slab tax 55,80,000; surcharge 15% = 8,37,000; cess 2,56,680.', expected: newSlab(2 * CR) * 1.15 * CESS, actual: tax(biz(2 * CR), 'new') },
  { id: 'IN-22', group: 'Individual — new regime', title: 'Business 2,00,00,010 (2 crore + 10)', working: 'Limited to (55,80,000 × 1.15) + 10 = 64,17,010; cess 2,56,680.40; rounds to 66,73,690.', expected: 6673690, actual: tax(biz(2 * CR + 10), 'new') },
  { id: 'IN-23', group: 'Individual — new regime', title: 'Business 5,00,00,000 (no 37% slab in new regime)', working: 'Slab tax 1,45,80,000; surcharge 25%; cess 7,29,000.', expected: newSlab(5 * CR) * 1.25 * CESS, actual: tax(biz(5 * CR), 'new') },
  { id: 'IN-24', group: 'Individual — new regime', title: 'Business 6,00,00,000 (surcharge stays 25%)', working: 'Slab tax 1,75,80,000 × 1.25 = 2,19,75,000; cess 8,79,000.', expected: newSlab(6 * CR) * 1.25 * CESS, actual: tax(biz(6 * CR), 'new') },

  // ───────────────────────── B. Individual — old regime
  { id: 'IO-01', group: 'Individual — old regime', title: 'Below 60, business 2,50,000', working: 'Within the nil slab.', expected: 0, actual: tax(biz(2.5 * L), 'old') },
  { id: 'IO-02', group: 'Individual — old regime', title: 'Below 60, business 5,00,000 (rebate limit exactly)', working: 'Tax 12,500; rebate 12,500.', expected: 0.05 * 2.5 * L - 12500, actual: tax(biz(5 * L), 'old') },
  { id: 'IO-03', group: 'Individual — old regime', title: 'Below 60, business 5,00,001', working: 'TI rounds to 5,00,000; rebate 12,500.', expected: 0, actual: tax(biz(500001), 'old') },
  { id: 'IO-04', group: 'Individual — old regime', title: 'Below 60, business 5,00,010 (rebate lost — statutory cliff)', working: 'Tax 12,500 + 20% × 10 = 12,502; no rebate above 5,00,000; cess 500.08; rounds to 13,000.', expected: 13000, actual: tax(biz(500010), 'old') },
  { id: 'IO-05', group: 'Individual — old regime', title: 'Age 59, business 3,00,000 (general slab)', working: '5% × 50,000 = 2,500; rebate.', expected: 0, actual: tax(biz(3 * L, { age: 59 }), 'old') },
  { id: 'IO-06', group: 'Individual — old regime', title: 'Age 59, business 8,00,000', working: '12,500 + 20% × 3,00,000 = 72,500; cess 2,900.', expected: (12500 + 0.20 * 3 * L) * CESS, actual: tax(biz(8 * L, { age: 59 }), 'old') },
  { id: 'IO-07', group: 'Individual — old regime', title: 'Age 60, business 8,00,000 (senior slab starts)', working: '5% × 2,00,000 = 10,000 + 20% × 3,00,000 = 70,000; cess 2,800.', expected: (10000 + 0.20 * 3 * L) * CESS, actual: tax(biz(8 * L, { age: 60 }), 'old') },
  { id: 'IO-08', group: 'Individual — old regime', title: 'Age 79, business 10,00,000', working: '10,000 + 1,00,000 = 1,10,000; cess 4,400.', expected: 110000 * CESS, actual: tax(biz(10 * L, { age: 79 }), 'old') },
  { id: 'IO-09', group: 'Individual — old regime', title: 'Age 80, business 10,00,000 (super-senior slab starts)', working: '20% × 5,00,000 = 1,00,000; cess 4,000.', expected: 100000 * CESS, actual: tax(biz(10 * L, { age: 80 }), 'old') },
  { id: 'IO-10', group: 'Individual — old regime', title: 'Age 85, business 5,00,010', working: 'Tax 20% × 10 = 2; cess 0.08; 2.08 rounds to 0.', expected: 0, actual: tax(biz(500010, { age: 85 }), 'old') },
  { id: 'IO-11', group: 'Individual — old regime', title: 'Below 60, salary 10,50,000', working: 'TI 10,00,000; 1,12,500; cess 4,500.', expected: OLD_AT_10L * CESS, actual: tax(person({ salary: { gross: rupees(1050000) } }), 'old') },
  { id: 'IO-12', group: 'Individual — old regime', title: 'Salary 15,00,000 with capped deductions', working: 'Salary 15,00,000 − 50,000 − 2,500 = 14,47,500; self-occupied interest capped 2,00,000; deductions 1,50,000 + 50,000 + 25,000 + 50,000 = 2,75,000; TI 9,72,500; tax 12,500 + 20% × 4,72,500 = 1,07,000; cess 4,280.', expected: (12500 + 0.20 * (972500 - 500000)) * CESS, actual: tax(deductionHeavy, 'old') },
  { id: 'IO-13', group: 'Individual — old regime', title: 'Business 50,00,000 (surcharge threshold exactly)', working: 'Slab tax 13,12,500; no surcharge; cess 52,500.', expected: oldSlab(50 * L) * CESS, actual: tax(biz(50 * L), 'old') },
  { id: 'IO-14', group: 'Individual — old regime', title: 'Business 50,00,010 (marginal relief)', working: 'Limited to 13,12,500 + 10; cess 52,500.40; rounds to 13,65,010.', expected: 1365010, actual: tax(biz(50 * L + 10), 'old') },
  { id: 'IO-15', group: 'Individual — old regime', title: 'Business 1,00,00,000', working: '28,12,500 × 1.10 = 30,93,750; cess 1,23,750.', expected: oldSlab(CR) * 1.10 * CESS, actual: tax(biz(CR), 'old') },
  { id: 'IO-16', group: 'Individual — old regime', title: 'Business 1,00,00,010 (marginal relief)', working: 'Limited to 30,93,750 + 10; cess 1,23,750.40; rounds to 32,17,510.', expected: 3217510, actual: tax(biz(CR + 10), 'old') },
  { id: 'IO-17', group: 'Individual — old regime', title: 'Business 2,00,00,000', working: '58,12,500 × 1.15 = 66,84,375; cess 2,67,375.', expected: oldSlab(2 * CR) * 1.15 * CESS, actual: tax(biz(2 * CR), 'old') },
  { id: 'IO-18', group: 'Individual — old regime', title: 'Business 2,00,00,010 (marginal relief)', working: 'Limited to 66,84,375 + 10; cess 2,67,375.40; rounds to 69,51,760.', expected: 6951760, actual: tax(biz(2 * CR + 10), 'old') },
  { id: 'IO-19', group: 'Individual — old regime', title: 'Business 5,00,00,000', working: '1,48,12,500 × 1.25 = 1,85,15,625; cess 7,40,625.', expected: oldSlab(5 * CR) * 1.25 * CESS, actual: tax(biz(5 * CR), 'old') },
  { id: 'IO-20', group: 'Individual — old regime', title: 'Business 5,00,00,010 (marginal relief)', working: 'Limited to 1,85,15,625 + 10; cess 7,40,625.40; rounds to 1,92,56,260.', expected: 19256260, actual: tax(biz(5 * CR + 10), 'old') },
  { id: 'IO-21', group: 'Individual — old regime', title: 'Business 6,00,00,000 (37% surcharge)', working: '1,78,12,500 × 1.37 = 2,44,03,125; cess 9,76,125.', expected: oldSlab(6 * CR) * 1.37 * CESS, actual: tax(biz(6 * CR), 'old') },

  // ───────────────────────── C. HUF
  { id: 'HU-01', group: 'HUF', title: 'New regime, business 12,00,000 (no rebate)', working: '60,000; HUF gets no rebate; cess 2,400.', expected: 60000 * CESS, actual: tax(huf({ businessIncome: rupees(12 * L) }), 'new') },
  { id: 'HU-02', group: 'HUF', title: 'Old regime, business 5,00,000 (no rebate)', working: '12,500; no rebate; cess 500.', expected: 12500 * CESS, actual: tax(huf({ businessIncome: rupees(5 * L) }), 'old') },
  { id: 'HU-03', group: 'HUF', title: 'Old regime, business 4,00,000, karta aged 70 (no age band)', working: 'General slab: 5% × 1,50,000 = 7,500; cess 300.', expected: 7500 * CESS, actual: tax(huf({ businessIncome: rupees(4 * L), age: 70 }), 'old') },
  { id: 'HU-04', group: 'HUF', title: 'New regime, business 5,00,000', working: '5% × 1,00,000 = 5,000; no rebate; cess 200.', expected: 5000 * CESS, actual: tax(huf({ businessIncome: rupees(5 * L) }), 'new') },

  // ───────────────────────── D. Special-rate income and shortfall
  { id: 'SP-01', group: 'Special rates and shortfall', title: 'Old, only STCG s.196 of 3,00,000', working: 'Shortfall 2,50,000; 20% × 50,000 = 10,000; TI ≤ 5,00,000 so rebate 10,000 (Q4: as the Act reads).', expected: 0, actual: tax(person({ gains: { stcgListedEquity196: rupees(3 * L) } }), 'old') },
  { id: 'SP-02', group: 'Special rates and shortfall', title: 'Old, only STCG s.196 of 7,50,000', working: 'Shortfall 2,50,000; 20% × 5,00,000 = 1,00,000; no rebate (TI > 5,00,000); cess 4,000.', expected: 0.20 * (7.5 * L - 2.5 * L) * CESS, actual: tax(person({ gains: { stcgListedEquity196: rupees(7.5 * L) } }), 'old') },
  { id: 'SP-03', group: 'Special rates and shortfall', title: 'New, only STCG s.196 of 6,00,000', working: 'Shortfall 4,00,000; 20% × 2,00,000 = 40,000; rebate limited to slab tax (nil); cess 1,600.', expected: 0.20 * (6 * L - 4 * L) * CESS, actual: tax(person({ gains: { stcgListedEquity196: rupees(6 * L) } }), 'new') },
  { id: 'SP-04', group: 'Special rates and shortfall', title: 'Old, age 65, only STCG s.196 of 4,00,000', working: 'Shortfall 3,00,000 (senior limit); 20% × 1,00,000 = 20,000; rebate 12,500; 7,500; cess 300.', expected: (0.20 * (4 * L - 3 * L) - 12500) * CESS, actual: tax(person({ age: 65, gains: { stcgListedEquity196: rupees(4 * L) } }), 'old') },
  { id: 'SP-05', group: 'Special rates and shortfall', title: 'Old, business 6,00,000 + LTCG s.198 of 1,25,000 (exemption exactly)', working: 'Slab 12,500 + 20,000 = 32,500; gains within 1,25,000; cess 1,300.', expected: 32500 * CESS, actual: tax(biz(6 * L, { gains: { ltcgListedEquity198: rupees(125000) } }), 'old') },
  { id: 'SP-06', group: 'Special rates and shortfall', title: 'Old, business 6,00,000 + LTCG s.198 of 1,35,000', working: '32,500 + 12.5% × 10,000 = 33,750; cess 1,350.', expected: (32500 + 0.125 * 10000) * CESS, actual: tax(biz(6 * L, { gains: { ltcgListedEquity198: rupees(135000) } }), 'old') },
  { id: 'SP-07', group: 'Special rates and shortfall', title: 'Old, only LTCG s.198 of 4,75,000 (no rebate against s.198 tax)', working: 'Shortfall 2,50,000 → 2,25,000; less 1,25,000 = 1,00,000 × 12.5% = 12,500; rebate excluded for s.198 tax; cess 500.', expected: 0.125 * (4.75 * L - 2.5 * L - 1.25 * L) * CESS, actual: tax(person({ gains: { ltcgListedEquity198: rupees(4.75 * L) } }), 'old') },
  { id: 'SP-08', group: 'Special rates and shortfall', title: 'Old, only LTCG s.198 of 5,25,000', working: '(5,25,000 − 2,50,000 − 1,25,000) × 12.5% = 18,750; cess 750.', expected: 0.125 * 1.5 * L * CESS, actual: tax(person({ gains: { ltcgListedEquity198: rupees(5.25 * L) } }), 'old') },
  { id: 'SP-09', group: 'Special rates and shortfall', title: 'Old, business 3,00,000 + LTCG s.197 of 1,00,000 (rebate against s.197 tax)', working: 'Slab 2,500 + 12.5% × 1,00,000 = 15,000; TI 4,00,000 so rebate 12,500; 2,500; cess 100.', expected: (2500 + 12500 - 12500) * CESS, actual: tax(biz(3 * L, { gains: { ltcgOther197: rupees(L) } }), 'old') },
  { id: 'SP-10', group: 'Special rates and shortfall', title: 'Old, STCG s.196 2,00,000 + LTCG s.197 2,00,000 (shortfall order)', working: 'Shortfall 2,50,000 used against s.196 first (2,00,000) then s.197 (50,000); 12.5% × 1,50,000 = 18,750; rebate 12,500; 6,250; cess 250.', expected: (0.125 * 1.5 * L - 12500) * CESS, actual: tax(person({ gains: { stcgListedEquity196: rupees(2 * L), ltcgOther197: rupees(2 * L) } }), 'old') },
  { id: 'SP-11', group: 'Special rates and shortfall', title: 'Old, lottery 3,00,000 only (no shortfall adjustment for winnings)', working: '30% = 90,000; TI ≤ 5,00,000 so rebate 12,500; 77,500; cess 3,100.', expected: (0.30 * 3 * L - 12500) * CESS, actual: tax(person({ winnings: { lotteryEtc: rupees(3 * L) } }), 'old') },
  { id: 'SP-12', group: 'Special rates and shortfall', title: 'New, lottery 3,00,000 only', working: '30% = 90,000; rebate limited to slab tax (nil); cess 3,600.', expected: 0.30 * 3 * L * CESS, actual: tax(person({ winnings: { lotteryEtc: rupees(3 * L) } }), 'new') },
  { id: 'SP-13', group: 'Special rates and shortfall', title: 'New, salary 10,75,000 + VDA income 1,00,000', working: 'Normal income 10,00,000: slab 40,000, fully rebated (TI 11,00,000); VDA 30% = 30,000; cess 1,200.', expected: 0.30 * L * CESS, actual: tax(person({ salary: { gross: rupees(1075000) }, winnings: { vda: rupees(L) } }), 'new') },
  { id: 'SP-14', group: 'Special rates and shortfall', title: 'New, business 15,00,000 + online-game winnings 50,000', working: 'Slab 60,000 + 15% × 3,00,000 = 1,05,000; winnings 15,000; cess 4,800.', expected: (60000 + 0.15 * 3 * L + 0.30 * 50000) * CESS, actual: tax(biz(15 * L, { winnings: { onlineGames: rupees(50000) } }), 'new') },
  { id: 'SP-15', group: 'Special rates and shortfall', title: 'New, business 10,00,000 + dividend 3,00,000', working: 'TI 13,00,000; slab 60,000 + 15% × 1,00,000 = 75,000; excess over 12,00,000 is 1,00,000 so no marginal rebate; cess 3,000.', expected: (60000 + 0.15 * L) * CESS, actual: tax(biz(10 * L, { other: { dividend: rupees(3 * L) } }), 'new') },
  { id: 'SP-16', group: 'Special rates and shortfall', title: 'New, business 1 crore + STCG s.196 4 crore (surcharge 15%: income excluding gains ≤ 2 crore)', working: 'Slab 25,80,000 + 20% × 4,00,00,000 = 1,05,80,000; surcharge 15% = 15,87,000; cess 4,86,680.', expected: (newSlab(CR) + 0.20 * 4 * CR) * 1.15 * CESS, actual: tax(biz(CR, { gains: { stcgListedEquity196: rupees(4 * CR) } }), 'new') },
  { id: 'SP-17', group: 'Special rates and shortfall', title: 'Old, business 3 crore + STCG s.196 3 crore (25% on slab tax, 15% cap on gains tax)', working: 'Slab 88,12,500 × 25% = 22,03,125; gains tax 60,00,000 × 15% = 9,00,000; total 1,79,15,625; cess 7,16,625.', expected: (oldSlab(3 * CR) * 1.25 + 0.20 * 3 * CR * 1.15) * CESS, actual: tax(biz(3 * CR, { gains: { stcgListedEquity196: rupees(3 * CR) } }), 'old') },
  { id: 'SP-18', group: 'Special rates and shortfall', title: 'Old, business 5.10 crore + dividend 1 crore (marginal relief on the 5 crore test excluding dividend; assumptions Z-05, Z-14)', working: 'At business 5 crore + dividend 1 crore: slab 1,78,12,500; dividend share 1/6 = 29,68,750 at 15%, balance 1,48,43,750 at 25%; total 2,19,68,750; add excess 10,00,000 = 2,29,68,750, which is below the 37% computation; cess 9,18,750.', expected: (oldSlab(6 * CR) + (oldSlab(6 * CR) * 5 / 6) * 0.25 + (oldSlab(6 * CR) / 6) * 0.15 + 10 * L) * CESS, actual: tax(biz(5.1 * CR, { other: { dividend: rupees(CR) } }), 'old') },

  // ───────────────────────── E. Heads of income and deductions
  { id: 'HD-01', group: 'Heads and deductions', title: 'Family pension 90,000, new regime (total income)', working: 'Deduction = lower of 1/3 (30,000) or 25,000; income 65,000.', expected: 90000 - 25000, actual: ti(person({ familyPension: rupees(90000) }), 'new') },
  { id: 'HD-02', group: 'Heads and deductions', title: 'Family pension 90,000, old regime (total income)', working: 'Deduction = lower of 30,000 or 15,000; income 75,000.', expected: 90000 - 15000, actual: ti(person({ familyPension: rupees(90000) }), 'old') },
  { id: 'HD-03', group: 'Heads and deductions', title: 'Salary 40,000, new regime (standard deduction limited to salary)', working: 'Standard deduction cannot exceed salary; income nil.', expected: 0, actual: ti(person({ salary: { gross: rupees(40000) } }), 'new') },
  { id: 'HD-04', group: 'Heads and deductions', title: 'Employer pension contribution, new regime (14% cap)', working: 'Gross 20,00,000 − 75,000 − min(1,50,000, 14% × 10,00,000 = 1,40,000) = TI 17,85,000; slab 1,20,000 + 20% × 1,85,000 = 1,57,000; cess 6,280.', expected: (120000 + 0.20 * 185000) * CESS, actual: tax(person({ salary: { gross: rupees(20 * L), basicPlusDA: rupees(10 * L), employerPensionContribution: rupees(1.5 * L) } }), 'new') },
  { id: 'HD-05', group: 'Heads and deductions', title: 'Employer pension contribution, old regime (10% cap)', working: 'Gross 20,00,000 − 50,000 − 1,00,000 = TI 18,50,000; 1,12,500 + 30% × 8,50,000 = 3,67,500; cess 14,700.', expected: oldSlab(18.5 * L) * CESS, actual: tax(person({ salary: { gross: rupees(20 * L), basicPlusDA: rupees(10 * L), employerPensionContribution: rupees(1.5 * L) } }), 'old') },
  { id: 'HD-06', group: 'Heads and deductions', title: 'Let-out loss 1,90,000 + business 10,00,000, new regime (no inter-head set-off)', working: 'Annual value 3,00,000 − 30% − interest 4,00,000 = loss 1,90,000, not set off; TI 10,00,000; slab 40,000 rebated.', expected: 0, actual: tax(biz(10 * L, { house: { letOutNetAnnualValue: rupees(3 * L), letOutInterest: rupees(4 * L) } }), 'new') },
  { id: 'HD-07', group: 'Heads and deductions', title: 'Same, old regime (loss set off)', working: 'TI 10,00,000 − 1,90,000 = 8,10,000; 12,500 + 20% × 3,10,000 = 74,500; cess 2,980.', expected: (12500 + 0.20 * 3.1 * L) * CESS, actual: tax(biz(10 * L, { house: { letOutNetAnnualValue: rupees(3 * L), letOutInterest: rupees(4 * L) } }), 'old') },
  { id: 'HD-08', group: 'Heads and deductions', title: 'House-property loss 3,00,000, old regime (set-off capped at 2,00,000)', working: 'TI 10,00,000 − 2,00,000 = 8,00,000; 12,500 + 60,000 = 72,500; cess 2,900.', expected: (12500 + 0.20 * 3 * L) * CESS, actual: tax(biz(10 * L, { house: { letOutInterest: rupees(3 * L) } }), 'old') },
  { id: 'HD-09', group: 'Heads and deductions', title: 'Self-occupied interest 2,50,000 without higher-limit conditions, old regime', working: 'Capped at 30,000: TI 10,00,000 − 30,000 = 9,70,000; 12,500 + 20% × 4,70,000 = 1,06,500; cess 4,260.', expected: (12500 + 0.20 * 4.7 * L) * CESS, actual: tax(biz(10 * L, { house: { selfOccupiedInterest: rupees(2.5 * L) } }), 'old') },
  { id: 'HD-10', group: 'Heads and deductions', title: 'Senior, deposit interest 3,00,000 + savings 40,000 + business 5,00,000, old regime', working: 'GTI 8,40,000 − 50,000 = 7,90,000; senior slab 10,000 + 20% × 2,90,000 = 68,000; cess 2,720.', expected: (10000 + 0.20 * 2.9 * L) * CESS, actual: tax(biz(5 * L, { age: 65, other: { depositInterest: rupees(3 * L), savingsInterest: rupees(40000) } }), 'old') },
  { id: 'HD-11', group: 'Heads and deductions', title: 'Non-senior, savings interest 15,000 + business 7,00,000, old regime', working: 'GTI 7,15,000 − 10,000 = 7,05,000; 12,500 + 20% × 2,05,000 = 53,500; cess 2,140.', expected: (12500 + 0.20 * 2.05 * L) * CESS, actual: tax(biz(7 * L, { other: { savingsInterest: rupees(15000) } }), 'old') },
  { id: 'HD-12', group: 'Heads and deductions', title: 'Rent paid 1,20,000, business 6,00,000, old regime', working: 'Least of 1,20,000 − 10% × 6,00,000 = 60,000; 5,000 × 12 = 60,000; 25% = 1,50,000 → 60,000. TI 5,40,000; 12,500 + 8,000 = 20,500; cess 820.', expected: (12500 + 0.20 * 40000) * CESS, actual: tax(biz(6 * L, { deductions: { rentPaid134: rupees(1.2 * L) } }), 'old') },
  { id: 'HD-13', group: 'Heads and deductions', title: 'Donation 3,00,000 at 50% with qualifying limit, business 10,00,000, old regime', working: 'Qualifying amount limited to 10% × 10,00,000 = 1,00,000; deduction 50,000; TI 9,50,000; 12,500 + 90,000 = 1,02,500; cess 4,100.', expected: (12500 + 0.20 * 4.5 * L) * CESS, actual: tax(biz(10 * L, { deductions: { donationsHalfWithLimit: rupees(3 * L) } }), 'old') },
  { id: 'HD-14', group: 'Heads and deductions', title: 'Deductions ignored in new regime (same inputs as IO-12)', working: 'Salary 15,00,000 − 75,000 = TI 14,25,000; slab 60,000 + 15% × 2,25,000 = 93,750; cess 3,750.', expected: (60000 + 0.15 * 2.25 * L) * CESS, actual: tax(deductionHeavy, 'new') },
  { id: 'HD-15', group: 'Heads and deductions', title: 'Total income rounding: business 10,00,004 → 10,00,000', working: 's.516: last digit below 5 rounds down.', expected: 1000000, actual: ti(biz(1000004), 'old') },
  { id: 'HD-16', group: 'Heads and deductions', title: 'Total income rounding: business 10,00,005 → 10,00,010', working: 's.516: last digit 5 or more rounds up.', expected: 1000010, actual: ti(biz(1000005), 'old') },

  // ───────────────────────── F. Regime comparison and AMT
  { id: 'RG-01', group: 'Regime comparison and AMT', title: 'Comparison: salary 15,00,000 with deductions — saving of new over old', working: 'Old 1,11,280 (IO-12) less new 97,500 (HD-14) = 13,780; new is lower.', expected: 111280 - 97500, actual: (R) => { const r = computeIndividual(deductionHeavy, R); if (r.status !== 'ok' || r.recommended !== 'new') throw new Error('expected new'); return r.saving; } },
  { id: 'RG-02', group: 'Regime comparison and AMT', title: 'Comparison: large donation makes old regime lower', working: 'Old: 30,00,000 − 2,00,000 − 2,75,000 − 15,00,000 = TI 10,25,000; tax 1,20,000 + cess = 1,24,800. New: 3,00,000 + 30% × 6,00,000 = 4,80,000 + cess = 4,99,200. Saving 3,74,400.', expected: (newSlab(30 * L) - oldSlab(10.25 * L)) * CESS, actual: (R) => { const r = computeIndividual(donor, R); if (r.status !== 'ok' || r.recommended !== 'old') throw new Error('expected old'); return r.saving; } },
  { id: 'RG-03', group: 'Regime comparison and AMT', title: 'Same taxpayer with business income whose opt-out was already withdrawn — only new regime allowed', working: 'Old regime is closed (s.202(4)(a)(iv)); payable is the new-regime figure 4,99,200.', expected: newSlab(30 * L) * CESS, actual: (R) => { const r = computeIndividual({ ...donor, regimeHistory: { hasBusinessIncome: true, optOutWithdrawnEarlier: true } }, R); if (r.status !== 'ok' || r.allowedRegimes.join() !== 'new' || r.recommended !== 'new' || r.saving !== 0) throw new Error('expected new only'); return r.results.new.taxPayable; } },
  { id: 'RG-04', group: 'Regime comparison and AMT', title: 'AMT applies: business 40,00,000 with Chapter VIII-C deduction 25,00,000 (old)', working: 'TI 15,00,000: tax 2,62,500. Adjusted TI 40,00,000 > 20,00,000: AMT 18.5% = 7,40,000 > 2,62,500; no surcharge; cess 29,600.', expected: 0.185 * 40 * L * CESS, actual: tax(biz(40 * L, { deductions: { chapterVIIIC: rupees(25 * L) } }), 'old') },
  { id: 'RG-05', group: 'Regime comparison and AMT', title: 'AMT threshold: adjusted total income exactly 20,00,000 (old)', working: 'Does not exceed 20,00,000, so AMT does not apply; TI 10,00,000: 1,12,500; cess 4,500.', expected: OLD_AT_10L * CESS, actual: tax(biz(20 * L, { deductions: { chapterVIIIC: rupees(10 * L) } }), 'old') },
  { id: 'RG-06', group: 'Regime comparison and AMT', title: 'AMT lower than regular tax (old)', working: 'TI 39,00,000: 1,12,500 + 8,70,000 = 9,82,500 > AMT 7,40,000; cess 39,300.', expected: oldSlab(39 * L) * CESS, actual: tax(biz(40 * L, { deductions: { chapterVIIIC: rupees(L) } }), 'old') },
  { id: 'RG-07', group: 'Regime comparison and AMT', title: 'AMT credit brought forward 5,00,000 set off (assumption Z-15)', working: 'Set-off limited to regular tax 9,82,500 − AMT 7,40,000 = 2,42,500; 10,21,800 − 2,42,500.', expected: oldSlab(39 * L) * CESS - (oldSlab(39 * L) - 0.185 * 40 * L), actual: tax(biz(40 * L, { deductions: { chapterVIIIC: rupees(L) }, amtCreditBroughtForward: rupees(5 * L) }), 'old') },
  { id: 'RG-08', group: 'Regime comparison and AMT', title: 'No AMT in the new regime (Chapter VIII-C deduction denied)', working: 'TI 40,00,000: 3,00,000 + 4,80,000 = 7,80,000; cess 31,200.', expected: newSlab(40 * L) * CESS, actual: tax(biz(40 * L, { deductions: { chapterVIIIC: rupees(25 * L) } }), 'new') },

  // ───────────────────────── G. Firm / LLP
  { id: 'FM-01', group: 'Firm / LLP', title: 'Income 10,00,000', working: '30% = 3,00,000; cess 12,000.', expected: 0.30 * 10 * L * CESS, actual: firmTax({ normalIncome: rupees(10 * L) }) },
  { id: 'FM-02', group: 'Firm / LLP', title: 'Income 99,99,990 (1 crore − 10)', working: '29,99,997; cess 1,19,999.88; 31,19,996.88 rounds to 31,20,000.', expected: 3120000, actual: firmTax({ normalIncome: rupees(CR - 10) }) },
  { id: 'FM-03', group: 'Firm / LLP', title: 'Income 1,00,00,000 (threshold exactly)', working: '30,00,000; no surcharge; cess 1,20,000.', expected: 0.30 * CR * CESS, actual: firmTax({ normalIncome: rupees(CR) }) },
  { id: 'FM-04', group: 'Firm / LLP', title: 'Income 1,00,00,001', working: 'TI rounds to 1,00,00,000.', expected: 0.30 * CR * CESS, actual: firmTax({ normalIncome: rupees(CR + 1) }) },
  { id: 'FM-05', group: 'Firm / LLP', title: 'Income 1,00,00,010 (marginal relief)', working: 'Limited to 30,00,000 + 10; cess 1,20,000.40; rounds to 31,20,010.', expected: 3120010, actual: firmTax({ normalIncome: rupees(CR + 10) }) },
  { id: 'FM-06', group: 'Firm / LLP', title: 'Income 1,05,42,160 (last step with marginal relief)', working: 'Tax 31,62,648 × 1.12 = 35,42,165.76 > limit 30,00,000 + 5,42,160 = 35,42,160; cess 1,41,686.40; rounds to 36,83,850.', expected: 3683850, actual: firmTax({ normalIncome: rupees(10542160) }) },
  { id: 'FM-07', group: 'Firm / LLP', title: 'Income 1,05,42,170 (first step without marginal relief)', working: 'Tax 31,62,651 × 1.12 = 35,42,169.12 < limit 35,42,170; cess 1,41,686.76; 36,83,855.88 rounds to 36,83,860.', expected: 3683860, actual: firmTax({ normalIncome: rupees(10542170) }) },
  { id: 'FM-08', group: 'Firm / LLP', title: 'Income 2,00,00,000', working: '60,00,000 × 1.12 = 67,20,000; cess 2,68,800.', expected: 0.30 * 2 * CR * 1.12 * CESS, actual: firmTax({ normalIncome: rupees(2 * CR) }) },
  { id: 'FM-09', group: 'Firm / LLP', title: 'Business 50,00,000 + STCG s.196 20,00,000 + LTCG s.198 5,25,000', working: '15,00,000 + 4,00,000 + 12.5% × 4,00,000 = 19,50,000; no shortfall adjustment for firms; cess 78,000.', expected: (0.30 * 50 * L + 0.20 * 20 * L + 0.125 * 4 * L) * CESS, actual: firmTax({ normalIncome: rupees(50 * L), stcgListedEquity196: rupees(20 * L), ltcgListedEquity198: rupees(5.25 * L) }) },
  { id: 'FM-10', group: 'Firm / LLP', title: 'AMT applies: income 1 crore, Chapter VIII-C deduction 80,00,000', working: 'TI 20,00,000: tax 6,00,000. Adjusted TI 1 crore: AMT 18,50,000; no surcharge; cess 74,000.', expected: 0.185 * CR * CESS, actual: firmTax({ normalIncome: rupees(CR), chapterVIIIC: rupees(80 * L) }) },
  { id: 'FM-11', group: 'Firm / LLP', title: 'AMT with surcharge: income 2 crore, Chapter VIII-C deduction 1.5 crore', working: 'Adjusted TI 2 crore: AMT 37,00,000 × 1.12 = 41,44,000; cess 1,65,760.', expected: 0.185 * 2 * CR * 1.12 * CESS, actual: firmTax({ normalIncome: rupees(2 * CR), chapterVIIIC: rupees(1.5 * CR) }) },
  { id: 'FM-12', group: 'Firm / LLP', title: 'Partner remuneration limit: book profit 10,00,000', working: '90% × 6,00,000 = 5,40,000 + 60% × 4,00,000 = 2,40,000.', expected: 0.90 * 6 * L + 0.60 * 4 * L, actual: (R) => partnerRemuneration(rupees(10 * L), rupees(9 * L), R).maximumAllowable },
  { id: 'FM-13', group: 'Firm / LLP', title: 'Partner remuneration disallowed: paid 9,00,000 on book profit 10,00,000', working: '9,00,000 − 7,80,000.', expected: 9 * L - 7.8 * L, actual: (R) => partnerRemuneration(rupees(10 * L), rupees(9 * L), R).disallowed },
  { id: 'FM-14', group: 'Firm / LLP', title: 'Partner remuneration limit: book profit 2,00,000 (floor)', working: 'Higher of 3,00,000 or 90% × 2,00,000.', expected: 3 * L, actual: (R) => partnerRemuneration(rupees(2 * L), rupees(5 * L), R).maximumAllowable },
  { id: 'FM-15', group: 'Firm / LLP', title: 'Partner remuneration limit: book loss', working: 'Fixed 3,00,000.', expected: 3 * L, actual: (R) => partnerRemuneration(-rupees(L), rupees(5 * L), R).maximumAllowable },
  { id: 'FM-16', group: 'Firm / LLP', title: 'Partner remuneration limit: book profit 6,00,000', working: '90% × 6,00,000.', expected: 5.4 * L, actual: (R) => partnerRemuneration(rupees(6 * L), rupees(2 * L), R).maximumAllowable },
  { id: 'FM-17', group: 'Firm / LLP', title: 'Partner interest limit: capital 10,00,000 for 6 months', working: '12% × 10,00,000 × 6/12.', expected: 0.12 * 10 * L * 6 / 12, actual: (R) => partnerInterest(rupees(10 * L), 6, rupees(L), 12, R).maximumAllowable },

  // ───────────────────────── H. Companies
  { id: 'CO-01', group: 'Company', title: 'Normal regime, turnover 100 crore, income 50,00,000', working: '25% = 12,50,000; cess 50,000.', expected: 0.25 * 50 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L) })) },
  { id: 'CO-02', group: 'Company', title: 'Turnover exactly 400 crore → 25%', working: '"Does not exceed" is met: 12,50,000; cess 50,000.', expected: 0.25 * 50 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), turnoverTaxYear2024_25: rupees(400 * CR) })) },
  { id: 'CO-03', group: 'Company', title: 'Turnover 400 crore + Re. 1 → 30%', working: '30% = 15,00,000; cess 60,000.', expected: 0.30 * 50 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), turnoverTaxYear2024_25: rupees(400 * CR + 1) })) },
  { id: 'CO-04', group: 'Company', title: 'No turnover in tax year 2024-25 → 25% (assumption Z-06)', working: '12,50,000; cess 50,000.', expected: 0.25 * 50 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), turnoverTaxYear2024_25: null })) },
  { id: 'CO-05', group: 'Company', title: 'Normal, income 1,00,00,000 (surcharge threshold exactly)', working: '25,00,000; no surcharge; cess 1,00,000.', expected: 0.25 * CR * CESS, actual: coTax(co({ normalIncome: rupees(CR) })) },
  { id: 'CO-06', group: 'Company', title: 'Normal, income 1,00,00,010 (marginal relief)', working: 'Limited to 25,00,000 + 10; cess 1,00,000.40; rounds to 26,00,010.', expected: 2600010, actual: coTax(co({ normalIncome: rupees(CR + 10) })) },
  { id: 'CO-07', group: 'Company', title: 'Normal, income 10,00,00,000 (10 crore exactly)', working: '2,50,00,000 × 1.07 = 2,67,50,000; cess 10,70,000.', expected: 0.25 * 10 * CR * 1.07 * CESS, actual: coTax(co({ normalIncome: rupees(10 * CR) })) },
  { id: 'CO-08', group: 'Company', title: 'Normal, income 10,00,00,010 (marginal relief at 10 crore)', working: 'Limited to 2,67,50,000 + 10; cess 10,70,000.40; rounds to 2,78,20,010.', expected: 27820010, actual: coTax(co({ normalIncome: rupees(10 * CR + 10) })) },
  { id: 'CO-09', group: 'Company', title: 'Normal at 30%, income 20 crore', working: '6,00,00,000 × 1.12 = 6,72,00,000; cess 26,88,000.', expected: 0.30 * 20 * CR * 1.12 * CESS, actual: coTax(co({ normalIncome: rupees(20 * CR), turnoverTaxYear2024_25: rupees(500 * CR) })) },
  { id: 'CO-10', group: 'Company', title: 's.200, income 1,00,00,000', working: '22% = 22,00,000; flat surcharge 10% = 2,20,000; cess 96,800.', expected: 0.22 * CR * 1.10 * CESS, actual: coTax(co({ normalIncome: rupees(CR), regime: 's200' })) },
  { id: 'CO-11', group: 'Company', title: 's.200, income 10,00,000 (flat surcharge has no threshold)', working: '2,20,000 + 22,000; cess 9,680.', expected: 0.22 * 10 * L * 1.10 * CESS, actual: coTax(co({ normalIncome: rupees(10 * L), regime: 's200' })) },
  { id: 'CO-12', group: 'Company', title: 's.201, income 1,00,00,000', working: '15% = 15,00,000; surcharge 10%; cess 66,000.', expected: 0.15 * CR * 1.10 * CESS, actual: coTax(co({ normalIncome: rupees(CR), regime: 's201' })) },
  { id: 'CO-13', group: 'Company', title: 's.200, special purpose vehicle, income 1,00,00,000', working: '22,00,000 × 1.25 = 27,50,000; cess 1,10,000.', expected: 0.22 * CR * 1.25 * CESS, actual: coTax(co({ normalIncome: rupees(CR), regime: 's200', isSpecialPurposeVehicle: true })) },
  { id: 'CO-14', group: 'Company', title: 'MAT applies: income 10,00,000, book profit 1 crore (30% company)', working: 'Normal tax 3,00,000 < MAT 14% = 14,00,000; no surcharge; cess 56,000.', expected: 0.14 * CR * CESS, actual: coTax(co({ normalIncome: rupees(10 * L), turnoverTaxYear2024_25: rupees(500 * CR), bookProfit: rupees(CR) })) },
  { id: 'CO-15', group: 'Company', title: 'MAT crossover: income 56,00,000, book profit 1 crore (25% company) — equal, normal provisions apply', working: 'Normal tax 14,00,000 is not less than MAT 14,00,000; cess 56,000.', expected: 0.25 * 56 * L * CESS, actual: (R) => { const r = computeCompany(co({ normalIncome: rupees(56 * L), bookProfit: rupees(CR) }), R); if (r.status !== 'ok' || r.alternateTax?.applies !== false) throw new Error('MAT should not apply'); return r.taxPayable; } },
  { id: 'CO-16', group: 'Company', title: 'MAT crossover: income 55,99,990 — MAT applies', working: 'Normal tax 13,99,997.50 < MAT 14,00,000; cess 56,000.', expected: 0.14 * CR * CESS, actual: (R) => { const r = computeCompany(co({ normalIncome: rupees(5599990), bookProfit: rupees(CR) }), R); if (r.status !== 'ok' || r.alternateTax?.applies !== true) throw new Error('MAT should apply'); return r.taxPayable; } },
  { id: 'CO-17', group: 'Company', title: 'MAT with surcharge: income 50,00,000, book profit 2 crore', working: 'MAT 28,00,000 × 1.07 = 29,96,000; cess 1,19,840.', expected: 0.14 * 2 * CR * 1.07 * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), bookProfit: rupees(2 * CR) })) },
  { id: 'CO-18', group: 'Company', title: 'MAT marginal relief: book profit 1,00,00,010', working: 'MAT limited to 14,00,000 + 10; cess 56,000.40; rounds to 14,56,010.', expected: 1456010, actual: coTax(co({ normalIncome: rupees(10 * L), bookProfit: rupees(CR + 10) })) },
  { id: 'CO-19', group: 'Company', title: 'MAT ignored under s.200 even if book profit is entered', working: 'Same as CO-11.', expected: 0.22 * 10 * L * 1.10 * CESS, actual: coTax(co({ normalIncome: rupees(10 * L), regime: 's200', bookProfit: rupees(5 * CR) })) },
  { id: 'CO-20', group: 'Company', title: 's.200 with brought-forward MAT credit 10,00,000 (assumption Z-07)', working: 'Liability 25,16,800; set-off limited to 25% = 6,29,200; payable 18,87,600.', expected: 0.22 * CR * 1.10 * CESS * 0.75, actual: coTax(co({ normalIncome: rupees(CR), regime: 's200', matCreditBroughtForward: rupees(10 * L) })) },
  { id: 'CO-21', group: 'Company', title: 's.200 with brought-forward MAT credit 1,00,000', working: '25,16,800 − 1,00,000.', expected: 0.22 * CR * 1.10 * CESS - L, actual: coTax(co({ normalIncome: rupees(CR), regime: 's200', matCreditBroughtForward: rupees(L) })) },
  { id: 'CO-22', group: 'Company', title: 'Normal regime: brought-forward MAT credit is not set off', working: 'Same as CO-01.', expected: 0.25 * 50 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), matCreditBroughtForward: rupees(10 * L) })) },
  { id: 'CO-23', group: 'Company', title: 'Inter-corporate dividend: received 20,00,000, distributed 15,00,000', working: 'Income 50,00,000 + 20,00,000 − 15,00,000 = TI 55,00,000; 25% = 13,75,000; cess 55,000.', expected: 0.25 * 55 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), dividend: rupees(20 * L), dividendReceivedForS148: rupees(20 * L), dividendDistributed: rupees(15 * L) })) },
  { id: 'CO-24', group: 'Company', title: 'Business 40,00,000 + LTCG s.197 20,00,000', working: '10,00,000 + 2,50,000 = 12,50,000; cess 50,000.', expected: (0.25 * 40 * L + 0.125 * 20 * L) * CESS, actual: coTax(co({ normalIncome: rupees(40 * L), ltcgOther197: rupees(20 * L) })) },
  { id: 'CO-25', group: 'Company', title: 'Public company: same tax as private (CO-01)', working: 'Company type changes notes only.', expected: 0.25 * 50 * L * CESS, actual: coTax(co({ normalIncome: rupees(50 * L), companyType: 'public' })) },

  // ───────────────────────── I. Section 8
  { id: 'S8-01', group: 'Section 8 company', title: 'Not registered as NPO → taxed as a company', working: 'Same as CO-01.', expected: 0.25 * 50 * L * CESS, actual: (R) => { const r = computeSection8({ registeredNpo: false, company: co({ normalIncome: rupees(50 * L) }) }, R); if (r.status !== 'ok') throw new Error(r.status); return r.taxPayable; } },
  { id: 'S8-02', group: 'Section 8 company', title: 'Registered: 85% met; anonymous donations 5,00,000 of total 40,00,000', working: 'Applied 80,00,000 + accumulated 5,00,000 = 85% of 1 crore, taxable regular income nil. Anonymous: exempt higher of 1,00,000 or 5% × 40,00,000 = 2,00,000; taxable 3,00,000 × 30% = 90,000; cess 3,600.', expected: 0.30 * (5 * L - 0.05 * 40 * L) * CESS, actual: npoTax({ regularIncome: rupees(CR), appliedForObjects: rupees(80 * L), accumulated: rupees(5 * L), anonymousDonations: rupees(5 * L), totalDonationsReceived: rupees(40 * L) }) },
  { id: 'S8-03', group: 'Section 8 company', title: 'Registered: anonymous donations 80,000 (below floor)', working: 'Exempt up to higher of 1,00,000 or 5% × 10,00,000; nothing taxable.', expected: 0, actual: npoTax({ regularIncome: rupees(CR), appliedForObjects: rupees(85 * L), anonymousDonations: rupees(80000), totalDonationsReceived: rupees(10 * L) }) },
  { id: 'S8-04', group: 'Section 8 company', title: 'Registered, wholly religious: anonymous donations not taxed', working: 's.337 Table Sl.1 excludes wholly religious NPOs.', expected: 0, actual: npoTax({ regularIncome: rupees(CR), appliedForObjects: rupees(85 * L), anonymousDonations: rupees(50 * L), totalDonationsReceived: rupees(60 * L), whollyReligious: true }) },
  { id: 'S8-05', group: 'Section 8 company', title: 'Registered: donation of 1 crore to another NPO counts at 85%', working: '85% × 1,00,00,000 = 85,00,000 = 85% of regular income; taxable regular income nil.', expected: 0, actual: npoTax({ regularIncome: rupees(CR), appliedForObjects: 0, donationsToOtherNpos: rupees(CR) }) },
  { id: 'S8-06', group: 'Section 8 company', title: 'Registered: other specified income 2 crore', working: '30% = 60,00,000; company surcharge 7% = 4,20,000; cess 2,56,800.', expected: 0.30 * 2 * CR * 1.07 * CESS, actual: npoTax({ regularIncome: rupees(CR), appliedForObjects: rupees(85 * L), otherSpecifiedIncome: rupees(2 * CR) }) },
  { id: 'S8-07', group: 'Section 8 company', title: 'Registered: taxable regular income (85% not met) — amount only', working: '85% × 1,00,00,000 − applied 50,00,000 = 35,00,000. Tax is blocked pending Q16.', expected: 0.85 * CR - 50 * L, actual: (R) => { const r = computeSection8({ registeredNpo: true, resident: true, npo: { regularIncome: rupees(CR), appliedForObjects: rupees(50 * L) } }, R); if (r.status !== 'blocked') throw new Error(`expected blocked, got ${r.status}`); return r.taxableRegularIncome; } },

  // ───────────────────────── J. Advance tax
  { id: 'AT-01', group: 'Advance tax', title: 'Tax 1,00,000: cumulative by 15 June', working: '15%.', expected: 15000, actual: (R) => adv({ taxPayable: rupees(L) })(R).schedule[0]!.cumulativeAmount },
  { id: 'AT-02', group: 'Advance tax', title: 'Tax 1,00,000: cumulative by 15 September', working: '45%.', expected: 45000, actual: (R) => adv({ taxPayable: rupees(L) })(R).schedule[1]!.cumulativeAmount },
  { id: 'AT-03', group: 'Advance tax', title: 'Tax 1,00,000: instalment due 15 March', working: '100% − 75%.', expected: 25000, actual: (R) => adv({ taxPayable: rupees(L) })(R).schedule[3]!.instalment },
  { id: 'AT-04', group: 'Advance tax', title: 'Tax 9,990: not liable (schedule length)', working: 'Below 10,000.', expected: 0, actual: (R) => rupees(adv({ taxPayable: rupees(9990) })(R).schedule.length) },
  { id: 'AT-05', group: 'Advance tax', title: 'Tax 10,000: liable (schedule length)', working: '10,000 or more: four instalments.', expected: 4, actual: (R) => rupees(adv({ taxPayable: rupees(10000) })(R).schedule.length) },
  { id: 'AT-06', group: 'Advance tax', title: 'Tax 1,00,000 less TDS 95,000: not liable', working: 'Net 5,000.', expected: 0, actual: (R) => rupees(adv({ taxPayable: rupees(L), tdsTcs: rupees(95000) })(R).schedule.length) },
  { id: 'AT-07', group: 'Advance tax', title: 'Senior without business income: not liable', working: 's.403(3).', expected: 0, actual: (R) => rupees(adv({ taxPayable: rupees(5 * L), seniorWithoutBusinessIncome: true })(R).schedule.length) },
  { id: 'AT-08', group: 'Advance tax', title: 'Presumptive: single instalment of whole amount', working: '100% by 15 March.', expected: L, actual: (R) => { const r = adv({ taxPayable: rupees(L), presumptive: true })(R); if (r.schedule.length !== 1) throw new Error('expected one instalment'); return r.schedule[0]!.instalment; } },
  { id: 'AT-09', group: 'Advance tax', title: 'Deferment interest, nothing paid on tax of 1,00,000', working: '3% × 15,000 + 3% × 45,000 + 3% × 75,000 + 1% × 1,00,000 = 450 + 1,350 + 2,250 + 1,000.', expected: 0.03 * 15000 + 0.03 * 45000 + 0.03 * 75000 + 0.01 * L, actual: (R) => adv({ taxPayable: rupees(L), cumulativePaid: [0, 0, 0, 0] })(R).defermentInterest! },
  { id: 'AT-10', group: 'Advance tax', title: 'Deferment interest with safe harbour (12% and 36% paid)', working: 'No interest for June and September; December and March paid in full.', expected: 0, actual: (R) => adv({ taxPayable: rupees(L), cumulativePaid: [rupees(12000), rupees(36000), rupees(75000), rupees(L)] })(R).defermentInterest! },
  { id: 'AT-11', group: 'Advance tax', title: 'Deferment interest: 11,990 paid by June (just below safe harbour)', working: 'Shortfall 15,000 − 11,990 = 3,010 × 3% = 90.30; other instalments in order.', expected: 0.03 * 3010, actual: (R) => adv({ taxPayable: rupees(L), cumulativePaid: [rupees(11990), rupees(36000), rupees(75000), rupees(L)] })(R).defermentInterest! },
  { id: 'AT-12', group: 'Advance tax', title: 'Default interest: 80,000 paid, 4 months', working: 'Paid < 90%; shortfall 20,000 × 1% × 4.', expected: 20000 * 0.01 * 4, actual: (R) => adv({ taxPayable: rupees(L), cumulativePaid: [0, 0, 0, rupees(80000)], monthsOfDefault: 4 })(R).defaultInterest! },
  { id: 'AT-13', group: 'Advance tax', title: 'Default interest: 90,000 paid', working: '90% paid, no interest u/s 424.', expected: 0, actual: (R) => adv({ taxPayable: rupees(L), cumulativePaid: [0, 0, 0, rupees(90000)], monthsOfDefault: 4 })(R).defaultInterest! },
];
