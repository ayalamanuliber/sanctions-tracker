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

              {/* DECISION MOMENT */}
              <div
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${scoreData.percent < 50 ? "var(--red-muted)" : scoreData.percent < 75 ? "var(--amber)" : "#22c55e"}`,
                  padding: "36px 40px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: scoreData.percent < 50 ? "var(--red-muted)" : "var(--amber)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Decision Moment
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(26px, 3vw, 34px)",
                    fontWeight: 500,
                    color: "var(--text-100)",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.2,
                    marginBottom: "14px",
                  }}
                >
                  {scoreData.percent < 50 ? (
                    <>You would <em style={{ color: "var(--red-muted)" }}>not pass</em> a Rule 11 challenge today.</>
                  ) : scoreData.percent < 75 ? (
                    <>You&rsquo;d <em style={{ color: "var(--amber)" }}>barely survive</em> a Rule 11 challenge.</>
                  ) : (
                    <>You&rsquo;d likely <em style={{ color: "#22c55e" }}>pass</em> a Rule 11 challenge &mdash; but not perfectly.</>
                  )}
                </h4>
                <p style={{ color: "var(--text-400)", fontSize: "15px", fontWeight: 300, lineHeight: 1.7, marginBottom: "20px" }}>
                  {scoreData.gaps.length > 0 ? (
                    <>
                      <strong style={{ color: "var(--text-100)", fontWeight: 500 }}>{scoreData.gaps.length} gap{scoreData.gaps.length > 1 ? "s" : ""} match{scoreData.gaps.length === 1 ? "es" : ""} real sanction cases.</strong> Firms have been sanctioned for exactly this pattern &mdash; fines from $2,000 to $109,700.
                    </>
                  ) : (
                    <>No exposure gaps detected. You&rsquo;re positioned better than most. Help your network &mdash; share this with firms that aren&rsquo;t.</>
                  )}
                </p>
                <div
                  style={{
                    padding: "14px 18px",
                    marginBottom: "18px",
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.06)",
                    borderLeft: "2px solid var(--red-muted)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--red-muted)",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    ◆ Reality check
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "var(--text-100)",
                      letterSpacing: "-0.01em",
                      fontStyle: "italic",
                    }}
                  >
                    Firms have already been sanctioned for this exact pattern.
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-300)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    marginBottom: "20px",
                  }}
                >
                  What happens next is your choice.
                </p>

                {/* Three paths */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }} className="decision-grid">
                  {/* Option 1: Fix */}
                  <a
                    href="#products"
                    className="decision-card"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderTop: "2px solid var(--amber)",
                      padding: "22px 22px 24px",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      transition: "border-color 0.2s, transform 0.2s",
                    }}
                  >
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
                      Option 1 &middot; Primary
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "22px",
                        fontWeight: 500,
                        color: "var(--text-100)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "10px",
                      }}
                    >
                      Fix this now.
                    </div>
                    <p style={{ color: "var(--text-400)", fontSize: "13px", lineHeight: 1.6, fontWeight: 300, marginBottom: "18px", flex: 1 }}>
                      Get the exact policies + checklists used to prevent these sanctions.
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--bg)",
                        background: "var(--bone)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        padding: "10px 16px",
                        textAlign: "center",
                      }}
                    >
                      Get Audit Kit →
                    </span>
                  </a>

                  {/* Option 2: Escalate */}
                  <a
                    href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
                    target="_blank"
                    rel="noopener"
                    className="decision-card"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid rgba(0,102,255,0.3)",
                      borderTop: "2px solid var(--blue)",
                      padding: "22px 22px 24px",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      transition: "border-color 0.2s, transform 0.2s",
                    }}
                  >
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
                      Option 2
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "22px",
                        fontWeight: 500,
                        color: "var(--text-100)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "10px",
                      }}
                    >
                      Have this reviewed.
                    </div>
                    <p style={{ color: "var(--text-400)", fontSize: "13px", lineHeight: 1.6, fontWeight: 300, marginBottom: "18px", flex: 1 }}>
                      We map this to your real workflows and exposure. One-on-one review.
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--white)",
                        background: "var(--blue)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        padding: "10px 16px",
                        textAlign: "center",
                      }}
                    >
                      Request Audit →
                    </span>
                  </a>

                  {/* Option 3: Stay exposed */}
                  <a
                    href="#products"
                    className="decision-card"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderTop: "2px solid var(--text-500)",
                      padding: "22px 22px 24px",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      transition: "border-color 0.2s, transform 0.2s",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text-500)",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      Option 3
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "22px",
                        fontWeight: 500,
                        color: "var(--text-100)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "10px",
                      }}
                    >
                      Stay exposed.
                    </div>
                    <p style={{ color: "var(--text-400)", fontSize: "13px", lineHeight: 1.6, fontWeight: 300, marginBottom: "18px", flex: 1 }}>
                      Do nothing. Risk this applying to your next filing.
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-300)",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        padding: "10px 16px",
                        textAlign: "center",
                      }}
                    >
                      Join Feed →
                    </span>
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
        @media (max-width: 900px) {
          .decision-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .gaps-grid { grid-template-columns: 1fr !important; }
        }
        .decision-card:hover { transform: translateY(-2px); }
        .decision-card:hover[style*="var(--amber)"] { border-color: var(--amber) !important; }
      `}</style>
    </section>
  );
}
