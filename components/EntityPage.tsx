import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Bot,
  CalendarDays,
  ExternalLink,
  FileText,
  Gavel,
  Landmark,
  MapPin,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import CorpusDirectoryNav from "@/components/CorpusDirectoryNav";
import { CourtScopeVisual } from "@/components/CourtScopeVisual";
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
  entityOgImageHref,
  entityRelated,
  entityReportHref,
  entitySummary,
  getEntities,
  judgeEntityContext,
  type CorpusEntity,
  type EntityKind,
} from "@/lib/entity-pages";
import {
  buildEntityIntelligence,
  entityIntelligenceDescription,
  formatCurrency,
  type IntelligenceRow,
} from "@/lib/entity-intelligence";
import {
  entityMediaAssetHref,
  entityMediaCredit,
  entityMediaPublicUrl,
  getEntityMedia,
} from "@/lib/entity-media";
import { getCourtVisual } from "@/lib/court-visual";
import { publicUrl } from "@/lib/site";
import styles from "./EntityPages.module.css";

const DISPLAY_LIMIT = 24;

function entityTitle(entity: CorpusEntity) {
  if (entity.kind === "judge")
    return `${entity.label}: Legal AI Cases and Recorded Responses | AI Vortex`;
  if (entity.kind === "court")
    return `${entity.label} Legal AI Cases, Sanctions and Patterns | AI Vortex`;
  return `${entity.label}: Legal AI Cases and Recorded Patterns | AI Vortex`;
}

export function entityMetadata(entity: CorpusEntity): Metadata {
  const description = entityIntelligenceDescription(entity).slice(0, 158);
  const canonical = publicUrl(entityHref(entity.kind, entity.slug));
  const socialImage = publicUrl(
    entityOgImageHref(entity.kind, entity.slug),
  );
  return {
    title: entityTitle(entity),
    description,
    alternates: { canonical },
    openGraph: {
      title: entityTitle(entity),
      description,
      url: canonical,
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${entity.label} source-linked legal AI risk profile` }],
    },
    twitter: { card: "summary_large_image", title: entityTitle(entity), description, images: [socialImage] },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

function entitySchema(entity: CorpusEntity) {
  const intelligence = buildEntityIntelligence(entity);
  const judgeContext = judgeEntityContext(entity);
  const canonical = publicUrl(entityHref(entity.kind, entity.slug));
  const directory = publicUrl(entityDirectoryHref(entity.kind));
  const socialImage = publicUrl(
    entityOgImageHref(entity.kind, entity.slug),
  );
  const media = getEntityMedia(entity.kind, entity.slug);
  const primaryImage = media ? entityMediaPublicUrl(media) : socialImage;
  const courtVisual = entity.kind === "court" && !media ? getCourtVisual(entity) : null;
  const imageWidth = media ? (entity.kind === "judge" ? 512 : 960) : 1200;
  const imageHeight = media ? (entity.kind === "judge" ? 512 : 600) : 630;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: entityTitle(entity),
        description: intelligence.summary,
        isAccessibleForFree: true,
        dateModified: LAST_CHECKED,
        mainEntity: { "@id": `${canonical}#items` },
        ...(judgeContext ? { about: { "@id": `${canonical}#decision-maker` } } : {}),
        primaryImageOfPage: { "@id": `${canonical}#image` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
      },
      ...(judgeContext
        ? [{
            "@type": "Person",
            "@id": `${canonical}#decision-maker`,
            name: entity.label,
            url: canonical,
            image: { "@id": `${canonical}#image` },
            ...(judgeContext.role ? { jobTitle: judgeContext.role } : {}),
            description: [
              judgeContext.primaryCourt,
              judgeContext.jurisdiction,
              judgeContext.state || judgeContext.country,
              judgeContext.circuit,
            ].filter(Boolean).join(" · "),
            ...(judgeContext.primaryCourt
              ? {
                  affiliation: {
                    "@type": "Organization",
                    name: judgeContext.primaryCourt,
                  },
                }
              : {}),
            ...((judgeContext.state || judgeContext.country)
              ? {
                  areaServed: {
                    "@type": "AdministrativeArea",
                    name: judgeContext.state || judgeContext.country,
                  },
                }
              : {}),
          }]
        : []),
      {
        "@type": "ImageObject",
        "@id": `${canonical}#image`,
        url: primaryImage,
        contentUrl: primaryImage,
        width: imageWidth,
        height: imageHeight,
        caption: media?.caption || `${entity.label} source-linked intelligence profile`,
        ...(courtVisual
          ? {
              description: courtVisual.caption,
              creditText: "AI Vortex deterministic court-scope diagram derived from structured corpus metadata",
            }
          : {}),
        ...(media
          ? {
              creditText: entityMediaCredit(media),
              license: media.licenseUrl,
              acquireLicensePage: media.sourceUrl,
              representativeOfPage: true,
            }
          : {}),
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
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: intelligence.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

function PatternPanel({
  eyebrow,
  title,
  icon: Icon,
  rows,
  note,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  rows: IntelligenceRow[];
  note?: string;
}) {
  return (
    <section className={`${shell.card} ${styles.patternPanel}`}>
      <header className={styles.patternHead}>
        <span className={styles.patternIcon}><Icon aria-hidden="true" size={17} /></span>
        <div><small>{eyebrow}</small><h2>{title}</h2></div>
      </header>
      {rows.length ? (
        <div className={styles.patternRows}>
          {rows.map((row) => (
            <Link className={styles.patternRow} href={row.href} key={row.value}>
              <span className={styles.patternLabel}><strong>{row.label}</strong><b>{row.count.toLocaleString()} · {row.percentage}%</b></span>
              <span className={styles.patternTrack} aria-hidden="true"><i style={{ width: `${Math.max(row.percentage, 1.5)}%` }} /></span>
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.emptyPattern}>No classified values are currently recorded for this dimension.</p>
      )}
      {note && <p className={styles.patternNote}>{note}</p>}
    </section>
  );
}

export function EntityDetailPage({ entity }: { entity: CorpusEntity }) {
  const related = entityRelated(entity);
  const intelligence = buildEntityIntelligence(entity);
  const shown = entity.records.slice(0, DISPLAY_LIMIT);
  const sourceRate = entity.records.length ? Math.round((entity.sourceLinked / entity.records.length) * 1000) / 10 : 0;
  const singular = entity.records.length === 1 ? "record" : "records";
  const schema = entitySchema(entity);
  const directoryHref = entityDirectoryHref(entity.kind);
  const isConsequence = entity.kind === "consequence";
  const definition = entityDefinition(entity);
  const judgeContext = judgeEntityContext(entity);
  const media = getEntityMedia(entity.kind, entity.slug);

  return <ResearchShell><main className={shell.main}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><Link href={directoryHref}>{entityLabel(entity.kind)}</Link><span>/</span><span>{entity.label}</span></div>
    <header className={shell.pageHead}>
      <div className={styles.profileLead}>
        <figure className={`${styles.profileVisual} ${entity.kind === "court" ? styles.courtVisual : ""}`} data-real-image={Boolean(media)}>
          {media ? (
            <Image
              src={entityMediaAssetHref(media)}
              alt={media.alt}
              width={entity.kind === "judge" ? 512 : 960}
              height={entity.kind === "judge" ? 512 : 600}
              priority
              sizes={entity.kind === "judge" ? "(max-width: 640px) 92px, 118px" : "(max-width: 640px) 150px, 190px"}
            />
          ) : entity.kind === "court" ? (
            <CourtScopeVisual entity={entity} variant="profile" />
          ) : (
            <span aria-hidden="true">{entity.label.split(/\s+/).slice(0, 3).map((part) => part[0]).join("") || "AV"}</span>
          )}
          {media && (
            <figcaption>
              <a href={media.sourceUrl} target="_blank" rel="noreferrer">
                Image: {media.credit} · {media.license}
              </a>
            </figcaption>
          )}
          {!media && entity.kind === "court" && (
            <figcaption>Illustrated court-scope marker · not a courthouse photo</figcaption>
          )}
        </figure>
        <div><span className={shell.eyebrow}>Source-linked corpus view</span><h1>{entity.label}</h1><p>{entitySummary(entity, LEGAL_RISK_CASES.length)}</p></div>
      </div>
      <div className={shell.headActions}><Link className={shell.button} href={entityReportHref(entity.kind, entity.slug)}><FileText size={15} />Open evidence report</Link><Link className={shell.buttonSecondary} href={entityCaseDirectoryHref(entity)}>{isConsequence ? "Inspect in analytics" : "Search matching records"}<ArrowRight size={15} /></Link><Link className={shell.buttonSecondary} href="/sources">Methodology</Link></div>
    </header>

    {judgeContext && (
      <section className={`${shell.card} ${styles.judgeContextStrip}`} aria-label="Recorded judicial context">
        <div className={styles.judgeContextItem}>
          <Gavel aria-hidden="true" />
          <span><small>Recorded role</small><strong>{judgeContext.role || "Judicial decision-maker"}</strong></span>
        </div>
        {judgeContext.primaryCourt && (
          judgeContext.courtHref ? (
            <Link className={`${styles.judgeContextItem} ${styles.judgeContextLink}`} href={judgeContext.courtHref}>
              <Landmark aria-hidden="true" />
              <span><small>Primary recorded court</small><strong>{judgeContext.primaryCourt}</strong></span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <div className={styles.judgeContextItem}>
              <Landmark aria-hidden="true" />
              <span><small>Primary recorded court</small><strong>{judgeContext.primaryCourt}</strong></span>
            </div>
          )
        )}
        <div className={styles.judgeContextItem}>
          <Scale aria-hidden="true" />
          <span><small>Jurisdiction</small><strong>{judgeContext.jurisdiction || "Not classified"}</strong></span>
        </div>
        {(judgeContext.state || judgeContext.country || judgeContext.circuit) && (
          judgeContext.stateHref ? (
            <Link className={`${styles.judgeContextItem} ${styles.judgeContextLink}`} href={judgeContext.stateHref}>
              <MapPin aria-hidden="true" />
              <span><small>Geographic context</small><strong>{[judgeContext.state, judgeContext.circuit].filter(Boolean).join(" · ")}</strong></span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <div className={styles.judgeContextItem}>
              <MapPin aria-hidden="true" />
              <span><small>Geographic context</small><strong>{[judgeContext.state || judgeContext.country, judgeContext.circuit].filter(Boolean).join(" · ")}</strong></span>
            </div>
          )
        )}
      </section>
    )}

    <div className={styles.metrics}>
      <article className={`${shell.card} ${styles.metric}`}><small>Matched records</small><strong>{entity.records.length.toLocaleString()}</strong></article>
      <article className={`${shell.card} ${styles.metric}`}><small>Corpus denominator</small><strong>{LEGAL_RISK_CASES.length.toLocaleString()}</strong></article>
      <article className={`${shell.card} ${styles.metric}`}><small>Source linked</small><strong>{sourceRate}%</strong></article>
      <article className={`${shell.card} ${styles.metric}`}><small>Latest tracked</small><strong>{formatCaseDate(entity.latest)}</strong></article>
    </div>

    <section className={`${shell.card} ${styles.answer}`}>
      <span className={shell.eyebrow}>Evidence-based answer</span>
      <h2>{intelligence.question}</h2>
      {definition && <p><strong>Taxonomy definition:</strong> {definition}</p>}
      <p>{intelligence.summary}</p>
      {intelligence.sampleNote && <p className={styles.sampleNote}><ShieldAlert aria-hidden="true" size={15} />{intelligence.sampleNote}</p>}
      <p className={styles.answerNote}>Every count below links to the exact matching records. The linked source, subsequent docket history, and local procedural context remain controlling.</p>
    </section>

    <section className={styles.intelligenceAtGlance} aria-label="Evidence profile at a glance">
      <article className={`${shell.card} ${styles.intelligenceMetric}`}>
        <BarChart3 aria-hidden="true" />
        <span><small>Leading issue signal</small><strong>{intelligence.failures[0]?.label || "Not classified"}</strong><b>{intelligence.failures[0] ? `${intelligence.failures[0].count.toLocaleString()} records` : "No classified records"}</b></span>
      </article>
      <article className={`${shell.card} ${styles.intelligenceMetric}`}>
        <Scale aria-hidden="true" />
        <span><small>Leading recorded response</small><strong>{intelligence.consequences[0]?.label || "Not classified"}</strong><b>{intelligence.consequences[0] ? `${intelligence.consequences[0].count.toLocaleString()} records` : "No classified records"}</b></span>
      </article>
      <Link className={`${shell.card} ${styles.intelligenceMetric} ${styles.intelligenceMetricLink}`} href={intelligence.monetary.href}>
        <Banknote aria-hidden="true" />
        <span><small>Known numeric amounts</small><strong>{intelligence.monetary.known ? formatCurrency(intelligence.monetary.total) : "None recorded"}</strong><b>{intelligence.monetary.known.toLocaleString()} known · {intelligence.monetary.unquantified.toLocaleString()} unquantified</b></span>
        <ArrowRight aria-hidden="true" size={14} />
      </Link>
      <article className={`${shell.card} ${styles.intelligenceMetric}`}>
        <CalendarDays aria-hidden="true" />
        <span><small>Recorded date range</small><strong>{formatCaseDate(intelligence.earliest)}</strong><b>through {formatCaseDate(intelligence.latest)}</b></span>
      </article>
    </section>

    <div className={styles.patternGrid}>
      <PatternPanel eyebrow="Observed issue mix" title="What problems appear in these records?" icon={BarChart3} rows={intelligence.failures} note="Issue categories can overlap within a single matter." />
      <PatternPanel eyebrow="Recorded consequences" title="How did courts or authorities respond?" icon={Scale} rows={intelligence.consequences} note="Response categories can overlap and do not imply that every matter ended in a sanction." />
      <PatternPanel eyebrow="Participant context" title="Who appears in these matters?" icon={Users} rows={intelligence.parties} />
      <PatternPanel eyebrow="Matter context" title="Which practice areas are represented?" icon={ShieldCheck} rows={intelligence.practiceAreas} />
      <PatternPanel eyebrow="Attribution status" title="How is AI involvement recorded?" icon={Bot} rows={intelligence.attribution} note="Unspecified attribution is not evidence that a particular vendor was used." />
      <PatternPanel eyebrow="Corpus evolution" title="When were these matters recorded?" icon={CalendarDays} rows={intelligence.years} />
    </div>

    <div className={styles.layout}><div>
      <section className={`${shell.card} ${styles.section}`}><h2>Public records in this view</h2><p>Showing the most recent {Math.min(shown.length, DISPLAY_LIMIT).toLocaleString()} of {entity.records.length.toLocaleString()} matching {singular}.</p><div className={styles.records}>{shown.map((record) => <Link className={styles.record} href={`/cases/${record.slug}`} key={record.id}><div><strong>{record.case_name}</strong><span>{record.court || "Court not recorded"} · {record.state || record.country} · {record.ai_tool_used || "Tool not recorded"}</span></div><small>{formatCaseDate(record.date)}</small></Link>)}</div><Link className={styles.recordLink} href={entityCaseDirectoryHref(entity)}>{isConsequence ? "Open the full analytics view" : "Open all matching records"}<ArrowRight size={14} /></Link></section>
      <section className={`${shell.card} ${styles.section}`}><h2>Scope and limitation</h2><p className={styles.limit}>This page groups existing structured public-record fields. For judges, the counts describe matters in which that person is recorded as a decision-maker; they do not establish a judge’s general practices or sanction rate. For every entity type, the view is not a comparison against unobserved proceedings.</p><h3>Indexing and evidence status</h3><p>{entity.indexEligible ? `This public entity profile is indexable and meets the evidence-depth baseline of at least ${entityIndexThreshold()} source-linked records.` : `This public entity profile is indexable with transparent source depth. It currently contains fewer than ${entityIndexThreshold()} source-linked records and should be read as a narrow corpus view, not a generalized pattern.`}</p></section>
    </div><aside>
      <section className={`${shell.card} ${styles.section}`}><h2>Related research</h2><div className={styles.relatedList}>{related.map(({ candidate, overlap }) => <Link className={styles.related} href={entityHref(candidate.kind, candidate.slug)} key={`${candidate.kind}-${candidate.slug}`}><strong>{candidate.label}</strong><span>{overlap} shared<br />records</span></Link>)}</div></section>
      <section className={`${shell.card} ${styles.section}`}><ShieldCheck size={18} aria-hidden="true" /><h2>Evidence boundary</h2><p>AI Vortex publishes a source-aware public corpus. The page does not replace the complete docket, later history, a court’s own rules, or legal research.</p><Link className={styles.recordLink} href="/submit">Suggest a correction <ExternalLink size={14} /></Link></section>
    </aside></div>
  </main></ResearchShell>;
}

export function EntityDirectoryPage({ kind }: { kind: EntityKind }) {
  const entities = getEntities(kind);
  const title = entityLabel(kind);
  const indexable = entities.length;
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: publicUrl(entityDirectoryHref(kind)),
    name: `AI Vortex ${title}`,
    description: `Browse ${title} represented in the AI Vortex public legal AI risk corpus.`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entities.length,
      ...(kind === "judge"
        ? {
            itemListElement: entities.map((entity, index) => {
              const context = judgeEntityContext(entity);
              const media = getEntityMedia(entity.kind, entity.slug);
              return {
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Person",
                  name: entity.label,
                  url: publicUrl(entityHref(entity.kind, entity.slug)),
                  ...(media ? { image: entityMediaPublicUrl(media) } : {}),
                  ...(context?.role ? { jobTitle: context.role } : {}),
                  description: [
                    context?.primaryCourt,
                    context?.jurisdiction,
                    context?.state || context?.country,
                    context?.circuit,
                  ].filter(Boolean).join(" · "),
                },
              };
            }),
          }
        : {}),
    },
  };
  return <ResearchShell><main className={shell.main}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>{title}</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Corpus navigation</span><h1>Browse {title}</h1><p>These pages group recorded public matters by one structured field. They are navigational corpus views, not comparative risk rankings.</p></div><div className={shell.headActions}><Link className={shell.button} href="/cases">Search all records</Link><Link className={shell.buttonSecondary} href="/sources">Methodology</Link></div></header>
    <CorpusDirectoryNav activeKind={kind} compact />
    <div className={styles.metrics}><article className={`${shell.card} ${styles.metric}`}><small>Entities</small><strong>{entities.length.toLocaleString()}</strong></article><article className={`${shell.card} ${styles.metric}`}><small>Index eligible</small><strong>{indexable.toLocaleString()}</strong></article><article className={`${shell.card} ${styles.metric}`}><small>Corpus records</small><strong>{LEGAL_RISK_CASES.length.toLocaleString()}</strong></article><article className={`${shell.card} ${styles.metric}`}><small>Corpus checked</small><strong>{formatCaseDate(LAST_CHECKED)}</strong></article></div>
    <section className={`${shell.card} ${styles.section}`}>
      <h2>{title[0]?.toUpperCase() + title.slice(1)} in the public record</h2>
      <p className={styles.directoryIntro}>
        {kind === "judge"
          ? "Scan each decision-maker’s primary recorded court, jurisdiction, and geographic context before opening the source-linked profile."
          : "Open an entity to inspect its exact denominator, source-linked case records, limitations, and related corpus views."}
      </p>
      <div className={styles.directoryList}>
        {entities.map((entity) => {
          const context = judgeEntityContext(entity);
          const media = getEntityMedia(entity.kind, entity.slug);
          return (
            <Link className={styles.directoryItem} data-evidence-baseline={entity.indexEligible} href={entityHref(kind, entity.slug)} key={entity.slug}>
              {(kind === "judge" || kind === "court") && (
                <span className={`${styles.directoryVisual} ${kind === "court" ? styles.directoryCourtVisual : ""}`} data-real-image={Boolean(media)} aria-hidden={!media}>
                  {media ? (
                    <Image src={entityMediaAssetHref(media)} alt={media.alt} width={kind === "judge" ? 512 : 960} height={kind === "judge" ? 512 : 600} sizes={kind === "judge" ? "52px" : "76px"} />
                  ) : kind === "court" ? (
                    <CourtScopeVisual entity={entity} variant="directory" />
                  ) : (
                    <span>{entity.label.split(/\s+/).slice(0, 3).map((part) => part[0]).join("") || "AV"}</span>
                  )}
                </span>
              )}
              <div className={styles.directoryCopy}>
                <strong>{entity.label}</strong>
                {context && (
                  <span className={styles.judgeQuickContext}>
                    {context.primaryCourt && <span><Landmark aria-hidden="true" />{context.primaryCourt}</span>}
                    {context.jurisdiction && <em>{context.jurisdiction}</em>}
                    {(context.state || context.country) && <em>{context.state || context.country}</em>}
                    {context.circuit && <span>{context.circuit}</span>}
                  </span>
                )}
                <small>{entity.sourceLinked.toLocaleString()}/{entity.records.length.toLocaleString()} source linked · latest {formatCaseDate(entity.latest)}</small>
                {media && <small className={styles.directoryCredit}>Image: {media.credit} · {media.license}</small>}
              </div>
              <b>{entity.records.length.toLocaleString()} {entity.records.length === 1 ? "record" : "records"}</b>
            </Link>
          );
        })}
      </div>
      <p className={styles.indexNote}>All public entity profiles are indexable. Profiles with fewer than {entityIndexThreshold()} source-linked records remain visibly labeled as narrow corpus views.</p>
    </section>
  </main></ResearchShell>;
}
