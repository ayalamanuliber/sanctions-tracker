import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = (process.env.PUBLIC_ROUTE_BASE_URL || "http://localhost:3017/legal-ai-risk").replace(/\/$/, "");
const concurrency = Math.max(1, Number(process.env.PUBLIC_ROUTE_CONCURRENCY || 12));
const readiness = JSON.parse(
  fs.readFileSync(path.join(root, "data", "publication-readiness-index.json"), "utf8"),
);
const entries = Object.entries(readiness.by_slug);
const failures = [];
let cursor = 0;
let checked = 0;

async function worker() {
  while (cursor < entries.length) {
    const index = cursor++;
    const [slug, publication] = entries[index];
    const url = `${baseUrl}/cases/${encodeURIComponent(slug)}`;
    try {
      const response = await fetch(url, { redirect: "follow" });
      const html = await response.text();
      const expectedCanonical = `https://www.aivortex.io/legal-ai-risk/cases/${slug}`;
      const expectedRobots = publication.tier === "index-ready" ? "index, follow" : "noindex, follow";
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!html.includes(`<h1`)) throw new Error("missing h1");
      if (!html.includes(expectedCanonical)) throw new Error("canonical mismatch");
      if (!html.includes(`content="${expectedRobots}`)) throw new Error("robots mismatch");
      checked += 1;
    } catch (error) {
      failures.push({ slug, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

if (failures.length) {
  console.error(JSON.stringify({ status: "fail", checked, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "pass",
  base_url: baseUrl,
  checked,
  index_ready: readiness.tiers["index-ready"],
  held_for_enrichment:
    readiness.tiers["enrichment-ready"] + readiness.tiers["research-only"],
}, null, 2));
