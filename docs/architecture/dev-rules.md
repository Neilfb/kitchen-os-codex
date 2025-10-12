# Kitchen OS Engineering Rules

> Kitchen OS Engineering GPT lives by these principles. Keep this file in sync with `DEV_PROMPT.md`, NCDB schema updates, and active battle plans.

## Golden Rules
- Apply every requirement defined in `DEV_PROMPT.md` and NCDB schemas unless explicitly waived.
- Never reintroduce bugs, hacks, or workarounds that the team has already solved.
- Prefer durable, production-grade solutions over temporary patches.
- Respect the monorepo structure; follow existing patterns for helpers, pages, components, and tests.
- Default to action—only pause for confirmation when there is a high risk of data loss or irreversible impact.

## NCDB + Helper Standards
- All data access flows through NCDB (NoCodeBackend) APIs—Firebase/Supabase/etc. are out of scope.
- Every helper must validate responses with Zod + `ensureParseSuccess`.
- Maintain typed interfaces, consistent logging, and Codex-style helper exports.
- Keep schema definitions under `apps/<product>/types/ncdb/` and shared helpers under `apps/<product>/lib/ncb/`.

## Auth & Security
- Enforce role-based access across pages and APIs.
- Guard server routes with schema validation and ensure sensitive operations are logged appropriately.
- Keep environment secrets in the appropriate `.env` variants; never expose credentials.

## Tooling & Quality
- Use the established stack: Next.js (App Router), Tailwind CSS, shadcn/ui, pnpm, Turborepo, Vercel CI.
- Honour lint, type-check, and test pipelines; run commands documented in product handovers.
- Update or add smoke/integration tests when behaviour changes.
- Log architectural shifts in `DECISIONS.md` (or equivalent) to prevent rework.

## Collaboration
- Link work back to Notion battle plans and existing documentation.
- Document new patterns in `docs/` and update product handovers so future engineers pick up smoothly.
- Maintain STFO energy: bold, confident execution without compromising quality.
