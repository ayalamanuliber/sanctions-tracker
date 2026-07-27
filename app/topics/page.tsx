import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, FileWarning, Gavel, Landmark, MessageSquareQuote, ShieldCheck } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { CASE_FILTERS, queryCases } from "@/lib/cases";
import { publicUrl } from "@/lib/site";
import styles from "./topics.module.css";

export const metadata: Metadata = {
  title: "Legal AI Risk Topics | AI Vortex",
  description: "Explore source-linked legal AI risk records by failure mode, workflow control, and professional use case.",
  alternates: { canonical: publicUrl("/topics") },
};

const topics = [
  { icon: FileWarning, title: "Fabricated authorities", failure: "fake-citations", description: "Nonexistent cases, incorrect citations, and authorities the court could not locate." },
  { icon: MessageSquareQuote, title: "Fabricated or altered quotations", failure: "fabricated-quotes", description: "Quoted language that does not appear in the cited source or changes its meaning." },
  { icon: Landmark, title: "Misrepresented authority", failure: "misrepresented-authority", description: "Real authority used for a proposition, jurisdiction, or procedural rule it does not support." },
  { icon: Gavel, title: "Bar and professional consequences", failure: "bar-referral", description: "Referrals, discipline, disqualification, and other professional-risk outcomes." },
];

export default function TopicsPage() {
  return <ResearchShell><main className={shell.main}>
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Topics</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Guided discovery</span><h1>Explore the patterns behind legal AI risk.</h1><p>Start with the problem you are trying to understand. Each topic opens a reproducible corpus view with source links, court context, and operational controls.</p></div><div className={shell.headActions}><Link className={shell.buttonSecondary} href="/cases">Search all records</Link><Link className={shell.buttonSecondary} href="/sources">How evidence is classified</Link></div></header>
    <section className={styles.topicGrid}>{topics.map(({ icon: Icon, title, failure, description }) => { const cases = queryCases({ failure }); const sourceLinked=cases.filter((item)=>item.source_url).length; const highImpact=cases.filter((item)=>item.severity==="high"||item.severity==="career-ending").length; const share=cases.length?Math.round(cases.length/queryCases({}).length*100):0; return <Link key={failure} className={shell.card} href={`/cases?failure=${failure}&sort=severity`}><div className={styles.topicTop}><Icon /><span>{cases.length.toLocaleString()} records</span></div><h2>{title}</h2><p>{description}</p><div className={styles.topicMetrics}><div><small>Corpus share</small><b>{share}%</b></div><div><small>High impact</small><b>{highImpact.toLocaleString()}</b></div><div><small>Source linked</small><b>{cases.length?Math.round(sourceLinked/cases.length*100):0}%</b></div></div><strong>Inspect the evidence <ArrowRight /></strong></Link>; })}</section>
    <section className={styles.controlBand}><div><ShieldCheck /><span>Workflow controls</span><h2>Move from precedent to prevention.</h2><p>Use the public record to build a filing gate, citation-verification record, or policy review without treating incident counts as usage-adjusted failure rates.</p></div><nav><Link href="/filing-gate">Pre-filing gate <ArrowRight /></Link><Link href="/filing-integrity-scanner">Filing integrity scanner <ArrowRight /></Link><Link href="/control-maturity">Control maturity review <ArrowRight /></Link><Link href="/use-with-ai"><Bot /> Use with AI <ArrowRight /></Link></nav></section>
    <p className={styles.coverage}>Available failure-mode filters: {CASE_FILTERS.failures.length}. Labels may overlap because one public matter can contain several distinct signals.</p>
  </main></ResearchShell>;
}
