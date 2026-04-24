"use client";

import { useState, useMemo } from "react";
import sanctionsRaw from "@/data/sanctions.json";
interface WikiCase {
  id: string;
  case_name: string;
  court: string;
  circuit: string | null;
  jurisdiction: string;
  state: string;
  country: string;
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
  alleged: boolean;
}
// Show all enriched US cases; add missing fields as empty
const cases: WikiCase[] = ((sanctionsRaw as unknown) as Array<Partial<WikiCase> & { country: string; alleged: boolean; severity: string | null }>)
  .filter((c) => c.country === "US" && !c.alleged && c.severity)
  .sort((a, b) => (b.amount || 0) - (a.amount || 0))
  .map((c) => ({
    id: c.id || "",
    case_name: c.case_name || "",
    court: c.court || "",
    circuit: c.circuit ?? null,
    jurisdiction: c.jurisdiction || "state",
    state: c.state || "",
    country: c.country,
    judge: c.judge || "",
    date: c.date || "",
    sanction_types: c.sanction_types || [],
    amount: c.amount ?? null,
    amount_display: c.amount_display || "",
    severity: c.severity as string,
    ai_tool_used: c.ai_tool_used || "",
    summary: c.summary || "",
    source_url: c.source_url || "",
    source_name: c.source_name || "",
    tags: c.tags || [],
    policy_gap_ids: c.policy_gap_ids || [],
    alleged: c.alleged,
  }));

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

const severityColors: Record<string, { color: string; border: string }> = {
  "career-ending": { color: "#ef4444", border: "rgba(239,68,68,0.35)" },
  high: { color: "#f59e0b", border: "rgba(245,158,11,0.35)" },
  medium: { color: "#eab308", border: "rgba(234,179,8,0.35)" },
  low: { color: "#22c55e", border: "rgba(34,197,94,0.35)" },
};

const SEVERITY_OPTIONS = ["all", "career-ending", "high", "medium", "low"];
const YEAR_OPTIONS = ["all", "2023", "2024", "2025", "2026"];

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--text-500)",
        transition: "transform 0.3s",
        transform: open ? "rotate(180deg)" : "none",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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

  const gapIds = Object.entries(answers).filter(([, v]) => v === false).map(([k]) => k);
  const hasGaps = gapIds.length > 0;
  const effectiveState = stateFilter || state;

  const uniqueStates = useMemo(() => [...new Set(typedCases.map((c) => c.state))].sort(), [typedCases]);
  const uniqueTools = useMemo(() => [...new Set(typedCases.map((c) => c.ai_tool_used))].sort(), [typedCases]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return typedCases.filter((c) => {
      if (severity !== "all" && c.severity !== severity) return false;
      if (effectiveState !== "all" && c.state !== effectiveState) return false;
      if (tool !== "all" && c.ai_tool_used !== tool) return false;
      if (year !== "all" && !c.date.startsWith(year)) return false;
      if (q && !c.case_name.toLowerCase().includes(q) && !c.court.toLowerCase().includes(q)) return false;
      if (showMyGaps && gapIds.length > 0) {
        if (!c.policy_gap_ids.some((g: string) => gapIds.includes(g))) return false;
      }
      return true;
    });
  }, [typedCases, severity, effectiveState, tool, year, search, showMyGaps, gapIds]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "date-desc": return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case "date-asc": return arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "amount-desc": return arr.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
      case "amount-asc": return arr.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
      default: return arr;
    }
  }, [filtered, sort]);

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));
  const truncate = (text: string, max = 120) => (text.length <= max ? text : text.slice(0, max).trimEnd() + "...");

  const selectStyle: React.CSSProperties = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text-300)",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "8px 12px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
  };

  return (
    <section id="evidence" className="section alt">
      <div className="wrap">
        <div className="section-head amber">
          <div className="section-label amber">
            <span className="tick"></span>
            Evidence Library
          </div>
          <h2 className="section-heading">
            Case <em>precedents</em>.
          </h2>
          <p className="section-sub">
            Every documented AI-hallucination sanction across US courts. Filter by severity, state, tool, or your active policy gaps.
          </p>
        </div>

        {/* State filter banner from map click */}
        {stateFilter && (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid rgba(245,158,11,0.35)",
              borderLeft: "2px solid var(--amber)",
              padding: "14px 20px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-300)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Filtering: <span style={{ color: "var(--amber)" }}>{stateFilter}</span> (from map)
            </span>
            <button
              onClick={onClearStateFilter}
              style={{
                background: "transparent",
                border: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-500)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Clear →
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "20px 24px", marginBottom: "24px" }}>
          {hasGaps && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid var(--border-soft)", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowMyGaps(!showMyGaps)}
                style={{
                  padding: "8px 16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  border: showMyGaps ? "1px solid var(--red-muted)" : "1px solid var(--border)",
                  background: showMyGaps ? "rgba(239,68,68,0.12)" : "transparent",
                  color: showMyGaps ? "var(--red-muted)" : "var(--text-400)",
                  transition: "all 0.2s",
                }}
              >
                {showMyGaps ? "◆ Showing My Gaps" : "Match My Gaps"}
              </button>
              {showMyGaps && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-500)", letterSpacing: "0.08em" }}>
                  Filtering to {gapIds.length} gap{gapIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Severity pills */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-500)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginRight: "4px",
              }}
            >
              Severity
            </span>
            <div style={{ display: "inline-flex", border: "1px solid var(--border)", background: "var(--bg)" }}>
              {SEVERITY_OPTIONS.map((f) => {
                const active = severity === f;
                return (
                  <button
                    key={f}
                    onClick={() => setSeverity(f)}
                    style={{
                      padding: "7px 14px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      background: active ? "var(--bg-card)" : "transparent",
                      border: "none",
                      borderRight: "1px solid var(--border-soft)",
                      color: active ? "var(--text-100)" : "var(--text-500)",
                      transition: "all 0.2s",
                    }}
                  >
                    {f === "career-ending" ? "Career" : f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdowns + search */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            <select value={state} onChange={(e) => setState(e.target.value)} style={{ ...selectStyle, minWidth: "130px" }}>
              <option value="all">All States</option>
              {uniqueStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={tool} onChange={(e) => setTool(e.target.value)} style={{ ...selectStyle, minWidth: "150px" }}>
              <option value="all">All Tools</option>
              {uniqueTools.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...selectStyle, minWidth: "110px" }}>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ ...selectStyle, minWidth: "150px" }}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-500)", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case or court…"
                style={{
                  width: "100%",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-300)",
                  fontFamily: "var(--font-main)",
                  fontSize: "12px",
                  padding: "9px 12px 9px 32px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-500)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {sorted.length} of {typedCases.length} cases
          </div>
        </div>

        {/* Case cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="evidence-grid">
          {sorted.map((c) => {
            const isOpen = expandedId === c.id;
            const sev = severityColors[c.severity] || { color: "var(--text-500)", border: "var(--border)" };
            return (
              <div
                key={c.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderLeft: `2px solid ${sev.color}`,
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.3s",
                }}
              >
                <button
                  onClick={() => toggleExpand(c.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "24px 24px 20px",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          color: sev.color,
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        {c.severity === "career-ending" ? "Career" : c.severity}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          color: "var(--text-400)",
                          border: "1px solid var(--border-soft)",
                        }}
                      >
                        {c.state}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--text-500)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {c.date}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </div>
                  </div>
                  <h4
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "19px",
                      fontWeight: 500,
                      color: "var(--text-100)",
                      letterSpacing: "-0.015em",
                      lineHeight: 1.25,
                      marginBottom: "6px",
                      transition: "color 0.3s",
                    }}
                  >
                    {c.case_name}
                  </h4>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-500)",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: "14px",
                    }}
                  >
                    {c.court}
                  </p>
                  {!isOpen && (
                    <p style={{ fontSize: "13px", color: "var(--text-400)", lineHeight: 1.65, marginBottom: "12px", fontWeight: 300 }}>
                      {truncate(c.summary)}
                    </p>
                  )}
                  {c.amount !== null && c.amount > 0 && (
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "22px",
                        fontWeight: 500,
                        color: "var(--amber)",
                        letterSpacing: "-0.025em",
                        fontStyle: "italic",
                        lineHeight: 1,
                      }}
                    >
                      {c.amount_display}
                    </div>
                  )}
                  {(c.amount === null || c.amount === 0) && c.amount_display && (
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-300)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {c.amount_display}
                    </div>
                  )}
                </button>

                {isOpen && (
                  <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border-soft)", paddingTop: "20px", marginTop: "4px" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-400)", lineHeight: 1.7, fontWeight: 300, marginBottom: "16px" }}>
                      {c.summary}
                    </p>

                    {c.judge && c.judge !== "N/A" && (
                      <div style={{ marginBottom: "10px", fontSize: "12px", color: "var(--text-400)" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--text-600)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            marginRight: "8px",
                          }}
                        >
                          Judge
                        </span>
                        {c.judge}
                      </div>
                    )}
                    <div style={{ marginBottom: "14px", fontSize: "12px", color: "var(--text-400)" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "var(--text-600)",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          marginRight: "8px",
                        }}
                      >
                        AI Tool
                      </span>
                      {c.ai_tool_used}
                    </div>

                    {c.sanction_types.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--text-600)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                          }}
                        >
                          Sanctions
                        </span>
                        {c.sanction_types.map((st) => (
                          <span key={st} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-400)", letterSpacing: "0.1em", padding: "3px 8px", border: "1px solid var(--border-soft)" }}>
                            {st}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.policy_gap_ids.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px", alignItems: "center" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--text-600)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                          }}
                        >
                          Gaps
                        </span>
                        {c.policy_gap_ids.map((gid) => (
                          <span key={gid} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--blue)", letterSpacing: "0.1em", padding: "3px 8px", border: "1px solid rgba(0,102,255,0.25)", background: "rgba(0,102,255,0.06)" }}>
                            {POLICY_GAP_LABELS[gid] || gid}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "var(--text-600)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        {c.source_name}
                      </span>
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--blue)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        View Source
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-500)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            No cases match your filters.
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .evidence-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 680px) {
          .evidence-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
