import type { Metadata } from "next";

import { EntityDirectoryPage } from "@/components/EntityPage";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Countries in the Legal AI Risk Record | AI Vortex",
  description: "Browse countries represented in the AI Vortex public legal AI risk corpus.",
  alternates: { canonical: publicUrl("/countries") },
};

export default function CountriesPage() {
  return <EntityDirectoryPage kind="country" />;
}
