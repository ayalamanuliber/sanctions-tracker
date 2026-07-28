import type { Metadata } from "next";

import ResearchShell from "@/components/ResearchShell";
import MaturityTool from "@/components/workflows/MaturityTool";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal AI Control Maturity Profile | AI Vortex",
  description:
    "Assess legal AI controls and identify the next practical improvement for a responsible review workflow.",
  alternates: { canonical: publicUrl("/control-maturity") },
  robots: { index: false, follow: true },
};

export default function ControlMaturityPage() {
  return (
    <ResearchShell>
      <MaturityTool />
    </ResearchShell>
  );
}
