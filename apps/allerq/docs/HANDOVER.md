# AllerQ Dashboard Handover — 2025-03-09

## Summary
- **Dashboard shell refreshed**: new top navigation, utility strip, restaurant card grid, filters/bulk actions, notifications drawer.
- **Restaurant flows**: create/edit forms share Cloudinary upload, require addresses, show AllerQ Account ID read-only for edits, and update/delete now target the correct NCDB endpoints.
- **Brand alignment**: global tokens updated to AllerQ palette and typography while preserving legacy aliases.
- **Password policy**: consistent validation across admin flows and public signup (minimum 6 characters with upper/lower/number/symbol).

All changes are merged to `main` (commit `2adddb8`) and lint/typecheck/build are green.

## Outstanding Issues
1. **Notifications drawer** – currently serves placeholder content; needs wiring to real activity feed or removal until backend ready.
2. **Restaurant delete API** – wired to NCDB `DELETE /delete/restaurants/{id}`; confirm behaviour in staging once new endpoint is deployed.
3. **Logo visibility** – local dashboard now revalidates and reads `logo_url`/`logo`, but confirm after prod deploy that NCDB returns the updated field.
4. **Menus/QR/Settings/Billing pages** – placeholder scaffolds only; require real content and perms once backend endpoints are settled.
5. **Access control copy** – confirm “AllerQ Account ID” labelling with product; adjust if alternate terminology preferred.

## Immediate Next Steps
1. **QA pass**  
   - Create restaurant with logo → verify dashboard card updates instantly.  
   - Edit restaurant address/logo → confirm NCDB reflects changes and dashboard refresh picks up new logo.  
   - Exercise delete flow on staging; ensure toast errors surface properly when NCDB rejects.

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
```
Manual smoke: sign in as superadmin → `/dashboard`, `/restaurants` → create/edit/delete restaurant → verify Cloudinary/logo behaviour.

## Environment
- `.env.local` houses Cloudinary + NCDB credentials (required for logo uploads and API calls).
- Re-run `pnpm install` if dependencies change (`lucide-react`, Cloudinary SDK already installed).

## Open Questions
- Do we need auditing/logging for restaurant/logo changes?  
- Should password policy copy mention the 6-character requirement explicitly on sign-in/reset flows too?

Ping @next-agent in Slack if further context is required. After the above QA items, focus shifts to menus CRUD and QR tooling as per roadmap.
