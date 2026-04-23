"use client";

import { useState, useEffect, useRef } from "react";
import stats from "@/data/stats.json";

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
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
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return { count, ref };
}

function StatCell({
  label,
  value,
  note,
  animate,
  target,
  formatter,
  accent,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  animate: boolean;
  target?: number;
  formatter?: (n: number) => string;
  accent: "blue" | "amber" | "red" | "neutral";
  icon: React.ReactNode;
}) {
  const { count, ref } = useCountUp(target ?? 0);
  return (
    <div ref={ref} className="stat-cell">
      <div className={`stat-ico ${accent}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-num ${accent === "neutral" ? "" : accent}`}>
        {animate && target !== undefined ? (formatter ? formatter(count) : count.toLocaleString()) : value}
      </div>
      <div className="stat-meta">{note}</div>
    </div>
  );
}

export default function ThreatStats() {
  const items: Array<{
    label: string;
    value: string;
    note: string;
    animate: boolean;
    target?: number;
    formatter?: (n: number) => string;
    accent: "blue" | "amber" | "red" | "neutral";
    icon: React.ReactNode;
  }> = [
    {
      label: "Tracked Rulings",
      value: stats.total_cases_tracked.toLocaleString(),
      note: "Charlotin Tracker (HEC Paris)",
      animate: true,
      target: stats.total_cases_tracked,
      formatter: (n: number) => n.toLocaleString(),
      accent: "blue",
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      ),
    },
    {
      label: "Q1 2026 Sanctions",
      value: `$${(stats.q1_2026_sanctions_usd / 1000).toFixed(0)}K+`,
      note: "Documented monetary fines",
      animate: true,
      target: Math.round(stats.q1_2026_sanctions_usd / 1000),
      formatter: (n: number) => `$${n}K+`,
      accent: "amber",
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Growth Rate",
      value: `${stats.daily_growth_rate}/day`,
      note: "New judicial flags per day",
      animate: false,
      accent: "red",
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 4 4 5-5" />
        </svg>
      ),
    },
    {
      label: "Single-Day Record",
      value: `${stats.single_day_record} courts`,
      note: stats.single_day_record_date,
      animate: true,
      target: stats.single_day_record,
      formatter: (n: number) => `${n} courts`,
      accent: "neutral",
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="1" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
  ];

  return (
    <section className="strip" style={{ padding: "40px 0" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)" }} className="stats-grid">
          {items.map((item, i) => (
            <StatCell key={i} {...item} />
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
