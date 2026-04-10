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

    let level: string, color: string;
    if (answeredCount === 0) { level = "—"; color = "text-white/30"; }
    else if (percent < 40) { level = "CRITICAL"; color = "text-red-400"; }
    else if (percent < 70) { level = "HIGH"; color = "text-orange-400"; }
    else if (percent < 90) { level = "MODERATE"; color = "text-yellow-400"; }
    else { level = "LOW"; color = "text-emerald-400"; }

    return { percent, level, color, noCount };
  }, [answers, answeredCount, typedQuestions]);

  const circumference = 2 * Math.PI * 36;
  const strokeOffset = circumference * (1 - liveScore.percent / 100);

  return (
    <section id="assessment" className="py-20 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-3">
                  Risk Diagnostic
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  These questions mirror what judges ask in Rule 11 hearings.
                  Each &ldquo;No&rdquo; reveals the ruling that punishes that
                  gap.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-semibold text-white/35 tracking-wide">
                    <span>Progress</span>
                    <span>
                      {answeredCount} / {typedQuestions.length}
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0066FF] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(answeredCount / typedQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/20 mt-4">
                  Your answers never leave your browser.
                </p>
              </div>

              {/* Live Score Preview */}
              {answeredCount > 0 && (
                <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 animate-fade-in-up">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                        <circle
                          cx="40" cy="40" r="36" fill="none" strokeWidth="5" strokeLinecap="round"
                          stroke="currentColor"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          className={`${liveScore.color} transition-all duration-700 ease-out`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-black ${liveScore.color}`}>{liveScore.percent}%</span>
                      </div>
                    </div>
                    <div>
                      <div className={`text-sm font-black tracking-[-0.02em] ${liveScore.color}`}>
                        {liveScore.level} RISK
                      </div>
                      <div className="text-[10px] text-white/30 font-medium mt-1">
                        {liveScore.noCount} gap{liveScore.noCount !== 1 ? "s" : ""} identified
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1 space-y-4">
            {typedQuestions.map((q, idx) => {
              const isNo = answers[q.id] === false;
              const isYes = answers[q.id] === true;

              return (
                <div
                  key={q.id}
                  className={`border rounded-2xl p-6 transition-all duration-300 ${
                    isNo
                      ? "bg-[#111] border-red-500/20 shadow-lg shadow-red-950/10"
                      : isYes
                        ? "bg-[#111] border-emerald-500/20"
                        : "bg-[#111] border-white/[0.08]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <span className="text-white/20 font-mono text-sm font-bold mt-0.5 shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-[15px] leading-snug">
                          {q.question}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">
                            {q.category.replace(/-/g, " ")}
                          </span>
                          <span className="text-[10px] text-white/20 font-semibold self-center">
                            Weight: {q.risk_weight}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 self-start">
                      <button
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: true }))
                        }
                        className={`px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                          isYes
                            ? "bg-emerald-600 text-white"
                            : "bg-white/[0.05] text-white/40 hover:bg-white/[0.08]"
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: false }))
                        }
                        className={`px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                          isNo
                            ? "bg-red-600 text-white"
                            : "bg-white/[0.05] text-white/40 hover:bg-white/[0.08]"
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>

                  {isNo && (
                    <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                      <div>
                        <div className="text-red-400 text-[10px] font-semibold tracking-wide uppercase mb-2 flex items-center gap-1.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          The Consequence
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed border-l-2 border-red-500/30 pl-4">
                          &ldquo;{q.proof_snippet}&rdquo;
                        </p>
                      </div>
                      <div>
                        <div className="text-white/25 text-[10px] font-semibold tracking-wide uppercase mb-2">
                          Why This Matters
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed mb-3">
                          {q.why}
                        </p>
                        {"remediation" in q && typeof (q as { remediation?: string }).remediation === "string" && (
                          <div className="bg-[#0066FF]/5 border border-[#0066FF]/15 rounded-xl p-3">
                            <div className="text-[#0066FF] text-[10px] font-semibold tracking-wide uppercase mb-1">
                              What compliant firms do
                            </div>
                            <p className="text-white/60 text-xs leading-relaxed">
                              {(q as { remediation: string }).remediation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
