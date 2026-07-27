import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_ORIGIN = "https://www.aivortex.io";
const DEFAULT_BASE_PATH = "/legal-ai-risk";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_KEY = "219fccbf4583b103f1799717959f27cb";
const MAX_URLS_PER_REQUEST = 10_000;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const origin = (process.env.INDEXNOW_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, "");
const basePath = `/${(process.env.INDEXNOW_BASE_PATH || DEFAULT_BASE_PATH).replace(/^\/+|\/+$/g, "")}`;
const endpoint = process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT;
const key = process.env.INDEXNOW_KEY || DEFAULT_KEY;
const keyFile = `${key}.txt`;
const keyLocation = `${origin}${basePath}/${keyFile}`;
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL || `${origin}${basePath}/sitemap.xml`;
const host = new URL(origin).host;

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    match[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .trim(),
  );
}

async function verifyLocalKey() {
  const localKey = (
    await fs.readFile(path.join(process.cwd(), "public", keyFile), "utf8")
  ).trim();

  if (localKey !== key) {
    throw new Error(`IndexNow key file ${keyFile} does not match the configured key.`);
  }
}

await verifyLocalKey();

const sitemapResponse = await fetch(sitemapUrl, {
  headers: { "user-agent": "AI-Vortex-IndexNow/1.0" },
});
if (!sitemapResponse.ok) {
  throw new Error(`Could not fetch ${sitemapUrl}: HTTP ${sitemapResponse.status}`);
}

const urls = [...new Set(sitemapUrls(await sitemapResponse.text()))];
if (urls.length === 0) {
  throw new Error(`No canonical URLs were found in ${sitemapUrl}.`);
}
if (urls.length > MAX_URLS_PER_REQUEST) {
  throw new Error(
    `${urls.length} URLs exceed IndexNow's ${MAX_URLS_PER_REQUEST}-URL request limit.`,
  );
}

for (const value of urls) {
  const url = new URL(value);
  const isInVerifiedPath =
    url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
  if (url.host !== host || !isInVerifiedPath) {
    throw new Error(`Sitemap URL is outside the verified IndexNow scope: ${value}`);
  }
}

const summary = {
  endpoint,
  host,
  keyLocation,
  sitemapUrl,
  urlCount: urls.length,
  firstUrl: urls[0],
  lastUrl: urls.at(-1),
};

if (dryRun) {
  console.log(JSON.stringify({ status: "dry-run", ...summary }, null, 2));
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
    "user-agent": "AI-Vortex-IndexNow/1.0",
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList: urls,
  }),
});

const responseBody = await response.text();
if (![200, 202].includes(response.status)) {
  throw new Error(
    `IndexNow rejected the submission: HTTP ${response.status}${
      responseBody ? ` — ${responseBody}` : ""
    }`,
  );
}

console.log(
  JSON.stringify(
    {
      status: response.status === 200 ? "accepted" : "accepted-pending-key-verification",
      httpStatus: response.status,
      ...summary,
    },
    null,
    2,
  ),
);
