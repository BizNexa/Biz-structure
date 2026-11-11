/**
 * Semantic lint of the rule set (beyond the Zod schema). Errors fail the build.
 */
import type { Condition, RuleSet, SourceRefT, BaseT } from '../../rules/schema';
import { FACTS, type FactSpec } from '../../engine/facts';

export interface LintResult {
  errors: string[];
  warnings: string[];
}

type AnyRecord = BaseT & Record<string, unknown>;

export function allRecords(rs: RuleSet): { kind: string; rec: AnyRecord }[] {
  const out: { kind: string; rec: AnyRecord }[] = [];
  const push = (kind: string, list: AnyRecord[]) => list.forEach((rec) => out.push({ kind, rec }));
  push('state', rs.states as AnyRecord[]);
  push('threshold', rs.thresholds as AnyRecord[]);
  push('rule', rs.rules as AnyRecord[]);
  push('deadline', rs.deadlines as AnyRecord[]);
  push('route', rs.routes as AnyRecord[]);
  push('timeline', rs.timelines as AnyRecord[]);
  push('document', rs.documents as AnyRecord[]);
  push('applicant_note', rs.applicant_notes as AnyRecord[]);
  push('template', rs.templates as AnyRecord[]);
  push('config', rs.config as AnyRecord[]);
  push('form_version', rs.form_versions as AnyRecord[]);
  push('lifecycle', rs.lifecycle as AnyRecord[]);
  return out;
}

export function lintRuleSet(rs: RuleSet): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const records = allRecords(rs);

  // ---- 1. ids unique across the whole rule set (incl. route conditions and conflicts)
  const ids = new Map<string, string>();
  const addId = (id: string, where: string) => {
    if (ids.has(id)) errors.push(`duplicate id ${id} (${where} and ${ids.get(id)})`);
    else ids.set(id, where);
  };
  records.forEach(({ kind, rec }) => addId(rec.id, kind));
  rs.routes.forEach((r) => r.conditions.forEach((c) => addId(c.id, `route condition of ${r.id}`)));
  rs.conflicts.forEach((c) => addId(c.id, 'conflict'));

  const configIds = new Set(rs.config.map((c) => c.id));
  const triggerIds = new Set(rs.rules.filter((r) => r.outcome === 'TRIGGER').map((r) => r.id));

  // ---- 2. base fields and source discipline
  for (const { kind, rec } of records) {
    const where = `${kind} ${rec.id}`;
    if (!rec.source_ref?.length) errors.push(`${where}: missing source_ref`);
    if (!rec.effective_from) errors.push(`${where}: missing effective_from`);
    if (!rec.verification_status) errors.push(`${where}: missing verification_status`);
    if (rec.effective_to && rec.effective_to < rec.effective_from) errors.push(`${where}: effective_to before effective_from`);
    checkSources(where, rec.verification_status, rec.source_ref, errors, warnings);
  }
  for (const r of rs.routes)
    for (const c of r.conditions) checkSources(`route condition ${c.id}`, c.verification_status, c.source_ref, errors, warnings);

  // ---- 3. conditions reference declared facts / values / params
  const checkCond = (where: string, c: Condition | undefined) => c && walkCondition(c, where, configIds, errors);
  rs.rules.forEach((r) => checkCond(`rule ${r.id}`, r.applies_if));
  rs.deadlines.forEach((d) => checkCond(`deadline ${d.id}`, d.applies_if));
  rs.routes.forEach((r) => {
    checkCond(`route ${r.id}.relevant_if`, r.relevant_if);
    r.conditions.forEach((c) => checkCond(`route condition ${c.id}`, c.test));
  });
  rs.timelines.forEach((t) => checkCond(`timeline ${t.id}`, t.applies_if));
  rs.documents.forEach((d) => checkCond(`document ${d.id}`, d.applies_if));
  rs.applicant_notes.forEach((n) => checkCond(`note ${n.id}`, n.applies_if));

  // ---- 4. cross references
  const deadlineIds = new Set(rs.deadlines.map((d) => d.id));
  const timelineIds = new Set(rs.timelines.map((t) => t.id));
  const routeIds = new Set(rs.routes.map((r) => r.id));
  const fvIds = new Set(rs.form_versions.map((f) => f.id));
  const tplIds = new Set(rs.templates.map((t) => t.id));
  for (const r of rs.rules) {
    if (r.outcome === 'TRIGGER' && !r.s23_override) errors.push(`rule ${r.id}: trigger must declare s23_override`);
    if (r.outcome === 'EXEMPTION' && !r.scope) errors.push(`rule ${r.id}: exemption must declare scope`);
    if (r.scope === 'displaces' && !r.displaces) errors.push(`rule ${r.id}: scope displaces needs a displaces list`);
    (r.displaces ?? []).forEach((d) => !triggerIds.has(d) && errors.push(`rule ${r.id}: displaces unknown trigger ${d}`));
    r.deadline_ids.forEach((d) => !deadlineIds.has(d) && errors.push(`rule ${r.id}: unknown deadline ${d}`));
    if (r.route_hint && !routeIds.has(r.route_hint)) errors.push(`rule ${r.id}: unknown route_hint ${r.route_hint}`);
  }
  rs.routes.forEach((r) => r.timeline_ids.forEach((t) => !timelineIds.has(t) && errors.push(`route ${r.id}: unknown timeline ${t}`)));
  rs.documents.forEach((d) => {
    d.form_version_ids.forEach((f) => !fvIds.has(f) && errors.push(`document ${d.id}: unknown form version ${f}`));
    if (d.template_id && !tplIds.has(d.template_id)) errors.push(`document ${d.id}: unknown template ${d.template_id}`);
  });
  for (const c of rs.conflicts)
    c.related_ids.forEach((id) => !ids.has(id) && errors.push(`conflict ${c.id}: unknown related id ${id}`));

  // ---- 5. every `conflict` record must be covered by an open conflict entry
  const inOpenConflict = new Set(rs.conflicts.filter((c) => c.status === 'open').flatMap((c) => c.related_ids));
  for (const { kind, rec } of records)
    if (rec.verification_status === 'conflict' && !inOpenConflict.has(rec.id))
      errors.push(`${kind} ${rec.id}: status conflict but no open conflict lists it`);
  for (const r of rs.routes)
    for (const c of r.conditions)
      if (c.verification_status === 'conflict' && !inOpenConflict.has(c.id))
        errors.push(`route condition ${c.id}: status conflict but no open conflict lists it`);

  // ---- 6. thresholds: one record per category at any date
  const cats = new Set(rs.thresholds.map((t) => t.threshold_category));
  for (const cat of cats) {
    const recs = rs.thresholds.filter((t) => t.threshold_category === cat).sort((a, b) => a.effective_from.localeCompare(b.effective_from));
    for (let i = 1; i < recs.length; i++) {
      const prevEnd = recs[i - 1].effective_to;
      if (!prevEnd || prevEnd >= recs[i].effective_from) errors.push(`thresholds ${cat}: ${recs[i - 1].id} overlaps ${recs[i].id}`);
    }
  }
  for (const s of rs.states) if (!cats.has(s.threshold_category)) errors.push(`state ${s.id}: no thresholds for ${s.threshold_category}`);

  // ---- 7. NOT VERIFIED markers should not hide behind handbook/official
  for (const { kind, rec } of records)
    if (/NOT VERIFIED|UNVERIFIED/.test(rec.notes) && (rec.verification_status === 'official'))
      warnings.push(`${kind} ${rec.id}: notes say NOT VERIFIED but status is official`);

  return { errors, warnings };
}

function checkSources(where: string, status: string, refs: SourceRefT[], errors: string[], warnings: string[]) {
  for (const r of refs) {
    if (r.doc === 'handbook' && (!r.page || !r.pdf_page)) errors.push(`${where}: handbook source needs page and pdf_page`);
    if (r.doc === 'gst_tutorial' && (!r.url || !r.fetched)) errors.push(`${where}: gst_tutorial source needs url and fetched`);
  }
  const docs = new Set(refs.map((r) => r.doc));
  if (status === 'official' && !refs.some((r) => r.url && r.fetched))
    errors.push(`${where}: status official requires a source with url and fetched date`);
  if (status === 'handbook' && !docs.has('handbook')) errors.push(`${where}: status handbook requires a handbook source`);
  if (status === 'secondary' && !docs.has('research')) warnings.push(`${where}: status secondary but no research source`);
}

function walkCondition(c: Condition, where: string, configIds: Set<string>, errors: string[]) {
  if ('all' in c) return c.all.forEach((x) => walkCondition(x, where, configIds, errors));
  if ('any' in c) return c.any.forEach((x) => walkCondition(x, where, configIds, errors));
  if ('not' in c) return walkCondition(c.not, where, configIds, errors);
  const spec = (FACTS as Record<string, FactSpec>)[c.fact];
  if (!spec) return errors.push(`${where}: unknown fact "${c.fact}"`);
  const checkVal = (v: unknown) => {
    if (spec.type === 'boolean' && typeof v !== 'boolean') errors.push(`${where}: ${c.fact} is boolean, got ${JSON.stringify(v)}`);
    if ((spec.type === 'enum' || spec.type === 'enum_multi') && !spec.values!.includes(v as string))
      errors.push(`${where}: ${c.fact} has no value ${JSON.stringify(v)}`);
    if (spec.type === 'number' && typeof v !== 'number') errors.push(`${where}: ${c.fact} is numeric, got ${JSON.stringify(v)}`);
  };
  if ('equals' in c) checkVal(c.equals);
  else if ('in' in c) c.in.forEach(checkVal);
  else if ('includes_any' in c) {
    if (spec.type !== 'enum_multi') errors.push(`${where}: includes_any needs an enum_multi fact`);
    c.includes_any.forEach(checkVal);
  } else if ('lte_param' in c || 'gt_param' in c) {
    if (spec.type !== 'number') errors.push(`${where}: param comparison needs a numeric fact`);
    const p = 'lte_param' in c ? c.lte_param : c.gt_param;
    if (!configIds.has(p)) errors.push(`${where}: unknown config param ${p}`);
  } else if (spec.type !== 'number') errors.push(`${where}: numeric comparison on non-numeric fact ${c.fact}`);
}
