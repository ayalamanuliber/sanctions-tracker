"use client";

import cases from "@/data/cases.json";

interface Props {
  answers: Record<string, boolean>;
}

function countCasesWithGaps(gapIds: string[]): number {
  return cases.filter((c) => c.policy_gap_ids.some((g: string) => gapIds.includes(g))).length;
}

const recommendations = [
  {
    id: "written-ai-policy",
    num: 1,
    title: "Written AI Policy",
    description: "Establish a firm-wide AI use policy. Courts cite its absence as an aggravating factor.",
    remediation: "Draft and distribute a firm-wide policy. Require all attorneys to sign acknowledgment. Review quarterly.",
    gaps: ["written-ai-policy"],
  },
  {
    id: "citation-verification",
    num: 2,
    title: "Citation Verification Protocol",
    description: "Every AI citation must be independently verified before filing — including paid tools.",
    remediation: "Require a second attorney to verify every AI citation against Westlaw or CourtListener. No self-verification.",
    gaps: ["citation-verification", "paid-tool-verification"],
  },
  {
    id: "ai-disclosure-protocol",
    num: 3,
    title: "AI Disclosure Tracking",
    description: "300+ courts now have disclosure requirements. Track which apply to your jurisdictions.",
    remediation: "Maintain a current list of disclosure rules for every jurisdiction you practice in. Build disclosure into filing templates.",
    gaps: ["ai-disclosure-protocol"],
  },
  {
    id: "attorney-training",
    num: 4,
    title: "Mandatory Training",
    description: "Annual AI ethics training for all attorneys. Courts order this as a remedial measure.",
    remediation: "Implement annual AI ethics CLE: hallucination risks, verification, disclosure, and ABA Opinion 512 obligations.",
    gaps: ["attorney-training"],
  },
  {
    id: "supervision-protocol",
    num: 5,
    title: "Supervision Structure",
    description: "Designate a partner or committee for AI oversight. All signers are individually liable.",
    remediation: "Create a sign-off checklist for AI-assisted filings. Require substantive review, not just style review.",
    gaps: ["supervision-protocol"],
  },
  {
    id: "audit-trail",
    num: 6,
    title: "Audit Trail",
    description: "Document which portions of filings are AI-assisted. This is your defense in sanctions hearings.",
    remediation: "Tag AI-drafted sections in your workflow. Log which tool was used. Record the verification step.",
    gaps: ["audit-trail"],
  },
  {
    id: "approved-tools-list",
    num: 7,
    title: "Approved Tools List",
    description: "Maintain a sanctioned AI tools list with clear usage boundaries.",
    remediation: "Specify permitted use cases per tool. Require approval for new tools. Block consumer-grade tools on firm networks.",
    gaps: ["approved-tools-list"],
  },
  {
    id: "incident-response",
    num: 8,
    title: "Incident Response Plan",
    description: "Document what happens when AI errors are discovered post-filing.",
    remediation: "Three-step protocol: (1) Immediate corrective filing to the court. (2) Candid client notification. (3) Root cause documentation.",
    gaps: ["incident-response"],
  },
];

export default function PolicyRecommendations({ answers }: Props) {
  const hasAnswers = Object.keys(answers).length > 0;
  const sorted = [...recommendations].sort((a, b) => {
    const aIsGap = answers[a.id] === false ? 1 : 0;
    const bIsGap = answers[b.id] === false ? 1 : 0;
    return bIsGap - aIsGap;
  });

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head blue">
          <div className="section-label blue">
            <span className="tick blue"></span>
            Action Framework
          </div>
          <h2 className="section-heading">
            Policy <span className="blue-em">recommendations</span>.
          </h2>
          <p className="section-sub">
            {hasAnswers
              ? "Personalized to your assessment results. Red items are your active gaps."
              : `Based on patterns across ${cases.length} sanctions cases. Complete the assessment above to personalize.`}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="policy-grid">
          {sorted.map((rec) => {
            const caseCount = countCasesWithGaps(rec.gaps);
            const isGap = answers[rec.id] === false;
            const isCovered = answers[rec.id] === true;
            const borderColor = isGap ? "rgba(239,68,68,0.35)" : isCovered ? "rgba(34,197,94,0.25)" : "var(--border)";
            const leftBorder = isGap ? "2px solid var(--red-muted)" : isCovered ? "2px solid rgba(34,197,94,0.5)" : "1px solid var(--border)";

            return (
              <div
                key={rec.num}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${borderColor}`,
                  borderLeft: leftBorder,
                  padding: "28px 30px",
                  transition: "border-color 0.3s",
                  opacity: isCovered ? 0.72 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-serif)",
                      fontSize: "18px",
                      fontWeight: 500,
                      fontStyle: "italic",
                      letterSpacing: "-0.02em",
                      flexShrink: 0,
                      border: `1px solid ${isGap ? "rgba(239,68,68,0.4)" : isCovered ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
                      background: isGap ? "rgba(239,68,68,0.08)" : isCovered ? "rgba(34,197,94,0.08)" : "var(--bg-subtle)",
                      color: isGap ? "var(--red-muted)" : isCovered ? "#22c55e" : "var(--blue)",
                    }}
                  >
                    {isCovered ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      rec.num
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "17px",
                          fontWeight: 500,
                          color: "var(--text-100)",
                          letterSpacing: "-0.015em",
                        }}
                      >
                        {rec.title}
                      </h3>
                      {isGap && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--red-muted)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            border: "1px solid rgba(239,68,68,0.35)",
                          }}
                        >
                          Gap
                        </span>
                      )}
                      {isCovered && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#22c55e",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            border: "1px solid rgba(34,197,94,0.35)",
                          }}
                        >
                          Covered
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-400)", lineHeight: 1.7, marginBottom: "12px", fontWeight: 300 }}>
                      {rec.description}
                    </p>
                    {isGap && (
                      <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-soft)", borderLeft: "2px solid var(--blue)", padding: "12px 14px", marginBottom: "14px" }}>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--blue)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                          }}
                        >
                          What compliant firms do
                        </div>
                        <p style={{ color: "var(--text-400)", fontSize: "12px", lineHeight: 1.65, fontWeight: 300 }}>{rec.remediation}</p>
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text-500)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                    >
                      Based on <span style={{ color: "var(--amber)" }}>{caseCount} case{caseCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "40px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderTop: "2px solid var(--blue)",
            padding: "40px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "24px",
                fontWeight: 500,
                color: "var(--text-100)",
                letterSpacing: "-0.02em",
                marginBottom: "8px",
              }}
            >
              Need help implementing these?
            </h4>
            <p style={{ color: "var(--text-400)", fontSize: "14px", fontWeight: 300, lineHeight: 1.65, maxWidth: "520px" }}>
              AI Vortex provides policy templates, compliance checklists, and ongoing monitoring for firms navigating AI governance.
            </p>
          </div>
          <a href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit" target="_blank" rel="noopener" className="hero-btn-blue">
            Book a Policy Review
          </a>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .policy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
