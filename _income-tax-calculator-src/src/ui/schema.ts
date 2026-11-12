// The entities the calculator handles. Each opens its own live computation sheet.

export type Entity = 'individual' | 'huf' | 'firm' | 'company_private' | 'company_public' | 'section8';

export const ENTITIES: { id: Entity; label: string; hint: string }[] = [
  { id: 'individual', label: 'Individual / Proprietor', hint: 'New or old regime, with a comparison' },
  { id: 'huf', label: 'Hindu Undivided Family', hint: 'New or old regime; no rebate, no age bands' },
  { id: 'firm', label: 'Partnership Firm / LLP', hint: 'Partner remuneration limits and AMT check' },
  { id: 'company_private', label: 'Private Limited Company', hint: 'Normal provisions with MAT, or s.200 / s.201' },
  { id: 'company_public', label: 'Public Limited Company', hint: 'Same tax engine as a private company' },
  { id: 'section8', label: 'Section 8 Company', hint: 'Registered non-profit organisation, or taxed as a company' },
];
