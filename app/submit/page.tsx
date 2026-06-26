export default function SubmitPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0d12", color: "#f8fafc" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px 72px" }}>
        <p style={{ color: "#f59e0b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Contribute</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "8px 0 14px" }}>Submit a case, correction, rule, or source</h1>
        <p style={{ color: "#94a3b8", maxWidth: 760 }}>Submissions are manually reviewed before inclusion. Do not submit confidential client information.</p>
        <form style={{ display: "grid", gap: 12, marginTop: 28 }}>
          {[
            ["Submission type", "New case / correction / court rule / judge order / source link"],
            ["Case or rule name", "Matter name, court rule, standing order, or source title"],
            ["Court / jurisdiction", "Court, state, country, or judge"],
            ["Source URL", "Public URL only"],
            ["Notes", "What should AI Vortex review?"],
            ["Contact email", "Optional, for follow-up"],
          ].map(([label, placeholder]) => (
            <label key={label} style={{ display: "grid", gap: 6, color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}>
              {label}
              {label === "Notes" ? (
                <textarea placeholder={placeholder} rows={5} style={{ background: "#111827", border: "1px solid #1f2937", color: "#f8fafc", padding: 12 }} />
              ) : (
                <input placeholder={placeholder} style={{ background: "#111827", border: "1px solid #1f2937", color: "#f8fafc", padding: 12 }} />
              )}
            </label>
          ))}
          <button type="button" style={{ justifySelf: "start", background: "#f59e0b", color: "#111827", border: 0, padding: "12px 18px", fontWeight: 900 }}>
            Manual submission queue coming next
          </button>
        </form>
      </div>
    </main>
  );
}
