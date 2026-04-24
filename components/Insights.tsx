"use client";

import sanctions from "@/data/sanctions.json";
// Filter to adjudicated US cases with enrichment (exclude alleged-only and cases without severity)
const cases = ((sanctions as unknown) as Array<{ country: string; alleged: boolean; severity: string; date: string; policy_gap_ids: string[]; ai_tool_used: string; tags: string[]; amount: number | null }>)
  .filter((c) => c.country === "US" && !c.alleged && !!c.severity);

function countByField<T extends string>(arr: T[]): Record<string, number> {
  const map: Record<string, number> = {};
  arr.forEach((v) => { map[v] = (map[v] || 0) + 1; });
  return map;
}

function sorted(obj: Record<string, number>) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

const allGaps = cases.flatMap((c) => c.policy_gap_ids);
const gapCounts = sorted(countByField(allGaps));
const toolCounts = sorted(countByField(cases.map((c) => c.ai_tool_used)));
const maxToolCount = toolCounts[0]?.[1] ?? 1;

const severityCounts = countByField(cases.map((c) => c.severity));
const severityOrder: { key: string; color: string; label: string }[] = [
  { key: "career-ending", color: "#ef4444", label: "Career-Ending" },
  { key: "high", color: "#f59e0b", label: "High" },
  { key: "medium", color: "#eab308", label: "Medium" },
  { key: "low", color: "#22c55e", label: "Low" },
];

const byYear: Record<number, { total: number; count: number }> = {};
cases.forEach((c) => {
  const y = new Date(c.date).getFullYear();
  if (!byYear[y]) byYear[y] = { total: 0, count: 0 };
  if (c.amount) {
    byYear[y].total += c.amount;
    byYear[y].count += 1;
  }
});
const yearAvgs = Object.entries(byYear)
  .map(([y, d]) => ({ year: +y, avg: d.count ? Math.round(d.total / d.count) : 0 }))
  .sort((a, b) => a.year - b.year);
const maxAvg = Math.max(...yearAvgs.map((y) => y.avg), 1);

const gapLabels: Record<string, string> = {
  "citation-verification": "Citation Verification",
  "supervision-protocol": "Supervision Protocol",
  "attorney-training": "Attorney Training",
  "written-ai-policy": "Written AI Policy",
  "ai-disclosure-protocol": "AI Disclosure Protocol",
  "audit-trail": "Audit Trail",
  "paid-tool-verification": "Paid Tool Verification",
  "approved-tools-list": "Approved Tools List",
  "incident-response": "Incident Response",
  "engagement-letter-ai": "Engagement Letter AI",
};

const citationGapCount = gapCounts.find(([k]) => k === "citation-verification")?.[1] ?? 0;
const paidToolCases = cases.filter(
  (c) => c.ai_tool_used.toLowerCase().includes("cocounsel") || c.ai_tool_used.toLowerCase().includes("westlaw")
);
const supervisionCases = cases.filter((c) => c.policy_gap_ids.includes("supervision-protocol"));
const denialCases = cases.filter(
  (c) => c.tags.includes("denial") || c.tags.includes("sustained-deception") || c.policy_gap_ids.includes("incident-response")
);

const insightCards = [
  {
    title: "Citation verification is the #1 gap.",
    detail: `Present in ${citationGapCount} of ${cases.length} tracked cases. Every sanctioned attorney failed to verify AI-generated citations against primary sources.`,
    accent: "blue" as const,
  },
  {
    title: "Paid tools are not exempt.",
    detail: `${paidToolCases.length} case${paidToolCases.length !== 1 ? "s" : ""} involved CoCounsel or Westlaw. Courts ruled: "The tool's pedigree is no defense."`,
    accent: "amber" as const,
  },
  {
    title: "Supervisors are liable.",
    detail: `${supervisionCases.length} case${supervisionCases.length !== 1 ? "s" : ""} cited supervision failures. Signing attorneys are individually responsible for AI-assisted work product.`,
    accent: "amber" as const,
  },
  {
    title: "Denial makes it worse.",
    detail: `${denialCases.length} case${denialCases.length !== 1 ? "s" : ""} where denial or cover-up escalated sanctions. Courts treat transparency failures more harshly than the original error.`,
    accent: "red" as const,
  },
];

function PanelHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 700,
        color: "var(--text-500)",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        marginBottom: "22px",
      }}
    >
      {children}
    </div>
  );
}

export default function Insights() {
  return (
    <section id="insights" className="section">
      <div className="wrap">
        <div className="section-head blue">
          <div className="section-label blue">
            <span className="tick blue"></span>
            Intelligence Layer
          </div>
          <h2 className="section-heading">
            What courts are actually <span className="blue-em">enforcing</span>.
          </h2>
          <p className="section-sub">
            Patterns computed from {cases.length} landmark AI sanctions cases. Not commentary &mdash; the actual ratios judges are using to decide who gets punished and how hard.
          </p>
        </div>

        {/* Top row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }} className="insights-row">
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px 32px" }}>
            <PanelHead>Most Common Policy Gaps</PanelHead>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {gapCounts.slice(0, 3).map(([gap, count], i) => (
                <div key={gap}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "var(--text-300)", fontWeight: 400 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--amber)",
                          fontWeight: 700,
                          marginRight: "10px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        #{i + 1}
                      </span>
                      {gapLabels[gap] || gap}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-100)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {count} cases
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "var(--border-soft)", position: "relative" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(count / cases.length) * 100}%`,
                        background: i === 0 ? "var(--blue)" : i === 1 ? "rgba(0,102,255,0.6)" : "rgba(0,102,255,0.35)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px 32px" }}>
            <PanelHead>AI Tool Breakdown</PanelHead>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {toolCounts.map(([tool, count]) => (
                <div key={tool}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--text-300)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginRight: "12px",
                      }}
                    >
                      {tool}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-500)",
                        letterSpacing: "0.08em",
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <div style={{ height: "3px", background: "var(--border-soft)", position: "relative" }}>
                    <div style={{ height: "100%", width: `${(count / maxToolCount) * 100}%`, background: "var(--blue)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }} className="insights-row">
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px 32px" }}>
            <PanelHead>Severity Distribution</PanelHead>
            <div style={{ display: "flex", height: "12px", overflow: "hidden", marginBottom: "20px", border: "1px solid var(--border-soft)" }}>
              {severityOrder.map(({ key, color }) => {
                const count = severityCounts[key] || 0;
                const pct = (count / cases.length) * 100;
                return pct > 0 ? <div key={key} style={{ width: `${pct}%`, backgroundColor: color }} /> : null;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {severityOrder.map(({ key, color, label }) => {
                const count = severityCounts[key] || 0;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "9px", height: "9px", backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "var(--text-300)" }}>{label}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-100)",
                        marginLeft: "auto",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px 32px" }}>
            <PanelHead>Avg. Sanction by Year</PanelHead>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {yearAvgs.map(({ year, avg }) => (
                <div key={year}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--text-100)", letterSpacing: "0.05em" }}>{year}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-300)", fontWeight: 400, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      {avg > 0 ? `$${avg.toLocaleString()}` : "Non-monetary"}
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "var(--border-soft)", position: "relative" }}>
                    <div
                      style={{
                        height: "100%",
                        width: avg > 0 ? `${(avg / maxAvg) * 100}%` : "4%",
                        backgroundColor: avg > 0 ? "var(--amber)" : "rgba(234,179,8,0.25)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--text-600)",
                marginTop: "18px",
                letterSpacing: "0.1em",
                lineHeight: 1.6,
              }}
            >
              Based on cases with monetary sanctions. Non-monetary cases excluded.
            </p>
          </div>
        </div>

        {/* Pattern cards */}
        <div
          style={{
            marginTop: "40px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--border)",
            border: "1px solid var(--border)",
          }}
          className="insight-cards"
        >
          {insightCards.map((card, i) => {
            const accentColor = card.accent === "blue" ? "var(--blue)" : card.accent === "amber" ? "var(--amber)" : "var(--red-muted)";
            return (
              <div key={i} style={{ background: "var(--bg-card)", padding: "32px 28px", transition: "background 0.3s" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: accentColor,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  Pattern · {String(i + 1).padStart(2, "0")}
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "var(--text-100)",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.3,
                    marginBottom: "12px",
                  }}
                >
                  {card.title}
                </h4>
                <p style={{ fontSize: "13px", color: "var(--text-400)", lineHeight: 1.7, fontWeight: 300 }}>{card.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .insights-row { grid-template-columns: 1fr !important; }
          .insight-cards { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .insight-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
