"use client";

import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import casesData from "@/data/cases.json";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

interface CaseInfo {
  id: string;
  case_name: string;
  state: string;
}

interface TooltipInfo {
  state: string;
  name: string;
  count: number;
  cases: string[];
  x: number;
  y: number;
}

interface Props {
  onStateClick?: (stateCode: string) => void;
}

export default function SanctionsMap({ onStateClick }: Props) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const stateData = useMemo(() => {
    const map: Record<string, { count: number; cases: string[] }> = {};
    (casesData as CaseInfo[]).forEach((c) => {
      if (!map[c.state]) map[c.state] = { count: 0, cases: [] };
      map[c.state].count++;
      map[c.state].cases.push(c.case_name);
    });
    return map;
  }, []);

  const topJurisdictions = useMemo(() => {
    return Object.entries(stateData).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  }, [stateData]);

  const maxCount = topJurisdictions[0]?.[1].count ?? 1;

  function getFill(stateCode: string, isHovered: boolean): string {
    const count = stateData[stateCode]?.count ?? 0;
    if (count === 0) return isHovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)";
    if (count === 1) return isHovered ? "rgba(0,102,255,0.45)" : "rgba(0,102,255,0.3)";
    if (count === 2) return isHovered ? "rgba(0,102,255,0.7)" : "rgba(0,102,255,0.55)";
    return isHovered ? "rgba(0,102,255,1)" : "rgba(0,102,255,0.85)";
  }

  function handleMouseMove(e: React.MouseEvent, stateCode: string) {
    const container = (e.currentTarget as HTMLElement).closest(".map-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setHoveredState(stateCode);
    setTooltip({
      state: stateCode,
      name: STATE_NAMES[stateCode] ?? stateCode,
      count: stateData[stateCode]?.count ?? 0,
      cases: stateData[stateCode]?.cases ?? [],
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 12,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
    setHoveredState(null);
  }

  return (
    <section id="map" className="section alt">
      <div className="wrap">
        <div className="section-head blue">
          <div className="section-label blue">
            <span className="tick blue"></span>
            Jurisdiction Map
          </div>
          <h2 className="section-heading">
            Sanctions by <span className="blue-em">jurisdiction</span>.
          </h2>
          <p className="section-sub">
            Geographic distribution of AI-related court sanctions across the United States. Click a state to filter the case evidence below.
          </p>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "32px" }}>
          {/* Map */}
          <div className="map-container" style={{ position: "relative", background: "var(--bg)", border: "1px solid var(--border-soft)" }}>
            <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }} width={800} height={500} style={{ width: "100%", height: "auto" }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const fips = geo.id as string;
                    const stateCode = FIPS_TO_STATE[fips] ?? "";
                    const count = stateData[stateCode]?.count ?? 0;
                    const isHovered = hoveredState === stateCode;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFill(stateCode, isHovered)}
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none" },
                          pressed: { outline: "none" },
                        }}
                        onMouseMove={(e) => handleMouseMove(e, stateCode)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => {
                          if (count > 0 && onStateClick) onStateClick(stateCode);
                        }}
                        cursor={count > 0 ? "pointer" : "default"}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>

            {tooltip && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 50,
                  pointerEvents: "none",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  padding: "12px 16px",
                  boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)",
                  transform: "translate(-50%, -100%)",
                  left: tooltip.x,
                  top: tooltip.y,
                  minWidth: "180px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-100)",
                    letterSpacing: "-0.015em",
                    marginBottom: "4px",
                  }}
                >
                  {tooltip.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "var(--blue)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  {tooltip.count} {tooltip.count === 1 ? "case" : "cases"}
                </div>
                {tooltip.cases.length > 0 && (
                  <ul style={{ fontSize: "11px", color: "var(--text-400)", listStyle: "none", maxWidth: "240px" }}>
                    {tooltip.cases.map((c, i) => (
                      <li key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                        · {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "18px",
              marginTop: "24px",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-500)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <span>Cases</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }} /><span>0</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: "rgba(0,102,255,0.3)" }} /><span>1</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: "rgba(0,102,255,0.55)" }} /><span>2</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: "rgba(0,102,255,0.85)" }} /><span>3+</span>
            </div>
          </div>

          {/* Top Jurisdictions */}
          <div style={{ marginTop: "40px", paddingTop: "32px", borderTop: "1px solid var(--border-soft)" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-500)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: "18px",
              }}
            >
              Top Jurisdictions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topJurisdictions.map(([code, data]) => (
                <div key={code} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-300)",
                      width: "160px",
                      flexShrink: 0,
                      textAlign: "right",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {STATE_NAMES[code] ?? code}
                  </span>
                  <div style={{ flex: 1, height: "26px", background: "var(--bg-subtle)", border: "1px solid var(--border-soft)", position: "relative" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(data.count / maxCount) * 100}%`,
                        background:
                          data.count >= 3
                            ? "rgba(0,102,255,0.85)"
                            : data.count === 2
                            ? "rgba(0,102,255,0.55)"
                            : "rgba(0,102,255,0.3)",
                        minWidth: "42px",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "10px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-100)",
                        transition: "all 0.5s",
                      }}
                    >
                      {data.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
