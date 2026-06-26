import { NextRequest } from "next/server";

import {
  artifactFilename,
  buildArtifactCsv,
  buildArtifactMarkdown,
  markdownToBasicPdf,
  markdownToHtml,
  readArtifactParams,
  unsupportedArtifactMessage,
} from "@/lib/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const params = readArtifactParams(request.nextUrl.searchParams);
  const markdown = buildArtifactMarkdown(params);
  const headers = new Headers();

  if (params.format === "docx" || params.format === "xlsx") {
    headers.set("content-type", "text/plain; charset=utf-8");
    return new Response(unsupportedArtifactMessage(params.format), { status: 415, headers });
  }

  if (params.format === "csv") {
    headers.set("content-type", "text/csv; charset=utf-8");
    headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
    return new Response(buildArtifactCsv(params), { headers });
  }

  if (params.format === "pdf") {
    headers.set("content-type", "application/pdf");
    headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
    return new Response(Buffer.from(markdownToBasicPdf(markdown)), { headers });
  }

  if (params.format === "html") {
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
    return new Response(markdownToHtml(markdown), { headers });
  }

  if (params.format === "doc" || params.format === "word" || params.format === "word-ready") {
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
    return new Response(markdownToHtml(markdown), { headers });
  }

  headers.set("content-type", "text/markdown; charset=utf-8");
  headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
  return new Response(markdown, { headers });
}
