import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.env.PRODUCT_BASE_URL || "http://localhost:3017/legal-ai-risk";
const corpus = JSON.parse(fs.readFileSync(new URL("../data/sanctions.json", import.meta.url), "utf8"));
const readiness = JSON.parse(fs.readFileSync(new URL("../data/publication-readiness-index.json", import.meta.url), "utf8"));
const judgeEnrichment = JSON.parse(fs.readFileSync(new URL("../data/judge-enrichment.json", import.meta.url), "utf8"));
const rootLayoutSource = fs.readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const instrumentationSource = fs.readFileSync(new URL("../components/SiteInstrumentation.tsx", import.meta.url), "utf8");
const nextConfigSource = fs.readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

assert.ok(
  rootLayoutSource.includes("<SiteInstrumentation />"),
  "Every public route must include the shared analytics instrumentation",
);
for (const requiredSignal of [
  "tracker_session_start",
  "search_submit",
  "filter_apply",
  "case_open",
  "judge_open",
  "court_open",
  "source_open",
  "report_open",
  "report_print",
  "report_share",
  "upgrade_click",
]) {
  assert.ok(
    instrumentationSource.includes(`"${requiredSignal}"`),
    `Shared instrumentation must expose ${requiredSignal}`,
  );
}
assert.ok(
  instrumentationSource.includes("@vercel/analytics") &&
    instrumentationSource.includes("@vercel/speed-insights") &&
    instrumentationSource.includes("www.googletagmanager.com/gtag/js"),
  "The tracker must load GA4, Vercel Web Analytics, and Speed Insights",
);
for (const stableProxyPath of [
  "/_vercel/insights/script.js",
  "/_vercel/insights/view",
  "/_vercel/insights/event",
  "/_vercel/insights/session",
  "/_vercel/speed-insights/script.js",
  "/_vercel/speed-insights/vitals",
]) {
  assert.ok(
    instrumentationSource.includes(stableProxyPath),
    `Observability must use the stable public-host path ${stableProxyPath}`,
  );
}
assert.ok(
  nextConfigSource.includes("https://www.googletagmanager.com") &&
    nextConfigSource.includes("https://*.google-analytics.com"),
  "The CSP must permit the configured analytics transports",
);

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
assert.ok(judgesDirectory.includes("D. Connecticut"), "Judge directory must expose primary recorded court context");
assert.ok(judgesDirectory.includes("Federal"), "Judge directory must expose recorded jurisdiction context");
assert.ok(judgesDirectory.includes("2nd Circuit"), "Judge directory must expose recorded circuit context");
assert.ok(judgesDirectory.includes('"@type":"Person"'), "Judge directory must describe decision-makers as Person entities");

const toolPage = await page("/tools/chatgpt");
assert.ok(toolPage.includes("Public records in this view"), "Tool pages must expose their linked public matters");
assert.ok(toolPage.includes("BreadcrumbList"), "Entity pages must include breadcrumb schema");
assert.ok(
  toolPage.includes("OpenAI") &&
    toolPage.includes("General-purpose AI assistant") &&
    toolPage.includes("Official product site"),
  "Tool profiles must identify the recorded product provider, category, and official reference",
);
assert.ok(
  toolPage.includes('"@type":"SoftwareApplication"') &&
    toolPage.includes('"provider":{"@type":"Organization","name":"OpenAI"}'),
  "Tool profiles must expose SoftwareApplication and provider schema",
);
assert.ok(
  toolPage.includes('data-tool-brand="logo"') &&
    toolPage.includes("openai-blossom-black.svg") &&
    toolPage.includes("OpenAI and ChatGPT marks are the property of OpenAI") &&
    toolPage.includes("Product names and marks identify recorded tools only"),
  "ChatGPT profiles must render the official OpenAI mark with a vendor-affiliation boundary",
);
const toolsDirectory = await page("/tools");
assert.ok(
  toolsDirectory.includes("Anthropic") &&
    toolsDirectory.includes("Thomson Reuters") &&
    toolsDirectory.includes("AI answer engine"),
  "The tool directory must expose provider and category context before the click",
);
assert.ok(
  toolsDirectory.includes('data-tool-brand="logo"') &&
    toolsDirectory.includes('data-tool-brand="monogram"'),
  "The tool directory must support verified logos and restrained monogram fallbacks",
);
const claudePage = await page("/tools/claude");
assert.ok(
  claudePage.includes('data-tool-brand="logo"') &&
    claudePage.includes("Anthropic"),
  "A tool with an available reusable mark must render its logo and provider",
);
const toolReport = await page("/tools/chatgpt/report");
assert.ok(
  toolReport.includes("OpenAI · General-purpose AI assistant") &&
    toolReport.includes('data-tool-brand="logo"') &&
    toolReport.includes("openai-blossom-black.svg"),
  "Printable tool reports must retain product identity and provider context",
);

const countriesDirectory = await page("/countries");
assert.ok(
  countriesDirectory.includes("🇺🇸") &&
    countriesDirectory.includes("United States") &&
    countriesDirectory.includes("🇬🇧") &&
    countriesDirectory.includes("United Kingdom"),
  "The country directory must expose recognizable flags and full country names",
);
assert.ok(
  countriesDirectory.includes('"@type":"Country"'),
  "The country directory must expose Country entities in its ItemList schema",
);
const unitedStatesProfile = await page("/countries/us");
assert.ok(
  unitedStatesProfile.includes("🇺🇸") &&
    unitedStatesProfile.includes("country=US") &&
    unitedStatesProfile.includes('"@type":"Country"'),
  "Country profiles must keep their flag, raw filter value, and Country schema synchronized",
);

const statesDirectory = await page("/states");
assert.ok(
  statesDirectory.includes("California") &&
    statesDirectory.includes("New York") &&
    statesDirectory.includes('data-entity-state-outline="CA"') &&
    statesDirectory.includes("Puerto Rico") &&
    statesDirectory.includes('data-entity-mark="state-code"') &&
    statesDirectory.includes('"@type":"AdministrativeArea"'),
  "State directories must expose full jurisdiction names, outlines or explicit territory fallbacks, and AdministrativeArea schema",
);
const newYorkProfile = await page("/states/ny");
assert.ok(
  newYorkProfile.includes("New York") &&
    newYorkProfile.includes('data-entity-state-outline="NY"') &&
    newYorkProfile.includes('"alternateName":"NY"') &&
    newYorkProfile.includes('"@type":"AdministrativeArea"'),
  "State profiles must keep their name, outline, code, and jurisdiction schema synchronized",
);

const failureDirectory = await page("/failure-modes");
assert.ok(
  failureDirectory.includes('data-entity-mark="failure"') &&
    failureDirectory.includes("Authorities or citations recorded as nonexistent") &&
    failureDirectory.includes('"@type":"DefinedTerm"'),
  "Failure-mode directories must expose recognizable symbols, definitions, and DefinedTerm schema",
);
const fakeCitationsProfile = await page("/failure-modes/fake-citations");
assert.ok(
  fakeCitationsProfile.includes('data-entity-mark="failure"') &&
    fakeCitationsProfile.includes("<strong>Taxonomy definition:</strong>") &&
    fakeCitationsProfile.includes('"termCode":"fake-citations"'),
  "Failure-mode profiles must retain their evidence-bound definition and term schema",
);

const consequencesDirectory = await page("/consequences");
assert.ok(
  consequencesDirectory.includes('data-entity-mark="consequence"') &&
    consequencesDirectory.includes("A fine, fee award, cost assessment") &&
    consequencesDirectory.includes('"@type":"DefinedTerm"'),
  "Consequence directories must expose recognizable symbols, definitions, and DefinedTerm schema",
);
const monetaryProfile = await page("/consequences/monetary");
assert.ok(
  monetaryProfile.includes('data-entity-mark="consequence"') &&
    monetaryProfile.includes("<strong>Taxonomy definition:</strong>") &&
    monetaryProfile.includes('"termCode":"monetary"'),
  "Consequence profiles must retain their evidence-bound definition and term schema",
);

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

const canadaCount = corpus.filter((record) => record.country === "Canada").length;
const canadaCases = await page("/cases?country=Canada");
assert.equal(
  resultCount(canadaCases),
  canadaCount,
  "Canada country filtering must return its exact corpus subset",
);
assert.ok(
  canadaCases.includes("🇨🇦 Canada") && canadaCases.includes("Judge / decision-maker"),
  "Case search must expose recognizable country flags and a recorded-judge filter",
);

const globalMap = await page("/map");
assert.ok(
  globalMap.includes("Global evidence map") &&
    globalMap.includes("smv2-country") &&
    globalMap.includes("🇨🇦 Canada"),
  "The map must expose a global country layer with recognizable country context",
);
assert.ok(
  globalMap.includes("Judge / decision-maker") &&
    globalMap.includes("Type a court"),
  "The map must expose discoverable judge and court filters",
);
assert.ok(
  globalMap.includes("Global map zoom controls") &&
    globalMap.includes("Zoom in global map") &&
    globalMap.includes("Zoom out global map") &&
    globalMap.includes("Reset global map view") &&
    globalMap.includes("Zoom, drag, then select a country"),
  "The global map must expose accessible zoom, pan guidance, and reset controls",
);
assert.ok(
  globalMap.includes('content="index, follow"'),
  "The canonical global map must remain indexable",
);

const canadaMap = await page("/map?country=Canada");
assert.ok(
  canadaMap.includes("🇨🇦 Canada evidence") &&
    canadaMap.includes(`${canadaCount}<!-- --> matched records`) &&
    canadaMap.includes("country=Canada"),
  "A selected country map must preserve its exact result scope in navigation links",
);
assert.ok(
  canadaMap.includes('content="noindex, follow"') &&
    canadaMap.includes('href="https://www.aivortex.io/legal-ai-risk/map"'),
  "Shareable map filters must canonicalize to the indexable map without creating duplicate search pages",
);
const unitedStatesMap = await page("/map?country=US");
assert.ok(
  unitedStatesMap.includes("Global map") &&
    unitedStatesMap.includes("United States selected") &&
    !unitedStatesMap.includes("Return to global view"),
  "Selected-country map navigation must use the compact header control",
);

const judgeMap = await page("/map?country=US&judge=Vernon%20D.%20Oliver");
assert.ok(
  judgeMap.includes('value="Vernon D. Oliver"') &&
    judgeMap.includes("4<!-- --> matched records") &&
    judgeMap.includes("judge=Vernon"),
  "Judge-filtered map views must remain synchronized and shareable",
);

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

const judgeProfile = await page("/judges/vernon-d-oliver");
assert.ok(
  judgeProfile.includes("/legal-ai-risk/judges/vernon-d-oliver/report"),
  "An entity profile must expose its source-linked evidence report",
);
assert.ok(
  judgeProfile.includes("Primary recorded court") &&
    judgeProfile.includes("/legal-ai-risk/courts/d-connecticut"),
  "A judge profile must expose navigable court context",
);
assert.ok(
  judgeProfile.includes("Geographic context") &&
    judgeProfile.includes("/legal-ai-risk/states/ct"),
  "A judge profile must expose navigable geographic context",
);
assert.ok(
  judgeProfile.includes('"@type":"Person"') &&
    judgeProfile.includes('"jobTitle":"United States District Judge"'),
  "A judge profile must expose evidence-bound Person schema",
);
assert.ok(
  judgeProfile.includes("/assets/entities/judges/vernon-d-oliver.webp") &&
    judgeProfile.includes("Wikimedia Commons") &&
    judgeProfile.includes('"creditText"'),
  "A verified judge portrait must render with visible and structured attribution",
);

const judgeReport = await page("/judges/vernon-d-oliver/report");
assert.ok(
  judgeReport.includes("JUDICIAL EVIDENCE REPORT"),
  "A judge report must identify its report type",
);
assert.ok(
  judgeReport.includes("View live intelligence profile"),
  "An entity report must link back to the canonical profile",
);
assert.ok(
  judgeReport.includes('"@type":"Report"'),
  "An entity report must expose Report JSON-LD",
);
assert.ok(
  judgeReport.includes("/assets/entities/judges/vernon-d-oliver.webp") &&
    judgeReport.includes("Image:"),
  "A judge report must retain its verified portrait and printable image credit",
);
const courtProfile = await page("/courts/s-d-new-york");
assert.ok(
  courtProfile.includes("/assets/entities/courts/s-d-new-york.webp") &&
    courtProfile.includes("Daniel Patrick Moynihan"),
  "A court profile must show its verified representative courthouse image",
);
const fallbackCourtProfile = await page("/courts/e-d-california");
assert.ok(
  fallbackCourtProfile.includes('data-court-scope-visual="structured-fallback"') &&
    fallbackCourtProfile.includes("Not a courthouse photograph"),
  "A court without licensed media must render a transparent structured court-scope visual",
);
const fallbackJudgeReport = await page("/judges/micah-w-j-smith/report");
assert.ok(
  fallbackJudgeReport.includes('data-real-image="false"') &&
    !fallbackJudgeReport.includes("/assets/entities/judges/micah-w-j-smith.webp"),
  "A judge without verified media must retain the initials fallback without a fabricated asset",
);
const judgeOg = await fetch(
  `${base}/og/entity/judge/vernon-d-oliver?rev=2026-07-28`,
);
assert.equal(judgeOg.status, 200, "Judge OG image must render");
assert.match(
  judgeOg.headers.get("cache-control") || "",
  /s-maxage=31536000/,
  "Entity OG images must be cached aggressively at the CDN",
);
assert.match(
  judgeOg.headers.get("content-type") || "",
  /^image\//,
  "Entity OG route must return an image",
);
const limitedEvidenceCase = await page(
  "/cases/moosehead-breweries-limited-v-14095863-canada-inc-2026-06-29",
);
assert.ok(
  limitedEvidenceCase.includes('content="index, follow"') &&
    limitedEvidenceCase.includes(
      "publicly indexable with evidence status disclosed",
    ) &&
    !limitedEvidenceCase.includes("excluded from search indexing"),
  "Evidence-limited public case pages must remain indexable with limitations disclosed",
);
const limitedEvidenceBrief = await page(
  "/cases/moosehead-breweries-limited-v-14095863-canada-inc-2026-06-29/brief",
);
assert.ok(
  limitedEvidenceBrief.includes('content="index, follow"') &&
    limitedEvidenceBrief.includes(
      "https://www.aivortex.io/legal-ai-risk/cases/moosehead-breweries-limited-v-14095863-canada-inc-2026-06-29/brief",
    ),
  "Canonical case evidence briefs must be indexable",
);

const sitemap = await page("/sitemap.xml");
const caseProfileUrls = [
  ...sitemap.matchAll(
    /<loc>https:\/\/www\.aivortex\.io\/legal-ai-risk\/cases\/([^/<]+)<\/loc>/g,
  ),
];
const caseBriefUrls = [
  ...sitemap.matchAll(
    /<loc>https:\/\/www\.aivortex\.io\/legal-ai-risk\/cases\/([^/<]+)\/brief<\/loc>/g,
  ),
];
const expectedIndexable = Object.keys(readiness.by_slug).length;
assert.equal(
  caseProfileUrls.length,
  expectedIndexable,
  "Sitemap must contain every public case profile regardless of evidence depth",
);
assert.equal(
  caseBriefUrls.length,
  expectedIndexable,
  "Sitemap must contain every canonical case evidence brief",
);
assert.ok(
  sitemap.includes("/judges/vernon-d-oliver/report"),
  "Sitemap must include index-eligible entity reports",
);
assert.ok(
  sitemap.includes("/og/entity/judge/vernon-d-oliver?variant=report"),
  "Sitemap must associate entity reports with their OG image",
);
assert.ok(
  sitemap.includes("/assets/entities/judges/vernon-d-oliver.webp") &&
    sitemap.includes("rev=2026-07-28"),
  "Sitemap must expose verified entity media and versioned OG images",
);
assert.ok(
  !sitemap.includes("?variant=report&rev="),
  "Sitemap image URLs must not contain unescaped query separators",
);

console.log(JSON.stringify({ status: "pass", base, checks: 91, dnj: resultCount(dnjCourt), sdny: resultCount(sdny), edny: resultCount(edny), packetCases: 1, indexEligibleCasePages: caseProfileUrls.length, indexEligibleCaseBriefs: caseBriefUrls.length }, null, 2));
