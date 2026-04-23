import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Sanctions Tracker — AI Vortex",
  description: "Real-time tracking of AI-related court sanctions against attorneys. 1,294+ cases tracked. Find out where your firm is exposed.",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AI Sanctions Tracker — AI Vortex",
    description: "1,294+ tracked rulings. $145K+ in Q1 sanctions. Courts are actively hunting for AI hallucinations. Is your firm exposed?",
    url: "https://www.aivortex.io/sanctions",
    siteName: "AI Vortex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Sanctions Tracker — AI Vortex",
    description: "1,294+ tracked rulings. Where is your firm exposed?",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter-700.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/source-serif-4-500.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/source-serif-4-500-italic.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
