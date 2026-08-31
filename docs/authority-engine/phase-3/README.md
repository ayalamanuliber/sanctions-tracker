# Phase 3 dependency audit

The reported `1 moderate + 5 high` baseline was reproduced on 2026-08-31. All six affected package nodes have compatible fixes within the repository's existing semver ranges, so only `package-lock.json` changed. No forced or major upgrade was used.

The machine-readable package paths, reachability classification, advisory IDs and before/after versions are in [`dependency-audit.json`](./dependency-audit.json). The fixed graph reports zero vulnerabilities for both `npm audit` and `npm audit --omit=dev`.

## Commands

```sh
npm audit --json
npm audit --omit=dev --json
npm ls brace-expansion fast-uri hono ip-address js-yaml nanoid --all
npm explain brace-expansion
npm explain fast-uri
npm explain hono
npm explain ip-address
npm explain js-yaml
npm explain nanoid
npm update brace-expansion fast-uri hono ip-address js-yaml nanoid --package-lock-only --ignore-scripts
npm ci --ignore-scripts
npm audit
npm audit --omit=dev
npm run lint
npm run validate:data
npm run validate:product
npm run validate:entity-media
npm run validate:responsive
npm run test:product
npm run test:public-routes
npm run test:authority-asset
npm run test:publication-readiness
npm run build
```

Rollback is the revert of the Phase 3 repository commit; no data migration, account setting or WAF change is involved.
