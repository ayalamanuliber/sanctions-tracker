import { ImageResponse } from "next/og";

import {
  ENTITY_KINDS,
  getEntity,
  type EntityKind,
} from "@/lib/entity-pages";
import { buildEntityIntelligence } from "@/lib/entity-intelligence";
import {
  entityMediaCredit,
  entityMediaAssetHref,
  getEntityMedia,
} from "@/lib/entity-media";
import { getCourtVisual } from "@/lib/court-visual";
import { assetUrl } from "@/lib/site";
import { getToolCatalogEntry } from "@/lib/tool-catalog";

const size = { width: 1200, height: 630 };

function isEntityKind(value: string): value is EntityKind {
  return (ENTITY_KINDS as readonly string[]).includes(value);
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function kindLabel(kind: EntityKind) {
  return {
    judge: "RECORDED DECISION-MAKER",
    court: "COURT INTELLIGENCE",
    state: "STATE EVIDENCE VIEW",
    country: "COUNTRY EVIDENCE VIEW",
    tool: "RECORDED AI TOOL",
    failure: "FAILURE MODE",
    consequence: "RECORDED CONSEQUENCE",
  }[kind];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; slug: string }> },
) {
  const { kind, slug } = await params;
  if (!isEntityKind(kind)) return new Response("Not found", { status: 404 });
  const entity = getEntity(kind, slug);
  if (!entity) return new Response("Not found", { status: 404 });

  const intelligence = buildEntityIntelligence(entity);
  const variantParam = new URL(request.url).searchParams.get("variant");
  const variant = variantParam?.startsWith("report")
    ? "SOURCE-LINKED EVIDENCE REPORT"
    : "SOURCE-LINKED INTELLIGENCE PROFILE";
  const titleSize =
    entity.label.length > 72 ? 48 : entity.label.length > 48 ? 56 : 66;
  const leadingIssue =
    intelligence.failures[0]?.label || "No classified issue signal";
  const leadingResponse =
    intelligence.consequences[0]?.label || "No classified response";
  const media = getEntityMedia(entity.kind, entity.slug);
  const courtVisual = entity.kind === "court" && !media ? getCourtVisual(entity) : null;
  const toolProfile =
    entity.kind === "tool"
      ? getToolCatalogEntry(entity.slug, entity.label)
      : null;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        padding: "56px 66px 48px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at 84% 16%, #1e5287 0, #082341 32%, #031126 74%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -30,
          display: "flex",
          width: 360,
          height: 360,
          border: "1px solid rgba(113,173,235,.28)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 75,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 220,
          height: 220,
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: entity.kind === "court" ? 24 : "50%",
          color: "rgba(255,255,255,.82)",
          fontFamily: "Georgia, serif",
          fontSize: 58,
        }}
      >
        {media ? (
          // ImageResponse renders plain image elements rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={new URL(entityMediaAssetHref(media), request.url).toString()}
            alt=""
            width={220}
            height={220}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : toolProfile?.logoKey === "openai" ? (
          // Official OpenAI Blossom asset, used only to identify the named product.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={new URL(
              assetUrl("/assets/brands/openai-blossom-white.svg"),
              request.url,
            ).toString()}
            alt=""
            width={116}
            height={116}
            style={{ width: 116, height: 116, objectFit: "contain" }}
          />
        ) : courtVisual ? (
          <div style={{ display:"flex", width:"100%", height:"100%", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"linear-gradient(145deg,#173f68,#0b2848)" }}>
            <span style={{ color:"#f0ad2c", fontSize:13, fontWeight:800, letterSpacing:".12em" }}>COURT SCOPE</span>
            <span style={{ fontSize:46 }}>{courtVisual.code}</span>
            <span style={{ color:"#c8d8e9", fontSize:14 }}>{courtVisual.scope}</span>
            <span style={{ color:"#8db7e1", fontSize:10 }}>{courtVisual.classification}</span>
          </div>
        ) : (
          initials(entity.label) || "AV"
        )}
      </div>
      {media && (
        <div
          style={{
            position: "absolute",
            top: 254,
            right: 74,
            display: "flex",
            width: 225,
            justifyContent: "flex-end",
            color: "rgba(225,234,245,.8)",
            fontSize: 9,
            lineHeight: 1.25,
            textAlign: "right",
          }}
        >
          Photo: {entityMediaCredit(media)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: "-0.06em",
          }}
        >
          AV
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "0.08em",
            }}
          >
            AI VORTEX
          </span>
          <span
            style={{
              color: "#f0ad2c",
              fontSize: 12,
              letterSpacing: "0.18em",
            }}
          >
            LEGAL AI RISK
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          maxWidth: 880,
          flexDirection: "column",
          gap: 15,
        }}
      >
        <span
          style={{
            color: "#f0ad2c",
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: "0.14em",
          }}
        >
          {kindLabel(entity.kind)} · {variant}
        </span>
        <div
          style={{
            display: "flex",
            maxWidth: 920,
            fontFamily: "Georgia, serif",
            fontSize: titleSize,
            lineHeight: 1.03,
            letterSpacing: "-0.025em",
          }}
        >
          {entity.label}
        </div>
        <div
          style={{
            display: "flex",
            gap: 11,
            color: "#c7d4e4",
            fontSize: 20,
          }}
        >
          <span>{entity.records.length.toLocaleString()} public records</span>
          <span>·</span>
          <span>{entity.sourceLinked.toLocaleString()} source linked</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 28,
          borderTop: "1px solid rgba(255,255,255,.22)",
          paddingTop: 20,
          color: "#b7c4d6",
          fontSize: 14,
        }}
      >
        <span>Leading issue: {leadingIssue}</span>
        <span>Leading response: {leadingResponse}</span>
        <span style={{ color: "#f0ad2c" }}>aivortex.io/legal-ai-risk</span>
      </div>
    </div>,
    {
      ...size,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400, immutable",
      },
    },
  );
}
