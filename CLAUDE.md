# Repo notes for Claude

## Shopify store + theme (`shopify/`)

Setup and credentials: `shopify/README.md`. Credentials come from env vars
(`SHOPIFY_STORE`, `SHOPIFY_CLI_THEME_TOKEN`, `SHOPIFY_CLIENT_ID`,
`SHOPIFY_CLIENT_SECRET`) or `shopify/.env`; never ask for them in chat and never commit them.

- Theme files: `shopify/scripts/theme.sh` (Shopify CLI + Theme Access). Local copy lives in `shopify/theme/`.
- Store data: `shopify/scripts/admin.sh` (Admin GraphQL, client credentials), or the Shopify MCP connector if signed in.
  Look up exact GraphQL fields in the schema/docs before writing an operation; don't guess.

Theme editing rules:
1. Before editing, `theme.sh list`, then `theme.sh pull --theme <live id>` and commit if anything changed. Never edit from a stale copy.
2. Edit locally and run `theme.sh check`.
3. Push to the unpublished preview theme first: `theme.sh push --unpublished --theme claude-preview` (or `--theme <preview id>` once it exists), then give the user the preview link (`theme.sh share` / theme preview URL).
4. Push to the **live** theme or publish only after the user explicitly says so. For live, push only the changed files (`--only <file>`): a full push deletes remote files that are missing locally.
5. Don't overwrite `config/settings_data.json` or `templates/*.json` on live without pulling first: merchants change these in the theme editor.
6. Commit each change with a clear message.
