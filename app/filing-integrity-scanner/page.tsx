import type { Metadata } from "next";

import ResearchShell from "@/components/ResearchShell";
import IntegrityScannerTool from "@/components/workflows/IntegrityScannerTool";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Filing Integrity Review | AI Vortex",
  description:
    "Extract citation and quotation candidates, then record human verification before a court-facing filing.",
  alternates: { canonical: publicUrl("/filing-integrity-scanner") },
  robots: { index: false, follow: true },
};

export default function FilingIntegrityScannerPage() {
  return (
    <ResearchShell>
      <IntegrityScannerTool />
    </ResearchShell>
  );
}
