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
    const totalPossible = typedQuestions.reduce(
      (acc, q) => acc + q.risk_weight,
      0
    );
    const earned = Object.entries(answers).reduce((acc, [id, val]) => {
      const q = typedQuestions.find((q) => q.id === id);
      return val === true ? acc + (q?.risk_weight || 0) : acc;
    }, 0);
    const percent = Math.round((earned / totalPossible) * 100);
    const gaps = typedQuestions.filter((q) => answers[q.id] === false);

    let level: string, color: string, borderColor: string;
    if (percent < 40) {
      level = "CRITICAL";
      color = "text-red-400";
      borderColor = "border-red-500/30";
    } else if (percent < 70) {
      level = "HIGH";
      color = "text-orange-400";
      borderColor = "border-orange-500/30";
    } else if (percent < 90) {
      level = "MODERATE";
      color = "text-yellow-400";
      borderColor = "border-yellow-500/30";
    } else {
      level = "LOW";
      color = "text-emerald-400";
      borderColor = "border-emerald-500/30";
    }

    return { percent, level, color, borderColor, gaps };
  }, [answers, typedQuestions]);

  if (Object.keys(answers).length < 3) return null;

  const circumference = 2 * Math.PI * 90;
  const strokeOffset = circumference * (1 - scoreData.percent / 100);

  return (
    <section className="py-20 px-6 bg-[#0d0d0d] border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Score Circle */}
          <div className="lg:w-1/3 flex flex-col items-center w-full">
            <div className="text-white/25 text-[11px] font-semibold tracking-widest uppercase mb-8">
              Risk Profile
            </div>
            <div className="relative w-52 h-52">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 200 200"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className={`${scoreData.color} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-5xl font-black tracking-[-0.03em] ${scoreData.color}`}
                >
                  {scoreData.percent}%
                </span>
                <span className="text-white/25 text-[10px] font-semibold tracking-wide mt-1">
                  COMPLIANCE
                </span>
              </div>
            </div>
            <div
              className={`mt-6 px-6 py-2 rounded-xl border ${scoreData.borderColor} bg-white/[0.02]`}
            >
              <span
                className={`text-lg font-black tracking-[-0.02em] ${scoreData.color}`}
              >
                {scoreData.level} RISK
              </span>
            </div>
          </div>

          {/* Gaps + CTA */}
          <div className="lg:w-2/3 w-full">
            {scoreData.gaps.length > 0 && (
              <>
                <h4 className="text-2xl font-black text-white tracking-[-0.02em] mb-6">
                  Active Exposure Gaps
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                  {scoreData.gaps.map((gap) => (
                    <div
                      key={gap.id}
                      className="bg-[#0A0A0A] border border-white/[0.08] p-5 rounded-2xl hover:border-red-500/20 transition-all"
                    >
                      <div className="text-red-400 text-[10px] font-semibold tracking-wide uppercase mb-2">
                        Exposure
                      </div>
                      <h5 className="text-white font-bold text-sm mb-1.5">
                        {gap.id
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h5>
                      <p className="text-white/50 text-xs leading-relaxed">
                        {gap.proof_snippet.split(" — ")[1] || gap.proof_snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CTA */}
            <div className="bg-[#0066FF] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-2xl font-black text-white tracking-[-0.02em] mb-1">
                  Assessment Complete
                </h4>
                <p className="text-white/70 text-sm">
                  {scoreData.percent < 50
                    ? "Your firm has significant exposure. Get a detailed gap analysis."
                    : "Your posture is developing. Subscribe for governance updates."}
                </p>
              </div>
              <a
                href="https://www.aivortex.io/legal"
                className="bg-white text-[#0A0A0A] px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                Visit AI Vortex
              </a>
            </div>

            {/* Email signup */}
            <div className="mt-8 bg-[#111] border border-white/[0.08] rounded-2xl p-6">
              <h5 className="text-white font-bold text-sm mb-4">
                Get weekly sanctions updates
              </h5>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="attorney@firm.com"
                  className="bg-[#0A0A0A] border border-white/[0.08] px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-[#0066FF]/50 flex-1 transition-colors"
                />
                <button className="bg-white text-[#0A0A0A] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0066FF] hover:text-white transition-all cursor-pointer">
                  Subscribe
                </button>
              </div>
              <p className="text-white/20 text-[10px] font-medium mt-3">
                New rulings and policy recommendations delivered every Tuesday.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
