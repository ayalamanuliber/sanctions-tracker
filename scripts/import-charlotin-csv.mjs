import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const csvUrl =
  process.env.CHARLOTIN_CSV_URL ||
  "https://www.damiencharlotin.com/hallucinations/hallucinations/download.csv";
const sourceFile = process.env.CHARLOTIN_CSV_FILE || "";

const stateByName = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  Guam: "GU",
  "Puerto Rico": "PR",
  "Northern Mariana Islands": "MP",
};

const districtState = {
  Ala: "AL",
  Alaska: "AK",
  Ariz: "AZ",
  Ark: "AR",
  Cal: "CA",
  Colo: "CO",
  Conn: "CT",
  Del: "DE",
  Fla: "FL",
  Ga: "GA",
  Guam: "GU",
  Haw: "HI",
  Idaho: "ID",
  Ill: "IL",
  Ind: "IN",
  Iowa: "IA",
  Kan: "KS",
  Ky: "KY",
  La: "LA",
  Maine: "ME",
  Md: "MD",
  Mass: "MA",
  Mich: "MI",
  Minn: "MN",
  Miss: "MS",
  Mo: "MO",
  Mont: "MT",
  Neb: "NE",
  Nev: "NV",
  "N.H": "NH",
  "N.J": "NJ",
  "N.M": "NM",
  "N.Y": "NY",
  "N.C": "NC",
  "N.D": "ND",
  Ohio: "OH",
  Okla: "OK",
  Or: "OR",
  Pa: "PA",
  "P.R": "PR",
  "R.I": "RI",
  "S.C": "SC",
  "S.D": "SD",
  Tenn: "TN",
  Tex: "TX",
  Utah: "UT",
  Vt: "VT",
  Va: "VA",
  Wash: "WA",
  "W. Va": "WV",
  Wis: "WI",
  Wyo: "WY",
};

const stateFromAbbrev = Object.fromEntries(Object.values(stateByName).map((code) => [code, code]));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...body] = rows.filter((item) => item.some(Boolean));
  return body.map((item) =>
    Object.fromEntries(headers.map((header, index) => [header, item[index] || ""])),
  );
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function normalizeCountry(value) {
  const cleaned = value.trim();
  if (cleaned === "USA") return "US";
  if (cleaned === "UK") return "GB";
  if (cleaned === "UAE") return "AE";
  return cleaned || "UNKNOWN";
}

function inferCircuit(court) {
  const value = court.toLowerCase();
  const direct = value.match(/\b([1-9]|1[0-1])(st|nd|rd|th)?\s+cir/);
  if (direct) return `${direct[1]}${direct[1] === "1" ? "st" : direct[1] === "2" ? "nd" : direct[1] === "3" ? "rd" : "th"} Circuit`;
  if (value.includes("fed. cir")) return "Federal Circuit";
  if (value.includes("d.c. cir")) return "D.C. Circuit";

  const state = inferState(court, "US");
  const circuits = {
    CT: "2nd Circuit",
    NY: "2nd Circuit",
    VT: "2nd Circuit",
    DE: "3rd Circuit",
    NJ: "3rd Circuit",
    PA: "3rd Circuit",
    MD: "4th Circuit",
    NC: "4th Circuit",
    SC: "4th Circuit",
    VA: "4th Circuit",
    WV: "4th Circuit",
    LA: "5th Circuit",
    MS: "5th Circuit",
    TX: "5th Circuit",
    KY: "6th Circuit",
    MI: "6th Circuit",
    OH: "6th Circuit",
    TN: "6th Circuit",
    IL: "7th Circuit",
    IN: "7th Circuit",
    WI: "7th Circuit",
    AR: "8th Circuit",
    IA: "8th Circuit",
    MN: "8th Circuit",
    MO: "8th Circuit",
    NE: "8th Circuit",
    ND: "8th Circuit",
    SD: "8th Circuit",
    AK: "9th Circuit",
    AZ: "9th Circuit",
    CA: "9th Circuit",
    HI: "9th Circuit",
    ID: "9th Circuit",
    MT: "9th Circuit",
    NV: "9th Circuit",
    OR: "9th Circuit",
    WA: "9th Circuit",
    GU: "9th Circuit",
    MP: "9th Circuit",
    CO: "10th Circuit",
    KS: "10th Circuit",
    NM: "10th Circuit",
    OK: "10th Circuit",
    UT: "10th Circuit",
    WY: "10th Circuit",
    AL: "11th Circuit",
    FL: "11th Circuit",
    GA: "11th Circuit",
    DC: "D.C. Circuit",
  };

  return circuits[state] || null;
}

function inferState(court, country) {
  if (country !== "US") return "";
  const value = court.replace(/\./g, "").replace(/\s+/g, " ").trim();

  const caAbbrevMatch = value.match(/^CA\s+([A-Z]{2})\b/);
  if (caAbbrevMatch && stateFromAbbrev[caAbbrevMatch[1]]) return stateFromAbbrev[caAbbrevMatch[1]];

  const caMatch = value.match(/^CA\s+([A-Za-z ]+?)(?:\s+\(|$)/);
  if (caMatch && stateByName[caMatch[1].trim()]) return stateByName[caMatch[1].trim()];

  for (const [name, code] of Object.entries(stateByName)) {
    if (new RegExp(`\\b${name.replace(/ /g, "\\s+")}\\b`, "i").test(court)) return code;
  }

  for (const [abbr, code] of Object.entries(stateFromAbbrev)) {
    if (new RegExp(`\\b${abbr}\\b`).test(court)) return code;
  }

  const district = court.match(/\b(?:[ENDS]\.D\.|D\.)\s+([A-Z][A-Za-z. ]+)/);
  if (district) {
    const key = district[1].replace(/\.$/, "").trim();
    for (const [needle, code] of Object.entries(districtState)) {
      if (key.startsWith(needle)) return code;
    }
  }

  return "";
}

function parseAmount(value) {
  const match = value.match(/([\d,.]+)\s*([A-Z]{3})?/);
  if (!match) return { amount: null, display: "", raw: value };
  const amount = Number(match[1].replace(/,/g, ""));
  const currency = match[2] || "USD";
  const display = currency === "USD" ? `$${amount >= 1000 ? `${(amount / 1000).toFixed(1)}K` : amount}` : `${amount} ${currency}`;
  return { amount: currency === "USD" ? amount : null, display, raw: value };
}

function splitItems(value) {
  return value
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferTags(row) {
  const tags = new Set();
  const text = `${row["Hallucination Items"]} ${row.Outcome} ${row["Party(ies)"]} ${row["Legal Field Primary"]} ${row["Legal Field Secondary"]}`.toLowerCase();

  if (text.includes("pro se")) tags.add("pro-se");
  if (text.includes("fabricated") || text.includes("nonexistent")) tags.add("fake-citations");
  if (text.includes("false quotes") || text.includes("quotation") || text.includes("quoted")) tags.add("fabricated-quotes");
  if (text.includes("misrepresented")) tags.add("misrepresented-authority");
  if (text.includes("bar referral") || text.includes("disciplinary")) tags.add("bar-referral");
  if (text.includes("published")) tags.add("published-opinion");
  if (text.includes("disqualification") || text.includes("disqualified")) tags.add("disqualification");
  if (row["Legal Field Primary"]) tags.add(slugify(row["Legal Field Primary"]));
  if (row.Court.toLowerCase().includes("ca ") || row.Court.toLowerCase().includes("cir")) tags.add("appellate");
  else tags.add("trial");

  return [...tags];
}

function inferSanctionTypes(row) {
  const result = new Set();
  const outcome = row.Outcome.toLowerCase();
  const amount = row["Monetary Penalty"].trim();
  const professional = row["Professional Sanction"].toLowerCase() === "yes";

  if (amount || outcome.includes("monetary") || outcome.includes("cost")) result.add("monetary");
  if (outcome.includes("warning") || outcome.includes("admonish")) result.add("warning");
  if (outcome.includes("order to show cause")) result.add("ordered-to-show-cause");
  if (outcome.includes("order to explain")) result.add("ordered-to-explain");
  if (outcome.includes("struck") || outcome.includes("strike")) result.add("struck-filing");
  if (outcome.includes("dismiss")) result.add("case-dismissed");
  if (outcome.includes("referral") || outcome.includes("bar")) result.add("bar-referral");
  if (outcome.includes("suspension") || outcome.includes("revoked") || professional) result.add("professional");
  if (outcome.includes("disqual")) result.add("disqualification");
  if (outcome.includes("no sanction") || result.size === 0) result.add("none-adjudicated");

  return [...result];
}

function inferSeverity(row, amount) {
  const outcome = row.Outcome.toLowerCase();
  const professional = row["Professional Sanction"].toLowerCase() === "yes";

  if (
    outcome.includes("suspension") ||
    outcome.includes("revoked pro hac") ||
    outcome.includes("disqual") ||
    outcome.includes("dismissed with prejudice")
  ) {
    return "career-ending";
  }

  if (professional || amount >= 10000 || outcome.includes("bar referral") || outcome.includes("public reprimand")) {
    return "high";
  }

  if (amount > 0 || outcome.includes("order to show cause") || outcome.includes("struck") || outcome.includes("monetary")) {
    return "medium";
  }

  return "low";
}

function inferPolicyGaps(row) {
  const gaps = new Set();
  const text = `${row["Hallucination Items"]} ${row.Outcome}`.toLowerCase();
  if (text.includes("fabricated") || text.includes("nonexistent")) gaps.add("citation-verification");
  if (text.includes("false quote") || text.includes("quotation") || text.includes("misrepresented")) gaps.add("authority-support-verification");
  if (text.includes("disclosure") || text.includes("certif")) gaps.add("disclosure-compliance");
  if (text.includes("supervis") || text.includes("client") || text.includes("firmwide")) gaps.add("supervision-protocol");
  if (text.includes("sanction") || text.includes("referral") || text.includes("reprimand")) gaps.add("incident-response");
  return [...gaps];
}

function buildSummary(row) {
  const items = splitItems(row["Hallucination Items"]);
  const first = items[0] || "";
  const outcome = row.Outcome ? ` Outcome: ${row.Outcome}.` : "";
  const details = row.Details ? ` ${row.Details}` : "";
  return `${first}${outcome}${details}`.trim();
}

function buildSourceUrl(row) {
  const raw = row.Source.trim();
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `https://www.damiencharlotin.com${raw}`;
  return raw;
}

function weekKey(date) {
  const d = new Date(`${date}T00:00:00Z`);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildMeta(cases) {
  const usCases = cases.filter((item) => item.country === "US");
  const amounts = cases.map((item) => item.amount).filter((amount) => Number.isFinite(amount));
  const byState = Object.entries(countBy(usCases, (item) => item.state))
    .map(([state, count]) => {
      const stateCases = usCases.filter((item) => item.state === state);
      return {
        state,
        count,
        total: stateCases.reduce((sum, item) => sum + (item.amount || 0), 0),
        severities: countBy(stateCases, (item) => item.severity),
        cases: stateCases.slice(0, 50).map((item) => ({
          id: item.id,
          name: item.case_name,
          court: item.court,
          judge: "",
          date: item.date,
          amount: item.amount,
          amount_display: item.amount_display,
          severity: item.severity,
          tool: item.ai_tool_used,
          summary: item.summary,
          sanction_types: item.sanction_types,
          tags: item.tags,
          source_url: item.source_url,
        })),
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    last_updated: new Date().toISOString().slice(0, 10),
    total_cases: cases.length,
    us_cases: usCases.length,
    us_adjudicated: usCases.filter((item) => !item.alleged).length,
    us_alleged_only: usCases.filter((item) => item.alleged).length,
    countries_tracked: Object.keys(countBy(cases, (item) => item.country)).length,
    enriched_count: cases.length,
    enrichment_coverage_pct: 100,
    reviewed_count: cases.filter((item) => item.reviewed).length,
    reviewed_coverage_pct: 0,
    monetary_sanctions_total_usd: amounts.reduce((sum, amount) => sum + amount, 0),
    largest_single_sanction: amounts.length ? Math.max(...amounts) : 0,
    avg_sanction: amounts.length
      ? Math.round(amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length)
      : 0,
    severity_counts: countBy(cases, (item) => item.severity),
    by_country: countBy(cases, (item) => item.country),
    by_state: byState,
    by_week: countBy(cases, (item) => weekKey(item.date)),
    by_month: countBy(cases, (item) => item.date.slice(0, 7)),
    by_year: countBy(cases, (item) => item.date.slice(0, 4)),
    by_tool: countBy(cases, (item) => item.ai_tool_used),
    by_circuit: countBy(usCases, (item) => item.circuit),
    pace_weeks: Object.entries(countBy(cases, (item) => weekKey(item.date)))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, count]) => ({ week, count })),
  };
}

async function readSource() {
  if (sourceFile) return readFileSync(sourceFile, "utf8");
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
  return response.text();
}

const existingPath = path.join(repoRoot, "data", "sanctions.json");
const existing = JSON.parse(readFileSync(existingPath, "utf8"));
const existingByKey = new Map(existing.map((item) => [`${slugify(item.case_name)}|${item.date}`, item]));

const rows = parseCsv(await readSource());
const cases = rows
  .filter((row) => row["Case Name"] && row.Date)
  .map((row) => {
    const key = `${slugify(row["Case Name"])}|${row.Date}`;
    const previous = existingByKey.get(key);
    const country = normalizeCountry(row["State(s)"]);
    const state = inferState(row.Court, country);
    const { amount, display, raw } = parseAmount(row["Monetary Penalty"]);
    const id = previous?.id || `${slugify(row["Case Name"])}-${row.Date}`;

    return {
      id,
      case_name: row["Case Name"],
      court: row.Court,
      state,
      state_display: state || country,
      country,
      circuit: inferCircuit(row.Court),
      jurisdiction: row.Court.match(/\b(?:[ENDS]\.D\.|D\.|Cir\.|GAO|Fed\. Cir\.|Bankruptcy)\b/i)
        ? "federal"
        : "state",
      date: row.Date,
      party: row["Party(ies)"],
      ai_tool_used:
        row["AI Tool"] === "Implied"
          ? "AI (implied, unspecified)"
          : row["AI Tool"] || "Unidentified",
      ai_tool_raw: row["AI Tool"],
      hallucination_items: row["Hallucination Items"],
      outcome: row.Outcome,
      amount,
      amount_display: display,
      monetary_raw: raw,
      professional_sanction: row["Professional Sanction"] || "No",
      sanction_types: inferSanctionTypes(row),
      alleged: row.Alleged.toLowerCase() === "yes",
      summary: buildSummary(row),
      source_url: buildSourceUrl(row),
      source_name: row.Pointer || "Damien Charlotin AI Hallucination Cases Database",
      severity: inferSeverity(row, amount || 0),
      policy_gap_ids: previous?.policy_gap_ids?.length ? previous.policy_gap_ids : inferPolicyGaps(row),
      tags: inferTags(row),
      lesson: previous?.lesson || "",
      enriched: true,
      enriched_at: new Date().toISOString().slice(0, 10),
      confidence: row.Source ? "high" : "medium",
      reviewed: previous?.reviewed || false,
      reviewed_at: previous?.reviewed_at || null,
      wiki_notes: previous?.wiki_notes || "",
      related_case_ids: previous?.related_case_ids || [],
      legal_field_primary: row["Legal Field Primary"],
      legal_field_secondary: row["Legal Field Secondary"],
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date) || a.case_name.localeCompare(b.case_name));

const meta = buildMeta(cases);

writeFileSync(path.join(repoRoot, "data", "sanctions.json"), `${JSON.stringify(cases, null, 2)}\n`);
writeFileSync(path.join(repoRoot, "data", "cases.json"), `${JSON.stringify(cases, null, 2)}\n`);
writeFileSync(path.join(repoRoot, "data", "sanctions-raw.json"), `${JSON.stringify(rows, null, 2)}\n`);
writeFileSync(path.join(repoRoot, "data", "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
writeFileSync(path.join(repoRoot, "data", "meta-raw.json"), `${JSON.stringify(meta, null, 2)}\n`);

console.log(`Imported ${cases.length} cases from ${sourceFile || csvUrl}`);
console.log(`Latest case: ${cases[0]?.date} | ${cases[0]?.case_name}`);
console.log(`US cases: ${meta.us_cases}; countries: ${meta.countries_tracked}`);
