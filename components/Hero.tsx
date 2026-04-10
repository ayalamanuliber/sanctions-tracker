"use client";

export default function Hero() {
  return (
    <section className="pt-20 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="inline-block bg-[#111] border border-white/[0.08] px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 tracking-wide mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0066FF] mr-2 pulse-live" />
          AI Sanctions Risk Assessment
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-[-0.03em] mb-6 max-w-4xl">
          Where is your firm{" "}
          <span className="gradient-text">exposed?</span>
        </h1>
        <p className="text-lg md:text-xl text-white/50 leading-relaxed mb-10 max-w-2xl">
          1,294 tracked cases. $145K+ in Q1 2026 sanctions alone. Courts are actively
          hunting for AI hallucinations in filings. This tool shows you exactly where
          your firm has the same gaps.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="#assessment"
            className="bg-[#0066FF] hover:bg-[#004ACC] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors text-center"
          >
            Start Assessment
          </a>
          <a
            href="#evidence"
            className="bg-transparent border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-xl font-bold text-sm transition-all text-center"
          >
            View Case Evidence
          </a>
        </div>
      </div>
    </section>
  );
}
