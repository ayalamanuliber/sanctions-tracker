"use client";

export default function ThreatStats() {
  const items = [
    {
      label: "Sanctioning pace",
      headline: "Weekly",
      note: "Judges are sanctioning attorneys for AI-hallucinated filings — every week.",
      accent: "amber" as const,
    },
    {
      label: "Single-day record",
      headline: "17 courts",
      note: "AI-hallucination rulings issued in a single day (Mar 31, 2026) across 4 circuits.",
      accent: "blue" as const,
    },
    {
      label: "Largest sanction",
      headline: "$109,700",
      note: "Couvrette v. Wisnovsky · D. Or. — AI use called a “sustained campaign of deception.”",
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
