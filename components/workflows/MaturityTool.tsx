"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./WorkflowTools.module.css";

const questions: readonly (readonly [string, string])[] = [
  ["Policy", "A documented rule governs court-facing AI use."],
  ["Citation verification", "Every citation is checked in an authoritative source."],
  ["Quotes and pincites", "Quotes and pincites are independently compared."],
  ["Proposition support", "Review confirms the authority supports the proposition."],
  ["Court requirements", "Teams check judge, standing-order, local-rule, and disclosure duties."],
  ["Supervision", "A responsible attorney reviews exceptions and signs off."],
  ["Audit trail", "The matter file records tools, reviewers, sources, and resolution."],
  ["Incident response", "A defined pause, correction, preservation, and escalation protocol exists."],
];
const labels = ["None", "Informal", "Documented", "Enforced"];

export default function MaturityTool() {
  const [scores, setScores] = useState<number[]>(questions.map(() => 0));
  useEffect(() => {
    const stored = sessionStorage.getItem("aivortex-maturity-profile");
    if (stored) window.setTimeout(() => setScores(JSON.parse(stored)), 0);
  }, []);
  useEffect(() => { sessionStorage.setItem("aivortex-maturity-profile", JSON.stringify(scores)); }, [scores]);
  const total = scores.reduce((a, b) => a + b, 0);
  const band = total < 7 ? "Exposed" : total < 13 ? "Developing" : total < 19 ? "Controlled" : "Auditable";
  const gaps = useMemo(() => questions.map(([title, description], i) => ({ title, description, score: scores[i] })).filter((x) => x.score < 2).sort((a, b) => a.score - b.score), [scores]);

  return <main className={styles.page}><div className={styles.wrap}>
    <header className={styles.hero}><div><span className={styles.eyebrow}>8-control self-assessment</span><h1>Control maturity profile</h1><p>A practical conversation starter for filing controls. It is not a validated benchmark, compliance rating, or prediction of sanctions risk.</p></div><div><div className={styles.score}>{total}<small>/24</small></div><span className={styles.band}>{band}</span></div></header>
    <div className={styles.notice}>Saved only in this browser tab. Print the current page to preserve this completed profile.</div>
    <div className={styles.grid}><section className={styles.panel}>{questions.map(([title, desc], i) => <div className={styles.question} key={title}><strong>{i + 1}. {title}</strong><p className={styles.panelIntro}>{desc}</p><div className={styles.options}>{labels.map((label, value) => <label className={styles.option} key={label}><input type="radio" name={`q${i}`} checked={scores[i] === value} onChange={() => setScores((v) => v.map((x, n) => n === i ? value : x))} /><span>{value} · {label}</span></label>)}</div></div>)}</section>
      <aside><section className={styles.panel}><h2>Priority gaps</h2><p className={styles.panelIntro}>Address the lowest-scoring controls before expanding higher-risk uses.</p><div className={styles.actionsList}>{gaps.length ? gaps.slice(0, 5).map((g, i) => <div className={styles.action} key={g.title}><strong>{i + 1}. {g.title}</strong><p>{g.description}</p></div>) : <div className={`${styles.notice} ${styles.success}`}>All controls are documented or enforced. Test the evidence trail against a real filing sample.</div>}</div><div className={styles.buttonRow}><button className={styles.primary} onClick={() => window.print()}>Print current profile</button><Link className={styles.secondary} href="/policy-studio">Build policy</Link></div></section>
        <section className={styles.panel} style={{ marginTop: 20 }}><h2>Interpretation</h2><div className={styles.riskLegend}><div><i /><p><strong>0–6 Exposed</strong><br />Few repeatable controls.</p></div><div><i /><p><strong>7–12 Developing</strong><br />Controls rely on individual judgment.</p></div><div><i /><p><strong>13–18 Controlled</strong><br />Documented but not fully evidenced.</p></div><div><i style={{ background: "#16a34a" }} /><p><strong>19–24 Auditable</strong><br />Enforced and evidenced.</p></div></div></section></aside>
    </div>
  </div></main>;
}
