import { matchesTool } from "@/lib/filtering";
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

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bversus\b/g, " v ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchableText(item: PublicSanctionCase): string {
  return [
    item.case_name,
    item.court,
    item.judge,
    item.summary,
    item.ai_tool_used,
    item.tags.join(" "),
    item.policy_gap_ids.join(" "),
    item.source_name,
    item.source_url,
  ].join(" ");
}

function searchScore(item: PublicSanctionCase, search: string, searchTerms: string[]): number {
  const name = normalizeSearch(item.case_name);
  const court = normalizeSearch(item.court);
  const source = normalizeSearch(`${item.source_name || ""} ${item.source_url || ""}`);
  const full = normalizeSearch(searchableText(item));

  let score = 0;
  if (name === search) score += 500;
  if (name.includes(search)) score += 300;
  if (searchTerms.every((term) => name.includes(term))) score += 200;
  if (court.includes(search)) score += 60;
  if (source.includes(search)) score += 30;
  if (full.includes(search)) score += 20;
  score += searchTerms.filter((term) => full.includes(term)).length;

  return score;
}

export function filterCases(cases: PublicSanctionCase[], filters: CaseFilters): PublicSanctionCase[] {
  const search = normalizeSearch(filters.search || "");
  const searchTerms = search.split(" ").filter((term) => term.length > 1);

  const filtered = cases.filter((item) => {
    if (filters.jurisdiction && item.jurisdiction !== filters.jurisdiction) {
      return false;
    }
    if (filters.state && item.state !== filters.state) {
      return false;
    }
    if (filters.severity && item.severity !== filters.severity) {
      return false;
    }
    if (filters.aiTool && !matchesTool(item.ai_tool_used, filters.aiTool, item.summary)) {
      return false;
    }
    if (filters.failureTag && !item.tags.includes(filters.failureTag)) {
      return false;
    }
    if (filters.sanctionType && !item.sanction_types.includes(filters.sanctionType)) {
      return false;
    }
    if (searchTerms.length > 0) {
      const normalizedHaystack = normalizeSearch(searchableText(item));

      if (!normalizedHaystack.includes(search) && !searchTerms.every((term) => normalizedHaystack.includes(term))) {
        return false;
      }
    }

    return true;
  });

  if (searchTerms.length === 0) {
    return filtered;
  }

  return filtered.sort(
    (a, b) => searchScore(b, search, searchTerms) - searchScore(a, search, searchTerms) || b.date.localeCompare(a.date),
  );
}

export function limitCases(cases: PublicSanctionCase[], limit: number): PublicSanctionCase[] {
  return cases.slice(0, Math.max(1, limit));
}
