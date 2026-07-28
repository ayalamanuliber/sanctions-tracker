import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/audit-local-judge-candidates.mjs <jsonl>");
const rows = fs.readFileSync(path.resolve(input), "utf8").split("\n").filter(Boolean).map((line, index) => {
  try { return JSON.parse(line); } catch { throw new Error(`Invalid JSONL at line ${index + 1}`); }
});
const ROOT = process.cwd();
const CACHE_ROOT = path.join(ROOT, ".cache", "kie-sources");
const compact = (text) => String(text || "").replace(/\s+/g, " ").trim();
const pageCache = new Map();
function pagesFor(manifest) {
  const cachePath = manifest?.cache_path ? path.resolve(ROOT, manifest.cache_path) : null;
  if (!cachePath || !cachePath.startsWith(`${CACHE_ROOT}${path.sep}`)) return null;
  if (pageCache.has(cachePath)) return pageCache.get(cachePath);
  const textPath = manifest.extraction_method === "tesseract-eng-120dpi" && fs.existsSync(`${cachePath}.ocr.txt`) ? `${cachePath}.ocr.txt` : `${cachePath}.txt`;
  if (!fs.existsSync(textPath)) return null;
  const pages = fs.readFileSync(textPath, "utf8").split("\f").map(compact);
  pageCache.set(cachePath, pages);
  return pages;
}
const issues = [];
let highConfidence = 0;
for (const row of rows) {
  if (row.extractor_version !== "local-judge-candidates-v1") issues.push({ id: row.id, issue: "unexpected-version" });
  if (row.publishable !== false) issues.push({ id: row.id, issue: "must-not-be-publishable" });
  if (!row.source_manifest?.cache_verified || row.source_manifest?.source_authority !== "primary_case_document") issues.push({ id: row.id, issue: "unverified-source" });
  const sourcePages = pagesFor(row.source_manifest);
  if (!sourcePages) issues.push({ id: row.id, issue: "missing-cached-extraction" });
  for (const candidate of row.candidates || []) {
    if (!/^p\. \d+$/.test(candidate.locator || "") || !candidate.quote || candidate.ambiguity_flags?.includes("counsel-context")) issues.push({ id: row.id, issue: "invalid-candidate-evidence", candidate: candidate.name || null });
    const page = Number(String(candidate.locator || "").match(/\d+/)?.[0]);
    if (sourcePages && (!Number.isInteger(page) || !sourcePages[page - 1]?.includes(compact(candidate.quote)))) issues.push({ id: row.id, issue: "quote-not-in-located-page", candidate: candidate.name || null });
    if (candidate.confidence === "high") highConfidence += 1;
  }
}
console.log(JSON.stringify({ input: path.resolve(input), rows: rows.length, high_confidence_candidates: highConfidence, critical_issue_count: issues.length, critical_issues: issues, review_only: true, merge_ready: false }, null, 2));
if (issues.length) process.exitCode = 1;
