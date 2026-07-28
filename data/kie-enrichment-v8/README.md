# Kie v8 structured-facts review artifacts

This directory is deliberately isolated from `data/case-intelligence.json` and every public route. Its JSONL output is evidence-review material only; the v8 runner never merges, publishes, indexes, or modifies a public case page.

The 50-case pilot is restricted to documents already classified as primary, whose locally cached extraction hash still matches the v7 source manifest. Each non-null normalized field must carry page-located, quoted evidence. A missing fact remains `null`.

Run the cache-only preflight:

```sh
npm run enrich:facts:kie:v8:dry-run -- --limit 50 --allow-50-pilot
```

Run the live pilot only after `KIE_API_KEY` is available, with the explicit cap preserved:

```sh
npm run enrich:facts:kie:v8 -- --limit 50 --allow-50-pilot --max-credit-spend 20 --concurrency 1
```

Then audit the artifact:

```sh
npm run audit:facts:kie:v8 -- data/kie-enrichment-v8/primary-source-pilot-50.jsonl
```

The audit is review-only: `merge_ready` is intentionally always `false`.
