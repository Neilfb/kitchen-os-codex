# Kitchen OS Overview

## Purpose
- Align on the end-to-end Kitchen OS vision, modular product stack, and shared platform choices.
- Provide quick links to product-specific handovers as they evolve (e.g. `apps/allerq/docs/HANDOVER.md`).
- Serve as the canonical reference for onboarding and cross-team planning.

## Vision & Positioning
- Chef-led, field-tested UX aimed at professional kitchens.
- Modular apps that operate independently or as part of the Kitchen OS suite.
- Hardware + software + AI working together, branded to “stand out” boldly.
- Focused on measurable impact: automation, compliance, waste reduction, real-time control, and levelling the field for independents.

## Product Stack
- **AllerQ (live)** — Digital allergen menus with QR access, multilingual support, and NCDB-backed workflows. See `apps/allerq/docs/HANDOVER.md` for current status.
- **Food Safe System (FSS) (live)** — Digital HACCP with sensor integrations and real-time checklists. (Document link TBD.)
- **Food Label System (FLS) (live)** — Automated prep and allergen labelling integrated with compliance flows. (Document link TBD.)
- **F\* Waste\*\* (prototype)** — Smart-scale waste tracking with real-time ROI insights. (Document link TBD.)
- **FoodCost AI (planned)** — Supplier-aware costing, margin insights, and smart alerts. (Document link TBD.)

## Platform Foundations
- **Monorepo**: Turborepo with shared TypeScript types, linting, and UI primitives (shadcn/ui + Tailwind).
- **Backend**: NoCodeBackend (NCDB) APIs with Zod-validated helpers living under `lib/ncb/`.
- **Auth**: NCDB auth spanning email/password, Google, and Apple sign-in with role-based access.
- **Shared UX**: Tokens and theming aligned across products while allowing brand-specific palettes (e.g. AllerQ).
- **Infra**: Hosted on Vercel with CI linting/type-checking; NCDB credentials managed via environment files.
- **IoT & Hardware**: LoRaWAN gateways, BLE probes, smart scales, etc., feeding into the shared platform.
- **Note**: Firebase is **not** part of the current stack.

## Target Users
- Independent restaurants, cafés, food trucks.
- Boutique hospitality groups and multi-venue brands.
- Enterprise chains and public institutions (future focus).
- Ghost kitchens, production kitchens, caterers.

## Strategic Priorities
- Maintain a revenue-first, outcome-driven roadmap.
- Build a unified authentication/authorization model across products.
- Lay groundwork for AI assistants (e.g. “Ask AllerQ”) and predictive insights.
- Ensure scalability across regions (UK, US, GCC, EU) with compliance awareness.

## AllerQ Snapshot
- **Core aims**: Prevent allergen incidents, build guest trust, simplify compliance, become the Kitchen OS entry point.
- **Key features**: QR menus, allergen/dietary filtering, multi-location support, RBAC, multilingual menus, menu editor, planned analytics, and billing.
- **Tech**: Next.js 14 App Router, shadcn/ui, Tailwind, NCDB REST APIs with Zod validation, shared monorepo tooling.
- **Status**: Auth + menu management live; QR flow stable; pricing set (£7.49/mo or £74/year); Stripe billing and analytics in motion; imports/exports and AI assist planned.

## Current Program Status
- Monorepo structure + NCDB integration is live and enforced via shared schemas.
- AllerQ dashboard refresh complete (see handover doc).
- Sign-up/sign-in flows, RBAC, and smoke tests are validated.
- Shared linting/type-check/build pipelines are green.

## Roadmap Highlights
- Finalise QA and polish for AllerQ dashboard (notifications feed, menus/QR/settings/billing routes, manager invite modal, etc.).
- Deliver end-to-end restaurant → menu → QR → analytics journey.
- Prepare AllerQ for public launch (Stripe billing, menu import/export, analytics).
- Expand active development to FSS and FLS within the monorepo.
- Initiate outreach to partner chefs, early adopters, and resellers.

## Reference Materials
- AllerQ handover: `apps/allerq/docs/HANDOVER.md`
- NCDB schema notes: `apps/allerq/docs/NCDB_SCHEMA.md`
- Dashboard mocks: `apps/allerq/docs/DASHBOARD_MOCK.md`
- Environment templates: `.env.example` / `apps/allerq/.env.local` (credentials required for NCDB + Cloudinary)
- Smoke tests: `apps/allerq/tests/`
- Engineering rules: `docs/architecture/dev-rules.md`
- AllerQ menus/QR/billing plan: `docs/architecture/allerq-menus-qr-billing-plan.md`

> Keep this overview current as scope evolves. For major product additions or infra changes, add or link dedicated docs under `docs/architecture/`.
