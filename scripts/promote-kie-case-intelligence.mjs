import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

/**
 * Safe, deliberately conservative promotion of audited Kie JSONL output.
 *
 * This script is proposal-first. It never calls Kie, and it defaults to a
 * dry run that writes an auditable proposal. `--apply` is the only way to
 * change data/case-intelligence.json, and publication upgrades require a
 * second explicit flag.
 */

const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "data", "cases.json");
const TARGET_PATH = path.join(ROOT, "data", "case-intelligence.json");
const AUDIT_SCRIPT = path.join(ROOT, "scripts", "audit-kie-case-intelligence.mjs");
const SOURCE_CACHE_ROOT = path.join(ROOT, ".cache", "kie-sources");
const DEFAULT_PROMPT_VERSION = "case-intelligence-v7";
const DEFAULT_SCHEMA_SHA256 = "72a72e7c25e52103223c742c86415b60ad8c9f570581af8c1a0bffe025ca3639";
const PROMOTION_SCHEMA_VERSION = 1;

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const value = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const inputValue = value("--input");
if (!inputValue) {
  throw new Error("Usage: node scripts/promote-kie-case-intelligence.mjs --input <kie.jsonl> [--apply] [--allow-publication-upgrade]");
}

const inputPath = path.resolve(inputValue);
const manifestPath = path.resolve(value("--manifest", `${inputPath}.manifest.json`));
const proposalPath = path.resolve(value("--out", `${inputPath}.promotion-proposal.json`));
const targetPath = path.resolve(value("--target", TARGET_PATH));
const expectedPromptVersion = value("--prompt-version", DEFAULT_PROMPT_VERSION);
const expectedSchemaSha = value("--schema-sha", DEFAULT_SCHEMA_SHA256);
const apply = hasFlag("--apply");
const allowPublicationUpgrade = hasFlag("--allow-publication-upgrade");

if (allowPublicationUpgrade && !apply) {
  throw new Error("--allow-publication-upgrade requires --apply.");
}
if (!fs.existsSync(inputPath)) throw new Error(`Kie JSONL input not found: ${inputPath}`);
if (!fs.existsSync(manifestPath)) throw new Error(`Kie run manifest not found: ${manifestPath}`);
if (!fs.existsSync(targetPath)) throw new Error(`Canonical intelligence file not found: ${targetPath}`);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  const rows = [];
  const errors = [];
  for (const [index, line] of fs.readFileSync(filePath, "utf8").split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      rows.push({ line: index + 1, value: JSON.parse(line) });
    } catch (error) {
      errors.push({ line: index + 1, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { rows, errors };
}

function atomicWrite(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  fs.writeFileSync(temporaryPath, value);
  fs.renameSync(temporaryPath, filePath);
}

function safeStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function words(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function textStrength(value) {
  const count = words(value);
  if (!count) return 0;
  if (count >= 140) return 3;
  if (count >= 80) return 2;
  return 1;
}

function isGeneric(value) {
  const normalized = String(value || "").toLowerCase();
  return [
    "making it a concrete reference point",
    "linked source controls the precise reasoning",
    "read the linked source and subsequent docket history",
    "this page is not a substitute for the complete docket",
  ].some((phrase) => normalized.includes(phrase));
}

function hasHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validHash(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function cleanHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceManifestErrors(row, sourceRecord) {
  const errors = [];
  const manifest = row.source_manifest;
  const intelligence = row.intelligence || {};
  if (!manifest || typeof manifest !== "object") return ["missing-source-manifest"];
  if (manifest.requested_url !== sourceRecord.source_url) errors.push("source-manifest-requested-url-mismatch");
  if (!hasHttpUrl(manifest.final_url)) errors.push("source-manifest-final-url-invalid");
  if (!Number.isInteger(manifest.http_status) || manifest.http_status < 200 || manifest.http_status >= 300) errors.push("source-manifest-http-status-invalid");
  if (typeof manifest.content_type !== "string" || !manifest.content_type.trim()) errors.push("source-manifest-content-type-missing");
  if (!validHash(manifest.body_sha256)) errors.push("source-manifest-body-hash-invalid");
  if (!Number.isInteger(manifest.body_bytes) || manifest.body_bytes < 1) errors.push("source-manifest-body-bytes-invalid");

  // A manifest without its immutable cached body is not reproducible enough to
  // promote. Restrict the cache reference to the Kie cache root so a JSONL
  // file cannot cause this read-only verifier to inspect arbitrary files.
  let cachePath = null;
  if (typeof manifest.cache_path !== "string" || !manifest.cache_path) {
    errors.push("source-manifest-cache-path-missing");
  } else {
    cachePath = path.resolve(ROOT, manifest.cache_path);
    const cacheRoot = `${SOURCE_CACHE_ROOT}${path.sep}`;
    if (!cachePath.startsWith(cacheRoot)) {
      errors.push("source-manifest-cache-path-outside-kie-cache");
    } else if (!fs.existsSync(cachePath)) {
      errors.push("source-manifest-cache-body-missing");
    } else if (sha256(fs.readFileSync(cachePath)) !== manifest.body_sha256) {
      errors.push("source-manifest-cache-body-hash-mismatch");
    }
  }

  if (intelligence.source_access_status === "full_document") {
    if (!validHash(manifest.extraction_sha256)) errors.push("source-manifest-extraction-hash-invalid");
    if (!Number.isInteger(manifest.extracted_characters) || manifest.extracted_characters < 500) errors.push("source-manifest-extracted-text-insufficient");
    if (!Number.isInteger(manifest.page_count) || manifest.page_count < 1) errors.push("source-manifest-page-count-invalid");
    if (!Array.isArray(manifest.selected_pages) || manifest.selected_pages.length < 1 || manifest.selected_pages.some((page) => !Number.isInteger(page) || page < 1 || page > manifest.page_count)) {
      errors.push("source-manifest-selected-pages-invalid");
    }
    if (cachePath && fs.existsSync(cachePath)) {
      const extractionPath = manifest.extraction_method === "tesseract-eng-120dpi"
        ? `${cachePath}.ocr.txt`
        : manifest.extraction_method === "pdftotext-layout"
          ? `${cachePath}.txt`
          : null;
      if (!extractionPath || !fs.existsSync(extractionPath)) {
        errors.push("source-manifest-extraction-cache-missing");
      } else if (sha256(fs.readFileSync(extractionPath, "utf8")) !== manifest.extraction_sha256) {
        errors.push("source-manifest-extraction-cache-hash-mismatch");
      }
    }
  }
  if (intelligence.source_access_status === "source_excerpt") {
    if (!validHash(manifest.extraction_sha256)) errors.push("source-manifest-excerpt-hash-invalid");
    if (!Number.isInteger(manifest.extracted_characters) || manifest.extracted_characters < 300) errors.push("source-manifest-excerpt-insufficient");
    if (cachePath && fs.existsSync(cachePath)) {
      const extracted = cleanHtml(fs.readFileSync(cachePath, "utf8"));
      if (sha256(extracted) !== manifest.extraction_sha256) errors.push("source-manifest-excerpt-cache-hash-mismatch");
    }
  }
  return errors;
}

function candidateEligibilityErrors(row, sourceRecord, expectedIds) {
  const errors = [];
  const intelligence = row.intelligence;
  if (row.status !== "accepted") errors.push(`status-${row.status || "missing"}`);
  if (row.prompt_version !== expectedPromptVersion) errors.push("prompt-version-mismatch");
  if (!intelligence || typeof intelligence !== "object") return [...errors, "missing-intelligence"];
  if (row.id !== sourceRecord.id || intelligence.id !== sourceRecord.id) errors.push("immutable-id-mismatch");
  if (!expectedIds.has(row.id)) errors.push("id-not-in-run-manifest");
  if (row.source_url !== sourceRecord.source_url) errors.push("outer-source-url-mismatch");
  errors.push(...sourceManifestErrors(row, sourceRecord));

  // Weak source states are useful audit evidence but never alter canonical content.
  if (["metadata_only", "inaccessible"].includes(intelligence.source_access_status)) errors.push("non-promotable-source-access-status");
  if (row.source_manifest?.source_authority !== "primary_case_document") errors.push("non-primary-source-authority");
  if (intelligence.publication_ready !== true) errors.push("publication-not-ready");
  if (!Array.isArray(intelligence.evidence_notes) || intelligence.evidence_notes.length === 0) errors.push("missing-evidence-notes");
  if (words(intelligence.summary) < 80) errors.push("summary-too-short");
  if (words(intelligence.why_it_matters) < 30) errors.push("why-it-matters-too-short");
  if (words(intelligence.evidence_boundary) < 25) errors.push("evidence-boundary-too-short");
  return errors;
}

function reviewMetadataErrors(row, sourceRecord, expectedIds) {
  const errors = [];
  if (row.status !== "accepted") errors.push(`status-${row.status || "missing"}`);
  if (row.prompt_version !== expectedPromptVersion) errors.push("prompt-version-mismatch");
  if (!row.intelligence || typeof row.intelligence !== "object") errors.push("missing-intelligence");
  if (row.id !== sourceRecord.id || row.intelligence?.id !== sourceRecord.id) errors.push("immutable-id-mismatch");
  if (!expectedIds.has(row.id)) errors.push("id-not-in-run-manifest");
  if (row.source_url !== sourceRecord.source_url) errors.push("outer-source-url-mismatch");
  return errors;
}

function evidenceReviewFrom(row) {
  const access = row.intelligence.source_access_status;
  const authority = row.source_manifest?.source_authority;
  let status = "source-unavailable";
  if (
    access === "full_document" &&
    authority === "primary_case_document" &&
    row.intelligence.publication_ready === false
  ) {
    status = "primary-document-limited";
  } else if (access === "full_document" && authority === "primary_case_document") {
    status = "primary-document-verified";
  } else if (access === "source_excerpt" && authority === "primary_case_document") {
    status = "primary-source-excerpt";
  } else if (access === "source_excerpt" && authority === "case_specific_secondary") {
    status = "secondary-source-only";
  } else if (access === "metadata_only") {
    status = "metadata-only";
  }
  const limitations = [...new Set([
    ...(row.intelligence.uncertainties || []),
    row.source_fetch_error ? `Source retrieval note: ${row.source_fetch_error}.` : null,
  ].filter(Boolean))].slice(0, 10);
  return {
    status,
    confidence: row.intelligence.confidence,
    reviewed_at: row.generated_at,
    prompt_version: row.prompt_version,
    limitations,
  };
}

function evidenceFields(intelligence) {
  return new Set((intelligence.evidence_notes || []).map((note) => note?.field).filter(Boolean));
}

function canReplaceText(currentValue, candidateValue, { minimumWords = 1, permitGenericReplacement = true } = {}) {
  if (words(candidateValue) < minimumWords) return false;
  if (!currentValue || !String(currentValue).trim()) return true;
  if (permitGenericReplacement && isGeneric(currentValue) && words(candidateValue) >= words(currentValue)) return true;
  return textStrength(candidateValue) > textStrength(currentValue);
}

function changeField(change, field, currentValue, candidateValue, options) {
  if (!canReplaceText(currentValue, candidateValue, options)) return;
  change.after[field] = candidateValue;
  change.changed_fields.push(field);
}

function changeExactField(change, field, candidateValue) {
  if (candidateValue === undefined) return;
  if (JSON.stringify(change.after[field]) === JSON.stringify(candidateValue)) return;
  change.after[field] = candidateValue;
  change.changed_fields.push(field);
}

function buildCandidateChange(current, row) {
  const candidate = row.intelligence;
  const evidence = evidenceFields(candidate);
  const verified = new Set(candidate.verified_fields || []);
  const after = structuredClone(current);
  const change = {
    id: current.id,
    slug: current.slug,
    source_access_status: candidate.source_access_status,
    confidence: candidate.confidence,
    manifest: {
      final_url: row.source_manifest.final_url,
      body_sha256: row.source_manifest.body_sha256,
      extraction_sha256: row.source_manifest.extraction_sha256 || null,
      extraction_method: row.source_manifest.extraction_method || null,
      selected_pages: row.source_manifest.selected_pages || [],
    },
    changed_fields: [],
    publication_change: null,
    before: {
      id: current.id,
      slug: current.slug,
      publication: current.publication,
    },
    after,
  };

  changeField(change, "summary", current.summary, candidate.summary, { minimumWords: 80 });
  if (words(candidate.direct_answer) >= 25) {
    changeExactField(change, "direct_answer", candidate.direct_answer);
  }
  changeField(change, "why_it_matters", current.why_it_matters, candidate.why_it_matters, { minimumWords: 30 });
  if (verified.has("procedural_posture")) {
    changeExactField(change, "procedural_posture", candidate.procedural_posture);
  }
  if (verified.has("ai_attribution_status")) {
    changeExactField(change, "ai_attribution_status", candidate.ai_attribution_status);
  }
  if (evidence.has("recorded_tool")) {
    changeExactField(change, "recorded_tool", candidate.recorded_tool);
  }
  if (evidence.has("failure_modes")) {
    changeExactField(change, "failure_modes", candidate.failure_modes);
  }
  if (candidate.judicial_reasoning && evidence.has("judicial_reasoning")) {
    changeField(change, "judicial_reasoning", current.judicial_reasoning, candidate.judicial_reasoning, { minimumWords: 20 });
  }
  if (evidence.has("procedural_posture") || evidence.has("outcome")) {
    changeField(change, "decision_context", current.decision_context, candidate.decision_context, { minimumWords: 30 });
  }
  if (evidence.has("outcome")) {
    changeExactField(change, "outcome_summary", candidate.outcome_summary);
  }
  if (evidence.has("amount")) {
    changeExactField(change, "monetary_consequence", candidate.monetary_consequence);
  }
  if (evidence.has("professional_consequence")) {
    changeExactField(change, "professional_consequence", candidate.professional_consequence);
  }
  if (Array.isArray(candidate.practical_implications) && candidate.practical_implications.length >= 3) {
    const currentPractical = Array.isArray(current.practical_implications) ? current.practical_implications.join(" ") : "";
    const candidatePractical = candidate.practical_implications.join(" ");
    if (canReplaceText(currentPractical, candidatePractical, { minimumWords: 30 })) {
      after.practical_implications = candidate.practical_implications;
      change.changed_fields.push("practical_implications");
    }
  }
  // Existing boundaries are deliberately retained unless absent. They are product-level
  // safeguards and are not replaced merely because generated prose is longer.
  if (!current.evidence_boundary && candidate.evidence_boundary) {
    after.evidence_boundary = candidate.evidence_boundary;
    change.changed_fields.push("evidence_boundary");
  }
  if (Array.isArray(candidate.verified_fields)) {
    const currentVerified = Array.isArray(current.verified_fields)
      ? current.verified_fields
      : null;
    const merged = currentVerified
      ? [...new Set([...currentVerified, ...candidate.verified_fields])]
      : null;
    if (merged && JSON.stringify(merged) !== JSON.stringify(currentVerified)) {
      after.verified_fields = merged;
      change.changed_fields.push("verified_fields");
    }
  }
  changeExactField(change, "uncertainties", candidate.uncertainties || []);
  changeExactField(change, "evidence_notes", candidate.evidence_notes || []);
  return change;
}

function runAudit() {
  const result = spawnSync(process.execPath, [AUDIT_SCRIPT, inputPath], {
    cwd: ROOT,
    encoding: "utf8",
  });
  let report = null;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch {
    // The explicit validation error below keeps malformed audit output visible.
  }
  return {
    exit_code: result.status,
    report,
    stderr: (result.stderr || "").trim(),
    valid: result.status === 0 && report?.merge_ready === true,
  };
}

const cases = readJson(CASES_PATH);
const currentIntelligence = readJson(targetPath);
const manifest = readJson(manifestPath);
const { rows, errors: jsonlErrors } = readJsonl(inputPath);
const casesById = new Map(cases.map((record) => [record.id, record]));
const currentById = new Map(currentIntelligence.map((record) => [record.id, record]));
const manifestIds = new Set(manifest.selected_ids || []);
const validationErrors = [];

if (manifest.prompt_version !== expectedPromptVersion) validationErrors.push("manifest-prompt-version-mismatch");
if (manifest.schema_sha256 !== expectedSchemaSha) validationErrors.push("manifest-schema-sha-mismatch");
if (manifest.corpus_sha256 !== sha256(fs.readFileSync(CASES_PATH))) validationErrors.push("manifest-corpus-sha-mismatch");
if (path.resolve(manifest.output || "") !== inputPath) validationErrors.push("manifest-output-path-mismatch");
if (!Array.isArray(manifest.selected_ids) || manifest.selected_count !== manifest.selected_ids.length) validationErrors.push("manifest-selection-invalid");
if (jsonlErrors.length) validationErrors.push("jsonl-parse-errors");
if (rows.length !== manifest.selected_count) validationErrors.push("jsonl-line-count-does-not-match-manifest");

const audit = runAudit();
if (!audit.valid) validationErrors.push("audit-not-merge-ready");

const duplicateIds = rows
  .map((row) => row.value.id)
  .filter((id, index, all) => id && all.indexOf(id) !== index);
if (duplicateIds.length) validationErrors.push("duplicate-jsonl-ids");

const proposed = structuredClone(currentIntelligence);
const proposedById = new Map(proposed.map((record) => [record.id, record]));
const acceptedChanges = [];
const rejectedRows = [];
let contentEligibleRows = 0;
let evidenceReviewRows = 0;

for (const { line, value: row } of rows) {
  const sourceRecord = casesById.get(row.id);
  const current = currentById.get(row.id);
  if (!sourceRecord || !current) {
    rejectedRows.push({ line, id: row.id || null, errors: [!sourceRecord ? "unknown-corpus-id" : "missing-canonical-intelligence-id"] });
    continue;
  }
  const metadataErrors = reviewMetadataErrors(row, sourceRecord, manifestIds);
  if (metadataErrors.length) {
    rejectedRows.push({ line, id: row.id, errors: metadataErrors });
    continue;
  }
  const rowErrors = candidateEligibilityErrors(row, sourceRecord, manifestIds);
  const change = rowErrors.length
    ? {
      id: current.id,
      slug: current.slug,
      source_access_status: row.intelligence.source_access_status,
      confidence: row.intelligence.confidence,
      manifest: {
        final_url: row.source_manifest?.final_url || null,
        body_sha256: row.source_manifest?.body_sha256 || null,
        extraction_sha256: row.source_manifest?.extraction_sha256 || null,
        extraction_method: row.source_manifest?.extraction_method || null,
        selected_pages: row.source_manifest?.selected_pages || [],
      },
      changed_fields: [],
      publication_change: null,
      before: {
        id: current.id,
        slug: current.slug,
        publication: current.publication,
      },
      after: structuredClone(current),
    }
    : buildCandidateChange(current, row);
  if (rowErrors.length) {
    rejectedRows.push({ line, id: row.id, errors: rowErrors });
  } else {
    contentEligibleRows += 1;
  }
  const evidenceReview = evidenceReviewFrom(row);
  if (JSON.stringify(change.after.evidence_review || null) !== JSON.stringify(evidenceReview)) {
    change.after.evidence_review = evidenceReview;
    change.changed_fields.push("evidence_review");
    evidenceReviewRows += 1;
  }
  // ID and slug are copied only from canonical data; the Kie payload has no
  // authority to rename a route, change a case identity, or mutate source/record fields.
  change.after.id = current.id;
  change.after.slug = current.slug;
  change.after.case_name = current.case_name;
  change.after.source = current.source;
  change.after.record = current.record;
  change.after.classification = current.classification;
  change.after.severity = current.severity;
  proposedById.set(current.id, change.after);
  acceptedChanges.push(change);
}

const proposedOutput = currentIntelligence.map((record) => proposedById.get(record.id));
const immutableViolations = proposedOutput
  .map((record, index) => ({ before: currentIntelligence[index], after: record }))
  .filter(({ before, after }) => before.id !== after.id || before.slug !== after.slug)
  .map(({ before, after }) => ({ before: { id: before.id, slug: before.slug }, after: { id: after.id, slug: after.slug } }));
if (immutableViolations.length) validationErrors.push("immutable-id-or-slug-violation");

// Publication is never modified without a second explicit action. Even with
// that flag, only a full-document, high-confidence, validated candidate can
// upgrade a currently held record; no Kie row can downgrade a ready record.
if (apply && allowPublicationUpgrade) {
  for (const change of acceptedChanges) {
    const beforePublication = change.before.publication || {};
    const candidate = rows.find(({ value }) => value.id === change.id)?.value?.intelligence;
    if (
      beforePublication.ready !== true &&
      candidate?.publication_ready === true &&
      candidate.source_access_status === "full_document" &&
      candidate.confidence === "high"
    ) {
      change.after.publication = {
        ...beforePublication,
        ready: true,
        agent_status: `kie-promoted:${expectedPromptVersion}`,
        blocked_reason: null,
      };
      change.publication_change = "upgraded-to-ready";
      change.changed_fields.push("publication");
    }
  }
}

const changed = acceptedChanges.filter((change) => change.changed_fields.length > 0);
const proposal = {
  promotion_schema_version: PROMOTION_SCHEMA_VERSION,
  generated_at: new Date().toISOString(),
  mode: apply ? "apply" : "dry-run",
  input: inputPath,
  manifest: manifestPath,
  target: targetPath,
  expected_prompt_version: expectedPromptVersion,
  expected_schema_sha256: expectedSchemaSha,
  audit: {
    valid: audit.valid,
    exit_code: audit.exit_code,
    merge_ready: audit.report?.merge_ready ?? false,
    critical_issue_count: audit.report?.critical_issue_count ?? null,
  },
  validation_errors: validationErrors,
  jsonl_parse_errors: jsonlErrors,
  rejected_rows: rejectedRows,
  summary: {
    input_rows: rows.length,
    eligible_rows: contentEligibleRows,
    evidence_review_rows: evidenceReviewRows,
    rejected_rows: rejectedRows.length,
    changed_rows: changed.length,
    changed_fields: changed.reduce((count, change) => count + change.changed_fields.length, 0),
    publication_upgrades: changed.filter((change) => change.publication_change === "upgraded-to-ready").length,
    canonical_records: currentIntelligence.length,
  },
  changes: changed.map(({ after, ...change }) => ({
    ...change,
    proposed_field_values: Object.fromEntries(change.changed_fields.map((field) => [field, after[field]])),
  })),
};

atomicWrite(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`);

if (validationErrors.length) {
  console.error(JSON.stringify({ status: "blocked", proposal: proposalPath, validation_errors: validationErrors, rejected_rows: rejectedRows.length }, null, 2));
  process.exitCode = 1;
} else if (apply) {
  const backupRoot = path.join(ROOT, ".cache", "kie-backups");
  fs.mkdirSync(backupRoot, { recursive: true });
  const backupPath = path.join(
    backupRoot,
    `${path.basename(targetPath)}.kie-backup-${safeStamp()}`,
  );
  fs.copyFileSync(targetPath, backupPath);
  atomicWrite(targetPath, `${JSON.stringify(proposedOutput, null, 2)}\n`);
  console.log(JSON.stringify({ status: "applied", proposal: proposalPath, backup: backupPath, changed_rows: changed.length, publication_upgrades: proposal.summary.publication_upgrades }, null, 2));
} else {
  console.log(JSON.stringify({ status: "dry-run", proposal: proposalPath, eligible_rows: contentEligibleRows, evidence_review_rows: evidenceReviewRows, changed_rows: changed.length, publication_upgrades: 0 }, null, 2));
}
