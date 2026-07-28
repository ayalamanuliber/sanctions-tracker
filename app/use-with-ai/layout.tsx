import type { Metadata } from "next";

import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Use AI With Legal AI Risk Evidence | AI Vortex",
  description:
    "Connect an AI workspace to source-linked legal AI risk records, with explicit evidence and privacy boundaries.",
  alternates: { canonical: publicUrl("/use-with-ai") },
  robots: { index: false, follow: true },
};

export default function UseWithAiLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
