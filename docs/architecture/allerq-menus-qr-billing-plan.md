# AllerQ Menus, QR, Billing & Diner Experience Plan

Last updated: 2025-03-09

## Objectives
- Deliver full menu management (uploads, AI parsing, manual edits, categorisation) per restaurant.
- Generate, manage, and govern QR codes so each physical location has unique, compliant diner-facing menus.
- Integrate billing via Stripe + GoCardless, charging per active restaurant location.
- Ensure restaurant locations are uniquely identified to prevent code sharing across venues.
- Launch a diner view that reflects restaurant branding, allergen filters, and regional compliance requirements.

## Scope Overview
1. **Menu Workspace**: Upload doc/PDF menus (≤10 MB), auto-categorise items, surface AI-generated allergens/dietary tags, allow manual overrides and custom categories.
2. **QR Management**: Generate per-menu QR assets, manage regeneration/download, guard against cross-location reuse, log scan analytics.
3. **Billing**: Stripe + GoCardless subscriptions with per-restaurant pricing (£7.49/mo or £74/yr), status surfaces in dashboard + billing page, webhook-driven state updates.
4. **Location Assurance**: Capture precise location metadata (address, geocode, internal location code), enforce uniqueness across subscriptions, tie QR codes + diners to location.
5. **Diner UI**: Branded, responsive menu page with allergen/dietary filters, multilingual copy, regulatory highlighting per region.

## Architecture & Data Model
### NCDB Tables (existing)
- `restaurants`: add structured location fields (`location_code`, `lat`, `lng`, `timezone`), region slug, branding tokens (primary color, accent, typography preset).
- `menus`: ensure `menu_type`, `ai_processed`, `upload_file_name` are maintained; add `source_upload_id` FK (→ `menu_uploads.id`).
- `menu_items`: extend to store `identified_allergens` (JSON), `identified_dietary` (JSON), `regulatory_highlights` (JSON), `source_upload_item_id`.
- `menu_categories`: ensure slug + display order support custom entries. Add `restaurant_id` FK for custom categories.
- `menu_uploads`: persist upload metadata (`file_url`, `resource_type`, `file_size`, `status`, `processed_at`, `parser_version`, `failure_reason`).
- `qr_codes`: enforce uniqueness on (`restaurant_id`, `menu_id`, `location_code`); store `qr_url`, `deeplink`, `last_regenerated_at`, `scan_target_version`.
- `subscriptions`: track provider (`stripe`, `gocardless`), `provider_customer_id`, `provider_subscription_id`, `plan`, `status`, `renews_at`, `trial_end`, `location_count`.
- `analytics`: log QR scans, menu views, allergen filter usage (fields: `event_type`, `restaurant_id`, `menu_id`, `qr_id`, `payload`).

### New Supporting Tables
- `menu_upload_items`: row per parsed dish (link to upload before creating `menu_items`), includes `raw_text`, `ai_payload`, `confidence`, `status`.
- `regulatory_allergens`: map `region` → required allergen list, icon IDs, labels.
- `restaurant_locations` (optional if `restaurants` table becomes overloaded): `restaurant_id`, `location_code`, `address`, `geocode`, `subscription_id`.

### File Storage
- Use Cloudinary (existing integration) with `resource_type: 'raw'` for PDF/DOC uploads (max 10 MB). Store secure URL + metadata in `menu_uploads`.
- QR codes stored as PNG/SVG in Cloudinary (folder `qr_codes/<restaurant>/<menu>`).

### AI Processing Pipeline
1. Upload file via presigned POST to Cloudinary (raw). Create `menu_uploads` entry (`status: 'pending'`).
2. Kick off server action/queue worker (`/api/menu-processing/start`). Persist job record.
3. Fetch file, run through OpenAI (gpt-4.1 or latest) with structured prompt to extract:
   - Menu sections → items → description → price (if present).
   - Allergen keywords; dietary tags.
   - Confidence score and suggested category (from default list).
4. Map items to canonical allergens/dietary tags using `regulatory_allergens`.
5. Insert into `menu_upload_items` with AI payload.
6. Present review UI allowing acceptance, editing, or discard of each item. On approval, create/update `menu_items`, `menu_categories`, toggle `ai_processed`.
7. Log AI version + tokens per upload for auditing.

Implementation note: `apps/allerq/workers/processMenuUploads.ts` powers steps 2–5 via `pnpm --filter @kitchen-os/allerq process-menu-uploads`. Set `OPENAI_API_KEY` (and optional `ALLERQ_OPENAI_MODEL`, `ALLERQ_MENU_PARSER_VERSION`) before running the worker; use `--dry-run` to inspect payloads without writing to NCDB.
## Feature Breakdown
### 1. Menu Management
- **Uploads**:
  - UI: `/menus` workspace with drag/drop area.
  - Validation: 10 MB limit, `.pdf`, `.doc`, `.docx`.
  - API: `POST /api/menus/uploads` → Cloudinary signature helper, `menu_uploads` record.
  - Background processing trigger + status polling route (`GET /api/menus/uploads/:id/status`).
- **Manual creation**:
  - UI form at `/menus` allows selecting a restaurant, entering menu metadata (name, description, type), and drafting items inline.
  - Manual items saved immediately via `createMenu` + `createMenuItem`; price is optional, category free-form.
  - Menu list fetched from `/api/menus/list` for quick navigation with placeholders for edit/analytics links.
- **Editing (up next)**:
  - `/menus/[id]` now supports inline editing via `MenuDetailClient`, talking to `/api/menus/:id` and `/api/menus/:menuId/items` endpoints.
  - Archive/activate toggles and delete actions surface in the menu list; doc for permissions remains `menu.manage`.
  - Next iteration: expose AI diffing (respect `manual_override`) and analytics once backend endpoints land.
- **AI Review**:
  - UI component showing parsed items with allergens/dietary icons, confidence, and regulatory highlights.
  - Accept/merge flow to existing menu (select target menu or create new).
  - Manual categorisation fallback when AI confidence < threshold.
  - Server endpoint `POST /api/menus/uploads/:uploadId/items/:itemId/promote` promotes AI suggestions into `menu_items` and marks the upload item as completed.
- **Manual Creation**:
  - Form for adding sections/categories, items, allergen tags, pricing.
  - Use `menu_categories` for default list (Starters, Mains, etc.) + allow custom add per restaurant.
- **Editing**:
  - Inline edits for items; track `manual_override`.
  - History log (append to `menu_items` audit table or `analytics` event).
- **Regulatory logic**:
  - `regulatory_allergens` dataset; service returning required tags per restaurant region.
  - Highlight mandatory allergens that are missing; block publish until resolved.

### 2. QR Codes
- **Library page**: list by restaurant → menu, show QR thumbnail, download/regenerate actions, scan counts.
- **Generation**:
  - Use `qrcode` npm or similar to generate PNG/SVG buffer, upload to Cloudinary.
  - Include `location_code` + `menu_id` in deeplink (`/diner/<location_code>/<menu_slug>`).
  - Record `qr_codes` row with checksum; regenerate invalidates previous `scan_target_version`.
- **Access control**: only admin/superadmin and assigned managers for a restaurant.
- **Analytics**: route under `/api/qr/scan` increments counts, writes to `analytics`.

### 3. Billing (Stripe + GoCardless)
- **Stripe**:
  - Products: monthly & annual AllerQ per restaurant.
  - Checkout sessions initiated from `/billing`.
  - Webhooks: `checkout.session.completed`, `customer.subscription.updated/deleted` → update `subscriptions`.
  - Portal for payment method updates.
- **GoCardless**:
  - Redirect flow for direct debit signup.
  - Webhooks: mandate events, subscription status.
- **Shared logic**:
  - Abstraction layer in `apps/allerq/lib/billing/` handling providers.
  - `subscriptions` record per restaurant location; block menu publishing if subscription delinquent.
  - Billing page summarises plan status, invoices (`/api/billing/invoices`).
  - Superadmin override tools in dashboard.

### 4. Location Identification
- **Data capture**:
  - Extend restaurant creation/edit flow to require complete address, postcode, country, optional suite/floor.
  - Generate deterministic `location_code` (slug/shortcode) per restaurant location.
  - Support multi-location groups by adding new restaurant entries or `restaurant_locations` child records; each requires subscription.
- **Enforcement**:
  - QR generation uses `location_code` + `subscription_id`.
  - Diner page validates subscription + location is active; otherwise show notice.
  - Analytics keyed by location to detect anomalous scans (e.g., from different geos).
- **Geo validation**:
  - Optionally integrate geocoding (Mapbox/Google) later; for now store lat/lng if provided.

### 5. Diner View
- **Route**: `/diner/[locationCode]/[menuSlug]`.
- **Branding**: load restaurant theme (logo, colors, font). Provide fallback tokens.
- **Features**:
  - Filter pills for allergens/dietary tags (derived from `regulatory_allergens` + restaurant-configured tags).
  - Sectioned menu display with icons + badges.
  - Multilingual support using existing i18n system; auto-detect + allow manual switch.
  - Accessibility: high-contrast mode toggle, screen reader labels for icons.
- **Compliance**:
  - Display regulatory disclaimer per region.
  - Highlight required allergens with icons + text (including local regulation emphasis).
- **Performance**:
  - Static generation with ISR keyed on menu updates; fallback to SSR for dynamic filters.
  - Cache bust triggered when menu items updated or subscription suspended.

## API & Helper Tasks
- Add NCDB helpers (`lib/ncb/`) for new/extended endpoints:
  - `listMenuUploads`, `createMenuUpload`, `updateMenuUploadStatus`.
  - `upsertMenu`, `upsertMenuItem`, `listMenuCategories`, `createCustomCategory`.
  - `createQrCode`, `listQrCodes`, `updateQrCode`.
  - `createSubscription`, `updateSubscriptionStatus`, `listInvoices`.
  - `listRegulatoryAllergens`.
- Ensure all helpers use `ensureParseSuccess`, typed interfaces, and shared logging.
- Server routes (`app/api/`) to back the UI flows, enforcing RBAC via guards.

## UI Tasks (Next.js App Router)
- `/menus`: replace placeholder with tabbed interface (Uploads, Drafts, Published).
- `/menus/[menuId]`: detailed editor with AI review panel.
- `/qr`: table view with filters, tab for analytics.
- `/billing`: integrate Stripe/GoCardless actions, show subscription state per location.
- `/diner/[locationCode]/[menuSlug]`: public view.
- Component library updates in `packages/ui` for allergen badges, file upload dropzone, QR preview card.

## Compliance & Observability
- Log AI parsing decisions and manual overrides (append to `analytics` or new audit table).
- Add monitoring for webhook failures.
- Ensure rate limiting on diner API routes to prevent abuse.

## Testing Strategy
- Unit tests for helper mappings (OpenAI response → NCDB payload).
- Integration tests for API routes (menu upload flow, QR generation).
- Playwright smoke for diner view filters.
- Webhook signature verification tests (Stripe, GoCardless).

## Rollout Phases
1. **Foundations**: extend schemas, build helpers, create regulatory dataset, wire menu upload storage.
2. **Menu Workspace**: deliver upload → AI review → manual edit → publish flow.
3. **QR & Diner**: generate QR assets, build diner route, enforce location checks.
4. **Billing**: integrate providers, enforce subscription gating, surface UI.
5. **Polish & Monitoring**: analytics, audit logging, localisation refinements.

Keep this plan updated as implementation progresses. Cross-link tickets to relevant sections and log decisions in `apps/allerq/docs/DECISIONS.md`.
