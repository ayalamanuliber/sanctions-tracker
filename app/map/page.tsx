import Link from "next/link";

import SanctionsMapV2 from "@/components/SanctionsMapV2";
import metaRaw from "@/data/meta.json";

type PageProps = {
  searchParams?: Promise<{
    state?: string;
    states?: string;
    tool?: string;
    failure?: string;
    severity?: string;
    court?: string;
    audience?: string;
    metric?: string;
  }>;
};

const meta = metaRaw as { last_updated: string; total_cases: number; us_cases: number };

function splitStates(state?: string, states?: string): string[] {
  const raw = states || state || "";
  return raw.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
}

export default async function MapPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const selectedStates = splitStates(resolved?.state, resolved?.states);
  const audience = resolved?.audience || "managing_partner";
  const metric = resolved?.metric === "severity" ? "severity" : "cases";

  const sourceQuery = new URLSearchParams();
  if (selectedStates.length === 1) sourceQuery.set("state", selectedStates[0]);
  if (resolved?.tool) sourceQuery.set("ai_tool", resolved.tool);

  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "34px 24px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Vortex Legal AI Risk
            </p>
            <h1 style={{ margin: "8px 0", fontSize: 36, lineHeight: 1.05 }}>Legal AI risk map</h1>
            <p style={{ color: "#94a3b8", maxWidth: 820 }}>
              Real U.S. map of tracked public legal AI risk matters. Pin color is severity; pin size reflects known monetary sanction. Public incidents are not usage-adjusted rates.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link href={`/dashboard${selectedStates[0] ? `?state=${selectedStates[0]}&audience=${audience}` : `?audience=${audience}`}`} style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
              Dashboard
            </Link>
            <Link href={`/api/artifact?type=source&format=md&${sourceQuery.toString()}`} style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
              Sources
            </Link>
          </div>
        </header>

        <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 16, marginBottom: 18 }}>
          <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Active filters
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
            {[
              `states=${selectedStates.length > 0 ? selectedStates.join(",") : "all"}`,
              `tool=${resolved?.tool || "all"}`,
              `failure=${resolved?.failure || "all"}`,
              `severity=${resolved?.severity || "all"}`,
              `court=${resolved?.court || "all"}`,
              `metric=${metric}`,
              `audience=${audience}`,
              `updated=${meta.last_updated}`,
            ].map((item) => (
              <span key={item} style={{ border: "1px solid #334155", padding: "6px 8px", color: "#cbd5e1" }}>{item}</span>
            ))}
          </div>
        </section>
      </div>

      <SanctionsMapV2
        initialStates={selectedStates}
        initialSeverity={resolved?.severity || "all"}
        initialTool={resolved?.tool}
        initialFailure={resolved?.failure}
        initialCourt={resolved?.court}
        initialAudience={audience}
        embedded
        showIntro={false}
        showControls
        showSideRail
        showExportLinks
        dataMode={metric}
      />
    </main>
  );
}
