// Screenshot harness: node lab/shoot.mjs <outdir> [width height] [--reduced]
import { createRequire } from "node:module";
const { chromium } = createRequire(process.env.NODE_PATH + "/")("playwright");
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [out, w = 1440, h = 900] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const reduced = process.argv.includes("--reduced");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = join(ROOT, p);
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(4510);
mkdirSync(join(ROOT, out), { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, reducedMotion: reduced ? "reduce" : "no-preference", deviceScaleFactor: 1, hasTouch: +w < 800 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto("http://localhost:4510/index.html", { waitUntil: "load" });
const H = await page.evaluate(() => document.documentElement.scrollHeight);
const vh = +h; let i = 0;
for (let y = 0; y < H; y += Math.round(vh * 0.5)) {
  await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(700);
  await page.screenshot({ path: join(ROOT, out, `home-${String(i++).padStart(2, "0")}.png`) });
}
// overflow check
const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
// interactions: pick model, add to bag, open drawer
await page.evaluate(() => document.querySelector("#door-het-glas").scrollIntoView());
await page.waitForTimeout(500);
await page.click('[data-pick="calora"]');
const st = await page.$("[data-loupe]"); const b = await st.boundingBox();
if (!reduced && +w >= 800) await page.mouse.move(b.x + b.width * 0.62, b.y + b.height * 0.5, { steps: 8 });
await page.waitForTimeout(800);
await page.screenshot({ path: join(ROOT, out, `glass-calora.png`) });
await page.click('[data-pick-card] [data-add]'); await page.waitForTimeout(400);
await page.click('.masthead [data-bag-open]'); await page.waitForTimeout(600);
await page.screenshot({ path: join(ROOT, out, `bag.png`) });
await page.goto("http://localhost:4510/shades/sinix/index.html", { waitUntil: "load" }); await page.waitForTimeout(800);
await page.screenshot({ path: join(ROOT, out, `pdp-sinix.png`), fullPage: true });
const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log(JSON.stringify({ shots: i, pageHeightVh: +(H / vh).toFixed(1), overflowHome: ov, overflowPdp: ov2, errors }));
await browser.close(); srv.close();
