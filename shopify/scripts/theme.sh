#!/usr/bin/env bash
# Thin wrapper around Shopify CLI theme commands, authenticated with the
# Theme Access password. Examples:
#   scripts/theme.sh list
#   scripts/theme.sh pull --theme 123456789        # into shopify/theme
#   scripts/theme.sh push --unpublished --theme claude-preview
#   scripts/theme.sh push --theme 123456789 --only sections/header.liquid
#   scripts/theme.sh check
source "$(dirname "$0")/env.sh"
cmd="${1:?usage: theme.sh <list|pull|push|check|share|info> [flags]}"; shift
if [[ "$cmd" == "check" ]]; then
  exec npx -y @shopify/cli@latest theme check --path "$SHOPIFY_DIR/theme" "$@"
fi
require SHOPIFY_STORE SHOPIFY_CLI_THEME_TOKEN
export SHOPIFY_FLAG_STORE="$SHOPIFY_STORE"
case "$cmd" in
  pull|push) exec npx -y @shopify/cli@latest theme "$cmd" --path "$SHOPIFY_DIR/theme" --password "$SHOPIFY_CLI_THEME_TOKEN" "$@" ;;
  *)         exec npx -y @shopify/cli@latest theme "$cmd" --password "$SHOPIFY_CLI_THEME_TOKEN" "$@" ;;
esac
