import { createRequire } from "node:module";
const { chromium } = createRequire(process.env.NODE_PATH + "/")("playwright");
import { createServer } from "node:http"; import { readFileSync, existsSync } from "node:fs"; import { join } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname;
const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = join(ROOT, p); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200); r.end(readFileSync(f)); }).listen(4512);
const b = await chromium.launch();
for (const [w, h, n] of [[1440, 900, "desk"], [390, 844, "mob"]]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } }); const bad = [];
  pg.on("response", (r) => r.status() === 404 && bad.push(r.url()));
  await pg.goto("http://localhost:4512/shades/calora/index.html"); for (let y = 0; y < 5000; y += 400) { await pg.evaluate((y) => scrollTo(0, y), y); await pg.waitForTimeout(120); } await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(900); console.log(n, "images loaded:", await pg.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth).length + "/" + document.images.length));
  await pg.screenshot({ path: join(ROOT, `lab/pdp-calora-${n}.png`), fullPage: true });
  console.log(n, "404s:", bad, "overflow:", await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth));
}
await b.close(); srv.close();
