import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

// Review-only deterministic extraction. It never writes to public case data.
const ROOT = process.cwd();
const V7_PATH = path.join(ROOT, "data", "kie-enrichment", "corpus-v7-final.jsonl");
const CACHE_ROOT = path.join(ROOT, ".cache", "kie-sources");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "local-judge-candidates", "primary-documents-v1.jsonl");
const VERSION = "local-judge-candidates-v1";
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const dryRun = flag("--dry-run");
const replace = flag("--replace");
const outputPath = path.resolve(value("--out", DEFAULT_OUTPUT));

const sha256 = (input) => createHash("sha256").update(input).digest("hex");
const compact = (text) => String(text || "").replace(/\s+/g, " ").trim();
const cleanName = (value) => {
  const cleaned = compact(value)
  .replace(/^(?:THE\s+HONORABLE|HONORABLE|HON\.)\s+/i, "")
  .replace(/\s*,?\s*(?:J\.?|JUDGE|JUSTICE)$/i, "")
  .replace(/[,:;.]$/, "")
  .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    if (words.slice(0, half).join(" ").toLowerCase() === words.slice(half).join(" ").toLowerCase()) return words.slice(0, half).join(" ");
  }
  return cleaned;
};
const toTitle = (name) => name.split(" ").map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`).join(" ");

if (!fs.existsSync(V7_PATH)) throw new Error(`Missing v7 source manifest: ${V7_PATH}`);
if (fs.existsSync(outputPath) && !replace && !dryRun) throw new Error(`Refusing to overwrite ${outputPath}; pass --replace for this generated review artifact.`);

function safeCachePath(relativePath) {
  if (!relativePath) return null;
  const resolved = path.resolve(ROOT, relativePath);
  return resolved.startsWith(`${CACHE_ROOT}${path.sep}`) ? resolved : null;
}

function readRows() {
  return fs.readFileSync(V7_PATH, "utf8").split("\n").filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid v7 JSONL at line ${index + 1}`); }
  });
}

function sourceFor(row) {
  const manifest = row.source_manifest;
  if (row.status !== "accepted" || manifest?.source_authority !== "primary_case_document" || !manifest?.cache_path || !manifest?.extraction_sha256 || !Number.isInteger(manifest?.page_count) || manifest.page_count < 1) return null;
  const cachePath = safeCachePath(manifest.cache_path);
  if (!cachePath || !fs.existsSync(cachePath)) return null;
  const textPath = manifest.extraction_method === "tesseract-eng-120dpi" && fs.existsSync(`${cachePath}.ocr.txt`) ? `${cachePath}.ocr.txt` : `${cachePath}.txt`;
  if (!fs.existsSync(textPath)) return null;
  const rawText = fs.readFileSync(textPath, "utf8");
  if (sha256(rawText) !== manifest.extraction_sha256) return null;
  return { manifest, pages: rawText.split("\f").slice(0, manifest.page_count).map(compact) };
}

function quoteAround(page, index, length) {
  const start = Math.max(0, index - 280);
  const end = Math.min(page.length, index + length + 180);
  return page.slice(start, end).trim();
}

function nameLooksValid(name) {
  const words = cleanName(name).split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 7) return false;
  if (/\b(?:court|district|united|states|judge|justice|magistrate|honorable|attorney|counsel|esq|clerk|plaintiff|defendant|opinion|order|new|jersey|romania|canada|county|the|mr|mrs|ms)\b/i.test(name)) return false;
  return words.every((word) => /^[A-Za-z][A-Za-z.'’-]*$/.test(word) || /^[A-Z]\.$/.test(word));
}

function counselAmbiguity(page, index, length) {
  const context = page.slice(Math.max(0, index - 220), Math.min(page.length, index + length + 220));
  return /\b(?:attorney(?:s)?|counsel|esq\.?|bar no\.?|appeared for|for plaintiff|for defendant|law offices?)\b/i.test(context);
}

function candidate(page, pageNumber, match, nameGroup, roleGroup, confidence, pattern, extraFlags = []) {
  const rawName = match[nameGroup];
  const name = cleanName(rawName);
  if (!nameLooksValid(name)) return null;
  const index = match.index + match[0].indexOf(rawName);
  const flags = [...extraFlags];
  if (counselAmbiguity(page, index, rawName.length)) flags.push("counsel-context");
  if (flags.includes("counsel-context") || flags.includes("outside-header-or-signature-zone")) return { rejected: true, name: toTitle(name), page: pageNumber, reason: flags.includes("counsel-context") ? "counsel-context" : "outside-header-or-signature-zone", pattern };
  return {
    name: toTitle(name),
    role: compact(match[roleGroup] || "judge"),
    locator: `p. ${pageNumber}`,
    quote: quoteAround(page, match.index, match[0].length),
    confidence,
    ambiguity_flags: flags,
    pattern,
  };
}

function directCandidate(page, pageNumber, index, rawName, role, confidence, pattern) {
  const name = cleanName(rawName);
  if (!nameLooksValid(name)) return null;
  if (counselAmbiguity(page, index, rawName.length)) return { rejected: true, name: toTitle(name), page: pageNumber, reason: "counsel-context", pattern };
  return {
    name: toTitle(name),
    role: compact(role),
    locator: `p. ${pageNumber}`,
    quote: quoteAround(page, index, rawName.length + role.length),
    confidence,
    ambiguity_flags: [],
    pattern,
  };
}

function signatureRoleCandidates(page, pageNumber) {
  const accepted = [];
  const rejected = [];
  const roleRe = /(?:Chief\s+)?(?:(?:United States|U\.S\.)\s+)?(?:District|Magistrate|Bankruptcy|Circuit|Appellate|Superior)\s+Judge|United States Judge|Justice\b/g;
  const personalName = /(?:[A-Z][A-Za-z.'’\-]+|[A-Z]{2,})(?:\s+[A-Z]\.)?(?:\s+(?:[A-Z][A-Za-z.'’\-]+|[A-Z]{2,})){1,3}$/;
  for (const match of page.matchAll(roleRe)) {
    const before = page.slice(Math.max(0, match.index - 260), match.index);
    const signatureAt = Math.max(before.lastIndexOf("/s/"), before.lastIndexOf("/S/"), before.lastIndexOf("<<signature>>"));
    if (signatureAt < 0) continue;
    let signatureTail = before.slice(signatureAt + 3).replace(/[,_]+/g, " ").trim();
    signatureTail = signatureTail.replace(/^(?:date|dated|signed|signature)\s*:?[\s-]*/i, "");
    signatureTail = signatureTail.replace(/\bdate\b/ig, " ").replace(/\s+/g, " ").trim();
    const tailWords = signatureTail.split(/\s+/).filter(Boolean);
    if (tailWords.length >= 4 && tailWords.length % 2 === 0) {
      const half = tailWords.length / 2;
      if (tailWords.slice(0, half).join(" ").toLowerCase() === tailWords.slice(half).join(" ").toLowerCase()) {
        signatureTail = tailWords.slice(0, half).join(" ");
      }
    }
    const nameMatch = signatureTail.match(personalName);
    if (!nameMatch) continue;
    const rawName = nameMatch[0];
    const index = match.index - signatureTail.length + nameMatch.index;
    const item = directCandidate(page, pageNumber, index, rawName, match[0], "high", "signature-plus-role");
    if (!item) continue;
    if (item.rejected) rejected.push(item); else accepted.push(item);
  }
  return { accepted, rejected };
}

function extractPage(page, pageNumber) {
  const accepted = [];
  const rejected = [];
  // Strongest: a named person immediately paired with an explicit judicial role.
  const token = "(?:[A-Z][A-Za-z.'’\\-]*|[A-Z]{2,})";
  const person = `(${token}(?:\\s+[A-Z]\\.)?(?:\\s+${token}){1,3})`;
  const role = "((?:(?:United States|U\\.S\\.) )?(?:District|Magistrate|Bankruptcy|Circuit|Appellate|Superior) Judge|United States Judge|Justice)";
  const patterns = [
    { re: new RegExp(`(?:THE\\s+)?HON(?:ORABLE)?\\.?\\s+${person}\\s*,?\\s*${role}`, "gi"), confidence: "medium", kind: "honorific-plus-role" },
    { re: new RegExp(`\\bJudge\\s*:\\s*(?:Honorable|Hon\\.)?\\s*${person}\\b`, "g"), confidence: "medium", kind: "header-judge-label", roleGroup: 0 },
    { re: new RegExp(`\\bBefore\\s*:\\s*(?:Honorable|Hon\\.)?\\s*${person}\\s*,?\\s*(J\\.)\\b`, "g"), confidence: "medium", kind: "before-j" , roleGroup: 2 },
  ];
  for (const spec of patterns) {
    for (const match of page.matchAll(spec.re)) {
      const item = candidate(page, pageNumber, match, 1, spec.roleGroup || 2, spec.confidence, spec.kind);
      if (!item) continue;
      if (item.rejected) rejected.push(item); else accepted.push(item);
    }
  }
  const signatures = signatureRoleCandidates(page, pageNumber);
  return { accepted: [...accepted, ...signatures.accepted], rejected: [...rejected, ...signatures.rejected] };
}

function extract(source) {
  const all = [];
  const rejected = [];
  for (const [index, page] of source.pages.entries()) {
    if (!page) continue;
    const result = extractPage(page, index + 1);
    all.push(...result.accepted);
    rejected.push(...result.rejected);
  }
  const byName = new Map();
  const rank = { high: 3, medium: 2, low: 1 };
  for (const item of all) {
    const existing = byName.get(item.name.toLowerCase());
    if (!existing || rank[item.confidence] > rank[existing.confidence]) byName.set(item.name.toLowerCase(), item);
  }
  const candidates = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { candidates, rejected, ambiguity_flags: [...new Set(rejected.map((item) => item.reason))] };
}

const eligible = readRows().map((row) => ({ row, source: sourceFor(row) })).filter((item) => item.source);
const resultRows = eligible.map(({ row, source }) => {
  const result = extract(source);
  return {
    id: row.id,
    status: result.candidates.length ? "candidate" : result.rejected.length ? "rejected_ambiguous" : "no_candidate",
    extractor_version: VERSION,
    generated_at: new Date().toISOString(),
    source_manifest: { ...source.manifest, cache_verified: true },
    candidates: result.candidates,
    rejected_candidate_count: result.rejected.length,
    ambiguity_flags: result.ambiguity_flags,
    publishable: false,
  };
});
const highConfidence = resultRows.reduce((sum, row) => sum + row.candidates.filter((item) => item.confidence === "high").length, 0);
const summary = {
  extractor_version: VERSION,
  eligible_cached_primary_documents: eligible.length,
  rows_with_candidates: resultRows.filter((row) => row.status === "candidate").length,
  high_confidence_candidates: highConfidence,
  medium_confidence_candidates: resultRows.reduce((sum, row) => sum + row.candidates.filter((item) => item.confidence === "medium").length, 0),
  rejected_ambiguous_rows: resultRows.filter((row) => row.status === "rejected_ambiguous").length,
  rejected_candidate_count: resultRows.reduce((sum, row) => sum + row.rejected_candidate_count, 0),
  output: path.relative(ROOT, outputPath),
  no_auto_publish: true,
};
console.log(JSON.stringify(summary, null, 2));
if (!dryRun) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${resultRows.map((row) => JSON.stringify(row)).join("\n")}\n`);
  fs.writeFileSync(`${outputPath}.manifest.json`, `${JSON.stringify({ ...summary, source_corpus: path.relative(ROOT, V7_PATH), source_corpus_sha256: sha256(fs.readFileSync(V7_PATH)), output_sha256: sha256(fs.readFileSync(outputPath)) }, null, 2)}\n`);
}
