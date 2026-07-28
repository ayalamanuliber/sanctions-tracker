import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Database,
  FileCheck2,
  FileSearch,
  Gauge,
  Gavel,
  Landmark,
  ScrollText,
  Search,
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
    title: "Analytics evidence brief",
    href: "/analytics",
    user: "Partner, judge, researcher, vendor",
    does: "Filters observed public records and opens the current source-linked analytics brief.",
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

const WITHERS_SLUG = "withers-v-city-of-aberdeen-2026-06-08";

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
            <Link className={shell.buttonSecondary} href={`/cases/${WITHERS_SLUG}/brief?tier=free`}>
              Open a current brief
            </Link>
          </div>
        </header>
        <section className={styles.workflowBand} aria-labelledby="workflow-loop-title">
          <div className={styles.workflowBandIntro}>
            <BookOpenCheck aria-hidden="true" />
            <span>Live evidence workflow</span>
            <h2 id="workflow-loop-title">One record. Three accountable moves.</h2>
            <p>
              Follow a real matter from discovery through source inspection to
              the current review-ready brief.
            </p>
          </div>
          <div className={styles.workflowSteps}>
            <Link href={`/cases/${WITHERS_SLUG}`}>
              <b>01</b><Search aria-hidden="true" /><span><strong>Inspect the record</strong><small>Withers v. City of Aberdeen</small></span><ArrowRight />
            </Link>
            <Link href={`/cases/${WITHERS_SLUG}#source-record`}>
              <b>02</b><Landmark aria-hidden="true" /><span><strong>Check the source</strong><small>Read the recorded evidence and limits</small></span><ArrowRight />
            </Link>
            <Link href={`/cases/${WITHERS_SLUG}/brief?tier=free`}>
              <b>03</b><FileCheck2 aria-hidden="true" /><span><strong>Open the current brief</strong><small>Live, source-linked, and print-ready</small></span><ArrowRight />
            </Link>
          </div>
        </section>
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
              <div className={styles.railTitle}><Database aria-hidden="true" /><div><span>Review sequence</span><h2>Start with the decision</h2></div></div>
              <ol className={styles.decisionList}>
                <li><Search aria-hidden="true" /><span>Search the public record.</span></li>
                <li><Landmark aria-hidden="true" /><span>Inspect the linked source and status.</span></li>
                <li><Gauge aria-hidden="true" /><span>Select the workflow that matches the deadline.</span></li>
                <li><ShieldCheck aria-hidden="true" /><span>Record human verification and unresolved exceptions.</span></li>
                <li><FileCheck2 aria-hidden="true" /><span>Export only what the evidence supports.</span></li>
              </ol>
            </section>
            <section className={shell.card}>
              <div className={styles.railTitle}><FileSearch aria-hidden="true" /><div><span>Neutral default</span><h2>Need a starting point?</h2></div></div>
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
