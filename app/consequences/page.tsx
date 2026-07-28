import type { Metadata } from "next";

import { EntityDirectoryPage } from "@/components/EntityPage";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Recorded Legal AI Consequences | AI Vortex",
  description: "Browse recorded consequence tags in the AI Vortex public legal AI risk corpus.",
  alternates: { canonical: publicUrl("/consequences") },
};

export default function ConsequencesPage() {
  return <EntityDirectoryPage kind="consequence" />;
}
