import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "data", "cases.json");
const INTELLIGENCE_PATH = path.join(ROOT, "data", "case-intelligence.json");
const SLUG_OVERRIDES = {
  "-2026-07-16": "badash-v-ohana-2026-07-16",
};

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function sourceTier(url) {
  let host = "";
  try {
    host = new URL(text(url)).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "missing";
  }
  if (
    host.endsWith(".gov") ||
    host.includes("uscourts.gov") ||
    host.includes("supremecourt.gov") ||
    host.startsWith("courts.")
  ) {
    return "official-court";
  }
  if ([
    "austlii.edu.au",
    "canlii.org",
    "courtlistener.com",
    "docs.justia.com",
    "law.justia.com",
    "saflii.org",
  ].includes(host)) {
    return "docket-mirror";
  }
  if (host.includes("damiencharlotin.com")) return "publisher-archive";
  return "secondary-report";
}

function ensureStandaloneSummary(record) {
  const summary = text(record.summary).replace(/\s+/g, " ");
  if (summary.length >= 120) return summary;
  const issue = (record.tags || [])
    .slice(0, 2)
    .map((tag) => tag.replaceAll("-", " "))
    .join(" and ") || "an AI-related legal issue";
  const lead = summary.replace(/[.\s]+$/, "") || `The public record identifies ${issue}`;
  const court = text(record.court) || "the recorded tribunal";
  const outcome = text(record.outcome) || "the procedural response described in the linked source";
  return `${lead}. The matter is recorded in ${court} on ${record.date} and concerns ${issue}. The tracked outcome is ${outcome}; consult the linked source for the complete record.`;
}

function practicalImplications(record) {
  const tags = new Set(record.tags || []);
  const implications = [];
  if (tags.has("fake-citations") || tags.has("fabricated-authorities")) {
    implications.push("Verify the existence, citation, court, and precedential status of every authority before filing.");
  }
  if (tags.has("fabricated-quotes") || tags.has("false-quotes")) {
    implications.push("Compare every quoted passage and pincite directly with the underlying opinion or filing.");
  }
  if (tags.has("misrepresented-authority") || tags.has("misrepresented-authorities")) {
    implications.push("Confirm that each authority supports the stated proposition and has not been mischaracterized.");
  }
  if (record.alleged) {
    implications.push("Keep allegations separate from adjudicated findings in research, reporting, and client communications.");
  }
  implications.push("Read the linked source and subsequent docket history before relying on this record for legal work.");
  return [...new Set(implications)].slice(0, 4);
}

function baseRecord(record) {
  return {
    court: text(record.court),
    jurisdiction: text(record.jurisdiction),
    state: text(record.state),
    country: text(record.country),
    circuit: record.circuit || null,
    judge: record.judge || null,
    date: text(record.date),
    ai_tool: text(record.ai_tool_used),
    outcome: text(record.outcome),
    amount: Number.isFinite(record.amount) ? record.amount : null,
    professional_sanction: text(record.professional_sanction),
    tags: record.tags || [],
    sanction_types: record.sanction_types || [],
  };
}

function baseline(record) {
  const summary = ensureStandaloneSummary(record);
  const tier = sourceTier(record.source_url);
  const sourceNote = {
    "official-court": "The recorded link is hosted by a court or government source.",
    "docket-mirror": "The recorded link is hosted by a legal-document or docket mirror.",
    "publisher-archive": "The recorded document is hosted in the upstream publisher archive.",
    "secondary-report": "The recorded link is a secondary public source and should be checked against the docket where available.",
    missing: "No underlying public source link is currently recorded.",
  }[tier];
  const issue = (record.tags || [])
    .slice(0, 2)
    .map((tag) => tag.replaceAll("-", " "))
    .join(" and ") || "legal AI verification";
  const outcome = text(record.outcome) || "a recorded judicial or procedural response";
  const sourceUrl = text(record.source_url);

  return {
    id: record.id,
    slug: SLUG_OVERRIDES[record.id] || slugify(record.id),
    case_name: record.case_name,
    classification: record.alleged ? "allegation" : "adjudicated",
    severity: record.severity || "low",
    summary,
    direct_answer: summary,
    why_it_matters: `This matter connects ${issue} with ${outcome} in ${text(record.court) || "the recorded tribunal"}. It provides a source-linked baseline for verification, supervision, and response controls.`,
    judicial_reasoning: null,
    decision_context: `The structured public record identifies ${issue} and records ${outcome}. The linked source controls the precise reasoning and procedural context.`,
    practical_implications: practicalImplications(record),
    evidence_boundary: `${record.alleged ? "The record concerns a public allegation and does not establish an adjudicated finding." : "The record summarizes the outcome described in the linked public source."} ${sourceNote} This page is not a substitute for the complete docket, subsequent history, or jurisdiction-specific advice.`,
    verified_fields: ["case_name", "court", "date", sourceUrl ? "source_url" : null].filter(Boolean),
    source: {
      url: sourceUrl,
      name: text(record.source_name) || "Linked source",
      tier,
    },
    record: baseRecord(record),
    publication: {
      ready: false,
      agent_status: "structured-record-baseline",
      blocked_reason: "Pending source-level evidence review.",
    },
  };
}

const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
const existing = fs.existsSync(INTELLIGENCE_PATH)
  ? JSON.parse(fs.readFileSync(INTELLIGENCE_PATH, "utf8"))
  : [];
const existingById = new Map(existing.map((record) => [record.id, record]));
const next = [];
let preserved = 0;
let created = 0;

for (const record of cases) {
  const prior = existingById.get(record.id);
  const latestSourceUrl = text(record.source_url);
  if (!prior) {
    next.push(baseline(record));
    created += 1;
    continue;
  }
  next.push({
    ...prior,
    id: record.id,
    slug: SLUG_OVERRIDES[record.id] || slugify(record.id),
    case_name: record.case_name,
    classification: record.alleged ? "allegation" : "adjudicated",
    severity: record.severity || prior.severity || "low",
    source: {
      ...prior.source,
      url: text(prior.source?.url) || latestSourceUrl,
      name: text(record.source_name) || prior.source?.name || "Linked source",
      tier: prior.source?.tier || sourceTier(text(prior.source?.url) || latestSourceUrl),
    },
    record: baseRecord(record),
  });
  preserved += 1;
}

const serialized = `${JSON.stringify(next, null, 2)}\n`;
const temporary = `${INTELLIGENCE_PATH}.tmp-${process.pid}`;
fs.writeFileSync(temporary, serialized);
JSON.parse(fs.readFileSync(temporary, "utf8"));
fs.renameSync(temporary, INTELLIGENCE_PATH);

console.log(JSON.stringify({
  status: "synced",
  cases: cases.length,
  intelligence_records: next.length,
  preserved,
  created,
  stale_removed: existing.length - preserved,
}, null, 2));
