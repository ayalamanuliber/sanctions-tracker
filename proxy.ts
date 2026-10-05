import { NextResponse, type NextRequest } from "next/server";
import { isRetiredRequest } from "@/lib/public-record-controls.mjs";

export function proxy(request: NextRequest) {
  if (!isRetiredRequest(request.url)) return NextResponse.next();
  return new NextResponse(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Record no longer published | AI Vortex</title></head><body><main><h1>Record no longer published at this address</h1><p>This identifier and its document derivatives are no longer published.</p><a href="/legal-ai-risk/cases">Browse the public tracker</a></main></body></html>',
    { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } },
  );
}

export const config = { matcher: "/((?!_next/static|_next/image|assets/entities|fonts).*)" };
