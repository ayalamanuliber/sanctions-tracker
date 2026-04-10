"use client";

import { useState, useEffect, useRef } from "react";
import stats from "@/data/stats.json";
import cases from "@/data/cases.json";
import { ESCALATION_DATA } from "@/lib/constants";

function CountUp({ target, duration = 2000, formatter }: { target: number; duration?: number; formatter?: (n: number) => string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{formatter ? formatter(count) : count.toLocaleString()}</span>;
}

// Sort cases by date descending, take top 3
const sortedCases = [...cases]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3);

// Build sparkline points from escalation data
function buildSparkline() {
  const data = ESCALATION_DATA.map((d) => d.amount);
  const max = Math.max(...data);
  const width = 280;
  const height = 80;
  const padding = 4;
  const usableH = height - padding * 2;
  const usableW = width - padding * 2;
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * usableW;
    const y = padding + usableH - (val / max) * usableH;
    return { x, y };
  });
  // Build smooth curve path
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  // Area fill path
  const areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  return { path, areaPath, width, height };
}

const sparkline = buildSparkline();

export default function Hero() {
  const [activeAlert, setActiveAlert] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlert((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Blue glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#0066FF]/[0.04] rounded-full blur-[120px]" />
      {/* Orange/red glow orb */}
      <div className="absolute top-0 right-[10%] w-[500px] h-[400px] bg-[#FF5E1A]/[0.03] rounded-full blur-[120px]" />

      <div className="relative pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
            {/* Left side — headline + CTAs */}
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="inline-block bg-[#0A1628]/80 border border-white/[0.08] px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 tracking-wide">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] mr-2 pulse-live" />
                  Live — Updated {stats.last_updated.split('T')[0]}
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-[-0.03em] mb-6">
                Where is your firm{" "}
                <span className="gradient-text-hero">exposed?</span>
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

            {/* Right side — Live Risk Monitor panel */}
            <div className="relative lg:w-[360px] flex-shrink-0">
              <div className="bg-[#0A1628]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
                  <span className="w-2 h-2 rounded-full bg-[#0066FF] pulse-live" />
                  <span className="text-[12px] font-semibold text-white/70 tracking-wide">Live Risk Monitor</span>
                </div>

                {/* Sparkline chart */}
                <div className="px-5 pt-4 pb-2">
                  <div className="text-[10px] text-white/30 font-medium mb-2 uppercase tracking-wider">Sanction Escalation</div>
                  <svg
                    viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
                    className="w-full h-[80px]"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0066FF" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={sparkline.areaPath} fill="url(#sparkGrad)" />
                    <path d={sparkline.path} fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Alert cards */}
                <div className="px-4 pb-4 space-y-2">
                  {sortedCases.map((c, i) => {
                    const isActive = i === activeAlert;
                    const dateStr = new Date(c.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    const severityBorder = c.severity === "career-ending" ? "border-l-red-500" : c.severity === "high" ? "border-l-orange-500" : "border-l-[#0066FF]";
                    return (
                      <div
                        key={c.id}
                        className={`rounded-xl px-4 py-3 transition-all duration-500 ${
                          isActive
                            ? `bg-white/[0.06] border-l-2 ${severityBorder} border border-white/[0.08] opacity-100`
                            : "bg-transparent border border-transparent opacity-40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] flex-shrink-0" />
                          )}
                          <span className={`text-[12px] font-bold truncate ${isActive ? "text-white" : "text-white/60"}`}>
                            {c.case_name}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 font-medium">
                          {c.court} {c.amount_display ? `\u2022 ${c.amount_display}` : ""} {`\u2022 ${dateStr}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floating total rulings card */}
              <div className="mt-3 ml-auto w-fit bg-[#0A1628] border border-white/[0.08] rounded-xl shadow-2xl px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M2 8h12M2 12h8" stroke="#0066FF" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[18px] font-black text-white tracking-tight"><CountUp target={stats.total_cases_tracked} /></div>
                  <div className="text-[10px] text-white/40 font-semibold">Total Rulings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
