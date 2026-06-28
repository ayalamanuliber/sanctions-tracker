import type { PublicSanctionCase } from "./types";

export type PublicMeta = {
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

type JurisdictionProfile = {
  label: string;
  caseItems: PublicSanctionCase[];
  evidence?: EvidenceNoteInput;
};

export type VortexAudience =
  | "managing_partner"
  | "litigation_partner"
  | "associate"
  | "judge_chambers"
  | "gc_legal_ops"
  | "legal_vendor"
  | "insurer_risk"
  | "researcher"
  | "legal_professional";

export type EvidenceNoteInput = {
  exactMatchCount?: number;
  fallbackUsed?: boolean;
  fallbackLevel?: string;
  fallbackReason?: string;
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
    "Vortex legal AI risk corpus",
    "",
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

function compactCaseLineWithSource(item: PublicSanctionCase): string {
  const source = item.source_url
    ? `\n  Source: ${item.source_url}`
    : `\n  Source: unavailable${item.source_name ? ` (${item.source_name})` : ""}`;
  return `${compactCaseLine(item)}${source}`;
}

function suggestedArtifacts(items: string[]): string[] {
  return [
    "Recommended artifacts",
    ...items.map((item) => `- ${item}`),
    "- Source appendix with case links",
  ];
}

function sourceCoverage(caseItems: PublicSanctionCase[]): { withSource: number; total: number; pct: number } {
  const withSource = caseItems.filter((item) => item.source_url).length;
  const total = caseItems.length;
  return { withSource, total, pct: total > 0 ? Math.round((withSource / total) * 100) : 0 };
}

function provenanceBlock(caseItems: PublicSanctionCase[], meta?: PublicMeta, evidence?: EvidenceNoteInput): string[] {
  const coverage = sourceCoverage(caseItems);
  const exact = evidence?.exactMatchCount ?? caseItems.length;
  const fallback = evidence?.fallbackUsed ? "yes" : "no";
  const updated = meta?.last_updated || "not provided";
  return [
    "Evidence note",
    `- Summary: exact matches: ${exact}; fallback used: ${fallback}; source coverage: ${coverage.withSource}/${coverage.total} (${coverage.pct}%); tracker updated: ${updated}; public incidents are not usage-adjusted rates.`,
    `- Corpus: AI Vortex legal AI risk tracker${meta ? `, ${meta.total_cases.toLocaleString("en-US")} tracked global matters` : ""}`,
    `- Corpus last updated: ${updated}`,
    `- Exact matches: ${exact}`,
    `- Fallback used: ${fallback}`,
    ...(evidence?.fallbackUsed
      ? [
          `- Fallback level: ${evidence.fallbackLevel || "broader matched evidence"}`,
          `- Fallback reason: ${evidence.fallbackReason || "No narrower tracked cases matched the requested filters."}`,
        ]
      : []),
    `- Matched set used: ${caseItems.length} cases`,
    `- Source-link coverage for matched set: ${coverage.withSource}/${coverage.total} (${coverage.pct}%)`,
    "- Boundary: tracked public incidents are evidence of observed risk patterns, not usage-adjusted incident rates or legal advice.",
  ];
}

function advisorGuardrails(context: "tool" | "opposing" | "workflow" | "policy" | "brief"): string[] {
  const base = [
    "Professional judgment",
  ];

  if (context === "tool") {
    return [
      ...base,
      "- Do not rank tools as inherently safest or most dangerous without usage-volume data; rank the workflow controls they require.",
    ];
  }
  if (context === "opposing") {
    return [
      ...base,
      "- Do not accuse opposing counsel of AI use from citation problems alone; preserve evidence, verify the text, then escalate proportionally.",
    ];
  }
  if (context === "workflow") {
    return [
      ...base,
      "- A firmwide policy rollout next week is unrealistic. The feasible next-week move is a filing gate for court-facing work plus a 30-day rollout plan.",
    ];
  }
  if (context === "policy") {
    return [
      ...base,
      "- A policy memo alone will not reduce filing risk unless citation, quote, proposition-support, signoff, and audit steps become workflow gates.",
    ];
  }
  return [
    ...base,
    "- Treat this as a risk brief and workflow design input; verify source documents before relying on any individual case characterization.",
  ];
}

function naturalNextAction(items: string[]): string[] {
  return [
    "Suggested next step",
    ...items.map((item) => `- ${item}`),
  ];
}

function vortexFooter(meta?: PublicMeta): string[] {
  return [
    "AI Vortex note",
    `- Generated with AI Vortex Legal AI Risk | https://sanctions-tracker.vercel.app | Data: Damien Charlotin AI Hallucination Cases Database + AI Vortex enrichment | Updated: ${meta?.last_updated || "not provided"}`,
  ];
}

function formatArtifactLinks(
  baseUrl: string | undefined,
  params: {
    scenario: "jurisdiction" | "comparison" | "filing" | "opposing" | "policy" | "tool" | "dashboard" | "package";
    title?: string;
    audience?: string;
    state?: string;
    court?: string;
    aiTool?: string;
    practiceArea?: string;
  },
): string[] {
  if (!baseUrl) {
    return [
      "Recommended artifacts",
      "- Print view for browser Save as PDF",
      "- Word-compatible version",
      "- Source appendix",
    ];
  }

  const reportTitle = params.title || "AI Vortex Legal AI Risk Report";
  const common = { title: reportTitle, audience: params.audience, state: params.state, court: params.court, aiTool: params.aiTool, practiceArea: params.practiceArea };
  const rows = new Set<string>();

  if (["jurisdiction", "comparison", "dashboard", "package", "policy", "tool"].includes(params.scenario)) {
    rows.add(`- Dashboard: ${dashboardUrl(baseUrl, { state: params.state, court: params.court, audience: params.audience, aiTool: params.aiTool, practiceArea: params.practiceArea })}`);
  }
  if (["jurisdiction", "comparison", "dashboard", "package"].includes(params.scenario)) {
    rows.add(`- Map view: ${mapUrl(baseUrl, { state: params.state, court: params.court, audience: params.audience, aiTool: params.aiTool })}`);
  }
  if (["jurisdiction", "comparison", "policy", "tool", "dashboard", "package"].includes(params.scenario)) {
    const artifactType = params.scenario === "policy" ? "policy" : "report";
    const label = params.scenario === "policy" ? "One-page policy" : "Report";
    rows.add(`- ${label} print / Save as PDF: ${printUrl(baseUrl, { ...common, type: artifactType })}`);
    rows.add(`- ${label} Word-compatible version: ${artifactUrl(baseUrl, { ...common, type: artifactType, format: "word-ready" })}`);
  }
  if (["filing", "package"].includes(params.scenario)) {
    rows.add(`- Verification ledger CSV: ${artifactUrl(baseUrl, { ...common, type: "ledger", format: "csv" })}`);
    rows.add(`- Verification ledger Word-compatible HTML: ${artifactUrl(baseUrl, { ...common, type: "ledger", format: "word-ready" })}`);
  }
  if (["opposing"].includes(params.scenario)) {
    rows.add(`- Discrepancy matrix / review memo: ${artifactUrl(baseUrl, { ...common, type: "opposing", format: "word-ready" })}`);
  }
  rows.add(`- Source appendix: ${artifactUrl(baseUrl, { ...common, type: "source", format: "md" })}`);
  rows.add("- More formats on request: Markdown, basic PDF, or CSV exports.");

  return ["Recommended artifacts", ...rows];
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

function dateCoverageText(caseItems: PublicSanctionCase[]): string {
  if (caseItems.length === 0) return "no matched cases";
  const dates = caseItems.map((item) => item.date).filter(Boolean).sort();
  return `${dates[0]} to ${dates[dates.length - 1]}`;
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

function topControls(caseItems: PublicSanctionCase[], limit = 3): string[] {
  return controlRecommendations(caseItems).slice(0, limit);
}

export function formatJurisdictionRiskBrief(params: {
  caseItems: PublicSanctionCase[];
  state?: string;
  court?: string;
  practiceArea?: string;
  meta?: PublicMeta;
  evidence?: EvidenceNoteInput;
  baseUrl?: string;
}): string {
  const { caseItems, state, court, practiceArea, meta, evidence, baseUrl } = params;
  if (caseItems.length === 0) {
    return [
    "Vortex jurisdiction risk brief",
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `No tracked cases matched ${[state, court, practiceArea].filter(Boolean).join(" / ") || "the requested filters"}.`,
      "",
      ...naturalNextAction(["Broaden to state, federal district, or practice-area level before drawing a risk conclusion."]),
      "",
      ...vortexFooter(meta),
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
    ...provenanceBlock(caseItems, meta, evidence),
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
    "Leading source-backed examples",
    ...importantCases(caseItems, 3).map(compactCaseLineWithSource),
    "",
    "Recommended controls",
    ...topControls(caseItems).map((item) => `- ${item}`),
    "",
    ...advisorGuardrails("brief"),
    "",
    ...formatArtifactLinks(baseUrl, {
      scenario: "jurisdiction",
      title: `${state || court || "Jurisdiction"} legal AI risk brief`,
      audience: "legal_professional",
      state,
      court,
    }),
    "",
    ...naturalNextAction([
      "For leadership, use a one-page memo plus source appendix.",
      "For an active filing, move directly to the pre-filing packet.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatJurisdictionComparison(params: {
  profiles: JurisdictionProfile[];
  meta?: PublicMeta;
  baseUrl?: string;
}): string {
  const { profiles, meta, baseUrl } = params;
  const allCases = profiles.flatMap((profile) => profile.caseItems);
  const rows = profiles.map(({ label, caseItems }) => {
    const severity = countBy(caseItems.map((item) => item.severity));
    const highImpact = (severity.high || 0) + (severity["career-ending"] || 0);
    const lawyer = caseItems.filter((item) => item.party?.toLowerCase().includes("lawyer")).length;
    const failures = rankedEntries(countBy(riskTags(caseItems)), 3).map(([tag, count]) => `${tag} (${count})`);
    const coverage = sourceCoverage(caseItems);
    return {
      label,
      cases: caseItems.length,
      highImpact,
      lawyer,
      monetary: caseItems.filter((item) => item.amount || item.sanction_types.includes("monetary")).length,
      sourceCoverage: `${coverage.withSource}/${coverage.total}`,
      dateCoverage: dateCoverageText(caseItems),
      topFailures: failures.join("; ") || "No tagged failures",
      riskLevel: riskLevel(caseItems),
    };
  });
  const highest = rows.slice().sort((a, b) => {
    const riskOrder: Record<string, number> = { High: 4, Moderate: 3, Emerging: 2, "No tracked signal": 1 };
    return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0) || b.highImpact - a.highImpact || b.cases - a.cases;
  })[0];

  return [
    "Vortex jurisdiction comparison",
    "",
    ...provenanceBlock(allCases, meta, {
      exactMatchCount: profiles.reduce((sum, profile) => sum + (profile.evidence?.exactMatchCount ?? profile.caseItems.length), 0),
      fallbackUsed: profiles.some((profile) => profile.evidence?.fallbackUsed),
      fallbackLevel: "per-jurisdiction comparison fallback",
      fallbackReason: "One or more compared jurisdictions used broader evidence.",
    }),
    "",
    "| Office/Jurisdiction | Risk level | Cases | Date coverage | High/career | Lawyer-related | Monetary cases | Source coverage | Top failure signals |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.label} | ${row.riskLevel} | ${row.cases} | ${row.dateCoverage} | ${row.highImpact} | ${row.lawyer} | ${row.monetary} | ${row.sourceCoverage} | ${row.topFailures} |`,
    ),
    "",
    highest
      ? `Advisor readout: ${highest.label} should be treated as the higher-priority office for workflow controls in this matched set. That does not mean the other office is safe; it means the observed public-risk signal is stronger for ${highest.label}.`
      : "Advisor readout: no matched cases were available for this comparison.",
    "",
    "Recommended decision",
    "- Use one firmwide court-facing filing gate so lawyers do not treat NJ and NY as separate risk cultures.",
    "- Add office-specific training examples only after the universal gate exists.",
    "- Start with litigation filings, not every AI use case in the firm.",
    "",
    ...formatArtifactLinks(baseUrl, {
      scenario: "comparison",
      title: "Jurisdiction comparison",
      audience: "managing_partner",
    }),
    "",
    ...naturalNextAction([
      "Generate a two-office rollout plan with a 7-day pilot and a 30-day policy path.",
      "If a filing is imminent, run the D.N.J./S.D.N.Y. pre-filing packet for that matter.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatToolRiskProfile(
  caseItems: PublicSanctionCase[],
  tool: string,
  meta?: PublicMeta,
  evidence?: EvidenceNoteInput,
  baseUrl?: string,
): string {
  if (caseItems.length === 0) {
    return [
      `Vortex tool risk profile: ${tool}`,
      "",
      ...provenanceBlock(caseItems, meta, evidence),
      "",
      "No tracked cases matched this tool name. That does not mean the tool is risk-free; courts often describe AI use as implied or unidentified.",
      "",
      ...naturalNextAction(["Broaden the query to paid legal AI tools, general ChatGPT/OpenAI cases, or implied/unidentified AI cases."]),
      "",
      ...vortexFooter(meta),
    ].join("\n");
  }

  const severity = countBy(caseItems.map((item) => item.severity));
  const jurisdictions = rankedEntries(countBy(caseItems.map((item) => item.state || item.country || "Unknown")), 8);
  const failures = rankedEntries(countBy(riskTags(caseItems)), 8);

  return [
    `Vortex tool risk profile: ${tool}`,
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    "Important caveat: tracked matters are public incident reports, not usage-adjusted safety rates.",
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
    "Representative source-backed cases",
    ...importantCases(caseItems, 3).map(compactCaseLineWithSource),
    "",
    "Controls for firms using this tool",
    "- Treat generated legal authority as unverified until checked in a primary legal research source.",
    "- Require quote/proposition review, not only citation-existence review.",
    "- Do not let vendor branding or paid-tool status replace attorney supervision.",
    "- Preserve an audit note showing what the tool produced and what a human verified.",
    "",
    ...advisorGuardrails("tool"),
    "",
    ...suggestedArtifacts([
      "Vendor procurement risk memo",
      "Approved-use checklist",
      "Training slide outline",
      "Matter audit template",
    ]),
    ...formatArtifactLinks(baseUrl, {
      scenario: "tool",
      title: `${tool} risk profile`,
      audience: "legal_ops",
      aiTool: tool,
    }),
    "",
    ...naturalNextAction([
      "For procurement, use an approved-use matrix.",
      "For active litigation, use a court-specific pre-filing packet.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatToolRiskComparison(params: {
  profiles: { tool: string; caseItems: PublicSanctionCase[]; evidence?: EvidenceNoteInput }[];
  state?: string;
  practiceArea?: string;
  meta?: PublicMeta;
  baseUrl?: string;
}): string {
  const { profiles, state, practiceArea, meta, baseUrl } = params;
  const allCases = profiles.flatMap((profile) => profile.caseItems);
  const rows = profiles.map(({ tool, caseItems }) => {
    const high = caseItems.filter((item) => item.severity === "high").length;
    const career = caseItems.filter((item) => item.severity === "career-ending").length;
    const severeShare = caseItems.length > 0 ? Math.round(((high + career) / caseItems.length) * 100) : 0;
    const withSource = caseItems.filter((item) => item.source_url).length;
    const failures = rankedEntries(countBy(riskTags(caseItems)), 3).map(([label, count]) => `${label} (${count})`);

    return {
      tool,
      cases: caseItems.length,
      high,
      career,
      severeShare,
      sourceCoverage: caseItems.length > 0 ? `${withSource}/${caseItems.length}` : "0/0",
      topFailures: failures.length > 0 ? failures.join("; ") : "No matched failure tags",
    };
  });

  const mostSevere = rows
    .filter((row) => row.cases > 0)
    .sort((a, b) => b.severeShare - a.severeShare || b.cases - a.cases)[0];

  return [
    "Vortex AI tool risk comparison",
    "",
    ...provenanceBlock(allCases, meta, {
      exactMatchCount: profiles.reduce((sum, profile) => sum + (profile.evidence?.exactMatchCount ?? profile.caseItems.length), 0),
      fallbackUsed: profiles.some((profile) => profile.evidence?.fallbackUsed),
      fallbackLevel: "per-tool comparison fallback",
      fallbackReason: "One or more tool profiles used broader evidence.",
    }),
    "",
    `Context: ${[state, practiceArea].filter(Boolean).join(" / ") || "all tracked cases"}`,
    "Important caveat: case counts show tracked public incidents, not true usage-adjusted incident rates. Higher counts may reflect adoption and reporting, not inherent tool danger.",
    "",
    "Comparison table",
    "| Tool | Tracked cases | High | Career-ending | High+career share | Source coverage | Top failure signals |",
    "| --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.tool} | ${row.cases} | ${row.high} | ${row.career} | ${row.severeShare}% | ${row.sourceCoverage} | ${row.topFailures} |`,
    ),
    "",
    mostSevere
      ? `Readout: ${mostSevere.tool} has the highest severe-case concentration in this matched set, but do not treat that as a definitive tool-safety ranking without usage-volume data.`
      : "Readout: no matched public cases were found for the requested tools.",
    "",
    "Representative source-backed cases",
    ...profiles.flatMap(({ tool, caseItems }) => [
      `${tool}:`,
      ...(importantCases(caseItems, 1).length > 0
        ? importantCases(caseItems, 1).map(compactCaseLineWithSource)
        : ["- No matched representative cases."]),
    ]),
    "",
    "Controls that apply across tools",
    "- Do not use vendor category or paid-tool status as a substitute for authority verification.",
    "- Separate drafting, legal research, citation verification, and filing approval into visible workflow steps.",
    "- Track tool used, reviewer, verification date, and unresolved issues at matter level.",
    "",
    ...advisorGuardrails("tool"),
    "",
    ...suggestedArtifacts([
      "Procurement comparison memo",
      "Approved-tools matrix",
      "Risk committee briefing",
      "Training example packet by tool",
    ]),
    ...formatArtifactLinks(baseUrl, {
      scenario: "tool",
      title: "AI tool risk comparison",
      audience: "legal_ops",
      state,
    }),
    "",
    ...naturalNextAction([
      "If this is for leadership, frame it as workflow risk and procurement controls, not a tool danger ranking.",
      "If this is for lawyers, generate a one-page approved-use checklist by tool.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatPrefilingReviewPacket(params: {
  caseItems: PublicSanctionCase[];
  state?: string;
  court?: string;
  practiceArea?: string;
  documentType?: string;
  aiTool?: string;
  urgency?: string;
  meta?: PublicMeta;
  evidence?: EvidenceNoteInput;
  baseUrl?: string;
}): string {
  const { caseItems, state, court, practiceArea, documentType, aiTool, urgency, meta, evidence, baseUrl } = params;
  const urgent = urgency === "filing_tomorrow" || urgency === "same_day" || /tomorrow|tonight|midnight|same day|24/i.test(documentType || "");
  return [
    urgent ? "Vortex emergency pre-filing triage packet" : "Vortex pre-filing AI risk packet",
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `Matter context: ${[documentType, court, state, practiceArea, aiTool].filter(Boolean).join(" / ") || "not specified"}`,
    `Urgency mode: ${urgent ? "high - filing window appears imminent" : "standard"}`,
    `Comparable matched cases: ${caseItems.length}`,
    `Risk level: ${riskLevel(caseItems)}`,
    ...dateCoverage(caseItems),
    "",
    ...(urgent
      ? [
          "",
          "Operational pushback",
          "- Do not attempt a full firm policy rollout before tomorrow's filing. That is not realistic.",
          "- For this matter, run only the controls that can prevent a bad filing tonight: citation existence, quote accuracy, proposition support, disclosure check, and signing-attorney certification.",
        ]
      : []),
    "",
    "Immediate filing gate",
    "1. Freeze the draft version that will be checked.",
    "2. Extract every citation, pincite, quotation, and AI-assisted legal proposition into a verification table.",
    "3. Assign one verifier who did not generate the AI-assisted text.",
    "4. Mark each item verified, corrected, removed, or escalated.",
    "5. Signing attorney reviews only unresolved items and the final verification ledger.",
    "6. Save the ledger to the matter file before filing.",
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
    "Source-backed examples",
    ...(importantCases(caseItems, 3).length > 0
      ? importantCases(caseItems, 3).map(compactCaseLineWithSource)
      : ["- No direct matches; use the generic controls above."]),
    "",
    "Recommended controls",
    ...topControls(caseItems).map((item) => `- ${item}`),
    "",
    ...advisorGuardrails("workflow"),
    "",
    ...suggestedArtifacts([
      "Partner signoff checklist",
      "Matter audit note",
      "Citation verification table",
      "Client-safe explanation",
    ]),
    ...formatArtifactLinks(baseUrl, {
      scenario: "filing",
      title: "Pre-filing AI risk packet",
      audience: "litigation_team",
      state,
      court,
      aiTool,
    }),
    "",
    ...naturalNextAction([
      urgent
        ? "Generate the one-page emergency verification ledger for tonight's filing."
        : "Generate the partner signoff checklist and matter audit note.",
      "If the draft is available, extract citations and quotes before writing more policy language.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatOpposingFilingReview(
  caseItems: PublicSanctionCase[],
  issue: string,
  meta?: PublicMeta,
  evidence?: EvidenceNoteInput,
  baseUrl?: string,
): string {
  return [
    "Vortex opposing filing review",
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `Observed issue: ${issue || "suspicious legal authority or AI-like citation pattern"}`,
    `Comparable matched cases: ${caseItems.length}`,
    ...dateCoverage(caseItems),
    "",
    "First-pass review sequence",
    "1. Existence check: confirm every cited case exists exactly as cited.",
    "2. Quote check: compare every quoted phrase against the source opinion.",
    "3. Proposition-support check: confirm the authority actually supports the sentence it is attached to.",
    "4. Pattern check: look for fake reporters, impossible pincites, generic case names, or mismatched jurisdictions.",
    "5. Process check: preserve PDFs/screenshots and ask for correction before escalating.",
    "6. Escalation check: if counsel does not correct or explain, prepare a narrow court filing focused on the verified discrepancies, not speculation about AI use.",
    "",
    "Discrepancy matrix",
    "| Item | Citation / quote | Problem type | Verification step | Severity | Evidence needed | Recommended action |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | [insert cite/quote] | fake_case / fake_quote / unsupported_proposition / bad_pincite / unclear | Check primary source and cited page | low / medium / high / critical | PDF/source screenshot, quote comparison, docket copy | Correct request / meet-and-confer / court notice |",
    "| 2 | [insert cite/quote] | fake_case / fake_quote / unsupported_proposition / bad_pincite / unclear | Check proposition support | low / medium / high / critical | Source text and brief excerpt | Preserve and escalate proportionally |",
    "",
    "Preservation steps",
    "- Save the filed brief exactly as filed.",
    "- Save PDFs or screenshots of each cited authority checked.",
    "- Create a side-by-side quote/proposition comparison.",
    "- Preserve meet-and-confer correspondence and timestamps.",
    "- Do not characterize the issue as AI use unless independent evidence supports that statement.",
    "",
    "Meet-and-confer draft",
    "Counsel, we are reviewing the authorities cited at [pages/sections]. We have not been able to locate the quoted language/proposition in the cited opinions. Please identify the source text or confirm whether a correction is needed by [date/time]. We are not making assumptions about how the issue arose; we are asking to resolve the authority discrepancy before raising it with the Court.",
    "",
    "Escalation matrix",
    "- Minor or isolated mismatch: request correction and preserve the record.",
    "- Material quote/proposition problem: meet and confer, then seek leave or file a narrow notice if unresolved.",
    "- Nonexistent authority or repeated fabricated text: prepare a targeted motion/OSC request focused on verified discrepancies.",
    "- Bad-faith denial after notice: consider sanctions only with a clean evidentiary record.",
    "",
    "Source-backed analogues",
    ...(importantCases(caseItems, 3).length > 0
      ? importantCases(caseItems, 3).map(compactCaseLineWithSource)
      : ["- No direct matches; broaden the jurisdiction or issue search."]),
    "",
    ...advisorGuardrails("opposing"),
    "",
    "Optional deliverables",
    "- Citation verification table",
    "- Meet-and-confer email",
    "- Motion outline",
    "- Sanctions precedent appendix",
    "- Court-neutral order-to-show-cause checklist",
    ...formatArtifactLinks(baseUrl, {
      scenario: "opposing",
      title: "Opposing filing integrity review",
      audience: "litigation_team",
    }),
    "",
    ...naturalNextAction([
      "Fill the discrepancy matrix with the exact citations/quotes before alleging misconduct.",
      "If the discrepancies are material, draft a neutral meet-and-confer email first.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatPolicyGapReport(
  caseItems: PublicSanctionCase[],
  audience: string,
  meta?: PublicMeta,
  evidence?: EvidenceNoteInput,
  baseUrl?: string,
  filters: {
    state?: string;
    practiceArea?: string;
    aiTool?: string;
  } = {},
): string {
  const gaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 10);
  return [
    `Vortex policy gap readout${audience ? `: ${audience}` : ""}`,
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `Cases analyzed: ${caseItems.length}`,
    `Risk level: ${riskLevel(caseItems)}`,
    ...dateCoverage(caseItems),
    "",
    "Before drafting a firmwide policy",
    "- Confirm the main courts, approved AI tools, allowed uses, signer/reviewer workflow, verification systems, and whether the output is internal, client-facing, or court-facing.",
    "- If the user wants speed, use the default below for court-facing litigation work only. Label it as a default, not the firm's final policy.",
    "- If the matter is urgent, skip policy drafting and run the filing gate first.",
    "",
    "Most common control gaps",
    ...(gaps.length > 0 ? gaps.map(([label, count]) => `- ${label}: ${count}`) : ["- No tagged policy gaps in the matched set."]),
    "",
    "Default control skeleton",
    ...topControls(caseItems, 4).map((item) => `- ${item}`),
    "- Make citation and quote verification a workflow step, not a reminder in a policy PDF.",
    "- Require signoff for court-facing AI-assisted work.",
    "- Keep a matter-level record of tool use and human verification.",
    "",
    ...advisorGuardrails("policy"),
    "",
    ...suggestedArtifacts([
      "Policy intake worksheet",
      "Court-facing filing gate",
      "Verification ledger",
      "Leadership memo with source appendix",
    ]),
    ...formatArtifactLinks(baseUrl, {
      scenario: "policy",
      title: "AI filing policy gap report",
      audience,
      state: filters.state,
      practiceArea: filters.practiceArea,
      aiTool: filters.aiTool,
    }),
    "",
    ...naturalNextAction([
      "Ask the six intake questions before drafting a final firmwide policy.",
      "For immediate value, generate the 7-day filing gate and verification ledger.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatContextIntake(params: {
  scenario?: string;
  audience?: string;
  urgency?: "urgent_filing" | "normal" | "implementation";
}): string {
  const scenario = params.scenario || "policy or implementation request";
  if (params.urgency === "urgent_filing") {
    return [
      "Context intake decision",
      "",
      "This looks urgent. Do not slow the user down with a long intake.",
      "",
      "Proceed with emergency filing triage:",
      "- Identify the filing court and deadline.",
      "- Freeze the draft version to be checked.",
      "- Run citation, quote, proposition-support, disclosure, signoff, and audit gates.",
      "- Preserve the verification ledger and unresolved exceptions.",
      "",
      "Suggested next step",
      "- Call the pre-filing review packet tool and produce a concise same-day checklist.",
    ].join("\n");
  }

  return [
    "Context intake",
    "",
    `Use before overbuilding a ${scenario} for ${params.audience || "a legal professional"}.`,
    "",
    "Ask these tailoring questions first, then offer a default if they want speed:",
    "1. Which courts or jurisdictions matter most?",
    "2. Which AI tools are approved, and which are only informally used?",
    "3. What AI uses are allowed: research, drafting, summaries, quote extraction, cite checking, or client communications?",
    "4. Who reviews and signs court-facing filings?",
    "5. Which systems are used for verification: Westlaw, Lexis, Bloomberg, vLex, PACER, CourtListener, or internal KM?",
    "6. Is the needed artifact internal policy, client-facing guidance, court-facing workflow, training, or vendor/procurement material?",
    "",
    "Default offer",
    "- If the user does not want intake, produce a conservative default for court-facing litigation work only and label it as a default.",
  ].join("\n");
}

export function formatImplementationWorkflow(params: {
  caseItems: PublicSanctionCase[];
  audience?: string;
  timeline?: string;
  state?: string;
  court?: string;
  aiTools?: string[];
  meta?: PublicMeta;
  evidence?: EvidenceNoteInput;
  baseUrl?: string;
}): string {
  const { caseItems, audience, timeline, state, court, aiTools = [], meta, evidence, baseUrl } = params;
  const failures = rankedEntries(countBy(riskTags(caseItems)), 5);
  const gaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 5);

  return [
    "Vortex next-week legal AI filing workflow",
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `Operating context: ${[audience, court, state, aiTools.join(" + "), timeline].filter(Boolean).join(" / ") || "court-facing legal work"}`,
    "",
    ...advisorGuardrails("workflow"),
    "",
    "Evidence basis without dumping cases",
    ...dateCoverage(caseItems),
    ...(failures.length > 0 ? failures.map(([label, count]) => `- Failure signal: ${label} (${count})`) : ["- Failure signal: no tagged failures in matched set"]),
    ...(gaps.length > 0 ? gaps.map(([label, count]) => `- Control gap: ${label} (${count})`) : ["- Control gap: no tagged policy gaps in matched set"]),
    "",
    "Next-week minimum viable workflow",
    "1. Scope: apply only to court-facing litigation filings and dispositive motion drafts.",
    "2. Intake: the drafter marks whether AI touched research, drafting, quotes, summaries, or cite selection.",
    "3. Citation gate: every cited authority is checked in a primary legal research source before partner review.",
    "4. Quote gate: every quoted sentence is matched against the source text and pincite.",
    "5. Proposition gate: the reviewer confirms the cited case supports the proposition, not just that the case exists.",
    "6. Disclosure gate: the filer checks court, judge, and local-rule AI requirements before signature.",
    "7. Supervisor gate: signing attorney receives a short exception report, not a full wall of text.",
    "8. Audit gate: save reviewer, date, tools used, unresolved issues, and final disposition to the matter file.",
    "9. Incident path: if fake authority is found, pause filing, notify supervising attorney, correct or withdraw the language, and preserve the before/after record.",
    "",
    "What not to do next week",
    "- Do not announce a broad firmwide AI policy before the filing gate exists.",
    "- Do not ban all AI use unless the firm can actually enforce the ban.",
    "- Do not rely on self-certification without a spot-checkable verification ledger.",
    "",
    "30-day path",
    "- Week 1: litigation filing gate pilot.",
    "- Week 2: partner review calibration and template cleanup.",
    "- Week 3: office/practice-group training using local source-backed cases.",
    "- Week 4: firm policy, audit retention standard, and exception process.",
    "",
    ...suggestedArtifacts([
      "One-page implementation memo",
      "Associate verification ledger",
      "Signing-attorney certification form",
      "30-day rollout plan",
    ]),
    ...formatArtifactLinks(baseUrl, {
      scenario: "package",
      title: "Next-week legal AI filing workflow",
      audience,
      state,
      court,
    }),
    "",
    ...naturalNextAction([
      "Generate the one-page implementation memo for leadership.",
      "Generate the verification ledger template the associates can use this week.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatDashboardDeepLink(params: {
  baseUrl: string;
  state?: string;
  court?: string;
  audience?: string;
  caseItems: PublicSanctionCase[];
  meta?: PublicMeta;
  evidence?: EvidenceNoteInput;
  practiceArea?: string;
  aiTool?: string;
}): string {
  const { baseUrl, state, court, audience, caseItems, meta, evidence, practiceArea, aiTool } = params;
  const url = new URL("/dashboard", baseUrl);
  if (state) url.searchParams.set("state", state.toUpperCase());
  if (court) url.searchParams.set("court", court);
  if (audience) url.searchParams.set("audience", audience);
  if (practiceArea) url.searchParams.set("practice_area", practiceArea);
  if (aiTool) url.searchParams.set("ai_tool", aiTool);

  return [
    "AI Vortex dashboard link",
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `Dashboard: ${url.toString()}`,
    "",
    "Use this when the user needs a visual rather than another written brief. The dashboard should be treated as the presentation layer; the MCP response is the evidence layer.",
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatSourceAppendix(
  caseItems: PublicSanctionCase[],
  title: string,
  meta?: PublicMeta,
  evidence?: EvidenceNoteInput,
): string {
  if (caseItems.length === 0) {
    return [
      `${title || "AI Vortex source appendix"}`,
      "",
      ...provenanceBlock(caseItems, meta, evidence),
      "",
      "No cases are available for this appendix under the current filters. Broaden the query before treating this as a complete source set.",
      "",
      ...vortexFooter(meta),
    ].join("\n");
  }

  const missing = caseItems.filter((item) => !item.source_url).length;
  return [
    `${title || "AI Vortex source appendix"}`,
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    ...(missing > 0 ? ["", `Source warning: ${missing} matched case${missing === 1 ? "" : "s"} lack direct source URLs.`] : []),
    "",
    "| Date | Case | Court | Severity | Source |",
    "| --- | --- | --- | --- | --- |",
    ...importantCases(caseItems, 12).map(
      (item) =>
        `| ${item.date} | ${item.case_name} | ${item.court} | ${item.severity} | ${item.source_url || "Unavailable"} |`,
    ),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatVerificationLedgerTemplate(params: {
  title?: string;
  court?: string;
  aiTools?: string[];
}): string {
  const { title, court, aiTools = [] } = params;
  return [
    title || "AI filing verification ledger",
    "",
    `Court/matter: ${court || "__________"}`,
    `AI tools disclosed for internal review: ${aiTools.length > 0 ? aiTools.join(", ") : "__________"}`,
    "",
    "| # | Draft page | Citation / quote / proposition | Source checked | AI touched? | Exists? | Pincite correct? | Quote exact? | Supports proposition? | Status | Reviewer |",
    "| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 |  |  |  | Yes / No / Unknown | Yes / No | Yes / No / N.A. | Yes / No / N.A. | Yes / No | Verified / Fix / Remove / Escalate |  |",
    "| 2 |  |  |  | Yes / No / Unknown | Yes / No | Yes / No / N.A. | Yes / No / N.A. | Yes / No | Verified / Fix / Remove / Escalate |  |",
    "| 3 |  |  |  | Yes / No / Unknown | Yes / No | Yes / No / N.A. | Yes / No / N.A. | Yes / No | Verified / Fix / Remove / Escalate |  |",
    "",
    "Signing attorney exception report",
    "- Citations checked: ___ / ___",
    "- Quotes checked: ___ / ___",
    "- Propositions checked: ___ / ___",
    "- Items corrected: ___",
    "- Items removed: ___",
    "- Items escalated: ___",
    "- Court/judge AI rule checked: Yes / No",
    "- Disclosure/certification needed: Yes / No / Unclear",
    "- Recommendation: File / File after edits / Do not file yet",
  ].join("\n");
}

export function formatReportArtifact(params: {
  reportType: string;
  audience?: string;
  caseItems: PublicSanctionCase[];
  state?: string;
  court?: string;
  format?: string;
  meta?: PublicMeta;
  baseUrl?: string;
  evidence?: EvidenceNoteInput;
}): string {
  const { reportType, audience, caseItems, state, court, format = "markdown", meta, baseUrl, evidence } = params;
  const failures = rankedEntries(countBy(riskTags(caseItems)), 5);
  const gaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 5);
  const downloads = baseUrl
    ? [
        "",
        "## Delivery Links",
        `- Print / Save as PDF: ${printUrl(baseUrl, { type: "report", title: reportType, audience, state, court })}`,
        `- Word-compatible version: ${artifactUrl(baseUrl, { type: "report", format: "word-ready", title: reportType, audience, state, court })}`,
        `- Source appendix: ${artifactUrl(baseUrl, { type: "source", format: "md", title: `${reportType} Source Appendix`, audience, state, court })}`,
        "- More formats on request: Markdown or basic PDF export.",
      ]
    : [];

  return [
    `# ${reportType || "AI Filing Risk Report"}`,
    "",
    `Audience: ${audience || "legal professional"}`,
    `Scope: ${[court, state].filter(Boolean).join(" / ") || "matched legal AI risk corpus"}`,
    `Format target: ${format}`,
    "",
    "## Evidence Note",
    ...provenanceBlock(caseItems, meta, evidence).slice(1).map((line) => line.replace(/^- /, "- ")),
    "",
    "## Executive Readout",
    `The matched evidence points to ${riskLevel(caseItems).toLowerCase()} legal AI filing risk. The recurring control failure is not AI use by itself; it is unverified authority, quotes, and propositions reaching court-facing work.`,
    "",
    "## Priority Controls",
    ...topControls(caseItems).map((item) => `- ${item}`),
    "",
    "## Observed Signals",
    ...failures.map(([label, count]) => `- ${label}: ${count}`),
    ...gaps.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "## Source-Backed Examples",
    ...importantCases(caseItems, 5).map(compactCaseLineWithSource),
    "",
    "## Recommended Next Step",
    "Use the print view for partner review or browser Save as PDF. Use the Word-compatible version when the team needs to edit.",
    ...downloads,
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatImplementationPackage(params: {
  caseItems: PublicSanctionCase[];
  audience?: string;
  state?: string;
  court?: string;
  aiTools?: string[];
  meta?: PublicMeta;
  baseUrl?: string;
  evidence?: EvidenceNoteInput;
}): string {
  const { caseItems, audience, state, court, aiTools = [], meta, baseUrl, evidence } = params;
  const links = baseUrl
    ? [
        "",
        "Open these first",
        `- Print / Save as PDF: ${printUrl(baseUrl, { type: "package", title: "AI Vortex Implementation Package", audience, state, court, aiTool: aiTools.join(", ") })}`,
        `- Word-compatible package: ${artifactUrl(baseUrl, { type: "package", format: "word-ready", title: "AI Vortex Implementation Package", audience, state, court, aiTool: aiTools.join(", ") })}`,
        `- Dashboard: ${dashboardUrl(baseUrl, { state, court, audience })}`,
        `- Map: ${mapUrl(baseUrl, { state, court, audience })}`,
        `- Verification ledger CSV: ${artifactUrl(baseUrl, { type: "ledger", format: "csv", state, court, aiTool: aiTools.join(", ") })}`,
        `- Source appendix: ${artifactUrl(baseUrl, { type: "source", format: "md", state, court })}`,
      ]
    : [];
  return [
    "AI Vortex implementation package index",
    "",
    provenanceBlock(caseItems, meta, evidence)[0],
    provenanceBlock(caseItems, meta, evidence)[1],
    "",
    `Audience: ${audience || "legal team"}`,
    `Scope: ${[court, state, aiTools.join(" + ")].filter(Boolean).join(" / ") || "court-facing legal AI use"}`,
    "",
    "Package contents",
    "- Leadership memo: why the first move is a filing gate, not a broad policy rollout.",
    "- Workflow: AI-use intake, frozen draft, citation gate, quote gate, proposition gate, rule check, exception report, audit trail.",
    "- Templates: verification ledger, partner exception report, signing-attorney certification.",
    "- Evidence: source appendix for the leading tracked cases.",
    "- Rollout: 7-day pilot followed by 30-day policy adoption.",
    ...links,
    "",
    "Chat behavior",
    "- Keep this as a package index in chat. Do not paste the full memo/checklist/ledger unless the user asks to expand a specific item.",
    "- If the user wants a lawyer-friendly deliverable, point them to the print view first.",
    "",
    ...naturalNextAction([
      "Open the print package and decide whether it is for leadership, litigation team rollout, or training.",
      "Ask to expand only one artifact at a time: memo, ledger, source appendix, or rollout plan.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

function artifactUrl(
  baseUrl: string,
  params: {
    type: string;
    format: string;
    title?: string;
    audience?: string;
    state?: string;
    court?: string;
    aiTool?: string;
    practiceArea?: string;
  },
): string {
  const url = new URL("/api/artifact", baseUrl);
  url.searchParams.set("type", params.type);
  url.searchParams.set("format", params.format);
  if (params.title) url.searchParams.set("title", params.title);
  if (params.audience) url.searchParams.set("audience", params.audience);
  if (params.state) url.searchParams.set("state", params.state);
  if (params.court) url.searchParams.set("court", params.court);
  if (params.aiTool) url.searchParams.set("ai_tool", params.aiTool);
  if (params.practiceArea) url.searchParams.set("practice_area", params.practiceArea);
  return url.toString();
}

function printUrl(
  baseUrl: string,
  params: {
    type: string;
    title?: string;
    audience?: string;
    state?: string;
    court?: string;
    aiTool?: string;
    practiceArea?: string;
  },
): string {
  const url = new URL("/artifact/print", baseUrl);
  url.searchParams.set("type", params.type);
  if (params.title) url.searchParams.set("title", params.title);
  if (params.audience) url.searchParams.set("audience", params.audience);
  if (params.state) url.searchParams.set("state", params.state);
  if (params.court) url.searchParams.set("court", params.court);
  if (params.aiTool) url.searchParams.set("ai_tool", params.aiTool);
  if (params.practiceArea) url.searchParams.set("practice_area", params.practiceArea);
  return url.toString();
}

function dashboardUrl(
  baseUrl: string,
  params: {
    state?: string;
    court?: string;
    audience?: string;
    aiTool?: string;
    practiceArea?: string;
  },
): string {
  const url = new URL("/dashboard", baseUrl);
  if (params.state) url.searchParams.set("state", params.state);
  if (params.court) url.searchParams.set("court", params.court);
  if (params.audience) url.searchParams.set("audience", params.audience);
  if (params.aiTool) url.searchParams.set("ai_tool", params.aiTool);
  if (params.practiceArea) url.searchParams.set("practice_area", params.practiceArea);
  return url.toString();
}

function mapUrl(
  baseUrl: string,
  params: {
    state?: string;
    court?: string;
    audience?: string;
    aiTool?: string;
  },
): string {
  const url = new URL("/map", baseUrl);
  url.searchParams.set("metric", "cases");
  if (params.state) url.searchParams.set("states", params.state);
  if (params.court) url.searchParams.set("court", params.court);
  if (params.audience) url.searchParams.set("audience", params.audience);
  if (params.aiTool) url.searchParams.set("tool", params.aiTool);
  return url.toString();
}

export function formatVisualSummaryData(
  caseItems: PublicSanctionCase[],
  title: string,
  meta?: PublicMeta,
  evidence?: EvidenceNoteInput,
  baseUrl?: string,
  filters: {
    state?: string;
    court?: string;
    practiceArea?: string;
    aiTool?: string;
  } = {},
): string {
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
      source_url: item.source_url || "",
    })),
    artifact_options: [
      "Managing partner dashboard",
      "Live map",
      "Print / Save as PDF report",
      "Word-compatible report",
      "Source appendix",
    ],
  };

  return [
    "Vortex managing partner visual summary",
    "",
    provenanceBlock(caseItems, meta, evidence)[0],
    provenanceBlock(caseItems, meta, evidence)[1],
    "",
    "Executive cards",
    ...payload.cards.map((card) => `- ${card.label}: ${card.value}`),
    "",
    "Severity breakdown",
    ...formatBars(payload.severity, ["low", "medium", "high", "career-ending"]),
    "",
    "Failure modes",
    ...Object.entries(payload.failure_modes).map(([label, count]) => `- ${label}: ${count}`),
    "",
    "Top source-backed cases",
    ...(importantCases(caseItems, 4).length > 0
      ? importantCases(caseItems, 4).map(compactCaseLineWithSource)
      : ["- No matched cases."]),
    "",
    "Suggested visuals",
    "- Cards: cases, source coverage, lawyer-related matters, known monetary total.",
    "- Bars: severity mix and failure modes.",
    "- Map: geographic distribution using the live map link.",
    "- Memo: one-page print view with source-backed examples.",
    "",
    ...formatArtifactLinks(baseUrl, {
      scenario: "dashboard",
      title,
      audience: "managing_partner",
      state: filters.state,
      court: filters.court,
      practiceArea: filters.practiceArea,
      aiTool: filters.aiTool,
    }),
    "",
    ...naturalNextAction([
      "Use the JSON for cards/charts if the host app supports visuals.",
      "Generate a one-page managing partner memo with the same source-backed case appendix.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatProfileSetup(params: {
  role?: string;
  organizationType?: string;
  jurisdictions?: string[];
  courts?: string[];
  aiTools?: string[];
  artifactPreference?: string;
  dashboardPreference?: string;
  outputLength?: string;
  riskPosture?: string;
  includeTables?: boolean;
  includeCaseLinks?: boolean;
  recommendArtifacts?: boolean;
  preferWorkflowControls?: boolean;
  cautionLevel?: string;
  meta?: PublicMeta;
}): string {
  const {
    role,
    organizationType,
    jurisdictions = [],
    courts = [],
    aiTools = [],
    artifactPreference,
    dashboardPreference,
    outputLength,
    riskPosture,
    includeTables,
    includeCaseLinks,
    recommendArtifacts,
    preferWorkflowControls,
    cautionLevel,
    meta,
  } = params;

  return [
    "AI Vortex session profile",
    "",
    "Persistence note",
    "- These are non-persistent response preferences for the current request/session. This does not store personal data, client data, or a persistent firm profile.",
    "",
    "Context captured",
    `- Role: ${role || "legal professional"}`,
    `- Organization type: ${organizationType || "not specified"}`,
    `- Jurisdictions: ${jurisdictions.length > 0 ? jurisdictions.join(", ") : "not specified"}`,
    `- Courts: ${courts.length > 0 ? courts.join(", ") : "not specified"}`,
    `- AI tools: ${aiTools.length > 0 ? aiTools.join(", ") : "not specified"}`,
    `- Output length: ${outputLength || "concise advisor answers first"}`,
    `- Artifact preference: ${artifactPreference || (recommendArtifacts === false ? "do not recommend artifacts by default" : "recommend reusable artifacts when output is operational")}`,
    `- Dashboard preference: ${dashboardPreference || (includeTables === false ? "text-first unless asked" : "include tables/visual summaries where helpful")}`,
    `- Case links: ${includeCaseLinks === false ? "do not include by default" : "include source links for named cases when available"}`,
    `- Workflow controls: ${preferWorkflowControls === false ? "standard analysis" : "prefer operational workflow controls over generic advice"}`,
    `- Caution level: ${cautionLevel || riskPosture || "standard/high for court-facing work"}`,
    "",
    "How I will use it",
    "- Keep answers concise unless you ask for a full report.",
    "- Include source links for named cases when available.",
    "- Distinguish exact matches from fallback evidence.",
    "- Recommend checklists, ledgers, source appendices, dashboards, or reports when useful.",
    "- Avoid accusing any party of AI use without independent evidence.",
    "",
    ...naturalNextAction([
      "Ask for a jurisdiction risk brief for your NJ/NY offices, or run a filing packet for an active matter.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}

export function formatControlMaturityScore(params: {
  audience?: string;
  answers: Record<string, number | undefined>;
  caseItems: PublicSanctionCase[];
  meta?: PublicMeta;
  evidence?: EvidenceNoteInput;
  baseUrl?: string;
}): string {
  const { audience, answers, caseItems, meta, evidence, baseUrl } = params;
  const questions = [
    ["written_policy", "Written AI filing policy for court-facing work"],
    ["citation_verification", "Citation existence verification before filing"],
    ["quote_verification", "Quote and pincite verification"],
    ["proposition_support", "Proposition-support verification"],
    ["disclosure_check", "Court/judge/local AI disclosure check"],
    ["supervisor_signoff", "Supervising attorney signoff for AI-assisted filings"],
    ["audit_trail", "Matter-level audit trail"],
    ["incident_response", "Incident response path for discovered fake authority"],
  ] as const;
  const normalized = questions.map(([id, label]) => ({
    id,
    label,
    score: Math.max(0, Math.min(3, Number(answers[id]) || 0)),
  }));
  const raw = normalized.reduce((sum, item) => sum + item.score, 0);
  const pct = Math.round((raw / 24) * 100);
  const band = pct >= 90 ? "defensible" : pct >= 75 ? "controlled" : pct >= 50 ? "developing" : pct >= 25 ? "basic/ad hoc" : "exposed";
  const gaps = normalized.filter((item) => item.score < 2).slice(0, 4);

  return [
    "AI Vortex control maturity score",
    "",
    ...provenanceBlock(caseItems, meta, evidence),
    "",
    `Audience: ${audience || "legal team"}`,
    `Score: ${pct}/100`,
    `Maturity band: ${band}`,
    "",
    "Scoring scale",
    "- 0 = no control",
    "- 1 = informal/ad hoc",
    "- 2 = documented but inconsistent",
    "- 3 = documented, enforced, auditable",
    "",
    "Control scores",
    "| Control | Score |",
    "| --- | ---: |",
    ...normalized.map((item) => `| ${item.label} | ${item.score}/3 |`),
    "",
    "Priority gaps",
    ...(gaps.length > 0 ? gaps.map((item) => `- ${item.label}: move from ${item.score}/3 to at least 2/3.`) : ["- No sub-2 controls provided."]),
    "",
    "Next-week controls",
    "- Make citation, quote, and proposition verification mandatory for court-facing filings.",
    "- Require signing-attorney review of an exception report, not a long narrative memo.",
    "- Save reviewer, date, AI tools used, unresolved issues, and final disposition to the matter file.",
    "",
    "30-day controls",
    "- Adopt a written court-facing AI filing policy.",
    "- Train attorneys with source-backed local examples.",
    "- Add incident response steps for discovered fake authority or unsupported quotes.",
    "",
    ...formatArtifactLinks(baseUrl, {
      scenario: "policy",
      title: "AI control maturity score",
      audience,
    }),
    "",
    ...naturalNextAction([
      "Use the score to generate a 7-day filing-gate pilot and a 30-day policy rollout memo.",
    ]),
    "",
    ...vortexFooter(meta),
  ].join("\n");
}
