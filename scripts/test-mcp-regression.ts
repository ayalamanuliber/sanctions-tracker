/** Deterministic tool/route tests. These do not score a ChatGPT/Claude host conversation. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { NextRequest } from "next/server";
import { POST, OPTIONS } from "../app/mcp/route";
import { GET as artifactGet } from "../app/api/artifact/route";
import { GET as datasetGet } from "../app/api/dataset/route";
import { appUrl, PUBLIC_BASE_URL } from "../lib/site";
import { UPSTREAM_DATABASE } from "../lib/data-provenance";
import { PUBLIC_DATASET_MANIFEST } from "../lib/public-dataset";
import { buildArtifactMarkdown, buildArtifactCsv } from "../lib/artifacts";

const results: { test: string; status: string }[] = [];
const outputs = new Map<string, string>();
const generatedUrls = new Set<string>();
let requestId = 0;
async function rpc(method: string, params: Record<string, unknown> = {}) {
  const response = await POST(new Request(appUrl("mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
  }));
  assert.equal(response.status, 200, `${method} transport HTTP status`);
  const raw = await response.text();
  const event = raw.split("\n").find((line) => line.startsWith("data: "));
  const payload = JSON.parse(event ? event.slice(6) : raw);
  assert.equal(payload.error, undefined, `${method}: ${JSON.stringify(payload.error)}`);
  return payload.result;
}
async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await rpc("tools/call", { name, arguments: args });
  assert.ok(!result.isError, `${name}: ${JSON.stringify(result)}`);
  const text = result.content.filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text).join("\n");
  assert.ok(text.trim(), `${name} returns content`);
  outputs.set(name, text);
  for (const rawUrl of text.match(/https?:\/\/[^\s<>]+/g) || []) {
    const cleaned = rawUrl.replace(/[)\],.]+$/, "");
    const url = new URL(cleaned);
    if (url.origin !== new URL(PUBLIC_BASE_URL).origin) continue;
    assert.ok(url.pathname === "/legal-ai-risk" || url.pathname.startsWith("/legal-ai-risk/"), `${name} lost base path: ${url}`);
    if (/\/(api\/artifact|artifact\/print|dashboard|map)$/.test(url.pathname)) generatedUrls.add(url.toString());
  }
  return text;
}
async function test(name: string, check: () => unknown | Promise<unknown>) {
  await check(); results.push({ test: name, status: "pass" }); console.log(`PASS ${name}`);
}
function provenance(text: string) {
  assert.ok(text.includes("Damien Charlotin"));
  assert.ok(text.includes(UPSTREAM_DATABASE.url));
  assert.ok(text.includes(UPSTREAM_DATABASE.license_url));
  assert.ok(text.includes("No endorsement"));
}

async function main() {
  await test("base-path URL helper: subpath, root and trailing slash", () => {
    assert.equal(appUrl("/api/artifact", "https://example.test/legal-ai-risk").href, "https://example.test/legal-ai-risk/api/artifact");
    assert.equal(appUrl("/map?state=NJ", "https://example.test/legal-ai-risk/").href, "https://example.test/legal-ai-risk/map?state=NJ");
    assert.equal(appUrl("/dashboard", "https://example.test").href, "https://example.test/dashboard");
  });
  await test("V4-01: initialize and 26 read-only tools", async () => {
    const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "isolated-regression", version: "1.0" } });
    assert.equal(init.serverInfo.name, "legal-ai-risk-mcp");
    const list = await rpc("tools/list"); assert.equal(list.tools.length, 26);
    assert.ok(list.tools.every((tool: { annotations: { readOnlyHint: boolean } }) => tool.annotations.readOnlyHint));
    assert.equal((await OPTIONS()).status, 204);
  });
  await test("V4-02: preferences are non-persistent", async () => {
    const text = await call("set_session_preferences", { role: "litigation_partner", jurisdictions: ["NJ", "NY"], ai_tools: ["ChatGPT", "Claude", "CoCounsel"] });
    assert.match(text, /session|persistent/i);
  });
  await test("V4-03: NJ brief, current evidence and attribution", async () => {
    const text = await call("get_jurisdiction_risk_brief", { state: "NJ" });
    assert.match(text, /Evidence note/); assert.match(text, /Source/); provenance(text);
  });
  await test("V4-04: NJ/NY comparison", async () => {
    const text = await call("compare_jurisdiction_risk", { states: ["NJ", "NY"] });
    assert.match(text, /NJ/); assert.match(text, /NY/); assert.match(text, /usage-adjusted/);
  });
  await test("V4-05: urgent filing verification gates", async () => {
    const text = await call("generate_prefiling_review_packet", { state: "NJ", court: "D. New Jersey", ai_tool: "Claude", urgency: "filing_tomorrow" });
    for (const word of [/citation/i, /quote/i, /proposition/i, /disclosure/i, /signoff|sign-off|Signing attorney/i]) assert.match(text, word);
  });
  await test("V4-06: opposing review avoids unsupported AI accusation", async () => {
    const text = await call("generate_opposing_filing_review", { state: "NJ" });
    assert.match(text, /Do not (accuse|characterize)/); assert.match(text, /preserv/i);
  });
  await test("V4-07: named-tool comparison preserves denominator caveat", async () => {
    const text = await call("compare_tool_risk_profiles", { ai_tools: ["ChatGPT", "Claude", "CoCounsel"] });
    assert.match(text, /usage-adjusted/); assert.match(text, /CoCounsel/);
  });
  await test("V4-08: scoped policy gap controls", async () => {
    const text = await call("generate_policy_gap_report", { state: "NJ", audience: "litigation team" });
    assert.match(text, /signoff|sign-off|supervis/i); provenance(text);
  });
  await test("V4-09: deterministic visual output and links", async () => {
    const text = await call("generate_visual_summary_data", { state: "NJ" });
    assert.match(text, /dashboard/); assert.match(text, /map/); assert.match(text, /Evidence note/);
  });
  await test("V4-10: exact named case, source, usable ID and detail", async () => {
    const text = await call("search_cases", { query: "Mata v Avianca", limit: 2 });
    assert.ok(text.startsWith("Mata v. Avianca")); provenance(text);
    const id = text.match(/^Case ID: (.+)$/m)?.[1]; assert.ok(id);
    const detail = await call("get_case_detail", { case_id: id }); assert.ok(detail.startsWith("Mata v. Avianca"));
  });
  await test("V4-11: concrete next-week workflow", async () => {
    const text = await call("generate_ai_filing_workflow", { state: "NJ", timeline: "next week" });
    assert.match(text, /citation/i); assert.match(text, /audit/i); provenance(text);
  });
  await test("V4-12: implementation package links", async () => {
    const text = await call("compile_implementation_package", { state: "NJ", ai_tools: ["ChatGPT", "Claude"] });
    assert.match(text, /ledger/); assert.match(text, /source/); assert.match(text, /artifact\/print/);
  });
  await test("zero exact matches disclose fallback", async () => {
    const text = await call("get_jurisdiction_risk_brief", { state: "AK", court: "NONEXISTENT-REGRESSION-COURT", practice_area: "NONEXISTENT-REGRESSION-PRACTICE" });
    assert.match(text, /exact matches: 0/i); assert.match(text, /fallback used: yes/i);
  });
  await test("remaining public tool smoke coverage", async () => {
    const examples: Record<string, Record<string, unknown>> = {
      get_summary_stats: {}, list_recent_cases: { limit: 2 }, filter_cases: { state: "NJ", limit: 2 },
      generate_prefiling_checklist: { query: "Mata" }, generate_training_examples: { query: "Mata", limit: 2 },
      list_filter_values: {}, setup_user_profile: { role: "researcher" }, get_tool_risk_profile: { ai_tool: "ChatGPT" },
      prepare_context_intake: {}, generate_control_maturity_score: { state: "NJ" },
      generate_dashboard_deep_link: { state: "NJ" }, generate_report_artifact: { state: "NJ", format: "pdf-ready" },
      generate_verification_ledger_template: {}, generate_source_appendix: { state: "NJ", limit: 2 },
    };
    for (const [name, args] of Object.entries(examples)) await call(name, args);
    assert.equal(outputs.size, 26); provenance(outputs.get("get_summary_stats")!);
    assert.match(outputs.get("get_summary_stats")!, /not independent field-by-field verification/);
  });
  await test("downloaded artifact routes retain provenance", async () => {
    const targets = [...generatedUrls].filter((url) => new URL(url).pathname.endsWith("/api/artifact"));
    assert.ok(targets.length >= 4);
    for (const url of targets) {
      const response = await artifactGet(new NextRequest(url));
      assert.equal(response.status, 200, url);
      const text = await response.text(); assert.ok(text.length > 100, url);
      assert.ok(text.includes("Damien Charlotin"), url);
      assert.ok(text.includes(UPSTREAM_DATABASE.license_url), url);
      if (/html|msword/.test(response.headers.get("content-type") || "")) {
        assert.ok(text.includes(`href="${UPSTREAM_DATABASE.license_url}"`), `Clickable license URL: ${url}`);
        assert.ok(text.includes(`href="${UPSTREAM_DATABASE.url}"`), `Clickable upstream URL: ${url}`);
      }
    }
  });
  await test("native DOCX is rejected honestly", async () => {
    const response = await artifactGet(new NextRequest(appUrl("/api/artifact?type=report&format=docx")));
    assert.equal(response.status, 415); assert.match(await response.text(), /not available|Unsupported/);
  });
  await test("dataset JSON and CSV carry upstream license metadata", async () => {
    assert.equal(PUBLIC_DATASET_MANIFEST.upstream_database.creator, "Damien Charlotin");
    const json = await datasetGet(new NextRequest(appUrl("/api/dataset?format=json&state=NJ")));
    const payload = await json.json(); assert.equal(payload.dataset.upstream_database.license, "CC BY 4.0");
    const csv = await datasetGet(new NextRequest(appUrl("/api/dataset?format=csv&state=NJ")));
    assert.ok(csv.headers.get("link")?.includes('rel="license"'));
    assert.ok(csv.headers.get("link")?.includes(`anchor="${UPSTREAM_DATABASE.url}"`));
    assert.ok(csv.headers.get("link")?.includes('rel="describedby"'));
    assert.ok((await csv.text()).startsWith("id,slug,case_name"));
  });
  await test("all artifact families include attribution", () => {
    for (const type of ["ledger", "opposing", "source", "policy", "prefiling", "visual", "report", "package"]) provenance(buildArtifactMarkdown({ type, state: "NJ" }));
    provenance(buildArtifactCsv({ state: "NJ" }));
  });
  const report = { status: "pass", tests: results, distinct_tools_called: outputs.size, generated_links_checked: generatedUrls.size, scope: "Direct local MCP transport, tool handlers and download handlers. Host-level ChatGPT/Claude behavior and browser visual checks are not covered." };
  const output = process.env.MCP_TEST_REPORT;
  if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
