/**
 * Document checklist generator. Rows come from rules/documents.yaml; a row is included when one of
 * its form versions is in force, the row itself is in force, the form belongs to a recommended route
 * (or REG-01 when nothing is recommended), and applies_if is true. Rows whose applies_if is unknown
 * are included and marked "may apply".
 */
import type { Facts } from './facts';
import { evalCondition } from './logic';
import { RULESET, inForce, isPendingVerification, paramsAt, type CompiledRuleSet } from './ruleset';
import type { Assessment } from './evaluate';
import { deriveFacts } from './evaluate';
import { computeThresholds } from './thresholds';
import type { DocumentT, VerificationStatus } from '../rules/schema';

export interface ChecklistRow {
  id: string;
  category: DocumentT['category'];
  name: string;
  detail: string;
  form: string;
  form_version_id: string;
  form_version_label: string;
  certainty: 'applies' | 'may_apply';
  template: { id: string; name: string; content: string | null; verification_status: VerificationStatus } | null;
  verification_status: VerificationStatus;
  pending_verification: boolean;
  source_summary: string;
  notes: string;
}

export interface Checklist {
  forms: { form: string; version_id: string; label: string; verification_status: VerificationStatus }[];
  rows: ChecklistRow[];
  notes: { id: string; text: string; verification_status: VerificationStatus; pending_verification: boolean }[];
  context: 'recommended_routes' | 'if_registering_voluntarily';
}

export const CATEGORY_ORDER: DocumentT['category'][] = ['identity', 'constitution', 'signatory', 'premises', 'bank', 'special', 'state_specific', 'step'];

export function formsForRoutes(assessment: Assessment): string[] {
  const forms = new Set<string>();
  for (const id of assessment.recommended_route_ids) {
    const r = assessment.routes.find((x) => x.id === id);
    if (!r) continue;
    const m = r.form.match(/REG-\d+/);
    if (m) forms.add(m[0]);
  }
  return [...forms];
}

export function buildChecklist(facts: Facts, assessment: Assessment, rs: CompiledRuleSet = RULESET): Checklist {
  const asOf = assessment.meta.as_of;
  const thr = computeThresholds(rs, facts, asOf);
  const ctx = { facts: { ...facts, ...deriveFacts(rs, facts, asOf, thr) }, params: paramsAt(rs, asOf) };
  let wanted = formsForRoutes(assessment);
  const context: Checklist['context'] = wanted.length ? 'recommended_routes' : 'if_registering_voluntarily';
  if (!wanted.length) wanted = ['REG-01'];

  const versions = rs.form_versions.filter((v) => inForce(v, asOf) && wanted.includes(v.form));
  const versionIds = new Set(versions.map((v) => v.id));
  const rows: ChecklistRow[] = [];
  for (const d of rs.documents) {
    if (!inForce(d, asOf)) continue;
    const fv = d.form_version_ids.find((id) => versionIds.has(id));
    if (!fv) continue;
    const res = evalCondition(d.applies_if, ctx);
    if (res === false) continue;
    const ver = versions.find((v) => v.id === fv)!;
    const tpl = d.template_id ? rs.templates.find((t) => t.id === d.template_id && inForce(t, asOf)) : undefined;
    rows.push({
      id: d.id,
      category: d.category,
      name: d.name,
      detail: d.detail,
      form: ver.form,
      form_version_id: ver.id,
      form_version_label: ver.label,
      certainty: res === true ? 'applies' : 'may_apply',
      template: tpl ? { id: tpl.id, name: tpl.name, content: tpl.content, verification_status: tpl.verification_status } : null,
      verification_status: d.verification_status,
      pending_verification: isPendingVerification(d.verification_status),
      source_summary: d.source_ref.map(sourceLabel).join('; '),
      notes: d.notes,
    });
  }
  rows.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const notes = rs.applicant_notes
    .filter((n) => (n.stage ?? "before") === "before" && inForce(n, asOf) && (!n.applies_if || evalCondition(n.applies_if, ctx) !== false))
    .map((n) => ({ id: n.id, text: n.text, verification_status: n.verification_status, pending_verification: isPendingVerification(n.verification_status) }));

  return {
    forms: versions.map((v) => ({ form: v.form, version_id: v.id, label: v.label, verification_status: v.verification_status })),
    rows,
    notes,
    context,
  };
}

/** Obligations that start once the person is registered (stage: after). */
export function afterRegistrationNotes(facts: Facts, asOf: string, rs: CompiledRuleSet = RULESET): string[] {
  const thr = computeThresholds(rs, facts, asOf);
  const ctx = { facts: { ...facts, ...deriveFacts(rs, facts, asOf, thr) }, params: paramsAt(rs, asOf) };
  return rs.applicant_notes
    .filter((n) => n.stage === "after" && inForce(n, asOf) && (!n.applies_if || evalCondition(n.applies_if, ctx) !== false))
    .map((n) => n.text);
}

export function sourceLabel(s: { doc: string; page?: number; pdf_page?: number; section?: string; url?: string }): string {
  if (s.doc === 'handbook') return `ICAI Handbook p. ${s.page} (PDF ${s.pdf_page})${s.section ? `, ${s.section}` : ''}`;
  if (s.doc === 'gst_tutorial') return `GST portal user guide${s.section ? `, ${s.section}` : ''}`;
  if (s.doc === 'research') return `Research note p. ${s.page}${s.section ? `, ${s.section}` : ''} (secondary)`;
  return `Derived: ${s.section ?? ''}`;
}
