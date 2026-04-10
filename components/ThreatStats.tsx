"use client";

import { useState, useEffect, useRef } from "react";
import stats from "@/data/stats.json";

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          setCount(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return { count, ref };
}

function StatCard({ label, value, note, animate, target, formatter }: {
  label: string;
  value: string;
  note: string;
  animate: boolean;
  target?: number;
  formatter?: (n: number) => string;
}) {
  const { count, ref } = useCountUp(target ?? 0);

  return (
    <div ref={ref} className="bg-[#0A1628]/60 backdrop-blur-sm border border-white/[0.06] first:rounded-l-2xl last:rounded-r-2xl p-6">
      <div className="text-[11px] font-semibold text-white/35 tracking-wide uppercase mb-3">{label}</div>
      <div className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em] mb-1">
        {animate && target !== undefined ? (formatter ? formatter(count) : count.toLocaleString()) : value}
      </div>
      <div className="text-[11px] text-white/40 font-medium">{note}</div>
    </div>
  );
}

export default function ThreatStats() {
  const items = [
    {
      label: "Tracked Rulings",
      value: stats.total_cases_tracked.toLocaleString(),
      note: "Charlotin Tracker (HEC Paris)",
      animate: true,
      target: stats.total_cases_tracked,
      formatter: (n: number) => n.toLocaleString(),
    },
    {
      label: "Q1 2026 Sanctions",
      value: `$${(stats.q1_2026_sanctions_usd / 1000).toFixed(0)}K+`,
      note: "Documented fines",
      animate: true,
      target: Math.round(stats.q1_2026_sanctions_usd / 1000),
      formatter: (n: number) => `$${n}K+`,
    },
    {
      label: "Growth Rate",
      value: `${stats.daily_growth_rate}/day`,
      note: "New judicial flags",
      animate: false,
    },
    {
      label: "Single-Day Record",
      value: `${stats.single_day_record} Courts`,
      note: stats.single_day_record_date,
      animate: true,
      target: stats.single_day_record,
      formatter: (n: number) => `${n} Courts`,
    },
  ];

  return (
    <section className="px-6 pb-12 bg-[#050B14]/50">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.04]">
        {items.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>
    </section>
  );
}
