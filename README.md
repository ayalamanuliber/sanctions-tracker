# AI Vortex Legal AI Risk

A public legal-AI research corpus and read-only Model Context Protocol (MCP) server. AI Vortex adds normalization, classification, enrichment, search, analysis, evidence links and practical review workflows to public records. Outputs are informational, not legal advice, an AI detector, or a usage-adjusted vendor-risk ranking.

## Local development

Use Node.js 20.9 or newer and npm. The lockfile is authoritative.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3017
```

Open `http://127.0.0.1:3017/legal-ai-risk`. The default deployment base path is `/legal-ai-risk`.

Optional build-time settings:

- `NEXT_PUBLIC_SITE_ORIGIN`: canonical origin, default `https://www.aivortex.io`
- `NEXT_PUBLIC_SITE_BASE_PATH`: base path, default `/legal-ai-risk`; empty string for a root deployment
- `NEXT_PUBLIC_LEGACY_SITE_ORIGIN`: legacy website origin, not the MCP endpoint

Set origin/base-path consistently for builds and deployments. `NEXT_PUBLIC_SITE_BASE_PATH` is baked into Next.js builds; changing it requires a rebuild. No API key is required for the public MCP tools. Never put secrets or confidential matter material in a public setting or tool request.

## Connect an MCP host

Transport: Streamable HTTP. The public tools do not require authentication.

- Canonical intended endpoint: `https://www.aivortex.io/legal-ai-risk/mcp`
- Origin endpoint verified in the October 1, 2026 audit: `https://sanctions-tracker.vercel.app/legal-ai-risk/mcp`
- The old `https://sanctions-tracker.vercel.app/mcp` omits the base path and is not equivalent

Important: the canonical endpoint failed initialize requests during that audit while the origin passed. These source changes do not repair or publish the separate front-door deployment. Recheck initialize, tools/list and a tool call before configuring a host; do not interpret `/mcp-health` as an end-to-end transport test. See [repair verification](docs/MCP_REPAIR_VERIFICATION.md).

Add the verified URL as a custom remote MCP server in the host's settings. Confirm any permissions in that host. This repository does not configure a user's installed connector or grant access to private files.

The 26-tool surface supports public case search/detail/filtering, jurisdiction and named-tool comparisons, pre-filing and opposing-filing review workflows, policy/control guidance, source appendices, ledgers, dashboards and report links. Session preferences are non-persistent. Hosts remain responsible for retaining conversation context. Native DOCX/XLSX export and persistent matters are not implemented; supported formats must be checked against the relevant artifact endpoint.

## Provenance and rights

Underlying database: [AI Hallucination Cases Database, Damien Charlotin](https://www.damiencharlotin.com/hallucinations/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Retain attribution and license links, indicate AI Vortex's modifications, and do not imply endorsement or partnership. See [data attribution](DATA_ATTRIBUTION.md).

The database's license does not automatically license linked court/publisher documents or the AI Vortex application code. No code license is granted by this README; owner selection remains pending. Public repository visibility is not an open-source license.

The public corpus remains openly accessible. AI Vortex's added value is its intelligence, actionable workflows, convenience and presentation. A source link and automated enrichment do not establish independent field-by-field verification.

## Verification

```sh
npm run lint
npx tsc --noEmit
npm run build
npm run validate:data
npm run validate:product
npm run test:mcp
```

`test:mcp` invokes the actual MCP transport and tool/download handlers locally using public fixtures. It covers the 12 scenario families, all 26 tools, attribution, generated URLs, zero-match fallback and unsupported export behavior. It does not replace the [fresh-host conversation suite](docs/mcp-regression-test-prompts.md).

For website behavior, run a built server, then:

```sh
npm run start -- --hostname 127.0.0.1 --port 3017
PRODUCT_BASE_URL=http://127.0.0.1:3017/legal-ai-risk npm run test:product
```

No test should submit private matter content, send communications, update an installed connector, or publish a deployment.
