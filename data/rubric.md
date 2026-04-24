# Sanctions Tracker — Enrichment Rubric v1

Classify each AI-hallucination case into the fields below. Output JSON only.
Keyed by `id`. Read the batch file, apply rules, write the enrichment file.

## Output shape

```json
{
  "case-id-slug": {
    "severity": "career-ending|high|medium|low",
    "policy_gap_ids": ["<one or more of the 10 ids below>"],
    "sanction_types": ["<refined list>"],
    "tags": ["<3-5 from controlled vocab>"],
    "lesson": "One-sentence partner takeaway. Specific. Actionable.",
    "confidence": "high|medium|low"
  }
}
```

## SEVERITY (decide in this order)

1. **career-ending** — disqualification from the case/firm, bar referral, published appellate opinion naming the attorney, career-terminating professional sanction, dismissed-with-prejudice where attorney conduct central, license suspension
2. **high** — monetary sanction ≥ $10,000 OR any professional discipline (bar referral, mandatory CLE ordered, firm disqualification, striking all pleadings) OR case-dismissed-with-prejudice
3. **medium** — monetary $1,000–$9,999 OR documented public warning with ethics referral OR attorney ordered to explain/show cause
4. **low** — nominal penalty <$1K, dismissed without prejudice, admonishment only, OR **any pro-se (non-attorney) filing** regardless of outcome

**Pro-se rule is firm**: if `party` or `case_name` or `summary` indicates the filer was pro se / self-represented / non-lawyer, severity = **low**. These are volume filler for our map; they don't threaten a partner.

## POLICY_GAP_IDS (the 10 gaps our assessment tests)

Map the ruling to the gap(s) it would punish:

- `written-ai-policy` — absence of firm-wide AI policy cited as aggravating
- `citation-verification` — attorney didn't verify AI-generated citations against primary sources
- `paid-tool-verification` — failure to verify output from "paid/vetted" tools like CoCounsel / Westlaw / Lexis
- `attorney-training` — attorney lacked AI ethics training; court ordered CLE
- `supervision-protocol` — partner/supervisor failed to review AI-assisted work
- `ai-disclosure-protocol` — required AI disclosure not made to the court
- `engagement-letter-ai` — no AI-usage clause in engagement letter
- `approved-tools-list` — use of unsanctioned / consumer AI tool
- `audit-trail` — no documentation of what was AI-drafted or how verified
- `incident-response` — attorney denied/concealed AI use when questioned; escalated sanctions

Pick **1-4** ids. Most cases hit 2-3. Missing a verification step is almost universal (`citation-verification`). If the attorney denied AI use → add `incident-response`.

## SANCTION_TYPES (refine the derived list)

Controlled vocab: `monetary`, `professional`, `referral`, `bar-referral`, `disqualification`, `training-order`, `warning`, `struck-pleading`, `case-dismissed`, `published-opinion`, `ordered-to-show-cause`, `none-adjudicated`.

Pick all that apply.

## TAGS (controlled vocab — 3 to 5 per case)

`fake-citations` · `fabricated-quotes` · `pro-se` · `biglaw` · `small-firm` · `solo` · `appellate` · `trial` · `administrative` · `paid-tool` · `consumer-tool` · `denial` · `first-in-state` · `first-in-circuit` · `multi-firm` · `multi-attorney` · `criminal` · `civil` · `family` · `immigration` · `ip` · `employment` · `bankruptcy` · `tax` · `class-action` · `published-opinion` · `bar-referral` · `disqualification` · `training-ordered` · `government-lawyer` · `prosecutor` · `public-defender` · `under-seal`

If you can't tell from the summary, skip that tag. Don't invent new tags.

## LESSON — one sentence

Write like you're briefing a managing partner. Specific, imperative, under 20 words.

Good:
- *"Require a second attorney to verify every AI citation against Westlaw before filing — no self-verification."*
- *"If a citation is challenged, disclose AI use immediately; denial turns fines into bar referrals."*
- *"Paid tools do not absolve you — courts rule the tool's pedigree is no defense."*

Bad (too vague):
- *"Be careful with AI."*
- *"Always verify citations."*

## CONFIDENCE

- **high** — summary clearly describes the ruling, attorney's conduct, and sanction
- **medium** — outcome known but some details thin
- **low** — summary stub, alleged-only, or non-English notes

## Rules for output

- Output ONLY a single JSON object keyed by case id. No prose, no markdown fences.
- Include every case id from the input batch.
- If a case is too thin to classify, return it with `severity: "low"`, empty `policy_gap_ids`, `tags: ["pro-se"]` if pro se, `confidence: "low"`, `lesson: null`.
- Never output newlines inside string values.
