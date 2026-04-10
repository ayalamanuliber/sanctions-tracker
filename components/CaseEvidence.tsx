"use client";

import { useState } from "react";
import cases from "@/data/cases.json";

interface SanctionCase {
  id: string;
  case_name: string;
  court: string;
  judge: string;
  date: string;
  amount: number | null;
  amount_display: string;
  severity: string;
  summary: string;
  source_url: string;
  source_name: string;
}

const severityStyles: Record<string, string> = {
  "career-ending": "text-red-400 bg-red-950/50",
  high: "text-blue-300 bg-blue-950/50",
  medium: "text-yellow-300 bg-yellow-950/50",
  low: "text-emerald-300 bg-emerald-950/50",
};

export default function CaseEvidence() {
  const [filter, setFilter] = useState("all");
  const typedCases = cases as SanctionCase[];

  const filtered =
    filter === "all"
      ? typedCases
      : typedCases.filter((c) => c.severity === filter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section id="evidence" className="py-20 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="text-white/25 text-[11px] font-semibold tracking-widest uppercase mb-3">
              Evidence Library
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em]">
              Case Precedents
            </h2>
          </div>
          <div className="flex bg-[#111] border border-white/[0.08] p-1 rounded-xl">
            {["all", "career-ending", "high", "medium"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                  filter === f
                    ? "bg-white/[0.08] text-white"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {f === "career-ending"
                  ? "Career-Ending"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((c) => (
            <div
              key={c.id}
              className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between group hover:border-[#0066FF]/30 transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${severityStyles[c.severity] || "text-white/40 bg-white/5"}`}
                  >
                    {c.severity}
                  </span>
                  <span className="text-white/20 text-[11px] font-medium">
                    {c.date}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[#0066FF] transition-colors leading-snug">
                  {c.case_name}
                </h4>
                <p className="text-white/30 text-[11px] font-medium mb-4">
                  {c.court}
                  {c.judge && c.judge !== "N/A" ? ` — ${c.judge}` : ""}
                </p>
                <p className="text-white/40 text-sm leading-relaxed mb-4">
                  {c.summary}
                </p>
                {c.amount !== null && c.amount > 0 && (
                  <div className="text-[#0066FF] font-black text-lg">
                    {c.amount_display}
                  </div>
                )}
              </div>
              <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-white/25 font-medium">
                  {c.source_name}
                </span>
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066FF] text-[11px] font-semibold flex items-center gap-1 hover:underline"
                >
                  Source
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
