# AllerQ Execution Summary (2025-02-04)

This document captures the current implementation state of AllerQ, measured against the end-to-end product expectations. Use it to bootstrap new sessions and to track gaps that still block a production release.

---

## 1. Architecture & Infrastructure
- **Monorepo**: Turborepo setup with shared configs. `apps/allerq` is the lead Next.js 14 app. Shared packages (`packages/ui`, `packages/auth`, etc.) exist but are lightly used.
- **Styling/UI**: Tailwind CSS + shadcn/ui components present; UI still early-stage and focused on auth screens.
- **Backend**: Primary data store is NoCodeBackend (NCDB) instance `48346_allerq`. REST helpers in `apps/allerq/lib/ncb/` wrap NCDB endpoints with axios + Zod validation.
- **Validation**: Shared schemas live in `apps/allerq/types/ncdb/`. `ensureParseSuccess` ensures consistent safe parsing.
- **Environment**: `.env.local` / `.env.test` provide NCDB credentials. No other external services wired yet (Cloudinary/Stripe/etc.).
- **Docs & Process**: `apps/allerq/docs/` now contains DEV_PROMPT, CHECKLIST, DECISIONS, NCDB schema, Kitchen OS overview, and this summary.

## 2. Feature Parity vs. Expectations

| Capability | Expectations | Current State (2025-02-04) | Notes / Gaps |
|------------|--------------|-----------------------------|--------------|
| **Auth & Access Control** | Email/password signup, login, forgot/reset, password strength toggle, role-based access (Superadmin/Admin/Manager). | Signup/sign-in run through NextAuth with session persistence and protected middleware. Password visibility toggles/strength indicator and a stubbed forgot-password flow are live; full reset emails + broader RBAC UI remain pending. |
| **User & Restaurant Management** | CRUD restaurants, assign roles per restaurant, view users per restaurant. | Admin pages (`/restaurants`, `/users`) are gated via NextAuth and now support create/update/delete flows. Per-restaurant role assignment is still pending. |
| **Menu Management** | Upload menus, AI parsing, manual edits, grouping, custom sections/tags. | Only NCDB helpers for menus/menuItems and `/dev-menu-test` smoke page. No UI for uploading, manual edits, grouping, or tags. No AI integration. |
| **Allergen & Dietary** | AI detection, manual editing, regional allergen sets, tag toggles, override controls. | Not implemented. Schemas capture allergen fields but there is no surface. |
| **Customer-Facing Menu** | QR generation, public menu, filtering by allergen/dietary, multilingual support. | Not implemented. |
| **Analytics & Reporting** | Dashboard metrics, scan logs, allergen completeness. | Not implemented (NCDB tables exist but no frontend/backend usage). |
| **Billing & Subscriptions** | Stripe/GoCardless subscriptions, trials, webhooks, admin billing views. | Not started. |
| **Admin/Superadmin Tools** | Global views, impersonation, overrides. | Not started. |
| **Settings & Preferences** | Language selection, allergen rule set, profile updates, restaurant branding. | Not started. |
| **Automations** | AI parsing triggers, notifications, QR refresh. | Not started. |
| **Storage & Files** | Menu file storage (Cloudinary, etc.), indexing. | Not implemented; NCDB can’t store binary so we need 3rd-party integration. |

## 3. Operational Tooling
- **Commands**: `pnpm --filter @kitchen-os/allerq lint`, `pnpm --filter @kitchen-os/allerq typecheck`, `pnpm --filter @kitchen-os/allerq exec tsx scripts/ncdb-get-user.ts <email>`. Wrapper scripts added in `apps/allerq/scripts/`.
- **Smoke Testing**: `/dev-menu-test` SSR page seeds restaurant→menu→menu item. Requires manual verification; no automated tests yet.
- **CI/CD**: Not configured; Vercel deploy flow still manual.

## 4. Known Constraints / Decisions
Reference `apps/allerq/docs/DECISIONS.md` for the living list. Highlights:
- NCDB search endpoints now take top-level fields (`{ email, id }`)—legacy `filters` payloads throw SQL errors.
- `assigned_restaurants` often `null` → schema coerces to `undefined`.
- Port 3000 reserved; run kill script before `pnpm dev` to avoid port hopping.

---

## 5. Next Immediate Tasks
1. **Finish Auth Experience**
   - Add password strength indicator, password visibility toggle, forgot/reset flow.
   - Implement session management (JWT cookies or NextAuth).
   - Enforce role-based access in routing/layouts.

2. **User/Restaurant CRUD**
   - Build API routes + UI pages/forms for listing, creating, updating, deleting restaurants and users.
   - Support assigning roles to users per restaurant.

3. **Menu Pipelines**
   - UI for manual menu creation/editing.
   - Integrate file upload service (e.g. Cloudinary) and store references in NCDB.
   - Scaffold AI parsing hooks (placeholder service) so manual flow can fall back gracefully.

4. **Customer Menu + QR**
   - Generate QR codes (Cloudinary or qr-code lib) and host public menu pages.
   - Add filtering/search by allergen/dietary tags.

5. **Observability & Deployment**
   - Configure Vercel preview + production pipelines.
   - Add logging/monitoring (e.g. Sentry) before launch.

Use this summary alongside the checklist and decision log to keep future work aligned.
