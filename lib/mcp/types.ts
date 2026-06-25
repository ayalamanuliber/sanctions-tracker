export interface PublicSanctionCase {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: string;
  state: string;
  country?: string;
  party?: string;
  judge?: string | null;
  date: string;
  sanction_types: string[];
  amount: number | null;
  amount_display: string;
  severity: string;
  ai_tool_used: string;
  summary: string;
  source_url: string;
  source_name: string;
  tags: string[];
  policy_gap_ids: string[];
  outcome?: string;
  legal_field_primary?: string;
  legal_field_secondary?: string;
}
