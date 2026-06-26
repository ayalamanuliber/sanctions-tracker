import Link from "next/link";

export default function PolicyStudioPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 24px 72px" }}>
        <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Prevent</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "8px 0 14px" }}>Policy Studio</h1>
        <p style={{ color: "#94a3b8", maxWidth: 760 }}>Generate short operational policies, outside counsel addenda, approved-use matrices, incident response protocols, and training handouts from source-backed risk patterns.</p>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 28 }}>
          {["Litigation department policy", "Outside counsel AI addendum", "Approved-use matrix", "Incident response protocol"].map((item) => (
            <div key={item} style={{ border: "1px solid #1f2937", background: "#111827", padding: 18 }}>
              <h2 style={{ fontSize: 18 }}>{item}</h2>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Built around verification gates, source appendix, and implementation schedule.</p>
            </div>
          ))}
        </section>
        <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
          <Link href="/api/artifact?type=report&format=word-ready&title=AI%20Filing%20Policy%20Gap%20Report" style={{ color: "#fbbf24", fontWeight: 800 }}>Word-ready policy</Link>
          <Link href="/api/artifact?type=source&format=md" style={{ color: "#fbbf24", fontWeight: 800 }}>Source appendix</Link>
        </div>
      </div>
    </main>
  );
}
