"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, Banknote, Landmark } from "lucide-react";
import * as d3 from "d3-geo";
import * as topojson from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopologyRaw from "us-atlas/states-10m.json";

import { US_CASES, formatCaseDate, type LegalRiskCase } from "@/lib/cases";

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};
const FIPS_TO_STATE: Record<string,string> = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"};

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };
const topology = statesTopologyRaw as unknown as Topology;
const collection = topojson.feature(topology, topology.objects.states as GeometryCollection) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const features = collection.features as Feature[];
const projection = d3.geoAlbersUsa().scale(1220).translate([480,300]);
const path = d3.geoPath(projection);

const severityRank: Record<string,number> = {"career-ending":4,high:3,medium:2,low:1};
const severityColor: Record<string,string> = {"career-ending":"#dc3a31",high:"#dc3a31",medium:"#eea324",low:"#3479ce"};

interface Props {
  onStateClick?: (stateCode: string) => void;
  onStateChange?: (stateCode: string, cases: LegalRiskCase[]) => void;
  initialStates?: string[];
  initialSeverity?: string;
  initialTool?: string;
  initialFailure?: string;
  initialCourt?: string;
  initialAudience?: string;
  embedded?: boolean;
  showIntro?: boolean;
  showControls?: boolean;
  showSideRail?: boolean;
  showExportLinks?: boolean;
  dataMode?: "cases" | "severity";
}

function matches(value: string | null | undefined, query?: string) {
  return !query || (value || "").toLowerCase().includes(query.toLowerCase());
}

export default function SanctionsMapV2({
  onStateClick, onStateChange, initialStates = [], initialSeverity = "all", initialTool, initialFailure, initialCourt,
  initialAudience = "legal professional", embedded = false, showControls = true, showSideRail = true,
  showExportLinks = false, dataMode = "cases",
}: Props) {
  const initialFocus = initialStates.length === 1 ? initialStates[0].toUpperCase() : null;
  const [focusState,setFocusState] = useState<string|null>(initialFocus);
  const [severity,setSeverity] = useState(initialSeverity || "all");
  const [sort,setSort] = useState<"date-desc"|"date-asc"|"severity-desc"|"severity-asc"|"amount-desc"|"amount-asc">("date-desc");
  const [limit,setLimit] = useState(18);

  const baseCases = useMemo(() => US_CASES.filter((item) => {
    if (initialStates.length && !initialStates.map((s) => s.toUpperCase()).includes(item.state)) return false;
    if (!matches(`${item.ai_tool_used} ${item.summary}`,initialTool)) return false;
    if (initialFailure && !item.tags.includes(initialFailure)) return false;
    if (!matches(item.court,initialCourt)) return false;
    return true;
  }),[initialStates,initialTool,initialFailure,initialCourt]);
  const cases = useMemo(() => severity === "all" ? baseCases : baseCases.filter((item) => item.severity === severity), [baseCases,severity]);
  const severityCounts = useMemo(() => baseCases.reduce<Record<string,number>>((counts,item) => { counts[item.severity]=(counts[item.severity]||0)+1; return counts; },{}),[baseCases]);

  const stateGroups = useMemo(() => {
    const groups = new Map<string,{state:string;cases:LegalRiskCase[];severity:string;amount:number}>();
    for (const item of cases) {
      const current = groups.get(item.state) || {state:item.state,cases:[],severity:"low",amount:0};
      current.cases.push(item);
      current.amount += item.amount || 0;
      if (severityRank[item.severity] > severityRank[current.severity]) current.severity = item.severity;
      groups.set(item.state,current);
    }
    return groups;
  },[cases]);

  const rows = useMemo(() => {
    const filtered = focusState ? cases.filter((item) => item.state === focusState) : cases;
    return [...filtered].sort((a,b) => {
      if (sort === "severity-desc") return severityRank[b.severity] - severityRank[a.severity] || b.date.localeCompare(a.date);
      if (sort === "severity-asc") return severityRank[a.severity] - severityRank[b.severity] || a.date.localeCompare(b.date);
      if (sort === "amount-desc" || sort === "amount-asc") {
        if (Boolean(a.amount) !== Boolean(b.amount)) return a.amount ? -1 : 1;
        if (sort === "amount-asc") return (a.amount || 0) - (b.amount || 0) || a.date.localeCompare(b.date);
        return (b.amount || 0) - (a.amount || 0) || b.date.localeCompare(a.date);
      }
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
  },[cases,focusState,sort]);

  const selectState = (code: string|null) => {
    setFocusState(code); setLimit(18);
    onStateClick?.(code || "");
    onStateChange?.(code || "", code ? cases.filter((item) => item.state === code) : []);
    if (!embedded && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (code) url.searchParams.set("states",code); else url.searchParams.delete("states");
      window.history.replaceState({},"",url);
    }
  };

  return <div className={`smv2-root ${embedded ? "is-embedded" : ""}`}>
    <div className="smv2-card">
      <div className="smv2-head">
        <div className="smv2-head-left"><strong>{focusState ? `${STATE_NAMES[focusState]} evidence` : "United States evidence map"}</strong><small>{cases.length.toLocaleString()} matched records · {stateGroups.size} jurisdictions · state clusters prevent overlapping case pins</small></div>
        {showControls && <div className="smv2-chips" aria-label="Editorial impact filters">{["all","career-ending","high","medium","low"].map((value) => <button key={value} className={`smv2-chip ${severity === value ? "active" : ""}`} aria-pressed={severity === value} onClick={() => {setSeverity(value);setLimit(18);}}><span>{value === "career-ending" ? "Career" : value[0].toUpperCase()+value.slice(1)}</span><b>{value === "all" ? baseCases.length : severityCounts[value] || 0}</b></button>)}</div>}
      </div>
      {showExportLinks && <div className="smv2-export-links"><Link href={focusState ? `/dashboard?state=${focusState}&audience=${encodeURIComponent(initialAudience)}` : `/dashboard?audience=${encodeURIComponent(initialAudience)}`}>Dashboard</Link><Link href={focusState ? `/sources?state=${focusState}` : "/sources"}>Sources</Link><Link href={focusState ? `/cases?country=US&state=${focusState}` : "/cases?country=US"}>All matching cases</Link></div>}
      <div className={`smv2-body ${showSideRail ? "" : "no-rail"}`}>
        <div className="smv2-stage">
          <svg viewBox="0 0 960 600" role="group" aria-labelledby="map-title map-desc">
            <title id="map-title">United States legal AI risk matters by state</title>
            <desc id="map-desc">Select a state cluster to filter the synchronized case list. Cluster size represents tracked record count and color represents the highest editorial impact classification in that state.</desc>
            <g>{features.map((feature) => {
              const code = FIPS_TO_STATE[String(feature.id).padStart(2,"0")];
              const group = code ? stateGroups.get(code) : undefined;
              return <path
                key={String(feature.id)}
                d={path(feature) || ""}
                className={`smv2-state ${group ? `has-cases sev-${group.severity}` : ""} ${focusState === code ? "selected" : ""}`}
                role={group ? "button" : undefined}
                tabIndex={group ? 0 : undefined}
                aria-label={group ? `${STATE_NAMES[code]}, ${group.cases.length} tracked records` : undefined}
                onClick={group ? () => selectState(code) : undefined}
                onKeyDown={group ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectState(code); } } : undefined}
              />;
            })}</g>
            <g>{features.map((feature) => {
              const code = FIPS_TO_STATE[String(feature.id).padStart(2,"0")];
              const group = code ? stateGroups.get(code) : undefined;
              if (!code || !group) return null;
              const [rawX,rawY] = path.centroid(feature);
              if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
              // Stabilize server/client SVG output across JS engines.
              const x = Math.round(rawX * 1000) / 1000;
              const y = Math.round(rawY * 1000) / 1000;
              const radius = Math.min(27,8 + Math.sqrt(group.cases.length) * 2.2);
              const label = `${STATE_NAMES[code]}, ${group.cases.length} tracked records, highest editorial impact classification ${group.severity}`;
              return <g key={code} transform={`translate(${x},${y})`} className={`smv2-cluster ${focusState && focusState !== code ? "dim" : ""}`} role="button" tabIndex={0} aria-pressed={focusState === code} aria-label={label} onClick={() => selectState(code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectState(code); } }}>
                <circle r={radius} fill={severityColor[group.severity]} /><circle r={Math.max(4,radius-4)} /><text textAnchor="middle" dominantBaseline="central">{group.cases.length}</text><title>{label}</title>
              </g>;
            })}</g>
          </svg>
          {!embedded && <div className="smv2-map-note">{focusState ? <button onClick={() => selectState(null)}>← Return to national view</button> : <span>Select a state cluster to inspect its matters</span>}<span>Mode: {dataMode === "severity" ? "highest editorial impact" : "matter count"}</span></div>}
        </div>
        {showSideRail && <aside className="smv2-rail" aria-label="Map results">
          <div className="smv2-rail-heading"><div><strong>{focusState ? STATE_NAMES[focusState] : "All matching records"}</strong><small>{rows.length.toLocaleString()} results</small></div>{focusState && <button onClick={() => selectState(null)} aria-label="Clear state selection">×</button>}</div>
          <div className="smv2-sort"><label htmlFor="map-result-sort"><ArrowDownUp size={12} /> Sort results</label><select id="map-result-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="date-desc">Newest decision</option><option value="date-asc">Oldest decision</option><option value="severity-desc">Highest impact</option><option value="severity-asc">Lowest impact</option><option value="amount-desc">Largest known amount</option><option value="amount-asc">Smallest known amount</option></select></div>
          <div className="smv2-case-list">{rows.slice(0,limit).map((item) => <Link className="smv2-case-row" key={item.slug} href={`/cases/${item.slug}`}>
            <span className="smv2-row-main"><strong>{item.case_name}</strong><small><Landmark aria-hidden="true" />{item.court} · {formatCaseDate(item.date)}</small></span><span className={`smv2-row-sev sev-${item.severity}`}>{item.severity.replace("-"," ")}</span><span className="smv2-row-outcome">{item.amount ? <><Banknote aria-hidden="true" />{item.amount_display}</> : item.outcome || "Review record"}</span>
          </Link>)}</div>
          {limit < rows.length && <button className="smv2-load" onClick={() => setLimit((value) => value + 18)}>Load 18 more</button>}
          <Link className="smv2-all-link" href={focusState ? `/cases?country=US&state=${focusState}` : "/cases?country=US"}>Open full filtered case directory →</Link>
        </aside>}
      </div>
      <div className="smv2-legend"><strong>Map color</strong><span><i style={{background:"#b73b54"}} />Career impact</span><span><i style={{background:"#d65a45"}} />High</span><span><i style={{background:"#d99a32"}} />Medium</span><span><i style={{background:"#2877b9"}} />Low</span><span>Cluster size = tracked record count</span></div>
    </div>
  </div>;
}
