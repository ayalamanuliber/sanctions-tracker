import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertPublicationReadinessReport,
  assertPublicationReadinessIndex,
  buildPublicationReadinessIndex,
  buildPublicationReadinessReport,
} from "../lib/publication-readiness.mjs";

const root = resolve(import.meta.dirname, "..");
const reportPath = resolve(root, "data/publication-readiness.json");
const indexPath = resolve(root, "data/publication-readiness-index.json");

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

const records = readJson("data/sanctions.json");
const metadata = readJson("data/meta.json");
const report = buildPublicationReadinessReport(records, metadata);
const index = buildPublicationReadinessIndex(records, metadata);
const shouldWrite = process.argv.includes("--write");

function atomicWriteJson(target, value) {
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
    JSON.parse(readFileSync(temporary, "utf8"));
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
}

if (shouldWrite) {
  atomicWriteJson(reportPath, report);
  atomicWriteJson(indexPath, index);
  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${indexPath}`);
} else {
  const savedReport = JSON.parse(readFileSync(reportPath, "utf8"));
  const savedIndex = JSON.parse(readFileSync(indexPath, "utf8"));
  assertPublicationReadinessReport(savedReport, records, metadata);
  assertPublicationReadinessIndex(savedIndex, records, metadata);
}

console.log(JSON.stringify({
  status: "pass",
  total_cases: report.total_cases,
  tiers: report.tiers,
  compact_index_records: Object.keys(index.by_slug).length,
  issue_counts: report.issue_counts,
}, null, 2));
