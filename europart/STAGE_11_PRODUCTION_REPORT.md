# EUROPART — Этап 10–11 / final-spec §11–§12 (Production readiness & testing)

Date: 2026-11-17. Branch: `cursor/europart-production-readiness-fb45`. Parent tip: analytics PR #17.

## Done

### Security / tech audit hardenings
- Migrated remaining admin API routes from token-only `requireAdminApi` → `requireAdminApiAsync` with RBAC permissions (session + token).
- Rate limits: checkout, leads, cart POST, admin login, payment webhook (search/VIN already limited).
- JSON body size caps on checkout / leads / cart / webhook.
- Security headers via middleware; HSTS when `NEXT_PUBLIC_SITE_URL` is https.
- Production host / HTTP→HTTPS redirects driven by `SITE_URL` (no DNS changes).
- `assertProductionEnv` at Node boot (`instrumentation.ts`); accepts admin session/token + cart secret (not only Better Auth).
- Payment webhook HMAC + idempotency unchanged; import size limits already in parser.
- Stub `/privacy` remains noindex until legal approval.

### Testing
- New unit tests: headers, canonical redirect, body caps, rate limiters, admin token gate, expanded env assert (**109** total).
- Smoke script: `npm run smoke` (health, SSR paths, robots, privacy noindex, admin login).

### Production docs
- `PRODUCTION.md` — env matrix (dev/staging/prod), redirects, Docker, migrate, CWV honesty, go-live blockers.
- `.env.example` + `DATABASE_MIGRATION_GUIDE.md` updated through analytics attribution.

## Out of scope / not redone
- Feature stages §5–§10 (catalog, search, cart, admin UI, SEO, CMS, analytics).
- DNS for europart.by.
- USAPART root.
- Claiming Core Web Vitals without measurement.
- Publishing stub legal as indexable production content.

## Verification

| Check | Result |
| --- | --- |
| typecheck | pass |
| lint | pass |
| unit tests | **109** pass |
| build | pass (Next.js 16.4.6) |
| smoke | pass (`EUROPART_SKIP_PROD_ENV_ASSERT=1`, local `next start`) |

## Go-live blockers
See `PRODUCTION.md` and project status doc.
