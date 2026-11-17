# EUROPART — production prep (§11–§12)

Canonical public origin example: **`https://europart.by`** via env only. This app does **not** change DNS.

## Environment matrix

| Variable | Dev | Staging | Production | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | staging HTTPS origin | `https://europart.by` | No trailing slash. Drives canonical, cookies `Secure`, HSTS, host redirects. |
| `DATABASE_URL` | local compose | staging Postgres | prod Postgres | Prisma migrate deploy before start. |
| `REDIS_URL` | local compose | optional | optional | Rate limits are in-process today; Redis reserved for shared limits later. |
| `ADMIN_SESSION_SECRET` | optional (dev fallback) | ≥16 chars | **required** (≥16) unless `ADMIN_API_TOKEN` / `BETTER_AUTH_SECRET` | HMAC for staff session cookie. |
| `ADMIN_API_TOKEN` | optional local | ≥16 | recommended for automation | Bearer / `x-admin-token`. Treated as SUPER_ADMIN. |
| `ADMIN_BOOTSTRAP_*` | optional first admin | optional | once, then remove | Creates Super Admin only when `StaffUser` is empty. |
| `CART_SECRET` | optional local | ≥16 | **required** (≥16) or use `BETTER_AUTH_SECRET` | Cart cookie HMAC. |
| `BETTER_AUTH_SECRET` | optional | ≥32 | optional fallback | Planned customer auth; also backs cart/session if set. |
| `SEO_INDEXING_ENABLED` | `false` | `false` until ready | `true` only with reviewed company + legal | **AND** admin `SeoSettings.indexingEnabled`. |
| `GA4_MEASUREMENT_ID` / `YANDEX_METRIKA_ID` | empty = no-op | optional | optional | Env overrides SeoSettings. |
| `PAYMENT_PROVIDER` + `PAYMENT_WEBHOOK_SECRET` | unset | staging sandbox | real provider | Online checkout stays unavailable until both set. Never commit secrets. |
| `SMTP_*` / `TELEGRAM_*` | unset = fail closed | optional | optional | Orders/leads still save. |

`assertProductionEnv` (Node runtime, `NODE_ENV=production`) requires site URL, database URL, an admin/session secret, and a cart secret. Skip only with `EUROPART_SKIP_PROD_ENV_ASSERT=1` (smoke / emergency).

Copy from `.env.example`. **Never commit `.env` or real secrets.**

## HTTP → HTTPS / host redirects

When `NODE_ENV=production` and `NEXT_PUBLIC_SITE_URL` is a non-local HTTPS origin, middleware:

1. Redirects `http` → `https` (via `x-forwarded-proto`) with **308**.
2. Redirects a mismatched `Host` / `x-forwarded-host` to the canonical host (e.g. `www.europart.by` → `europart.by` if SITE_URL is apex).

DNS / load-balancer TLS termination stay outside this repo. Point the chosen host at the app after ops approval.

## Security baseline (this stage)

- Admin APIs: Bearer token **or** staff session; RBAC permission on each route (`requireAdminApiAsync`).
- Rate limits: search, VIN, checkout, leads, cart POST, admin login, payment webhook.
- JSON body size caps on checkout / leads / cart / webhook.
- Import uploads: 5 MB / 2000 rows / 40 columns (existing parser limits).
- Payment webhooks: HMAC `x-europart-signature`; idempotent handling; never trust browser “paid”.
- Security headers: `nosniff`, `SAMEORIGIN`, referrer policy, permissions policy; HSTS when SITE_URL is https.
- CMS body rendered as escaped text paragraphs (no raw HTML). JSON-LD escapes `<`.
- Stub privacy page stays **noindex** (`closedMetadata`) until legal text is approved.

## Docker

Local data only: `docker compose up -d` (Postgres 17 + Redis 7). App runs on the host via `npm run dev`.

Production image (`Dockerfile`): multi-stage **standalone** Next.js build, non-root user `europart`, `node server.js` on port 3000.

```bash
cd europart
docker build -t europart:prod .
# Pass secrets at runtime — never bake into the image layers from git.
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SITE_URL=https://europart.by \
  -e DATABASE_URL=... \
  -e ADMIN_SESSION_SECRET=... \
  -e CART_SECRET=... \
  europart:prod
```

Prefer reverse proxy TLS; set `x-forwarded-proto` / `x-forwarded-host`.

## Migrations

See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md). On a target database:

```bash
npx prisma migrate deploy
npx prisma generate
```

Apply through `20261117250000_analytics_attribution` before go-live of this stack tip.

## Smoke

```bash
npm run build && npm run start
# other terminal:
npm run smoke
# or: BASE_URL=http://127.0.0.1:3000 npm run smoke
```

Checks health, home, catalog/search/cart/checkout, robots, privacy noindex, admin login page.

## Core Web Vitals

**Not measured in this environment.** Do not claim LCP/INP/CLS pass until Field/Lab data is collected against a deployed staging/prod URL (PageSpeed / CrUX / RUM).

## Go-live blockers (honest)

1. Merge stack through analytics + this readiness PR; apply all migrations on prod Postgres.
2. Set production secrets + `NEXT_PUBLIC_SITE_URL=https://europart.by` (ops; no DNS from app).
3. Real company publish gate + **lawyer-approved** privacy/offer pages before indexing.
4. `SEO_INDEXING_ENABLED` + admin indexing only when (3) is done.
5. Wire VIN decoder / TecDoc / SMTP / Telegram / payment SDK only with credentials.
6. Shared Redis rate limits if running multiple app instances.
7. CWV measurement on staging/prod — not claimed here.
