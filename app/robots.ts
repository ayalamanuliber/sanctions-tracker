import type { MetadataRoute } from "next";
import { PUBLIC_BASE_PATH, publicUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        `${PUBLIC_BASE_PATH}/`,
        `${PUBLIC_BASE_PATH}/api/dataset`,
      ],
      disallow: [`${PUBLIC_BASE_PATH}/api/`, `${PUBLIC_BASE_PATH}/mcp`],
    },
    sitemap: publicUrl("/sitemap.xml"),
  };
}
