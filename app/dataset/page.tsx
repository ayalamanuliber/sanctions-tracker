import type { Metadata } from "next";
import Link from "next/link";
import {
  Braces,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Fingerprint,
  History,
  Link2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { COUNTRIES_TRACKED, LEGAL_RISK_CASES } from "@/lib/cases";
import {
  PUBLIC_DATASET_CITATION,
  PUBLIC_DATASET_FIELDS,
  PUBLIC_DATASET_MANIFEST,
} from "@/lib/public-dataset";
import { publicUrl } from "@/lib/site";
import workspace from "../workspace.module.css";
import styles from "./dataset.module.css";

export const metadata: Metadata = {
  title: "Legal AI Risk Dataset | AI Vortex",
  description:
    "Download and cite the source-linked AI Vortex Legal AI Risk public dataset, with current version, field guide, methodology, and evidence boundaries.",
  alternates: {
    canonical: publicUrl("/dataset"),
    types: {
      "application/json": publicUrl("/api/dataset?format=json"),
      "text/csv": publicUrl("/api/dataset?format=csv"),
      "application/rss+xml": publicUrl("/feed"),
    },
  },
  openGraph: {
    title: "AI Vortex Legal AI Risk Dataset",
    description:
      "A versioned, source-linked public research dataset with methodology, citation guidance, and machine-readable downloads.",
    url: publicUrl("/dataset"),
    type: "website",
  },
};

const fieldGroups = [
  {
    title: "Identity and scope",
    fields: ["id", "slug", "case_name", "date", "court", "judge", "country", "state"],
    note: "Stable record identity and the jurisdiction information recorded in the corpus.",
  },
  {
    title: "Observed classification",
    fields: ["severity", "ai_tool_used", "tags", "sanction_types", "outcome", "alleged"],
    note: "Editorial labels and recorded outcomes. These fields preserve uncertainty and are not predictions or vendor rates.",
  },
  {
    title: "Recorded amount",
    fields: ["amount", "amount_display"],
    note: "A known amount and its display value when recorded. Do not aggregate currencies without normalization.",
  },
  {
    title: "Traceability",
    fields: ["source_name", "source_url"],
    note: "The recorded publisher or source label and the public link available for inspection.",
  },
];

export default function DatasetPage() {
  const canonical = publicUrl("/dataset");
  const earliestRecordDate = LEGAL_RISK_CASES.reduce(
    (earliest, item) => (item.date < earliest ? item.date : earliest),
    LEGAL_RISK_CASES[0]?.date || PUBLIC_DATASET_MANIFEST.version,
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${canonical}#dataset`,
    name: PUBLIC_DATASET_MANIFEST.name,
    description:
      "Structured public-record research on legal AI citation failures, court responses, sanctions, and related consequences.",
    url: canonical,
    creator: { "@id": "https://www.aivortex.io/#organization" },
    publisher: { "@id": "https://www.aivortex.io/#organization" },
    dateModified: PUBLIC_DATASET_MANIFEST.last_checked,
    version: PUBLIC_DATASET_MANIFEST.version,
    temporalCoverage: `${earliestRecordDate}/${PUBLIC_DATASET_MANIFEST.latest_record_date}`,
    isAccessibleForFree: true,
    measurementTechnique: "Structured review of source-linked public legal records",
    variableMeasured: PUBLIC_DATASET_FIELDS.map((field) => ({
      "@type": "PropertyValue",
      name: field,
    })),
    distribution: [
      {
        "@type": "DataDownload",
        name: "Complete JSON export",
        encodingFormat: "application/json",
        contentUrl: PUBLIC_DATASET_MANIFEST.json_url,
      },
      {
        "@type": "DataDownload",
        name: "Complete CSV export",
        encodingFormat: "text/csv",
        contentUrl: PUBLIC_DATASET_MANIFEST.csv_url,
      },
      {
        "@type": "DataDownload",
        name: "Dataset manifest",
        encodingFormat: "application/json",
        contentUrl: PUBLIC_DATASET_MANIFEST.manifest_url,
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
          <span>Dataset</span>
        </div>

        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>Public research dataset</span>
            <h1>Download the record. Preserve its limits.</h1>
            <p>
              A source-linked legal AI research corpus with a current version,
              public methodology, machine-readable exports, and a stable way to cite it.
            </p>
          </div>
          <div className={shell.headActions}>
            <Link className={shell.button} href="/api/dataset?format=csv">
              Download CSV <Download size={15} />
            </Link>
            <Link className={shell.buttonSecondary} href="/api/dataset?format=json">
              Download JSON <Braces size={15} />
            </Link>
          </div>
        </header>

        <section className={workspace.metrics} aria-label="Current dataset snapshot">
          <article className={`${shell.card} ${workspace.metric}`}>
            <small>Public records</small>
            <strong>{PUBLIC_DATASET_MANIFEST.record_count.toLocaleString("en-US")}</strong>
          </article>
          <article className={`${shell.card} ${workspace.metric}`}>
            <small>Source linked</small>
            <strong>{PUBLIC_DATASET_MANIFEST.source_link_coverage_pct}%</strong>
          </article>
          <article className={`${shell.card} ${workspace.metric}`}>
            <small>Countries represented</small>
            <strong>{COUNTRIES_TRACKED.toLocaleString("en-US")}</strong>
          </article>
          <article className={`${shell.card} ${workspace.metric}`}>
            <small>Snapshot version</small>
            <strong className={styles.dateMetric}>{PUBLIC_DATASET_MANIFEST.version}</strong>
          </article>
        </section>

        <div className={workspace.methodGrid}>
          <div>
            <section className={`${shell.card} ${workspace.section}`}>
              <div className={styles.sectionTitle}>
                <Database aria-hidden="true" />
                <div><h2>Public downloads</h2><p>Complete exports and a small manifest for automated freshness checks.</p></div>
              </div>
              <div className={styles.downloadGrid}>
                <Link href="/api/dataset?format=json">
                  <FileJson aria-hidden="true" />
                  <div><strong>JSON dataset</strong><span>Records plus version, citation, fields, filters, and boundaries.</span></div>
                  <Download aria-hidden="true" />
                </Link>
                <Link href="/api/dataset?format=csv">
                  <FileSpreadsheet aria-hidden="true" />
                  <div><strong>CSV dataset</strong><span>Flat public fields for analysis, spreadsheets, and reproducible filters.</span></div>
                  <Download aria-hidden="true" />
                </Link>
                <Link href="/api/dataset/manifest">
                  <Fingerprint aria-hidden="true" />
                  <div><strong>Dataset manifest</strong><span>Version, checksum, record count, field list, and canonical URLs without the full corpus payload.</span></div>
                  <Link2 aria-hidden="true" />
                </Link>
              </div>
              <p className={workspace.warning}>
                The SHA-256 value identifies the ingested source snapshot. It is
                not a checksum of the JSON or CSV response bytes, which use different encodings.
              </p>
            </section>

            <section className={`${shell.card} ${workspace.section}`} id="citation">
              <div className={styles.sectionTitle}>
                <Link2 aria-hidden="true" />
                <div><h2>How to cite the dataset</h2><p>Use the canonical dataset page, snapshot date, and your access date.</p></div>
              </div>
              <blockquote className={styles.citation}>{PUBLIC_DATASET_CITATION}</blockquote>
              <p>
                For a case-level claim, cite the canonical case page and inspect
                its linked source. Preserve the allegation status, evidence boundary,
                and recorded consequence. The dataset is updated in place and is not
                currently an immutable archival repository.
              </p>
            </section>

            <section className={`${shell.card} ${workspace.section}`}>
              <div className={styles.sectionTitle}>
                <Braces aria-hidden="true" />
                <div><h2>Field guide</h2><p>{PUBLIC_DATASET_FIELDS.length} public fields are included in JSON and CSV exports.</p></div>
              </div>
              <div className={styles.fieldGroups}>
                {fieldGroups.map((group) => (
                  <article key={group.title}>
                    <h3>{group.title}</h3>
                    <div className={styles.fieldNames}>{group.fields.map((field) => <code key={field}>{field}</code>)}</div>
                    <p>{group.note}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={`${shell.card} ${workspace.section}`} id="changelog">
              <div className={styles.sectionTitle}>
                <History aria-hidden="true" />
                <div><h2>Freshness and changelog</h2><p>The public snapshot contract follows the corpus validation date, not the deploy clock.</p></div>
              </div>
              <div className={workspace.timeline}>
                <article>
                  <time>{PUBLIC_DATASET_MANIFEST.version}</time>
                  <div><strong>Current validated snapshot</strong><p>{PUBLIC_DATASET_MANIFEST.record_count.toLocaleString("en-US")} public records, checked against the upstream register. Latest tracked decision: {PUBLIC_DATASET_MANIFEST.latest_record_date}.</p></div>
                </article>
                <article>
                  <time>Each refresh</time>
                  <div><strong>Import and validation</strong><p>New rows are normalized and checked for required identity, date, jurisdiction, and source fields before the public snapshot advances.</p></div>
                </article>
                <article>
                  <time>On evidence</time>
                  <div><strong>Corrections and later history</strong><p>Source-backed corrections and changed outcomes are reviewed for a later snapshot. The public version date changes only when the corpus refresh is validated.</p></div>
                </article>
              </div>
            </section>
          </div>

          <aside>
            <section className={`${shell.card} ${workspace.section}`}>
              <div className={styles.sectionTitle}>
                <RefreshCw aria-hidden="true" />
                <div><h2>Snapshot manifest</h2></div>
              </div>
              <dl className={styles.manifest}>
                <div><dt>Version</dt><dd>{PUBLIC_DATASET_MANIFEST.version}</dd></div>
                <div><dt>Last checked</dt><dd>{PUBLIC_DATASET_MANIFEST.last_checked}</dd></div>
                <div><dt>Latest record</dt><dd>{PUBLIC_DATASET_MANIFEST.latest_record_date}</dd></div>
                <div><dt>Records</dt><dd>{PUBLIC_DATASET_MANIFEST.record_count.toLocaleString("en-US")}</dd></div>
              </dl>
              <h3>Ingested source SHA-256</h3>
              <code className={styles.checksum}>{PUBLIC_DATASET_MANIFEST.sha256}</code>
            </section>

            <section className={`${shell.card} ${workspace.section}`}>
              <div className={styles.sectionTitle}>
                <ShieldCheck aria-hidden="true" />
                <div><h2>Evidence boundary</h2></div>
              </div>
              <ul>
                {PUBLIC_DATASET_MANIFEST.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}
              </ul>
              <div className={workspace.download} style={{ marginTop: 18 }}>
                <Link href="/sources">Read full methodology</Link>
                <Link href="/submit">Submit a correction</Link>
                <Link href="/feed">Follow RSS updates</Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
