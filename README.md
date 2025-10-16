# Kitchen OS – Codex Monorepo

This repository hosts the Kitchen OS platform, including the AllerQ application. Development is managed through Codex prompts to ensure production-grade, schema-compliant features.

## Getting Started

```sh
pnpm install
```

### Environment Variables

Create `.env.local` files for each workspace as needed. Starter templates are provided:

- Root examples: `.env.template`
- AllerQ workspace: `apps/allerq/.env.local`
- Smoke tests: `apps/allerq/.env.test`

Populate the NoCodeBackend credentials (`NCDB_API_KEY`, `NCDB_SECRET_KEY`, `NCDB_INSTANCE`) before running any backend flows.

## Development

```sh
pnpm --filter @kitchen-os/allerq dev
```

Helper scripts:

```sh
pnpm --filter @kitchen-os/allerq kill-port-3000   # Frees port 3000
pnpm --filter @kitchen-os/allerq test:smoke       # Runs signup smoke test
```

## Testing

Vitest-based tests live in `apps/allerq/tests`. Run the full suite with:

```sh
pnpm test
```

## Codex Usage

All development tasks must start from the Codex prompt template located at [`codex/CODEX_PROMPT_TEMPLATE.md`](codex/CODEX_PROMPT_TEMPLATE.md). The template enforces the rules defined in [`rules/CODEX_RULES.md`](rules/CODEX_RULES.md).

### Codex Compliance Rules

Key points (see the full document for details):

1. **Schema-first:** Always verify the NoCodeBackend schema (`Instance: 48346_allerq`) before coding.
2. **No workarounds:** Avoid stopgap fixes unless schema-compatible changes are impossible.
3. **Codex-first:** Execute all code changes via Codex prompts using the provided header.
4. **Typed validation:** Define interfaces and validate inputs for every helper and API.
5. **NCB alignment:** All database calls must match documented fields and types.

## Repository Structure

```
apps/          # Application workspaces (AllerQ, docs, web, etc.)
packages/      # Shared packages (auth, UI, configs)
rules/         # Codex development rules
codex/         # Codex prompt template
scripts/       # Utility scripts (env checks, etc.)
```

## Support

For schema updates or workflow questions, consult the Kitchen OS platform documentation or the engineering leads. All deviations from the rules must be documented in commit messages or inline comments.

_Last updated: 2025-09-27_
# Trigger smoke test
