import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";

// Deliberately separate from the publishable case-intelligence corpus. This script
// only creates an evidence-review artifact; no app data is read or written back.
const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "data", "cases.json");
const V7_PATH = path.join(ROOT, "data", "kie-enrichment", "corpus-v7-final.jsonl");
const CACHE_ROOT = path.join(ROOT, ".cache", "kie-sources");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "kie-enrichment-v8", "primary-source-pilot-50.jsonl");
const API_URL = "https://api.kie.ai/gemini-2.5-flash/v1/chat/completions";
const CREDIT_URL = "https://api.kie.ai/api/v1/chat/credit";
const PROMPT_VERSION = "case-facts-v8";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const dryRun = flag("--dry-run");
const allowPilot50 = flag("--allow-50-pilot");
const limit = Number(value("--limit", "5"));
const concurrency = Number(value("--concurrency", "1"));
const maxCreditSpend = Number(value("--max-credit-spend", "20"));
const creditReservePerCall = Number(value("--credit-reserve-per-call", "0.4"));
const outputPath = path.resolve(value("--out", DEFAULT_OUTPUT));
const requestedIds = (value("--ids", "") || "").split(",").map((id) => id.trim()).filter(Boolean);

if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("--limit must be an integer from 1 to 50.");
if (limit > 25 && !allowPilot50) throw new Error("Refusing a 26-50 case run without --allow-50-pilot.");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 2) throw new Error("--concurrency must be 1 or 2.");
if (!Number.isFinite(maxCreditSpend) || maxCreditSpend <= 0) throw new Error("--max-credit-spend must be greater than zero.");
if (!Number.isFinite(creditReservePerCall) || creditReservePerCall <= 0) throw new Error("--credit-reserve-per-call must be greater than zero.");
if (!dryRun && !process.env.KIE_API_KEY) throw new Error("KIE_API_KEY is required for live extraction.");

const sha256 = (input) => createHash("sha256").update(input).digest("hex");
const compact = (text) => String(text || "").replace(/\s+/g, " ").trim();
const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
const casesById = new Map(cases.map((record) => [record.id, record]));

function readJsonl(file) {
  return fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid JSONL at ${file}:${index + 1}`); }
  });
}

if (!fs.existsSync(V7_PATH)) throw new Error(`Missing source manifest corpus: ${V7_PATH}`);
const v7Rows = readJsonl(V7_PATH);

function safeCachePath(relativePath) {
  if (!relativePath) return null;
  const resolved = path.resolve(ROOT, relativePath);
  return resolved.startsWith(`${CACHE_ROOT}${path.sep}`) ? resolved : null;
}

function cachedSource(row) {
  const manifest = row.source_manifest;
  if (
    row.status !== "accepted" ||
    manifest?.source_authority !== "primary_case_document" ||
    !manifest?.cache_path ||
    !manifest?.extraction_sha256 ||
    !Number.isInteger(manifest?.page_count) ||
    manifest.page_count < 1
  ) return null;
  const cachePath = safeCachePath(manifest.cache_path);
  if (!cachePath || !fs.existsSync(cachePath)) return null;
  const textPath = manifest.extraction_method === "tesseract-eng-120dpi" && fs.existsSync(`${cachePath}.ocr.txt`)
    ? `${cachePath}.ocr.txt`
    : `${cachePath}.txt`;
  if (!fs.existsSync(textPath)) return null;
  const rawText = fs.readFileSync(textPath, "utf8");
  if (sha256(rawText) !== manifest.extraction_sha256) return null;
  const pages = rawText.split("\f").map((page) => compact(page)).slice(0, manifest.page_count);
  if (pages.filter(Boolean).length < 1) return null;
  return { manifest, cachePath, textPath, rawText, pages };
}

function sourceExcerpt(source) {
  const sourcePages = new Set([1, 2, ...(source.manifest.selected_pages || [])]);
  const selectedPages = [...sourcePages]
    .filter((page) => Number.isInteger(page) && page >= 1 && page <= source.pages.length)
    .sort((a, b) => a - b)
    .slice(0, 10);
  let excerpt = "";
  for (const page of selectedPages) {
    const addition = `[PAGE ${page}]\n${source.pages[page - 1].slice(0, 5_000)}\n`;
    if (excerpt.length + addition.length > 40_000) break;
    excerpt += addition;
  }
  return { excerpt: excerpt.trim(), selectedPages };
}

function deficitScore(record) {
  const facts = record?.row?.intelligence || {};
  let score = 0;
  if (!record?.case?.judge && !facts.judge) score += 20;
  if (!facts.procedural_posture) score += 6;
  if (!facts.recorded_tool) score += 4;
  if (!facts.monetary_consequence?.known) score += 3;
  if (facts.evidence_review?.confidence !== "high") score += 2;
  return score;
}

const candidates = v7Rows
  .map((row) => ({ row, case: casesById.get(row.id), source: cachedSource(row) }))
  .filter((candidate) => candidate.case && candidate.source)
  .sort((a, b) => deficitScore(b) - deficitScore(a) || String(a.case.date).localeCompare(String(b.case.date)) || a.case.id.localeCompare(b.case.id));
const candidatesById = new Map(candidates.map((candidate) => [candidate.case.id, candidate]));

function selectCandidates() {
  if (requestedIds.length) {
    const missing = requestedIds.filter((id) => !candidatesById.has(id));
    if (missing.length) throw new Error(`Requested ids are not cache-verified primary documents: ${missing.join(", ")}`);
    return requestedIds.slice(0, limit).map((id) => candidatesById.get(id));
  }
  return candidates.slice(0, limit);
}

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const nullableArray = (items) => ({ anyOf: [{ type: "array", items }, { type: "null" }] });
const fieldEvidenceSchema = {
  anyOf: [{ type: "null" }, {
    type: "object", additionalProperties: false,
    required: ["locator", "quote", "confidence", "uncertainty"],
    properties: {
      locator: { type: "string", pattern: "^p\\. [0-9]+(?:, p\\. [0-9]+)*$" },
      quote: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      uncertainty: nullableString,
    },
  }],
};
const modelSchema = {
  type: "object", additionalProperties: false,
  required: ["raw", "normalized", "evidence", "uncertainties"],
  properties: {
    raw: {
      type: "object", additionalProperties: false,
      required: ["judge_names", "docket_numbers", "document_title", "document_type", "issuing_body", "procedural_status", "epistemic_status", "tool_entities", "consequence", "monetary_amount"],
      properties: {
        judge_names: nullableArray({ type: "string" }), docket_numbers: nullableArray({ type: "string" }),
        document_title: nullableString, document_type: nullableString, issuing_body: nullableString,
        procedural_status: nullableString, epistemic_status: nullableString,
        tool_entities: nullableArray({ type: "string" }), consequence: nullableString, monetary_amount: nullableString,
      },
    },
    normalized: {
      type: "object", additionalProperties: false,
      required: ["judge_names", "docket_numbers", "document_title", "document_type", "issuing_body", "procedural_status", "epistemic_status", "tool_entities", "consequence", "monetary_amount"],
      properties: {
        judge_names: nullableArray({ type: "string" }), docket_numbers: nullableArray({ type: "string" }),
        document_title: nullableString,
        document_type: { anyOf: [{ type: "string", enum: ["order", "opinion", "memorandum", "report_and_recommendation", "disciplinary_decision", "filing", "other"] }, { type: "null" }] },
        issuing_body: nullableString,
        procedural_status: { anyOf: [{ type: "string", enum: ["final_or_adjudicated", "interlocutory_or_procedural", "pending_or_unresolved", "filing_or_allegation"] }, { type: "null" }] },
        epistemic_status: { anyOf: [{ type: "string", enum: ["expressly_stated_in_primary_document", "primary_document_not_determinative"] }, { type: "null" }] },
        tool_entities: nullableArray({ type: "object", additionalProperties: false, required: ["name", "entity_type"], properties: { name: { type: "string" }, entity_type: { type: "string", enum: ["named_product_or_model", "generic_ai_reference", "other_named_tool"] } } }),
        consequence: { anyOf: [{ type: "object", additionalProperties: false, required: ["status", "detail"], properties: { status: { type: "string", enum: ["monetary", "non_monetary", "mixed", "none_or_not_ordered"] }, detail: nullableString } }, { type: "null" }] },
        monetary_amount: { anyOf: [{ type: "object", additionalProperties: false, required: ["amount", "currency", "raw_descriptor"], properties: { amount: { anyOf: [{ type: "number" }, { type: "null" }] }, currency: { anyOf: [{ type: "string", enum: ["USD", "CAD", "GBP", "EUR", "AUD", "BRL", "MXN", "OTHER"] }, { type: "null" }] }, raw_descriptor: nullableString } }, { type: "null" }] },
      },
    },
    evidence: {
      type: "object", additionalProperties: false,
      required: ["judge_names", "docket_numbers", "document_title", "document_type", "issuing_body", "procedural_status", "epistemic_status", "tool_entities", "consequence", "monetary_amount"],
      properties: Object.fromEntries(["judge_names", "docket_numbers", "document_title", "document_type", "issuing_body", "procedural_status", "epistemic_status", "tool_entities", "consequence", "monetary_amount"].map((field) => [field, fieldEvidenceSchema])),
    },
    uncertainties: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
};

const evidence = z.object({ locator: z.string().regex(/^p\. \d+(?:, p\. \d+)*$/), quote: z.string().min(8).max(500), confidence: z.enum(["high", "medium", "low"]), uncertainty: z.string().max(400).nullable() }).strict().nullable();
const nullableStrings = z.array(z.string().min(1).max(220)).min(1).max(12).nullable();
const factsSchema = z.object({
  raw: z.object({ judge_names: nullableStrings, docket_numbers: nullableStrings, document_title: z.string().min(1).max(500).nullable(), document_type: z.string().min(1).max(100).nullable(), issuing_body: z.string().min(1).max(500).nullable(), procedural_status: z.string().min(1).max(500).nullable(), epistemic_status: z.string().min(1).max(250).nullable(), tool_entities: nullableStrings, consequence: z.string().min(1).max(700).nullable(), monetary_amount: z.string().min(1).max(250).nullable() }).strict(),
  normalized: z.object({
    judge_names: nullableStrings, docket_numbers: nullableStrings, document_title: z.string().min(1).max(500).nullable(),
    document_type: z.enum(["order", "opinion", "memorandum", "report_and_recommendation", "disciplinary_decision", "filing", "other"]).nullable(),
    issuing_body: z.string().min(1).max(500).nullable(), procedural_status: z.enum(["final_or_adjudicated", "interlocutory_or_procedural", "pending_or_unresolved", "filing_or_allegation"]).nullable(), epistemic_status: z.enum(["expressly_stated_in_primary_document", "primary_document_not_determinative"]).nullable(),
    tool_entities: z.array(z.object({ name: z.string().min(1).max(200), entity_type: z.enum(["named_product_or_model", "generic_ai_reference", "other_named_tool"]) }).strict()).min(1).max(12).nullable(),
    consequence: z.object({ status: z.enum(["monetary", "non_monetary", "mixed", "none_or_not_ordered"]), detail: z.string().min(1).max(700).nullable() }).strict().nullable(),
    monetary_amount: z.object({ amount: z.number().nonnegative().nullable(), currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD", "BRL", "MXN", "OTHER"]).nullable(), raw_descriptor: z.string().min(1).max(250).nullable() }).strict().nullable(),
  }).strict(),
  evidence: z.object(Object.fromEntries(["judge_names", "docket_numbers", "document_title", "document_type", "issuing_body", "procedural_status", "epistemic_status", "tool_entities", "consequence", "monetary_amount"].map((field) => [field, evidence]))).strict(),
  uncertainties: z.array(z.string().min(1).max(400)).max(8),
}).strict();

const factualFields = ["judge_names", "docket_numbers", "document_title", "document_type", "issuing_body", "procedural_status", "epistemic_status", "tool_entities", "consequence", "monetary_amount"];
function hasValue(value) { return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined; }
function pageNumbers(locator) { return [...locator.matchAll(/\d+/g)].map((match) => Number(match[0])); }

function validateFacts(result, source, selectedPages) {
  const parsed = factsSchema.safeParse(result);
  if (!parsed.success) return parsed.error.issues.map((issue) => `schema:${issue.path.join(".")}:${issue.message}`);
  const errors = [];
  for (const field of factualFields) {
    const value = result.normalized[field];
    const note = result.evidence[field];
    if (hasValue(value) && !note) errors.push(`${field}:value-without-evidence`);
    if (!hasValue(value) && note) errors.push(`${field}:evidence-for-null-value`);
    if (!note) continue;
    const pages = pageNumbers(note.locator);
    if (pages.some((page) => !selectedPages.includes(page))) errors.push(`${field}:locator-outside-excerpt`);
    const text = pages.map((page) => source.pages[page - 1] || "").join(" ").toLowerCase();
    if (!text.includes(compact(note.quote).toLowerCase())) errors.push(`${field}:quote-not-found`);
  }
  const monetary = result.normalized.monetary_amount;
  if (monetary && monetary.amount !== null && !monetary.raw_descriptor) errors.push("monetary_amount:number-without-raw-descriptor");
  if (monetary && monetary.amount === null && monetary.currency !== null) errors.push("monetary_amount:currency-without-number");
  return errors;
}

function promptFor(candidate, excerpt) {
  return [
    "Extract structured facts from the supplied primary legal document only. Return only JSON matching the response schema.",
    "Never infer. If a fact is not explicitly stated in the supplied pages, return null for raw and normalized value and null evidence. Do not use the existing tracker record to fill a gap.",
    "A person named in a signature/header is a judge only when the document expressly identifies that person as the issuing judge, justice, magistrate, or decision-maker.",
    "Docket/case numbers must be copied from the document caption/header. Quotes must be exact, short quotations from the supplied page and locator must use its [PAGE N] marker.",
    "Document type and procedural status must be based on document text; do not treat a filing allegation as an adjudicated finding. Epistemic status is expressly_stated_in_primary_document only when the relevant document expressly states the normalized fact; otherwise use primary_document_not_determinative only when an explicit document statement says it cannot decide the point. Otherwise null.",
    "For money, normalize only a concrete numeral and currency explicitly stated in the document. Unit-based or non-currency sanctions (e.g. minimum wage or UTM) must have null amount/currency and retain the exact raw descriptor. Tool names must be explicitly named; generic AI references are allowed only as generic_ai_reference.",
    "The artifact is for human evidence review only. It is not publication-ready and must not make legal conclusions.",
    `CASE ID: ${candidate.case.id}`,
    `PRIMARY SOURCE URL: ${candidate.row.source_manifest.final_url || candidate.case.source_url}`,
    `SUPPLIED DOCUMENT PAGES:\n${excerpt}`,
  ].join("\n\n");
}

async function getCredits() {
  const response = await fetch(CREDIT_URL, { headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` }, signal: AbortSignal.timeout(15_000) });
  const payload = await response.json();
  if (!response.ok || payload.code !== 200 || typeof payload.data !== "number") throw new Error(`Unable to read Kie credits (${response.status}).`);
  return payload.data;
}

async function complete(candidate, excerpt) {
  const body = { messages: [{ role: "user", content: [{ type: "text", text: promptFor(candidate, excerpt) }] }], stream: false, include_thoughts: false, temperature: 0, response_format: { type: "json_schema", json_schema: { name: "case_facts_v8", strict: true, schema: modelSchema } } };
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(API_URL, { method: "POST", headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
      const payload = await response.json();
      if (!response.ok) throw new Error(`Kie request failed (${response.status}): ${JSON.stringify(payload).slice(0, 500)}`);
      const rawContent = payload.choices?.[0]?.message?.content;
      if (!rawContent) {
        const diagnostic = JSON.stringify(payload, (key, value) =>
          /key|token|authorization/i.test(key) ? "[redacted]" : value
        ).slice(0, 1_000);
        throw new Error(`Kie returned no completion content: ${diagnostic}`);
      }
      return { rawContent: typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent), result: typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent, usage: payload.usage || null, model: payload.model || "gemini-2.5-flash", attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1_000 * (2 ** (attempt - 1))));
    }
  }
  throw lastError || new Error("Kie request failed after retries.");
}

function append(row) { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.appendFileSync(outputPath, `${JSON.stringify(row)}\n`); }
function priorAccepted() {
  if (!fs.existsSync(outputPath)) return new Set();
  const accepted = new Set();
  for (const line of fs.readFileSync(outputPath, "utf8").split("\n")) {
    try { const row = JSON.parse(line); if (row.status === "accepted" && row.prompt_version === PROMPT_VERSION) accepted.add(row.id); } catch { /* audit reports malformed lines */ }
  }
  return accepted;
}

const selected = selectCandidates();
const selectedWithSource = selected.map((candidate) => ({ candidate, ...sourceExcerpt(candidate.source) }));
const cacheErrors = selectedWithSource.filter((item) => item.excerpt.length < 300 || item.selectedPages.length < 1).map((item) => item.candidate.case.id);
if (cacheErrors.length) throw new Error(`Insufficient cached extraction for: ${cacheErrors.join(", ")}`);
const previous = priorAccepted();
const pending = selectedWithSource.filter((item) => !previous.has(item.candidate.case.id));
const manifestPath = `${outputPath}.manifest.json`;
const manifest = { prompt_version: PROMPT_VERSION, schema_sha256: sha256(JSON.stringify(modelSchema)), source_corpus: path.relative(ROOT, V7_PATH), source_corpus_sha256: sha256(fs.readFileSync(V7_PATH)), output: path.relative(ROOT, outputPath), selected_count: selectedWithSource.length, selected_ids: selectedWithSource.map((item) => item.candidate.case.id), cache_verified_count: selectedWithSource.length, pending_count: pending.length, max_credit_spend: maxCreditSpend, credit_reserve_per_call: creditReservePerCall, concurrency, no_auto_publish: true, started_at: new Date().toISOString(), completed_at: null, starting_credits: null, ending_credits: null, accepted: 0, rejected: 0, failed: 0, stopped_for_credit_guard: false };

console.log(JSON.stringify({ mode: dryRun ? "dry-run" : "live", prompt_version: PROMPT_VERSION, selected: selectedWithSource.map((item) => ({ id: item.candidate.case.id, source_url: item.candidate.row.source_manifest.final_url, pages: item.selectedPages, cache_verified: true })), pending: pending.length, output: path.relative(ROOT, outputPath), no_auto_publish: true, max_credit_spend: maxCreditSpend }, null, 2));
if (dryRun) process.exit(0);

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
let startingCredits = await getCredits();
let latestCredits = startingCredits;
manifest.starting_credits = startingCredits;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
let accepted = 0; let rejected = 0; let failed = 0; let stopForCredits = false; let next = 0;

async function worker() {
  while (!stopForCredits) {
    const item = pending[next++];
    if (!item) return;
    latestCredits = await getCredits();
    const spent = startingCredits - latestCredits;
    if (spent + (concurrency * creditReservePerCall) >= maxCreditSpend) { stopForCredits = true; manifest.stopped_for_credit_guard = true; return; }
    try {
      const response = await complete(item.candidate, item.excerpt);
      const validationErrors = validateFacts(response.result, item.candidate.source, item.selectedPages);
      const status = validationErrors.length ? "rejected" : "accepted";
      append({ id: item.candidate.case.id, status, prompt_version: PROMPT_VERSION, generated_at: new Date().toISOString(), source_manifest: { ...item.candidate.row.source_manifest, selected_pages: item.selectedPages, cache_verified: true }, usage: response.usage, model: response.model, attempts: response.attempts, raw_model_response: response.rawContent, extracted: response.result, validation_errors: validationErrors, publishable: false });
      if (status === "accepted") accepted += 1; else rejected += 1;
      console.log(`${status}: ${item.candidate.case.id}`);
    } catch (error) {
      failed += 1;
      append({ id: item.candidate.case.id, status: "failed", prompt_version: PROMPT_VERSION, generated_at: new Date().toISOString(), source_manifest: { ...item.candidate.row.source_manifest, selected_pages: item.selectedPages, cache_verified: true }, error: error instanceof Error ? error.message : String(error), publishable: false });
      console.error(`failed: ${item.candidate.case.id}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
try { latestCredits = await getCredits(); } catch { /* preserve last verified balance */ }
Object.assign(manifest, { completed_at: new Date().toISOString(), ending_credits: latestCredits, credits_spent: startingCredits - latestCredits, accepted, rejected, failed });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ status: "complete", accepted, rejected, failed, credits_spent: manifest.credits_spent, stopped_for_credit_guard: manifest.stopped_for_credit_guard, output: path.relative(ROOT, outputPath), no_auto_publish: true }, null, 2));
