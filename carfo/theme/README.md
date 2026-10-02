# Carfo Shopify theme

A custom Online Store 2.0 theme for Carfo: ten frames, €19.95 each, every extra
pair €15. Dutch first, English second. No apps are needed to render it. The set
pricing at checkout comes from a discount app (step 5).

- **Lint:** `shopify theme check --path carfo/theme` → no offenses.
- **Weight:** CSS ~9 KB and JS ~8 KB gzipped, no jQuery, no framework, fonts self-hosted.
- **Local preview without a store:** `carfo/dev` (see the end of this file).

## What's in it

| Page | Template | What it does |
|---|---|---|
| Home | `index.json` | Brand banner (mascot, frame, headline, four benefits, button), proof bar, all ten frames with shape filters, set prices, see-through-the-lens loupe, quiz teaser, features, UGC wall (hidden until it has photos), story, FAQ (with FAQ structured data), email signup |
| Frame | `product.json` | Gallery, set selector (1 / Duo / Crew) with "pick your second pair", spec chips, accordions filled from metafields, loupe in the frame's own tint, "your next pair is €15", app slot for reviews, sticky add-to-bag on mobile |
| All frames | `collection.json` | All frames, shape filters, set prices, sticky "build your set" pill on mobile |
| Build your set | `page.build-your-set.json` | Pick 2, 3 or 4 frames; a pick beyond the set size grows the set |
| Find your frame | `page.find-your-frame.json` | Three questions, always two matches, "add both" |
| Size & fit | `page.size-and-fit.json` | Page text + size table built from metafields |
| Join the crew | `page.join-the-crew.json` | Affiliate page: perks, steps, FAQ, sign-up link |
| Bag | cart drawer + `cart.json` | Progress line ("add a second pair for €15…"), set savings, €15 suggestions, free-cord button, add-ons, checkout |
| Pre-launch | `password.json` | Waitlist signup (tags customers `waitlist`) |

Also: email popup (free cord code; never on the quiz or set builder, never on the
first product page of a visit), announcement bar, header, footer with KvK/VAT,
search, 404, blog, article, gift card.

## Set up the store

1. **Upload the theme.** Zip the contents of `carfo/theme` (not the folder itself)
   and upload under *Online Store → Themes → Add theme*, or run
   `shopify theme push --unpublished --path carfo/theme`. For Shopify's GitHub
   integration, the theme must sit at the root of its own repository.
2. **Metafield definitions** (*Settings → Custom data → Products*, namespace `carfo`):

   | Key | Type | Example |
   |---|---|---|
   | `colourway` | Single line text | Clear / Ice Blue |
   | `one_liner` | Single line text | Helder montuur, ijsblauw verloop. De frisse. Past bij alles. |
   | `shape` | Single line text (choices: slim, bold, tinted, clear) | clear |
   | `fit` | Single line text (choices: narrow, medium, wide) | medium |
   | `style` | Single line text (choices: clean, loud, y2k) | clean |
   | `wear_to` | List of single line text (city, festival, beach, driving) | city, beach |
   | `frame_width_mm`, `lens_width_mm`, `bridge_mm`, `temple_mm`, `weight_g` | Integer | 140 |
   | `filter_category` | Integer (0–4) | 3 |
   | `uv400`, `polarized` | True or false | true |
   | `material`, `in_the_box` | Single line text | Polycarbonaat |
   | `lens_note` | Multi-line text | What the tint is good for |
   | `tint_hex`, `frame_hex` | Colour | #8FC3E4 |
   | `tint_alpha` | Decimal (0–1) | 0.45 |
   | `pairs_with` | List of product references | Best second pairs, first one is preselected |
   | `safety_info` | Multi-line text | Overrides the default GPSR text |

   Anything left empty is simply not shown. Frames without photos show a drawn
   frame in their `tint_hex` with "Foto's volgen".
3. **Products.** Ten frames, product type **Zonnebril** (the bag counts pairs by
   this type), price €19.95, in one collection (e.g. *Alle tien*). Add the cord
   (€4.95) and an extra case as normal products.
4. **Theme settings** (*Customize → Theme settings*):
   - *Sets & prices:* frames collection, gift product (cord), add-ons. Check the
     numbers: €19.95 / €15 / free shipping from €25 / €3.95.
   - *Company details:* KvK, VAT, address, email (legally required in NL).
   - *Product safety:* replace the bracketed default text.
5. **Discounts** (the theme only shows prices; checkout needs these):
   - **Set price:** a mix-and-match / volume discount app from the App Store that
     prices *any* frames from the collection at €19.95 + €15 per extra frame
     (2 = €34.95, 3 = €49.95, 4 = €64.95). Custom discount Functions need Shopify
     Plus, so on other plans use a public app. In the editor, the bag warns you if
     2+ frames get no discount.
   - **Free cord:** automatic Buy X Get Y: buy 3 from the frames collection, get
     the cord free. The bag shows an "add your free cord" button at 3 pairs.
   - **Popup code:** create the code `KOORD` (free cord, first order), or change
     the code in the popup section.
6. **Shipping:** €3.95 under €25, free from €25 (*Settings → Shipping*).
7. **Pages:** create these pages and pick the matching template:
   `build-your-set` → *page.build-your-set*, `find-your-frame` → *page.find-your-frame*,
   `size-and-fit` → *page.size-and-fit*, `join-the-crew` → *page.join-the-crew*,
   plus `our-story`, `shipping-returns`, `contact` on the default page template.
8. **Menus:** *main-menu*: Bekijk alle 10 · Stel je set samen · Vind jouw bril.
   *footer*: Verzending · Gratis retourneren · Maten & pasvorm · Join the crew · Contact.
9. **Replace before launch:** the bracketed FAQ answer about delivery times, the
   safety text, the affiliate sign-up link on the crew page, and the delivery
   promise on the product page (leave it empty unless it is true).
10. **Images:** the brand banner on the home page has its three images built in
    (peach background, sun mascot, Marea photo) and links to the product with
    handle `marea`. Swap any of them in *Customize → Brand banner*; transparent
    PNGs look cleanest. Also: the loupe scene (16:10),
    the story image, an editorial tile for the grid, and six photos per frame
    (shot list in `carfo/PLAN.md`, section 8).
11. **English:** add English under *Settings → Languages*; UI strings are in
    `locales/en.json`, page copy is translated in *Translate & Adapt*.

## Local preview (no store needed)

```
cd carfo/dev
npm install
node preview.mjs                                   # http://localhost:4173
NODE_PATH=$(npm root -g) node shoot.mjs shots      # screenshots + 67 cart-flow checks (needs Playwright)
```

The preview renders the real Liquid files with sample frames (`dev/fixtures.mjs`:
placeholder data, not product facts) and fakes the cart API, including the set
discount. It approximates Shopify; test on a development store before launch.
