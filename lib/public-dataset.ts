import metaRaw from "@/data/meta.json";
import { LEGAL_RISK_CASES } from "@/lib/cases";
import { publicUrl } from "@/lib/site";

const meta = metaRaw as {
  last_checked?: string;
  last_updated: string;
  last_checked_at?: string;
  latest_record_date?: string;
  dataset_checksum: string;
  source_record_count: number;
  source_linked_count: number;
  source_link_coverage_pct: number;
  source_url: string;
};

export const PUBLIC_DATASET_FIELDS = [
  "id",
  "slug",
  "case_name",
  "date",
  "court",
  "judge",
  "country",
  "state",
  "severity",
  "ai_tool_used",
  "tags",
  "sanction_types",
  "outcome",
  "amount",
  "amount_display",
  "source_name",
  "source_url",
  "alleged",
] as const;

export const PUBLIC_DATASET_FILTERS = [
  "q",
  "country",
  "state",
  "court",
  "judge",
  "tool",
  "failure",
  "severity",
  "status",
  "attribution",
  "sanction",
  "sourceTier",
  "review",
  "from",
  "to",
] as const;

export const PUBLIC_DATASET_VERSION = meta.last_checked || meta.last_updated;
export const PUBLIC_DATASET_CHECKSUM = meta.dataset_checksum;

export const PUBLIC_DATASET_CITATION =
  `AI Vortex. Legal AI Risk Corpus. Snapshot ${PUBLIC_DATASET_VERSION}. ` +
  `${publicUrl("/dataset")}. Accessed [date].`;

export const PUBLIC_DATASET_MANIFEST = Object.freeze({
  name: "AI Vortex Legal AI Risk Corpus",
  canonical_url: publicUrl("/dataset"),
  version: PUBLIC_DATASET_VERSION,
  last_checked: PUBLIC_DATASET_VERSION,
  last_checked_at: meta.last_checked_at || null,
  latest_record_date: meta.latest_record_date || null,
  record_count: LEGAL_RISK_CASES.length,
  source_record_count: meta.source_record_count,
  source_linked_count: meta.source_linked_count,
  source_link_coverage_pct: meta.source_link_coverage_pct,
  sha256: PUBLIC_DATASET_CHECKSUM,
  source_register: meta.source_url,
  methodology_url: publicUrl("/sources"),
  corrections_url: publicUrl("/submit"),
  json_url: publicUrl("/api/dataset?format=json"),
  csv_url: publicUrl("/api/dataset?format=csv"),
  manifest_url: publicUrl("/api/dataset/manifest"),
  rss_url: publicUrl("/feed"),
  fields: PUBLIC_DATASET_FIELDS,
  filters: PUBLIC_DATASET_FILTERS,
  citation: PUBLIC_DATASET_CITATION,
  boundaries: [
    "The corpus is a public-record research layer, not a complete universe of legal AI incidents.",
    "Counts are not usage-adjusted incidence or vendor failure rates.",
    "Case summaries do not replace the linked order, docket, later history, or legal research.",
    "Allegation, attribution, review, and consequence fields must retain their displayed evidence boundaries.",
  ],
});

export function publicDatasetRecord(
  item: (typeof LEGAL_RISK_CASES)[number],
) {
  return Object.fromEntries(
    PUBLIC_DATASET_FIELDS.map((field) => [field, item[field]]),
  );
}
