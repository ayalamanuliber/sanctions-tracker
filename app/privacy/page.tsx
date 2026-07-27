import type { Metadata } from "next";
import Link from "next/link";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import styles from "../workspace.module.css";

export const metadata: Metadata = { title: "Privacy | AI Vortex", description: "Privacy boundaries for the AI Vortex public legal AI risk tracker and local review tools." };

export default function PrivacyPage() {
  return <ResearchShell><main className={shell.main}>
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>Privacy</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Privacy boundary</span><h1>Know what the product handles</h1><p>The public tracker is designed for public-record research. Workflow tools state when data remains in the browser and when a link opens an external source.</p></div></header>
    <div className={styles.methodGrid}><div>
      <section className={`${shell.card} ${styles.section}`}><h2>Public research activity</h2><p>Searches, filter selections, and page requests may be processed to operate, secure, and improve the service. Do not enter privileged, confidential, sealed, or personally sensitive matter information into public search fields.</p></section>
      <section className={`${shell.card} ${styles.section}`}><h2>Local workflow tools</h2><p>Tools marked “local session only” are intended to process the entered material in the current browser session. The filing integrity review currently extracts candidates from pasted text or local text files and does not upload a document to AI Vortex for legal analysis.</p></section>
      <section className={`${shell.card} ${styles.section}`}><h2>External sources and AI apps</h2><p>Underlying source links leave AI Vortex and are governed by the destination site. Connecting the MCP to ChatGPT, Claude, or another host also subjects the conversation and tool calls to that host’s privacy and retention terms.</p></section>
    </div><aside>
      <section className={`${shell.card} ${styles.section}`}><h2>Safe default</h2><ul><li>Use public or non-confidential material.</li><li>Redact client and matter identifiers.</li><li>Verify your organization’s approved-tool policy.</li><li>Do not assume a third-party source is confidential.</li></ul></section>
      <section className={`${shell.card} ${styles.section}`}><h2>Questions or deletion requests</h2><p>Email <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20privacy%20request">manuel@aivortex.io</a> with the affected URL or record and enough detail to investigate.</p></section>
    </aside></div>
  </main></ResearchShell>;
}
