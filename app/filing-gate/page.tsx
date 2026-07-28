import type { Metadata } from "next";

import ResearchShell from "@/components/ResearchShell";
import FilingGateTool from "@/components/workflows/FilingGateTool";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pre-Filing Citation Review Gate | AI Vortex",
  description:
    "A practical pre-filing gate for citation, quotation, disclosure, and responsible-reviewer checks.",
  alternates: { canonical: publicUrl("/filing-gate") },
  robots: { index: false, follow: true },
};

export default function FilingGatePage() {
  return (
    <ResearchShell>
      <FilingGateTool />
    </ResearchShell>
  );
}
