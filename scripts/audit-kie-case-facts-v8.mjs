import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/audit-kie-case-facts-v8.mjs <jsonl>");
const inputPath = path.resolve(input);
const cases = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "cases.json"), "utf8"));
const knownIds = new Set(cases.map((record) => record.id));
const lines = fs.readFileSync(inputPath, "utf8").split("\n").filter(Boolean);
const rows = [];
const parseErrors = [];
for (const [index, line] of lines.entries()) {
  try { rows.push(JSON.parse(line)); } catch (error) { parseErrors.push({ line: index + 1, error: error instanceof Error ? error.message : String(error) }); }
}
const latest = new Map();
for (const row of rows) latest.set(row.id, row);
const statusCounts = {};
const promptVersions = {};
const issues = [];
let promptTokens = 0;
let completionTokens = 0;
for (const row of latest.values()) {
  statusCounts[row.status || "unknown"] = (statusCounts[row.status || "unknown"] || 0) + 1;
  promptVersions[row.prompt_version || "unknown"] = (promptVersions[row.prompt_version || "unknown"] || 0) + 1;
  promptTokens += row.usage?.prompt_tokens || 0;
  completionTokens += row.usage?.completion_tokens || 0;
  if (!knownIds.has(row.id)) issues.push({ id: row.id, issue: "unknown-case-id" });
  if (row.publishable !== false) issues.push({ id: row.id, issue: "must-not-be-publishable" });
  if (row.status !== "accepted") continue;
  if (row.prompt_version !== "case-facts-v8") issues.push({ id: row.id, issue: "unexpected-prompt-version" });
  if (!row.raw_model_response || !row.extracted?.raw || !row.extracted?.normalized) issues.push({ id: row.id, issue: "missing-raw-or-normalized-output" });
  if (!row.source_manifest?.cache_verified || row.source_manifest?.source_authority !== "primary_case_document") issues.push({ id: row.id, issue: "unverified-primary-source" });
  const selectedPages = new Set(row.source_manifest?.selected_pages || []);
  for (const [field, note] of Object.entries(row.extracted?.evidence || {})) {
    const value = row.extracted?.normalized?.[field];
    const present = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
    if (present && !note) issues.push({ id: row.id, issue: "value-without-evidence", field });
    if (!present && note) issues.push({ id: row.id, issue: "evidence-for-null", field });
    if (note) {
      const pages = [...String(note.locator || "").matchAll(/\d+/g)].map((match) => Number(match[0]));
      if (!/^p\. \d+(?:, p\. \d+)*$/.test(note.locator || "") || pages.some((page) => !selectedPages.has(page))) issues.push({ id: row.id, issue: "invalid-evidence-locator", field, locator: note.locator || null });
    }
  }
}
const report = { input: inputPath, lines: lines.length, parsed: rows.length, unique_cases: latest.size, duplicate_lines: rows.length - latest.size, parse_errors: parseErrors, status_counts: statusCounts, prompt_version_counts: promptVersions, usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }, critical_issue_count: issues.length, critical_issues: issues, review_only: true, merge_ready: false };
console.log(JSON.stringify(report, null, 2));
if (parseErrors.length || issues.length || (statusCounts.rejected || 0) || (statusCounts.failed || 0)) process.exitCode = 1;
