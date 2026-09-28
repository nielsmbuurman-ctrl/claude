// Generates index.html, shades/<slug>/index.html and js/products.js from products.json.
// Drop photos into img/<slug>/ (sorted by filename, first is the main shot),
// img/hero/bg.jpg, img/hero/subject.png (cut-out with alpha), img/scene/scene.jpg (16:10),
// then run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(ROOT, "products.json"), "utf8"));
const P = data.products;
const bySlug = Object.fromEntries(P.map((p) => [p.slug, p]));

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const price = (p) => (p.price == null ? null : "€" + p.price.toFixed(2).replace(".", ","));
const priceHTML = (p) => (price(p) ? `<span class="price">${price(p)}</span>` : `<span class="price price--tbd">Prijs op pep-schep.nl</span>`);
const IMG = /\.(jpe?g|png|webp|avif)$/i;
const photos = (slug) => {
  const dir = join(ROOT, "img", slug);
  return existsSync(dir) ? readdirSync(dir).filter((f) => IMG.test(f)).sort().map((f) => `img/${slug}/${f}`) : [];
};
const asset = (rel) => (existsSync(join(ROOT, rel)) ? rel : null);

/* ---------- Drawn frames (fallback when no photo exists, and the loupe lens shapes) ---------- */
// viewBox 0 0 600 240. Each shape returns lens paths (also used as the loupe clip) and frame extras.
const SHAPES = {
  rect: {
    lenses: ["M58 72 H276 V160 Q276 176 260 176 H74 Q58 176 58 160 Z", "M324 72 H542 V160 Q542 176 526 176 H340 Q324 176 324 160 Z"],
    extra: "M276 92 Q300 80 324 92 M58 78 L14 70 M542 78 L586 70",
  },
  soft: {
    lenses: ["M62 78 Q62 64 80 64 H262 Q280 64 278 84 L270 140 Q262 184 196 186 H128 Q70 184 64 136 Z", "M538 78 Q538 64 520 64 H338 Q320 64 322 84 L330 140 Q338 184 404 186 H472 Q530 184 536 136 Z"],
    extra: "M278 88 Q300 72 322 88 M62 76 L16 66 M538 76 L584 66",
  },
  round: {
    lenses: ["M172 38 A84 84 0 1 1 171.9 38 Z", "M428 38 A84 84 0 1 1 427.9 38 Z"],
    extra: "M252 108 Q300 84 348 108 M90 112 L20 96 M510 112 L580 96",
  },
  wrap: {
    lenses: ["M30 104 Q46 70 120 66 L282 70 Q300 76 300 96 Q300 76 318 70 L480 66 Q554 70 570 104 Q560 146 470 152 L340 150 Q306 148 300 124 Q294 148 260 150 L130 152 Q40 146 30 104 Z"],
    extra: "M30 104 Q10 98 4 90 M570 104 Q590 98 596 90",
  },
  shield: {
    lenses: ["M40 86 Q60 52 300 50 Q540 52 560 86 L548 138 Q530 176 420 178 Q340 176 312 150 Q300 140 288 150 Q260 176 180 178 Q70 176 52 138 Z"],
    extra: "M40 86 L6 76 M560 86 L594 76",
  },
};

function shadesSVG(p, { cls = "shades", id = p.slug } = {}) {
  const s = SHAPES[p.shape] || SHAPES.soft;
  const lens = s.lenses.map((d) => `<path d="${d}"/>`).join("");
  return `<svg class="${cls}" viewBox="0 0 600 240" role="img" aria-label="${esc(p.name)}, getekend">
  <defs><linearGradient id="hl-${id}" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <g fill="${p.tint}" fill-opacity="${p.tintAlpha + 0.2}">${lens}</g>
  <g fill="url(#hl-${id})">${lens}</g>
  <g fill="none" stroke="${p.frameColor}" stroke-opacity="${p.frameOpacity}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">${lens}<path d="${s.extra}"/></g>
</svg>`;
}

function plate(p, { big = false } = {}) {
  const ph = photos(p.slug);
  if (ph.length) return `<img src="${ph[0]}" alt="${esc(p.name)} zonnebril" loading="lazy" decoding="async">`;
  return `<div class="plate${big ? " plate--big" : ""}" style="--tint:${p.tint}">${shadesSVG(p)}<span class="plate-note">Foto volgt</span></div>`;
}

/* ---------- The festival scene (fallback for img/scene/scene.jpg), 1600 x 1000 ---------- */
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
function crowd(y0, count, h, seed, color) {
  const r = rng(seed);
  let d = `M0 1000 L0 ${y0}`;
  const step = 1600 / count;
  for (let i = 0; i < count; i++) {
    const x = i * step, hh = h * (0.7 + r() * 0.5), cx = x + step / 2;
    d += ` L${x.toFixed(0)} ${y0} Q${(cx - step * 0.3).toFixed(0)} ${(y0 - hh * 0.55).toFixed(0)} ${cx.toFixed(0)} ${(y0 - hh).toFixed(0)} Q${(cx + step * 0.3).toFixed(0)} ${(y0 - hh * 0.55).toFixed(0)} ${(x + step).toFixed(0)} ${y0}`;
    if (r() > 0.72) { // a raised arm
      const ax = cx + (r() - 0.5) * step, top = y0 - hh - 60 - r() * 60;
      d += ` M${(ax - 5).toFixed(0)} ${(y0 - hh * 0.6).toFixed(0)} L${(ax - 3).toFixed(0)} ${top.toFixed(0)} L${(ax + 7).toFixed(0)} ${top.toFixed(0)} L${(ax + 5).toFixed(0)} ${(y0 - hh * 0.6).toFixed(0)} Z M${(x + step).toFixed(0)} ${y0}`;
    }
  }
  return `<path fill="${color}" d="${d} L1600 ${y0} L1600 1000 Z"/>`;
}
function sceneSymbol() {
  const photo = asset("img/scene/scene.jpg");
  if (photo) return `<symbol id="scene" viewBox="0 0 1600 1000"><image href="${photo}" width="1600" height="1000" preserveAspectRatio="xMidYMid slice"/></symbol>`;
  const lasers = [
    [1180, 420, 120, 0, "#7CF7E5"], [1180, 420, 380, 0, "#7CF7E5"], [1180, 420, 700, 0, "#FF5FD2"],
    [1330, 420, 1560, 0, "#FF5FD2"], [1330, 420, 980, 0, "#FFF2A8"], [1255, 420, 20, 180, "#7CF7E5"],
  ].map(([x1, y1, x2, y2, c]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="5" stroke-opacity=".75"/>`).join("");
  return `<symbol id="scene" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C98B"/><stop offset=".45" stop-color="#F29A63"/><stop offset=".72" stop-color="#E4607A"/><stop offset="1" stop-color="#7C3B6C"/></linearGradient>
    <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF8E4"/><stop offset=".55" stop-color="#FFE7B0"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D8" stop-opacity="0"/><stop offset="1" stop-color="#FFF6D8" stop-opacity=".45"/></linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#sky)"/>
  <circle cx="470" cy="560" r="330" fill="url(#sun)"/>
  <circle cx="470" cy="560" r="130" fill="#FFF6DE"/>
  <g opacity=".5" fill="#B4476A"><path d="M0 640 Q200 590 420 628 T860 610 T1300 640 T1600 620 V1000 H0 Z"/></g>
  <g>${lasers}</g>
  <path d="M1080 700 L1110 420 H1400 L1430 700 Z" fill="#3A1B38"/>
  <rect x="1100" y="400" width="310" height="26" fill="#2A1229"/>
  <path d="M1120 426 L1040 700 H1160 Z M1390 426 L1470 700 H1350 Z" fill="url(#beam)"/>
  <g fill="#FFE9B8"><circle cx="1150" cy="438" r="7"/><circle cx="1210" cy="438" r="7"/><circle cx="1270" cy="438" r="7"/><circle cx="1330" cy="438" r="7"/><circle cx="1390" cy="438" r="7"/></g>
  <g stroke="#3A1B38" stroke-width="5"><line x1="240" y1="700" x2="240" y2="430"/><line x1="820" y1="720" x2="820" y2="470"/></g>
  <path d="M240 432 L330 452 L240 474 Z" fill="#FF6B4A"/><path d="M820 472 L900 488 L820 506 Z" fill="#7CF7E5"/>
  ${crowd(760, 46, 70, 7, "#5B2A55")}
  ${crowd(850, 34, 110, 19, "#3E1C3C")}
  ${crowd(960, 22, 170, 41, "#26102A")}
</symbol>`;
}

/* ---------- Shared chrome ---------- */
function head({ title, desc, base }) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}css/site.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='20' cy='34' r='14' fill='%23E8502F'/%3E%3Ccircle cx='44' cy='34' r='14' fill='%23151311'/%3E%3C/svg%3E">
</head>
<body>
<a class="skip" href="#main">Naar de inhoud</a>
<header class="masthead">
  <a class="wordmark" href="${base}index.html" aria-label="PEP SCHEP, naar de voorpagina">PEP SCHEP</a>
  <p class="issue">Zonnebrillen <span aria-hidden="true">·</span> <em>zeven modellen</em></p>
  <nav class="mast-nav" aria-label="Hoofdmenu">
    <a href="${base}index.html#collectie">Collectie</a>
    <button class="bag-btn" type="button" data-bag-open aria-haspopup="dialog">Tas <span class="bag-count" data-bag-count>0</span></button>
  </nav>
</header>`;
}

function foot({ base }) {
  return `<aside class="drawer" id="bag" role="dialog" aria-modal="true" aria-labelledby="bag-title" hidden>
  <div class="drawer-scrim" data-bag-close></div>
  <div class="drawer-panel">
    <div class="drawer-head"><h2 id="bag-title">Mijn tas</h2><button class="icon-btn" type="button" data-bag-close aria-label="Tas sluiten">Sluiten</button></div>
    <ul class="bag-list" data-bag-list></ul>
    <p class="bag-empty" data-bag-empty>Je tas is nog leeg. Kijk eerst even <a href="${base}index.html#door-het-glas" data-bag-close>door het glas</a>.</p>
    <div class="drawer-foot" data-bag-foot>
      <p class="bag-total" data-bag-total></p>
      <a class="btn btn--solid btn--wide" data-checkout href="https://pep-schep.nl/" rel="noopener">Afrekenen op pep-schep.nl</a>
      <p class="fine">Je rekent veilig af in de officiële PEP SCHEP winkel. Elke bril met UV-filterglas en een etui.</p>
    </div>
  </div>
</aside>
<div class="toast" data-toast role="status" aria-live="polite"></div>
<footer class="colophon">
  <p class="wordmark wordmark--small">PEP SCHEP</p>
  <p>Festivalzonnebrillen met UV-filterglas. Etui standaard erbij, discreet verpakt.</p>
  <p><a href="https://pep-schep.nl/">pep-schep.nl</a></p>
</footer>
<script src="${base}js/products.js"></script>
<script src="${base}js/site.js"></script>
</body>
</html>`;
}

/* ---------- The signature: Door het glas ---------- */
function loupeStage({ fixed = null, label }) {
  return `<figure class="stage" data-loupe${fixed ? ` data-fixed="${fixed}"` : ""}>
  <svg class="scene" viewBox="0 0 1600 1000" role="img" aria-label="${esc(label)}"><use href="#scene"/></svg>
  <svg class="loupe" viewBox="0 0 600 240" aria-hidden="true" focusable="false">
    <defs><clipPath id="lens-clip${fixed ? "-" + fixed : ""}" data-lens-clip></clipPath></defs>
    <g clip-path="url(#lens-clip${fixed ? "-" + fixed : ""})">
      <g data-loupe-scene><use href="#scene" width="1600" height="1000"/></g>
      <rect data-loupe-hue x="0" y="0" width="600" height="240" style="mix-blend-mode:color"/>
      <rect data-loupe-tint x="0" y="0" width="600" height="240" style="mix-blend-mode:multiply"/>
      <rect x="0" y="0" width="600" height="240" fill="url(#lens-sheen)"/>
    </g>
    <defs><linearGradient id="lens-sheen" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g data-loupe-frame fill="none" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"></g>
  </svg>
</figure>`;
}

/* ---------- Pages ---------- */
function indexPage() {
  const base = "";
  const heroBg = asset("img/hero/bg.jpg");
  const heroSubject = asset("img/hero/subject.png");
  const cover = bySlug.calora;
  const gridOrder = ["sinix", "calora", "rave-classic", "cristal-gris", "tecna", "lunares", "el-silencio"];
  const card = (p, i) => `<article class="look look--${i + 1}" data-reveal>
    <a class="look-img" href="shades/${p.slug}/index.html" aria-label="${esc(p.name)} bekijken">${plate(p)}</a>
    <div class="look-cap">
      <h3><a href="shades/${p.slug}/index.html">${esc(p.name)}</a></h3>
      ${priceHTML(p)}
      ${p.blurb ? `<p>${esc(p.blurb)}</p>` : ""}
      <button class="btn btn--ghost btn--sm" type="button" data-add="${p.slug}">In mijn tas</button>
    </div>
  </article>`;
  const modelBtn = (p, i) => `<li><button type="button" class="model" role="radio" aria-checked="${i === 0}" data-pick="${p.slug}" tabindex="${i === 0 ? 0 : -1}">
    <span class="swatch" style="--tint:${p.tint};--frame:${p.frameColor}" aria-hidden="true"></span>
    <span class="model-name">${esc(p.name)}</span>${priceHTML(p)}</button></li>`;
  const facts = data.brandFacts.map(([h, t]) => `<li class="fact" data-fact><strong>${esc(h)}.</strong> <span>${esc(t)}</span></li>`).join("");
  const loupeOrder = ["sinix", "calora", "rave-classic", "cristal-gris", "tecna", "lunares", "el-silencio"].map((s) => bySlug[s]);

  return `${head({ title: "PEP SCHEP Zonnebrillen", desc: "Zeven festivalzonnebrillen met UV-filterglas. Kijk door elk glas voordat je kiest.", base })}
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${sceneSymbol()}</svg>
<main id="main">

<section class="cover" data-cover aria-labelledby="cover-title">
  <div class="cover-bg plane" data-depth="0.15"${heroBg ? ` style="background-image:url(${heroBg})"` : ""}><div class="sun"></div></div>
  <h1 id="cover-title" class="cover-title">
    <span class="ct ct--back plane" data-depth="0.35">Zeven manieren</span>
    <span class="ct ct--front plane" data-depth="0.6">om de zon aan te <em>kijken.</em></span>
  </h1>
  <div class="cover-subject plane" data-depth="0.5">${heroSubject ? `<img src="${heroSubject}" alt="${esc(cover.name)} zonnebril">` : shadesSVG(cover, { cls: "shades shades--hero", id: "hero" })}</div>
  <div class="cover-fg plane" data-depth="1.1" aria-hidden="true"><span class="flare flare--a"></span><span class="flare flare--b"></span></div>
  <div class="cover-copy">
    <p class="lede">Festivalzonnebrillen met UV-filterglas en een etui erbij. Licht genoeg om te vergeten, scherp genoeg om op te vallen.</p>
    <p class="cover-ctas"><a class="btn btn--solid" href="#door-het-glas">Kijk door het glas</a> <a class="link" href="#collectie">Naar de collectie</a></p>
  </div>
  <p class="cover-credit">Op de cover: <a href="shades/${cover.slug}/index.html">${esc(cover.name)}</a></p>
</section>

<section class="glass" id="door-het-glas" aria-labelledby="glass-title" data-glass>
  <div class="glass-sticky">
    <div class="glass-head">
      <h2 id="glass-title">Door het <em>glas</em></h2>
      <p>Beweeg over het beeld. Kies een model en zie het festival zoals jij het straks ziet.</p>
    </div>
    ${loupeStage({ label: "Een festivalweide bij zonsondergang, met een podium, lasers en publiek" })}
    <div class="picker">
      <ol class="models" role="radiogroup" aria-label="Kies een glas">${loupeOrder.map(modelBtn).join("")}</ol>
      <div class="pick-card" data-pick-card aria-live="polite"></div>
    </div>
  </div>
</section>

<section class="collection" id="collectie" aria-labelledby="col-title">
  <header class="col-head"><h2 id="col-title">De collectie</h2><p>Zeven karakters. Allemaal met UV-filterglas, allemaal met een etui.</p></header>
  <div class="looks">${gridOrder.map((s, i) => card(bySlug[s], i)).join("")}</div>
</section>

<section class="promise" data-promise aria-labelledby="promise-title">
  <div class="promise-sticky">
    <h2 id="promise-title" class="promise-kicker">Wat je krijgt</h2>
    <ul class="facts">${facts}</ul>
    <p class="promise-foot">Betaalbaar, dus een bril kwijt op de camping doet geen pijn. Goed gemaakt, dus dat gebeurt minder vaak.</p>
  </div>
</section>

<section class="close" aria-labelledby="close-title" data-close>
  <h2 id="close-title">Kies je <em>glas.</em></h2>
  <div class="close-right">
  <div class="close-stage" data-close-stage aria-hidden="true"></div>
  <div class="close-swatches" role="radiogroup" aria-label="Kies een model">${P.map((p, i) => `<button type="button" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="orb" data-close-pick="${p.slug}" style="--tint:${p.tint};--frame:${p.frameColor}"><span class="orb-name">${esc(p.name)}</span></button>`).join("")}</div>
  <div class="close-card" data-close-card aria-live="polite"></div>
  </div>
</section>

</main>
${foot({ base })}`;
}

function productPage(p) {
  const base = "../../";
  const ph = photos(p.slug).map((f) => base + f);
  const i = P.indexOf(p);
  const more = [P[(i + 1) % P.length], P[(i + 3) % P.length], P[(i + 5) % P.length]];
  const gallery = ph.length
    ? ph.map((f, n) => `<img src="${f}" alt="${esc(p.name)}, foto ${n + 1}" ${n ? 'loading="lazy"' : ""} decoding="async">`).join("")
    : `<div class="plate plate--big" style="--tint:${p.tint}">${shadesSVG(p)}<span class="plate-note">Foto volgt</span></div>`;
  const details = [
    ["Montuur", p.frame], ["Glas", p.lens], ["Bescherming", "UV-filterglas"], ["Erbij", "Opbergetui"],
  ].filter(([, v]) => v);
  const moreCard = (o) => `<a class="mini" href="../${o.slug}/index.html">${plate(o).replace(/src="img\//g, `src="${base}img/`)}<span class="mini-name">${esc(o.name)}</span>${priceHTML(o)}</a>`;

  return `${head({ title: `${p.name} zonnebril | PEP SCHEP`, desc: p.blurb || `${p.name} festivalzonnebril met UV-filterglas en etui.`, base })}
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${sceneSymbol().replace(/href="img\//g, `href="${base}img/`)}</svg>
<main id="main" class="pdp" data-product="${p.slug}">
  <div class="pdp-gallery">
    ${gallery}
    <section class="pdp-glass" aria-labelledby="pg-title">
      <h2 id="pg-title">Door het glas van de ${esc(p.name)}</h2>
      ${loupeStage({ fixed: p.slug, label: `De festivalweide gezien door het glas van de ${p.name}` })}
    </section>
  </div>
  <div class="pdp-buy">
    <nav class="crumbs" aria-label="Kruimelpad"><a href="${base}index.html#collectie">Collectie</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(p.name)}</span></nav>
    <h1>${esc(p.name)}</h1>
    <p class="pdp-price">${priceHTML(p)}</p>
    ${p.blurb ? `<p class="pdp-blurb">${esc(p.blurb)}</p>` : ""}
    <p class="tint-chip"><span class="swatch" style="--tint:${p.tint};--frame:${p.frameColor}" aria-hidden="true"></span>${esc(p.lens || "Glas")}</p>
    <button class="btn btn--solid btn--wide" type="button" data-add="${p.slug}">In mijn tas</button>
    <ul class="pdp-facts">${data.brandFacts.map(([h]) => `<li>${esc(h)}</li>`).join("")}</ul>
    ${p.description.length ? `<div class="pdp-desc">${p.description.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
    <dl class="pdp-specs">${details.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
  </div>
</main>
<section class="more" aria-labelledby="more-title">
  <h2 id="more-title">Ook in de collectie</h2>
  <div class="more-row">${more.map(moreCard).join("")}</div>
</section>
<div class="buybar" data-buybar><span class="buybar-name">${esc(p.name)} ${priceHTML(p)}</span><button class="btn btn--solid btn--sm" type="button" data-add="${p.slug}">In mijn tas</button></div>
${foot({ base })}`;
}

/* ---------- Write ---------- */
writeFileSync(join(ROOT, "index.html"), indexPage());
for (const p of P) {
  const dir = join(ROOT, "shades", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), productPage(p));
}
const client = P.map((p) => ({
  slug: p.slug, name: p.name, url: p.url, wcId: p.wcId, price: p.price, blurb: p.blurb, lens: p.lens,
  tint: p.tint, tintAlpha: p.tintAlpha, frameColor: p.frameColor, frameOpacity: p.frameOpacity,
  lenses: (SHAPES[p.shape] || SHAPES.soft).lenses, extra: (SHAPES[p.shape] || SHAPES.soft).extra,
}));
writeFileSync(join(ROOT, "js", "products.js"), `// Generated by build.mjs. Edit products.json instead.\nwindow.PS_PRODUCTS = ${JSON.stringify(client, null, 1)};\n`);
const gaps = P.filter((p) => p.unverified.length).map((p) => `  ${p.name}: ${p.unverified.join(", ")}`);
console.log(`Built index + ${P.length} product pages.${gaps.length ? "\nStill unverified:\n" + gaps.join("\n") : ""}`);
