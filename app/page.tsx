import type { Metadata } from "next";
import ProductHome from "@/components/ProductHome";
import meta from "@/data/meta.json";
import { PUBLIC_BASE_URL, SITE_PUBLICATION_DATE, publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: PUBLIC_BASE_URL },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${PUBLIC_BASE_URL}#website`,
        url: PUBLIC_BASE_URL,
        name: "AI Vortex Legal AI Risk",
        publisher: { "@id": "https://www.aivortex.io/#organization" },
        inLanguage: "en-US",
      },
      {
        "@type": "CollectionPage",
        "@id": `${PUBLIC_BASE_URL}#collection`,
        url: PUBLIC_BASE_URL,
        name: "AI Vortex Legal AI Risk public record",
        description:
          "Source-linked public intelligence about legal AI citation failures, court responses, sanctions, and review controls.",
        dateModified: SITE_PUBLICATION_DATE,
        isAccessibleForFree: true,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: meta.total_cases,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          url: publicUrl("/cases"),
        },
      },
      {
        "@type": "Organization",
        "@id": "https://www.aivortex.io/#organization",
        name: "AI Vortex",
        url: "https://www.aivortex.io/",
        founder: { "@type": "Person", name: "Manu Ayala" },
      },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <ProductHome />
  </>;
}
