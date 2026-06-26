# AI Vortex Legal AI Risk V4-before Baseline

Baseline captured before V2 Core MCP changes.

## Method

This is a pre-change engineering baseline for the current repo behavior. The full ChatGPT-hosted 12-prompt run still needs manual execution in a fresh ChatGPT chat because host-level tool selection, session memory, and image/artifact rendering cannot be fully reproduced from the repo alone.

Repo-level checks available before code changes:

- MCP tools are registered in `lib/mcp/server.ts`.
- MCP responses are mostly formatted as text in `lib/mcp/format.ts`.
- Dashboard deep links currently point to `/dashboard`.
- Artifact downloads currently point to `/api/artifact`.
- Profile/setup and control maturity score tools are not present yet.
- Fallback behavior exists only in limited places and is not consistently disclosed.
- Source appendix exists but can return empty/weak output for zero-result queries.
- Opposing filing review has guardrail language but not a full discrepancy matrix, meet-and-confer draft, or escalation matrix.

## Current Expected Baseline Weaknesses

| V4 area | Current baseline risk |
| --- | --- |
| Profile/setup | No dedicated tool; host model must improvise session profile. |
| Evidence note | Present in several formatters, but lacks exact/fallback fields. |
| Fallback | Narrow zero-result queries can fail or broaden without a reusable fallback contract. |
| Source appendix | Source coverage shown, but zero-result appendices need explicit fallback/warning behavior. |
| Artifact package | Artifact links exist in some outputs, but scenario defaults are not centralized. |
| Dashboard links | Live `/dashboard` URL exists for `state`, `court`, `audience`; `practice_area` and `ai_tool` are not standardized. |
| Opposing filing review | Has verification sequence and no-AI-accusation guardrail; lacks structured discrepancy matrix/M&C/escalation. |
| Control maturity | Not implemented. |
| Response contract | No shared `answer_type`, `audience`, `evidence_note`, `generated_links`, `suggested_next_step` contract. |

## Manual V4-before Run

Run `docs/mcp-regression-test-prompts.md` in a fresh ChatGPT chat against the current dev app before refreshing to the V2 Core build if a true host-level baseline is needed.
