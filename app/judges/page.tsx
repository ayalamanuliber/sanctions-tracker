import type { Metadata } from "next";

import { EntityDirectoryPage } from "@/components/EntityPage";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Judges in the Legal AI Risk Record | AI Vortex",
  description:
    "Browse judges and judicial decision-makers explicitly identified in source-linked primary legal documents.",
  alternates: { canonical: publicUrl("/judges") },
};

export default function JudgesPage() {
  return <EntityDirectoryPage kind="judge" />;
}
