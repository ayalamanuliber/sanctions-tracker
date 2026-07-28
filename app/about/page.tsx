import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, ShieldCheck } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { COUNTRIES_TRACKED, LEGAL_RISK_CASES } from "@/lib/cases";
import { assetUrl, publicUrl } from "@/lib/site";
import styles from "../workspace.module.css";

export const metadata: Metadata = {
  title: "About AI Vortex Legal AI Risk",
  description:
    "Publisher, editorial mission, provenance, and contact information for the AI Vortex Legal AI Risk public intelligence layer.",
  alternates: { canonical: publicUrl("/about") },
  openGraph: {
    title: "About AI Vortex Legal AI Risk",
    description:
      "The people, principles, and public-source methodology behind AI Vortex Legal AI Risk.",
    url: publicUrl("/about"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About AI Vortex Legal AI Risk",
    description:
      "The people, principles, and public-source methodology behind AI Vortex Legal AI Risk.",
  },
};

export default function AboutPage() {
  const canonical = publicUrl("/about");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${canonical}#page`,
        url: canonical,
        name: "About AI Vortex Legal AI Risk",
        isPartOf: { "@id": `${publicUrl("/")}#website` },
        mainEntity: { "@id": `${canonical}#publisher` },
      },
      {
        "@type": "Person",
        "@id": `${canonical}#publisher`,
        name: "Manu Ayala",
        url: "https://www.aivortex.io/legal/",
        image: publicUrl("/manuel.webp"),
        jobTitle: "Founder and publisher, AI Vortex",
        worksFor: { "@id": "https://www.aivortex.io/#organization" },
        sameAs: ["https://www.linkedin.com/in/aivortex/"],
      },
      {
        "@type": "Organization",
        "@id": "https://www.aivortex.io/#organization",
        name: "AI Vortex",
        url: "https://www.aivortex.io/",
        founder: { "@id": `${canonical}#publisher` },
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
          <Link href="/">Home</Link><span>/</span><span>About</span>
        </div>
        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>Independent public intelligence</span>
            <h1>The publisher behind the evidence layer</h1>
            <p>
              AI Vortex organizes source-linked public records about legal AI
              risk so lawyers, courts, researchers, and legal-technology teams
              can inspect what happened, verify the source, and preserve the
              limits of the available evidence.
            </p>
          </div>
          <div className={shell.headActions}>
            <Link className={shell.button} href="/cases">Search the corpus</Link>
            <Link className={shell.buttonSecondary} href="/sources">Read methodology</Link>
          </div>
        </header>

        <div className={styles.methodGrid}>
          <div>
            <section className={`${shell.card} ${styles.section}`}>
              <div className={styles.publisherProfile}>
                <Image
                  src={assetUrl("/manuel.webp")}
                  alt="Manu Ayala"
                  width={96}
                  height={96}
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
                />
                <div>
                  <span className={shell.eyebrow}>Publisher</span>
                  <h2 style={{ marginTop: 6 }}>Manu Ayala · AI Vortex</h2>
                  <p>
                    Manu spent five years running investigations at a US law
                    firm and now builds legal AI intelligence, verification
                    workflows, and implementation systems for legal teams.
                  </p>
                </div>
              </div>
              <div className={styles.resourceGrid} style={{ marginTop: 22 }}>
                <a className={styles.resourceCard} href="https://www.aivortex.io/legal/">
                  <ExternalLink />
                  <div><strong>AI Vortex profile and research</strong><p>Articles, legal AI analysis, and implementation work.</p><span>Open AI Vortex</span></div>
                </a>
                <a className={styles.resourceCard} href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noreferrer">
                  <ExternalLink />
                  <div><strong>LinkedIn</strong><p>Research notes, product updates, and public legal AI analysis.</p><span>Connect with Manu</span></div>
                </a>
                <a className={styles.resourceCard} href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20Legal%20AI%20Risk">
                  <Mail />
                  <div><strong>Email</strong><p>Corrections, research questions, review-group interest, and collaboration.</p><span>manuel@aivortex.io</span></div>
                </a>
                <Link className={styles.resourceCard} href="/submit">
                  <ShieldCheck />
                  <div><strong>Corrections and submissions</strong><p>Send a source-backed correction or suggest a public record.</p><span>Open correction intake</span></div>
                </Link>
              </div>
            </section>

            <section className={`${shell.card} ${styles.section}`}>
              <h2>Editorial mission</h2>
              <p>
                The product is designed as a public evidence layer, not a
                sanctions predictor, AI detector, vendor failure-rate ranking,
                or substitute for primary legal research. Every public surface
                should distinguish a linked source from a human review and an
                allegation from an adjudicated consequence.
              </p>
              <h3>What AI Vortex adds</h3>
              <ul>
                <li>Stable, searchable public case records and source links.</li>
                <li>Structured status, attribution, consequence, and evidence boundaries.</li>
                <li>Courts, jurisdictions, topics, analytics, and print-ready briefs.</li>
                <li>Transparent limitations, correction intake, and reproducible public views.</li>
              </ul>
            </section>

            <section className={`${shell.card} ${styles.section}`}>
              <h2>Data lineage and attribution</h2>
              <p>
                Portions of the underlying public record were identified
                through Damien Charlotin&apos;s legal AI case archive and were
                subsequently structured, classified, linked, and enriched by
                AI Vortex. Where a record points to that archive rather than an
                issuing court or docket mirror, the source tier is displayed
                explicitly.
              </p>
              <p style={{ marginTop: 12 }}>
                AI Vortex does not imply Damien Charlotin&apos;s endorsement or
                partnership. The linked court document, docket, order, or
                attributable public record remains controlling.
              </p>
            </section>
          </div>

          <aside>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Current public scope</h2>
              <div className={styles.sourceTypes}>
                <div className={styles.sourceType}><strong>Public records</strong><span>{LEGAL_RISK_CASES.length.toLocaleString()}</span></div>
                <div className={styles.sourceType}><strong>Countries covered</strong><span>{COUNTRIES_TRACKED.toLocaleString()}</span></div>
                <div className={styles.sourceType}><strong>Access</strong><span>Free</span></div>
                <div className={styles.sourceType}><strong>Legal advice</strong><span>No</span></div>
              </div>
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Contact the publisher</h2>
              <p>
                For a factual correction, include the case URL and supporting
                source. For research or implementation questions, describe the
                court, jurisdiction, workflow, or decision you are working on.
              </p>
              <div className={styles.download} style={{ marginTop: 14 }}>
                <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20research%20inquiry">Email Manu <Mail size={14} /></a>
                <a href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={14} /></a>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
