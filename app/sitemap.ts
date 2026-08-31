import type { MetadataRoute } from "next";

import { getCaseBySlug } from "@/lib/cases";
import {
  ENTITY_KINDS,
  entityDirectoryHref,
  entityHref,
  entityOgImageHref,
  entityReportHref,
  getEntities,
} from "@/lib/entity-pages";
import {
  ENTITY_MEDIA_REVISION,
  entityMediaPublicUrl,
  getEntityMedia,
} from "@/lib/entity-media";
import { publicCaseSlugs } from "@/lib/publication";
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
    "/dataset",
    "/sources",
    "/resources",
    "/about",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: publicUrl(path),
    lastModified: updated,
  }));

  const publishableCases = publicCaseSlugs()
    .map((slug) => getCaseBySlug(slug))
    .filter((item) => item !== null)
    .map((item) => ({
      url: publicUrl(`/cases/${item.slug}`),
      lastModified: new Date(`${item.date}T00:00:00Z`),
    }));

  const caseBriefs = publicCaseSlugs()
    .map((slug) => getCaseBySlug(slug))
    .filter((item) => item !== null)
    .map((item) => ({
      url: publicUrl(`/cases/${item.slug}/brief`),
      lastModified: new Date(`${item.date}T00:00:00Z`),
      images: [publicUrl(`/cases/${item.slug}/opengraph-image`)],
    }));

  const entityPages = ENTITY_KINDS.flatMap((kind) =>
    getEntities(kind)
      .map((entity) => ({
        ...(() => {
          const media = getEntityMedia(kind, entity.slug);
          return {
            lastModified: new Date(`${media ? ENTITY_MEDIA_REVISION : entity.latest}T00:00:00Z`),
            images: [
              ...(media ? [entityMediaPublicUrl(media)] : []),
              publicUrl(entityOgImageHref(kind, entity.slug)),
            ],
          };
        })(),
        url: publicUrl(entityHref(kind, entity.slug)),
      })),
  );

  const entityReports = ENTITY_KINDS.flatMap((kind) =>
    getEntities(kind)
      .map((entity) => ({
        ...(() => {
          const media = getEntityMedia(kind, entity.slug);
          return {
            lastModified: new Date(`${media ? ENTITY_MEDIA_REVISION : entity.latest}T00:00:00Z`),
            images: [
              ...(media ? [entityMediaPublicUrl(media)] : []),
              publicUrl(entityOgImageHref(kind, entity.slug, "report")),
            ],
          };
        })(),
        url: publicUrl(entityReportHref(kind, entity.slug)),
      })),
  );

  const directoryPages = ENTITY_KINDS.map((kind) => ({
    url: publicUrl(entityDirectoryHref(kind)),
    lastModified: updated,
  }));

  const unique = new Map(
    [
      ...fixed,
      ...directoryPages,
      ...publishableCases,
      ...caseBriefs,
      ...entityPages,
      ...entityReports,
    ].map(
      (entry) => [entry.url, entry],
    ),
  );
  return [...unique.values()];
}
