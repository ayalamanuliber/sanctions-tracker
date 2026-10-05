import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { publicCorpusRecords, publicIntelligenceRecords, publicCsvRows, sanitizeRecordTree, isBlockedPublicAsset } from "../lib/public-record-controls.mjs";
import { buildPublicationReadinessIndex, buildPublicationReadinessReport } from "../lib/publication-readiness.mjs";

const root = path.resolve(import.meta.dirname, "..");
const read = (name) => JSON.parse(readFileSync(path.join(root, "data", name), "utf8"));
function write(name, value) {
  const file = path.join(root, "data", name);
  const next = JSON.stringify(value, null, 2) + "\n";
  if (readFileSync(file, "utf8") !== next) writeFileSync(file, next);
}
const records = publicCorpusRecords(read("sanctions.json"));
write("sanctions.json", records);
write("cases.json", records);
write("case-intelligence.json", publicIntelligenceRecords(read("case-intelligence.json")));
write("sanctions-raw.json", publicCsvRows(read("sanctions-raw.json")));
const meta = sanitizeRecordTree(read("meta.json"));
const linked = records.filter((item) => item.source_url).length;
meta.dataset_checksum = createHash("sha256").update(JSON.stringify(records)).digest("hex");
meta.source_linked_count = linked;
meta.source_link_coverage_pct = Math.round(linked / records.length * 1000) / 10;
meta.by_tool = records.reduce((counts, item) => { counts[item.ai_tool_used] = (counts[item.ai_tool_used] || 0) + 1; return counts; }, {});
write("meta.json", meta);
write("meta-raw.json", meta);
write("update-report.json", { ...read("update-report.json"), dataset_checksum: meta.dataset_checksum, source_linked_count: linked, source_link_coverage_pct: meta.source_link_coverage_pct });
write("publication-readiness.json", buildPublicationReadinessReport(records, meta));
write("publication-readiness-index.json", buildPublicationReadinessIndex(records, meta));

const managed = new Set(["sanctions.json", "cases.json", "case-intelligence.json", "sanctions-raw.json", "meta.json", "meta-raw.json", "update-report.json", "publication-readiness.json", "publication-readiness-index.json", "public-record-controls.json"]);
function sanitizeStoredDerivatives(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { sanitizeStoredDerivatives(file); continue; }
    if (directory === path.join(root, "data") && managed.has(entry.name)) continue;
    if (!/\.(?:json|jsonl)$/.test(entry.name)) continue;
    const before = readFileSync(file, "utf8");
    const lines = entry.name.endsWith(".jsonl");
    const value = lines ? before.trimEnd().split("\n").filter(Boolean).map((line) => JSON.parse(line)) : JSON.parse(before);
    const after = sanitizeRecordTree(value);
    if (JSON.stringify(value) !== JSON.stringify(after)) writeFileSync(file, lines ? after.map((row) => JSON.stringify(row)).join("\n") + "\n" : JSON.stringify(after, null, 2) + "\n");
  }
}
sanitizeStoredDerivatives(path.join(root, "data"));

function checkAssets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) checkAssets(file);
    else if (isBlockedPublicAsset(path.relative(path.join(root, "public"), file), readFileSync(file))) {
      throw new Error("A controlled identifying asset remains in public output. Preserve it privately and remove it before building.");
    }
  }
}
checkAssets(path.join(root, "public"));
console.log("Public record controls applied; public identifying assets absent.");
