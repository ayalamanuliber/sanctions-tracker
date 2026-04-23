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

const GAP_TO_PRODUCT_AREA: Record<string, string> = {
  "written-ai-policy": "Firm-wide AI policy",
  "citation-verification": "Citation verification protocol",
  "paid-tool-verification": "Vendor tool review",
  "attorney-training": "Ethics CLE curriculum",
  "supervision-protocol": "Supervision sign-off",
  "ai-disclosure-protocol": "Court disclosure templates",
  "engagement-letter-ai": "Engagement letter clause",
  "approved-tools-list": "Approved tools list",
  "audit-trail": "AI audit trail SOP",
  "incident-response": "Incident response playbook",
};

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
          <p className="section-sub">
            {hasAnswers && gaps.length > 0 ? (
              <>These map directly to the gaps we just identified. Pick the depth your firm needs.</>
            ) : (
              <>Three depths of coverage — from a drop-in policy kit to a firm-wide compliance system with lifetime updates.</>
            )}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }} className="product-grid">
          {/* TIER 1 — AUDIT KIT */}
          <div className="product-tier" style={{ borderTop: "2px solid var(--amber)" }}>
            <div className="tier-top">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--amber)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Tier 1 &middot; Entry
              </div>
              <h3 className="tier-name">Audit Kit</h3>
              <p className="tier-tag">Drop-in policies + checklists. Fix this internally in 30 minutes.</p>
            </div>
            <div className="tier-price">
              <div className="price-line-through">$297</div>
              <div className="price-main amber">Free</div>
              <div className="price-sub">During beta</div>
            </div>
            <ul className="tier-list">
              <li>Written AI policy template</li>
              <li>Citation verification checklist</li>
              <li>Court disclosure language</li>
              <li>Engagement letter AI clause</li>
              <li>Incident response playbook</li>
            </ul>
            {hasAnswers && gaps.length > 0 && (
              <div className="tier-match">
                <div className="tier-match-label">Covers your gaps in</div>
                <div className="tier-match-chips">
                  {gaps.slice(0, 3).map((g) => (
                    <span key={g.id} className="tier-match-chip">{GAP_TO_PRODUCT_AREA[g.id] || g.id}</span>
                  ))}
                  {gaps.length > 3 && <span className="tier-match-chip muted">+{gaps.length - 3} more</span>}
                </div>
              </div>
            )}
            <a href="mailto:manuel@aivortex.io?subject=Audit%20Kit%20-%20Beta%20Request" className="tier-cta primary">
              Get Audit Kit
              <span className="arrow-line"></span>
            </a>
          </div>

          {/* TIER 2 — COMPLIANCE PACK */}
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
                Tier 2 &middot; Full System
              </div>
              <h3 className="tier-name">Compliance Pack</h3>
              <p className="tier-tag">Governance, workflows, SOPs. For firms that want defensible, documented compliance.</p>
            </div>
            <div className="tier-price">
              <div className="price-line-through">$1,497</div>
              <div className="price-main blue">Beta access</div>
              <div className="price-sub">Priced for early users</div>
            </div>
            <ul className="tier-list">
              <li>Everything in Audit Kit</li>
              <li>Firm-wide AI governance policy</li>
              <li>Attorney onboarding + CLE</li>
              <li>Approved tools registry</li>
              <li>Supervision sign-off workflow</li>
              <li>AI audit trail SOP</li>
            </ul>
            {hasAnswers && gaps.length > 0 && (
              <div className="tier-match">
                <div className="tier-match-label">Covers all {gaps.length} of your gaps</div>
                <div className="tier-match-chips">
                  {gaps.slice(0, 4).map((g) => (
                    <span key={g.id} className="tier-match-chip">{GAP_TO_PRODUCT_AREA[g.id] || g.id}</span>
                  ))}
                  {gaps.length > 4 && <span className="tier-match-chip muted">+{gaps.length - 4} more</span>}
                </div>
              </div>
            )}
            <a href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit" target="_blank" rel="noopener" className="tier-cta blue">
              Request Access
              <span className="arrow-line"></span>
            </a>
          </div>

          {/* TIER 3 — LIFETIME */}
          <div className="product-tier" style={{ borderTop: "2px solid #a855f7" }}>
            <div className="tier-top">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#a855f7",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Tier 3 &middot; Stay Ahead
              </div>
              <h3 className="tier-name">Lifetime</h3>
              <p className="tier-tag">Everything, forever. Updates as the case law evolves. Priority access to new playbooks.</p>
            </div>
            <div className="tier-price">
              <div className="price-line-through">TBD</div>
              <div className="price-main" style={{ color: "#a855f7" }}>Early user lock</div>
              <div className="price-sub">Priced once, access forever</div>
            </div>
            <ul className="tier-list">
              <li>Everything in Compliance Pack</li>
              <li>Lifetime updates as courts evolve</li>
              <li>All future playbooks included</li>
              <li>Priority review of new sanctions</li>
              <li>Private intelligence feed</li>
              <li>Direct line for urgent questions</li>
            </ul>
            <a href="mailto:manuel@aivortex.io?subject=Lifetime%20Access%20-%20Early%20User" className="tier-cta purple">
              Lock Early Price
              <span className="arrow-line"></span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .product-tier {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 28px 28px 32px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.25s;
        }
        .product-tier:hover { border-color: var(--text-500); }
        .tier-top { margin-bottom: 20px; }
        .tier-name {
          font-family: var(--font-serif);
          font-size: 30px;
          font-weight: 500;
          color: var(--text-100);
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 10px;
        }
        .tier-tag {
          color: var(--text-400);
          font-size: 13px;
          line-height: 1.6;
          font-weight: 300;
        }
        .tier-price {
          padding: 18px 0;
          margin-bottom: 20px;
          border-top: 1px solid var(--border-soft);
          border-bottom: 1px solid var(--border-soft);
        }
        .price-line-through {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-600);
          text-decoration: line-through;
          letter-spacing: 0.12em;
          margin-bottom: 4px;
        }
        .price-main {
          font-family: var(--font-serif);
          font-size: 32px;
          font-weight: 500;
          font-style: italic;
          letter-spacing: -0.03em;
          line-height: 1;
          color: var(--text-100);
        }
        .price-main.amber { color: var(--amber); }
        .price-main.blue { color: var(--blue); }
        .price-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--text-500);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .tier-list {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          flex: 1;
        }
        .tier-list li {
          font-size: 13px;
          color: var(--text-300);
          line-height: 1.6;
          padding: 8px 0 8px 22px;
          position: relative;
          border-bottom: 1px solid var(--border-soft);
        }
        .tier-list li:last-child { border-bottom: 0; }
        .tier-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          top: 8px;
          color: var(--text-500);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .tier-match {
          margin-bottom: 20px;
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
        .tier-match-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
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
        .tier-match-chip.muted {
          color: var(--text-500);
        }
        .tier-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 20px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s;
          margin-top: auto;
        }
        .tier-cta.primary {
          background: var(--bone);
          color: var(--bg);
          border: 1px solid var(--bone);
        }
        .tier-cta.primary:hover {
          background: var(--white);
          border-color: var(--white);
        }
        .tier-cta.primary .arrow-line {
          width: 20px; height: 1px; background: var(--bg); position: relative;
        }
        .tier-cta.primary .arrow-line::after {
          content: ''; position: absolute; right: -1px; top: -3px;
          width: 7px; height: 7px;
          border-top: 1px solid var(--bg); border-right: 1px solid var(--bg);
          transform: rotate(45deg);
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
          background: transparent;
          color: #a855f7;
          border: 1px solid rgba(168,85,247,0.4);
        }
        .tier-cta.purple:hover {
          background: rgba(168,85,247,0.08);
          border-color: #a855f7;
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
        @media (max-width: 1024px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
