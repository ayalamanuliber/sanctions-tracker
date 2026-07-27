import rawCaseIntelligence from "@/data/case-intelligence.json";

export type CaseIntelligence = {
  id: string;
  slug: string;
  summary: string;
  why_it_matters: string;
  judicial_reasoning: string | null;
  practical_implications: string[];
  evidence_boundary: string;
  verified_fields: string[] | Record<string, string>;
  source: { url: string; name: string; tier: string };
  publication: { ready: boolean; agent_status: string; blocked_reason: string | null };
};

const CASE_INTELLIGENCE = rawCaseIntelligence as unknown as CaseIntelligence[];
const BY_ID = new Map(CASE_INTELLIGENCE.map((item) => [item.id, item]));

export function getCaseIntelligence(id: string) {
  return BY_ID.get(id) || null;
}

export function caseIntelligenceCount() {
  return CASE_INTELLIGENCE.length;
}
