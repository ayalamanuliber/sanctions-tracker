import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.env.PRODUCT_BASE_URL || "http://localhost:3017/legal-ai-risk";
const corpus = JSON.parse(fs.readFileSync(new URL("../data/sanctions.json", import.meta.url), "utf8"));
const readiness = JSON.parse(fs.readFileSync(new URL("../data/publication-readiness-index.json", import.meta.url), "utf8"));
const intelligence = JSON.parse(fs.readFileSync(new URL("../data/case-intelligence.json", import.meta.url), "utf8"));
const judgeEnrichment = JSON.parse(fs.readFileSync(new URL("../data/judge-enrichment.json", import.meta.url), "utf8"));
const intelligenceBySlug = new Map(intelligence.map((record) => [record.slug, record]));

async function page(path) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response.text();
}

function resultCount(html) {
  const match = html.match(/<h2>([\d,]+)(?:<!-- -->)? matching matters/);
  assert.ok(match, "Expected a rendered matching-matters count");
  return Number(match[1].replaceAll(",", ""));
}

function resultRegion(html) {
  const match = html.match(/<section[^>]+aria-label="Case results"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(match, "Expected a rendered case-results region");
  return match[1];
}

const dnjCourt = await page("/cases?court=D.N.J.");
const dnjSearch = await page("/cases?q=D.N.J.");
const dnjCount = resultCount(dnjCourt);
assert.ok(dnjCount > 0 && dnjCount < corpus.length, "D.N.J. court alias must return a bounded non-empty subset");
assert.equal(resultCount(dnjSearch), dnjCount, "D.N.J. free-text search must match the structured court alias");

const sdny = await page("/cases?court=S.D.N.Y.");
const edny = await page("/cases?court=E.D.N.Y.");
assert.ok(resultCount(sdny) > 0, "S.D.N.Y. must return records");
assert.ok(resultCount(edny) > 0, "E.D.N.Y. must return records");
assert.ok(!resultRegion(sdny).includes("E.D. New York"), "S.D.N.Y. must not broaden into E.D.N.Y.");
assert.ok(!resultRegion(edny).includes("S.D. New York"), "E.D.N.Y. must not broaden into S.D.N.Y.");

const mata = corpus.find((item) => item.case_name === "Mata v. Avianca, Inc");
assert.ok(mata, "Mata regression fixture is missing from the corpus");
const packet = await page(`/artifact/print?type=report&case_id=${encodeURIComponent(mata.id)}&title=Mata`);
assert.ok(packet.includes("Matched set</span><strong>1 cases"), "Case packet must contain exactly one matched matter");
assert.ok(packet.includes("Mata v. Avianca"), "Case packet must contain the selected matter");

const withersSlug = "withers-v-city-of-aberdeen-2026-06-08";
const home = await page("/");
const workflows = await page("/workflows");
assert.ok(
  home.includes(`${withersSlug}/brief?tier=free`),
  "Homepage featured packet must use the current canonical Withers brief",
);
assert.ok(
  workflows.includes(`${withersSlug}/brief?tier=free`),
  "Workflow example must use the current canonical Withers brief",
);
assert.ok(
  !home.includes(`artifact/print?type=report&amp;case_id=${withersSlug}`),
  "Homepage must not regress to the legacy Withers artifact route",
);

for (const route of [
  "/privacy",
  "/terms",
  "/resources",
  "/topics",
  "/courts?q=D.N.J.",
  "/judges",
  "/judges/vernon-d-oliver",
  "/countries",
  "/states",
  "/tools/chatgpt",
  "/failure-modes/fake-citations",
  "/consequences",
  "/about",
]) {
  await page(route);
}

const judgePage = await page("/judges/vernon-d-oliver");
assert.ok(judgePage.includes("Public records in this view"), "Judge pages must expose their linked public matters");
assert.ok(judgePage.includes("Corpus denominator"), "Judge pages must state their corpus denominator");
assert.ok(
  judgePage.includes("record Vernon D. Oliver as a decision-maker"),
  "Judge intelligence must describe recorded matters rather than infer general behavior",
);
assert.ok(judgePage.includes("FAQPage"), "Judge intelligence pages must expose answer schema");
const vernonIds = new Set(
  Object.entries(judgeEnrichment.records)
    .filter(([, record]) => record.judge === "Vernon D. Oliver")
    .map(([id]) => id),
);
const vernonRecords = corpus.filter(
  (item) => item.judge === "Vernon D. Oliver" || vernonIds.has(item.id),
);
const vernonIssues = vernonRecords.filter((item) =>
  item.tags.includes("misrepresented-authority"),
);
const vernonIssueResults = await page(
  "/cases?judge=Vernon%20D.%20Oliver&failure=misrepresented-authority",
);
assert.equal(
  resultCount(vernonIssueResults),
  vernonIssues.length,
  "Judge issue drill-down must match the exact structured subset",
);

const sdnyEntity = await page("/courts/s-d-new-york");
assert.ok(
  sdnyEntity.includes("What kinds of legal AI issues and responses appear in S.D. New York?"),
  "Court pages must provide an evidence-based direct answer",
);
assert.ok(sdnyEntity.includes("court_match=exact"), "Court intelligence links must preserve exact entity scope");
assert.ok(sdnyEntity.includes("FAQPage"), "Court intelligence pages must expose answer schema");
const exactSdny = corpus.filter((item) => item.court === "S.D. New York");
const exactSdnyCitationIssues = exactSdny.filter((item) =>
  item.tags.includes("fake-citations"),
);
const exactSdnyIssueResults = await page(
  "/cases?court=S.D.%20New%20York&court_match=exact&failure=fake-citations",
);
assert.equal(
  resultCount(exactSdnyIssueResults),
  exactSdnyCitationIssues.length,
  "Court issue drill-down must match the exact structured subset",
);
const exactSdnyKnownAmounts = exactSdny.filter(
  (item) => Number(item.amount || 0) > 0,
);
const exactSdnyMoneyResults = await page(
  "/cases?court=S.D.%20New%20York&court_match=exact&monetary=known&sort=amount&order=desc",
);
assert.equal(
  resultCount(exactSdnyMoneyResults),
  exactSdnyKnownAmounts.length,
  "Court monetary drill-down must contain only records with known numeric amounts",
);
const judgesDirectory = await page("/judges");
assert.ok(judgesDirectory.includes("Browse the evidence network"), "Entity directories must expose cross-corpus navigation");
assert.ok(judgesDirectory.includes("/legal-ai-risk/courts"), "Judge directory must link directly to court profiles");
assert.ok(judgesDirectory.includes("/legal-ai-risk/tools"), "Judge directory must link directly to recorded AI tools");

const toolPage = await page("/tools/chatgpt");
assert.ok(toolPage.includes("Public records in this view"), "Tool pages must expose their linked public matters");
assert.ok(toolPage.includes("BreadcrumbList"), "Entity pages must include breadcrumb schema");

const correction = await page(
  `/submit?case_id=${encodeURIComponent(mata.id)}&case_name=${encodeURIComponent(mata.case_name)}&court=${encodeURIComponent(mata.court || "")}`,
);
assert.ok(correction.includes(mata.case_name), "Correction intake must retain case context");

const llms = await page("/llms.txt");
assert.ok(llms.includes("# AI Vortex Legal AI Risk"), "llms.txt must identify the public corpus");
assert.ok(llms.includes("Machine-readable access"), "llms.txt must expose machine-readable routes");

const noMatch = await page("/cases?q=definitely-not-a-real-vortex-case&state=NJ&tool=CoCounsel");
assert.ok(noMatch.includes("Transparent fallback"), "Zero-result search must disclose fallback behavior");
assert.ok(noMatch.includes("did not silently substitute"), "Fallback must be explicit rather than silent");

const curatedCase = await page(`/cases/${mata.id}`);
assert.ok(curatedCase.includes("What happened in this matter?"), "Curated case page must include a direct answer block");
assert.ok(curatedCase.includes("What the record establishes about AI use"), "Curated case page must state the attribution boundary");
assert.ok(curatedCase.includes("/legal-ai-risk/judges"), "Global case navigation must expose the judge directory");

const judgeLinkedCase = await page(
  "/cases/braica-v-frankowski-anthony-braica-v-tom-frankowski-2025-12-15",
);
assert.ok(
  judgeLinkedCase.includes("/legal-ai-risk/judges/vernon-d-oliver"),
  "A case with a recorded judge must link to the judge profile",
);
assert.ok(
  judgeLinkedCase.includes("/legal-ai-risk/courts/d-connecticut"),
  "A case must link its recorded court to the court profile",
);
assert.ok(
  judgeLinkedCase.includes("/legal-ai-risk/states/ct"),
  "A case must link its jurisdiction context to the state profile",
);
assert.ok(
  judgeLinkedCase.includes("/legal-ai-risk/failure-modes/fake-citations"),
  "A classified case tag must link to its failure-mode profile",
);

const sitemap = await page("/sitemap.xml");
const caseUrls = sitemap.match(/\/cases\//g) || [];
const expectedIndexable = Object.entries(readiness.by_slug).filter(
  ([slug, publication]) => {
    const record = intelligenceBySlug.get(slug);
    const evidenceHold = [
      "primary-document-limited",
      "secondary-source-only",
      "metadata-only",
      "source-unavailable",
    ]
      .includes(record?.evidence_review?.status || "");
    return publication.tier === "index-ready" &&
      record?.publication?.ready !== false &&
      !evidenceHold;
  },
).length;
assert.equal(caseUrls.length, expectedIndexable, "Sitemap must contain every case that passes both publication and evidence baselines");

console.log(JSON.stringify({ status: "pass", base, checks: 49, dnj: resultCount(dnjCourt), sdny: resultCount(sdny), edny: resultCount(edny), packetCases: 1, indexEligibleCasePages: caseUrls.length }, null, 2));
