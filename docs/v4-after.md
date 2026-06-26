# AI Vortex Legal AI Risk V4-after Engineering Validation

Validation captured after V2 Core MCP behavior changes.

## Automated / Direct Checks

### Build

- `npm run build` passed.

### Local server

- Started built app on `http://localhost:3001` because port `3000` was already in use.

### URL checks

| Check | Result |
| --- | --- |
| `/dashboard?state=NJ&audience=managing_partner&ai_tool=Claude&practice_area=litigation` | `200 text/html` |
| `/api/artifact?type=source&format=md&state=NJ&ai_tool=Claude` | `200 text/markdown` with zero-match warning |
| `/api/artifact?type=opposing&format=doc&state=NJ` | `200 application/msword` |
| `/mcp-health` | `200 application/json` |

### MCP tool list

Confirmed exposed tools now include:

- `setup_user_profile`
- `generate_control_maturity_score`
- `generate_opposing_filing_review`
- `generate_dashboard_deep_link`
- `generate_source_appendix`
- `compile_implementation_package`

### Targeted MCP calls

#### Profile/setup

`setup_user_profile` returns:

- session-level persistence note
- role
- organization type
- jurisdictions
- AI tools
- artifact preference
- dashboard preference
- concise advisor behavior
- source-link and no-unsupported-AI-accusation guardrails

#### Control maturity

`generate_control_maturity_score` returns:

- evidence note
- 0-100 score
- maturity band
- 8 control scores
- priority gaps
- next-week controls
- 30-day controls
- artifact links

#### Opposing filing review

`generate_opposing_filing_review` returns:

- evidence note
- first-pass review sequence
- discrepancy matrix
- preservation steps
- meet-and-confer draft
- escalation matrix
- explicit guardrail against alleging AI use without evidence
- source-backed analogues
- opposing review artifact link

#### Smart fallback

Tested narrow pre-filing query:

```text
state=NJ, court=D. New Jersey, practice_area=antitrust, document_type=motion, ai_tool=Claude, urgency=filing_tomorrow
```

Result:

- Exact matches: `0`
- Fallback used: `yes`
- Fallback level: `same_jurisdiction_broader`
- Fallback reason disclosed
- Matched set used: `23`
- Source coverage: `22/23 (96%)`
- Emergency triage and verification ledger link returned

## Manual V4-after Run Still Needed

The full `docs/mcp-regression-test-prompts.md` suite must still be run in a fresh ChatGPT app chat after refreshing the dev MCP app, because host-level behavior determines:

- whether ChatGPT calls the most appropriate MCP tool proactively;
- whether it preserves session profile context across prompts;
- whether it renders visuals/images for Prompt 9;
- whether it synthesizes prior answers for Prompt 12.

The MCP now exposes the needed tool surface and response behavior for that test.
