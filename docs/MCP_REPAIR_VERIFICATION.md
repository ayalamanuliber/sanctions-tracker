# Isolated MCP repair verification

Date: October 1, 2026. Base commit: `b516536603809a9e3efdafa3cb647fcd2aadcc03`.

## Scope

Changes are prepared in an isolated cloud checkout. Nothing has been pushed, deployed, installed in a host, or changed in production. No credentials, connector grants, billing, persistent data stores or code license were created.

## Repairs

1. Seven MCP URL builders now use one app-relative helper that retains `/legal-ai-risk`; dashboard, map, artifact API and print paths are covered. Root deployments and trailing slashes are tested too.
2. Case search/detail output includes the existing stable case ID, enabling `get_case_detail` without guessing identifiers.
3. A shared upstream notice identifies Damien Charlotin, the source database, CC BY 4.0, AI Vortex transformations and no implied endorsement. MCP evidence outputs, generated reports/source appendices/ledgers, JSON manifests and CSV metadata retain provenance.
4. Basic stats distinguish enrichment from independent verification and retain incidence/legal-advice/currency caveats. The existing importer assumes USD for unlabelled amounts; that currency policy has not been changed in this patch.
5. README now describes actual installation, base-path configuration, boundaries, tests and currently failing canonical routing. Data-license scope is separate from owner-selected application-code licensing.
6. Stale June 2026 numerical expectations in the host regression document now require the current validated snapshot rather than obsolete fixed counts.
7. Added a deterministic local transport/tool/download test runner with pinned development-only `tsx`. It does not contact an AI host or private user material.

## Validation

- `npm run lint`: passed
- `npx tsc --noEmit`: passed
- `npm run build`: passed
- `npm run validate:data`: passed
- `npm run validate:product`: passed
- `npm run test:product`: passed, 91 checks against a locally running production build
- `npm run test:mcp`: passed, 19 checks, all 26 distinct tools, 12 scenario families and 62 generated links checked
- Generated artifact download handlers returned supported content with attribution; native DOCX requests returned explicit 415 guidance
- Dataset JSON includes upstream license scope; CSV metadata links the license and manifest while preserving its existing data-column schema
- Source patch applies cleanly to the base commit (see packaged validation output)

The checkpoint contains raw passing test results. The source snapshot has 2,097 public records, validated October 1; data files were not modified by this repair.

## Explicit limits

The 12 scenario families above test tool handlers and guardrails deterministically. They do not test an LLM host's tool selection, conversational memory, presentation quality, or installed-connector permissions. The fresh ChatGPT/Claude conversational regression remains required after host configuration.

Cloud-browser navigation to the isolated loopback server was blocked (`ERR_BLOCKED_BY_CLIENT`). Automated HTTP/handler tests and production build checks passed; no browser visual pass is claimed. Local production logs also warned that a judicial portrait WebP could not be loaded by an image-rendering path; that pre-existing image-format warning is outside this bounded MCP patch and should be checked visually before release.

## Production routing diagnosis

Read-only audit evidence:

- `https://sanctions-tracker.vercel.app/mcp`: installed connector target; 404
- `https://sanctions-tracker.vercel.app/legal-ai-risk/mcp`: initialize, tools/list and public tool calls passed
- `https://www.aivortex.io/legal-ai-risk/mcp`: identical initialize POST failed twice with `500 FUNCTION_INVOCATION_FAILED`
- Canonical `/legal-ai-risk/mcp-health`: returned 200, but only reports corpus health and cannot prove the MCP transport works

The working origin and failing canonical request isolate the difference to the front-door routing/forwarding path. They do not establish which exact proxy setting is faulty. Accessible deployment metadata identifies a separate `aivortex-landing-page` project; its repository fetch returned 404, log queries timed out, and a filtered aggregate error query returned no matching entries. None establishes a code-level root cause. No proxy or production setting was changed.

## Remaining steps, subject to approval

1. Review this patch and the unchanged boundaries. Decide separately whether to grant an application-code license; none is assumed here.
2. Obtain authorized access to the canonical front-door routing source/configuration and inspect forwarding for `/legal-ai-risk/mcp`: exact upstream path, POST body, Accept/Content-Type/MCP headers, streaming response and errors. Do not disable security controls to make it pass.
3. Repair and test that path in an isolated preview, then obtain approval before publishing either project.
4. Point the user's existing MCP configuration to the verified full endpoint, with host permission prompts handled explicitly. No new credential should be necessary for these public read-only tools.
5. Re-run initialize, tools/list, named-case lookup, zero-match fallback and generated downloads through the final public URL. Then run the fresh-host 12-prompt suite.
6. Keep confidential document review, persistent workspaces, paid entitlement and production monitoring as separately scoped work.

## Source attribution

Underlying database: AI Hallucination Cases Database, Damien Charlotin, https://www.damiencharlotin.com/hallucinations/. License: https://creativecommons.org/licenses/by/4.0/.

AI Vortex's additions are normalization, classification, enrichment, search, analysis, review workflows and presentation. No endorsement or partnership is implied. Linked third-party documents and application software retain their separate rights.
