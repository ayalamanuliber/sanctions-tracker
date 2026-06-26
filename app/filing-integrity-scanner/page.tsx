import Link from "next/link";

export default function FilingIntegrityScannerPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 24px 72px" }}>
        <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Detect</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "8px 0 14px" }}>Filing Integrity Scanner</h1>
        <p style={{ color: "#94a3b8", maxWidth: 760 }}>
          A neutral workflow for reviewing suspicious citations, quotes, and propositions. This is not an AI misconduct detector; it is a discrepancy review system.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 28 }}>
          {["Existence check", "Quote check", "Proposition support"].map((title) => (
            <div key={title} style={{ border: "1px solid #1f2937", background: "#111827", padding: 18 }}>
              <h2 style={{ fontSize: 18 }}>{title}</h2>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Document the discrepancy, preserve the source, and escalate proportionally.</p>
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #1f2937", background: "#111827", padding: 20, marginTop: 20 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Discrepancy Matrix</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Item", "Problem type", "Evidence needed", "Action"].map((h) => <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #1f2937", color: "#94a3b8" }}>{h}</th>)}</tr></thead>
              <tbody>
                {["fake_case", "fake_quote", "unsupported_proposition", "bad_pincite"].map((label) => (
                  <tr key={label}>
                    <td style={{ padding: 10, borderBottom: "1px solid #1f2937" }}>{label}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #1f2937" }}>Verify against primary source</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #1f2937" }}>Filed brief, source PDF, side-by-side comparison</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #1f2937" }}>Correct request, M&C, court notice, OSC only with clean record</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
          <Link href="/api/artifact?type=opposing&format=word-ready" style={{ color: "#fbbf24", fontWeight: 800 }}>Word-ready scanner</Link>
          <Link href="/api/artifact?type=source&format=md" style={{ color: "#fbbf24", fontWeight: 800 }}>Source appendix</Link>
        </div>
      </div>
    </main>
  );
}
