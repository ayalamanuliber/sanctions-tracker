"use client";

import { useState, useEffect, useRef } from "react";
import stats from "@/data/stats.json";
import cases from "@/data/cases.json";
import { ESCALATION_DATA } from "@/lib/constants";

function CountUp({ target, duration = 1800, formatter }: { target: number; duration?: number; formatter?: (n: number) => string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

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

  return <span ref={ref}>{formatter ? formatter(count) : count.toLocaleString()}</span>;
}

const sortedCases = [...cases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

function buildSparkline() {
  const data = ESCALATION_DATA.map((d) => d.amount);
  const max = Math.max(...data);
  const width = 280;
  const height = 64;
  const padding = 4;
  const usableH = height - padding * 2;
  const usableW = width - padding * 2;
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * usableW;
    const y = padding + usableH - (val / max) * usableH;
    return { x, y };
  });
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  return { path, areaPath, width, height };
}

const sparkline = buildSparkline();

export default function Hero() {
  const [activeAlert, setActiveAlert] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveAlert((p) => (p + 1) % 3), 4000);
    return () => clearInterval(interval);
  }, []);

  const lastUpdated = stats.last_updated.split("T")[0];

  return (
    <section className="hub-hero">
      <div className="wrap">
        <div className="hub-hero-grid">
          <div className="hub-hero-inner">
            <div className="hero-eyebrow">
              <span className="pulse-wrap">
                <span className="pulse"></span>
                Sanctions Tracker &middot; Live
              </span>
              <span className="eyebrow-divider"></span>
              <span className="eyebrow-label">Updated {lastUpdated}</span>
            </div>

            <h1 className="hub-title">
              Where is your firm <em>exposed</em>?
              <span style={{ display: "block", fontSize: "0.48em", fontWeight: 400, color: "var(--text-400)", fontFamily: "var(--font-serif)", fontStyle: "italic", letterSpacing: "-0.01em", marginTop: "14px", lineHeight: 1.2 }}>
                Before a judge does.
              </span>
            </h1>

            <p className="hub-subtitle" style={{ marginBottom: "32px" }}>
              Courts are already sanctioning AI misuse. <strong>{stats.total_cases_tracked.toLocaleString()} rulings tracked. ${(stats.q1_2026_sanctions_usd / 1000).toFixed(0)}K+ in Q1 sanctions.</strong> See if your firm would pass a Rule 11 challenge.
            </p>

            <div className="hero-ctas">
              <a className="hero-btn-primary" href="#assessment" style={{ padding: "18px 32px", fontSize: "12px" }}>
                Take the free assessment
                <span className="arrow-line"></span>
              </a>
            </div>

            <div className="hero-trust" style={{ marginTop: "32px", paddingTop: "20px" }}>
              <span className="dot"></span>
              <span><strong>Free.</strong> Takes 3 minutes.</span>
              <span className="pipe"></span>
              <span>Answers never leave your browser</span>
              <span className="pipe"></span>
              <span>Independent &middot; no vendor pitch</span>
            </div>
          </div>

          {/* Right side — live risk monitor (replaces old glass card) */}
          <div className="hub-hero-visual">
            <div className="live-panel">
              <div className="live-panel-header">
                <span className="live-dot"></span>
                <span>Live Risk Monitor</span>
              </div>
              <div className="live-panel-body">
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "var(--text-500)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Sanction Escalation
                </div>
                <svg
                  viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
                  style={{ width: "100%", height: "64px", display: "block" }}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066FF" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={sparkline.areaPath} fill="url(#sparkGrad)" />
                  <path d={sparkline.path} fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {sortedCases.map((c, i) => {
                    const isActive = i === activeAlert;
                    const dateStr = new Date(c.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    const accent = c.severity === "career-ending" ? "var(--red-muted)" : c.severity === "high" ? "var(--amber)" : "var(--blue)";
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: "12px 14px",
                          border: `1px solid ${isActive ? "var(--border)" : "transparent"}`,
                          borderLeft: `2px solid ${isActive ? accent : "transparent"}`,
                          background: isActive ? "var(--bg-subtle)" : "transparent",
                          opacity: isActive ? 1 : 0.45,
                          transition: "all 0.5s ease",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: isActive ? "var(--text-100)" : "var(--text-400)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "4px",
                          }}
                        >
                          {c.case_name}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-500)", fontWeight: 500 }}>
                          {c.court}
                          {c.amount_display ? ` · ${c.amount_display}` : ""} · {dateStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
