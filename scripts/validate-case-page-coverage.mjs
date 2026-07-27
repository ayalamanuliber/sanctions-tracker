import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "cases.json"), "utf8"));
const intelligence = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "case-intelligence.json"), "utf8"),
);
const readiness = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "publication-readiness-index.json"), "utf8"),
);
const failures = [];
const ids = new Set();
const slugs = new Set();

for (const record of intelligence) {
  if (!record.id || ids.has(record.id)) failures.push(`duplicate or missing intelligence id: ${record.id || "(missing)"}`);
  if (!record.slug || slugs.has(record.slug)) failures.push(`duplicate or missing intelligence slug: ${record.slug || "(missing)"}`);
  ids.add(record.id);
  slugs.add(record.slug);
  if ((record.summary || "").trim().length < 120) failures.push(`${record.id}: summary shorter than 120 characters`);
  if (!(record.why_it_matters || "").trim()) failures.push(`${record.id}: missing why_it_matters`);
  if (!(record.evidence_boundary || "").trim()) failures.push(`${record.id}: missing evidence_boundary`);
  if (!Array.isArray(record.practical_implications) || !record.practical_implications.length) {
    failures.push(`${record.id}: missing practical_implications`);
  }
}

const caseIds = new Set(cases.map((record) => record.id));
for (const record of cases) {
  if (!ids.has(record.id)) failures.push(`${record.id}: missing intelligence contract`);
}
for (const id of ids) {
  if (!caseIds.has(id)) failures.push(`${id}: stale intelligence contract`);
}
for (const slug of Object.keys(readiness.by_slug || {})) {
  if (!slugs.has(slug)) failures.push(`${slug}: readiness page has no intelligence contract`);
}
for (const file of [
  "app/cases/[slug]/page.tsx",
  "app/cases/[slug]/brief/page.tsx",
  "app/cases/[slug]/opengraph-image.tsx",
]) {
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`missing shared case surface: ${file}`);
}

if (
  cases.length !== intelligence.length ||
  cases.length !== readiness.total_cases ||
  Object.keys(readiness.by_slug || {}).length !== cases.length
) {
  failures.push(
    `coverage mismatch: cases=${cases.length}, intelligence=${intelligence.length}, readiness=${readiness.total_cases}, slugs=${Object.keys(readiness.by_slug || {}).length}`,
  );
}

if (failures.length) {
  console.error(failures.slice(0, 100).join("\n"));
  console.error(`Case-page coverage failed with ${failures.length} issue(s).`);
  process.exit(1);
}

const reviewed = intelligence.filter((record) => record.evidence_review).length;
const baseline = intelligence.filter(
  (record) => record.publication?.agent_status === "structured-record-baseline",
).length;
console.log(JSON.stringify({
  status: "pass",
  base_pages: cases.length,
  case_briefs: cases.length,
  intelligence_contracts: intelligence.length,
  source_reviewed: reviewed,
  structured_baseline: baseline,
}, null, 2));
