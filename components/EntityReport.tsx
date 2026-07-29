import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bot,
  CalendarDays,
  ExternalLink,
  FileText,
  Gavel,
  Globe2,
  Landmark,
  MapPinned,
  Scale,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ReportBrandLockup } from "@/components/reports/ReportBrandLockup";
import { ReportPreviewToolbar } from "@/components/reports/ReportPreviewToolbar";
import { CourtScopeVisual } from "@/components/CourtScopeVisual";
import { LAST_CHECKED, formatCaseDate } from "@/lib/cases";
import {
  entityCaseDirectoryHref,
  entityDefinition,
  entityDirectoryHref,
  entityHref,
  entityLabel,
  entityOgImageHref,
  entityRelated,
  entityReportHref,
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
import {
  createReportId,
  readReportBrand,
  type ReportTier,
} from "@/lib/reporting";
import { assetUrl, publicUrl, SITE_PUBLICATION_DATE } from "@/lib/site";
import styles from "./EntityReport.module.css";

type Params = Record<string, string | string[] | undefined>;

const KIND_COPY: Record<
  EntityKind,
  { singular: string; eyebrow: string; icon: LucideIcon }
> = {
  judge: {
    singular: "recorded decision-maker",
    eyebrow: "JUDICIAL EVIDENCE REPORT",
    icon: Gavel,
  },
  court: {
    singular: "court",
    eyebrow: "COURT EVIDENCE REPORT",
    icon: Landmark,
  },
  state: {
    singular: "US jurisdiction",
    eyebrow: "STATE EVIDENCE REPORT",
    icon: MapPinned,
  },
  country: {
    singular: "country",
    eyebrow: "COUNTRY EVIDENCE REPORT",
    icon: Globe2,
  },
  tool: {
    singular: "recorded AI tool",
    eyebrow: "AI TOOL EVIDENCE REPORT",
    icon: Bot,
  },
  failure: {
    singular: "failure mode",
    eyebrow: "ISSUE SIGNAL REPORT",
    icon: ShieldAlert,
  },
  consequence: {
    singular: "recorded consequence",
    eyebrow: "CONSEQUENCE EVIDENCE REPORT",
    icon: Scale,
  },
};

function first(params: Params, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function reportTitle(entity: CorpusEntity) {
  return `${entity.label} Evidence Report | AI Vortex`;
}

export function entityReportMetadata(entity: CorpusEntity): Metadata {
  const canonical = publicUrl(entityReportHref(entity.kind, entity.slug));
  const description = `${entityIntelligenceDescription(entity)} Open the print-ready, source-linked AI Vortex evidence report.`.slice(
    0,
    158,
  );
  const image = publicUrl(
    entityOgImageHref(entity.kind, entity.slug, "report"),
  );

  return {
    title: reportTitle(entity),
    description,
    alternates: { canonical },
    openGraph: {
      title: reportTitle(entity),
      description,
      url: canonical,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${entity.label} source-linked evidence report`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: reportTitle(entity),
      description,
      images: [image],
    },
    robots: entity.indexEligible
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

function reportSchema(entity: CorpusEntity) {
  const intelligence = buildEntityIntelligence(entity);
  const canonical = publicUrl(entityReportHref(entity.kind, entity.slug));
  const profile = publicUrl(entityHref(entity.kind, entity.slug));
  const image = publicUrl(
    entityOgImageHref(entity.kind, entity.slug, "report"),
  );
  const media = getEntityMedia(entity.kind, entity.slug);
  const primaryImage = media ? entityMediaPublicUrl(media) : image;
  const courtVisual = entity.kind === "court" && !media ? getCourtVisual(entity) : null;
  const reportId = createReportId(
    "AV-ER",
    `${entity.kind}:${entity.slug}`,
  );
  const aboutType =
    entity.kind === "judge"
      ? "Person"
      : entity.kind === "court"
        ? "GovernmentOrganization"
        : entity.kind === "state" || entity.kind === "country"
          ? "AdministrativeArea"
          : "Thing";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: reportTitle(entity),
        description: intelligence.summary,
        isAccessibleForFree: true,
        datePublished: SITE_PUBLICATION_DATE,
        dateModified: LAST_CHECKED,
        primaryImageOfPage: { "@id": `${canonical}#image` },
        mainEntity: { "@id": `${canonical}#report` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
      },
      {
        "@type": "Report",
        "@id": `${canonical}#report`,
        name: reportTitle(entity),
        identifier: reportId,
        abstract: intelligence.summary,
        url: canonical,
        image: { "@id": `${canonical}#image` },
        dateModified: LAST_CHECKED,
        isAccessibleForFree: true,
        isBasedOn: profile,
        publisher: {
          "@type": "Organization",
          name: "AI Vortex",
          url: "https://www.aivortex.io",
        },
        about: {
          "@type": aboutType,
          name: entity.label,
          subjectOf: profile,
          ...(media ? { image: { "@id": `${canonical}#image` } } : {}),
        },
        citation: entity.records.slice(0, 24).map((record) => ({
          "@type": "CreativeWork",
          name: record.case_name,
          url: publicUrl(`/cases/${record.slug}`),
        })),
      },
      {
        "@type": "ImageObject",
        "@id": `${canonical}#image`,
        url: primaryImage,
        contentUrl: primaryImage,
        width: media ? (entity.kind === "judge" ? 512 : 960) : 1200,
        height: media ? (entity.kind === "judge" ? 512 : 600) : 630,
        caption: media?.caption || `${entity.label} evidence report`,
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
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Legal AI Risk",
            item: publicUrl(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: entityLabel(entity.kind),
            item: publicUrl(entityDirectoryHref(entity.kind)),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: entity.label,
            item: profile,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Evidence report",
            item: canonical,
          },
        ],
      },
    ],
  };
}

function Distribution({
  title,
  eyebrow,
  rows,
  note,
}: {
  title: string;
  eyebrow: string;
  rows: IntelligenceRow[];
  note?: string;
}) {
  return (
    <section className={styles.distribution}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2>{title}</h2>
      {rows.length ? (
        <div className={styles.barList}>
          {rows.slice(0, 6).map((row) => (
            <Link href={row.href} key={row.value}>
              <span>
                <strong>{row.label}</strong>
                <b>
                  {row.count.toLocaleString()} · {row.percentage}%
                </b>
              </span>
              <i aria-hidden="true">
                <em
                  style={{ width: `${Math.max(row.percentage, 1.5)}%` }}
                />
              </i>
            </Link>
          ))}
        </div>
      ) : (
        <p>No classified values are recorded for this dimension.</p>
      )}
      {note && <small>{note}</small>}
    </section>
  );
}

function ReportIdentity({ entity }: { entity: CorpusEntity }) {
  const { icon: Icon, singular } = KIND_COPY[entity.kind];
  const media = getEntityMedia(entity.kind, entity.slug);
  const stateCode =
    entity.kind === "state" ? entity.records[0]?.state || entity.label : null;

  return (
    <aside className={styles.identity}>
      <figure className={`${styles.identityMark} ${entity.kind === "court" ? styles.identityCourtMark : ""}`} data-real-image={Boolean(media)}>
        {media ? (
          <Image
            src={entityMediaAssetHref(media)}
            alt={media.alt}
            width={entity.kind === "judge" ? 512 : 960}
            height={entity.kind === "judge" ? 512 : 600}
          />
        ) : (
          <>
            {entity.kind === "court" ? (
              <CourtScopeVisual entity={entity} variant="report" />
            ) : (
              <>
                <Icon aria-hidden="true" size={28} />
                <strong>{stateCode || initials(entity.label) || "AV"}</strong>
              </>
            )}
          </>
        )}
      </figure>
      <div>
        <span>{singular}</span>
        <strong>{entity.label}</strong>
        <small>Source-linked public-record scope</small>
        {!media && entity.kind === "court" && (
          <small className={styles.imageCredit}>Illustrated scope marker · not a courthouse photograph or official seal</small>
        )}
        {media && (
          <small className={styles.imageCredit}>
            Image: <a href={media.sourceUrl}>{media.credit}</a> · <a href={media.licenseUrl}>{media.license}</a>
          </small>
        )}
      </div>
    </aside>
  );
}

export function EntityReportPage({
  entity,
  searchParams,
}: {
  entity: CorpusEntity;
  searchParams: Params;
}) {
  const tier: ReportTier =
    first(searchParams, "tier") === "premium" ? "premium" : "free";
  const brandKey = readReportBrand(first(searchParams, "brand"));
  const intelligence = buildEntityIntelligence(entity);
  const related = entityRelated(entity, 6);
  const sourceRate = entity.records.length
    ? Math.round((entity.sourceLinked / entity.records.length) * 1000) / 10
    : 0;
  const reportId = createReportId(
    "AV-ER",
    `${entity.kind}:${entity.slug}`,
  );
  const generated = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const canonicalReport = entityReportHref(entity.kind, entity.slug);
  const profileHref = entityHref(entity.kind, entity.slug);
  const definition = entityDefinition(entity);
  const schema = reportSchema(entity);
  const shownRecords = entity.records.slice(0, 12);
  const { eyebrow } = KIND_COPY[entity.kind];

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <ReportPreviewToolbar
        backHref={profileHref}
        backLabel={`Back to ${entity.kind === "judge" ? "judge profile" : "live profile"}`}
        tier={tier}
        title={`${entity.label} | AI Vortex Evidence Report`}
      />

      <article
        className={`${styles.sheet} ${
          tier === "premium" ? styles.proSheet : ""
        } ${entity.records.length <= 2 ? styles.compactSheet : ""}`}
      >
        <header className={styles.header}>
          <ReportBrandLockup brand={brandKey} tier={tier} />
          <div className={styles.documentMeta}>
            <strong>{eyebrow}</strong>
            <span>{reportId}</span>
            <span>Generated {generated}</span>
            <span>Evidence checked {formatCaseDate(LAST_CHECKED)}</span>
          </div>
        </header>

        <nav className={styles.reportNav} aria-label="Evidence report links">
          <Link href={profileHref}>
            <FileText size={15} aria-hidden="true" />
            View live intelligence profile
          </Link>
          <Link href={entityCaseDirectoryHref(entity)}>
            <ArrowRight size={15} aria-hidden="true" />
            Inspect every matching record
          </Link>
        </nav>

        <section className={styles.titleBlock}>
          <div>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1>{entity.label}</h1>
            <p>
              A print-ready review packet of the issues, recorded responses,
              participant context, and source-linked matters currently associated
              with this profile.
            </p>
          </div>
          <ReportIdentity entity={entity} />
        </section>

        <section className={styles.kpis}>
          <div>
            <FileText aria-hidden="true" />
            <span>Matched records</span>
            <strong>{entity.records.length.toLocaleString()}</strong>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" />
            <span>Source linked</span>
            <strong>{sourceRate}%</strong>
          </div>
          <div>
            <Banknote aria-hidden="true" />
            <span>Known amount total</span>
            <strong>
              {intelligence.monetary.known
                ? formatCurrency(intelligence.monetary.total)
                : "None recorded"}
            </strong>
          </div>
          <div>
            <CalendarDays aria-hidden="true" />
            <span>Recorded range</span>
            <strong>
              {formatCaseDate(intelligence.earliest)} –{" "}
              {formatCaseDate(intelligence.latest)}
            </strong>
          </div>
        </section>

        <section className={styles.answer}>
          <span className={styles.eyebrow}>EVIDENCE-BASED ANSWER</span>
          <h2>{intelligence.question}</h2>
          {definition && (
            <p>
              <strong>Taxonomy definition:</strong> {definition}
            </p>
          )}
          <p>{intelligence.summary}</p>
          {intelligence.sampleNote && (
            <p className={styles.sampleNote}>
              <ShieldAlert aria-hidden="true" size={16} />
              {intelligence.sampleNote}
            </p>
          )}
          <small>
            Every distribution below links to the exact matching records. This
            report does not convert corpus counts into a behavioral prediction.
          </small>
        </section>

        <div className={styles.distributionGrid}>
          <Distribution
            eyebrow="OBSERVED ISSUE MIX"
            title="What problems appear in these records?"
            rows={intelligence.failures}
            note="Issue categories can overlap within one matter."
          />
          <Distribution
            eyebrow="RECORDED RESPONSES"
            title="How did courts or authorities respond?"
            rows={intelligence.consequences}
            note="A recorded response does not imply that every matter ended in a sanction."
          />
          <Distribution
            eyebrow="PARTICIPANT CONTEXT"
            title="Who appears in these matters?"
            rows={intelligence.parties}
          />
          <Distribution
            eyebrow="MATTER CONTEXT"
            title="Which practice areas are represented?"
            rows={intelligence.practiceAreas}
          />
        </div>

        <section className={styles.evidence}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>UNDERLYING EVIDENCE</span>
              <h2>Selected public records behind this report</h2>
            </div>
            <span>
              Showing {shownRecords.length.toLocaleString()} of{" "}
              {entity.records.length.toLocaleString()}
            </span>
          </div>
          <div className={styles.recordTable}>
            {shownRecords.map((record) => (
              <div className={styles.record} key={record.id}>
                <span>{formatCaseDate(record.date)}</span>
                <Link href={`/cases/${record.slug}`}>{record.case_name}</Link>
                <span>{record.court || "Court not recorded"}</span>
                <span>{record.ai_tool_used || "Tool not recorded"}</span>
                {record.source_url ? (
                  <a
                    href={record.source_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open source for ${record.case_name}`}
                  >
                    Source <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : (
                  <span>Source pending</span>
                )}
              </div>
            ))}
          </div>
          <Link className={styles.allRecords} href={entityCaseDirectoryHref(entity)}>
            Open all matching records <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.boundary}>
          <div>
            <span className={styles.eyebrow}>EVIDENCE BOUNDARY</span>
            <h2>Scope, traceability, and limits</h2>
          </div>
          <div>
            <p>
              This report groups existing structured public-record fields. For
              judges, the counts describe matters in which that person is
              recorded as a decision-maker; they do not establish general
              practices, sanction rates, or future behavior.
            </p>
            <p>
              The complete docket, later history, local rules, standing orders,
              and controlling primary materials remain authoritative.
            </p>
          </div>
        </section>

        {related.length > 0 && (
          <section className={styles.related}>
            <div>
              <span className={styles.eyebrow}>CONNECTED INTELLIGENCE</span>
              <h2>Related corpus profiles</h2>
            </div>
            <div className={styles.relatedList}>
              {related.map(({ candidate, overlap }) => (
                <Link
                  href={entityHref(candidate.kind, candidate.slug)}
                  key={`${candidate.kind}:${candidate.slug}`}
                >
                  <strong>{candidate.label}</strong>
                  <span>
                    {overlap.toLocaleString()} shared{" "}
                    {overlap === 1 ? "record" : "records"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer
          className={`${styles.footer} ${
            tier === "premium" ? styles.proFooter : ""
          }`}
        >
          {tier === "free" ? (
            <>
              <div className={styles.footerIdentity}>
                <Image
                  className={styles.footerLogo}
                  src={assetUrl("/av-logo-nav.png")}
                  alt=""
                  width={28}
                  height={28}
                />
                <div>
                  <strong>AI Vortex · Manu Ayala</strong>
                  <span>
                    Source-backed legal AI risk intelligence and workflow
                    design.
                  </span>
                </div>
              </div>
              <div className={styles.footerLinks}>
                <a href="https://www.aivortex.io/legal">
                  aivortex.io/legal
                </a>
                <a href="mailto:manuel@aivortex.io">manuel@aivortex.io</a>
                <a
                  href="https://www.linkedin.com/in/aivortex/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </div>
              <div className={styles.upgradeActions}>
                <a href="https://www.aivortex.io/legal#subscribe">
                  Upgrade to Pro
                </a>
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
            <Link
              href={`${canonicalReport}?tier=${tier}&brand=${brandKey}`}
            >
              View live report
            </Link>
            <span>Corpus checked {formatCaseDate(LAST_CHECKED)}</span>
            <Link href="/sources">Methodology</Link>
            <span>Public intelligence, not legal advice.</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
