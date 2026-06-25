import Link from "next/link";

import { getArtifactCases } from "@/lib/artifacts";

type PageProps = {
  searchParams?: Promise<{
    state?: string;
    court?: string;
    audience?: string;
  }>;
};

function countBy(values: string[]): Record<string, number> {
  return values.filter(Boolean).reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function rankedEntries(counts: Record<string, number>, limit = 6): [string, number][] {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function severityScore(severity: string): number {
  return { "career-ending": 5, high: 4, medium: 3, low: 1 }[severity] || 1;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const state = resolved?.state?.toUpperCase();
  const court = resolved?.court;
  const audience = resolved?.audience || "legal professional";
  const caseItems = getArtifactCases({ state, court, limit: 250 });
  const severity = countBy(caseItems.map((item) => item.severity));
  const failures = rankedEntries(countBy(caseItems.flatMap((item) => item.tags).filter((tag) =>
    ["fake-citations", "fabricated-quotes", "misrepresented-authority", "bar-referral", "disqualification"].includes(tag),
  )), 5);
  const monetary = caseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const lawyer = caseItems.filter((item) => item.party?.toLowerCase().includes("lawyer")).length;
  const sourceLinks = caseItems.filter((item) => item.source_url).length;
  const topCases = caseItems
    .slice()
    .sort((a, b) => severityScore(b.severity) - severityScore(a.severity) || (b.amount || 0) - (a.amount || 0))
    .slice(0, 8);
  const maxSeverity = Math.max(...Object.values(severity), 1);
  const maxFailure = Math.max(...failures.map(([, count]) => count), 1);
  const artifactQuery = new URLSearchParams();
  if (state) artifactQuery.set("state", state);
  if (court) artifactQuery.set("court", court);
  artifactQuery.set("audience", audience);

  return (
    <main className="min-h-screen" style={{ background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 24px 64px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Vortex Legal AI Risk
            </p>
            <h1 style={{ margin: "8px 0", fontSize: 36, lineHeight: 1.05 }}>
              {state || court || "Global"} risk dashboard
            </h1>
            <p style={{ color: "#94a3b8", maxWidth: 720 }}>
              Source-backed view for {audience.replace(/_/g, " ")}. Tracked incidents are public risk signals, not usage-adjusted incident rates.
            </p>
          </div>
          <Link href="/" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
            Open full tracker
          </Link>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            ["Matched matters", caseItems.length.toLocaleString("en-US")],
            ["Source coverage", `${sourceLinks}/${caseItems.length}`],
            ["Lawyer-related", lawyer.toLocaleString("en-US")],
            ["Known monetary", money(monetary)],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #1f2937", background: "#111827", padding: 18 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
          <div style={{ border: "1px solid #1f2937", background: "#111827", padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Severity Breakdown</h2>
            {["low", "medium", "high", "career-ending"].map((label) => {
              const count = severity[label] || 0;
              return (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#cbd5e1" }}>
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ height: 8, background: "#030712", marginTop: 6 }}>
                    <div style={{ width: `${Math.max(4, (count / maxSeverity) * 100)}%`, height: 8, background: label === "high" || label === "career-ending" ? "#ef4444" : label === "medium" ? "#f59e0b" : "#22c55e" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ border: "1px solid #1f2937", background: "#111827", padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Failure Modes</h2>
            {failures.map(([label, count]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#cbd5e1" }}>
                  <span>{label}</span>
                  <span>{count}</span>
                </div>
                <div style={{ height: 8, background: "#030712", marginTop: 6 }}>
                  <div style={{ width: `${Math.max(4, (count / maxFailure) * 100)}%`, height: 8, background: "#38bdf8" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>Top Source-Backed Matters</h2>
            <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
              <a href={`/api/artifact?type=report&format=pdf&${artifactQuery.toString()}`} style={{ color: "#fbbf24" }}>PDF</a>
              <a href={`/api/artifact?type=report&format=doc&${artifactQuery.toString()}`} style={{ color: "#fbbf24" }}>Word</a>
              <a href={`/api/artifact?type=source&format=md&${artifactQuery.toString()}`} style={{ color: "#fbbf24" }}>Sources</a>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>Date</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>Case</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>Court</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>Severity</th>
                  <th style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {topCases.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>{item.date}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>{item.case_name}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>{item.court}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>{item.severity}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #1f2937" }}>
                      {item.source_url ? <a href={item.source_url} style={{ color: "#38bdf8" }}>open</a> : "unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
