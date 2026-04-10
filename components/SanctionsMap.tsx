"use client";

import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import casesData from "@/data/cases.json";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/* FIPS code → state abbreviation */
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
    return Object.entries(stateData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [stateData]);

  const maxCount = topJurisdictions[0]?.[1].count ?? 1;

  function getFill(stateCode: string, isHovered: boolean): string {
    const count = stateData[stateCode]?.count ?? 0;
    if (count === 0) return isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)";
    if (count === 1) return isHovered ? "rgba(0,102,255,0.45)" : "rgba(0,102,255,0.3)";
    if (count === 2) return isHovered ? "rgba(0,102,255,0.65)" : "rgba(0,102,255,0.5)";
    return isHovered ? "rgba(0,102,255,0.95)" : "rgba(0,102,255,0.8)";
  }

  function handleMouseMove(
    e: React.MouseEvent,
    stateCode: string
  ) {
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
    <section id="map" className="w-full px-4 md:px-6 py-12">
      <div className="max-w-5xl mx-auto bg-[#0A1628]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-10 relative overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
            Sanctions by Jurisdiction
          </h2>
          <p className="text-sm text-white/40">
            Geographic distribution of AI-related court sanctions across the United States
          </p>
        </div>

        {/* Inner glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#0066FF]/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Map */}
        <div className="relative w-full map-container" style={{ background: "#050B14", borderRadius: "0.75rem" }}>
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 1000 }}
            width={800}
            height={500}
            style={{ width: "100%", height: "auto" }}
          >
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
                      stroke="rgba(255,255,255,0.08)"
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

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none bg-[#0A1628] border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="text-white font-semibold text-sm mb-1">
                {tooltip.name}
              </div>
              <div className="text-white/50 text-xs mb-1">
                {tooltip.count} {tooltip.count === 1 ? "case" : "cases"}
              </div>
              {tooltip.cases.length > 0 && (
                <ul className="text-xs text-white/40 space-y-0.5 max-w-[220px]">
                  {tooltip.cases.map((c, i) => (
                    <li key={i} className="truncate">
                      &bull; {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-white/40">
          <span className="font-medium text-white/50">Cases:</span>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: "rgba(0,102,255,0.3)" }}
            />
            <span>1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: "rgba(0,102,255,0.5)" }}
            />
            <span>2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: "rgba(0,102,255,0.8)" }}
            />
            <span>3+</span>
          </div>
        </div>

        {/* Top Jurisdictions Bar Chart */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-white mb-4">
            Top Jurisdictions
          </h3>
          <div className="space-y-3">
            {topJurisdictions.map(([code, data]) => (
              <div key={code} className="flex items-center gap-3">
                <span className="text-sm text-white/60 w-36 shrink-0 text-right">
                  {STATE_NAMES[code] ?? code}
                </span>
                <div className="flex-1 h-7 bg-white/[0.03] rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg flex items-center px-3 text-xs font-semibold text-white transition-all duration-500"
                    style={{
                      width: `${(data.count / maxCount) * 100}%`,
                      background:
                        data.count >= 3
                          ? "rgba(0,102,255,0.8)"
                          : data.count === 2
                          ? "rgba(0,102,255,0.5)"
                          : "rgba(0,102,255,0.3)",
                      minWidth: "2.5rem",
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
    </section>
  );
}
