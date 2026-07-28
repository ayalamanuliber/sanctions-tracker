import sanctionsRaw from "@/data/sanctions.json";
import judgeEnrichmentRaw from "@/data/judge-enrichment.json";
import { matchesCourt } from "@/lib/filtering";
import metaRaw from "@/data/meta.json";

export type CaseSeverity = "career-ending" | "high" | "medium" | "low";
export type SourceTier = "official-court" | "docket-mirror" | "publisher-archive" | "secondary-report" | "missing";

export interface LegalRiskCase {
  id: string;
  slug: string;
  case_name: string;
  court: string;
  state: string;
  state_display?: string;
  country: string;
  circuit: string | null;
  jurisdiction: string;
  judge: string | null;
  judge_role?: string | null;
  judge_evidence?: {
    locator: string;
    quote: string;
    source_url: string;
    verification_status: string;
  } | null;
  date: string;
  party?: string;
  ai_tool_used: string;
  ai_tool_raw?: string;
  hallucination_items?: string;
  outcome?: string;
  amount: number | null;
  amount_display: string;
  professional_sanction?: string;
  sanction_types: string[];
  alleged: boolean;
  summary: string;
  source_url: string;
  source_name: string;
  severity: CaseSeverity;
  policy_gap_ids: string[];
  tags: string[];
  lesson?: string;
  enriched?: boolean;
  enriched_at?: string;
  confidence?: string;
  reviewed?: boolean;
  reviewed_at?: string | null;
  wiki_notes?: string;
  related_case_ids?: string[];
  legal_field_primary?: string;
  legal_field_secondary?: string;
}

type CorpusMeta = {
  last_updated: string;
  last_checked?: string;
  last_checked_at?: string;
  latest_record_date?: string;
  countries_tracked: number;
};

const meta = metaRaw as CorpusMeta;
const SLUG_OVERRIDES: Record<string, string> = {
  "-2026-07-16": "badash-v-ohana-2026-07-16",
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function normalize(value: string | null | undefined) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bversus\b/g, " v ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const rawCases = sanctionsRaw as unknown as Omit<LegalRiskCase, "slug">[];
const judgeEnrichment = judgeEnrichmentRaw as {
  records: Record<
    string,
    {
      judge: string;
      judge_role: string;
      evidence: { locator: string; quote: string; source_url: string };
      verification_status: string;
    }
  >;
};
const slugCounts = new Map<string, number>();

export const LEGAL_RISK_CASES: readonly LegalRiskCase[] = rawCases.map((item) => {
  const base = SLUG_OVERRIDES[item.id] || slugify(item.id || `${item.case_name}-${item.date}`);
  const occurrence = (slugCounts.get(base) || 0) + 1;
  slugCounts.set(base, occurrence);
  const judgeRecord = judgeEnrichment.records[item.id];
  return {
    ...item,
    judge: judgeRecord?.judge || item.judge || null,
    judge_role: judgeRecord?.judge_role || item.judge_role || null,
    judge_evidence: judgeRecord
      ? {
          locator: judgeRecord.evidence.locator,
          quote: judgeRecord.evidence.quote,
          source_url: judgeRecord.evidence.source_url,
          verification_status: judgeRecord.verification_status,
        }
      : item.judge_evidence || null,
    slug: occurrence === 1 ? base : `${base}--${occurrence}`,
  };
});

export const US_CASES = LEGAL_RISK_CASES.filter((item) => item.country === "US" && item.state);
export const NON_ALLEGED_CASES = LEGAL_RISK_CASES.filter((item) => !item.alleged);
export const LAST_CHECKED = meta.last_checked || meta.last_updated;
export const LATEST_RECORD_DATE =
  meta.latest_record_date || LEGAL_RISK_CASES[0]?.date || LAST_CHECKED;
// Compatibility alias for existing routes and export filenames.
export const LAST_UPDATED = LAST_CHECKED;
export const COUNTRIES_TRACKED = meta.countries_tracked;

export const CASE_BY_SLUG = new Map(LEGAL_RISK_CASES.map((item) => [item.slug, item]));
const FIRST_SLUG_BY_ID = new Map<string, string>();
for (const item of LEGAL_RISK_CASES) if (!FIRST_SLUG_BY_ID.has(item.id)) FIRST_SLUG_BY_ID.set(item.id, item.slug);

export function getCaseBySlug(slug: string) {
  return CASE_BY_SLUG.get(slug) || null;
}

export function getCaseSlugById(id: string) {
  return FIRST_SLUG_BY_ID.get(id) || SLUG_OVERRIDES[id] || slugify(id);
}

export function formatCaseDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date)
    : value;
}

export function sourcePublisher(item: Pick<LegalRiskCase, "source_url" | "source_name">) {
  try {
    const host = new URL(item.source_url).hostname.replace(/^www\./, "");
    if (host.includes("courtlistener.com")) return "CourtListener / RECAP";
    if (host.includes("damiencharlotin.com")) return "Damien Charlotin case archive";
    if (host.includes("uscourts.gov")) return "United States Courts";
    if (host.includes("supremecourt.gov")) return "Supreme Court of the United States";
    return host;
  } catch {
    return item.source_name || "Linked source";
  }
}

export function sourceTier(item: Pick<LegalRiskCase, "source_url" | "source_name">): { key: SourceTier; label: string; description: string } {
  if (!item.source_url) return { key: "missing", label: "Source link missing", description: "No source URL is recorded." };
  try {
    const host = new URL(item.source_url).hostname.replace(/^www\./, "").toLowerCase();
    const official = host.endsWith(".gov") || host.includes("uscourts.gov") || host.includes("supremecourt.gov") || host.includes("courts.") || host.includes("courtinfo.ca.gov") || host.includes("govinfo.gov");
    if (official) return { key: "official-court", label: "Official court or government source", description: "The recorded link is hosted by a court or government domain." };
    if (["courtlistener.com", "storage.courtlistener.com", "law.justia.com", "docs.justia.com", "canlii.org", "austlii.edu.au", "saflii.org"].some((domain) => host === domain || host.endsWith(`.${domain}`))) return { key: "docket-mirror", label: "Docket or legal-document mirror", description: "The recorded link is hosted by a legal document repository or mirror." };
    if (host.includes("damiencharlotin.com")) return { key: "publisher-archive", label: "Publisher document archive", description: "The recorded document is hosted in the upstream publisher archive." };
    return { key: "secondary-report", label: "Secondary or other linked source", description: "The recorded link is not classified as an official court source or docket mirror." };
  } catch {
    return { key: "secondary-report", label: "Secondary or other linked source", description: "The recorded source URL could not be classified as an official court source." };
  }
}

export function caseSearchText(item: LegalRiskCase) {
  return normalize([
    item.case_name,
    item.court,
    item.state,
    item.country,
    item.circuit,
    item.judge,
    item.ai_tool_used,
    item.summary,
    item.outcome,
    item.source_name,
    item.tags.join(" "),
    item.sanction_types.join(" "),
    item.policy_gap_ids.join(" "),
    item.legal_field_primary,
    item.legal_field_secondary,
  ].filter(Boolean).join(" "));
}

export interface CaseQuery {
  q?: string;
  country?: string;
  state?: string;
  court?: string;
  severity?: string;
  tool?: string;
  failure?: string;
  status?: "all" | "non-alleged" | "adjudicated" | "alleged";
  sort?: "relevance" | "date" | "severity" | "amount";
  order?: "asc" | "desc";
}

const severityRank: Record<CaseSeverity, number> = { "career-ending": 4, high: 3, medium: 2, low: 1 };

function relevanceScore(item: LegalRiskCase, query: string) {
  if (!query) return 0;
  const q = normalize(query);
  const terms = q.split(" ").filter((term) => term.length > 1);
  const name = normalize(item.case_name);
  const court = normalize(item.court);
  const judge = normalize(item.judge);
  const full = caseSearchText(item);
  let score = 0;
  if (name === q) score += 1200;
  if (name.includes(q)) score += 600;
  if (terms.every((term) => name.includes(term))) score += 320;
  if (court.includes(q)) score += 180;
  if (judge.includes(q)) score += 160;
  if (full.includes(q)) score += 100;
  score += terms.filter((term) => full.includes(term)).length * 10;
  return score;
}

export function queryCases(query: CaseQuery = {}) {
  const rawQuery = query.q?.trim() || "";
  const q = normalize(query.q);
  const terms = q.split(" ").filter((term) => term.length > 1);
  const country = normalize(query.country);
  const state = normalize(query.state);
  const court = normalize(query.court);
  const tool = normalize(query.tool);
  const failure = normalize(query.failure);

  const results = LEGAL_RISK_CASES.filter((item) => {
    if ((query.status === "non-alleged" || query.status === "adjudicated") && item.alleged) return false;
    if (query.status === "alleged" && !item.alleged) return false;
    if (country && normalize(item.country) !== country) return false;
    if (state && normalize(item.state) !== state) return false;
    if (court && !matchesCourt(item.court, query.court)) return false;
    if (query.severity && item.severity !== query.severity) return false;
    if (tool && !normalize(`${item.ai_tool_used} ${item.summary}`).includes(tool)) return false;
    if (failure && !normalize(item.tags.join(" ")).includes(failure)) return false;
    if (q) {
      const textMatch = terms.length > 0 && terms.every((term) => caseSearchText(item).includes(term));
      const courtMatch = matchesCourt(item.court, rawQuery);
      if (!textMatch && !courtMatch) return false;
    }
    return true;
  });

  const sort = query.sort || (q ? "relevance" : "date");
  const direction = query.order === "asc" ? -1 : 1;
  return results.sort((a, b) => {
    if (sort === "relevance") return relevanceScore(b, q) - relevanceScore(a, q) || b.date.localeCompare(a.date);
    if (sort === "severity") return direction * (severityRank[b.severity] - severityRank[a.severity] || b.date.localeCompare(a.date));
    if (sort === "amount") {
      if (Boolean(a.amount) !== Boolean(b.amount)) return a.amount ? -1 : 1;
      return direction * ((b.amount || 0) - (a.amount || 0) || b.date.localeCompare(a.date));
    }
    return direction * (b.date.localeCompare(a.date) || a.case_name.localeCompare(b.case_name));
  });
}

export function getRelatedCases(item: LegalRiskCase, limit = 6) {
  const explicit = new Set(item.related_case_ids || []);
  return LEGAL_RISK_CASES
    .filter((candidate) => candidate.slug !== item.slug)
    .map((candidate) => {
      let score = explicit.has(candidate.id) ? 100 : 0;
      if (candidate.court === item.court) score += 12;
      if (candidate.state && candidate.state === item.state) score += 6;
      if (candidate.ai_tool_used === item.ai_tool_used) score += 4;
      score += candidate.tags.filter((tag) => item.tags.includes(tag)).length * 5;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function getRelatedCaseReason(item: LegalRiskCase, candidate: LegalRiskCase) {
  const reasons: string[] = [];
  const sharedTags = candidate.tags.filter((tag) => item.tags.includes(tag));
  if (candidate.court === item.court) reasons.push("same court");
  else if (candidate.state && candidate.state === item.state) reasons.push("same jurisdiction");
  if (sharedTags.length) reasons.push(sharedTags.slice(0, 2).map((tag) => tag.replaceAll("-", " ")).join(" + "));
  if (candidate.ai_tool_used && candidate.ai_tool_used === item.ai_tool_used) reasons.push(`same recorded tool: ${candidate.ai_tool_used}`);
  return reasons.slice(0, 2).join(" · ") || "related public risk pattern";
}

export function getCaseMatchReason(item: LegalRiskCase, query: CaseQuery) {
  if (query.q) {
    const q = normalize(query.q);
    if (normalize(item.case_name).includes(q)) return "Case name match";
    if (normalize(item.court).includes(q)) return "Court match";
    if (normalize(item.judge).includes(q)) return "Judge match";
    if (normalize(item.ai_tool_used).includes(q)) return "Recorded tool match";
    if (normalize(item.tags.join(" ")).includes(q)) return "Failure-mode match";
    return "Full-record text match";
  }
  if (query.court) return `Court filter: ${query.court}`;
  if (query.state) return `State filter: ${query.state}`;
  if (query.failure) return `Failure mode: ${query.failure.replaceAll("-", " ")}`;
  if (query.tool) return `Recorded tool: ${query.tool}`;
  return "Included in the selected corpus view";
}

export interface CaseFallback {
  label: string;
  explanation: string;
  href: string;
  count: number;
}

export function getCaseFallbacks(query: CaseQuery): CaseFallback[] {
  const fallbacks: CaseFallback[] = [];
  const add = (label: string, explanation: string, next: CaseQuery) => {
    const count = queryCases(next).length;
    if (!count) return;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value && value !== "all") params.set(key, String(value));
    fallbacks.push({ label, explanation, href: `/cases?${params}`, count });
  };

  if (query.q && (query.state || query.court || query.tool || query.failure)) add("Keep the exact search, remove filters", "Search the complete corpus for the same terms.", { q: query.q, status: query.status });
  if (query.court && query.state) add(`Broaden to ${query.state}`, "Remove the exact court while preserving the jurisdiction.", { state: query.state, status: query.status, sort: "date" });
  if (query.failure) add("Broaden to the same failure mode", "Compare the pattern across courts and jurisdictions.", { failure: query.failure, status: query.status, sort: "severity" });
  if (query.tool) add("Broaden to the same recorded tool", "Review all tracked records that identify this tool.", { tool: query.tool, status: query.status, sort: "severity" });
  if (query.state) add(`All ${query.state} records`, "Remove the remaining issue and tool constraints.", { state: query.state, status: query.status, sort: "date" });
  if (query.q) {
    const strongest = normalize(query.q).split(" ").filter((term) => term.length > 4)[0];
    if (strongest) add(`Search the broader term “${strongest}”`, "Use the strongest distinctive term from the original query.", { q: strongest, status: query.status });
  }
  add("Landmark verification matters", "Use citation-verification records as an operational anchor.", { failure: "fake-citations", status: "non-alleged", sort: "severity" });
  return fallbacks.filter((item, index, all) => all.findIndex((candidate) => candidate.href === item.href) === index).slice(0, 4);
}

export const CASE_FILTERS = {
  countries: [...new Set(LEGAL_RISK_CASES.map((item) => item.country).filter(Boolean))].sort(),
  states: [...new Set(US_CASES.map((item) => item.state).filter(Boolean))].sort(),
  severities: ["career-ending", "high", "medium", "low"],
  tools: [...new Set(LEGAL_RISK_CASES.map((item) => item.ai_tool_used).filter(Boolean))].sort(),
  failures: [...new Set(LEGAL_RISK_CASES.flatMap((item) => item.tags).filter(Boolean))].sort(),
};
