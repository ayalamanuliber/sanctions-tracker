import type { Metadata } from "next";

import { EntityDirectoryPage } from "@/components/EntityPage";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Recorded AI Tools in the Legal AI Risk Record | AI Vortex",
  description: "Browse named AI tool labels recorded in the AI Vortex public legal AI risk corpus.",
  alternates: { canonical: publicUrl("/tools") },
};

export default function ToolsPage() {
  return <EntityDirectoryPage kind="tool" />;
}
