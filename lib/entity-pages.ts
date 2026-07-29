import { LEGAL_RISK_CASES, type LegalRiskCase } from "@/lib/cases";
import { ENTITY_MEDIA_REVISION } from "@/lib/entity-media";

export const ENTITY_KINDS = [
  "court",
  "judge",
  "country",
  "state",
  "tool",
  "failure",
  "consequence",
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export type CorpusEntity = {
  kind: EntityKind;
  slug: string;
  label: string;
  records: readonly LegalRiskCase[];
  latest: string;
  sourceLinked: number;
  indexEligible: boolean;
};

export type JudgeEntityContext = {
  primaryCourt: string | null;
  courtHref: string | null;
  jurisdiction: string | null;
  state: string | null;
  stateHref: string | null;
  country: string | null;
  circuit: string | null;
  role: string | null;
};

const INDEX_MIN_RECORDS = 3;

export const FAILURE_MODE_DEFINITIONS = {
  "fake-citations": "Authorities or citations recorded as nonexistent, inaccurate, or not locatable in the cited form.",
  "fabricated-quotes": "Quoted text recorded as absent from, altered from, or unsupported by the cited material.",
  "misrepresented-authority": "Existing authority recorded as used for a proposition, jurisdiction, or rule it does not support.",
} as const;

type FailureModeKey = keyof typeof FAILURE_MODE_DEFINITIONS;

const GENERIC_TOOL_LABELS = new Set([
  "ai (implied, unspecified)",
  "implied",
  "implied (by me)",
  "unidentified",
  "unknown",
  "gen ai",
]);

function routeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function comparisonKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function titleLabel(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function isFailureModeKey(value: string): value is FailureModeKey {
  return Object.hasOwn(FAILURE_MODE_DEFINITIONS, value);
}

function toolKey(value: string) {
  return comparisonKey(value).replace(/[.,;:()[\]]/g, "").replace(/\s+/g, " ");
}

const TOOL_NORMALIZERS: ReadonlyArray<{
  label: string;
  pattern: RegExp;
}> = [
  { label: "ChatGPT", pattern: /\b(?:chatgpt|chatgtp|gpt[- ]?3\.5|gpt[- ]?4o|gpt[- ]?4(?:\.5)?)\b/i },
  { label: "Claude", pattern: /\bclaude(?:\.ai| sonnet 4)?\b/i },
  { label: "Microsoft Copilot", pattern: /\b(?:microsoft|ms)\s+co-?pilot\b/i },
  { label: "Copilot", pattern: /(?:^|[,;])\s*co-?pilot\s*(?:$|[,;])/i },
  { label: "CoCounsel", pattern: /\b(?:co-?counsel|cocounsel)\b/i },
  { label: "Google Gemini", pattern: /\b(?:google\s+)?gemini\b/i },
  { label: "Google Bard", pattern: /\b(?:google\s+)?bard\b/i },
  { label: "Perplexity", pattern: /\bperplexity(?:\.ai)?\b/i },
  { label: "Grok", pattern: /\bgrok\b/i },
  { label: "DeepSeek", pattern: /\bdeepseek\b/i },
  { label: "Centient AI", pattern: /\b(?:centient|cetient)(?:\s+ai)?\b/i },
  { label: "vLex Fastcase", pattern: /\b(?:vlex\s+)?fastcase\b/i },
  { label: "Lexis+ AI", pattern: /\blexis\+?\s*(?:ai|assist)\b|\blexisnexis\+?\s*\(?prot[eé]g[eé]\)?\b|\bprot[eé]g[eé]\s*\(lexisnexis\)/i },
  { label: "Westlaw Precision", pattern: /\bwestlaw precision\b/i },
  { label: "Westlaw AI", pattern: /\bwestlaw(?:'s|’s)?\s+ai\b/i },
  { label: "Westlaw Quick Check", pattern: /\bwestlaw(?:'s|’s)?\s+quick check\b/i },
  { label: "Google AI Overview", pattern: /\bgoogle ai overview\b/i },
  { label: "NotebookLM", pattern: /\bnotebooklm\b/i },
  { label: "Paxton AI", pattern: /\bpaxton ai\b/i },
  { label: "MobiOffice AI Assistant", pattern: /\bmobioffice(?:'s)?(?:\s+ai assistant)?\b/i },
  { label: "Eve Legal", pattern: /\b(?:eve legal|eve)\b/i },
  { label: "LEAP", pattern: /\bleap(?: legal software)?\b/i },
  { label: "Grammarly", pattern: /\bgrammarly\b/i },
  { label: "ProWritingAid", pattern: /\bprowritingaid\b/i },
  { label: "OpenCase", pattern: /\bopencase\b/i },
  { label: "Clearbrief", pattern: /\bclear\s*brief\b/i },
  { label: "CourtAid", pattern: /\bcourtaid\b/i },
];

const NON_TOOL_LABELS = [
  /\binternet searches?\b/i,
  /\bgoogle search\b/i,
  /\bgoogle scholar\b/i,
  /^google$/i,
  /^lexisnexis$/i,
  /^westlaw$/i,
  /^bloomberg law$/i,
];

function recordedToolLabels(value: string) {
  const normalized = value.trim();
  const matched = TOOL_NORMALIZERS.filter(({ pattern }) => pattern.test(normalized))
    .map(({ label }) => label);
  if (matched.length) return [...new Set(matched)];
  if (NON_TOOL_LABELS.some((pattern) => pattern.test(normalized))) return [];
  return [normalized];
}

function sourceLinked(records: readonly LegalRiskCase[]) {
  return records.filter((record) => Boolean(record.source_url)).length;
}

function createEntities(
  kind: EntityKind,
  rows: readonly LegalRiskCase[],
  getValue: (record: LegalRiskCase) => string | null,
  getLabel: (value: string, record: LegalRiskCase) => string,
) {
  const buckets = new Map<string, { label: string; records: LegalRiskCase[] }>();
  for (const record of rows) {
    const value = getValue(record);
    if (!value) continue;
    const key = comparisonKey(value);
    if (!key) continue;
    const current = buckets.get(key) || { label: getLabel(value, record), records: [] };
    current.records.push(record);
    buckets.set(key, current);
  }

  const slugs = new Map<string, number>();
  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const base = routeSlug(key) || "record";
      const occurrence = (slugs.get(base) || 0) + 1;
      slugs.set(base, occurrence);
      const records = bucket.records.slice().sort((a, b) => b.date.localeCompare(a.date) || a.case_name.localeCompare(b.case_name));
      return {
        kind,
        slug: occurrence === 1 ? base : `${base}-${occurrence}`,
        label: bucket.label,
        records,
        latest: records[0]?.date || "",
        sourceLinked: sourceLinked(records),
        indexEligible: records.length >= INDEX_MIN_RECORDS && sourceLinked(records) >= INDEX_MIN_RECORDS,
      } satisfies CorpusEntity;
    })
    .sort((a, b) => b.records.length - a.records.length || a.label.localeCompare(b.label));
}

function toolEntities() {
  const buckets = new Map<string, { label: string; records: LegalRiskCase[] }>();
  for (const record of LEGAL_RISK_CASES) {
    const rawLabel = record.ai_tool_used?.trim();
    if (!rawLabel || GENERIC_TOOL_LABELS.has(comparisonKey(rawLabel))) continue;
    for (const label of recordedToolLabels(rawLabel)) {
      const key = toolKey(label);
      if (!key) continue;
      const current = buckets.get(key) || { label, records: [] };
      current.records.push(record);
      buckets.set(key, current);
    }
  }

  const slugs = new Map<string, number>();
  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const base = routeSlug(key) || "recorded-tool";
      const occurrence = (slugs.get(base) || 0) + 1;
      slugs.set(base, occurrence);
      const records = bucket.records.slice().sort((a, b) => b.date.localeCompare(a.date) || a.case_name.localeCompare(b.case_name));
      return {
        kind: "tool" as const,
        slug: occurrence === 1 ? base : `${base}-${occurrence}`,
        label: bucket.label,
        records,
        latest: records[0]?.date || "",
        sourceLinked: sourceLinked(records),
        indexEligible: records.length >= INDEX_MIN_RECORDS && sourceLinked(records) >= INDEX_MIN_RECORDS,
      } satisfies CorpusEntity;
    })
    .sort((a, b) => b.records.length - a.records.length || a.label.localeCompare(b.label));
}

const ENTITIES: Record<EntityKind, readonly CorpusEntity[]> = {
  court: createEntities("court", LEGAL_RISK_CASES, (record) => record.court?.trim() || null, (value) => value),
  judge: createEntities("judge", LEGAL_RISK_CASES, (record) => record.judge?.trim() || null, (value) => value),
  country: createEntities("country", LEGAL_RISK_CASES, (record) => {
    const country = record.country?.trim();
    return country && country !== "UNKNOWN" ? country : null;
  }, (value) => value),
  state: createEntities("state", LEGAL_RISK_CASES.filter((record) => record.country === "US" && Boolean(record.state)), (record) => record.state?.trim() || null, (value, record) => record.state_display?.trim() || value),
  tool: toolEntities(),
  failure: createMultiValueEntities("failure", "tags"),
  consequence: createMultiValueEntities("consequence", "sanction_types"),
};

// Failure signals and consequences are multi-value fields, so construct those buckets directly
// rather than pretending a case has a single classification. Only the three explicit failure
// signals are eligible for the failure taxonomy; stage, party, practice, and consequence tags
// remain case metadata and are not treated as failures.
function createMultiValueEntities(
  kind: "failure" | "consequence",
  field: "tags" | "sanction_types",
) {
  const buckets = new Map<string, LegalRiskCase[]>();
  for (const record of LEGAL_RISK_CASES) {
    for (const value of record[field] || []) {
      const key = comparisonKey(value);
      if (!key) continue;
      if (kind === "failure" && !isFailureModeKey(key)) continue;
      const current = buckets.get(key) || [];
      current.push(record);
      buckets.set(key, current);
    }
  }
  const slugs = new Map<string, number>();
  return [...buckets.entries()]
    .map(([key, records]) => {
      const base = routeSlug(key) || kind;
      const occurrence = (slugs.get(base) || 0) + 1;
      slugs.set(base, occurrence);
      const sorted = records.slice().sort((a, b) => b.date.localeCompare(a.date) || a.case_name.localeCompare(b.case_name));
      return {
        kind,
        slug: occurrence === 1 ? base : `${base}-${occurrence}`,
        label: titleLabel(key),
        records: sorted,
        latest: sorted[0]?.date || "",
        sourceLinked: sourceLinked(sorted),
        indexEligible: sorted.length >= INDEX_MIN_RECORDS && sourceLinked(sorted) >= INDEX_MIN_RECORDS,
      } satisfies CorpusEntity;
    })
    .sort((a, b) => b.records.length - a.records.length || a.label.localeCompare(b.label));
}

export function getEntities(kind: EntityKind) {
  return ENTITIES[kind];
}

export function getEntity(kind: EntityKind, slug: string) {
  return ENTITIES[kind].find((entity) => entity.slug === slug) || null;
}

export function getRecordEntities(kind: EntityKind, recordId: string) {
  return ENTITIES[kind].filter((entity) =>
    entity.records.some((record) => record.id === recordId),
  );
}

function mostFrequentValue(
  records: readonly LegalRiskCase[],
  getValue: (record: LegalRiskCase) => string | null | undefined,
) {
  const counts = new Map<string, { value: string; count: number; first: number }>();
  records.forEach((record, index) => {
    const value = getValue(record)?.trim();
    if (!value) return;
    const key = comparisonKey(value);
    const current = counts.get(key);
    counts.set(key, {
      value: current?.value || value,
      count: (current?.count || 0) + 1,
      first: current?.first ?? index,
    });
  });
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.first - b.first || a.value.localeCompare(b.value),
  )[0]?.value || null;
}

export function judgeEntityContext(
  entity: CorpusEntity,
): JudgeEntityContext | null {
  if (entity.kind !== "judge") return null;
  const primaryCourt = mostFrequentValue(entity.records, (record) => record.court);
  const jurisdictionValue = mostFrequentValue(
    entity.records,
    (record) => record.jurisdiction,
  );
  const state = mostFrequentValue(entity.records, (record) => record.state);
  const country = mostFrequentValue(entity.records, (record) => record.country);
  const circuit = mostFrequentValue(entity.records, (record) => record.circuit);
  const role = mostFrequentValue(entity.records, (record) => record.judge_role);
  const courtEntity = primaryCourt
    ? ENTITIES.court.find(
        (candidate) => comparisonKey(candidate.label) === comparisonKey(primaryCourt),
      )
    : null;
  const stateEntity = state
    ? ENTITIES.state.find((candidate) =>
        candidate.records.some((record) => record.state === state),
      )
    : null;

  return {
    primaryCourt,
    courtHref: courtEntity ? entityHref("court", courtEntity.slug) : null,
    jurisdiction: jurisdictionValue ? titleLabel(jurisdictionValue) : null,
    state,
    stateHref: stateEntity ? entityHref("state", stateEntity.slug) : null,
    country,
    circuit,
    role,
  };
}

export function entityHref(kind: EntityKind, slug: string) {
  return `/${entityPathSegment(kind)}/${slug}`;
}

export function entityReportHref(kind: EntityKind, slug: string) {
  return `${entityHref(kind, slug)}/report`;
}

export function entityOgImageHref(
  kind: EntityKind,
  slug: string,
  variant: "profile" | "report" = "profile",
) {
  const query =
    variant === "report"
      ? `?variant=report-${ENTITY_MEDIA_REVISION}`
      : `?rev=${ENTITY_MEDIA_REVISION}`;
  return `/og/entity/${kind}/${slug}${query}`;
}

export function entityDirectoryHref(kind: EntityKind) {
  return `/${entityPathSegment(kind)}`;
}

function entityPathSegment(kind: EntityKind) {
  if (kind === "failure") return "failure-modes";
  if (kind === "country") return "countries";
  return `${kind}s`;
}

export function entityLabel(kind: EntityKind) {
  return {
    court: "courts",
    judge: "recorded judges and decision-makers",
    country: "countries",
    state: "US states and territories",
    tool: "recorded AI tools",
    failure: "failure modes",
    consequence: "recorded consequences",
  }[kind];
}

export function entityCaseDirectoryHref(entity: CorpusEntity) {
  const params = new URLSearchParams();
  if (entity.kind === "court") params.set("court", entity.label);
  if (entity.kind === "judge") params.set("judge", entity.label);
  if (entity.kind === "country") params.set("country", entity.label);
  if (entity.kind === "state") {
    const state = entity.records[0]?.state;
    if (state) params.set("state", state);
  }
  if (entity.kind === "tool") params.set("tool", entity.label);
  if (entity.kind === "failure") params.set("failure", entity.slug);
  if (entity.kind === "consequence") return `/analytics?view=explore&sanction=${encodeURIComponent(entity.slug)}`;
  params.set("sort", "date");
  return `/cases?${params.toString()}`;
}

export function entitySummary(entity: CorpusEntity, corpusTotal: number) {
  const percentage = corpusTotal ? Math.round((entity.records.length / corpusTotal) * 1000) / 10 : 0;
  const noun = entity.records.length === 1 ? "record" : "records";
  return `${entity.label} appears in ${entity.records.length.toLocaleString()} of ${corpusTotal.toLocaleString()} public corpus ${noun} (${percentage}%). This page describes the recorded dataset, not an incidence rate, prevalence of AI use, or a prediction of future outcomes.`;
}

export function entityDefinition(entity: CorpusEntity) {
  if (entity.kind !== "failure") return null;
  return FAILURE_MODE_DEFINITIONS[entity.slug as FailureModeKey] || null;
}

export function entityRelated(entity: CorpusEntity, limit = 8) {
  const relatedKinds = ENTITY_KINDS.filter((kind) => kind !== entity.kind);
  const recordIds = new Set(entity.records.map((record) => record.id));
  return relatedKinds
    .flatMap((kind) => getEntities(kind).map((candidate) => ({ candidate, overlap: candidate.records.reduce((count, record) => count + (recordIds.has(record.id) ? 1 : 0), 0) })))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.candidate.records.length - a.candidate.records.length || a.candidate.label.localeCompare(b.candidate.label))
    .slice(0, limit);
}

export function entityIndexThreshold() {
  return INDEX_MIN_RECORDS;
}
