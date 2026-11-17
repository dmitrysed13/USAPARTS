# EUROPART — Этап 6 / final-spec §7 (Admin panel)

Date: 2026-11-17. Branch: `cursor/europart-admin-panel-645e`. Parent: OEM/VIN PR #11.

## Done

### Shell
- `/admin` App Router UI, `closedRobots` (noindex), storefront chrome hidden via `data-admin-shell`
- Login + signed cookie session (`europart_admin_session`); optional Bearer `ADMIN_API_TOKEN`
- Bootstrap Super Admin from `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` when staff empty

### RBAC (server)
- Roles: Super Admin, Admin, Manager, Warehouse Manager, SEO Manager, B2B Manager
- Permission matrix in `roles.ts`; UI nav + `requireAdminSession` / `requireAdminApiAsync`

### Sections
Dashboard; Products; Categories; Makes/Models/Generations/Modifications/Engines; OEM; Analogs; Suppliers; Warehouses; Stock; Prices; Orders; Payments; VIN leads (+ detail/history); Customers; B2B; Excel import; API integrations; Redirects; Company settings; Staff. SEO + Articles = structural stubs.

### Company settings
- Fields: org/legal name, UNP, addresses, phones, email, hours + `publishToStorefront`
- Incomplete/empty legal never published; storefront reads `getStorefrontCompany()`

### APIs wired
- Existing product/vehicle/order/import/VIN/supplier admin APIs; new company/staff/redirects/products list

## Migration

`20261117220000_admin_rbac_company` — `AdminRole`, `StaffUser`, `CompanySettings`, `RedirectRule`

## Out of scope

- Catalog/search/§5/§6 rework
- Real SEO engine / CMS
- Fake catalog or payment success data

## Verification

- typecheck, lint, unit (70), build — green
- Next.js security upgrade nudge deferred (ask separately)
