import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const sanctions = readJson("data/sanctions.json");
const cases = readJson("data/cases.json");
const meta = readJson("data/meta.json");
const rawMeta = readJson("data/meta-raw.json");
const report = readJson("data/update-report.json");

assert(Array.isArray(sanctions), "data/sanctions.json must contain an array");
assert(Array.isArray(cases), "data/cases.json must contain an array");
assert(checksum(sanctions) === checksum(cases), "sanctions.json and cases.json differ");
assert(checksum(meta) === checksum(rawMeta), "meta.json and meta-raw.json differ");

assert(cases.length > 0, "Corpus cannot be empty");
assert(cases.length === meta.total_cases, "meta.total_cases does not match corpus length");
assert(cases.length === report.imported_records, "update report count does not match corpus length");
assert(meta.last_updated === meta.last_checked, "last_updated compatibility field must match last_checked");
assert(isIsoDate(meta.last_checked), "meta.last_checked must be an ISO date");
assert(isIsoDate(meta.latest_record_date), "meta.latest_record_date must be an ISO date");
assert(meta.last_checked <= new Date().toISOString().slice(0, 10), "Corpus check date cannot be in the future");

const ids = new Set();
const matterKeys = new Set();
let previousDate = "9999-12-31";
let sourceLinked = 0;

for (const [index, item] of cases.entries()) {
  assert(item && typeof item === "object", `Record ${index} must be an object`);
  assert(typeof item.id === "string" && item.id.length > 0, `Record ${index} is missing an id`);
  assert(!ids.has(item.id), `Duplicate record id: ${item.id}`);
  ids.add(item.id);

  assert(typeof item.case_name === "string" && item.case_name.trim(), `Record ${item.id} is missing case_name`);
  assert(isIsoDate(item.date), `Record ${item.id} has an invalid date`);
  assert(item.date <= meta.last_checked, `Record ${item.id} is dated after the corpus check`);
  assert(item.date <= previousDate, `Corpus is not sorted newest-first at record ${item.id}`);
  previousDate = item.date;

  const matterKey = `${item.case_name.trim().toLowerCase()}|${item.date}`;
  assert(!matterKeys.has(matterKey), `Duplicate case/date record: ${matterKey}`);
  matterKeys.add(matterKey);

  if (typeof item.source_url === "string" && item.source_url.trim()) {
    sourceLinked += 1;
  }
}

const latestRecordDate = cases[0].date;
const coverage = Number(((sourceLinked / cases.length) * 100).toFixed(1));
const dataChecksum = checksum(cases);

assert(latestRecordDate === meta.latest_record_date, "meta.latest_record_date does not match newest record");
assert(latestRecordDate === report.latest_record_date, "update report latest date does not match corpus");
assert(sourceLinked === meta.source_linked_count, "meta.source_linked_count is inconsistent");
assert(sourceLinked === report.source_linked_count, "update report source count is inconsistent");
assert(coverage === meta.source_link_coverage_pct, "meta source coverage percentage is inconsistent");
assert(coverage >= 80, "Source-link coverage fell below the 80% safety threshold");
assert(dataChecksum === meta.dataset_checksum, "meta dataset checksum is inconsistent");
assert(dataChecksum === report.dataset_checksum, "update report checksum is inconsistent");

console.log(
  `Corpus valid: ${cases.length.toLocaleString()} records, checked ${meta.last_checked}, ` +
    `latest decision ${latestRecordDate}, ${sourceLinked.toLocaleString()} source-linked (${coverage}%).`,
);
