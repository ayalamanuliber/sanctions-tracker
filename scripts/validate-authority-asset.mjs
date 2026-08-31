import assert from "node:assert/strict";

const baseUrl = (
  process.env.PUBLIC_ROUTE_BASE_URL ||
  "http://127.0.0.1:3017/legal-ai-risk"
).replace(/\/$/, "");

function canonical(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "";
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

const pageResponse = await fetch(`${baseUrl}/dataset`);
assert.equal(pageResponse.status, 200, "dataset page should return 200");
const page = await pageResponse.text();
assert.equal(
  canonical(page),
  "https://www.aivortex.io/legal-ai-risk/dataset",
  "dataset page should use the public canonical URL",
);
assert.match(page, /How to cite the dataset/, "citation guidance should be visible");
assert.match(page, /Freshness and changelog/, "freshness section should be visible");
assert.match(page, /Evidence boundary/, "evidence boundary should be visible");
const datasetSchema = jsonLd(page).find((item) => item["@type"] === "Dataset");
assert.ok(datasetSchema, "dataset page should expose Dataset JSON-LD");
assert.equal(datasetSchema.url, "https://www.aivortex.io/legal-ai-risk/dataset");
assert.ok(datasetSchema.version, "Dataset JSON-LD should expose a version");
assert.equal(datasetSchema.distribution.length, 3, "Dataset JSON-LD should list all public distributions");

const manifestResponse = await fetch(`${baseUrl}/api/dataset/manifest`);
assert.equal(manifestResponse.status, 200, "dataset manifest should return 200");
const manifest = await manifestResponse.json();
assert.equal(manifest.canonical_url, "https://www.aivortex.io/legal-ai-risk/dataset");
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(manifest.version), "manifest version should be a corpus date");
assert.equal(manifest.fields.length, 18, "manifest should publish the 18 exported fields");
assert.equal(manifest.sha256.length, 64, "manifest should expose a SHA-256 source snapshot identifier");
assert.ok(manifest.record_count > 0, "manifest should expose a nonzero public record count");

const jsonResponse = await fetch(`${baseUrl}/api/dataset?format=json&country=US`);
assert.equal(jsonResponse.status, 200, "filtered JSON export should return 200");
assert.equal(jsonResponse.headers.get("x-dataset-version"), manifest.version);
const json = await jsonResponse.json();
assert.equal(json.dataset.version, manifest.version, "JSON metadata should match the manifest");
assert.equal(json.record_count, json.records.length, "JSON record_count should match its rows");
assert.ok(json.records.every((item) => item.country === "US"), "country filter should be reproducible");

const csvResponse = await fetch(`${baseUrl}/api/dataset?format=csv&country=US`);
assert.equal(csvResponse.status, 200, "filtered CSV export should return 200");
assert.equal(csvResponse.headers.get("x-dataset-version"), manifest.version);
const csv = await csvResponse.text();
assert.equal(csv.split("\n", 1)[0], manifest.fields.join(","), "CSV field order should match the manifest");

const rssResponse = await fetch(`${baseUrl}/feed`);
assert.equal(rssResponse.status, 200, "RSS feed should return 200");
assert.match(rssResponse.headers.get("content-type") || "", /application\/rss\+xml/);

const robotsResponse = await fetch(`${baseUrl}/robots.txt`, {
  headers: { "user-agent": "OAI-SearchBot/1.0" },
});
assert.equal(robotsResponse.status, 200, "robots should return 200");
const robots = await robotsResponse.text();
assert.match(robots, /Allow: \/legal-ai-risk\/api\/dataset/);

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200, "sitemap should return 200");
const sitemap = await sitemapResponse.text();
const datasetMatches = sitemap.match(/<loc>https:\/\/www\.aivortex\.io\/legal-ai-risk\/dataset<\/loc>/g) || [];
assert.equal(datasetMatches.length, 1, "dataset canonical should appear once in the sitemap");

console.log(JSON.stringify({
  status: "pass",
  base_url: baseUrl,
  dataset_version: manifest.version,
  record_count: manifest.record_count,
  exported_fields: manifest.fields.length,
}, null, 2));
