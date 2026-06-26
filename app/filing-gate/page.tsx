import Link from "next/link";

const gates = ["AI-use intake", "Citation gate", "Quote gate", "Proposition gate", "Disclosure gate", "Partner exception report", "Audit trail", "Incident pause rule"];

export default function FilingGatePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 24px 72px" }}>
        <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Prevent</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "8px 0 14px" }}>AI Filing Gate</h1>
        <p style={{ color: "#94a3b8", maxWidth: 760 }}>A practical pre-filing workflow for court-facing work touched by AI. Built to reduce fake citation, quote, proposition-support, disclosure, and supervision failures.</p>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 28 }}>
          {gates.map((gate, index) => (
            <div key={gate} style={{ border: "1px solid #1f2937", background: "#111827", padding: 16 }}>
              <div style={{ color: "#fbbf24", fontWeight: 900 }}>Gate {index + 1}</div>
              <div style={{ fontWeight: 800, marginTop: 8 }}>{gate}</div>
            </div>
          ))}
        </section>
        <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
          <Link href="/api/artifact?type=ledger&format=csv" style={{ color: "#fbbf24", fontWeight: 800 }}>Ledger CSV</Link>
          <Link href="/api/artifact?type=ledger&format=word-ready" style={{ color: "#fbbf24", fontWeight: 800 }}>Word-ready ledger</Link>
          <Link href="/dashboard?audience=litigation_partner" style={{ color: "#fbbf24", fontWeight: 800 }}>Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
