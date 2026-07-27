import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { z } from "zod";

const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "data", "cases.json");
const INTELLIGENCE_PATH = path.join(ROOT, "data", "case-intelligence.json");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "kie-enrichment", "pilot.jsonl");
const SOURCE_CACHE = path.join(ROOT, ".cache", "kie-sources");
const PDFINFO_BIN = "/opt/homebrew/bin/pdfinfo";
const PDFTOTEXT_BIN = "/opt/homebrew/bin/pdftotext";
const PDFTOPPM_BIN = "/opt/homebrew/bin/pdftoppm";
const TESSERACT_BIN = "/opt/homebrew/bin/tesseract";
const API_URL = "https://api.kie.ai/gemini-2.5-flash/v1/chat/completions";
const CREDIT_URL = "https://api.kie.ai/api/v1/chat/credit";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const dryRun = flag("--dry-run");
const allowAll = flag("--all");
const limit = Number(value("--limit", "3"));
const concurrency = Number(value("--concurrency", "3"));
const maxCreditSpend = Number(value("--max-credit-spend", "100"));
const creditReservePerCall = Number(value("--credit-reserve-per-call", "2"));
const outputPath = path.resolve(value("--out", DEFAULT_OUTPUT));
const requestedIds = (value("--ids", "") || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!Number.isInteger(limit) || limit < 1) {
  throw new Error("--limit must be a positive integer.");
}
if (!Number.isFinite(maxCreditSpend) || maxCreditSpend <= 0) {
  throw new Error("--max-credit-spend must be greater than zero.");
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 12) {
  throw new Error("--concurrency must be an integer between 1 and 12.");
}
if (!Number.isFinite(creditReservePerCall) || creditReservePerCall <= 0) {
  throw new Error("--credit-reserve-per-call must be greater than zero.");
}
if (limit > 25 && !allowAll) {
  throw new Error("Refusing more than 25 cases without the explicit --all flag.");
}

const apiKey = process.env.KIE_API_KEY;
if (!dryRun && !apiKey) {
  throw new Error("KIE_API_KEY is required for live enrichment.");
}

const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
const intelligence = JSON.parse(fs.readFileSync(INTELLIGENCE_PATH, "utf8"));
const intelligenceById = new Map(intelligence.map((record) => [record.id, record]));
const sourceUrlCounts = new Map();
for (const record of cases) {
  const url = record.source_url?.trim();
  if (url) sourceUrlCounts.set(url, (sourceUrlCounts.get(url) || 0) + 1);
}
const PROMPT_VERSION = "case-intelligence-v7";
const ALLOWED_VERIFIED_FIELDS = new Set([
  "case_name",
  "court",
  "date",
  "procedural_posture",
  "ai_attribution_status",
  "recorded_tool",
  "failure_modes",
  "judicial_reasoning",
  "outcome",
  "amount",
  "professional_consequence",
]);
const EVIDENCE_FIELDS = new Set([
  "procedural_posture",
  "ai_attribution_status",
  "recorded_tool",
  "failure_modes",
  "judicial_reasoning",
  "outcome",
  "amount",
  "professional_consequence",
]);

function classifyFamily(record) {
  const joined = [
    record.outcome,
    record.summary,
    record.professional_sanction,
    ...(record.sanction_types || []),
    ...(record.tags || []),
  ].join(" ").toLowerCase();
  if (record.alleged || /\balleg(?:ed|ation)\b|pending|unresolved/.test(joined)) {
    return "allegation_or_unresolved";
  }
  if (/disciplin|bar sanction|professional sanction|suspension|disbar/.test(joined)) {
    return "professional_discipline";
  }
  if (/confidential|privilege|disclosure|protective order/.test(joined)) {
    return "confidentiality_or_disclosure";
  }
  if (record.country && record.country !== "US") {
    return "non_us_or_tribunal";
  }
  if (/show cause|warning|warned|procedural|struck|strike/.test(joined)) {
    return "warning_or_procedural";
  }
  return "adjudicated_sanction";
}

function weaknessScore(record) {
  const current = intelligenceById.get(record.id);
  let score = 0;
  if (!current) return 100;
  if (!current.judicial_reasoning) score += 4;
  if ((current.summary || "").split(/\s+/).length < 100) score += 3;
  if ((current.why_it_matters || "").includes("making it a concrete reference point")) score += 2;
  if ((current.evidence_boundary || "").includes("This page is not a substitute")) score += 1;
  if (current.publication?.ready === false) score += 5;
  if (record.source_url) score += 1;
  return score;
}

function chooseRecords() {
  if (requestedIds.length) {
    const byId = new Map(cases.map((record) => [record.id, record]));
    const missing = requestedIds.filter((id) => !byId.has(id));
    if (missing.length) throw new Error(`Unknown case ids: ${missing.join(", ")}`);
    return requestedIds.slice(0, limit).map((id) => byId.get(id));
  }
  const selected = [];
  const usedFamilies = new Set();
  const ranked = [...cases].sort((a, b) => weaknessScore(b) - weaknessScore(a));
  for (const record of ranked) {
    const family = classifyFamily(record);
    if (!usedFamilies.has(family)) {
      selected.push(record);
      usedFamilies.add(family);
    }
    if (selected.length >= limit) return selected;
  }
  for (const record of ranked) {
    if (!selected.some((item) => item.id === record.id)) selected.push(record);
    if (selected.length >= limit) break;
  }
  return selected;
}

function cleanHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const PRIMARY_HTML_HOSTS = new Set([
  "austlii.edu.au",
  "bailii.org",
  "canlii.org",
  "caselaw.findlaw.com",
  "caselaw.nsw.gov.au",
  "courtlistener.com",
  "courts.michigan.gov",
  "decisions.civilresolutionbc.ca",
  "docs.justia.com",
  "gao.gov",
  "indiankanoon.org",
  "law.justia.com",
  "lbox.kr",
  "leagle.com",
  "rv.hessenrecht.hessen.de",
  "saflii.org",
  "tjsc.jus.br",
  "wcca.wicourts.gov",
]);

function caseMatchScore(record, text) {
  const tokens = [...new Set((record.case_name || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 4 && !["matter", "state", "united", "court"].includes(term)))];
  if (!tokens.length) return 0;
  const normalized = text.toLowerCase();
  const matched = tokens.filter((term) => normalized.includes(term)).length;
  return matched / tokens.length;
}

function classifyHtmlAuthority(url, text, record) {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const shared = (sourceUrlCounts.get(record.source_url?.trim()) || 0) > 1;
  const genericPath = /(?:\/search\b|\/tag\/|\/category\/|\/hallucinations\/|[?&](?:page|mode|query|search)=)/i
    .test(`${parsed.pathname}${parsed.search}`);
  const matchScore = caseMatchScore(record, text);
  if (shared || genericPath || matchScore < 0.3) return "generic_or_shared";
  const officialHost = host.endsWith(".gov") || host.includes(".gov.");
  if (officialHost || PRIMARY_HTML_HOSTS.has(host)) return "primary_case_document";
  return "case_specific_secondary";
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sourceTerms(record) {
  const evidenceTerms = [
    "artificial intelligence",
    "ai-assisted",
    "generative ai",
    "chatgpt",
    "hallucinated",
    "fabricated",
    "fake citation",
    "false quote",
    "fictitious",
    "non-existent",
    "nonexistent",
    "legal research",
    "research tools",
    "drafting tools",
    "verification",
    "verify",
    "westlaw",
    "lexis",
    "citation",
    "sanction",
    "rule 11",
    "ordered",
  ].map((term) => ({ term, weight: 5 }));
  const caseTerms = (record.case_name || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 5)
    .map((term) => ({ term, weight: 1 }));
  return [...evidenceTerms, ...caseTerms];
}

function selectPdfPages(pages, record, maxPages = 10) {
  const terms = sourceTerms(record);
  const scored = pages.map((text, index) => {
    const normalized = text.toLowerCase();
    let score = index === 0 ? 2 : 0;
    if (index === pages.length - 1) score += 1;
    for (const { term, weight } of terms) {
      const matches = normalized.split(term).length - 1;
      score += Math.min(matches, 8) * weight;
    }
    return { index, score, text };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxPages)
    .sort((a, b) => a.index - b.index);
}

function pdfManifest(pdfPath, finalUrl, contentType, record) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const textPath = `${pdfPath}.txt`;
  let pageCount = null;
  let extractionError = null;
  let extractionMethod = "pdftotext-layout";
  try {
    const info = execFileSync(PDFINFO_BIN, [pdfPath], {
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });
    const match = info.match(/^Pages:\s+(\d+)/m);
    if (match) pageCount = Number(match[1]);
    execFileSync(PDFTOTEXT_BIN, ["-layout", pdfPath, textPath], {
      timeout: 90_000,
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    extractionError = error instanceof Error ? error.message : String(error);
  }
  let extractedText = fs.existsSync(textPath) ? fs.readFileSync(textPath, "utf8") : "";
  let pages = extractedText.split("\f").map((page) => page.replace(/\s+/g, " ").trim());
  if (pageCount) pages = pages.slice(0, pageCount);
  let extractedCharCount = pages.reduce((sum, page) => sum + page.length, 0);

  if (pageCount && extractedCharCount < pageCount * 200) {
    const ocrDir = `${pdfPath}.ocr`;
    fs.mkdirSync(ocrDir, { recursive: true });
    try {
      execFileSync(PDFTOPPM_BIN, [
        "-jpeg",
        "-r",
        "120",
        pdfPath,
        path.join(ocrDir, "page"),
      ], {
        timeout: Math.max(120_000, pageCount * 10_000),
        maxBuffer: 1024 * 1024,
      });
      const images = fs.readdirSync(ocrDir)
        .filter((name) => name.endsWith(".jpg"))
        .sort();
      const ocrPages = [];
      for (const image of images) {
        const text = execFileSync(TESSERACT_BIN, [
          image,
          "stdout",
          "-l",
          "eng",
          "--psm",
          "6",
        ], {
          cwd: ocrDir,
          encoding: "utf8",
          timeout: 60_000,
          maxBuffer: 4 * 1024 * 1024,
        });
        ocrPages.push(text.replace(/\s+/g, " ").trim());
      }
      const ocrCharCount = ocrPages.reduce((sum, page) => sum + page.length, 0);
      if (ocrCharCount > extractedCharCount) {
        pages = ocrPages;
        extractedText = ocrPages.join("\f");
        extractedCharCount = ocrCharCount;
        extractionMethod = "tesseract-eng-120dpi";
        extractionError = null;
        fs.writeFileSync(`${pdfPath}.ocr.txt`, extractedText);
      }
    } catch (error) {
      extractionError = error instanceof Error ? error.message : String(error);
    }
  }

  const selectedPages = selectPdfPages(pages, record).filter((page) => page.text);
  let excerpt = "";
  for (const page of selectedPages) {
    const addition = `[PAGE ${page.index + 1}]\n${page.text.slice(0, 4_000)}\n`;
    if (excerpt.length + addition.length > 32_000) break;
    excerpt += addition;
  }
  const status = extractedCharCount >= 500 && excerpt.length >= 300
    ? "full_document"
    : "metadata_only";
  return {
    status,
    excerpt: excerpt.trim(),
    error: extractionError || (status === "metadata_only" ? "pdf-text-extraction-insufficient" : null),
    manifest: {
      requested_url: record.source_url,
      final_url: finalUrl,
      http_status: 200,
      content_type: contentType,
      body_sha256: sha256(pdfBytes),
      body_bytes: pdfBytes.length,
      cache_path: path.relative(ROOT, pdfPath),
      extraction_method: extractionMethod,
      extraction_sha256: extractedText ? sha256(extractedText) : null,
      extracted_characters: extractedCharCount,
      page_count: pageCount,
      selected_pages: selectedPages.map((page) => page.index + 1),
      source_authority: "primary_case_document",
    },
    authority: "primary_case_document",
  };
}

async function prepareSource(record) {
  const url = record.source_url?.trim();
  if (!url) {
    return {
      status: "inaccessible",
      excerpt: "",
      error: "missing-url",
      manifest: {
        requested_url: null,
        final_url: null,
        http_status: null,
        content_type: null,
        body_sha256: null,
        body_bytes: 0,
        cache_path: null,
        extraction_method: null,
        extraction_sha256: null,
        extracted_characters: 0,
        page_count: null,
        selected_pages: [],
        source_authority: "inaccessible",
      },
      authority: "inaccessible",
    };
  }
  const cacheStem = sha256(url);
  const cachedPdfPath = path.join(SOURCE_CACHE, `${cacheStem}.pdf`);
  if (/\.pdf(?:$|[?#])/i.test(url) && fs.existsSync(cachedPdfPath)) {
    return pdfManifest(cachedPdfPath, url, "application/pdf", record);
  }
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
        "User-Agent": "AI-Vortex-Public-Research/1.0 (+https://www.aivortex.io/legal-ai-risk)",
      },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!response.ok) {
      return {
        status: "inaccessible",
        excerpt: "",
        error: `http-${response.status}`,
        manifest: {
          requested_url: url,
          final_url: response.url || url,
          http_status: response.status,
          content_type: response.headers.get("content-type"),
          body_sha256: null,
          body_bytes: 0,
          cache_path: null,
          extraction_method: null,
          extraction_sha256: null,
          extracted_characters: 0,
          page_count: null,
          selected_pages: [],
          source_authority: "inaccessible",
        },
        authority: "inaccessible",
      };
    }
    const contentType = response.headers.get("content-type") || "";
    const body = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(SOURCE_CACHE, { recursive: true });
    if (contentType.includes("application/pdf") || /\.pdf(?:$|[?#])/i.test(response.url || url)) {
      const pdfPath = path.join(SOURCE_CACHE, `${cacheStem}.pdf`);
      fs.writeFileSync(pdfPath, body);
      return pdfManifest(pdfPath, response.url || url, contentType || "application/pdf", record);
    }
    const htmlPath = path.join(SOURCE_CACHE, `${cacheStem}.html`);
    fs.writeFileSync(htmlPath, body);
    const text = cleanHtml(body.toString("utf8"));
    const authority = text.length < 300
      ? "generic_or_shared"
      : classifyHtmlAuthority(response.url || url, text, record);
    const status = authority === "generic_or_shared" ? "metadata_only" : "source_excerpt";
    return {
      status,
      excerpt: text.slice(0, 24_000),
      error: text.length < 300
        ? "short-source"
        : authority === "generic_or_shared"
          ? "generic-or-shared-source"
          : null,
      authority,
      manifest: {
        requested_url: url,
        final_url: response.url || url,
        http_status: response.status,
        content_type: contentType,
        body_sha256: sha256(body),
        body_bytes: body.length,
        cache_path: path.relative(ROOT, htmlPath),
        extraction_method: "html-visible-text",
        extraction_sha256: text ? sha256(text) : null,
        extracted_characters: text.length,
        page_count: null,
        selected_pages: [],
        source_authority: authority,
      },
    };
  } catch (error) {
    return {
      status: "inaccessible",
      excerpt: "",
      error: error instanceof Error ? error.message : String(error),
      manifest: {
        requested_url: url,
        final_url: null,
        http_status: null,
        content_type: null,
        body_sha256: null,
        body_bytes: 0,
        cache_path: null,
        extraction_method: null,
        extraction_sha256: null,
        extracted_characters: 0,
        page_count: null,
        selected_pages: [],
        source_authority: "inaccessible",
      },
      authority: "inaccessible",
    };
  }
}

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "case_family",
    "summary",
    "direct_answer",
    "procedural_posture",
    "ai_attribution_status",
    "recorded_tool",
    "failure_modes",
    "judicial_reasoning",
    "decision_context",
    "outcome_summary",
    "monetary_consequence",
    "professional_consequence",
    "why_it_matters",
    "practical_implications",
    "evidence_boundary",
    "verified_fields",
    "uncertainties",
    "evidence_notes",
    "source_access_status",
    "publication_ready",
    "confidence",
  ],
  properties: {
    id: { type: "string" },
    case_family: {
      type: "string",
      enum: [
        "adjudicated_sanction",
        "warning_or_procedural",
        "allegation_or_unresolved",
        "professional_discipline",
        "confidentiality_or_disclosure",
        "non_us_or_tribunal",
      ],
    },
    summary: { type: "string" },
    direct_answer: { type: "string" },
    procedural_posture: { type: "string" },
    ai_attribution_status: {
      type: "string",
      enum: ["admitted", "explicitly_recorded", "implied", "alleged", "unspecified"],
    },
    recorded_tool: nullableString,
    failure_modes: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    judicial_reasoning: nullableString,
    decision_context: { type: "string" },
    outcome_summary: { type: "string" },
    monetary_consequence: {
      type: "object",
      additionalProperties: false,
      required: ["known", "amount", "currency"],
      properties: {
        known: { type: "boolean" },
        amount: { anyOf: [{ type: "number" }, { type: "null" }] },
        currency: nullableString,
      },
    },
    professional_consequence: { type: "string" },
    why_it_matters: { type: "string" },
    practical_implications: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5,
    },
    evidence_boundary: { type: "string" },
    verified_fields: { type: "array", items: { type: "string" }, maxItems: 20 },
    uncertainties: { type: "array", items: { type: "string" }, maxItems: 10 },
    evidence_notes: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["field", "basis", "locator"],
        properties: {
          field: { type: "string", enum: [...EVIDENCE_FIELDS] },
          basis: { type: "string" },
          locator: { type: "string" },
        },
      },
    },
    source_access_status: {
      type: "string",
      enum: ["full_document", "source_excerpt", "metadata_only", "inaccessible"],
    },
    publication_ready: { type: "boolean" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
};

const evidenceFieldValues = [...EVIDENCE_FIELDS];
const caseIntelligenceSchema = z.object({
  id: z.string().min(1),
  case_family: z.enum([
    "adjudicated_sanction",
    "warning_or_procedural",
    "allegation_or_unresolved",
    "professional_discipline",
    "confidentiality_or_disclosure",
    "non_us_or_tribunal",
  ]),
  summary: z.string().min(220).max(2_000),
  direct_answer: z.string().min(80).max(1_000),
  procedural_posture: z.string().min(10).max(1_000),
  ai_attribution_status: z.enum([
    "admitted",
    "explicitly_recorded",
    "implied",
    "alleged",
    "unspecified",
  ]),
  recorded_tool: z.string().min(1).max(200).nullable(),
  failure_modes: z.array(z.string().min(1).max(120)).min(1).max(6),
  judicial_reasoning: z.string().min(30).max(1_500).nullable(),
  decision_context: z.string().min(30).max(1_000),
  outcome_summary: z.string().min(15).max(1_000),
  monetary_consequence: z.object({
    known: z.boolean(),
    amount: z.number().nonnegative().nullable(),
    currency: z.string().min(3).max(10).nullable(),
  }).strict(),
  professional_consequence: z.string().min(2).max(1_000),
  why_it_matters: z.string().min(80).max(1_000),
  practical_implications: z.array(z.string().min(15).max(300)).min(3).max(5),
  evidence_boundary: z.string().min(100).max(1_000),
  verified_fields: z.array(z.string().min(1).max(80)).max(20),
  uncertainties: z.array(z.string().min(1).max(400)).max(10),
  evidence_notes: z.array(z.object({
    field: z.enum(evidenceFieldValues),
    basis: z.string().min(10).max(400),
    locator: z.string().min(2).max(120),
  }).strict()).min(1).max(8),
  source_access_status: z.enum([
    "full_document",
    "source_excerpt",
    "metadata_only",
    "inaccessible",
  ]),
  publication_ready: z.boolean(),
  confidence: z.enum(["low", "medium", "high"]),
}).strict();

function promptFor(record, source) {
  const existing = intelligenceById.get(record.id);
  const family = classifyFamily(record);
  const sourceMaterial = source.excerpt
    ? `\nPUBLIC SOURCE EXCERPT:\n${source.excerpt}`
    : "\nNo source excerpt was retrievable. Use only the supplied record metadata and mark unsupported fields as uncertain.";
  return [
    "You are producing evidence-bound legal AI risk intelligence for a public research tracker.",
    "Return only the JSON object required by the response schema.",
    "Never infer a sanction, finding, judge, amount, AI tool, or judicial rationale that the supplied material does not establish.",
    "Set judicial_reasoning to null unless the source explicitly explains the decision-maker's reasoning.",
    "Distinguish allegations from adjudicated findings. Treat the linked source as controlling over the existing summary.",
    "Write concise, neutral English for lawyers and legal operations professionals.",
    "Target lengths: summary 80-140 words; direct_answer 35-70 words; why_it_matters 30-60 words; evidence_boundary 25-70 words.",
    "Each practical implication must be a source-supported review control, not legal advice.",
    "Evidence-note bases must be short paraphrases, not long quotations.",
    "Every evidence note must include a locator. For PDF text use the exact [PAGE N] marker as 'p. N'. For HTML use 'HTML excerpt'. For metadata-only facts use 'structured record'.",
    "Provide evidence notes for outcome, every known amount, every named AI tool, and any judicial_reasoning.",
    "If source_access_status is metadata_only or inaccessible, confidence cannot be high and publication_ready must be false.",
    "Only source_authority primary_case_document may receive high confidence or publication_ready true. A case_specific_secondary source is context only: confidence must be medium or low and publication_ready must be false.",
    `verified_fields may contain only these factual field names: ${[...ALLOWED_VERIFIED_FIELDS].join(", ")}.`,
    "Do not list generated prose fields such as summary, direct_answer, why_it_matters, practical_implications, evidence_boundary, confidence, or publication_ready as verified.",
    `The expected case_family is ${family}; change it only if the evidence clearly requires another allowed family.`,
    `The observed source access status is ${source.status}; copy that exact value to source_access_status.`,
    `The deterministic source_authority is ${source.authority}; do not upgrade it.`,
    `CASE RECORD:\n${JSON.stringify(record)}`,
    `CURRENT INTELLIGENCE (may contain generic fallback language):\n${JSON.stringify(existing || null)}`,
    `PUBLIC SOURCE URL: ${record.source_url || "none"}`,
    sourceMaterial,
  ].join("\n\n");
}

function normalizeResult(result, record, source) {
  const normalized = structuredClone(result);
  normalized.id = record.id;
  if (Array.isArray(normalized.recorded_tool)) {
    normalized.recorded_tool = normalized.recorded_tool
      .map((value) => String(value).trim())
      .filter(Boolean)
      .join(", ") || null;
  }
  if (
    normalized.monetary_consequence?.known &&
    typeof normalized.monetary_consequence.amount === "string"
  ) {
    const numeric = Number(normalized.monetary_consequence.amount.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(numeric) && numeric >= 0) {
      normalized.monetary_consequence.amount = numeric;
    } else {
      normalized.monetary_consequence = { known: false, amount: null, currency: null };
    }
  }
  if (normalized.monetary_consequence?.known === false) {
    normalized.monetary_consequence.amount = null;
    normalized.monetary_consequence.currency = null;
  }
  if (
    typeof normalized.monetary_consequence?.currency === "string" &&
    normalized.monetary_consequence.currency.length > 10
  ) {
    normalized.monetary_consequence.currency = null;
  }
  if (
    typeof record.amount === "number" &&
    normalized.monetary_consequence?.known &&
    normalized.monetary_consequence.amount !== record.amount
  ) {
    normalized.monetary_consequence = { known: false, amount: null, currency: null };
    normalized.verified_fields = (normalized.verified_fields || [])
      .filter((field) => field !== "amount");
    normalized.uncertainties = [...new Set([
      ...(normalized.uncertainties || []),
      "The source and structured corpus record require manual reconciliation of the monetary amount.",
    ])].slice(0, 10);
  }
  normalized.evidence_notes = (normalized.evidence_notes || [])
    .map((note) => ({
      ...note,
      locator: source.status === "full_document"
        ? note.locator.replace(/,\s*p\.\s*/gi, ", ")
        : note.locator,
    }));
  const hasNonPagePdfEvidence = source.status === "full_document" &&
    normalized.evidence_notes.some((note) => !/^p\.\s*\d+(?:\s*[-,]\s*\d+)*$/i.test(note.locator));
  if (hasNonPagePdfEvidence) {
    normalized.publication_ready = false;
    normalized.confidence = normalized.confidence === "high" ? "medium" : normalized.confidence;
    normalized.uncertainties = [...new Set([
      ...(normalized.uncertainties || []),
      "One or more case-level facts are supported only by the structured corpus record, not by a page-located passage in the retrieved document.",
    ])].slice(0, 10);
  }
  const evidenceFields = new Set(normalized.evidence_notes.map((note) => note.field));
  if (normalized.recorded_tool && !evidenceFields.has("recorded_tool")) {
    normalized.recorded_tool = null;
    normalized.verified_fields = (normalized.verified_fields || [])
      .filter((field) => field !== "recorded_tool");
  }
  if (normalized.monetary_consequence?.known && !evidenceFields.has("amount")) {
    normalized.monetary_consequence = { known: false, amount: null, currency: null };
    normalized.verified_fields = (normalized.verified_fields || [])
      .filter((field) => field !== "amount");
  }
  if (!Array.isArray(normalized.practical_implications) || normalized.practical_implications.length < 3) {
    const existing = intelligenceById.get(record.id)?.practical_implications;
    normalized.practical_implications = Array.isArray(existing) && existing.length >= 3
      ? existing.slice(0, 5)
      : [
        "Verify cited authorities and quoted propositions against the linked primary material.",
        "Preserve the verification record and identify unresolved exceptions before filing or relying.",
        "Escalate unsupported claims to the responsible human reviewer for a documented decision.",
      ];
  }
  if (!Array.isArray(normalized.failure_modes) || normalized.failure_modes.length < 1) {
    normalized.failure_modes = ["not_separately_established"];
  }
  if (typeof normalized.outcome_summary === "string" && normalized.outcome_summary.trim().length < 15) {
    normalized.outcome_summary = "Outcome is not separately established in the available source.";
  }
  if (
    typeof normalized.direct_answer === "string" &&
    normalized.direct_answer.trim().split(/\s+/).filter(Boolean).length < 25
  ) {
    const existingSummary = intelligenceById.get(record.id)?.summary || record.summary || "";
    normalized.direct_answer = existingSummary.trim().split(/\s+/).slice(0, 70).join(" ");
  }
  if (typeof normalized.procedural_posture === "string" && normalized.procedural_posture.trim().length < 10) {
    normalized.procedural_posture = "Procedural posture is not separately established in the available source.";
  }
  return normalized;
}

function validateResult(result, record, source) {
  const errors = [];
  const parsed = caseIntelligenceSchema.safeParse(result);
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((issue) =>
      `schema:${issue.path.join(".") || "root"}:${issue.message}`));
    return errors;
  }
  if (result.id !== record.id) errors.push("id-mismatch");
  if (result.source_access_status !== source.status) errors.push("source-status-mismatch");
  const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
  if (words(result.summary) < 80) errors.push("summary-below-word-target");
  if (words(result.direct_answer) < 25) errors.push("direct-answer-below-word-target");
  if (words(result.why_it_matters) < 20) errors.push("why-it-matters-below-word-target");
  if (words(result.evidence_boundary) < 20) errors.push("evidence-boundary-below-word-target");
  const invalidVerifiedFields = (result.verified_fields || [])
    .filter((field) => !ALLOWED_VERIFIED_FIELDS.has(field));
  if (invalidVerifiedFields.length) {
    errors.push(`invalid-verified-fields:${invalidVerifiedFields.join(",")}`);
  }
  if (
    ["metadata_only", "inaccessible"].includes(source.status) &&
    (result.confidence === "high" || result.publication_ready)
  ) {
    errors.push("insufficient-source-overclaim");
  }
  if (
    source.authority !== "primary_case_document" &&
    (result.confidence === "high" || result.publication_ready)
  ) {
    errors.push("non-primary-source-overclaim");
  }
  if (
    source.status === "full_document" &&
    (
      !source.manifest?.body_sha256 ||
      !source.manifest?.extraction_sha256 ||
      !Number.isInteger(source.manifest?.page_count) ||
      source.manifest.page_count < 1 ||
      (source.manifest.extracted_characters || 0) < 500
    )
  ) {
    errors.push("invalid-full-document-manifest");
  }
  if (record.alleged && result.case_family !== "allegation_or_unresolved") {
    errors.push("allegation-classification-drift");
  }
  if (
    typeof record.amount === "number" &&
    result.monetary_consequence?.known &&
    result.monetary_consequence.amount !== record.amount
  ) {
    errors.push("amount-conflicts-with-record");
  }
  if (
    typeof record.amount !== "number" &&
    result.monetary_consequence?.known &&
    result.monetary_consequence.amount == null
  ) {
    errors.push("known-amount-without-value");
  }
  const evidenceFields = new Set(result.evidence_notes.map((note) => note.field));
  if (!evidenceFields.has("outcome")) errors.push("outcome-missing-evidence-note");
  if (result.recorded_tool && !evidenceFields.has("recorded_tool")) {
    errors.push("recorded-tool-missing-evidence-note");
  }
  if (result.judicial_reasoning && !evidenceFields.has("judicial_reasoning")) {
    errors.push("reasoning-missing-evidence-note");
  }
  if (result.monetary_consequence.known && !evidenceFields.has("amount")) {
    errors.push("amount-missing-evidence-note");
  }
  if (
    source.status === "full_document" &&
    result.evidence_notes.some((note) => !/^p\.\s*\d+(?:\s*[-,]\s*\d+)*$/i.test(note.locator)) &&
    (result.publication_ready || result.confidence === "high")
  ) {
    errors.push("pdf-evidence-note-without-page-locator");
  }
  if (source.status === "full_document") {
    const selectedPages = new Set(source.manifest?.selected_pages || []);
    const citesUnselectedPage = result.evidence_notes.some((note) => {
      const citedPages = [...String(note.locator).matchAll(/\d+/g)]
        .map((match) => Number(match[0]));
      return citedPages.some((page) => !selectedPages.has(page));
    });
    if (citesUnselectedPage && (result.publication_ready || result.confidence === "high")) {
      errors.push("pdf-evidence-note-outside-selected-pages");
    }
  }
  return errors;
}

async function getCredits() {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(CREDIT_URL, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json();
      if (!response.ok || payload.code !== 200 || typeof payload.data !== "number") {
        throw new Error(`Unable to read Kie credits (${response.status}).`);
      }
      return payload.data;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1_000 * (2 ** attempt)));
      }
    }
  }
  throw lastError || new Error("Unable to read Kie credits.");
}

async function enrich(record, source) {
  const content = [{ type: "text", text: promptFor(record, source) }];
  const requestBody = {
      messages: [{ role: "user", content }],
      stream: false,
      include_thoughts: false,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "case_intelligence",
          strict: true,
          schema,
        },
      },
  };
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120_000),
      });
      const payload = await response.json();
      if (!response.ok) {
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1_000 * (2 ** attempt)));
          continue;
        }
        throw new Error(`Kie request failed (${response.status}): ${JSON.stringify(payload).slice(0, 500)}`);
      }
      const rawContent = payload.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("Kie returned no completion content.");
      const parsed = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return {
        result: parsed,
        usage: payload.usage || null,
        model: payload.model || "gemini-2.5-flash",
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1_000 * (2 ** attempt)));
      }
    }
  }
  throw lastError || new Error("Kie request failed after retries.");
}

function appendJsonLine(payload) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.appendFileSync(outputPath, `${JSON.stringify(payload)}\n`);
}

const previousIds = new Set();
if (fs.existsSync(outputPath)) {
  for (const line of fs.readFileSync(outputPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (
        parsed.id &&
        parsed.status === "accepted" &&
        parsed.prompt_version === PROMPT_VERSION
      ) {
        previousIds.add(parsed.id);
      }
    } catch {
      // Invalid prior lines remain visible to a separate validator and are not trusted here.
    }
  }
}

const selected = chooseRecords().filter((record) => !previousIds.has(record.id));
const manifestPath = `${outputPath}.manifest.json`;
const runManifest = {
  prompt_version: PROMPT_VERSION,
  schema_sha256: sha256(JSON.stringify(schema)),
  corpus_sha256: sha256(fs.readFileSync(CASES_PATH)),
  output: outputPath,
  selected_count: selected.length,
  selected_ids: selected.map((record) => record.id),
  concurrency,
  max_credit_spend: maxCreditSpend,
  credit_reserve_per_call: creditReservePerCall,
  started_at: new Date().toISOString(),
  completed_at: null,
  starting_credits: null,
  ending_credits: null,
  accepted: 0,
  rejected: 0,
  failures: 0,
};
console.log(JSON.stringify({
  mode: dryRun ? "dry-run" : "live",
  selected: selected.map((record) => ({
    id: record.id,
    family: classifyFamily(record),
    source_url: record.source_url || null,
    weakness_score: weaknessScore(record),
  })),
  output: outputPath,
  max_credit_spend: maxCreditSpend,
  concurrency,
  prompt_version: PROMPT_VERSION,
  run_manifest: manifestPath,
}, null, 2));

if (dryRun) process.exit(0);

const startingCredits = await getCredits();
let lastKnownCredits = startingCredits;
runManifest.starting_credits = startingCredits;
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(runManifest, null, 2)}\n`);
let accepted = 0;
let rejected = 0;
let failures = 0;
let nextIndex = 0;
let stopForCredits = false;

async function worker(workerId) {
  while (!stopForCredits) {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= selected.length) return;
    const record = selected[index];
    let currentCredits = lastKnownCredits;
    if (index % 25 === 0) {
      try {
        currentCredits = await getCredits();
        lastKnownCredits = currentCredits;
      } catch (error) {
        console.warn(`Worker ${workerId} continuing with last known credit balance after check failure: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const spent = startingCredits - currentCredits;
    const reserved = concurrency * creditReservePerCall;
    if (spent + reserved >= maxCreditSpend) {
      stopForCredits = true;
      console.log(`Worker ${workerId} stopping before ${record.id}: credit guard reached (${spent}+${reserved}/${maxCreditSpend}).`);
      return;
    }
    const source = await prepareSource(record);
    try {
      const completion = await enrich(record, source);
      const normalizedResult = normalizeResult(completion.result, record, source);
      const validationErrors = validateResult(normalizedResult, record, source);
      const status = validationErrors.length ? "rejected" : "accepted";
      appendJsonLine({
        id: record.id,
        status,
        family: classifyFamily(record),
        source_url: record.source_url || null,
        source_fetch_error: source.error,
        validation_errors: validationErrors,
        usage: completion.usage,
        model: completion.model,
        attempts: completion.attempts,
        prompt_version: PROMPT_VERSION,
        source_manifest: source.manifest,
        generated_at: new Date().toISOString(),
        intelligence: normalizedResult,
      });
      if (status === "accepted") accepted += 1;
      else rejected += 1;
      console.log(`${status}: ${record.id}`);
    } catch (error) {
      failures += 1;
      appendJsonLine({
        id: record.id,
        status: "failed",
        family: classifyFamily(record),
        source_url: record.source_url || null,
        source_fetch_error: source.error,
        source_manifest: source.manifest,
        error: error instanceof Error ? error.message : String(error),
        prompt_version: PROMPT_VERSION,
        generated_at: new Date().toISOString(),
      });
      console.error(`failed: ${record.id}`);
    }
  }
}

await Promise.all(Array.from(
  { length: Math.min(concurrency, selected.length) },
  (_, index) => worker(index + 1),
));

let endingCredits = lastKnownCredits;
try {
  endingCredits = await getCredits();
} catch (error) {
  console.warn(`Final credit check failed; using last known balance: ${error instanceof Error ? error.message : String(error)}`);
}
Object.assign(runManifest, {
  completed_at: new Date().toISOString(),
  ending_credits: endingCredits,
  accepted,
  rejected,
  failures,
});
fs.writeFileSync(manifestPath, `${JSON.stringify(runManifest, null, 2)}\n`);
console.log(JSON.stringify({
  status: "complete",
  accepted,
  rejected,
  failures,
  starting_credits: startingCredits,
  ending_credits: endingCredits,
  credits_spent: startingCredits - endingCredits,
  output: outputPath,
}, null, 2));
