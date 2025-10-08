# AllerQ Dashboard Mockup v2

Updated concept incorporating feedback to streamline navigation, improve tile hierarchy, and plan for large venue portfolios.

## Layout Overview (cards view)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sticky Top Bar                                                       │
│  • AllerQ wordmark                                                   │
│  • Primary nav: Dashboard · Restaurants · Menus · QR Codes           │
│  • Search icon • Notifications bell • Avatar (Settings, Billing, Help│
└──────────────────────────────────────────────────────────────────────┘

Utility bar (single row micro-cards)
[ Welcome back, {name} ] [ Active Restaurants: 12 ]
[ Pending Invites: 3 ] [ Plan: Pro · renews Jun 1 ] [ + Add Venue ]

Filter + bulk action bar
[ Search field........................ ] [ Status ▾ ] [ Tier ▾ ] [ Owner ▾ ]
[ Checkbox ] Select visible  •  [ Pause ] [ Invite Manager ] [ Export ]

Responsive restaurant grid (3-up desktop, 1-up mobile)
┌─────────────────────────┐┌─────────────────────────┐┌─────────────────┐
│ [Logo] Pizzeria Uno     ││ [Logo] Plant Kitchen    ││ [+] Add Venue   │
│ Active · Pro · Renews 6/1│ Trial · 6 days left      │ Quick create CTA│
│ Owner: Jane Smith       │ Owner: Noor Patel        │                 │
│ Stats: 24h scans ▣      │ Stats: 24h scans ▣       │                 │
│ ─────────────────────── ││ ─────────────────────── ││                 │
│ [ Manage menus ]   [ ⋯ ]││ [ Manage menus ]   [ ⋯ ]││                 │
└─────────────────────────┘└─────────────────────────┘└─────────────────┘

Notifications drawer (bell icon) replaces lower info bands.
```

### Restaurant card anatomy

- **Visual identity**: 48×48 logo with gradient fallback initial.
- **Headline**: restaurant name; status badge color-coded (green Active, amber Trial, gray Paused) with subscription summary inline (e.g. `Active · Pro · Renews Jun 1`).
- **Owner line**: owner name/email -> opens user drawer.
- **Stats chips**: compact icons for last menu sync + 24h QR trend (sparkline tooltip).
- **Actions**:
  - Primary button: `Manage menus`.
  - Overflow menu (`⋯`): Edit details, Managers, QR codes (view/download/create), Delete (if superadmin).
  - Card background click opens side drawer with full dossier (contact, map, billing).

### Navigation & supporting routes

- **Dashboard**: default cards view (toggle for master-detail).
- **Restaurants**: deeper filters/export; reuses card component.
- **Menus**: entry point to menu builder.
- **QR Codes**: table of generated QR assets with download actions.
- **Settings/Billing/Help**: moved under avatar dropdown (still expose `/settings`, `/billing` routes with placeholders).

### Notifications

- Bell icon opens a slide-in panel with tabs: Activity, Reminders, System Alerts.
- Surface the previous feed/reminders items there instead of permanent page real estate.

### Accessibility

- Add “Skip to content” link.
- Ensure focus order: header → utility bar → filters → cards.
- Keyboard shortcuts: `/` for global search, `Shift+A` to open Add Venue modal.

## Alternate Layout: Master-Detail (large portfolios)

Allow users to toggle to a split-pane view.

```
┌──────────────────────────┬──────────────────────────────────────────┐
│ Filters + list (scroll)  │ Detail panel                             │
│ [Search………] [Status ▾]   │ [Hero: logo, status badge, actions]     │
│ ──────────────────────── │ Contact, subscription timeline, map,     │
│ ▣ Pizzeria Uno           │ managers list, recent activity, QR tools │
│ ▣ Plant Kitchen          │                                          │
│ ▣ Add Venue              │                                          │
└──────────────────────────┴──────────────────────────────────────────┘
```

**Pros**: Scales to hundreds of venues, richer detail without drawers.  
**Cons**: Less dense for small portfolios. Provide toggle (remember preference).

## Visual styling

| Element              | Styling                                                                    |
|----------------------|----------------------------------------------------------------------------|
| Palette              | AllerQ orange `#F97316`, midnight slate `#0F172A`, warm grey `#E2E8F0`     |
| Buttons              | Primary `#F97316` filled; secondary slate outline; ghost tertiary           |
| Typography           | Inter; headings semibold, card body medium                                 |
| Surfaces             | Cards rounded-xl, shadow-sm baseline, shadow-md on hover                   |
| Status badges        | Active `#16A34A`, Trial `#F59E0B`, Paused `#94A3B8`                        |
| Empty state          | Illustration tile prompting “Add your first venue”                         |

Shared assets folder: `apps/allerq/public/brand/`

- `logos/allerq-wordmark.svg`
- `logos/kitchen-os-mark.svg`
- `icons/menu.svg`, `icons/qr.svg`, `icons/billing.svg`, `icons/settings.svg`, `icons/search.svg`, `icons/bell.svg`
- `patterns/dashboard-bg.png` (optional)

## Component breakdown

1. **TopNav**: sticky bar with condensed nav, search, notifications, avatar menu.
2. **UtilityStrip**: compact metrics bar (flex wrap on mobile).
3. **FilterToolbar**: search + filters + bulk actions with checkbox state management.
4. **RestaurantCard**: card component with overflow menu; supports selection state.
5. **RestaurantGrid**: responsive layout; virtualization when >50 records.
6. **RestaurantDrawer**: detailed info panel triggered from cards (cards view).
7. **Overflow child components**: `EditRestaurantModal`, `ManagersPopover`, `QrActionMenu`.
8. **NotificationsPanel**: slide-in w/ tabbed content.
9. **MasterDetailView**: list + detail layout sharing card logic.
10. **Placeholder routes**: `/settings`, `/billing`, `/qr` with skeleton cards.

## Next steps

1. **Brand assets & tokens**: drop logos/icons into `public/brand`, add CSS vars for palette/shadows in `globals.css`.
2. **Navigation shell**: implement new `TopNav` + `UtilityStrip` + avatar dropdown restructure.
3. **Filters & bulk actions**: build toolbar with selection handling (scaffolding actions even if backend hooks pending).
4. **RestaurantCard**: create component with mocked data, overflow menu, selection states.
5. **RestaurantGrid + Drawer**: integrate cards with current NCDB data, add detail drawer skeleton. ✅ (drawer TBD)
6. **Notifications panel**: stub slide-in with sample data. ✅
7. **Master-detail toggle**: add UI toggle and stub list/detail layout (can be hidden behind feature flag until ready). ◻︎
8. **Scaffold routes**: create `/settings`, `/billing`, `/qr` pages with placeholder content and link them from nav/avatar. ✅
9. **QA & accessibility**: test keyboard navigation, focus outlines, screen-reader labels. ◻︎
