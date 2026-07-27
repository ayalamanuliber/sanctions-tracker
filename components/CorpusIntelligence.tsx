import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Database,
  FileCheck2,
  Gavel,
  Globe2,
  UserCheck,
} from "lucide-react";

import AnalyticsGrowthChart from "@/components/AnalyticsGrowthChart";
import { formatCaseDate } from "@/lib/cases";
import { CORPUS_ANALYTICS, type CountedOption } from "@/lib/corpus-analytics";
import styles from "./CorpusIntelligence.module.css";

function caseHref(
  key: "severity" | "failure" | "court" | "state" | "tool" | "status" | "q",
  value: string,
) {
  const params = new URLSearchParams({ [key]: value });
  if (key !== "status")
    params.set("sort", key === "severity" ? "severity" : "date");
  return `/cases?${params}`;
}

function Bars({
  items,
  hrefFor,
  tone = "blue",
  note,
}: {
  items: CountedOption[];
  hrefFor?: (item: CountedOption) => string;
  tone?: "blue" | "amber" | "green";
  note?: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className={styles.bars}>
      {items.map((item) => {
        const content = (
          <>
            <div>
              <span>{item.label}</span>
              <b>{item.count.toLocaleString()}</b>
            </div>
            <i>
              <em
                data-tone={tone}
                style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
              />
            </i>
          </>
        );
        return hrefFor ? (
          <Link className={styles.bar} href={hrefFor(item)} key={item.value}>
            {content}
          </Link>
        ) : (
          <div className={styles.bar} key={item.value}>
            {content}
          </div>
        );
      })}
      {note && <p className={styles.barNote}>{note}</p>}
    </div>
  );
}

export default function CorpusIntelligence({
  compact = false,
  showAnalyticsLink = true,
}: {
  compact?: boolean;
  showAnalyticsLink?: boolean;
}) {
  const a = CORPUS_ANALYTICS;
  return (
    <section
      className={`${styles.root} ${compact ? styles.compact : styles.expanded}`}
      aria-labelledby="corpus-intelligence-title"
    >
      <header className={styles.heading}>
        <div>
          <span>Corpus intelligence</span>
          <h2 id="corpus-intelligence-title">
            See the record, its shape, and its limits.
          </h2>
          <p>
            Counts describe tracked public matters, not industry incidence.
            Failure and consequence tags can overlap. Monetary metrics use only
            records with a known amount.
          </p>
        </div>
        {showAnalyticsLink && (
          <Link href="/analytics">
            Open full analytics <ArrowRight />
          </Link>
        )}
      </header>
      <div className={styles.kpis}>
        <Link href="/cases">
          <Database />
          <span>Tracked matters</span>
          <strong>{a.total.toLocaleString()}</strong>
          <small>
            {a.countries} countries · {formatCaseDate(a.earliestDate)} to{" "}
            {formatCaseDate(a.latestDate)}
          </small>
        </Link>
        <Link href="/analytics?view=data#source-quality">
          <FileCheck2 />
          <span>Source-linked</span>
          <strong>{a.sourceCoverage}%</strong>
          <small>
            {a.sourceLinked.toLocaleString()} of {a.total.toLocaleString()}{" "}
            records contain a source URL
          </small>
        </Link>
        <Link href="/analytics?view=explore&chart=courts">
          <Gavel />
          <span>Courts represented</span>
          <strong>{a.courts.toLocaleString()}</strong>
          <small>{a.states} US jurisdictions represented</small>
        </Link>
        <Link href="/cases?sort=date">
          <Globe2 />
          <span>Latest 30 days</span>
          <strong>{a.last30.toLocaleString()}</strong>
          <small>Relative to latest recorded decision</small>
        </Link>
        {!compact && (
          <Link href="/analytics?view=explore&chart=money">
            <BadgeDollarSign />
            <span>Known monetary total</span>
            <strong>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
                maximumFractionDigits: 2,
              }).format(a.knownAmountTotal)}
            </strong>
            <small>{a.knownAmounts.toLocaleString()} records with a recorded amount</small>
          </Link>
        )}
      </div>
      <div className={styles.grid}>
        <div className={styles.chart}>
          <div className={styles.chartHead}>
            <div>
              <span>Corpus growth</span>
              <strong>Cumulative record and monthly additions</strong>
              <small>Interactive decision-date view</small>
            </div>
          </div>
          <AnalyticsGrowthChart points={a.months} compact={compact} />
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Observed consequences</span>
              <strong>What the record says happened</strong>
            </div>
            <small>tags overlap</small>
          </div>
          <Bars
            items={a.consequences.slice(0, 5)}
            tone="amber"
            hrefFor={(item) => caseHref("q", item.value)}
          />
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Recurring signals</span>
              <strong>Leading failure modes</strong>
            </div>
            <small>tags overlap</small>
          </div>
          <Bars
            items={a.failures.slice(0, 5)}
            tone="amber"
            hrefFor={(item) => caseHref("failure", item.value)}
          />
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Concentration</span>
              <strong>Most represented courts</strong>
            </div>
            <small>corpus coverage</small>
          </div>
          <Bars
            items={a.courtsRanked.slice(0, 5)}
            hrefFor={(item) => caseHref("court", item.value)}
          />
        </div>
        {!compact && (
          <>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Attribution status</span>
                  <strong>How AI involvement is recorded</strong>
                </div>
                <small>record classification</small>
              </div>
              <Bars
                items={a.attribution}
                tone="green"
                hrefFor={(item) =>
                  item.value === "allegation-only"
                    ? caseHref("status", "alleged")
                    : item.value === "named-tool-recorded"
                      ? "/analytics?view=explore&chart=tools"
                      : caseHref(
                          "q",
                          item.value === "tool-unidentified"
                            ? "Unidentified"
                            : "AI implied unspecified",
                        )
                }
                note="A recorded name or implication is not proof of causation; inspect the underlying source."
              />
            </div>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Source quality</span>
                  <strong>Linked evidence by source tier</strong>
                </div>
                <small>URL classification</small>
              </div>
              <Bars
                items={a.sourceTiers}
                tone="green"
                hrefFor={() => "/analytics?view=data#source-quality"}
                note="A source link improves traceability but does not mean every field was independently verified."
              />
            </div>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Review status</span>
                  <strong>Recorded human review coverage</strong>
                </div>
                <UserCheck />
              </div>
              <Bars
                items={[
                  { value: "reviewed", label: "Marked human-reviewed", count: a.reviewed },
                  {
                    value: "not-reviewed",
                    label: "Not marked human-reviewed",
                    count: a.total - a.reviewed,
                  },
                ]}
                tone="green"
                hrefFor={(item) =>
                  `/analytics?view=explore&review=${item.value}`
                }
                note="Review status reflects the tracker field; absence of a mark does not prove no review occurred."
              />
            </div>
          </>
        )}
      </div>
      <footer className={styles.foot}>
        <span>
          <b>{a.nonAlleged.toLocaleString()}</b> non-allegation-only records
        </span>
        <span>
          <BadgeDollarSign /> <b>{a.knownAmounts.toLocaleString()}</b> known
          monetary amounts
        </span>
        <span>
          <b>{a.sourceMissing}</b> missing source links
        </span>
        <Link href="/sources">
          Read methodology <ArrowRight />
        </Link>
      </footer>
    </section>
  );
}
