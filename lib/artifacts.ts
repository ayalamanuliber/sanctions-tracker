import sanctionsRaw from "@/data/sanctions.json";
import metaRaw from "@/data/meta.json";
import { matchesCourt, matchesTool } from "@/lib/filtering";
import type { PublicSanctionCase } from "@/lib/mcp/types";

type ArtifactFormat = "md" | "markdown" | "html" | "doc" | "word" | "pdf" | "pdf-ready" | "word-ready" | "csv" | "xlsx" | "docx";

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
      if (court && !matchesCourt(item.court, court)) return false;
      if (aiTool && !matchesTool(item.ai_tool_used, aiTool, item.summary)) return false;
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

function evidenceTable(caseItems: PublicSanctionCase[]): string[] {
  return [
    "## Evidence At A Glance",
    "| Signal | Value |",
    "| --- | ---: |",
    `| Corpus | ${meta.total_cases.toLocaleString("en-US")} tracked global matters |`,
    `| Tracker updated | ${meta.last_updated} |`,
    `| Matched set | ${caseItems.length} cases |`,
    `| Date coverage | ${dateCoverage(caseItems)} |`,
    `| Source-link coverage | ${sourceCoverage(caseItems)} |`,
    "| Boundary | Public incidents; not usage-adjusted rates or legal advice |",
  ];
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
          : type === "policy"
            ? "One-Page Court-Facing AI Filing Policy"
            : type === "prefiling"
              ? "Emergency Pre-Filing AI Risk Packet"
              : type === "visual"
                ? "Managing Partner Legal AI Risk Visual Summary"
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

  if (type === "policy") {
    return [
      `# ${title}`,
      "",
      `Audience: ${params.audience || "legal professional"}`,
      `Scope: ${[params.court, params.state, params.aiTool, params.practiceArea].filter(Boolean).join(" / ") || "court-facing litigation work"}`,
      "",
      "## Policy Statement",
      "AI tools may assist with research, drafting, summarizing, organization, and internal preparation, but AI output is never legal authority. No court-facing filing may rely on AI-assisted citations, quotations, or legal propositions unless they have been independently verified against an authoritative source.",
      "",
      "## Required Filing Gate",
      "Before any AI-assisted motion, brief, letter, declaration, or other court-facing filing is submitted, the responsible attorney must ensure that:",
      "1. Every cited authority exists exactly as cited.",
      "2. Every pincite is accurate.",
      "3. Every quotation matches the source text.",
      "4. Every cited authority supports the proposition for which it is used.",
      "5. Any court, judge, standing-order, or local-rule AI disclosure requirement has been checked.",
      "6. A short verification record is saved to the matter file.",
      "",
      "## Verification Record",
      "The matter file should identify the AI tools used, what AI touched, who verified the filing, the date of verification, unresolved exceptions, and the final disposition of any corrected or removed authority.",
      "",
      "## Escalation Rule",
      "If a fake citation, fabricated quotation, unsupported proposition, or unclear authority is found before filing, the team must pause filing on that language, preserve the draft/version history, notify the supervising attorney, and correct, remove, or escalate the issue before signature.",
      "",
      ...evidenceTable(caseItems),
      "",
      "## Source-Backed Examples",
      ...importantCases(caseItems, 3).map(
        (item) =>
          `- ${item.case_name} (${item.date}, ${item.court}): ${item.severity}; ${item.sanction_types.join(", ") || "no sanction listed"}${item.amount_display ? ` / ${item.amount_display}` : ""}\n  Source: ${item.source_url || "Unavailable"}`,
      ),
    ].join("\n");
  }

  const failures = rankedEntries(countBy(failureTags(caseItems)), 6);
  const gaps = rankedEntries(countBy(caseItems.flatMap((item) => item.policy_gap_ids)), 6);
  const examples = importantCases(caseItems, type === "source" ? 12 : 5);

  if (type === "prefiling") {
    return [
      `# ${title}`,
      "",
      `Matter: ${[params.court, params.state].filter(Boolean).join(" / ") || "court-facing filing"}`,
      `AI tools used for internal review: ${params.aiTool || "__________"}`,
      "Urgency: filing window imminent",
      "",
      "Prepared for: Litigation team / responsible attorney",
      "Use: Pre-filing AI-assisted citation, quote, and proposition verification",
      "",
      "## Tonight's Decision Rule",
      "Do not keep editing substance until the verification ledger is complete. Any citation, quotation, pincite, or legal proposition that cannot be verified before filing must be corrected, removed, or escalated to the signing attorney.",
      "",
      "## Emergency Filing Gate",
      "| Gate | Required action | Owner | Status |",
      "| --- | --- | --- | --- |",
      "| Freeze draft | Save the version being checked before further edits | Responsible attorney | Pending |",
      "| Extract authority | Pull every citation, pincite, quote, and AI-assisted proposition into the ledger | Associate/verifier | Pending |",
      "| Citation check | Confirm each authority exists exactly as cited | Verifier | Pending |",
      "| Quote check | Match quoted text word-for-word to the source and pincite | Verifier | Pending |",
      "| Proposition check | Confirm the cited authority supports the sentence it is attached to | Verifier | Pending |",
      "| Disclosure check | Review court, judge, standing-order, local-rule, and client requirements | Responsible attorney | Pending |",
      "| Signoff | Signing attorney reviews unresolved exceptions and final recommendation | Signing attorney | Pending |",
      "",
      "## Verification Ledger",
      "Use this compact ledger for the PDF packet. Use the CSV ledger for line-by-line working review.",
      "| # | Draft page | Item to verify | Source checked | Verification result | Status | Reviewer |",
      "| ---: | --- | --- | --- | --- | --- | --- |",
      "| 1 |  | Citation / quote / proposition | Westlaw / Lexis / Bloomberg / PACER / official source | Exists / quote exact / proposition supported | Verified / Corrected / Removed / Escalated |  |",
      "| 2 |  | Citation / quote / proposition | Westlaw / Lexis / Bloomberg / PACER / official source | Exists / quote exact / proposition supported | Verified / Corrected / Removed / Escalated |  |",
      "| 3 |  | Citation / quote / proposition | Westlaw / Lexis / Bloomberg / PACER / official source | Exists / quote exact / proposition supported | Verified / Corrected / Removed / Escalated |  |",
      "",
      "Working-file note: the full ledger should separately track AI-touched status, pincite accuracy, quote exactness, and proposition support for each authority.",
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
      "",
      ...evidenceTable(caseItems),
      "",
      "## Source-Backed Examples",
      ...importantCases(caseItems, 3).map(
        (item) =>
          `- ${item.case_name} (${item.date}, ${item.court}): ${item.severity}; ${item.sanction_types.join(", ") || "no sanction listed"}${item.amount_display ? ` / ${item.amount_display}` : ""}\n  Source: ${item.source_url || "Unavailable"}`,
      ),
    ].join("\n");
  }

  if (type === "visual") {
    const severity = countBy(caseItems.map((item) => item.severity));
    const failureModes = rankedEntries(countBy(failureTags(caseItems)), 6);
    const sourceCount = caseItems.filter((item) => item.source_url).length;
    const lawyer = caseItems.filter((item) => item.party?.toLowerCase().includes("lawyer")).length;
    const proSe = caseItems.filter((item) => item.party?.toLowerCase().includes("pro se")).length;
    const monetary = caseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    return [
      `# ${title}`,
      "",
      `Audience: ${params.audience || "managing partner"}`,
      `Scope: ${[params.court, params.state, params.aiTool, params.practiceArea].filter(Boolean).join(" / ") || "matched corpus"}`,
      "",
      "## Executive Readout",
      "The observed risk is not AI use in the abstract. The observed risk is unverified AI-assisted authority reaching court-facing work. The management control is a filing gate: citation existence, quote accuracy, proposition support, disclosure check, and signing-attorney certification.",
      "",
      "## Executive Cards",
      "| Metric | Value |",
      "| --- | ---: |",
      `| Matched matters | ${caseItems.length} |`,
      `| Source-linked coverage | ${caseItems.length ? `${Math.round((sourceCount / caseItems.length) * 100)}%` : "0%"} |`,
      `| Lawyer-related matters | ${lawyer} |`,
      `| Pro se matters | ${proSe} |`,
      `| Known monetary sanctions | ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(monetary)} |`,
      "",
      "## Severity Breakdown",
      "| Severity | Count |",
      "| --- | ---: |",
      `| Low | ${severity.low || 0} |`,
      `| Medium | ${severity.medium || 0} |`,
      `| High | ${severity.high || 0} |`,
      `| Career-ending | ${severity["career-ending"] || 0} |`,
      "",
      "## Main Failure Modes",
      "| Failure mode | Count |",
      "| --- | ---: |",
      ...failureModes.map(([label, count]) => `| ${label.replace(/-/g, " ")} | ${count} |`),
      "",
      "## Top Source-Backed Matters",
      "| Date | Case | Court | Severity | Signal | Source |",
      "| --- | --- | --- | --- | --- | --- |",
      ...importantCases(caseItems, 5).map(
        (item) =>
          `| ${item.date} | ${item.case_name} | ${item.court} | ${item.severity} | ${item.sanction_types.join(", ") || "tracked matter"}${item.amount_display ? ` / ${item.amount_display}` : ""} | ${item.source_url || "Unavailable"} |`,
      ),
      "",
      "## Management Action",
      "- Adopt the pre-filing verification ledger for all AI-assisted court-facing filings.",
      "- Require signing-attorney review of unresolved exceptions, not the entire verification history.",
      "- Keep the source appendix with the matter or training file so the risk signal is auditable.",
      "",
      ...evidenceTable(caseItems),
    ].join("\n");
  }

  return [
    `# ${title}`,
    "",
    `Audience: ${params.audience || "legal professional"}`,
    `Scope: ${[params.court, params.state, params.aiTool, params.practiceArea].filter(Boolean).join(" / ") || "matched corpus"}`,
    "",
    ...evidenceTable(caseItems),
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

function linkifyEscaped(value: string): string {
  return escapeHtml(value).replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" target="_blank" rel="noreferrer">open source</a>`,
  );
}

export function markdownToBodyHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let index = 0;
  let lastHeading = "";

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const rows = tableLines
        .map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()))
        .filter((cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
      const [head, ...body] = rows;
      if (head) {
        if (lastHeading === "Evidence At A Glance") {
          html.push('<div class="evidence-grid">');
          body.forEach(([label, value]) => {
            const isBoundary = label === "Boundary";
            html.push(
              `<div class="evidence-metric${isBoundary ? " evidence-boundary" : ""}"><span>${linkifyEscaped(label)}</span><strong>${linkifyEscaped(value || "")}</strong></div>`,
            );
          });
          html.push("</div>");
          continue;
        }
        const tableClasses = [
          lastHeading === "Verification Ledger" ? "ledger-table" : "",
          lastHeading === "Emergency Filing Gate" ? "gate-table" : "",
          lastHeading === "Top Source-Backed Matters" ? "source-table" : "",
        ].filter(Boolean);
        const tableClass = tableClasses.length ? ` class="${tableClasses.join(" ")}"` : "";
        html.push(`<table${tableClass}>`);
        html.push(`<thead><tr>${head.map((cell) => `<th>${linkifyEscaped(cell)}</th>`).join("")}</tr></thead>`);
        html.push("<tbody>");
        body.forEach((row) => html.push(`<tr>${row.map((cell) => `<td>${linkifyEscaped(cell)}</td>`).join("")}</tr>`));
        html.push("</tbody></table>");
      }
      continue;
    }

    if (line.startsWith("# ")) {
      lastHeading = line.slice(2);
      html.push(`<h1>${escapeHtml(lastHeading)}</h1>`);
    } else if (line.startsWith("## ")) {
      lastHeading = line.slice(3);
      html.push(`<h2>${escapeHtml(lastHeading)}</h2>`);
    }
    else if (line.startsWith("- ")) html.push(`<li>${linkifyEscaped(line.slice(2))}</li>`);
    else if (/^Source:\s+https?:\/\//.test(line)) html.push(`<p class="source-line"><strong>Source:</strong> ${linkifyEscaped(line.replace(/^Source:\s+/, ""))}</p>`);
    else if (!line.trim()) html.push("");
    else html.push(`<p>${linkifyEscaped(line)}</p>`);

    index += 1;
  }

  return html.join("\n");
}

export function markdownToHtml(markdown: string): string {
  const html = markdownToBodyHtml(markdown);

  return `<!doctype html><html><head><meta charset="utf-8"><title>AI Vortex Artifact</title><style>body{font-family:Arial,sans-serif;line-height:1.45;max-width:900px;margin:40px auto;padding:0 24px;color:#111827}h1{font-size:28px}h2{font-size:18px;margin-top:28px}table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}th,td{border:1px solid #d1d5db;padding:7px;text-align:left;vertical-align:top}th{background:#f3f4f6}li{margin:6px 0}a{color:#0369a1}</style></head><body>${html}</body></html>`;
}

export function buildArtifactCsv(params: {
  type?: string;
  state?: string;
  court?: string;
  aiTool?: string;
  practiceArea?: string;
  caseItems?: PublicSanctionCase[];
}): string {
  const caseItems = params.caseItems || getArtifactCases({
    state: params.state,
    court: params.court,
    aiTool: params.aiTool,
    practiceArea: params.practiceArea,
  });
  const rows = [
    ["item", "citation_or_quote", "source_checked", "ai_touched", "exists", "pincite_correct", "quote_exact", "supports_proposition", "status", "reviewer"],
    ["1", "", "", "Yes / No / Unknown", "Yes / No", "Yes / No / N.A.", "Yes / No / N.A.", "Yes / No", "Verified / Fix / Remove / Escalate", ""],
    ["2", "", "", "Yes / No / Unknown", "Yes / No", "Yes / No / N.A.", "Yes / No / N.A.", "Yes / No", "Verified / Fix / Remove / Escalate", ""],
    [],
    ["source_case", "date", "court", "severity", "source_url"],
    ...caseItems.slice(0, 20).map((item) => [item.case_name, item.date, item.court, item.severity, item.source_url || ""]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function unsupportedArtifactMessage(format: string): string {
  return [
    `Unsupported artifact format: ${format}`,
    "",
    "Native DOCX/XLSX export is not available yet. Supported formats are:",
    "- Markdown: format=md",
    "- Browser print view: /artifact/print?...",
    "- Word-compatible HTML/text: format=word-ready",
    "- CSV ledger/table: format=csv",
    "- HTML: format=html",
    "- Word-compatible HTML document: format=doc",
    "- Basic PDF: format=pdf",
    "",
    "For legal users, use the browser print view to save as PDF or format=word-ready for an editable Word-compatible HTML file.",
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
  const extension =
    format === "pdf" ? "pdf" :
    format === "doc" || format === "word" || format === "word-ready" ? "html" :
    format === "html" ? "html" :
    format === "csv" ? "csv" :
    "md";
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
