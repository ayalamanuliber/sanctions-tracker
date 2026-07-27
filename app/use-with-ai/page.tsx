"use client";

import Link from "next/link";
import { ArrowRight, Bot, Check, Copy, ExternalLink, FileSearch, LockKeyhole, MessageSquareText, ShieldCheck } from "lucide-react";
import { useState } from "react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import styles from "./use-with-ai.module.css";
import { publicUrl } from "@/lib/site";

const endpoint=publicUrl("/mcp");
const prompts=[
  "Find source-linked matters involving fabricated quotations in D.N.J.",
  "Give chambers a neutral brief on recent filing-integrity issues.",
  "Build a pre-filing review packet for tomorrow's motion.",
  "Show the evidence note and link every named source.",
];

export default function UseWithAiPage(){
  const [copied,setCopied]=useState(false);
  const copy=async()=>{await navigator.clipboard.writeText(endpoint);setCopied(true);setTimeout(()=>setCopied(false),1600)};
  return <ResearchShell><main className={shell.main}>
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>Use with AI</span></div>
    <header className={`${shell.pageHead} ${styles.hero}`}><div><span className={shell.eyebrow}>Read-only public connector</span><h1>Put the evidence inside the AI workspace you already use.</h1><p>Connect AI Vortex to ChatGPT, Claude, Codex, or another MCP-compatible client. Search the same public corpus, request a brief, and receive source links and transparent fallbacks without granting access to private files or matters.</p></div><div className={styles.heroMark}><Bot/><strong>Public MCP</strong><span>Read only · no login</span></div></header>

    <section className={styles.connect}><div><span>Connection endpoint</span><h2>One URL. The same evidence layer.</h2><p>Add this URL as a custom remote MCP server. Authentication is not required for the public tools.</p><div className={styles.endpoint}><code>{endpoint}</code><button onClick={copy}>{copied?<Check/>:<Copy/>}{copied?"Copied":"Copy URL"}</button></div><ol><li><b>1</b><span>Open connector, app, or MCP settings in your AI client.</span></li><li><b>2</b><span>Add a custom remote server using the endpoint above.</span></li><li><b>3</b><span>Ask for a case search, jurisdiction brief, or review packet.</span></li></ol></div><aside><span>Live connection</span><strong>Public endpoint available</strong><p>Check transport status and the current tool surface before deploying it across a team.</p><a href={publicUrl("/mcp-health")} target="_blank">Open health record <ExternalLink/></a></aside></section>

    <div className={styles.capabilities}>
      <article><FileSearch/><span>Research</span><h2>Search the complete public record</h2><p>Find exact case, court, jurisdiction, tool, and failure-mode matches. Narrow queries broaden only when the fallback is disclosed.</p></article>
      <article><MessageSquareText/><span>Advisory output</span><h2>Turn evidence into an answer</h2><p>Request role-aware briefs, comparisons, checklists, policy gaps, dashboards, and source appendices with the relevant denominator attached.</p></article>
      <article><ShieldCheck/><span>Trust boundary</span><h2>Know what the tool cannot establish</h2><p>It does not verify private documents, accuse counsel of using AI, replace legal research, or convert public incident counts into failure rates.</p></article>
    </div>

    <section className={styles.prompts}><div><span>Start with a real decision</span><h2>Prompts that show the product at work</h2><p>The connector is most useful when the user specifies the role, jurisdiction, deadline, and intended output.</p></div><div>{prompts.map((prompt,index)=><button key={prompt} onClick={()=>navigator.clipboard.writeText(prompt)}><b>0{index+1}</b><span>{prompt}</span><Copy/></button>)}</div></section>
    <section className={styles.boundary}><LockKeyhole/><div><span>Privacy boundary</span><h2>The public connector cannot see your files, matters, or browsing history.</h2><p>Only the text your AI host sends to an invoked tool is processed. Do not provide confidential material to a public connector. Organization deployments require separate security and data-governance review.</p></div><Link href="/privacy">Review privacy <ArrowRight/></Link></section>
  </main></ResearchShell>;
}
