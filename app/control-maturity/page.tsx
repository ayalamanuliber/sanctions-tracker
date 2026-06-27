import Link from "next/link";

const controls = [
  "Formal AI filing policy",
  "Citation verification",
  "Quote and pincite verification",
  "Proposition-support verification",
  "Disclosure/judge-order check",
  "Supervisor signoff",
  "Matter audit trail",
  "Incident response",
];

export default function ControlMaturityPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 24px 72px" }}>
        <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Prove</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "8px 0 14px" }}>Control Maturity Score</h1>
        <p style={{ color: "#94a3b8", maxWidth: 760 }}>An 8-control readiness score for court-facing AI use. Score each control 0-3, then generate next-week and 30-day controls.</p>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 28 }}>
          {controls.map((control, index) => (
            <div key={control} style={{ border: "1px solid #1f2937", background: "#111827", padding: 16 }}>
              <div style={{ color: "#fbbf24", fontWeight: 900 }}>{index + 1}</div>
              <div style={{ fontWeight: 800, marginTop: 8 }}>{control}</div>
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>0 none · 1 informal · 2 documented · 3 enforced/auditable</div>
            </div>
          ))}
        </section>
        <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
          <Link href="/dashboard?audience=risk_committee" style={{ color: "#fbbf24", fontWeight: 800 }}>Risk dashboard</Link>
          <Link href="/artifact/print?type=report&title=AI%20Control%20Maturity%20Score" style={{ color: "#fbbf24", fontWeight: 800 }}>Open print-ready score memo</Link>
        </div>
      </div>
    </main>
  );
}
