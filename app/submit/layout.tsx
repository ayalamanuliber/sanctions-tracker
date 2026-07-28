import type { Metadata } from "next";

import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Submit a Record Correction | AI Vortex",
  description:
    "Submit a public source, record correction, court rule, or order for manual review by AI Vortex.",
  alternates: { canonical: publicUrl("/submit") },
  robots: { index: false, follow: true },
};

export default function SubmitLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
