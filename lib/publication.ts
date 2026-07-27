import readinessRaw from "@/data/publication-readiness-index.json";
import { getCaseIntelligenceBySlug } from "@/lib/case-intelligence";

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
  const record = getCaseIntelligenceBySlug(slug);
  const evidenceHold = [
    "primary-document-limited",
    "secondary-source-only",
    "metadata-only",
    "source-unavailable",
  ].includes(
    record?.evidence_review?.status || "",
  );
  return getPublicationReadiness(slug).tier === "index-ready" &&
    record?.publication.ready !== false &&
    !evidenceHold;
}

export function indexEligibleSlugs() {
  return Object.entries(readiness.by_slug)
    .filter(([slug]) => isIndexEligible(slug))
    .map(([slug]) => slug);
}
