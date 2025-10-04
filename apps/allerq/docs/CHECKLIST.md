# AllerQ Session Checklist

Use this quick list at the start and end of every coding session.

## Startup
- [ ] Load `.env.local` (or `.env.test` when running tests).
- [ ] Ensure port 3000 is free (`pnpm --filter @kitchen-os/allerq run kill-port-3000`).
- [ ] Start dev if needed: `pnpm --filter @kitchen-os/allerq dev -- --port 3000`.
- [ ] Run `scripts/checks.sh` to confirm lint + type-check are green before making changes.
- [ ] Skim `apps/allerq/docs/DECISIONS.md` for recent adjustments.

## During Work
- [ ] For NCDB helpers, confirm schemas exist or create/update in `apps/allerq/types/ncdb/`.
- [ ] Add `[DEBUG helper payload]` logs with masked secrets.
- [ ] When touching search endpoints, ensure payload uses top-level filters (no legacy `filters` arrays).
- [ ] Update tests or add a smoke route if behaviour changes.

## Wrap-up
- [ ] Re-run `scripts/checks.sh`.
- [ ] Manually hit `/dev-menu-test` if helpers changed.
- [ ] Update `apps/allerq/docs/DECISIONS.md` and/or `apps/allerq/docs/SESSION_NOTES.md` with outcomes.
- [ ] Stage, commit with conventional message, push, and monitor Vercel.
