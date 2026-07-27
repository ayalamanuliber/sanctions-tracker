import type { Metadata } from "next";
import { PUBLIC_BASE_URL, PUBLIC_ORIGIN, assetUrl } from "@/lib/site";
import "./globals.css";
import "./research-map.css";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  title: "AI Vortex Legal AI Risk | Search the Precedent",
  description: "Search source-linked legal AI risk records, court outcomes, sanctions, and failure patterns. Free public intelligence with review-ready workflows.",
  icons: {
    icon: [
      { url: assetUrl("/favicon-48x48.png"), sizes: "48x48", type: "image/png" },
      { url: assetUrl("/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
    ],
    apple: assetUrl("/apple-touch-icon.png"),
  },
  openGraph: {
    title: "AI Vortex Legal AI Risk | Search the Precedent",
    description: "Source-backed legal AI risk intelligence across cases, courts, and jurisdictions.",
    url: PUBLIC_BASE_URL,
    siteName: "AI Vortex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Vortex Legal AI Risk | Search the Precedent",
    description: "Search the precedent, run the review, and share the record.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preload" href={assetUrl("/fonts/inter-400.woff2")} as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href={assetUrl("/fonts/inter-700.woff2")} as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href={assetUrl("/fonts/source-serif-4-500.woff2")} as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href={assetUrl("/fonts/source-serif-4-500-italic.woff2")} as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
