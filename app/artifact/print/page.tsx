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
  const shareUrl = `https://sanctions-tracker.vercel.app/artifact/print?${params.toString()}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(`AI Vortex Legal AI Risk - ${artifactParams.title || "Report"}`)}&body=${encodeURIComponent(`Here is the AI Vortex legal AI risk artifact:\n\n${shareUrl}`)}`;

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
          <div className="report-actions">
            <a className="email-button" href={emailHref}>Email report</a>
            <button className="print-button" style={{ border: "1px solid #111827", background: "#111827", color: "#fff", padding: "9px 12px", fontWeight: 800 }}>
              Print / Save PDF
            </button>
          </div>
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
        <footer className="artifact-footer">
          <div className="footer-left">
            <div className="footer-brand-line">
              <strong>AI Vortex by Manu Ayala</strong>
              <span aria-hidden="true">/</span>
              <a href="https://www.linkedin.com/in/aivortex/" target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
            <div className="footer-note">
              Public tracker evidence is a risk signal, not legal advice or a usage-adjusted incident rate.
            </div>
          </div>
          <div className="footer-right">
            <div className="footer-label">Unbranded / firm-branded exports</div>
            <div className="footer-links">
              <a href="https://www.aivortex.io/legal#subscribe">Subscribe</a>
              <span>or</span>
              <a href="mailto:manuel@aivortex.io?subject=AI%20Vortex%20Free%20or%20Firm-Branded%20Export%20Access">email Manu</a>
            </div>
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
        .report-actions { display: flex; align-items: center; gap: 8px; }
        .email-button { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; padding: 9px 11px; font-size: 12px; font-weight: 800; text-decoration: none; }
        .artifact-body h1 { font-size: 28px; line-height: 1.15; margin: 0 0 22px; color: #0f172a; }
        .artifact-body h2 { font-size: 16px; margin: 26px 0 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; color: #111827; }
        .artifact-body p { font-size: 13px; line-height: 1.55; margin: 8px 0; }
        .artifact-body li { font-size: 13px; line-height: 1.5; margin: 5px 0 5px 18px; }
        .artifact-body table { width: 100%; border-collapse: collapse; margin: 14px 0 18px; font-size: 11px; page-break-inside: avoid; }
        .artifact-body th, .artifact-body td { border: 1px solid #d1d5db; padding: 7px; text-align: left; vertical-align: top; }
        .artifact-body th { background: #f1f5f9; color: #334155; font-weight: 800; }
        .artifact-body .gate-table td:first-child { width: 16%; font-weight: 800; color: #0f172a; }
        .artifact-body .gate-table td:nth-child(3) { width: 18%; }
        .artifact-body .gate-table td:nth-child(4) { width: 9%; color: #475569; }
        .artifact-body .ledger-table { font-size: 9px; table-layout: fixed; }
        .artifact-body .ledger-table th, .artifact-body .ledger-table td { padding: 5px; overflow-wrap: anywhere; }
        .artifact-body .ledger-table th:first-child, .artifact-body .ledger-table td:first-child { width: 3%; text-align: center; }
        .artifact-body .ledger-table th:nth-child(2), .artifact-body .ledger-table td:nth-child(2) { width: 6%; }
        .artifact-body .ledger-table th:nth-child(3), .artifact-body .ledger-table td:nth-child(3) { width: 14%; }
        .artifact-body .ledger-table th:nth-child(4), .artifact-body .ledger-table td:nth-child(4) { width: 15%; }
        .artifact-body .ledger-table th:nth-child(5), .artifact-body .ledger-table td:nth-child(5) { width: 10%; }
        .artifact-body .ledger-table th:nth-child(9), .artifact-body .ledger-table td:nth-child(9) { width: 12%; }
        .artifact-body .ledger-table th:nth-child(10), .artifact-body .ledger-table td:nth-child(10) { width: 12%; }
        .evidence-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 14px 0 20px; page-break-inside: avoid; }
        .evidence-metric { border: 1px solid #cbd5e1; background: #f8fafc; padding: 11px 12px; min-height: 62px; display: flex; flex-direction: column; justify-content: space-between; }
        .evidence-metric span { color: #64748b; font-size: 10px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
        .evidence-metric strong { color: #0f172a; font-size: 13px; line-height: 1.25; margin-top: 8px; }
        .evidence-boundary { grid-column: 1 / -1; min-height: auto; background: #fff; }
        .evidence-boundary strong { font-size: 11px; color: #475569; }
        .artifact-body a { color: #0369a1; text-decoration: underline; overflow-wrap: anywhere; }
        .artifact-body .source-line { color: #475569; font-size: 12px; margin-left: 18px; }
        .artifact-footer { border-top: 2px solid #0f172a; margin-top: 32px; padding-top: 14px; color: #64748b; font-size: 11px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 28px; align-items: start; }
        .artifact-footer strong { color: #111827; }
        .artifact-footer a { color: #92400e; font-weight: 900; text-decoration: none; white-space: nowrap; }
        .footer-brand-line { display: flex; align-items: center; gap: 8px; color: #111827; font-weight: 700; }
        .footer-brand-line span { color: #cbd5e1; }
        .footer-note { max-width: 470px; margin-top: 7px; line-height: 1.45; }
        .footer-right { min-width: 265px; text-align: right; }
        .footer-label { color: #64748b; font-size: 9px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
        .footer-links { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 6px; color: #94a3b8; font-size: 12px; }
        @media print {
          main { background: #fff !important; padding: 0 !important; }
          article { border: 0 !important; box-shadow: none !important; max-width: none !important; padding: 0 !important; }
          .screen-only { display: none !important; }
          .print-brand { display: flex !important; }
          .artifact-body h1 { font-size: 24px; }
          .artifact-body h2 { break-after: avoid; }
          .artifact-body table { font-size: 10px; }
          .artifact-body .ledger-table { font-size: 8px; }
          .evidence-grid { gap: 8px; }
          .artifact-footer { position: running(artifact-footer); }
        }
        @media (max-width: 720px) {
          .evidence-grid { grid-template-columns: 1fr; }
          .artifact-footer { grid-template-columns: 1fr; }
          .footer-right { text-align: left; }
          .footer-links { justify-content: flex-start; }
        }
      `}</style>
    </main>
  );
}
