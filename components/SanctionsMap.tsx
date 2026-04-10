"use client";

import { useState, useMemo } from "react";
import casesData from "@/data/cases.json";

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

/* Simplified US state SVG paths — Albers USA projection, viewBox 0 0 960 600 */
const STATE_PATHS: Record<string, string> = {
  AL: "M628,434 L628,483 L621,492 L625,497 L622,501 L610,502 L608,434Z",
  AK: "M161,485 L183,485 L183,493 L193,493 L193,485 L231,485 L231,493 L235,493 L235,497 L244,497 L244,501 L231,501 L231,509 L225,509 L225,513 L213,513 L213,509 L201,509 L201,513 L197,513 L197,517 L181,517 L181,509 L177,509 L177,505 L173,505 L173,501 L161,501Z",
  AZ: "M205,432 L261,432 L271,499 L257,510 L254,510 L249,518 L238,518 L229,509 L205,509Z",
  AR: "M568,432 L610,432 L610,476 L605,479 L568,479 L566,453Z",
  CA: "M124,310 L155,310 L160,326 L171,341 L171,356 L186,381 L196,402 L205,432 L205,509 L186,509 L180,487 L163,467 L151,450 L137,436 L118,402 L108,370 L108,337 L124,310Z",
  CO: "M288,322 L376,322 L376,391 L288,391Z",
  CT: "M852,196 L879,188 L884,202 L877,213 L863,213 L852,207Z",
  DE: "M822,291 L832,282 L839,296 L835,312 L826,312 L822,303Z",
  FL: "M639,502 L668,484 L710,484 L729,490 L740,499 L740,510 L737,520 L729,538 L716,550 L705,555 L697,553 L693,546 L684,546 L668,530 L658,530 L646,519 L639,519 L632,511 L632,502Z",
  GA: "M640,434 L686,434 L694,446 L700,470 L700,484 L669,484 L639,502 L632,502 L622,501 L625,497 L628,493 L628,483 L628,434 L640,434Z",
  HI: "M260,535 L274,530 L280,533 L275,540 L266,543 L260,539Z M283,525 L293,522 L297,528 L290,533 L283,530Z M300,515 L308,511 L314,516 L308,521 L300,519Z",
  ID: "M214,180 L249,166 L268,230 L268,290 L234,290 L216,260 L205,230Z",
  IL: "M580,260 L610,260 L615,282 L620,310 L620,355 L616,370 L610,380 L602,388 L585,395 L575,395 L568,383 L568,330 L572,300 L580,270Z",
  IN: "M620,269 L652,269 L656,290 L656,370 L652,383 L620,383 L620,355 L620,310 L617,282Z",
  IA: "M520,256 L580,256 L580,270 L572,300 L568,330 L520,330 L510,295Z",
  KS: "M390,355 L490,355 L490,410 L390,410Z",
  KY: "M620,370 L616,383 L612,392 L672,370 L702,360 L718,355 L718,372 L690,395 L656,395 L642,404 L620,404Z",
  LA: "M568,479 L605,479 L610,476 L614,488 L616,500 L614,512 L598,518 L588,512 L580,518 L568,518 L562,508 L568,499Z",
  ME: "M874,108 L892,96 L900,118 L894,148 L884,162 L874,166 L870,152 L862,140 L862,126 L868,116Z",
  MD: "M770,290 L822,282 L822,303 L826,312 L835,312 L832,320 L815,326 L800,326 L790,316 L782,316 L770,306Z",
  MA: "M856,188 L890,178 L896,184 L890,192 L877,196 L863,196 L856,192Z M852,196 L879,188 L856,188Z",
  MI: "M604,168 L612,168 L630,182 L650,200 L666,216 L672,230 L672,262 L656,262 L652,269 L620,269 L617,254 L610,240 L600,218 L604,200Z M592,168 L604,168 L600,190 L592,196 L576,196 L567,186 L570,172Z",
  MN: "M488,140 L540,140 L548,150 L548,180 L540,204 L540,256 L488,256 L480,222 L480,176Z",
  MS: "M600,434 L610,434 L608,502 L610,502 L614,488 L610,476 L605,479 L568,479 L568,453 L576,434Z",
  MO: "M520,330 L568,330 L568,383 L575,395 L585,395 L585,418 L558,426 L535,426 L510,410 L502,395 L504,370 L510,355Z",
  MT: "M246,140 L358,140 L358,212 L290,218 L255,218 L243,198 L240,166Z",
  NE: "M370,295 L470,290 L490,290 L490,355 L390,355 L375,340 L370,320Z",
  NV: "M155,310 L214,262 L234,290 L234,380 L205,432 L186,381 L171,356 L171,341 L160,326Z",
  NH: "M868,116 L874,108 L874,166 L862,172 L856,166 L856,138 L862,126Z",
  NJ: "M826,236 L838,228 L842,244 L844,264 L840,280 L832,282 L822,291 L822,268 L826,248Z",
  NM: "M262,410 L346,410 L346,500 L308,503 L262,505 L261,432Z",
  NY: "M788,186 L802,178 L826,180 L838,186 L844,200 L852,196 L852,207 L844,216 L838,228 L826,236 L822,236 L810,230 L800,218 L790,214 L782,206 L776,196 L788,186Z",
  NC: "M690,395 L770,380 L790,388 L792,400 L780,412 L760,418 L732,418 L716,408 L700,408 L684,418 L672,420 L656,420 L642,404 L656,395Z",
  ND: "M400,140 L488,140 L488,200 L400,200Z",
  OH: "M656,269 L672,262 L700,260 L716,270 L718,304 L718,340 L718,355 L702,360 L672,370 L656,370 L656,290Z",
  OK: "M370,410 L390,410 L490,410 L490,420 L510,410 L520,418 L520,440 L498,456 L480,456 L460,452 L440,448 L390,448 L370,448Z",
  OR: "M124,180 L205,180 L214,180 L205,230 L186,260 L155,310 L124,310 L108,280 L108,210Z",
  PA: "M746,232 L788,220 L800,218 L810,230 L822,236 L826,248 L822,268 L810,270 L746,280Z",
  RI: "M877,196 L884,194 L888,204 L882,210 L877,207Z",
  SC: "M684,418 L716,408 L732,418 L740,430 L728,446 L708,454 L694,446 L686,434 L684,426Z",
  SD: "M400,200 L488,200 L488,256 L480,270 L470,290 L400,290Z",
  TN: "M612,392 L672,370 L690,395 L656,395 L642,404 L672,420 L656,420 L610,434 L600,434Z",
  TX: "M370,448 L390,448 L440,448 L460,452 L480,456 L498,456 L520,440 L540,446 L558,446 L568,453 L568,479 L568,499 L562,508 L568,518 L550,538 L530,556 L510,568 L490,571 L470,563 L456,546 L440,530 L422,520 L404,516 L390,506 L370,500Z",
  UT: "M234,290 L288,290 L288,391 L262,391 L262,410 L261,432 L234,380Z",
  VT: "M856,138 L856,166 L862,172 L858,180 L846,186 L838,180 L838,156 L844,138Z",
  VA: "M718,340 L740,335 L770,320 L790,316 L800,326 L808,340 L808,356 L792,372 L790,388 L770,380 L718,355Z",
  WA: "M124,96 L205,96 L214,108 L214,180 L124,180 L108,160 L108,120Z",
  WV: "M718,304 L740,295 L752,306 L760,326 L770,320 L770,306 L782,316 L790,316 L770,340 L740,335 L718,340Z",
  WI: "M540,140 L576,140 L592,168 L604,168 L604,200 L600,218 L580,230 L580,256 L540,256 L540,204 L548,180 L548,150Z",
  WY: "M272,218 L358,212 L365,280 L370,295 L288,295 L288,290 L268,290Z",
  DC: "M795,318 L800,314 L804,320 L800,324 L795,322Z",
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

  function getFill(stateCode: string): string {
    const count = stateData[stateCode]?.count ?? 0;
    if (count === 0) return "rgba(255,255,255,0.03)";
    if (count === 1) return "rgba(0,102,255,0.3)";
    if (count === 2) return "rgba(0,102,255,0.5)";
    return "rgba(0,102,255,0.8)";
  }

  function handleMouseEnter(
    e: React.MouseEvent<SVGPathElement>,
    stateCode: string
  ) {
    const rect = (e.target as SVGPathElement).getBoundingClientRect();
    const parentRect = (
      e.target as SVGPathElement
    ).closest("svg")!.getBoundingClientRect();
    setTooltip({
      state: stateCode,
      name: STATE_NAMES[stateCode] ?? stateCode,
      count: stateData[stateCode]?.count ?? 0,
      cases: stateData[stateCode]?.cases ?? [],
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 8,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <section className="w-full px-4 md:px-6 py-12">
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
        <div className="relative w-full">
          <svg
            viewBox="0 0 960 600"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {Object.entries(STATE_PATHS).map(([code, path]) => (
              <path
                key={code}
                d={path}
                data-state={code}
                fill={getFill(code)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                className="transition-all duration-200 cursor-pointer hover:brightness-150"
                onMouseEnter={(e) => handleMouseEnter(e, code)}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  const count = stateData[code]?.count || 0;
                  if (count > 0 && onStateClick) onStateClick(code);
                }}
              />
            ))}
          </svg>

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
