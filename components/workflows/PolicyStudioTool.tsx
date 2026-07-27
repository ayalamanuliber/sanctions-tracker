"use client";

import { useMemo, useState } from "react";
import styles from "./WorkflowTools.module.css";

export default function PolicyStudioTool() {
  const [org, setOrg] = useState("Litigation firm");
  const [courts, setCourts] = useState("");
  const [tools, setTools] = useState("ChatGPT, Claude, CoCounsel");
  const [uses, setUses] = useState("Research, drafting, summarization");
  const [reviewer, setReviewer] = useState("Responsible attorney");
  const [type, setType] = useState("court-facing filing policy");
  const title = `${org} ${type}`;
  const sections = useMemo(() => ({
    scope: `This policy applies to ${uses.toLowerCase()} using ${tools || "AI-enabled tools"}${courts ? ` in matters before ${courts}` : ""}.`,
    rule: "AI output is never legal authority. Every citation, quotation, pincite, and legal proposition in court-facing work must be independently verified against an authoritative source.",
    gate: `Before filing, the ${reviewer.toLowerCase()} must confirm citation existence, quote and pincite accuracy, proposition support, applicable court or judge requirements, and resolution of all exceptions.`,
    record: "The matter file must record the tools used, material reviewed, verifier, date, source checked, corrections, removals, escalations, and final signoff.",
    incident: "If a discrepancy is found, pause reliance on the affected text, preserve the draft and sources, notify the responsible reviewer, and correct, remove, or escalate before filing.",
  }), [courts, reviewer, tools, uses]);
  const exportWord = () => {
    const body = Object.entries(sections).map(([heading, value]) => `<h2>${heading[0].toUpperCase() + heading.slice(1)}</h2><p>${value}</p>`).join("");
    const blob = new Blob([`<!doctype html><meta charset="utf-8"><title>${title}</title><h1>${title}</h1>${body}<hr><p>AI Vortex template. Review with responsible counsel before adoption.</p>`], { type: "application/msword" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.doc`; link.click(); URL.revokeObjectURL(link.href);
  };
  return <main className={styles.page}><div className={styles.wrap}><header className={styles.hero}><div><span className={styles.eyebrow}>Guided policy builder</span><h1>Policy studio</h1><p>Answer the minimum useful questions, then review a short operational policy. This is a starting point for counsel and governance review, not jurisdiction-specific advice.</p></div></header><div className={styles.grid}><section className={styles.panel}><h2>Tailor the policy</h2><p className={styles.panelIntro}>Use conservative defaults when the organization has not decided a point.</p><div className={styles.fieldRow}><label className={styles.field}>Organization type<select value={org} onChange={(e) => setOrg(e.target.value)}><option>Litigation firm</option><option>Solo practice</option><option>In-house legal team</option><option>Court / chambers</option><option>Legal technology vendor</option></select></label><label className={styles.field}>Artifact type<select value={type} onChange={(e) => setType(e.target.value)}><option value="court-facing filing policy">Court-facing filing policy</option><option value="outside counsel addendum">Outside counsel addendum</option><option value="incident response protocol">Incident response protocol</option><option value="approved-use matrix">Approved-use matrix</option></select></label></div><label className={styles.field}>Courts and jurisdictions<input value={courts} onChange={(e) => setCourts(e.target.value)} placeholder="D.N.J., S.D.N.Y., New Jersey state courts" /></label><div className={styles.fieldRow} style={{ marginTop: 14 }}><label className={styles.field}>AI tools used<input value={tools} onChange={(e) => setTools(e.target.value)} /></label><label className={styles.field}>Permitted uses<input value={uses} onChange={(e) => setUses(e.target.value)} /></label></div><label className={styles.field}>Responsible reviewer<select value={reviewer} onChange={(e) => setReviewer(e.target.value)}><option>Responsible attorney</option><option>Signing attorney</option><option>Supervising partner</option><option>Chambers reviewer</option><option>Risk or compliance lead</option></select></label><div className={styles.buttonRow}><button className={styles.primary} onClick={() => window.print()}>Print current policy</button><button className={styles.secondary} onClick={exportWord}>Download editable Word file</button></div></section><aside className={styles.preview}><span className={styles.eyebrow}>Live draft preview</span><h2>{title}</h2><p>{sections.scope}</p><h3>Core rule</h3><p>{sections.rule}</p><h3>Required filing gate</h3><p>{sections.gate}</p><h3>Verification record</h3><p>{sections.record}</p><h3>Incident response</h3><p>{sections.incident}</p><small>Template only. Review with responsible counsel before adoption.</small></aside></div></div></main>;
}
