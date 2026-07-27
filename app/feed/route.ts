import sanctionsRaw from "@/data/sanctions.json";
import metaRaw from "@/data/meta.json";
import { matchesTool } from "@/lib/filtering";
import type { PublicSanctionCase } from "@/lib/mcp/types";
import { PUBLIC_BASE_URL, publicUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const cases = (sanctionsRaw as unknown as PublicSanctionCase[]).slice().sort((a, b) => b.date.localeCompare(a.date));
const meta = metaRaw as { last_updated: string; last_checked?: string; latest_record_date?: string };

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state")?.toUpperCase();
  const tool = url.searchParams.get("tool");
  const failure = url.searchParams.get("failure");
  const severity = url.searchParams.get("severity");
  const filtered = cases.filter((item) => {
    if (state && item.state !== state) return false;
    if (tool && !matchesTool(item.ai_tool_used, tool, item.summary)) return false;
    if (failure && !item.tags.includes(failure)) return false;
    if (severity && item.severity !== severity) return false;
    return true;
  }).slice(0, 25);

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>AI Vortex Legal AI Risk Watchlist</title>
    <link>${PUBLIC_BASE_URL}</link>
    <description>Filtered public legal AI risk matters. Corpus checked ${meta.last_checked || meta.last_updated}; latest tracked decision ${meta.latest_record_date || "not provided"}.</description>
    ${filtered.map((item) => `<item>
      <title>${escapeXml(item.case_name)}</title>
      <link>${escapeXml(publicUrl(`/cases/${item.id}`))}</link>
      <guid>${escapeXml(item.id)}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escapeXml(`${item.court} · ${item.severity} · ${item.ai_tool_used}`)}</description>
    </item>`).join("")}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
