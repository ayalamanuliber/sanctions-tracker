import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ReportBrandLockup } from "@/components/reports/ReportBrandLockup";
import { ReportPreviewToolbar } from "@/components/reports/ReportPreviewToolbar";
import { StateScopeMark } from "@/components/reports/StateScopeMark";
import {
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  formatCaseDate,
  queryCases,
  type LegalRiskCase,
} from "@/lib/cases";
import {
  analyticsCaseQuery,
  analyticsFilters,
  attributionStatus,
  buildCorpusAnalytics,
  filterAnalyticsCases,
  humanize,
  type CountedOption,
} from "@/lib/corpus-analytics";
import { createReportId, readReportBrand, type ReportTier } from "@/lib/reporting";
import { assetUrl, publicUrl, SITE_PUBLICATION_DATE } from "@/lib/site";
import styles from "./print.module.css";

export const metadata: Metadata = {
  title: "Analytics Evidence Brief | AI Vortex",
  description: "A print-ready evidence brief for a selected AI Vortex analytics view.",
  robots: { index: false, follow: true },
};

type Params = Record<string, string | string[] | undefined>;

function first(params: Params, key: string) {
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

function compactMoney(value: number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function percent(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0;
}

function Distribution({
  title,
  subtitle,
  items,
  total,
  tone = "blue",
}: {
  title: string;
  subtitle: string;
  items: CountedOption[];
  total: number;
  tone?: "blue" | "amber";
}) {
  return (
    <section className={styles.distribution}>
      <div className={styles.sectionEyebrow}>{subtitle}</div>
      <h2>{title}</h2>
      <div className={styles.barList}>
        {items.slice(0, 5).map((item) => (
          <div className={styles.barItem} key={item.value}>
            <div className={styles.barLabel}>
              <span>{item.label}</span>
              <strong>{item.count.toLocaleString()}</strong>
            </div>
            <div className={styles.track}>
              <span
                className={tone === "amber" ? styles.amberBar : styles.blueBar}
                style={{ width: `${Math.max(2, percent(item.count, total))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function recordedTool(item: LegalRiskCase) {
  const status = attributionStatus(item);
  if (status === "named-tool-recorded") return item.ai_tool_used;
  return humanize(status);
}

export default async function AnalyticsPrintPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const params = (await searchParams) || {};
  const tier: ReportTier = first(params, "tier") === "premium" ? "premium" : "free";
  const brandKey = readReportBrand(first(params, "brand"));
  const baseQuery = analyticsCaseQuery(params);
  const fineFilters = analyticsFilters(params);
  const cases = filterAnalyticsCases(queryCases(baseQuery), fineFilters);
  const analytics = buildCorpusAnalytics(cases);
  const generated = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const scopeParams = new URLSearchParams(
    Object.entries(params).flatMap(([key, raw]) => {
      if (key === "tier" || key === "brand") return [];
      const value = Array.isArray(raw) ? raw[0] : raw;
      return value ? [[key, value]] : [];
    }),
  );
  scopeParams.sort();
  const liveParams = new URLSearchParams(scopeParams);
  liveParams.set("tier", tier);
  liveParams.set("brand", brandKey);
  const reportId = createReportId(
    "AV-AN",
    scopeParams.toString() || "complete-public-corpus",
  );
  const backHref = `/analytics${scopeParams.size ? `?${scopeParams.toString()}` : ""}`;

  const scope = [
    first(params, "country") && `Country: ${first(params, "country")}`,
    first(params, "state") && `State: ${first(params, "state")}`,
    first(params, "court") && `Court: ${first(params, "court")}`,
    first(params, "severity") && `Impact: ${humanize(first(params, "severity"))}`,
    first(params, "tool") && `Tool: ${first(params, "tool")}`,
    first(params, "failure") && `Failure: ${humanize(first(params, "failure"))}`,
    first(params, "sanction") && `Consequence: ${humanize(first(params, "sanction"))}`,
    first(params, "attribution") &&
      `Attribution: ${humanize(first(params, "attribution"))}`,
    first(params, "sourceTier") &&
      `Source tier: ${humanize(first(params, "sourceTier"))}`,
    first(params, "from") && `From: ${first(params, "from")}`,
    first(params, "to") && `To: ${first(params, "to")}`,
  ].filter(Boolean) as string[];

  const topCourt = analytics.courtsRanked[0];
  const topFailure = analytics.failures[0];
  const topConsequence = analytics.consequenceBuckets[0];
  const reportPath = `/analytics/print${
    scopeParams.size ? `?${scopeParams.toString()}` : ""
  }`;
  const reportUrl = publicUrl(reportPath);
  const reportSchema = {
    "@context": "https://schema.org",
    "@type": "Report",
    "@id": `${reportUrl}#report`,
    name: "AI Vortex Analytics Evidence Brief",
    identifier: reportId,
    description:
      "A print-ready, source-aware summary of the selected AI Vortex analytics view.",
    url: reportUrl,
    datePublished: SITE_PUBLICATION_DATE,
    dateModified: LAST_CHECKED,
    isAccessibleForFree: true,
    about: {
      "@type": "Dataset",
      name: "AI Vortex Legal AI Risk public corpus",
      url: publicUrl("/analytics"),
    },
    publisher: {
      "@type": "Organization",
      name: "AI Vortex",
      url: "https://www.aivortex.io",
    },
    citation: cases.slice(0, 24).map((item) => ({
      "@type": "CreativeWork",
      name: item.case_name,
      url: publicUrl(`/cases/${item.slug}`),
    })),
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reportSchema).replace(/</g, "\\u003c"),
        }}
      />
      <ReportPreviewToolbar
        backHref={backHref}
        backLabel="Back to analytics"
        tier={tier}
        title="AI Vortex Analytics Evidence Brief"
      />

      <article className={`${styles.sheet} ${tier === "premium" ? styles.proSheet : ""}`}>
        <header className={styles.header}>
          <ReportBrandLockup brand={brandKey} tier={tier} />
          <div className={styles.documentMeta}>
            <strong>ANALYTICS EVIDENCE BRIEF</strong>
            <span>{reportId}</span>
            <span>Generated {generated}</span>
            <span>Evidence checked {formatCaseDate(LAST_CHECKED)}</span>
          </div>
        </header>

        <section className={styles.intro}>
          <div>
            <div className={styles.sectionEyebrow}>SELECTED PUBLIC RECORD</div>
            <h1>The public record, measured honestly.</h1>
            <p>
              A source-aware summary of the active AI Vortex analytics view.
              Counts describe tracked public matters, not legal-industry incidence
              or product failure rates.
            </p>
          </div>
          <aside className={styles.scope}>
            <div className={styles.sectionEyebrow}>ACTIVE SCOPE</div>
            {first(params, "state") && /^[A-Za-z]{2}$/.test(first(params, "state")) && (
              <StateScopeMark state={first(params, "state")} />
            )}
            {scope.length ? (
              <ul>
                {scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <strong>Complete public corpus</strong>
            )}
          </aside>
        </section>

        <section className={styles.kpis}>
          <div>
            <span>Matching matters</span>
            <strong>{analytics.total.toLocaleString()}</strong>
            <small>{analytics.countries.toLocaleString()} countries represented</small>
          </div>
          <div>
            <span>Source-linked</span>
            <strong>{analytics.sourceCoverage}%</strong>
            <small>{analytics.sourceLinked.toLocaleString()} records contain a source URL</small>
          </div>
          <div>
            <span>Courts represented</span>
            <strong>{analytics.courts.toLocaleString()}</strong>
            <small>Distinct recorded court labels</small>
          </div>
          <div>
            <span>Latest 30 days</span>
            <strong>{analytics.last30.toLocaleString()}</strong>
            <small>Relative to latest recorded decision</small>
          </div>
          <div>
            <span>Known monetary total</span>
            <strong>{money(analytics.knownAmountTotal)}</strong>
            <small>{analytics.knownAmounts.toLocaleString()} records with an amount</small>
          </div>
        </section>

        <section className={styles.readout}>
          <div className={styles.sectionEyebrow}>ADVISOR READOUT</div>
          <div className={styles.readoutGrid}>
            <div>
              <span>Leading recorded signal</span>
              <strong>{topFailure?.label || "No classified failure signal"}</strong>
              <p>
                {topFailure
                  ? `${topFailure.count.toLocaleString()} matched records (${percent(
                      topFailure.count,
                      analytics.total,
                    )}%). Tags can overlap.`
                  : "No failure-mode tags appear in this view."}
              </p>
            </div>
            <div>
              <span>Concentration</span>
              <strong>{topCourt?.label || "No court recorded"}</strong>
              <p>
                {topCourt
                  ? `${topCourt.count.toLocaleString()} records in this selected view.`
                  : "This view does not contain a recorded court."}
              </p>
            </div>
            <div>
              <span>Most common primary result</span>
              <strong>{topConsequence?.label || "No result recorded"}</strong>
              <p>
                {topConsequence
                  ? `${topConsequence.count.toLocaleString()} matters, using one primary consequence per record.`
                  : "No consequence classification is available."}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.distributionGrid}>
          <Distribution
            title="Leading failure modes"
            subtitle="RECURRING SIGNALS"
            items={analytics.failures}
            total={analytics.total}
            tone="amber"
          />
          <Distribution
            title="How AI involvement is recorded"
            subtitle="ATTRIBUTION STATUS"
            items={analytics.attribution}
            total={analytics.total}
          />
          <Distribution
            title="Primary consequence mix"
            subtitle="OBSERVED CONSEQUENCES"
            items={analytics.consequenceBuckets}
            total={analytics.total}
          />
        </section>

        <section className={styles.records}>
          <div className={styles.recordsHeading}>
            <div>
              <div className={styles.sectionEyebrow}>UNDERLYING EVIDENCE</div>
              <h2>Selected records behind this view</h2>
            </div>
            <span>Showing {Math.min(cases.length, 8)} of {cases.length.toLocaleString()}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Matter</th>
                <th>Court</th>
                <th>Recorded AI tool</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {cases.slice(0, 8).map((item) => (
                <tr key={item.slug}>
                  <td>{formatCaseDate(item.date)}</td>
                  <td>
                    <Link href={`/cases/${item.slug}`}>{item.case_name}</Link>
                  </td>
                  <td>{item.court || "—"}</td>
                  <td>{recordedTool(item)}</td>
                  <td>{compactMoney(item.amount)}</td>
                </tr>
              ))}
              {!cases.length && (
                <tr>
                  <td colSpan={5}>No records match the selected view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className={styles.boundary}>
          <div>
            <div className={styles.sectionEyebrow}>EVIDENCE NOTE</div>
            <h2>Traceability and limits</h2>
          </div>
          <ul>
            <li>Corpus checked {LAST_CHECKED}; latest tracked decision {LATEST_RECORD_DATE}; brief generated {generated}.</li>
            <li>
              {analytics.sourceLinked.toLocaleString()} of {analytics.total.toLocaleString()} matched
              records contain at least one source URL.
            </li>
            <li>Failure and sanction tags can overlap; counts are not mutually exclusive.</li>
            <li>Known monetary totals exclude records without a recorded amount.</li>
            <li>AI attribution reflects the public record and does not infer unrecorded tool use.</li>
          </ul>
        </section>

        <footer className={`${styles.footer} ${tier === "premium" ? styles.proFooter : ""}`}>
          {tier === "free" ? (
            <>
              <div className={styles.footerIdentity}>
                <Image className={styles.footerLogo} src={assetUrl("/av-logo-nav.png")} alt="" width={28} height={28} />
                <div>
                  <strong>AI Vortex · Manu Ayala</strong>
                  <span>Source-backed legal AI risk intelligence and workflow design.</span>
                </div>
              </div>
              <div className={styles.footerLinks}>
                <a href="https://www.aivortex.io/legal">aivortex.io/legal</a>
                <a href="mailto:manuel@aivortex.io">manuel@aivortex.io</a>
                <a href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
              <div className={styles.upgradeActions}>
                <a href="https://www.aivortex.io/legal#subscribe">Upgrade to Pro</a>
                <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20Pro%20Report%20Access">
                  Email to request access
                </a>
              </div>
            </>
          ) : (
            <div className={styles.proAttribution}>
              <span>Evidence infrastructure by</span>
              <a href="https://www.aivortex.io/legal">AI Vortex</a>
            </div>
          )}
          <div className={styles.footerEvidence}>
            <span>Report {reportId}</span>
            <Link href={`/analytics/print?${liveParams.toString()}`}>View live report</Link>
            <span>Corpus checked {formatCaseDate(LAST_CHECKED)}</span>
            <Link href="/sources">Methodology</Link>
            <span>Public intelligence, not legal advice.</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
