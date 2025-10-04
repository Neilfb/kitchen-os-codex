# AllerQ Production Readiness Plan

This roadmap breaks down the work required to deliver a production-ready AllerQ platform. Milestones are grouped into phases to allow parallel workstreams.

---

## Phase 0 – Foundations (Complete / In Progress)
- Monorepo + shared tooling (Turborepo, lint/tsc scripts).
- NCDB helper architecture (`ensureParseSuccess`, masked logging).
- Documentation baseline (DEV_PROMPT, CHECKLIST, DECISIONS, NCDB schema, Kitchen OS overview).
- Sign-up/sign-in endpoints (hashing, schema validation).
- `/dev-menu-test` smoke page.

**Outstanding clean-up before Phase 1:**
- Stabilise sign-in UI (password visibility toggle, error messaging, assigned_restaurants null handling).
- Ensure `npm run checks` (lint + typecheck) passes from repo root.
- Wire basic session management (JWT cookie) so frontend can read `user` context.

---

## Phase 1 – Core Admin Experience
**Goal:** Empower Superadmin/Admin to onboard restaurants and manage users without code.

1. **Authentication UX**
   - Client-side password strength indicator & visibility toggle.
   - Forgot password + reset flow (email token or temporary link).
   - RBAC-aware layouts (hide admin routes for managers).

2. **Session Layer**
   - Choose auth mechanism (NextAuth with Credentials provider or custom JWT middleware).
   - Secure cookie handling, refresh tokens (if needed), CSRF protection.

3. **User Management**
   - Dashboard page listing all users (filter by restaurant, role).
   - Forms for invite/create user (auto-email optional) and edit roles.
   - Delete/deactivate user flow.

4. **Restaurant Management**
   - CRUD UI for restaurants (name, address, owner, branding placeholders).
   - Assign multiple managers/admins per restaurant.
   - Connect restaurants to menus (list view + detail page showing latest menu).

## Phase 1 Exit Criteria
- Admin can log in, view all restaurants, create new restaurants, and invite/assign users.
- Role-based routes enforced.
- End-to-end tests for auth + CRUD run locally.

---

## Phase 2 – Menu Lifecycle
**Goal:** Ingest menus, translate into structured data, and expose editing tools.

1. **File Upload & Storage**
   - Integrate Cloudinary/S3 for menu file uploads (PDF/DOCX/Image).
   - Persist file metadata in NCDB (`menu_uploads`).

2. **AI Parsing Pipeline (MVP)**
   - Create worker/edge function that calls initial AI service (OpenAI or custom) to parse menu text.
   - Map AI response to NCDB schema (menu sections, items).
   - Queue/notification mechanism when parsing completes.

3. **Manual Menu Editor**
   - React UI to add/edit menu items, sections, prices, allergen tags.
   - Support bulk import (CSV) fallback for pre-structured data.
   - Track modification history (`updated_at`, versioning optional).

4. **Section & Tag Management**
   - Custom sections/categories (menu_categories table).
   - Tagging UI for `dietary`, `allergens`, `menu_type`, `is_active`.

## Phase 2 Exit Criteria
- Admin/Manager can upload a menu file, receive AI-generated items, edit them, and publish.
- Manual creation/editing of menu items fully working.
- NCDB records stay consistent with Zod schemas.

---

## Phase 3 – Customer-Facing Menu & QR
**Goal:** Deliver polished digital menu experience for end users.

1. **QR Code Generation**
   - Generate per-restaurant/per-menu QR codes (library or Cloudinary dynamic QR).
   - Store metadata in `qr_codes` table.

2. **Public Menu Viewer**
   - SEO-friendly, mobile-first route (e.g., `/r/{restaurantSlug}`) with menu sections, items, allergen tags.
   - Search/filter by dietary/allergen tags, category, price.
   - Language selector (start with EN, enable i18n scaffolding for others).

3. **Safety/Compliance Features**
   - Display allergen warnings prominently.
   - Provide “report issue” / feedback link.

## Phase 3 Exit Criteria
- Restaurant can share live QR menu showing current items/allergens.
- Filtering and language toggle functional.
- Basic analytics (QR scan counts) recorded.

---

## Phase 4 – Analytics & Reporting
**Goal:** Surface insights for compliance and engagement.

1. **Analytics Capture**
   - Track QR scans, menu views, popular items (store in `analytics`).
   - Capture allergen filter usage.

2. **Dashboards**
   - Admin view: key metrics (total restaurants, menus, scans, top allergens, etc.).
   - Restaurant view: menu-specific performance.

3. **Compliance Reports**
   - Allergen completeness score per menu.
   - Menu update history timeline.
   - Export (CSV/PDF) for audits.

## Phase 4 Exit Criteria
- Dashboard shows real data updated in near real-time.
- Reports available for download.

---

## Phase 5 – Billing & Subscriptions
**Goal:** Monetise AllerQ with subscription tiers.

1. **Payments Integration**
   - Stripe subscriptions (monthly/annual, free trial handling).
   - GoCardless direct debit for EU/UK (optional initial support).
   - Webhook listeners to update `subscriptions` table.

2. **Billing UI**
   - Restaurant-level billing settings (plan, payment method, invoices).
   - Superadmin overview of customer accounts and revenue.

3. **Feature Gating**
   - Toggle features based on plan (e.g., advanced analytics for Premium).
   - Trial expiration reminders.

## Phase 5 Exit Criteria
- Restaurants can self-serve subscribe/upgrade/cancel.
- Billing status reflected in admin tooling.

---

## Phase 6 – Automation & Polish
**Goal:** Automate repetitive tasks and prepare for public launch.

1. **AI-driven Enhancements**
   - Menu clean-up suggestions (duplicate items, missing allergens).
   - Notification when AI parsing is complete.
   - Automatic QR refresh on publish.

2. **Notifications & Messaging**
   - Email/SMS/web push for key events (menu published, subscription expiring).

3. **Observability & Ops**
   - Sentry/Logtail for monitoring.
   - Health checks, incident response playbooks.

4. **Security Review**
   - Pen test / vulnerability scan.
   - Data residency and GDPR compliance checklist.

## Phase 6 Exit Criteria
- Automated workflows reduce manual interventions.
- Monitoring alerting pipeline active.
- Security checklist complete.

---

## Launch Readiness Checklist
- ✅ All critical paths have automated tests (auth, restaurant/user CRUD, menu publish, QR view).
- ✅ Production deployment pipeline (Vercel or alternative) with staging environment.
- ✅ Backups or export routines for NCDB data.
- ✅ Support SOPs (impersonation tool, audit logs).
- ✅ Marketing site + onboarding material prepared.

When every phase above meets exit criteria, AllerQ is ready for public release and can start integrating with other Kitchen OS modules (FSS, FLS, Waste tracking) on the shared platform.
