import type { PublicSanctionCase } from "./types";

export interface CaseFilters {
  jurisdiction?: string;
  state?: string;
  severity?: string;
  aiTool?: string;
  failureTag?: string;
  sanctionType?: string;
  search?: string;
}

export function filterCases(cases: PublicSanctionCase[], filters: CaseFilters): PublicSanctionCase[] {
  const search = filters.search?.trim().toLowerCase();

  return cases.filter((item) => {
    if (filters.jurisdiction && item.jurisdiction !== filters.jurisdiction) {
      return false;
    }
    if (filters.state && item.state !== filters.state) {
      return false;
    }
    if (filters.severity && item.severity !== filters.severity) {
      return false;
    }
    if (
      filters.aiTool &&
      !item.ai_tool_used.toLowerCase().includes(filters.aiTool.toLowerCase())
    ) {
      return false;
    }
    if (filters.failureTag && !item.tags.includes(filters.failureTag)) {
      return false;
    }
    if (filters.sanctionType && !item.sanction_types.includes(filters.sanctionType)) {
      return false;
    }
    if (search) {
      const haystack = [
        item.case_name,
        item.court,
        item.judge,
        item.summary,
        item.ai_tool_used,
        item.tags.join(" "),
        item.policy_gap_ids.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export function limitCases(cases: PublicSanctionCase[], limit: number): PublicSanctionCase[] {
  return cases.slice(0, Math.max(1, limit));
}
