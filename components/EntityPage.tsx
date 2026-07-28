import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { LAST_CHECKED, LEGAL_RISK_CASES, formatCaseDate } from "@/lib/cases";
import {
  entityCaseDirectoryHref,
  entityDefinition,
  entityDirectoryHref,
  entityHref,
  entityIndexThreshold,
  entityLabel,
  entityRelated,
  entitySummary,
  getEntities,
  type CorpusEntity,
  type EntityKind,
} from "@/lib/entity-pages";
import { publicUrl } from "@/lib/site";
import styles from "./EntityPages.module.css";

const DISPLAY_LIMIT = 24;

function entityTitle(entity: CorpusEntity) {
  return `${entity.label} legal AI risk records | AI Vortex`;
}

export function entityMetadata(entity: CorpusEntity): Metadata {
  const description = entitySummary(entity, LEGAL_RISK_CASES.length).slice(0, 158);
  const canonical = publicUrl(entityHref(entity.kind, entity.slug));
  const socialImage = publicUrl("/legal-ai-risk-social.png");
  return {
    title: entityTitle(entity),
    description,
    alternates: { canonical },
    openGraph: {
      title: entityTitle(entity),
      description,
      url: canonical,
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "AI Vortex Legal AI Risk evidence network" }],
    },
    twitter: { card: "summary_large_image", title: entityTitle(entity), description, images: [socialImage] },
    robots: entity.indexEligible
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: true },
  };
}

function entitySchema(entity: CorpusEntity) {
  const canonical = publicUrl(entityHref(entity.kind, entity.slug));
  const directory = publicUrl(entityDirectoryHref(entity.kind));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: entityTitle(entity),
        description: entitySummary(entity, LEGAL_RISK_CASES.length),
        isAccessibleForFree: true,
        dateModified: LAST_CHECKED,
        mainEntity: { "@id": `${canonical}#items` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
      },
      {
        "@type": "ItemList",
        "@id": `${canonical}#items`,
        name: `${entity.label} public records`,
        numberOfItems: entity.records.length,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: entity.records.slice(0, DISPLAY_LIMIT).map((record, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: publicUrl(`/cases/${record.slug}`),
          name: record.case_name,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Legal AI Risk", item: publicUrl() },
          { "@type": "ListItem", position: 2, name: entityLabel(entity.kind), item: directory },
          { "@type": "ListItem", position: 3, name: entity.label, item: canonical },
        ],
      },
    ],
  };
}

export function EntityDetailPage({ entity }: { entity: CorpusEntity }) {
  const related = entityRelated(entity);
  const shown = entity.records.slice(0, DISPLAY_LIMIT);
  const sourceRate = entity.records.length ? Math.round((entity.sourceLinked / entity.records.length) * 1000) / 10 : 0;
  const singular = entity.records.length === 1 ? "record" : "records";
  const schema = entitySchema(entity);
  const directoryHref = entityDirectoryHref(entity.kind);
  const isConsequence = entity.kind === "consequence";
  const definition = entityDefinition(entity);

  return <ResearchShell><main className={shell.main}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><Link href={directoryHref}>{entityLabel(entity.kind)}</Link><span>/</span><span>{entity.label}</span></div>
    <header className={shell.pageHead}>
      <div><span className={shell.eyebrow}>Source-linked corpus view</span><h1>{entity.label}</h1><p>{entitySummary(entity, LEGAL_RISK_CASES.length)}</p></div>
      <div className={shell.headActions}><Link className={shell.button} href={entityCaseDirectoryHref(entity)}>{isConsequence ? "Inspect in analytics" : "Search matching records"}<ArrowRight size={15} /></Link><Link className={shell.buttonSecondary} href="/sources">Methodology</Link></div>
    </header>

    <div className={styles.metrics}>
      <article className={`${shell.card} ${styles.metric}`}><small>Matched records</small><strong>{entity.records.length.toLocaleString()}</strong></article>
      <article className={`${shell.card} ${styles.metric}`}><small>Corpus denominator</small><strong>{LEGAL_RISK_CASES.length.toLocaleString()}</strong></article>
      <article className={`${shell.card} ${styles.metric}`}><small>Source linked</small><strong>{sourceRate}%</strong></article>
      <article className={`${shell.card} ${styles.metric}`}><small>Latest tracked</small><strong>{formatCaseDate(entity.latest)}</strong></article>
    </div>

    <section className={`${shell.card} ${styles.answer}`}><span className={shell.eyebrow}>Direct answer</span><h2>What does this corpus view establish?</h2>{definition && <p><strong>Taxonomy definition:</strong> {definition}</p>}<p>{entitySummary(entity, LEGAL_RISK_CASES.length)}</p><p className={styles.answerNote}>A record can appear in more than one failure-mode or consequence view. The linked source, subsequent docket history, and local procedural context remain controlling.</p></section>

    <div className={styles.layout}><div>
      <section className={`${shell.card} ${styles.section}`}><h2>Public records in this view</h2><p>Showing the most recent {Math.min(shown.length, DISPLAY_LIMIT).toLocaleString()} of {entity.records.length.toLocaleString()} matching {singular}.</p><div className={styles.records}>{shown.map((record) => <Link className={styles.record} href={`/cases/${record.slug}`} key={record.id}><div><strong>{record.case_name}</strong><span>{record.court || "Court not recorded"} · {record.state || record.country} · {record.ai_tool_used || "Tool not recorded"}</span></div><small>{formatCaseDate(record.date)}</small></Link>)}</div><Link className={styles.recordLink} href={entityCaseDirectoryHref(entity)}>{isConsequence ? "Open the full analytics view" : "Open all matching records"}<ArrowRight size={14} /></Link></section>
      <section className={`${shell.card} ${styles.section}`}><h2>Scope and limitation</h2><p className={styles.limit}>This page groups existing structured public-record fields. It does not establish that a court, jurisdiction, country, vendor, or category has a higher rate of AI use, error, misconduct, or sanctions than another.</p><h3>Indexing status</h3><p>{entity.indexEligible ? `This entity meets the public indexing baseline of at least ${entityIndexThreshold()} source-linked records.` : `This entity remains public for research but is excluded from search indexing because it has fewer than ${entityIndexThreshold()} source-linked records.`}</p></section>
    </div><aside>
      <section className={`${shell.card} ${styles.section}`}><h2>Related research</h2><div className={styles.relatedList}>{related.map(({ candidate, overlap }) => <Link className={styles.related} href={entityHref(candidate.kind, candidate.slug)} key={`${candidate.kind}-${candidate.slug}`}><strong>{candidate.label}</strong><span>{overlap} shared<br />records</span></Link>)}</div></section>
      <section className={`${shell.card} ${styles.section}`}><ShieldCheck size={18} aria-hidden="true" /><h2>Evidence boundary</h2><p>AI Vortex publishes a source-aware public corpus. The page does not replace the complete docket, later history, a court’s own rules, or legal research.</p><Link className={styles.recordLink} href="/submit">Suggest a correction <ExternalLink size={14} /></Link></section>
    </aside></div>
  </main></ResearchShell>;
}

export function EntityDirectoryPage({ kind }: { kind: EntityKind }) {
  const entities = getEntities(kind);
  const title = entityLabel(kind);
  const indexable = entities.filter((entity) => entity.indexEligible).length;
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: publicUrl(entityDirectoryHref(kind)),
    name: `AI Vortex ${title}`,
    description: `Browse ${title} represented in the AI Vortex public legal AI risk corpus.`,
    mainEntity: { "@type": "ItemList", numberOfItems: entities.length },
  };
  return <ResearchShell><main className={shell.main}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>{title}</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Corpus navigation</span><h1>Browse {title}</h1><p>These pages group recorded public matters by one structured field. They are navigational corpus views, not comparative risk rankings.</p></div><div className={shell.headActions}><Link className={shell.button} href="/cases">Search all records</Link><Link className={shell.buttonSecondary} href="/sources">Methodology</Link></div></header>
    <div className={styles.metrics}><article className={`${shell.card} ${styles.metric}`}><small>Entities</small><strong>{entities.length.toLocaleString()}</strong></article><article className={`${shell.card} ${styles.metric}`}><small>Index eligible</small><strong>{indexable.toLocaleString()}</strong></article><article className={`${shell.card} ${styles.metric}`}><small>Corpus records</small><strong>{LEGAL_RISK_CASES.length.toLocaleString()}</strong></article><article className={`${shell.card} ${styles.metric}`}><small>Corpus checked</small><strong>{formatCaseDate(LAST_CHECKED)}</strong></article></div>
    <section className={`${shell.card} ${styles.section}`}><h2>{title[0]?.toUpperCase() + title.slice(1)} in the public record</h2><p className={styles.directoryIntro}>Open an entity to inspect its exact denominator, source-linked case records, limitations, and related corpus views.</p><div className={styles.directoryList}>{entities.map((entity) => <Link className={styles.directoryItem} data-indexable={entity.indexEligible} href={entityHref(kind, entity.slug)} key={entity.slug}><div><strong>{entity.label}</strong><small>{entity.sourceLinked.toLocaleString()}/{entity.records.length.toLocaleString()} source linked · latest {formatCaseDate(entity.latest)}</small></div><b>{entity.records.length.toLocaleString()} records</b></Link>)}</div><p className={styles.indexNote}>Entity pages with fewer than {entityIndexThreshold()} source-linked records remain available for transparent research but are excluded from search indexing.</p></section>
  </main></ResearchShell>;
}
