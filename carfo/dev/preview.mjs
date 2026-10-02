// Local preview of the Carfo theme without a Shopify store.
// Renders the real Liquid files with liquidjs plus Shopify-like tags and filters,
// serves theme assets, and fakes the Cart AJAX API (including the set discount the
// discount app will apply), so pages and cart flows can be checked in a browser.
//
//   cd carfo/dev && npm install && node preview.mjs   →  http://localhost:4173
//
// It is an approximation of Shopify, not a replacement: always test on a real
// development store before launch.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid, Tag, Value } from 'liquidjs';
import { frames, framesCollection, cord, extraCase, allProducts } from './fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.resolve(here, '../theme');
const IMAGES = path.resolve(here, '../../scrollcraft/builds/pep-schep-shades/img/calora');
const PORT = Number(process.env.PORT || 4173);
const read = (p) => fs.readFileSync(path.join(THEME, p), 'utf8');
const locale = JSON.parse(read('locales/nl.default.json'));

/* ---------- Theme settings: schema defaults + preview overrides ---------- */
const settingsSchema = JSON.parse(read('config/settings_schema.json'));
const settings = {};
for (const group of settingsSchema) for (const s of group.settings || []) if (s.id) settings[s.id] = s.default;
Object.assign(settings, {
  frames_collection: framesCollection,
  gift_product: cord,
  cart_addons: [cord, extraCase],
  company_kvk: '12345678',
  company_vat: 'NL000000000B01',
  company_email: 'hallo@carfo.nl',
  social_instagram: 'https://instagram.com/carfo',
  social_tiktok: 'https://tiktok.com/@carfo'
});

const linklists = {
  'main-menu': { links: [
    { title: 'Bekijk alle 10', url: '/collections/zonnebrillen' },
    { title: 'Stel je set samen', url: '/pages/build-your-set' },
    { title: 'Vind jouw bril', url: '/pages/find-your-frame' }
  ] },
  footer: { links: [
    { title: 'Verzending', url: '/pages/shipping-returns' },
    { title: 'Gratis retourneren', url: '/pages/shipping-returns' },
    { title: 'Maten & pasvorm', url: '/pages/size-and-fit' },
    { title: 'Join the crew', url: '/pages/join-the-crew' },
    { title: 'Contact', url: '/pages/contact' }
  ] }
};
const resolveSettings = (defs, values) => {
  const out = { ...values };
  for (const d of defs || []) if (d.type === 'link_list' && typeof out[d.id] === 'string') out[d.id] = linklists[out[d.id]] || { links: [] };
  return out;
};

/* ---------- Cart state + the set discount the app will apply ---------- */
let cartLines = [];
const SINGLE = 1995;
const EXTRA = Math.round(Number(settings.extra_pair_price) * 100);
const findVariant = (id) => {
  for (const p of allProducts) for (const v of p.variants) if (v.id === Number(id)) return { product: p, variant: v };
  return null;
};
function buildCart() {
  const frameUnits = cartLines.filter((l) => l.product.type === settings.frame_type).reduce((n, l) => n + l.quantity, 0);
  let setSaving = Math.max(0, frameUnits - 1) * (SINGLE - EXTRA);
  const items = cartLines.map((l) => {
    const original = l.variant.price * l.quantity;
    const allocations = [];
    if (l.product.type === settings.frame_type && setSaving > 0) {
      const units = Math.min(l.quantity, Math.ceil(setSaving / (SINGLE - EXTRA)));
      const amount = Math.min(setSaving, units * (SINGLE - EXTRA));
      setSaving -= amount;
      allocations.push({ amount, discount_application: { title: 'Setprijs' } });
    }
    if (l.product.id === cord.id && frameUnits >= settings.gift_from_pairs) {
      allocations.push({ amount: l.variant.price, discount_application: { title: 'Gratis koord' } });
    }
    const discount = allocations.reduce((s, a) => s + a.amount, 0);
    return {
      product: l.product, variant: l.variant, quantity: l.quantity, url: l.product.url,
      image: l.product.featured_media ? l.product.featured_media.preview_image : null,
      original_line_price: original, final_line_price: original - discount,
      line_level_discount_allocations: allocations
    };
  });
  const total = items.reduce((s, i) => s + i.final_line_price, 0);
  const original = items.reduce((s, i) => s + i.original_line_price, 0);
  return {
    items, item_count: items.reduce((n, i) => n + i.quantity, 0),
    total_price: total, items_subtotal_price: total, total_discount: original - total,
    cart_level_discount_applications: [], currency: { iso_code: 'EUR' }
  };
}

/* ---------- Liquid engine ---------- */
const sourceCache = new Map();
const engine = new Liquid({
  root: [path.join(THEME, 'sections'), path.join(THEME, 'snippets')],
  extname: '.liquid',
  cache: false,
  jsTruthy: false,
  fs: {
    readFileSync: (f) => fs.readFileSync(f, 'utf8').replaceAll('posted_successfully?', 'posted_successfully'),
    readFile: async (f) => fs.readFileSync(f, 'utf8').replaceAll('posted_successfully?', 'posted_successfully'),
    existsSync: (f) => fs.existsSync(f),
    exists: async (f) => fs.existsSync(f),
    resolve: (root, file, ext) => path.resolve(root, file.endsWith(ext) ? file : file + ext),
    contains: () => true,
    sep: path.sep,
    dirname: path.dirname
  }
});

const kw = (args) => Object.fromEntries(args.filter((a) => Array.isArray(a) && a.length === 2 && typeof a[0] === 'string'));
const euro = (cents, trim) => {
  const v = (Math.round(Number(cents) || 0) / 100).toFixed(2);
  const [i, d] = v.split('.');
  const s = `€${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
  return trim && d === '00' ? s.slice(0, -3) : s;
};
const lookup = (key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), locale);

engine.registerFilter('money', (c) => euro(c));
engine.registerFilter('money_without_trailing_zeros', (c) => euro(c, true));
engine.registerFilter('money_without_currency', (c) => euro(c).slice(1));
engine.registerFilter('asset_url', (f) => `/assets/${f}`);
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('preload_tag', (u, ...a) => { const o = kw(a); return `<link rel="preload" href="${u}" as="${o.as}" type="${o.type}" crossorigin>`; });
engine.registerFilter('image_url', (img) => (img && typeof img === 'object' ? (img.src || img.preview_image?.src) : img) || '');
engine.registerFilter('image_tag', (url, ...a) => {
  const o = kw(a);
  const attrs = Object.entries(o).filter(([k]) => !['widths', 'preload'].includes(k)).map(([k, v]) => `${k}="${String(v ?? '').replace(/"/g, '&quot;')}"`).join(' ');
  return `<img src="${url}" ${attrs}>`;
});
engine.registerFilter('t', (key, ...a) => {
  const o = kw(a);
  let v = lookup(key);
  if (v && typeof v === 'object') v = Number(o.count) === 1 ? v.one : v.other;
  if (v == null) return `translation missing: ${key}`;
  return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (o[k] ?? ''));
});
engine.registerFilter('payment_type_svg_tag', (type, ...a) => `<svg class="${kw(a).class || ''}" viewBox="0 0 38 24" role="img" aria-label="${type}"><rect x=".5" y=".5" width="37" height="23" rx="3" fill="#fff" stroke="#ddd"/><text x="19" y="15" font-size="7" text-anchor="middle" fill="#111" font-family="sans-serif">${type}</text></svg>`);
engine.registerFilter('structured_data', () => '{}');
engine.registerFilter('default_pagination', () => '');
engine.registerFilter('time_tag', (d) => `<time>${d}</time>`);
engine.registerFilter('format_code', (c) => c);

const evalExpr = (expr, ctx) => new Value(expr, engine).value(ctx, false);
const splitArgs = (s) => s.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((x) => x.trim()).filter(Boolean);

class BlockPassthrough extends Tag {
  constructor(token, remain, liquid, parser) {
    super(token, remain, liquid);
    this.args = token.args;
    this.templates = [];
    const end = `end${token.name}`;
    const stream = parser.parseStream(remain)
      .on(`tag:${end}`, () => stream.stop())
      .on('template', (t) => this.templates.push(t))
      .on('end', () => { throw new Error(`${token.name} not closed`); });
    stream.start();
  }
}

engine.registerTag('schema', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    while (remain.length) { const t = remain.shift(); if (t.name === 'endschema') return; }
  }
  * render() {}
});

engine.registerTag('style', class extends BlockPassthrough {
  * render(ctx, emitter) {
    emitter.write('<style>');
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    emitter.write('</style>');
  }
});

engine.registerTag('paginate', class extends BlockPassthrough {
  * render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1 } });
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    ctx.pop();
  }
});

engine.registerTag('form', class extends BlockPassthrough {
  * render(ctx, emitter) {
    const [typeExpr, ...rest] = splitArgs(this.args);
    const type = yield evalExpr(typeExpr, ctx);
    const attrs = {};
    for (const part of rest) {
      const m = part.match(/^([\w-]+)\s*:\s*(.+)$/);
      if (m) attrs[m[1]] = yield evalExpr(m[2], ctx);
    }
    const action = type === 'product' ? '/cart/add' : type === 'localization' ? '/localization' : '/contact#' + (attrs.id || '');
    const list = Object.entries(attrs).map(([k, v]) => `${k}="${String(v ?? '').replace(/"/g, '&quot;')}"`).join(' ');
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8" ${list}><input type="hidden" name="form_type" value="${type}">`);
    ctx.push({ form: { posted_successfully: false, errors: null } });
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    ctx.pop();
    emitter.write('</form>');
  }
});

engine.registerTag('layout', class extends Tag { * render() {} });

/* ---------- Sections ---------- */
function sectionSource(type) {
  if (!sourceCache.has(type)) {
    const src = read(`sections/${type}.liquid`).replaceAll('posted_successfully?', 'posted_successfully');
    const schemaText = (src.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/) || [])[1];
    sourceCache.set(type, { src, schema: schemaText ? JSON.parse(schemaText) : {} });
  }
  return sourceCache.get(type);
}

async function renderSection(type, id, data, scope) {
  const { src, schema } = sectionSource(type);
  const defaults = Object.fromEntries((schema.settings || []).filter((s) => s.id).map((s) => [s.id, s.default]));
  const blockSchemas = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
  const blocks = (data.block_order || []).map((bid) => {
    const b = data.blocks[bid];
    const bd = Object.fromEntries(((blockSchemas[b.type] || {}).settings || []).filter((s) => s.id).map((s) => [s.id, s.default]));
    return { id: bid, type: b.type, settings: resolveSettings((blockSchemas[b.type] || {}).settings, { ...bd, ...b.settings }), shopify_attributes: '' };
  });
  const section = { id, settings: resolveSettings(schema.settings, { ...defaults, ...(data.settings || {}) }), blocks, shopify_attributes: '' };
  // The brand banner falls back to its built-in theme images and to all_products['marea'].

  // Shopify exposes global objects (settings, cart, shop…) inside rendered snippets; liquidjs needs them as globals.
  const html = await engine.parseAndRender(src, { ...scope, section }, { globals: scope });
  const cls = ['shopify-section', schema.class].filter(Boolean).join(' ');
  return `<${schema.tag || 'div'} id="shopify-section-${id}" class="${cls}">${html}</${schema.tag || 'div'}>`;
}

engine.registerTag('sections', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.replace(/['"]/g, '').trim(); }
  * render(ctx, emitter) {
    const group = JSON.parse(read(`sections/${this.name}.json`));
    const scope = ctx.getAll();
    for (const key of group.order) {
      emitter.write(yield renderSection(group.sections[key].type, `sections--preview__${key}`, group.sections[key], scope));
    }
  }
});

engine.registerTag('section', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.replace(/['"]/g, '').trim(); }
  * render(ctx, emitter) {
    emitter.write(yield renderSection(this.name, this.name, { settings: {} }, ctx.getAll()));
  }
});

/* ---------- Pages ---------- */
function globals(req, extra = {}) {
  return {
    settings,
    shop: { name: 'Carfo', description: 'Tien brillen. Geen opvullers.', money_format: '€{{amount_with_comma_separator}}', customer_accounts_enabled: true, enabled_payment_types: ['ideal', 'klarna', 'apple_pay', 'visa', 'master'], url: '/' },
    routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', search_url: '/search', account_url: '/account', all_products_collection_url: '/collections/all' },
    request: { design_mode: false, page_type: extra.page_type || 'index', locale: { iso_code: 'nl' }, origin: 'http://localhost' },
    localization: { available_languages: [{ iso_code: 'nl' }], language: { iso_code: 'nl' } },
    all_products: Object.fromEntries(allProducts.map((p) => [p.handle, p])),
    collections: { all: { ...framesCollection, handle: 'all', url: '/collections/all', products: allProducts } },
    cart: buildCart(),
    canonical_url: 'http://localhost' + req.url,
    current_page: 1,
    content_for_header: '',
    ...extra
  };
}

async function renderTemplate(name, req, extra) {
  const tpl = JSON.parse(read(`templates/${name}.json`));
  const scope = globals(req, { template: { name: name.split('.')[0] }, ...extra });
  let body = '';
  for (const key of tpl.order) {
    body += await renderSection(tpl.sections[key].type, `template--${name}__${key}`, tpl.sections[key], scope);
  }
  const layout = read(`layout/${tpl.layout || 'theme'}.liquid`);
  return engine.parseAndRender(layout, { ...scope, content_for_layout: body }, { globals: scope });
}

async function renderSectionById(id, req) {
  const scope = globals(req);
  if (id === 'cart-drawer') return renderSection('cart-drawer', id, { settings: {} }, scope);
  const m = id.match(/^template--(.+)__(.+)$/);
  if (!m) return null;
  const tpl = JSON.parse(read(`templates/${m[1]}.json`));
  return renderSection(tpl.sections[m[2]].type, id, tpl.sections[m[2]], scope);
}

function route(url) {
  const p = url.pathname;
  if (p === '/') return ['index', { page_type: 'index', page_title: 'Carfo' }];
  if (p === '/cart') return ['cart', { page_type: 'cart', page_title: 'Je tas' }];
  if (p === '/search') return ['search', { page_type: 'search', page_title: 'Zoeken', search: { performed: false } }];
  const col = p.match(/^\/collections\/(zonnebrillen|all)$/);
  if (col) return ['collection', { page_type: 'collection', page_title: 'Alle tien', collection: framesCollection }];
  const prod = p.match(/^\/products\/([\w-]+)$/);
  if (prod) {
    const product = allProducts.find((x) => x.handle === prod[1]);
    if (product) return ['product', { page_type: 'product', page_title: product.title, product }];
  }
  const page = p.match(/^\/pages\/([\w-]+)$/);
  if (page) {
    const pages = {
      'build-your-set': ['page.build-your-set', 'Stel je set samen'],
      'find-your-frame': ['page.find-your-frame', 'Vind jouw bril'],
      'size-and-fit': ['page.size-and-fit', 'Maten & pasvorm'],
      'join-the-crew': ['page.join-the-crew', 'Join the crew']
    };
    const [tpl, title] = pages[page[1]] || ['page', page[1]];
    return [tpl, { page_type: 'page', page_title: title, page: { title, content: '<p>Voorbeeldtekst voor deze pagina.</p>' } }];
  }
  return ['404', { page_type: '404', page_title: 'Niet gevonden' }];
}

const types = { '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const imageMap = { 'marea-1.jpg': '01-front.jpg', 'marea-2.jpg': '02-angle.jpg', 'marea-3.jpg': '03-worn.jpg' };

async function body(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
}

async function cartResponse(req, payload, data) {
  const sections = {};
  for (const id of data.sections || []) sections[id] = await renderSectionById(id, req);
  return { ...payload, sections };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/img/')) {
      const name = path.basename(url.pathname);
      const file = url.pathname.startsWith('/assets/')
        ? path.join(THEME, 'assets', name)
        : imageMap[name] ? path.join(IMAGES, imageMap[name]) : path.join(here, 'img', name);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'POST' && url.pathname === '/cart/add.js') {
      const data = await body(req);
      for (const { id, quantity } of data.items || []) {
        const hit = findVariant(id);
        if (!hit) { res.writeHead(422, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 422, message: 'Not found', description: 'Variant not found' })); }
        const line = cartLines.find((l) => l.variant.id === hit.variant.id);
        if (line) line.quantity += quantity; else cartLines.push({ ...hit, quantity });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(await cartResponse(req, { items: data.items }, data)));
    }
    if (req.method === 'POST' && url.pathname === '/cart/change.js') {
      const data = await body(req);
      const line = cartLines[data.line - 1];
      if (line) { line.quantity = data.quantity; cartLines = cartLines.filter((l) => l.quantity > 0); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(await cartResponse(req, buildCart(), data)));
    }
    if (url.pathname === '/cart/clear') { cartLines = []; res.writeHead(302, { Location: '/' }); return res.end(); }
    const [tpl, extra] = route(url);
    const html = await renderTemplate(tpl, req, extra);
    res.writeHead(tpl === '404' ? 404 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(e.stack || e));
  }
}).listen(PORT, () => console.log(`Carfo preview on http://localhost:${PORT}`));
