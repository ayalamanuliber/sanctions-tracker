import meta from "@/data/meta.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({
    status: "ok",
    service: "legal-ai-risk-mcp",
    corpus: {
      record_count: meta.total_cases,
      last_checked: meta.last_checked,
      latest_record_date: meta.latest_record_date,
      source_linked_count: meta.source_linked_count,
      source_link_coverage_pct: meta.source_link_coverage_pct,
      records_missing_date: meta.records_missing_date,
      dataset_checksum: meta.dataset_checksum,
    },
  });
}
