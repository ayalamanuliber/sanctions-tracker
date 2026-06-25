import { NextRequest } from "next/server";

import {
  artifactFilename,
  buildArtifactMarkdown,
  markdownToBasicPdf,
  markdownToHtml,
  readArtifactParams,
} from "@/lib/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const params = readArtifactParams(request.nextUrl.searchParams);
  const markdown = buildArtifactMarkdown(params);
  const headers = new Headers();

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

  if (params.format === "doc" || params.format === "word") {
    headers.set("content-type", "application/msword; charset=utf-8");
    headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
    return new Response(markdownToHtml(markdown), { headers });
  }

  headers.set("content-type", "text/markdown; charset=utf-8");
  headers.set("content-disposition", `attachment; filename="${artifactFilename(params.type, params.format, params.state)}"`);
  return new Response(markdown, { headers });
}
