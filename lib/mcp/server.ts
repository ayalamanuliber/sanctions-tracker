import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import sanctionsRaw from "@/data/sanctions.json";
import metaRaw from "@/data/meta.json";
import {
  formatCase,
  formatChecklist,
  formatJurisdictionRiskBrief,
  formatMeta,
  formatOpposingFilingReview,
  formatPolicyGapReport,
  formatPrefilingReviewPacket,
  formatToolRiskProfile,
  formatTrainingExamples,
  formatVisualSummaryData,
} from "./format";
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
    if (court && !textIncludes(item.court, court)) return false;
    if (practice_area) {
      const haystack = [item.legal_field_primary, item.legal_field_secondary, item.tags.join(" ")].join(" ");
      if (!textIncludes(haystack, practice_area)) return false;
    }
    if (ai_tool && !textIncludes(item.ai_tool_used, ai_tool) && !textIncludes(item.summary, ai_tool)) {
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
        "Use this when you need high-level tracker statistics for the public legal AI risk corpus.",
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
        "Use this when you need the most recent legal AI sanctions or governance cases.",
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
        "Use this when you need a free-text case search across names, summaries, tags, tools, and policy gaps.",
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
    "get_jurisdiction_risk_brief",
    {
      title: "Get Jurisdiction Risk Brief",
      description:
        "Use this when a user asks what legal AI risk means for a state, court, or practice area. Returns a Vortex-style brief with stats, failure modes, important cases, controls, and next questions.",
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
      const matches = matchContextCases({ state, court, practice_area, limit });
      return {
        content: [
          {
            type: "text",
            text: formatJurisdictionRiskBrief({
              caseItems: matches,
              state: state?.toUpperCase(),
              court,
              practiceArea: practice_area,
            }),
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
        "Use this when a user asks about risk patterns for ChatGPT, Claude, CoCounsel, Lexis+ AI, Westlaw, or another AI/legal AI tool.",
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
      const matches = matchContextCases({ ai_tool, state, practice_area, limit });
      return {
        content: [{ type: "text", text: formatToolRiskProfile(matches, ai_tool) }],
      };
    },
  );

  server.registerTool(
    "generate_prefiling_review_packet",
    {
      title: "Generate Pre-Filing Review Packet",
      description:
        "Use this when a lawyer or firm says they are filing a draft, motion, brief, memo, or other court-facing document and used or may have used AI.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        state: z.string().optional(),
        court: z.string().optional(),
        practice_area: z.string().optional(),
        document_type: z.string().optional(),
        ai_tool: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      },
    },
    async ({ state, court, practice_area, document_type, ai_tool, limit }) => {
      let matches = matchContextCases({ state, court, practice_area, ai_tool, limit });
      if (matches.length === 0 && ai_tool) {
        matches = matchContextCases({ state, court, practice_area, limit });
      }
      return {
        content: [
          {
            type: "text",
            text: formatPrefilingReviewPacket({
              caseItems: matches,
              state: state?.toUpperCase(),
              court,
              practiceArea: practice_area,
              documentType: document_type,
              aiTool: ai_tool,
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
        "Use this when a user is reviewing opposing counsel's filing, suspicious citations, fabricated quotes, unsupported authority, or potential Rule 11 issues.",
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
      const matches = matchContextCases({ issue, state, court, practice_area, limit });
      return {
        content: [{ type: "text", text: formatOpposingFilingReview(matches, issue) }],
      };
    },
  );

  server.registerTool(
    "generate_policy_gap_report",
    {
      title: "Generate Policy Gap Report",
      description:
        "Use this when a firm, risk partner, KM team, innovation team, or vendor asks what controls or policy gaps matter based on tracked legal AI failure patterns.",
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
      const matches = matchContextCases({ state, practice_area, ai_tool, limit });
      return {
        content: [{ type: "text", text: formatPolicyGapReport(matches, audience) }],
      };
    },
  );

  server.registerTool(
    "generate_visual_summary_data",
    {
      title: "Generate Visual Summary Data",
      description:
        "Use this when an assistant should proactively render cards, bars, tables, dashboards, or chart-ready summaries for a jurisdiction, tool, practice area, or issue.",
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
      const matches = matchContextCases({ state, court, practice_area, ai_tool, issue, limit });
      return {
        content: [{ type: "text", text: formatVisualSummaryData(matches, title) }],
      };
    },
  );

  return server;
}
