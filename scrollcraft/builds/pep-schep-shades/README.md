# PEP SCHEP shades shop

Static front-end shop for seven PEP SCHEP sunglasses. Checkout hands off to pep-schep.nl.

## Run
    node build.mjs                  # regenerate pages after editing products.json or adding images
    npx serve .                     # or any static server, then open index.html

## Make it real
1. **Product facts:** edit `products.json` (price, lens, tint, shape, blurb, description).
   Each product lists what is still `unverified`. `node build.mjs` prints the gaps.
2. **Photos:** drop files into `img/<slug>/`, sorted by filename (first = main shot).
   The drawn "Foto volgt" plates disappear automatically.
3. **Hero:** `img/hero/bg.jpg` (background plane) and `img/hero/subject.png` (cut-out with real alpha).
4. **Loupe scene:** `img/scene/scene.jpg`, 16:10 festival photo. Replaces the drawn scene.
5. **One-click checkout:** set `wcId` (WooCommerce product ID) per product; the bag then links to
   `pep-schep.nl/?add-to-cart=<id>`.

## Verify
    NODE_PATH=$(npm root -g) node lab/shoot.mjs lab/desktop 1440 900
    NODE_PATH=$(npm root -g) node lab/shoot.mjs lab/mobile 390 844
    NODE_PATH=$(npm root -g) node lab/shoot.mjs lab/reduced 1440 900 --reduced
