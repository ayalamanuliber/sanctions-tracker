import sanctionsRaw from "@/data/sanctions.json";
import metaRaw from "@/data/meta.json";
import type { PublicSanctionCase } from "@/lib/mcp/types";

type ArtifactFormat = "md" | "markdown" | "html" | "doc" | "word" | "pdf" | "docx";

const cases = (sanctionsRaw as unknown as PublicSanctionCase[]).slice().sort((a, b) => b.date.localeCompare(a.date));
const meta = metaRaw as {
  last_updated: string;
  total_cases: number;
};

function normalize(value: string | null): string | undefined {
  return value?.trim() || undefined;
}

export function getArtifactCases(params: {
  state?: string;
  court?: string;
  aiTool?: string;
  practiceArea?: string;
  limit?: number;
}): PublicSanctionCase[] {
  const { state, court, aiTool, practiceArea, limit = 100 } = params;
  return cases
    .filter((item) => {
      if (state && item.state !== state.toUpperCase()) return false;
      if (court && !item.court.toLowerCase().includes(court.toLowerCase())) return false;
      if (aiTool && !item.ai_tool_used.toLowerCase().includes(aiTool.toLowerCase())) return false;
      if (practiceArea) {
        const haystack = [item.legal_field_primary, item.legal_field_secondary, item.tags.join(" ")].join(" ");
        if (!haystack.toLowerCase().includes(practiceArea.toLowerCase())) return false;
      }
      return true;
    })
    .slice(0, Math.max(1, limit));
}

function countBy(values: string[]): Record<string, number> {
  return values.filter(Boolean).reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function rankedEntries(counts: Record<string, number>, limit = 6): [string, number][] {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function importantCases(caseItems: PublicSanctionCase[], limit = 5): PublicSanctionCase[] {
  const score = (item: PublicSanctionCase) => {
    const severity = { "career-ending": 5, high: 4, medium: 3, low: 1 }[item.severity] || 1;
    const money = item.amount ? Math.min(3, Math.ceil(item.amount / 10000)) : 0;
    const professional = item.sanction_types.some((type) =>
      ["professional", "bar-referral", "disqualification"].includes(type),
    )
      ? 2
      : 0;
    return severity + money + professional;
  };

  return caseItems.slice().sort((a, b) => score(b) - score(a) || b.date.localeCompare(a.date)).slice(0, limit);
}

function sourceCoverage(caseItems: PublicSanctionCase[]): string {
  const withSource = caseItems.filter((item) => item.source_url).length;
  const pct = caseItems.length > 0 ? Math.round((withSource / caseItems.length) * 100) : 0;
  return `${withSource}/${caseItems.length} (${pct}%)`;
}

function dateCoverage(caseItems: PublicSanctionCase[]): string {
  if (caseItems.length === 0) return "No matched cases";
  const dates = caseItems.map((item) => item.date).filter(Boolean).sort();
  return `${dates[0]} to ${dates[dates.length - 1]}`;
}

function failureTags(caseItems: PublicSanctionCase[]): string[] {
  const contextTags = new Set([
    "trial",
    "appellate",
    "pro-se",
    "small-firm",
    "biglaw",
    "civil",
    "criminal",
    "employment",
    "contract",
    "tort",
    "family",
    "bankruptcy",
    "immigration",
    "civil-rights",
    "ip",
    "administrative",
    "other",
  ]);

  return caseItems.flatMap((item) => item.tags).filter((tag) => !contextTags.has(tag));
}

function controls(caseItems: PublicSanctionCase[]): string[] {
  const tags = new Set(caseItems.flatMap((item) => item.tags));
  const gaps = new Set(caseItems.flatMap((item) => item.policy_gap_ids));
  const rows = new Set<string>();

  if (tags.has("fake-citations") || gaps.has("citation-verification")) {
    rows.add("Verify every cited authority in a primary legal research source before filing.");
  }
  if (tags.has("fabricated-quotes") || tags.has("misrepresented-authority") || gaps.has("authority-support-verification")) {
    rows.add("Compare every quotation and cited proposition against the actual source text.");
  }
  if (gaps.has("supervision-protocol") || tags.has("bar-referral")) {
    rows.add("Require supervising attorney signoff for court-facing AI-assisted work.");
  }
  if (gaps.has("audit-trail")) {
    rows.add("Save a matter-level verification note with reviewer, date, tool used, and unresolved issues.");
  }
  return [...rows].slice(0, 5);
}

export function buildArtifactMarkdown(params: {
  type?: string;
  title?: string;
  audience?: string;
  state?: string;
  court?: string;
  aiTool?: string;
  practiceArea?: string;
  caseItems?: PublicSanctionCase[];
}): string {
  const type = params.type || "report";
  const caseItems = params.caseItems || getArtifactCases({
    state: params.state,
    court: params.court,
    aiTool: params.aiTool,
    practiceArea: params.practiceArea,
  });
  const title =
    params.title ||
    (type === "ledger"
      ? "AI Filing Verification Ledger"
      : type === "source"
        ? "AI Vortex Source Appendix"
        : type === "package"
          ? "AI Vortex Implementation Package"
          : "AI Filing Risk Report");

  if (type === "ledger") {
    return [
      `# ${title}`,
      "",
      `Court/matter: ${params.court || "__________"}`,
      `AI tools: ${params.aiTool || "__________"}`,
      "",
      "| # | Draft page | Citation / quote / proposition | Source checked | AI touched? | Exists? | Pincite correct? | Quote exact? | Supports proposition? | Status | Reviewer |",
      "| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      "| 1 |  |  |  | Yes / No / Unknown | Yes / No | Yes / No / N.A. | Yes / No / N.A. | Yes / No | Verified / Fix / Remove / Escalate |  |",
      "| 2 |  |  |  | Yes / No / Unknown | Yes / No | Yes / No / N.A. | Yes / No / N.A. | Yes / No | Verified / Fix / Remove / Escalate |  |",
      "| 3 |  |  |  | Yes / No / Unknown | Yes / No | Yes / No / N.A. | Yes / No / N.A. | Yes / No | Verified / Fix / Remove / Escalate |  |",
      "",
      "## Signing Attorney Exception Report",
      "- Citations checked: ___ / ___",
      "- Quotes checked: ___ / ___",
      "- Propositions checked: ___ / ___",
      "- Items corrected: ___",
      "- Items removed: ___",
      "- Items escalated: ___",
      "- Court/judge AI rule checked: Yes / No",
      "- Disclosure/certification needed: Yes / No / Unclear",
      "- Recommendation: File / File after edits / Do not file yet",
    ].join("\n");
  }

  if (type === "opposing") {
    return [
      `# ${title}`,
      "",
      `Audience: ${params.audience || "litigation team"}`,
      `Scope: ${[params.court, params.state, params.aiTool, params.practiceArea].filter(Boolean).join(" / ") || "opposing filing integrity review"}`,
      "",
      "## Guardrail",
      "Do not allege that opposing counsel used AI unless there is independent evidence. Focus on verified citation, quote, and proposition discrepancies.",
      "",
      "## Discrepancy Matrix",
      "| Item | Citation / quote | Problem type | Verification step | Severity | Evidence needed | Recommended action |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      "| 1 |  | fake_case / fake_quote / unsupported_proposition / bad_pincite / unclear | Check primary source and cited page | low / medium / high / critical | Filed brief, source PDF, quote comparison | Correct request / meet-and-confer / court notice |",
      "| 2 |  | fake_case / fake_quote / unsupported_proposition / bad_pincite / unclear | Check proposition support | low / medium / high / critical | Source text and brief excerpt | Preserve and escalate proportionally |",
      "",
      "## Preservation Steps",
      "- Save the filed brief exactly as filed.",
      "- Save PDFs or screenshots of each cited authority checked.",
      "- Create a side-by-side quote/proposition comparison.",
      "- Preserve meet-and-confer correspondence and timestamps.",
      "- Keep the review neutral until the evidentiary record is clean.",
      "",
      "## Meet-and-Confer Draft",
      "Counsel, we are reviewing the authorities cited at [pages/sections]. We have not been able to locate the quoted language/proposition in the cited opinions. Please identify the source text or confirm whether a correction is needed by [date/time]. We are not making assumptions about how the issue arose; we are asking to resolve the authority discrepancy before raising it with the Court.",
      "",
      "## Escalation Matrix",
      "- Minor or isolated mismatch: request correction and preserve the record.",
      "- Material quote/proposition problem: meet and confer, then seek leave or file a narrow notice if unresolved.",
      "- Nonexistent authority or repeated fabricated text: prepare a targeted motion/OSC request focused on verified discrepancies.",
      "- Bad-faith denial after notice: consider sanctions only with a clean evidentiary record.",
      "",
      "## Source-Backed Examples",
      ...importantCases(caseItems, 5).map(
        (item) =>
          `- ${item.case_name} (${item.date}, ${item.court}): ${item.severity}; ${item.sanction_types.join(", ") || "no sanction listed"}${item.amount_display ? ` / ${item.amount_display}` : ""}\n  Source: ${item.source_url || "Unavailable"}`,
      ),
    ].join("\n");
  }

  const failures = rankedEntries(countBy(failureTags(caseItems)), 6);
  const gaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 6);
  const examples = importantCases(caseItems, type === "source" ? 12 : 5);

  return [
    `# ${title}`,
    "",
    `Audience: ${params.audience || "legal professional"}`,
    `Scope: ${[params.court, params.state, params.aiTool, params.practiceArea].filter(Boolean).join(" / ") || "matched corpus"}`,
    "",
    "## Evidence Note",
    `- Corpus: AI Vortex legal AI risk tracker, ${meta.total_cases.toLocaleString("en-US")} tracked global matters`,
    `- Corpus last updated: ${meta.last_updated}`,
    `- Matched set: ${caseItems.length} cases`,
    `- Date coverage: ${dateCoverage(caseItems)}`,
    `- Source-link coverage: ${sourceCoverage(caseItems)}`,
    "- Boundary: tracked public incidents are evidence of observed risk patterns, not usage-adjusted incident rates or legal advice.",
    ...(caseItems.length === 0 ? ["- Warning: this artifact has no matched cases under the current filters. Broaden filters before treating it as complete."] : []),
    "",
    ...(type === "package"
      ? [
          "## Package Contents",
          "1. Leadership readout",
          "2. Filing workflow",
          "3. Verification ledger",
          "4. Source appendix",
          "5. 7-day pilot and 30-day rollout plan",
          "",
        ]
      : []),
    "## Priority Controls",
    ...controls(caseItems).map((item) => `- ${item}`),
    "",
    "## Observed Signals",
    ...failures.map(([label, count]) => `- ${label}: ${count}`),
    ...gaps.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "## Source-Backed Examples",
    ...examples.map(
      (item) =>
        `- ${item.case_name} (${item.date}, ${item.court}): ${item.severity}; ${item.sanction_types.join(", ") || "no sanction listed"}${item.amount_display ? ` / ${item.amount_display}` : ""}\n  Source: ${item.source_url || "Unavailable"}`,
    ),
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html = lines
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (line.startsWith("|")) return `<pre>${escapeHtml(line)}</pre>`;
      if (!line.trim()) return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");

  return `<!doctype html><html><head><meta charset="utf-8"><title>AI Vortex Artifact</title><style>body{font-family:Arial,sans-serif;line-height:1.45;max-width:900px;margin:40px auto;padding:0 24px;color:#111827}h1{font-size:28px}h2{font-size:18px;margin-top:28px}pre{background:#f3f4f6;padding:8px;white-space:pre-wrap}li{margin:6px 0}</style></head><body>${html}</body></html>`;
}

export function unsupportedArtifactMessage(format: string): string {
  return [
    `Unsupported artifact format: ${format}`,
    "",
    "DOCX export is not available yet. Supported formats are:",
    "- Markdown: format=md",
    "- HTML: format=html",
    "- Word-compatible HTML document: format=doc",
    "- Basic PDF: format=pdf",
    "",
    "Use format=doc for a Word-compatible file, or format=md for clean copy/paste into Word or Google Docs.",
  ].join("\n");
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function markdownToBasicPdf(markdown: string): Uint8Array {
  const text = markdown
    .replace(/^#+\s+/gm, "")
    .replace(/\|/g, " ")
    .split("\n")
    .flatMap((line) => {
      const clean = line.trim();
      if (!clean) return [""];
      const chunks: string[] = [];
      for (let index = 0; index < clean.length; index += 95) chunks.push(clean.slice(index, index + 95));
      return chunks;
    })
    .slice(0, 58);
  const content = [
    "BT",
    "/F1 10 Tf",
    "50 760 Td",
    ...text.flatMap((line, index) => [
      index === 0 ? "" : "0 -12 Td",
      `(${pdfEscape(line)}) Tj`,
    ]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function artifactFilename(type: string, format: ArtifactFormat, state?: string): string {
  const extension = format === "pdf" ? "pdf" : format === "doc" || format === "word" ? "doc" : format === "html" ? "html" : "md";
  return `ai-vortex-${type || "artifact"}${state ? `-${state.toLowerCase()}` : ""}.${extension}`;
}

export function readArtifactParams(searchParams: URLSearchParams) {
  return {
    type: normalize(searchParams.get("type")) || "report",
    title: normalize(searchParams.get("title")),
    audience: normalize(searchParams.get("audience")),
    state: normalize(searchParams.get("state"))?.toUpperCase(),
    court: normalize(searchParams.get("court")),
    aiTool: normalize(searchParams.get("ai_tool")),
    practiceArea: normalize(searchParams.get("practice_area")),
    format: (normalize(searchParams.get("format")) || "md") as ArtifactFormat,
  };
}
