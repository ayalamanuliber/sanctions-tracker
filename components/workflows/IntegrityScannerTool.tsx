"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clipboard, Download, FileSearch, Plus, Printer, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import styles from "./WorkflowTools.module.css";

type ReviewStatus = "unverified" | "checking" | "confirmed" | "resolved" | "escalated";
type CheckValue = "unknown" | "yes" | "no" | "na";
type Row = {
  id: string;
  item: string;
  location: string;
  type: string;
  source: string;
  sourceText: string;
  exists: CheckValue;
  quote: CheckValue;
  pincite: CheckValue;
  supports: CheckValue;
  status: ReviewStatus;
  notes: string;
};

const STORAGE_KEY = "aivortex-integrity-review-v2";
const empty = (item = "", type = "unclear"): Row => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  item,
  location: "",
  type,
  source: "",
  sourceText: "",
  exists: "unknown",
  quote: "unknown",
  pincite: "unknown",
  supports: "unknown",
  status: "unverified",
  notes: "",
});

function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }

function extractCandidates(text: string) {
  const found = new Map<string, { text: string; type: string }>();
  const quotePattern = /[“"]([^”"\n]{30,600})[”"]/g;
  const citationPattern = /\b\d{1,4}\s+(?:U\.S\.|S\.\s*Ct\.|F\.\s*(?:2d|3d|4th|Supp\.?\s*\d*d?)|A\.\s*(?:2d|3d)|P\.\s*(?:2d|3d)|N\.E\.\s*(?:2d|3d)|N\.W\.\s*(?:2d|3d)|S\.E\.\s*(?:2d)|So\.\s*(?:2d|3d))\s+\d{1,6}\b/gi;
  const docketPattern = /\b(?:Case\s+No\.|Civil\s+Action\s+No\.|No\.)\s*[A-Za-z0-9][A-Za-z0-9:._-]{3,30}\b/gi;
  for (const match of text.matchAll(quotePattern)) found.set(match[0], { text: match[0], type: "quote_candidate" });
  for (const match of text.matchAll(citationPattern)) found.set(match[0], { text: match[0], type: "citation_candidate" });
  for (const match of text.matchAll(docketPattern)) found.set(match[0], { text: match[0], type: "docket_candidate" });
  return [...found.values()].slice(0, 100);
}

export default function IntegrityScannerTool() {
  const [rows, setRows] = useState<Row[]>([empty()]);
  const [matter, setMatter] = useState("");
  const [court, setCourt] = useState("");
  const [filing, setFiling] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [counsel, setCounsel] = useState("Counsel");
  const [deadline, setDeadline] = useState("[date/time]");
  const [storageReady, setStorageReady] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const value = JSON.parse(stored);
        window.setTimeout(() => {
          setRows(Array.isArray(value.rows) && value.rows.length ? value.rows : [empty()]);
          setMatter(value.matter || ""); setCourt(value.court || ""); setFiling(value.filing || ""); setReviewer(value.reviewer || "");
          setDocumentText(value.documentText || ""); setCounsel(value.counsel || "Counsel"); setDeadline(value.deadline || "[date/time]");
          setSavedAt(value.savedAt || "");
          setStorageReady(true);
        }, 0);
        return;
      }
    } catch { window.setTimeout(() => setNotice("The previous tab session could not be restored."), 0); }
    window.setTimeout(() => setStorageReady(true), 0);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timestamp = new Date().toISOString();
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, matter, court, filing, reviewer, documentText, counsel, deadline, savedAt: timestamp }));
        setSavedAt(timestamp);
      } catch { setNotice("This browser could not save the local review session."); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [rows, matter, court, filing, reviewer, documentText, counsel, deadline, storageReady]);

  const material = useMemo(() => rows.filter((row) => row.item.trim()), [rows]);
  const counts = useMemo(() => ({
    unresolved: material.filter((row) => row.status === "unverified" || row.status === "checking").length,
    confirmed: material.filter((row) => row.status === "confirmed").length,
    resolved: material.filter((row) => row.status === "resolved").length,
    escalated: material.filter((row) => row.status === "escalated").length,
  }), [material]);
  const unresolved = material.filter((row) => row.status !== "resolved");
  const draft = `${counsel},\n\nWe are reviewing ${filing || "the filing"}${matter ? ` in ${matter}` : ""}. We have not been able to verify ${unresolved.length ? unresolved.map((row, index) => `${index + 1}) ${row.item}${row.location ? ` (${row.location})` : ""}`).join("; ") : "the cited language or proposition identified in our review"}.\n\nPlease identify the supporting source text or confirm whether a correction is needed by ${deadline}. We are not making assumptions about how any discrepancy arose. Our request is limited to resolving the authority issue before raising it with the Court.\n\nRegards,`;

  const update = (id: string, key: keyof Row, value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const scanText = () => {
    if (!documentText.trim()) { setNotice("Paste filing text or choose a plain-text file first."); return; }
    const candidates = extractCandidates(documentText);
    if (!candidates.length) { setNotice("No citation or quotation candidates were detected. Add an item manually; this extraction pass is intentionally conservative."); return; }
    setRows(candidates.map((candidate) => empty(candidate.text, candidate.type)));
    setNotice(`${candidates.length} candidate${candidates.length === 1 ? "" : "s"} extracted. Each still requires human source verification.`);
  };
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.type && file.type !== "text/plain" && !file.name.endsWith(".txt")) { setNotice("This release reads plain-text files only. Export a PDF or DOCX to .txt, or paste the relevant text."); return; }
    setDocumentText(await file.text()); setFiling((value) => value || file.name); setNotice(`${file.name} loaded locally. Select Extract candidates to continue.`);
  };
  const downloadCsv = () => {
    const columns = ["Matter", "Court", "Filing", "Reviewer", "Item", "Location", "Review label", "Source checked", "Source text", "Exists", "Quote exact", "Pincite correct", "Supports proposition", "Status", "Notes"];
    const lines = [columns.map(csvCell).join(","), ...material.map((row) => [matter, court, filing, reviewer, row.item, row.location, row.type, row.source, row.sourceText, row.exists, row.quote, row.pincite, row.supports, row.status, row.notes].map(csvCell).join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `filing-integrity-review-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("Current review ledger downloaded as CSV.");
  };
  const copyDraft = async () => { await navigator.clipboard.writeText(draft); setNotice("Meet-and-confer draft copied."); };
  const reset = () => { if (!window.confirm("Clear this tab's review session?")) return; sessionStorage.removeItem(STORAGE_KEY); setRows([empty()]); setMatter(""); setCourt(""); setFiling(""); setReviewer(""); setDocumentText(""); setSavedAt(""); setNotice("Tab review cleared."); };

  return <main className={styles.page}><div className={styles.wrap}>
    <header className={styles.hero}><div><span className={styles.eyebrow}>Local candidate extraction + human verification</span><h1>Filing integrity review</h1><p>Extract citation and quotation candidates from pasted text, then document what a reviewer verifies against the primary source. AI Vortex does not determine whether authority is valid or whether AI was used.</p></div><div className={styles.heroMeta}><span>{material.length} items</span><span>{counts.unresolved} unresolved</span><span>This tab only</span></div></header>
    <div className={styles.notice}><strong>Guardrail:</strong> Candidate extraction is not cite checking. A discrepancy is not proof that AI was used. Preserve the filing, inspect the primary source, describe only what can be demonstrated, and escalate proportionally.</div>
    {notice && <div className={styles.feedback} role="status">{notice}</div>}

    <section className={`${styles.panel} ${styles.intakePanel}`}>
      <div className={styles.panelHeading}><div><span className={styles.step}>1</span><h2>Set up the review</h2><p className={styles.panelIntro}>Do not enter privileged or confidential matter information. Draft state stays only in this browser tab and is removed when the tab closes.</p></div><span className={styles.saved}>{savedAt ? `Saved in tab ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not saved yet"}</span></div>
      <div className={styles.metadataGrid}><label className={styles.field}>Matter / project<input value={matter} onChange={(event) => setMatter(event.target.value)} placeholder="Matter name or internal reference" /></label><label className={styles.field}>Court / forum<input value={court} onChange={(event) => setCourt(event.target.value)} placeholder="Court, judge, or forum" /></label><label className={styles.field}>Filing / version<input value={filing} onChange={(event) => setFiling(event.target.value)} placeholder="Motion, brief, version, or date" /></label><label className={styles.field}>Reviewer<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Name or initials" /></label></div>
    </section>

    <section className={`${styles.panel} ${styles.extractPanel}`}>
      <div className={styles.panelHeading}><div><span className={styles.step}>2</span><h2>Extract candidates</h2><p className={styles.panelIntro}>Paste relevant text or load a .txt file. PDFs and DOCX files are not parsed in this release.</p></div><div className={styles.buttonRow}><input ref={fileRef} className={styles.visuallyHidden} type="file" accept=".txt,text/plain" onChange={readFile} /><button className={styles.secondary} onClick={() => fileRef.current?.click()}><Upload size={15} />Choose .txt</button><button className={styles.primary} onClick={scanText}><Search size={15} />Extract candidates</button></div></div>
      <label className={styles.field}>Filing text<textarea className={styles.documentText} value={documentText} onChange={(event) => setDocumentText(event.target.value)} placeholder="Paste the relevant filing text here. Candidate extraction runs entirely in this browser." /></label>
      <p className={styles.capabilityNote}><FileSearch size={15} /><span><strong>What extraction does:</strong> identifies reporter-style citations, docket-number patterns, and quotations of 30+ characters. <strong>What it does not do:</strong> retrieve authority, compare sources, validate pincites, or evaluate proposition support.</span></p>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><span className={styles.step}>3</span><h2>Verify each candidate</h2><p className={styles.panelIntro}>Record the source, exact language, four verification checks, disposition, and notes.</p></div><button className={styles.secondary} onClick={() => setRows((value) => [...value, empty()])}><Plus size={15} />Add manually</button></div>
      <div className={styles.statusSummary}><span><b>{counts.unresolved}</b> unresolved</span><span><b>{counts.confirmed}</b> confirmed</span><span><b>{counts.resolved}</b> resolved</span><span><b>{counts.escalated}</b> escalated</span></div>
      <div className={styles.reviewCards}>{rows.map((row, index) => <article className={styles.reviewCard} key={row.id}>
        <div className={styles.reviewCardHead}><div><span>Item {index + 1}</span><strong>{row.item || "Manual review item"}</strong></div><button className={styles.iconButton} aria-label={`Remove item ${index + 1}`} onClick={() => setRows((value) => value.length === 1 ? [empty()] : value.filter((item) => item.id !== row.id))}><Trash2 size={15} /></button></div>
        <div className={styles.reviewGrid}><label className={`${styles.field} ${styles.fieldWide}`}>Citation, quotation, or proposition<textarea value={row.item} onChange={(event) => update(row.id, "item", event.target.value)} placeholder="Paste the exact language under review" /></label><label className={styles.field}>Page / paragraph<input value={row.location} onChange={(event) => update(row.id, "location", event.target.value)} placeholder="Page 12, ¶ 4" /></label><label className={styles.field}>Review label<select value={row.type} onChange={(event) => update(row.id, "type", event.target.value)}><option value="unclear">Unclear</option><option value="citation_candidate">Citation candidate</option><option value="quote_candidate">Quotation candidate</option><option value="docket_candidate">Docket candidate</option><option value="nonexistent_authority">Authority not located</option><option value="quote_mismatch">Quote mismatch</option><option value="unsupported_proposition">Unsupported proposition</option><option value="bad_pincite">Pincite mismatch</option></select></label><label className={`${styles.field} ${styles.fieldWide}`}>Primary source checked<input value={row.source} onChange={(event) => update(row.id, "source", event.target.value)} placeholder="Reporter, docket URL, PDF, and page" /></label><label className={`${styles.field} ${styles.fieldWide}`}>Exact supporting source text<textarea value={row.sourceText} onChange={(event) => update(row.id, "sourceText", event.target.value)} placeholder="Paste the controlling source text or explain why none was located" /></label></div>
        <div className={styles.checkGrid}>{([['exists','Authority exists'],['quote','Quote exact'],['pincite','Pincite correct'],['supports','Supports proposition']] as Array<[keyof Row,string]>).map(([key,label]) => <label className={styles.field} key={key}>{label}<select value={String(row[key])} onChange={(event) => update(row.id, key, event.target.value)}><option value="unknown">Not checked</option><option value="yes">Yes</option><option value="no">No</option><option value="na">N/A</option></select></label>)}</div>
        <div className={styles.reviewFooter}><label className={styles.field}>Disposition<select value={row.status} onChange={(event) => update(row.id, "status", event.target.value)}><option value="unverified">Unverified</option><option value="checking">Checking</option><option value="confirmed">Confirmed discrepancy</option><option value="resolved">Resolved / corrected</option><option value="escalated">Escalated</option></select></label><label className={`${styles.field} ${styles.fieldGrow}`}>Reviewer notes<input value={row.notes} onChange={(event) => update(row.id, "notes", event.target.value)} placeholder="Decision, correction, exception, or next action" /></label>{row.item && <a className={styles.sourceLookup} href={`https://www.courtlistener.com/?q=${encodeURIComponent(row.item.slice(0, 180))}`} target="_blank" rel="noreferrer">Search CourtListener</a>}</div>
      </article>)}</div>
    </section>

    <div className={styles.grid}><section className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.step}>4</span><h2>Prepare a neutral request</h2></div><button className={styles.secondary} onClick={copyDraft}><Clipboard size={15} />Copy draft</button></div><div className={styles.fieldRow}><label className={styles.field}>Addressee<input value={counsel} onChange={(event) => setCounsel(event.target.value)} /></label><label className={styles.field}>Response deadline<input value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label></div><div className={styles.draft}>{draft}</div></section><aside><section className={styles.panel}><h2>Preserve → verify → resolve → escalate</h2><div className={styles.actionsList}><div className={styles.action}><strong>1. Preserve</strong><p>Save the filed document, source PDFs, timestamps, and side-by-side comparison.</p></div><div className={styles.action}><strong>2. Verify</strong><p>Confirm existence, exact quotation, pincite, and proposition support.</p></div><div className={styles.action}><strong>3. Resolve</strong><p>Request a correction for isolated or curable discrepancies.</p></div><div className={styles.action}><strong>4. Escalate</strong><p>Use a narrow notice, motion, or OSC request only with a clean record.</p></div></div><div className={styles.buttonStack}><button className={styles.primary} onClick={() => window.print()}><Printer size={15} />Print current review</button><button className={styles.secondary} onClick={downloadCsv} disabled={!material.length}><Download size={15} />Download ledger CSV</button><Link className={styles.secondary} href="/cases?q=fabricated%20quotes">Comparable public records</Link><button className={styles.textButton} onClick={reset}><RotateCcw size={14} />Clear local session</button></div></section></aside></div>
  </div></main>;
}
