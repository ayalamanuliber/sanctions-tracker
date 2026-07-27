# Ops Handoff: AI Vortex Report System

## Current objective

Finish the shared AI Vortex report system by producing two production-quality prototypes:

1. An analytics evidence brief generated from the active analytics view.
2. A case brief / review packet generated from a canonical case record.

Both reports must support an internal Free/Pro preview toggle, share one visual and evidentiary language, print cleanly, and preserve links to underlying public sources.

This is the active implementation task. Analytics itself has received a product pass; the next work is report packaging, not another analytics redesign.

## Established context

### Product position

- Public legal AI risk intelligence remains free.
- Users pay for convenience: cleaner exports, recurring workflows, saved work, distribution, integrations, and organization branding.
- The website is the canonical search, evidence, trust, and rendering surface.
- The MCP is the conversational distribution and workflow surface.
- The Chrome extension is a later convenience surface and is not part of this task.

### Current corpus state

- The latest local product surfaces show a corpus checked on July 23, 2026.
- The latest screenshots show 1,796 tracked matters.
- Do not hard-code these values into report templates. Read them from the existing corpus analytics/data helpers.

### Existing report surfaces

- Analytics report: `app/analytics/print/page.tsx`
- Legacy artifact renderer: `app/artifact/print/page.tsx`
- Legacy artifact controls: `app/artifact/print/PrintButton.tsx`
- Case record route: `app/cases/[slug]/page.tsx`
- Case data helpers: `lib/cases.ts`
- Artifact helpers: `lib/artifacts.ts`

The legacy `/artifact/print` route must remain working because existing MCP outputs and previously shared links depend on it.

## Work already started

The following new files exist and should be treated as intentional partial work:

### `lib/reporting.ts`

- Defines `ReportTier = "free" | "premium"`.
- Defines deterministic `createReportId(prefix, input)`.

### `components/reports/ReportPreviewToolbar.tsx`

- Client-side preview toolbar.
- Supports Free/Pro switching through query parameters.
- Preserves the current route and other query parameters.
- Supports native share or clipboard fallback.
- Supports browser printing.
- Uses Lucide icons.

### `components/reports/report-preview.module.css`

- Desktop and mobile toolbar styling.
- Toolbar is hidden in print.

These files have not yet been fully integrated into the analytics or case report routes.

## Key decisions

### Shared report principles

Every report should contain:

- AI Vortex report identity.
- Report type.
- Deterministic report ID.
- Generated date.
- Corpus/evidence checked date.
- Explicit scope and active filters.
- Clear separation between recorded facts, analytical signals, and limitations.
- Direct links to named sources.
- A concise advisor readout.
- A visible evidence boundary.
- `Send for review` and `Print / Save PDF` actions.

Use the dark/black logo on a white report background. Branding should feel institutional and authoritative, not promotional.

### Free report

- Keeps visible AI Vortex branding.
- Includes source links and full evidentiary transparency.
- Includes a restrained footer invitation for clean or firm-branded exports.
- Must remain genuinely useful; facts and source access are not paywalled.

### Pro preview

- Removes promotional watermark and upgrade copy.
- Uses clean neutral packaging.
- Represents the future unbranded or organization-branded export.
- Does not change the evidence or analysis quality.

The toggle is currently for internal design and QA. It is not an entitlement or billing implementation.

### Content rules

- Do not show unexplained tag dumps such as a generic `Observed Signals` list.
- Report modules must reflect the report type and decision being supported.
- Do not promise native DOCX, PPTX, or server-generated PDF until those exports actually exist.
- Browser `Print / Save PDF` is the currently supported PDF path.
- Prefer `Send for review` over `Email report`.
- One page is preferred for executive summaries, but a readable multi-page report is better than cramped content.

## Report specifications

### Analytics evidence brief

Route: `/analytics/print`

Required modules:

1. Report header and identity.
2. Active scope/filter summary.
3. KPI strip.
4. Concise advisor readout.
5. Leading failure modes.
6. AI attribution status.
7. Primary consequence mix.
8. Representative underlying records.
9. Evidence note, traceability, and limitations.
10. Tier-aware footer.

Implementation requirements:

- Parse `tier=free|premium`, defaulting to `free`; `premium` remains the internal URL value while the interface says `Pro`.
- Use `ReportPreviewToolbar`.
- Generate a deterministic analytics report ID from the active query/scope.
- Preserve all analytics filters when switching tier.
- Continue using real analytics helpers and current corpus data.

### Case brief / review packet

New route: `/cases/[slug]/brief`

Required modules:

1. Case title, court, date, docket when available.
2. Outcome/disposition and known monetary amount.
3. Issue and failure-mode labels.
4. Concise case readout explaining why it matters.
5. Primary source card with a direct source link.
6. Evidence boundary and attribution status.
7. Practical review implications or controls.
8. Related cases only when the relationship is meaningful and explainable.
9. Tier-aware footer.

Implementation requirements:

- Load the canonical case using `getCaseBySlug`.
- Return `notFound()` for invalid slugs.
- Parse `tier=free|premium`, defaulting to `free`; `premium` remains the internal URL value while the interface says `Pro`.
- Use `ReportPreviewToolbar`.
- Generate a deterministic case report ID from the case slug.
- Update the case page report CTA to link to this route.

## Important assets and sources

- Current master strategy reference: `docs/AI_VORTEX_MASTER_PLAN_CURRENT.md`
- Older detailed strategy reference: `docs/AI_VORTEX_ENDGAME_MASTER_PLAN.md`
- Existing build tracker: `docs/build-tracker.md`
- Existing product packaging reference: `docs/PRODUCT_PACKAGING_V1.md`
- Corpus analytics helpers: `lib/corpus-analytics.ts`
- Canonical case helpers: `lib/cases.ts`
- Report utilities: `lib/reporting.ts`
- Shared preview control: `components/reports/ReportPreviewToolbar.tsx`

## Open questions or constraints

- The worktree contains substantial intentional changes and untracked files. Do not reset, clean, restore, or revert unrelated work.
- Native PDF generation is not implemented. Use browser print for this pass.
- Authentication, billing, and actual Free/Pro authorization are not part of this pass.
- Firm logo upload and white-label configuration are later paid-workspace features.
- The footer can use institutional AI Vortex branding now. Founder-forward copy such as `AI Vortex by Manu Ayala` should be treated as optional rather than the permanent default.
- Preserve existing MCP-compatible artifact links while adding the better canonical report routes.

## Next recommended actions

1. Read the three partial report files and the complete analytics print route and styles.
2. Add a narrowly scoped shared report shell/header/footer only if it removes real duplication.
3. Integrate the tier, report ID, preview toolbar, and tier-aware footer into `/analytics/print`.
4. Build `/cases/[slug]/brief/page.tsx` and its print-responsive styles.
5. Change the case page report CTA from the legacy artifact link to the canonical case brief.
6. Leave `/artifact/print` intact and verify one legacy URL.
7. Verify Free and Pro variants for both report types.
8. Test desktop, mobile, and print layouts. Check page breaks, source links, long case names, and missing fields.
9. Run:

```bash
npm run lint
npm run build
npm run validate:data
npm run validate:product
npm run test:product
```

10. Update `docs/build-tracker.md` with completed behavior, test results, and remaining limitations.

## Acceptance criteria

- Analytics and case reports visibly belong to the same product system.
- Both reports have working Free/Pro preview toggles.
- Tier switching preserves report scope and does not jump to unrelated pages.
- Free reports are useful and source-complete.
- Pro reports remove promotional branding without hiding provenance.
- Every named case or authority has a usable source link when available.
- No empty or meaningless report sections are rendered.
- Missing values display honestly rather than being invented.
- Reports print without horizontal overflow, clipped tables, hidden footers, or orphaned headings.
- Existing `/artifact/print` links still work.
- The case page opens the new canonical brief.
- Lint, build, data validation, product validation, and behavior tests are reported accurately.

## Ready-to-paste starter prompt

```text
Continue the AI Vortex report-system implementation in:
/Users/manuayala/sanctions-tracker

Read these first:
1. docs/CURRENT_TASK_HANDOFF.md
2. docs/AI_VORTEX_MASTER_PLAN_CURRENT.md
3. lib/reporting.ts
4. components/reports/ReportPreviewToolbar.tsx
5. app/analytics/print/page.tsx
6. app/cases/[slug]/page.tsx

The current task is to finish the two report prototypes described in the handoff:
- analytics evidence brief
- canonical case brief/review packet

Implement both Free and Pro preview states, preserve the legacy /artifact/print route, update the case report CTA, and verify desktop/mobile/print behavior. Do not reset or clean the dirty worktree. Continue through implementation and validation, then update docs/build-tracker.md with exact results.
```
