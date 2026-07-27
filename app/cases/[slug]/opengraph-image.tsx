import { ImageResponse } from "next/og";
import { getCaseBySlug } from "@/lib/cases";

export const alt = "AI Vortex legal AI risk case record";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = getCaseBySlug((await params).slug);
  const title = item?.case_name || "Legal AI risk case record";
  const court = item?.court || "Public legal record";
  const date = item?.date || "";
  const impact = item?.severity?.replace("-", " ") || "tracked";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at 82% 18%, #173f70 0, #071a35 36%, #031126 72%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.05em",
          }}
        >
          AV
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 25, fontWeight: 800, letterSpacing: "0.08em" }}>
            AI VORTEX
          </span>
          <span style={{ color: "#f0ad2c", fontSize: 13, letterSpacing: "0.18em" }}>
            LEGAL AI RISK
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ color: "#f0ad2c", fontSize: 17, fontWeight: 800, letterSpacing: "0.14em" }}>
          SOURCE-LINKED PUBLIC RECORD
        </span>
        <div
          style={{
            display: "flex",
            maxWidth: 1020,
            fontFamily: "Georgia, serif",
            fontSize: title.length > 58 ? 54 : 66,
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", gap: 20, color: "#cbd5e1", fontSize: 22 }}>
          <span>{court}</span>
          {date && <span>· {date}</span>}
          <span>· Editorial impact: {impact}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,.22)",
          paddingTop: 22,
          color: "#b7c4d6",
          fontSize: 16,
        }}
      >
        <span>Search the precedent · inspect the source · share the record</span>
        <span>aivortex.io/legal-ai-risk</span>
      </div>
    </div>,
    size,
  );
}
