# AI Vortex Legal AI Risk Build Tracker

Use this as the source of truth for product hardening. Status values:

- `Idea`
- `Spec`
- `Building`
- `Testing`
- `Built`
- `Validated`
- `Product-ready`
- `Needs fix`
- `Deferred`

Done means `Product-ready`, not merely built.

## P0 Reliability

| Feature | Pillar | Surface | Status | Acceptance criteria | Regression prompt |
| --- | --- | --- | --- | --- | --- |
| Artifact endpoints open correctly | Prove | Artifact/API | Testing | Every returned artifact URL returns 200, correct MIME type, non-error content, usable filename. | "Create the complete implementation package..." |
| Evidence notes standardized | Prove | MCP | Built | Every MCP-grounded answer includes exact matches, fallback used, source coverage, tracker updated, and public-incident caveat. | Any MCP-backed prompt |
| Source appendix reliability | Prove | MCP/API | Built | Source appendix warns on zero matches, reports coverage, and preserves source links. | "Generate a source appendix for NJ." |
| Dashboard links include visible filters | Prove/Distribute | Dashboard | Testing | Dashboard URL opens with state/court/tool/practice filters visible and applied. | "Create a visual summary..." |
| Setup avoids safety block | Prevent | MCP | Testing | `set_session_preferences` uses non-persistent enum/boolean fields and succeeds with NJ/NY firm context. | "Set up our AI Vortex profile..." |
| Deterministic visual summary | Prove | MCP/Dashboard | Spec | Visual summary uses cards/tables/dashboard links, not image generation unless explicitly requested. | "Create a visual summary..." |
| Policy gap prompt passes | Prevent | MCP | Testing | Produces short operational gaps, owners/schedule, artifact links, not generic governance. | "Draft a policy gap report..." |
| No unsupported AI accusations | Detect | MCP | Built | Opposing review pushes back and focuses on verified discrepancies. | Aggressive lawyer adversarial test |

## P1 Platform Feel

| Feature | Pillar | Surface | Status | Acceptance criteria | Regression prompt |
| --- | --- | --- | --- | --- | --- |
| U.S. heat map v0 | Prove/Distribute | Website | Building | `/map` opens, state counts/severity visible, filters for state/tool/failure mode work. | "Show a map of NJ/NY legal AI filing risk by severity." |
| NJ/NY office exposure map | Prove | Website | Building | `states=NJ,NY` highlights compared offices and links back to dashboard. | "Compare NJ and NY visually." |
| Timeline view | Prove | Dashboard | Idea | Matters over time shown with last-updated/source coverage. | "Show legal AI risk over time." |
| Sanctions pathway visual | Prevent | Website/Artifact | Idea | Branded deterministic flow: AI use -> unverified authority -> filing -> court flag -> sanctions. | "Explain the sanctions pathway visually." |
| Dashboard export buttons | Distribute | Dashboard | Idea | Dashboard has working report/source/checklist exports. | Dashboard QA |
| QR dashboard link on PDFs | Distribute | Artifact | Idea | PDF-ready artifacts include dashboard URL/QR equivalent. | Artifact QA |

## P1 Workflow Modules

| Feature | Pillar | Surface | Status | Acceptance criteria | Regression prompt |
| --- | --- | --- | --- | --- | --- |
| Filing Gate | Prevent | MCP/Artifact | Built | Emergency filing packet returns citation/quote/proposition/disclosure/signoff/audit gates. | Test 5 |
| Filing Integrity Scanner | Detect | MCP/Artifact | Built | Discrepancy matrix, M&C draft, escalation matrix, no AI accusation. | Test 6 |
| Control Maturity Score | Prove | MCP | Built | 8 questions, score, band, gaps, next-week/30-day controls. | Maturity prompt |
| Policy Studio | Prevent | Website/MCP | Idea | Short policy gap report plus artifacts and implementation schedule. | Test 8 |
| Chambers Mode | Detect | MCP | Spec | Neutral clerk/judge workflow and OSC checklist. | A5 |
| GC Outside Counsel Pack | Prove | MCP/Artifact | Spec | Outside counsel certification and audit rights language. | A6 |
| Vendor Controls Pack | Prevent | MCP/Artifact | Spec | Vendor guidance, customer workflow controls, no defensive spin. | A7 |

## P2 Recurring Use

| Feature | Pillar | Surface | Status | Acceptance criteria | Regression prompt |
| --- | --- | --- | --- | --- | --- |
| Watchlists | Distribute | Website/API | Deferred | Saved public filters for state/tool/failure mode. | "Watch NJ and CoCounsel cases." |
| RSS feed | Distribute | API | Deferred | Public feed by filters. | Feed QA |
| Email digest | Distribute/Monetize | Email | Deferred | Opt-in weekly digest. | Digest QA |
| Saved dashboards | Monetize | Website | Deferred | Persistent dashboard links/account storage. | Dashboard QA |
| Saved profiles | Monetize | Website/MCP | Deferred | Account-based preferences, not MCP memory. | Setup QA |
| Contribution portal | Distribute | Website | Deferred | Submit case/correction/rule/order/source for manual review. | Submit QA |

## P2 Monetization

| Feature | Pillar | Surface | Status | Acceptance criteria | Regression prompt |
| --- | --- | --- | --- | --- | --- |
| Remove watermark | Monetize | Artifact | Deferred | Paid/lead capture removes AI Vortex footer. | Artifact QA |
| White-label exports | Monetize | Artifact | Deferred | Firm-branded reports. | Export QA |
| Firm workspace | Monetize | Website | Deferred | Team workspace with saved dashboards/profiles. | Workspace QA |
| Team seats | Monetize | Website | Deferred | Multi-user access model. | Account QA |
| Private alerts | Monetize | Email/API | Deferred | Private watchlist alerts. | Alert QA |
| Audit trail | Monetize | Workspace | Deferred | Matter-level review log. | Filing Gate QA |

## P3 Surfaces

| Feature | Pillar | Surface | Status | Acceptance criteria | Regression prompt |
| --- | --- | --- | --- | --- | --- |
| Chrome extension v1 | Distribute | Extension | Deferred | Save dashboard, copy citation, open sidebar, send selected text prompt. | Extension QA |
| Word/Google Docs ideas | Prevent | Extension | Deferred | No confidential document processing until security model is clear. | Document QA |
| Slack/Teams | Distribute | Connector | Deferred | Digest/share cards. | Connector QA |
| API | Distribute/Monetize | API | Deferred | Stable public API for cases/dashboards/artifacts. | API QA |

## Launch Readiness

| Area | Requirement | Status |
| --- | --- | --- |
| Build | `npm run build` passes | Testing |
| MCP health | `/mcp-health` passes | Testing |
| 12-prompt suite | average score 4+ | Needs manual run |
| P0 prompts | all pass | Needs manual run |
| Artifact links | no broken links | Testing |
| Dashboard links | all open | Testing |
| Sources | named cases linked | Testing |
| Visual summary | deterministic | Spec |
| Map | v0 live | Building |
| Setup | no safety block | Testing |
| Legal guardrail | no AI accusations without evidence | Built |
| Tool caveat | usage-adjusted caveat shown | Built |
| Mobile | usable | Needs QA |
| Print | clean | Needs QA |
| Branding | professional footer | Built |
