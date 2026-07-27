import rawCaseIntelligence from "@/data/case-intelligence.json";

export type CaseIntelligence = {
  id: string;
  slug: string;
  summary: string;
  why_it_matters: string;
  judicial_reasoning: string | null;
  decision_context: string;
  practical_implications: string[];
  evidence_boundary: string;
  verified_fields: string[] | Record<string, string>;
  source: { url: string; name: string; tier: string };
  publication: { ready: boolean; agent_status: string; blocked_reason: string | null };
};

const CASE_INTELLIGENCE = rawCaseIntelligence as unknown as CaseIntelligence[];
const BY_ID = new Map(CASE_INTELLIGENCE.map((item) => [item.id, item]));
const BY_SLUG = new Map(CASE_INTELLIGENCE.map((item) => [item.slug, item]));

export function getCaseIntelligence(id: string) {
  return BY_ID.get(id) || null;
}

export function getCaseIntelligenceBySlug(slug: string) {
  return BY_SLUG.get(slug) || null;
}

export function caseIntelligenceCount() {
  return CASE_INTELLIGENCE.length;
}

export function conciseCaseAnswer(value: string, maxLength = 700) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const marker = normalized.search(/AI Use|Hallucination Details|Ruling\/Sanction|Key Judicial Reasoning/);
  const lead = marker > 80 ? normalized.slice(0, marker).trim() : normalized;
  if (lead.length <= maxLength) return lead;
  const excerpt = lead.slice(0, maxLength);
  const sentenceEnd = Math.max(excerpt.lastIndexOf(". "), excerpt.lastIndexOf("; "));
  return `${excerpt.slice(0, sentenceEnd > 220 ? sentenceEnd + 1 : maxLength).trim()}…`;
}
