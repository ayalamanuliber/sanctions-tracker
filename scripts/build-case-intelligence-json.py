#!/usr/bin/env python3
"""Build the canonical case-intelligence contract from corpus data and agent deltas.

The output is intentionally data-only. Page rendering, metadata, schema, and print
views can consume the same contract without asking an LLM to repeat layout work.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / "data" / "sanctions.json"
OUTPUT = ROOT / "data" / "case-intelligence.json"
WAVE_FILES = [
    Path("/tmp/corpus-wave1-0-599.json"),
    Path("/tmp/corpus-wave1-600-1199.json"),
    Path("/tmp/corpus-wave1-1200-1795.json"),
    Path("/tmp/corpus-wave2-a.json"),
    Path("/tmp/corpus-wave2-b.json"),
    Path("/tmp/corpus-wave2-c.json"),
]
SLUG_OVERRIDES = {
    "-2026-07-16": "badash-v-ohana-2026-07-16",
}


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(character for character in value if not unicodedata.combining(character)).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:150]


def source_tier(url: str) -> str:
    host = urlparse(url or "").hostname or ""
    host = host.removeprefix("www.").lower()
    if not host:
        return "missing"
    if host.endswith(".gov") or "uscourts.gov" in host or "supremecourt.gov" in host or host.startswith("courts."):
        return "official-court"
    if host in {"courtlistener.com", "law.justia.com", "docs.justia.com", "canlii.org", "austlii.edu.au", "saflii.org"}:
        return "docket-mirror"
    if "damiencharlotin.com" in host:
        return "publisher-archive"
    return "secondary-report"


def fallback_implications(item: dict) -> list[str]:
    tags = set(item.get("tags") or [])
    sanctions = set(item.get("sanction_types") or [])
    implications: list[str] = []
    if tags & {"fake-citations", "fabricated-authorities"}:
        implications.append("Verify the existence, citation, court, and precedential status of every authority before filing.")
    if tags & {"fabricated-quotes", "false-quotes"}:
        implications.append("Compare every quoted passage and pincite directly with the underlying opinion or filing.")
    if tags & {"misrepresented-authority", "misrepresented-authorities"}:
        implications.append("Confirm that each authority supports the stated proposition and has not been mischaracterized.")
    if item.get("alleged"):
        implications.append("Keep allegations separate from adjudicated findings in research, reporting, and client communications.")
    if sanctions & {"monetary", "professional", "disciplinary", "bar-referral"} or item.get("professional_sanction") not in {None, "", "No"}:
        implications.append("Escalate unresolved verification failures before filing and preserve the responsible reviewer's signoff record.")
    if item.get("ai_tool_used") and item.get("ai_tool_used") != "Unidentified":
        implications.append(f"Apply the same source-checking controls to {item['ai_tool_used']} output as to any other research input.")
    implications.append("Read the linked source and subsequent docket history before relying on this record for legal work.")
    return list(dict.fromkeys(implications))[:4]


def extract_section(summary: str, heading: str, following: list[str]) -> str | None:
    if heading not in summary:
        return None
    tail = summary.split(heading, 1)[1]
    positions = [tail.find(marker) for marker in following if marker in tail]
    if positions:
        tail = tail[: min(position for position in positions if position >= 0)]
    clean = re.sub(r"\s+", " ", tail).strip(" .")
    return clean or None


def specific_why_it_matters(item: dict) -> str:
    if item.get("lesson"):
        return item["lesson"]
    court = item.get("court") or "the recorded court"
    outcome = item.get("outcome") or "a recorded judicial response"
    tags = [str(tag).replace("-", " ") for tag in (item.get("tags") or [])[:2]]
    pattern = " and ".join(tags) if tags else "legal AI verification"
    attribution = item.get("ai_tool_used") or "AI-related conduct"
    return f"This matter connects {pattern} involving {attribution} with {outcome} in {court}, making it a concrete reference point for verification, supervision, and response controls."


def specific_boundary(item: dict, tier: str) -> str:
    status = "The record concerns a public allegation and does not establish an adjudicated finding." if item.get("alleged") else "The record summarizes the outcome described in the linked public source."
    source_note = {
        "official-court": "The recorded link is hosted by a court or government source.",
        "docket-mirror": "The recorded link is a legal-document or docket mirror.",
        "publisher-archive": "The recorded document is hosted in the upstream publisher archive.",
        "secondary-report": "The recorded link is a secondary or other public source and should be checked against the docket where available.",
        "missing": "No underlying public source link is currently recorded.",
    }.get(tier, "The source classification should be confirmed before reliance.")
    return f"{status} {source_note} This page is not a substitute for the complete docket, subsequent history, or jurisdiction-specific advice."


def specific_decision_context(item: dict) -> str:
    tags = set(item.get("tags") or [])
    outcome = item.get("outcome") or "the response recorded in the linked source"
    if item.get("alleged"):
        return f"The matter is tracked because the public record raises an unresolved AI-related allegation. The page does not treat {outcome} as an adjudicated finding unless the linked source does so."
    if tags & {"fake-citations", "fabricated-authorities"}:
        return f"The record concerns whether authorities presented to the decision-maker existed and could be verified. The tracked outcome is {outcome}; the linked source controls the precise reasoning."
    if tags & {"fabricated-quotes", "false-quotes"}:
        return f"The record concerns whether quotations and pincites accurately matched the cited source. The tracked outcome is {outcome}; the linked source controls the precise reasoning."
    if tags & {"misrepresented-authority", "misrepresented-authorities"}:
        return f"The record concerns whether cited material supported the proposition attributed to it. The tracked outcome is {outcome}; the linked source controls the precise reasoning."
    if tags & {"confidentiality", "privacy", "disclosure"}:
        return f"The record concerns handling of protected information and the controls applied before AI-assisted material was used. The tracked outcome is {outcome}."
    patterns = [str(tag).replace("-", " ") for tag in (item.get("tags") or [])[:2]]
    pattern = " and ".join(patterns) if patterns else "AI-related conduct"
    return f"The linked record identifies {pattern} and records {outcome}. This page does not infer judicial reasoning beyond the source."


def ensure_standalone_summary(summary: str, item: dict) -> str:
    clean = re.sub(r"\s+", " ", summary or "").strip()
    if len(clean) >= 120:
        return clean
    court = item.get("court") or "the recorded tribunal"
    date = item.get("date") or "the recorded date"
    tags = [str(tag).replace("-", " ") for tag in (item.get("tags") or [])[:2]]
    issue = " and ".join(tags) if tags else "an AI-related legal issue"
    outcome = item.get("outcome") or "the procedural response described in the linked source"
    lead = clean.rstrip(" .") or f"The public record identifies {issue}"
    return f"{lead}. The matter is recorded in {court} on {date} and concerns {issue}. The tracked outcome is {outcome}; consult the linked source for the complete record."


def load_records(path: Path) -> list[dict]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text())
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("records"), list):
        return raw["records"]
    return []


def main() -> None:
    cases = json.loads(CASES.read_text())
    deltas: dict[str, dict] = {}
    blockers: dict[str, str] = {}
    for path in WAVE_FILES:
        for row in load_records(path):
            if row.get("status") == "enriched":
                deltas[row["id"]] = row
                blockers.pop(row["id"], None)
            elif row.get("status") in {"blocked", "skip"} and not row.get("adequate_unchanged"):
                reason = row.get("blocked_reason") or row.get("skip_reason")
                if reason and not re.search(r"adequate|preserv|delta-only audit", reason, re.I):
                    blockers[row["id"]] = reason

    output = []
    for item in cases:
        case_id = item["id"]
        delta = deltas.get(case_id, {})
        summary = ensure_standalone_summary(
            delta.get("case_summary") or item.get("summary") or "No source-specific summary is currently recorded.",
            item,
        )
        source_url = delta.get("best_source_url") or item.get("source_url") or ""
        classified_tier = source_tier(source_url)
        tier = classified_tier if classified_tier not in {"missing", "secondary-report"} else delta.get("source_tier") or classified_tier
        reasoning = delta.get("judicial_reasoning") or extract_section(summary, "Key Judicial Reasoning", [])
        classification = "allegation" if item.get("alleged") else "adjudicated"
        blocked_reason = blockers.get(case_id)
        output.append({
            "id": case_id,
            "slug": SLUG_OVERRIDES.get(case_id, slugify(case_id)),
            "case_name": item.get("case_name", case_id),
            "classification": classification,
            "severity": item.get("severity", "low"),
            "summary": summary,
            "why_it_matters": delta.get("why_it_matters") or specific_why_it_matters(item),
            "judicial_reasoning": reasoning,
            "decision_context": specific_decision_context(item),
            "practical_implications": delta.get("practical_implications") or fallback_implications(item),
            "evidence_boundary": delta.get("evidence_boundary") or specific_boundary(item, tier),
            "verified_fields": delta.get("verified_fields") or ["case_name", "court", "date", "source_url"],
            "source": {
                "url": source_url,
                "name": item.get("source_name") or "Linked source",
                "tier": tier,
            },
            "record": {
                "court": item.get("court", ""),
                "jurisdiction": item.get("jurisdiction", ""),
                "state": item.get("state", ""),
                "country": item.get("country", ""),
                "circuit": item.get("circuit"),
                "judge": item.get("judge"),
                "date": item.get("date", ""),
                "ai_tool": item.get("ai_tool_used", ""),
                "outcome": item.get("outcome", ""),
                "amount": item.get("amount"),
                "professional_sanction": item.get("professional_sanction", ""),
                "tags": item.get("tags", []),
                "sanction_types": item.get("sanction_types", []),
            },
            "publication": {
                "ready": bool(source_url and summary and not blocked_reason),
                "agent_status": delta.get("status", "adequate_unchanged"),
                "blocked_reason": blocked_reason,
            },
        })

    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(output)} case-intelligence records to {OUTPUT}")
    print(f"Agent deltas applied: {len(deltas)}")
    print(f"Evidence-blocked records: {len(blockers)}")


if __name__ == "__main__":
    main()
