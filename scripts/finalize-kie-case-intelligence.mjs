import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "data", "cases.json");
const args = process.argv.slice(2);
const value = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const inputPaths = (value("--inputs", "") || "")
  .split(",")
  .map((item) => path.resolve(item.trim()))
  .filter(Boolean);
const outputPath = path.resolve(value("--out", "data/kie-enrichment/corpus-v7-final.jsonl"));

if (!inputPaths.length) {
  throw new Error("Usage: node scripts/finalize-kie-case-intelligence.mjs --inputs <run1.jsonl,run2.jsonl> [--out <final.jsonl>]");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function atomicWrite(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  fs.writeFileSync(temporary, value);
  fs.renameSync(temporary, filePath);
}

function downgradeUnlocatedEvidence(row) {
  const output = structuredClone(row);
  if (output.intelligence?.source_access_status !== "full_document") return output;
  const selectedPages = new Set(output.source_manifest?.selected_pages || []);
  let degraded = false;
  output.intelligence.evidence_notes = (output.intelligence.evidence_notes || []).map((note) => {
    const validShape = /^p\.\s*\d+(?:\s*[-,]\s*\d+)*$/i.test(note.locator || "");
    const citedPages = validShape
      ? [...note.locator.matchAll(/\d+/g)].map((match) => Number(match[0]))
      : [];
    if (validShape && citedPages.every((page) => selectedPages.has(page))) return note;
    degraded = true;
    return { ...note, locator: "structured record" };
  });
  if (degraded) {
    output.intelligence.publication_ready = false;
    if (output.intelligence.confidence === "high") output.intelligence.confidence = "medium";
    output.intelligence.uncertainties = [...new Set([
      ...(output.intelligence.uncertainties || []),
      "One or more evidence locators could not be reconciled to the page-labelled excerpt used for enrichment; those facts remain limited to the structured corpus baseline.",
    ])].slice(0, 10);
  }
  return output;
}

const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
const caseIds = cases.map((record) => record.id);
const corpusSha = sha256(fs.readFileSync(CASES_PATH));
const latestById = new Map();
const manifests = [];
const parseErrors = [];

for (const inputPath of inputPaths) {
  if (!fs.existsSync(inputPath)) throw new Error(`Input not found: ${inputPath}`);
  const manifestPath = `${inputPath}.manifest.json`;
  if (!fs.existsSync(manifestPath)) throw new Error(`Manifest not found: ${manifestPath}`);
  manifests.push(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  for (const [index, line] of fs.readFileSync(inputPath, "utf8").split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      latestById.set(row.id, row);
    } catch (error) {
      parseErrors.push({
        input: inputPath,
        line: index + 1,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

const promptVersions = new Set(manifests.map((manifest) => manifest.prompt_version));
const schemaHashes = new Set(manifests.map((manifest) => manifest.schema_sha256));
const corpusHashes = new Set(manifests.map((manifest) => manifest.corpus_sha256));
const missingIds = caseIds.filter((id) => !latestById.has(id));
const nonAccepted = caseIds
  .map((id) => latestById.get(id))
  .filter((row) => row && row.status !== "accepted")
  .map((row) => ({ id: row.id, status: row.status, errors: row.validation_errors || [row.error].filter(Boolean) }));
const unknownIds = [...latestById.keys()].filter((id) => !caseIds.includes(id));
const blockers = [];

if (parseErrors.length) blockers.push("jsonl-parse-errors");
if (promptVersions.size !== 1) blockers.push("mixed-prompt-versions");
if (schemaHashes.size !== 1) blockers.push("mixed-schema-hashes");
if (corpusHashes.size !== 1 || !corpusHashes.has(corpusSha)) blockers.push("corpus-hash-mismatch");
if (missingIds.length) blockers.push("missing-case-ids");
if (nonAccepted.length) blockers.push("non-accepted-latest-rows");
if (unknownIds.length) blockers.push("unknown-case-ids");

const report = {
  inputs: inputPaths,
  output: outputPath,
  total_cases: caseIds.length,
  latest_rows: latestById.size,
  missing_count: missingIds.length,
  non_accepted_count: nonAccepted.length,
  unknown_count: unknownIds.length,
  parse_error_count: parseErrors.length,
  blockers,
  missing_ids: missingIds,
  non_accepted: nonAccepted,
  unknown_ids: unknownIds,
  parse_errors: parseErrors,
};

if (blockers.length) {
  console.error(JSON.stringify({ status: "blocked", ...report }, null, 2));
  process.exitCode = 1;
} else {
  const rows = caseIds.map((id) => downgradeUnlocatedEvidence(latestById.get(id)));
  atomicWrite(outputPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
  const firstManifest = manifests[0];
  const lastManifest = manifests[manifests.length - 1];
  const usage = rows.reduce((totals, row) => ({
    prompt_tokens: totals.prompt_tokens + (row.usage?.prompt_tokens || 0),
    completion_tokens: totals.completion_tokens + (row.usage?.completion_tokens || 0),
  }), { prompt_tokens: 0, completion_tokens: 0 });
  const finalManifest = {
    prompt_version: [...promptVersions][0],
    schema_sha256: [...schemaHashes][0],
    corpus_sha256: corpusSha,
    output: outputPath,
    selected_count: caseIds.length,
    selected_ids: caseIds,
    concurrency: null,
    max_credit_spend: manifests.reduce((sum, manifest) => sum + (manifest.max_credit_spend || 0), 0),
    credit_reserve_per_call: null,
    started_at: firstManifest.started_at,
    completed_at: lastManifest.completed_at,
    starting_credits: firstManifest.starting_credits,
    ending_credits: lastManifest.ending_credits,
    accepted: caseIds.length,
    rejected: 0,
    failures: 0,
    source_runs: inputPaths,
    usage,
  };
  atomicWrite(`${outputPath}.manifest.json`, `${JSON.stringify(finalManifest, null, 2)}\n`);
  console.log(JSON.stringify({ status: "finalized", ...report, usage }, null, 2));
}
