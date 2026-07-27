import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  throw new Error("Usage: node scripts/audit-kie-case-intelligence.mjs <jsonl>");
}

const inputPath = path.resolve(input);
const cases = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "cases.json"), "utf8"));
const casesById = new Map(cases.map((record) => [record.id, record]));
const lines = fs.readFileSync(inputPath, "utf8").split("\n").filter((line) => line.trim());
const records = [];
const parseErrors = [];

for (const [index, line] of lines.entries()) {
  try {
    records.push(JSON.parse(line));
  } catch (error) {
    parseErrors.push({
      line: index + 1,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const latestById = new Map();
for (const record of records) latestById.set(record.id, record);
const statusCounts = {};
const sourceStatusCounts = {};
const promptVersionCounts = {};
const criticalIssues = [];
let promptTokens = 0;
let completionTokens = 0;

for (const record of latestById.values()) {
  statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
  promptTokens += record.usage?.prompt_tokens || 0;
  completionTokens += record.usage?.completion_tokens || 0;
  const sourceStatus = record.intelligence?.source_access_status || "unknown";
  sourceStatusCounts[sourceStatus] = (sourceStatusCounts[sourceStatus] || 0) + 1;
  const promptVersion = record.prompt_version || "unknown";
  promptVersionCounts[promptVersion] = (promptVersionCounts[promptVersion] || 0) + 1;
  const sourceRecord = casesById.get(record.id);
  if (!sourceRecord) {
    criticalIssues.push({ id: record.id, issue: "unknown-case-id" });
    continue;
  }
  if (record.status !== "accepted") continue;
  const intelligence = record.intelligence;
  if (!intelligence) {
    criticalIssues.push({ id: record.id, issue: "accepted-without-intelligence" });
    continue;
  }
  if (intelligence.id !== record.id) {
    criticalIssues.push({ id: record.id, issue: "id-mismatch" });
  }
  if (sourceRecord.alleged && intelligence.case_family !== "allegation_or_unresolved") {
    criticalIssues.push({ id: record.id, issue: "allegation-classification-drift" });
  }
  if (
    typeof sourceRecord.amount === "number" &&
    intelligence.monetary_consequence?.known &&
    intelligence.monetary_consequence.amount !== sourceRecord.amount
  ) {
    criticalIssues.push({
      id: record.id,
      issue: "amount-conflict",
      expected: sourceRecord.amount,
      received: intelligence.monetary_consequence.amount,
    });
  }
  if (intelligence.source_access_status === "inaccessible" && intelligence.confidence === "high") {
    criticalIssues.push({ id: record.id, issue: "high-confidence-without-source" });
  }
  if ((intelligence.summary || "").length < 220) {
    criticalIssues.push({ id: record.id, issue: "summary-too-short" });
  }
  const sourceManifest = record.source_manifest;
  if (
    intelligence.source_access_status !== "inaccessible" &&
    !sourceManifest?.body_sha256
  ) {
    criticalIssues.push({ id: record.id, issue: "missing-reproducible-source-manifest" });
  }
  if (intelligence.source_access_status === "full_document") {
    if (
      !Number.isInteger(sourceManifest?.page_count) ||
      sourceManifest.page_count < 1 ||
      (sourceManifest.extracted_characters || 0) < 500 ||
      !Array.isArray(sourceManifest.selected_pages) ||
      sourceManifest.selected_pages.length < 1
    ) {
      criticalIssues.push({ id: record.id, issue: "invalid-full-document-manifest" });
    }
    const selectedPages = new Set(sourceManifest?.selected_pages || []);
    for (const note of intelligence.evidence_notes || []) {
      const validShape = /^p\.\s*\d+(?:\s*[-,]\s*\d+)*$/i.test(note.locator || "");
      const citedPages = validShape
        ? [...note.locator.matchAll(/\d+/g)].map((match) => Number(match[0]))
        : [];
      const limitedNonPageEvidence = !validShape &&
        intelligence.publication_ready === false &&
        intelligence.confidence !== "high";
      if (
        (!validShape && !limitedNonPageEvidence) ||
        citedPages.some((page) => !selectedPages.has(page))
      ) {
        criticalIssues.push({
          id: record.id,
          issue: "evidence-locator-not-in-selected-pages",
          locator: note.locator || null,
        });
      }
    }
  }
  if (
    ["metadata_only", "inaccessible"].includes(intelligence.source_access_status) &&
    (intelligence.confidence === "high" || intelligence.publication_ready)
  ) {
    criticalIssues.push({ id: record.id, issue: "insufficient-source-overclaim" });
  }
  if (
    sourceManifest?.source_authority !== "primary_case_document" &&
    (intelligence.confidence === "high" || intelligence.publication_ready)
  ) {
    criticalIssues.push({ id: record.id, issue: "non-primary-source-overclaim" });
  }
  const evidenceFields = new Set((intelligence.evidence_notes || []).map((note) => note.field));
  if (!evidenceFields.has("outcome")) {
    criticalIssues.push({ id: record.id, issue: "outcome-missing-evidence-note" });
  }
  if (intelligence.recorded_tool && !evidenceFields.has("recorded_tool")) {
    criticalIssues.push({ id: record.id, issue: "recorded-tool-missing-evidence-note" });
  }
  if (intelligence.judicial_reasoning && !evidenceFields.has("judicial_reasoning")) {
    criticalIssues.push({ id: record.id, issue: "reasoning-missing-evidence-note" });
  }
  if (intelligence.monetary_consequence?.known && !evidenceFields.has("amount")) {
    criticalIssues.push({ id: record.id, issue: "amount-missing-evidence-note" });
  }
  if ((intelligence.verified_fields || []).some((field) => [
    "summary",
    "direct_answer",
    "why_it_matters",
    "practical_implications",
    "evidence_boundary",
    "confidence",
    "publication_ready",
  ].includes(field))) {
    criticalIssues.push({ id: record.id, issue: "generated-prose-marked-verified" });
  }
}

const report = {
  input: inputPath,
  lines: lines.length,
  parsed: records.length,
  unique_cases: latestById.size,
  duplicate_lines: records.length - latestById.size,
  parse_errors: parseErrors,
  status_counts: statusCounts,
  source_status_counts: sourceStatusCounts,
  prompt_version_counts: promptVersionCounts,
  usage: {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  },
  critical_issue_count: criticalIssues.length,
  critical_issues: criticalIssues,
  merge_ready: parseErrors.length === 0 &&
    criticalIssues.length === 0 &&
    (statusCounts.rejected || 0) === 0 &&
    (statusCounts.failed || 0) === 0,
};

console.log(JSON.stringify(report, null, 2));
if (!report.merge_ready) process.exitCode = 1;
