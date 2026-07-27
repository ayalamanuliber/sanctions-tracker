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
  Landmark,
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
import { CURATED_CASE_SLUGS, getCaseEditorial } from "@/lib/case-editorial";
import { LAST_CHECKED, LATEST_RECORD_DATE, formatCaseDate, getCaseBySlug, getRelatedCaseReason, getRelatedCases, sourcePublisher, sourceTier } from "@/lib/cases";
import { getPublicationReadiness, isIndexEligible } from "@/lib/publication";
import { getCaseIntelligence } from "@/lib/case-intelligence";
import { PUBLIC_BASE_URL, SITE_PUBLICATION_DATE, publicUrl } from "@/lib/site";
import styles from "./case.module.css";

type Props = { params: Promise<{ slug: string }> };

const NARRATIVE_HEADINGS = ["AI Use", "Hallucination Details", "Ruling/Sanction", "Key Judicial Reasoning"];

function decodeImportedText(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

function narrativeSections(value: string) {
  const clean = decodeImportedText(value);
  const marker = new RegExp(`(${NARRATIVE_HEADINGS.map((heading) => heading.replace("/", "\\/")).join("|")})`, "g");
  const parts = clean.split(marker).filter(Boolean);
  const sections: { heading: string; body: string }[] = [];
  let heading = "Matter overview";
  for (const part of parts) {
    if (NARRATIVE_HEADINGS.includes(part)) heading = part;
    else if (part.trim()) sections.push({ heading, body: part.trim() });
  }
  return sections;
}

export const dynamicParams = true;
export function generateStaticParams() { return CURATED_CASE_SLUGS.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getCaseBySlug((await params).slug);
  if (!item) return { title: "Case not found | AI Vortex" };
  const socialImage = publicUrl(`/cases/${item.slug}/opengraph-image`);
  return {
    title: `${item.case_name} | AI Vortex Legal AI Risk`,
    description: `${item.court}, ${formatCaseDate(item.date)}. ${item.summary}`.slice(0, 158),
    alternates: { canonical: publicUrl(`/cases/${item.slug}`) },
    openGraph: {
      title: `${item.case_name} | AI Vortex Legal AI Risk`,
      description: item.summary.slice(0, 200),
      url: publicUrl(`/cases/${item.slug}`),
      type: "article",
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${item.case_name} legal AI risk record` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.case_name} | AI Vortex`,
      description: item.summary.slice(0, 200),
      images: [socialImage],
    },
    robots: isIndexEligible(item.slug)
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
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
  const directAnswer = editorial.reviewedForPublication ? editorial.directAnswer : intelligence?.summary || editorial.directAnswer;
  const whyItMatters = editorial.reviewedForPublication ? editorial.whyItMatters : intelligence?.why_it_matters || editorial.whyItMatters;
  const evidenceBoundary = intelligence?.evidence_boundary || editorial.limitations;
  const publication = getPublicationReadiness(item.slug);
  const narrative = narrativeSections(directAnswer);
  const discrepancies = item.hallucination_items?.split(" || ").filter(Boolean) || [];
  const knownAmount = item.amount
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(item.amount)
    : "Not recorded";
  const outcome = item.outcome || (item.amount ? knownAmount : "") || item.sanction_types.map((v) => v.replaceAll("-", " ")).join(", ") || "Tracked public outcome";
  const facts = [
    { label: "Court", value: item.court, icon: Landmark },
    { label: "Jurisdiction", value: item.jurisdiction, icon: MapPin },
    { label: "Circuit", value: item.circuit || "Not recorded", icon: GitBranch },
    { label: "Date", value: formatCaseDate(item.date), icon: CalendarDays },
    { label: "AI tool", value: item.ai_tool_used || "Unidentified", icon: Bot, tool: true },
    { label: "Party type", value: item.party || "Not classified", icon: UserRound },
    { label: "Outcome", value: item.outcome || "See source", icon: Gavel },
    { label: "Known amount", value: knownAmount, icon: Banknote },
    { label: "Professional sanction", value: item.professional_sanction || "Not recorded", icon: ShieldAlert },
  ];
  const canonicalUrl = publicUrl(`/cases/${item.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: item.case_name,
        description: item.summary,
        inLanguage: "en-US",
        isAccessibleForFree: true,
        datePublished: SITE_PUBLICATION_DATE,
        dateModified: SITE_PUBLICATION_DATE,
        mainEntity: { "@id": `${canonicalUrl}#article` },
        breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: item.case_name,
        description: item.summary,
        inLanguage: "en-US",
        datePublished: SITE_PUBLICATION_DATE,
        dateModified: SITE_PUBLICATION_DATE,
        author: { "@type": "Person", name: "Manu Ayala", url: "https://www.aivortex.io/legal/" },
        publisher: { "@type": "Organization", name: "AI Vortex", url: "https://www.aivortex.io/" },
        mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
        citation: item.source_url ? [item.source_url] : undefined,
        about: [item.court, item.jurisdiction, ...item.tags],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Legal AI Risk", item: PUBLIC_BASE_URL },
          { "@type": "ListItem", position: 2, name: "Cases", item: publicUrl("/cases") },
          { "@type": "ListItem", position: 3, name: item.case_name },
        ],
      },
    ],
  };

  return <ResearchShell>
    <main className={shell.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className={shell.breadcrumbs}><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/cases">Cases</Link><span aria-hidden="true">/</span><span>{item.case_name}</span></div>
      {item.alleged && <div className={styles.notice}><strong>Allegation status:</strong> this record tracks a public allegation or unresolved matter. It must not be described as an adjudicated finding.</div>}
      {!editorial.reviewedForPublication && <div className={styles.draftNotice}><AlertTriangle size={17} /><span><strong>Corpus record:</strong> this page is available for research and has a publication-readiness score of {publication.score}/100. {publication.tier === "index-ready" ? "It meets the deterministic public indexing baseline but has not completed individual curated review." : "It remains excluded from search-engine indexing until the documented evidence gaps are resolved."}</span></div>}
      <div className={styles.hero}>
        <section className={`${shell.card} ${styles.titleCard}`}>
          <span className={shell.eyebrow}>{editorial.reviewedForPublication ? "Reviewed matter record" : "Corpus matter record"}</span>
          <h1>{item.case_name}</h1>
          <p className={styles.courtLine}>{item.court} · {formatCaseDate(item.date)}{item.judge ? ` · ${item.judge}` : ""}</p>
          <div className={styles.chips}>
            <span className={styles.chip}>{item.country === "US" ? `${item.state} / ${item.jurisdiction}` : item.country}</span>
            <span className={`${styles.chip} ${(item.severity === "high" || item.severity === "career-ending") ? styles.chipDanger : ""}`}>Editorial impact: {item.severity.replace("-", " ")}</span>
            {item.tags.slice(0,4).map((tag) => <span className={styles.chip} key={tag}>{tag.replaceAll("-", " ")}</span>)}
          </div>
        </section>
        <aside className={styles.outcome}><small>Observed outcome</small><strong>{outcome}</strong><p>{item.alleged ? "Public allegation; no adjudicated conclusion is represented here." : "Outcome recorded in the tracked public source. Review the underlying document before relying on this summary."}</p></aside>
      </div>

      <section className={`${shell.card} ${styles.answerBlock}`} aria-labelledby="direct-answer-title">
        <div><span>Direct answer</span><h2 id="direct-answer-title">What happened in this matter?</h2></div>
        <p>{directAnswer}</p>
        <dl><div><dt>Why the court cared</dt><dd>{editorial.whyCourtCared}</dd></div><div><dt>Why it matters now</dt><dd>{whyItMatters}</dd></div></dl>
      </section>

      <div className={styles.grid}>
        <div>
          <section className={`${shell.card} ${styles.section}`}>
            <h2>Why this matter is tracked</h2>
            <div className={styles.narrative}>{narrative.map((part, index) => <div key={`${part.heading}-${index}`} className={index ? styles.narrativeDetail : styles.narrativeLead}>{index > 0 && <h3>{part.heading}</h3>}<p>{part.body}</p></div>)}</div>
            {(item.lesson || intelligence?.why_it_matters) && <div className={styles.lesson}><strong>Operational lesson</strong><p>{item.lesson || intelligence?.why_it_matters}</p></div>}
          </section>
          <section className={`${shell.card} ${styles.section}`}><h2>Record details</h2>
            {item.country === "US" && item.state && <div className={styles.stateContext}><StateScopeMark state={item.state} /><span><b>Jurisdiction context</b>The state marker is derived from the structured case record.</span></div>}
            <div className={styles.facts}>
            {facts.map(({ label, value, icon: Icon, tool }) => <div className={styles.fact} key={label}><div className={styles.factIcon}><Icon aria-hidden="true" size={16} />{tool && <span>{String(value).slice(0, 2).toUpperCase()}</span>}</div><div><small>{label}</small><strong>{value}</strong></div></div>)}
          </div></section>
          <section className={`${shell.card} ${styles.section}`}><div className={styles.sectionTitle}><div><span>Attribution boundary</span><h2>What the record establishes about AI use</h2></div><ShieldCheck /></div><div className={styles.attribution}><strong>{editorial.attributionStatus.replaceAll("-", " ")}</strong><p>{editorial.attributionBasis}</p></div><div className={styles.procedureGrid}><div><small>Procedural posture</small><p>{editorial.proceduralPosture}</p></div><div><small>Correction behavior</small><p>{editorial.correctionBehavior}</p></div></div></section>
          {discrepancies.length > 0 && <section className={`${shell.card} ${styles.section}`}><h2>Tracked discrepancy record</h2><p className={styles.sectionIntro}>{discrepancies.length} citation, quotation, or authority issues are recorded in the source dataset.</p><ol className={styles.discrepancies}>{discrepancies.slice(0,8).map((entry, index) => <li key={index}><AlertTriangle aria-hidden="true" /><span>{decodeImportedText(entry)}</span></li>)}</ol>{discrepancies.length > 8 && <details className={styles.moreDiscrepancies}><summary>Show {discrepancies.length - 8} additional discrepancies</summary><ol className={styles.discrepancies} start={9}>{discrepancies.slice(8).map((entry,index) => <li key={index}><AlertTriangle aria-hidden="true" /><span>{decodeImportedText(entry)}</span></li>)}</ol></details>}</section>}
          <section className={`${shell.card} ${styles.section}`}><h2>Related matters</h2><p className={styles.sectionIntro}>Related by court, jurisdiction, tool, or classified failure pattern. Similarity does not imply the same facts or outcome.</p><div className={styles.related}>{related.map((relatedItem) => <Link key={relatedItem.slug} href={`/cases/${relatedItem.slug}`}><strong>{relatedItem.case_name}</strong><small>{relatedItem.court} · {formatCaseDate(relatedItem.date)}</small><em>{getRelatedCaseReason(item, relatedItem)}</em></Link>)}</div></section>
        </div>
        <aside>
          <section className={`${shell.card} ${styles.sourceCard}`}>
            <div className={styles.sourceHead}><span>Linked evidence record</span><Scale size={17} /></div>
            <h3>{source}</h3><p><strong>{tier.label}</strong><br />{tier.description}</p>
            {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">Open recorded source <ExternalLink size={14} /></a> : <p>No public source link is currently available.</p>}
            <div className={styles.confidence}><span>Publication review</span><b>{editorial.reviewedForPublication ? "curated exemplar" : "not complete"}</b></div>
            <p className={styles.byline}>Published by <a href="https://www.aivortex.io/legal/">AI Vortex · Manu Ayala</a><br />Page updated {formatCaseDate(SITE_PUBLICATION_DATE)}</p>
            <div className={styles.sourceChecks}><span><CheckCircle2 /> Source host classified</span><span><CheckCircle2 /> Attribution boundary stated</span><span><CheckCircle2 /> Limitations disclosed</span></div>
            <p className={styles.boundary}>Corpus checked {formatCaseDate(LAST_CHECKED)}; latest tracked decision {formatCaseDate(LATEST_RECORD_DATE)}. AI Vortex summarizes public records and does not replace the court document or legal research service.</p>
          </section>
          <section className={`${shell.card} ${styles.sourceCard}`}><div className={styles.sourceHead}><span>Use this record</span><FolderPlus size={17} /></div><div className={styles.actions}>
            <Link href={`/cases/${item.slug}/brief`}>Open case brief <FileDown size={15} /></Link>
            <Link href={`/cases?court=${encodeURIComponent(item.court)}`}>Cases from this court</Link>
            {item.state && <Link href={`/map?states=${item.state}`}>Open jurisdiction map <MapPin size={15} /></Link>}
          </div></section>
          <section className={`${shell.card} ${styles.sourceCard}`}><div className={styles.sourceHead}><span>Evidence boundary</span><AlertTriangle size={17} /></div><p className={styles.limitations}>{evidenceBoundary}</p><Link className={styles.methodLink} href="/sources">Read methodology</Link></section>
        </aside>
      </div>
    </main>
  </ResearchShell>;
}
