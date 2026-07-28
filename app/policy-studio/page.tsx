import type { Metadata } from "next";

import ResearchShell from "@/components/ResearchShell";
import PolicyStudioTool from "@/components/workflows/PolicyStudioTool";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal AI Policy Studio | AI Vortex",
  description:
    "Build a scoped legal AI policy draft and implementation starting point for responsible review.",
  alternates: { canonical: publicUrl("/policy-studio") },
  robots: { index: false, follow: true },
};

export default function PolicyStudioPage() {
  return (
    <ResearchShell>
      <PolicyStudioTool />
    </ResearchShell>
  );
}
