import metaRaw from "@/data/meta.json";
import sanctionsRaw from "@/data/sanctions.json";
import { sourceTier } from "@/lib/cases";

export const HOMEPAGE_SEVERITIES = ["career-ending", "high", "medium", "low"] as const;

export type HomepageSeverity = (typeof HOMEPAGE_SEVERITIES)[number];

export interface HomepageCase {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: string;
  state: string;
  country: string;
  judge: string | null;
  date: string;
  sanction_types: string[];
  amount: number | null;
  amount_display: string;
  severity: HomepageSeverity;
  ai_tool_used: string;
  summary: string;
  source_url: string;
  source_name: string;
  tags: string[];
  alleged: boolean;
}

interface RawHomepageCase extends HomepageCase {
  state_display?: string;
  party?: string;
  outcome?: string;
  ai_tool_raw?: string;
  hallucination_items?: string;
  policy_gap_ids?: string[];
  legal_field_primary?: string;
  legal_field_secondary?: string;
}

interface CorpusMeta {
  last_updated: string;
  last_checked?: string;
  latest_record_date?: string;
  countries_tracked: number;
}

export interface DateCoverage {
  earliest: string | null;
  latest: string | null;
}

export type SeverityCounts = Record<HomepageSeverity, number>;

export interface SourceCoverage {
  linked: number;
  total: number;
  missing: number;
  percentage: number;
}

export interface MonetarySummary {
  total: number;
  average: number;
  mattersWithKnownAmount: number;
}

export interface CorpusScopeSummary {
  matters: number;
  dateCoverage: DateCoverage;
  severityCounts: SeverityCounts;
  sourceCoverage: SourceCoverage;
  monetary: MonetarySummary;
}

export interface CanonicalCorpusSummary {
  lastUpdated: string;
  lastChecked: string;
  latestRecordDate: string;
  countriesTracked: number;
  global: CorpusScopeSummary;
  unitedStates: CorpusScopeSummary & {
    nonAllegedRecords: number;
    allegedOnlyMatters: number;
    statesAndDistrict: number;
  };
}

export interface HomepageSummary {
  totalCases: number;
  usCases: number;
  jurisdictions: number;
  courts: number;
  sourceCoverageCount: number;
  sourceCoveragePct: number;
  lastUpdated: string;
  lastChecked: string;
  latestRecordDate: string;
  knownMonetaryTotal: number;
  averageKnownSanction: number;
  severityCounts: SeverityCounts;
  dateCoverage: DateCoverage;
}

export interface HomepageEvidenceSummary {
  uniqueMatterNames: number;
  nonAllegedRecords: number;
  allegedMatters: number;
  mattersWithKnownAmount: number;
  reviewedRecords: number;
  sourceMissing: number;
  sourceTiers: Array<{ key: string; label: string; count: number }>;
  yearlyCounts: Array<{ year: string; count: number }>;
  failureModes: Array<{ label: string; count: number }>;
  sourcePublishers: Array<{ label: string; count: number }>;
}

const DEFAULT_SEARCH_LIMIT = 12;
const MAX_SEARCH_LIMIT = 50;
const DEFAULT_RECENT_SIGNIFICANT_LIMIT = 6;
const SIGNIFICANCE_WINDOW_DAYS = 365;
const DAY_MS = 86_400_000;

const meta = metaRaw as CorpusMeta;
const ALL_CASES = (sanctionsRaw as unknown as RawHomepageCase[])
  .filter(isHomepageCase)
  .map(toHomepageCase);

function isHomepageCase(item: RawHomepageCase): boolean {
  return (
    Boolean(item?.id && item.case_name && item.date) &&
    HOMEPAGE_SEVERITIES.includes(item.severity) &&
    Array.isArray(item.sanction_types) &&
    Array.isArray(item.tags)
  );
}

function toHomepageCase(item: RawHomepageCase): HomepageCase {
  return {
    id: item.id,
    case_name: item.case_name,
    court: item.court,
    circuit: item.circuit,
    jurisdiction: item.jurisdiction,
    state: item.state,
    country: item.country,
    date: item.date,
    judge: item.judge || null,
    severity: item.severity,
    amount: item.amount,
    amount_display: item.amount_display,
    source_url: item.source_url,
    source_name: item.source_name,
    ai_tool_used: item.ai_tool_used,
    summary: item.summary,
    tags: item.tags,
    sanction_types: item.sanction_types,
    alleged: item.alleged,
  };
}

function emptySeverityCounts(): SeverityCounts {
  return { "career-ending": 0, high: 0, medium: 0, low: 0 };
}

export function countCasesBySeverity(cases: readonly HomepageCase[]): SeverityCounts {
  return cases.reduce<SeverityCounts>((counts, item) => {
    counts[item.severity] += 1;
    return counts;
  }, emptySeverityCounts());
}

export function calculateSourceCoverage(cases: readonly HomepageCase[]): SourceCoverage {
  const total = cases.length;
  const linked = cases.filter((item) => item.source_url.trim().length > 0).length;

  return {
    linked,
    total,
    missing: total - linked,
    percentage: total === 0 ? 0 : Math.round((linked / total) * 1_000) / 10,
  };
}

export function calculateMonetarySummary(cases: readonly HomepageCase[]): MonetarySummary {
  const knownAmounts = cases
    .map((item) => item.amount)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount) && amount > 0);
  const total = knownAmounts.reduce((sum, amount) => sum + amount, 0);

  return {
    total,
    average: knownAmounts.length === 0 ? 0 : Math.round(total / knownAmounts.length),
    mattersWithKnownAmount: knownAmounts.length,
  };
}

function calculateDateCoverage(cases: readonly HomepageCase[]): DateCoverage {
  if (cases.length === 0) return { earliest: null, latest: null };

  let earliest = cases[0].date;
  let latest = cases[0].date;
  for (const item of cases) {
    if (item.date < earliest) earliest = item.date;
    if (item.date > latest) latest = item.date;
  }

  return { earliest, latest };
}

function summarizeScope(cases: readonly HomepageCase[]): CorpusScopeSummary {
  return {
    matters: cases.length,
    dateCoverage: calculateDateCoverage(cases),
    severityCounts: countCasesBySeverity(cases),
    sourceCoverage: calculateSourceCoverage(cases),
    monetary: calculateMonetarySummary(cases),
  };
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bversus\b/g, " v ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchableFields(item: HomepageCase): string[] {
  return [
    item.case_name,
    item.court,
    item.judge || "",
    item.jurisdiction,
    item.state,
    item.country,
    item.circuit || "",
    item.ai_tool_used,
    item.source_name,
    item.source_url,
    item.tags.join(" "),
    item.summary,
  ];
}

function searchScore(item: HomepageCase, normalizedQuery: string, terms: readonly string[]): number {
  const name = normalizeSearch(item.case_name);
  const court = normalizeSearch(item.court);
  const judge = normalizeSearch(item.judge || "");
  const location = normalizeSearch(
    [item.jurisdiction, item.state, item.country, item.circuit].filter(Boolean).join(" "),
  );
  const tool = normalizeSearch(item.ai_tool_used);
  const failures = normalizeSearch([...item.tags, item.summary].join(" "));
  const full = normalizeSearch(searchableFields(item).join(" "));

  let score = 0;
  if (name === normalizedQuery) score += 1_000;
  if (name.includes(normalizedQuery)) score += 500;
  if (terms.every((term) => name.includes(term))) score += 300;
  if (court.includes(normalizedQuery)) score += 140;
  if (judge && judge.includes(normalizedQuery)) score += 130;
  if (location.includes(normalizedQuery)) score += 100;
  if (tool.includes(normalizedQuery)) score += 90;
  if (failures.includes(normalizedQuery)) score += 80;
  score += terms.filter((term) => full.includes(term)).length * 5;

  return score;
}

function severityWeight(severity: HomepageSeverity): number {
  return { "career-ending": 400, high: 250, medium: 100, low: 25 }[severity];
}

function latestCorpusTimestamp(cases: readonly HomepageCase[]): number {
  const latest = calculateDateCoverage(cases).latest;
  return latest ? Date.parse(`${latest}T00:00:00Z`) : 0;
}

export function homepageSignificanceScore(item: HomepageCase, latestTimestamp: number): number {
  const caseTimestamp = Date.parse(`${item.date}T00:00:00Z`);
  const ageDays = Number.isFinite(caseTimestamp) && latestTimestamp > 0
    ? Math.max(0, (latestTimestamp - caseTimestamp) / DAY_MS)
    : SIGNIFICANCE_WINDOW_DAYS;
  const recency = Math.max(0, SIGNIFICANCE_WINDOW_DAYS - ageDays);
  const monetary = item.amount && item.amount > 0 ? Math.min(160, Math.log10(item.amount + 1) * 32) : 0;
  const professionalImpact = item.sanction_types.some((type) =>
    ["professional", "bar-referral", "case-dismissed", "struck-pleading"].includes(type),
  )
    ? 90
    : 0;
  const sourceBacked = item.source_url ? 15 : 0;

  return severityWeight(item.severity) + recency + monetary + professionalImpact + sourceBacked;
}

export function rankHomepageCases(cases: readonly HomepageCase[]): HomepageCase[] {
  const latestTimestamp = latestCorpusTimestamp(cases);

  return [...cases].sort(
    (a, b) =>
      homepageSignificanceScore(b, latestTimestamp) - homepageSignificanceScore(a, latestTimestamp) ||
      b.date.localeCompare(a.date) ||
      a.case_name.localeCompare(b.case_name),
  );
}

export function getRecentSignificantMatters(
  cases: readonly HomepageCase[] = US_HOMEPAGE_CASES,
  limit = DEFAULT_RECENT_SIGNIFICANT_LIMIT,
): HomepageCase[] {
  const boundedLimit = Math.min(Math.max(1, Math.floor(limit)), MAX_SEARCH_LIMIT);
  const latestTimestamp = latestCorpusTimestamp(cases);
  const cutoff = latestTimestamp - SIGNIFICANCE_WINDOW_DAYS * DAY_MS;
  const significant = cases.filter((item) => {
    const timestamp = Date.parse(`${item.date}T00:00:00Z`);
    const hasMaterialOutcome =
      item.severity === "career-ending" ||
      item.severity === "high" ||
      (item.amount ?? 0) > 0 ||
      item.sanction_types.some((type) => ["professional", "bar-referral", "case-dismissed", "struck-pleading"].includes(type));

    return Number.isFinite(timestamp) && timestamp >= cutoff && hasMaterialOutcome;
  });

  return rankHomepageCases(significant).slice(0, boundedLimit);
}

export function searchHomepageCases(query: string, limit = DEFAULT_SEARCH_LIMIT): HomepageCase[] {
  const cases = GLOBAL_HOMEPAGE_CASES;
  const normalizedQuery = normalizeSearch(query);
  const boundedLimit = Math.min(Math.max(1, Math.floor(limit)), MAX_SEARCH_LIMIT);

  if (!normalizedQuery) return cases.slice(0, boundedLimit);

  const terms = normalizedQuery.split(" ").filter((term) => term.length > 1);
  const latestTimestamp = latestCorpusTimestamp(cases);
  return cases
    .map((item) => ({ item, score: searchScore(item, normalizedQuery, terms) }))
    .filter(({ item, score }) => {
      if (score <= 0) return false;
      const full = normalizeSearch(searchableFields(item).join(" "));
      return full.includes(normalizedQuery) || terms.every((term) => full.includes(term));
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        homepageSignificanceScore(b.item, latestTimestamp) - homepageSignificanceScore(a.item, latestTimestamp) ||
        b.item.date.localeCompare(a.item.date),
    )
    .slice(0, boundedLimit)
    .map(({ item }) => item);
}

export function searchHomepageSources(query: string, limit = DEFAULT_SEARCH_LIMIT): HomepageCase[] {
  const normalizedQuery = normalizeSearch(query);
  const boundedLimit = Math.min(Math.max(1, Math.floor(limit)), MAX_SEARCH_LIMIT);
  const linkedCases = GLOBAL_HOMEPAGE_CASES.filter((item) => item.source_url.trim().length > 0);

  if (!normalizedQuery) return linkedCases.slice(0, boundedLimit);

  const terms = normalizedQuery.split(" ").filter((term) => term.length > 1);
  return linkedCases
    .map((item) => {
      const source = normalizeSearch(item.source_name);
      const url = normalizeSearch(item.source_url);
      const title = normalizeSearch(item.case_name);
      const court = normalizeSearch(item.court);
      const full = [source, url, title, court].join(" ");
      let score = 0;
      if (source === normalizedQuery) score += 1_000;
      if (source.includes(normalizedQuery)) score += 600;
      if (url.includes(normalizedQuery)) score += 450;
      if (title.includes(normalizedQuery)) score += 300;
      if (court.includes(normalizedQuery)) score += 180;
      score += terms.filter((term) => full.includes(term)).length * 10;
      return { item, score, full };
    })
    .filter(({ score, full }) => score > 0 && (full.includes(normalizedQuery) || terms.every((term) => full.includes(term))))
    .sort((a, b) => b.score - a.score || b.item.date.localeCompare(a.item.date))
    .slice(0, boundedLimit)
    .map(({ item }) => item);
}

function displayPublisher(item: HomepageCase) {
  try {
    const host = new URL(item.source_url).hostname.replace(/^www\./, "");
    if (host.includes("courtlistener.com")) return "CourtListener / RECAP";
    if (host.includes("damiencharlotin.com")) return "Damien Charlotin case archive";
    if (host.includes("uscourts.gov")) return "United States Courts";
    if (host.includes("supremecourt.gov")) return "Supreme Court of the United States";
    return host || item.source_name;
  } catch {
    return item.source_name || "Linked source";
  }
}

function countValues(values: readonly string[]) {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const usCases = ALL_CASES.filter((item) => item.country === "US");
const usAdjudicatedCases = usCases.filter((item) => !item.alleged);

export const US_HOMEPAGE_CASES: readonly HomepageCase[] = rankHomepageCases(usAdjudicatedCases);
export const GLOBAL_HOMEPAGE_CASES: readonly HomepageCase[] = rankHomepageCases(ALL_CASES);

export const CORPUS_SUMMARY: CanonicalCorpusSummary = {
  lastUpdated: meta.last_checked || meta.last_updated,
  lastChecked: meta.last_checked || meta.last_updated,
  latestRecordDate: meta.latest_record_date || ALL_CASES[0]?.date || meta.last_updated,
  countriesTracked: meta.countries_tracked,
  global: summarizeScope(ALL_CASES),
  unitedStates: {
    ...summarizeScope(usAdjudicatedCases),
    nonAllegedRecords: usAdjudicatedCases.length,
    allegedOnlyMatters: usCases.length - usAdjudicatedCases.length,
    statesAndDistrict: new Set(usCases.map((item) => item.state).filter(Boolean)).size,
  },
};

export const US_SEVERITY_COUNTS: SeverityCounts = CORPUS_SUMMARY.unitedStates.severityCounts;
export const US_SOURCE_COVERAGE: SourceCoverage = CORPUS_SUMMARY.unitedStates.sourceCoverage;
export const US_MONETARY_SUMMARY: MonetarySummary = CORPUS_SUMMARY.unitedStates.monetary;
export const RECENT_SIGNIFICANT_MATTERS: readonly HomepageCase[] = getRecentSignificantMatters();

export const homepageSummary: HomepageSummary = {
  totalCases: CORPUS_SUMMARY.global.matters,
  usCases: usCases.length,
  jurisdictions: new Set(usCases.map((item) => item.state).filter(Boolean)).size,
  courts: new Set(usCases.map((item) => item.court).filter(Boolean)).size,
  sourceCoverageCount: CORPUS_SUMMARY.global.sourceCoverage.linked,
  sourceCoveragePct: CORPUS_SUMMARY.global.sourceCoverage.percentage,
  lastUpdated: CORPUS_SUMMARY.lastUpdated,
  lastChecked: CORPUS_SUMMARY.lastChecked,
  latestRecordDate: CORPUS_SUMMARY.latestRecordDate,
  knownMonetaryTotal: CORPUS_SUMMARY.global.monetary.total,
  averageKnownSanction: CORPUS_SUMMARY.global.monetary.average,
  severityCounts: CORPUS_SUMMARY.global.severityCounts,
  dateCoverage: CORPUS_SUMMARY.global.dateCoverage,
};

const failureLabels: Array<[string, string]> = [
  ["fake-citations", "Fake or unverifiable citations"],
  ["misrepresented-authority", "Authority does not support proposition"],
  ["fabricated-quotes", "Fabricated or mismatched quotations"],
  ["bar-referral", "Bar or disciplinary referral"],
];

export const homepageEvidenceSummary: HomepageEvidenceSummary = {
  uniqueMatterNames: new Set(ALL_CASES.map((item) => normalizeSearch(item.case_name))).size,
  nonAllegedRecords: ALL_CASES.filter((item) => !item.alleged).length,
  allegedMatters: ALL_CASES.filter((item) => item.alleged).length,
  mattersWithKnownAmount: CORPUS_SUMMARY.global.monetary.mattersWithKnownAmount,
  reviewedRecords: (sanctionsRaw as unknown as Array<{ reviewed?: boolean }>).filter((item) => item.reviewed).length,
  sourceMissing: CORPUS_SUMMARY.global.sourceCoverage.missing,
  sourceTiers: (() => {
    const labels = new Map<string, string>();
    const values = ALL_CASES.map((item) => {
      const tier = sourceTier(item);
      labels.set(tier.key, tier.label);
      return tier.key;
    });
    return countValues(values).map(([key, count]) => ({ key, label: labels.get(key) || key, count }));
  })(),
  yearlyCounts: countValues(ALL_CASES.map((item) => item.date.slice(0, 4)))
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year)),
  failureModes: failureLabels.map(([tag, label]) => ({
    label,
    count: ALL_CASES.filter((item) => item.tags.includes(tag)).length,
  })),
  sourcePublishers: countValues(
    ALL_CASES.filter((item) => item.source_url).map(displayPublisher),
  ).slice(0, 4).map(([label, count]) => ({ label, count })),
};

export const recentSignificantCases: readonly HomepageCase[] = RECENT_SIGNIFICANT_MATTERS;
