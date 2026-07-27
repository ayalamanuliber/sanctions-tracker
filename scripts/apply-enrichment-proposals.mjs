import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const proposalPath = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!proposalPath) {
  throw new Error("Usage: node scripts/apply-enrichment-proposals.mjs <proposals.json> [--dry-run]");
}

const root = process.cwd();
const corpusPath = path.join(root, "data", "sanctions.json");
const mirrorPath = path.join(root, "data", "cases.json");
const logPath = path.join(root, "data", "publication-enrichment-log.json");
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));
const proposalPayload = JSON.parse(fs.readFileSync(path.resolve(proposalPath), "utf8"));
const proposals = Array.isArray(proposalPayload)
  ? proposalPayload
  : proposalPayload.records;
if (!Array.isArray(proposals)) {
  throw new Error("Proposal file must be an array or contain a records array.");
}
const existingLog = fs.existsSync(logPath)
  ? JSON.parse(fs.readFileSync(logPath, "utf8"))
  : [];
const byId = new Map(corpus.map((record) => [record.id, record]));
const applied = [];
const skipped = [];

for (const proposal of proposals) {
  const record = byId.get(proposal.id);
  if (!record) {
    skipped.push({ id: proposal.id, reason: "record-not-found" });
    continue;
  }
  if (proposal.skipped_reason) {
    skipped.push({ id: proposal.id, reason: proposal.skipped_reason });
    continue;
  }

  const changes = {};
  if (proposal.proposed_summary) {
    if (proposal.proposed_summary.length < 120) {
      throw new Error(`Summary for ${proposal.id} is shorter than 120 characters.`);
    }
    changes.summary = proposal.proposed_summary.trim();
  }
  if (proposal.proposed_court) changes.court = proposal.proposed_court.trim();
  if (proposal.proposed_source_url) {
    const sourceUrl = new URL(proposal.proposed_source_url);
    if (!["http:", "https:"].includes(sourceUrl.protocol)) {
      throw new Error(`Unsupported source URL protocol for ${proposal.id}.`);
    }
    changes.source_url = sourceUrl.toString();
  }
  if (proposal.proposed_source_name) {
    changes.source_name = proposal.proposed_source_name.trim();
  }
  if (!Object.keys(changes).length) {
    skipped.push({ id: proposal.id, reason: "no-proposed-fields" });
    continue;
  }

  Object.assign(record, changes);
  applied.push({
    id: proposal.id,
    fields: Object.keys(changes),
    evidence_url: proposal.evidence_url || record.source_url || "",
    evidence_note: proposal.evidence_note || "",
    applied_at: new Date().toISOString(),
  });
}

if (!dryRun) {
  const serializedCorpus = `${JSON.stringify(corpus, null, 2)}\n`;
  fs.writeFileSync(corpusPath, serializedCorpus);
  fs.writeFileSync(mirrorPath, serializedCorpus);
  const datasetChecksum = createHash("sha256")
    .update(JSON.stringify(corpus))
    .digest("hex");
  const sourceLinkedCount = corpus.filter((record) =>
    typeof record.source_url === "string" && record.source_url.trim(),
  ).length;
  const sourceCoverage = Number(((sourceLinkedCount / corpus.length) * 100).toFixed(1));
  for (const relativePath of ["data/meta.json", "data/meta-raw.json"]) {
    const metadataPath = path.join(root, relativePath);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    metadata.dataset_checksum = datasetChecksum;
    metadata.source_linked_count = sourceLinkedCount;
    metadata.source_link_coverage_pct = sourceCoverage;
    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  }
  const reportPath = path.join(root, "data", "update-report.json");
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  report.dataset_checksum = datasetChecksum;
  report.source_linked_count = sourceLinkedCount;
  report.source_link_coverage_pct = sourceCoverage;
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const superseded = new Set(applied.map((entry) => entry.id));
  const nextLog = [
    ...existingLog.filter((entry) => !superseded.has(entry.id)),
    ...applied,
  ].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(logPath, `${JSON.stringify(nextLog, null, 2)}\n`);
}

console.log(JSON.stringify({
  status: dryRun ? "dry-run" : "applied",
  proposal_file: path.resolve(proposalPath),
  applied: applied.length,
  skipped,
}, null, 2));
