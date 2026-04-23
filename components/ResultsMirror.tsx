"use client";

import { useMemo } from "react";
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

export default function ResultsMirror({ answers }: Props) {
  const typedQuestions = questions as PolicyQuestion[];

  const scoreData = useMemo(() => {
    const totalPossible = typedQuestions.reduce((acc, q) => acc + q.risk_weight, 0);
    const earned = Object.entries(answers).reduce((acc, [id, val]) => {
      const q = typedQuestions.find((q) => q.id === id);
      return val === true ? acc + (q?.risk_weight || 0) : acc;
    }, 0);
    const percent = Math.round((earned / totalPossible) * 100);
    const gaps = typedQuestions.filter((q) => answers[q.id] === false);

    let level: string;
    let color: string;
    let borderColor: string;
    if (percent < 40) { level = "CRITICAL"; color = "var(--red-muted)"; borderColor = "rgba(239,68,68,0.4)"; }
    else if (percent < 70) { level = "HIGH"; color = "var(--amber)"; borderColor = "rgba(245,158,11,0.4)"; }
    else if (percent < 90) { level = "MODERATE"; color = "#eab308"; borderColor = "rgba(234,179,8,0.4)"; }
    else { level = "LOW"; color = "#22c55e"; borderColor = "rgba(34,197,94,0.4)"; }

    return { percent, level, color, borderColor, gaps };
  }, [answers, typedQuestions]);

  if (Object.keys(answers).length < 3) return null;

  const circumference = 2 * Math.PI * 90;
  const strokeOffset = circumference * (1 - scoreData.percent / 100);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}${window.location.hash}` : "";

  const getCTA = () => {
    if (scoreData.percent < 30) {
      return {
        headline: "Your firm has critical exposure.",
        description: "Multiple gaps align with cases that ended careers. An emergency review can identify your highest-risk filings.",
        buttonText: "Schedule emergency review",
        buttonUrl: "https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit",
        accent: "var(--red-muted)",
      };
    } else if (scoreData.percent < 50) {
      return {
        headline: "Significant gaps detected.",
        description: "Your firm has exposure in areas where courts have imposed five- and six-figure sanctions.",
        buttonText: "Book a policy review",
        buttonUrl: "https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit",
        accent: "var(--amber)",
      };
    } else if (scoreData.percent < 75) {
      return {
        headline: "Moderate coverage — gaps remain.",
        description: "You're ahead of most firms, but exposed in areas where enforcement is accelerating.",
        buttonText: "Book a review",
        buttonUrl: "https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit",
        accent: "var(--blue)",
      };
    } else {
      return {
        headline: "Strong policy posture.",
        description: "Your firm is well-positioned. Help your network — share this tool with colleagues who may not be as prepared.",
        buttonText: "Copy shareable link",
        buttonUrl: shareUrl,
        accent: "#22c55e",
      };
    }
  };

  const cta = getCTA();

  return (
    <section className="section alt">
      <div className="wrap">
        <div className="section-head" style={{ borderLeftColor: scoreData.color }}>
          <div className="section-label" style={{ color: scoreData.color }}>
            <span className="tick" style={{ background: scoreData.color }}></span>
            Results Mirror
          </div>
          <h2 className="section-heading">
            Your <span style={{ fontStyle: "italic", color: scoreData.color }}>risk profile</span>.
          </h2>
          <p className="section-sub">
            Based on {Object.keys(answers).length} of 10 answers. {scoreData.gaps.length > 0 ? `${scoreData.gaps.length} active gaps identified.` : "No gaps identified."}
          </p>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "56px", alignItems: "start" }} className="results-grid">
            {/* Score Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-500)",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "28px",
                }}
              >
                Risk Profile
              </div>
              <div style={{ position: "relative", width: "208px", height: "208px" }}>
                <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="100" cy="100" r="90" fill="none" strokeWidth="6" strokeLinecap="round"
                    stroke={scoreData.color}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "58px",
                      fontWeight: 500,
                      letterSpacing: "-0.035em",
                      color: scoreData.color,
                      fontStyle: "italic",
                      lineHeight: 1,
                    }}
                  >
                    {scoreData.percent}%
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "var(--text-500)",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      marginTop: "6px",
                    }}
                  >
                    Compliance
                  </span>
                </div>
              </div>
              <div
                style={{
                  marginTop: "24px",
                  padding: "10px 22px",
                  border: `1px solid ${scoreData.borderColor}`,
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: scoreData.color,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {scoreData.level} Risk
              </div>
              {shareUrl && (
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                  style={{
                    marginTop: "20px",
                    background: "transparent",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-500)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-100)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-500)"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Copy shareable link
                </button>
              )}
            </div>

            {/* Gaps + CTA */}
            <div>
              {scoreData.gaps.length > 0 && (
                <>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--red-muted)",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      marginBottom: "14px",
                    }}
                  >
                    Active Exposure Gaps
                  </div>
                  <h4
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "26px",
                      fontWeight: 500,
                      color: "var(--text-100)",
                      letterSpacing: "-0.02em",
                      marginBottom: "12px",
                    }}
                  >
                    {scoreData.gaps.length} of 10 assessed areas have exposure.
                  </h4>
                  <p style={{ color: "var(--text-400)", fontSize: "14px", lineHeight: 1.7, marginBottom: "28px", fontWeight: 300 }}>
                    These gaps align with cases where courts imposed sanctions ranging from $2,000 to $109,700.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "36px" }} className="gaps-grid">
                    {scoreData.gaps.map((gap) => (
                      <div key={gap.id} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderLeft: "2px solid rgba(239,68,68,0.4)", padding: "18px 20px" }}>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--red-muted)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          Exposure
                        </div>
                        <h5
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "var(--text-100)",
                            letterSpacing: "-0.01em",
                            marginBottom: "6px",
                          }}
                        >
                          {gap.id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h5>
                        <p style={{ color: "var(--text-400)", fontSize: "12px", lineHeight: 1.6, fontWeight: 300 }}>
                          {gap.proof_snippet.split(" — ")[1] || gap.proof_snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* CTA */}
              <div
                style={{
                  background: "var(--bg-subtle)",
                  border: `1px solid ${cta.accent === "#22c55e" ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
                  borderLeft: `3px solid ${cta.accent}`,
                  padding: "32px 36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "24px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <h4
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "22px",
                      fontWeight: 500,
                      color: "var(--text-100)",
                      letterSpacing: "-0.02em",
                      marginBottom: "6px",
                    }}
                  >
                    {cta.headline}
                  </h4>
                  <p style={{ color: "var(--text-400)", fontSize: "14px", fontWeight: 300, lineHeight: 1.65 }}>{cta.description}</p>
                </div>
                {cta.buttonUrl.startsWith("http") ? (
                  <a href={cta.buttonUrl} target="_blank" rel="noopener" className="hero-btn-primary">
                    {cta.buttonText}
                  </a>
                ) : (
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }}
                    className="hero-btn-primary"
                  >
                    {cta.buttonText}
                  </button>
                )}
              </div>

              {/* Policy Templates */}
              <div
                style={{
                  marginTop: "32px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  padding: "32px 36px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "28px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
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
                    Coming soon
                  </div>
                  <h5
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "22px",
                      fontWeight: 500,
                      color: "var(--text-100)",
                      letterSpacing: "-0.02em",
                      marginBottom: "10px",
                    }}
                  >
                    AI Governance Policy Templates
                  </h5>
                  <p style={{ color: "var(--text-400)", fontSize: "13px", lineHeight: 1.7, fontWeight: 300, maxWidth: "500px" }}>
                    Court-tested policy templates based on {scoreData.gaps.length > 0 ? `your ${scoreData.gaps.length} identified gaps` : "the assessment results"}. Citation verification protocols, AI disclosure language, engagement letter clauses, and incident response playbooks.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "16px" }}>
                    {[
                      "Written AI Policy Template",
                      "Citation Verification Checklist",
                      "Court Disclosure Language",
                      "Incident Response Playbook",
                      "Engagement Letter AI Clause",
                      "+ 3 more",
                    ].map((label) => (
                      <span
                        key={label}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "var(--text-400)",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          padding: "5px 10px",
                          border: "1px solid var(--border-soft)",
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "stretch", gap: "10px", minWidth: "160px" }}>
                  <div style={{ border: "1px solid rgba(245,158,11,0.3)", padding: "18px 20px", textAlign: "center", background: "var(--bg)" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text-600)",
                        textDecoration: "line-through",
                        marginBottom: "6px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      $297
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "30px",
                        fontWeight: 500,
                        color: "var(--text-100)",
                        fontStyle: "italic",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      Free
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "var(--amber)",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        marginTop: "6px",
                      }}
                    >
                      During Beta
                    </div>
                  </div>
                  <a href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit" target="_blank" rel="noopener" className="hero-btn-blue" style={{ padding: "12px 16px", fontSize: "10px", justifyContent: "center" }}>
                    Request Access
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .results-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 768px) {
          .gaps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
