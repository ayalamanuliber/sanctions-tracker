import type { MetadataRoute } from "next"; import { getCaseBySlug } from "@/lib/cases";
import { indexEligibleSlugs } from "@/lib/publication";
import { publicUrl, SITE_PUBLICATION_DATE } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(`${SITE_PUBLICATION_DATE}T00:00:00Z`);
  const fixed = ["", "/cases", "/courts", "/topics", "/map", "/analytics", "/dashboard", "/sources", "/resources", "/workflows", "/use-with-ai", "/filing-gate", "/filing-integrity-scanner", "/control-maturity", "/policy-studio", "/privacy", "/terms"].map((path) => ({
    url: publicUrl(path),
    lastModified: updated,
  }));
  const publishable = indexEligibleSlugs().map((slug) => getCaseBySlug(slug)).filter((item) => item !== null);
  return [...fixed, ...publishable.map((item) => ({
    url: publicUrl(`/cases/${item.slug}`),
    lastModified: updated,
  }))];
}
