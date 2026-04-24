#!/usr/bin/env python3
"""
Parse Charlotin CSV dump into our canonical raw JSON.
No enrichment here — just clean, typed, deduped facts.
Enrichment runs downstream in parallel Claude sessions.
"""
import csv
import json
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
SRC = ROOT / "data" / "raw" / "charlotin-2026-04-24.csv"
OUT = ROOT / "data" / "sanctions-raw.json"
META_OUT = ROOT / "data" / "meta-raw.json"

US_STATE_NAME_TO_CODE = {
    "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
    "Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC",
    "Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL",
    "Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA",
    "Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN",
    "Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV",
    "New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY",
    "North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR",
    "Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",
    "Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA",
    "Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY",
    "Puerto Rico":"PR",
}
US_CODE_SET = set(US_STATE_NAME_TO_CODE.values()) | {"USA"}

# Federal court patterns → state extraction
FED_COURT_STATE_MAP = {
    # District courts — abbreviations
    "S.D.N.Y.":"NY","E.D.N.Y.":"NY","N.D.N.Y.":"NY","W.D.N.Y.":"NY",
    "S.D. New York":"NY","E.D. New York":"NY","N.D. New York":"NY","W.D. New York":"NY",
    "C.D. Cal.":"CA","N.D. Cal.":"CA","S.D. Cal.":"CA","E.D. Cal.":"CA",
    "C.D. California":"CA","N.D. California":"CA","S.D. California":"CA","E.D. California":"CA",
    "N.D. Tex.":"TX","S.D. Tex.":"TX","E.D. Tex.":"TX","W.D. Tex.":"TX",
    "N.D. Texas":"TX","S.D. Texas":"TX","E.D. Texas":"TX","W.D. Texas":"TX",
    "D. Ariz.":"AZ","D. Arizona":"AZ",
    "D. Or.":"OR","D. Oregon":"OR",
    "D. Kan.":"KS","D. Kansas":"KS",
    "D. Mass.":"MA","D. Massachusetts":"MA",
    "D. N.J.":"NJ","D. New Jersey":"NJ",
    "D. Md.":"MD","D. Maryland":"MD",
    "D. Colo.":"CO","D. Colorado":"CO",
    "D. Minn.":"MN","D. Minnesota":"MN",
    "D. Nev.":"NV","D. Nevada":"NV",
    "N.D. Ill.":"IL","S.D. Ill.":"IL","C.D. Ill.":"IL",
    "N.D. Illinois":"IL","S.D. Illinois":"IL","C.D. Illinois":"IL",
    "M.D. Fla.":"FL","S.D. Fla.":"FL","N.D. Fla.":"FL",
    "M.D. Florida":"FL","S.D. Florida":"FL","N.D. Florida":"FL",
    "N.D. Ala.":"AL","S.D. Ala.":"AL","M.D. Ala.":"AL",
    "N.D. Alabama":"AL","S.D. Alabama":"AL","M.D. Alabama":"AL",
    "E.D. Mich.":"MI","W.D. Mich.":"MI",
    "E.D. Michigan":"MI","W.D. Michigan":"MI",
    "E.D. Pa.":"PA","W.D. Pa.":"PA","M.D. Pa.":"PA",
    "E.D. Pennsylvania":"PA","W.D. Pennsylvania":"PA","M.D. Pennsylvania":"PA",
    "E.D. Va.":"VA","W.D. Va.":"VA",
    "E.D. Virginia":"VA","W.D. Virginia":"VA",
    "N.D. Ga.":"GA","S.D. Ga.":"GA","M.D. Ga.":"GA",
    "N.D. Georgia":"GA","S.D. Georgia":"GA","M.D. Georgia":"GA",
    "N.D. Ohio":"OH","S.D. Ohio":"OH",
    "W.D. Wash.":"WA","E.D. Wash.":"WA",
    "W.D. Washington":"WA","E.D. Washington":"WA",
    "D. Conn.":"CT","D. Connecticut":"CT",
    "D.D.C.":"DC","D. D.C.":"DC",
    "W.D. Mo.":"MO","E.D. Mo.":"MO",
    "W.D. Missouri":"MO","E.D. Missouri":"MO",
    "N.D. Ind.":"IN","S.D. Ind.":"IN",
    "N.D. Indiana":"IN","S.D. Indiana":"IN",
    "D. Utah":"UT","D. N.H.":"NH","D. New Hampshire":"NH",
    "D. Vt.":"VT","D. Vermont":"VT",
    "D. R.I.":"RI","D. Rhode Island":"RI",
    "D. S.C.":"SC","D. South Carolina":"SC",
    "D. Me.":"ME","D. Maine":"ME",
    "D. Mont.":"MT","D. Montana":"MT",
    "D. Idaho":"ID","D. Wyo.":"WY","D. Wyoming":"WY",
    "D. N.D.":"ND","D. North Dakota":"ND",
    "D. S.D.":"SD","D. South Dakota":"SD",
    "D. Neb.":"NE","D. Nebraska":"NE",
    "D. Del.":"DE","D. Delaware":"DE",
    "D. Hawaii":"HI","D. Alaska":"AK",
    "W.D. Okla.":"OK","E.D. Okla.":"OK","N.D. Okla.":"OK",
    "W.D. Oklahoma":"OK","E.D. Oklahoma":"OK","N.D. Oklahoma":"OK",
    "E.D. Ark.":"AR","W.D. Ark.":"AR",
    "E.D. Arkansas":"AR","W.D. Arkansas":"AR",
    "E.D. La.":"LA","M.D. La.":"LA","W.D. La.":"LA",
    "E.D. Louisiana":"LA","M.D. Louisiana":"LA","W.D. Louisiana":"LA",
    "N.D. Miss.":"MS","S.D. Miss.":"MS",
    "N.D. Mississippi":"MS","S.D. Mississippi":"MS",
    "N.D. W. Va.":"WV","S.D. W. Va.":"WV",
    "N.D. West Virginia":"WV","S.D. West Virginia":"WV",
    "E.D. Ky.":"KY","W.D. Ky.":"KY",
    "E.D. Kentucky":"KY","W.D. Kentucky":"KY",
    "E.D. Tenn.":"TN","M.D. Tenn.":"TN","W.D. Tenn.":"TN",
    "E.D. Tennessee":"TN","M.D. Tennessee":"TN","W.D. Tennessee":"TN",
    "M.D. N.C.":"NC","E.D. N.C.":"NC","W.D. N.C.":"NC",
    "M.D. North Carolina":"NC","E.D. North Carolina":"NC","W.D. North Carolina":"NC",
    "E.D. Wis.":"WI","W.D. Wis.":"WI",
    "E.D. Wisconsin":"WI","W.D. Wisconsin":"WI",
    "N.D. Iowa":"IA","S.D. Iowa":"IA",
    "D.P.R.":"PR","D. Puerto Rico":"PR",
}

# Circuit → states
CIRCUITS = {
    "1st Circuit": {"ME","MA","NH","RI","PR"},
    "2nd Circuit": {"CT","NY","VT"},
    "3rd Circuit": {"DE","NJ","PA"},
    "4th Circuit": {"MD","NC","SC","VA","WV"},
    "5th Circuit": {"LA","MS","TX"},
    "6th Circuit": {"KY","MI","OH","TN"},
    "7th Circuit": {"IL","IN","WI"},
    "8th Circuit": {"AR","IA","MN","MO","NE","ND","SD"},
    "9th Circuit": {"AK","AZ","CA","HI","ID","MT","NV","OR","WA","GU"},
    "10th Circuit": {"CO","KS","NM","OK","UT","WY"},
    "11th Circuit": {"AL","FL","GA"},
    "D.C. Circuit": {"DC"},
    "Federal Circuit": set(),
}

def slugify(s: str) -> str:
    s = re.sub(r"[^\w\s-]", "", (s or "").lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s[:80]

def parse_amount(raw: str):
    """Extract numeric USD amount from free-form monetary penalty field."""
    if not raw: return None
    raw = raw.strip()
    if raw.lower() in ("no","none","n/a","","-"): return None
    # Strip anything that isn't digit, dot, comma; pick biggest number in the cell
    nums = re.findall(r"\$?\s*([\d,]+(?:\.\d+)?)", raw)
    best = 0
    for n in nums:
        try:
            v = float(n.replace(",",""))
            if v > best: best = v
        except ValueError:
            continue
    return int(best) if best > 0 else None

def fmt_amount(amt):
    if amt is None or amt == 0: return ""
    if amt >= 1000:
        if amt >= 10000:
            return f"${amt/1000:.0f}K" if amt % 1000 == 0 else f"${amt/1000:.1f}K"
        return f"${amt/1000:.1f}K"
    return f"${amt}"

import re as _re

# Foreign-court indicators — matched at word boundaries to avoid "Cour" ⊂ "Court" collisions
_FOREIGN_MARKERS = (
    "Alberta", "Ontario", "Québec", "Quebec", "British Columbia", "Nova Scotia",
    "Manitoba", "Saskatchewan", "Newfoundland", "New Brunswick",
    "Tucumán", "Córdoba", "Argentina", "Buenos Aires",
    "NSW", "Queensland", "Tasmania", "South Australia",
    "United Kingdom", "England", "Wales", "Scotland", "Ireland",
    "Bundesgericht", "Conseil",
    "Jakarta", "Manila", "Seoul", "Tokyo", "Bogotá", "Medellín",
    "BCSC", "SCC", "ONSC", "ONCA",
)
# Markers where plain substring matching is safe (no common-English overlap)
_FOREIGN_SUB = ("Tucumán", "Córdoba", "Bogotá", "Medellín", "Bundesgericht")

def _infer_state_from_court(court: str) -> str | None:
    """Conservative US-state extraction from court names. Returns None if foreign."""
    if not court:
        return None
    # Normalize Unicode (turns Hawai'i → Hawaii, Córdoba → Cordoba, etc.)
    import unicodedata
    court_ascii = unicodedata.normalize("NFKD", court).encode("ascii", "ignore").decode("ascii")
    # Bail on unambiguous non-ASCII foreign markers (substring OK)
    for sub in _FOREIGN_SUB:
        if sub in court:
            return None
    # Bail on word-boundary-matched foreign markers
    for marker in _FOREIGN_MARKERS:
        if _re.search(rf"\b{_re.escape(marker)}\b", court) or _re.search(rf"\b{_re.escape(marker)}\b", court_ascii):
            return None
    # Common abbreviation patterns that weren't in FED_COURT_STATE_MAP
    QUICK_PATS = {
        "C.D. Cal": "CA", "N.D. Cal": "CA", "S.D. Cal": "CA", "E.D. Cal": "CA",
        "Tex. App": "TX", "Tex. Sup": "TX", "Tex Ct": "TX",
        "W.V.": "WV", "W. Va.": "WV",
        "Kings County": "NY",  # NYC borough
        "Ill. App": "IL", "Ill. Sup": "IL",
        "Fla. App": "FL", "Fla. Sup": "FL",
        "N.Y.S.": "NY",
        "Mass. Sup": "MA", "Mass. App": "MA",
        "Pa. Sup": "PA", "Pa. Commw": "PA",
        "Ohio App": "OH", "Ohio Sup": "OH",
        "La. App": "LA",
        "Mich. Ct": "MI", "Mich. App": "MI",
        "Wash. Ct": "WA", "Wash. App": "WA",
        "Ga. App": "GA", "Ga. Sup": "GA",
        "Colo. App": "CO", "Colo. Sup": "CO",
        "Minn. App": "MN",
        "N.J. Super": "NJ",
        "Ariz. App": "AZ",
        "LUBA (Oregon)": "OR", "LUBA": "OR",
        "Vt. Supr": "VT", "Vt. Env": "VT",
    }
    for pat, st in QUICK_PATS.items():
        if pat in court or pat in court_ascii:
            return st
    # Federal-ish catch-alls → DC
    FED_KEYWORDS = ("GAO", "ASBCA", "CBCA", "PSBCA", "Court of Federal Claims", "J.P.M.L.",
                     "BVA", "PTAB", "IPR", "Merit Systems Protection Board", "Armed Services Board",
                     "U.S. Tax Court", "Court of International Trade", "Claims Court", "Veterans Claims")
    for kw in FED_KEYWORDS:
        if kw in court:
            return "DC"
    # Fed district map
    for pat, st in FED_COURT_STATE_MAP.items():
        if pat in court or pat in court_ascii:
            return st
    # Multi-word US state names (longest first — "New York" before "York")
    MULTI_WORD = sorted(
        [name for name in US_STATE_NAME_TO_CODE.keys() if " " in name],
        key=lambda x: -len(x),
    )
    for name in MULTI_WORD:
        if name in court or name in court_ascii:
            return US_STATE_NAME_TO_CODE[name]
    # Single-word state names (case-sensitive, word-boundary)
    single_names = [n for n in US_STATE_NAME_TO_CODE.keys() if " " not in n]
    for name in single_names:
        if _re.search(rf"\b{_re.escape(name)}\b", court_ascii):
            return US_STATE_NAME_TO_CODE[name]
    # Stuck-together patterns like "CATennessee" — split CamelCase
    m = _re.match(r"^(CA|SC|AC|CC)([A-Z][a-z]+)", court.strip())
    if m:
        name = m.group(2)
        if name in US_STATE_NAME_TO_CODE:
            return US_STATE_NAME_TO_CODE[name]
    # 2-letter UPPERCASE state code at word boundary (e.g. "D. CA", "N.D. TX")
    # Only match strict uppercase to avoid "de" → DE
    for m in _re.finditer(r"\b([A-Z]{2})\b", court):
        code = m.group(1)
        if code in US_STATE_NAME_TO_CODE.values():
            return code
    return None

def parse_country_and_state(state_cell: str, court_cell: str):
    """Returns (country_code, state_code_or_none, display_state)."""
    sc = (state_cell or "").strip().rstrip(",").rstrip()
    # Normalize common Charlotin artifacts
    if sc.endswith(' et al."'): sc = sc.replace(' et al."',"").strip()
    if sc.startswith('"'): sc = sc.lstrip('"')
    if sc.endswith('"'): sc = sc.rstrip('"')

    country = "US"
    state = None
    if not sc:
        # fallback: infer from court
        st = _infer_state_from_court(court_cell)
        if st:
            return ("US", st, st)
        return ("UNKNOWN", None, "")

    # Multi-country or unusual
    low = sc.lower()
    if low in ("usa","us","united states"):
        # try infer state from court
        st = _infer_state_from_court(court_cell or "")
        if st:
            return ("US", st, st)
        return ("US", None, "USA")

    # Is it a US state name?
    for name, code in US_STATE_NAME_TO_CODE.items():
        if name.lower() == low or f"usa, {name.lower()}" == low:
            return ("US", code, code)

    # Is it a US state code?
    upper = sc.upper()
    if upper in US_STATE_NAME_TO_CODE.values():
        return ("US", upper, upper)

    # "State(s)" column sometimes holds court name like "S.D. New York" — run court inference
    st = _infer_state_from_court(sc)
    if st:
        return ("US", st, st)
    # Also try the actual court field (backstop)
    st = _infer_state_from_court(court_cell or "")
    if st:
        return ("US", st, st)

    # Known country strings
    country_map = {
        "canada":"CA","united kingdom":"GB","uk":"GB","england":"GB","scotland":"GB","wales":"GB","northern ireland":"GB",
        "australia":"AU","israel":"IL","france":"FR","germany":"DE","ireland":"IE","south africa":"ZA",
        "new zealand":"NZ","india":"IN","spain":"ES","italy":"IT","netherlands":"NL","brazil":"BR",
        "argentina":"AR","mexico":"MX","japan":"JP","china":"CN","hong kong":"HK","singapore":"SG",
        "philippines":"PH","colombia":"CO","chile":"CL","peru":"PE","kenya":"KE","nigeria":"NG",
        "switzerland":"CH","sweden":"SE","norway":"NO","finland":"FI","denmark":"DK",
        "greece":"GR","portugal":"PT","belgium":"BE","austria":"AT","poland":"PL",
        "czech republic":"CZ","hungary":"HU","romania":"RO","turkey":"TR","ukraine":"UA",
        "russia":"RU","pakistan":"PK","bangladesh":"BD","uae":"AE","saudi arabia":"SA",
        "egypt":"EG","morocco":"MA","tunisia":"TN","malaysia":"MY","indonesia":"ID",
        "thailand":"TH","vietnam":"VN","taiwan":"TW","south korea":"KR","korea":"KR",
    }
    for needle, code in country_map.items():
        if needle in low:
            return (code, None, sc.title())

    # GAO etc.
    if low in ("gao","u.s. government","us federal"):
        return ("US", "DC", "DC")

    return ("OTHER", None, sc[:60])

def circuit_for(state_code):
    if not state_code: return None
    for circ, states in CIRCUITS.items():
        if state_code in states: return circ
    return None

def parse_date(raw: str):
    if not raw: return None
    raw = raw.strip()
    for fmt in ("%Y-%m-%d","%m/%d/%Y","%d/%m/%Y","%Y/%m/%d"):
        try: return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError: continue
    return raw[:10] if re.match(r"\d{4}-\d{2}-\d{2}", raw) else None

def normalize_ai_tool(raw):
    if not raw: return "Unspecified AI"
    r = raw.lower().strip()
    if "chatgpt" in r or "gpt-" in r or "gpt 4" in r or "openai" in r: return "ChatGPT / OpenAI"
    if "claude" in r or "anthropic" in r: return "Claude / Anthropic"
    if "gemini" in r or "bard" in r: return "Google Gemini"
    if "cocounsel" in r or "co-counsel" in r: return "CoCounsel (Westlaw)"
    if "lexis" in r: return "Lexis+ AI"
    if "copilot" in r: return "Microsoft Copilot"
    if "grok" in r: return "Grok"
    if "perplexity" in r: return "Perplexity"
    if "deepseek" in r: return "DeepSeek"
    if "llama" in r or "meta ai" in r: return "Meta Llama"
    if "implied" in r: return "AI (implied, unspecified)"
    if "unspecified" in r or "unknown" in r: return "Unspecified AI"
    return raw.strip()[:60]

def sanction_types_from_row(monetary_amount, pro_sanction, outcome):
    """Derive raw sanction_types list before enrichment."""
    types = []
    if monetary_amount and monetary_amount > 0:
        types.append("monetary")
    if pro_sanction:
        pro = pro_sanction.strip().lower()
        if pro not in ("","no","none","n/a","-"):
            types.append("professional")
            if "referr" in pro: types.append("referral")
            if "disqualif" in pro or "removed" in pro: types.append("disqualification")
            if "bar" in pro: types.append("bar-referral")
            if "cle" in pro or "training" in pro or "education" in pro: types.append("training-order")
    if not types and outcome:
        out = outcome.lower()
        if "warning" in out or "caution" in out or "admonish" in out: types.append("warning")
        elif "dismiss" in out: types.append("case-dismissed")
        elif "strike" in out or "struck" in out: types.append("struck-pleading")
    if not types:
        types.append("none-adjudicated")
    return types

# ------------- Main parse loop -------------
def main():
    with open(SRC, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Read {len(rows)} rows from {SRC.name}", file=sys.stderr)

    cases = []
    id_counter = {}
    for i, r in enumerate(rows):
        case_name = (r.get("Case Name") or "").strip()
        court = (r.get("Court") or "").strip()
        state_cell = (r.get("State(s)") or "").strip()
        date_raw = (r.get("Date") or "").strip()
        party = (r.get("Party(ies)") or "").strip()
        ai_tool_raw = (r.get("AI Tool") or "").strip()
        hallucination = (r.get("Hallucination Items") or "").strip()
        outcome = (r.get("Outcome") or "").strip()
        monetary_raw = (r.get("Monetary Penalty") or "").strip()
        pro_sanction = (r.get("Professional Sanction") or "").strip()
        alleged = (r.get("Alleged") or "").strip().lower() in ("yes","y","true")
        pointer = (r.get("Pointer") or "").strip()
        source = (r.get("Source") or "").strip()
        details = (r.get("Details") or "").strip()

        if not case_name:
            continue

        country, state_code, state_display = parse_country_and_state(state_cell, court)
        date_iso = parse_date(date_raw)
        amount = parse_amount(monetary_raw)
        ai_tool = normalize_ai_tool(ai_tool_raw)
        circuit = circuit_for(state_code) if country == "US" else None

        # Stable slug ID (with collision suffix)
        base = slugify(f"{case_name}-{date_iso or i}")
        if not base:
            base = f"case-{i}"
        slug = base
        n = id_counter.get(base, 0)
        if n:
            slug = f"{base}-{n+1}"
        id_counter[base] = n + 1

        sanction_types = sanction_types_from_row(amount, pro_sanction, outcome)

        source_url = source if source.startswith("http") else (f"https://damiencharlotin.com{pointer}" if pointer else "")

        cases.append({
            "id": slug,
            "case_name": case_name,
            "court": court,
            "state": state_code or "",
            "state_display": state_display,
            "country": country,
            "circuit": circuit,
            "jurisdiction": "federal" if (circuit or (court and any(p in court for p in FED_COURT_STATE_MAP.keys()))) else "state",
            "date": date_iso or "",
            "party": party,
            "ai_tool_used": ai_tool,
            "ai_tool_raw": ai_tool_raw,
            "hallucination_items": hallucination,
            "outcome": outcome,
            "amount": amount,
            "amount_display": fmt_amount(amount) if amount else (monetary_raw if monetary_raw.lower() not in ("no","n/a","") else ""),
            "monetary_raw": monetary_raw,
            "professional_sanction": pro_sanction,
            "sanction_types": sanction_types,
            "alleged": alleged,
            "summary": details,
            "source_url": source_url,
            "source_name": "Charlotin AI Hallucination Tracker" if "charlotin" in (source_url or "").lower() else (source or "Court records"),
            # Enrichment placeholders — filled by downstream Claude sessions
            "severity": None,
            "policy_gap_ids": [],
            "tags": [],
            "lesson": None,
            "enriched": False,
            "enriched_at": None,
            "confidence": None,
        })

    # ------------- Meta aggregations -------------
    from collections import Counter, defaultdict
    by_country = Counter(c["country"] for c in cases)
    us_cases = [c for c in cases if c["country"] == "US"]
    by_state = defaultdict(list)
    for c in us_cases:
        if c["state"]:
            by_state[c["state"]].append(c)
    by_week = Counter()
    by_month = Counter()
    by_year = Counter()
    for c in cases:
        if c["date"]:
            try:
                d = datetime.strptime(c["date"], "%Y-%m-%d")
                iso_y, iso_w, _ = d.isocalendar()
                by_week[f"{iso_y}-W{iso_w:02d}"] += 1
                by_month[d.strftime("%Y-%m")] += 1
                by_year[d.strftime("%Y")] += 1
            except ValueError: pass
    by_tool = Counter(c["ai_tool_used"] for c in cases)
    by_circuit = Counter(c["circuit"] for c in cases if c["circuit"])
    amounts = [c["amount"] for c in cases if c["amount"]]

    # byState list with totals
    by_state_list = []
    for st, st_cases in sorted(by_state.items(), key=lambda x: -len(x[1])):
        total = sum(c["amount"] or 0 for c in st_cases)
        by_state_list.append({
            "state": st,
            "count": len(st_cases),
            "total": total,
            "cases": [{"id": c["id"], "name": c["case_name"], "date": c["date"], "amount": c["amount"], "severity": c["severity"] or "unclassified"} for c in st_cases[:20]],
        })

    meta = {
        "last_updated": "2026-04-24",
        "total_cases": len(cases),
        "us_cases": len(us_cases),
        "us_adjudicated": sum(1 for c in us_cases if not c["alleged"]),
        "us_alleged_only": sum(1 for c in us_cases if c["alleged"]),
        "countries_tracked": len(by_country),
        "monetary_sanctions_total_usd": sum(amounts),
        "largest_single_sanction": max(amounts) if amounts else 0,
        "avg_sanction": int(sum(amounts)/len(amounts)) if amounts else 0,
        "by_country": dict(by_country.most_common()),
        "by_state": by_state_list,
        "by_week": dict(by_week.most_common(52)),
        "by_month": dict(by_month.most_common(36)),
        "by_year": dict(by_year.most_common()),
        "by_tool": dict(by_tool.most_common(20)),
        "by_circuit": dict(by_circuit.most_common()),
        "enriched_count": 0,
        "enrichment_coverage_pct": 0,
    }

    OUT.write_text(json.dumps(cases, ensure_ascii=False, indent=2))
    META_OUT.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"✓ Wrote {len(cases)} cases → {OUT.relative_to(ROOT)}")
    print(f"✓ Wrote meta → {META_OUT.relative_to(ROOT)}")
    print()
    print("=== COUNTRIES ===")
    for country, n in list(meta["by_country"].items())[:15]:
        print(f"  {country}: {n}")
    print()
    print(f"=== US STATES (top 15) ===")
    for e in by_state_list[:15]:
        print(f"  {e['state']}: {e['count']} cases, ${e['total']:,} total")
    print()
    print(f"=== TOP AI TOOLS ===")
    for tool, n in list(meta["by_tool"].items())[:10]:
        print(f"  {tool}: {n}")

if __name__ == "__main__":
    main()
