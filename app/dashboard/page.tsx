import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import {
  CASE_FILTERS,
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  formatCaseDate,
  queryCases,
  sourceTier,
} from "@/lib/cases";
import { FILTER_COUNTS, optionLabel } from "@/lib/corpus-analytics";
import { publicUrl } from "@/lib/site";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Legal AI Risk Dashboard | AI Vortex",
  description:
    "Role-aware, source-linked legal AI risk dashboard for law firms, courts, researchers, and legal technology teams.",
  alternates: { canonical: publicUrl("/dashboard") },
  robots: { index: false, follow: true },
};
type Params = Record<string, string | string[] | undefined>;
function val(p: Params, k: string) {
  const v = p[k];
  return Array.isArray(v) ? v[0] || "" : v || "";
}
function topCounts(values: string[], limit = 6) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}
const roles = {
  managing_partner: {
    label: "Managing partner",
    headline:
      "Observed filing-risk patterns require a verification gate, not a blanket AI ban.",
    body: "Prioritize citation existence, quotation accuracy, proposition support, responsible-reviewer signoff, and a matter-level exception record.",
    controls: [
      "Pre-filing verification gate",
      "Responsible-reviewer certification",
      "Matter-level exception record",
    ],
  },
  judge: {
    label: "Judge / chambers",
    headline:
      "Treat discrepancies as source-verification issues before attributing cause or intent.",
    body: "Chambers should preserve the filed language, compare it with the primary source, identify procedural posture, and use proportionate correction or show-cause steps without alleging AI use absent evidence.",
    controls: [
      "Neutral discrepancy record",
      "Primary-source and pincite comparison",
      "Proportionate correction or OSC workflow",
    ],
  },
  researcher: {
    label: "Researcher",
    headline:
      "The corpus shows documented public signals, not population-level prevalence.",
    body: "Use source coverage, matter status, date range, and overlapping classifications when interpreting trends. Preserve filter URLs and inspect the underlying record before citing a tracker summary.",
    controls: [
      "Reproducible query URL",
      "Primary-source review",
      "Adjudicated/alleged separation",
    ],
  },
  vendor: {
    label: "Legal-tech vendor",
    headline:
      "Tracked incidents cannot be converted into vendor failure rates without usage denominators.",
    body: "Use tool attribution only where the public record names a product. Separate workflow failures, tool mentions, and adjudicated findings in external claims and product-risk reviews.",
    controls: [
      "Attribution review",
      "Usage-rate caveat",
      "Correction and response process",
    ],
  },
  litigation_partner: {
    label: "Litigation partner",
    headline: "The practical risk concentrates at the filing boundary.",
    body: "Require the team to verify every authority, quote, pincite, and supported proposition before final review, then preserve exceptions and reviewer signoff.",
    controls: [
      "Authority verification ledger",
      "Disclosure and judge-order check",
      "Final exception report",
    ],
  },
  associate: {
    label: "Associate / paralegal",
    headline:
      "A short verification record is more useful than another generic AI warning.",
    body: "Extract every citation, quotation, pincite, and AI-assisted proposition; verify each against the source; and escalate exceptions before the signing attorney reviews the filing.",
    controls: [
      "Candidate extraction",
      "Verification ledger",
      "Exception escalation",
    ],
  },
  in_house: {
    label: "In-house legal",
    headline:
      "Outside-counsel controls should be observable at the delivery boundary.",
    body: "Require matter-specific verification, named reviewer ownership, and a documented exception path for court-facing work delivered by internal or external teams.",
    controls: [
      "Outside-counsel protocol",
      "Matter audit note",
      "Incident response",
    ],
  },
  insurer: {
    label: "Insurer / risk professional",
    headline: "Public incidents are loss-control signals, not actuarial rates.",
    body: "Use the corpus to identify recurring control failures while separating allegation status, source quality, procedural outcome, and unknown usage denominators.",
    controls: [
      "Control evidence request",
      "Source-status review",
      "Remediation record",
    ],
  },
} as const;

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const p = (await searchParams) || {};
  const audience = val(p, "audience") || "managing_partner";
  const role = roles[audience as keyof typeof roles] || roles.managing_partner;
  const state = val(p, "state"),
    court = val(p, "court"),
    tool = val(p, "ai_tool") || val(p, "tool"),
    severity = val(p, "severity");
  const cases = queryCases({
    country: state ? "US" : "",
    state,
    court,
    tool,
    severity,
    status: "non-alleged",
    sort: "severity",
  });
  const sourceCount = cases.filter((i) => i.source_url).length;
  const high = cases.filter(
    (i) => i.severity === "high" || i.severity === "career-ending",
  ).length;
  const monetaryRecords = cases.filter((i) => (i.amount || 0) > 0).length;
  const severityCounts = Object.fromEntries(
    CASE_FILTERS.severities.map((s) => [
      s,
      cases.filter((i) => i.severity === s).length,
    ]),
  );
  const failures = [...new Set(cases.flatMap((i) => i.tags))]
    .map(
      (tag) => [tag, cases.filter((i) => i.tags.includes(tag)).length] as const,
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const years = topCounts(
    cases.map((i) => i.date.slice(0, 4)),
    8,
  ).sort((a, b) => a[0].localeCompare(b[0]));
  const sourceTiers = topCounts(
    cases.map((i) => sourceTier(i).label),
    6,
  );
  const tools = topCounts(
    cases
      .map((i) => i.ai_tool_used)
      .filter((v) => v && !/unidentified|unspecified|unknown/i.test(v)),
    6,
  );
  const practices = topCounts(
    cases.map((i) => i.legal_field_primary || "").filter(Boolean),
    6,
  );
  const maxYear = Math.max(1, ...years.map((v) => v[1]));
  const maxSource = Math.max(1, ...sourceTiers.map((v) => v[1]));
  const maxTool = Math.max(1, ...tools.map((v) => v[1]));
  const maxPractice = Math.max(1, ...practices.map((v) => v[1]));
  const maxSev = Math.max(1, ...Object.values(severityCounts));
  const maxFailure = Math.max(1, ...failures.map((v) => v[1]));
  const qs = new URLSearchParams();
  if (state) qs.set("state", state);
  if (court) qs.set("court", court);
  if (tool) qs.set("ai_tool", tool);
  qs.set("audience", audience);
  const caseQs = new URLSearchParams();
  if (state) {
    caseQs.set("country", "US");
    caseQs.set("state", state);
  }
  if (court) caseQs.set("court", court);
  if (tool) caseQs.set("tool", tool);
  if (severity) caseQs.set("severity", severity);
  caseQs.set("status", "non-alleged");
  return (
    <ResearchShell>
      <main className={shell.main}>
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Dashboard</span>
        </div>
        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>{role.label} view</span>
            <h1>
              {state || court || tool || "National"} legal AI risk dashboard
            </h1>
            <p>
              Source-backed observed patterns. Corpus checked{" "}
              {formatCaseDate(LAST_CHECKED)}; latest tracked decision{" "}
              {formatCaseDate(LATEST_RECORD_DATE)}. This dashboard does not
              estimate the prevalence of AI use or usage-adjusted incident
              rates.
            </p>
          </div>
          <div className={shell.headActions}>
            <Link className={shell.buttonSecondary} href="/cases">
              Cases
            </Link>
            <Link className={shell.buttonSecondary} href="/sources">
              Methodology
            </Link>
          </div>
        </header>
        <form className={`${shell.card} ${styles.filters}`} method="get">
          <div className={styles.field}>
            <label htmlFor="audience">Audience</label>
            <select id="audience" name="audience" defaultValue={audience}>
              {Object.entries(roles).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="state">State</label>
            <select id="state" name="state" defaultValue={state}>
              <option value="">National</option>
              {FILTER_COUNTS.states.map((v) => (
                <option key={v.value} value={v.value}>
                  {optionLabel(v)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="court">Court</label>
            <input
              id="court"
              name="court"
              defaultValue={court}
              placeholder="e.g. D.N.J."
              list="dashboard-courts"
            />
            <datalist id="dashboard-courts">
              {FILTER_COUNTS.courts.slice(0, 40).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.count} records
                </option>
              ))}
            </datalist>
          </div>
          <div className={styles.field}>
            <label htmlFor="ai_tool">AI tool</label>
            <select id="ai_tool" name="ai_tool" defaultValue={tool}>
              <option value="">All recorded tools</option>
              {FILTER_COUNTS.tools.slice(0, 40).map((item) => (
                <option key={item.value} value={item.value}>
                  {optionLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.apply}>
            <RefreshCw size={15} /> Update view
          </button>
        </form>
        <section className={styles.metrics}>
          {[
            ["Matched records", cases.length.toLocaleString()],
            ["Any source link", `${sourceCount}/${cases.length}`],
            ["High editorial impact", high.toLocaleString()],
            ["Positive amount recorded", `${monetaryRecords}/${cases.length}`],
          ].map(([l, v]) => (
            <div key={l} className={`${shell.card} ${styles.metric}`}>
              <small>{l}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </section>
        <section className={`${shell.card} ${styles.readout}`}>
          <span>Role-aware readout</span>
          <h2>
            {cases.length
              ? role.headline
              : "No exact matters match this filter combination."}
          </h2>
          <p>
            {cases.length
              ? role.body
              : "Broaden one filter before treating this result as evidence of no risk."}
          </p>
          <div className={styles.actions}>
            {role.controls.map((c) => (
              <Link
                key={c}
                href={
                  audience === "judge"
                    ? "/filing-integrity-scanner"
                    : "/filing-gate"
                }
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
        <div className={styles.charts}>
          <section className={`${shell.card} ${styles.chart}`}>
            <h2>Editorial impact mix</h2>
            {CASE_FILTERS.severities.map((s) => (
              <div className={styles.bar} key={s}>
                <div className={styles.barHead}>
                  <span>{s.replace("-", " ")}</span>
                  <span>{severityCounts[s]}</span>
                </div>
                <div className={styles.track}>
                  <div
                    className={`${styles.fill} ${s === "high" || s === "career-ending" ? styles.fillDanger : s === "medium" ? styles.fillWarn : ""}`}
                    style={{ width: `${(severityCounts[s] / maxSev) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className={styles.caveat}>
              Impact is an editorial consequence classification, not a
              probability or prediction.
            </p>
          </section>
          <section className={`${shell.card} ${styles.chart}`}>
            <h2>Recorded matter attributes</h2>
            {failures.map(([tag, count]) => (
              <div className={styles.bar} key={tag}>
                <div className={styles.barHead}>
                  <span>{tag.replaceAll("-", " ")}</span>
                  <span>{count}</span>
                </div>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${(count / maxFailure) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className={styles.caveat}>
              Tags include posture, participants, failure patterns, and
              outcomes. They overlap, so one matter may contribute to several
              bars.
            </p>
          </section>
        </div>
        <div className={styles.charts}>
          <section className={`${shell.card} ${styles.chart}`}>
            <h2>Recorded matters over time</h2>
            {years.map(([year, count]) => (
              <div className={styles.bar} key={year}>
                <div className={styles.barHead}>
                  <span>{year}</span>
                  <span>{count}</span>
                </div>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${(count / maxYear) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className={styles.caveat}>
              Counts reflect the current corpus snapshot and may rise for
              earlier years as research coverage expands.
            </p>
          </section>
          <section className={`${shell.card} ${styles.chart}`}>
            <h2>Source-link tier</h2>
            {sourceTiers.map(([label, count]) => (
              <div className={styles.bar} key={label}>
                <div className={styles.barHead}>
                  <span>{label}</span>
                  <span>{count}</span>
                </div>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${(count / maxSource) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className={styles.caveat}>
              A linked source improves traceability; it does not mean every
              field has been independently verified.
            </p>
          </section>
        </div>
        <div className={styles.charts}>
          <section className={`${shell.card} ${styles.chart}`}>
            <h2>Explicit tool mentions</h2>
            {tools.length ? (
              tools.map(([label, count]) => (
                <div className={styles.bar} key={label}>
                  <div className={styles.barHead}>
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${(count / maxTool) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyChart}>
                No explicit tool mentions in this result set.
              </p>
            )}
            <p className={styles.caveat}>
              Mentions are not usage-adjusted failure rates and do not establish
              comparative product safety.
            </p>
          </section>
          <section className={`${shell.card} ${styles.chart}`}>
            <h2>Recorded practice signals</h2>
            {practices.length ? (
              practices.map(([label, count]) => (
                <div className={styles.bar} key={label}>
                  <div className={styles.barHead}>
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${(count / maxPractice) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyChart}>
                Practice metadata is not recorded for this result set.
              </p>
            )}
            <p className={styles.caveat}>
              Practice labels describe recorded matter context, not market-level
              exposure.
            </p>
          </section>
        </div>
        <section className={`${shell.card} ${styles.cases}`}>
          <h2>Priority source-linked matters</h2>
          {cases.slice(0, 8).map((item) => (
            <Link
              className={styles.case}
              href={`/cases/${item.slug}`}
              key={item.slug}
            >
              <strong>{item.case_name}</strong>
              <span>{item.court}</span>
              <span>{formatCaseDate(item.date)}</span>
              <span>{item.severity.replace("-", " ")}</span>
            </Link>
          ))}
          <div className={styles.actions}>
            <Link href={`/artifact/print?type=report&${qs}`}>
              Open role-ready report
            </Link>
            <Link href={state ? `/map?states=${state}` : "/map"}>Open map</Link>
            <Link href={`/cases?${caseQs}`}>Open full result set</Link>
          </div>
          {audience === "vendor" && (
            <p className={styles.caveat}>
              Tool mentions describe observed public records. They do not
              establish comparative product safety or failure rates.
            </p>
          )}
        </section>
      </main>
    </ResearchShell>
  );
}
