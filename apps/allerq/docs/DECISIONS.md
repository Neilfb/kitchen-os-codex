# Decisions Log

Document irreversible choices or behavioural nuances that future work must respect.

## 2025-02-04
- **NCDB search payloads**: Search endpoints now accept top-level fields (e.g., `{ email }`, `{ id }`). The legacy `filters` array triggers SQL errors and must not be used.
- **Null assigned_restaurants**: NCDB sends `assigned_restaurants: null` for many users. Schemas must coerce `null` to `undefined` instead of rejecting the record.
- **Helper validation contract**: All helpers use `ensureParseSuccess` for both request candidates and NCDB responses; direct `.safeParse()` branching is deprecated.
- **Port allocation**: Dev server must bind to port 3000; use `pnpm --filter @kitchen-os/allerq run kill-port-3000` before `pnpm ... dev` to avoid auto-bumping to 3002.
- **Logging standard**: Use `[helper]` prefixes (e.g., `[createMenu]`, `[getUserByEmail]`) for informational and error logs; secrets masked as `*****`.
