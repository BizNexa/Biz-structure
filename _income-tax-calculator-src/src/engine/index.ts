// Public surface of the calculation engine. Pure functions; no UI or file-system dependencies.
// Callers load rules/ty2026-27.json themselves and pass the result of buildRules().

export { buildRules, type RawRuleFile, type Rules } from './rules.ts';
export { rupees, toRupees, roundStatutory, type Paise } from './money.ts';
export type { TraceLine } from './trace.ts';
export type { Profile, Liability, FlatLiability } from './core.ts';
export { computeIndividual, type IndividualInput, type IndividualResult, type RegimeResult, type Regime } from './individual.ts';
export { computeFirm, partnerRemuneration, partnerInterest, type FirmInput, type EntityResult, type EntityIncome, type AltTaxResult, type NotSupported } from './firm.ts';
export { computeCompany, type CompanyInput, type CompanyRegime } from './company.ts';
export { computeSection8, type Section8Input, type NpoInput, type NpoResult } from './section8.ts';
export { presumptiveIncome, type PresumptiveInput } from './presumptive.ts';
export { computeAdvanceTax, type AdvanceTaxInput, type AdvanceTaxResult, type InstalmentLine } from './advanceTax.ts';
