// Screenshots + cart-flow checks against the local preview (node preview.mjs).
//   NODE_PATH=$(npm root -g) node shoot.mjs [outDir]
// Exits non-zero if a check fails or the page logs an error.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = path.resolve(process.argv[2] || 'shots');
fs.mkdirSync(OUT, { recursive: true });

const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures.push(label); };

const browser = await chromium.launch();

async function open(viewport, url, opts = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript(() => { try { localStorage.setItem('carfo:popup', 'subscribed'); } catch (e) { /* ignore */ } });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  return page;
}
const text = async (page, sel) => (await page.locator(sel).first().textContent()).replace(/\s+/g, ' ').trim();

const views = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const pages = [
  ['home', '/'], ['collection', '/collections/zonnebrillen'], ['product-marea', '/products/marea'],
  ['product-ambra', '/products/ambra'], ['set', '/pages/build-your-set'], ['quiz', '/pages/find-your-frame'],
  ['sizes', '/pages/size-and-fit'], ['crew', '/pages/join-the-crew'], ['cart-empty', '/cart']
];

await fetch(BASE + '/cart/clear', { redirect: 'manual' });
for (const [vname, viewport] of Object.entries(views)) {
  for (const [name, url] of pages) {
    const page = await open(viewport, url);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${vname}-${name}.png`), fullPage: true });
    check(page.errors.length === 0, `${vname} ${name}: no console errors ${page.errors.join(' | ')}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `${vname} ${name}: no horizontal scroll (${overflow}px)`);
    await page.context().close();
  }
}

/* Flow 1: product page → Duo with the preselected second frame → drawer */
{
  await fetch(BASE + '/cart/clear', { redirect: 'manual' });
  const page = await open(views.desktop, '/products/marea');
  const label = await text(page, '[data-submit-label]');
  check(label.includes('34,95'), `product: default Duo button shows €34,95 (got "${label}")`);
  check(await page.locator('.pick[aria-pressed="true"]').count() === 1, 'product: one second frame preselected');
  await page.locator('label.tier:has(input[value="3"])').click();
  check(await page.locator('.pick[aria-pressed="true"]').count() === 2, 'product: Crew preselects two frames');
  check((await text(page, '[data-submit-label]')).includes('49,95'), 'product: Crew button shows €49,95');
  await page.locator('.pick[aria-pressed="true"]').first().click();
  check((await text(page, '[data-submit-label]')).includes('Kies nog 1 bril'), 'product: deselecting asks for one more frame');
  check(await page.locator('[data-submit]').isDisabled(), 'product: submit disabled until the set is complete');
  await page.locator('label.tier:has(input[value="2"])').click();
  await page.locator('[data-submit]').click();
  await page.waitForSelector('dialog.drawer[open]');
  await page.waitForTimeout(350);
  check(await page.locator('.drawer .line').count() === 2, 'drawer: two frames in the bag');
  check((await text(page, '.drawer .bag-progress__text')).includes('Gratis verzending ontgrendeld'), 'drawer: free-shipping progress line');
  check((await text(page, '.drawer .bag-row--save')).includes('4,95'), 'drawer: saving €4,95 shown');
  check((await text(page, '.drawer .bag-checkout button')).includes('34,95'), 'drawer: checkout €34,95');
  check((await text(page, '[data-cart-count]')) === '2', 'header: bag count 2');
  await page.screenshot({ path: path.join(OUT, 'desktop-drawer-duo.png') });

  await page.locator('.drawer .mini__add').first().click();
  await page.waitForTimeout(400);
  check(await page.locator('.drawer .line').count() === 3, 'drawer: suggestion adds a third frame');
  check((await text(page, '.drawer .bag-checkout button')).includes('49,95'), 'drawer: checkout €49,95 for three');
  check(await page.locator('.drawer .bag-gift').count() === 1, 'drawer: free cord button appears at three pairs');
  await page.locator('.drawer .bag-gift').click();
  await page.waitForTimeout(400);
  check((await text(page, '.drawer .bag-checkout button')).includes('49,95'), 'drawer: free cord keeps total at €49,95');
  await page.screenshot({ path: path.join(OUT, 'desktop-drawer-crew.png') });

  await page.locator('.drawer .line .line__remove').first().click();
  await page.waitForTimeout(400);
  check(await page.locator('.drawer .line').count() === 3, 'drawer: remove takes a line out');
  check(page.errors.length === 0, `flow 1: no console errors ${page.errors.join(' | ')}`);
  await page.context().close();
}

/* Flow 2: build your set */
{
  await fetch(BASE + '/cart/clear', { redirect: 'manual' });
  const page = await open(views.mobile, '/pages/build-your-set');
  const choose = page.locator('[data-choose]');
  await choose.nth(0).click();
  check(await page.locator('[data-add-set]').isDisabled(), 'set: add disabled with 1 of 2');
  await choose.nth(5).click();
  check(!(await page.locator('[data-add-set]').isDisabled()), 'set: add enabled with 2 of 2');
  check((await text(page, '[data-total]')).includes('34,95'), 'set: total €34,95');
  await page.screenshot({ path: path.join(OUT, 'mobile-set-two.png') });
  await choose.nth(7).click();
  check((await page.locator('[data-size-btn="3"]').getAttribute('aria-checked')) === 'true', 'set: a third pick grows the set to 3');
  check((await text(page, '[data-total]')).includes('49,95'), 'set: total €49,95');
  await page.locator('[data-add-set]').click();
  await page.waitForSelector('dialog.drawer[open]');
  await page.waitForTimeout(350);
  check(await page.locator('.drawer .line').count() === 3, 'set: three frames in the bag');
  await page.screenshot({ path: path.join(OUT, 'mobile-drawer-set.png') });
  check(page.errors.length === 0, `flow 2: no console errors ${page.errors.join(' | ')}`);
  await page.context().close();
}

/* Flow 3: quiz */
{
  await fetch(BASE + '/cart/clear', { redirect: 'manual' });
  const page = await open(views.desktop, '/pages/find-your-frame');
  await page.locator('input[name="use"][value="city"]').check({ force: true });
  await page.locator('input[name="fit"][value="medium"]').check({ force: true });
  await page.locator('input[name="style"][value="clean"]').check({ force: true });
  await page.waitForSelector('[data-result]:not([hidden])');
  check(await page.locator('[data-result-list] li').count() === 2, 'quiz: two matches');
  check((await text(page, '[data-add-both]')).includes('34,95'), 'quiz: add both for €34,95');
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'desktop-quiz-result.png'), fullPage: true });
  await page.locator('[data-add-both]').click();
  await page.waitForSelector('dialog.drawer[open]');
  check(await page.locator('.drawer .line').count() === 2, 'quiz: both frames added');
  check(page.errors.length === 0, `flow 3: no console errors ${page.errors.join(' | ')}`);
  await page.context().close();
}

/* Flow 4: filters, loupe, sticky bar, popup */
{
  const page = await open(views.desktop, '/collections/zonnebrillen');
  await page.locator('.chip-btn', { hasText: 'Helder' }).click();
  const visible = await page.locator('.grid__item:not(.is-filtered)').count();
  check(visible === 3, `collection: "Helder" filter leaves 3 frames (got ${visible})`);
  await page.context().close();

  const home = await open(views.desktop, '/');
  const stage = home.locator('[data-stage]');
  await stage.scrollIntoViewIfNeeded();
  const box = await stage.boundingBox();
  await home.locator('.swatch', { hasText: 'Ambra' }).click();
  await home.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.5, { steps: 8 });
  await home.waitForTimeout(600);
  await stage.screenshot({ path: path.join(OUT, 'desktop-loupe.png') });
  await home.evaluate(() => document.querySelector('email-popup').show(true));
  await home.waitForTimeout(200);
  await home.screenshot({ path: path.join(OUT, 'desktop-popup.png') });
  check(home.errors.length === 0, `home interactions: no console errors ${home.errors.join(' | ')}`);
  await home.context().close();

  const mob = await open(views.mobile, '/products/marea');
  const submitTop = await mob.evaluate(() => document.querySelector('[data-submit]').getBoundingClientRect().bottom + window.scrollY);
  await mob.evaluate((y) => window.scrollTo(0, y + 200), submitTop);
  await mob.waitForTimeout(600);
  check(await mob.locator('sticky-atc.is-visible').count() === 1, 'mobile product: sticky add-to-bag bar appears after scrolling');
  await mob.screenshot({ path: path.join(OUT, 'mobile-product-sticky.png') });
  await mob.context().close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
