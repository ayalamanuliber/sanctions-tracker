import type { LegalRiskCase } from "@/lib/cases";

export function cleanImportedText(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .replace(/(AI Use|Hallucination Details|Ruling\/Sanction|Key Judicial Reasoning)(?=[A-Z])/g, "$1: ")
    .trim();
}

export function excerptAtWordBoundary(value: string, maxLength: number) {
  const clean = cleanImportedText(value);
  if (clean.length <= maxLength) return clean;
  const candidate = clean.slice(0, Math.max(1, maxLength - 1));
  const lastSpace = candidate.lastIndexOf(" ");
  const cutoff = lastSpace > Math.min(80, maxLength / 2) ? lastSpace : candidate.length;
  return `${candidate.slice(0, cutoff).trimEnd()}…`;
}

export function caseSeoTitle(item: Pick<LegalRiskCase, "case_name" | "date">) {
  const caseName = excerptAtWordBoundary(item.case_name, 43);
  return `${caseName} — ${item.date} | AI Vortex`;
}

