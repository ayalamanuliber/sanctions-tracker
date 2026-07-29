import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "data/entity-media.json");
const validateOnly = process.argv.includes("--validate");
const force = process.argv.includes("--force");

const registry = JSON.parse(await fs.readFile(REGISTRY_PATH, "utf8"));
const allowedKinds = new Set(["judge", "court"]);
const required = [
  "kind",
  "slug",
  "label",
  "assetPath",
  "originUrl",
  "sourceName",
  "sourceUrl",
  "license",
  "licenseUrl",
  "credit",
  "alt",
  "caption",
];
const keys = new Set();

if (!/^\d{4}-\d{2}-\d{2}$/.test(registry.revision || "")) {
  throw new Error("entity-media revision must use YYYY-MM-DD.");
}

for (const item of registry.items || []) {
  for (const field of required) {
    if (!String(item[field] || "").trim()) {
      throw new Error(`Missing ${field} for ${item.kind || "unknown"}:${item.slug || "unknown"}.`);
    }
  }
  if (!allowedKinds.has(item.kind)) {
    throw new Error(`Unsupported media kind: ${item.kind}.`);
  }
  const key = `${item.kind}:${item.slug}`;
  if (keys.has(key)) throw new Error(`Duplicate entity media key: ${key}.`);
  keys.add(key);
  const expected = `/assets/entities/${item.kind === "judge" ? "judges" : "courts"}/${item.slug}.webp`;
  if (item.assetPath !== expected) {
    throw new Error(`${key} assetPath must be ${expected}.`);
  }
}

async function outputStatus(item) {
  const destination = path.join(ROOT, "public", item.assetPath);
  const metadata = await sharp(destination).metadata();
  const expected =
    item.kind === "judge"
      ? { width: 512, height: 512 }
      : { width: 960, height: 600 };
  if (metadata.width !== expected.width || metadata.height !== expected.height || metadata.format !== "webp") {
    throw new Error(
      `${item.kind}:${item.slug} must be ${expected.width}x${expected.height} WebP; received ${metadata.width}x${metadata.height} ${metadata.format}.`,
    );
  }
  return destination;
}

async function sync(item) {
  const destination = path.join(ROOT, "public", item.assetPath);
  if (!force) {
    try {
      await outputStatus(item);
      return { item, status: "kept" };
    } catch {}
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(item.originUrl, {
      headers: {
        "User-Agent": "AI-Vortex-Entity-Media/1.0 (manuel@aivortex.io)",
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
      },
    });
    if (response.status !== 429 || attempt === 3) break;
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
  }
  if (!response.ok) {
    throw new Error(`${item.kind}:${item.slug} download failed with HTTP ${response.status}.`);
  }
  const input = Buffer.from(await response.arrayBuffer());
  const dimensions = item.kind === "judge" ? [512, 512] : [960, 600];
  await sharp(input)
    .rotate()
    .resize(dimensions[0], dimensions[1], {
      fit: "cover",
      position: sharp.strategy.attention,
      withoutEnlargement: false,
    })
    .webp({ quality: 84, effort: 5 })
    .toFile(destination);
  await outputStatus(item);
  return { item, status: "downloaded" };
}

if (validateOnly) {
  for (const item of registry.items) await outputStatus(item);
  console.log(`Entity media PASS: ${registry.items.length} registered assets, revision ${registry.revision}.`);
} else {
  const results = [];
  for (const item of registry.items) {
    const result = await sync(item);
    results.push(result);
    console.log(`${result.status.padEnd(10)} ${item.kind}:${item.slug}`);
  }
  const downloaded = results.filter((result) => result.status === "downloaded").length;
  console.log(`Entity media synced: ${results.length} total, ${downloaded} downloaded, ${results.length - downloaded} kept.`);
}
