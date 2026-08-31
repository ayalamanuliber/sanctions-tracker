# Legal AI Risk Authority Engine — Phase 2 evidence brief

Evidence date: 2026-08-31. Scope: `aivortex.io` and the public Legal AI Risk application. Production observations are separated from local/lab tests and Unknowns.

## Executive result

Search Console confirms 93 external links from 53 referring domains into 73 domain-target combinations. The inventory is real but not equivalent to 53 independent endorsements: it contains vendor citations, UGC platforms, localization clusters, directories, reputation services, probable aggregation/mirror surfaces, and unresolved domains. The strongest reusable authority asset is now the public Legal AI Risk dataset, but its business path is incomplete: engaged use and two tracker email clicks are observable in the prior GA4 window, while qualified opportunity and revenue remain Unknown. Three reversible defects were prepared for release: nested trailing-slash normalization, removal of automatic Next.js prefetches for large API exports, and a 1.6 MB homepage image replaced by a 58 KB WebP on the homepage only.

## Evidence inventory

- `gsc-referring-domains.csv`: all 53 GSC domains with observed counts and explicit fit/independence/mirror/portfolio/Unknown classification.
- `gsc-link-targets.csv`: all 73 exact domain-target rows. Counts sum to the 93 external links shown by GSC.
- `gsc-source-pages.csv`: 38 exact GSC source rows captured before the source-detail report returned HTTP 429, plus five public-current warm source mappings. The remaining exact source URLs are **Unknown in this committed artifact**, not inferred. GSC itself remains the recovery source after its temporary request limit clears.
- `prospect-batch.md`: five individualized drafts with official role or organization channel; none sent.

Search Console source: authenticated Links report for `sc-domain:aivortex.io`. GSC does not expose `follow/nofollow`, link-level referral sessions, conversion, or revenue in this report; those fields remain Unknown.

## Production technical audit

| Surface | Observed result | Status |
| --- | --- | --- |
| Field CWV / CrUX | GSC Core Web Vitals, updated 2026-08-29: 292 good URLs, 0 needs improvement, 0 poor on mobile; same counts on desktop. Mobile detail said no issues detected in the last 90 days. | observed field evidence |
| PageSpeed API | Root, `/legal`, and `/legal-ai-risk/dataset` returned API HTTP 429 / daily quota unavailable on 2026-08-31. | Unknown, not a zero or a pass |
| Local Lighthouse, `/legal` before fix | Performance 0.59; LCP 17.35 s; FCP 3.88 s; CLS 0.009; TBT 130 ms; 2.79 MB total. The eager hero PNG was 1.67 MB. | lab-only diagnostic |
| Local Lighthouse, dataset before fix | Performance 0.51; LCP 14.91 s; FCP 3.59 s; CLS 0; TBT 490 ms; 2.62 MB total. Three automatic RSC/API prefetch responses contributed roughly 561 KB. | lab-only diagnostic |
| Crawler/WAF-observable parity | Default, browser, Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, GPTBot, Claude-SearchBot, and PerplexityBot all received HTTP 200 and matching byte/signal profiles for root, `/legal`, dataset, and manifest. | observed HTTP parity; account/WAF rules not inspected or changed |
| Robots | Root allows crawling except private `/audit/` and `/proposals/`; tracker permits public pages and `/api/dataset`, blocks other API paths and `/mcp`. | pass |
| RSS/freshness | `/legal-ai-risk/feed` returned RSS 200 and the dataset page exposes the feed, snapshot version, checked date, citation instructions, and manifest. | pass; RSS is the only tracker-specific retention surface |
| Canonical/redirect graph | Existing suite: 38/38 passed across 16 home variants, 9 infrastructure paths, and 13 deep samples. Query parameters canonicalize to clean URLs; filtered case pages are `noindex, follow`. | pass except nested slash defect below |
| Nested trailing slash | `/legal-ai-risk/` normalized, but `/dataset/`, `/sources/`, `/cases/`, and `/analytics/` returned final-domain 404 although the upstream app normalized them. | fix prepared in shell repo |
| Sitemap truth | No query URLs were found in either sitemap. Public dataset/methodology routes are discoverable and current snapshot dates are visible. | pass in sampled audit |
| JS crawler parity | HTML canonical, H1, and JSON-LD signals matched across tested crawler user agents. | pass for observable HTML; rendered behavioral parity is not inferred |

## Funnel and attribution audit

GA4 window: 2026-08-03 through 2026-08-30, complete days. This predates the 2026-08-31 dataset release.

- Demand: Google 3,011 sessions / 2,295 engaged; Gemini 96 / 72; Claude 86 / 63; Perplexity 11 / 9; ChatGPT 5 / 3; Copilot 1 / 1. Warm referrals included `prodigitallegal` 13 / 10, Vaquill 5 / 5, and LawFuel 1 / 1.
- Tracker usage: `tracker_session_start` 22,681, `tracker_page_view` 12,967, and `tracker_open` 15. `/legal-ai-risk/cases` dominated the window with 21,460 sessions / 21,016 engaged; this extreme concentration is an anomaly to investigate, not proof of human demand.
- Mid-funnel: `report_open` 14, `report_print` 17, `report_share` 3. No `artifact_download` appeared because the dataset was released after the reporting window.
- Contact/subscription: two `email_contact` events occurred on tracker routes. Newsletter start/success events (19 each) and seven booking clicks occurred on editorial pages, not the tracker. The tracker itself has RSS but no email subscription path.
- Business outcome: no available record connected a tracker visit to qualified opportunity or revenue. Both are Unknown.

The main-domain tracker records UTM parameters, AI-referrer classification, a session id, first-touch path, and lead id for lead events. The Next application also emits product events. Same-origin session storage supports continuity after proxying, but UTMs are not demonstrated to persist into later consulting/contact navigation. A cross-surface source-of-truth and an outcome ledger keyed by lead id are still owner/product decisions; they were not silently added in this phase.

## Changes prepared

1. Machine-readable exports are plain anchors, not Next.js navigation links. This preserves download behavior and prevents speculative RSC/API prefetches of JSON, CSV, manifest, and source appendices.
2. A scoped Vercel redirect strips a trailing slash only under `/legal-ai-risk/:path*/`, preserving the editorial corpus's existing slash canonicals.
3. The homepage uses a 58 KB WebP derivative of the 1.6 MB Claude-for-Legal PNG. The original remains available for the article and social metadata; no editorial text or claim changed.

## Authority-to-business measurement contract

Track the chain without collapsing stages:

1. `qualified_referring_domain`: independent/relevant domain after mirror, localization, UGC, directory, and portfolio exclusions.
2. `cited_asset`: exact source URL, target, context, observed date, and whether the source is independently editorial.
3. `referral_engagement`: sessions, engaged sessions, return use, dataset download, RSS subscription, and report use by source/UTM.
4. `contact_or_subscription`: email contact, newsletter/RSS, booked call, or approved research conversation.
5. `qualified_opportunity`: named organization, real problem, authority/budget/timing evidence, owner, and next step.
6. `revenue`: amount, project, source/lead id, close date, and confidence.

Mentions without clicks and AI citation samples are separate ledgers. Neither is counted as referral traffic or revenue.

## Owner gates / Unknowns

- Approve each outreach recipient and exact message at send time; nothing in this batch authorizes sending.
- Decide whether tracker email subscription should be added or RSS should remain the only tracker-specific retention mechanism.
- Choose the CRM/outcome ledger and owner for mapping `lead_id` to qualified opportunity and revenue.
- Re-run the remaining GSC source drilldowns after the temporary 429 clears; 55 exact source URLs remain Unknown in the committed CSV even though their domain-target counts are known.
- Investigate the `/legal-ai-risk/cases` GA4 concentration before using tracker session totals in external claims.
