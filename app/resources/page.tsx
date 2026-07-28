import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileCheck2,
  FileSearch,
  Gauge,
  Map,
  Scale,
  ScrollText,
} from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import styles from "../workspace.module.css";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal AI Risk Resources | AI Vortex",
  description:
    "Free source-linked legal AI risk research, court workflows, and review tools.",
  alternates: { canonical: publicUrl("/resources") },
  robots: { index: true, follow: true },
};

const resources = [
  {
    icon: Scale,
    title: "Case and order library",
    body: "Search public matters by case, court, tool, failure mode, outcome, or jurisdiction.",
    href: "/cases?status=non-alleged",
  },
  {
    icon: Map,
    title: "Jurisdiction map",
    body: "Move from national patterns to state-level records and reproducible result sets.",
    href: "/map",
  },
  {
    icon: FileSearch,
    title: "Filing integrity review",
    body: "Extract authority candidates and record human verification without alleging AI use.",
    href: "/filing-integrity-scanner",
  },
  {
    icon: FileCheck2,
    title: "Pre-filing gate",
    body: "Assign citation, quotation, proposition, disclosure, and responsible-reviewer checks.",
    href: "/filing-gate",
  },
  {
    icon: Gauge,
    title: "Control maturity profile",
    body: "Assess eight operational controls and identify the next practical improvement.",
    href: "/control-maturity",
  },
  {
    icon: ScrollText,
    title: "Policy studio",
    body: "Create a scoped policy starting point and implementation package for review.",
    href: "/policy-studio",
  },
  {
    icon: Bot,
    title: "Use with your AI app",
    body: "Connect the same public intelligence to ChatGPT, Claude, Codex, or another MCP host.",
    href: "/use-with-ai",
  },
];

export default function ResourcesPage() {
  return (
    <ResearchShell>
      <main className={shell.main}>
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Resources</span>
        </div>
        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>Free public library</span>
            <h1>Research the precedent. Run the review.</h1>
            <p>
              Start with the public record, then choose the workflow that
              matches the legal decision in front of you. Every surface
              preserves the source and states its limits.
            </p>
          </div>
          <div className={shell.headActions}>
            <Link className={shell.button} href="/cases">
              Search cases
            </Link>
            <Link className={shell.buttonSecondary} href="/sources">
              Read methodology
            </Link>
          </div>
        </header>
        <section className={`${shell.card} ${styles.section}`}>
          <h2>Research and workflow library</h2>
          <div className={styles.resourceGrid}>
            {resources.map(({ icon: Icon, title, body, href }) => (
              <Link className={styles.resourceCard} href={href} key={title}>
                <Icon size={20} />
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                  <span>
                    Open resource <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <div className={styles.methodGrid}>
          <section className={`${shell.card} ${styles.section}`}>
            <h2>Research sequence</h2>
            <ol>
              <li>Search the case, court, issue, or source.</li>
              <li>Open the underlying public record.</li>
              <li>Separate allegations, warnings, and adjudicated outcomes.</li>
              <li>Use a workflow to record verification and exceptions.</li>
              <li>
                Share a source-linked artifact, not an unsupported conclusion.
              </li>
            </ol>
          </section>
          <aside>
            <section className={`${shell.card} ${styles.section}`}>
              <h2>Need a correction?</h2>
              <p>
                Submit a missing matter, source link, changed outcome, court AI
                rule, or correction with supporting documentation.
              </p>
              <Link href="/submit">Open contribution form</Link>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
