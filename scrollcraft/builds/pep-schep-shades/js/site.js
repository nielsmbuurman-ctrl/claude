(() => {
  const PRODUCTS = window.PS_PRODUCTS || [];
  const bySlug = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const euro = (n) => "€" + n.toFixed(2).replace(".", ",");
  const priceHTML = (p) => (p.price == null ? `<span class="price price--tbd">Prijs op pep-schep.nl</span>` : `<span class="price">${euro(p.price)}</span>`);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const base = document.querySelector('link[href$="css/site.css"]').getAttribute("href").replace("css/site.css", "");

  /* ---------------- Bag ---------------- */
  const KEY = "ps-bag";
  let bag = {};
  try { bag = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { bag = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch {} };
  const drawer = $("#bag");
  let lastFocus = null;

  function renderBag() {
    const items = Object.entries(bag).filter(([s, q]) => bySlug[s] && q > 0);
    const count = items.reduce((n, [, q]) => n + q, 0);
    $$("[data-bag-count]").forEach((el) => (el.textContent = count));
    $("[data-bag-list]").innerHTML = items.map(([s, q]) => {
      const p = bySlug[s];
      return `<li class="bag-item">
        <span class="swatch" style="--tint:${p.tint};--frame:${p.frameColor}" aria-hidden="true"></span>
        <div><h3>${esc(p.name)}</h3><p class="sub">${priceHTML(p)} · <a href="${p.url}" rel="noopener">Bestellen op pep-schep.nl</a></p></div>
        <div class="qty" role="group" aria-label="Aantal ${esc(p.name)}">
          <button type="button" data-dec="${s}" aria-label="Eén ${esc(p.name)} minder">−</button><output>${q}</output><button type="button" data-inc="${s}" aria-label="Eén ${esc(p.name)} meer">+</button>
        </div></li>`;
    }).join("");
    $("[data-bag-empty]").hidden = items.length > 0;
    $("[data-bag-foot]").hidden = items.length === 0;
    const allPriced = items.every(([s]) => bySlug[s].price != null);
    const total = items.reduce((n, [s, q]) => n + (bySlug[s].price || 0) * q, 0);
    $("[data-bag-total]").innerHTML = allPriced ? `<span>Subtotaal</span><span class="price">${euro(total)}</span>` : `<span>Totaal zie je bij het afrekenen</span>`;
    const co = $("[data-checkout]");
    if (items.length === 1) {
      const [s, q] = items[0], p = bySlug[s];
      co.href = p.wcId ? `https://pep-schep.nl/?add-to-cart=${p.wcId}&quantity=${q}` : p.url;
      co.textContent = "Afrekenen op pep-schep.nl";
    } else if (items.length > 1) {
      co.href = bySlug[items[0][0]].url;
      co.textContent = "Verder naar pep-schep.nl";
    }
  }

  function add(slug) {
    const p = bySlug[slug];
    if (!p) return;
    bag[slug] = (bag[slug] || 0) + 1;
    save(); renderBag();
    $$("[data-bag-count]").forEach((el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
    toast(`${p.name} zit in je tas`);
  }

  let toastTimer;
  function toast(msg) {
    const t = $("[data-toast]");
    t.innerHTML = `<span>${esc(msg)}</span><button type="button" data-bag-open>Bekijk tas</button>`;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function openBag() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    $(".drawer-head [data-bag-close]", drawer).focus();
    $("[data-toast]").classList.remove("show");
  }
  function closeBag() {
    drawer.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add],[data-bag-open],[data-bag-close],[data-inc],[data-dec]");
    if (!t) return;
    if (t.dataset.add) add(t.dataset.add);
    else if (t.hasAttribute("data-bag-open")) openBag();
    else if (t.hasAttribute("data-bag-close")) closeBag();
    else if (t.dataset.inc) { bag[t.dataset.inc]++; save(); renderBag(); }
    else if (t.dataset.dec) { bag[t.dataset.dec]--; if (bag[t.dataset.dec] <= 0) delete bag[t.dataset.dec]; save(); renderBag(); if (!Object.keys(bag).length) $(".drawer-head [data-bag-close]", drawer).focus(); }
  });
  document.addEventListener("keydown", (e) => {
    if (drawer.hidden) return;
    if (e.key === "Escape") closeBag();
    if (e.key === "Tab") {
      const f = $$("a[href],button:not([disabled])", $(".drawer-panel", drawer)).filter((el) => el.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  renderBag();

  /* ---------------- Radio groups (arrow keys) ---------------- */
  function radioGroup(group, itemSel, onPick) {
    const items = $$(itemSel, group);
    const pick = (el, focus) => {
      items.forEach((b) => { const on = b === el; b.setAttribute("aria-checked", on); b.tabIndex = on ? 0 : -1; });
      if (focus) el.focus();
      onPick(el);
    };
    group.addEventListener("click", (e) => { const b = e.target.closest(itemSel); if (b) pick(b, false); });
    group.addEventListener("keydown", (e) => {
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); pick(items[(i + d + items.length) % items.length], true); }
    });
    return { pick, items };
  }

  const card = (p, cls) => `<h3>${esc(p.name)}</h3>
    <p>${esc(p.blurb || p.lens || "Festivalzonnebril met UV-filterglas.")}</p>
    ${priceHTML(p)}
    <div class="actions"><button class="btn btn--solid" type="button" data-add="${p.slug}">In mijn tas</button><a class="link" href="${base}shades/${p.slug}/index.html">Bekijk ${esc(p.name)}</a></div>`;

  /* ---------------- Signature: Door het glas ---------------- */
  function Loupe(stage) {
    const svg = $(".loupe", stage), clip = $("[data-lens-clip]", stage), sceneG = $("[data-loupe-scene]", stage);
    const tint = $("[data-loupe-tint]", stage), hue = $("[data-loupe-hue]", stage), frame = $("[data-loupe-frame]", stage);
    let cur = { x: 0, y: 0 }, target = { x: 0, y: 0 }, hover = false, raf = 0, model = null;

    function setModel(p) {
      model = p;
      clip.innerHTML = p.lenses.map((d) => `<path d="${d}"/>`).join("");
      frame.innerHTML = p.lenses.map((d) => `<path d="${d}"/>`).join("") + `<path d="${p.extra}"/>`;
      frame.setAttribute("stroke", p.frameColor);
      frame.setAttribute("stroke-opacity", p.frameOpacity);
      tint.setAttribute("fill", p.tint);
      tint.setAttribute("fill-opacity", Math.min(0.9, p.tintAlpha * 1.25));
      hue.setAttribute("fill", p.tint);
      hue.setAttribute("fill-opacity", Math.min(0.85, p.tintAlpha * 1.4));
    }
    function place(x, y) {
      const W = stage.clientWidth, L = svg.clientWidth || W * 0.46, s = L / 600;
      const left = x - L / 2, top = y - 120 * s;
      svg.style.setProperty("--lx", left + "px");
      svg.style.setProperty("--ly", top + "px");
      sceneG.setAttribute("transform", `translate(${(-left / s).toFixed(2)} ${(-top / s).toFixed(2)}) scale(${(W / 1600 / s).toFixed(4)})`);
    }
    function tick() {
      const k = reduced.matches ? 1 : 0.16;
      cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k;
      place(cur.x, cur.y);
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    }
    function aim(x, y, snap) {
      target = { x, y };
      if (snap) { cur = { ...target }; place(x, y); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    const rel = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = true; stage.classList.add("is-hover"); aim(...rel(e)); });
    stage.addEventListener("pointerdown", (e) => { hover = true; aim(...rel(e)); });
    stage.addEventListener("pointerleave", () => { hover = false; stage.classList.remove("is-hover"); });
    // Autopilot: where the loupe rests when nobody is steering it. p in 0..1.
    function drift(p, snap) {
      if (hover) return;
      const W = stage.clientWidth, H = stage.clientHeight;
      if (reduced.matches) return aim(W * 0.34, H * 0.56, true);
      aim(W * (0.24 + 0.52 * p), H * (0.52 + 0.1 * Math.sin(p * Math.PI * 3)), snap);
    }
    let lastP = 0.2;
    new ResizeObserver(() => drift(lastP, true)).observe(stage);
    return { setModel, drift: (p, snap) => { lastP = p; drift(p, snap); }, get model() { return model; } };
  }

  // Peak on the home page: scroll steps through the seven lenses until the visitor picks one.
  const glass = $("[data-glass]");
  if (glass) {
    const loupe = Loupe($("[data-loupe]", glass));
    const cardEl = $("[data-pick-card]", glass);
    let manual = false;
    const show = (slug) => { const p = bySlug[slug]; loupe.setModel(p); cardEl.innerHTML = card(p); };
    const rg = radioGroup($(".models", glass), "[data-pick]", (b) => { manual = true; show(b.dataset.pick); });
    show(rg.items[0].dataset.pick);
    loupe.drift(0.2, true);
    let lastIdx = 0;
    const onScroll = () => {
      const r = glass.getBoundingClientRect();
      const span = Math.max(1, r.height - innerHeight);
      const p = clamp(-r.top / span);
      loupe.drift(p);
      if (!manual && !reduced.matches && r.top < innerHeight && r.bottom > 0) {
        const idx = Math.min(rg.items.length - 1, Math.floor(p * rg.items.length));
        if (idx !== lastIdx) {
          lastIdx = idx;
          const b = rg.items[idx];
          rg.items.forEach((x) => { const on = x === b; x.setAttribute("aria-checked", on); x.tabIndex = on ? 0 : -1; });
          show(b.dataset.pick);
        }
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Product pages: one fixed lens, gentle drift over time until pointed at.
  $$("[data-loupe][data-fixed]").forEach((stage) => {
    const loupe = Loupe(stage);
    loupe.setModel(bySlug[stage.dataset.fixed]);
    loupe.drift(0.3, true);
    if (reduced.matches) return;
    let t0 = performance.now(), on = false;
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) loop(); }).observe(stage);
    function loop() { if (!on) return; const t = (performance.now() - t0) / 9000; loupe.drift(0.5 + 0.5 * Math.sin(t * Math.PI * 2)); setTimeout(loop, 60); }
  });

  /* ---------------- Cover: layered planes ---------------- */
  const cover = $("[data-cover]");
  if (cover) {
    const planes = $$(".plane", cover);
    planes.forEach((el) => el.style.setProperty("--d", el.dataset.depth));
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      cover.style.setProperty("--mx", mx.toFixed(3)); cover.style.setProperty("--my", my.toFixed(3));
      raf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    if (!reduced.matches && matchMedia("(pointer: fine)").matches) {
      cover.addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; if (!raf) raf = requestAnimationFrame(loop); });
    }
    const onScroll = () => cover.style.setProperty("--p", clamp(scrollY / innerHeight).toFixed(4));
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Masthead state ---------------- */
  const mast = $(".masthead");
  const night = $$(".glass, .colophon");
  const onMast = () => {
    mast.classList.toggle("is-solid", scrollY > 8);
    const y = 32;
    mast.classList.toggle("is-night", night.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
  };
  addEventListener("scroll", onMast, { passive: true });
  onMast();

  /* ---------------- Collection reveal ---------------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* ---------------- Promise: facts land one by one ---------------- */
  const promise = $("[data-promise]");
  if (promise) {
    const facts = $$("[data-fact]", promise);
    const onScroll = () => {
      if (reduced.matches) return facts.forEach((f) => f.classList.add("on"));
      const r = promise.getBoundingClientRect();
      const p = clamp((innerHeight * 0.6 - r.top) / Math.max(1, r.height - innerHeight * 0.4));
      facts.forEach((f, i) => f.classList.toggle("on", p > i / (facts.length + 0.5)));
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Close: pick a tint ---------------- */
  const close = $("[data-close]");
  if (close) {
    const cardEl = $("[data-close-card]", close);
    const stageEl = $("[data-close-stage]", close);
    const draw = (p) => {
      const lens = p.lenses.map((d) => `<path d="${d}"/>`).join("");
      stageEl.style.setProperty("--tint", p.tint);
      stageEl.innerHTML = `<svg viewBox="0 0 600 240"><g fill="${p.tint}" fill-opacity="${Math.min(0.95, p.tintAlpha + 0.2)}">${lens}</g><g fill="none" stroke="${p.frameColor}" stroke-opacity="${p.frameOpacity}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">${lens}<path d="${p.extra}"/></g></svg>`;
      cardEl.innerHTML = card(p);
    };
    const rg = radioGroup($(".close-swatches", close), "[data-close-pick]", (b) => draw(bySlug[b.dataset.closePick]));
    draw(bySlug[rg.items[0].dataset.closePick]);
  }

  /* ---------------- Product page buy bar ---------------- */
  const buybar = $("[data-buybar]"), mainBuy = $(".pdp-buy [data-add]");
  if (buybar && mainBuy) new IntersectionObserver(([e]) => buybar.classList.toggle("show", !e.isIntersecting && e.boundingClientRect.top < 0)).observe(mainBuy);
})();
