#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/lint.sh"
"${SCRIPT_DIR}/type-check.sh"
"${SCRIPT_DIR}/contract-test.sh"
