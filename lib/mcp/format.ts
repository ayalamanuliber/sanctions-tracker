import type { PublicSanctionCase } from "./types";

type PublicMeta = {
  last_updated: string;
  total_cases: number;
  us_cases: number;
  countries_tracked: number;
  enriched_count: number;
  enrichment_coverage_pct: number;
  monetary_sanctions_total_usd: number;
  largest_single_sanction: number;
  avg_sanction: number;
  severity_counts: Record<string, number>;
};

export function formatCurrency(amount: number | null): string {
  if (amount === null) {
    return "None stated";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCase(caseItem: PublicSanctionCase): string {
  return [
    `${caseItem.case_name} (${caseItem.date})`,
    `Court: ${caseItem.court}`,
    `Jurisdiction: ${caseItem.jurisdiction}${caseItem.state ? ` / ${caseItem.state}` : caseItem.country ? ` / ${caseItem.country}` : ""}`,
    `Judge: ${caseItem.judge || "Unknown"}`,
    `Severity: ${caseItem.severity}`,
    `AI tool: ${caseItem.ai_tool_used}`,
    `Sanctions: ${caseItem.sanction_types.join(", ") || "None stated"}`,
    `Penalty: ${caseItem.amount_display || formatCurrency(caseItem.amount)}`,
    `Tags: ${caseItem.tags.join(", ") || "None"}`,
    `Policy gaps: ${caseItem.policy_gap_ids.join(", ") || "None"}`,
    `Summary: ${caseItem.summary || "No summary available."}`,
    `Source: ${caseItem.source_name} - ${caseItem.source_url || "Unavailable"}`,
  ].join("\n");
}

export function formatMeta(meta: PublicMeta): string {
  return [
    `Last updated: ${meta.last_updated}`,
    `Total cases: ${meta.total_cases}`,
    `US cases: ${meta.us_cases}`,
    `Countries tracked: ${meta.countries_tracked}`,
    `Enrichment coverage: ${meta.enrichment_coverage_pct}%`,
    `Total monetary sanctions: ${formatCurrency(meta.monetary_sanctions_total_usd)}`,
    `Largest single sanction: ${formatCurrency(meta.largest_single_sanction)}`,
    `Average sanction: ${formatCurrency(meta.avg_sanction)}`,
    `Severity counts: ${Object.entries(meta.severity_counts)
      .map(([severity, count]) => `${severity}=${count}`)
      .join(", ")}`,
  ].join("\n");
}

export function formatChecklist(caseItems: PublicSanctionCase[]): string {
  const policyGaps = [...new Set(caseItems.flatMap((item) => item.policy_gap_ids))];
  const failureModes = [...new Set(caseItems.flatMap((item) => item.tags))];

  const checklist = [
    "Pre-filing legal AI risk checklist",
    "",
    "1. Verify every citation, quotation, and procedural assertion against a primary source.",
    "2. Confirm whether generative AI was used anywhere in the drafting chain, including outlines or research memos.",
    "3. Check local court or judge-specific AI disclosure requirements before filing.",
    "4. Require supervising attorney review of all AI-assisted work product.",
    "5. Preserve an internal audit trail of prompts, outputs, and verification steps.",
  ];

  if (failureModes.length > 0) {
    checklist.push("", `Observed failure modes: ${failureModes.slice(0, 12).join(", ")}`);
  }

  if (policyGaps.length > 0) {
    checklist.push("", `Relevant control gaps: ${policyGaps.slice(0, 12).join(", ")}`);
  }

  return checklist.join("\n");
}

export function formatTrainingExamples(caseItems: PublicSanctionCase[]): string {
  return caseItems
    .map((item, index) =>
      [
        `${index + 1}. ${item.case_name}`,
        `Failure mode: ${item.tags.join(", ") || "Unspecified"}`,
        `Outcome: ${item.sanction_types.join(", ") || "Unspecified"}${item.amount_display ? ` / ${item.amount_display}` : ""}`,
        `Lesson: ${item.summary || "Review the source before using this example."}`,
        `Source: ${item.source_url || "Unavailable"}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function countBy(values: string[]): Record<string, number> {
  return values.filter(Boolean).reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function rankedEntries(counts: Record<string, number>, limit = 6): [string, number][] {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function formatBars(counts: Record<string, number>, labels: string[]): string[] {
  const max = Math.max(...labels.map((label) => counts[label] || 0), 1);
  return labels.map((label) => {
    const count = counts[label] || 0;
    const bar = "█".repeat(Math.max(1, Math.round((count / max) * 12)));
    return `${label.padEnd(14)} ${String(count).padStart(3)} ${bar}`;
  });
}

function riskLevel(caseItems: PublicSanctionCase[]): string {
  const high = caseItems.filter((item) => item.severity === "high").length;
  const critical = caseItems.filter((item) => item.severity === "career-ending").length;
  const monetary = caseItems.filter((item) => item.amount || item.sanction_types.includes("monetary")).length;
  if (critical > 0 || high >= 5) return "High";
  if (high > 0 || monetary >= 3 || caseItems.length >= 20) return "Moderate";
  if (caseItems.length > 0) return "Emerging";
  return "No tracked signal";
}

function importantCases(caseItems: PublicSanctionCase[], limit = 5): PublicSanctionCase[] {
  const score = (item: PublicSanctionCase) => {
    const severity = { "career-ending": 5, high: 4, medium: 3, low: 1 }[item.severity] || 1;
    const money = item.amount ? Math.min(3, Math.ceil(item.amount / 10000)) : 0;
    const professional = item.sanction_types.some((type) =>
      ["professional", "bar-referral", "disqualification"].includes(type),
    )
      ? 2
      : 0;
    return severity + money + professional;
  };

  return caseItems.slice().sort((a, b) => score(b) - score(a) || b.date.localeCompare(a.date)).slice(0, limit);
}

function compactCaseLine(item: PublicSanctionCase): string {
  const penalty = item.amount_display ? ` / ${item.amount_display}` : "";
  return `- ${item.case_name} (${item.date}, ${item.court}): ${item.severity}; ${item.sanction_types.join(", ") || "no sanction listed"}${penalty}`;
}

function dateCoverage(caseItems: PublicSanctionCase[]): string[] {
  if (caseItems.length === 0) return ["Date coverage: no matched cases"];
  const dates = caseItems.map((item) => item.date).filter(Boolean).sort();
  const latest = dates[dates.length - 1];
  const oldest = dates[0];
  const withSource = caseItems.filter((item) => item.source_url).length;
  const sourcePct = Math.round((withSource / caseItems.length) * 100);

  return [
    `Date coverage: ${oldest} to ${latest}`,
    `Source-link coverage: ${withSource}/${caseItems.length} cases (${sourcePct}%)`,
  ];
}

function riskTags(caseItems: PublicSanctionCase[]): string[] {
  const contextTags = new Set([
    "trial",
    "appellate",
    "pro-se",
    "small-firm",
    "biglaw",
    "civil",
    "criminal",
    "employment",
    "contract",
    "tort",
    "family",
    "bankruptcy",
    "immigration",
    "civil-rights",
    "ip",
    "administrative",
    "other",
  ]);

  return caseItems.flatMap((item) => item.tags).filter((tag) => !contextTags.has(tag));
}

function controlRecommendations(caseItems: PublicSanctionCase[]): string[] {
  const tags = new Set(caseItems.flatMap((item) => item.tags));
  const gaps = new Set(caseItems.flatMap((item) => item.policy_gap_ids));
  const controls = new Set<string>();

  if (tags.has("fake-citations") || gaps.has("citation-verification")) {
    controls.add("Verify every cited authority in a primary legal research source before filing.");
  }
  if (
    tags.has("fabricated-quotes") ||
    tags.has("misrepresented-authority") ||
    gaps.has("authority-support-verification")
  ) {
    controls.add("Compare every quotation and cited proposition against the actual opinion text.");
  }
  if (gaps.has("supervision-protocol") || tags.has("bar-referral")) {
    controls.add("Require supervising attorney signoff for AI-assisted court-facing work.");
  }
  if (gaps.has("disclosure-compliance")) {
    controls.add("Check court, judge, and local-rule AI disclosure requirements before filing.");
  }
  if (gaps.has("audit-trail") || tags.has("paid-tool")) {
    controls.add("Save an audit note showing tool used, reviewer, date, and verification status.");
  }
  if (gaps.has("incident-response") || caseItems.some((item) => item.sanction_types.includes("bar-referral"))) {
    controls.add("Create a correction/escalation path for discovered fake authority or unsupported quotes.");
  }

  if (controls.size === 0) {
    controls.add("Run citation, quote, proposition-support, disclosure, and supervisor-review checks before filing.");
  }

  return [...controls].slice(0, 6);
}

export function formatJurisdictionRiskBrief(params: {
  caseItems: PublicSanctionCase[];
  state?: string;
  court?: string;
  practiceArea?: string;
}): string {
  const { caseItems, state, court, practiceArea } = params;
  if (caseItems.length === 0) {
    return [
      "Vortex jurisdiction risk brief",
      "",
      `No tracked cases matched ${[state, court, practiceArea].filter(Boolean).join(" / ") || "the requested filters"}.`,
      "",
      "Best next question: do you want a broader state, federal district, or practice-area scan?",
    ].join("\n");
  }

  const severity = countBy(caseItems.map((item) => item.severity));
  const proSe = caseItems.filter((item) => item.party?.toLowerCase().includes("pro se")).length;
  const lawyer = caseItems.filter((item) => item.party?.toLowerCase().includes("lawyer")).length;
  const monetaryTotal = caseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const monetaryCount = caseItems.filter((item) => item.amount || item.sanction_types.includes("monetary")).length;
  const failureModes = rankedEntries(countBy(riskTags(caseItems)), 6);
  const policyGaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 6);

  return [
    `Vortex jurisdiction risk brief${state ? `: ${state}` : ""}${court ? ` / ${court}` : ""}`,
    "",
    `Risk level: ${riskLevel(caseItems)}`,
    ...dateCoverage(caseItems),
    `Cases tracked: ${caseItems.length}`,
    `Lawyer-related cases: ${lawyer}`,
    `Pro se cases: ${proSe}`,
    `Known monetary cases: ${monetaryCount}`,
    `Known monetary total: ${formatCurrency(monetaryTotal)}`,
    "",
    "Severity mix",
    ...formatBars(severity, ["low", "medium", "high", "career-ending"]),
    "",
    "Observed failure modes",
    ...failureModes.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "Policy/control gaps",
    ...(policyGaps.length > 0 ? policyGaps.map(([label, count]) => `- ${label}: ${count}`) : ["- None tagged"]),
    "",
    "Most important cases",
    ...importantCases(caseItems).map(compactCaseLine),
    "",
    "Recommended controls",
    ...controlRecommendations(caseItems).map((item) => `- ${item}`),
    "",
    "Best next question: are you checking your own draft, opposing counsel's filing, or building a firm policy?",
  ].join("\n");
}

export function formatToolRiskProfile(caseItems: PublicSanctionCase[], tool: string): string {
  if (caseItems.length === 0) {
    return [
      `Vortex tool risk profile: ${tool}`,
      "",
      "No tracked cases matched this tool name. That does not mean the tool is risk-free; courts often describe AI use as implied or unidentified.",
      "",
      "Best next question: do you want a broader scan for paid legal AI tools, general ChatGPT/OpenAI cases, or implied AI cases?",
    ].join("\n");
  }

  const severity = countBy(caseItems.map((item) => item.severity));
  const jurisdictions = rankedEntries(countBy(caseItems.map((item) => item.state || item.country || "Unknown")), 8);
  const failures = rankedEntries(countBy(riskTags(caseItems)), 8);

  return [
    `Vortex tool risk profile: ${tool}`,
    "",
    `Tracked matching cases: ${caseItems.length}`,
    `Risk level: ${riskLevel(caseItems)}`,
    ...dateCoverage(caseItems),
    "",
    "Severity mix",
    ...formatBars(severity, ["low", "medium", "high", "career-ending"]),
    "",
    "Where it appears",
    ...jurisdictions.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "Recurring failure modes",
    ...failures.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "Representative cases",
    ...importantCases(caseItems).map(compactCaseLine),
    "",
    "Controls for firms using this tool",
    "- Treat generated legal authority as unverified until checked in a primary legal research source.",
    "- Require quote/proposition review, not only citation-existence review.",
    "- Do not let vendor branding or paid-tool status replace attorney supervision.",
    "- Preserve an audit note showing what the tool produced and what a human verified.",
    "",
    "Best next question: should I turn this into a procurement checklist, training module, or pre-filing review packet?",
  ].join("\n");
}

export function formatPrefilingReviewPacket(params: {
  caseItems: PublicSanctionCase[];
  state?: string;
  court?: string;
  practiceArea?: string;
  documentType?: string;
  aiTool?: string;
}): string {
  const { caseItems, state, court, practiceArea, documentType, aiTool } = params;
  return [
    "Vortex pre-filing AI risk packet",
    "",
    `Matter context: ${[documentType, court, state, practiceArea, aiTool].filter(Boolean).join(" / ") || "not specified"}`,
    `Comparable cases found: ${caseItems.length}`,
    `Risk level: ${riskLevel(caseItems)}`,
    ...dateCoverage(caseItems),
    "",
    "Required checks before filing",
    "[ ] Every cited case exists exactly as cited.",
    "[ ] Every pincite is valid.",
    "[ ] Every quoted passage matches the source opinion.",
    "[ ] Every cited authority supports the proposition attached to it.",
    "[ ] AI-generated summaries were replaced or verified against primary sources.",
    "[ ] Court, judge, and local AI disclosure requirements were checked.",
    "[ ] Supervising attorney signoff is documented.",
    "[ ] Verification notes are saved to the matter file.",
    "",
    "Comparable cases to review",
    ...(importantCases(caseItems, 6).length > 0
      ? importantCases(caseItems, 6).map(compactCaseLine)
      : ["- No direct matches; use the generic controls above."]),
    "",
    "Recommended controls",
    ...controlRecommendations(caseItems).map((item) => `- ${item}`),
    "",
    "Best next question: do you want a partner signoff checklist, a client-safe explanation, or an opposing-counsel risk scan?",
  ].join("\n");
}

export function formatOpposingFilingReview(caseItems: PublicSanctionCase[], issue: string): string {
  return [
    "Vortex opposing filing review",
    "",
    `Observed issue: ${issue || "suspicious legal authority or AI-like citation pattern"}`,
    `Comparable cases found: ${caseItems.length}`,
    ...dateCoverage(caseItems),
    "",
    "First-pass review sequence",
    "1. Existence check: confirm every cited case exists exactly as cited.",
    "2. Quote check: compare every quoted phrase against the source opinion.",
    "3. Proposition-support check: confirm the authority actually supports the sentence it is attached to.",
    "4. Pattern check: look for fake reporters, impossible pincites, generic case names, or mismatched jurisdictions.",
    "5. Process check: preserve PDFs/screenshots and ask for correction before escalating.",
    "",
    "Comparable failure patterns",
    ...(importantCases(caseItems, 6).length > 0
      ? importantCases(caseItems, 6).map(compactCaseLine)
      : ["- No direct matches; broaden the jurisdiction or issue search."]),
    "",
    "Possible outputs to generate next",
    "- Citation verification table",
    "- Meet-and-confer email",
    "- Motion outline",
    "- Sanctions precedent appendix",
    "- Court-neutral order-to-show-cause checklist",
  ].join("\n");
}

export function formatPolicyGapReport(caseItems: PublicSanctionCase[], audience: string): string {
  const gaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 10);
  return [
    `Vortex policy gap report${audience ? `: ${audience}` : ""}`,
    "",
    `Cases analyzed: ${caseItems.length}`,
    `Risk level: ${riskLevel(caseItems)}`,
    ...dateCoverage(caseItems),
    "",
    "Most common control gaps",
    ...(gaps.length > 0 ? gaps.map(([label, count]) => `- ${label}: ${count}`) : ["- No tagged policy gaps in the matched set."]),
    "",
    "Controls to adopt",
    ...controlRecommendations(caseItems).map((item) => `- ${item}`),
    "",
    "Implementation notes",
    "- Make citation and quote verification a workflow step, not a reminder in a policy PDF.",
    "- Require signoff for court-facing AI-assisted work.",
    "- Keep a matter-level record of tool use and human verification.",
    "- Train with recent local cases so lawyers see the risk as real and current.",
    "",
    "Best next question: should I convert this into a firm policy, associate training module, or weekly risk digest?",
  ].join("\n");
}

export function formatVisualSummaryData(caseItems: PublicSanctionCase[], title: string): string {
  const payload = {
    title,
    date_coverage:
      caseItems.length > 0
        ? {
            oldest: caseItems.map((item) => item.date).filter(Boolean).sort()[0],
            latest: caseItems.map((item) => item.date).filter(Boolean).sort().at(-1),
          }
        : null,
    source_link_coverage: {
      with_source_url: caseItems.filter((item) => item.source_url).length,
      total: caseItems.length,
    },
    cards: [
      { label: "Cases", value: caseItems.length },
      { label: "Known monetary total", value: formatCurrency(caseItems.reduce((sum, item) => sum + (item.amount || 0), 0)) },
      { label: "Lawyer-related", value: caseItems.filter((item) => item.party?.toLowerCase().includes("lawyer")).length },
      { label: "Pro se", value: caseItems.filter((item) => item.party?.toLowerCase().includes("pro se")).length },
    ],
    severity: countBy(caseItems.map((item) => item.severity)),
    failure_modes: Object.fromEntries(rankedEntries(countBy(riskTags(caseItems)), 8)),
    policy_gaps: Object.fromEntries(rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 8)),
    recent_cases: caseItems.slice(0, 8).map((item) => ({
      date: item.date,
      case_name: item.case_name,
      court: item.court,
      severity: item.severity,
      sanctions: item.sanction_types,
      amount: item.amount_display || "",
    })),
  };

  return [
    "Vortex visual summary data",
    "",
    "Use this structured payload to render cards, bars, tables, or a dashboard panel.",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}
