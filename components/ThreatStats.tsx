"use client";

import sanctions from "@/data/sanctions.json";
import meta from "@/data/meta.json";

type SanctionCase = { country: string; amount: number | null; case_name: string; court: string; date: string; severity: string | null };
const SANCTIONS = (sanctions as unknown) as SanctionCase[];
const META = meta as unknown as { by_week: Record<string, number>; us_cases: number };

export default function ThreatStats() {
  // Weekly pace — average of last 8 weeks
  const recentWeeks = Object.entries(META.by_week || {}).sort().slice(-8).map(([, n]) => n);
  const avgWeekly = recentWeeks.length ? Math.round(recentWeeks.reduce((a, b) => a + b, 0) / recentWeeks.length) : 0;

  // US largest
  const usCases = SANCTIONS.filter((c) => c.country === "US" && c.amount);
  const largest = usCases.sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];

  // Single-day record — count cases per date, find peak
  const byDate: Record<string, number> = {};
  SANCTIONS.forEach((c) => { if (c.date) byDate[c.date] = (byDate[c.date] || 0) + 1; });
  const [peakDate, peakCount] = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

  const items = [
    {
      label: "Sanctioning pace",
      headline: avgWeekly > 0 ? `~${avgWeekly} / week` : "Weekly",
      note: `Average new rulings per week over the last 8 weeks. Across ${META.us_cases} US cases tracked.`,
      accent: "amber" as const,
    },
    {
      label: "Single-day record",
      headline: `${peakCount} courts`,
      note: `Most AI-hallucination rulings on one day (${peakDate}). This curve is accelerating.`,
      accent: "blue" as const,
    },
    {
      label: "Largest US sanction",
      headline: largest ? `$${(largest.amount! / 1000).toFixed(1)}K` : "—",
      note: largest ? `${largest.case_name} · ${largest.court}` : "",
      accent: "red" as const,
    },
  ];

  const colorMap: Record<string, string> = {
    amber: "var(--amber)",
    blue: "var(--blue)",
    red: "var(--red-muted)",
  };

  return (
    <section className="strip" style={{ padding: "56px 0" }}>
      <div className="wrap">
        <div style={{ marginBottom: "28px", maxWidth: "720px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--amber)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ width: "5px", height: "5px", background: "var(--amber)" }}></span>
            What&rsquo;s happening
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(24px, 2.6vw, 32px)",
              fontWeight: 500,
              color: "var(--text-100)",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            Judges are sanctioning attorneys <em style={{ color: "var(--amber)" }}>weekly</em> for AI-hallucinated filings.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)" }} className="proof-grid">
          {items.map((item, i) => (
            <div key={i} className="stat-cell" style={{ padding: "28px 26px" }}>
              <div className="stat-label">{item.label}</div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(32px, 3.6vw, 42px)",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  color: colorMap[item.accent],
                  fontStyle: "italic",
                  marginBottom: "14px",
                }}
              >
                {item.headline}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-400)",
                  lineHeight: 1.65,
                  fontWeight: 300,
                }}
              >
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .proof-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
