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
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function RiskAssessment({ answers, setAnswers }: Props) {
  const answeredCount = Object.keys(answers).length;
  const typedQuestions = questions as PolicyQuestion[];

  const liveScore = useMemo(() => {
    const totalPossible = typedQuestions.reduce((acc, q) => acc + q.risk_weight, 0);
    const earned = Object.entries(answers).reduce((acc, [id, val]) => {
      const q = typedQuestions.find((q) => q.id === id);
      return val === true ? acc + (q?.risk_weight || 0) : acc;
    }, 0);
    const percent = answeredCount === 0 ? 0 : Math.round((earned / totalPossible) * 100);
    const noCount = Object.values(answers).filter((v) => v === false).length;

    let level: string;
    let color: string;
    if (answeredCount === 0) { level = "—"; color = "var(--text-500)"; }
    else if (percent < 40) { level = "CRITICAL"; color = "var(--red-muted)"; }
    else if (percent < 70) { level = "HIGH"; color = "var(--amber)"; }
    else if (percent < 90) { level = "MODERATE"; color = "#eab308"; }
    else { level = "LOW"; color = "#22c55e"; }

    return { percent, level, color, noCount };
  }, [answers, answeredCount, typedQuestions]);

  const circumference = 2 * Math.PI * 36;
  const strokeOffset = circumference * (1 - liveScore.percent / 100);

  return (
    <section id="assessment" className="section">
      <div className="container">
        <div className="section-head amber">
          <div className="section-label amber">
            <span className="tick"></span>
            Firm Risk Diagnostic
          </div>
          <h2 className="section-heading">
            Where is your firm <em>exposed</em>?
          </h2>
          <p className="section-sub">
            Ten baseline questions that mirror what judges actually ask in Rule 11 hearings. Every &ldquo;No&rdquo; shows you the ruling that punishes that specific gap.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "48px" }} className="assessment-grid">
          {/* Sidebar */}
          <div>
            <div style={{ position: "sticky", top: "96px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "28px 24px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--amber)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  Diagnostic Panel
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-500)",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    <span>Progress</span>
                    <span style={{ color: "var(--text-100)" }}>
                      {answeredCount} / {typedQuestions.length}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "3px", background: "var(--border-soft)", position: "relative" }}>
                    <div
                      style={{
                        width: `${(answeredCount / typedQuestions.length) * 100}%`,
                        height: "100%",
                        background: "var(--blue)",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    color: "var(--text-600)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Answers never leave your browser
                </p>
              </div>

              {answeredCount > 0 && (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
                      <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          strokeWidth="4"
                          strokeLinecap="round"
                          stroke={liveScore.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          style={{ transition: "stroke-dashoffset 0.7s ease" }}
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "20px",
                            fontWeight: 500,
                            color: liveScore.color,
                            fontStyle: "italic",
                            letterSpacing: "-0.03em",
                          }}
                        >
                          {liveScore.percent}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: liveScore.color,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                        }}
                      >
                        {liveScore.level} Risk
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-500)",
                          marginTop: "4px",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {liveScore.noCount} gap{liveScore.noCount !== 1 ? "s" : ""} identified
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {typedQuestions.map((q, idx) => {
              const isNo = answers[q.id] === false;
              const isYes = answers[q.id] === true;
              const borderColor = isNo ? "rgba(239,68,68,0.35)" : isYes ? "rgba(34,197,94,0.3)" : "var(--border)";
              return (
                <div
                  key={q.id}
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${borderColor}`,
                    borderLeft: isNo ? "2px solid var(--red-muted)" : isYes ? "2px solid rgba(34,197,94,0.5)" : "1px solid var(--border)",
                    padding: "28px 28px 28px 30px",
                    transition: "border-color 0.3s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "18px", flex: 1, minWidth: "280px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text-500)",
                          letterSpacing: "0.08em",
                          flexShrink: 0,
                          marginTop: "4px",
                        }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "17px",
                            fontWeight: 500,
                            color: "var(--text-100)",
                            letterSpacing: "-0.015em",
                            lineHeight: 1.35,
                            marginBottom: "10px",
                          }}
                        >
                          {q.question}
                        </h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "var(--text-500)",
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                              padding: "4px 10px",
                              border: "1px solid var(--border-soft)",
                            }}
                          >
                            {q.category.replace(/-/g, " ")}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "var(--text-600)",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                            }}
                          >
                            Weight {q.risk_weight}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: true }))}
                        style={{
                          padding: "10px 20px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          border: isYes ? "1px solid var(--blue)" : "1px solid var(--border)",
                          background: isYes ? "var(--blue)" : "transparent",
                          color: isYes ? "var(--white)" : "var(--text-500)",
                          transition: "all 0.2s",
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: false }))}
                        style={{
                          padding: "10px 20px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          border: isNo ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--border)",
                          background: isNo ? "rgba(239,68,68,0.15)" : "transparent",
                          color: isNo ? "var(--red-muted)" : "var(--text-500)",
                          transition: "all 0.2s",
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {isNo && (
                    <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-soft)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }} className="consequence-grid">
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--red-muted)",
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              marginBottom: "10px",
                            }}
                          >
                            ◆ The Consequence
                          </div>
                          <p
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "14px",
                              color: "var(--text-300)",
                              lineHeight: 1.65,
                              borderLeft: "2px solid rgba(239,68,68,0.4)",
                              paddingLeft: "14px",
                              fontStyle: "italic",
                            }}
                          >
                            "{q.proof_snippet}"
                          </p>
                        </div>
                        <div>
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
                            Why This Matters
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--text-400)", lineHeight: 1.7, fontWeight: 300 }}>{q.why}</p>
                        </div>
                      </div>
                      {"remediation" in q && typeof (q as { remediation?: string }).remediation === "string" && (
                        <div
                          style={{
                            marginTop: "18px",
                            background: "var(--bg-subtle)",
                            border: "1px solid rgba(0,102,255,0.2)",
                            borderLeft: "2px solid var(--blue)",
                            padding: "16px 18px",
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
                              marginBottom: "8px",
                            }}
                          >
                            What compliant firms do
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--text-400)", lineHeight: 1.7, fontWeight: 300 }}>
                            {(q as { remediation: string }).remediation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .assessment-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .assessment-grid > div:first-child > div { position: static !important; }
        }
        @media (max-width: 768px) {
          .consequence-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </section>
  );
}
