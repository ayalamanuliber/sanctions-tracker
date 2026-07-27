#!/usr/bin/env python3
"""Build the canonical case-intelligence contract from corpus data and agent deltas.

The output is intentionally data-only. Page rendering, metadata, schema, and print
views can consume the same contract without asking an LLM to repeat layout work.
"""

from __future__ import annotations

import json
import re
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


def slugify(value: str) -> str:
    value = (value or "").lower()
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
    return [
        "Verify every cited authority, quotation, and proposition against the linked source.",
        "Preserve the verification record and escalate unresolved exceptions to the responsible reviewer.",
    ]


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
        summary = delta.get("case_summary") or item.get("summary") or "No source-specific summary is currently recorded."
        source_url = delta.get("best_source_url") or item.get("source_url") or ""
        classification = "allegation" if item.get("alleged") else "adjudicated"
        blocked_reason = blockers.get(case_id)
        output.append({
            "id": case_id,
            "slug": slugify(case_id),
            "case_name": item.get("case_name", case_id),
            "classification": classification,
            "severity": item.get("severity", "low"),
            "summary": summary,
            "why_it_matters": delta.get("why_it_matters") or item.get("lesson") or "Use the linked public record to assess the observed legal AI risk in context.",
            "judicial_reasoning": delta.get("judicial_reasoning"),
            "practical_implications": delta.get("practical_implications") or fallback_implications(item),
            "evidence_boundary": delta.get("evidence_boundary") or "This record is a structured summary of the linked public source and is not a substitute for the complete docket, order, subsequent history, or jurisdiction-specific advice.",
            "verified_fields": delta.get("verified_fields") or ["case_name", "court", "date", "source_url"],
            "source": {
                "url": source_url,
                "name": item.get("source_name") or "Linked source",
                "tier": delta.get("source_tier") or source_tier(source_url),
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
