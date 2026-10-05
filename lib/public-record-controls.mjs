import { createHash } from "node:crypto";
import controls from "../data/public-record-controls.json" with { type: "json" };

const digest = (value) => createHash("sha256").update(value).digest("hex");
const normalized = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const identities = new Set(controls.identity_sha256);
const matterKeys = new Set(controls.matter_key_sha256);
const sourceKeys = new Set(controls.source_identity_sha256);
export const ANONYMOUS_RECORD_ID = controls.record.id;

export function isRetiredRecordIdentity(value) {
  const text = String(value || "");
  const clean = normalized(text);
  if (identities.has(digest(clean))) return true;
  const document = text.match(/\/documents\/(\d+)(?:\/|$)/i);
  if (document && sourceKeys.has(digest(`document:${document[1]}`))) return true;
  const words = clean.split(" ");
  for (const length of controls.identity_word_lengths) {
    for (let start = 0; start + length <= words.length; start++) {
      if (identities.has(digest(words.slice(start, start + length).join(" ")))) return true;
    }
  }
  return false;
}

export function isControlledRecord(item) {
  if (!item || typeof item !== "object") return false;
  if ([item.id, item.slug, item.case_id].includes(ANONYMOUS_RECORD_ID)) return true;
  if ([item.id, item.slug, item.case_id, item.source_url, item.source?.url, item.Source].some(isRetiredRecordIdentity)) return true;
  const name = item.case_name || item["Case Name"];
  const date = item.date || item.Date;
  const court = item.court || item.Court;
  if (name === controls.record.case_name && date === controls.record.date && court === controls.record.court) return true;
  if (name && matterKeys.has(digest(`${normalized(name)}|${date}|${normalized(court)}`))) return true;
  const docket = item.Details || item.docket_number;
  return Boolean(docket && sourceKeys.has(digest(`docket:${normalized(docket)}|${date}|${normalized(court)}`)));
}

export function publicCorpusRecords(records) {
  return records.map((item) => isControlledRecord(item) ? structuredClone(controls.record) : item);
}

export function publicIntelligenceRecords(records) {
  return records.map((item) => isControlledRecord(item) ? structuredClone(controls.intelligence) : item);
}

export function publicCsvRows(rows) {
  return rows.map((item) => isControlledRecord(item) ? structuredClone(controls.csv_row) : item);
}

/** Rewrite only the controlled record/reference; keep unrelated records intact. */
export function sanitizeRecordTree(value) {
  if (Array.isArray(value)) return value.map(sanitizeRecordTree);
  if (value && typeof value === "object") {
    if (isControlledRecord(value)) {
      if (Object.hasOwn(value, "Case Name")) return structuredClone(controls.csv_row);
      if (Object.hasOwn(value, "case_name") && Object.hasOwn(value, "summary")) {
        return Object.hasOwn(value, "publication") ? structuredClone(controls.intelligence) : structuredClone(controls.record);
      }
      if (Object.hasOwn(value, "name") && Object.hasOwn(value, "summary")) {
        const aliases = { name: "case_name", tool: "ai_tool_used" };
        return Object.fromEntries(Object.keys(value).map((key) => [key, Object.hasOwn(controls.record, aliases[key] || key) ? controls.record[aliases[key] || key] : ""]));
      }
      if (Object.hasOwn(value, "case_id")) {
        return { case_id: ANONYMOUS_RECORD_ID, status: "publisher-controlled", source_manifest: null };
      }
    }
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      isRetiredRecordIdentity(key) ? ANONYMOUS_RECORD_ID : key,
      isRetiredRecordIdentity(key) ? { status: "publisher-controlled" } : sanitizeRecordTree(entry),
    ]));
  }
  if (typeof value === "string" && isRetiredRecordIdentity(value)) {
    return /^(?:https?:)?\/\//i.test(value) || /\.pdf(?:$|[?#])/i.test(value) ? "" : ANONYMOUS_RECORD_ID;
  }
  return value;
}

export function isRetiredRequest(url) {
  let parsed;
  try { parsed = new URL(url, "https://example.invalid"); } catch { return false; }
  if (isRetiredRecordIdentity(parsed.pathname)) return true;
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.some((part) => {
    try { return isRetiredRecordIdentity(decodeURIComponent(part)); } catch { return true; }
  })) return true;
  return [...parsed.searchParams.values()].some(isRetiredRecordIdentity);
}

export function isBlockedPublicAsset(relativePath, bytes) {
  return isRetiredRequest(relativePath) || controls.asset_sha256.includes(digest(bytes));
}

export function anonymousRecord() { return structuredClone(controls.record); }
export function anonymousIntelligence() { return structuredClone(controls.intelligence); }
