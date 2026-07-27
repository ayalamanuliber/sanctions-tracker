import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  FileText,
  Landmark,
  MapPin,
  Scale,
} from "lucide-react";
import { notFound } from "next/navigation";

import { ReportBrandLockup } from "@/components/reports/ReportBrandLockup";
import { ReportPreviewToolbar } from "@/components/reports/ReportPreviewToolbar";
import { getCaseEditorial } from "@/lib/case-editorial";
import {
  LAST_CHECKED,
  formatCaseDate,
  getCaseBySlug,
  getRelatedCaseReason,
  getRelatedCases,
  sourcePublisher,
  sourceTier,
} from "@/lib/cases";
import { createReportId, readReportBrand, type ReportTier } from "@/lib/reporting";
import { getCaseIntelligence } from "@/lib/case-intelligence";
import { assetUrl } from "@/lib/site";
import styles from "./brief.module.css";

type Params = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Params>;
};

export const metadata: Metadata = {
  title: "Case Brief | AI Vortex",
  description: "A source-backed case brief from AI Vortex Legal AI Risk Intelligence.",
  robots: { index: false, follow: true },
};

function first(params: Params, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function humanize(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function CaseBriefPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const item = getCaseBySlug(slug);
  if (!item) notFound();

  const query = (await searchParams) || {};
  const tier: ReportTier = first(query, "tier") === "premium" ? "premium" : "free";
  const brandKey = readReportBrand(first(query, "brand"));
  const editorial = getCaseEditorial(item);
  const intelligence = getCaseIntelligence(item.id);
  const directAnswer = editorial.reviewedForPublication ? editorial.directAnswer : intelligence?.summary || editorial.directAnswer;
  const evidenceBoundary = intelligence?.evidence_boundary || editorial.limitations;
  const source = sourceTier(item);
  const related = getRelatedCases(item, 3).filter((candidate) =>
    getRelatedCaseReason(item, candidate),
  );
  const reportId = createReportId("AV-CB", item.slug);
  const generated = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const outcome =
    item.outcome ||
    (item.amount
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(item.amount)
      : "") ||
    item.sanction_types.map(humanize).join(", ") ||
    "No outcome recorded";
  const knownAmount = item.amount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(item.amount)
    : "Not recorded";
  const issueLabels = [...new Set([...item.tags, ...item.sanction_types])].slice(0, 6);

  return (
    <main className={styles.page}>
      <ReportPreviewToolbar
        backHref={`/cases/${item.slug}`}
        backLabel="Back to case record"
        tier={tier}
        title={`${item.case_name} | AI Vortex Case Brief`}
      />

      <article className={`${styles.sheet} ${tier === "premium" ? styles.proSheet : ""}`}>
        <header className={styles.header}>
          <ReportBrandLockup brand={brandKey} tier={tier} />
          <div className={styles.documentMeta}>
            <strong>CASE BRIEF / REVIEW PACKET</strong>
            <span>{reportId}</span>
            <span>Generated {generated}</span>
            <span>Evidence checked {formatCaseDate(LAST_CHECKED)}</span>
          </div>
        </header>

        <nav className={styles.reportNav} aria-label="Case report links">
          <Link href={`/cases/${item.slug}`}>
            <FileText size={15} aria-hidden="true" />
            View canonical case record
          </Link>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" />
              Open underlying court source
            </a>
          )}
        </nav>

        <section className={styles.titleBlock}>
          <div>
            <span className={styles.eyebrow}>
              {item.alleged ? "PUBLIC ALLEGATION RECORD" : "TRACKED PUBLIC MATTER"}
            </span>
            <h1>{item.case_name}</h1>
            <p>
              {item.court || "Court not recorded"} · {formatCaseDate(item.date)}
              {item.judge ? ` · ${item.judge}` : ""}
            </p>
          </div>
          <dl className={styles.identity}>
            <div><dt><MapPin size={13} aria-hidden="true" />Jurisdiction</dt><dd>{item.jurisdiction || item.country || "Not recorded"}</dd></div>
            <div><dt><Landmark size={13} aria-hidden="true" />Court</dt><dd>{item.court || "Not recorded"}</dd></div>
            <div><dt><FileText size={13} aria-hidden="true" />Record ID</dt><dd>{item.id || "Not recorded"}</dd></div>
            <div><dt><Scale size={13} aria-hidden="true" />Observed outcome</dt><dd>{outcome}</dd></div>
            <div><dt><Banknote size={13} aria-hidden="true" />Known monetary consequence</dt><dd>{knownAmount}</dd></div>
          </dl>
        </section>

        <section className={styles.readout}>
          <span className={styles.eyebrow}>ADVISOR READOUT</span>
          <h2>Why this matter warrants attention</h2>
          <p>{directAnswer}</p>
          <div className={styles.readoutGrid}>
            <div><strong>Why the decision-maker cared</strong><p>{editorial.whyCourtCared}</p></div>
            <div><strong>Why it matters now</strong><p>{editorial.reviewedForPublication ? editorial.whyItMatters : intelligence?.why_it_matters || editorial.whyItMatters}</p></div>
          </div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <span className={styles.eyebrow}>RECORDED ISSUES</span>
            <h2>Failure modes and consequences</h2>
            {issueLabels.length ? (
              <ul className={styles.labels}>
                {issueLabels.map((label) => <li key={label}>{humanize(label)}</li>)}
              </ul>
            ) : (
              <p>No classified issue labels are recorded.</p>
            )}
            <dl className={styles.facts}>
              <div><dt>AI attribution</dt><dd>{humanize(editorial.attributionStatus)}</dd></div>
              <div><dt>Recorded tool</dt><dd>{item.ai_tool_used || "Unidentified"}</dd></div>
              <div><dt>Known monetary consequence</dt><dd>{knownAmount}</dd></div>
              <div><dt>Procedural posture</dt><dd>{editorial.proceduralPosture}</dd></div>
            </dl>
          </section>

          <section className={styles.panel}>
            <span className={styles.eyebrow}>PRIMARY SOURCE</span>
            <h2>{sourcePublisher(item)}</h2>
            <p><strong>{source.label}.</strong> {source.description}</p>
            {item.source_url ? (
              <a className={styles.sourceLink} href={item.source_url} target="_blank" rel="noreferrer">
                Open underlying source <ExternalLink size={14} />
              </a>
            ) : (
              <p className={styles.missing}>No public source link is currently recorded.</p>
            )}
            <p className={styles.sourceNote}>
              A recorded source link is not a substitute for checking the underlying order,
              filing, opinion, or disciplinary record.
            </p>
          </section>
        </div>

        <section className={styles.boundary}>
          <div>
            <span className={styles.eyebrow}>EVIDENCE BOUNDARY</span>
            <h2>What this record does—and does not—establish</h2>
          </div>
          <div>
            <p>{editorial.attributionBasis}</p>
            <p>{evidenceBoundary}</p>
            {item.alleged && (
              <p><strong>Allegation status:</strong> no adjudicated finding is represented by this brief.</p>
            )}
          </div>
        </section>

        <section className={styles.controls}>
          <span className={styles.eyebrow}>PRACTICAL REVIEW IMPLICATIONS</span>
          <h2>Controls suggested by the public record</h2>
          <ol>
            {(intelligence?.practical_implications?.length ? intelligence.practical_implications : [
              "Verify every cited authority, quotation, pincite, and proposition against the primary material.",
              "Preserve the verification record and escalate unresolved exceptions to the responsible reviewer.",
              "Confirm disclosure, supervision, and filing requirements for the governing court and jurisdiction.",
              "Review corrective conduct and procedural posture before drawing comparisons to another matter.",
            ]).map((implication) => <li key={implication}><CheckCircle2 size={16} aria-hidden="true" /><span>{implication}</span></li>)}
          </ol>
        </section>

        {related.length > 0 && (
          <section className={styles.related}>
            <div>
              <span className={styles.eyebrow}>EXPLAINABLE COMPARATORS</span>
              <h2>Related public matters</h2>
            </div>
            <div className={styles.relatedList}>
              {related.map((candidate) => (
                <Link href={`/cases/${candidate.slug}`} key={candidate.slug}>
                  <strong>{candidate.case_name}</strong>
                  <span>{candidate.court} · {formatCaseDate(candidate.date)}</span>
                  <em>{getRelatedCaseReason(item, candidate)}</em>
                </Link>
              ))}
            </div>
          </section>
        )}

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
            <Link href={`/cases/${item.slug}/brief?tier=${tier}&brand=${brandKey}`}>View live report</Link>
            <span>Corpus checked {formatCaseDate(LAST_CHECKED)}</span>
            <Link href="/sources">Methodology</Link>
            <span>Public intelligence, not legal advice.</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
