"use client";

import cases from "@/data/cases.json";

/* ---------- helpers ---------- */
function countByField<T extends string>(arr: T[]): Record<string, number> {
  const map: Record<string, number> = {};
  arr.forEach((v) => { map[v] = (map[v] || 0) + 1; });
  return map;
}

function sorted(obj: Record<string, number>) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

/* ---------- computed data ---------- */
const allGaps = cases.flatMap((c) => c.policy_gap_ids);
const gapCounts = sorted(countByField(allGaps));

const toolCounts = sorted(
  countByField(cases.map((c) => c.ai_tool_used))
);
const maxToolCount = toolCounts[0]?.[1] ?? 1;

const severityCounts = countByField(cases.map((c) => c.severity));
const severityOrder: { key: string; color: string; label: string }[] = [
  { key: "career-ending", color: "#FF3333", label: "Career-Ending" },
  { key: "high", color: "#FF8800", label: "High" },
  { key: "medium", color: "#FFCC00", label: "Medium" },
  { key: "low", color: "#44CC44", label: "Low" },
];

const byYear: Record<number, { total: number; count: number }> = {};
cases.forEach((c) => {
  const y = new Date(c.date).getFullYear();
  if (!byYear[y]) byYear[y] = { total: 0, count: 0 };
  if (c.amount) {
    byYear[y].total += c.amount;
    byYear[y].count += 1;
  }
});
const yearAvgs = Object.entries(byYear)
  .map(([y, d]) => ({ year: +y, avg: d.count ? Math.round(d.total / d.count) : 0 }))
  .sort((a, b) => a.year - b.year);
const maxAvg = Math.max(...yearAvgs.map((y) => y.avg), 1);

/* gap label map */
const gapLabels: Record<string, string> = {
  "citation-verification": "Citation Verification",
  "supervision-protocol": "Supervision Protocol",
  "attorney-training": "Attorney Training",
  "written-ai-policy": "Written AI Policy",
  "ai-disclosure-protocol": "AI Disclosure Protocol",
  "audit-trail": "Audit Trail",
  "paid-tool-verification": "Paid Tool Verification",
  "approved-tools-list": "Approved Tools List",
  "incident-response": "Incident Response",
  "engagement-letter-ai": "Engagement Letter AI",
};

/* insight cards data */
const citationGapCount = gapCounts.find(([k]) => k === "citation-verification")?.[1] ?? 0;
const paidToolCases = cases.filter(
  (c) => c.ai_tool_used.toLowerCase().includes("cocounsel") || c.ai_tool_used.toLowerCase().includes("westlaw")
);
const supervisionCases = cases.filter((c) => c.policy_gap_ids.includes("supervision-protocol"));
const denialCases = cases.filter(
  (c) =>
    c.tags.includes("denial") ||
    c.tags.includes("sustained-deception") ||
    c.policy_gap_ids.includes("incident-response")
);

const insightCards = [
  {
    title: "Citation verification is the #1 gap",
    detail: `Present in ${citationGapCount} of ${cases.length} tracked cases. Every sanctioned attorney failed to verify AI-generated citations against primary sources.`,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Paid tools are not exempt",
    detail: `${paidToolCases.length} case${paidToolCases.length !== 1 ? "s" : ""} involved CoCounsel/Westlaw. Courts ruled: "The tool's pedigree is no defense."`,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Supervisors are liable",
    detail: `${supervisionCases.length} case${supervisionCases.length !== 1 ? "s" : ""} cited supervision failures. Signing attorneys are individually responsible for AI-assisted work product.`,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Denial makes it worse",
    detail: `${denialCases.length} case${denialCases.length !== 1 ? "s" : ""} where denial or cover-up escalated sanctions. Courts treat transparency failures more harshly than the original error.`,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

/* ---------- component ---------- */
export default function Insights() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[#0066FF] tracking-widest uppercase mb-2">
            Intelligence
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em]">
            What the Data Reveals
          </h2>
          <p className="text-white/70 mt-2 max-w-2xl text-sm leading-relaxed">
            Patterns computed from {cases.length} landmark AI sanctions cases. These are the failure modes courts punish most.
          </p>
        </div>

        {/* top row: gap ranking + tool breakdown */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* most common gaps */}
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-white/50 tracking-wide uppercase mb-5">
              Most Common Policy Gaps
            </h3>
            <div className="space-y-4">
              {gapCounts.slice(0, 3).map(([gap, count], i) => (
                <div key={gap}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70 font-medium">
                      <span className="text-[#0066FF] font-bold mr-2">#{i + 1}</span>
                      {gapLabels[gap] || gap}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {count} cases
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / cases.length) * 100}%`,
                        background: i === 0 ? "#0066FF" : i === 1 ? "#0066FF99" : "#0066FF55",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* tool breakdown */}
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-white/50 tracking-wide uppercase mb-5">
              AI Tool Breakdown
            </h3>
            <div className="space-y-3">
              {toolCounts.map(([tool, count]) => (
                <div key={tool}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70 font-medium truncate mr-3">{tool}</span>
                    <span className="text-xs font-bold text-white/50 shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0066FF] rounded-full transition-all"
                      style={{ width: `${(count / maxToolCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* second row: severity + escalation trend */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* severity distribution */}
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-white/50 tracking-wide uppercase mb-5">
              Severity Distribution
            </h3>
            {/* bar segments */}
            <div className="flex h-4 rounded-full overflow-hidden mb-5">
              {severityOrder.map(({ key, color }) => {
                const count = severityCounts[key] || 0;
                const pct = (count / cases.length) * 100;
                return pct > 0 ? (
                  <div
                    key={key}
                    style={{ width: `${pct}%`, backgroundColor: color }}
                    className="first:rounded-l-full last:rounded-r-full"
                  />
                ) : null;
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {severityOrder.map(({ key, color, label }) => {
                const count = severityCounts[key] || 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-white/70">{label}</span>
                    <span className="text-sm font-bold text-white ml-auto">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* escalation trend */}
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-white/50 tracking-wide uppercase mb-5">
              Avg. Sanction Amount by Year
            </h3>
            <div className="space-y-4">
              {yearAvgs.map(({ year, avg }) => (
                <div key={year}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-white">{year}</span>
                    <span className="text-sm text-white/70 font-medium">
                      {avg > 0 ? `$${avg.toLocaleString()}` : "Non-monetary"}
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: avg > 0 ? `${(avg / maxAvg) * 100}%` : "4%",
                        backgroundColor: avg > 0 ? "#FF8800" : "#FFCC0044",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/40 mt-4">
              Based on cases with monetary sanctions. Non-monetary cases (disqualification, referral) excluded from average.
            </p>
          </div>
        </div>

        {/* key patterns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insightCards.map((card, i) => (
            <div
              key={i}
              className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 hover:border-[#0066FF]/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <h4 className="text-sm font-bold text-white mb-2">{card.title}</h4>
              <p className="text-[13px] text-white/70 leading-relaxed">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
