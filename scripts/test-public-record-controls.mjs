import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { ANONYMOUS_RECORD_ID, anonymousRecord, anonymousIntelligence, publicCorpusRecords, publicIntelligenceRecords, publicCsvRows, isControlledRecord, isRetiredRequest, isBlockedPublicAsset } from "../lib/public-record-controls.mjs";

const root = path.resolve(import.meta.dirname, "..");
const read = (name) => JSON.parse(readFileSync(path.join(root, "data", name), "utf8"));
const records = read("sanctions.json");
const controlled = records.filter(isControlledRecord);
assert.equal(controlled.length, 1, "Exactly one anonymous controlled record must remain");
assert.deepEqual(controlled[0], anonymousRecord());
assert.deepEqual(read("case-intelligence.json").find((row) => row.id === ANONYMOUS_RECORD_ID), anonymousIntelligence());
assert.deepEqual(publicCorpusRecords(publicCorpusRecords(records)), records, "Control replay is idempotent");
const unrelated = records.filter((row) => !isControlledRecord(row));
assert.deepEqual(publicCorpusRecords(unrelated), unrelated, "Other cases remain intact");
assert.equal(controlled[0].source_url, "");
assert.equal(anonymousIntelligence().ai_attribution_status, "unspecified");
assert.equal(read("publication-readiness-index.json").by_slug[ANONYMOUS_RECORD_ID].tier, "research-only");
assert.equal(isRetiredRequest(`/cases/${ANONYMOUS_RECORD_ID}`), false);
function checkAssets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) checkAssets(file);
    else assert.equal(isBlockedPublicAsset(path.relative(path.join(root, "public"), file), readFileSync(file)), false, "Identifying public asset blocked");
  }
}
checkAssets(path.join(root, "public"));
const fixture = process.argv.indexOf("--fixture");
if (fixture >= 0) {
  const originals = JSON.parse(readFileSync(process.argv[fixture + 1], "utf8"));
  const found = originals.filter(isControlledRecord);
  assert.equal(found.length, 1, "Private original fixture must resolve exactly one record");
  assert.deepEqual(publicCorpusRecords(found), [anonymousRecord()]);
  assert.deepEqual(publicIntelligenceRecords(found), [anonymousIntelligence()]);
  assert.equal(isRetiredRequest(`/cases/${found[0].id}`), true);
  assert.equal(isRetiredRequest(`/cases/${found[0].id}/brief`), true);
  assert.equal(isRetiredRequest(`/cases/${found[0].id}/opengraph-image`), true);
  assert.equal(isRetiredRequest(`/api/artifact?format=pdf&case_id=${encodeURIComponent(found[0].id)}`), true);
  assert.equal(isRetiredRequest(found[0].source_url), true);
  assert.deepEqual(publicCorpusRecords(originals.filter((row) => !isControlledRecord(row))), originals.filter((row) => !isControlledRecord(row)));
}
const csvFixture = process.argv.indexOf("--csv-fixture");
if (csvFixture >= 0) {
  const rows = JSON.parse(readFileSync(process.argv[csvFixture + 1], "utf8"));
  assert.equal(rows.filter(isControlledRecord).length, 1);
  const sanitized = publicCsvRows(rows);
  assert.equal(sanitized[0].Source, "");
  assert.equal(sanitized[0].Pointer, "");
  assert.equal(sanitized[0].Details, "");
}
console.log(`Public record controls pass: ${records.length} cases, one anonymous record, idempotent controls, preserved unrelated cases and blocked legacy derivatives.`);
