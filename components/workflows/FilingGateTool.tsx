"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Printer, RotateCcw } from "lucide-react";
import styles from "./WorkflowTools.module.css";

const gates=[
 ["AI-use intake","Record every model or AI-enabled legal tool that touched the work.","Responsible attorney"],
 ["Citation existence","Open every cited authority in a primary or approved research source.","Verifier"],
 ["Quote and pincite","Compare quoted text word-for-word and confirm each pincite.","Verifier"],
 ["Proposition support","Confirm the authority supports the sentence for which it is cited.","Verifier"],
 ["Court and judge rules","Check local rules, standing orders, disclosure and certification duties.","Responsible attorney"],
 ["Exception review","Resolve, remove, or escalate every failed or unclear item.","Signing attorney"],
 ["Final signoff","Signing attorney reviews the exception report and filing recommendation.","Signing attorney"],
 ["Audit record","Save reviewer, date, tools used, sources checked, and unresolved issues.","Matter team"],
];
export default function FilingGateTool(){
 const [matter,setMatter]=useState(""); const [court,setCourt]=useState(""); const [tools,setTools]=useState("");
 const [checked,setChecked]=useState<boolean[]>(()=>gates.map(()=>false));
 const [storageReady,setStorageReady]=useState(false);
 useEffect(()=>{try{const saved=sessionStorage.getItem("aivortex-filing-gate");if(saved){const v=JSON.parse(saved);window.setTimeout(()=>{setMatter(v.matter||"");setCourt(v.court||"");setTools(v.tools||"");setChecked(v.checked||gates.map(()=>false));setStorageReady(true)},0);return;}}catch{}window.setTimeout(()=>setStorageReady(true),0)},[]);
 useEffect(()=>{if(storageReady)sessionStorage.setItem("aivortex-filing-gate",JSON.stringify({matter,court,tools,checked}));},[storageReady,matter,court,tools,checked]);
 const done=checked.filter(Boolean).length; const ready=done===gates.length;
 const artifact=`/artifact/print?type=prefiling&title=${encodeURIComponent(matter?`${matter} - Pre-Filing Review Packet`:"Pre-Filing AI Risk Packet")}&audience=filing_team&court=${encodeURIComponent(court)}&ai_tool=${encodeURIComponent(tools)}`;
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.hero}><div><span className={styles.eyebrow}>Operational workflow</span><h1>AI filing gate</h1><p>Complete the eight controls before court-facing work touched by AI leaves the team. Progress stays in this tab and is removed when it closes.</p></div><div className={styles.heroMeta}><span>{done}/8 complete</span><span>{ready?"Ready for signoff":"Review open"}</span></div></header>
  <div className={styles.grid}><section className={styles.panel}><h2>Matter setup</h2><p className={styles.panelIntro}>Use a matter label only. Do not enter privileged facts or client confidences.</p><div className={styles.fieldRow}><label className={styles.field}>Matter label<input value={matter} onChange={e=>setMatter(e.target.value)} placeholder="Internal matter or filing name"/></label><label className={styles.field}>Court / judge<input value={court} onChange={e=>setCourt(e.target.value)} placeholder="D.N.J. / Judge name"/></label></div><label className={styles.field}>AI tools involved<input value={tools} onChange={e=>setTools(e.target.value)} placeholder="ChatGPT, Claude, CoCounsel, or other"/></label>
  <div className={styles.progress}><span style={{width:`${done/gates.length*100}%`}}/></div><p className={styles.muted}>{ready?"All gates are complete. The signing attorney can review the exception report.":`${gates.length-done} controls remain.`}</p>
  <div className={styles.checklist}>{gates.map(([title,desc,owner],i)=><label className={styles.check} key={title}><input type="checkbox" checked={checked[i]} onChange={()=>setChecked(v=>v.map((x,n)=>n===i?!x:x))}/><span><strong>{i+1}. {title}</strong><p>{desc}</p></span><span className={styles.owner}>{owner}</span></label>)}</div></section>
  <aside><section className={styles.panel}><h2>Filing posture</h2><div className={`${styles.notice} ${ready?styles.success:""}`}>{ready?<><strong>Ready for attorney review.</strong><br/>Completion documents process, not substantive correctness. The signing attorney remains responsible.</>:<><strong>Do not treat this filing as cleared.</strong><br/>Uncompleted gates must be resolved or expressly escalated before signature.</>}</div><div className={styles.buttonRow}><button className={styles.primary} onClick={()=>window.print()}><Printer size={15}/>Print current checklist</button><Link className={styles.secondary} href={artifact}><Download size={15}/>Open blank packet template</Link><Link className={styles.secondary} href={`/api/artifact?type=ledger&format=csv&court=${encodeURIComponent(court)}&ai_tool=${encodeURIComponent(tools)}`}>Blank ledger CSV</Link><button className={styles.textButton} onClick={()=>{sessionStorage.removeItem("aivortex-filing-gate");setChecked(gates.map(()=>false));setMatter("");setCourt("");setTools("")}}><RotateCcw size={14}/>Reset</button></div></section><section className={styles.panel} style={{marginTop:20}}><h2>Decision rule</h2><div className={styles.actionsList}><div className={styles.action}><strong>Verified</strong><p>Keep the item and record the source checked.</p></div><div className={styles.action}><strong>Corrected or removed</strong><p>Update the draft, then recheck the final version.</p></div><div className={styles.action}><strong>Escalated</strong><p>Signing attorney decides before filing and records the exception.</p></div></div></section></aside></div>
 </div></main>
}
