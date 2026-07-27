# AI Vortex Current Master Plan

## North star

Build the default public intelligence and workflow layer for legal AI risk:

- useful enough that legal professionals adopt it because the core record is free;
- trustworthy enough for lawyers, judges, researchers, insurers, vendors, and legal operations teams;
- convenient enough that individuals and organizations pay for workflow acceleration, continuity, and presentation quality;
- channel-independent, so the same intelligence works on the website, through AI assistants, and beside legal research in a browser.

The product should help users move through a defensible sequence:

```text
find the record
inspect the source
understand the pattern
apply the right review workflow
share a source-backed record
```

## Product architecture

### 1. Website: canonical public surface

The website owns:

- search and discovery;
- case, court, topic, and jurisdiction pages;
- maps and analytics;
- source inspection and methodology;
- public workflow tools;
- report and artifact rendering;
- SEO and AEO acquisition;
- the canonical URLs used by the MCP and extension.

### 2. MCP / AI app: conversational workflow surface

The MCP lets users:

- ask natural-language questions about the public corpus;
- generate jurisdiction and tool-risk briefs;
- build pre-filing and opposing-filing review packets;
- receive transparent fallback explanations;
- obtain source, dashboard, map, and artifact links;
- turn public intelligence into role-aware operational guidance.

The MCP is not a separate database. It is another interface to the same evidence and workflow layer.

### 3. Chrome extension: in-context convenience surface

The extension will eventually:

- recognize cases, courts, citations, and relevant selected text on a page;
- show exact matches and transparent related results;
- surface the primary source and evidence note;
- save records into review packets;
- support selected-text review without alleging AI use;
- export or hand work to the website and AI app.

The extension comes after the canonical website and report system are stable.

## Business model

### Public research: free

- Search the public corpus.
- Inspect case records and source links.
- Use maps, core analytics, courts, topics, and methodology.
- Use basic public workflows.
- Connect the read-only public MCP.
- Generate limited AI Vortex-branded reports.

### Workflow Pro: individual convenience

- Clean reports without promotional branding.
- Saved searches, packets, and reusable views.
- Recurring alerts and watchlists.
- Expanded exports and report history.
- Chrome extension workflow features.
- Faster handoff between web, MCP, and extension.

### Firm / organization

- Team workspaces and shared packets.
- Firm or chambers branding.
- Custom report templates.
- Organization profiles and default controls.
- Admin, audit, retention, and permission settings.
- Integration and API support.

The core evidence does not become better when someone pays. Paid value comes from saved time, continuity, packaging, collaboration, and control.

## Current product state

### Working foundation

- Public corpus ingestion and validation.
- Searchable case directory.
- Canonical case pages.
- United States map.
- Court and topic discovery.
- Analytics overview, explore, and data views.
- Filing integrity, pre-filing, policy, and maturity workflow foundations.
- Read-only MCP with structured risk tools.
- Printable artifact infrastructure.
- Current data refresh through July 23, 2026 in the local build.

### Recently passed

- Analytics has received a product-level pass after layout, interaction, filter, chart, and report refinements.
- Search and map foundations are materially stronger, though continued QA remains necessary.

### Active work

- Shared report system for analytics and case briefs.
- Consistent Free/Pro presentation.
- Canonical report identity, scope, provenance, and source treatment.

### Not yet complete

- Production authentication and billing.
- Native PDF/DOCX/PPTX generation.
- Saved user accounts and persistent workspaces.
- Alerts and watchlists.
- Chrome extension.
- Full programmatic case-page rollout and editorial review.
- Firm-level branding configuration.

## Experience principles

### Evidence before assertion

- Link the source.
- State what was matched.
- Distinguish exact results from fallbacks.
- Distinguish recorded AI attribution from inference.
- Never treat a discrepancy as proof that AI was used.

### Progressive depth

- Start concise.
- Let professionals inspect more detail.
- Ask clarifying questions when the requested deliverable depends on organization-specific facts.
- Do not force a full consultant-style report when a short decision is enough.

### Operational usefulness

Every major surface should help the user take a defensible next action:

- inspect;
- compare;
- verify;
- preserve;
- assign;
- review;
- export;
- share.

### One intelligence layer

Search terms, filters, case identities, source links, report scope, and evidence notes should remain consistent across web, MCP, and extension.

### Premium without artificial scarcity

Free outputs should demonstrate value. Premium removes friction and improves continuity and presentation; it should not hold primary public evidence hostage.

## Audience modes

### Lawyer or litigation team

- Pre-filing verification.
- Opposing-filing discrepancy review.
- Comparable cases and consequences.
- Review packet and signing-attorney record.

### Judge or chambers

- Neutral record.
- Source-first language.
- No unsupported intent or AI-use attribution.
- Court, rule, and procedural context.

### Researcher or knowledge professional

- Reproducible filters.
- Corpus definitions and limitations.
- Source coverage and data exports.
- Trend and cross-tab analysis.

### Legal operations, risk, or insurer

- Control gaps.
- Jurisdiction and practice patterns.
- Maturity assessment.
- Repeatable workflows and audit artifacts.

### Legal technology vendor

- Public failure patterns.
- Transparent attribution caveats.
- API/MCP integration.
- Evidence that can be brought into existing products.

### Solo practitioner or small firm

- Fast, understandable safeguards.
- Useful free access.
- Ready-to-use checklists and packets.
- Low-friction individual Pro tier.

## Execution roadmap

## Phase 0: Preserve the source of truth

- Keep this file as the current product master plan.
- Keep `docs/CURRENT_TASK_HANDOFF.md` as the active implementation handoff.
- Treat `docs/AI_VORTEX_ENDGAME_MASTER_PLAN.md` as a historical detailed reference.
- Update `docs/build-tracker.md` after each completed product block.
- Do not reset the current dirty worktree or remove untracked files without a deliberate review.

Done when:

- A new task can resume from these documents without rereading the full conversation.

## Phase 1: Shared report and artifact system

Build:

- Analytics evidence brief.
- Case brief / review packet.
- Free/Pro preview.
- Shared report identity, report IDs, provenance, source treatment, footer, and print behavior.
- Honest export support.

Then extend the same system to:

- Jurisdiction brief.
- Pre-filing packet.
- Filing integrity review.
- Policy gap and implementation package.
- Control maturity report.
- Managing-partner or chambers summary.

Done when:

- Every report type feels related but is shaped around its actual decision.
- Free reports are useful and branded.
- Pro reports are clean and eventually organization-brandable.
- Print and source links work reliably.

## Phase 2: Canonical public intelligence surfaces

Complete:

- Search filters with counts, clear column semantics, useful sorting, pagination, and durable URLs.
- Map interactions that update the associated record list and preserve filters.
- Court, jurisdiction, topic, and source discovery.
- Case pages with consistent editorial fields and source status.
- Analytics drill-down into the exact underlying records.
- Mobile navigation and responsive interaction QA.

Programmatic case rollout:

1. Establish the canonical case template.
2. Validate representative cases across jurisdictions, severities, source states, and participant types.
3. Add structured metadata, canonical URLs, and internal linking.
4. Generate the remaining pages programmatically.
5. Run duplicate-title, missing-source, and indexability checks.

Done when:

- A researcher can reproduce a result.
- A lawyer can find the source quickly.
- A search visitor can land on a case and understand why it matters.

## Phase 3: MCP product readiness

Revalidate and complete:

- Concise advisor tone.
- Role-aware behavior.
- Clarifying questions where required.
- Structured response contract.
- Evidence notes.
- Exact-match and transparent fallback ladder.
- Source links and source appendices.
- Artifact and dashboard links.
- Filing integrity guardrails.
- Tool-comparison caveats.
- Session synthesis.
- Control maturity and profile/setup flows.

Testing:

- Maintain a versioned regression suite.
- Test in a fresh ChatGPT conversation after MCP refresh.
- Test exact match, zero match, role changes, urgent filing, artifact generation, and cross-session limitations.

Done when:

- A legal professional can ask a normal question and receive a concise, sourced, operational answer without learning tool names.

## Phase 4: Recurring-use loop

Build:

- Saved searches.
- Jurisdiction, court, judge, tool, and failure-mode watchlists.
- Daily, weekly, and custom digests.
- “What changed?” views.
- New-case and corrected-record alerts.
- Saved report and packet history.

Done when:

- Users have a reason to return weekly without manually repeating searches.

## Phase 5: Chrome extension

Build only after canonical data and report contracts are stable:

- Privacy-first onboarding.
- Exact case/page matching.
- Transparent fallback results.
- Selected-text review.
- Source and evidence-note display.
- Save to packet.
- Open canonical case page.
- Export/share handoff.
- Offline, loading, error, and empty states.

Guardrails:

- No browsing-history collection.
- No page content storage by default.
- Clear explanation of what is read and when.
- No unsupported conclusion that AI was used.

Done when:

- The extension shortens the path from reading a legal page to saving a source-backed review record.

## Phase 6: Paid workspace and organization controls

Build:

- Authentication and billing.
- Individual and organization workspaces.
- Saved packets, views, and reports.
- Team roles and sharing.
- Custom logos and firm/chambers templates.
- Report retention and audit history.
- Admin defaults and risk posture.
- API access and enterprise integration controls.

Done when:

- Paid users receive durable workflow value rather than only cosmetic removal of a footer.

## Data and freshness plan

### Current pipeline

Use the existing import and validation scripts as the foundation:

```bash
npm run update:data:dry-run
npm run update:data
npm run validate:data
```

### Required production behavior

- Scheduled ingestion.
- Validation before publication.
- Atomic data promotion.
- Last successful corpus check displayed separately from latest decision date.
- Failure notification and retained last-known-good corpus.
- Correction workflow.
- Source-link and missing-field monitoring.
- Versioned data snapshots or reproducible build metadata.

### Quality metrics

Track:

- source-linked coverage;
- normalized case-name coverage;
- court and jurisdiction coverage;
- missing key-field rate;
- human-review coverage;
- allegation-only records;
- duplicate or conflicting records;
- update latency.

## Report system strategy

Reports are a central monetization and trust surface, not a decorative export.

### Report families

- Case brief.
- Analytics evidence brief.
- Jurisdiction brief.
- Filing review packet.
- Opposing-filing discrepancy record.
- Policy and implementation package.
- Control maturity report.
- Executive/chambers summary.

### Required report contract

- Identity and report type.
- Report ID and dates.
- Audience and purpose.
- Scope and filters.
- Advisor readout.
- Key evidence.
- Underlying sources.
- Recommended controls or actions.
- Evidence boundary and limitations.
- Review and print actions.
- Tier-aware branding.

### Conversion model

- Free: clearly AI Vortex-branded, fully useful, source-backed.
- Pro: clean export, saved history, reusable packets, no promotional branding.
- Firm: organization-branded templates, team workflow, administration, and auditability.

The upgrade prompt should appear where the user experiences packaging value, not as an obstruction before they can inspect evidence.

## Trust and legal boundaries

- Public intelligence, not legal advice.
- Observed incidents, not usage-adjusted rates.
- Named-tool comparisons require denominator caveats.
- A source link is not the same as source verification.
- AI attribution must reflect the record’s evidence status.
- A discrepancy is not proof of AI use or misconduct.
- Generated policies and controls require organization-specific legal, ethics, security, and operational review.
- Corrections must be visible and easy to submit.

## Product metrics

### Public utility

- Search-to-case-open rate.
- Source-link click rate.
- Case-page organic entry.
- Analytics drill-down rate.
- Workflow started from a public record.

### Trust

- Source coverage.
- Correction turnaround.
- Missing-data rate.
- Report source-link integrity.
- Reproducible filter/view success.

### Recurring use

- Weekly returning users.
- Saved searches and watchlists.
- Alert opens.
- Packets revisited.
- MCP active users.

### Paid conversion

- Free report to clean-export conversion.
- Packet save limit reached.
- Extension workflow activation.
- Individual-to-team expansion.
- Firm-branding requests.

## Launch definition

The first public-ready launch does not require every future feature.

It does require:

- current, validated corpus;
- reliable search, map, analytics, and representative case pages;
- clear methodology and correction paths;
- working source links;
- consistent branded reports;
- stable read-only MCP installation instructions;
- honest product and privacy claims;
- no broken or fake export promises;
- responsive desktop and mobile behavior;
- monitoring for data refresh and route failures.

## Deferred until the foundation is stable

- Full Chrome extension.
- Complex marketplace distribution.
- Enterprise SSO.
- Private DMS integrations.
- Automated review of confidential uploads.
- Native Office add-ins.
- Predictive sanctions scoring.
- Automated claims about lawyer intent or AI use.
- Large-scale white-label administration.

These are deferred because they amplify the product. They should not be built on inconsistent case, source, report, or entitlement contracts.

## Validation checklist

For each completed block:

```bash
npm run lint
npm run build
npm run validate:data
npm run validate:product
npm run test:product
```

Also perform:

- desktop visual QA;
- mobile visual QA;
- keyboard and focus QA;
- print/PDF QA for reports;
- source-link spot checks;
- URL/filter persistence checks;
- empty, missing-data, and long-content states;
- legacy MCP/artifact URL checks.

## Immediate next milestone

Finish the two report prototypes in `docs/CURRENT_TASK_HANDOFF.md`.

Do not begin the Chrome extension, billing, or mass case-page rollout until:

- the analytics report and case brief share a stable contract;
- Free/Pro report behavior is visually approved;
- print behavior and source links pass;
- the legacy artifact route remains intact.

That report system becomes the reusable rendering foundation for the website, MCP, future extension, and paid workspace.
