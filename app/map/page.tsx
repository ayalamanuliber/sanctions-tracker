import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Globe2, Landmark, MapPin, ShieldAlert, SlidersHorizontal, Tags, UserRound } from "lucide-react";

import ResearchShell from "@/components/ResearchShell";
import shell from "@/components/ResearchShell.module.css";
import SanctionsMapV2 from "@/components/SanctionsMapV2";
import { COUNTRIES_TRACKED, LEGAL_RISK_CASES, US_CASES } from "@/lib/cases";
import { countryOptionLabel } from "@/lib/countries";
import { FILTER_COUNTS, optionLabel } from "@/lib/corpus-analytics";
import { publicUrl } from "@/lib/site";
import styles from "../workspace.module.css";

export const metadata: Metadata = { title: "Global Legal AI Risk Map | AI Vortex", description: "Explore source-linked legal AI risk records across countries and US states by judge, court, editorial impact, AI tool, and failure mode.", alternates: { canonical: publicUrl("/map") } };
type Params = Record<string,string|string[]|undefined>;
function val(p:Params,k:string){const v=p[k];return Array.isArray(v)?v[0]||"":v||"";}

export default async function MapPage({searchParams}:{searchParams?:Promise<Params>}) {
  const params=(await searchParams)||{};
  const states=(val(params,"states")||val(params,"state")).split(",").map(v=>v.trim().toUpperCase()).filter(Boolean);
  const country=val(params,"country")||(states.length?"US":"");
  const stateFilterUnavailable=Boolean(country&&country!=="US");
  const countryScopeCount=country?LEGAL_RISK_CASES.filter(item=>item.country===country).length:LEGAL_RISK_CASES.length;
  return <ResearchShell><main className={shell.main}>
    <div className={shell.breadcrumbs}><Link href="/">Home</Link><span>/</span><span>Map</span></div>
    <header className={shell.pageHead}><div><span className={shell.eyebrow}>Geographic research</span><h1>Global legal AI risk map</h1><p>Move from worldwide country coverage into US state-level clusters, then inspect the synchronized record list. Cluster size represents corpus volume; color represents the highest recorded editorial-impact classification. Neither is an incidence rate.</p></div><div className={shell.headActions}><Link className={shell.buttonSecondary} href={country?`/cases?country=${encodeURIComponent(country)}`:"/cases"}>Case directory</Link><Link className={shell.buttonSecondary} href="/countries"><Globe2 size={15}/>Browse countries</Link><Link className={shell.buttonSecondary} href="/sources">Methodology</Link></div></header>
    <form className={`${shell.card} ${styles.filterBar}`} method="get">
      <div className={styles.field}><label htmlFor="country"><Globe2 aria-hidden="true"/>Country</label><select id="country" name="country" defaultValue={country}><option value="">🌐 All {COUNTRIES_TRACKED} countries ({LEGAL_RISK_CASES.length.toLocaleString()})</option>{FILTER_COUNTS.countries.map(item=><option key={item.value} value={item.value}>{countryOptionLabel(item.value,item.count)}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="states"><MapPin aria-hidden="true"/>US state</label><select id="states" name="states" defaultValue={states[0]||""} disabled={stateFilterUnavailable}><option value="">{stateFilterUnavailable?"Available for United States records":`All states (${US_CASES.length.toLocaleString()})`}</option>{FILTER_COUNTS.states.map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="severity"><ShieldAlert aria-hidden="true"/>Editorial impact</label><select id="severity" name="severity" defaultValue={val(params,"severity")}><option value="all">All impact levels ({countryScopeCount.toLocaleString()})</option>{FILTER_COUNTS.severities.map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={`${styles.field} ${styles.courtField}`}><label htmlFor="court"><Landmark aria-hidden="true"/>Court</label><input id="court" name="court" defaultValue={val(params,"court")} placeholder="Type a court, e.g. D.N.J." list="map-court-options" autoComplete="off" /><datalist id="map-court-options">{FILTER_COUNTS.courts.map(item=><option key={item.value} value={item.value}>{item.count} records</option>)}</datalist></div>
      <div className={styles.field}><label htmlFor="judge"><UserRound aria-hidden="true"/>Judge / decision-maker</label><input id="judge" name="judge" defaultValue={val(params,"judge")} placeholder="Type a recorded name" list="map-judge-options" autoComplete="off"/><datalist id="map-judge-options">{FILTER_COUNTS.judges.filter(item=>item.value!=="Judge not recorded").map(item=><option key={item.value} value={item.value}>{item.count} records</option>)}</datalist></div>
      <div className={styles.field}><label htmlFor="tool"><Bot aria-hidden="true"/>AI tool</label><select id="tool" name="tool" defaultValue={val(params,"tool")}><option value="">All recorded tools</option>{FILTER_COUNTS.tools.slice(0,40).map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="failure"><Tags aria-hidden="true"/>Failure mode</label><select id="failure" name="failure" defaultValue={val(params,"failure")}><option value="">All modes</option>{FILTER_COUNTS.failures.map(item=><option key={item.value} value={item.value}>{optionLabel(item)}</option>)}</select></div>
      <div className={styles.filterActions}><button className={styles.apply} type="submit"><SlidersHorizontal size={15}/> Apply filters</button>{Object.values(params).some(Boolean) && <Link href="/map">Clear</Link>}</div>
    </form>
    <section className={styles.mapFrame}><SanctionsMapV2 initialCountry={country} initialStates={states} initialSeverity={val(params,"severity")||"all"} initialTool={val(params,"tool")} initialFailure={val(params,"failure")} initialCourt={val(params,"court")} initialJudge={val(params,"judge")} showControls showSideRail showExportLinks /></section>
  </main></ResearchShell>;
}
