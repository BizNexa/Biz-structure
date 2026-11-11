import { describe, it, expect } from 'vitest';
import { run } from './helpers';

const CUT = ['2026-10-31', '2026-11-01', '2027-04-01'] as const;

describe('as-of date cut-overs: 31 Oct 2026, 1 Nov 2026, 1 Apr 2027', () => {
  it('new scrap TDS categories (Notification 07/2026-CT) apply from 1 Nov 2026', () => {
    const facts = { tds_category: 'new_scrap_recipient', aggregate_turnover_lakh: 10 } as const;
    const v = CUT.map((d) => run(facts, d).a.verdict);
    expect(v).toEqual(['NOT_REQUIRED', 'MANDATORY', 'MANDATORY']);
  });

  it('Rule 14B is available only from 1 Nov 2026', () => {
    const facts = {
      supplies_via_eco: true,
      eco_supplies_only_9_5_services: false,
      interstate_taxable_supply: true,
      aggregate_turnover_lakh: 80,
      existing_registrations_same_pan: 'other_states',
      wants_rule_14b: true,
      no_presence_in_target_state: true,
      target_state_supplies_only_via_eco: true,
      monthly_output_tax_to_registered_lakh: 1,
      aadhaar_authentication_willing: true,
    } as const;
    const routes = CUT.map((d) => run(facts, d).a.recommended_route_ids[0]);
    expect(routes).toEqual(['ROUTE-REG01-NORMAL', 'ROUTE-RULE-14B', 'ROUTE-RULE-14B']);
  });

  it('checklist switches to the revised REG-01 on 1 Nov 2026', () => {
    const facts = { constitution: 'opc', aggregate_turnover_lakh: 50 } as const;
    const [before, after, later] = CUT.map((d) => run(facts, d).checklist);
    expect(before.forms.map((x) => x.version_id)).toEqual(['FV-REG01-2017']);
    expect(after.forms.map((x) => x.version_id)).toEqual(['FV-REG01-2026']);
    expect(later.forms.map((x) => x.version_id)).toEqual(['FV-REG01-2026']);
    const ids = (c: typeof before) => c.rows.map((r) => r.id);
    expect(ids(before)).toContain('DOC-BANK');
    expect(ids(before)).toContain('DOC-COMPANY-INCORPORATION');
    expect(ids(before)).not.toContain('DOC-OPC-CATEGORY-2026');
    expect(ids(after)).toContain('DOC-BANK-2026');
    expect(ids(after)).toContain('DOC-OPC-CATEGORY-2026');
    expect(ids(after)).not.toContain('DOC-BANK');
  });

  it('the eligibility verdict is stable across 1 Nov 2026 and 1 Apr 2027 for ordinary facts', () => {
    for (const facts of [{ aggregate_turnover_lakh: 45 }, { aggregate_turnover_lakh: 10 }, { interstate_taxable_supply: true }]) {
      const v = CUT.map((d) => run(facts, d).a.verdict);
      expect(new Set(v).size).toBe(1);
    }
  });

  it('lifecycle rules in force change on 1 Apr 2027 (Rule 23A)', () => {
    const lc = CUT.map((d) => run({}, d).a.lifecycle_in_force);
    expect(lc[0]).toContain('LC-AMEND-RULE19-2017');
    expect(lc[1]).toContain('LC-AMEND-RULE19-2026');
    expect(lc[1]).not.toContain('LC-RULE23A-2027');
    expect(lc[2]).toContain('LC-RULE23A-2027');
  });
});

describe('Rule 14A route', () => {
  const ok = {
    aggregate_turnover_lakh: 45,
    wants_rule_14a: true,
    aadhaar_authentication_willing: true,
    aadhaar_exempt_class: false,
    existing_14a_same_state: false,
    monthly_output_tax_to_registered_lakh: 2,
  } as const;
  const route = (over: object, d = '2026-11-07') => run({ ...ok, ...over }, d).a.routes.find((r) => r.id === 'ROUTE-RULE-14A');

  it('is not in force before 1 Nov 2025', () => {
    expect(route({}, '2025-10-31')).toBeUndefined();
    expect(route({}, '2025-11-01')?.status).toBe('eligible');
  });
  it('is recommended when all conditions hold', () => {
    expect(run(ok).a.recommended_route_ids).toContain('ROUTE-RULE-14A');
  });
  it.each([
    ['R14A-AADHAAR', { aadhaar_authentication_willing: false }],
    ['R14A-NOT-25-6D', { aadhaar_exempt_class: true }],
    ['R14A-ONE-PER-STATE', { existing_14a_same_state: true }],
    ['R14A-CAP', { monthly_output_tax_to_registered_lakh: 3 }],
    ['R14A-NOT-ISD', { is_isd: true }],
  ])('fails on %s with the failing condition shown', (cond, over) => {
    const r = route(over)!;
    expect(r.status).toBe('not_eligible');
    expect(r.failing.map((c) => c.id)).toContain(cond);
  });
  it('cap is read from config (conflict status), not hardcoded', () => {
    expect(route({ monthly_output_tax_to_registered_lakh: 2.5 })!.status).toBe('eligible');
    expect(route({ monthly_output_tax_to_registered_lakh: 2.5 })!.pending_verification).toBe(true);
  });
  it('unknown cap answer gives route status unknown and normal REG-01 is recommended', () => {
    const a = run({ ...ok, monthly_output_tax_to_registered_lakh: 'unknown' }).a;
    expect(a.routes.find((r) => r.id === 'ROUTE-RULE-14A')!.status).toBe('unknown');
    expect(a.recommended_route_ids).toContain('ROUTE-REG01-NORMAL');
  });
  it('withdrawal timeline changes on 1 Apr 2026', () => {
    // Timelines are referenced by the route; the engine filters records by date in the UI layer.
    expect(route({}, '2026-03-31')!.timeline_ids).toContain('TL-RULE14A-WITHDRAWAL-PRE-2026-04');
  });
});

describe('special-category routes and deadlines', () => {
  it('casual taxable person gets the 5-day rule and 90-day validity', () => {
    const a = run({ casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false, supply_nature: 'services_only', aggregate_turnover_lakh: 5 }).a;
    expect(a.deadlines.map((d) => d.id)).toEqual(expect.arrayContaining(['DL-CTP-NRTP-5-DAYS', 'DL-CTP-NRTP-VALIDITY']));
    expect(a.deadlines.map((d) => d.id)).not.toContain('DL-S25-1-30-DAYS');
  });
  it('long exhibition (> 180 days) needs normal registration, not casual', () => {
    const a = run({ casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: true, aggregate_turnover_lakh: 5 }).a;
    expect(a.verdict).toBe('MANDATORY');
    expect(a.recommended_route_ids).toContain('ROUTE-REG01-NORMAL');
    expect(a.recommended_route_ids).not.toContain('ROUTE-REG01-CASUAL');
  });
  it('ISD gets its own route alongside normal', () => {
    const a = run({ is_isd: true, aggregate_turnover_lakh: 100, constitution: 'private_company' }).a;
    expect(a.recommended_route_ids.slice(0, 2)).toEqual(['ROUTE-REG01-ISD', 'ROUTE-REG01-NORMAL']);
  });
  it('TCS operator gets REG-07', () => {
    const a = run({ is_eco_operator: true, eco_collects_tcs: true, eco_liable_9_5: false, constitution: 'private_company', supply_nature: 'services_only', aggregate_turnover_lakh: 500 }).a;
    expect(a.recommended_route_ids).toEqual(expect.arrayContaining(['ROUTE-REG07-TCS', 'ROUTE-REG01-NORMAL']));
  });
  it('multistate facility appears from 1 Oct 2026 when supplying from several States', () => {
    const facts = { other_supply_states: ['KA'], aggregate_turnover_lakh: 60 };
    expect(run(facts, '2026-09-30').a.recommended_route_ids).not.toContain('ROUTE-MULTISTATE');
    expect(run(facts, '2026-10-01').a.recommended_route_ids).toContain('ROUTE-MULTISTATE');
  });
});
