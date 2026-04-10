"use client";

import cases from "@/data/cases.json";

/* ---------- helpers ---------- */
function countCasesWithGaps(gapIds: string[]): number {
  return cases.filter((c) =>
    c.policy_gap_ids.some((g) => gapIds.includes(g))
  ).length;
}

/* ---------- recommendations ---------- */
const recommendations = [
  {
    num: 1,
    title: "Written AI Policy",
    description:
      "Establish a firm-wide AI use policy. Courts cite its absence as an aggravating factor in sanctions rulings.",
    gaps: ["written-ai-policy"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    num: 2,
    title: "Citation Verification Protocol",
    description:
      "Every AI citation must be independently verified before filing. No exceptions — including paid tools like CoCounsel.",
    gaps: ["citation-verification", "paid-tool-verification"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    num: 3,
    title: "AI Disclosure Tracking",
    description:
      "300+ courts now have disclosure requirements. Track which apply to your jurisdictions and automate compliance.",
    gaps: ["ai-disclosure-protocol"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    num: 4,
    title: "Mandatory Training",
    description:
      "Annual AI ethics training for all attorneys. Courts order this as a remedial measure — it should already be in place.",
    gaps: ["attorney-training"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    num: 5,
    title: "Supervision Structure",
    description:
      "Designate a partner or committee for AI oversight. All signing attorneys are individually liable for AI-assisted filings.",
    gaps: ["supervision-protocol"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    num: 6,
    title: "Audit Trail",
    description:
      "Document which portions of filings are AI-assisted. This is your defense in a sanctions hearing.",
    gaps: ["audit-trail"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    num: 7,
    title: "Approved Tools List",
    description:
      "Maintain a list of sanctioned AI tools with clear usage boundaries. Shadow AI is the biggest governance risk.",
    gaps: ["approved-tools-list"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    num: 8,
    title: "Incident Response Plan",
    description:
      "Document what happens when AI errors are discovered. Panic responses and cover-ups escalate sanctions dramatically.",
    gaps: ["incident-response"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

/* ---------- component ---------- */
export default function PolicyRecommendations() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[#0066FF] tracking-widest uppercase mb-2">
            Action Items
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em]">
            Policy Recommendations
          </h2>
          <p className="text-white/70 mt-2 max-w-2xl text-sm leading-relaxed">
            What smart firms are implementing based on the patterns in {cases.length} sanctions cases.
            Each recommendation maps directly to gaps that courts have punished.
          </p>
        </div>

        {/* 2-column grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const caseCount = countCasesWithGaps(rec.gaps);
            return (
              <div
                key={rec.num}
                className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 hover:border-[#0066FF]/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* numbered badge */}
                  <div className="w-10 h-10 rounded-xl bg-[#0066FF] text-white flex items-center justify-center text-sm font-black shrink-0">
                    {rec.num}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{rec.title}</h3>
                      <span className="text-[#0066FF]/70 group-hover:text-[#0066FF] transition-colors">
                        {rec.icon}
                      </span>
                    </div>
                    <p className="text-[13px] text-white/70 leading-relaxed mb-3">
                      {rec.description}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <svg className="w-3.5 h-3.5 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[11px] font-semibold text-white/50">
                        Based on {caseCount} case{caseCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
