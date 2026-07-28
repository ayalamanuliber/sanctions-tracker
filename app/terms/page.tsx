import type { Metadata } from "next";
import Link from "next/link";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import styles from "../workspace.module.css";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use | AI Vortex",
  description: "Terms and research boundaries for AI Vortex Legal AI Risk.",
  alternates: { canonical: publicUrl("/terms") },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <ResearchShell>
      <main className={shell.main}>
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Terms</span>
        </div>
        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>Research terms</span>
            <h1>Use the evidence, verify the record</h1>
            <p>
              AI Vortex is a public legal-risk research and workflow product. It
              is not a court, legal research citator, law firm, or substitute
              for professional judgment.
            </p>
          </div>
        </header>
        <div className={styles.methodGrid}>
          <div>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Permitted use</h2>
              <p>
                You may search, inspect, cite, and export public tracker
                material for research, education, compliance, product, and
                legal-workflow purposes. You remain responsible for checking the
                underlying source before relying on a statement or filing.
              </p>
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>No legal advice or guaranteed completeness</h2>
              <p>
                Summaries, classifications, controls, and artifacts are
                informational. They may be incomplete, corrected later, or
                reflect a procedural stage rather than a final adjudication. No
                output guarantees avoidance of sanctions or another legal
                outcome.
              </p>
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Responsible use</h2>
              <ul>
                <li>
                  Do not allege AI use, misconduct, or intent without evidence.
                </li>
                <li>
                  Do not remove source, status, or limitation language in a
                  misleading way.
                </li>
                <li>
                  Do not use the service to expose sealed, privileged, or
                  unlawfully obtained material.
                </li>
                <li>
                  Do not interfere with the service or misrepresent an AI Vortex
                  artifact as a court document.
                </li>
              </ul>
            </section>
          </div>
          <aside>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Corrections</h2>
              <p>
                Public records evolve. Submit supporting documentation through
                the correction workflow so the record can be reviewed.
              </p>
              <Link href="/submit">Suggest a correction</Link>
            </section>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Contact</h2>
              <p>
                Questions about access or these terms:{" "}
                <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20terms">
                  manuel@aivortex.io
                </a>
                .
              </p>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
