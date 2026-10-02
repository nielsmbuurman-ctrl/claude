#!/usr/bin/env bash
# Loads shopify/.env when present and checks the required variables.
set -euo pipefail
SHOPIFY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$SHOPIFY_DIR/.env" ]]; then
  set -a; source "$SHOPIFY_DIR/.env"; set +a
fi
: "${SHOPIFY_API_VERSION:=2026-10}"
require() {
  for v in "$@"; do
    if [[ -z "${!v:-}" ]]; then
      echo "Missing $v. See shopify/README.md (step 3)." >&2; exit 1
    fi
  done
}
