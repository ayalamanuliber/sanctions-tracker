import {
  LEGAL_RISK_CASES,
  US_CASES,
  sourceTier,
  type CaseQuery,
  type LegalRiskCase,
} from "@/lib/cases";
import { countryDisplayName } from "@/lib/countries";

export type CountedOption = { value: string; label: string; count: number };
export type AnalyticsFilter = {
  q: string;
  from: string;
  to: string;
  judge: string;
  attribution: string;
  sanction: string;
  sourceTier: string;
  review: string;
};

export function filterAnalyticsCases(
  cases: readonly LegalRiskCase[],
  filters: AnalyticsFilter,
) {
  const text = filters.q.toLowerCase();
  const judge = filters.judge.toLowerCase();

  return cases.filter((item) => {
    if (
      text &&
      ![
        item.case_name,
        item.court,
        item.judge,
        item.ai_tool_used,
        item.outcome,
        ...item.tags,
        ...item.sanction_types,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(text)
    )
      return false;
    if (filters.from && item.date < filters.from) return false;
    if (filters.to && item.date > filters.to) return false;
    if (judge && !(item.judge || "").toLowerCase().includes(judge)) return false;
    if (filters.attribution && attributionStatus(item) !== filters.attribution)
      return false;
    if (filters.sanction && !item.sanction_types.includes(filters.sanction))
      return false;
    if (filters.sourceTier && sourceTier(item).key !== filters.sourceTier)
      return false;
    if (filters.review === "reviewed" && !item.reviewed) return false;
    if (filters.review === "not-reviewed" && item.reviewed) return false;
    return true;
  });
}

export function analyticsCaseQuery(
  params: Record<string, string | string[] | undefined>,
): CaseQuery {
  const read = (key: string) => {
    const entry = params[key];
    return Array.isArray(entry) ? entry[0] || "" : entry || "";
  };
  const status = read("status");
  const validStatus: CaseQuery["status"] =
    status === "all" ||
    status === "non-alleged" ||
    status === "adjudicated" ||
    status === "alleged"
      ? status
      : undefined;

  return {
    q: read("q"),
    country: read("country"),
    state: read("state"),
    severity: read("severity"),
    court: read("court"),
    tool: read("tool"),
    failure: read("failure"),
    status: validStatus,
  };
}

export function analyticsFilters(
  params: Record<string, string | string[] | undefined>,
): AnalyticsFilter {
  const read = (key: string) => {
    const entry = params[key];
    return Array.isArray(entry) ? entry[0] || "" : entry || "";
  };
  return {
    q: read("text"),
    from: read("from"),
    to: read("to"),
    judge: read("judge"),
    attribution: read("attribution"),
    sanction: read("sanction"),
    sourceTier: read("sourceTier"),
    review: read("review"),
  };
}

const LABELS: Record<string, string> = {
  "career-ending": "Career impact",
  high: "High",
  medium: "Medium",
  low: "Low",
  "fake-citations": "Fabricated authorities",
  "fabricated-quotes": "Fabricated or altered quotations",
  "misrepresented-authority": "Misrepresented authority",
  "bar-referral": "Bar or professional referral",
  monetary: "Monetary sanction",
  professional: "Professional discipline",
  warning: "Warning or admonishment",
  "ordered-to-show-cause": "Order to show cause",
  "ordered-to-explain": "Ordered explanation",
  "struck-filing": "Filing or pleading struck",
  "struck-pleading": "Filing or pleading struck",
  "case-dismissed": "Dismissal or adverse disposition",
  "monetary-consequence": "Known monetary consequence",
  "professional-consequence": "Professional or bar consequence",
  "filing-consequence": "Filing or case consequence",
  "court-intervention": "Warning or court intervention",
  "no-recorded-consequence": "No recorded consequence",
  "official-court": "Official court or government",
  "docket-mirror": "Docket or document mirror",
  "publisher-archive": "Publisher document archive",
  "secondary-report": "Secondary or other source",
  missing: "Source link missing",
};

export function humanize(value: string) {
  return (
    LABELS[value] ||
    value
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function countValues(
  values: readonly string[],
  labels: Record<string, string> = {},
) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean))
    counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: labels[value] || humanize(value),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const FILTER_COUNTS = {
  countries: countValues(
    LEGAL_RISK_CASES.map((item) => item.country),
    Object.fromEntries(
      LEGAL_RISK_CASES.map((item) => [
        item.country,
        countryDisplayName(item.country),
      ]),
    ),
  ),
  states: countValues(US_CASES.map((item) => item.state)),
  severities: countValues(LEGAL_RISK_CASES.map((item) => item.severity)),
  failures: countValues(LEGAL_RISK_CASES.flatMap((item) => item.tags)),
  tools: countValues(
    LEGAL_RISK_CASES.map((item) => item.ai_tool_used || "Unidentified"),
  ),
  courts: countValues(
    LEGAL_RISK_CASES.map((item) => item.court || "Court not recorded"),
  ),
  judges: countValues(
    LEGAL_RISK_CASES.map((item) => item.judge || "Judge not recorded"),
  ),
  sanctions: countValues(
    LEGAL_RISK_CASES.flatMap((item) => item.sanction_types).filter(
      (value) => value !== "none-adjudicated",
    ),
  ),
  sourceTiers: countValues(
    LEGAL_RISK_CASES.map((item) => sourceTier(item).key),
  ),
};

function latestDate(cases: readonly LegalRiskCase[]) {
  return cases.reduce(
    (latest, item) => (item.date > latest ? item.date : latest),
    "",
  );
}

function countSince(cases: readonly LegalRiskCase[], days: number) {
  const latestValue = latestDate(cases);
  if (!latestValue) return 0;
  const latest = new Date(`${latestValue}T00:00:00Z`);
  const threshold = new Date(latest.getTime() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return cases.filter((item) => item.date >= threshold).length;
}

export function attributionStatus(item: LegalRiskCase) {
  if (item.alleged) return "allegation-only";
  const tool = (item.ai_tool_used || "").toLowerCase();
  if (!tool || tool === "unidentified") return "tool-unidentified";
  if (tool.includes("implied") || tool.includes("unspecified"))
    return "ai-implied-unspecified";
  return "named-tool-recorded";
}

export function primaryConsequence(item: LegalRiskCase) {
  const sanctions = new Set(item.sanction_types);
  if ((item.amount || 0) > 0 || sanctions.has("monetary"))
    return "monetary-consequence";
  if (sanctions.has("professional") || sanctions.has("bar-referral"))
    return "professional-consequence";
  if (
    sanctions.has("struck-filing") ||
    sanctions.has("struck-pleading") ||
    sanctions.has("case-dismissed")
  )
    return "filing-consequence";
  if (
    sanctions.has("warning") ||
    sanctions.has("ordered-to-show-cause") ||
    sanctions.has("ordered-to-explain")
  )
    return "court-intervention";
  return "no-recorded-consequence";
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

export function buildCorpusAnalytics(cases: readonly LegalRiskCase[]) {
  const total = cases.length;
  const sourceLinked = cases.filter((item) => item.source_url).length;
  const knownAmounts = cases.filter((item) => (item.amount || 0) > 0);
  const amounts = knownAmounts.map((item) => item.amount || 0);
  const annual = countValues(cases.map((item) => item.date.slice(0, 4))).sort(
    (a, b) => a.value.localeCompare(b.value),
  );
  let cumulative = 0;
  const years = annual.map((item) => ({
    ...item,
    newCount: item.count,
    cumulative: (cumulative += item.count),
  }));
  const monthly = countValues(cases.map((item) => item.date.slice(0, 7))).sort(
    (a, b) => a.value.localeCompare(b.value),
  );
  let monthlyCumulative = 0;
  const months = monthly.map((item) => ({
    ...item,
    newCount: item.count,
    cumulative: (monthlyCumulative += item.count),
  }));
  const sourceHosts = countValues(
    cases.map((item) => {
      try {
        return new URL(item.source_url).hostname.replace(/^www\./, "");
      } catch {
        return "Source not linked";
      }
    }),
  );
  const attributionLabels = {
    "named-tool-recorded": "Named tool recorded",
    "ai-implied-unspecified": "AI implied or unspecified",
    "tool-unidentified": "Tool unidentified",
    "allegation-only": "Allegation-only record",
  };
  const sourceTierLabels = Object.fromEntries(
    [
      "official-court",
      "docket-mirror",
      "publisher-archive",
      "secondary-report",
      "missing",
    ].map((key) => [key, humanize(key)]),
  );
  const fieldCoverage = [
    { value: "source", label: "Source link", count: sourceLinked },
    {
      value: "court",
      label: "Court recorded",
      count: cases.filter((item) => item.court).length,
    },
    {
      value: "date",
      label: "Decision date",
      count: cases.filter((item) => item.date).length,
    },
    {
      value: "outcome",
      label: "Outcome text",
      count: cases.filter((item) => item.outcome).length,
    },
    {
      value: "judge",
      label: "Judge recorded",
      count: cases.filter((item) => item.judge).length,
    },
    {
      value: "named-tool",
      label: "Named AI tool",
      count: cases.filter(
        (item) => attributionStatus(item) === "named-tool-recorded",
      ).length,
    },
    {
      value: "amount",
      label: "Known monetary amount",
      count: knownAmounts.length,
    },
  ];

  return {
    total,
    sourceLinked,
    sourceMissing: total - sourceLinked,
    sourceCoverage: total ? Math.round((sourceLinked / total) * 1000) / 10 : 0,
    reviewed: cases.filter((item) => item.reviewed).length,
    nonAlleged: cases.filter((item) => !item.alleged).length,
    alleged: cases.filter((item) => item.alleged).length,
    countries: new Set(cases.map((item) => item.country).filter(Boolean)).size,
    states: new Set(
      cases
        .filter((item) => item.country === "US")
        .map((item) => item.state)
        .filter(Boolean),
    ).size,
    courts: new Set(cases.map((item) => item.court).filter(Boolean)).size,
    knownAmounts: knownAmounts.length,
    knownAmountTotal: amounts.reduce((sum, amount) => sum + amount, 0),
    knownAmountMedian: percentile(amounts, 0.5),
    knownAmountMax: Math.max(...amounts, 0),
    last30: countSince(cases, 30),
    last90: countSince(cases, 90),
    latestDate: latestDate(cases),
    earliestDate: cases.reduce(
      (earliest, item) =>
        !earliest || item.date < earliest ? item.date : earliest,
      "",
    ),
    severity: countValues(cases.map((item) => item.severity)),
    years,
    months,
    failures: countValues(cases.flatMap((item) => item.tags)),
    consequences: countValues(
      cases
        .flatMap((item) => item.sanction_types)
        .filter((value) => value !== "none-adjudicated"),
    ),
    consequenceBuckets: countValues(cases.map(primaryConsequence)),
    courtsRanked: countValues(
      cases.map((item) => item.court || "Court not recorded"),
    ),
    statesRanked: countValues(
      cases
        .filter((item) => item.country === "US")
        .map((item) => item.state || "State not recorded"),
    ),
    countriesRanked: countValues(
      cases.map((item) => item.country || "Country not recorded"),
    ),
    sourceHosts,
    sourceTiers: countValues(
      cases.map((item) => sourceTier(item).key),
      sourceTierLabels,
    ),
    attribution: countValues(cases.map(attributionStatus), attributionLabels),
    tools: countValues(
      cases.map((item) => item.ai_tool_used || "Unidentified"),
    ),
    fieldCoverage,
  };
}

export const CORPUS_ANALYTICS = buildCorpusAnalytics(LEGAL_RISK_CASES);

export function optionLabel(option: CountedOption) {
  return `${option.label} (${option.count.toLocaleString()})`;
}
