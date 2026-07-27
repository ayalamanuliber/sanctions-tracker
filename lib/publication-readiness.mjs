/**
 * Deterministic publication-readiness scoring for the public Legal AI Risk
 * corpus. This module deliberately does not discard records: a record that is
 * not ready for search indexing remains available to research and carries the
 * precise evidence gap that must be resolved before it can be promoted.
 */

export const PUBLICATION_READINESS_SCHEMA_VERSION = 1;

const MIN_INDEXABLE_SUMMARY_LENGTH = 120;
const DETAILED_SUMMARY_LENGTH = 240;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value) {
  return Boolean(text(value));
}

function hasValues(value) {
  return Array.isArray(value) && value.length > 0;
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHttpUrl(value) {
  try {
    const url = new URL(text(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSpecificTool(value) {
  const normalized = text(value).toLowerCase();
  return Boolean(normalized) && ![
    "ai (implied, unspecified)",
    "unidentified",
    "unknown",
    "not recorded",
  ].includes(normalized);
}

function slugify(value) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function issue(field, code, impact, remediation) {
  return { field, code, impact, remediation };
}

/**
 * Assess one raw corpus record. The score measures documentary completeness,
 * not legal severity, truth, or the likelihood that a search engine indexes a
 * URL. `index-ready` requires a source, a substantive summary, and enough
 * context to create a useful standalone page.
 */
export function assessPublicationReadiness(record) {
  const missingFields = [];
  const scoreBreakdown = [];
  const add = (criterion, points, met) => {
    scoreBreakdown.push({ criterion, points: met ? points : 0, maximum: points });
    return met;
  };

  const name = add("case_name", 10, hasText(record.case_name));
  if (!name) missingFields.push(issue("case_name", "case-name-missing", "blocking", "Record the public matter name before publication."));

  const date = add("date", 10, isIsoDate(record.date));
  if (!date) missingFields.push(issue("date", "decision-date-missing-or-invalid", "blocking", "Record an ISO decision or event date from the underlying source."));

  const court = add("court", 10, hasText(record.court));
  if (!court) missingFields.push(issue("court", "court-not-recorded", "blocking", "Record the deciding court or tribunal from the primary material."));

  const jurisdiction = add("jurisdiction", 5, hasText(record.jurisdiction));
  if (!jurisdiction) missingFields.push(issue("jurisdiction", "jurisdiction-not-recorded", "important", "Classify the matter's jurisdiction from the source."));

  const sourceUrl = add("source_url", 20, isHttpUrl(record.source_url));
  if (!sourceUrl) missingFields.push(issue("source_url", hasText(record.source_url) ? "source-url-invalid" : "source-link-missing", "blocking", "Add a stable primary, docket, or clearly labeled secondary source URL."));

  const sourceName = add("source_name", 5, hasText(record.source_name));
  if (!sourceName) missingFields.push(issue("source_name", "source-publisher-not-recorded", "important", "Name the publisher, court, or repository that hosts the source."));

  const summaryLength = text(record.summary).length;
  const summaryPoints = summaryLength >= DETAILED_SUMMARY_LENGTH ? 10 : summaryLength >= MIN_INDEXABLE_SUMMARY_LENGTH ? 6 : 0;
  scoreBreakdown.push({ criterion: "summary", points: summaryPoints, maximum: 10 });
  if (summaryLength === 0) {
    missingFields.push(issue("summary", "summary-missing", "blocking", "Add a neutral, source-grounded summary of the matter."));
  } else if (summaryLength < MIN_INDEXABLE_SUMMARY_LENGTH) {
    missingFields.push(issue("summary", "summary-too-brief", "blocking", `Expand the summary to at least ${MIN_INDEXABLE_SUMMARY_LENGTH} source-grounded characters.`));
  } else if (summaryLength < DETAILED_SUMMARY_LENGTH) {
    missingFields.push(issue("summary", "summary-needs-detail", "improvement", `Expand the summary toward ${DETAILED_SUMMARY_LENGTH} characters with procedural and evidentiary context.`));
  }

  const outcome = add("outcome", 5, hasText(record.outcome));
  if (!outcome) missingFields.push(issue("outcome", "outcome-not-recorded", "important", "Record the documented disposition, consequence, or procedural posture."));

  const discrepancies = add("hallucination_items", 5, hasText(record.hallucination_items));
  if (!discrepancies) missingFields.push(issue("hallucination_items", "discrepancy-detail-not-recorded", "important", "Record the cited, quoted, or authority discrepancy supported by the source."));

  const tool = add("ai_tool_used", 5, isSpecificTool(record.ai_tool_used));
  if (!tool) missingFields.push(issue("ai_tool_used", "specific-ai-tool-not-established", "context", "Keep the attribution boundary explicit; do not infer a specific tool without source support."));

  const tags = add("tags", 5, hasValues(record.tags));
  if (!tags) missingFields.push(issue("tags", "classification-tags-missing", "improvement", "Add source-supported failure-mode and context tags."));

  const lesson = add("lesson", 5, hasText(record.lesson));
  if (!lesson) missingFields.push(issue("lesson", "operational-lesson-not-recorded", "improvement", "Add a neutral, source-grounded operational lesson or leave the page without a lesson module."));

  const reviewed = add("reviewed", 5, record.reviewed === true);
  if (!reviewed) missingFields.push(issue("reviewed", "publication-review-pending", "improvement", "Complete and date editorial publication review before calling this case curated."));

  const score = scoreBreakdown.reduce((total, item) => total + item.points, 0);
  const hasIndexBaseline = name && date && court && sourceUrl && summaryLength >= MIN_INDEXABLE_SUMMARY_LENGTH;
  const tier = hasIndexBaseline && score >= 65
    ? "index-ready"
    : name && date && court && sourceUrl
      ? "enrichment-ready"
      : "research-only";

  return {
    id: text(record.id),
    slug: text(record.id),
    score,
    maximum_score: 100,
    tier,
    index_eligible: tier === "index-ready",
    source_eligible: sourceUrl,
    summary_length: summaryLength,
    score_breakdown: scoreBreakdown,
    missing_fields: missingFields,
  };
}

function assessCorpus(records) {
  const slugCounts = new Map();
  return records.map((record) => {
    const assessment = assessPublicationReadiness(record);
    const base = slugify(record.id || `${record.case_name}-${record.date}`);
    const occurrence = (slugCounts.get(base) || 0) + 1;
    slugCounts.set(base, occurrence);
    return { ...assessment, slug: occurrence === 1 ? base : `${base}--${occurrence}` };
  });
}

function tierCounts(assessments) {
  const tiers = { "index-ready": 0, "enrichment-ready": 0, "research-only": 0 };
  for (const assessment of assessments) {
    tiers[assessment.tier] += 1;
  }
  return tiers;
}

/** Build a stable, machine-readable report while preserving corpus order. */
export function buildPublicationReadinessReport(records, metadata = {}) {
  const assessments = assessCorpus(records);
  const tiers = tierCounts(assessments);
  const issueCounts = {};

  for (const assessment of assessments) {
    for (const missing of assessment.missing_fields) {
      issueCounts[missing.code] = (issueCounts[missing.code] || 0) + 1;
    }
  }

  return {
    schema_version: PUBLICATION_READINESS_SCHEMA_VERSION,
    dataset_checksum: metadata.dataset_checksum || null,
    corpus_checked: metadata.last_checked || null,
    total_cases: records.length,
    total_assessments: assessments.length,
    tiers,
    issue_counts: Object.fromEntries(Object.entries(issueCounts).sort(([left], [right]) => left.localeCompare(right))),
    records: assessments,
  };
}

/**
 * Small server-side lookup index. It intentionally omits score breakdowns and
 * remediation text; use the full report for editorial work.
 */
export function buildPublicationReadinessIndex(records, metadata = {}) {
  const assessments = assessCorpus(records);
  const bySlug = {};
  for (const assessment of assessments) {
    bySlug[assessment.slug] = {
      tier: assessment.tier,
      score: assessment.score,
    };
  }

  return {
    schema_version: PUBLICATION_READINESS_SCHEMA_VERSION,
    dataset_checksum: metadata.dataset_checksum || null,
    corpus_checked: metadata.last_checked || null,
    total_cases: records.length,
    tiers: tierCounts(assessments),
    by_slug: bySlug,
  };
}

/** Throw if a saved report no longer represents the supplied corpus. */
export function assertPublicationReadinessReport(report, records, metadata = {}) {
  if (!report || report.schema_version !== PUBLICATION_READINESS_SCHEMA_VERSION) {
    throw new Error("Publication-readiness report schema version is unsupported.");
  }
  if (report.total_cases !== records.length || report.total_assessments !== records.length) {
    throw new Error("Publication-readiness report does not retain every corpus record.");
  }
  if (metadata.dataset_checksum && report.dataset_checksum !== metadata.dataset_checksum) {
    throw new Error("Publication-readiness report checksum does not match the corpus metadata.");
  }
  const expected = buildPublicationReadinessReport(records, metadata);
  if (JSON.stringify(report) !== JSON.stringify(expected)) {
    throw new Error("Publication-readiness report is stale or differs from deterministic scoring.");
  }
  return true;
}

/** Throw if a compact server-side index no longer represents the corpus. */
export function assertPublicationReadinessIndex(index, records, metadata = {}) {
  if (!index || index.schema_version !== PUBLICATION_READINESS_SCHEMA_VERSION) {
    throw new Error("Publication-readiness index schema version is unsupported.");
  }
  if (index.total_cases !== records.length || Object.keys(index.by_slug || {}).length !== records.length) {
    throw new Error("Publication-readiness index does not retain every corpus record.");
  }
  if (metadata.dataset_checksum && index.dataset_checksum !== metadata.dataset_checksum) {
    throw new Error("Publication-readiness index checksum does not match the corpus metadata.");
  }
  const expected = buildPublicationReadinessIndex(records, metadata);
  if (JSON.stringify(index) !== JSON.stringify(expected)) {
    throw new Error("Publication-readiness index is stale or differs from deterministic scoring.");
  }
  return true;
}
