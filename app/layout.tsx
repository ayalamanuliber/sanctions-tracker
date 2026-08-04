import type { Metadata } from "next";
import SiteInstrumentation from "@/components/SiteInstrumentation";
import { PUBLIC_BASE_URL, PUBLIC_ORIGIN, assetUrl, publicUrl } from "@/lib/site";
import "./globals.css";
import "./research-map.css";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  title: "AI Vortex Legal AI Intelligence | Evidence You Can Trace",
  description: "Prepare your next move with source-linked legal AI cases, judicial responses, sanctions, and review records you can inspect and share.",
  icons: {
    icon: [
      { url: assetUrl("/favicon-48x48.png"), sizes: "48x48", type: "image/png" },
      { url: assetUrl("/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
    ],
    apple: assetUrl("/apple-touch-icon.png"),
  },
  openGraph: {
    title: "AI Vortex Legal AI Intelligence | Evidence You Can Trace",
    description: "Review, compare, investigate, and prepare with source-linked legal AI intelligence across cases, courts, and jurisdictions.",
    url: PUBLIC_BASE_URL,
    siteName: "AI Vortex",
    type: "website",
    images: [
      {
        url: publicUrl("/legal-ai-risk-social-v2.png"),
        width: 1200,
        height: 630,
        alt: "AI Vortex Legal AI Risk Intelligence — prepare your next move with evidence you can trace",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Vortex Legal AI Intelligence | Evidence You Can Trace",
    description: "Prepare your next move with source-linked legal AI evidence you can inspect and share.",
    images: [publicUrl("/legal-ai-risk-social-v2.png")],
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
        <SiteInstrumentation />
      </body>
    </html>
  );
}
