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

  const scaleY = (val: number) => PAD.top + chartH - Math.sqrt(val / maxAmount) * chartH;
  const scaleX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;

  const points = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.amount) }));

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
    <section id="escalation" className="section">
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", alignItems: "start" }} className="escalation-grid">
          {/* Narrative panel */}
          <div>
            <div className="section-head blue" style={{ marginBottom: "28px" }}>
              <div className="section-label blue">
                <span className="tick blue"></span>
                Escalation Curve
              </div>
              <h2 className="section-heading">
                From minor fines to <em>career removal</em>.
              </h2>
              <p className="section-sub" style={{ marginTop: "14px" }}>
                Sanctions are accelerating exponentially. The curve is not linear.
              </p>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px 22px", position: "relative" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--text-500)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Record Sanction
              </div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "34px",
                  fontWeight: 500,
                  color: "var(--amber)",
                  letterSpacing: "-0.03em",
                  fontStyle: "italic",
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                $109.7K
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-400)", fontWeight: 400 }}>
                Brigandi v. Oregon <span style={{ color: "var(--text-600)" }}>· 2026</span>
              </div>
            </div>
          </div>

          {/* Chart panel */}
          <div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px", overflowX: "auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-500)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ width: "5px", height: "5px", background: "var(--blue)", display: "inline-block" }}></span>
                Cumulative Judicial Sanctions
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", minWidth: "600px" }} role="img">
                <defs>
                  <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {gridValues.map((val) => (
                  <g key={val}>
                    <line x1={PAD.left} y1={scaleY(val)} x2={W - PAD.right} y2={scaleY(val)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
                    <text x={PAD.left - 10} y={scaleY(val) + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="ui-monospace, Menlo, monospace">
                      ${(val / 1000).toFixed(0)}K
                    </text>
                  </g>
                ))}
                <path d={areaPath} fill="url(#curveGrad)" />
                <path d={linePath} fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4.5" fill="#0066FF" stroke="#0A0A0A" strokeWidth="2.5" />
                    <text x={p.x} y={PAD.top + chartH + 22} textAnchor="middle" fill="rgba(244,244,245,0.7)" fontSize="10" fontWeight="700" fontFamily="ui-monospace, Menlo, monospace" letterSpacing="0.1em">
                      {data[i].label}
                    </text>
                    <text x={p.x} y={PAD.top + chartH + 36} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontStyle="italic" fontFamily="Source Serif 4, Georgia, serif">
                      {data[i].case_name}
                    </text>
                    <text x={p.x} y={PAD.top + chartH + 48} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="ui-monospace, Menlo, monospace">
                      {data[i].year}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* 17-courts callout */}
        <div
          style={{
            marginTop: "28px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: "2px solid var(--amber)",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "56px",
                fontWeight: 500,
                color: "var(--amber)",
                letterSpacing: "-0.04em",
                fontStyle: "italic",
                lineHeight: 1,
              }}
            >
              17
            </span>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "20px",
                  fontWeight: 500,
                  color: "var(--text-100)",
                  letterSpacing: "-0.015em",
                  marginBottom: "6px",
                }}
              >
                One day. Seventeen courts.
              </p>
              <p style={{ color: "var(--text-400)", fontSize: "13px", fontWeight: 300, lineHeight: 1.6 }}>
                US court decisions flagging AI hallucinations &mdash; March 31, 2026.
              </p>
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--amber)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            The system is accelerating
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .escalation-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </section>
  );
}
