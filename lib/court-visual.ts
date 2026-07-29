import type { CorpusEntity } from "@/lib/entity-pages";

export const COURT_VISUAL_REVISION = "2026-07-28-v1";

export type CourtVisualDescriptor = {
  classification:
    | "Federal district"
    | "Federal bankruptcy"
    | "Federal appellate"
    | "State appellate"
    | "State or local"
    | "International"
    | "Other public body";
  scope: string;
  jurisdiction: string;
  code: string;
  caption: string;
  ariaLabel: string;
};

function mode(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw?.trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]?.[0] || "";
}

function courtClass(label: string, jurisdiction: string, country: string) {
  const value = label.toLowerCase();
  if (/\bbankrupt/.test(value)) return "Federal bankruptcy" as const;
  if (/\b(?:circuit|cir\.|court of appeals)\b/.test(value) && jurisdiction === "federal")
    return "Federal appellate" as const;
  if (
    jurisdiction === "federal" &&
    /(?:^|\s)(?:[nsewmc]\.?\s*d\.?|district)(?:\s|$)/i.test(label)
  )
    return "Federal district" as const;
  if (/\b(?:appellate|appeal|supreme court)\b/.test(value) && country === "US")
    return "State appellate" as const;
  if (jurisdiction === "state" || (country === "US" && /\b(?:county|municipal|superior)\b/.test(value)))
    return "State or local" as const;
  if (country && country !== "US") return "International" as const;
  return "Other public body" as const;
}

function visualCode(label: string) {
  const acronym = label.match(/\b[A-Z](?:\.[A-Z]){1,4}\.?/g)?.[0];
  if (acronym) return acronym.replaceAll(".", "").slice(0, 4);
  return label
    .split(/[\s/-]+/)
    .filter((part) => part && !/^(?:of|the|for|and|court)$/i.test(part))
    .slice(0, 4)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 4) || "CT";
}

export function getCourtVisual(entity: CorpusEntity): CourtVisualDescriptor {
  const state = mode(entity.records.map((record) => record.state));
  const country = mode(entity.records.map((record) => record.country));
  const jurisdiction = mode(entity.records.map((record) => record.jurisdiction));
  const scope = state || country || "Scope not classified";
  const classification = courtClass(entity.label, jurisdiction, country);
  const caption =
    `AI Vortex illustrated court-scope marker for ${entity.label}, derived from structured corpus metadata. ` +
    "Not a courthouse photograph, official seal, or map of court locations.";
  return {
    classification,
    scope,
    jurisdiction: jurisdiction || "Not classified",
    code: visualCode(entity.label),
    caption,
    ariaLabel: `${classification} court-scope marker for ${entity.label}; recorded scope ${scope}.`,
  };
}

