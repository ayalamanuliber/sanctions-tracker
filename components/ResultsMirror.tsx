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

  // Generate shareable URL
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}${window.location.hash}`
    : "";

  // Score-conditional CTA
  const getCTA = () => {
    if (scoreData.percent < 30) {
      return {
        headline: "Your Firm Has Critical Exposure",
        description: "Multiple gaps align with cases that ended careers. An emergency review can identify your highest-risk filings.",
        buttonText: "Schedule Emergency Gap Review",
        buttonUrl: "https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit",
        bgClass: "bg-red-600",
        glowClass: "shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]",
      };
    } else if (scoreData.percent < 50) {
      return {
        headline: "Significant Gaps Detected",
        description: "Your firm has exposure in areas where courts have imposed five- and six-figure sanctions.",
        buttonText: "Book a Policy Review",
        buttonUrl: "https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit",
        bgClass: "bg-[#0066FF]",
        glowClass: "shadow-[0_0_40px_-10px_rgba(0,102,255,0.5)]",
      };
    } else if (scoreData.percent < 75) {
      return {
        headline: "Moderate Coverage — Gaps Remain",
        description: "You're ahead of most firms, but exposed in areas where enforcement is accelerating.",
        buttonText: "Subscribe to Ruling Alerts",
        buttonUrl: "#subscribe",
        bgClass: "bg-[#0066FF]",
        glowClass: "shadow-[0_0_40px_-10px_rgba(0,102,255,0.5)]",
      };
    } else {
      return {
        headline: "Strong Policy Posture",
        description: "Your firm is well-positioned. Help your network — share this tool with colleagues who may not be as prepared.",
        buttonText: "Share This Tool",
        buttonUrl: shareUrl,
        bgClass: "bg-emerald-600",
        glowClass: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]",
      };
    }
  };

  const cta = getCTA();

  return (
    <section className="relative py-20 px-6 bg-[#050B14]/80 border-y border-white/[0.06] overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0066FF]/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Score + Gaps wrapper card */}
        <div className="bg-gradient-to-br from-[#0A1628] to-[#0A1628]/50 rounded-2xl border border-white/[0.06] shadow-2xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Score Circle */}
            <div className="lg:w-1/3 flex flex-col items-center w-full">
              <div className="text-white/25 text-[11px] font-semibold tracking-widest uppercase mb-8">
                Risk Profile
              </div>
              <div className="relative w-52 h-52">
                {/* Radial glow behind donut */}
                <div className="absolute inset-0 bg-[#0066FF]/5 blur-[80px] rounded-full pointer-events-none" />
                <svg className="relative w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="100" cy="100" r="90" fill="none" strokeWidth="8" strokeLinecap="round"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    className={`${scoreData.color} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black tracking-[-0.03em] ${scoreData.color}`}>
                    {scoreData.percent}%
                  </span>
                  <span className="text-white/25 text-[10px] font-semibold tracking-wide mt-1">
                    COMPLIANCE
                  </span>
                </div>
              </div>
              <div className={`mt-6 px-6 py-2 rounded-xl border ${scoreData.borderColor} bg-white/[0.02]`}>
                <span className={`text-lg font-black tracking-[-0.02em] ${scoreData.color}`}>
                  {scoreData.level} RISK
                </span>
              </div>

              {/* Share button */}
              {shareUrl && (
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                  className="mt-4 text-[11px] text-white/30 hover:text-white/60 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <div className="lg:w-2/3 w-full">
              {scoreData.gaps.length > 0 && (
                <>
                  <h4 className="text-2xl font-black text-white tracking-[-0.02em] mb-2">
                    Active Exposure Gaps
                  </h4>
                  <p className="text-white/40 text-sm mb-6">
                    Your firm has exposure in {scoreData.gaps.length} of 10 assessed areas.
                    These gaps align with cases where courts imposed sanctions ranging from $2,000 to $109,700.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                    {scoreData.gaps.map((gap) => (
                      <div key={gap.id} className="bg-[#0A1628]/50 backdrop-blur-sm border border-white/[0.06] p-5 rounded-2xl hover:border-red-500/20 transition-all">
                        <div className="text-red-400 text-[10px] font-semibold tracking-wide uppercase mb-2">Exposure</div>
                        <h5 className="text-white font-bold text-sm mb-1.5">
                          {gap.id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h5>
                        <p className="text-white/50 text-xs leading-relaxed">
                          {gap.proof_snippet.split(" — ")[1] || gap.proof_snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Score-conditional CTA */}
              <div className={`${cta.bgClass} ${cta.glowClass} rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
                <div>
                  <h4 className="text-2xl font-black text-white tracking-[-0.02em] mb-1">
                    {cta.headline}
                  </h4>
                  <p className="text-white/80 text-sm">{cta.description}</p>
                </div>
                {cta.buttonUrl.startsWith("http") ? (
                  <a
                    href={cta.buttonUrl}
                    target="_blank"
                    rel="noopener"
                    className="bg-white text-[#0A0A0A] px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors whitespace-nowrap"
                  >
                    {cta.buttonText}
                  </a>
                ) : cta.buttonText === "Share This Tool" ? (
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }}
                    className="bg-white text-[#0A0A0A] px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {cta.buttonText}
                  </button>
                ) : (
                  <a
                    href={cta.buttonUrl}
                    className="bg-white text-[#0A0A0A] px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors whitespace-nowrap"
                  >
                    {cta.buttonText}
                  </a>
                )}
              </div>

              {/* Email signup */}
              <div id="subscribe" className="mt-8 bg-[#0A1628]/50 border border-white/[0.06] rounded-2xl p-6">
                <h5 className="text-white font-bold text-sm mb-4">Get weekly sanctions updates</h5>
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

              {/* Policy Templates */}
              <div className="mt-8 bg-[#0A1628]/50 border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
                  <div>
                    <div className="text-[#0066FF] text-[10px] font-semibold tracking-widest uppercase mb-2">Coming Soon</div>
                    <h5 className="text-white font-bold text-lg mb-2">AI Governance Policy Templates</h5>
                    <p className="text-white/50 text-sm leading-relaxed max-w-md">
                      Court-tested policy templates based on {scoreData.gaps.length > 0 ? `your ${scoreData.gaps.length} identified gaps` : 'the assessment results'}.
                      Includes citation verification protocols, AI disclosure language, engagement letter clauses, and incident response playbooks.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">Written AI Policy Template</span>
                      <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">Citation Verification Checklist</span>
                      <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">Court Disclosure Language</span>
                      <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">Incident Response Playbook</span>
                      <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">Engagement Letter AI Clause</span>
                      <span className="text-[10px] bg-white/[0.05] px-2.5 py-1 rounded-full text-white/40 font-semibold">+ 3 more</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl px-5 py-4 text-center">
                      <div className="text-white/30 text-[10px] font-semibold line-through mb-1">$297</div>
                      <div className="text-white font-black text-2xl tracking-tight">Free</div>
                      <div className="text-[#0066FF] text-[10px] font-semibold mt-1">During Beta</div>
                    </div>
                    <a
                      href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
                      target="_blank"
                      rel="noopener"
                      className="mt-3 block bg-[#0066FF] hover:bg-[#004ACC] text-white px-5 py-2.5 rounded-xl font-bold text-sm text-center transition-colors"
                    >
                      Request Access
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
