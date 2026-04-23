export default function FinalClose() {
  return (
    <section id="final-close" className="section">
      <div className="wrap" style={{ maxWidth: "900px" }}>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            padding: "clamp(48px, 7vw, 88px) clamp(32px, 5vw, 64px)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, var(--blue) 0%, var(--amber) 100%)",
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-500)",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              marginBottom: "28px",
            }}
          >
            ◆ The truth
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 500,
              color: "var(--text-100)",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              fontStyle: "italic",
              marginBottom: "32px",
              maxWidth: "760px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Most firms don&rsquo;t get sanctioned for using AI.
            <br />
            They get sanctioned for using it <span style={{ color: "var(--amber)" }}>without a system</span>.
          </h2>
          <p
            style={{
              color: "var(--text-400)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: 1.7,
              maxWidth: "560px",
              margin: "0 auto 44px",
            }}
          >
            The courts are not subtle about what they want. They want proof you have a system &mdash; and they&rsquo;re willing to fine six figures to enforce it.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a href="#assessment" className="hero-btn-primary">
              Re-run the check
              <span className="arrow-line"></span>
            </a>
            <a href="#products" className="hero-btn-secondary">Get the Kit</a>
            <a
              href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
              target="_blank"
              rel="noopener"
              className="hero-btn-blue"
            >
              Request Audit
            </a>
          </div>

          <div
            style={{
              marginTop: "48px",
              paddingTop: "28px",
              borderTop: "1px solid var(--border-soft)",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-600)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Independent &middot; No vendor pitch &middot; Built by an operator
          </div>
        </div>
      </div>
    </section>
  );
}
