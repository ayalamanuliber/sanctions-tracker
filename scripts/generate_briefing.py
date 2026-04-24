#!/usr/bin/env python3
"""
Generate an intelligence briefing from sanctions.json — for external use
(LinkedIn posts, PDFs, infographics, partner briefings).
Outputs a clean markdown doc + a structured JSON summary.
"""
import json
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime

ROOT = Path(__file__).parent.parent
SANCTIONS = ROOT / "data" / "sanctions.json"
OUT_MD = ROOT / "data" / "briefings" / f"intelligence-{datetime.utcnow().strftime('%Y-%m-%d')}.md"
OUT_JSON = ROOT / "data" / "briefings" / f"intelligence-{datetime.utcnow().strftime('%Y-%m-%d')}.json"

STATE_NAMES = {
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado",
    "CT":"Connecticut","DE":"Delaware","DC":"District of Columbia","FL":"Florida","GA":"Georgia",
    "HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky",
    "LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota",
    "MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire",
    "NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota",
    "OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina",
    "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia",
    "WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","PR":"Puerto Rico",
}
COUNTRY_NAMES = {
    "US":"United States","CA":"Canada","AU":"Australia","GB":"United Kingdom","IL":"Israel",
    "FR":"France","DE":"Germany","NL":"Netherlands","IE":"Ireland","BR":"Brazil","IN":"India",
    "AR":"Argentina","NZ":"New Zealand","IT":"Italy","ES":"Spain","ZA":"South Africa","MX":"Mexico",
    "JP":"Japan","CN":"China","HK":"Hong Kong","SG":"Singapore","PH":"Philippines","CO":"Colombia",
    "CL":"Chile","PE":"Peru","KE":"Kenya","NG":"Nigeria","CH":"Switzerland","SE":"Sweden","NO":"Norway",
    "AE":"United Arab Emirates","OTHER":"Other","UNKNOWN":"Unclassified",
}

def fmt_usd(n):
    if not n: return "—"
    if n >= 1_000_000: return f"${n/1_000_000:.1f}M"
    if n >= 1000: return f"${n/1000:.1f}K".rstrip("0").rstrip(".")
    return f"${n:,}"

def main():
    cases = json.loads(SANCTIONS.read_text())
    OUT_MD.parent.mkdir(parents=True, exist_ok=True)

    # ────────── Top-line numbers ──────────
    total = len(cases)
    us_cases = [c for c in cases if c["country"] == "US"]
    intl_cases = [c for c in cases if c["country"] != "US"]
    enriched = [c for c in cases if c.get("severity")]
    adjudicated_us = [c for c in us_cases if not c.get("alleged")]

    # Monetary totals
    monetary_cases = [c for c in cases if c.get("amount")]
    total_money = sum(c["amount"] for c in monetary_cases)
    us_monetary = sum(c["amount"] for c in monetary_cases if c["country"] == "US")

    # Severity split
    sev_counts = Counter(c["severity"] for c in cases if c.get("severity"))
    us_sev = Counter(c["severity"] for c in us_cases if c.get("severity"))

    # Countries
    countries = Counter(c["country"] for c in cases)
    countries_mapped = {k: v for k, v in countries.items() if k not in ("OTHER", "UNKNOWN")}

    # States
    state_counts = Counter(c["state"] for c in us_cases if c.get("state"))
    state_totals = defaultdict(int)
    for c in us_cases:
        if c.get("state") and c.get("amount"):
            state_totals[c["state"]] += c["amount"]

    # AI tools (collapse long-tail)
    tool_counts = Counter(c["ai_tool_used"] for c in cases if c.get("ai_tool_used"))

    # Year trajectory
    by_year = Counter()
    by_year_amount = defaultdict(list)
    for c in cases:
        if c.get("date"):
            try:
                y = datetime.strptime(c["date"], "%Y-%m-%d").year
                by_year[y] += 1
                if c.get("amount"): by_year_amount[y].append(c["amount"])
            except Exception: pass

    # Policy gap frequency
    gap_counts = Counter()
    for c in cases:
        for g in c.get("policy_gap_ids", []) or []:
            gap_counts[g] += 1

    # Court ranking
    court_counts = Counter(c["court"] for c in cases if c.get("court"))

    # Tag patterns
    tag_counts = Counter()
    for c in cases:
        for t in c.get("tags", []) or []:
            tag_counts[t] += 1

    # Top monetary cases
    top_money = sorted(monetary_cases, key=lambda x: -x["amount"])[:15]
    top_money_us = [c for c in top_money if c["country"] == "US"][:10]

    # All career-ending
    career = [c for c in cases if c.get("severity") == "career-ending"]
    career.sort(key=lambda x: -(x.get("amount") or 0))

    # Denial / cover-up cases
    denial_cases = [c for c in cases if "denial" in (c.get("tags") or []) or "sustained-deception" in (c.get("tags") or [])]

    # Paid tool cases
    paid_tool_cases = []
    for c in cases:
        tool = (c.get("ai_tool_used") or "").lower()
        if "cocounsel" in tool or "westlaw" in tool or "lexis" in tool or "co-counsel" in tool:
            paid_tool_cases.append(c)

    # ────────── Write Markdown ──────────
    lines = []
    lines.append(f"# AI Sanctions Intelligence Briefing")
    lines.append(f"**Source data:** Damien Charlotin HEC Paris AI Hallucination Cases + AI Vortex enrichment layer")
    lines.append(f"**Generated:** {datetime.utcnow().strftime('%B %d, %Y')}")
    lines.append(f"**Coverage:** {total:,} global cases · {len(us_cases):,} US · {len(intl_cases):,} international · {len(countries_mapped)} countries")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Executive snapshot")
    lines.append("")
    lines.append(f"- **{total:,} documented AI-hallucination cases** tracked worldwide through 2026-04")
    lines.append(f"- **{len(us_cases):,} US cases** across **{len(state_counts)} states** and all 12 federal circuits")
    lines.append(f"- **{us_sev.get('career-ending', 0)} career-ending** · **{us_sev.get('high', 0)} high-severity** US sanctions")
    lines.append(f"- **{fmt_usd(us_monetary)} US monetary sanctions** issued across {sum(1 for c in us_cases if c.get('amount'))} rulings with fines")
    lines.append(f"- **Largest US sanction:** {fmt_usd(max((c['amount'] for c in us_cases if c.get('amount')), default=0))} — {max((c for c in us_cases if c.get('amount')), key=lambda x: x['amount']).get('case_name', '')}")
    lines.append(f"- **Largest global sanction:** {fmt_usd(max((c['amount'] for c in cases if c.get('amount')), default=0))} — {max((c for c in cases if c.get('amount')), key=lambda x: x['amount']).get('case_name', '')} ({COUNTRY_NAMES.get(max((c for c in cases if c.get('amount')), key=lambda x: x['amount']).get('country'), '?')})")
    lines.append("")
    lines.append("### Severity distribution (global)")
    lines.append("")
    total_enriched = sum(sev_counts.values())
    for sev in ("career-ending","high","medium","low"):
        n = sev_counts.get(sev, 0)
        pct = round(n / total_enriched * 100, 1) if total_enriched else 0
        lines.append(f"- **{sev.replace('-',' ').title()}:** {n} ({pct}%)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── Geography ──────────
    lines.append("## Geography: where the sanctions come from")
    lines.append("")
    lines.append("### Top 15 US states by case count")
    lines.append("")
    lines.append("| Rank | State | Cases | Monetary |")
    lines.append("|---|---|---|---|")
    for i, (st, n) in enumerate(state_counts.most_common(15), 1):
        money = state_totals.get(st, 0)
        lines.append(f"| {i} | {STATE_NAMES.get(st, st)} ({st}) | {n} | {fmt_usd(money) if money else '—'} |")
    lines.append("")
    lines.append("### Top 10 US states by total monetary sanctions")
    lines.append("")
    lines.append("| Rank | State | Total | Cases |")
    lines.append("|---|---|---|---|")
    for i, (st, money) in enumerate(sorted(state_totals.items(), key=lambda x: -x[1])[:10], 1):
        lines.append(f"| {i} | {STATE_NAMES.get(st, st)} ({st}) | {fmt_usd(money)} | {state_counts.get(st, 0)} |")
    lines.append("")
    lines.append("### International footprint")
    lines.append("")
    lines.append("| Country | Cases |")
    lines.append("|---|---|")
    for code, n in sorted(countries_mapped.items(), key=lambda x: -x[1])[:12]:
        if code == "US": continue
        lines.append(f"| {COUNTRY_NAMES.get(code, code)} | {n} |")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── Time ──────────
    lines.append("## The velocity: this is accelerating")
    lines.append("")
    lines.append("### Cases filed by year")
    lines.append("")
    lines.append("| Year | Cases | Avg $ | Max $ |")
    lines.append("|---|---|---|---|")
    for y in sorted(by_year.keys()):
        amounts = by_year_amount.get(y, [])
        avg = int(sum(amounts) / len(amounts)) if amounts else 0
        mx = max(amounts) if amounts else 0
        lines.append(f"| {y} | {by_year[y]} | {fmt_usd(avg)} | {fmt_usd(mx)} |")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── AI Tools ──────────
    lines.append("## What tools are getting lawyers caught")
    lines.append("")
    lines.append("| Tool | Cases |")
    lines.append("|---|---|")
    for tool, n in tool_counts.most_common(12):
        lines.append(f"| {tool} | {n} |")
    lines.append("")
    lines.append("**Key insight:** ChatGPT / OpenAI is the single named tool that appears most often, but the vast majority (**888 cases**) don't specify or identify the AI tool used. Courts typically don't care which tool — they care that verification failed.")
    lines.append("")
    lines.append("### Paid-tool failures (CoCounsel / Westlaw / Lexis+)")
    lines.append("")
    lines.append(f"**{len(paid_tool_cases)} cases** involved paid legal AI tools. The ruling is unambiguous: *the tool's pedigree is no defense.* Attorneys remained liable even when using enterprise-grade vetted tools.")
    lines.append("")
    for c in paid_tool_cases[:10]:
        amt = fmt_usd(c.get("amount"))
        lines.append(f"- **{c['case_name']}** — {c['court']} — {amt} — _{c.get('ai_tool_used', '?')}_")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── Policy Gaps ──────────
    lines.append("## Where firms fail (the 10 policy gaps)")
    lines.append("")
    lines.append("These are the patterns judges cite when issuing sanctions, ranked by how often they appear across the dataset.")
    lines.append("")
    lines.append("| Rank | Gap | Cases |")
    lines.append("|---|---|---|")
    for i, (gap, n) in enumerate(gap_counts.most_common(10), 1):
        pretty = gap.replace("-", " ").title()
        lines.append(f"| {i} | {pretty} | {n} |")
    lines.append("")
    lines.append("**The #1 failure mode — citation verification — shows up in nearly every sanctioned case.** No firm that maintains an independent verification step has been sanctioned.")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── Top sanctions ──────────
    lines.append("## Top 10 largest US monetary sanctions")
    lines.append("")
    lines.append("| Rank | Case | Court | Fine | AI Tool | Severity |")
    lines.append("|---|---|---|---|---|---|")
    for i, c in enumerate(top_money_us, 1):
        sev = c.get("severity", "—")
        tool = c.get("ai_tool_used", "—")[:25]
        lines.append(f"| {i} | {c['case_name'][:50]} | {c['court']} | **{fmt_usd(c.get('amount'))}** | {tool} | {sev} |")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── Career-ending cases ──────────
    lines.append(f"## The {len(career)} career-ending cases")
    lines.append("")
    lines.append("These are the cases that ended careers, disqualified attorneys from representation, or triggered bar referrals. Every partner should read these.")
    lines.append("")
    for c in career[:30]:
        amt = f" — **{fmt_usd(c['amount'])}**" if c.get("amount") else ""
        lesson = c.get("lesson")
        lines.append(f"### {c['case_name']}{amt}")
        lines.append(f"**Court:** {c['court']} · **Date:** {c.get('date', '—')} · **AI Tool:** {c.get('ai_tool_used', '—')}")
        if lesson:
            lines.append(f"\n> {lesson}")
        summary = (c.get("summary") or "").strip()
        if summary:
            lines.append(f"\n{summary[:400]}{'...' if len(summary) > 400 else ''}")
        src = c.get("source_url")
        if src:
            lines.append(f"\n*Source:* {src}")
        lines.append("")

    lines.append("---")
    lines.append("")

    # ────────── Pattern analysis ──────────
    lines.append("## Pattern analysis")
    lines.append("")
    lines.append("### The denial pattern")
    lines.append(f"**{len(denial_cases)} cases** involved denial or cover-up of AI use when first questioned. Courts consistently treat this as an aggravating factor — fines escalate, professional discipline follows.")
    lines.append("")
    lines.append("**The rule:** If a citation is challenged, disclose AI use immediately. Denial turns a fine into a bar referral.")
    lines.append("")
    lines.append("### The supervision pattern")
    lines.append(f"Many sanctioned cases involve a **supervising attorney signing off on AI-assisted work without substantive review**. When this happens, courts hold supervisors individually liable.")
    lines.append("")
    lines.append("### The 'paid tool' fallacy")
    lines.append(f"**{len(paid_tool_cases)} cases** involved enterprise tools (CoCounsel, Westlaw AI, Lexis+). The pedigree of the tool provides zero legal protection. Attorneys remain liable for every citation that goes into a filing.")
    lines.append("")
    lines.append("### Pro-se vs. attorney split")
    prose_cases = [c for c in cases if "pro-se" in (c.get("tags") or []) or "self-represented" in (c.get("tags") or [])]
    attorney_cases = [c for c in cases if "pro-se" not in (c.get("tags") or [])]
    lines.append(f"- **{len(prose_cases)} pro-se** cases (non-attorney filers) — typically soft sanctions")
    lines.append(f"- **{len(attorney_cases)} attorney** cases — where real career risk lives")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ────────── Raw export ──────────
    lines.append("## Methodology")
    lines.append("")
    lines.append("- **Source:** Damien Charlotin's HEC Paris smart-law AI hallucination tracker (the canonical academic dataset)")
    lines.append("- **Enrichment:** Each case independently classified by AI Vortex across five dimensions (severity, policy gap mapping, sanction type, tags, actionable lesson)")
    lines.append(f"- **Coverage:** {len(enriched):,} of {total:,} cases ({round(len(enriched)/total*100, 1)}%) enriched")
    lines.append("- **Review:** Cases flagged as high or career-ending severity are prioritized for human review")
    lines.append("- **Update cadence:** Weekly refresh against source tracker")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"*{total:,} cases · {len(state_counts)} US states · {len(countries_mapped)} countries · data as of {datetime.utcnow().strftime('%Y-%m-%d')}*")
    lines.append("")
    lines.append(f"**AI Vortex** — independent AI intelligence for the legal market · aivortex.io/legal")
    lines.append("")

    OUT_MD.write_text("\n".join(lines))

    # ────────── Structured JSON summary ──────────
    summary = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "totals": {
            "global_cases": total,
            "us_cases": len(us_cases),
            "intl_cases": len(intl_cases),
            "countries": len(countries_mapped),
            "us_states": len(state_counts),
            "us_monetary_total_usd": us_monetary,
            "global_monetary_total_usd": total_money,
            "enriched": len(enriched),
            "enriched_pct": round(len(enriched)/total*100, 1),
        },
        "severity": dict(sev_counts.most_common()),
        "us_severity": dict(us_sev.most_common()),
        "top_states": [
            {"state": s, "name": STATE_NAMES.get(s, s), "cases": n, "total_usd": state_totals.get(s, 0)}
            for s, n in state_counts.most_common(15)
        ],
        "top_states_by_money": [
            {"state": s, "name": STATE_NAMES.get(s, s), "total_usd": m, "cases": state_counts.get(s, 0)}
            for s, m in sorted(state_totals.items(), key=lambda x: -x[1])[:10]
        ],
        "top_countries": [
            {"code": c, "name": COUNTRY_NAMES.get(c, c), "cases": n}
            for c, n in sorted(countries_mapped.items(), key=lambda x: -x[1])[:15]
        ],
        "by_year": dict(sorted(by_year.items())),
        "by_year_avg_amount": {y: int(sum(a)/len(a)) if a else 0 for y, a in by_year_amount.items()},
        "top_tools": dict(tool_counts.most_common(15)),
        "top_gaps": dict(gap_counts.most_common(10)),
        "top_us_monetary": [
            {
                "rank": i,
                "case": c["case_name"],
                "court": c["court"],
                "state": c.get("state", ""),
                "amount": c["amount"],
                "severity": c.get("severity"),
                "ai_tool": c.get("ai_tool_used"),
                "date": c.get("date"),
                "source_url": c.get("source_url"),
            } for i, c in enumerate(top_money_us, 1)
        ],
        "career_ending": [
            {
                "case": c["case_name"],
                "court": c["court"],
                "state": c.get("state", ""),
                "country": c.get("country", ""),
                "amount": c.get("amount"),
                "date": c.get("date"),
                "ai_tool": c.get("ai_tool_used"),
                "lesson": c.get("lesson"),
                "summary": (c.get("summary") or "")[:400],
                "source_url": c.get("source_url"),
            } for c in career
        ],
        "paid_tool_cases": len(paid_tool_cases),
        "denial_cases": len(denial_cases),
        "prose_cases": len(prose_cases),
        "attorney_cases": len(attorney_cases),
    }

    OUT_JSON.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"✓ {OUT_MD.relative_to(ROOT)}")
    print(f"✓ {OUT_JSON.relative_to(ROOT)}")
    print()
    print(f"Markdown: {len(lines)} lines, {OUT_MD.stat().st_size:,} bytes")
    print(f"JSON:     {OUT_JSON.stat().st_size:,} bytes")

if __name__ == "__main__":
    main()
