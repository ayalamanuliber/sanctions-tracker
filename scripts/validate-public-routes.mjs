import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = (process.env.PUBLIC_ROUTE_BASE_URL || "http://localhost:3017/legal-ai-risk").replace(/\/$/, "");
const concurrency = Math.max(1, Number(process.env.PUBLIC_ROUTE_CONCURRENCY || 12));
const readiness = JSON.parse(
  fs.readFileSync(path.join(root, "data", "publication-readiness-index.json"), "utf8"),
);
const intelligence = JSON.parse(
  fs.readFileSync(path.join(root, "data", "case-intelligence.json"), "utf8"),
);
const intelligenceBySlug = new Map(intelligence.map((record) => [record.slug, record]));
const entries = Object.entries(readiness.by_slug);
const failures = [];
const titles = new Map();
const descriptions = new Map();
let cursor = 0;
let checked = 0;
let indexable = 0;
let held = 0;

function content(html, pattern) {
  return html.match(pattern)?.[1]
    ?.replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">") || "";
}

async function worker() {
  while (cursor < entries.length) {
    const index = cursor++;
    const [slug, publication] = entries[index];
    const url = `${baseUrl}/cases/${encodeURIComponent(slug)}`;
    try {
      const response = await fetch(url, { redirect: "follow" });
      const html = await response.text();
      const expectedCanonical = `https://www.aivortex.io/legal-ai-risk/cases/${slug}`;
      const intelligenceRecord = intelligenceBySlug.get(slug);
      const evidenceHold = [
        "primary-document-limited",
        "secondary-source-only",
        "metadata-only",
        "source-unavailable",
      ]
        .includes(intelligenceRecord?.evidence_review?.status || "");
      const canIndex = publication.tier === "index-ready" &&
        intelligenceRecord?.publication?.ready !== false &&
        !evidenceHold;
      const expectedRobots = canIndex ? "index, follow" : "noindex, follow";
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!html.includes(`<h1`)) throw new Error("missing h1");
      if (!html.includes(expectedCanonical)) throw new Error("canonical mismatch");
      if (!html.includes(`content="${expectedRobots}`)) throw new Error("robots mismatch");
      if (!html.includes("Questions this record answers")) throw new Error("missing visible FAQ");
      const title = content(html, /<title>([^<]+)<\/title>/);
      const description = content(html, /<meta name="description" content="([^"]*)"/);
      if (!title || title.length > 70) throw new Error(`invalid title length ${title.length}`);
      if (!description || description.length < 80 || description.length > 160) throw new Error(`invalid description length ${description.length}`);
      const normalizedTitle = title.toLowerCase();
      if (!titles.has(normalizedTitle)) titles.set(normalizedTitle, []);
      titles.get(normalizedTitle).push(slug);
      const normalizedDescription = description.toLowerCase();
      if (!descriptions.has(normalizedDescription)) descriptions.set(normalizedDescription, []);
      descriptions.get(normalizedDescription).push(slug);
      const jsonLdRaw = content(html, /<script type="application\/ld\+json">([^<]+)<\/script>/);
      if (!jsonLdRaw) throw new Error("missing JSON-LD");
      const graph = JSON.parse(jsonLdRaw)["@graph"] || [];
      const types = new Set(graph.map((node) => node["@type"]));
      for (const required of ["WebPage", "Article", "BreadcrumbList", "Dataset", "FAQPage"]) {
        if (!types.has(required)) throw new Error(`missing schema type ${required}`);
      }
      if (canIndex) indexable += 1;
      else held += 1;
      checked += 1;
    } catch (error) {
      failures.push({ slug, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

for (const [title, slugs] of titles) {
  if (slugs.length > 1) failures.push({ slug: slugs.join(", "), error: `duplicate title: ${title}` });
}
for (const [description, slugs] of descriptions) {
  if (slugs.length > 1) failures.push({ slug: slugs.join(", "), error: `duplicate description: ${description}` });
}

if (failures.length) {
  console.error(JSON.stringify({ status: "fail", checked, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "pass",
  base_url: baseUrl,
  checked,
  indexable,
  held,
}, null, 2));
