# Kitchen OS Master Overview

## 🚀 What is Kitchen OS?
Kitchen OS is a modular, IoT-enabled digital operating system for professional kitchens. It unifies fragmented, manual processes across hospitality—from food safety and allergen compliance to waste tracking and cost control.

Core principles:
- **Chef-led:** Designed by chefs, for chefs, with intuitive, field-tested UX.
- **Modular:** Each product stands alone or plugs into the full stack.
- **Connected:** Hardware + software + AI working together.
- **STFO:** Built to “Stand The F*** Out” with bold, no-BS branding.

## 🎯 Why It Exists
Operators are overwhelmed with paperwork, regulation, and siloed systems. Kitchen OS aims to:
- Reduce administrative burden via automation (target 90% reduction).
- Improve safety, compliance, and accountability.
- Cut food waste and increase sustainability.
- Provide real-time data and control.
- Empower independents to compete with chains.

## 🧱 Modular Product Stack
1. **AllerQ** *(current focus)*
   - Smart QR-code menus with allergen/dietary breakdowns.
   - Simplifies compliance and keeps menus current.

2. **Food Safe System (FSS)** *(live)*
   - Digital HACCP platform with sensor integrations.
   - Real-time temperature alerts, checklists, audits.
   - Web app (AWS), Android/iOS apps, IoT sensors.
   - Integration into Kitchen OS: ~18 months; expect heavy lift.

3. **Food Label System (FLS)** *(live)*
   - Auto-label generation for prep, allergens, use-by dates.
   - Web backend, Android hardware-specific client.
   - Needs V2 refresh; integration timeline ~12 months.

4. **F* Waste** *(prototype/testing)*
   - Smart-scale food waste tracking with ROI insights.
   - MVP prototyping, timeline 3–5 months.

5. **FoodCost AI** *(planned lead magnet)*
   - Ingredient pricing, dish costing, margin alerts.
   - Supplier data + market fluctuation awareness.
   - Next project; timeline 1–2 months.

## 🔗 Unified Platform Components
- IoT sensors (LoRaWAN gateways, BLE probes, smart scales, etc.).
- Monorepo architecture (Turborepo, shared types/components).
- Role-based access control (Admins, Managers, Chefs, Auditors).
- NCDB or equivalent backend infra.
- Shared UI/UX system (shadcn/ui, Tailwind CSS, etc.).

Each module can run independently or integrate into the overall Kitchen OS dashboard.

## 🌍 Target Users / ICP
- Independent restaurants, cafés, food trucks.
- Boutique hotels, small hospitality groups.
- Enterprise chains (future phase).
- Public institutions (schools, care homes, hospitals).
- Ghost kitchens, production kitchens, caterers.

## 🧠 Strategic Foundations
- Monorepo to minimise tech debt and duplication.
- Scalable across UK, US, GCC, EU markets.
- Revenue-focused, outcome-led development.
- Foundation for future AI assistants (e.g., “Ask AllerQ”) and predictive insights.

## 🛠 Current Status
- Monorepo live; `apps/allerq` is the lead product.
- NCDB integration standardised via shared Zod schemas.
- Hardened linting, type safety, error handling pipelines.
- Sign-up/sign-in and role-based flows in progress.
- Smoke tests available for helper/endpoint validation.

## ⚙️ What’s Next
- Finalise and QA sign-up/sign-in.
- Build restaurant ➔ menu ➔ QR ➔ analytics end-to-end flow.
- Prep for public AllerQ launch.
- Onboard FSS & FLS modules into the monorepo.
- Engage partner chefs, early adopters, B2B resellers.

AllerQ is the spearhead toward a fully connected Kitchen OS ecosystem.
