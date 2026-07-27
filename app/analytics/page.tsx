import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Layers3,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import AnalyticsGrowthChart from "@/components/AnalyticsGrowthChart";
import CopyViewButton from "@/components/CopyViewButton";
import CorpusIntelligence from "@/components/CorpusIntelligence";
import ResearchShell from "@/components/ResearchShell";
import ScrollRestoringForm from "@/components/ScrollRestoringForm";
import shell from "@/components/ResearchShell.module.css";
import { publicUrl } from "@/lib/site";
import {
  LEGAL_RISK_CASES,
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  formatCaseDate,
  queryCases,
  sourceTier,
  type LegalRiskCase,
  type CaseQuery,
} from "@/lib/cases";
import {
  CORPUS_ANALYTICS,
  FILTER_COUNTS,
  type AnalyticsFilter,
  attributionStatus,
  buildCorpusAnalytics,
  filterAnalyticsCases,
  humanize,
  optionLabel,
  primaryConsequence,
  type CountedOption,
} from "@/lib/corpus-analytics";
import styles from "./analytics.module.css";

export const metadata: Metadata = {
  title: "Legal AI Risk Analytics | AI Vortex",
  description:
    "Explore the composition, coverage, trends, courts, jurisdictions, and limitations of the AI Vortex public legal AI risk corpus.",
  alternates: { canonical: publicUrl("/analytics") },
};

type Params = Record<string, string | string[] | undefined>;
function value(params: Params, key: string) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] || "" : entry || "";
}
function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
function casesHref(query: Partial<CaseQuery> = {}) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    const entry = raw?.toString().trim();
    if (entry && entry !== "all") params.set(key, entry);
  }
  if (!params.has("sort")) params.set("sort", "date");
  return `/cases?${params.toString()}`;
}

type CrossDimension =
  | "failure"
  | "consequence"
  | "severity"
  | "attribution"
  | "source-tier";

function dimensionValues(item: LegalRiskCase, dimension: CrossDimension) {
  if (dimension === "failure") return item.tags.length ? item.tags : ["unclassified"];
  if (dimension === "consequence") return [primaryConsequence(item)];
  if (dimension === "severity") return [item.severity];
  if (dimension === "attribution") return [attributionStatus(item)];
  return [sourceTier(item).key];
}

function crossTab(
  cases: readonly LegalRiskCase[],
  rowDimension: CrossDimension,
  columnDimension: CrossDimension,
) {
  const rowCounts = new Map<string, number>();
  const columnCounts = new Map<string, number>();
  const cells = new Map<string, number>();
  for (const item of cases) {
    const rows = [...new Set(dimensionValues(item, rowDimension))];
    const columns = [...new Set(dimensionValues(item, columnDimension))];
    for (const row of rows) rowCounts.set(row, (rowCounts.get(row) || 0) + 1);
    for (const column of columns)
      columnCounts.set(column, (columnCounts.get(column) || 0) + 1);
    for (const row of rows)
      for (const column of columns) {
        const key = `${row}\u0000${column}`;
        cells.set(key, (cells.get(key) || 0) + 1);
      }
  }
  const top = (counts: Map<string, number>) =>
    [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  return { rows: top(rowCounts), columns: top(columnCounts), cells };
}

function matrixFilterKey(dimension: CrossDimension) {
  return {
    failure: "failure",
    consequence: "sanction",
    severity: "severity",
    attribution: "attribution",
    "source-tier": "sourceTier",
  }[dimension];
}

function Donut({
  items,
  total,
  tone = "blue",
}: {
  items: CountedOption[];
  total: number;
  tone?: "blue" | "mixed";
}) {
  const colors =
    tone === "mixed"
      ? ["#1767d2", "#e7a11b", "#5d8fd2", "#a9c8ef", "#dce7f4"]
      : ["#1767d2", "#4d8fe3", "#83afe6", "#b8d0ed", "#dce7f4"];
  const positiveItems = items.filter((item) => item.count > 0);
  const minimumAngle = 2;
  const smallItems = positiveItems.filter(
    (item) => total && (item.count / total) * 360 < minimumAngle,
  );
  const reservedAngle = smallItems.length * minimumAngle;
  const naturalLargeAngle = positiveItems
    .filter((item) => !smallItems.includes(item))
    .reduce((sum, item) => sum + (total ? (item.count / total) * 360 : 0), 0);
  const largeScale = naturalLargeAngle
    ? (360 - reservedAngle) / naturalLargeAngle
    : 1;
  const polarPoint = (radius: number, angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  };
  const ringSegment = (start: number, end: number) => {
    const safeEnd = Math.min(end, start + 359.999);
    const outerStart = polarPoint(48, start);
    const outerEnd = polarPoint(48, safeEnd);
    const innerEnd = polarPoint(34, safeEnd);
    const innerStart = polarPoint(34, start);
    const largeArc = safeEnd - start > 180 ? 1 : 0;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A 48 48 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A 34 34 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  };
  const segments = positiveItems.reduce<Array<{ item: CountedOption; start: number; end: number }>>((result, item) => {
    const start = result.at(-1)?.end ?? 0;
    const naturalAngle = total ? (item.count / total) * 360 : 0;
    const end =
      start +
      (naturalAngle < minimumAngle ? minimumAngle : naturalAngle * largeScale);
    return [...result, { item, start, end }];
  }, []);
  return (
    <div className={styles.donutWrap}>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${total.toLocaleString()} records distributed across ${items.length} categories`}
      >
        <circle cx="50" cy="50" r="48" fill="#edf2f7" />
        <circle cx="50" cy="50" r="34" fill="#fff" />
        {segments.map(({ item, start, end }, index) => (
          <path
            key={item.value}
            d={ringSegment(start, end)}
            fill={colors[index % colors.length]}
            stroke="#fff"
            strokeWidth=".35"
            strokeLinejoin="round"
          />
        ))}
        <text x="50" y="48" textAnchor="middle" className={styles.donutNumber}>
          {total.toLocaleString()}
        </text>
        <text x="50" y="60" textAnchor="middle" className={styles.donutLabel}>
          records
        </text>
      </svg>
      <div className={styles.donutLegend}>
        {items.map((item, index) => (
          <div key={item.value}>
            <i
              style={
                {
                  "--legend-color": colors[index % colors.length],
                } as CSSProperties
              }
            />
            <span>{item.label}</span>
            <b>{item.count.toLocaleString()}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricBars({
  items,
  total,
  linkKey,
  baseQuery = {},
}: {
  items: CountedOption[];
  total: number;
  linkKey?: "failure" | "court" | "state" | "tool" | "q";
  baseQuery?: Partial<CaseQuery>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className={styles.metricBars}>
      {items.map((item) => {
        const content = (
          <>
            <div>
              <span>{item.label}</span>
              <b>
                {item.count.toLocaleString()}{" "}
                <small>
                  {total ? Math.round((item.count / total) * 100) : 0}%
                </small>
              </b>
            </div>
            <i>
              <em
                style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
              />
            </i>
          </>
        );
        return linkKey ? (
          <Link
            key={item.value}
            href={casesHref({ ...baseQuery, [linkKey]: item.value })}
          >
            {content}
          </Link>
        ) : (
          <div key={item.value}>{content}</div>
        );
      })}
    </div>
  );
}

function MoneyBars({ cases }: { cases: readonly LegalRiskCase[] }) {
  const amounts = cases
    .filter((item) => (item.amount || 0) > 0)
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 10);
  const max = Math.max(...amounts.map((item) => item.amount || 0), 1);
  if (!amounts.length)
    return (
      <div className={styles.noData}>
        No known monetary amounts are recorded for this view.
      </div>
    );
  return (
    <div className={styles.metricBars}>
      {amounts.map((item) => (
        <Link key={item.slug} href={`/cases/${item.slug}`}>
          <div>
            <span>{item.case_name}</span>
            <b>{item.amount_display || money(item.amount || 0)}</b>
          </div>
          <i>
            <em style={{ width: `${Math.max(2, ((item.amount || 0) / max) * 100)}%` }} />
          </i>
        </Link>
      ))}
    </div>
  );
}

function Tabs({ view }: { view: string }) {
  return (
    <nav className={styles.tabs} aria-label="Analytics modes">
      <Link
        className={view === "overview" ? styles.active : ""}
        href="/analytics?view=overview"
      >
        <BarChart3 />
        Overview
      </Link>
      <Link
        className={view === "explore" ? styles.active : ""}
        href="/analytics?view=explore"
      >
        <Search />
        Explore
      </Link>
      <Link
        className={view === "data" ? styles.active : ""}
        href="/analytics?view=data"
      >
        <Database />
        Data
      </Link>
    </nav>
  );
}

function Overview() {
  const a = CORPUS_ANALYTICS;
  return (
    <>
      <CorpusIntelligence showAnalyticsLink={false} />
      <section className={styles.qualityBand} id="source-quality">
        <div>
          <span>Trust and quality</span>
          <h2>Know what is present, and what is missing.</h2>
        </div>
        <div className={styles.qualityMetrics}>
          <article title="Records with at least one recorded source URL; this does not imply independent verification of every field">
            <FileCheck2 />
            <strong>{a.sourceCoverage}%</strong>
            <span>source-linked</span>
            <small>{a.sourceLinked.toLocaleString()} records</small>
          </article>
          <article title="The largest source-host classification in the current dataset">
            <Layers3 />
            <strong>{a.sourceTiers[0]?.count.toLocaleString()}</strong>
            <span>{a.sourceTiers[0]?.label}</span>
            <small>largest source tier</small>
          </article>
          <article title="Records where a monetary amount is explicitly captured in the public source">
            <Database />
            <strong>{a.knownAmounts.toLocaleString()}</strong>
            <span>known amounts</span>
            <small>{money(a.knownAmountTotal)} total</small>
          </article>
          <article title="Records not classified as allegation-only in the tracker">
            <ShieldCheck />
            <strong>{a.nonAlleged.toLocaleString()}</strong>
            <span>non-allegation-only</span>
            <small>{a.alleged.toLocaleString()} allegation-only</small>
          </article>
          <article title="Records explicitly marked as human reviewed in the public tracker">
            <UserCheck />
            <strong>{a.reviewed.toLocaleString()}</strong>
            <span>human-reviewed</span>
            <small>{Math.round((a.reviewed / Math.max(a.total, 1)) * 100)}% of corpus</small>
          </article>
          <article title="Records without a source URL in the tracker">
            <Database />
            <strong>{a.sourceMissing.toLocaleString()}</strong>
            <span>missing source link</span>
            <small>inspect before relying</small>
          </article>
        </div>
        <Link href="/analytics?view=data">
          Inspect data quality <ArrowRight />
        </Link>
      </section>
      <section className={styles.actionBand}>
        <div>
          <span>Inspect and analyze</span>
          <h2>Go from signal to source-backed record.</h2>
          <p>
            Every chart links back to the public matters behind it. Use Explore
            when you need a narrower, reproducible view.
          </p>
        </div>
        <div>
          <Link href="/cases">
            <Search />
            Inspect matching records <ArrowRight />
          </Link>
          <Link href="/analytics?view=explore">
            <BarChart3 />
            Build a filtered view <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}

function FilterForm({
  query,
  filters,
  chart,
}: {
  query: CaseQuery;
  filters: AnalyticsFilter;
  chart: string;
}) {
  const navigationKey = JSON.stringify({ query, filters, chart });

  return (
    <ScrollRestoringForm
      className={styles.filters}
      method="get"
      action="/analytics#explore-results"
      navigationKey={navigationKey}
      restoreKey="analytics-explore-scroll"
    >
      <input type="hidden" name="view" value="explore" />
      <div className={styles.filterTitle}>
        <Filter />
        <strong>Filters</strong>
        <Link href="/analytics?view=explore">Reset all</Link>
      </div>
      <fieldset className={styles.filterSection}>
        <legend>Scope</legend>
        <label>
          Search within records
          <div className={styles.searchField}>
            <Search />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Case, judge, issue, or term"
            />
          </div>
        </label>
        <div className={styles.dateFields}>
          <label>From<input name="from" type="date" defaultValue={filters.from} /></label>
          <label>To<input name="to" type="date" defaultValue={filters.to} /></label>
        </div>
        <label>Country<select name="country" defaultValue={query.country}><option value="">All countries ({LEGAL_RISK_CASES.length.toLocaleString()})</option>{FILTER_COUNTS.countries.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>US state<select name="state" defaultValue={query.state}><option value="">All states</option>{FILTER_COUNTS.states.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>Court<input name="court" defaultValue={query.court} placeholder="e.g. D.N.J." list="analytics-courts" /><datalist id="analytics-courts">{FILTER_COUNTS.courts.slice(0, 80).map((court) => <option key={court.value} value={court.value}>{court.count} records</option>)}</datalist></label>
        <label>Judge<input name="judge" defaultValue={filters.judge} placeholder="Recorded judge" list="analytics-judges" /><datalist id="analytics-judges">{FILTER_COUNTS.judges.slice(0, 100).map((judge) => <option key={judge.value} value={judge.value}>{judge.count} records</option>)}</datalist></label>
      </fieldset>
      <fieldset className={styles.filterSection}>
        <legend>Conduct &amp; consequence</legend>
        <label>Editorial impact<select name="severity" defaultValue={query.severity}><option value="">All impact levels</option>{FILTER_COUNTS.severities.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>Recorded AI tool<select name="tool" defaultValue={query.tool}><option value="">All tools</option>{FILTER_COUNTS.tools.slice(0, 50).map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>Failure mode<select name="failure" defaultValue={query.failure}><option value="">All failure modes</option>{FILTER_COUNTS.failures.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>Recorded consequence<select name="sanction" defaultValue={filters.sanction}><option value="">All consequence tags</option>{FILTER_COUNTS.sanctions.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>AI attribution status<select name="attribution" defaultValue={filters.attribution}><option value="">All attribution states</option>{CORPUS_ANALYTICS.attribution.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
      </fieldset>
      <fieldset className={styles.filterSection}>
        <legend>Evidence quality</legend>
        <label>Source tier<select name="sourceTier" defaultValue={filters.sourceTier}><option value="">All source tiers</option>{CORPUS_ANALYTICS.sourceTiers.map((item) => <option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></label>
        <label>Human-review record<select name="review" defaultValue={filters.review}><option value="">Any recorded review state</option><option value="reviewed">Reviewed ({CORPUS_ANALYTICS.reviewed.toLocaleString()})</option><option value="not-reviewed">Not marked reviewed</option></select></label>
        <label>Record status<select name="status" defaultValue={query.status}><option value="all">All records</option><option value="non-alleged">Exclude allegation-only</option><option value="alleged">Allegation-only</option></select></label>
        <label>Primary chart<select name="chart" defaultValue={chart}><option value="failures">Failure modes</option><option value="trend">Trend</option><option value="consequences">Consequences</option><option value="geography">Geography</option><option value="attribution">AI attribution</option><option value="courts">Courts</option><option value="tools">Recorded tools</option><option value="sources">Source tiers</option><option value="money">Known monetary amounts</option></select></label>
      </fieldset>
      <div className={styles.filterSubmit}><span>{activeFilterCount(query, filters)} active</span><button type="submit">Apply filters</button></div>
    </ScrollRestoringForm>
  );
}

function activeFilterCount(query: CaseQuery, filters: AnalyticsFilter) {
  return [...Object.entries(query), ...Object.entries(filters)].filter(
    ([key, val]) => key !== "sort" && val && val !== "all",
  ).length;
}

function Explore({ params }: { params: Params }) {
  const query: CaseQuery = {
    q: value(params, "q"),
    country: value(params, "country"),
    state: value(params, "state"),
    court: value(params, "court"),
    tool: value(params, "tool"),
    failure: value(params, "failure"),
    severity: value(params, "severity") as CaseQuery["severity"],
    status: (value(params, "status") || "all") as CaseQuery["status"],
    sort: "date",
  };
  const filters: AnalyticsFilter = {
    q: value(params, "q"),
    from: value(params, "from"),
    to: value(params, "to"),
    judge: value(params, "judge"),
    attribution: value(params, "attribution"),
    sanction: value(params, "sanction"),
    sourceTier: value(params, "sourceTier"),
    review: value(params, "review"),
  };
  const chart = value(params, "chart") || "failures";
  const results = filterAnalyticsCases(queryCases(query), filters);
  const a = buildCorpusAnalytics(results);
  const selected =
    chart === "consequences"
      ? a.consequences
      : chart === "courts"
        ? a.courtsRanked
        : chart === "geography"
          ? query.country && query.country !== "US"
            ? a.countriesRanked
            : a.statesRanked
        : chart === "attribution"
          ? a.attribution
        : chart === "tools"
          ? a.tools
          : chart === "sources"
            ? a.sourceTiers
            : a.failures;
  const linkKey =
    chart === "courts"
      ? "court"
      : chart === "tools"
        ? "tool"
        : chart === "failures"
          ? "failure"
          : chart === "consequences"
            ? "q"
            : undefined;
  const directoryHref = casesHref(query);
  const active = [...Object.entries(query), ...Object.entries(filters)].filter(
    ([key, val]) => key !== "sort" && val && val !== "all",
  );
  const rowDimension = (["failure", "consequence", "severity", "attribution", "source-tier"].includes(value(params, "row"))
    ? value(params, "row")
    : "failure") as CrossDimension;
  const columnDimension = (["failure", "consequence", "severity", "attribution", "source-tier"].includes(value(params, "column"))
    ? value(params, "column")
    : "consequence") as CrossDimension;
  const matrix = crossTab(results, rowDimension, columnDimension);
  const maxCell = Math.max(...matrix.cells.values(), 1);
  const currentParams = Object.fromEntries(
    Object.entries(params).flatMap(([key, raw]) => {
      const entry = Array.isArray(raw) ? raw[0] : raw;
      return entry ? [[key, entry]] : [];
    }),
  );
  const exportParams = new URLSearchParams({ format: "csv" });
  for (const [key, raw] of Object.entries(currentParams)) {
    if (!["view", "chart", "row", "column"].includes(key))
      exportParams.set(key, raw);
  }
  const filteredExportHref = `/api/dataset?${exportParams.toString()}`;
  const printParams = new URLSearchParams(currentParams);
  printParams.delete("row");
  printParams.delete("column");
  printParams.set("view", "explore");
  const printHref = `/analytics/print?${printParams.toString()}`;
  return (
    <div className={styles.exploreLayout} id="explore-results">
      <div className={styles.exploreWorkspace}>
        <FilterForm query={query} filters={filters} chart={chart} />
        <div className={styles.exploreMain}>
        <div className={styles.selectionBar}>
          <div>
            <span>Current view</span>
            <strong>
              {a.total.toLocaleString()} of{" "}
              {CORPUS_ANALYTICS.total.toLocaleString()} records
            </strong>
          </div>
          <div className={styles.selectionActions}>
            {active.length ? (
              active.map(([key, val]) => (
                <span className={styles.chip} key={key}>
                  {key}: {val}
                </span>
              ))
            ) : (
              <span className={styles.chip}>Complete corpus</span>
            )}
            <Link href={filteredExportHref} download>
              <Download /> Export current CSV
            </Link>
            <Link href={printHref} target="_blank">
              <FileText /> PDF brief
            </Link>
            <CopyViewButton />
            {active.length > 0 && <Link href="/analytics?view=explore">Reset view</Link>}
          </div>
        </div>
        <div className={styles.exploreKpis}>
          <article>
            <span>Matched matters</span>
            <strong>{a.total.toLocaleString()}</strong>
            <small>{a.countries} countries</small>
          </article>
          <article>
            <span>Source-linked</span>
            <strong>{a.sourceCoverage}%</strong>
            <small>{a.sourceLinked.toLocaleString()} records</small>
          </article>
          <article>
            <span>Courts</span>
            <strong>{a.courts.toLocaleString()}</strong>
            <small>represented in view</small>
          </article>
          <article>
            <span>Latest 30 days</span>
            <strong>{a.last30.toLocaleString()}</strong>
            <small>
              relative to{" "}
              {a.latestDate ? formatCaseDate(a.latestDate) : "no record"}
            </small>
          </article>
          <article>
            <span>Known amount</span>
            <strong>{money(a.knownAmountTotal)}</strong>
            <small>{a.knownAmounts} records</small>
          </article>
          <article title="Records explicitly marked as human reviewed in the public tracker">
            <span>Human-reviewed</span>
            <strong>{a.reviewed.toLocaleString()}</strong>
            <small>{a.total ? Math.round((a.reviewed / a.total) * 100) : 0}% of this view</small>
          </article>
        </div>
        <section className={styles.primaryChart}>
          <header>
            <div>
              <span>{chart.replaceAll("-", " ")}</span>
              <h2>
                {chart === "sources"
                  ? "Source quality by tier"
                  : `Leading ${chart}`}
              </h2>
              <p>
                {chart === "consequences"
                  ? "Result tags may overlap when one matter records multiple consequences."
                  : "Counts use the current filter set. Select a row to inspect the underlying public records."}
              </p>
            </div>
            <Link href={directoryHref}>
              Open data table <ArrowRight />
            </Link>
          </header>
          {a.total && chart === "trend" ? (
            <AnalyticsGrowthChart points={a.months} />
          ) : a.total && chart === "attribution" ? (
            <Donut items={a.attribution} total={a.total} />
          ) : a.total && chart === "money" ? (
            <MoneyBars cases={results} />
          ) : a.total ? (
            <MetricBars
              items={selected.slice(0, 10)}
              total={a.total}
              linkKey={linkKey}
              baseQuery={query}
            />
          ) : (
            <div className={styles.noData}>
              No records match every selected condition. Remove a filter to
              broaden the view.
            </div>
          )}
        </section>
        <div className={styles.exploreGrid}>
          <section>
            <header>
              <span>Attribution status</span>
              <h3>How AI involvement is recorded</h3>
            </header>
            <Donut items={a.attribution} total={a.total} />
          </section>
          <section>
            <header>
              <span>Consequence mix</span>
              <h3>One primary result per matter</h3>
            </header>
            <Donut items={a.consequenceBuckets} total={a.total} tone="mixed" />
          </section>
          <section>
            <header>
              <span>Geography</span>
              <h3>Most represented jurisdictions</h3>
            </header>
            <MetricBars
              items={(query.country && query.country !== "US"
                ? a.countriesRanked
                : a.statesRanked
              ).slice(0, 5)}
              total={a.total}
              linkKey={
                query.country && query.country !== "US" ? undefined : "state"
              }
              baseQuery={query}
            />
          </section>
          <section>
            <header>
              <span>Source tiers</span>
              <h3>Traceability of this view</h3>
            </header>
            <MetricBars items={a.sourceTiers} total={a.total} />
          </section>
        </div>
        <section className={styles.crossTab} id="cross-tab">
          <header>
            <div>
              <span>Cross-tab analysis</span>
              <h2>Compare two recorded dimensions</h2>
              <p>
                Cells count matched matters. Failure and consequence tags can overlap,
                so row and column totals are not mutually exclusive.
              </p>
            </div>
            <ScrollRestoringForm
              method="get"
              action="/analytics#cross-tab"
              navigationKey={JSON.stringify({
                currentParams,
                rowDimension,
                columnDimension,
              })}
              restoreKey="analytics-matrix-scroll"
            >
              {Object.entries(currentParams)
                .filter(([key]) => !["view", "row", "column"].includes(key))
                .map(([key, entry]) => (
                  <input key={key} type="hidden" name={key} value={entry} />
                ))}
              <input type="hidden" name="view" value="explore" />
              <label>
                Rows
                <select name="row" defaultValue={rowDimension}>
                  <option value="failure">Failure mode</option>
                  <option value="consequence">Consequence</option>
                  <option value="severity">Editorial impact</option>
                  <option value="attribution">AI attribution</option>
                  <option value="source-tier">Source tier</option>
                </select>
              </label>
              <label>
                Columns
                <select name="column" defaultValue={columnDimension}>
                  <option value="consequence">Consequence</option>
                  <option value="failure">Failure mode</option>
                  <option value="severity">Editorial impact</option>
                  <option value="attribution">AI attribution</option>
                  <option value="source-tier">Source tier</option>
                </select>
              </label>
              <button className={styles.matrixUpdate} type="submit">
                Update matrix
              </button>
            </ScrollRestoringForm>
          </header>
          {a.total ? (
            <div className={styles.matrixScroll}>
              <table>
                <thead>
                  <tr>
                    <th>{humanize(rowDimension)}</th>
                    {matrix.columns.map(([column]) => (
                      <th key={column}>{humanize(column)}</th>
                    ))}
                    <th>Row records</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map(([row, rowTotal]) => (
                    <tr key={row}>
                      <th>{humanize(row)}</th>
                      {matrix.columns.map(([column]) => {
                        const count = matrix.cells.get(`${row}\u0000${column}`) || 0;
                        const cellParams = new URLSearchParams({
                          ...currentParams,
                          view: "explore",
                          [matrixFilterKey(rowDimension)]: row,
                          [matrixFilterKey(columnDimension)]: column,
                        });
                        const intensity = count / maxCell;
                        return (
                          <td
                            className={intensity >= 0.42 ? styles.matrixDark : ""}
                            key={column}
                          >
                            <i style={{ opacity: count ? 0.1 + (count / maxCell) * 0.75 : 0 }} />
                            {count ? (
                              <Link href={`/analytics?${cellParams.toString()}#cross-tab`} title="Filter to these records">
                                <strong>{count.toLocaleString()}</strong>
                                <small>{a.total ? Math.round((count / a.total) * 100) : 0}%</small>
                              </Link>
                            ) : <strong>—</strong>}
                          </td>
                        );
                      })}
                      <td><strong>{rowTotal.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>No records are available for this matrix.</div>
          )}
        </section>
          <section className={styles.preview}>
          <header>
            <div>
              <span>Matching records</span>
              <h2>Preview the evidence behind this view</h2>
            </div>
            <Link href={directoryHref}>
              Open full directory <ArrowRight />
            </Link>
          </header>
          <div className={styles.previewHead}>
            <span>Date</span>
            <span>Case</span>
            <span>Court</span>
            <span>Tool</span>
            <span>Amount</span>
          </div>
          {results.slice(0, 6).map((item) => (
            <Link href={`/cases/${item.slug}`} key={item.slug}>
              <span>{formatCaseDate(item.date)}</span>
              <strong>{item.case_name}</strong>
              <span>{item.court}</span>
              <span>{item.ai_tool_used}</span>
              <b>{item.amount ? item.amount_display : "—"}</b>
            </Link>
          ))}
          </section>
        </div>
      </div>
      <aside className={styles.insights}>
        <span>Insights for this view</span>
        <article>
          <strong>Largest failure signal</strong>
          <p>
            {a.failures[0]
              ? `${a.failures[0].label} appears in ${a.failures[0].count.toLocaleString()} matched records (${Math.round((a.failures[0].count / Math.max(a.total, 1)) * 100)}%).`
              : "No failure-mode signal is available."}
          </p>
        </article>
        <article>
          <strong>Concentration</strong>
          <p>
            {a.courtsRanked[0]
              ? `${a.courtsRanked[0].label} is the most represented court with ${a.courtsRanked[0].count.toLocaleString()} records.`
              : "No court concentration is available."}
          </p>
        </article>
        <article>
          <strong>Traceability</strong>
          <p>
            {a.sourceCoverage}% of this view has at least one recorded source
            link.
          </p>
        </article>
        <article>
          <strong>Boundary</strong>
          <p>
            Counts describe this public corpus. They are not usage-adjusted
            rates or vendor comparisons.
          </p>
        </article>
      </aside>
    </div>
  );
}

function DataView() {
  const a = CORPUS_ANALYTICS;
  return (
    <div className={styles.dataView}>
      <section className={styles.dataIntro}>
        <div>
          <span>Dataset snapshot</span>
          <h2>Inspect provenance before drawing conclusions.</h2>
          <p>
            The public corpus records when the source was checked separately
            from the latest tracked decision. Field coverage varies because
            court records and source documents do not use a common schema.
          </p>
        </div>
        <dl>
          <div>
            <dt>Corpus checked</dt>
            <dd>{formatCaseDate(LAST_CHECKED)}</dd>
          </div>
          <div>
            <dt>Latest tracked decision</dt>
            <dd>{formatCaseDate(LATEST_RECORD_DATE)}</dd>
          </div>
          <div>
            <dt>Coverage window</dt>
            <dd>
              {formatCaseDate(a.earliestDate)} to {formatCaseDate(a.latestDate)}
            </dd>
          </div>
          <div>
            <dt>Public records</dt>
            <dd>{a.total.toLocaleString()}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.datasetTools}>
        <div>
          <Database />
          <div>
            <strong>Public dataset snapshot</strong>
            <span>
              Checked {formatCaseDate(LAST_CHECKED)} · Latest decision{" "}
              {formatCaseDate(LATEST_RECORD_DATE)} · {a.total.toLocaleString()} records · UTF-8
            </span>
          </div>
        </div>
        <Link href="/api/dataset?format=csv" download>
          <Download /> Download CSV
        </Link>
        <Link href="/api/dataset?format=json" download>
          <Download /> Download JSON
        </Link>
      </section>
      <section className={styles.datasetPreview}>
        <header>
          <div>
            <span>Data preview</span>
            <h2>Inspect the published schema</h2>
          </div>
          <Link href="/cases">Open searchable directory <ArrowRight /></Link>
        </header>
        <div className={styles.datasetTable}>
          <div>
            <b>Date</b><b>Public matter</b><b>Court</b><b>Impact</b><b>Amount</b><b>Source</b>
          </div>
          {LEGAL_RISK_CASES.slice(0, 8).map((item) => (
            <div key={item.slug}>
              <span>{item.date}</span>
              <Link href={`/cases/${item.slug}`}>{item.case_name}</Link>
              <span>{item.court || "—"}</span>
              <span>{humanize(item.severity)}</span>
              <span>{item.amount ? item.amount_display : "—"}</span>
              {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">Open</a> : <span>—</span>}
            </div>
          ))}
        </div>
      </section>
      <div className={styles.dataGrid}>
        <section id="source-quality">
          <header>
            <span>Field coverage</span>
            <h2>Completeness by field</h2>
            <p>Missing values remain visible; they are not imputed.</p>
          </header>
          <MetricBars items={a.fieldCoverage} total={a.total} />
        </section>
        <section>
          <header>
            <span>Source classification</span>
            <h2>Evidence-link tiers</h2>
            <p>Classification is based on the recorded URL host.</p>
          </header>
          <MetricBars items={a.sourceTiers} total={a.total} />
        </section>
        <section>
          <header>
            <span>Review coverage</span>
            <h2>Recorded human-review status</h2>
            <p>Review status is reported as recorded; missing status is not imputed.</p>
          </header>
          <MetricBars
            items={[
              { value: "reviewed", label: "Marked human-reviewed", count: a.reviewed },
              { value: "not-reviewed", label: "Not marked human-reviewed", count: a.total - a.reviewed },
            ]}
            total={a.total}
          />
        </section>
      </div>
      <section className={styles.provenance}>
        <header>
          <div>
            <span>Source provenance</span>
            <h2>Source-host concentration</h2>
            <p>Host counts describe where recorded links point, not source quality by themselves.</p>
          </div>
          <Link href="/sources">
            Read methodology <ArrowRight />
          </Link>
        </header>
        <div className={styles.hostTable}>
          <div>
            <b>Host</b>
            <b>Records</b>
            <b>Share of corpus</b>
          </div>
          {a.sourceHosts.slice(0, 12).map((item) => (
            <div key={item.value}>
              <span>{item.label}</span>
              <strong>{item.count.toLocaleString()}</strong>
              <span>{Math.round((item.count / a.total) * 1000) / 10}%</span>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.dataActions}>
        <div>
          <Download />
          <span>
            Use the case directory to reproduce a filtered view and inspect
            every named source.
          </span>
        </div>
        <Link href="/cases">
          Open complete data table <ExternalLink />
        </Link>
        <Link href="/sources">
          Field definitions and methodology <ArrowRight />
        </Link>
      </section>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const params = (await searchParams) || {};
  const view = ["overview", "explore", "data"].includes(value(params, "view"))
    ? value(params, "view")
    : "overview";
  return (
    <ResearchShell>
      <main className={shell.main}>
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Analytics</span>
          {view !== "overview" && (
            <>
              <span>/</span>
              <span>{view}</span>
            </>
          )}
        </div>
        <header className={`${styles.hero} ${view !== "overview" ? styles.compactHero : ""}`}>
          <div>
            <span>Corpus analytics</span>
            <h1>
              The public record,
              <br />
              measured honestly.
            </h1>
            <p>
              Understand the legal AI risk landscape in seconds. Explore trends,
              sources, attribution, and consequences, then inspect the records
              behind every signal.
            </p>
          </div>
          <div>
            <Tabs view={view} />
            <aside>
              <ShieldCheck />
              <div>
                <strong>Independent. Transparent. Evidence-based.</strong>
                <p>
                  Counts describe this public dataset; they do not estimate
                  legal-industry incidence or vendor failure rates.
                </p>
                <Link href="/sources">
                  Read methodology <ArrowRight />
                </Link>
              </div>
            </aside>
          </div>
        </header>
        {view === "overview" ? (
          <Overview />
        ) : view === "explore" ? (
          <Explore params={params} />
        ) : (
          <DataView />
        )}
      </main>
    </ResearchShell>
  );
}
