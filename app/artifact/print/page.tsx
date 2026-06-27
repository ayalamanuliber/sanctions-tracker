import { buildArtifactMarkdown, readArtifactParams } from "@/lib/artifacts";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markdownToPrintHtml(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (line.startsWith("|")) return `<pre>${escapeHtml(line)}</pre>`;
      if (!line.trim()) return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

export default async function ArtifactPrintPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved || {})) {
    const item = first(value);
    if (item) params.set(key, item);
  }
  const artifactParams = readArtifactParams(params);
  const markdown = buildArtifactMarkdown(artifactParams);
  const html = markdownToPrintHtml(markdown);

  return (
    <main style={{ background: "#f8fafc", color: "#111827", minHeight: "100vh", padding: "32px 18px" }}>
      <article style={{ maxWidth: 860, margin: "0 auto", background: "#fff", border: "1px solid #e5e7eb", padding: "44px 52px", boxShadow: "0 20px 70px rgba(15, 23, 42, 0.10)" }}>
        <div className="screen-only" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <div style={{ color: "#92400e", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>AI Vortex Legal AI Risk</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Print-ready view. Use your browser print dialog to save as PDF.</div>
          </div>
          <button className="print-button" style={{ border: "1px solid #111827", background: "#111827", color: "#fff", padding: "9px 12px", fontWeight: 800 }}>
            Print / Save PDF
          </button>
        </div>
        <div className="artifact-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <script dangerouslySetInnerHTML={{ __html: "document.querySelector('.print-button')?.addEventListener('click',()=>window.print())" }} />
      <style>{`
        .artifact-body h1 { font-size: 28px; line-height: 1.15; margin: 0 0 22px; }
        .artifact-body h2 { font-size: 16px; margin: 26px 0 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
        .artifact-body p { font-size: 13px; line-height: 1.55; margin: 8px 0; }
        .artifact-body li { font-size: 13px; line-height: 1.5; margin: 5px 0 5px 18px; }
        .artifact-body pre { white-space: pre-wrap; background: #f8fafc; border: 1px solid #e5e7eb; padding: 8px; font-size: 11px; overflow-wrap: anywhere; }
        @media print {
          main { background: #fff !important; padding: 0 !important; }
          article { border: 0 !important; box-shadow: none !important; max-width: none !important; padding: 0 !important; }
          .screen-only { display: none !important; }
        }
      `}</style>
    </main>
  );
}
