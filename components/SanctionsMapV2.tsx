"use client";

import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ArrowDownUp,
  Banknote,
  Globe2,
  Landmark,
  LocateFixed,
  Minus,
  Plus,
} from "lucide-react";
import * as d3 from "d3-geo";
import * as topojson from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countriesTopologyRaw from "world-atlas/countries-110m.json";
import statesTopologyRaw from "us-atlas/states-10m.json";

import { LEGAL_RISK_CASES, formatCaseDate, type LegalRiskCase } from "@/lib/cases";
import {
  countryDisplayName,
  countryFlag,
  countryNumericCode,
} from "@/lib/countries";

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};
const FIPS_TO_STATE: Record<string,string> = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"};

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };
type MapGroup = { cases: LegalRiskCase[]; severity: string; amount: number };
type WorldView = { scale: number; x: number; y: number };

const statesTopology = statesTopologyRaw as unknown as Topology;
const statesCollection = topojson.feature(statesTopology, statesTopology.objects.states as GeometryCollection) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const stateFeatures = statesCollection.features as Feature[];
const stateProjection = d3.geoAlbersUsa().scale(1220).translate([480,300]);
const statePath = d3.geoPath(stateProjection);

const countriesTopology = countriesTopologyRaw as unknown as Topology;
const countriesCollection = topojson.feature(countriesTopology, countriesTopology.objects.countries as GeometryCollection) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = countriesCollection.features as Feature[];
const worldProjection = d3.geoNaturalEarth1().scale(154).translate([480,270]);
const worldPath = d3.geoPath(worldProjection);

const severityRank: Record<string,number> = {"career-ending":4,high:3,medium:2,low:1};
const severityColor: Record<string,string> = {"career-ending":"#dc3a31",high:"#dc3a31",medium:"#eea324",low:"#3479ce"};
const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
const WORLD_MIN_SCALE = 1;
const WORLD_MAX_SCALE = 6;

interface Props {
  onStateClick?: (stateCode: string) => void;
  onStateChange?: (stateCode: string, cases: LegalRiskCase[]) => void;
  initialCountry?: string;
  initialStates?: string[];
  initialSeverity?: string;
  initialTool?: string;
  initialFailure?: string;
  initialCourt?: string;
  initialJudge?: string;
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

function addGroup(groups: Map<string,MapGroup>, key: string, item: LegalRiskCase) {
  const current = groups.get(key) || {cases:[],severity:"low",amount:0};
  current.cases.push(item);
  current.amount += item.amount || 0;
  if (severityRank[item.severity] > severityRank[current.severity]) current.severity = item.severity;
  groups.set(key,current);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function constrainWorldView(view: WorldView): WorldView {
  const scale = clamp(view.scale, WORLD_MIN_SCALE, WORLD_MAX_SCALE);
  return {
    scale,
    x: clamp(view.x, WORLD_WIDTH * (1 - scale), 0),
    y: clamp(view.y, WORLD_HEIGHT * (1 - scale), 0),
  };
}

export default function SanctionsMapV2({
  onStateClick,
  onStateChange,
  initialCountry = "",
  initialStates = [],
  initialSeverity = "all",
  initialTool,
  initialFailure,
  initialCourt,
  initialJudge,
  initialAudience = "legal professional",
  embedded = false,
  showControls = true,
  showSideRail = true,
  showExportLinks = false,
  dataMode = "cases",
}: Props) {
  const selectedCountry = initialCountry || (initialStates.length ? "US" : "");
  const isUnitedStates = selectedCountry === "US";
  const initialFocus = isUnitedStates && initialStates.length === 1 ? initialStates[0].toUpperCase() : null;
  const [focusState,setFocusState] = useState<string|null>(initialFocus);
  const [severity,setSeverity] = useState(initialSeverity || "all");
  const [sort,setSort] = useState<"date-desc"|"date-asc"|"severity-desc"|"severity-asc"|"amount-desc"|"amount-asc">("date-desc");
  const [limit,setLimit] = useState(18);
  const [worldView,setWorldView] = useState<WorldView>({scale:1,x:0,y:0});
  const [worldDragging,setWorldDragging] = useState(false);
  const worldDrag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressWorldClick = useRef(false);

  const baseCases = useMemo(() => LEGAL_RISK_CASES.filter((item) => {
    if (selectedCountry && item.country !== selectedCountry) return false;
    if (isUnitedStates && initialStates.length && !initialStates.map((state) => state.toUpperCase()).includes(item.state)) return false;
    if (!matches(`${item.ai_tool_used} ${item.summary}`,initialTool)) return false;
    if (initialFailure && !item.tags.includes(initialFailure)) return false;
    if (!matches(item.court,initialCourt)) return false;
    if (!matches(item.judge,initialJudge)) return false;
    return true;
  }),[selectedCountry,isUnitedStates,initialStates,initialTool,initialFailure,initialCourt,initialJudge]);

  const cases = useMemo(() => severity === "all" ? baseCases : baseCases.filter((item) => item.severity === severity), [baseCases,severity]);
  const severityCounts = useMemo(() => baseCases.reduce<Record<string,number>>((counts,item) => {
    counts[item.severity]=(counts[item.severity]||0)+1;
    return counts;
  },{}),[baseCases]);

  const stateGroups = useMemo(() => {
    const groups = new Map<string,MapGroup>();
    for (const item of cases) if (item.state) addGroup(groups,item.state, item);
    return groups;
  },[cases]);

  const countryGroups = useMemo(() => {
    const groups = new Map<string,MapGroup & {country:string}>();
    for (const item of cases) {
      const numericCode = countryNumericCode(item.country);
      if (!numericCode) continue;
      const current = groups.get(numericCode) || {country:item.country,cases:[],severity:"low",amount:0};
      current.cases.push(item);
      current.amount += item.amount || 0;
      if (severityRank[item.severity] > severityRank[current.severity]) current.severity = item.severity;
      groups.set(numericCode,current);
    }
    return groups;
  },[cases]);

  const rows = useMemo(() => {
    const filtered = isUnitedStates && focusState ? cases.filter((item) => item.state === focusState) : cases;
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
  },[cases,isUnitedStates,focusState,sort]);

  const filteredDirectoryHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCountry) params.set("country",selectedCountry);
    if (isUnitedStates && focusState) params.set("state",focusState);
    if (initialCourt) params.set("court",initialCourt);
    if (initialJudge) params.set("judge",initialJudge);
    if (initialTool) params.set("tool",initialTool);
    if (initialFailure) params.set("failure",initialFailure);
    if (severity !== "all") params.set("severity",severity);
    const query = params.toString();
    return query ? `/cases?${query}` : "/cases";
  },[selectedCountry,isUnitedStates,focusState,initialCourt,initialJudge,initialTool,initialFailure,severity]);

  const selectState = (code: string|null) => {
    setFocusState(code);
    setLimit(18);
    onStateClick?.(code || "");
    onStateChange?.(code || "", code ? cases.filter((item) => item.state === code) : []);
    if (!embedded && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("country","US");
      if (code) url.searchParams.set("states",code);
      else {
        url.searchParams.delete("states");
        url.searchParams.delete("state");
      }
      window.history.replaceState({},"",url);
    }
  };

  const selectCountry = (country: string|null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (country) url.searchParams.set("country",country);
    else url.searchParams.delete("country");
    url.searchParams.delete("states");
    url.searchParams.delete("state");
    window.location.assign(url.toString());
  };

  const activateCountry = (country: string) => {
    if (suppressWorldClick.current) return;
    selectCountry(country);
  };

  const zoomWorldAt = (nextScale: number, anchorX = WORLD_WIDTH / 2, anchorY = WORLD_HEIGHT / 2) => {
    setWorldView((current) => {
      const scale = clamp(nextScale, WORLD_MIN_SCALE, WORLD_MAX_SCALE);
      if (scale === current.scale) return current;
      const ratio = scale / current.scale;
      return constrainWorldView({
        scale,
        x: anchorX - (anchorX - current.x) * ratio,
        y: anchorY - (anchorY - current.y) * ratio,
      });
    });
  };

  const handleWorldWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const anchorX = ((event.clientX - bounds.left) / bounds.width) * WORLD_WIDTH;
    const anchorY = ((event.clientY - bounds.top) / bounds.height) * WORLD_HEIGHT;
    const factor = event.deltaY < 0 ? 1.22 : 1 / 1.22;
    zoomWorldAt(worldView.scale * factor, anchorX, anchorY);
  };

  const handleWorldPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    worldDrag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: worldView.x,
      y: worldView.y,
      moved: false,
    };
    setWorldDragging(true);
  };

  const handleWorldPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = worldDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaClientX = event.clientX - drag.clientX;
    const deltaClientY = event.clientY - drag.clientY;
    if (!drag.moved && Math.hypot(deltaClientX,deltaClientY) > 4) {
      drag.moved = true;
      suppressWorldClick.current = true;
    }
    if (!drag.moved) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setWorldView((current) => constrainWorldView({
      ...current,
      x: drag.x + (deltaClientX / bounds.width) * WORLD_WIDTH,
      y: drag.y + (deltaClientY / bounds.height) * WORLD_HEIGHT,
    }));
  };

  const finishWorldPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = worldDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    worldDrag.current = null;
    setWorldDragging(false);
    if (drag.moved && typeof window !== "undefined") {
      window.setTimeout(() => {
        suppressWorldClick.current = false;
      },0);
    }
  };

  const resetWorldView = () => {
    setWorldView({scale:1,x:0,y:0});
    suppressWorldClick.current = false;
  };

  const viewTitle = isUnitedStates
    ? (focusState ? `${STATE_NAMES[focusState]} evidence` : "United States evidence map")
    : selectedCountry
      ? `${countryFlag(selectedCountry)} ${countryDisplayName(selectedCountry)} evidence`
      : "Global evidence map";
  const coverageLabel = isUnitedStates
    ? `${stateGroups.size} state jurisdictions`
    : `${countryGroups.size} mapped ${countryGroups.size === 1 ? "country" : "countries"}`;

  return <div className={`smv2-root ${embedded ? "is-embedded" : ""}`}>
    <div className="smv2-card">
      <div className="smv2-head">
        <div className="smv2-head-left">
          <strong>{viewTitle}</strong>
          <small>{cases.length.toLocaleString()} matched records · {coverageLabel} · geographic clusters synchronize the case list</small>
        </div>
        <div className="smv2-head-actions">
          {!embedded && (focusState ? (
            <button className="smv2-back" onClick={() => selectState(null)}>← United States</button>
          ) : selectedCountry ? (
            <button className="smv2-back" onClick={() => selectCountry(null)}><Globe2 aria-hidden="true" />Global map</button>
          ) : null)}
          {showControls && <div className="smv2-chips" aria-label="Editorial impact filters">{["all","career-ending","high","medium","low"].map((value) => <button key={value} className={`smv2-chip ${severity === value ? "active" : ""}`} aria-pressed={severity === value} onClick={() => {setSeverity(value);setLimit(18);}}><span>{value === "career-ending" ? "Career" : value[0].toUpperCase()+value.slice(1)}</span><b>{value === "all" ? baseCases.length : severityCounts[value] || 0}</b></button>)}</div>}
        </div>
      </div>
      {showExportLinks && <div className="smv2-export-links"><Link href={focusState ? `/dashboard?state=${focusState}&audience=${encodeURIComponent(initialAudience)}` : `/dashboard?audience=${encodeURIComponent(initialAudience)}`}>Dashboard</Link><Link href={focusState ? `/sources?state=${focusState}` : "/sources"}>Sources</Link><Link href={filteredDirectoryHref}>All matching cases</Link></div>}
      <div className={`smv2-body ${showSideRail ? "" : "no-rail"}`}>
        <div className={`smv2-stage ${isUnitedStates ? "" : "smv2-world-stage"}`}>
          {isUnitedStates ? <svg viewBox="0 0 960 600" role="group" aria-labelledby="state-map-title state-map-desc">
            <title id="state-map-title">United States legal AI risk matters by state</title>
            <desc id="state-map-desc">Select a state cluster to filter the synchronized case list. Cluster size represents tracked record count and color represents the highest editorial impact classification in that state.</desc>
            <g>{stateFeatures.map((feature) => {
              const code = FIPS_TO_STATE[String(feature.id).padStart(2,"0")];
              const group = code ? stateGroups.get(code) : undefined;
              return <path key={String(feature.id)} d={statePath(feature) || ""} className={`smv2-state ${group ? `has-cases sev-${group.severity}` : ""} ${focusState === code ? "selected" : ""}`} role={group ? "button" : undefined} tabIndex={group ? 0 : undefined} aria-label={group ? `${STATE_NAMES[code]}, ${group.cases.length} tracked records` : undefined} onClick={group ? () => selectState(code) : undefined} onKeyDown={group ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectState(code); } } : undefined}/>;
            })}</g>
            <g>{stateFeatures.map((feature) => {
              const code = FIPS_TO_STATE[String(feature.id).padStart(2,"0")];
              const group = code ? stateGroups.get(code) : undefined;
              if (!code || !group) return null;
              const [rawX,rawY] = statePath.centroid(feature);
              if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
              const x = Math.round(rawX * 1000) / 1000;
              const y = Math.round(rawY * 1000) / 1000;
              const radius = Math.min(27,8 + Math.sqrt(group.cases.length) * 2.2);
              const label = `${STATE_NAMES[code]}, ${group.cases.length} tracked records, highest editorial impact classification ${group.severity}`;
              return <g key={code} transform={`translate(${x},${y})`} className={`smv2-cluster ${focusState && focusState !== code ? "dim" : ""}`} role="button" tabIndex={0} aria-pressed={focusState === code} aria-label={label} onClick={() => selectState(code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectState(code); } }}>
                <circle r={radius} fill={severityColor[group.severity]} /><circle r={Math.max(4,radius-4)} /><text textAnchor="middle" dominantBaseline="central">{group.cases.length}</text><title>{label}</title>
              </g>;
            })}</g>
          </svg> : <svg
            viewBox="0 0 960 540"
            role="group"
            aria-labelledby="world-map-title world-map-desc"
            className={worldDragging ? "is-dragging" : undefined}
            onWheel={handleWorldWheel}
            onPointerDown={handleWorldPointerDown}
            onPointerMove={handleWorldPointerMove}
            onPointerUp={finishWorldPointer}
            onPointerCancel={finishWorldPointer}
          >
            <title id="world-map-title">Global legal AI risk matters by country</title>
            <desc id="world-map-desc">Zoom with the controls, mouse wheel, or trackpad; drag to pan; then select a country cluster to open its synchronized case list and geographic view. Cluster size represents tracked record count and color represents the highest editorial impact classification.</desc>
            <g
              data-world-map-viewport
              transform={`translate(${worldView.x} ${worldView.y}) scale(${worldView.scale})`}
            >
            <g>{countryFeatures.map((feature,index) => {
              const numericCode = String(feature.id).padStart(3,"0");
              const group = countryGroups.get(numericCode);
              const featureKey = feature.id == null ? `country-${index}-${feature.properties?.name || "unknown"}` : numericCode;
              return <path key={featureKey} d={worldPath(feature) || ""} className={`smv2-country ${group ? `has-cases sev-${group.severity}` : ""} ${selectedCountry && group?.country === selectedCountry ? "selected" : ""}`} role={group ? "button" : undefined} tabIndex={group ? 0 : undefined} aria-label={group ? `${countryDisplayName(group.country)}, ${group.cases.length} tracked records` : feature.properties?.name} onClick={group ? () => activateCountry(group.country) : undefined} onKeyDown={group ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCountry(group.country); } } : undefined}/>;
            })}</g>
            <g>{countryFeatures.map((feature) => {
              const numericCode = String(feature.id).padStart(3,"0");
              const group = countryGroups.get(numericCode);
              if (!group) return null;
              const [rawX,rawY] = worldPath.centroid(feature);
              if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
              const x = Math.round(rawX * 1000) / 1000;
              const y = Math.round(rawY * 1000) / 1000;
              const radius = Math.min(28,7 + Math.sqrt(group.cases.length) * 1.45);
              const label = `${countryDisplayName(group.country)}, ${group.cases.length} tracked records, highest editorial impact classification ${group.severity}`;
              return <g key={`cluster-${numericCode}`} transform={`translate(${x},${y})`} className="smv2-cluster smv2-country-cluster" role="button" tabIndex={0} aria-label={label} onClick={() => activateCountry(group.country)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCountry(group.country); } }}>
                <circle r={radius} fill={severityColor[group.severity]} /><circle r={Math.max(4,radius-4)} /><text textAnchor="middle" dominantBaseline="central">{group.cases.length}</text><title>{label}</title>
              </g>;
            })}</g>
            </g>
          </svg>}
          {!isUnitedStates && showControls && <div className="smv2-zoom-ctrl" role="group" aria-label="Global map zoom controls">
            <button type="button" aria-label="Zoom in global map" disabled={worldView.scale >= WORLD_MAX_SCALE} onClick={() => zoomWorldAt(worldView.scale * 1.45)}><Plus aria-hidden="true"/></button>
            <output aria-live="polite" aria-label="Current global map zoom">{Math.round(worldView.scale * 100)}%</output>
            <button type="button" aria-label="Zoom out global map" disabled={worldView.scale <= WORLD_MIN_SCALE} onClick={() => zoomWorldAt(worldView.scale / 1.45)}><Minus aria-hidden="true"/></button>
            <button type="button" aria-label="Reset global map view" disabled={worldView.scale === 1 && worldView.x === 0 && worldView.y === 0} onClick={resetWorldView}><LocateFixed aria-hidden="true"/></button>
          </div>}
          {!embedded && <div className="smv2-map-note">
            {isUnitedStates
              ? <span>{focusState ? `${STATE_NAMES[focusState]} selected` : `${countryFlag("US")} United States selected`}</span>
              : selectedCountry
                ? <span>{countryFlag(selectedCountry)} {countryDisplayName(selectedCountry)} selected</span>
                : <span><Globe2 aria-hidden="true"/> Zoom, drag, then select a country</span>}
            <span>{!isUnitedStates ? `Zoom ${Math.round(worldView.scale * 100)}% · ` : ""}Mode: {dataMode === "severity" ? "highest editorial impact" : "matter count"}</span>
          </div>}
        </div>
        {showSideRail && <aside className="smv2-rail" aria-label="Map results">
          <div className="smv2-rail-heading"><div><strong>{isUnitedStates && focusState ? STATE_NAMES[focusState] : selectedCountry ? `${countryFlag(selectedCountry)} ${countryDisplayName(selectedCountry)}` : "All matching records"}</strong><small>{rows.length.toLocaleString()} results</small></div>{isUnitedStates && focusState && <button onClick={() => selectState(null)} aria-label="Clear state selection">×</button>}</div>
          <div className="smv2-sort"><label htmlFor="map-result-sort"><ArrowDownUp size={12} /> Sort results</label><select id="map-result-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="date-desc">Newest decision</option><option value="date-asc">Oldest decision</option><option value="severity-desc">Highest impact</option><option value="severity-asc">Lowest impact</option><option value="amount-desc">Largest known amount</option><option value="amount-asc">Smallest known amount</option></select></div>
          <div className="smv2-case-list">{rows.slice(0,limit).map((item) => <Link className="smv2-case-row" key={item.slug} href={`/cases/${item.slug}`}>
            <span className="smv2-row-main"><strong>{item.case_name}</strong><small>{countryFlag(item.country)} <Landmark aria-hidden="true"/>{item.court} · {formatCaseDate(item.date)}</small></span><span className={`smv2-row-sev sev-${item.severity}`}>{item.severity.replace("-"," ")}</span><span className="smv2-row-outcome">{item.amount ? <><Banknote aria-hidden="true"/>{item.amount_display}</> : item.outcome || "Review record"}</span>
          </Link>)}</div>
          {limit < rows.length && <button className="smv2-load" onClick={() => setLimit((value) => value + 18)}>Load 18 more</button>}
          <Link className="smv2-all-link" href={filteredDirectoryHref}>Open full filtered case directory →</Link>
        </aside>}
      </div>
      <div className="smv2-legend"><strong>Map color</strong><span><i style={{background:"#b73b54"}}/>Career impact</span><span><i style={{background:"#d65a45"}}/>High</span><span><i style={{background:"#d99a32"}}/>Medium</span><span><i style={{background:"#2877b9"}}/>Low</span><span>Cluster size = tracked record count</span></div>
    </div>
  </div>;
}
