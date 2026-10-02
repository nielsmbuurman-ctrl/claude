# Shopify store + theme editing with Claude Code

Two separate connections, because Shopify splits them:

| Purpose | Credential | Where it comes from |
|---|---|---|
| **Edit the theme** (Liquid, CSS, JS, sections, templates) | Theme Access password (`shptka_…`) | Free **Theme Access** app by Shopify |
| **Edit store data** (products, pages, menus, metafields, collections…) | Client ID + Client secret | An app you create in the **Dev Dashboard** |

Why not do theme edits through the Dev Dashboard app? The Admin API mutation for
writing theme files (`themeFilesUpsert`) needs `write_themes` **plus a special
exemption from Shopify**. Theme Access + Shopify CLI is the official way to edit
themes from a developer tool, and needs no exemption.

---

## Step 1: Theme Access password (for theme editing)

1. In your Shopify admin, open **Apps → Shopify App Store**, search for **Theme Access** (by Shopify), and install it.
2. Open the Theme Access app → **Create password**. Enter a name (e.g. `Claude Code`) and **your own email**.
3. Open the email from Shopify and click **View password**. Copy the `shptka_…` password. It's shown **only once**.

## Step 2: Dev Dashboard app (for the Admin API)

1. In your Shopify admin go to **Settings → Apps → Develop apps**, then choose **Build apps in Dev Dashboard**
   (or go straight to <https://dev.shopify.com/dashboard>).
2. **Create app** → *Start from Dev Dashboard* → name it `Claude Code` → **Create**.
3. In the **Versions** tab, select the Admin API **access scopes** you want Claude to have. Suggested:
   `read_products, write_products, read_content, write_content, read_online_store_navigation,
   write_online_store_navigation, read_themes, read_files, write_files, read_metaobjects,
   write_metaobjects, read_inventory, write_inventory, read_orders, read_customers`
   Then click **Release**.
4. On the app's **Home**, click **Install app**, pick your store and approve.
5. Open **Settings** and copy the **Client ID** and **Client secret**.

Tokens are fetched automatically from these (client credentials grant, valid for 24h).
This works only when the app and the store are in the **same organization**.
If you get `shop_not_permitted`, create the app from your store admin's
*Develop apps* page (step 2.1) so it ends up in the store's organization.

## Step 3: Give the credentials to Claude Code

**Never paste them into the chat.** Use environment variables:

- **Claude Code on the web / app (cloud):** the cloud environment menu in the session's title bar → **Edit** →
  add the variables below. While you're there, set **Network access** to allow these domains:
  `*.myshopify.com`, `shopify.dev`, `*.shopify.com`, `cdn.shopify.com`. Start a new session afterwards.
- **Claude Code on your computer:** `cp shopify/.env.example shopify/.env` and fill it in (`.env` is git-ignored).

```
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_CLI_THEME_TOKEN=shptka_...
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
```

## Step 4: Check the connection

```bash
shopify/scripts/theme.sh list                         # should list your themes
shopify/scripts/admin.sh '{ shop { name myshopifyDomain plan { displayName } } }'
```

Then just prompt Claude: *"pull my live theme"*, *"make the header sticky"*,
*"change the product page button colour to our brand green"*, etc.

---

## How Claude edits the theme (the workflow)

1. **Pull** the live theme into `shopify/theme/` and commit it, so there's a baseline to diff and revert to.
2. **Edit** files locally; run `scripts/theme.sh check` (Theme Check linter).
3. **Push to an unpublished preview theme** (`claude-preview`) and share the preview link.
4. Only after you approve: push to the live theme, or publish the preview theme from your admin.
5. Commit every change, so git history is your undo button.

## Scripts

- `scripts/theme.sh <list|pull|push|check|share|info> [flags]`: Shopify CLI wrapper (theme files land in `shopify/theme/`)
- `scripts/admin.sh '<graphql>' ['<variables-json>']`: Admin GraphQL API call
