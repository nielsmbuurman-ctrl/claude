#!/usr/bin/env bash
# Runs a GraphQL Admin API operation using the Dev Dashboard app's
# client credentials (token is fetched and cached for ~24h).
#   scripts/admin.sh '{ shop { name myshopifyDomain } }'
#   scripts/admin.sh @query.graphql '{"id":"gid://shopify/Product/1"}'
source "$(dirname "$0")/env.sh"
require SHOPIFY_STORE SHOPIFY_CLIENT_ID SHOPIFY_CLIENT_SECRET
query="${1:?usage: admin.sh '<graphql>'|@file.graphql [variables-json]}"
vars="${2:-{\}}"
[[ "$query" == @* ]] && query="$(cat "${query#@}")"

cache="$SHOPIFY_DIR/.token-cache"
if [[ -f "$cache" ]] && (( $(date +%s) < $(head -1 "$cache") )); then
  token="$(sed -n 2p "$cache")"
else
  resp="$(curl -sS -X POST "https://$SHOPIFY_STORE/admin/oauth/access_token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode grant_type=client_credentials \
    --data-urlencode "client_id=$SHOPIFY_CLIENT_ID" \
    --data-urlencode "client_secret=$SHOPIFY_CLIENT_SECRET")"
  token="$(node -e 'const r=JSON.parse(process.argv[1]);if(!r.access_token){console.error(JSON.stringify(r));process.exit(1)}console.log(r.access_token)' "$resp")"
  printf '%s\n%s\n' "$(( $(date +%s) + 82800 ))" "$token" > "$cache"
  chmod 600 "$cache"
fi

body="$(node -e 'console.log(JSON.stringify({query:process.argv[1],variables:JSON.parse(process.argv[2])}))' "$query" "$vars")"
curl -sS -X POST "https://$SHOPIFY_STORE/admin/api/$SHOPIFY_API_VERSION/graphql.json" \
  -H 'Content-Type: application/json' -H "X-Shopify-Access-Token: $token" \
  --data "$body"
echo
