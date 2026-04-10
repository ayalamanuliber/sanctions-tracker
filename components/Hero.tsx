"use client";

import Image from "next/image";
import stats from "@/data/stats.json";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Blue glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#0066FF]/[0.04] rounded-full blur-[120px]" />

      <div className="relative pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Image
                  src="/av-logo-white.png"
                  alt="AI Vortex"
                  width={28}
                  height={22}
                  className="opacity-50"
                />
                <div className="inline-block bg-[#111] border border-white/[0.08] px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 tracking-wide">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] mr-2 pulse-live" />
                  Live — Updated {stats.last_updated.split('T')[0]}
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-[-0.03em] mb-6">
                Where is your firm{" "}
                <span className="gradient-text">exposed?</span>
              </h1>

              <p className="text-lg md:text-xl text-white/60 leading-relaxed mb-10">
                {stats.total_cases_tracked.toLocaleString()} tracked rulings. ${(stats.q1_2026_sanctions_usd / 1000).toFixed(0)}K+ in Q1 2026 sanctions alone.
                Courts are accelerating enforcement against AI hallucinations in filings.
                This tool maps the sanctions, diagnoses your gaps, and shows you exactly what to fix.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#assessment"
                  className="bg-[#0066FF] hover:bg-[#004ACC] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors text-center"
                >
                  Start Risk Assessment
                </a>
                <a
                  href="#map"
                  className="bg-transparent border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-xl font-bold text-sm transition-all text-center"
                >
                  View Sanctions Map
                </a>
                <a
                  href="#jurisdiction"
                  className="bg-transparent border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-xl font-bold text-sm transition-all text-center"
                >
                  Court Requirements
                </a>
              </div>
            </div>

            {/* Right side — key stats stack */}
            <div className="flex flex-row lg:flex-col gap-3 lg:w-48">
              <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-4 flex-1 lg:flex-initial">
                <div className="text-3xl font-black text-white tracking-[-0.03em]">{stats.total_cases_tracked.toLocaleString()}</div>
                <div className="text-[10px] text-white/40 font-semibold mt-1">Tracked Rulings</div>
              </div>
              <div className="bg-[#111] border border-red-500/20 rounded-2xl p-4 flex-1 lg:flex-initial">
                <div className="text-3xl font-black text-red-400 tracking-[-0.03em]">${(stats.largest_single_sanction / 1000).toFixed(1)}K</div>
                <div className="text-[10px] text-white/40 font-semibold mt-1">Record Sanction</div>
              </div>
              <div className="bg-[#111] border border-[#0066FF]/20 rounded-2xl p-4 flex-1 lg:flex-initial">
                <div className="text-3xl font-black text-[#0066FF] tracking-[-0.03em]">{stats.daily_growth_rate}/d</div>
                <div className="text-[10px] text-white/40 font-semibold mt-1">New Cases Daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
