#!/usr/bin/env python3
"""Split sanctions-raw.json into minimal batch files for parallel agents."""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "sanctions-raw.json"
BATCH_DIR = ROOT / "data" / "batches"
BATCH_DIR.mkdir(parents=True, exist_ok=True)

BATCH_SIZE = 20

# Fields each agent needs — keep TINY. No enrichment placeholders, no derived aggregates.
SLIM_FIELDS = [
    "id", "case_name", "court", "state", "state_display", "country",
    "date", "party", "ai_tool_raw", "hallucination_items", "outcome",
    "amount", "monetary_raw", "professional_sanction", "alleged", "summary"
]

def slim(c):
    return {k: c.get(k) for k in SLIM_FIELDS}

def main():
    cases = json.loads(RAW.read_text())
    us = [c for c in cases if c["country"] == "US"]
    intl = [c for c in cases if c["country"] != "US"]

    # Wipe existing batch dir
    for f in BATCH_DIR.glob("*.json"):
        f.unlink()

    def write_batches(prefix, items):
        n = 0
        for i in range(0, len(items), BATCH_SIZE):
            n += 1
            batch = items[i:i+BATCH_SIZE]
            out = BATCH_DIR / f"{prefix}-{n:02d}.json"
            out.write_text(json.dumps([slim(c) for c in batch], ensure_ascii=False, indent=1))
        return n

    us_n = write_batches("us", us)
    intl_n = write_batches("intl", intl)

    print(f"US:   {len(us)} cases → {us_n} batches")
    print(f"INTL: {len(intl)} cases → {intl_n} batches")
    print(f"Total batch files: {us_n + intl_n}")

if __name__ == "__main__":
    main()
