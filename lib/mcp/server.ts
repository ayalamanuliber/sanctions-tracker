import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import sanctionsRaw from "@/data/sanctions.json";
import metaRaw from "@/data/meta.json";
import { matchesCourt, matchesTool } from "@/lib/filtering";
import {
  formatCase,
  formatChecklist,
  formatContextIntake,
  formatControlMaturityScore,
  formatDashboardDeepLink,
  formatImplementationWorkflow,
  formatImplementationPackage,
  formatJurisdictionComparison,
  formatJurisdictionRiskBrief,
  formatMeta,
  formatOpposingFilingReview,
  formatPolicyGapReport,
  formatProfileSetup,
  formatPrefilingReviewPacket,
  formatReportArtifact,
  formatSourceAppendix,
  formatToolRiskProfile,
  formatToolRiskComparison,
  formatTrainingExamples,
  formatVerificationLedgerTemplate,
  formatVisualSummaryData,
} from "./format";
import type { EvidenceNoteInput } from "./format";
import { filterCases, limitCases } from "./query";
import type { PublicSanctionCase } from "./types";

const sanctions = (sanctionsRaw as unknown as PublicSanctionCase[])
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date));

const meta = metaRaw as {
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

const publicBaseUrl = "https://sanctions-tracker.vercel.app/";

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function textIncludes(value: string | undefined | null, query: string | undefined): boolean {
  if (!query) return true;
  return (value || "").toLowerCase().includes(query.toLowerCase());
}

function matchContextCases(input: {
  state?: string;
  court?: string;
  practice_area?: string;
  ai_tool?: string;
  issue?: string;
  limit?: number;
}): PublicSanctionCase[] {
  const { state, court, practice_area, ai_tool, issue, limit = 100 } = input;
  const issueTerms = issue
    ?.toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((term) => term.length >= 3);

  const results = sanctions.filter((item) => {
    if (state && item.state !== state.toUpperCase()) return false;
    if (court && !matchesCourt(item.court, court)) return false;
    if (practice_area) {
      const haystack = [item.legal_field_primary, item.legal_field_secondary, item.tags.join(" ")].join(" ");
      if (!textIncludes(haystack, practice_area)) return false;
    }
    if (ai_tool && !matchesTool(item.ai_tool_used, ai_tool, item.summary)) {
      return false;
    }
    if (issueTerms && issueTerms.length > 0) {
      const haystack = [
        item.case_name,
        item.summary,
        item.outcome,
        item.tags.join(" "),
        item.policy_gap_ids.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!issueTerms.some((term) => haystack.includes(term))) return false;
    }
    return true;
  });

  return limitCases(results, limit);
}

function resolveContextCases(input: {
  state?: string;
  court?: string;
  practice_area?: string;
  ai_tool?: string;
  issue?: string;
  limit?: number;
}): { caseItems: PublicSanctionCase[]; evidence: EvidenceNoteInput } {
  const exact = matchContextCases(input);
  if (exact.length > 0) {
    return {
      caseItems: exact,
      evidence: { exactMatchCount: exact.length, fallbackUsed: false },
    };
  }

  const candidates: Array<{
    level: string;
    reason: string;
    filters: Parameters<typeof matchContextCases>[0];
  }> = [];

  if (input.state) {
    candidates.push({
      level: "same_jurisdiction_broader",
      reason: "No exact tracked matters matched all requested filters; broadened to the requested state.",
      filters: { state: input.state, limit: input.limit },
    });
  }
  if (input.court) {
    candidates.push({
      level: "same_court_broader",
      reason: "No exact tracked matters matched all requested filters; broadened to the requested court.",
      filters: { court: input.court, limit: input.limit },
    });
  }
  if (input.practice_area) {
    candidates.push({
      level: "same_practice_area",
      reason: "No exact tracked matters matched all requested filters; broadened to the requested practice area.",
      filters: { practice_area: input.practice_area, limit: input.limit },
    });
  }
  if (input.issue) {
    candidates.push({
      level: "same_failure_mode",
      reason: "No exact tracked matters matched all requested filters; broadened to similar issue/failure-mode matters.",
      filters: { issue: input.issue, limit: input.limit },
    });
  }
  if (input.ai_tool) {
    candidates.push({
      level: "same_tool",
      reason: "No exact tracked matters matched all requested filters; broadened to matters involving the requested AI tool.",
      filters: { ai_tool: input.ai_tool, limit: input.limit },
    });
  }

  candidates.push({
    level: "national_or_global_analogue",
    reason: "No exact or close contextual matches were found; using recent high-signal tracker matters as analogues.",
    filters: { limit: input.limit },
  });

  for (const candidate of candidates) {
    const caseItems = matchContextCases(candidate.filters);
    if (caseItems.length > 0) {
      return {
        caseItems,
        evidence: {
          exactMatchCount: 0,
          fallbackUsed: true,
          fallbackLevel: candidate.level,
          fallbackReason: candidate.reason,
        },
      };
    }
  }

  return {
    caseItems: [],
    evidence: {
      exactMatchCount: 0,
      fallbackUsed: true,
      fallbackLevel: "no_tracked_analogue",
      fallbackReason: "No exact or broader tracked matters were found.",
    },
  };
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "legal-ai-risk-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "get_summary_stats",
    {
      title: "Get Summary Stats",
      description:
        "Use this when you need high-level tracker statistics for the public legal AI risk corpus and need to explain what the tracker can do.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: formatMeta(meta) }],
    }),
  );

  server.registerTool(
    "list_recent_cases",
    {
      title: "List Recent Cases",
      description:
        "Use this when you need the most recent legal AI sanctions or governance cases. Include sources when presenting important cases to users.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        limit: z.number().int().min(1).max(25).default(10),
      },
    },
    async ({ limit }) => ({
      content: [{ type: "text", text: limitCases(sanctions, limit).map(formatCase).join("\n\n") }],
    }),
  );

  server.registerTool(
    "get_case_detail",
    {
      title: "Get Case Detail",
      description: "Use this when you know the exact case id and need the full case detail.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        case_id: z.string().min(1),
      },
    },
    async ({ case_id }) => {
      const caseItem = sanctions.find((item) => item.id === case_id);
      if (!caseItem) {
        return {
          isError: true,
          content: [{ type: "text", text: `Case not found: ${case_id}` }],
        };
      }

      return {
        content: [{ type: "text", text: formatCase(caseItem) }],
      };
    },
  );

  server.registerTool(
    "search_cases",
    {
      title: "Search Cases",
      description:
        "Use this when you need a free-text case search across names, summaries, tags, tools, and policy gaps. Use this for named cases like Mata v Avianca.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        query: z.string().min(2),
        limit: z.number().int().min(1).max(25).default(10),
      },
    },
    async ({ query, limit }) => {
      const results = limitCases(filterCases(sanctions, { search: query }), limit);
      return {
        content: [
          {
            type: "text",
            text:
              results.length > 0
                ? results.map(formatCase).join("\n\n")
                : `No cases matched "${query}".`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "filter_cases",
    {
      title: "Filter Cases",
      description:
        "Use this when you need structured filtering by jurisdiction, state, severity, AI tool, failure tag, or sanction type.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        jurisdiction: z.string().optional(),
        state: z.string().optional(),
        severity: z.enum(["career-ending", "high", "medium", "low"]).optional(),
        ai_tool: z.string().optional(),
        failure_tag: z.string().optional(),
        sanction_type: z.string().optional(),
        limit: z.number().int().min(1).max(25).default(10),
      },
    },
    async ({ jurisdiction, state, severity, ai_tool, failure_tag, sanction_type, limit }) => {
      const results = limitCases(
        filterCases(sanctions, {
          jurisdiction,
          state,
          severity,
          aiTool: ai_tool,
          failureTag: failure_tag,
          sanctionType: sanction_type,
        }),
        limit,
      );

      return {
        content: [
          {
            type: "text",
            text:
              results.length > 0
                ? results.map(formatCase).join("\n\n")
                : "No cases matched the provided filters.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_prefiling_checklist",
    {
      title: "Generate Pre-Filing Checklist",
      description:
        "Use this when you want a generic pre-filing legal AI checklist informed by matching public cases.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        query: z.string().min(2),
        limit: z.number().int().min(1).max(15).default(5),
      },
    },
    async ({ query, limit }) => ({
      content: [
        {
          type: "text",
          text: formatChecklist(limitCases(filterCases(sanctions, { search: query }), limit)),
        },
      ],
    }),
  );

  server.registerTool(
    "generate_training_examples",
    {
      title: "Generate Training Examples",
      description:
        "Use this when you need concise training examples drawn from matching public sanctions cases.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        query: z.string().min(2),
        limit: z.number().int().min(1).max(10).default(3),
      },
    },
    async ({ query, limit }) => {
      const matches = limitCases(filterCases(sanctions, { search: query }), limit);
      return {
        content: [
          {
            type: "text",
            text:
              matches.length > 0
                ? formatTrainingExamples(matches)
                : `No training examples matched "${query}".`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_filter_values",
    {
      title: "List Filter Values",
      description:
        "Use this when you need the available public filter values for states, tools, sanction types, tags, and policy gaps.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {},
    },
    async () => {
      const text = [
        `States: ${uniqueValues(sanctions.map((item) => item.state)).join(", ")}`,
        `AI tools: ${uniqueValues(sanctions.map((item) => item.ai_tool_used)).slice(0, 40).join(", ")}`,
        `Sanction types: ${uniqueValues(sanctions.flatMap((item) => item.sanction_types)).join(", ")}`,
        `Failure tags: ${uniqueValues(sanctions.flatMap((item) => item.tags)).join(", ")}`,
        `Policy gaps: ${uniqueValues(sanctions.flatMap((item) => item.policy_gap_ids)).join(", ")}`,
      ].join("\n\n");

      return {
        content: [{ type: "text", text }],
      };
    },
  );

  server.registerTool(
    "setup_user_profile",
    {
      title: "Setup User Profile",
      description:
        "Legacy compatibility tool. Prefer set_session_preferences for new calls. Use only for lightweight, non-persistent current-session context. This does not store personal data, client data, or persistent firm profile information.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        role: z.string().optional(),
        organization_type: z.string().optional(),
        jurisdictions: z.array(z.string()).default([]),
        courts: z.array(z.string()).default([]),
        ai_tools: z.array(z.string()).default([]),
        artifact_preference: z.string().optional(),
        dashboard_preference: z.string().optional(),
        output_length_preference: z.string().optional(),
        risk_posture: z.string().optional(),
      },
    },
    async ({
      role,
      organization_type,
      jurisdictions,
      courts,
      ai_tools,
      artifact_preference,
      dashboard_preference,
      output_length_preference,
      risk_posture,
    }) => ({
      content: [
        {
          type: "text",
          text: formatProfileSetup({
            role,
            organizationType: organization_type,
            jurisdictions,
            courts,
            aiTools: ai_tools,
            artifactPreference: artifact_preference,
            dashboardPreference: dashboard_preference,
            outputLength: output_length_preference,
            riskPosture: risk_posture,
            meta,
          }),
        },
      ],
    }),
  );

  server.registerTool(
    "set_session_preferences",
    {
      title: "Set Session Preferences",
      description:
        "Configure non-persistent response preferences for the current MCP request/session. This does not store personal data, client data, or create persistent memory. Prefer compact enum/boolean fields instead of rich free-text profile data.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        role: z.enum([
          "managing_partner",
          "litigation_partner",
          "associate",
          "judge_chambers",
          "gc_legal_ops",
          "legal_vendor",
          "insurer_risk",
          "researcher",
          "legal_professional",
        ]).default("legal_professional"),
        organization_type: z.enum(["law_firm", "court", "in_house", "vendor", "insurer", "research", "other"]).default("law_firm"),
        jurisdictions: z.array(z.string()).default([]),
        courts: z.array(z.string()).default([]),
        ai_tools: z.array(z.string()).default([]),
        output_length: z.enum(["concise", "standard", "detailed"]).default("concise"),
        include_tables: z.boolean().default(true),
        include_case_links: z.boolean().default(true),
        recommend_artifacts: z.boolean().default(true),
        prefer_workflow_controls: z.boolean().default(true),
        caution_level: z.enum(["standard", "high"]).default("high"),
      },
    },
    async ({
      role,
      organization_type,
      jurisdictions,
      courts,
      ai_tools,
      output_length,
      include_tables,
      include_case_links,
      recommend_artifacts,
      prefer_workflow_controls,
      caution_level,
    }) => ({
      content: [
        {
          type: "text",
          text: formatProfileSetup({
            role,
            organizationType: organization_type,
            jurisdictions,
            courts,
            aiTools: ai_tools,
            outputLength: output_length,
            includeTables: include_tables,
            includeCaseLinks: include_case_links,
            recommendArtifacts: recommend_artifacts,
            preferWorkflowControls: prefer_workflow_controls,
            cautionLevel: caution_level,
            meta,
          }),
        },
      ],
    }),
  );

  server.registerTool(
    "get_jurisdiction_risk_brief",
    {
      title: "Get Jurisdiction Risk Brief",
      description:
        "Use this when a user asks what legal AI risk means for a state, court, or practice area. Return a concise professional advisor brief by default: evidence note, essential metrics, main risk signal, top source-backed examples, controls, and suggested next step. Do not write a long consultant report unless asked.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        state: z.string().optional().describe("US state abbreviation, e.g. NJ, NY, CA."),
        court: z.string().optional().describe("Court name fragment, e.g. D. New Jersey."),
        practice_area: z.string().optional().describe("Practice area such as employment, bankruptcy, tort, family, civil rights."),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ state, court, practice_area, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, practice_area, limit });
      return {
        content: [
          {
            type: "text",
            text: formatJurisdictionRiskBrief({
              caseItems,
              state: state?.toUpperCase(),
              court,
              practiceArea: practice_area,
              meta,
              evidence,
              baseUrl: publicBaseUrl,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "compare_jurisdiction_risk",
    {
      title: "Compare Jurisdiction Risk",
      description:
        "Use this when a user asks to compare states, offices, courts, or jurisdictions, such as New Jersey vs New York. Return a concise side-by-side comparison with source coverage, date coverage, failure patterns, and an advisor readout.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        states: z.array(z.string().min(2)).min(2).max(6).optional(),
        courts: z.array(z.string().min(2)).min(2).max(6).optional(),
        practice_area: z.string().optional(),
        limit_per_jurisdiction: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ states, courts, practice_area, limit_per_jurisdiction }) => {
      const profiles = [
        ...(states || []).map((state) => {
          const result = resolveContextCases({
            state,
            practice_area,
            limit: limit_per_jurisdiction,
          });
          return {
            label: state.toUpperCase(),
            caseItems: result.caseItems,
            evidence: result.evidence,
          };
        }),
        ...(courts || []).map((court) => {
          const result = resolveContextCases({
            court,
            practice_area,
            limit: limit_per_jurisdiction,
          });
          return {
            label: court,
            caseItems: result.caseItems,
            evidence: result.evidence,
          };
        }),
      ];

      return {
        content: [
          {
            type: "text",
            text:
              profiles.length > 0
                ? formatJurisdictionComparison({ profiles, meta, baseUrl: publicBaseUrl })
                : "Provide at least two states or two courts to compare.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_tool_risk_profile",
    {
      title: "Get Tool Risk Profile",
      description:
        "Use this when a user asks about risk patterns for ChatGPT, Claude, CoCounsel, Lexis+ AI, Westlaw, or another AI/legal AI tool. Be concise and frame the answer as workflow risk, not a simplistic tool danger ranking.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        ai_tool: z.string().min(2),
        state: z.string().optional(),
        practice_area: z.string().optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ ai_tool, state, practice_area, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ ai_tool, state, practice_area, limit });
      return {
        content: [{ type: "text", text: formatToolRiskProfile(caseItems, ai_tool, meta, evidence, publicBaseUrl) }],
      };
    },
  );

  server.registerTool(
    "compare_tool_risk_profiles",
    {
      title: "Compare Tool Risk Profiles",
      description:
        "Use this when a user asks to compare legal AI risk across multiple tools such as ChatGPT, Claude, CoCounsel, Lexis+ AI, Westlaw, or other AI/legal AI tools. Return a concise side-by-side profile with caveats, severe-case concentration, source-backed representative cases, controls, and suggested deliverables.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        ai_tools: z.array(z.string().min(2)).min(2).max(6),
        state: z.string().optional(),
        practice_area: z.string().optional(),
        limit_per_tool: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ ai_tools, state, practice_area, limit_per_tool }) => {
      const profiles = ai_tools.map((tool) => {
        const result = resolveContextCases({
          ai_tool: tool,
          state,
          practice_area,
          limit: limit_per_tool,
        });
        return { tool, caseItems: result.caseItems, evidence: result.evidence };
      });

      return {
        content: [
          {
            type: "text",
            text: formatToolRiskComparison({
              profiles,
              state: state?.toUpperCase(),
              practiceArea: practice_area,
              meta,
              baseUrl: publicBaseUrl,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_prefiling_review_packet",
    {
      title: "Generate Pre-Filing Review Packet",
      description:
        "Use this when a lawyer or firm says they are filing a draft, motion, brief, memo, or other court-facing document and used or may have used AI. If the prompt says tomorrow, tonight, same day, midnight, urgent, or filing window, set urgency to filing_tomorrow or same_day and produce emergency triage. Prefer a usable checklist/ledger over long explanation.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        document_type: z.string().optional(),
        ai_tool: z.string().optional(),
        urgency: z.enum(["standard", "filing_this_week", "filing_tomorrow", "same_day"]).default("standard"),
        limit: z.number().int().min(1).max(100).default(50),
      },
    },
    async ({ state, court, practice_area, document_type, ai_tool, urgency, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, practice_area, ai_tool, limit });
      return {
        content: [
          {
            type: "text",
            text: formatPrefilingReviewPacket({
              caseItems,
              state: state?.toUpperCase(),
              court,
              practiceArea: practice_area,
              documentType: document_type,
              aiTool: ai_tool,
              urgency,
              meta,
              evidence,
              baseUrl: publicBaseUrl,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_opposing_filing_review",
    {
      title: "Generate Opposing Filing Review",
      description:
        "Use this when a user is reviewing opposing counsel's filing, suspicious citations, fabricated quotes, unsupported authority, or potential Rule 11 issues. Do not accuse AI use without evidence; focus on verification, preservation, proportional escalation, and a discrepancy matrix.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        issue: z.string().default("suspicious citations or fabricated quotes"),
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      },
    },
    async ({ issue, state, court, practice_area, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ issue, state, court, practice_area, limit });
      return {
        content: [{ type: "text", text: formatOpposingFilingReview(caseItems, issue, meta, evidence, publicBaseUrl) }],
      };
    },
  );

  server.registerTool(
    "prepare_context_intake",
    {
      title: "Prepare Context Intake",
      description:
        "Use this before generating long policy, platform, implementation, firmwide rollout, customization, or paid/workspace guidance when the user's context is incomplete. Do not use this for urgent same-day/tomorrow filing prompts; those should go directly to filing triage.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        scenario: z.string().default("policy or implementation request"),
        audience: z.string().optional(),
        urgency: z.enum(["urgent_filing", "normal", "implementation"]).default("implementation"),
      },
    },
    async ({ scenario, audience, urgency }) => {
      return {
        content: [{ type: "text", text: formatContextIntake({ scenario, audience, urgency }) }],
      };
    },
  );

  server.registerTool(
    "generate_policy_gap_report",
    {
      title: "Generate Policy Gap Report",
      description:
        "Use this when a firm, risk partner, KM team, innovation team, vendor, solo practitioner, court, or legal ops user asks what controls or policy gaps matter based on tracked legal AI failure patterns. For broad firmwide policy, platform setup, implementation, or rollout prompts with incomplete context, ask short intake questions first or provide only a conservative default skeleton. Do not draft a long firmwide policy unless the user explicitly asks for the full draft. For urgent filing prompts, do not ask intake questions; use pre-filing triage. Be concise, push back on unrealistic timelines, and recommend workflow gates, not vague policy language.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        audience: z.string().default("law firm"),
        state: z.string().optional(),
        practice_area: z.string().optional(),
        ai_tool: z.string().optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ audience, state, practice_area, ai_tool, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, practice_area, ai_tool, limit });
      return {
        content: [
          {
            type: "text",
            text: formatPolicyGapReport(caseItems, audience, meta, evidence, publicBaseUrl, {
              state: state?.toUpperCase(),
              practiceArea: practice_area,
              aiTool: ai_tool,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_control_maturity_score",
    {
      title: "Generate Control Maturity Score",
      description:
        "Use this when a firm, court, legal ops team, vendor, GC, insurer, solo practitioner, or risk committee wants an 8-question maturity score for legal AI filing controls. Return a 0-100 score, band, priority gaps, next-week controls, 30-day controls, tracker-backed evidence, and recommended artifacts.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        audience: z.string().default("legal team"),
        state: z.string().optional(),
        court: z.string().optional(),
        written_policy: z.number().int().min(0).max(3).optional(),
        citation_verification: z.number().int().min(0).max(3).optional(),
        quote_verification: z.number().int().min(0).max(3).optional(),
        proposition_support: z.number().int().min(0).max(3).optional(),
        disclosure_check: z.number().int().min(0).max(3).optional(),
        supervisor_signoff: z.number().int().min(0).max(3).optional(),
        audit_trail: z.number().int().min(0).max(3).optional(),
        incident_response: z.number().int().min(0).max(3).optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({
      audience,
      state,
      court,
      written_policy,
      citation_verification,
      quote_verification,
      proposition_support,
      disclosure_check,
      supervisor_signoff,
      audit_trail,
      incident_response,
      limit,
    }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, limit });
      return {
        content: [
          {
            type: "text",
            text: formatControlMaturityScore({
              audience,
              answers: {
                written_policy,
                citation_verification,
                quote_verification,
                proposition_support,
                disclosure_check,
                supervisor_signoff,
                audit_trail,
                incident_response,
              },
              caseItems,
              meta,
              evidence,
              baseUrl: publicBaseUrl,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_ai_filing_workflow",
    {
      title: "Generate AI Filing Workflow",
      description:
        "Use this when a user asks for the exact workflow, implementation plan, next-week controls, operational rollout, or what the firm/professional should actually do. This should be advisory, realistic, source-grounded, concise, and avoid dumping case lists.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        audience: z.string().default("law firm litigation department"),
        timeline: z.string().default("next week"),
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        ai_tools: z.array(z.string()).default([]),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ audience, timeline, state, court, practice_area, ai_tools, limit }) => {
      const { caseItems, evidence } = resolveContextCases({
        state,
        court,
        practice_area,
        limit,
      });

      return {
        content: [
          {
            type: "text",
            text: formatImplementationWorkflow({
              caseItems,
              audience,
              timeline,
              state: state?.toUpperCase(),
              court,
              aiTools: ai_tools,
              meta,
              evidence,
              baseUrl: publicBaseUrl,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_dashboard_deep_link",
    {
      title: "Generate Dashboard Deep Link",
      description:
        "Use this when the user needs a visual dashboard, managing-partner view, deterministic cards/tables, or a presentation layer. Return a live AI Vortex dashboard URL with filters and a short evidence note. Do not ask the host to generate an image unless the user explicitly asks for an image.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        state: z.string().optional(),
        court: z.string().optional(),
        audience: z.string().optional(),
        practice_area: z.string().optional(),
        ai_tool: z.string().optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ state, court, audience, practice_area, ai_tool, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, practice_area, ai_tool, limit });
      return {
        content: [
          {
            type: "text",
            text: formatDashboardDeepLink({
              baseUrl: publicBaseUrl,
              state: state?.toUpperCase(),
              court,
              audience,
              caseItems,
              meta,
              evidence,
              practiceArea: practice_area,
              aiTool: ai_tool,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_report_artifact",
    {
      title: "Generate Report Artifact",
      description:
        "Use this when the user asks for a policy, memo, report, brief, implementation packet, print-ready view, Word-compatible content, or distributable artifact. Default to print view plus Word-compatible version and source appendix. Do not lead with Markdown for legal users and do not call Markdown a PDF. For broad firmwide policy/platform requests with missing context, use prepare_context_intake before generating a long artifact unless the user explicitly asks for a default.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        report_type: z.string().default("AI Filing Risk Report"),
        audience: z.string().optional(),
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        format: z.enum(["markdown", "pdf-ready", "word-ready", "google-doc-ready"]).default("markdown"),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ report_type, audience, state, court, practice_area, format, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, practice_area, limit });
      return {
        content: [
          {
            type: "text",
            text: formatReportArtifact({
              reportType: report_type,
              audience,
              caseItems,
              state: state?.toUpperCase(),
              court,
              format,
              meta,
              baseUrl: publicBaseUrl,
              evidence,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_verification_ledger_template",
    {
      title: "Generate Verification Ledger Template",
      description:
        "Use this when the user needs a practical citation, quote, proposition-support, partner exception, or signing-attorney template for an active filing.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        title: z.string().optional(),
        court: z.string().optional(),
        ai_tools: z.array(z.string()).default([]),
      },
    },
    async ({ title, court, ai_tools }) => {
      const url = new URL("/api/artifact", publicBaseUrl);
      url.searchParams.set("type", "ledger");
      url.searchParams.set("format", "csv");
      if (title) url.searchParams.set("title", title);
      if (court) url.searchParams.set("court", court);
      if (ai_tools.length > 0) url.searchParams.set("ai_tool", ai_tools.join(", "));

      return {
        content: [
          {
            type: "text",
            text: [
              formatVerificationLedgerTemplate({ title, court, aiTools: ai_tools }),
              "",
              `Download ledger CSV: ${url.toString()}`,
            ].join("\n"),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_source_appendix",
    {
      title: "Generate Source Appendix",
      description:
        "Use this when the user needs sources, links, citations, appendix material, or substantiation for a memo, dashboard, brief, or policy discussion.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        title: z.string().default("AI Vortex Source Appendix"),
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        ai_tool: z.string().optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ title, state, court, practice_area, ai_tool, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, practice_area, ai_tool, limit });
      const url = new URL("/api/artifact", publicBaseUrl);
      url.searchParams.set("type", "source");
      url.searchParams.set("format", "md");
      url.searchParams.set("title", title);
      if (state) url.searchParams.set("state", state.toUpperCase());
      if (court) url.searchParams.set("court", court);
      if (practice_area) url.searchParams.set("practice_area", practice_area);
      if (ai_tool) url.searchParams.set("ai_tool", ai_tool);
      return {
        content: [{ type: "text", text: `${formatSourceAppendix(caseItems, title, meta, evidence)}\n\nDownload source appendix: ${url.toString()}` }],
      };
    },
  );

  server.registerTool(
    "compile_implementation_package",
    {
      title: "Compile Implementation Package",
      description:
        "Use this near the end of a session or after multiple analyses when the user needs a complete package for leadership, risk, litigation, chambers, vendors, or solo practice. Return a concise package index and live links only. Do not paste the full memo, checklist, source appendix, or ledger into chat unless the user asks to expand one specific artifact.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        audience: z.string().default("legal team"),
        jurisdiction: z.string().optional(),
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        ai_tools: z.array(z.string()).default([]),
        tools: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ audience, jurisdiction, state, court, practice_area, ai_tools, tools, limit }) => {
      const resolvedState = state || jurisdiction;
      const resolvedTools = ai_tools.length > 0 ? ai_tools : tools || [];
      const { caseItems, evidence } = resolveContextCases({ state: resolvedState, court, practice_area, limit });
      return {
        content: [
          {
            type: "text",
            text: formatImplementationPackage({
              caseItems,
              audience,
              state: resolvedState?.toUpperCase(),
              court,
              aiTools: resolvedTools,
              meta,
              baseUrl: publicBaseUrl,
              evidence,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "generate_visual_summary_data",
    {
      title: "Generate Visual Summary Data",
      description:
        "Use this when an assistant should render deterministic executive cards, bars, tables, dashboards, chart-ready summaries, maps, or managing-partner visual summaries for a jurisdiction, tool, practice area, or issue. Return source-backed top cases, chart-ready JSON, dashboard/map/print/source links, and a short readout. Do not rely on generated images unless the user explicitly asks for an image.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        title: z.string().default("Legal AI risk summary"),
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        ai_tool: z.string().optional(),
        issue: z.string().optional(),
        limit: z.number().int().min(1).max(250).default(100),
      },
    },
    async ({ title, state, court, practice_area, ai_tool, issue, limit }) => {
      const { caseItems, evidence } = resolveContextCases({ state, court, practice_area, ai_tool, issue, limit });
      return {
        content: [
          {
            type: "text",
            text: formatVisualSummaryData(caseItems, title, meta, evidence, publicBaseUrl, {
              state: state?.toUpperCase(),
              court,
              practiceArea: practice_area,
              aiTool: ai_tool,
            }),
          },
        ],
      };
    },
  );

  return server;
}
