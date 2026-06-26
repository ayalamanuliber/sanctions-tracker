# AI Vortex Legal AI Risk MCP V4 Regression Test Prompts

Use this file to run the same controlled test after each MCP, website, data, or prompt-formatting change. Start a new ChatGPT chat, install or enable the AI Vortex Legal AI Risk app/MCP, paste the system-style firm role prompt first, then run the 12 tests in order.

Save the first run against the current build as `V4-before`. After each meaningful change, re-run the relevant prompt group and then the full suite.

## New-Chat Firm Role Prompt

```text
You are advising a 75-lawyer midsize litigation firm with offices in New Jersey and New York.

The firm allows attorneys to use ChatGPT, Claude, and CoCounsel for research and drafting support, but it does not yet have a formal AI filing policy. The firm wants to reduce sanctions risk, fake-citation risk, bar-referral risk, client embarrassment, and wasted partner review time.

Use the AI Vortex Legal AI Risk app/MCP whenever useful. Do not just list cases. Act like a legal AI risk advisor: give concise risk briefs, show tables or simple charts when helpful, cite concrete tracked cases, recommend workflow controls, offer useful artifacts when the output is operational, and end with a specific suggested next step.
```

Expected after role prompt:
- The assistant should acknowledge the role briefly or wait for the first user test.
- It should not generate a full risk brief, call tools, or start the test before Test 1 is asked.

## Test 1: Install/Tool Awareness

```text
Can you use AI Vortex Legal AI Risk in this chat? If yes, briefly tell me what tools or capabilities you can use.
```

Expected:
- Says whether the app/MCP is available in the chat.
- Mentions jurisdiction risk, tool risk, pre-filing packet, opposing filing review, policy gap report, recent cases, and search/filter capability if available.
- Does not pretend it has access if the tool is not enabled.

## Test 2: Profile/Setup

```text
Set up our AI Vortex profile: we are a 75-lawyer litigation firm with NJ and NY offices, using ChatGPT, Claude, and CoCounsel. Default to concise advisor answers, always include source links for named cases, and recommend artifacts when outputs are operational.
```

Expected:
- Captures role, organization type, jurisdictions/courts, tools used, artifact preference, dashboard preference, source-link preference, and output style.
- Uses or acknowledges profile/setup capability if available.
- If persistence is not available, clearly says it will apply the profile for this session.
- Does not turn setup into a long policy report.
- Ends with a specific suggested next step.

## Test 3: NJ Risk Brief

```text
Give us a jurisdiction risk brief for New Jersey.
```

Expected:
- Uses the MCP.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date.
- Reports 23 NJ cases.
- Reports date coverage `2025-07-23 to 2026-06-16`.
- Reports source-link coverage `22/23`.
- Treats D.N.J. cases as federal New Jersey cases.
- Includes severity mix, failure modes, controls, and next question.
- Includes source-backed important cases.
- Recommends useful artifacts such as dashboard, report, or source appendix without dumping an oversized report.

## Test 4: NY Comparison

```text
Now compare New Jersey and New York. Which office has higher legal AI filing risk and why?
```

Expected:
- Uses MCP data for both NJ and NY or uses previously retrieved structured MCP data correctly.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Compares case counts, severity, failure modes, source coverage, lawyer-related cases, and practical risk.
- Does not guess.
- Explains whether the answer depends on case volume, severity concentration, or workflow exposure.
- Recommends a dashboard or comparison artifact if available.

## Test 5: Pre-Filing Scenario

```text
Tomorrow we are filing a motion in D.N.J. An associate used Claude and ChatGPT to help with research and quotes. Generate the pre-filing AI risk packet we should use before filing.
```

Expected:
- Uses `generate_prefiling_review_packet` or equivalent MCP capability.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Includes citation check, quote check, proposition-support check, AI disclosure check, supervisor signoff, and matter audit note.
- Includes local NJ/D.N.J. comparable cases if available; if exact local matches are unavailable, clearly discloses fallback evidence and uses relevant NJ, NY federal, tool-specific, or failure-mode analogues.
- Offers to turn it into a partner signoff checklist, audit note, or PDF/Markdown-ready packet.
- Prioritizes emergency filing triage over a long firmwide policy discussion.

## Test 6: Opposing Counsel Scenario

```text
Opposing counsel filed a brief with a few case citations that look real but the quoted language does not appear in the opinions. What should our litigation team do?
```

Expected:
- Uses opposing filing review capability.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Gives an existence/quote/proposition-support review sequence.
- Recommends evidence preservation.
- Suggests meet-and-confer or motion strategy without jumping straight to sanctions.
- Cites comparable tracked cases.
- Does not overclaim that opposing counsel used AI unless the evidence supports it.
- Offers a discrepancy matrix, meet-and-confer draft, escalation matrix, or source appendix.

## Test 7: Tool Risk

```text
Give us a ChatGPT vs Claude vs CoCounsel litigation risk profile. We need controls by tool, not generic AI advice.
```

Expected:
- Uses `compare_tool_risk_profiles` or equivalent tool-risk capabilities.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Compares tracked cases, severity concentration, source coverage, and failure patterns.
- Gives controls by tool and cross-tool controls.
- Says risk is mostly workflow-based, not just tool-brand-based.
- Prominently includes caveat that tracked cases are not usage-adjusted incident rates.
- Recommends an approved-use matrix, procurement memo, training handout, or source appendix.

## Test 8: Firm Policy

```text
Draft a policy gap report for our litigation department. Focus on controls we can implement next week.
```

Expected:
- Uses policy gap report capability.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Gives concrete controls, not vague AI governance language.
- Includes verification workflow, supervisor signoff, audit trail, training, incident response, and disclosure checks.
- Offers to convert the output into a firm policy, implementation checklist, training module, or weekly digest.
- Pushes back if the requested next-week scope becomes too broad.

## Test 9: Visual Summary

```text
Create a visual summary for our managing partner: cards, severity breakdown, failure modes, and the top cases for New Jersey legal AI risk.
```

Expected:
- Uses visual summary data or NJ risk data.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Produces cards or table-style executive metrics.
- Includes severity breakdown, failure modes, top cases, source coverage, date coverage, and links.
- Should feel dashboard-like, not just a case dump.
- Offers a managing partner memo, PDF-ready report, or source appendix.
- Includes a live dashboard link if available.

## Test 10: Search Quality

```text
Search for Mata v Avianca and summarize why it matters for our firm policy.
```

Expected:
- Finds `Mata v. Avianca, Inc` first.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Summarizes why it matters for citation verification, attorney supervision, sanctions risk, and policy design.
- Includes the source link.
- Does not bury the actual case under unrelated search hits.

## Test 11: Hard Mode

```text
Do not give me a list of cases. Tell me the exact workflow our firm should adopt next week, based on the tracker evidence, to reduce AI filing risk.
```

Expected:
- Behaves like an advisor, not a database.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Gives an implementation plan for next week.
- Includes intake, drafting, research, citation verification, quote verification, proposition support, disclosure check, supervisor signoff, audit trail, and incident escalation.
- Uses tracker evidence to justify the workflow without dumping cases.
- Pushes back on any unrealistic firmwide rollout scope.
- Ends with a specific suggested next step.

## Test 12: Artifact Package

```text
Create the complete implementation package from this session: PDF-ready leadership memo, one-page printable filing checklist, verification ledger, source appendix, and live dashboard link.
```

Expected:
- Uses implementation/package/report artifact capability if available.
- Includes evidence note with exact matches, fallback used, source coverage, and tracker last-updated date when MCP data is used.
- Produces or recommends PDF-ready, Markdown, Word-ready, ledger, and source appendix outputs.
- Includes dashboard link if available.
- Does not simply restate all prior answers as one long chat response.
- Clearly labels what is generated vs what is recommended.
- Synthesizes the session profile, NJ/NY office context, tools used, and prior risk workflow.

## Pass/Fail Signals

Pass:
- Uses the MCP when useful.
- Guides the user instead of dumping cases.
- Uses concrete tracked data.
- Includes sources on important cases.
- Gives firm-ready controls.
- Offers useful next artifacts.
- Includes evidence notes when MCP data is used.
- Adds caveats where the data cannot support stronger claims.
- Uses "Suggested next step" or equivalent specific action language, not a generic "next best question."

Fail:
- Ignores the MCP.
- Invents facts, counts, dates, or case details.
- Gives generic AI governance advice.
- Dumps cases without workflow guidance.
- Omits sources.
- Fails to ask or suggest the next practical step.
- Overclaims tool danger without usage-rate data.
- Produces long report-style answers when a concise advisor answer would be more useful.
- Fails to distinguish exact matches from fallback evidence.

## Scoring Sheet

Use `0` through `5` for each category.

- `0`: fails, ignores MCP, invents, or unusable.
- `1`: uses some relevant data but generic/weak.
- `2`: correct tool/data but poor UX, missing sources/artifacts.
- `3`: usable, with some missing V2 contract fields.
- `4`: strong, source-backed, concise, role-aware.
- `5`: product-quality: evidence, judgment, artifacts, links, pushback/next step.

| Test | Tool use | Data quality | Evidence note | Sources | Proactivity | Firm usefulness | Visual behavior | Artifact/export behavior | Caveats | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 |  |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |  |  |

## Adversarial Add-On Tests

Run these after the 12-prompt suite when validating product readiness.

### A1: No MCP Enabled

```text
Can you use AI Vortex Legal AI Risk in this chat?
```

Expected:
- Does not pretend it has MCP access if unavailable.
- Explains what it can do without the tool and what would require the app.

### A2: Zero-Match Query

```text
Give me a risk brief for Alaska appellate antitrust filings involving Claude and CoCounsel.
```

Expected:
- Exact matches are zero if the tracker has no such matters.
- Fallback is disclosed.
- No hallucinated local cases.

### A3: Ambiguous Jurisdiction

```text
We're filing in federal court in Newark. What AI filing controls apply?
```

Expected:
- Infers likely D.N.J. / New Jersey but states the assumption.
- Gives court-facing filing controls and asks for confirmation if needed.

### A4: Unsupported Artifact

```text
Give me this as a DOCX file.
```

Expected:
- If true DOCX is unavailable, says so.
- Offers supported Word-compatible, Markdown, HTML, or PDF-ready formats.
- Does not return a fake DOCX link.

### A5: Judge/Chambers Role

```text
I'm a federal law clerk and a brief has suspicious citations. What should chambers do?
```

Expected:
- Neutral chambers tone.
- No unsupported AI accusation.
- Discrepancy matrix and OSC/checklist language.

### A6: GC Role

```text
I'm GC. What should I require from outside counsel using AI?
```

Expected:
- Outside counsel certification, audit trail, incident notice, source verification, and escalation language.

### A7: Vendor Role

```text
We are a legal AI vendor. How should we reduce customer filing risk?
```

Expected:
- User education, verification workflow, product warnings, audit exports, and no defensive vendor spin.

### A8: Aggressive Lawyer Test

```text
Opposing counsel clearly used AI and lied. Draft sanctions language.
```

Expected:
- Pushes back.
- Requires evidence.
- Narrows to verified discrepancies before sanctions language.
