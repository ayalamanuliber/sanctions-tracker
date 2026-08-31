import type { Metadata } from "next";
import ProductHome from "@/components/ProductHome";
import meta from "@/data/meta.json";
import { PUBLIC_DATASET_MANIFEST } from "@/lib/public-dataset";
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
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: publicUrl("/cases?q={search_term_string}"),
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "CollectionPage",
        "@id": `${PUBLIC_BASE_URL}#collection`,
        url: PUBLIC_BASE_URL,
        name: "AI Vortex Legal AI Risk public record",
        description:
          "Source-linked legal AI intelligence for reviewing work, comparing judicial responses, investigating patterns, and preparing the next decision.",
        dateModified: SITE_PUBLICATION_DATE,
        isAccessibleForFree: true,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: publicUrl("/legal-ai-risk-social-v2.png"),
          width: 1200,
          height: 630,
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: meta.total_cases,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          url: publicUrl("/cases"),
        },
      },
      {
        "@type": "Dataset",
        "@id": `${PUBLIC_BASE_URL}#dataset`,
        name: PUBLIC_DATASET_MANIFEST.name,
        description:
          "Structured public-record research on legal AI citation failures, court responses, sanctions, and related consequences.",
        url: publicUrl("/dataset"),
        creator: { "@id": "https://www.aivortex.io/#organization" },
        dateModified: PUBLIC_DATASET_MANIFEST.last_checked,
        version: PUBLIC_DATASET_MANIFEST.version,
        isAccessibleForFree: true,
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: PUBLIC_DATASET_MANIFEST.json_url,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: PUBLIC_DATASET_MANIFEST.csv_url,
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": "https://www.aivortex.io/#organization",
        name: "AI Vortex",
        url: "https://www.aivortex.io/",
        founder: { "@id": `${PUBLIC_BASE_URL}#manu-ayala` },
      },
      {
        "@type": "Person",
        "@id": `${PUBLIC_BASE_URL}#manu-ayala`,
        name: "Manu Ayala",
        url: publicUrl("/about"),
        sameAs: ["https://www.linkedin.com/in/aivortex/"],
      },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <ProductHome />
  </>;
}
