import { buildArtifactMarkdown, markdownToBodyHtml, readArtifactParams } from "@/lib/artifacts";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
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
  const html = markdownToBodyHtml(markdown);
  const generated = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date());

  return (
    <main style={{ background: "#f8fafc", color: "#111827", minHeight: "100vh", padding: "32px 18px" }}>
      <article style={{ maxWidth: 900, margin: "0 auto", background: "#fff", border: "1px solid #e5e7eb", padding: "44px 52px", boxShadow: "0 20px 70px rgba(15, 23, 42, 0.10)" }}>
        <div className="screen-only report-shell" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/av-logo-nav.png" alt="AI Vortex" className="screen-logo" />
            <div>
              <div style={{ color: "#92400e", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>AI Vortex Legal AI Risk</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Partner-ready print view. Use your browser print dialog to save as PDF.</div>
            </div>
          </div>
          <button className="print-button" style={{ border: "1px solid #111827", background: "#111827", color: "#fff", padding: "9px 12px", fontWeight: 800 }}>
            Print / Save PDF
          </button>
        </div>
        <div className="print-brand">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/av-logo-nav.png" alt="AI Vortex" className="brand-logo" />
              <div>
                <div className="brand-kicker">AI Vortex Legal AI Risk</div>
                <div className="brand-subtitle">Source-backed legal AI risk workflow artifact</div>
              </div>
            </div>
          </div>
          <div className="brand-date">{generated}</div>
        </div>
        <div className="artifact-body" dangerouslySetInnerHTML={{ __html: html }} />
        <footer>
          <div>
            <strong>AI Vortex by Manu Ayala.</strong>{" "}
            <a href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noreferrer">LinkedIn</a>
            <br />
            Public tracker evidence is a risk signal, not legal advice or a usage-adjusted incident rate.
          </div>
          <div className="export-cta">
            Remove AI Vortex branding: <a href="https://www.aivortex.io/legal#subscribe">Subscribe</a> or <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20Free%20or%20Firm-Branded%20Export%20Access">email Manu</a> for free access / firm branding.
          </div>
        </footer>
      </article>
      <script dangerouslySetInnerHTML={{ __html: "document.querySelector('.print-button')?.addEventListener('click',()=>window.print())" }} />
      <style>{`
        .print-brand { display: none; justify-content: space-between; gap: 20px; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 22px; }
        .screen-logo, .brand-logo { width: 28px; height: 28px; filter: brightness(0) saturate(100%); opacity: 0.92; }
        .brand-logo { width: 24px; height: 24px; }
        .brand-kicker { color: #92400e; font-size: 10px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; }
        .brand-subtitle, .brand-date { color: #64748b; font-size: 11px; margin-top: 4px; }
        .artifact-body h1 { font-size: 28px; line-height: 1.15; margin: 0 0 22px; color: #0f172a; }
        .artifact-body h2 { font-size: 16px; margin: 26px 0 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; color: #111827; }
        .artifact-body p { font-size: 13px; line-height: 1.55; margin: 8px 0; }
        .artifact-body li { font-size: 13px; line-height: 1.5; margin: 5px 0 5px 18px; }
        .artifact-body table { width: 100%; border-collapse: collapse; margin: 14px 0 18px; font-size: 11px; page-break-inside: avoid; }
        .artifact-body th, .artifact-body td { border: 1px solid #d1d5db; padding: 7px; text-align: left; vertical-align: top; }
        .artifact-body th { background: #f1f5f9; color: #334155; font-weight: 800; }
        .artifact-body .evidence-table { border: 1px solid #cbd5e1; background: #f8fafc; }
        .artifact-body .evidence-table th { background: #0f172a; color: #fff; border-color: #0f172a; }
        .artifact-body .evidence-table td:first-child { color: #475569; font-weight: 800; width: 34%; }
        .artifact-body .evidence-table td:last-child { color: #0f172a; font-weight: 800; }
        .artifact-body a { color: #0369a1; text-decoration: underline; overflow-wrap: anywhere; }
        .artifact-body .source-line { color: #475569; font-size: 12px; margin-left: 18px; }
        footer { border-top: 1px solid #e5e7eb; margin-top: 28px; padding-top: 12px; color: #64748b; font-size: 11px; display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
        footer strong { color: #111827; }
        footer a { color: #92400e; font-weight: 800; text-decoration: none; }
        .export-cta { text-align: right; max-width: 430px; color: #475569; line-height: 1.45; }
        .export-cta a { white-space: nowrap; }
        @media print {
          main { background: #fff !important; padding: 0 !important; }
          article { border: 0 !important; box-shadow: none !important; max-width: none !important; padding: 0 !important; }
          .screen-only { display: none !important; }
          .print-brand { display: flex !important; }
          .artifact-body h1 { font-size: 24px; }
          .artifact-body h2 { break-after: avoid; }
          footer { position: running(artifact-footer); }
        }
      `}</style>
    </main>
  );
}
