import Link from "next/link";

export default function SourcesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px 72px" }}>
        <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Sources</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "8px 0 14px" }}>Source Appendix Studio</h1>
        <p style={{ color: "#94a3b8", maxWidth: 760 }}>Export source-backed appendices with coverage counts, missing-source warnings, filters used, and AI Vortex attribution.</p>
        <section style={{ display: "grid", gap: 12, marginTop: 28 }}>
          {[
            ["All source appendix", "/api/artifact?type=source&format=md"],
            ["New Jersey source appendix", "/api/artifact?type=source&format=md&state=NJ"],
            ["New York source appendix", "/api/artifact?type=source&format=md&state=NY"],
            ["Print-ready report", "/artifact/print?type=report"],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={{ border: "1px solid #1f2937", background: "#111827", color: "#fbbf24", padding: 16, textDecoration: "none", fontWeight: 800 }}>
              {label}
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
