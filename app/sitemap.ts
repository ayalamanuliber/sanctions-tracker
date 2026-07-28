import type { MetadataRoute } from "next";

import { getCaseBySlug } from "@/lib/cases";
import {
  ENTITY_KINDS,
  entityDirectoryHref,
  entityHref,
  getEntities,
} from "@/lib/entity-pages";
import { indexEligibleSlugs } from "@/lib/publication";
import { publicUrl, SITE_PUBLICATION_DATE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(`${SITE_PUBLICATION_DATE}T00:00:00Z`);
  const fixed = [
    "",
    "/cases",
    "/courts",
    "/countries",
    "/states",
    "/tools",
    "/failure-modes",
    "/consequences",
    "/topics",
    "/map",
    "/analytics",
    "/sources",
    "/resources",
    "/about",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: publicUrl(path),
    lastModified: updated,
  }));

  const publishableCases = indexEligibleSlugs()
    .map((slug) => getCaseBySlug(slug))
    .filter((item) => item !== null)
    .map((item) => ({
      url: publicUrl(`/cases/${item.slug}`),
      lastModified: new Date(`${item.date}T00:00:00Z`),
    }));

  const entityPages = ENTITY_KINDS.flatMap((kind) =>
    getEntities(kind)
      .filter((entity) => entity.indexEligible)
      .map((entity) => ({
        url: publicUrl(entityHref(kind, entity.slug)),
        lastModified: new Date(`${entity.latest}T00:00:00Z`),
      })),
  );

  const directoryPages = ENTITY_KINDS.map((kind) => ({
    url: publicUrl(entityDirectoryHref(kind)),
    lastModified: updated,
  }));

  const unique = new Map(
    [...fixed, ...directoryPages, ...publishableCases, ...entityPages].map(
      (entry) => [entry.url, entry],
    ),
  );
  return [...unique.values()];
}
