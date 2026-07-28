import type { Metadata } from "next";

import { EntityDirectoryPage } from "@/components/EntityPage";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal AI Failure Modes | AI Vortex",
  description: "Browse recorded legal AI failure-mode tags in the AI Vortex public corpus.",
  alternates: { canonical: publicUrl("/failure-modes") },
};

export default function FailureModesPage() {
  return <EntityDirectoryPage kind="failure" />;
}
