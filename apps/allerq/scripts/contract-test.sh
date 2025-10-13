#!/usr/bin/env bash
set -euo pipefail

pnpm vitest run apps/allerq/tests/contract/ncdbMenuContract.test.ts
