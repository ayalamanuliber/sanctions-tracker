"use client";

import { useState, useMemo } from "react";
import cases from "@/data/cases.json";

interface SanctionCase {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: string;
  state: string;
  judge: string;
  date: string;
  sanction_types: string[];
  amount: number | null;
  amount_display: string;
  severity: string;
  ai_tool_used: string;
  summary: string;
  source_url: string;
  source_name: string;
  tags: string[];
  policy_gap_ids: string[];
}

const POLICY_GAP_LABELS: Record<string, string> = {
  "citation-verification": "Citation Verification",
  "written-ai-policy": "Written AI Policy",
  "paid-tool-verification": "Paid Tool Verification",
  "ai-disclosure-protocol": "AI Disclosure Protocol",
  "engagement-letter-ai": "Engagement Letters",
  "attorney-training": "Attorney Training",
  "supervision-protocol": "Supervision Protocol",
  "audit-trail": "Audit Trail",
  "approved-tools-list": "Approved Tools List",
  "incident-response": "Incident Response",
};

const severityStyles: Record<string, string> = {
  "career-ending": "text-red-400 bg-red-950/50",
  high: "text-blue-300 bg-blue-950/50",
  medium: "text-yellow-300 bg-yellow-950/50",
  low: "text-emerald-300 bg-emerald-950/50",
};

const SEVERITY_OPTIONS = ["all", "career-ending", "high", "medium", "low"];
const YEAR_OPTIONS = ["all", "2023", "2024", "2025", "2026"];

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-white/30 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

import questions from "@/data/questions.json";

interface Props {
  answers?: Record<string, boolean>;
  stateFilter?: string | null;
  onClearStateFilter?: () => void;
}

export default function CaseEvidence({ answers = {}, stateFilter, onClearStateFilter }: Props) {
  const typedCases = cases as SanctionCase[];

  const [severity, setSeverity] = useState("all");
  const [state, setState] = useState("all");
  const [tool, setTool] = useState("all");
  const [year, setYear] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMyGaps, setShowMyGaps] = useState(false);

  // Get gap IDs from "No" answers
  const gapIds = Object.entries(answers)
    .filter(([, v]) => v === false)
    .map(([k]) => k);
  const hasGaps = gapIds.length > 0;

  // Apply external state filter from map click
  const effectiveState = stateFilter || state;

  const uniqueStates = useMemo(
    () => [...new Set(typedCases.map((c) => c.state))].sort(),
    [typedCases]
  );

  const uniqueTools = useMemo(
    () => [...new Set(typedCases.map((c) => c.ai_tool_used))].sort(),
    [typedCases]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return typedCases.filter((c) => {
      if (severity !== "all" && c.severity !== severity) return false;
      if (effectiveState !== "all" && c.state !== effectiveState) return false;
      if (tool !== "all" && c.ai_tool_used !== tool) return false;
      if (year !== "all" && !c.date.startsWith(year)) return false;
      if (q && !c.case_name.toLowerCase().includes(q) && !c.court.toLowerCase().includes(q))
        return false;
      if (showMyGaps && gapIds.length > 0) {
        if (!c.policy_gap_ids.some((g: string) => gapIds.includes(g))) return false;
      }
      return true;
    });
  }, [typedCases, severity, effectiveState, tool, year, search, showMyGaps, gapIds]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "date-desc":
        return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case "date-asc":
        return arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "amount-desc":
        return arr.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
      case "amount-asc":
        return arr.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
      default:
        return arr;
    }
  }, [filtered, sort]);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  /* Truncate summary to ~120 chars for compact view */
  const truncate = (text: string, max = 120) =>
    text.length <= max ? text : text.slice(0, max).trimEnd() + "...";

  return (
    <section id="evidence" className="py-20 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="text-white/25 text-[11px] font-semibold tracking-widest uppercase mb-3">
            Evidence Library
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em]">
            Case Precedents
          </h2>
        </div>

        {/* State filter from map click */}
        {stateFilter && (
          <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <span className="text-white/70 text-sm">
              Showing cases in <span className="text-[#0066FF] font-bold">{stateFilter}</span> (from map)
            </span>
            <button
              onClick={onClearStateFilter}
              className="text-white/40 hover:text-white text-sm font-semibold cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-4 mb-6 space-y-4">
          {/* Gap filter toggle */}
          {hasGaps && (
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
              <button
                onClick={() => setShowMyGaps(!showMyGaps)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                  showMyGaps
                    ? "bg-red-600 text-white"
                    : "bg-white/[0.05] text-white/40 hover:bg-white/[0.08]"
                }`}
              >
                {showMyGaps ? "Showing My Gaps" : "Show Cases Matching My Gaps"}
              </button>
              {showMyGaps && (
                <span className="text-white/30 text-[11px]">
                  Filtering to cases linked to your {gapIds.length} gap{gapIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Row 1: Severity pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/30 text-[11px] font-semibold tracking-wide uppercase mr-1">
              Severity
            </span>
            <div className="flex bg-[#0A0A0A] border border-white/[0.08] p-1 rounded-xl">
              {SEVERITY_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setSeverity(f)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                    severity === f
                      ? "bg-white/[0.08] text-white"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {f === "career-ending"
                    ? "Career-Ending"
                    : f === "all"
                      ? "All"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Dropdowns + search + sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* State dropdown */}
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="bg-[#0A0A0A] border border-white/[0.08] text-white/60 text-[12px] font-medium rounded-xl px-3 py-2 outline-none focus:border-[#0066FF]/40 transition-colors cursor-pointer appearance-none"
              style={{ minWidth: 130 }}
            >
              <option value="all">All States</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Tool dropdown */}
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="bg-[#0A0A0A] border border-white/[0.08] text-white/60 text-[12px] font-medium rounded-xl px-3 py-2 outline-none focus:border-[#0066FF]/40 transition-colors cursor-pointer appearance-none"
              style={{ minWidth: 150 }}
            >
              <option value="all">All Tools</option>
              {uniqueTools.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Year dropdown */}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-[#0A0A0A] border border-white/[0.08] text-white/60 text-[12px] font-medium rounded-xl px-3 py-2 outline-none focus:border-[#0066FF]/40 transition-colors cursor-pointer appearance-none"
              style={{ minWidth: 120 }}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y === "all" ? "All Years" : y}
                </option>
              ))}
            </select>

            {/* Sort dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-[#0A0A0A] border border-white/[0.08] text-white/60 text-[12px] font-medium rounded-xl px-3 py-2 outline-none focus:border-[#0066FF]/40 transition-colors cursor-pointer appearance-none"
              style={{ minWidth: 150 }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            {/* Search input */}
            <div className="relative flex-1 min-w-[180px]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case or court..."
                className="w-full bg-[#0A0A0A] border border-white/[0.08] text-white/60 text-[12px] font-medium rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#0066FF]/40 transition-colors placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Result count */}
          <div className="text-white/30 text-[11px] font-medium">
            Showing {sorted.length} of {typedCases.length} cases
          </div>
        </div>

        {/* Case cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((c) => {
            const isOpen = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="bg-[#111] border border-white/[0.08] rounded-2xl flex flex-col group hover:border-[#0066FF]/30 transition-all"
              >
                {/* Compact view (always visible) */}
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="w-full text-left p-6 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${severityStyles[c.severity] || "text-white/40 bg-white/5"}`}
                      >
                        {c.severity}
                      </span>
                      <span className="text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full bg-white/[0.06] text-white/50">
                        {c.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-[11px] font-medium">
                        {c.date}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[#0066FF] transition-colors leading-snug">
                    {c.case_name}
                  </h4>
                  <p className="text-white/40 text-[11px] font-medium mb-3">
                    {c.court}
                  </p>

                  <p className="text-white/60 text-sm leading-relaxed mb-3">
                    {isOpen ? "" : truncate(c.summary)}
                  </p>

                  {c.amount !== null && c.amount > 0 && (
                    <div className="text-[#0066FF] font-black text-lg">
                      {c.amount_display}
                    </div>
                  )}
                  {(c.amount === null || c.amount === 0) && c.amount_display && (
                    <div className="text-white/50 font-semibold text-sm">
                      {c.amount_display}
                    </div>
                  )}
                </button>

                {/* Expanded view */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6 space-y-4">
                    {/* Full summary */}
                    <p className="text-white/60 text-sm leading-relaxed">
                      {c.summary}
                    </p>

                    {/* Judge */}
                    {c.judge && c.judge !== "N/A" && (
                      <div className="text-white/40 text-[12px]">
                        <span className="text-white/25 uppercase tracking-wide text-[10px] font-semibold mr-2">
                          Judge
                        </span>
                        {c.judge}
                      </div>
                    )}

                    {/* AI Tool */}
                    <div className="text-white/40 text-[12px]">
                      <span className="text-white/25 uppercase tracking-wide text-[10px] font-semibold mr-2">
                        AI Tool
                      </span>
                      {c.ai_tool_used}
                    </div>

                    {/* Sanction types */}
                    {c.sanction_types.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-white/25 uppercase tracking-wide text-[10px] font-semibold mr-1 self-center">
                          Sanctions
                        </span>
                        {c.sanction_types.map((st) => (
                          <span
                            key={st}
                            className="bg-white/[0.06] text-white/50 text-[10px] rounded-full px-2.5 py-0.5 font-medium"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-white/[0.06] text-white/50 text-[10px] rounded-full px-2.5 py-0.5 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Policy gaps */}
                    {c.policy_gap_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-white/25 uppercase tracking-wide text-[10px] font-semibold mr-1 self-center">
                          Gaps
                        </span>
                        {c.policy_gap_ids.map((gid) => (
                          <span
                            key={gid}
                            className="bg-[#0066FF]/10 text-[#0066FF]/70 text-[10px] rounded-full px-2.5 py-0.5 font-medium"
                          >
                            {POLICY_GAP_LABELS[gid] || gid}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Source link */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] text-white/25 font-medium">
                        {c.source_name}
                      </span>
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0066FF] text-[11px] font-semibold flex items-center gap-1 hover:underline"
                      >
                        View Source
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
                </div>
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-20 text-white/25 text-sm">
            No cases match your filters.
          </div>
        )}
      </div>
    </section>
  );
}
