import {
  COUNTRIES_TRACKED,
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  LEGAL_RISK_CASES,
} from "@/lib/cases";
import { publicUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET() {
  const body = [
    "# AI Vortex Legal AI Risk",
    "",
    "> A source-aware public research corpus covering legal proceedings in which generative AI, fabricated authority, inaccurate quotations, unsupported propositions, or related verification failures appear in the public record.",
    "",
    "## Scope",
    `- Public records: ${LEGAL_RISK_CASES.length.toLocaleString("en-US")}`,
    `- Countries represented: ${COUNTRIES_TRACKED.toLocaleString("en-US")}`,
    `- Corpus refreshed: ${LAST_CHECKED}`,
    `- Latest tracked decision: ${LATEST_RECORD_DATE}`,
    "- Counts describe the tracked corpus, not usage-adjusted incidence or vendor failure rates.",
    "- Case summaries do not replace the underlying order, docket, later history, or legal research.",
    "",
    "## Primary public surfaces",
    `- Search cases: ${publicUrl("/cases")}`,
    `- Courts: ${publicUrl("/courts")}`,
    `- Recorded judges and decision-makers: ${publicUrl("/judges")}`,
    `- Countries: ${publicUrl("/countries")}`,
    `- US states and territories: ${publicUrl("/states")}`,
    `- Recorded AI tools: ${publicUrl("/tools")}`,
    `- Failure modes: ${publicUrl("/failure-modes")}`,
    `- Consequences: ${publicUrl("/consequences")}`,
    `- Analytics: ${publicUrl("/analytics")}`,
    `- Methodology and provenance: ${publicUrl("/sources")}`,
    `- Publisher: ${publicUrl("/about")}`,
    "- Every public case, court, judge, jurisdiction, tool, failure-mode, and consequence profile is indexable and exposes a source-linked review surface with its evidence boundary preserved.",
    "- Every public case brief and entity /report page has its own canonical URL for citation, sharing, printing, and machine retrieval.",
    "",
    "## Machine-readable access",
    `- JSON dataset: ${publicUrl("/api/dataset?format=json")}`,
    `- CSV dataset: ${publicUrl("/api/dataset?format=csv")}`,
    `- RSS updates: ${publicUrl("/feed")}`,
    `- Sitemap: ${publicUrl("/sitemap.xml")}`,
    "",
    "## Citation guidance",
    "- Cite the case-specific page and inspect its linked evidence record.",
    "- Use the canonical profile for interactive exploration and its /report URL when a print-ready review packet is the more useful citation target.",
    "- Preserve the evidence boundary, allegation status, and editorial-impact label.",
    "- Attribute the research layer to AI Vortex; the upstream base archive and preserved documents are credited in the methodology.",
    "",
    "## Corrections",
    `- Submit a source-backed correction: ${publicUrl("/submit")}`,
  ].join("\n");

  return new Response(`${body}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
