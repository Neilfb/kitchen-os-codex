# AllerQ Dashboard Handover — 2025-03-09

## Summary
- **Dashboard shell refreshed**: new top navigation, utility strip, restaurant card grid, filters/bulk actions, notifications drawer.
- **Restaurant flows**: create/edit forms share Cloudinary upload, require addresses, show AllerQ Account ID read-only for edits, and update/delete now target the correct NCDB endpoints.
- **Brand alignment**: global tokens updated to AllerQ palette and typography while preserving legacy aliases.
- **Password policy**: consistent validation across admin flows and public signup (minimum 6 characters with upper/lower/number/symbol).
- **Menus workspace**: manual menu editor, existing menu list with archive/delete controls, and `/menus/[id]` editing surface now live.
- **Menu AI worker**: `pnpm --filter @kitchen-os/allerq process-menu-uploads` pulls pending uploads, extracts text, calls OpenAI, and seeds `menu_upload_items` for review.

All changes are merged to `main` (commit `2adddb8`) and lint/typecheck/build are green.

## Outstanding Issues
1. **Notifications drawer** – currently serves placeholder content; needs wiring to real activity feed or removal until backend ready.
2. **Restaurant delete API** – wired to NCDB `DELETE /delete/restaurants/{id}`; confirm behaviour in staging once new endpoint is deployed.
3. **Logo visibility** – local dashboard now revalidates and reads `logo_url`/`logo`, but confirm after prod deploy that NCDB returns the updated field.
4. **Menus AI review UI** – hook `menu_upload_items` into the menu detail workspace so managers can accept/merge AI suggestions.
5. **Menus/QR/Settings/Billing pages** – placeholder scaffolds only; require real content and perms once backend endpoints are settled.
6. **Access control copy** – confirm “AllerQ Account ID” labelling with product; adjust if alternate terminology preferred.

## Immediate Next Steps
1. **QA pass**  
   - Create restaurant with logo → verify dashboard card updates instantly.  
   - Edit restaurant address/logo → confirm NCDB reflects changes and dashboard refresh picks up new logo.  
   - Exercise delete flow on staging; ensure toast errors surface properly when NCDB rejects.  
   - Menu AI flow: upload PDF/DOCX → run `pnpm --filter @kitchen-os/allerq process-menu-uploads` (ensure OPENAI/NCDB env set) → visit `/menus/[id]` → promote at least one suggestion and confirm NCDB `menu_items` row.  
   - Capture any worker/AI review issues (missing NCDB fields, permission errors, Cloudinary failures) in the staging QA checklist so follow-up fixes can be prioritised.

2. **Wire notifications feed**  
   - Hook `/api/activity` (or equivalent) into `NotificationsDrawer`.  
   - Provide loading/empty/error states before toggling into production.

3. **Flesh out placeholder routes**  
   - `/menus`: surface current menus (even read-only) and CTA for builder.  
   - `/qr`: list existing codes + download actions.  
   - `/settings`, `/billing`: add real data or direct links to legacy flows.

4. **Plan manager invite modal**  
   - Replace restaurants pane overflow redirects with inline modals for edit/managers/QR once backend contracts are ready.

## Testing Commands
```bash
pnpm --filter @kitchen-os/allerq lint
pnpm --filter @kitchen-os/allerq typecheck
pnpm --filter @kitchen-os/allerq build
# AI parser CLI
pnpm --filter @kitchen-os/allerq process-menu-uploads -- --dry-run
# AI parser staging run (requires OPENAI/NCDB creds)
pnpm --filter @kitchen-os/allerq process-menu-uploads
# Unit & integration tests
pnpm vitest run
```
Manual smoke: sign in as superadmin → `/dashboard`, `/restaurants` → create/edit/delete restaurant → verify Cloudinary/logo behaviour.

## CI / Regression
- Add `pnpm --filter @kitchen-os/allerq process-menu-uploads -- --dry-run` to regression/CI checks so the AI worker pipeline stays green.
- Capture staging run output (upload → worker → promote) during release rehearsals to confirm NCDB schema alignment before enabling in production.
- Include `pnpm vitest run` in pre-release checklists so parser + worker integration tests stay green.

## Automation & Monitoring
- Vercel cron (or equivalent) should call `POST /api/admin/menu-upload-worker` with header `x-cron-secret: $ALLERQ_WORKER_SECRET`. The endpoint runs the same worker used in the CLI and returns summary metrics.
- Configure `ALLERQ_SLACK_WEBHOOK` so the worker pings Slack on success/failure; optionally set `ALLERQ_WORKER_SECRET` to guard the endpoint.
- Worker metadata now stores `aiMetrics` (duration, token usage, items processed) per upload—use this for analytics dashboards.

## Environment
- `.env.local` houses Cloudinary + NCDB credentials (required for logo uploads and API calls).
- Add `OPENAI_API_KEY` (and optionally `ALLERQ_OPENAI_MODEL`, `ALLERQ_MENU_PARSER_VERSION`) before running the menu AI worker.
- Re-run `pnpm install` if dependencies change (`lucide-react`, Cloudinary SDK already installed).

## Open Questions
- Do we need auditing/logging for restaurant/logo changes?  
- Should password policy copy mention the 6-character requirement explicitly on sign-in/reset flows too?

Ping @next-agent in Slack if further context is required. After the above QA items, focus shifts to menus CRUD and QR tooling as per roadmap.

Implementation detail tracking for menus/QR/billing/diner work now lives in `docs/architecture/allerq-menus-qr-billing-plan.md`.
