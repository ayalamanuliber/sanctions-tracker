"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import sx from "@/data/sx.json";

interface Case {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: string;
  state: string;
  judge: string;
  date: string;
  sanction_types: string[];
  amount: number | null;
  amount_display: string;
  severity: string;
  ai_tool_used: string;
  summary: string;
  source_url: string;
  source_name: string;
  tags: string[];
}
interface StateEntry {
  state: string;
  count: number;
  total: number;
  cases: Array<{ id: string; name: string; court: string; judge: string; date: string; amount: number | null; amount_display: string; severity: string; tool: string; summary: string; sanction_types: string[]; tags: string[]; source_url: string }>;
}

const SX = sx as unknown as {
  stats: { total_cases_tracked: number; q1_2026_sanctions_usd: number; largest_single_sanction: number; largest_single_case: string; single_day_record: number; single_day_record_date: string; last_updated: string };
  cases: Case[];
  byState: StateEntry[];
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const FIPS_TO_STATE: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
  "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
  "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
  "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
};

const SEV_COLOR: Record<string, string> = {
  low: "#84CC16",
  medium: "#EAB308",
  high: "#3B82F6",
  "career-ending": "#FF5E1A",
};

const fmt = (n: number | null) => n == null ? "—" : n >= 1000 ? "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K" : "$" + n;
const fmtDate = (d: string) => {
  const [y, m, dd] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1];
  return `${mo} ${parseInt(dd)}, ${y}`;
};
const pinR = (c: Case) => {
  const amt = c.amount || 0;
  const minR = 4, maxR = 18;
  const v = amt <= 0 ? 0 : Math.log10(amt) / Math.log10(110000);
  return minR + Math.max(0, v) * (maxR - minR);
};

function animateCount(el: HTMLElement, target: number, prefix = "", suffix = "", decimals = 0) {
  const dur = 1400;
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = target * eased;
    let str;
    if (decimals > 0) str = v.toFixed(decimals);
    else if (target >= 1000) str = Math.round(v).toLocaleString("en-US");
    else str = Math.round(v).toString();
    el.textContent = prefix + str + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export default function SanctionsGlobe() {
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const kpi1Ref = useRef<HTMLDivElement>(null);
  const kpi2Ref = useRef<HTMLSpanElement>(null);
  const kpi3Ref = useRef<HTMLDivElement>(null);
  const kpi4Ref = useRef<HTMLSpanElement>(null);

  const [activeSev, setActiveSev] = useState<string>("all");
  const [railTab, setRailTab] = useState<"cases" | "states">("cases");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [hoverCaseId, setHoverCaseId] = useState<string | null>(null);

  // Severity counts + ribbon
  const sevCounts = useMemo(() => {
    const counts: Record<string, number> = { "career-ending": 0, high: 0, medium: 0, low: 0 };
    SX.cases.forEach((c) => { counts[c.severity] = (counts[c.severity] || 0) + 1; });
    return counts;
  }, []);
  const total = SX.cases.length;
  const highRiskN = (sevCounts["career-ending"] || 0) + (sevCounts.high || 0);

  // Most recent ruling
  const mostRecent = useMemo(() => {
    return [...SX.cases].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, []);
  const daysAgo = useMemo(() => {
    const d = new Date(mostRecent.date);
    const now = new Date(SX.stats.last_updated);
    const diff = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [mostRecent]);

  // Ticker: top 14 by amount, doubled
  const tickerItems = useMemo(() => {
    const top = [...SX.cases].filter((c) => c.amount).sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 14);
    return [...top, ...top];
  }, []);

  // Filtered cases for rail & pins
  const filteredCases = useMemo(() => {
    return SX.cases.filter((c) => activeSev === "all" || c.severity === activeSev);
  }, [activeSev]);

  // Count-up KPIs on mount
  useEffect(() => {
    if (kpi1Ref.current) animateCount(kpi1Ref.current, 1294, "", "");
    if (kpi2Ref.current) animateCount(kpi2Ref.current, 145, "$", "K+");
    if (kpi3Ref.current) animateCount(kpi3Ref.current, 109.7, "$", "K", 1);
    if (kpi4Ref.current) animateCount(kpi4Ref.current, 17, "", "");
  }, []);

  // d3 map render
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
        const topo = (await res.json()) as Topology;
        if (cancelled || !svgRef.current) return;
        const statesFeat = topojson.feature(topo, topo.objects.states as GeometryCollection) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;

        const projection = d3.geoAlbersUsa().scale(1220).translate([480, 300]);
        const pathGen = d3.geoPath(projection);

        const svg = d3.select(svgRef.current);
        const gStates = svg.select<SVGGElement>("#sg-g-states");
        const gPins = svg.select<SVGGElement>("#sg-g-pins");

        // Draw states
        gStates.selectAll("*").remove();
        for (const feat of statesFeat.features) {
          const fips = String((feat as unknown as { id: string }).id);
          const code = FIPS_TO_STATE[fips];
          const hasCases = !!SX.byState.find((s) => s.state === code);
          gStates
            .append("path")
            .attr("d", pathGen(feat) || "")
            .attr("class", "sg-state" + (hasCases ? " has-cases" : ""))
            .attr("data-state", code || "");
        }

        // Compute centroids per state for pin positioning
        const centroids: Record<string, [number, number]> = {};
        for (const feat of statesFeat.features) {
          const fips = String((feat as unknown as { id: string }).id);
          const code = FIPS_TO_STATE[fips];
          if (!code) continue;
          centroids[code] = pathGen.centroid(feat) as [number, number];
        }

        const redrawPins = () => {
          gPins.selectAll("*").remove();
          const byState: Record<string, Case[]> = {};
          SX.cases.forEach((c) => { (byState[c.state] = byState[c.state] || []).push(c); });

          for (const [code, list] of Object.entries(byState)) {
            const centroid = centroids[code];
            if (!centroid) continue;
            const [cx, cy] = centroid;

            list.forEach((c, i) => {
              if (activeSev !== "all" && c.severity !== activeSev) return;
              const n = list.length;
              let x = cx, y = cy;
              if (n > 1) {
                const ang = (i / n) * Math.PI * 2;
                x += Math.cos(ang) * 8;
                y += Math.sin(ang) * 8;
              }
              const r = pinR(c);
              const color = SEV_COLOR[c.severity] || "#3B82F6";
              const coreGrad = `url(#sg-pin-${c.severity === "career-ending" ? "career" : c.severity})`;

              const g = gPins.append("g")
                .attr("class", "sg-pin-g" + (hoverCaseId === c.id ? " hi" : ""))
                .attr("transform", `translate(${x},${y})`)
                .attr("data-case-id", c.id);

              const vis = g.append("g").attr("class", "sg-pin-visual");

              // Pulse ring for high/career-ending
              if (c.severity === "career-ending" || c.severity === "high") {
                vis.append("circle")
                  .attr("class", "sg-pulse-ring")
                  .attr("r", r)
                  .attr("stroke", color)
                  .attr("stroke-width", 1.2)
                  .attr("fill", "none");
              }

              // Ring style pin
              vis.append("circle")
                .attr("r", r)
                .attr("class", "sg-pin-ring")
                .attr("stroke", color)
                .attr("stroke-width", 1.8)
                .attr("fill", "none");
              vis.append("circle")
                .attr("r", Math.max(2, r * 0.35))
                .attr("fill", color);

              // Glow halo
              vis.insert("circle", ":first-child")
                .attr("r", r + 2)
                .attr("class", "sg-pin-glow")
                .attr("fill", color);

              // Hitbox
              g.append("circle")
                .attr("class", "sg-pin-hit")
                .attr("r", Math.max(r + 4, 9));

              g.on("mouseenter", () => {
                setHoverCaseId(c.id);
                showTip(c, x, y);
              });
              g.on("mouseleave", () => {
                setHoverCaseId(null);
                hideTip();
              });
              g.on("click", () => {
                setSelectedCase(c);
              });
            });
          }
        };

        redrawPins();

        // Store for re-render when filter changes
        (svgRef.current as unknown as { __redrawPins?: () => void }).__redrawPins = redrawPins;
      } catch (err) {
        console.error("Map load failed", err);
      }
    })();
    return () => { cancelled = true; };
    // Deliberately no deps — the d3 effect uses `activeSev` & `hoverCaseId` through stored refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render pins when filter changes
  useEffect(() => {
    const redraw = (svgRef.current as unknown as { __redrawPins?: () => void })?.__redrawPins;
    if (redraw) redraw();
  }, [activeSev, hoverCaseId]);

  function showTip(c: Case, x: number, y: number) {
    const tip = tipRef.current;
    const svg = svgRef.current;
    if (!tip || !svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / 960;
    const px = rect.left + x * scale;
    const py = rect.top + y * scale;
    tip.innerHTML = `
      <div class="sg-tip-head">
        <span class="sg-tip-state">${STATE_NAMES[c.state] || c.state}</span>
        <span class="sg-tip-code">${c.state}</span>
      </div>
      <div style="font-size:12.5px; font-weight:600; color:#fff; margin-bottom:4px; line-height:1.3;">${c.case_name}</div>
      <div class="sg-tip-row"><span>Court</span><b>${c.court}</b></div>
      <div class="sg-tip-row"><span>Sanction</span><b>${c.amount_display}</b></div>
      <div class="sg-tip-row"><span>Date</span><b>${fmtDate(c.date)}</b></div>
      <div class="sg-tip-cases">
        <span class="sg-sev-pill sg-sev-${c.severity}">${c.severity.replace("-", " ")}</span>
        <span style="color:rgba(255,255,255,0.4); margin-left:6px; font-size:10px;">${c.ai_tool_used}</span>
      </div>
    `;
    tip.style.left = px + "px";
    tip.style.top = py + "px";
    tip.classList.add("show");
    requestAnimationFrame(() => {
      if (!tip) return;
      const tipRect = tip.getBoundingClientRect();
      const vw = window.innerWidth;
      const margin = 12;
      let placement = "above";
      let tx = "-50%", ty = "calc(-100% - 14px)";
      if (py - tipRect.height - 24 < margin) {
        placement = "below";
        ty = "calc(14px)";
      }
      let arrowX = 50;
      const halfW = tipRect.width / 2;
      if (px - halfW < margin) {
        const shift = margin - (px - halfW);
        tx = `calc(-50% + ${shift}px)`;
        arrowX = 50 - (shift / tipRect.width) * 100;
      } else if (px + halfW > vw - margin) {
        const shift = (px + halfW) - (vw - margin);
        tx = `calc(-50% - ${shift}px)`;
        arrowX = 50 + (shift / tipRect.width) * 100;
      }
      tip.style.setProperty("--sg-tip-tx", tx);
      tip.style.setProperty("--sg-tip-ty", ty);
      tip.style.setProperty("--sg-arrow-x", arrowX + "%");
      tip.setAttribute("data-placement", placement);
    });
  }
  function hideTip() {
    if (tipRef.current) tipRef.current.classList.remove("show");
  }

  // ESC closes drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedCase(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Escalation chart data
  const esc = useMemo(() => {
    const ESCALATION = [
      { amount: 2000, year: "2024", label: "Smith v. Farwell" },
      { amount: 2500, year: "2025", label: "5th Circuit" },
      { amount: 3000, year: "2025", label: "Lindell" },
      { amount: 5000, year: "2023", label: "Mata v. Avianca" },
      { amount: 10000, year: "2025", label: "Noland" },
      { amount: 12000, year: "2026", label: "Kansas Patent" },
      { amount: 30000, year: "2026", label: "Whiting v. Athens" },
      { amount: 31100, year: "2025", label: "Lacey" },
      { amount: 109700, year: "2026", label: "Brigandi" },
    ];
    const sorted = [...ESCALATION].sort((a, b) => parseInt(a.year) - parseInt(b.year) || a.amount - b.amount);
    const W = 560, H = 180, PAD = 20;
    const max = Math.log10(110000);
    const min = Math.log10(1000);
    const xs = sorted.map((_, i) => PAD + (i / (sorted.length - 1)) * (W - 2 * PAD));
    const ys = sorted.map((d) => H - PAD - ((Math.log10(d.amount) - min) / (max - min)) * (H - 2 * PAD));
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    const area = `${d} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;
    return { W, H, PAD, xs, ys, d, area, sorted };
  }, []);

  // Top Jurisdictions (bars) — top 8
  const topStates = useMemo(() => SX.byState.slice(0, 8), []);
  const maxCount = topStates[0]?.count || 1;

  const circuits = useMemo(() => {
    const set = new Set<string>();
    SX.cases.forEach((c) => { if (c.circuit) set.add(c.circuit); });
    return set.size;
  }, []);

  return (
    <div className="sg-root">
      {/* ============== HERO ============== */}
      <div className="sg-wrap sg-hero-band">
        <div className="sg-eyebrow">
          <span className="sg-live-dot"></span>
          Live — Updated <span>{SX.stats.last_updated}</span>
          <span style={{ color: "rgba(255,255,255,0.12)", margin: "0 4px" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>{total} new rulings this quarter</span>
        </div>

        <h1 className="sg-title">
          <span className="sg-w reveal" style={{ animationDelay: ".05s" }}>Where</span>
          <span className="sg-w reveal" style={{ animationDelay: ".12s" }}>is</span>
          <span className="sg-w reveal" style={{ animationDelay: ".19s" }}>your</span>
          <span className="sg-w reveal" style={{ animationDelay: ".26s" }}>firm</span>
          <em className="sg-w reveal" style={{ animationDelay: ".35s" }}>exposed?</em>
        </h1>

        <div className="sg-hero-grid">
          <div>
            <p className="sg-sub">
              Federal and state courts sanctioned lawyers in <b>{total}</b> separate rulings in the last 12 months for filing AI-hallucinated citations. Fines range from <b>$2,000 warnings</b> to a single <b style={{ color: "#FF5E1A" }}>$109,700</b> record. This map plots every one — severity ladder, jurisdiction, and the escalation curve driving it.
            </p>

            <div className="sg-ribbon-wrap">
              <div className="sg-ribbon-cap">
                <span>Severity distribution · {total} cases</span>
                <span>{highRiskN} high-risk · {Math.round(highRiskN / total * 100)}%</span>
              </div>
              <div className="sg-ribbon">
                <div className="sg-seg" style={{ flex: `${sevCounts["career-ending"] || 0.01} 0 0`, background: "linear-gradient(90deg,#D94008,#FF5E1A)" }}></div>
                <div className="sg-seg" style={{ flex: `${sevCounts.high || 0.01} 0 0`, background: "linear-gradient(90deg,#3B82F6,#60A5FA)" }}></div>
                <div className="sg-seg" style={{ flex: `${sevCounts.medium || 0.01} 0 0`, background: "linear-gradient(90deg,#EAB308,#FDE047)" }}></div>
                <div className="sg-seg" style={{ flex: `${sevCounts.low || 0.01} 0 0`, background: "linear-gradient(90deg,#84CC16,#BEF264)" }}></div>
              </div>
              <div className="sg-ribbon-legend">
                <div className="sg-li"><span className="sg-d" style={{ background: "#FF5E1A", color: "#FF5E1A" }}></span><span>{sevCounts["career-ending"] || 0} career-ending</span></div>
                <div className="sg-li"><span className="sg-d" style={{ background: "#60A5FA", color: "#60A5FA" }}></span><span>{sevCounts.high || 0} high</span></div>
                <div className="sg-li"><span className="sg-d" style={{ background: "#FDE047", color: "#FDE047" }}></span><span>{sevCounts.medium || 0} medium</span></div>
                <div className="sg-li"><span className="sg-d" style={{ background: "#BEF264", color: "#BEF264" }}></span><span>{sevCounts.low || 0} low</span></div>
              </div>
            </div>
          </div>

          <div className="sg-court-pulse">
            <div className="sg-court-pulse-label">
              <span className="sg-sig"></span>
              Most recent ruling
            </div>
            <div className="sg-court-last">
              <span className="sg-amt">{mostRecent.amount_display}</span>
            </div>
            <div className="sg-court-last-meta">
              <b>{mostRecent.case_name}</b> — {mostRecent.court}<br />
              Judge {mostRecent.judge} · {fmtDate(mostRecent.date)}
            </div>
            <div className="sg-court-pulse-foot">
              <span className="sg-live"><span className="sg-d"></span>LIVE FEED</span>
              <span>{daysAgo} days ago</span>
            </div>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="sg-kpi-strip">
          <div className="sg-kpi bordered">
            <div className="sg-kpi-label">
              Tracked Rulings
              <span className="sg-kpi-spark" style={{ color: "#0066FF" }}>
                <span className="sg-bar" style={{ height: 6 }}></span><span className="sg-bar" style={{ height: 10 }}></span><span className="sg-bar" style={{ height: 14 }}></span><span className="sg-bar" style={{ height: 11 }}></span><span className="sg-bar" style={{ height: 16 }}></span>
              </span>
            </div>
            <div className="sg-kpi-val" ref={kpi1Ref}>1,294</div>
            <div className="sg-kpi-note">Charlotin Tracker · HEC Paris</div>
          </div>
          <div className="sg-kpi">
            <div className="sg-kpi-label">
              Q1 2026 Sanctions
              <span className="sg-kpi-spark" style={{ color: "#FF5E1A" }}>
                <span className="sg-bar" style={{ height: 4 }}></span><span className="sg-bar" style={{ height: 7 }}></span><span className="sg-bar" style={{ height: 10 }}></span><span className="sg-bar" style={{ height: 13 }}></span><span className="sg-bar" style={{ height: 16 }}></span>
              </span>
            </div>
            <div className="sg-kpi-val"><span className="sg-accent" ref={kpi2Ref}>$145K+</span></div>
            <div className="sg-kpi-note">Documented monetary fines</div>
          </div>
          <div className="sg-kpi">
            <div className="sg-kpi-label">
              Largest Single Sanction
              <span className="sg-kpi-spark" style={{ color: "#60A5FA" }}>
                <span className="sg-bar" style={{ height: 5 }}></span><span className="sg-bar" style={{ height: 8 }}></span><span className="sg-bar" style={{ height: 6 }}></span><span className="sg-bar" style={{ height: 14 }}></span><span className="sg-bar" style={{ height: 17 }}></span>
              </span>
            </div>
            <div className="sg-kpi-val" ref={kpi3Ref}>$109.7K</div>
            <div className="sg-kpi-note">Couvrette v. Wisnovsky · D. Or.</div>
          </div>
          <div className="sg-kpi">
            <div className="sg-kpi-label">
              Single-Day Record
              <span className="sg-kpi-spark" style={{ color: "#FDE047" }}>
                <span className="sg-bar" style={{ height: 3 }}></span><span className="sg-bar" style={{ height: 5 }}></span><span className="sg-bar" style={{ height: 9 }}></span><span className="sg-bar" style={{ height: 12 }}></span><span className="sg-bar" style={{ height: 17 }}></span>
              </span>
            </div>
            <div className="sg-kpi-val"><span ref={kpi4Ref}>17</span> <span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>courts</span></div>
            <div className="sg-kpi-note">Mar 31, 2026 · 4 circuits</div>
          </div>
        </div>

        {/* TICKER */}
        <div className="sg-ticker-bar">
          <div className="sg-ticker-label"><span className="sg-d"></span>Recent filings</div>
          <div className="sg-ticker-viewport">
            <div className="sg-ticker-track">
              {tickerItems.map((c, i) => (
                <span key={c.id + "-" + i} className="sg-ticker-item">
                  <span className={`sg-amt ${c.severity.replace("-ending", "")}`}>{c.amount_display}</span>
                  <span className="sg-case">{c.case_name}</span>
                  <span className="sg-court">{c.court} · {c.state}</span>
                  <span className="sg-dot">◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============== MAP ============== */}
      <section id="map">
        <div className="sg-wrap">
          <div className="sg-map-card">
            <div className="sg-map-head">
              <div className="sg-map-head-left">
                <div className="sg-h">Sanctions by Jurisdiction</div>
                <div className="sg-s">
                  Federal + state rulings where courts have sanctioned AI-hallucinated filings. <span>{SX.cases.length} cases across {SX.byState.length} states.</span>
                </div>
              </div>
              <div className="sg-map-head-right">
                {(["all","career-ending","high","medium","low"] as const).map((sev) => (
                  <div key={sev} className={`sg-chip ${activeSev === sev ? "active" : ""}`} onClick={() => setActiveSev(sev)}>
                    {sev !== "all" && <span className="sg-sw" style={{ background: sev === "career-ending" ? "#FF5E1A" : sev === "high" ? "#60A5FA" : sev === "medium" ? "#FDE047" : "#BEF264" }}></span>}
                    {sev === "all" ? "All" : sev === "career-ending" ? "Career-ending" : sev[0].toUpperCase() + sev.slice(1)}
                  </div>
                ))}
              </div>
            </div>

            <div className="sg-map-body">
              <div className="sg-map-stage" ref={stageRef}>
                <div className="sg-compass">
                  <div className="sg-c-tick"><span className="sg-num">{total}</span><span>rulings</span></div>
                  <div className="sg-c-tick"><span className="sg-num">{SX.byState.length}</span><span>states</span></div>
                  <div className="sg-c-tick"><span className="sg-num">{circuits}</span><span>circuits</span></div>
                </div>
                <svg ref={svgRef} id="sg-map-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <radialGradient id="sg-pin-career" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FF7A3C" />
                      <stop offset="100%" stopColor="#D94008" />
                    </radialGradient>
                    <radialGradient id="sg-pin-high" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#93C5FD" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </radialGradient>
                    <radialGradient id="sg-pin-medium" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FEF3AA" />
                      <stop offset="100%" stopColor="#EAB308" />
                    </radialGradient>
                    <radialGradient id="sg-pin-low" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#E8FBA5" />
                      <stop offset="100%" stopColor="#84CC16" />
                    </radialGradient>
                  </defs>
                  <g id="sg-g-states"></g>
                  <g id="sg-g-pins"></g>
                </svg>
                <div className="sg-coords">ALBERS USA · 38.5°N, 96.5°W</div>
              </div>

              <aside className="sg-rail">
                <div className="sg-rail-tabs">
                  <div className={`sg-rail-tab ${railTab === "cases" ? "active" : ""}`} onClick={() => setRailTab("cases")}>
                    Cases <span>({filteredCases.length})</span>
                  </div>
                  <div className={`sg-rail-tab ${railTab === "states" ? "active" : ""}`} onClick={() => setRailTab("states")}>
                    By State
                  </div>
                </div>
                <div className="sg-rail-scroll">
                  {railTab === "cases" ? (
                    [...filteredCases].sort((a, b) => (b.amount || 0) - (a.amount || 0)).map((c) => (
                      <div
                        key={c.id}
                        className={`sg-case-row ${hoverCaseId === c.id ? "hi" : ""}`}
                        onMouseEnter={() => setHoverCaseId(c.id)}
                        onMouseLeave={() => setHoverCaseId(null)}
                        onClick={() => setSelectedCase(c)}
                      >
                        <div className="sg-case-top">
                          <div className="sg-case-name">{c.case_name}</div>
                          <div className="sg-case-amt">{c.amount ? fmt(c.amount) : "—"}</div>
                        </div>
                        <div className="sg-case-meta">
                          <span className="sg-stf">{c.state}</span>
                          <span>{c.court}</span>
                          <span className="sg-sep">·</span>
                          <span>{fmtDate(c.date)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className={`sg-sev-pill sg-sev-${c.severity}`}>{c.severity.replace("-", " ")}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                            {c.ai_tool_used.length > 28 ? c.ai_tool_used.slice(0, 28) + "…" : c.ai_tool_used}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    SX.byState.map((s) => {
                      const order: Record<string, number> = { low: 1, medium: 2, high: 3, "career-ending": 4 };
                      const maxSev = s.cases.reduce((acc, c) => (order[c.severity] > order[acc] ? c.severity : acc), "low");
                      return (
                        <div key={s.state} className="sg-case-row">
                          <div className="sg-case-top">
                            <div className="sg-case-name">{STATE_NAMES[s.state]}</div>
                            <div className="sg-case-amt">{fmt(s.total)}</div>
                          </div>
                          <div className="sg-case-meta">
                            <span className="sg-stf">{s.state}</span>
                            <span>{s.count} case{s.count > 1 ? "s" : ""}</span>
                            <span className="sg-sep">·</span>
                            <span>worst:</span>
                            <span className={`sg-sev-pill sg-sev-${maxSev}`}>{maxSev.replace("-", " ")}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4, marginTop: 4 }}>
                            {s.cases.slice(0, 2).map((c) => c.name).join(" · ")}
                            {s.cases.length > 2 ? ` · +${s.cases.length - 2} more` : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>
            </div>

            <div className="sg-legend-bar">
              <div className="sg-legend-items">
                <span>Severity</span>
                <div className="sg-legend-item"><span className="sg-legend-dot" style={{ background: "#FF5E1A", color: "#FF5E1A" }}></span>Career-ending</div>
                <div className="sg-legend-item"><span className="sg-legend-dot" style={{ background: "#60A5FA", color: "#60A5FA" }}></span>High</div>
                <div className="sg-legend-item"><span className="sg-legend-dot" style={{ background: "#FDE047", color: "#FDE047" }}></span>Medium</div>
                <div className="sg-legend-item"><span className="sg-legend-dot" style={{ background: "#BEF264", color: "#BEF264" }}></span>Low</div>
              </div>
              <div className="sg-legend-scale">
                <span>Size = sanction amount</span>
                <span className="sg-scale-ring" style={{ width: 6, height: 6 }}></span>
                <span className="sg-scale-ring" style={{ width: 11, height: 11 }}></span>
                <span className="sg-scale-ring" style={{ width: 16, height: 16 }}></span>
                <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "rgba(255,255,255,0.25)", fontSize: 10 }}>$0 → $110K</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== LOWER (Top Jurisdictions + Escalation) ============== */}
      <section className="sg-below">
        <div className="sg-wrap">
          <div className="sg-two-col">
            <div className="sg-panel">
              <div className="sg-panel-h">Top Jurisdictions</div>
              <div className="sg-panel-sub">Ranked by case count and total monetary exposure</div>
              <div>
                {topStates.map((s) => {
                  const pct = (s.count / maxCount) * 100;
                  const order: Record<string, number> = { low: 1, medium: 2, high: 3, "career-ending": 4 };
                  const worstSev = s.cases.reduce((acc, c) => (order[c.severity] > order[acc] ? c.severity : acc), "low");
                  const color = SEV_COLOR[worstSev];
                  return (
                    <div key={s.state} className="sg-bar-row">
                      <div className="sg-bar-label">{STATE_NAMES[s.state]}</div>
                      <div className="sg-bar-track">
                        <div
                          className="sg-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}88 0%, ${color} 100%)`,
                            boxShadow: `0 0 12px ${color}44`,
                          }}
                        >
                          {s.count}
                        </div>
                      </div>
                      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", minWidth: 54, textAlign: "right" }}>
                        {fmt(s.total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="sg-panel">
              <div className="sg-panel-h">Sanction Escalation</div>
              <div className="sg-panel-sub">2023 → 2026 · From $2K warnings to $109.7K records</div>
              <svg className="sg-esc-svg" viewBox={`0 0 ${esc.W} ${esc.H}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg-esc-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5E1A" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FF5E1A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1={esc.PAD} x2={esc.W - esc.PAD} y1={esc.PAD + f * (esc.H - 2 * esc.PAD)} y2={esc.PAD + f * (esc.H - 2 * esc.PAD)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
                ))}
                <path d={esc.area} fill="url(#sg-esc-grad)" />
                <path d={esc.d} stroke="#FF5E1A" strokeWidth="2" fill="none" />
                {esc.sorted.map((pt, i) => (
                  <g key={i}>
                    <circle cx={esc.xs[i]} cy={esc.ys[i]} r="4" fill="#FF5E1A" stroke="#0A1628" strokeWidth="2">
                      <title>{pt.label} · {fmt(pt.amount)} · {pt.year}</title>
                    </circle>
                  </g>
                ))}
                <text x={esc.xs[esc.xs.length - 1] + 4} y={esc.ys[esc.ys.length - 1] - 6} fill="#fff" fontSize="10" fontWeight="600" fontFamily="ui-monospace, Menlo, monospace">$109.7K</text>
                <text x={esc.xs[0] - 4} y={esc.ys[0] + 4} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end" fontFamily="ui-monospace, Menlo, monospace">$2K</text>
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.06em" }}>
                <span>2023</span><span>2024</span><span>2025</span><span>2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== DRAWER ============== */}
      <div className={`sg-drawer-bd ${selectedCase ? "open" : ""}`} onClick={() => setSelectedCase(null)}></div>
      <div className={`sg-drawer ${selectedCase ? "open" : ""}`}>
        {selectedCase && (
          <>
            <div className="sg-drawer-head">
              <div>
                <span className={`sg-sev-pill sg-sev-${selectedCase.severity}`}>{selectedCase.severity.replace("-", " ")}</span>
                <h3 style={{ marginTop: 8 }}>{selectedCase.case_name}</h3>
              </div>
              <button className="sg-drawer-close" onClick={() => setSelectedCase(null)}>✕</button>
            </div>
            <div className="sg-drawer-meta">
              <span><b style={{ color: "#fff" }}>{selectedCase.court}</b></span>
              <span>·</span>
              <span>{STATE_NAMES[selectedCase.state]}</span>
              <span>·</span>
              <span>{fmtDate(selectedCase.date)}</span>
              <span>·</span>
              <span>Judge {selectedCase.judge}</span>
            </div>
            <div className="sg-bignum">
              <div className="sg-val" style={{ color: selectedCase.severity === "career-ending" ? "#FF5E1A" : "#fff", fontSize: selectedCase.amount ? 32 : 22 }}>
                {selectedCase.amount_display}
              </div>
              {selectedCase.amount && <div className="sg-lbl">monetary sanction</div>}
            </div>
            <div className="sg-section-title">Summary</div>
            <p>{selectedCase.summary}</p>
            <div className="sg-section-title">Case Details</div>
            <div className="sg-kvgrid">
              <div className="sg-k">AI Tool</div><div className="sg-v">{selectedCase.ai_tool_used}</div>
              <div className="sg-k">Sanction Type</div><div className="sg-v">{selectedCase.sanction_types.join(", ")}</div>
              <div className="sg-k">Jurisdiction</div><div className="sg-v">{selectedCase.jurisdiction}{selectedCase.circuit ? " · " + selectedCase.circuit : ""}</div>
              <div className="sg-k">Source</div><div className="sg-v">{selectedCase.source_name}</div>
            </div>
            <div className="sg-section-title">Tags</div>
            <div className="sg-taglist">
              {selectedCase.tags.map((t) => (
                <span key={t} className="sg-tagchip">#{t}</span>
              ))}
            </div>
            <a className="sg-cta" href={selectedCase.source_url} target="_blank" rel="noopener">Read source ↗</a>
          </>
        )}
      </div>

      {/* Tooltip */}
      <div className="sg-tip" ref={tipRef}></div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.sg-root {
  --sg-primary: #0066FF;
  --sg-accent: #FF5E1A;
  --sg-ok: #22c55e;
  --sg-sev-low: #BEF264;
  --sg-sev-low-bg: rgba(190,242,100,0.14);
  --sg-sev-med: #FDE047;
  --sg-sev-med-bg: rgba(253,224,71,0.14);
  --sg-sev-high: #60A5FA;
  --sg-sev-high-bg: rgba(96,165,250,0.16);
  --sg-sev-career: #FF5E1A;
  --sg-sev-career-bg: rgba(255,94,26,0.16);
  --sg-border: rgba(255,255,255,0.06);
  --sg-border-2: rgba(255,255,255,0.10);
  --sg-mono: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}
.sg-root * { box-sizing: border-box; }
.sg-wrap { max-width: 1360px; margin: 0 auto; padding: 0 32px; }
.sg-hero-band { padding: 56px 0 20px; }

/* Eyebrow */
.sg-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--sg-mono); font-size: 11px; font-weight: 500;
  color: rgba(255,255,255,0.4); letter-spacing: 0.08em; text-transform: uppercase;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(10,22,40,0.6); border: 1px solid var(--sg-border);
}
.sg-eyebrow .sg-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--sg-ok);
  box-shadow: 0 0 10px var(--sg-ok); animation: sg-pulse 2s infinite;
}
@keyframes sg-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

/* Title */
.sg-title {
  font-size: clamp(42px, 6.2vw, 72px);
  font-weight: 800; letter-spacing: -0.035em; line-height: 0.98;
  margin: 22px 0 22px;
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 clamp(8px, 1.2vw, 18px);
}
.sg-title .sg-w { display: inline-block; }
.sg-title .reveal { opacity: 0; transform: translateY(14px); animation: sg-heroWord .75s cubic-bezier(.2,.9,.3,1) forwards; }
@keyframes sg-heroWord { to { opacity: 1; transform: translateY(0); } }
.sg-title em {
  font-style: normal; color: var(--sg-accent); position: relative;
  background: linear-gradient(180deg, #FF7A3C 0%, #FF5E1A 50%, #D94008 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.sg-title em::after {
  content: ''; position: absolute; left: -10%; right: -10%; bottom: 0.05em; height: 0.18em;
  background: radial-gradient(ellipse at center, rgba(255,94,26,0.38), transparent 70%);
  filter: blur(14px); z-index: -1; animation: sg-embers 3.4s ease-in-out infinite;
}
@keyframes sg-embers { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }

.sg-hero-grid { display: grid; grid-template-columns: 1fr 360px; gap: 40px; align-items: end; margin-top: 18px; }
.sg-sub { color: rgba(255,255,255,0.6); font-size: 17px; line-height: 1.55; max-width: 720px; }
.sg-sub b { color: #fff; font-weight: 700; }

/* Ribbon */
.sg-ribbon-wrap { margin-top: 24px; max-width: 720px; }
.sg-ribbon-cap { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--sg-mono); font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 8px; }
.sg-ribbon { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,0.04); }
.sg-ribbon .sg-seg { transition: flex-grow .8s cubic-bezier(.2,.9,.3,1); position: relative; }
.sg-ribbon .sg-seg + .sg-seg { border-left: 1px solid rgba(5,11,20,0.6); }
.sg-ribbon-legend { display: flex; gap: 16px; margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.4); }
.sg-ribbon-legend .sg-li { display: flex; gap: 6px; align-items: center; }
.sg-ribbon-legend .sg-d { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }

/* Court pulse card */
.sg-court-pulse {
  position: relative; padding: 24px 22px;
  background: linear-gradient(160deg, rgba(255,94,26,0.06), rgba(0,102,255,0.04));
  border: 1px solid var(--sg-border-2); border-radius: 18px; overflow: hidden;
}
.sg-court-pulse::before {
  content: ''; position: absolute; top: -50%; right: -30%; width: 260px; height: 260px;
  border-radius: 50%; background: radial-gradient(circle, rgba(255,94,26,0.14), transparent 70%);
  animation: sg-orb 5s ease-in-out infinite;
}
@keyframes sg-orb { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
.sg-court-pulse-label { font-family: var(--sg-mono); font-size: 10px; letter-spacing: 0.12em; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.sg-court-pulse-label .sg-sig { width: 6px; height: 6px; border-radius: 50%; background: var(--sg-accent); box-shadow: 0 0 10px var(--sg-accent); animation: sg-pulse 1.6s infinite; }
.sg-court-last { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 8px; position: relative; }
.sg-court-last .sg-amt { color: var(--sg-accent); }
.sg-court-last-meta { font-size: 12.5px; color: rgba(255,255,255,0.6); line-height: 1.5; position: relative; }
.sg-court-last-meta b { color: #fff; font-weight: 600; }
.sg-court-pulse-foot { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--sg-border); display: flex; justify-content: space-between; align-items: center; font-family: var(--sg-mono); font-size: 10.5px; color: rgba(255,255,255,0.4); letter-spacing: 0.04em; position: relative; }
.sg-court-pulse-foot .sg-live { display: flex; align-items: center; gap: 6px; color: var(--sg-ok); }
.sg-court-pulse-foot .sg-live .sg-d { width: 5px; height: 5px; border-radius: 50%; background: var(--sg-ok); box-shadow: 0 0 6px var(--sg-ok); animation: sg-pulse 2s infinite; }

/* KPI strip */
.sg-kpi-strip {
  margin-top: 36px;
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: linear-gradient(180deg, rgba(10,22,40,0.8), rgba(10,22,40,0.4));
  border: 1px solid var(--sg-border-2); border-radius: 18px; overflow: hidden; position: relative;
}
.sg-kpi-strip::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,102,255,0.5), rgba(255,94,26,0.5), transparent); }
.sg-kpi { padding: 22px 24px; border-right: 1px solid rgba(255,255,255,0.03); position: relative; overflow: hidden; }
.sg-kpi:last-child { border-right: 0; }
.sg-kpi-label { font-family: var(--sg-mono); font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.4); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.sg-kpi-spark { display: inline-flex; gap: 2px; margin-left: auto; opacity: 0.7; }
.sg-kpi-spark .sg-bar { width: 2px; background: currentColor; border-radius: 1px; animation: sg-sparkBreath 2.4s ease-in-out infinite; }
.sg-kpi-spark .sg-bar:nth-child(2) { animation-delay: .2s; }
.sg-kpi-spark .sg-bar:nth-child(3) { animation-delay: .4s; }
.sg-kpi-spark .sg-bar:nth-child(4) { animation-delay: .6s; }
.sg-kpi-spark .sg-bar:nth-child(5) { animation-delay: .8s; }
@keyframes sg-sparkBreath { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
.sg-kpi-val { font-size: 36px; font-weight: 800; letter-spacing: -0.035em; margin-bottom: 6px; font-variant-numeric: tabular-nums; color: #fff; }
.sg-kpi-val .sg-accent { color: var(--sg-accent); }
.sg-kpi-note { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }
.sg-kpi.bordered::after { content: ''; position: absolute; left: 0; top: 12px; bottom: 12px; width: 2px; background: linear-gradient(180deg, var(--sg-primary), transparent); border-radius: 2px; }

/* Ticker */
.sg-ticker-bar { margin-top: 14px; display: flex; align-items: stretch; background: rgba(10,22,40,0.4); border: 1px solid var(--sg-border); border-radius: 12px; overflow: hidden; font-family: var(--sg-mono); font-size: 12px; height: 44px; }
.sg-ticker-label { display: flex; align-items: center; gap: 10px; padding: 0 16px; background: rgba(255,94,26,0.08); border-right: 1px solid var(--sg-border-2); color: var(--sg-accent); font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; flex-shrink: 0; }
.sg-ticker-label .sg-d { width: 6px; height: 6px; border-radius: 50%; background: var(--sg-accent); box-shadow: 0 0 10px var(--sg-accent); animation: sg-pulse 1.4s infinite; }
.sg-ticker-viewport { flex: 1; overflow: hidden; position: relative; mask-image: linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 60px), transparent); }
.sg-ticker-track { display: flex; gap: 48px; align-items: center; height: 100%; white-space: nowrap; animation: sg-tickerScroll 90s linear infinite; padding-left: 20px; }
.sg-ticker-track:hover { animation-play-state: paused; }
@keyframes sg-tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.sg-ticker-item { display: inline-flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.6); }
.sg-ticker-item .sg-amt { color: #fff; font-weight: 700; letter-spacing: -0.01em; }
.sg-ticker-item .sg-amt.career { color: var(--sg-accent); }
.sg-ticker-item .sg-amt.high { color: var(--sg-sev-high); }
.sg-ticker-item .sg-amt.medium { color: var(--sg-sev-med); }
.sg-ticker-item .sg-amt.low { color: var(--sg-sev-low); }
.sg-ticker-item .sg-case { color: rgba(255,255,255,0.4); }
.sg-ticker-item .sg-court { color: rgba(255,255,255,0.25); }
.sg-ticker-item .sg-dot { color: rgba(255,255,255,0.12); }

/* Map card */
#map { padding: 40px 0 80px; }
.sg-map-card { background: rgba(10,22,40,0.55); backdrop-filter: blur(16px); border: 1px solid var(--sg-border); border-radius: 22px; overflow: hidden; position: relative; }
.sg-map-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 24px 28px 20px; border-bottom: 1px solid var(--sg-border); gap: 24px; flex-wrap: wrap; }
.sg-map-head-left .sg-h { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #fff; display: flex; align-items: center; gap: 10px; }
.sg-map-head-left .sg-h::before { content: ''; width: 3px; height: 18px; background: var(--sg-primary); border-radius: 2px; }
.sg-map-head-left .sg-s { margin-top: 6px; font-size: 13px; color: rgba(255,255,255,0.4); }
.sg-map-head-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.sg-chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--sg-mono); font-size: 11px; font-weight: 500; padding: 6px 10px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--sg-border); color: rgba(255,255,255,0.6); cursor: pointer; transition: all .15s; letter-spacing: 0.03em; }
.sg-chip:hover { background: rgba(255,255,255,0.06); color: #fff; border-color: var(--sg-border-2); }
.sg-chip.active { background: rgba(0,102,255,0.12); border-color: rgba(0,102,255,0.4); color: #fff; }
.sg-chip .sg-sw { width: 8px; height: 8px; border-radius: 50%; }

.sg-map-body { display: grid; grid-template-columns: 1fr 360px; min-height: 620px; }
.sg-map-stage { position: relative; border-right: 1px solid var(--sg-border); background: radial-gradient(circle at 50% 55%, rgba(0,102,255,0.08), transparent 60%), linear-gradient(180deg, rgba(5,11,20,0.4), rgba(5,11,20,0) 50%); overflow: hidden; }
.sg-map-stage svg { width: 100%; height: 100%; display: block; }
.sg-state { fill: rgba(255,255,255,0.022); stroke: rgba(255,255,255,0.08); stroke-width: 0.6; transition: fill .18s, stroke .18s; }
.sg-state.has-cases { fill: rgba(0,102,255,0.06); stroke: rgba(0,102,255,0.25); }
.sg-state.hi { fill: rgba(0,102,255,0.14); stroke: rgba(0,102,255,0.55); }

.sg-pin-g { cursor: pointer; }
.sg-pin-g > * { pointer-events: none; }
.sg-pin-g .sg-pin-hit { pointer-events: all; fill: transparent; }
.sg-pin-visual { transition: transform .18s cubic-bezier(.2,.9,.3,1); transform-box: fill-box; transform-origin: center; }
.sg-pin-g:hover .sg-pin-visual, .sg-pin-g.hi .sg-pin-visual { transform: scale(1.35); }
.sg-pin-ring { fill: none; opacity: 0.7; }
.sg-pin-glow { filter: blur(6px); opacity: 0.75; }

.sg-pulse-ring { fill: none; transform-box: fill-box; transform-origin: center; animation: sg-pulseRing 2.2s ease-out infinite; }
@keyframes sg-pulseRing { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(3.2); opacity: 0; } }

.sg-compass { position: absolute; top: 16px; left: 16px; font-family: var(--sg-mono); font-size: 10px; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; text-transform: uppercase; display: flex; flex-direction: column; gap: 4px; }
.sg-compass .sg-c-tick { display: flex; gap: 8px; align-items: center; }
.sg-compass .sg-num { color: rgba(255,255,255,0.6); font-weight: 600; }
.sg-coords { position: absolute; bottom: 16px; right: 16px; font-family: var(--sg-mono); font-size: 10px; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; }

/* Tooltip */
.sg-tip { position: fixed; z-index: 220; pointer-events: none; background: rgba(15,29,50,0.97); backdrop-filter: blur(14px); border: 1px solid var(--sg-border-2); border-radius: 12px; padding: 12px 14px; min-width: 240px; max-width: 300px; box-shadow: 0 24px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,102,255,0.08) inset; left: 0; top: 0; opacity: 0; transform: translate(var(--sg-tip-tx, -50%), var(--sg-tip-ty, calc(-100% - 14px))) scale(0.96); transition: opacity .14s, transform .14s cubic-bezier(.2,.9,.3,1); color: #fff; font-family: 'Inter', sans-serif; }
.sg-tip.show { opacity: 1; transform: translate(var(--sg-tip-tx, -50%), var(--sg-tip-ty, calc(-100% - 14px))) scale(1); }
.sg-tip::after { content: ''; position: absolute; left: var(--sg-arrow-x, 50%); top: 100%; transform: translate(-50%, -50%) rotate(45deg); width: 10px; height: 10px; background: rgba(15,29,50,0.97); border-right: 1px solid var(--sg-border-2); border-bottom: 1px solid var(--sg-border-2); }
.sg-tip[data-placement="below"]::after { top: 0; border-right: 0; border-bottom: 0; border-left: 1px solid var(--sg-border-2); border-top: 1px solid var(--sg-border-2); }
.sg-tip-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.sg-tip-state { font-weight: 700; font-size: 13px; color: #fff; }
.sg-tip-code { font-family: var(--sg-mono); font-size: 10px; color: rgba(255,255,255,0.4); }
.sg-tip-row { font-size: 11px; color: rgba(255,255,255,0.6); display: flex; justify-content: space-between; padding: 2px 0; }
.sg-tip-row b { color: #fff; font-weight: 600; }
.sg-tip-cases { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--sg-border); font-size: 11px; }

/* Severity pills */
.sg-sev-pill { display: inline-block; font-family: var(--sg-mono); font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.06em; text-transform: uppercase; }
.sg-sev-low { background: var(--sg-sev-low-bg); color: var(--sg-sev-low); }
.sg-sev-medium { background: var(--sg-sev-med-bg); color: var(--sg-sev-med); }
.sg-sev-high { background: var(--sg-sev-high-bg); color: var(--sg-sev-high); }
.sg-sev-career-ending { background: var(--sg-sev-career-bg); color: var(--sg-sev-career); }

/* Rail */
.sg-rail { padding: 20px 22px; display: flex; flex-direction: column; overflow: hidden; }
.sg-rail-tabs { display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid var(--sg-border); padding-bottom: 10px; }
.sg-rail-tab { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); padding: 6px 10px; border-radius: 7px; cursor: pointer; letter-spacing: 0.04em; text-transform: uppercase; transition: all .15s; }
.sg-rail-tab:hover { color: #fff; }
.sg-rail-tab.active { background: rgba(0,102,255,0.1); color: #fff; }
.sg-rail-scroll { overflow-y: auto; max-height: 540px; padding-right: 4px; }
.sg-rail-scroll::-webkit-scrollbar { width: 4px; }
.sg-rail-scroll::-webkit-scrollbar-track { background: transparent; }
.sg-rail-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

.sg-case-row { padding: 12px 0; border-bottom: 1px solid var(--sg-border); cursor: pointer; transition: background .15s; position: relative; }
.sg-case-row:hover, .sg-case-row.hi { background: rgba(255,255,255,0.025); }
.sg-case-row:last-child { border-bottom: 0; }
.sg-case-row.hi::before { content: ''; position: absolute; left: -22px; top: 0; bottom: 0; width: 2px; background: var(--sg-primary); }
.sg-case-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; gap: 8px; }
.sg-case-name { font-size: 13px; font-weight: 600; color: #fff; line-height: 1.3; }
.sg-case-amt { font-family: var(--sg-mono); font-size: 12px; font-weight: 700; letter-spacing: -0.01em; flex-shrink: 0; color: #fff; }
.sg-case-meta { font-size: 10px; color: rgba(255,255,255,0.4); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }
.sg-case-meta .sg-sep { color: rgba(255,255,255,0.12); }
.sg-case-meta .sg-stf { font-family: var(--sg-mono); font-weight: 600; color: rgba(255,255,255,0.6); padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,0.04); }

/* Legend bar */
.sg-legend-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; border-top: 1px solid var(--sg-border); background: rgba(5,11,20,0.4); font-size: 11px; color: rgba(255,255,255,0.4); flex-wrap: wrap; gap: 12px; }
.sg-legend-items { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
.sg-legend-item { display: flex; gap: 6px; align-items: center; }
.sg-legend-dot { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
.sg-legend-scale { display: flex; align-items: center; gap: 6px; }
.sg-scale-ring { border: 1.5px solid rgba(96,165,250,0.7); border-radius: 50%; background: rgba(96,165,250,0.25); display: inline-block; }

/* Drawer */
.sg-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 440px; max-width: 100vw; background: #0A1628; border-left: 1px solid var(--sg-border-2); box-shadow: -30px 0 60px -20px rgba(0,0,0,0.6); transform: translateX(100%); transition: transform .3s cubic-bezier(.2,.9,.3,1); z-index: 200; overflow-y: auto; padding: 28px; color: #fff; }
.sg-drawer.open { transform: translateX(0); }
.sg-drawer-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--sg-border); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.6); cursor: pointer; display: grid; place-items: center; font-size: 16px; }
.sg-drawer-close:hover { color: #fff; background: rgba(255,255,255,0.06); }
.sg-drawer-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.sg-drawer h3 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; margin-bottom: 8px; color: #fff; }
.sg-drawer-meta { font-size: 12px; color: rgba(255,255,255,0.4); display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.sg-section-title { font-family: var(--sg-mono); font-size: 10px; letter-spacing: 0.12em; color: var(--sg-primary); text-transform: uppercase; font-weight: 600; margin: 22px 0 8px; }
.sg-drawer p { font-size: 13.5px; color: rgba(255,255,255,0.75); line-height: 1.55; }
.sg-bignum { display: flex; align-items: baseline; gap: 8px; padding: 16px; margin: 16px 0; background: rgba(0,102,255,0.05); border: 1px solid rgba(0,102,255,0.15); border-radius: 12px; }
.sg-bignum .sg-val { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; font-family: var(--sg-mono); color: #fff; }
.sg-bignum .sg-lbl { font-size: 11px; color: rgba(255,255,255,0.4); font-family: var(--sg-mono); text-transform: uppercase; letter-spacing: 0.08em; }
.sg-kvgrid { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; font-size: 12px; }
.sg-kvgrid .sg-k { color: rgba(255,255,255,0.4); font-family: var(--sg-mono); font-size: 11px; letter-spacing: 0.04em; }
.sg-kvgrid .sg-v { color: #fff; }
.sg-taglist { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.sg-tagchip { font-family: var(--sg-mono); font-size: 10px; padding: 3px 7px; border-radius: 5px; background: rgba(255,255,255,0.04); border: 1px solid var(--sg-border); color: rgba(255,255,255,0.6); }
.sg-cta { margin-top: 20px; display: inline-flex; gap: 6px; align-items: center; background: var(--sg-primary); color: #fff; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; transition: background .15s; }
.sg-cta:hover { background: #004ACC; }
.sg-drawer-bd { position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity .3s; }
.sg-drawer-bd.open { opacity: 1; pointer-events: auto; }

/* Below sections */
.sg-below { padding: 0 0 80px; }
.sg-two-col { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; }
.sg-panel { background: rgba(10,22,40,0.55); border: 1px solid var(--sg-border); border-radius: 18px; padding: 24px; }
.sg-panel-h { font-size: 16px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; color: #fff; }
.sg-panel-h::before { content: ''; width: 3px; height: 14px; background: var(--sg-primary); border-radius: 2px; }
.sg-panel-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }

.sg-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 12px; }
.sg-bar-label { width: 130px; flex-shrink: 0; color: rgba(255,255,255,0.6); text-align: right; font-weight: 500; }
.sg-bar-track { flex: 1; height: 26px; background: rgba(255,255,255,0.02); border-radius: 7px; overflow: hidden; position: relative; }
.sg-bar-fill { height: 100%; border-radius: 7px; display: flex; align-items: center; padding: 0 10px; font-family: var(--sg-mono); font-size: 11px; font-weight: 700; color: #fff; min-width: 36px; transition: width .6s cubic-bezier(.2,.9,.3,1); }

.sg-esc-svg { width: 100%; height: 180px; }

/* Responsive */
@media (max-width: 1180px) {
  .sg-hero-grid { grid-template-columns: 1fr; gap: 24px; align-items: stretch; }
  .sg-court-pulse { max-width: 480px; }
  .sg-title { font-size: 56px; }
  .sg-kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .sg-kpi:nth-child(2) { border-right: 0; }
  .sg-kpi:nth-child(1), .sg-kpi:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.03); }
  .sg-map-body { grid-template-columns: 1fr; }
  .sg-map-stage { border-right: 0; border-bottom: 1px solid var(--sg-border); min-height: 480px; }
  .sg-two-col { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .sg-title { font-size: 42px; gap: 0 10px; }
  .sg-wrap { padding: 0 20px; }
  .sg-kpi-strip { grid-template-columns: 1fr; }
  .sg-kpi { border-right: 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .sg-drawer { width: 100vw; padding: 20px; }
}
`;
