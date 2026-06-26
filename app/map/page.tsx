import Link from "next/link";

import metaRaw from "@/data/meta.json";
import sanctionsRaw from "@/data/sanctions.json";
import type { PublicSanctionCase } from "@/lib/mcp/types";

type PageProps = {
  searchParams?: Promise<{
    metric?: string;
    tool?: string;
    failure?: string;
    severity?: string;
    states?: string;
    audience?: string;
  }>;
};

const cases = (sanctionsRaw as unknown as PublicSanctionCase[]).slice();
const meta = metaRaw as { last_updated: string; total_cases: number };

const stateNames: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "D.C.",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

function selectedSet(value?: string): Set<string> {
  return new Set((value || "").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean));
}

function severityWeight(severity: string): number {
  return { low: 1, medium: 2, high: 4, "career-ending": 6 }[severity] || 1;
}

function colorFor(value: number, max: number): string {
  if (value === 0) return "#111827";
  const ratio = value / Math.max(max, 1);
  if (ratio > 0.75) return "#dc2626";
  if (ratio > 0.45) return "#f97316";
  if (ratio > 0.2) return "#facc15";
  return "#22c55e";
}

export default async function MapPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const metric = resolved?.metric || "cases";
  const tool = resolved?.tool;
  const failure = resolved?.failure;
  const severity = resolved?.severity;
  const audience = resolved?.audience || "managing_partner";
  const selectedStates = selectedSet(resolved?.states);

  const filtered = cases.filter((item) => {
    if (!item.state) return false;
    if (selectedStates.size > 0 && !selectedStates.has(item.state)) return false;
    if (tool && !item.ai_tool_used.toLowerCase().includes(tool.toLowerCase())) return false;
    if (failure && !item.tags.includes(failure)) return false;
    if (severity && item.severity !== severity) return false;
    return true;
  });

  const byState = Object.keys(stateNames).map((state) => {
    const stateCases = filtered.filter((item) => item.state === state);
    const severe = stateCases.filter((item) => item.severity === "high" || item.severity === "career-ending").length;
    const score = metric === "severity" ? stateCases.reduce((sum, item) => sum + severityWeight(item.severity), 0) : stateCases.length;
    const withSource = stateCases.filter((item) => item.source_url).length;
    return { state, count: stateCases.length, severe, score, withSource };
  });
  const max = Math.max(...byState.map((item) => item.score), 1);
  const visibleStates = byState.filter((item) => item.count > 0 || selectedStates.has(item.state));
  const sourceCount = filtered.filter((item) => item.source_url).length;
  const dates = filtered.map((item) => item.date).filter(Boolean).sort();

  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 24px 64px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Vortex Legal AI Risk
            </p>
            <h1 style={{ margin: "8px 0", fontSize: 36, lineHeight: 1.05 }}>U.S. legal AI risk map</h1>
            <p style={{ color: "#94a3b8", maxWidth: 780 }}>
              Shareable heatmap for tracked public incidents. Counts are not usage-adjusted rates.
            </p>
          </div>
          <Link href="/" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
            Open tracker
          </Link>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            ["Matched matters", filtered.length.toLocaleString("en-US")],
            ["Source coverage", `${sourceCount}/${filtered.length}`],
            ["Date coverage", dates.length > 0 ? `${dates[0]} to ${dates[dates.length - 1]}` : "No matches"],
            ["Updated", meta.last_updated],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #1f2937", background: "#111827", padding: 16 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 16, marginBottom: 20 }}>
          <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Active filters
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
            {[
              `metric=${metric}`,
              tool ? `tool=${tool}` : "tool=all",
              failure ? `failure=${failure}` : "failure=all",
              severity ? `severity=${severity}` : "severity=all",
              selectedStates.size > 0 ? `states=${[...selectedStates].join(",")}` : "states=all",
            ].map((item) => (
              <span key={item} style={{ border: "1px solid #334155", padding: "6px 8px", color: "#cbd5e1" }}>{item}</span>
            ))}
          </div>
        </section>

        {visibleStates.length === 0 ? (
          <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>No matched public incidents</h2>
            <p style={{ color: "#94a3b8" }}>Broaden the tool, failure mode, severity, or state filter before drawing a risk conclusion.</p>
          </section>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(126px, 1fr))", gap: 10 }}>
            {visibleStates.sort((a, b) => b.score - a.score || a.state.localeCompare(b.state)).map((item) => {
              const dashboard = new URLSearchParams({ state: item.state, audience });
              if (tool) dashboard.set("ai_tool", tool);
              return (
                <Link
                  key={item.state}
                  href={`/dashboard?${dashboard.toString()}`}
                  style={{
                    minHeight: 106,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: "1px solid #1f2937",
                    background: colorFor(item.score, max),
                    color: item.score === 0 ? "#94a3b8" : "#020617",
                    padding: 12,
                    textDecoration: "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{item.state}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{stateNames[item.state]}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    {item.count} matters<br />
                    {item.severe} high/career
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
