export interface SanctionCase {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: "federal" | "state";
  state: string;
  judge: string;
  date: string;
  sanction_types: string[];
  amount: number | null;
  amount_display: string;
  severity: "career-ending" | "high" | "medium" | "low";
  ai_tool_used: string;
  summary: string;
  source_url: string;
  source_name: string;
  tags: string[];
  policy_gap_ids: string[];
}

export interface GlobalStats {
  total_cases_tracked: number;
  total_cases_widely_cited: number;
  daily_growth_rate: string;
  q1_2026_sanctions_usd: number;
  single_day_record: number;
  single_day_record_date: string;
  largest_single_sanction: number;
  largest_single_case: string;
  courts_with_disclosure_rules: number;
  aba_opinion: string;
  aba_opinion_date: string;
  tracker_source: string;
  tracker_url: string;
  last_updated: string;
  data_source: string;
}

export type PolicyCategory =
  | "filing-safeguards"
  | "disclosure-compliance"
  | "tool-governance"
  | "training-protocols"
  | "client-governance"
  | "data-security"
  | "accountability"
  | "incident-response";

export interface PolicyQuestion {
  id: string;
  question: string;
  category: PolicyCategory;
  proof_snippet: string;
  risk_weight: number;
  why: string;
}

export interface RiskAssessment {
  total_questions: number;
  yes_count: number;
  no_count: number;
  score_percentage: number;
  risk_level: "critical" | "high" | "moderate" | "low";
  gaps: PolicyQuestion[];
  exposed_categories: PolicyCategory[];
}
