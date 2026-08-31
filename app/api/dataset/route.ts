import { NextRequest, NextResponse } from "next/server";

import {
  LAST_CHECKED,
  LATEST_RECORD_DATE,
  queryCases,
  sourceTier,
  type CaseQuery,
} from "@/lib/cases";
import { attributionStatus } from "@/lib/corpus-analytics";
import {
  PUBLIC_DATASET_FIELDS,
  PUBLIC_DATASET_MANIFEST,
  PUBLIC_DATASET_VERSION,
  publicDatasetRecord,
} from "@/lib/public-dataset";

function csvCell(value: unknown) {
  const content = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${content.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const params = request.nextUrl.searchParams;
  const query: CaseQuery = {
    q: params.get("q") || "",
    country: params.get("country") || "",
    state: params.get("state") || "",
    court: params.get("court") || "",
    tool: params.get("tool") || "",
    failure: params.get("failure") || "",
    severity: (params.get("severity") || "") as CaseQuery["severity"],
    status: (params.get("status") || "all") as CaseQuery["status"],
    sort: "date",
  };
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const judge = (params.get("judge") || "").toLowerCase();
  const attribution = params.get("attribution") || "";
  const sanction = params.get("sanction") || "";
  const requestedSourceTier = params.get("sourceTier") || "";
  const review = params.get("review") || "";
  const filtered = queryCases(query).filter((item) => {
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;
    if (judge && !(item.judge || "").toLowerCase().includes(judge)) return false;
    if (attribution && attributionStatus(item) !== attribution) return false;
    if (sanction && !item.sanction_types.includes(sanction)) return false;
    if (requestedSourceTier && sourceTier(item).key !== requestedSourceTier) return false;
    if (review === "reviewed" && !item.reviewed) return false;
    if (review === "not-reviewed" && item.reviewed) return false;
    return true;
  });
  const records = filtered.map(publicDatasetRecord);
  const filteredLabel = params.size > 1 ? "filtered" : "complete";
  const filename = `ai-vortex-legal-ai-risk-${filteredLabel}-${LAST_CHECKED}.${format}`;
  const commonHeaders = {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Last-Modified": new Date(`${PUBLIC_DATASET_VERSION}T00:00:00Z`).toUTCString(),
    "X-Dataset-Records": String(records.length),
    "X-Dataset-Version": PUBLIC_DATASET_VERSION,
  };
  if (format === "json") {
    return NextResponse.json(
      {
        dataset: PUBLIC_DATASET_MANIFEST,
        last_checked: LAST_CHECKED,
        latest_record_date: LATEST_RECORD_DATE,
        record_count: records.length,
        records,
      },
      { headers: commonHeaders },
    );
  }
  const csv = [
    PUBLIC_DATASET_FIELDS.join(","),
    ...records.map((record) => PUBLIC_DATASET_FIELDS.map((field) => csvCell(record[field])).join(",")),
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      ...commonHeaders,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
