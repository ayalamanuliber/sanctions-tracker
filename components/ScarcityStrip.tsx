export default function ScarcityStrip() {
  return (
    <section id="scarcity" style={{ background: "var(--bg-subtle)", borderTop: "1px solid var(--border-soft)", borderBottom: "1px solid var(--border-soft)", padding: "22px 0" }}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              background: "var(--amber)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          ></span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--amber)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Free during beta
          </span>
        </div>
        <span style={{ width: "1px", height: "14px", background: "var(--text-600)" }}></span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-400)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Lifetime access priced for early users
        </span>
        <span style={{ width: "1px", height: "14px", background: "var(--text-600)" }}></span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-500)",
            letterSpacing: "0.12em",
          }}
        >
          This isn&rsquo;t SaaS &mdash; it&rsquo;s early infrastructure adoption.
        </span>
      </div>
    </section>
  );
}
