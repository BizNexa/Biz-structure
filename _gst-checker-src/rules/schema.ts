/**
 * Zod schema for the rule set. Every legal statement in the tool is a record that
 * matches one of these shapes. The build (scripts/build-rules.ts) and the linter
 * (scripts/lint-rules.ts) both validate against this schema, and the build fails on
 * any error.
 */
import { z } from 'zod';

export const VerificationStatus = z.enum(['handbook', 'official', 'secondary', 'unverified', 'conflict']);
export type VerificationStatus = z.infer<typeof VerificationStatus>;
export const Confidence = z.enum(['certain', 'likely', 'guessing']);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const SourceRef = z
  .object({
    doc: z.enum(['handbook', 'research', 'gst_tutorial', 'derived']),
    page: z.number().int().positive().optional(), // printed page (handbook)
    pdf_page: z.number().int().positive().optional(),
    section: z.string().optional(),
    url: z.string().url().optional(),
    fetched: isoDate.optional(),
    quote: z.string().max(300).optional(), // short paraphrase/pointer, not a reproduction
  })
  .strict();
export type SourceRef = z.infer<typeof SourceRef>;

/** Recursive condition grammar. Facts are checked against engine/facts.ts by the linter. */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { fact: string; equals: string | number | boolean }
  | { fact: string; in: (string | number)[] }
  | { fact: string; includes_any: string[] }
  | { fact: string; gt: number }
  | { fact: string; gte: number }
  | { fact: string; lt: number }
  | { fact: string; lte: number }
  | { fact: string; lte_param: string }
  | { fact: string; gt_param: string };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ any: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ not: ConditionSchema }).strict(),
    z.object({ fact: z.string(), equals: z.union([z.string(), z.number(), z.boolean()]) }).strict(),
    z.object({ fact: z.string(), in: z.array(z.union([z.string(), z.number()])).min(1) }).strict(),
    z.object({ fact: z.string(), includes_any: z.array(z.string()).min(1) }).strict(),
    z.object({ fact: z.string(), gt: z.number() }).strict(),
    z.object({ fact: z.string(), gte: z.number() }).strict(),
    z.object({ fact: z.string(), lt: z.number() }).strict(),
    z.object({ fact: z.string(), lte: z.number() }).strict(),
    z.object({ fact: z.string(), lte_param: z.string() }).strict(),
    z.object({ fact: z.string(), gt_param: z.string() }).strict(),
  ]),
);

/** Fields every record carries. */
export const Base = z.object({
  id: z.string().regex(/^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/, 'ids are UPPER-KEBAB'),
  description: z.string().min(10),
  source_ref: z.array(SourceRef).min(1),
  effective_from: isoDate,
  effective_to: isoDate.nullable(),
  verification_status: VerificationStatus,
  confidence: Confidence,
  notes: z.string().default(''),
});

export const Meta = z
  .object({
    ruleset_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    ruleset_date: isoDate,
    title: z.string(),
    cutover_dates: z.array(z.object({ date: isoDate, label: z.string() })),
    disclaimer: z.string(),
  })
  .strict();

export const StateRecord = Base.extend({
  code: z.string().length(2),
  name: z.string(),
  kind: z.enum(['state', 'ut']),
  threshold_category: z.enum(['SCS_EXPL', 'OTHER_SCS_A', 'OTHER_SCS_B', 'NON_SCS_EXCL', 'OTHER']),
}).strict();

export const ThresholdRecord = Base.extend({
  threshold_category: z.enum(['SCS_EXPL', 'OTHER_SCS_A', 'OTHER_SCS_B', 'NON_SCS_EXCL', 'OTHER']),
  services_or_mixed_lakh: z.number().positive(),
  goods_only_lakh: z.number().positive(),
  goods_only_basis: z.string(),
  legal_basis: z.string(),
}).strict();

export const LiabilityRule = Base.extend({
  topic: z.enum(['liability_s22', 'compulsory_s24', 'exemption', 'voluntary']),
  legal_basis: z.string(),
  plain_language: z.string(),
  applies_if: ConditionSchema,
  outcome: z.enum(['TRIGGER', 'EXEMPTION', 'VOLUNTARY']),
  /**
   * For triggers: what a blanket s.23 exemption does to this trigger (as of the s.23 substitution
   * w.e.f. 1 Oct 2023). 'displaced' = the handbook says s.23 overrides it; 'ca_review' = the
   * person registers in a capacity other than as supplier, or the handbook is not explicit, so the
   * engine routes the overlap to the CA (see conflict C-005).
   */
  s23_override: z.enum(['displaced', 'ca_review']).optional(),
  /** For exemptions: 'blanket' exempts the person; 'displaces' removes only the listed triggers. */
  scope: z.enum(['blanket', 'displaces']).optional(),
  displaces: z.array(z.string()).optional(),
  /** Exemption whose conditions the handbook does not fully list: the result is routed to the CA. */
  ca_confirmation_required: z.boolean().default(false),
  ca_question: z.string(),
  route_hint: z.string().optional(),
  deadline_ids: z.array(z.string()).default([]),
}).strict();

export const DeadlineRule = Base.extend({
  applies_if: ConditionSchema.optional(),
  plain_language: z.string(),
  legal_basis: z.string(),
}).strict();

export const RouteCondition = z
  .object({
    id: z.string(),
    description: z.string(),
    test: ConditionSchema,
    fail_message: z.string(),
    source_ref: z.array(SourceRef).min(1),
    verification_status: VerificationStatus,
  })
  .strict();

export const Route = Base.extend({
  form: z.string(),
  name: z.string(),
  plain_language: z.string(),
  kind: z.enum(['special_category', 'simplified', 'normal']),
  priority: z.number().int(),
  /** When the route is relevant at all (otherwise "not applicable"). */
  relevant_if: ConditionSchema,
  conditions: z.array(RouteCondition),
  optional_route: z.boolean(),
  timeline_ids: z.array(z.string()),
}).strict();

export const Timeline = Base.extend({
  label: z.string(),
  plain_language: z.string(),
  applies_if: ConditionSchema.optional(),
}).strict();

export const DocumentRecord = Base.extend({
  category: z.enum(['constitution', 'identity', 'signatory', 'premises', 'bank', 'special', 'state_specific', 'step']),
  name: z.string(),
  detail: z.string(),
  applies_if: ConditionSchema,
  template_id: z.string().optional(),
  form_version_ids: z.array(z.string()).min(1),
}).strict();

export const ApplicantNote = Base.extend({
  text: z.string(),
  /** before = tip for the application; after = obligation once registered. */
  stage: z.enum(["before", "after"]).default("before"),
  applies_if: ConditionSchema.optional(),
}).strict();

export const Template = Base.extend({
  name: z.string(),
  content: z.string().nullable(),
}).strict();

export const ConfigParam = Base.extend({
  value: z.number(),
  unit: z.string(),
  alternatives: z.array(z.object({ value: z.number(), source: z.string(), verification_status: VerificationStatus })).default([]),
}).strict();

export const FormVersion = Base.extend({
  form: z.string(),
  label: z.string(),
}).strict();

export const LifecycleRecord = Base.extend({
  topic: z.enum(['amendment', 'cancellation', 'suspension', 'revocation']),
  legal_basis: z.string(),
}).strict();

export const Conflict = z
  .object({
    id: z.string().regex(/^C-\d{3}$/),
    title: z.string(),
    description: z.string(),
    positions: z.array(z.object({ source: z.string(), says: z.string(), verification_status: VerificationStatus })).min(1),
    related_ids: z.array(z.string()),
    how_modelled: z.string(),
    status: z.enum(['open', 'resolved']),
    resolution: z.string().nullable(),
  })
  .strict();

export const RuleSetSchema = z
  .object({
    meta: Meta,
    states: z.array(StateRecord),
    thresholds: z.array(ThresholdRecord),
    rules: z.array(LiabilityRule),
    deadlines: z.array(DeadlineRule),
    routes: z.array(Route),
    timelines: z.array(Timeline),
    documents: z.array(DocumentRecord),
    applicant_notes: z.array(ApplicantNote),
    templates: z.array(Template),
    config: z.array(ConfigParam),
    form_versions: z.array(FormVersion),
    lifecycle: z.array(LifecycleRecord),
    conflicts: z.array(Conflict),
  })
  .strict();

export type RuleSet = z.infer<typeof RuleSetSchema>;
export type LiabilityRuleT = z.infer<typeof LiabilityRule>;
export type RouteT = z.infer<typeof Route>;
export type DocumentT = z.infer<typeof DocumentRecord>;
export type TimelineT = z.infer<typeof Timeline>;
export type DeadlineT = z.infer<typeof DeadlineRule>;
export type StateT = z.infer<typeof StateRecord>;
export type ThresholdT = z.infer<typeof ThresholdRecord>;
export type ConflictT = z.infer<typeof Conflict>;
export type ConfigT = z.infer<typeof ConfigParam>;
export type BaseT = z.infer<typeof Base>;
export type SourceRefT = z.infer<typeof SourceRef>;

/** Which top-level keys come from which YAML file. */
export const RULE_FILES: Record<keyof RuleSet, string> = {
  meta: 'meta.yaml',
  states: 'states.yaml',
  thresholds: 'thresholds.yaml',
  rules: 'liability.yaml',
  deadlines: 'deadlines.yaml',
  routes: 'routes.yaml',
  timelines: 'timelines.yaml',
  documents: 'documents.yaml',
  applicant_notes: 'applicant-notes.yaml',
  templates: 'templates.yaml',
  config: 'config.yaml',
  form_versions: 'form-versions.yaml',
  lifecycle: 'lifecycle.yaml',
  conflicts: 'conflicts.yaml',
};
