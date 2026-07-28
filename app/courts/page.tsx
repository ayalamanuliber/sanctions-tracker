import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import { LEGAL_RISK_CASES, formatCaseDate } from "@/lib/cases";
import { matchesCourt } from "@/lib/filtering";
import { entityHref, getEntities } from "@/lib/entity-pages";
import { publicUrl } from "@/lib/site";
import styles from "../workspace.module.css";

export const metadata: Metadata = {
  title: "Courts in the Legal AI Risk Record | AI Vortex",
  description: "Browse courts represented in the AI Vortex public legal AI risk corpus.",
  alternates: { canonical: publicUrl("/courts") },
};

type CourtSummary = {
  name: string;
  records: number;
  sourceLinked: number;
  allegationOnly: number;
  latest: string;
};

type Params = Record<string, string | string[] | undefined>;
function value(params: Params, key: string) { const item=params[key]; return Array.isArray(item)?item[0]||"":item||""; }
const COURT_ENTITIES = new Map(getEntities("court").map((entity) => [entity.label, entity]));
function courtHref(name: string) {
  const entity = COURT_ENTITIES.get(name);
  return entity ? entityHref("court", entity.slug) : `/cases?court=${encodeURIComponent(name)}`;
}

export default async function CourtsPage({searchParams}:{searchParams?:Promise<Params>}) {
  const params=(await searchParams)||{};
  const query=value(params,"q").trim();
  const requestedPage=Math.max(1,Number.parseInt(value(params,"page"),10)||1);
  const courts = new Map<string, CourtSummary>();
  for (const item of LEGAL_RISK_CASES) {
    const name = item.court || "Court not recorded";
    const current = courts.get(name) || { name, records: 0, sourceLinked: 0, allegationOnly: 0, latest: "" };
    current.records += 1;
    current.sourceLinked += item.source_url ? 1 : 0;
    current.allegationOnly += item.alleged ? 1 : 0;
    if (item.date > current.latest) current.latest = item.date;
    courts.set(name, current);
  }
  const ranked = [...courts.values()].sort((a, b) => b.records - a.records || a.name.localeCompare(b.name));
  const filtered=query?ranked.filter((court)=>matchesCourt(court.name,query)||court.name.toLowerCase().includes(query.toLowerCase())):ranked;
  const pageSize=50;
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const page=Math.min(requestedPage,pageCount);
  const visible=filtered.slice((page-1)*pageSize,page*pageSize);
  const pageHref=(next:number)=>`/courts?${new URLSearchParams({...(query?{q:query}:{}),page:String(next)})}`;
  const topCourts=ranked.slice(0,10);
  const maxCourtCount=Math.max(...topCourts.map((court)=>court.records),1);

  return <ResearchShell><main className={shell.main}>
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>Courts</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Corpus coverage</span><h1>Courts represented in the public record</h1><p>Browse recorded proceedings by court. Counts show corpus coverage, not a court&apos;s incidence rate, use of AI, or relative risk.</p></div><div className={shell.headActions}><Link className={shell.button} href="/cases">Search records</Link><Link className={shell.buttonSecondary} href="/judges">Browse recorded judges</Link><Link className={shell.buttonSecondary} href="/map">Open map</Link></div></header>
    <div className={styles.metrics}>{[["Courts represented", ranked.length.toLocaleString()], ["Corpus records", LEGAL_RISK_CASES.length.toLocaleString()], ["With source link", LEGAL_RISK_CASES.filter((item) => item.source_url).length.toLocaleString()], ["Recorded decision-makers", getEntities("judge").length.toLocaleString()]].map(([label, value]) => <div className={`${shell.card} ${styles.metric}`} key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <section className={`${shell.card} ${styles.section}`}><div className={styles.sectionHeading}><div><span>Comparative corpus view</span><h2>Most represented courts</h2><p>Use this ranking to understand dataset concentration before drawing conclusions from a court-specific result set.</p></div><Link href="/analytics">Open full analytics</Link></div><div className={styles.rankingBars}>{topCourts.map((court,index)=><Link href={courtHref(court.name)} className={styles.rankingRow} key={court.name}><span className={styles.rank}>{String(index+1).padStart(2,"0")}</span><div><strong>{court.name}</strong><span>{court.sourceLinked}/{court.records} source linked · latest {formatCaseDate(court.latest)}</span><i style={{width:`${Math.max(3,court.records/maxCourtCount*100)}%`}} /></div><b>{court.records}</b></Link>)}</div><p className={styles.denominator}>Denominator: {LEGAL_RISK_CASES.length.toLocaleString()} tracked public matters. A higher count can reflect court volume, reporting, source availability, or collection coverage.</p></section>
    <section className={`${shell.card} ${styles.section}`}><h2>Find a court</h2><p>Search common abbreviations such as D.N.J., S.D.N.Y., or a recorded court name.</p><form className={styles.directorySearch} method="get"><div><Search size={16}/><input aria-label="Search courts" name="q" defaultValue={query} placeholder="Court name or abbreviation"/></div><button><Search size={15}/> Search courts</button></form></section>
    <section className={`${shell.card} ${styles.section}`}><h2>{query?`${filtered.length} courts matching “${query}”`:"Courts by tracked records"}</h2><p>Use a court row to open its exact corpus view and source-linked record list. Allegation-only records remain separately identified in case results.</p><div className={styles.sourceTypes}>{visible.map((court) => <Link className={styles.sourceType} href={courtHref(court.name)} key={court.name}><strong>{court.name}</strong><span>{court.records} records · {court.sourceLinked} linked · latest {formatCaseDate(court.latest)}</span></Link>)}</div>{visible.length===0&&<div className={styles.warning}>No recorded court matched this search. Try the full court name or a broader jurisdiction.</div>}<nav className={styles.pagination} aria-label="Court result pages"><Link aria-disabled={page===1} href={pageHref(Math.max(1,page-1))}>Previous</Link><span>Page {page} of {pageCount}</span><Link aria-disabled={page===pageCount} href={pageHref(Math.min(pageCount,page+1))}>Next</Link></nav></section>
  </main></ResearchShell>;
}
