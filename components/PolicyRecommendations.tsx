"use client";

import cases from "@/data/cases.json";

interface Props {
  answers: Record<string, boolean>;
}

function countCasesWithGaps(gapIds: string[]): number {
  return cases.filter((c) =>
    c.policy_gap_ids.some((g: string) => gapIds.includes(g))
  ).length;
}

const recommendations = [
  {
    id: "written-ai-policy",
    num: 1,
    title: "Written AI Policy",
    description: "Establish a firm-wide AI use policy. Courts cite its absence as an aggravating factor.",
    remediation: "Draft and distribute a firm-wide policy. Require all attorneys to sign acknowledgment. Review quarterly.",
    gaps: ["written-ai-policy"],
  },
  {
    id: "citation-verification",
    num: 2,
    title: "Citation Verification Protocol",
    description: "Every AI citation must be independently verified before filing — including paid tools.",
    remediation: "Require a second attorney to verify every AI citation against Westlaw or CourtListener. No self-verification.",
    gaps: ["citation-verification", "paid-tool-verification"],
  },
  {
    id: "ai-disclosure-protocol",
    num: 3,
    title: "AI Disclosure Tracking",
    description: "300+ courts now have disclosure requirements. Track which apply to your jurisdictions.",
    remediation: "Maintain a current list of disclosure rules for every jurisdiction you practice in. Build disclosure into filing templates.",
    gaps: ["ai-disclosure-protocol"],
  },
  {
    id: "attorney-training",
    num: 4,
    title: "Mandatory Training",
    description: "Annual AI ethics training for all attorneys. Courts order this as a remedial measure.",
    remediation: "Implement annual AI ethics CLE: hallucination risks, verification, disclosure, and ABA Opinion 512 obligations.",
    gaps: ["attorney-training"],
  },
  {
    id: "supervision-protocol",
    num: 5,
    title: "Supervision Structure",
    description: "Designate a partner or committee for AI oversight. All signers are individually liable.",
    remediation: "Create a sign-off checklist for AI-assisted filings. Require substantive review, not just style review.",
    gaps: ["supervision-protocol"],
  },
  {
    id: "audit-trail",
    num: 6,
    title: "Audit Trail",
    description: "Document which portions of filings are AI-assisted. This is your defense in sanctions hearings.",
    remediation: "Tag AI-drafted sections in your workflow. Log which tool was used. Record the verification step.",
    gaps: ["audit-trail"],
  },
  {
    id: "approved-tools-list",
    num: 7,
    title: "Approved Tools List",
    description: "Maintain a sanctioned AI tools list with clear usage boundaries.",
    remediation: "Specify permitted use cases per tool. Require approval for new tools. Block consumer-grade tools on firm networks.",
    gaps: ["approved-tools-list"],
  },
  {
    id: "incident-response",
    num: 8,
    title: "Incident Response Plan",
    description: "Document what happens when AI errors are discovered post-filing.",
    remediation: "Three-step protocol: (1) Immediate corrective filing to the court. (2) Candid client notification. (3) Root cause documentation.",
    gaps: ["incident-response"],
  },
];

export default function PolicyRecommendations({ answers }: Props) {
  const hasAnswers = Object.keys(answers).length > 0;

  // Sort: gaps first (answered No), then covered
  const sorted = [...recommendations].sort((a, b) => {
    const aIsGap = answers[a.id] === false ? 1 : 0;
    const bIsGap = answers[b.id] === false ? 1 : 0;
    return bIsGap - aIsGap;
  });

  return (
    <section className="px-6 py-16 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[#FF5E1A] tracking-widest uppercase mb-2">
            Action Framework
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.03em]">
            Policy Recommendations
          </h2>
          <p className="text-white/50 mt-2 max-w-2xl text-sm leading-relaxed">
            {hasAnswers
              ? "Personalized to your assessment results. Red items are your active gaps."
              : `Based on patterns across ${cases.length} sanctions cases. Complete the assessment above to personalize these recommendations.`}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sorted.map((rec) => {
            const caseCount = countCasesWithGaps(rec.gaps);
            const isGap = answers[rec.id] === false;
            const isCovered = answers[rec.id] === true;

            return (
              <div
                key={rec.num}
                className={`border rounded-2xl p-6 transition-all duration-300 group hover:border-[#FF5E1A]/20 hover:-translate-y-0.5 ${
                  isGap
                    ? "bg-[#0A1628]/50 border-red-500/20 shadow-lg shadow-red-950/10"
                    : isCovered
                      ? "bg-[#0A1628]/50 border-emerald-500/15 opacity-70"
                      : "bg-[#0A1628]/50 border-white/[0.06]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                    isGap
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : isCovered
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#0066FF] text-white"
                  }`}>
                    {isCovered ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      rec.num
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{rec.title}</h3>
                      {isGap && (
                        <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          GAP
                        </span>
                      )}
                      {isCovered && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          COVERED
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-white/60 leading-relaxed mb-2">
                      {rec.description}
                    </p>
                    {isGap && (
                      <div className="bg-[#050B14]/80 border border-white/[0.06] rounded-xl p-3 mb-3">
                        <div className="text-[10px] font-semibold text-[#0066FF] tracking-wide uppercase mb-1">
                          What compliant firms do
                        </div>
                        <p className="text-white/50 text-xs leading-relaxed">
                          {rec.remediation}
                        </p>
                      </div>
                    )}
                    <div className="text-[11px] font-semibold text-white/30">
                      Based on <span className="text-[#FF5E1A]">{caseCount} case{caseCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-[#0A1628]/50 border border-white/[0.06] rounded-2xl p-8 text-center">
          <h4 className="text-xl font-black text-white tracking-[-0.02em] mb-2">
            Need help implementing these?
          </h4>
          <p className="text-white/50 text-sm mb-6 max-w-lg mx-auto">
            AI Vortex provides policy templates, compliance checklists, and
            ongoing monitoring for firms navigating AI governance.
          </p>
          <a
            href="https://calendly.com/manuel-aivortex/ai-infrastructure-workflow-audit"
            target="_blank"
            rel="noopener"
            className="inline-block bg-[#0066FF] hover:bg-[#004ACC] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors"
          >
            Book a Policy Review
          </a>
        </div>
      </div>
    </section>
  );
}
