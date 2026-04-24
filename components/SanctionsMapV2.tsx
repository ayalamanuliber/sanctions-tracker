"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import sanctionsRaw from "@/data/sanctions.json";
import metaRaw from "@/data/meta.json";

const META = metaRaw as unknown as {
  total_cases: number;
  us_cases: number;
  by_country: Record<string, number>;
  pace_weeks: Array<{ week: string; count: number }>;
  by_month: Record<string, number>;
  largest_single_sanction: number;
  severity_counts: Record<string, number>;
  last_updated: string;
};

interface Case {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: string;
  state: string;
  country: string;
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

// All cases (US + international)
const ALL_CASES = sanctionsRaw as unknown as Case[];
// US-only for the map (primary view)
const US_CASES = ALL_CASES.filter((c) => c.country === "US" && c.state);

// Compatibility shim with old SX shape: cases=US cases, byState=meta.by_state
const SX = {
  cases: US_CASES,
  byState: (metaRaw as unknown as { by_state: StateEntry[] }).by_state,
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

interface Props {
  onStateClick?: (stateCode: string) => void;
}

export default function SanctionsMapV2({ onStateClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [activeSev, setActiveSev] = useState<string>("all");
  const [railTab, setRailTab] = useState<"cases" | "states">("cases");
  const [railSort, setRailSort] = useState<"amount" | "date">("amount");
  const [focusState, setFocusState] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [scope, setScope] = useState<"us" | "world">("us");
  const [requestCountry, setRequestCountry] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [hoverCaseId, setHoverCaseId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Refs so d3 closures read the current value (not the one captured at setup time)
  const activeSevRef = useRef(activeSev);
  const hoverCaseIdRef = useRef(hoverCaseId);
  const focusStateRef = useRef(focusState);
  useEffect(() => { activeSevRef.current = activeSev; }, [activeSev]);
  useEffect(() => { hoverCaseIdRef.current = hoverCaseId; }, [hoverCaseId]);
  useEffect(() => { focusStateRef.current = focusState; }, [focusState]);

  const filteredCases = useMemo(() => {
    let out = SX.cases.filter((c) => activeSev === "all" || c.severity === activeSev);
    if (focusState) out = out.filter((c) => c.state === focusState);
    if (railSort === "amount") {
      out = [...out].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else {
      out = [...out].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }
    return out;
  }, [activeSev, focusState, railSort]);

  const circuits = useMemo(() => {
    const set = new Set<string>();
    SX.cases.forEach((c) => { if (c.circuit) set.add(c.circuit); });
    return set.size;
  }, []);

  // d3 map setup
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
        const gZoom = svg.select<SVGGElement>("#smv2-g-zoom");
        const gStates = svg.select<SVGGElement>("#smv2-g-states");
        const gPins = svg.select<SVGGElement>("#smv2-g-pins");

        // Zoom + pan behavior — applied to the wrapper group so tooltip positioning
        // can still use getBoundingClientRect() on individual pins.
        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .translateExtent([[-100, -100], [1060, 700]])
          .on("zoom", (event) => {
            gZoom.attr("transform", event.transform.toString());
            setZoomLevel(event.transform.k);
          });
        svg.call(zoomBehavior).on("dblclick.zoom", null);
        zoomBehaviorRef.current = zoomBehavior;

        // Hard hide the tooltip on ANY movement off the map stage (fixes sticky-tip bug)
        svg.on("mouseleave", () => { setHoverCaseId(null); hideTip(); });
        svg.on("mousemove", (event: MouseEvent) => {
          // If the cursor is over a <path> (state) or empty space, kill the tip
          const target = event.target as Element | null;
          if (target && target.tagName === "path") { hideTip(); }
        });

        gStates.selectAll("*").remove();
        for (const feat of statesFeat.features) {
          const fips = String((feat as unknown as { id: string }).id);
          const code = FIPS_TO_STATE[fips];
          const hasCases = !!SX.byState.find((s) => s.state === code);
          gStates
            .append("path")
            .attr("d", pathGen(feat) || "")
            .attr("class", "smv2-state" + (hasCases ? " has-cases" : ""))
            .attr("data-state", code || "")
            .on("click", (event: MouseEvent) => {
              event.stopPropagation();
              if (hasCases && code) {
                // In-map: focus the rail on this state's cases
                setFocusState(code);
                setRailTab("cases");
              }
            });

          // State abbreviation label (rendered always; CSS opacity toggles visibility)
          if (code) {
            const [lx, ly] = pathGen.centroid(feat) as [number, number];
            if (!isNaN(lx) && !isNaN(ly)) {
              gStates
                .append("text")
                .attr("x", lx)
                .attr("y", ly)
                .attr("class", "smv2-state-label" + (hasCases ? " has-cases" : ""))
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .text(code)
                .attr("pointer-events", "none");
            }
          }
        }

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
              const currentSev = activeSevRef.current;
              if (currentSev !== "all" && c.severity !== currentSev) return;
              // When focused on a state, dim pins outside it (don't drop — user sees others muted)
              const dimmed = focusStateRef.current && c.state !== focusStateRef.current;
              const n = list.length;
              let x = cx, y = cy;
              if (n > 1) {
                const ang = (i / n) * Math.PI * 2;
                x += Math.cos(ang) * 8;
                y += Math.sin(ang) * 8;
              }
              const r = pinR(c);
              const color = SEV_COLOR[c.severity] || "#3B82F6";

              const g = gPins.append("g")
                .attr("class", "smv2-pin-g" + (hoverCaseIdRef.current === c.id ? " hi" : "") + (dimmed ? " dim" : ""))
                .attr("transform", `translate(${x},${y})`)
                .attr("data-case-id", c.id);

              const vis = g.append("g").attr("class", "smv2-pin-visual");

              // Pulse ONLY on career-ending (reduces paint cost + focuses attention)
              if (c.severity === "career-ending") {
                vis.append("circle")
                  .attr("class", "smv2-pulse-ring")
                  .attr("r", r)
                  .attr("stroke", color)
                  .attr("stroke-width", 1.2)
                  .attr("fill", "none");
              }

              vis.append("circle")
                .attr("r", r)
                .attr("class", "smv2-pin-ring")
                .attr("stroke", color)
                .attr("stroke-width", 1.8)
                .attr("fill", "none");
              vis.append("circle")
                .attr("r", Math.max(2, r * 0.35))
                .attr("fill", color);
              // Glow blur ONLY on career-ending + high (blur filter is the perf killer with 900+ pins)
              if (c.severity === "career-ending" || c.severity === "high") {
                vis.insert("circle", ":first-child")
                  .attr("r", r + 2)
                  .attr("class", "smv2-pin-glow")
                  .attr("fill", color);
              }

              g.append("circle")
                .attr("class", "smv2-pin-hit")
                .attr("r", Math.max(r + 4, 9));

              g.on("mouseenter", () => {
                setHoverCaseId(c.id);
                const node = g.node() as SVGGElement | null;
                if (node) {
                  const b = node.getBoundingClientRect();
                  showTip(c, b.left + b.width / 2, b.top + b.height / 2);
                }
              });
              g.on("mouseleave", () => { setHoverCaseId(null); hideTip(); });
              g.on("click", (event: MouseEvent) => {
                event.stopPropagation();
                setSelectedCase(c);
              });
            });
          }
        };

        redrawPins();
        (svgRef.current as unknown as { __redrawPins?: () => void }).__redrawPins = redrawPins;
      } catch (err) {
        console.error("Map load failed", err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const redraw = (svgRef.current as unknown as { __redrawPins?: () => void })?.__redrawPins;
    if (redraw) redraw();
  }, [activeSev, hoverCaseId, focusState]);

  // Apply focus-state highlighting on state paths (CSS class)
  useEffect(() => {
    if (!svgRef.current) return;
    const nodes = svgRef.current.querySelectorAll<SVGPathElement>(".smv2-state");
    nodes.forEach((n) => {
      n.classList.toggle("focused", n.getAttribute("data-state") === focusState);
    });
  }, [focusState]);

  // Toggle state labels via class on SVG
  useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.classList.toggle("show-labels", showLabels);
  }, [showLabels]);

  function showTip(c: Case, px: number, py: number) {
    const tip = tipRef.current;
    if (!tip) return;
    tip.innerHTML = `
      <div class="smv2-tip-head">
        <span class="smv2-tip-state">${STATE_NAMES[c.state] || c.state}</span>
        <span class="smv2-tip-code">${c.state}</span>
      </div>
      <div style="font-family: var(--font-serif); font-size:15px; font-weight:500; color:var(--text-100); letter-spacing:-0.015em; margin-bottom:6px; line-height:1.25;">${c.case_name}</div>
      <div class="smv2-tip-row"><span>Court</span><b>${c.court}</b></div>
      <div class="smv2-tip-row"><span>Sanction</span><b>${c.amount_display}</b></div>
      <div class="smv2-tip-row"><span>Date</span><b>${fmtDate(c.date)}</b></div>
      <div class="smv2-tip-foot">
        <span class="smv2-sev-pill smv2-sev-${c.severity}">${c.severity.replace("-", " ")}</span>
        <span style="color:var(--text-500); margin-left:8px; font-size:10px; font-family: var(--font-mono); letter-spacing: 0.08em;">${c.ai_tool_used}</span>
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
      tip.style.setProperty("--smv2-tx", tx);
      tip.style.setProperty("--smv2-ty", ty);
      tip.style.setProperty("--smv2-arrow-x", arrowX + "%");
      tip.setAttribute("data-placement", placement);
    });
  }
  function hideTip() {
    if (tipRef.current) tipRef.current.classList.remove("show");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedCase(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const order: Record<string, number> = { low: 1, medium: 2, high: 3, "career-ending": 4 };

  return (
    <section id="map" className="section alt smv2-root">
      <div className="wrap">
        <div className="section-head blue" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div className="section-label blue">
              <span className="tick blue"></span>
              Credibility · Proof
            </div>
            <h2 className="section-heading">
              This is <span className="blue-em">real</span>. Here's where.
            </h2>
            <p className="section-sub">
              Every documented AI-hallucination sanction across US courts, plotted in real time. Pin size = sanction amount. Pin color = severity. Click any pin for the full case.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "flex-start", flexShrink: 0 }}>
            {/* Scope toggle US / World */}
            <div style={{ display: "inline-flex", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setScope("us")}
                style={{
                  padding: "8px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  background: scope === "us" ? "var(--bg-card)" : "transparent",
                  border: "none",
                  borderRight: "1px solid var(--border-soft)",
                  color: scope === "us" ? "var(--text-100)" : "var(--text-500)",
                }}
              >
                US · {META.us_cases}
              </button>
              <button
                onClick={() => setScope("world")}
                style={{
                  padding: "8px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  background: scope === "world" ? "var(--bg-card)" : "transparent",
                  border: "none",
                  color: scope === "world" ? "var(--text-100)" : "var(--text-500)",
                }}
              >
                Worldwide · {META.total_cases}
              </button>
            </div>
            <a
              href="#assessment"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-300)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "10px 16px",
                border: "1px solid var(--border)",
                background: "transparent",
                transition: "all 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-100)"; e.currentTarget.style.borderColor = "var(--text-500)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-300)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              Skip to assessment →
            </a>
          </div>
        </div>

        {/* Pace strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--border)",
            border: "1px solid var(--border)",
            marginBottom: "20px",
          }}
          className="smv2-pace"
        >
          {(() => {
            const weeks = META.pace_weeks || [];
            const last = weeks[weeks.length - 1]?.count ?? 0;
            const thisMonth = Object.entries(META.by_month || {}).sort().slice(-1)[0]?.[1] ?? 0;
            const peakDaySev = META.severity_counts || {};
            const dangerous = (peakDaySev["career-ending"] || 0) + (peakDaySev["high"] || 0);
            // US-only largest when US scope; global otherwise
            const scopedLargest = scope === "us"
              ? Math.max(0, ...ALL_CASES.filter((c) => c.country === "US" && c.amount).map((c) => c.amount || 0))
              : (META.largest_single_sanction || 0);
            const scopedLargestCase = scope === "us"
              ? ALL_CASES.filter((c) => c.country === "US").sort((a, b) => (b.amount || 0) - (a.amount || 0))[0]
              : ALL_CASES.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
            const scopedNote = scopedLargestCase ? `${scopedLargestCase.case_name.slice(0, 28)}${scopedLargestCase.case_name.length > 28 ? "…" : ""}` : "single ruling";
            return [
              { label: "This week", value: last, note: weeks[weeks.length - 1]?.week || "" },
              { label: "Latest month", value: thisMonth, note: Object.keys(META.by_month || {}).sort().slice(-1)[0] || "" },
              { label: "High-risk cases", value: dangerous, note: "career-ending + high" },
              { label: "Largest fine", value: "$" + (scopedLargest / 1000).toFixed(1) + "K", note: scopedNote },
            ];
          })().map((item, i) => (
            <div key={i} style={{ background: "var(--bg-card)", padding: "16px 18px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, color: "var(--text-500)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "6px" }}>
                {item.label}
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: 500, color: "var(--text-100)", letterSpacing: "-0.025em", fontStyle: "italic", lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, color: "var(--text-600)", letterSpacing: "0.1em", marginTop: "6px" }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>

        {/* Conditional: US map OR Worldwide teaser */}
        {scope === "world" ? (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              padding: "56px 48px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "48px", alignItems: "center" }} className="smv2-world-grid">
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--amber)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Worldwide · Coming soon
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(24px, 3vw, 34px)",
                    fontWeight: 500,
                    color: "var(--text-100)",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.15,
                    marginBottom: "18px",
                  }}
                >
                  We&rsquo;re tracking <em style={{ color: "var(--amber)" }}>{META.total_cases - META.us_cases}</em> international cases across <em style={{ color: "var(--blue)" }}>{Object.keys(META.by_country || {}).filter(k => k !== "US" && k !== "OTHER" && k !== "UNKNOWN").length}</em> countries.
                </h3>
                <p style={{ color: "var(--text-400)", fontSize: "14px", lineHeight: 1.7, fontWeight: 300, marginBottom: "20px" }}>
                  The interactive globe view is rolling out next. Top non-US jurisdictions by case count:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {Object.entries(META.by_country).filter(([k]) => k !== "US" && k !== "OTHER" && k !== "UNKNOWN").slice(0, 8).map(([code, n]) => (
                    <div key={code} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "11px", padding: "8px 12px", border: "1px solid var(--border-soft)", background: "var(--bg-subtle)" }}>
                      <span style={{ color: "var(--text-300)", letterSpacing: "0.1em" }}>{code}</span>
                      <span style={{ color: "var(--text-500)" }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-500)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Request your country
                </div>
                <p style={{ color: "var(--text-400)", fontSize: "13px", lineHeight: 1.6, fontWeight: 300, marginBottom: "16px" }}>
                  We&rsquo;re prioritizing coverage by demand. Tell us your jurisdiction and we&rsquo;ll notify you when it&rsquo;s mapped.
                </p>
                {requestSent ? (
                  <div style={{ padding: "16px 20px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.06)", color: "#22c55e", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    ✓ On the list
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!requestCountry.trim() || !requestEmail.trim()) return;
                      try {
                        const arr = JSON.parse(localStorage.getItem("sv_country_reqs") || "[]");
                        arr.push({ country: requestCountry, email: requestEmail, at: new Date().toISOString() });
                        localStorage.setItem("sv_country_reqs", JSON.stringify(arr));
                      } catch {}
                      setRequestSent(true);
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                  >
                    <input
                      type="text"
                      placeholder="Country or jurisdiction"
                      value={requestCountry}
                      onChange={(e) => setRequestCountry(e.target.value)}
                      required
                      style={{
                        padding: "12px 14px",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        color: "var(--text-100)",
                        fontFamily: "var(--font-main)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <input
                      type="email"
                      placeholder="attorney@firm.com"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      required
                      style={{
                        padding: "12px 14px",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        color: "var(--text-100)",
                        fontFamily: "var(--font-main)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      className="hero-btn-blue"
                      style={{ padding: "12px 20px", fontSize: "11px", cursor: "pointer", border: "none" }}
                    >
                      Notify me
                    </button>
                  </form>
                )}
              </div>
            </div>
            <style>{`
              @media (max-width: 880px) { .smv2-world-grid { grid-template-columns: 1fr !important; } }
            `}</style>
          </div>
        ) : (
          <div className="smv2-card">
          {/* Map header: severity chips */}
          <div className="smv2-head">
            <div className="smv2-head-left">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-500)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                <span style={{ display: "inline-block", width: "5px", height: "5px", background: "var(--blue)", marginRight: "8px", verticalAlign: "middle" }}></span>
                {SX.cases.length} cases · {SX.byState.length} states · {circuits} circuits
              </div>
            </div>
            <div className="smv2-chips">
              <button
                className={`smv2-chip ${showLabels ? "active" : ""}`}
                onClick={() => setShowLabels((v) => !v)}
                style={{ marginRight: "8px" }}
              >
                {showLabels ? "Labels: On" : "Labels"}
              </button>
              {(["all", "career-ending", "high", "medium", "low"] as const).map((sev) => (
                <button
                  key={sev}
                  className={`smv2-chip ${activeSev === sev ? "active" : ""}`}
                  onClick={() => setActiveSev(sev)}
                >
                  {sev !== "all" && (
                    <span
                      className="smv2-chip-sw"
                      style={{
                        background:
                          sev === "career-ending" ? "#FF5E1A" :
                          sev === "high" ? "#3B82F6" :
                          sev === "medium" ? "#EAB308" :
                          "#84CC16",
                      }}
                    ></span>
                  )}
                  {sev === "all" ? "All" : sev === "career-ending" ? "Career" : sev[0].toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Map body */}
          <div className="smv2-body">
            <div className="smv2-stage">
              <div className="smv2-compass">
                <div><span className="num">{SX.cases.length}</span> <span>rulings</span></div>
                <div><span className="num">{SX.byState.length}</span> <span>states</span></div>
                <div><span className="num">{circuits}</span> <span>circuits</span></div>
              </div>
              <svg ref={svgRef} viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet">
                <g id="smv2-g-zoom">
                  <g id="smv2-g-states"></g>
                  <g id="smv2-g-pins"></g>
                </g>
              </svg>
              <div className="smv2-coords">ALBERS USA · 38.5°N, 96.5°W</div>
              <div className="smv2-zoom-ctrl">
                <button
                  aria-label="Zoom in"
                  onClick={() => {
                    const svg = svgRef.current;
                    const zb = zoomBehaviorRef.current;
                    if (svg && zb) d3.select(svg).transition().duration(220).call(zb.scaleBy, 1.6);
                  }}
                >+</button>
                <button
                  aria-label="Zoom out"
                  onClick={() => {
                    const svg = svgRef.current;
                    const zb = zoomBehaviorRef.current;
                    if (svg && zb) d3.select(svg).transition().duration(220).call(zb.scaleBy, 0.625);
                  }}
                >−</button>
                <button
                  aria-label="Reset zoom"
                  onClick={() => {
                    const svg = svgRef.current;
                    const zb = zoomBehaviorRef.current;
                    if (svg && zb) d3.select(svg).transition().duration(260).call(zb.transform, d3.zoomIdentity);
                  }}
                >⟲</button>
                <span className="smv2-zoom-level">{zoomLevel.toFixed(1)}×</span>
              </div>
            </div>

            <aside className="smv2-rail">
              <div className="smv2-rail-tabs">
                <button className={`smv2-rail-tab ${railTab === "cases" ? "active" : ""}`} onClick={() => setRailTab("cases")}>
                  Cases <span>({filteredCases.length})</span>
                </button>
                <button className={`smv2-rail-tab ${railTab === "states" ? "active" : ""}`} onClick={() => setRailTab("states")}>
                  By State
                </button>
              </div>
              {/* Sort toggle — only meaningful when viewing cases */}
              {railTab === "cases" && (
                <div style={{ display: "flex", gap: "4px", marginBottom: "12px", fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  <span style={{ color: "var(--text-600)", padding: "5px 8px 5px 0" }}>Sort</span>
                  <button
                    onClick={() => setRailSort("amount")}
                    style={{
                      padding: "5px 10px",
                      background: railSort === "amount" ? "var(--bg-subtle)" : "transparent",
                      border: "1px solid " + (railSort === "amount" ? "var(--border)" : "transparent"),
                      color: railSort === "amount" ? "var(--text-100)" : "var(--text-500)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      fontWeight: 700,
                      letterSpacing: "inherit",
                      textTransform: "inherit",
                    }}
                  >
                    By Fine
                  </button>
                  <button
                    onClick={() => setRailSort("date")}
                    style={{
                      padding: "5px 10px",
                      background: railSort === "date" ? "var(--bg-subtle)" : "transparent",
                      border: "1px solid " + (railSort === "date" ? "var(--border)" : "transparent"),
                      color: railSort === "date" ? "var(--text-100)" : "var(--text-500)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      fontWeight: 700,
                      letterSpacing: "inherit",
                      textTransform: "inherit",
                    }}
                  >
                    By Date
                  </button>
                </div>
              )}
              {/* Focus banner — shown when a state was clicked on the map */}
              {focusState && railTab === "cases" && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "8px 12px",
                    border: "1px solid rgba(0,102,255,0.35)",
                    background: "rgba(0,102,255,0.08)",
                    borderLeft: "2px solid var(--blue)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--blue)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                    {STATE_NAMES[focusState] || focusState}
                  </span>
                  <button
                    onClick={() => setFocusState(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-400)",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                    }}
                  >
                    Clear ✕
                  </button>
                </div>
              )}
              <div className="smv2-rail-scroll">
                {railTab === "cases" ? (
                  filteredCases.map((c) => (
                    <div
                      key={c.id}
                      className={`smv2-case-row ${hoverCaseId === c.id ? "hi" : ""}`}
                      onMouseEnter={() => setHoverCaseId(c.id)}
                      onMouseLeave={() => setHoverCaseId(null)}
                      onClick={() => setSelectedCase(c)}
                    >
                      <div className="smv2-case-top">
                        <div className="smv2-case-name">{c.case_name}</div>
                        <div className="smv2-case-amt">{c.amount ? fmt(c.amount) : "—"}</div>
                      </div>
                      <div className="smv2-case-meta">
                        <span className="smv2-stf">{c.state}</span>
                        <span>{c.court}</span>
                        <span className="smv2-sep">·</span>
                        <span>{fmtDate(c.date)}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className={`smv2-sev-pill smv2-sev-${c.severity}`}>{c.severity.replace("-", " ")}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-500)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                          {c.ai_tool_used.length > 28 ? c.ai_tool_used.slice(0, 28) + "…" : c.ai_tool_used}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  SX.byState.map((s) => {
                    const maxSev = s.cases.reduce((acc, c) => (order[c.severity] > order[acc] ? c.severity : acc), "low");
                    return (
                      <div key={s.state} className="smv2-case-row" onClick={() => onStateClick && onStateClick(s.state)}>
                        <div className="smv2-case-top">
                          <div className="smv2-case-name">{STATE_NAMES[s.state]}</div>
                          <div className="smv2-case-amt">{fmt(s.total)}</div>
                        </div>
                        <div className="smv2-case-meta">
                          <span className="smv2-stf">{s.state}</span>
                          <span>{s.count} case{s.count > 1 ? "s" : ""}</span>
                          <span className="smv2-sep">·</span>
                          <span>worst</span>
                          <span className={`smv2-sev-pill smv2-sev-${maxSev}`}>{maxSev.replace("-", " ")}</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-500)", lineHeight: 1.5, marginTop: "4px" }}>
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

          {/* Legend bar */}
          <div className="smv2-legend">
            <div className="smv2-legend-items">
              <span className="smv2-legend-label">Severity</span>
              <div className="smv2-legend-item"><span className="smv2-legend-dot" style={{ background: "#FF5E1A", color: "#FF5E1A" }}></span>Career-ending</div>
              <div className="smv2-legend-item"><span className="smv2-legend-dot" style={{ background: "#3B82F6", color: "#3B82F6" }}></span>High</div>
              <div className="smv2-legend-item"><span className="smv2-legend-dot" style={{ background: "#EAB308", color: "#EAB308" }}></span>Medium</div>
              <div className="smv2-legend-item"><span className="smv2-legend-dot" style={{ background: "#84CC16", color: "#84CC16" }}></span>Low</div>
            </div>
            <div className="smv2-legend-scale">
              <span className="smv2-legend-label">Size = amount</span>
              <span className="smv2-scale-ring" style={{ width: "6px", height: "6px" }}></span>
              <span className="smv2-scale-ring" style={{ width: "11px", height: "11px" }}></span>
              <span className="smv2-scale-ring" style={{ width: "16px", height: "16px" }}></span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-500)", fontSize: "10px", letterSpacing: "0.08em" }}>$0 → $110K</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Drawer */}
      <div className={`smv2-drawer-bd ${selectedCase ? "open" : ""}`} onClick={() => setSelectedCase(null)}></div>
      <div className={`smv2-drawer ${selectedCase ? "open" : ""}`}>
        {selectedCase && (
          <>
            <div className="smv2-drawer-head">
              <div>
                <span className={`smv2-sev-pill smv2-sev-${selectedCase.severity}`}>{selectedCase.severity.replace("-", " ")}</span>
                <h3 style={{ marginTop: "12px" }}>{selectedCase.case_name}</h3>
              </div>
              <button className="smv2-drawer-close" onClick={() => setSelectedCase(null)} aria-label="Close">✕</button>
            </div>
            <div className="smv2-drawer-meta">
              <span>{selectedCase.court}</span>
              <span>·</span>
              <span>{STATE_NAMES[selectedCase.state]}</span>
              <span>·</span>
              <span>{fmtDate(selectedCase.date)}</span>
              <span>·</span>
              <span>Judge {selectedCase.judge}</span>
            </div>
            <div
              className="smv2-bignum"
              style={{ borderLeftColor: SEV_COLOR[selectedCase.severity] || "var(--blue)" }}
            >
              <div
                className="smv2-big-val"
                style={{
                  color: selectedCase.severity === "career-ending" ? "#FF5E1A" : selectedCase.amount ? "var(--text-100)" : "var(--text-400)",
                  fontSize: selectedCase.amount ? "42px" : "24px",
                }}
              >
                {selectedCase.amount_display}
              </div>
              {selectedCase.amount != null && selectedCase.amount > 0 && <div className="smv2-big-lbl">monetary sanction</div>}
            </div>

            <div className="smv2-drawer-section-title">Summary</div>
            <p className="smv2-drawer-body">{selectedCase.summary}</p>

            <div className="smv2-drawer-section-title">Case Details</div>
            <div className="smv2-kvgrid">
              <div className="k">AI Tool</div><div className="v">{selectedCase.ai_tool_used}</div>
              <div className="k">Sanction Type</div><div className="v">{selectedCase.sanction_types.join(", ")}</div>
              <div className="k">Jurisdiction</div><div className="v">{selectedCase.jurisdiction}{selectedCase.circuit ? " · " + selectedCase.circuit : ""}</div>
              <div className="k">Source</div><div className="v">{selectedCase.source_name}</div>
            </div>

            <div className="smv2-drawer-section-title">Tags</div>
            <div className="smv2-taglist">
              {selectedCase.tags.map((t) => (
                <span key={t} className="smv2-tagchip">#{t}</span>
              ))}
            </div>

            <a className="smv2-drawer-cta" href={selectedCase.source_url} target="_blank" rel="noopener">
              Read Source <span className="arrow-line"></span>
            </a>
          </>
        )}
      </div>

      <div className="smv2-tip" ref={tipRef}></div>

      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* Map card — aivortex chrome */
.smv2-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  overflow: hidden;
  position: relative;
}

/* Map head: chip row */
.smv2-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--border-soft);
  gap: 16px; flex-wrap: wrap;
}
.smv2-head-left { flex: 1; min-width: 240px; }
.smv2-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.smv2-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase;
  padding: 7px 12px; background: transparent;
  border: 1px solid var(--border);
  color: var(--text-500); cursor: pointer; transition: all 0.15s;
}
.smv2-chip:hover { color: var(--text-100); border-color: var(--text-500); }
.smv2-chip.active { background: var(--bg-subtle); border-color: var(--blue); color: var(--text-100); }
.smv2-chip-sw { width: 7px; height: 7px; display: inline-block; }

/* Body: 2-col */
.smv2-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  min-height: 620px;
}
.smv2-stage {
  position: relative;
  border-right: 1px solid var(--border-soft);
  background:
    radial-gradient(circle at 50% 55%, rgba(0,102,255,0.08), transparent 60%),
    linear-gradient(180deg, rgba(10,10,10,0.4), transparent 50%);
  overflow: hidden;
}
.smv2-stage svg { width: 100%; height: 100%; display: block; cursor: grab; }
.smv2-stage svg:active { cursor: grabbing; }

/* Zoom controls */
.smv2-zoom-ctrl {
  position: absolute; top: 16px; right: 16px;
  display: flex; flex-direction: column; gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}
.smv2-zoom-ctrl button {
  width: 32px; height: 32px;
  background: var(--bg-card); border: none; color: var(--text-300);
  font-family: var(--font-mono); font-size: 16px; font-weight: 600;
  cursor: pointer; display: grid; place-items: center;
  transition: all 0.15s; padding: 0;
}
.smv2-zoom-ctrl button:hover { background: var(--bg-subtle); color: var(--text-100); }
.smv2-zoom-level {
  padding: 6px 0; text-align: center; background: var(--bg-card);
  font-family: var(--font-mono); font-size: 9px; font-weight: 700;
  color: var(--text-500); letter-spacing: 0.14em;
}
.smv2-state {
  fill: rgba(255,255,255,0.022);
  stroke: rgba(255,255,255,0.08);
  stroke-width: 0.6;
  transition: fill 0.18s, stroke 0.18s;
}
.smv2-state.has-cases {
  fill: rgba(0,102,255,0.06);
  stroke: rgba(0,102,255,0.25);
  cursor: pointer;
}
.smv2-state.hi { fill: rgba(0,102,255,0.14); stroke: rgba(0,102,255,0.5); }
.smv2-state.focused { fill: rgba(0,102,255,0.2); stroke: var(--blue); stroke-width: 1; }

/* State abbreviation labels — hidden by default, toggled via class on svg */
.smv2-state-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  fill: var(--text-500);
  letter-spacing: 0.1em;
  opacity: 0;
  transition: opacity 0.2s;
  text-transform: uppercase;
}
.smv2-state-label.has-cases { fill: var(--text-300); }
.smv2-stage svg.show-labels .smv2-state-label { opacity: 0.7; }
.smv2-stage svg.show-labels .smv2-state-label.has-cases { opacity: 1; }

/* Dimmed pins (when a state is focused, others fade) */
.smv2-pin-g.dim { opacity: 0.25; pointer-events: none; }

/* Pins */
.smv2-pin-g { cursor: pointer; }
.smv2-pin-g > * { pointer-events: none; }
.smv2-pin-g .smv2-pin-hit { pointer-events: all; fill: transparent; }
.smv2-pin-visual {
  transition: transform 0.18s cubic-bezier(.2,.9,.3,1);
  transform-box: fill-box; transform-origin: center;
}
.smv2-pin-g:hover .smv2-pin-visual,
.smv2-pin-g.hi .smv2-pin-visual { transform: scale(1.35); }
.smv2-pin-ring { fill: none; opacity: 0.75; }
.smv2-pin-glow { filter: blur(6px); opacity: 0.7; }
.smv2-pulse-ring {
  fill: none; transform-box: fill-box; transform-origin: center;
  animation: smv2-pulse 2.2s ease-out infinite;
}
@keyframes smv2-pulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(3.2); opacity: 0; }
}

.smv2-compass {
  position: absolute; top: 16px; left: 18px;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--text-600); letter-spacing: 0.18em; text-transform: uppercase;
  display: flex; flex-direction: column; gap: 5px;
}
.smv2-compass div { display: flex; gap: 10px; align-items: center; }
.smv2-compass .num { color: var(--text-100); font-weight: 700; }
.smv2-coords {
  position: absolute; bottom: 14px; right: 18px;
  font-family: var(--font-mono); font-size: 9px;
  color: var(--text-600); letter-spacing: 0.2em;
}

/* Severity pills */
.smv2-sev-pill {
  display: inline-block; font-family: var(--font-mono); font-size: 9px; font-weight: 700;
  padding: 3px 8px; letter-spacing: 0.22em; text-transform: uppercase;
  border: 1px solid transparent;
}
.smv2-sev-low { color: #84CC16; border-color: rgba(132,204,22,0.3); background: rgba(132,204,22,0.08); }
.smv2-sev-medium { color: #EAB308; border-color: rgba(234,179,8,0.3); background: rgba(234,179,8,0.08); }
.smv2-sev-high { color: #3B82F6; border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); }
.smv2-sev-career-ending { color: #FF5E1A; border-color: rgba(255,94,26,0.3); background: rgba(255,94,26,0.08); }

/* Tooltip */
.smv2-tip {
  position: fixed; z-index: 220; pointer-events: none;
  background: var(--bg-card); border: 1px solid var(--border);
  padding: 14px 16px; min-width: 240px; max-width: 320px;
  box-shadow: 0 24px 50px -12px rgba(0,0,0,0.8);
  left: 0; top: 0; opacity: 0;
  transform: translate(var(--smv2-tx, -50%), var(--smv2-ty, calc(-100% - 14px))) scale(0.96);
  transition: opacity 0.14s, transform 0.14s cubic-bezier(.2,.9,.3,1);
  color: var(--text-300);
  font-family: var(--font-main);
}
.smv2-tip.show {
  opacity: 1;
  transform: translate(var(--smv2-tx, -50%), var(--smv2-ty, calc(-100% - 14px))) scale(1);
}
.smv2-tip::after {
  content: ''; position: absolute;
  left: var(--smv2-arrow-x, 50%); top: 100%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 10px; height: 10px; background: var(--bg-card);
  border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.smv2-tip[data-placement="below"]::after {
  top: 0; border-right: 0; border-bottom: 0;
  border-left: 1px solid var(--border); border-top: 1px solid var(--border);
}
.smv2-tip-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.smv2-tip-state {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  color: var(--text-500); letter-spacing: 0.22em; text-transform: uppercase;
}
.smv2-tip-code {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  color: var(--blue); letter-spacing: 0.18em;
}
.smv2-tip-row {
  font-size: 11px; color: var(--text-400);
  display: flex; justify-content: space-between; padding: 2px 0;
  font-family: var(--font-mono); letter-spacing: 0.04em;
}
.smv2-tip-row b { color: var(--text-100); font-weight: 700; }
.smv2-tip-foot { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-soft); }

/* Rail */
.smv2-rail { padding: 18px 22px; display: flex; flex-direction: column; overflow: hidden; }
.smv2-rail-tabs {
  display: flex; gap: 4px; margin-bottom: 14px;
  border-bottom: 1px solid var(--border-soft);
  padding-bottom: 10px;
}
.smv2-rail-tab {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  color: var(--text-500); padding: 7px 12px;
  background: transparent; border: 1px solid transparent;
  cursor: pointer; letter-spacing: 0.22em; text-transform: uppercase;
  transition: all 0.15s;
}
.smv2-rail-tab:hover { color: var(--text-100); }
.smv2-rail-tab.active {
  background: var(--bg-subtle); border-color: var(--border);
  color: var(--text-100);
}
.smv2-rail-scroll {
  overflow-y: auto; max-height: 540px; padding-right: 4px;
}
.smv2-rail-scroll::-webkit-scrollbar { width: 4px; }
.smv2-rail-scroll::-webkit-scrollbar-track { background: transparent; }
.smv2-rail-scroll::-webkit-scrollbar-thumb { background: var(--border); }

.smv2-case-row {
  padding: 12px 0; border-bottom: 1px solid var(--border-soft);
  cursor: pointer; transition: background 0.15s; position: relative;
}
.smv2-case-row:hover, .smv2-case-row.hi { background: var(--bg-subtle); }
.smv2-case-row:last-child { border-bottom: 0; }
.smv2-case-row.hi::before {
  content: ''; position: absolute; left: -22px; top: 0; bottom: 0;
  width: 2px; background: var(--blue);
}
.smv2-case-top {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 4px; gap: 10px;
}
.smv2-case-name {
  font-family: var(--font-serif); font-size: 15px; font-weight: 500;
  color: var(--text-100); letter-spacing: -0.015em; line-height: 1.3;
}
.smv2-case-amt {
  font-family: var(--font-mono); font-size: 12px; font-weight: 700;
  color: var(--text-100); letter-spacing: 0.02em; flex-shrink: 0;
}
.smv2-case-meta {
  font-family: var(--font-mono); font-size: 10px; color: var(--text-500);
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  margin-bottom: 6px; letter-spacing: 0.06em;
}
.smv2-case-meta .smv2-sep { color: var(--text-600); }
.smv2-stf {
  font-family: var(--font-mono); font-weight: 700; color: var(--text-300);
  padding: 1px 6px; background: var(--bg-subtle);
  border: 1px solid var(--border-soft); letter-spacing: 0.12em;
}

/* Legend */
.smv2-legend {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; border-top: 1px solid var(--border-soft);
  flex-wrap: wrap; gap: 16px;
}
.smv2-legend-items, .smv2-legend-scale {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  font-family: var(--font-mono); font-size: 10px; color: var(--text-400);
  letter-spacing: 0.15em;
}
.smv2-legend-label {
  color: var(--text-600); letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700;
}
.smv2-legend-item { display: flex; gap: 6px; align-items: center; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; }
.smv2-legend-dot { width: 8px; height: 8px; display: inline-block; box-shadow: 0 0 8px currentColor; }
.smv2-scale-ring {
  border: 1.2px solid rgba(96,165,250,0.7); border-radius: 50%;
  background: rgba(96,165,250,0.2); display: inline-block;
}

/* Drawer */
.smv2-drawer-bd {
  position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.6);
  opacity: 0; pointer-events: none; transition: opacity 0.3s;
  backdrop-filter: blur(2px);
}
.smv2-drawer-bd.open { opacity: 1; pointer-events: auto; }
.smv2-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 480px; max-width: 100vw;
  background: var(--bg-card); border-left: 1px solid var(--border);
  box-shadow: -30px 0 60px -20px rgba(0,0,0,0.8);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(.2,.9,.3,1);
  z-index: 200; overflow-y: auto; padding: 36px 36px 48px;
  color: var(--text-300);
}
.smv2-drawer.open { transform: translateX(0); }
.smv2-drawer-close {
  width: 32px; height: 32px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text-500); cursor: pointer;
  display: grid; place-items: center; font-size: 16px;
  transition: all 0.15s;
}
.smv2-drawer-close:hover { color: var(--text-100); border-color: var(--text-500); }
.smv2-drawer-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 18px; gap: 16px;
}
.smv2-drawer h3 {
  font-family: var(--font-serif); font-size: 26px; font-weight: 500;
  color: var(--text-100); letter-spacing: -0.02em; line-height: 1.25;
  margin: 0;
}
.smv2-drawer-meta {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  color: var(--text-500); letter-spacing: 0.14em; text-transform: uppercase;
}
.smv2-drawer-section-title {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  color: var(--blue); letter-spacing: 0.22em; text-transform: uppercase;
  margin: 28px 0 10px;
}
.smv2-drawer-body {
  font-size: 14px; line-height: 1.7; color: var(--text-400); font-weight: 300;
}
.smv2-bignum {
  display: flex; align-items: baseline; gap: 10px;
  padding: 20px 22px; margin: 18px 0;
  background: var(--bg-subtle); border: 1px solid var(--border);
  border-left: 3px solid var(--blue);
}
.smv2-big-val {
  font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.035em;
  font-style: italic; line-height: 1;
}
.smv2-big-lbl {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  color: var(--text-500); letter-spacing: 0.22em; text-transform: uppercase;
}
.smv2-kvgrid {
  display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; font-size: 13px;
}
.smv2-kvgrid .k {
  color: var(--text-500); font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700;
}
.smv2-kvgrid .v { color: var(--text-300); font-weight: 400; }
.smv2-taglist { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.smv2-tagchip {
  font-family: var(--font-mono); font-size: 9px; padding: 4px 8px;
  background: var(--bg-subtle); border: 1px solid var(--border-soft);
  color: var(--text-400); letter-spacing: 0.12em; text-transform: uppercase;
}
.smv2-drawer-cta {
  display: inline-flex; align-items: center; gap: 12px; margin-top: 28px;
  padding: 14px 26px; background: var(--bone); color: var(--bg);
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none;
  border: 1px solid var(--bone); transition: all 0.2s;
}
.smv2-drawer-cta:hover { background: var(--white); border-color: var(--white); }
.smv2-drawer-cta .arrow-line {
  width: 20px; height: 1px; background: var(--bg); position: relative;
}
.smv2-drawer-cta .arrow-line::after {
  content: ''; position: absolute; right: -1px; top: -3px;
  width: 7px; height: 7px;
  border-top: 1px solid var(--bg); border-right: 1px solid var(--bg);
  transform: rotate(45deg);
}

/* Responsive */
@media (max-width: 1024px) {
  .smv2-body { grid-template-columns: 1fr; }
  .smv2-stage { border-right: 0; border-bottom: 1px solid var(--border-soft); min-height: 480px; }
  .smv2-rail { max-height: 520px; }
}
@media (max-width: 640px) {
  .smv2-head { padding: 14px 18px; }
  .smv2-legend { padding: 12px 18px; flex-direction: column; align-items: flex-start; }
  .smv2-drawer { width: 100vw; padding: 24px 20px 40px; }
}
`;
