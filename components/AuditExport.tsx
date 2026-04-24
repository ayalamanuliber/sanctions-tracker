"use client";

import { useState } from "react";
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

export default function AuditExport({ answers }: Props) {
  const [copied, setCopied] = useState(false);
  const answered = Object.keys(answers).length;
  if (answered < 3) return null;

  const typedQuestions = questions as PolicyQuestion[];
  const gaps = typedQuestions.filter((q) => answers[q.id] === false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}${window.location.hash}` : "";

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <section className="section" id="audit-export">
      <div className="wrap">
        <div className="section-head blue">
          <div className="section-label blue">
            <span className="tick blue"></span>
            Compliance Document
          </div>
          <h2 className="section-heading">
            Document your AI <span className="blue-em">compliance</span>.
          </h2>
          <p className="section-sub">
            Use this internally with your team, or preserve it as a record in case of court scrutiny. Your answers, your gaps, your exposure &mdash; on a single page.
          </p>
          <p
            style={{
              marginTop: "14px",
              fontFamily: "var(--font-serif)",
              fontSize: "17px",
              fontWeight: 500,
              color: "var(--text-100)",
              letterSpacing: "-0.015em",
              fontStyle: "italic",
              borderLeft: "2px solid var(--blue)",
              paddingLeft: "14px",
              maxWidth: "620px",
            }}
          >
            This is what you show when questions are asked.
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            padding: "40px 44px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "32px",
            alignItems: "center",
          }}
          className="export-grid"
        >
          <div>
            <div
              style={{
                display: "flex",
                gap: "18px",
                marginBottom: "22px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-500)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Questions Answered
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "34px",
                    fontWeight: 500,
                    color: "var(--text-100)",
                    letterSpacing: "-0.03em",
                    fontStyle: "italic",
                    lineHeight: 1,
                  }}
                >
                  {answered} / 10
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "120px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--red-muted)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Exposure Gaps
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "34px",
                    fontWeight: 500,
                    color: gaps.length > 0 ? "var(--red-muted)" : "#22c55e",
                    letterSpacing: "-0.03em",
                    fontStyle: "italic",
                    lineHeight: 1,
                  }}
                >
                  {gaps.length}
                </div>
              </div>
            </div>
            <p
              style={{
                color: "var(--text-400)",
                fontSize: "14px",
                lineHeight: 1.7,
                fontWeight: 300,
                maxWidth: "540px",
              }}
            >
              Ready to ship a printable audit record to your firm leadership, insurance carrier, or ethics committee. Includes your full Q&amp;A + gap mapping to real case precedent.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "stretch",
              minWidth: "220px",
            }}
            className="export-actions"
          >
            <button
              onClick={handlePrint}
              className="hero-btn-primary"
              style={{ justifyContent: "center", padding: "14px 20px", fontSize: "11px", border: "none", cursor: "pointer" }}
            >
              Download PDF
              <span className="arrow-line"></span>
            </button>
            <button
              onClick={handleCopy}
              className="hero-btn-secondary"
              style={{ justifyContent: "center", padding: "13px 20px", fontSize: "11px", cursor: "pointer" }}
            >
              {copied ? "Copied ✓" : "Copy Shareable Link"}
            </button>
            <button
              onClick={() => {
                const mailto = `mailto:?subject=${encodeURIComponent("AI Risk Audit — Sanctions Tracker")}&body=${encodeURIComponent("My firm's AI sanctions risk audit:\n\n" + shareUrl)}`;
                window.location.href = mailto;
              }}
              className="hero-btn-secondary"
              style={{ justifyContent: "center", padding: "13px 20px", fontSize: "11px", cursor: "pointer" }}
            >
              Email to Team
            </button>
          </div>
        </div>

        {/* Bottom CTA — bridge back to product */}
        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
            paddingTop: "28px",
            borderTop: "1px solid var(--border-soft)",
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
              marginBottom: "14px",
            }}
          >
            Documentation is defense. Not a solution.
          </div>
          <a
            href="#products"
            className="hero-btn-primary"
            style={{ padding: "14px 26px", fontSize: "11px" }}
          >
            Fix this now
            <span className="arrow-line"></span>
          </a>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .export-grid { grid-template-columns: 1fr !important; }
          .export-actions { min-width: 0 !important; }
        }
        @media print {
          body { background: white !important; color: black !important; }
          nav, .footer, #audit-export, #evidence, #products, #scarcity, #final-close { display: none !important; }
        }
      `}</style>
    </section>
  );
}
