import Link from "next/link";

import { removeQueryParam } from "@/lib/filtering";
import { getArtifactCases } from "@/lib/artifacts";

type PageProps = {
  searchParams?: Promise<{
    state?: string;
    court?: string;
    audience?: string;
    practice_area?: string;
    ai_tool?: string;
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

function riskLevel(caseItems: ReturnType<typeof getArtifactCases>): string {
  const severity = countBy(caseItems.map((item) => item.severity));
  const highImpact = (severity.high || 0) + (severity["career-ending"] || 0);
  const monetary = caseItems.filter((item) => item.amount || item.sanction_types.includes("monetary")).length;
  if ((severity["career-ending"] || 0) > 0 || highImpact >= 5) return "High";
  if (highImpact > 0 || monetary >= 3 || caseItems.length >= 20) return "Moderate";
  if (caseItems.length > 0) return "Emerging";
  return "No tracked signal";
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const state = resolved?.state?.toUpperCase();
  const court = resolved?.court;
  const practiceArea = resolved?.practice_area;
  const aiTool = resolved?.ai_tool;
  const audience = resolved?.audience || "legal professional";
  const caseItems = getArtifactCases({ state, court, practiceArea, aiTool, limit: 250 });
  const broaderStateItems = caseItems.length === 0 && state ? getArtifactCases({ state, limit: 250 }) : [];
  const severity = countBy(caseItems.map((item) => item.severity));
  const failures = rankedEntries(countBy(caseItems.flatMap((item) => item.tags).filter((tag) =>
    ["fake-citations", "fabricated-quotes", "misrepresented-authority", "bar-referral", "disqualification"].includes(tag),
  )), 5);
  const primaryFailure = failures[0]?.[0] || "no dominant failure mode";
  const monetary = caseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const lawyer = caseItems.filter((item) => item.party?.toLowerCase().includes("lawyer")).length;
  const sourceLinks = caseItems.filter((item) => item.source_url).length;
  const highImpact = (severity.high || 0) + (severity["career-ending"] || 0);
  const topCases = caseItems
    .slice()
    .sort((a, b) => severityScore(b.severity) - severityScore(a.severity) || (b.amount || 0) - (a.amount || 0))
    .slice(0, 8);
  const maxSeverity = Math.max(...Object.values(severity), 1);
  const maxFailure = Math.max(...failures.map(([, count]) => count), 1);
  const artifactQuery = new URLSearchParams();
  if (state) artifactQuery.set("state", state);
  if (court) artifactQuery.set("court", court);
  if (practiceArea) artifactQuery.set("practice_area", practiceArea);
  if (aiTool) artifactQuery.set("ai_tool", aiTool);
  artifactQuery.set("audience", audience);
  const currentQuery = { state, court, practice_area: practiceArea, ai_tool: aiTool, audience };
  const chips = [
    state ? { key: "state", label: `state=${state}` } : null,
    court ? { key: "court", label: `court=${court}` } : null,
    practiceArea ? { key: "practice_area", label: `practice_area=${practiceArea}` } : null,
    aiTool ? { key: "ai_tool", label: `ai_tool=${aiTool}` } : null,
    audience ? { key: "audience", label: `audience=${audience}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <main className="min-h-screen" style={{ background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 24px 64px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Vortex Legal AI Risk
            </p>
            <h1 style={{ margin: "8px 0", fontSize: 36, lineHeight: 1.05 }}>
              {state || court || aiTool || practiceArea || "Global"} risk dashboard
            </h1>
            <p style={{ color: "#94a3b8", maxWidth: 720 }}>
              Source-backed view for {audience.replace(/_/g, " ")}{aiTool ? ` using ${aiTool}` : ""}{practiceArea ? ` in ${practiceArea}` : ""}. Tracked incidents are public risk signals, not usage-adjusted incident rates.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link href="/dashboard" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>Reset filters</Link>
            <Link href="/" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>Open full tracker</Link>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            ["Risk level", riskLevel(caseItems)],
            ["Matched matters", caseItems.length.toLocaleString("en-US")],
            ["Source coverage", `${sourceLinks}/${caseItems.length}`],
            ["High-impact", highImpact.toLocaleString("en-US")],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #1f2937", background: "#111827", padding: 18 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 16, marginBottom: 24 }}>
          <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Active filters
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13, alignItems: "center" }}>
            {chips.length > 0 ? chips.map((item) => (
              <Link key={item.key} href={removeQueryParam("/dashboard", currentQuery, item.key)} style={{ border: "1px solid #334155", padding: "6px 8px", color: "#cbd5e1", textDecoration: "none" }} title={`Remove ${item.key}`}>
                {item.label} ×
              </Link>
            )) : <span style={{ border: "1px solid #334155", padding: "6px 8px", color: "#cbd5e1" }}>all matters</span>}
            {chips.length > 0 && <Link href="/dashboard" style={{ color: "#fbbf24", marginLeft: 8 }}>Reset</Link>}
          </div>
        </section>

        <section style={{ border: "1px solid #273449", background: "#101923", padding: 20, marginBottom: 24 }}>
          <div style={{ color: "#f59e0b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, marginBottom: 8 }}>
            Advisor readout
          </div>
          <p style={{ color: "#e5e7eb", fontSize: 18, lineHeight: 1.45, margin: "0 0 12px" }}>
            {caseItems.length === 0
              ? "No exact tracked matter matches these filters. Broaden one filter before treating this as a risk conclusion."
              : `The main signal is ${primaryFailure.replace(/-/g, " ")}, not AI use by itself. The practical control is a filing gate with citation, quote, proposition-support, signoff, and matter-audit checks.`}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13 }}>
            <a href={`/artifact/print?type=report&${artifactQuery.toString()}`} style={{ color: "#0f172a", background: "#fbbf24", padding: "8px 10px", textDecoration: "none", fontWeight: 800 }}>Open print view</a>
            <a href={`/api/artifact?type=report&format=word-ready&${artifactQuery.toString()}`} style={{ color: "#fbbf24", border: "1px solid #fbbf24", padding: "7px 10px", textDecoration: "none", fontWeight: 700 }}>Word-compatible</a>
            <a href={`/map?metric=cases${state ? `&states=${state}` : ""}${court ? `&court=${encodeURIComponent(court)}` : ""}${aiTool ? `&tool=${encodeURIComponent(aiTool)}` : ""}`} style={{ color: "#fbbf24", border: "1px solid #334155", padding: "7px 10px", textDecoration: "none", fontWeight: 700 }}>Map view</a>
            <a href={`/api/artifact?type=source&format=md&${artifactQuery.toString()}`} style={{ color: "#fbbf24", border: "1px solid #334155", padding: "7px 10px", textDecoration: "none", fontWeight: 700 }}>Source appendix</a>
          </div>
        </section>

        {caseItems.length === 0 && (
          <section style={{ border: "1px solid #7f1d1d", background: "#1f1111", padding: 18, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>No exact matches for these filters</h2>
            <p style={{ color: "#fecaca", marginBottom: 14 }}>
              The exact filter combination returned 0 matters. That does not mean there is no risk; broaden one filter and rerun the view.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {state && <Link href={`/dashboard?state=${state}&audience=${audience}`} style={{ color: "#fbbf24" }}>Show all {state} ({broaderStateItems.length})</Link>}
              {court && <Link href={removeQueryParam("/dashboard", currentQuery, "court")} style={{ color: "#fbbf24" }}>Remove court</Link>}
              {aiTool && <Link href={removeQueryParam("/dashboard", currentQuery, "ai_tool")} style={{ color: "#fbbf24" }}>Remove tool</Link>}
              <Link href="/dashboard" style={{ color: "#fbbf24" }}>Show national analogues</Link>
            </div>
          </section>
        )}

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
              <a href={`/artifact/print?type=report&${artifactQuery.toString()}`} style={{ color: "#fbbf24" }}>Open print view</a>
              <a href={`/api/artifact?type=report&format=word-ready&${artifactQuery.toString()}`} style={{ color: "#fbbf24" }}>Word-compatible</a>
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

        <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Recommended Controls</h2>
          <ol style={{ color: "#d1d5db", lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
            <li>Use a court-facing filing gate before partner review.</li>
            <li>Verify citations, quotations, and proposition support against primary or approved legal research sources.</li>
            <li>Save an exception report and source appendix to the matter file.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
