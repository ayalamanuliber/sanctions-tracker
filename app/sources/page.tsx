import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  CircleAlert,
  Database,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Gauge,
  Globe2,
  Landmark,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
  Tags,
} from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import {
  COUNTRIES_TRACKED,
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  LEGAL_RISK_CASES,
  formatCaseDate,
  sourcePublisher,
  sourceTier,
} from "@/lib/cases";
import {
  passesPublicationBaseline,
  PUBLICATION_CASE_COUNT,
} from "@/lib/publication";
import { ENTITY_MEDIA_COUNTS, ENTITY_MEDIA_REVISION } from "@/lib/entity-media";
import { getEntities } from "@/lib/entity-pages";
import { publicUrl } from "@/lib/site";
import styles from "./sources.module.css";

export const metadata: Metadata = {
  title: "Methodology and Sources | AI Vortex",
  description:
    "How AI Vortex identifies, classifies, sources, updates, and corrects legal AI risk matters.",
  alternates: { canonical: publicUrl("/sources") },
};

const readingSteps = [
  {
    icon: Search,
    label: "Identify",
    title: "Start with the matter",
    body: "Use a stable case, court, date, and jurisdiction before interpreting a pattern.",
    href: "#coverage",
  },
  {
    icon: Landmark,
    label: "Verify",
    title: "Open the source",
    body: "Treat the linked order, filing, opinion, or attributable record as controlling.",
    href: "#source-hierarchy",
  },
  {
    icon: Tags,
    label: "Interpret",
    title: "Read the status",
    body: "Separate allegations, attribution, classifications, and recorded consequences.",
    href: "#classification",
  },
  {
    icon: ShieldCheck,
    label: "Preserve",
    title: "Keep the boundary",
    body: "Carry uncertainty, missing fields, and review status into every shared artifact.",
    href: "#updates",
  },
];

const inclusionStandards = [
  "A publicly identifiable legal matter or proceeding exists.",
  "A source document or attributable public record supports inclusion.",
  "The record contains a legal AI issue, verification failure, or closely related allegation.",
  "The matter can be classified without inventing facts absent from the source.",
];

const sourceHierarchy = [
  {
    icon: Landmark,
    rank: "01",
    title: "Official court or government source",
    body: "A link hosted by the issuing court, tribunal, or government domain.",
  },
  {
    icon: FileSearch,
    rank: "02",
    title: "Docket or legal-document mirror",
    body: "A repository preserving the filing, order, opinion, or docket material.",
  },
  {
    icon: Archive,
    rank: "03",
    title: "Publisher archive",
    body: "An upstream archive preserving the relevant record without being the issuing court.",
  },
  {
    icon: Link2,
    rank: "04",
    title: "Secondary or other link",
    body: "Contextual material that requires additional source review before reliance.",
  },
];

export default function SourcesPage() {
  const linked = LEGAL_RISK_CASES.filter((item) => item.source_url).length;
  const nonAlleged = LEGAL_RISK_CASES.filter((item) => !item.alleged).length;
  const indexable = PUBLICATION_CASE_COUNT;
  const evidenceBaseline = LEGAL_RISK_CASES.filter((item) =>
    passesPublicationBaseline(item.slug),
  ).length;
  const limited = LEGAL_RISK_CASES.length - evidenceBaseline;
  const linkedPct = Math.round((linked / LEGAL_RISK_CASES.length) * 1000) / 10;
  const tierCounts = new Map<string, { label: string; count: number }>();

  for (const item of LEGAL_RISK_CASES) {
    const tier = sourceTier(item);
    const current = tierCounts.get(tier.key) || { label: tier.label, count: 0 };
    current.count += 1;
    tierCounts.set(tier.key, current);
  }

  const publishers = new Map<string, number>();
  for (const item of LEGAL_RISK_CASES) {
    const publisher = sourcePublisher(item);
    publishers.set(publisher, (publishers.get(publisher) || 0) + 1);
  }
  const topPublishers = [...publishers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const metrics = [
    {
      icon: Database,
      label: "Corpus records",
      value: LEGAL_RISK_CASES.length.toLocaleString(),
      note: "Stable public case pages",
    },
    {
      icon: ShieldCheck,
      label: "Non-alleged",
      value: nonAlleged.toLocaleString(),
      note: "Corpus status, not an adjudication",
    },
    {
      icon: Link2,
      label: "Source-linked",
      value: `${linkedPct}%`,
      note: `${linked.toLocaleString()} recorded links`,
    },
    {
      icon: Globe2,
      label: "Countries covered",
      value: COUNTRIES_TRACKED.toLocaleString(),
      note: "Observed public records",
    },
  ];

  return (
    <ResearchShell>
      <main className={shell.main}>
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Methodology and sources</span>
        </div>

        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>Evidence transparency</span>
            <h1>Methodology and source record</h1>
            <p>
              How matters enter the corpus, how classifications are applied,
              what the tracker can and cannot establish, and how to inspect or
              correct the underlying record.
            </p>
          </div>
          <div className={shell.headActions}>
            <Link className={shell.button} href="/cases">
              Search the corpus
            </Link>
            <Link className={shell.buttonSecondary} href="/submit">
              Suggest a correction
            </Link>
          </div>
        </header>

        <section className={styles.metrics} aria-label="Corpus methodology metrics">
          {metrics.map(({ icon: Icon, label, value, note }) => (
            <article className={styles.metric} key={label}>
              <Icon aria-hidden="true" />
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
                <span>{note}</span>
              </div>
            </article>
          ))}
        </section>

        <nav className={styles.readingPath} aria-label="How to read the tracker">
          <div className={styles.readingIntro}>
            <span>How to read the tracker</span>
            <h2>Four moves before reliance.</h2>
          </div>
          {readingSteps.map(({ icon: Icon, label, title, body, href }) => (
            <a href={href} key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <strong>{title}</strong>
              <p>{body}</p>
              <ArrowRight aria-hidden="true" />
            </a>
          ))}
        </nav>

        <div className={styles.layout}>
          <div>
            <section id="coverage" className={`${shell.card} ${styles.section}`}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Database aria-hidden="true" /></div>
                <div>
                  <span>01 · Corpus boundary</span>
                  <h2>What the tracker covers</h2>
                </div>
              </div>
              <p className={styles.lead}>
                AI Vortex tracks public court matters, orders, disciplinary
                records, and other documented legal proceedings in which
                generative AI, fabricated authority, inaccurate quotations,
                unsupported propositions, or related verification failures are
                part of the public record.
              </p>
              <h3>Inclusion standard</h3>
              <ol className={styles.standardList}>
                {inclusionStandards.map((item) => (
                  <li key={item}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <div className={styles.boundaryCallout}>
                <CircleAlert aria-hidden="true" />
                <p>
                  <strong>Read status before outcome.</strong> “Non-alleged” is
                  a corpus flag, not proof of a final adjudicated misconduct
                  finding. Warnings, show-cause orders, procedural rulings, and
                  final outcomes require separate reading of the underlying
                  record.
                </p>
              </div>
            </section>

            <section id="classification" className={`${shell.card} ${styles.section}`}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Gauge aria-hidden="true" /></div>
                <div>
                  <span>02 · Reading the fields</span>
                  <h2>Classification framework</h2>
                </div>
              </div>
              <div className={styles.classificationGrid}>
                <article>
                  <Gauge aria-hidden="true" />
                  <h3>Editorial impact</h3>
                  <p>
                    Summarizes the observed procedural, monetary, professional,
                    or case-level consequence. It is not a prediction of future
                    sanctions.
                  </p>
                </article>
                <article>
                  <Tags aria-hidden="true" />
                  <h3>Failure modes</h3>
                  <p>
                    Tags can overlap. One matter may contain fake citations,
                    fabricated quotations, and misrepresented authority.
                  </p>
                </article>
                <article>
                  <Bot aria-hidden="true" />
                  <h3>AI tools</h3>
                  <p>
                    Tool names appear only when recorded. “Unidentified” does
                    not imply a vendor, and counts are not usage-adjusted rates.
                  </p>
                </article>
              </div>
            </section>

            <section id="source-hierarchy" className={`${shell.card} ${styles.section}`}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Landmark aria-hidden="true" /></div>
                <div>
                  <span>03 · Traceability</span>
                  <h2>Source and review hierarchy</h2>
                </div>
              </div>
              <p className={styles.provenance}>
                <strong>Corpus provenance.</strong> The base incident archive
                and many preserved source documents are supplied through Damien
                Charlotin&apos;s public legal AI case archive. AI Vortex
                independently imports, normalizes, classifies, enriches,
                presents, and maintains this research layer; that work does not
                imply endorsement of AI Vortex or its classifications.
              </p>
              <div className={styles.sourceLadder}>
                {sourceHierarchy.map(({ icon: Icon, rank, title, body }) => (
                  <article key={rank}>
                    <b>{rank}</b>
                    <Icon aria-hidden="true" />
                    <div><strong>{title}</strong><p>{body}</p></div>
                  </article>
                ))}
              </div>
              <p className={styles.sourceNote}>
                Source tier describes where the link points. It does not certify
                that AI Vortex independently verified every field. Treat the
                linked document as controlling and report discrepancies for
                review.
              </p>
              <div className={styles.gateGrid}>
                <div>
                  <FileCheck2 aria-hidden="true" />
                  <p>
                    <strong>Public indexing and evidence depth</strong>
                    All {indexable.toLocaleString()} corpus records have stable,
                    indexable public URLs. {evidenceBaseline.toLocaleString()} currently
                    meet the stronger publication and evidence baseline; the
                    remaining {limited.toLocaleString()} stay indexable with their
                    documented limitations disclosed on-page.
                  </p>
                </div>
                <div>
                  <ShieldCheck aria-hidden="true" />
                  <p>
                    <strong>Current review program</strong>
                    Source traceability and correction intake are live. A
                    corpus-wide independent field-by-field review is not
                    represented as complete.
                  </p>
                </div>
              </div>
            </section>

            <section id="entity-media" className={`${shell.card} ${styles.section}`}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><Camera aria-hidden="true" /></div>
                <div>
                  <span>04 · Entity media</span>
                  <h2>Portraits, courthouse images, and visual fallbacks</h2>
                </div>
              </div>
              <p className={styles.lead}>
                Entity images are local, versioned research assets. The current
                registry includes {ENTITY_MEDIA_COUNTS.judges} verified judicial
                portraits and {ENTITY_MEDIA_COUNTS.courts} verified representative
                courthouse images. Every real image retains its creator, source
                page, reuse license, alternative text, and caption in the page,
                report, and structured metadata.
              </p>
              <div className={styles.gateGrid}>
                <div>
                  <Camera aria-hidden="true" />
                  <p>
                    <strong>Real-image gate</strong>
                    A photograph appears only after the pictured person or
                    building and the reuse terms are verified. Wikimedia
                    Commons, official court materials, the Federal Judicial
                    Center, and GSA records may support that review; no Google
                    Images result is treated as a license.
                  </p>
                </div>
                <div>
                  <Landmark aria-hidden="true" />
                  <p>
                    <strong>Complete court coverage</strong>
                    All {getEntities("court").length.toLocaleString()} normalized
                    court profiles receive either a licensed representative
                    image or a first-party scope marker derived from recorded
                    geography and court classification. Scope markers are not
                    photographs, official seals, or location maps.
                  </p>
                </div>
              </div>
              <p className={styles.sourceNote}>
                Media registry revision {ENTITY_MEDIA_REVISION}. A courthouse
                image may show one representative building and does not imply
                that a court sits only at that location.
              </p>
            </section>

            <section id="updates" className={`${shell.card} ${styles.section}`}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}><RefreshCw aria-hidden="true" /></div>
                <div>
                  <span>05 · Maintenance</span>
                  <h2>Updates, corrections, and reproducibility</h2>
                </div>
              </div>
              <div className={styles.timeline}>
                <article>
                  <RefreshCw aria-hidden="true" />
                  <time>{formatCaseDate(LAST_CHECKED)}</time>
                  <div><strong>Corpus checked</strong><p>The upstream public dataset was checked and validated on this date. The latest tracked decision is {formatCaseDate(LATEST_RECORD_DATE)}.</p></div>
                </article>
                <article>
                  <Database aria-hidden="true" />
                  <time>Ongoing</time>
                  <div><strong>Source and classification review</strong><p>New documents, changed outcomes, and corrections are incorporated into later snapshots.</p></div>
                </article>
                <article>
                  <FileSearch aria-hidden="true" />
                  <time>On request</time>
                  <div><strong>Correction review</strong><p>Submit a case, source link, court order, or correction with supporting documentation.</p></div>
                </article>
              </div>
            </section>
          </div>

          <aside className={styles.rail}>
            <section className={`${shell.card} ${styles.section}`}>
              <div className={styles.railHeading}><Link2 aria-hidden="true" /><div><span>Traceability</span><h2>Source coverage</h2></div></div>
              <div className={styles.coverageMeter}>
                <div><strong>{linked.toLocaleString()}</strong><span>linked records</span></div>
                <b>{linkedPct}%</b>
                <i><span style={{ width: `${(linked / LEGAL_RISK_CASES.length) * 100}%` }} /></i>
                <small>{(LEGAL_RISK_CASES.length - linked).toLocaleString()} records currently lack a source URL and remain visibly identifiable.</small>
              </div>
              <h3>Source tiers</h3>
              <div className={styles.sourceTypes}>
                {[...tierCounts.entries()].map(([key, value]) => (
                  <div className={styles.sourceType} key={key}><strong>{value.label}</strong><span>{value.count.toLocaleString()}</span></div>
                ))}
              </div>
              <h3>Leading linked publishers</h3>
              <div className={styles.sourceTypes}>
                {topPublishers.map(([name, count]) => (
                  <div className={styles.sourceType} key={name}><strong>{name}</strong><span>{count.toLocaleString()}</span></div>
                ))}
              </div>
            </section>

            <section className={`${shell.card} ${styles.section}`}>
              <div className={styles.railHeading}><FileCheck2 aria-hidden="true" /><div><span>Artifacts</span><h2>Research exports</h2></div></div>
              <div className={styles.download}>
                <Link href="/api/artifact?type=source&format=md">Global source appendix <ExternalLink /></Link>
                <Link href="/api/artifact?type=source&format=md&state=NJ">New Jersey appendix <ExternalLink /></Link>
                <Link href="/api/artifact?type=source&format=md&state=NY">New York appendix <ExternalLink /></Link>
                <Link href="/analytics/print?tier=free">Current analytics brief <ExternalLink /></Link>
              </div>
            </section>

            <section className={`${styles.boundaryRail}`}>
              <ShieldCheck aria-hidden="true" />
              <span>Important boundary</span>
              <h2>Observed record, not a risk score.</h2>
              <p>
                The corpus covers {COUNTRIES_TRACKED} countries. It does not
                establish AI prevalence, compare vendors by failure rate,
                replace legal research, or provide legal advice. Monetary
                amounts must not be aggregated across currencies without
                normalization.
              </p>
              <Link href="/about">About the publisher <ArrowRight /></Link>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
