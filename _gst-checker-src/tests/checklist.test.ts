import { describe, it, expect } from 'vitest';
import { CONSTITUTIONS, PREMISES_TYPES, buildView } from '../engine';
import { run } from './helpers';

describe('document checklist', () => {
  it('premises rows follow Instruction 03/2025-GST by premises type', () => {
    const expected: Record<string, string> = {
      owned: 'DOC-PPOB-OWNED',
      rented_registered_agreement: 'DOC-PPOB-RENTED-REGISTERED',
      rented_unregistered_agreement: 'DOC-PPOB-RENTED-UNREGISTERED',
      rented_no_agreement: 'DOC-PPOB-RENTED-NO-AGREEMENT',
      consent_relative: 'DOC-PPOB-CONSENT',
      shared_with_agreement: 'DOC-PPOB-SHARED-AGREEMENT',
      shared_without_agreement: 'DOC-PPOB-SHARED-NO-AGREEMENT',
      sez_premises: 'DOC-PPOB-SEZ',
      co_working: 'DOC-PPOB-CO-WORKING',
      deceased_ancestor: 'DOC-PPOB-DECEASED',
      other: 'DOC-PPOB-OTHER-2026',
    };
    for (const p of PREMISES_TYPES) {
      const ids = run({ premises_type: p, aggregate_turnover_lakh: 50 }).checklist.rows.filter((r) => r.category === 'premises').map((r) => r.id);
      expect(ids, p).toContain(expected[p]);
    }
  });

  it('pre-November 2026 premises rows for the same types', () => {
    const ids = run({ premises_type: 'co_working', aggregate_turnover_lakh: 50 }, '2026-10-31').checklist.rows.map((r) => r.id);
    expect(ids).toContain('DOC-PPOB-CO-WORKING-PRE');
    expect(ids).not.toContain('DOC-PPOB-CO-WORKING');
  });

  it('Circular 257 formats appear as named templates with no invented text', () => {
    const c = run({ premises_type: 'consent_relative', aggregate_turnover_lakh: 50 }).checklist;
    const tpl = c.rows.filter((r) => r.template).map((r) => r.template!);
    expect(tpl.map((t) => t.id)).toEqual(expect.arrayContaining(['TPL-C257-CONSENT', 'TPL-C257-RENT-FREE']));
    tpl.forEach((t) => expect(t.content).toBeNull());
  });

  it('rows that are not handbook/official carry the pending-verification marker', () => {
    const c = run({ constitution: 'llp', premises_type: 'co_working', aggregate_turnover_lakh: 50 }).checklist;
    for (const r of c.rows) expect(r.pending_verification).toBe(!['handbook', 'official'].includes(r.verification_status));
    expect(c.rows.some((r) => r.pending_verification)).toBe(true);
  });

  it('NRTP gets REG-09 documents, not REG-01 ones', () => {
    const c = run({ constitution: 'foreign_entity', non_resident_occasional: true, aggregate_turnover_lakh: 5 }).checklist;
    expect(c.forms.map((x) => x.form)).toEqual(['REG-09']);
    expect(c.rows.map((r) => r.id)).toEqual(expect.arrayContaining(['DOC-NRTP-PASSPORT', 'DOC-NRTP-BANK', 'DOC-NRTP-SIGNATORY']));
    expect(c.rows.map((r) => r.id)).not.toContain('DOC-PAN');
  });

  it('TDS deductor gets REG-07 with TAN', () => {
    const c = run({ constitution: 'government_local_authority', supply_nature: 'no_outward_supplies', tds_category: 'govt_department', aadhaar_exempt_class: true }).checklist;
    expect(c.forms.map((x) => x.form)).toEqual(['REG-07']);
    expect(c.rows.map((r) => r.id)).toEqual(expect.arrayContaining(['DOC-TAN', 'DOC-TDS-PARTS']));
  });

  it('unknown premises type includes premises rows as "may apply"', () => {
    const c = run({ premises_type: 'unknown', aggregate_turnover_lakh: 50 }).checklist;
    const prem = c.rows.filter((r) => r.category === 'premises');
    expect(prem.length).toBeGreaterThan(3);
    prem.forEach((r) => expect(r.certainty).toBe('may_apply'));
  });

  it('not-required verdict shows the voluntary REG-01 checklist', () => {
    expect(run({ aggregate_turnover_lakh: 10 }).checklist.context).toBe('if_registering_voluntarily');
  });
});

describe('report checklist snapshots per entity type (content used by page and PDF)', () => {
  const table = (over: Record<string, unknown>) => {
    const { facts, a, checklist } = run(over as never);
    const v = buildView(facts, a, checklist);
    return v.groups.map((g) => [g.category, g.rows.map((r) => r.name + (r.template ? ' [template]' : ''))]);
  };
  for (const constitution of CONSTITUTIONS) {
    it(constitution, () => {
      expect(table({ constitution, aggregate_turnover_lakh: 50, premises_type: 'rented_registered_agreement' })).toMatchSnapshot();
    });
  }
  const special: [string, Record<string, unknown>][] = [
    ['non-resident taxable person', { constitution: 'foreign_entity', non_resident_occasional: true, aggregate_turnover_lakh: 5 }],
    ['casual taxable person', { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false, aggregate_turnover_lakh: 5 }],
    ['OIDAR provider', { constitution: 'foreign_entity', oidar_from_outside_to_nonregistered: true, supply_nature: 'services_only', aggregate_turnover_lakh: 100 }],
    ['ISD', { constitution: 'private_company', is_isd: true, aggregate_turnover_lakh: 100 }],
    ['TDS deductor', { constitution: 'government_local_authority', supply_nature: 'no_outward_supplies', tds_category: 'govt_department', aadhaar_exempt_class: true }],
    ['TCS collector', { constitution: 'private_company', is_eco_operator: true, eco_collects_tcs: true, eco_liable_9_5: false, supply_nature: 'services_only', aggregate_turnover_lakh: 500 }],
    ['SEZ unit', { constitution: 'private_company', sez_unit_or_developer: true, premises_type: 'sez_premises', aggregate_turnover_lakh: 50 }],
    ['scrap dealer (others)', { constitution: 'others', tds_category: 'metal_scrap_recipient', aggregate_turnover_lakh: 80 }],
  ];
  for (const [label, over] of special) it(label, () => expect(table(over)).toMatchSnapshot());
});
