# AI Vortex Legal AI Risk - Product Packaging V1

Status: designer-ready product brief  
Primary launch surface: public web product + MCP  
Next surface: Chrome extension  
Business model: public intelligence stays free; users pay for workflow convenience, saved context, clean exports, and organization branding.

## 1. Product Decision

AI Vortex is one source-backed legal AI risk intelligence system with three interfaces:

1. **Web** - discover, search, inspect, cite, map, and share public evidence.
2. **AI app / MCP** - ask questions and turn evidence into concise guidance, checklists, packets, and reports.
3. **Chrome extension** - use the same intelligence beside the case, opinion, filing, or court page already being reviewed.

These are not separate products. They are three ways into the same evidence and workflow layer.

The clearest product sentence is:

> Search the precedent, run the review, and share the record.

The product should not promise to prevent sanctions, certify compliance, replace legal research, or determine that AI was used. It should promise source-backed intelligence, structured verification, and defensible preparation.

## 2. What The Live Site Already Has

Keep and reuse:

- A credible visual identity and an unusually strong live map.
- A substantial public evidence corpus with source links.
- Severity, jurisdiction, tool, failure-mode, and monetary-sanction data.
- A browser-local control assessment.
- Jurisdiction lookup.
- Case evidence library.
- MCP tools for search, jurisdiction briefs, tool-risk profiles, pre-filing review, source appendices, dashboards, maps, and artifacts.
- Review-ready print packets and working ledgers.

Current packaging problems to solve:

- The first screen sells fear and an assessment before it lets a visitor use the intelligence.
- The page does not explain that the web, MCP, and future extension are the same product.
- The nav has no obvious `Search`, `Use with AI`, `Extension`, or `Pricing` destination.
- The current paid offer sells database access even though the public intelligence is intended to remain free.
- Claims such as "stay out of sanctions" and "pass a Rule 11 challenge" are stronger than the product can responsibly guarantee.
- Counts are inconsistent across the live page and metadata. The live page also displays a June 25, 2026 update date on July 21, 2026. Freshness and one canonical stats source are launch blockers.
- Case discovery is trapped inside the evidence library. It needs durable, indexable case pages.
- MCP installation exists technically, but there is no polished public installation and testing surface.
- There is no Chrome extension code yet.

## 3. Audience Packaging

The interface should adapt its output, not fragment the product.

| Audience | First job | Default output |
| --- | --- | --- |
| Litigator | Check a filing, quote, citation, or opposing submission | Verification packet and exception record |
| Knowledge/risk professional | See recurring failure patterns and control gaps | Jurisdiction brief, dashboard, policy controls |
| Solo/small firm | Get a usable process without building a program | One-page workflow and reusable ledger |
| In-house legal | Evaluate outside-counsel and vendor workflows | Review checklist and tool-risk brief |
| Judge/chambers | Find precedent and source-backed patterns | Neutral case digest and source appendix |
| Researcher/journalist | Find and verify a case | Case page, source document, related matters |
| Legal vendor/insurer | Understand observed failure modes | Tool/practice profile with usage-rate caveat |

Use role-neutral workflow language by default: `review-ready`, `filing-ready`, `responsible reviewer`, `final review`, `exception report`, `verification record`, and `send for review`.

## 4. Product Architecture

```text
                         AI Vortex evidence layer
               cases + courts + sources + failure modes
                                  |
              +-------------------+-------------------+
              |                   |                   |
          Public web           MCP / AI app      Chrome extension
          discovery            guided work       in-context work
              |                   |                   |
              +-------------------+-------------------+
                                  |
                   review packets + dashboards
                   source appendices + exports
                                  |
                     Pro convenience upgrade
```

The website owns canonical content, links, rendering, exports, payment, identity, and SEO. The MCP owns conversational reasoning and tool use. The extension owns page context and one-click access.

## 5. Website Information Architecture

### Global navigation

Use this order:

`Search` | `Map` | `Courts` | `Use with AI` | `Extension` | `Pricing`

Right-side actions:

- Secondary: `Sign in` only when accounts exist.
- Primary: `Use free` or `Add to ChatGPT` during MCP-first launch.

Do not make `Subscribe` the only unexplained primary action.

### Required routes for launch

| Route | Purpose | Priority |
| --- | --- | --- |
| `/` | Search-first product home and live intelligence overview | P0 |
| `/search` | Filterable case search with shareable query state | P0 |
| `/cases/[slug]` | Canonical SEO and evidence page for one matter | P0 |
| `/map` | Full interactive geographic view | Existing/P0 |
| `/courts/[slug]` | Jurisdiction history, rules, patterns, and cases | P0 |
| `/use-with-ai` | MCP explanation, install steps, privacy, sample prompts, health | P0 |
| `/extension` | Extension explanation and waitlist/install state | P0 marketing, P1 functional |
| `/pricing` | Free versus Pro convenience packaging | P0 |
| `/methodology` | Sources, scope, update cadence, limitations, corrections | P0 |
| `/artifact/print` | Review-ready packet rendering | Existing/P0 |
| `/dashboard` | Filtered visual readout | Existing/P0 |
| `/sources` | Source appendix | Existing/P0 |

### Home page: exact section order

The home page should be the usable product, not a brochure.

1. **Compact product header**
   - Product name: `AI Vortex Legal AI Risk`.
   - Status: `Public tracker` and `Last updated [date]`.
   - Clear methodology link.

2. **Primary search / command surface**
   - Heading: `Search legal AI risk precedent.`
   - Search placeholder: `Case, court, judge, jurisdiction, AI tool, or failure mode`.
   - Primary action: `Search cases`.
   - Secondary action: `Use in ChatGPT`.
   - Suggested queries: `Mata v. Avianca`, `D.N.J.`, `fabricated quotations`, `CoCounsel`.

3. **Evidence strip**
   - Tracked matters.
   - Countries / states / courts.
   - Source-link coverage.
   - Last data refresh.
   - Every number comes from one canonical stats function.

4. **Live map**
   - Preserve the existing map as the signature visual.
   - Default to a useful, readable US view with a world toggle.
   - Selecting a case opens its canonical case page.

5. **Three ways to use the same intelligence**
   - `Search the web` - inspect evidence and sources.
   - `Ask in your AI app` - generate briefs and review packets.
   - `Use beside the page` - check context through the extension.
   - This section must show the relationship, not three unrelated offers.

6. **Common workflows**
   - `Review a filing before submission`.
   - `Check suspicious citations or quotations`.
   - `Brief a jurisdiction or court`.
   - `Build a policy from observed failure modes`.
   - `Prepare a source-backed training example`.

7. **Recent and significant matters**
   - Recent matters and high-severity matters are separate tabs.
   - Every row links to a case page and primary source.
   - Show why each matter is relevant in one sentence.

8. **Review-ready artifacts**
   - Show one realistic packet preview, not a list of file formats.
   - Free preview visibly includes a restrained AI Vortex footer.
   - Explain Pro in outcome language: clean export, saved defaults, organization branding.

9. **Trust and methodology**
   - Who built it and why.
   - Public-source boundary.
   - Correction process.
   - Not legal advice; not a usage-adjusted incident-rate study.

10. **Pricing**
    - Free first.
    - Pro sells convenience.
    - Team/firm packaging can remain `Talk to Manu` until shared workspaces exist.

### Case page

The case page is the SEO and trust engine. It must include:

- Case name, court, jurisdiction, decision date, status, and neutral severity label.
- One-paragraph `Why this matter is tracked` summary.
- What was alleged, what the court actually found, and the outcome. Keep those separate.
- AI tool only when the source supports the attribution. Otherwise label `Unidentified` or `AI use not established`.
- Citation, quote, authority-support, disclosure, supervision, and audit-trail signals.
- Primary source link and source metadata.
- Related matters by jurisdiction, court, failure mode, and tool.
- `Ask AI Vortex about this case` prompt launcher.
- `Save to review packet` extension/MCP handoff.
- Correction link.

### Use With AI page

This page should make installation understandable in under one minute.

- Plain-language explanation: `Connect the public AI Vortex evidence layer to ChatGPT, Claude, Codex, or another MCP-compatible client.`
- Server URL with copy button: `https://sanctions-tracker.vercel.app/mcp`.
- Tabs for ChatGPT, Claude, and Codex.
- Exact install steps and current availability limitations.
- Live MCP status indicator using `/mcp-health`.
- Data and privacy boundary.
- Six useful starter prompts.
- `Test the connection` prompt.
- No implication that the app is marketplace-listed until it actually is.

## 6. Free And Paid Packaging

### Free forever

The evidence should remain free because free evidence drives trust, citations, SEO, MCP adoption, and extension installs.

- Full public case search and case pages.
- Map and jurisdiction views.
- Primary source links.
- MCP search and core risk-intelligence tools.
- Basic Chrome context lookup.
- Basic review packets and source appendices.
- PDF/print exports with a restrained AI Vortex signature footer.
- No client data required for public research.

### Pro: convenience, not truth

Recommended launch position: `AI Vortex Pro` for an individual professional.

Suggested launch test: **$19/month or $149/year**. Do not place the current $299 firm offer in front of an individual user until team/workspace value exists.

Pro earns payment through:

- Remove the AI Vortex signature from exports.
- Add name, title, organization, or firm logo to packets.
- Remember role, courts, preferred AI tools, output length, and export format.
- One-click Word/PDF-ready packet creation.
- Saved cases, saved searches, and saved review packets.
- Extension actions without daily convenience limits.
- One-click `Send for review` and reusable email cover notes.
- Jurisdiction and topic alerts when implemented.

### Teams / firm

Show as `Contact Manu` until the product has real shared-workspace behavior.

Future team value:

- Shared profiles and organization branding.
- Shared watchlists and review packets.
- Matter-level review history.
- Policy defaults and approved-tool settings.
- Admin controls and usage reporting.
- SSO, security review, retention controls, and procurement support.

### Ethical monetization rule

Never paywall:

- A primary source.
- A basic case fact.
- A correction.
- The disclosure that a match is approximate or a fallback.
- The limitation that public incidents are not usage-adjusted rates.

### Free artifact signature

Use a small footer, not a page-obscuring watermark:

`Prepared with AI Vortex Legal AI Risk · Public source-backed intelligence · aivortex.io`

Optional second line:

`Need a clean or firm-branded copy? Upgrade to Pro or email Manu.`

The signature should make the free artifact credible. Pro removes it; firm access replaces it with organization branding.

## 7. Chrome Extension Product

### MVP promise

> Check the page you are already reading against AI Vortex without leaving it.

Do not market the first version as a universal hallucination detector. It is a context and evidence assistant.

### Form factor

Use a Chrome side panel, not a small popup. A legal professional needs enough width to inspect sources, compare a quotation, and save an item.

Recommended technical footprint:

- Manifest V3.
- `sidePanel`, `activeTab`, and `storage` permissions.
- Request page access only when the user opens the extension or selects text.
- No always-on capture of browsing activity.
- No automatic transmission of page content.
- Explicit user action before sending selected text or a document excerpt.

### MVP modes

1. **Search**
   - Search any case, court, judge, tool, or failure mode.

2. **Check this page**
   - Detect visible page title, URL, court/case-like text, and selected citation.
   - Search the tracker for exact and approximate matches.
   - Show match confidence and fallback used.

3. **Check selected text**
   - User highlights a case name, citation, quotation, or proposition.
   - Extension returns relevant tracked matters and sources.
   - It must not say a quotation is false unless it has compared it to the authoritative source.

4. **Jurisdiction brief**
   - Infer jurisdiction only when confidence is high; otherwise ask the user to choose.
   - Show recent matters, dominant failure modes, source coverage, and a link to the full dashboard/map.

5. **Add to review packet**
   - Save the current case/source/selected text to a temporary packet.
   - Generate a source appendix or verification record on the website.

### Side-panel screen set

The designer should produce these screens:

1. First-run / privacy boundary.
2. Neutral search state.
3. Page detected with an exact tracker match.
4. No exact match with transparent fallback results.
5. Selected-text review.
6. Case detail and primary source.
7. Review packet tray.
8. Export/share state.
9. Pro upgrade state.
10. Error/offline/no-permission state.

### Extension response anatomy

Every response should use the same compact order:

1. `What AI Vortex found`
2. `Why it matters here`
3. `Evidence note`
4. `Primary sources`
5. One recommended action

Avoid long generated essays in the side panel.

### Free extension

- Unlimited basic tracker search.
- Exact case lookup and source opening.
- Limited contextual checks or packet saves per day if a limit is needed.
- Branded review packet.
- Use-with-AI and dashboard handoff.

### Pro extension

- Saved profile and preferred courts.
- Unlimited context checks and packet saves.
- Clean or personally branded exports.
- Saved cases, notes, and recent review history.
- One-click send-for-review package.
- Alerts and watchlists when the backend supports them.

## 8. Cross-Surface Handoffs

The product should feel continuous.

| Starting surface | Action | Destination |
| --- | --- | --- |
| Google result | Open a case | Canonical case page |
| Case page | Ask a question | MCP installation or prefilled prompt |
| ChatGPT/Claude | Request a visual | Filtered dashboard/map URL |
| ChatGPT/Claude | Request a deliverable | Review-ready artifact URL |
| Chrome page | Save evidence | Review packet on website |
| Chrome page | Ask a broader question | MCP prompt handoff |
| Artifact | Inspect a cited matter | Canonical case page/source |
| Free artifact | Remove signature | Pro checkout or email Manu |

Every handoff should preserve filters and context in the URL. Do not make the user re-enter the jurisdiction, case, court, or audience.

## 9. Design Direction

The visual goal is a quiet legal intelligence product, not a fear-based cyber-security landing page.

Keep:

- Graphite/near-black product surfaces.
- Paper-white artifact surfaces.
- Source Serif for legal/editorial authority.
- Inter for operational UI.
- The existing map as a signature asset.
- restrained amber as a brand signal.

Add:

- Verification green for source-backed/confirmed states.
- Signal blue for neutral analytical data.
- Red only for serious severity or unresolved exceptions.
- Clear source-link affordances.
- Dense but breathable information layouts.
- Small 4-8px radii at most.

Avoid:

- Large fear-first hero copy.
- Decorative gradients and floating cards.
- Every section looking like a marketing card.
- Dark-on-dark tables with low contrast.
- ASCII charts in generated responses.
- Generic AI sparkle imagery.
- Too many export-format links at once.

The experience should make the professional feel informed, prepared, and able to verify the work.

## 10. Designer Deliverables

Ask the designer for one coherent responsive system, not isolated mockups.

### Website

- Desktop and mobile home/search experience.
- Search results with filters and zero-result fallback.
- Case detail page.
- Jurisdiction page.
- Use-with-AI / MCP install page.
- Review-ready artifact preview.
- Pricing page.
- Methodology page.

### Chrome extension

- 400-440px side-panel layout.
- All ten states listed above.
- Free and Pro differences.
- Selected-text flow.
- Review packet tray.

### Design system

- Color, typography, spacing, table, chart, severity, source, and evidence-note tokens.
- Search, filter, case row, source link, evidence note, artifact CTA, upgrade prompt, and empty-state components.
- Print/PDF rules.
- Keyboard and focus states.
- Loading, partial-data, stale-data, fallback, and unavailable-source states.

## 11. Exact Designer Prompt

```text
Design a responsive product system for AI Vortex Legal AI Risk, a free public legal AI risk intelligence database that can be used through the web, inside AI assistants through MCP, and through a Chrome side-panel extension.

The product is not a generic AI governance landing page. It is an evidence and workflow tool used by litigators, judges/chambers, researchers, knowledge/risk teams, solo practitioners, in-house teams, vendors, and insurers.

The free layer includes public case search, canonical case pages, sources, maps, jurisdiction views, basic MCP use, basic extension lookup, and branded review packets. Pro monetizes convenience: clean exports, personal/firm branding, saved preferences, saved cases, one-click review packets, extension workflow shortcuts, and later alerts. Never visually imply that facts or primary sources are paywalled.

Design the first screen as a usable search and command surface, not a marketing hero. Preserve the live US/world map as the signature visual. Use a quiet legal-intelligence visual language: graphite product surfaces, paper-white artifacts, Source Serif for legal/editorial authority, Inter for UI, restrained amber brand accents, verification green, neutral signal blue, and red only for serious severity or unresolved exceptions.

Produce desktop and mobile designs for: home/search, results, case detail, jurisdiction, Use with AI/MCP installation, artifact preview, pricing, and methodology. Also design a 400-440px Chrome side panel with first-run, search, exact match, fallback, selected-text review, case detail, packet tray, export/share, Pro upgrade, and error/offline states.

The product language should be role-neutral and workflow-specific: review-ready, filing-ready, responsible reviewer, final review, exception report, verification record, and send for review. Avoid promises to prevent sanctions or certify compliance. Show source coverage, tracker freshness, exact versus fallback matches, and primary sources clearly.

The desired feeling is: this makes a legal professional look prepared because the evidence is organized, the limitations are honest, and the next action is obvious.
```

## 12. Build Order For The Next Implementation Chat

### Phase 0 - truth and consistency

- [ ] Replace all hard-coded public counts with one canonical stats source.
- [ ] Fix the tracker update pipeline and visibly distinguish data date from page-build date.
- [ ] Audit claims and replace guarantees with evidence/workflow language.
- [ ] Confirm every source, dashboard, map, and artifact link returns a valid page.

### Phase 1 - package the existing product

- [ ] Rework the header and home page around search-first use.
- [ ] Add `/use-with-ai` with MCP install steps and live health.
- [ ] Add `/pricing` with Free, Pro, and future Teams packaging.
- [ ] Add `/methodology` and correction paths.
- [ ] Add the three-surface explanation.
- [ ] Preserve and reposition the assessment as a secondary workflow.

### Phase 2 - case discovery and SEO

- [ ] Add canonical `/cases/[slug]` pages.
- [ ] Add indexable jurisdiction pages.
- [ ] Add structured metadata, canonical URLs, and sitemap entries.
- [ ] Make tracker rows and map points open case pages.
- [ ] Add related-case and ask-AI-Vortex handoffs.

### Phase 3 - artifact and account convenience

- [ ] Standardize artifact URLs and preserve context across handoffs.
- [ ] Implement restrained free signature and Pro/firm branding modes.
- [ ] Add authentication, payment, and saved preferences only after the free journey works.
- [ ] Replace format dumps with one default artifact and an `Other formats` menu.

### Phase 4 - Chrome extension MVP

- [ ] Create a separate extension workspace with Manifest V3.
- [ ] Build side-panel shell, first-run privacy state, and search.
- [ ] Add explicit page/selection context capture.
- [ ] Connect exact/fallback search to the same API/MCP evidence layer.
- [ ] Add source opening and review-packet tray.
- [ ] Add website handoff for artifact generation.
- [ ] Add Pro entitlement only after the free extension workflow is stable.

### Phase 5 - launch validation

- [ ] Test researcher, litigator, solo, chambers, and risk-lead journeys.
- [ ] Test desktop/mobile and extension narrow widths.
- [ ] Verify source coverage and fallback disclosures.
- [ ] Verify no confidential page content is sent without explicit user action.
- [ ] Run the MCP regression suite against the packaged product.
- [ ] Record a 90-second demo showing web -> MCP -> artifact -> extension continuity.

## 13. Definition Of Ready To Launch

- A visitor can search immediately without understanding MCP.
- A researcher arriving from Google can verify one case and follow its source.
- A professional can understand and install the MCP in under one minute.
- The MCP can return concise evidence, a working dashboard/map, and one useful artifact.
- The free product is genuinely useful without an account.
- Pro is clearly convenience, not access to truth.
- A free artifact looks credible; a Pro artifact looks clean and meeting-ready.
- The extension can check a page or selected citation without silently collecting browsing data.
- Every metric has one canonical source and a visible freshness date.
- No surface promises that AI Vortex prevents sanctions, proves AI use, or replaces professional judgment.

