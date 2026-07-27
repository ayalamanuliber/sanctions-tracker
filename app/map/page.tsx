import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import SanctionsMapV2 from "@/components/SanctionsMapV2";
import { US_CASES } from "@/lib/cases";
import { FILTER_COUNTS, optionLabel } from "@/lib/corpus-analytics";
import { publicUrl } from "@/lib/site";
import styles from "../workspace.module.css";

export const metadata: Metadata = { title: "Legal AI Risk Map | AI Vortex", description: "Explore source-linked United States legal AI risk records by state, editorial impact, court, tool, and failure mode.", alternates: { canonical: publicUrl("/map") } };
type Params = Record<string,string|string[]|undefined>;
function val(p:Params,k:string){const v=p[k];return Array.isArray(v)?v[0]||"":v||"";}

export default async function MapPage({searchParams}:{searchParams?:Promise<Params>}) {
  const params=(await searchParams)||{};
  const states=(val(params,"states")||val(params,"state")).split(",").map(v=>v.trim().toUpperCase()).filter(Boolean);
  return <ResearchShell><main className={shell.main}>
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>Map</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Geographic research</span><h1>Legal AI risk map</h1><p>Explore state-level clusters, then drill into a synchronized record list. Cluster size represents corpus volume; color represents the highest editorial-impact classification in that state. Neither is an incidence rate.</p></div><div className={shell.headActions}><Link className={shell.buttonSecondary} href="/cases?country=US">Case directory</Link><Link className={shell.buttonSecondary} href="/sources">Methodology</Link></div></header>
    <form className={`${shell.card} ${styles.filterBar}`} method="get">
      <div className={styles.field}><label htmlFor="states">State</label><select id="states" name="states" defaultValue={states[0]||""}><option value="">All states ({US_CASES.length.toLocaleString()})</option>{FILTER_COUNTS.states.map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="severity">Severity</label><select id="severity" name="severity" defaultValue={val(params,"severity")}><option value="all">All levels ({US_CASES.length.toLocaleString()})</option>{FILTER_COUNTS.severities.map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={`${styles.field} ${styles.courtField}`}><label htmlFor="court">Court</label><input id="court" name="court" defaultValue={val(params,"court")} placeholder="Type a court, e.g. D.N.J." list="map-court-options" autoComplete="off" /><datalist id="map-court-options">{FILTER_COUNTS.courts.slice(0,80).map(item=><option key={item.value} value={item.value}>{item.count} records</option>)}</datalist></div>
      <div className={styles.field}><label htmlFor="tool">AI tool</label><select id="tool" name="tool" defaultValue={val(params,"tool")}><option value="">All recorded tools</option>{FILTER_COUNTS.tools.slice(0,40).map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="failure">Failure mode</label><select id="failure" name="failure" defaultValue={val(params,"failure")}><option value="">All modes</option>{FILTER_COUNTS.failures.map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={styles.filterActions}><button className={styles.apply} type="submit"><SlidersHorizontal size={15}/> Apply filters</button>{Object.values(params).some(Boolean) && <Link href="/map">Clear</Link>}</div>
    </form>
    <section className={styles.mapFrame}><SanctionsMapV2 initialStates={states} initialSeverity={val(params,"severity")||"all"} initialTool={val(params,"tool")} initialFailure={val(params,"failure")} initialCourt={val(params,"court")} showControls showSideRail showExportLinks /></section>
  </main></ResearchShell>;
}
