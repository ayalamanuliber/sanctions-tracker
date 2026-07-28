# Local judge-candidate review artifacts

`primary-documents-v1.jsonl` is generated only from cached, hash-verified primary-document text already used by the v7 enrichment corpus. It is not public data and it is never merged by the extractor.

High-confidence candidates require an electronic/signature marker and an explicit judicial role on the same page. Header/title patterns are retained only as medium confidence. Names found in attorney/counsel context are rejected. Every retained candidate includes an exact whitespace-compacted quote and a `p. N` locator; the audit reopens that cached page and verifies the quote is present.

Regenerate and audit:

```sh
npm run extract:judges:local -- --replace
npm run audit:judges:local -- data/local-judge-candidates/primary-documents-v1.jsonl
```

The audit is deliberately review-only: `merge_ready` is always false.

`npm run promote:judges:local` applies a narrower deterministic publication
gate. It promotes only one-candidate rows with a signature marker, an explicit
judicial role, no ambiguity flags, and an exact audited page quote into
`data/judge-enrichment.json`. The public record labels this as
`primary-document-signature`; it is not described as a human editorial review.
Medium-confidence header/title candidates remain review-only.
