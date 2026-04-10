"use client";

import { ESCALATION_DATA } from "@/lib/constants";

export default function EscalationCurve() {
  const data = ESCALATION_DATA;
  const maxAmount = Math.max(...data.map((d) => d.amount));

  const W = 900;
  const H = 340;
  const PAD = { top: 30, right: 40, bottom: 65, left: 70 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scaleY = (val: number) =>
    PAD.top + chartH - Math.sqrt(val / maxAmount) * chartH;
  const scaleX = (i: number) =>
    PAD.left + (i / (data.length - 1)) * chartW;

  const points = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.amount) }));

  // Smooth curve using catmull-rom to bezier
  const buildSmoothPath = () => {
    if (points.length < 2) return "";
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath();
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD.top + chartH} L${points[0].x},${PAD.top + chartH} Z`;

  const gridValues = [0, 25000, 50000, 75000, 100000];

  return (
    <section id="escalation" className="py-16 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em] mb-2">
            Escalation Curve
          </h2>
          <p className="text-white/40 text-sm">
            From minor fines to career removal — sanctions are accelerating
            exponentially
          </p>
        </div>

        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-4 md:p-8 overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto min-w-[600px]"
            role="img"
            aria-label="Escalation curve showing increasing sanctions amounts over time"
          >
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0066FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0066FF" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridValues.map((val) => (
              <g key={val}>
                <line
                  x1={PAD.left}
                  y1={scaleY(val)}
                  x2={W - PAD.right}
                  y2={scaleY(val)}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4,4"
                />
                <text
                  x={PAD.left - 10}
                  y={scaleY(val) + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.2)"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  ${(val / 1000).toFixed(0)}K
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#curveGrad)" />

            {/* Smooth line */}
            <path
              d={linePath}
              fill="none"
              stroke="#0066FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points + labels */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="16"
                  fill="transparent"
                  className="cursor-pointer"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#0066FF"
                  stroke="#0A0A0A"
                  strokeWidth="2.5"
                />
                <text
                  x={p.x}
                  y={PAD.top + chartH + 20}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {data[i].label}
                </text>
                <text
                  x={p.x}
                  y={PAD.top + chartH + 34}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.2)"
                  fontSize="9"
                  fontFamily="Inter, sans-serif"
                >
                  {data[i].case_name}
                </text>
                <text
                  x={p.x}
                  y={PAD.top + chartH + 46}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.12)"
                  fontSize="8"
                  fontFamily="Inter, sans-serif"
                >
                  {data[i].year}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* 17-courts callout */}
        <div className="mt-6 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-5xl font-black text-[#0066FF]">17</span>
            <div>
              <p className="text-white font-bold text-sm">
                One day. Seventeen courts.
              </p>
              <p className="text-white/40 text-sm">
                US court decisions flagging AI hallucinations — March 31, 2026
              </p>
            </div>
          </div>
          <div className="text-white/20 text-xs font-semibold tracking-wide">
            The system is accelerating
          </div>
        </div>
      </div>
    </section>
  );
}
