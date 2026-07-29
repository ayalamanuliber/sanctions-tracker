import registry from "@/data/entity-media.json";
import { assetUrl, publicUrl } from "@/lib/site";

export type EntityMediaKind = "judge" | "court";

export type EntityMedia = {
  kind: EntityMediaKind;
  slug: string;
  label: string;
  assetPath: string;
  originUrl: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  credit: string;
  alt: string;
  caption: string;
};

export const ENTITY_MEDIA_REVISION = registry.revision;
export const ENTITY_MEDIA_COUNTS = {
  total: registry.items.length,
  judges: registry.items.filter((item) => item.kind === "judge").length,
  courts: registry.items.filter((item) => item.kind === "court").length,
};

const media = new Map(
  (registry.items as EntityMedia[]).map((item) => [
    `${item.kind}:${item.slug}`,
    item,
  ]),
);

export function getEntityMedia(kind: string, slug: string) {
  if (kind !== "judge" && kind !== "court") return null;
  return media.get(`${kind}:${slug}`) || null;
}

export function entityMediaAssetHref(item: EntityMedia) {
  return assetUrl(item.assetPath);
}

export function entityMediaPublicUrl(item: EntityMedia) {
  return publicUrl(item.assetPath);
}

export function entityMediaCredit(item: EntityMedia) {
  return `${item.credit} · ${item.sourceName} · ${item.license}`;
}
