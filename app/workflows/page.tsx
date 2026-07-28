import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  FileSearch,
  Gauge,
  Gavel,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import styles from "./workflows.module.css";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal AI Risk Workflows | AI Vortex",
  description:
    "Operational legal AI review tools, templates, and evidence workflows.",
  alternates: { canonical: publicUrl("/workflows") },
  robots: { index: false, follow: true },
};

const workflows = [
  {
    icon: FileCheck2,
    title: "Pre-filing gate",
    href: "/filing-gate",
    user: "Filing team",
    does: "Assigns citation, quote, proposition, disclosure, and signoff checks before filing.",
    boundary:
      "A workflow checklist; it does not verify authority automatically.",
  },
  {
    icon: FileSearch,
    title: "Filing integrity review",
    href: "/filing-integrity-scanner",
    user: "Litigation team or chambers",
    does: "Extracts citation and quote candidates from pasted text and records human verification decisions.",
    boundary:
      "Local candidate extraction is not legal research or proof of AI use.",
  },
  {
    icon: Gauge,
    title: "Control maturity profile",
    href: "/control-maturity",
    user: "Risk, KM, innovation",
    does: "Profiles eight operational controls and identifies the next practical control to implement.",
    boundary: "An internal control profile, not a validated risk prediction.",
  },
  {
    icon: ScrollText,
    title: "Policy studio",
    href: "/policy-studio",
    user: "Firm or legal department",
    does: "Builds a scoped starting policy and implementation package around declared practices.",
    boundary:
      "A drafting aid that requires organization-specific legal and security review.",
  },
  {
    icon: Gavel,
    title: "Jurisdiction brief",
    href: "/dashboard",
    user: "Partner, judge, researcher, vendor",
    does: "Summarizes observed public records with role-specific controls and reproducible filters.",
    boundary: "Corpus patterns are not usage-adjusted incident rates.",
  },
  {
    icon: ShieldCheck,
    title: "Source review",
    href: "/sources",
    user: "Any researcher",
    does: "Explains inclusion, source tiers, editorial classifications, and limitations.",
    boundary:
      "A link in the tracker is not the same as independent verification.",
  },
];

export default function WorkflowsPage() {
  return (
    <ResearchShell>
      <main className={shell.main}>
        <div className={shell.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Workflows</span>
        </div>
        <header className={shell.pageHead}>
          <div>
            <span className={shell.eyebrow}>Operational tools</span>
            <h1>Move from precedent to a review record</h1>
            <p>
              Choose the workflow that matches the decision in front of you.
              Every tool states what it does, what it cannot establish, and what
              a human reviewer still owns.
            </p>
          </div>
          <div className={shell.headActions}>
            <Link className={shell.button} href="/cases">
              Search first
            </Link>
            <Link className={shell.buttonSecondary} href="/use-with-ai">
              Use in your AI app
            </Link>
          </div>
        </header>
        <div className={styles.layout}>
          <section className={styles.grid}>
            {workflows.map(
              ({ icon: Icon, title, href, user, does, boundary }) => (
                <article className={styles.card} key={title}>
                  <div className={styles.icon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <span>For {user}</span>
                  <h2>{title}</h2>
                  <p>{does}</p>
                  <p className={styles.boundary}>
                    <b>Boundary:</b> {boundary}
                  </p>
                  <Link href={href}>
                    Open workflow <ArrowRight />
                  </Link>
                </article>
              ),
            )}
          </section>
          <aside className={styles.rail}>
            <section className={shell.card}>
              <h2>Start with the decision</h2>
              <ol>
                <li>Search the public record.</li>
                <li>Inspect the linked source and status.</li>
                <li>Select the workflow that matches the deadline.</li>
                <li>Record human verification and unresolved exceptions.</li>
                <li>Export only what the evidence supports.</li>
              </ol>
            </section>
            <section className={shell.card}>
              <h2>Need a neutral default?</h2>
              <p>
                Use the filing integrity review when the immediate question is
                whether citations, quotations, pincites, or propositions match
                their sources. It avoids attributing a discrepancy to AI without
                evidence.
              </p>
              <Link href="/filing-integrity-scanner">
                Open integrity review <ArrowRight />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </ResearchShell>
  );
}
