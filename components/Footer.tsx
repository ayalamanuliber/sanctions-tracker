export default function Footer() {
  return (
    <>
      {/* AUTHOR SECTION — matches aivortex hub */}
      <section className="section" id="author">
        <div className="wrap">
          <div className="section-head amber">
            <div className="section-label amber">
              <span className="tick"></span>
              From the Advisor
            </div>
            <h2 className="section-heading">
              I'm an <em>operator</em>, not a vendor.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: "64px",
              alignItems: "start",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
            className="author-grid"
          >
            <div>
              <div
                style={{
                  width: "240px",
                  height: "240px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  padding: "4px",
                  background: "var(--bg-card)",
                  position: "relative",
                }}
              >
                <img src="/manuel.webp" alt="Manu Ayala" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-1px",
                    right: "-1px",
                    background: "var(--amber)",
                    color: "var(--bg)",
                    padding: "6px 12px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  Independent
                </div>
              </div>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(22px, 2.8vw, 30px)",
                  fontWeight: 400,
                  color: "var(--text-100)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  marginBottom: "24px",
                  fontStyle: "italic",
                }}
              >
                "Five years inside a US law firm watching how legal work actually moves. This tracker is what I'd want if I ran a firm."
              </p>
              <p style={{ fontSize: "16px", color: "var(--text-400)", lineHeight: 1.75, marginBottom: "12px", fontWeight: 300 }}>
                I'm Manu Ayala. I spent five years running investigations at a US law firm. Now I run AI Vortex, where I help firms figure out where they actually stand on AI and build the infrastructure to get there. I write what I find at{" "}
                <a href="https://www.aivortex.io/legal" style={{ color: "var(--blue)", textDecoration: "none", borderBottom: "1px solid rgba(0,102,255,0.3)" }}>
                  aivortex.io/legal
                </a>.
              </p>
              <div
                style={{
                  marginTop: "32px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                  paddingTop: "24px",
                  borderTop: "1px solid var(--border-soft)",
                }}
              >
                <a
                  href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
                  target="_blank"
                  rel="noopener"
                  className="hero-btn-blue"
                  style={{ padding: "12px 20px", fontSize: "10px" }}
                >
                  Book a Call
                </a>
                <a
                  href="mailto:manuel@aivortex.io"
                  className="hero-btn-secondary"
                  style={{ padding: "12px 20px", fontSize: "10px" }}
                >
                  Email
                </a>
                <a
                  href="https://www.linkedin.com/in/aivortex/"
                  target="_blank"
                  rel="noopener"
                  aria-label="LinkedIn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    border: "1px solid var(--border)",
                    color: "var(--text-400)",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-cols">
            <div className="footer-brand-col">
              <div className="footer-brand">
                <img src="/av-logo-white.png" alt="AI Vortex" />
                <span className="footer-brand-name">AI Vortex</span>
              </div>
              <p className="footer-tagline">
                Independent AI intelligence for the legal market. No theory. No vendor pitch. Just data.
              </p>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Directories</div>
              <a href="https://www.aivortex.io/legal/ai-disclosure/">AI Disclosure Rules</a>
              <a href="https://www.aivortex.io/legal/ai-regulation/">State AI Regulation</a>
              <a href="https://www.aivortex.io/legal/ai-case-law/">AI Case Law</a>
              <a href="https://www.aivortex.io/legal/ai-tools/">AI Tools for Lawyers</a>
              <a href="https://www.aivortex.io/legal/ai-by-practice/">AI by Practice Area</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Intelligence</div>
              <a href="https://www.aivortex.io/legal/kpmg-billable-hour/">KPMG & the Billable Hour</a>
              <a href="https://www.aivortex.io/legal/claude-mythos/">Claude Mythos</a>
              <a href="https://www.aivortex.io/legal/5-levels/">5 Levels of Legal AI</a>
              <a href="https://www.aivortex.io/legal/sequoia-line/">Sequoia's Revenue Line</a>
              <a href="https://www.aivortex.io/legal/next-lawyer/">The Next Lawyer</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Connect</div>
              <a href="mailto:manuel@aivortex.io" className="footer-email">manuel@aivortex.io</a>
              <a href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noopener">LinkedIn</a>
              <a href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit" target="_blank" rel="noopener">Book a Call</a>
              <a href="https://www.aivortex.io/legal/sitemap/">Sitemap</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 AI Vortex · Manu Ayala</span>
            <span className="footer-independent">Independent · Data: Charlotin Tracker + public records</span>
          </div>
        </div>
      </footer>
    </>
  );
}
