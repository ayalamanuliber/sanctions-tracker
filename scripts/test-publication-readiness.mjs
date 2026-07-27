import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assessPublicationReadiness,
  assertPublicationReadinessIndex,
  assertPublicationReadinessReport,
  buildPublicationReadinessIndex,
  buildPublicationReadinessReport,
} from "../lib/publication-readiness.mjs";

const root = resolve(import.meta.dirname, "..");
const cases = JSON.parse(readFileSync(resolve(root, "data/sanctions.json"), "utf8"));
const meta = JSON.parse(readFileSync(resolve(root, "data/meta.json"), "utf8"));
const saved = JSON.parse(readFileSync(resolve(root, "data/publication-readiness.json"), "utf8"));
const savedIndex = JSON.parse(readFileSync(resolve(root, "data/publication-readiness-index.json"), "utf8"));

const complete = {
  id: "complete-case-2026-01-01",
  case_name: "Complete Case",
  date: "2026-01-01",
  court: "Example Court",
  jurisdiction: "federal",
  source_url: "https://example.gov/order.pdf",
  source_name: "Example Court",
  summary: "A".repeat(260),
  outcome: "Sanction imposed",
  hallucination_items: "The court identified a fabricated authority.",
  ai_tool_used: "ChatGPT",
  tags: ["fake-citations"],
  lesson: "Verify sources before filing.",
  reviewed: true,
};

const ready = assessPublicationReadiness(complete);
assert.equal(ready.tier, "index-ready");
assert.equal(ready.score, 100);
assert.equal(ready.missing_fields.length, 0);

const missingSource = assessPublicationReadiness({ ...complete, source_url: "", reviewed: false });
assert.equal(missingSource.tier, "research-only");
assert.ok(missingSource.missing_fields.some((entry) => entry.code === "source-link-missing"));
assert.ok(missingSource.missing_fields.some((entry) => entry.code === "publication-review-pending"));

const thin = assessPublicationReadiness({ ...complete, summary: "Brief note." });
assert.notEqual(thin.tier, "index-ready");
assert.ok(thin.missing_fields.some((entry) => entry.code === "summary-too-brief"));

const generated = buildPublicationReadinessReport(cases, meta);
const generatedIndex = buildPublicationReadinessIndex(cases, meta);
assert.equal(generated.total_cases, cases.length);
assert.equal(generated.total_assessments, cases.length);
assert.equal(generated.records.length, cases.length);
assertPublicationReadinessReport(saved, cases, meta);
assert.deepEqual(saved, generated);
assertPublicationReadinessIndex(savedIndex, cases, meta);
assert.deepEqual(savedIndex, generatedIndex);
assert.equal(Object.keys(savedIndex.by_slug).length, cases.length);
assert.equal(savedIndex.by_slug[ready.slug], undefined, "Fixture data must not leak into the saved corpus index.");
const mata = generated.records.find((record) => record.slug === "mata-v-avianca-inc-2023-06-22");
assert.deepEqual(savedIndex.by_slug[mata.slug], { tier: mata.tier, score: mata.score });
assert.equal(JSON.stringify(savedIndex).includes("score_breakdown"), false);
assert.equal(JSON.stringify(savedIndex).includes("missing_fields"), false);
const nonAscii = generated.records.find((record) => record.id.startsWith("nº-"));
assert.equal(nonAscii?.slug, "no-0600814-8520226000000-2023-04-14");

console.log(JSON.stringify({
  status: "pass",
  fixtures: 3,
  retained_records: generated.records.length,
  compact_index_records: Object.keys(generatedIndex.by_slug).length,
  tiers: generated.tiers,
}, null, 2));
