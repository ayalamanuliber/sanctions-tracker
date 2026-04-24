"use client";

import questions from "@/data/questions.json";

interface PolicyQuestion {
  id: string;
  question: string;
  category: string;
  proof_snippet: string;
  risk_weight: number;
  why: string;
}

interface Props {
  answers: Record<string, boolean>;
}

// Placeholder: update when real lifetime sales start
const LIFETIME_TAKEN = 3;
const LIFETIME_TOTAL = 50;
const LIFETIME_LEFT = LIFETIME_TOTAL - LIFETIME_TAKEN;

export default function ProductLayer({ answers }: Props) {
  const typedQuestions = questions as PolicyQuestion[];
  const gaps = typedQuestions.filter((q) => answers[q.id] === false);
  const hasAnswers = Object.keys(answers).length >= 3;

  return (
    <section className="section alt" id="products">
      <div className="wrap">
        <div className="section-head amber">
          <div className="section-label amber">
            <span className="tick"></span>
            {hasAnswers ? `Based on your ${gaps.length} gap${gaps.length === 1 ? "" : "s"}` : "Fix your exposure"}
          </div>
          <h2 className="section-heading">
            {hasAnswers && gaps.length > 0 ? (
              <>Your <em>solution</em>, not a product.</>
            ) : (
              <>Fix your <em>exposure</em>.</>
            )}
          </h2>
          {hasAnswers && gaps.length > 0 && (
            <p
              style={{
                marginTop: "12px",
                marginBottom: "14px",
                fontFamily: "var(--font-serif)",
                fontSize: "19px",
                fontWeight: 500,
                color: "var(--text-100)",
                letterSpacing: "-0.015em",
                fontStyle: "italic",
              }}
            >
              You already know where you&rsquo;re exposed. This fixes it.
            </p>
          )}
          <p className="section-sub">
            Two ways in. Monthly for firms that want coverage. One-time for early users who want to lock it in before this becomes standard firm pricing.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="product-grid">
          {/* TIER 1 — FIRM ACCESS */}
          <div className="product-tier" style={{ borderTop: "2px solid var(--blue)" }}>
            <div className="tier-top">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--blue)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Stay out of sanctions
              </div>
              <h3 className="tier-name">Firm Access</h3>
              <p className="tier-tag">Full system for firms that want to stay out of sanctions. Cancel anytime.</p>
            </div>
            <div className="tier-price">
              <div className="price-main blue">
                $299
                <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-500)", fontStyle: "normal", marginLeft: "4px", letterSpacing: "0" }}>/ month</span>
              </div>
              <div className="price-sub">Monthly subscription</div>
            </div>
            <ul className="tier-list">
              <li>Full precedent database — all cases, every jurisdiction</li>
              <li>Compliance templates (updated monthly)</li>
              <li>Monthly updates + ruling alerts</li>
              <li>Priority email support</li>
              <li>New cases surfaced within 48h of filing</li>
            </ul>
            {hasAnswers && gaps.length > 0 && (
              <div className="tier-match">
                <div className="tier-match-label">Covers your {gaps.length} gap{gaps.length === 1 ? "" : "s"}</div>
                <div className="tier-match-chips">
                  {gaps.slice(0, 4).map((g) => (
                    <span key={g.id} className="tier-match-chip">
                      {g.id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                  {gaps.length > 4 && <span className="tier-match-chip muted">+{gaps.length - 4} more</span>}
                </div>
              </div>
            )}
            <a
              href="mailto:manuel@aivortex.io?subject=Firm%20Access%20%E2%80%94%20%24299%2Fmo"
              className="tier-cta blue"
            >
              Get Firm Access
              <span className="arrow-line"></span>
            </a>
            <div
              style={{
                marginTop: "10px",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                color: "var(--text-600)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Cancel anytime &middot; No setup
            </div>
          </div>

          {/* TIER 2 — FOUNDING LIFETIME */}
          <div className="product-tier founding" style={{ borderTop: "2px solid #a855f7" }}>
            <div className="tier-top">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#a855f7",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  Stay ahead of courts
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#a855f7",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    border: "1px solid rgba(168,85,247,0.4)",
                    background: "rgba(168,85,247,0.08)",
                  }}
                >
                  ◆ {LIFETIME_LEFT} / {LIFETIME_TOTAL} left
                </div>
              </div>
              <h3 className="tier-name">Founding Member Access</h3>
              <p className="tier-tag">Lock access before this becomes standard firm pricing.</p>
            </div>
            <div className="tier-price">
              <div className="price-main" style={{ color: "#a855f7" }}>
                $999
                <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-500)", fontStyle: "normal", marginLeft: "4px", letterSpacing: "0" }}>one-time</span>
              </div>
              <div className="price-sub">Priced once &middot; access forever</div>
            </div>
            <ul className="tier-list">
              <li>Everything in Firm Access</li>
              <li>All future updates — forever</li>
              <li>Priority access to new playbooks</li>
              <li>Private ruling-alert channel</li>
              <li>Direct line to Manu (limited)</li>
              <li>Early user lock &mdash; price never raised on you</li>
            </ul>
            <a
              href="mailto:manuel@aivortex.io?subject=Founding%20Lifetime%20%E2%80%94%20%24999"
              className="tier-cta purple"
            >
              Lock Lifetime Access
              <span className="arrow-line"></span>
            </a>
            <div
              style={{
                marginTop: "10px",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                color: "#a855f7",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {LIFETIME_LEFT} spots remaining
            </div>
            <div
              style={{
                marginTop: "4px",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-500)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Closes once filled
            </div>
          </div>
        </div>

        {/* Small note below */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-500)",
            letterSpacing: "0.14em",
          }}
        >
          Need a one-time review of your existing workflows instead?{" "}
          <a
            href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
            target="_blank"
            rel="noopener"
            style={{ color: "var(--text-300)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}
          >
            Request an audit →
          </a>
        </div>
      </div>

      <style>{`
        .product-tier {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 32px 32px 36px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.25s;
          position: relative;
        }
        .product-tier:hover { border-color: var(--text-500); }
        .product-tier.founding { background: linear-gradient(180deg, var(--bg-card) 0%, rgba(168,85,247,0.04) 100%); }
        .tier-top { margin-bottom: 22px; }
        .tier-name {
          font-family: var(--font-serif);
          font-size: 34px;
          font-weight: 500;
          color: var(--text-100);
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 10px;
        }
        .tier-tag {
          color: var(--text-400);
          font-size: 14px;
          line-height: 1.6;
          font-weight: 300;
        }
        .tier-price {
          padding: 18px 0;
          margin-bottom: 22px;
          border-top: 1px solid var(--border-soft);
          border-bottom: 1px solid var(--border-soft);
        }
        .price-main {
          font-family: var(--font-serif);
          font-size: 48px;
          font-weight: 500;
          font-style: italic;
          letter-spacing: -0.035em;
          line-height: 1;
          color: var(--text-100);
        }
        .price-main.blue { color: var(--blue); }
        .price-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--text-500);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 10px;
        }
        .tier-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          flex: 1;
        }
        .tier-list li {
          font-size: 13.5px;
          color: var(--text-300);
          line-height: 1.6;
          padding: 10px 0 10px 22px;
          position: relative;
          border-bottom: 1px solid var(--border-soft);
        }
        .tier-list li:last-child { border-bottom: 0; }
        .tier-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          top: 10px;
          color: var(--text-500);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .tier-match {
          margin-bottom: 22px;
          padding: 14px 16px;
          background: var(--bg-subtle);
          border: 1px solid var(--border-soft);
        }
        .tier-match-label {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--text-500);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .tier-match-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .tier-match-chip {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          color: var(--text-300);
          letter-spacing: 0.08em;
          padding: 4px 8px;
          background: var(--bg);
          border: 1px solid var(--border-soft);
        }
        .tier-match-chip.muted { color: var(--text-500); }
        .tier-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 22px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s;
          margin-top: auto;
        }
        .tier-cta.blue {
          background: var(--blue);
          color: var(--white);
          border: 1px solid var(--blue);
        }
        .tier-cta.blue:hover {
          background: var(--blue-dark);
          border-color: var(--blue-dark);
        }
        .tier-cta.blue .arrow-line {
          width: 20px; height: 1px; background: var(--white); position: relative;
        }
        .tier-cta.blue .arrow-line::after {
          content: ''; position: absolute; right: -1px; top: -3px;
          width: 7px; height: 7px;
          border-top: 1px solid var(--white); border-right: 1px solid var(--white);
          transform: rotate(45deg);
        }
        .tier-cta.purple {
          background: rgba(168,85,247,0.12);
          color: #a855f7;
          border: 1px solid rgba(168,85,247,0.5);
        }
        .tier-cta.purple:hover {
          background: rgba(168,85,247,0.2);
          border-color: #a855f7;
          color: #c084fc;
        }
        .tier-cta.purple .arrow-line {
          width: 20px; height: 1px; background: #a855f7; position: relative;
        }
        .tier-cta.purple .arrow-line::after {
          content: ''; position: absolute; right: -1px; top: -3px;
          width: 7px; height: 7px;
          border-top: 1px solid #a855f7; border-right: 1px solid #a855f7;
          transform: rotate(45deg);
        }
        @media (max-width: 900px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
