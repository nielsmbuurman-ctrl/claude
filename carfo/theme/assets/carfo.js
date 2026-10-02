/* Carfo theme script. Small web components, no dependencies. Config comes from snippets/theme-data.liquid. */
(() => {
  const C = window.Carfo || { routes: {}, strings: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const designMode = () => Boolean(window.Shopify && window.Shopify.designMode);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fill = (str, map) => Object.entries(map).reduce((s, [k, v]) => s.split(`[${k}]`).join(v), String(str || ''));
  const setPrice = (base, extra, pairs) => Number(base) + Number(extra) * Math.max(0, pairs - 1);
  const store = {
    get(k, session) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, session) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- Money ---------- */
  function formatMoney(cents, format = C.moneyFormat || '€{{amount_with_comma_separator}}') {
    const value = Math.round(Number(cents) || 0);
    const num = (decimals, thousands, decimal) => {
      const [int, dec] = (value / 100).toFixed(decimals).split('.');
      const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return dec ? grouped + decimal + dec : grouped;
    };
    const out = format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount_no_decimals': return num(0, ',', '.');
        case 'amount_with_comma_separator': return num(2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return num(0, '.', ',');
        case 'amount_with_apostrophe_separator': return num(2, "'", '.');
        case 'amount_with_space_separator': return num(2, ' ', ',');
        default: return num(2, ',', '.');
      }
    });
    return out.replace(/<[^>]*>/g, '');
  }

  const sketch = (tint) => `<svg class="frame-sketch" viewBox="0 0 600 260" aria-hidden="true"><g fill="${esc(tint)}" fill-opacity=".55"><rect x="62" y="66" width="208" height="140" rx="40"/><rect x="330" y="66" width="208" height="140" rx="40"/></g><g fill="none" stroke="#111" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"><rect x="62" y="66" width="208" height="140" rx="40"/><rect x="330" y="66" width="208" height="140" rx="40"/><path d="M270 104c18-16 42-16 60 0"/><path d="M62 92H22M538 92h40"/></g></svg>`;

  function toast(message) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'alert');
      document.body.append(el);
    }
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(el.timer);
    el.timer = setTimeout(() => el.classList.remove('is-on'), 4000);
  }

  /* ---------- Cart ---------- */
  const merge = (items) => {
    const map = new Map();
    items.forEach(({ id, quantity }) => map.set(id, (map.get(id) || 0) + quantity));
    return Array.from(map, ([id, quantity]) => ({ id, quantity }));
  };

  const Cart = {
    sectionIds: () => Array.from(new Set($$('[data-cart-section]').map((el) => el.dataset.cartSection))),
    async post(url, body) {
      $$('[data-cart-content]').forEach((el) => el.classList.add('is-busy'));
      try {
        const res = await fetch(`${url}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...body, sections: this.sectionIds(), sections_url: location.pathname })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status) throw new Error(data.description || data.message || C.strings.addError);
        this.render(data.sections);
        return data;
      } finally {
        $$('[data-cart-content]').forEach((el) => el.classList.remove('is-busy'));
      }
    },
    add(items) { return this.post(C.routes.cartAdd, { items: merge(items) }); },
    change(line, quantity) { return this.post(C.routes.cartChange, { line, quantity }); },
    render(sections) {
      if (!sections) return;
      let count = null;
      Object.entries(sections).forEach(([id, html]) => {
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('[data-cart-content]');
        if (!fresh) return;
        count = Number(fresh.dataset.count);
        $$(`[data-cart-section="${id}"]`).forEach((host) => {
          const target = $('[data-cart-content]', host);
          if (target) {
            target.innerHTML = fresh.innerHTML;
            target.dataset.count = fresh.dataset.count;
          }
          const title = $('.drawer__title', host);
          const freshTitle = doc.querySelector('.drawer__title');
          if (title && freshTitle) title.innerHTML = freshTitle.innerHTML;
        });
      });
      if (count !== null) {
        $$('[data-cart-count]').forEach((el) => {
          el.textContent = count;
          el.hidden = count === 0;
        });
      }
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count } }));
    }
  };
  window.CarfoCart = Cart;

  const drawer = () => $('cart-drawer');

  async function addItems(items, trigger) {
    if (trigger) {
      trigger.disabled = true;
      trigger.setAttribute('aria-busy', 'true');
    }
    try {
      await Cart.add(items);
      const d = drawer();
      if (d) d.open();
      return true;
    } catch (e) {
      toast(e.message || C.strings.addError);
      return false;
    } finally {
      if (trigger) {
        trigger.disabled = false;
        trigger.removeAttribute('aria-busy');
      }
    }
  }

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.dialog = $('dialog', this);
      this.addEventListener('click', (e) => {
        if (e.target === this.dialog || e.target.closest('[data-close]')) this.close();
      });
    }
    open() {
      if (this.dialog && !this.dialog.open) this.dialog.showModal();
    }
    close() {
      if (this.dialog && this.dialog.open) this.dialog.close();
    }
  }

  document.addEventListener('click', async (e) => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener && drawer()) {
      e.preventDefault();
      drawer().open();
      return;
    }
    const adder = e.target.closest('[data-add-variant]');
    if (adder) {
      e.preventDefault();
      await addItems([{ id: Number(adder.dataset.addVariant), quantity: 1 }], adder);
      return;
    }
    const line = e.target.closest('a[data-line]');
    if (line) {
      e.preventDefault();
      try {
        await Cart.change(Number(line.dataset.line), Number(line.dataset.qty));
      } catch (err) {
        location.href = line.href;
      }
    }
  });

  /* ---------- Product form ---------- */
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-product-form]');
    if (!form) return;
    e.preventDefault();
    const button = $('[data-submit]', form);
    const error = $('[data-form-error]', form);
    const bundle = $('bundle-selector', form);
    if (bundle && !bundle.isComplete()) return;
    const items = [{ id: Number($('[data-variant-id]', form).value), quantity: 1 }];
    if (bundle) items.push(...bundle.extraItems());
    if (error) error.hidden = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      await Cart.add(items);
      if (drawer()) drawer().open();
    } catch (err) {
      if (error) {
        error.textContent = err.message || C.strings.addError;
        error.hidden = false;
      }
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });

  document.addEventListener('change', (e) => {
    const select = e.target.closest('[data-variant-select]');
    if (select) {
      const form = select.closest('form');
      const option = select.selectedOptions[0];
      $('[data-variant-id]', form).value = select.value;
      const price = Number(option.dataset.price);
      const unit = $('[data-unit-price]');
      if (unit) unit.textContent = formatMoney(price);
      const bundle = $('bundle-selector', form);
      if (bundle) bundle.setBase(price);
      else setSubmit(form, fill(C.strings.addWithPrice, { price: formatMoney(price) }), !option.disabled);
    }
    const autosubmit = e.target.closest('[data-autosubmit]');
    if (autosubmit) autosubmit.form.submit();
  });

  function setSubmit(form, text, ready) {
    const button = $('[data-submit]', form);
    const label = $('[data-submit-label]', form);
    if (label) label.textContent = text;
    if (button) button.disabled = !ready;
    document.dispatchEvent(new CustomEvent('product:submit-changed', { detail: { form } }));
  }

  /* ---------- Set selector on the product page ---------- */
  class BundleSelector extends HTMLElement {
    connectedCallback() {
      this.base = Number(this.dataset.base);
      this.extra = Number(this.dataset.extra);
      this.form = this.closest('form');
      this.picker = $('[data-picker]', this);
      this.picks = $$('[data-pick]', this);
      this.selected = [];
      this.addEventListener('change', (e) => {
        if (e.target.name === 'carfo-tier') this.setTier(Number(e.target.value));
      });
      this.picker.addEventListener('click', (e) => {
        const pick = e.target.closest('[data-pick]');
        if (pick) this.toggle(pick);
      });
      const checked = $('input[name="carfo-tier"]:checked', this);
      this.setTier(checked ? Number(checked.value) : 1);
    }
    get need() { return Math.max(0, this.tier - 1); }
    setTier(n) {
      this.tier = n;
      while (this.selected.length < this.need) {
        const next = this.picks.find((b) => !this.selected.includes(b));
        if (!next) break;
        this.selected.push(next);
      }
      this.selected = this.selected.slice(0, this.need);
      this.render();
    }
    toggle(pick) {
      const i = this.selected.indexOf(pick);
      if (i >= 0) this.selected.splice(i, 1);
      else {
        if (this.selected.length >= this.need) this.selected.shift();
        this.selected.push(pick);
      }
      this.render();
    }
    setBase(cents) {
      this.base = cents;
      this.render();
    }
    isComplete() { return this.selected.length >= this.need; }
    extraItems() { return this.selected.map((b) => ({ id: Number(b.dataset.pick), quantity: 1 })); }
    render() {
      this.picker.hidden = this.need === 0;
      const label = $('[data-picker-label]', this);
      label.textContent = this.need === 1 ? this.picker.dataset.labelOne : fill(this.picker.dataset.labelMany, { count: this.need });
      this.picks.forEach((b) => b.setAttribute('aria-pressed', String(this.selected.includes(b))));
      const missing = this.need - this.selected.length;
      const text = missing > 0
        ? (missing === 1 ? C.strings.pickOne : fill(C.strings.pickMore, { count: missing }))
        : fill(C.strings.addWithPrice, { price: formatMoney(setPrice(this.base, this.extra, this.tier)) });
      setSubmit(this.form, text, missing <= 0);
    }
  }

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      this.form = document.getElementById(this.dataset.form);
      if (!this.form) return;
      this.button = $('[data-sticky-submit]', this);
      this.label = $('[data-sticky-label]', this);
      this.hidden = false;
      const main = $('[data-submit]', this.form);
      // A scroll check rather than an IntersectionObserver: a fast fling can jump past the button
      // without ever crossing the viewport edge, and the observer would never fire.
      const update = () => {
        this.ticking = false;
        this.classList.toggle('is-visible', main.getBoundingClientRect().bottom < 0);
      };
      window.addEventListener('scroll', () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(update);
      }, { passive: true });
      update();
      this.button.addEventListener('click', () => this.form.requestSubmit());
      document.addEventListener('product:submit-changed', () => this.sync());
      this.sync();
    }
    sync() {
      const main = $('[data-submit]', this.form);
      this.label.textContent = $('[data-submit-label]', this.form).textContent.trim();
      this.button.disabled = main.disabled;
    }
  }

  class MediaGallery extends HTMLElement {
    connectedCallback() {
      const track = $('[data-track]', this);
      const dots = $$('.gallery__dot', this);
      if (!track || dots.length < 2) return;
      track.addEventListener('scroll', () => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
      }, { passive: true });
    }
  }

  /* ---------- Build your set ---------- */
  class SetBuilder extends HTMLElement {
    connectedCallback() {
      this.base = Number(this.dataset.base);
      this.extra = Number(this.dataset.extra);
      this.size = Number(this.dataset.size) || 2;
      this.max = Math.max(...$$('[data-size-btn]', this).map((b) => Number(b.dataset.sizeBtn)), this.size);
      this.items = [];
      this.slots = $('[data-slots]', this);
      this.template = $('[data-slot-template]', this);
      this.status = $('[data-status]', this);
      this.totalEl = $('[data-total]', this);
      this.addButton = $('[data-add-set]', this);
      this.addEventListener('click', (e) => {
        const size = e.target.closest('[data-size-btn]');
        if (size) return this.setSize(Number(size.dataset.sizeBtn));
        const choose = e.target.closest('[data-choose]');
        if (choose) return this.choose(choose);
        const remove = e.target.closest('[data-remove]');
        if (remove) return this.remove(Number(remove.dataset.index));
        return null;
      });
      this.addButton.addEventListener('click', () => addItems(this.items.map((i) => ({ id: i.id, quantity: 1 })), this.addButton));
      this.render();
    }
    setSize(n) {
      this.size = n;
      this.items = this.items.slice(0, n);
      $$('[data-size-btn]', this).forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.sizeBtn) === n)));
      this.render();
    }
    choose(button) {
      if (this.items.length >= this.size) {
        if (this.size >= this.max) {
          this.slots.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
          return;
        }
        this.setSize(this.size + 1);
      }
      this.items.push({ id: Number(button.dataset.choose), title: button.dataset.title, thumb: button.dataset.thumb, tint: button.dataset.tint });
      this.render();
    }
    remove(index) {
      this.items.splice(index, 1);
      this.render();
    }
    render() {
      this.slots.replaceChildren();
      for (let i = 0; i < this.size; i += 1) {
        const item = this.items[i];
        if (!item) {
          const empty = document.createElement('li');
          empty.className = 'slot slot--empty';
          empty.setAttribute('aria-hidden', 'true');
          this.slots.append(empty);
          continue;
        }
        const node = this.template.content.firstElementChild.cloneNode(true);
        const button = $('[data-remove]', node);
        button.dataset.index = i;
        $('.slot__media', node).innerHTML = item.thumb
          ? `<img src="${esc(item.thumb)}" alt="" width="52" height="52">`
          : `<span class="slot__dot" style="--dot: ${esc(item.tint)}"></span>`;
        const label = $('[data-remove-label]', node);
        label.textContent = `${label.textContent.trim()}: ${item.title}`;
        this.slots.append(node);
      }
      const missing = this.size - this.items.length;
      this.status.textContent = missing > 0
        ? (missing === 1 ? C.strings.pickOne : fill(C.strings.pickMore, { count: missing }))
        : fill(C.strings.picked, { picked: this.items.length, total: this.size });
      this.totalEl.textContent = formatMoney(setPrice(this.base, this.extra, this.size));
      this.addButton.disabled = missing > 0;
      const ids = this.items.map((i) => i.id);
      $$('[data-choose]', this).forEach((b) => b.classList.toggle('is-chosen', ids.includes(Number(b.dataset.choose))));
    }
  }

  /* ---------- Find your frame ---------- */
  class FrameQuiz extends HTMLElement {
    connectedCallback() {
      this.frames = JSON.parse($('[data-frames]', this).textContent).filter((f) => f.available);
      this.strings = JSON.parse($('[data-quiz-strings]', this).textContent);
      this.extra = Number(this.dataset.extra);
      this.form = $('[data-quiz-form]', this);
      this.steps = $$('[data-step]', this);
      this.result = $('[data-result]', this);
      this.steps.forEach((s, i) => { s.hidden = i > 0; });
      this.form.addEventListener('change', (e) => this.onChange(e));
      this.form.addEventListener('submit', (e) => e.preventDefault());
      $('[data-restart]', this).addEventListener('click', () => this.restart());
      $('[data-add-both]', this).addEventListener('click', (e) => {
        if (this.picks) addItems(this.picks.map((f) => ({ id: f.variant, quantity: 1 })), e.currentTarget);
      });
    }
    onChange(e) {
      const step = e.target.closest('[data-step]');
      const next = this.steps[this.steps.indexOf(step) + 1];
      if (next && next.hidden) {
        next.hidden = false;
        next.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
      }
      const answers = Object.fromEntries(new FormData(this.form));
      if (answers.use && answers.fit && answers.style) this.show(answers);
    }
    score(frame, a) {
      const wear = (Array.isArray(frame.wear) ? frame.wear : []).map((w) => String(w).toLowerCase());
      if (a.use === 'driving' && Number(frame.category) >= 4) return -1;
      let s = 1;
      if (wear.includes(a.use)) s += 3;
      if (a.fit !== 'unsure' && frame.fit === a.fit) s += 2;
      if (a.style === 'surprise') s += Math.random() * 3;
      else if (frame.style === a.style) s += 3;
      return s;
    }
    show(a) {
      const ranked = this.frames
        .map((f, i) => ({ f, i, s: this.score(f, a) }))
        .filter((x) => x.s >= 0)
        .sort((x, y) => y.s - x.s || x.i - y.i)
        .slice(0, 2)
        .map((x) => x.f);
      if (!ranked.length) return;
      this.picks = ranked;
      $('[data-result-title]', this).textContent = fill(this.strings.title, { a: ranked[0].title, b: ranked[1] ? ranked[1].title : '' });
      $('[data-result-list]', this).innerHTML = ranked.map((f) => `
        <li class="card">
          <a class="card__media" href="${esc(f.url)}">${f.image ? `<img class="frame-media__img" src="${esc(f.image)}" alt="" loading="lazy">` : sketch(f.tint)}</a>
          <div class="card__info"><div class="card__text">
            <h3 class="card__title"><a href="${esc(f.url)}">${esc(f.title)}</a></h3>
            ${f.colourway ? `<p class="card__colour">${esc(f.colourway)}</p>` : ''}
          </div></div>
        </li>`).join('');
      const total = setPrice(ranked[0].price, this.extra, ranked.length);
      $('[data-add-both]', this).textContent = fill(this.strings.addBoth, { price: formatMoney(total) });
      this.result.hidden = false;
      this.result.focus({ preventScroll: true });
      this.result.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    }
    restart() {
      this.form.reset();
      this.picks = null;
      this.steps.forEach((s, i) => { s.hidden = i > 0; });
      this.result.hidden = true;
      this.steps[0].scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
    }
  }

  /* ---------- See through the lens ---------- */
  class LensLoupe extends HTMLElement {
    connectedCallback() {
      this.stage = $('[data-stage]', this);
      this.frame = $('[data-frame]', this);
      this.caption = $('[data-caption]', this);
      this.radios = $$('[role="radio"][data-swatch]', this);
      this.pos = { x: 0.32, y: 0.46 };
      this.target = { ...this.pos };
      this.use($('[data-swatch]', this));

      this.addEventListener('click', (e) => {
        const s = e.target.closest('[role="radio"][data-swatch]');
        if (s) this.pick(s, false);
      });
      this.addEventListener('keydown', (e) => {
        const i = this.radios.indexOf(document.activeElement);
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (i < 0 || !d) return;
        e.preventDefault();
        this.pick(this.radios[(i + d + this.radios.length) % this.radios.length], true);
      });

      const aim = (e) => {
        const r = this.stage.getBoundingClientRect();
        this.hover = true;
        this.classList.add('is-touched');
        this.target = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        clearTimeout(this.idle);
        this.idle = setTimeout(() => { this.hover = false; this.loop(); }, 2500);
        this.loop();
      };
      this.stage.addEventListener('pointermove', aim);
      this.stage.addEventListener('pointerdown', aim);

      new ResizeObserver(() => { this.measure(); this.place(); }).observe(this.stage);
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.loop();
      }).observe(this.stage);
      this.measure();
      this.place();
    }
    measure() {
      this.w = this.stage.clientWidth;
      this.h = this.stage.clientHeight;
      this.lw = this.frame.getBoundingClientRect().width || this.w * 0.46;
    }
    use(swatch) {
      if (!swatch) return;
      this.stage.style.setProperty('--tint', swatch.dataset.tint);
      this.stage.style.setProperty('--tint-alpha', Math.min(0.8, Number(swatch.dataset.alpha) * 1.2 || 0.55));
      this.stage.style.setProperty('--frame-color', swatch.dataset.frameColor || '#111');
      if (this.caption && swatch.dataset.caption) {
        this.caption.textContent = swatch.dataset.caption;
        this.caption.href = swatch.dataset.url;
      }
    }
    pick(s, focus) {
      this.radios.forEach((r) => {
        const on = r === s;
        r.setAttribute('aria-checked', String(on));
        r.tabIndex = on ? 0 : -1;
      });
      if (focus) s.focus();
      this.use(s);
    }
    loop() {
      if (this.raf || !this.visible) return;
      const step = (t) => {
        this.raf = 0;
        if (!this.hover) {
          if (reduced.matches) {
            this.pos = { x: 0.5, y: 0.5 };
            this.place();
            return;
          }
          const k = t / 9000;
          this.target = { x: 0.5 + 0.28 * Math.sin(k * Math.PI * 2), y: 0.48 + 0.1 * Math.sin(k * Math.PI * 4) };
        }
        const ease = reduced.matches ? 1 : 0.14;
        this.pos.x += (this.target.x - this.pos.x) * ease;
        this.pos.y += (this.target.y - this.pos.y) * ease;
        this.place();
        const moving = Math.abs(this.target.x - this.pos.x) + Math.abs(this.target.y - this.pos.y) > 0.0005;
        if (this.visible && (!this.hover || moving)) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
    place() {
      const lh = this.lw * (260 / 600);
      const x = Math.round(this.pos.x * this.w - this.lw / 2);
      const y = Math.round(this.pos.y * this.h - lh / 2);
      this.stage.style.setProperty('--lx', `${x}px`);
      this.stage.style.setProperty('--ly', `${y}px`);
      this.frame.style.setProperty('--fx', `${x}px`);
      this.frame.style.setProperty('--fy', `${y}px`);
    }
  }

  /* ---------- Small pieces ---------- */
  class FilterChips extends HTMLElement {
    connectedCallback() {
      const grid = document.getElementById(this.dataset.grid);
      if (!grid) return;
      this.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-filter]');
        if (!chip) return;
        $$('[data-filter]', this).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        const f = chip.dataset.filter;
        $$('.grid__item', grid).forEach((li) => {
          const card = $('.card', li);
          li.classList.toggle('is-filtered', Boolean(f) && (!card || card.dataset.shape !== f));
        });
      });
    }
  }

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      const msgs = $$('.announce__msg', this);
      if (msgs.length < 2) return;
      let i = 0;
      msgs.forEach((m, j) => m.setAttribute('aria-hidden', String(j !== 0)));
      const ms = (Number(this.dataset.interval) || 4) * 1000;
      const pause = (on) => () => { this.paused = on; };
      this.addEventListener('mouseenter', pause(true));
      this.addEventListener('mouseleave', pause(false));
      this.addEventListener('focusin', pause(true));
      this.addEventListener('focusout', pause(false));
      this.timer = setInterval(() => {
        if (this.paused || document.hidden) return;
        msgs[i].classList.remove('is-active');
        msgs[i].setAttribute('aria-hidden', 'true');
        i = (i + 1) % msgs.length;
        msgs[i].classList.add('is-active');
        msgs[i].setAttribute('aria-hidden', 'false');
      }, ms);
    }
    disconnectedCallback() { clearInterval(this.timer); }
  }

  class StickyHeader extends HTMLElement {
    connectedCallback() {
      let last = window.scrollY;
      this.onScroll = () => {
        const y = window.scrollY;
        const menuOpen = Boolean($('.menu-drawer[open]'));
        this.classList.toggle('is-hidden', !menuOpen && y > last && y > 240);
        last = y;
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.addEventListener('keydown', (e) => {
        const menu = $('.menu-drawer[open]', this);
        if (e.key === 'Escape' && menu) {
          menu.removeAttribute('open');
          $('summary', menu).focus();
        }
      });
    }
    disconnectedCallback() { window.removeEventListener('scroll', this.onScroll); }
  }

  class EmailPopup extends HTMLElement {
    connectedCallback() {
      this.dialog = $('dialog', this);
      const KEY = 'carfo:popup';
      this.addEventListener('click', (e) => {
        if (e.target === this.dialog || e.target.closest('[data-close]')) this.dialog.close();
      });
      document.addEventListener('shopify:section:select', (e) => { if (e.target.contains(this)) this.show(true); });
      document.addEventListener('shopify:section:deselect', (e) => { if (e.target.contains(this)) this.dialog.close(); });

      const success = $('[data-popup-success]', this);
      const ownPost = location.hash === '#EmailPopupForm';
      if (ownPost && (success || $('[data-popup-error]', this))) {
        this.show(true);
        if (success) store.set(KEY, 'subscribed');
        return;
      }
      if (success) {
        store.set(KEY, 'subscribed');
        return;
      }
      if (designMode()) return;
      // Never interrupt someone who is busy choosing frames.
      if ($('frame-quiz, set-builder')) return;
      const saved = store.get(KEY);
      if (saved === 'subscribed' || (saved && Date.now() < Number(saved))) return;

      const views = Number(store.get('carfo:views', true) || 0) + 1;
      store.set('carfo:views', String(views), true);
      if (document.body.classList.contains('template-product') && views === 1) return;

      const days = Number(this.dataset.days) || 14;
      const started = Date.now();
      const minWait = matchMedia('(max-width: 749px)').matches ? 10000 : 0;
      const trigger = () => {
        if (this.triggered) return;
        this.triggered = true;
        clearTimeout(timer);
        window.removeEventListener('scroll', onScroll);
        if (this.show(false)) store.set(KEY, String(Date.now() + days * 864e5));
        else this.triggered = false;
      };
      const timer = setTimeout(trigger, (Number(this.dataset.delay) || 15) * 1000);
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0 || Date.now() - started < minWait) return;
        if ((window.scrollY / max) * 100 >= (Number(this.dataset.scroll) || 50)) trigger();
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    show(force) {
      if (this.dialog.open) return true;
      if (!force && $('dialog[open]')) return false;
      this.dialog.showModal();
      return true;
    }
  }

  const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };
  define('cart-drawer', CartDrawer);
  define('bundle-selector', BundleSelector);
  define('sticky-atc', StickyAtc);
  define('media-gallery', MediaGallery);
  define('set-builder', SetBuilder);
  define('frame-quiz', FrameQuiz);
  define('lens-loupe', LensLoupe);
  define('filter-chips', FilterChips);
  define('announcement-bar', AnnouncementBar);
  define('sticky-header', StickyHeader);
  define('email-popup', EmailPopup);

  window.Carfo = Object.assign(C, { formatMoney, addItems });
})();
