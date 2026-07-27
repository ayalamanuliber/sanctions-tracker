import readinessRaw from "@/data/publication-readiness-index.json";

export type PublicationTier =
  | "index-ready"
  | "enrichment-ready"
  | "research-only";

type ReadinessEntry = {
  tier: PublicationTier;
  score: number;
};

type ReadinessIndex = {
  total_cases: number;
  tiers: Record<PublicationTier, number>;
  by_slug: Record<string, ReadinessEntry>;
};

const readiness = readinessRaw as ReadinessIndex;

export const PUBLICATION_COUNTS = Object.freeze(readiness.tiers);
export const PUBLICATION_CASE_COUNT = readiness.total_cases;

export function getPublicationReadiness(slug: string): ReadinessEntry {
  return readiness.by_slug[slug] || { tier: "research-only", score: 0 };
}

export function isIndexEligible(slug: string) {
  return getPublicationReadiness(slug).tier === "index-ready";
}

export function indexEligibleSlugs() {
  return Object.entries(readiness.by_slug)
    .filter(([, entry]) => entry.tier === "index-ready")
    .map(([slug]) => slug);
}
