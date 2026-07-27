import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.env.PRODUCT_BASE_URL || "http://localhost:3017/legal-ai-risk";
const corpus = JSON.parse(fs.readFileSync(new URL("../data/sanctions.json", import.meta.url), "utf8"));
const readiness = JSON.parse(fs.readFileSync(new URL("../data/publication-readiness-index.json", import.meta.url), "utf8"));
const intelligence = JSON.parse(fs.readFileSync(new URL("../data/case-intelligence.json", import.meta.url), "utf8"));
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

for (const route of ["/privacy", "/terms", "/resources", "/topics", "/courts?q=D.N.J.", "/dashboard?state=NJ&audience=researcher"]) {
  await page(route);
}

const noMatch = await page("/cases?q=definitely-not-a-real-vortex-case&state=NJ&tool=CoCounsel");
assert.ok(noMatch.includes("Transparent fallback"), "Zero-result search must disclose fallback behavior");
assert.ok(noMatch.includes("did not silently substitute"), "Fallback must be explicit rather than silent");

const curatedCase = await page(`/cases/${mata.id}`);
assert.ok(curatedCase.includes("What happened in this matter?"), "Curated case page must include a direct answer block");
assert.ok(curatedCase.includes("What the record establishes about AI use"), "Curated case page must state the attribution boundary");

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

console.log(JSON.stringify({ status: "pass", base, checks: 20, dnj: resultCount(dnjCourt), sdny: resultCount(sdny), edny: resultCount(edny), packetCases: 1, indexEligibleCasePages: caseUrls.length }, null, 2));
