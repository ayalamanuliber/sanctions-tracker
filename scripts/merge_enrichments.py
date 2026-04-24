#!/usr/bin/env python3
"""Merge all enrichment batch outputs into canonical sanctions.json."""
import json
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "sanctions-raw.json"
ENRICH_DIR = ROOT / "data" / "enrichments"
OUT = ROOT / "data" / "sanctions.json"
META_OUT = ROOT / "data" / "meta.json"

def main():
    cases = json.loads(RAW.read_text())
    by_id = {c["id"]: c for c in cases}

    enrichments = {}
    files_loaded = 0
    for f in sorted(ENRICH_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text())
            enrichments.update(data)
            files_loaded += 1
        except Exception as e:
            print(f"skip {f.name}: {e}")

    # Wiki overrides — human edits layered on top of AI enrichment
    overrides_path = ROOT / "data" / "wiki-overrides.json"
    overrides = {}
    if overrides_path.exists():
        raw_ov = json.loads(overrides_path.read_text())
        overrides = {k: v for k, v in raw_ov.items() if not k.startswith("_") and isinstance(v, dict)}

    enriched_count = 0
    reviewed_count = 0
    now = datetime.utcnow().strftime("%Y-%m-%d")
    for cid, patch in enrichments.items():
        if cid not in by_id:
            continue
        c = by_id[cid]
        sev = patch.get("severity")
        if sev in ("low","medium","high","career-ending"):
            c["severity"] = sev
        gap_ids = patch.get("policy_gap_ids") or []
        c["policy_gap_ids"] = [g for g in gap_ids if isinstance(g, str)]
        st = patch.get("sanction_types") or []
        if st:
            c["sanction_types"] = [s for s in st if isinstance(s, str)]
        tags = patch.get("tags") or []
        c["tags"] = [t for t in tags if isinstance(t, str)][:8]
        if patch.get("lesson"):
            c["lesson"] = patch["lesson"]
        conf = patch.get("confidence")
        if conf in ("low","medium","high"):
            c["confidence"] = conf
        c["enriched"] = True
        c["enriched_at"] = now
        # Wiki-grade placeholders
        c.setdefault("reviewed", False)
        c.setdefault("reviewed_at", None)
        c.setdefault("wiki_notes", None)
        c.setdefault("related_case_ids", [])
        enriched_count += 1

    # Apply human overrides on top of AI enrichment
    for cid, ov in overrides.items():
        if cid not in by_id:
            continue
        c = by_id[cid]
        if "reviewed" in ov:
            c["reviewed"] = bool(ov["reviewed"])
            if c["reviewed"]:
                c["reviewed_at"] = ov.get("reviewed_at") or now
                reviewed_count += 1
        if "wiki_notes" in ov and ov["wiki_notes"]:
            c["wiki_notes"] = ov["wiki_notes"]
        if "related_case_ids" in ov:
            c["related_case_ids"] = [r for r in (ov["related_case_ids"] or []) if isinstance(r, str)]
        if ov.get("severity_override") in ("low","medium","high","career-ending"):
            c["severity"] = ov["severity_override"]
        if ov.get("lesson_override"):
            c["lesson"] = ov["lesson_override"]

    # Write canonical sanctions.json
    OUT.write_text(json.dumps(cases, ensure_ascii=False, indent=2))

    # Regenerate aggregated meta with enriched severity
    us_cases = [c for c in cases if c["country"] == "US"]
    by_country = Counter(c["country"] for c in cases)
    by_state_raw = defaultdict(list)
    for c in us_cases:
        if c["state"]:
            by_state_raw[c["state"]].append(c)
    by_state = []
    for st, st_cases in sorted(by_state_raw.items(), key=lambda x: -len(x[1])):
        total = sum((c["amount"] or 0) for c in st_cases)
        severities = Counter(c["severity"] or "unclassified" for c in st_cases)
        by_state.append({
            "state": st,
            "count": len(st_cases),
            "total": total,
            "severities": dict(severities),
            "cases": [{
                "id": c["id"], "name": c["case_name"], "court": c["court"], "judge": "",
                "date": c["date"], "amount": c["amount"],
                "amount_display": c["amount_display"], "severity": c["severity"] or "unclassified",
                "tool": c["ai_tool_used"],
                "summary": (c["summary"] or "")[:250],
                "sanction_types": c["sanction_types"], "tags": c["tags"],
                "source_url": c["source_url"],
            } for c in st_cases[:30]],
        })

    by_week = Counter()
    by_month = Counter()
    by_year = Counter()
    by_severity_week = defaultdict(lambda: Counter())
    for c in cases:
        if c["date"]:
            try:
                d = datetime.strptime(c["date"], "%Y-%m-%d")
                iso_y, iso_w, _ = d.isocalendar()
                wkey = f"{iso_y}-W{iso_w:02d}"
                by_week[wkey] += 1
                by_month[d.strftime("%Y-%m")] += 1
                by_year[d.strftime("%Y")] += 1
                if c["severity"]:
                    by_severity_week[wkey][c["severity"]] += 1
            except ValueError:
                pass

    by_tool = Counter(c["ai_tool_used"] for c in cases)
    by_circuit = Counter(c["circuit"] for c in cases if c["circuit"])
    amounts = [c["amount"] for c in cases if c["amount"]]
    severity_counts = Counter(c["severity"] for c in cases if c["severity"])

    # Recent pace (last 12 weeks)
    weeks_sorted = sorted(by_week.keys())[-12:]
    pace_weeks = [{"week": w, "count": by_week[w]} for w in weeks_sorted]

    meta = {
        "last_updated": now,
        "total_cases": len(cases),
        "us_cases": len(us_cases),
        "us_adjudicated": sum(1 for c in us_cases if not c["alleged"]),
        "us_alleged_only": sum(1 for c in us_cases if c["alleged"]),
        "countries_tracked": len(by_country),
        "enriched_count": enriched_count,
        "enrichment_coverage_pct": round(enriched_count/len(cases)*100, 1) if cases else 0,
        "reviewed_count": reviewed_count,
        "reviewed_coverage_pct": round(reviewed_count/len(cases)*100, 1) if cases else 0,
        "monetary_sanctions_total_usd": sum(amounts),
        "largest_single_sanction": max(amounts) if amounts else 0,
        "avg_sanction": int(sum(amounts)/len(amounts)) if amounts else 0,
        "severity_counts": dict(severity_counts),
        "by_country": dict(by_country.most_common()),
        "by_state": by_state,
        "by_week": dict(by_week.most_common(52)),
        "by_month": dict(by_month.most_common(36)),
        "by_year": dict(by_year.most_common()),
        "by_tool": dict(by_tool.most_common(20)),
        "by_circuit": dict(by_circuit.most_common()),
        "pace_weeks": pace_weeks,
    }

    META_OUT.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"Merged {enriched_count} enrichments from {files_loaded} batch files")
    print(f"Severity breakdown: {dict(severity_counts)}")
    print(f"Coverage: {meta['enrichment_coverage_pct']}%")
    print(f"→ {OUT.relative_to(ROOT)}")
    print(f"→ {META_OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
