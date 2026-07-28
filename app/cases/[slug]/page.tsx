import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Bot,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileDown,
  FolderPlus,
  Gavel,
  GitBranch,
  Globe2,
  Landmark,
  Mail,
  MapPin,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { StateScopeMark } from "@/components/reports/StateScopeMark";
import { getCaseEditorial } from "@/lib/case-editorial";
import {
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  LEGAL_RISK_CASES,
  formatCaseDate,
  getCaseBySlug,
  getRelatedCaseReason,
  getRelatedCases,
  sourcePublisher,
  sourceTier,
} from "@/lib/cases";
import { getPublicationReadiness, isIndexEligible } from "@/lib/publication";
import {
  conciseCaseAnswer,
  getCaseIntelligence,
} from "@/lib/case-intelligence";
import {
  caseSeoTitle,
  cleanImportedText,
  excerptAtWordBoundary,
} from "@/lib/case-seo";
import { PUBLIC_BASE_URL, PUBLIC_ORIGIN, publicUrl } from "@/lib/site";
import styles from "./case.module.css";

type Props = { params: Promise<{ slug: string }> };

const NARRATIVE_HEADINGS = [
  "AI Use",
  "Hallucination Details",
  "Ruling/Sanction",
  "Key Judicial Reasoning",
];

function narrativeSections(value: string) {
  const clean = cleanImportedText(value);
  const marker = new RegExp(
    `(${NARRATIVE_HEADINGS.map((heading) => heading.replace("/", "\\/")).join("|")})`,
    "g",
  );
  const parts = clean.split(marker).filter(Boolean);
  const sections: { heading: string; body: string }[] = [];
  let heading = "Matter overview";
  for (const part of parts) {
    if (NARRATIVE_HEADINGS.includes(part)) heading = part;
    else if (part.trim())
      sections.push({ heading, body: part.trim().replace(/^:\s*/, "") });
  }
  return sections;
}

export const dynamicParams = true;
export function generateStaticParams() {
  return LEGAL_RISK_CASES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getCaseBySlug((await params).slug);
  if (!item) return { title: "Case not found | AI Vortex" };
  const intelligence = getCaseIntelligence(item.id);
  const summary = conciseCaseAnswer(intelligence?.summary || item.summary, 500);
  const answerContext =
    `${summary} ${intelligence?.why_it_matters || ""}`.trim();
  const socialImage = publicUrl(`/cases/${item.slug}/opengraph-image`);
  const title = caseSeoTitle(item);
  const description = excerptAtWordBoundary(
    `${item.court}, ${formatCaseDate(item.date)}. ${answerContext}`,
    158,
  );
  return {
    title,
    description,
    alternates: { canonical: publicUrl(`/cases/${item.slug}`) },
    openGraph: {
      title,
      description: excerptAtWordBoundary(answerContext, 200),
      url: publicUrl(`/cases/${item.slug}`),
      type: "article",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: `${item.case_name} legal AI risk record`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: excerptAtWordBoundary(answerContext, 200),
      images: [socialImage],
    },
    robots: isIndexEligible(item.slug)
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
          },
        }
      : { index: false, follow: true },
  };
}

export default async function CasePage({ params }: Props) {
  const item = getCaseBySlug((await params).slug);
  if (!item) notFound();
  const related = getRelatedCases(item);
  const source = sourcePublisher(item);
  const tier = sourceTier(item);
  const editorial = getCaseEditorial(item);
  const intelligence = getCaseIntelligence(item.id);
  const evidenceReview = intelligence?.evidence_review;
  const evidenceReviewedAt = evidenceReview?.reviewed_at || null;
  const evidenceReviewCopy = evidenceReview
    ? {
        "primary-document-verified":
          "The linked primary document was extracted and checked with page-level evidence locators.",
        "primary-document-limited":
          "The primary document was retrieved, but one or more case-level facts could not be tied to a page-located passage. The structured corpus baseline is preserved without upgrading those claims.",
        "primary-source-excerpt":
          "A case-specific primary-source excerpt was checked; review the complete source before relying.",
        "secondary-source-only":
          "Only case-specific secondary coverage was accessible. It provides context, not independent proof of the underlying ruling.",
        "metadata-only":
          "The linked page is generic, shared, or insufficiently case-specific. This page therefore preserves only the structured corpus baseline.",
        "source-unavailable":
          "The linked source could not be retrieved during the latest evidence pass. This page preserves the structured corpus baseline and states the gap explicitly.",
      }[evidenceReview.status]
    : null;
  const directAnswer = editorial.reviewedForPublication
    ? editorial.directAnswer
    : intelligence?.direct_answer ||
      conciseCaseAnswer(intelligence?.summary || editorial.directAnswer);
  const whyItMatters = editorial.reviewedForPublication
    ? editorial.whyItMatters
    : intelligence?.why_it_matters || editorial.whyItMatters;
  const whyCourtCared = editorial.reviewedForPublication
    ? editorial.whyCourtCared
    : intelligence?.judicial_reasoning ||
      intelligence?.decision_context ||
      "The linked source identifies an AI-related issue but does not support a more specific account of the decision-maker's reasoning.";
  const evidenceBoundary =
    intelligence?.evidence_boundary || editorial.limitations;
  const proceduralPosture =
    intelligence?.procedural_posture || editorial.proceduralPosture;
  const attributionStatus =
    intelligence?.ai_attribution_status?.replaceAll("_", " ") ||
    editorial.attributionStatus.replaceAll("-", " ");
  const attributionBasis =
    intelligence?.evidence_notes?.find((note) => note.field === "recorded_tool")
      ?.basis || editorial.attributionBasis;
  const publication = getPublicationReadiness(item.slug);
  const publicRecordStatus = item.alleged
    ? "allegation or unresolved matter"
    : "public record, not an allegation-only entry";
  const narrative = narrativeSections(intelligence?.summary || item.summary);
  const discrepancies =
    item.hallucination_items?.split(" || ").filter(Boolean) || [];
  const intelligenceAmount = intelligence?.monetary_consequence?.known
    ? intelligence.monetary_consequence.amount
    : null;
  const knownAmountValue = intelligenceAmount ?? item.amount;
  const knownAmountCurrency = intelligence?.monetary_consequence?.known
    ? intelligence.monetary_consequence.currency
    : "USD";
  const knownAmount =
    knownAmountValue !== null && knownAmountCurrency
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: knownAmountCurrency,
          maximumFractionDigits: 0,
        }).format(knownAmountValue)
      : intelligence?.monetary_consequence?.known && knownAmountValue !== null
        ? "Recorded in local statutory unit"
        : "Not recorded";
  const outcome =
    intelligence?.outcome_summary ||
    item.outcome ||
    (knownAmountValue ? knownAmount : "") ||
    item.sanction_types.map((v) => v.replaceAll("-", " ")).join(", ") ||
    "Tracked public outcome";
  const facts = [
    { label: "Court", value: item.court, icon: Landmark },
    ...(item.judge
      ? [
          {
            label: "Recorded decision-maker",
            value: item.judge_role
              ? `${item.judge} · ${item.judge_role}`
              : item.judge,
            icon: Gavel,
          },
        ]
      : []),
    { label: "Jurisdiction", value: item.jurisdiction, icon: MapPin },
    {
      label: "Circuit",
      value: item.circuit || "Not recorded",
      icon: GitBranch,
    },
    { label: "Date", value: formatCaseDate(item.date), icon: CalendarDays },
    {
      label: "AI tool",
      value: intelligence?.recorded_tool || item.ai_tool_used || "Unidentified",
      icon: Bot,
      tool: true,
    },
    {
      label: "Party type",
      value: item.party || "Not classified",
      icon: UserRound,
    },
    {
      label: "Outcome",
      value: intelligence?.outcome_summary || item.outcome || "See source",
      icon: Gavel,
    },
    { label: "Known amount", value: knownAmount, icon: Banknote },
    {
      label: "Professional sanction",
      value:
        intelligence?.professional_consequence ||
        item.professional_sanction ||
        "Not recorded",
      icon: ShieldAlert,
    },
  ];
  const canonicalUrl = publicUrl(`/cases/${item.slug}`);
  const correctionHref = `/submit?${new URLSearchParams({
    case_id: item.id,
    case_slug: item.slug,
    record_url: canonicalUrl,
    case_name: item.case_name,
    court: item.court,
  }).toString()}`;
  const socialImage = publicUrl(`/cases/${item.slug}/opengraph-image`);
  const schemaDescription = excerptAtWordBoundary(directAnswer, 320);
  const organizationId = `${PUBLIC_ORIGIN}/#organization`;
  const authorId = `${PUBLIC_ORIGIN}/#manu-ayala`;
  const sourceWork = item.source_url
    ? {
        "@type": "CreativeWork",
        name: source,
        url: item.source_url,
      }
    : undefined;
  const caseFaqs = [
    { question: `What happened in ${item.case_name}?`, answer: directAnswer },
    {
      question: `Why does ${item.case_name} matter for legal AI risk?`,
      answer: whyItMatters,
    },
    {
      question: `What does the public record establish about ${item.case_name}?`,
      answer: evidenceBoundary,
    },
    {
      question: `Which source supports this ${item.case_name} summary?`,
      answer: `The recorded source is ${source}. It is classified as ${tier.label.toLowerCase()}; review the linked material and subsequent docket history before relying on this summary.`,
    },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "AI Vortex",
        url: "https://www.aivortex.io/",
      },
      {
        "@type": "Person",
        "@id": authorId,
        name: "Manu Ayala",
        url: publicUrl("/about"),
        sameAs: ["https://www.linkedin.com/in/aivortex/"],
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: item.case_name,
        description: schemaDescription,
        inLanguage: "en-US",
        isAccessibleForFree: true,
        // A decision date is not a page-publication date. Only emit an
        // editorial timestamp where this specific record has an evidence pass.
        dateModified: evidenceReviewedAt || undefined,
        mainEntity: { "@id": `${canonicalUrl}#article` },
        breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: item.case_name,
        description: schemaDescription,
        inLanguage: "en-US",
        dateModified: evidenceReviewedAt || undefined,
        author: { "@id": authorId },
        publisher: { "@id": organizationId },
        image: socialImage,
        mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
        citation: item.source_url ? [item.source_url] : undefined,
        isBasedOn: sourceWork,
        keywords: item.tags.map((tag) => tag.replaceAll("-", " ")),
        about: [
          item.court,
          item.jurisdiction,
          ...item.tags.map((tag) => tag.replaceAll("-", " ")),
        ].map((name) => ({ "@type": "Thing", name })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Legal AI Risk",
            item: PUBLIC_BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Cases",
            item: publicUrl("/cases"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: item.case_name,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "Dataset",
        "@id": `${PUBLIC_BASE_URL}#dataset`,
        name: "AI Vortex Legal AI Risk Corpus",
        description:
          "Source-linked public records of legal AI sanctions, citation failures, court responses, and related professional consequences.",
        url: PUBLIC_BASE_URL,
        creator: { "@id": organizationId },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: caseFaqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <ResearchShell>
      <main className={shell.main}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/cases">Cases</Link>
          <span aria-hidden="true">/</span>
          <span>{item.case_name}</span>
        </div>
        {item.alleged && (
          <div className={styles.notice}>
            <strong>Allegation status:</strong> this record tracks a public
            allegation or unresolved matter. It must not be described as an
            adjudicated finding.
          </div>
        )}
        {evidenceReview && evidenceReviewCopy && (
          <div className={styles.draftNotice}>
            <ShieldCheck size={17} />
            <span>
              <strong>
                Evidence review: {evidenceReview.status.replaceAll("-", " ")}.
              </strong>{" "}
              {evidenceReviewCopy}
            </span>
          </div>
        )}
        {!editorial.reviewedForPublication && (
          <div className={styles.draftNotice}>
            <AlertTriangle size={17} />
            <span>
              <strong>Evidence-linked corpus record:</strong> this page is
              generated from the structured public record and has a
              publication-readiness score of {publication.score}/100.{" "}
              {isIndexEligible(item.slug)
                ? "It passes the current publication gate; that is not a legal-editorial review or a guarantee that every field has been independently verified."
                : "It remains available for research but is excluded from search indexing until its documented evidence gaps are resolved."}
            </span>
          </div>
        )}
        <div className={styles.hero}>
          <section className={`${shell.card} ${styles.titleCard}`}>
            <span className={shell.eyebrow}>
              {editorial.reviewedForPublication
                ? "Reviewed matter record"
                : "Corpus matter record"}
            </span>
            <h1>{item.case_name}</h1>
            <p className={styles.courtLine}>
              {item.court} · {formatCaseDate(item.date)}
              {item.judge ? ` · ${item.judge}` : ""}
            </p>
            <div className={styles.chips}>
              <span className={styles.chip}>
                {item.country === "US"
                  ? `${item.state} / ${item.jurisdiction}`
                  : item.country}
              </span>
              <span
                className={`${styles.chip} ${item.severity === "high" || item.severity === "career-ending" ? styles.chipDanger : ""}`}
              >
                Editorial impact: {item.severity.replace("-", " ")}
              </span>
              {item.tags.slice(0, 4).map((tag) => (
                <span className={styles.chip} key={tag}>
                  {tag.replaceAll("-", " ")}
                </span>
              ))}
            </div>
          </section>
          <aside className={styles.outcome}>
            <small>Observed outcome</small>
            <strong>{outcome}</strong>
            <p>
              {item.alleged
                ? "Public allegation; no adjudicated conclusion is represented here."
                : "Outcome recorded in the tracked public source. Review the underlying document before relying on this summary."}
            </p>
          </aside>
        </div>

        <section
          className={`${shell.card} ${styles.answerBlock}`}
          aria-labelledby="direct-answer-title"
        >
          <div>
            <span>Direct answer</span>
            <h2 id="direct-answer-title">What happened in this matter?</h2>
          </div>
          <p>{directAnswer}</p>
          <dl>
            <div>
              <dt>Why the court cared</dt>
              <dd>{whyCourtCared}</dd>
            </div>
            <div>
              <dt>Why it matters now</dt>
              <dd>{whyItMatters}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.grid}>
          <div>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Why this matter is tracked</h2>
              <div className={styles.narrative}>
                {narrative.map((part, index) => (
                  <div
                    key={`${part.heading}-${index}`}
                    className={
                      index ? styles.narrativeDetail : styles.narrativeLead
                    }
                  >
                    {index > 0 && <h3>{part.heading}</h3>}
                    <p>{part.body}</p>
                  </div>
                ))}
              </div>
              {(item.lesson || intelligence?.why_it_matters) && (
                <div className={styles.lesson}>
                  <strong>Operational lesson</strong>
                  <p>{item.lesson || intelligence?.why_it_matters}</p>
                </div>
              )}
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Record details</h2>
              {item.country === "US" && item.state && (
                <div className={styles.stateContext}>
                  <StateScopeMark state={item.state} />
                  <span>
                    <b>Jurisdiction context</b>The state marker is derived from
                    the structured case record.
                  </span>
                </div>
              )}
              <div className={styles.facts}>
                {facts.map(({ label, value, icon: Icon, tool }) => (
                  <div className={styles.fact} key={label}>
                    <div className={styles.factIcon}>
                      <Icon aria-hidden="true" size={16} />
                      {tool && (
                        <span>{String(value).slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <div className={styles.sectionTitle}>
                <div>
                  <span>Attribution boundary</span>
                  <h2>What the record establishes about AI use</h2>
                </div>
                <ShieldCheck />
              </div>
              <div className={styles.attribution}>
                <strong>{attributionStatus}</strong>
                <p>{attributionBasis}</p>
              </div>
              <div className={styles.procedureGrid}>
                <div>
                  <small>Procedural posture</small>
                  <p>{proceduralPosture}</p>
                </div>
                <div>
                  <small>Correction behavior</small>
                  <p>{editorial.correctionBehavior}</p>
                </div>
              </div>
            </section>
            {discrepancies.length > 0 && (
              <section className={`${shell.card} ${styles.section}`}>
                <h2>Tracked discrepancy record</h2>
                <p className={styles.sectionIntro}>
                  {discrepancies.length} citation, quotation, or authority
                  issues are recorded in the source dataset.
                </p>
                <ol className={styles.discrepancies}>
                  {discrepancies.slice(0, 8).map((entry, index) => (
                    <li key={index}>
                      <AlertTriangle aria-hidden="true" />
                      <span>{cleanImportedText(entry)}</span>
                    </li>
                  ))}
                </ol>
                {discrepancies.length > 8 && (
                  <details className={styles.moreDiscrepancies}>
                    <summary>
                      Show {discrepancies.length - 8} additional discrepancies
                    </summary>
                    <ol className={styles.discrepancies} start={9}>
                      {discrepancies.slice(8).map((entry, index) => (
                        <li key={index}>
                          <AlertTriangle aria-hidden="true" />
                          <span>{cleanImportedText(entry)}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </section>
            )}
            <section
              className={`${shell.card} ${styles.section}`}
              aria-labelledby="case-questions"
            >
              <h2 id="case-questions">Questions this record answers</h2>
              <dl className={styles.faqGrid}>
                {caseFaqs.map((entry) => (
                  <div key={entry.question}>
                    <dt>{entry.question}</dt>
                    <dd>{entry.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Related matters</h2>
              <p className={styles.sectionIntro}>
                Related by court, jurisdiction, tool, or classified failure
                pattern. Similarity does not imply the same facts or outcome.
              </p>
              <div className={styles.related}>
                {related.map((relatedItem) => (
                  <Link
                    key={relatedItem.slug}
                    href={`/cases/${relatedItem.slug}`}
                  >
                    <strong>{relatedItem.case_name}</strong>
                    <small>
                      {relatedItem.court} · {formatCaseDate(relatedItem.date)}
                    </small>
                    <em>{getRelatedCaseReason(item, relatedItem)}</em>
                  </Link>
                ))}
              </div>
            </section>
          </div>
          <aside>
            <section id="source-record" className={`${shell.card} ${styles.sourceCard}`}>
              <div className={styles.sourceHead}>
                <span>Linked evidence record</span>
                <Scale size={17} />
              </div>
              <h3>{source}</h3>
              <p>
                <strong>{tier.label}</strong>
                <br />
                {tier.description}
              </p>
              {item.source_url ? (
                <a
                  className={styles.sourceCta}
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open recorded source <ExternalLink size={14} />
                </a>
              ) : (
                <p>No public source link is currently available.</p>
              )}
              <Link className={styles.sourceCta} href={correctionHref}>
                Suggest a correction to this record
              </Link>
              <div className={styles.confidence}>
                <span>Public-record status</span>
                <b>{publicRecordStatus}</b>
              </div>
              <div className={styles.confidence}>
                <span>Indexing eligibility</span>
                <b>
                  {editorial.reviewedForPublication
                    ? "curated exemplar"
                    : isIndexEligible(item.slug)
                      ? "eligible under the evidence gate"
                      : "research hold"}
                </b>
              </div>
              {evidenceReview && (
                <div className={styles.confidence}>
                  <span>Evidence-review status</span>
                  <b>{evidenceReview.status.replaceAll("-", " ")}</b>
                </div>
              )}
              {item.judge_evidence && (
                <div className={styles.confidence}>
                  <span>Decision-maker evidence</span>
                  <b>
                    Primary-document signature · {item.judge_evidence.locator}
                  </b>
                </div>
              )}
              <div className={styles.authorCard}>
                <div className={styles.authorMark}>
                  <UserRound aria-hidden="true" size={17} />
                </div>
                <div>
                  <span>Published and maintained by</span>
                  <strong>Manu Ayala · AI Vortex</strong>
                  <small>Independent legal AI risk intelligence</small>
                </div>
              </div>
              <nav className={styles.authorLinks} aria-label="Publisher links">
                <Link href="/about">
                  <Globe2 aria-hidden="true" size={13} />
                  About publisher
                </Link>
                <a
                  href="https://www.linkedin.com/in/aivortex/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                  <ExternalLink aria-hidden="true" size={12} />
                </a>
                <a
                  href={`mailto:manuel@aivortex.io?subject=${encodeURIComponent(`AI Vortex case record: ${item.case_name}`)}`}
                >
                  <Mail aria-hidden="true" size={13} />
                  Email
                </a>
              </nav>
              <p className={styles.pageDate}>
                <CalendarDays aria-hidden="true" size={13} />
                {evidenceReviewedAt
                  ? `Evidence review recorded ${formatCaseDate(evidenceReviewedAt.slice(0, 10))}`
                  : `Corpus snapshot checked ${formatCaseDate(LAST_CHECKED)}`}
              </p>
              <div className={styles.sourceChecks}>
                <span>
                  <CheckCircle2 /> Source host classified
                </span>
                <span>
                  <CheckCircle2 /> Attribution boundary stated
                </span>
                <span>
                  <CheckCircle2 /> Limitations disclosed
                </span>
              </div>
              <p className={styles.boundary}>
                Corpus checked {formatCaseDate(LAST_CHECKED)}; latest tracked
                decision {formatCaseDate(LATEST_RECORD_DATE)}. AI Vortex
                summarizes public records and does not replace the court
                document or legal research service.
              </p>
            </section>
            <section className={`${shell.card} ${styles.sourceCard}`}>
              <div className={styles.sourceHead}>
                <span>Use this record</span>
                <FolderPlus size={17} />
              </div>
              <div className={styles.actions}>
                <Link href={`/cases/${item.slug}/brief`}>
                  Open case brief <FileDown size={15} />
                </Link>
                <Link href={`/cases?court=${encodeURIComponent(item.court)}`}>
                  Cases from this court
                </Link>
                {item.state && (
                  <Link href={`/map?states=${item.state}`}>
                    Open jurisdiction map <MapPin size={15} />
                  </Link>
                )}
              </div>
            </section>
            <section className={`${shell.card} ${styles.sourceCard}`}>
              <div className={styles.sourceHead}>
                <span>Evidence boundary</span>
                <AlertTriangle size={17} />
              </div>
              <p className={styles.limitations}>{evidenceBoundary}</p>
              <Link className={styles.methodLink} href="/sources">
                Read methodology
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
