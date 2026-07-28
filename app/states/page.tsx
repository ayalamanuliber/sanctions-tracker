import type { Metadata } from "next";

import { EntityDirectoryPage } from "@/components/EntityPage";
import { publicUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "US States and Territories in the Legal AI Risk Record | AI Vortex",
  description: "Browse US states and territories represented in the AI Vortex public legal AI risk corpus.",
  alternates: { canonical: publicUrl("/states") },
};

export default function StatesPage() {
  return <EntityDirectoryPage kind="state" />;
}
