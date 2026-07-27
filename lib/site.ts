import metaRaw from "@/data/meta.json";

const DEFAULT_PUBLIC_ORIGIN = "https://www.aivortex.io";
const DEFAULT_PUBLIC_BASE_PATH = "/legal-ai-risk";
const corpusMeta = metaRaw as { last_checked?: string; last_updated: string };

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeBasePath(value: string) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

export const PUBLIC_ORIGIN = normalizeOrigin(
  process.env.NEXT_PUBLIC_SITE_ORIGIN || DEFAULT_PUBLIC_ORIGIN,
);

export const PUBLIC_BASE_PATH = normalizeBasePath(
  process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? DEFAULT_PUBLIC_BASE_PATH,
);

export const PUBLIC_BASE_URL = `${PUBLIC_ORIGIN}${PUBLIC_BASE_PATH}`;
export const SITE_PUBLICATION_DATE =
  process.env.NEXT_PUBLIC_SITE_PUBLICATION_DATE ||
  corpusMeta.last_checked ||
  corpusMeta.last_updated;

export function publicUrl(path = "") {
  if (!path || path === "/") return PUBLIC_BASE_URL;
  return `${PUBLIC_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export function assetUrl(path: string) {
  return `${PUBLIC_BASE_PATH}/${path.replace(/^\/+/, "")}`;
}

export const LEGACY_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_LEGACY_SITE_ORIGIN ||
  "https://sanctions-tracker.vercel.app";
