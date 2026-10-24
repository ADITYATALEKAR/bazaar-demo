/* Bazaar demo — storefront logic (vanilla JS, no build step). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  BZ.ensureSeed();
  // German-first: follow the browser language unless the visitor chose one
  let lang = BZ.load('bz_lang', null) || ((navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en');
  let cart = BZ.load('bz_cart', []).filter((l) => BZ.byId[l.id] && BZ.byId[l.id].sizes[l.si]);
  let coupon = BZ.load('bz_coupon', '');
  const L = (k, ...a) => BZ.t(lang, k, ...a);
  const M = (v) => BZ.money(v, lang);
  const catOf = (id) => BZ.cats.find((c) => c.id === id);
  const hue = (p) => `--h:${catOf(p.cat).h}`;
  const keyOf = (id, si) => id + '|' + si;
  const inCart = (id, si) => { const l = cart.find((x) => x.k === keyOf(id, si)); return l ? l.q : 0; };
  const totals = () => BZ.totals(cart, coupon);

  /* ---------- small helpers ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 1900);
  }
  function persist() {
    BZ.save('bz_cart', cart.map(({ k, id, si, q }) => ({ k, id, si, q })));
    renderBadge(); refreshCards();
    if ($('#drawer').classList.contains('on')) renderDrawer();
    if (current === 'checkout') { if (cart.length) $('#sum').innerHTML = summaryHtml(); else renderCheckout(); }
  }
  function renderBadge() {
    const T = totals(); const n = T.count;
    $('#cartCount').textContent = n; $('#cartCount').style.display = n ? '' : 'none';
    $('#cartTotal').textContent = n ? M(T.total) : '';
    $('#cartbar').hidden = !n; $('#cbCount').textContent = L('itemsN', n); $('#cbTotal').textContent = M(T.total);
  }
  // re-render every product card on the page so Add buttons turn into steppers
  function refreshCards() { $$('.pcard').forEach((c) => { c.innerHTML = pcardInner(BZ.byId[c.dataset.id], +c.dataset.si); }); }
  function firstInStock(p) { for (let i = 0; i < p.sizes.length; i++) if (BZ.stockOf(p, i) > 0) return i; return 0; }

  let plzChecked = BZ.load('bz_plz', '');
  function showPlz() {
    const res = $('#plzRes'); const lbl = $('#plzLabel');
    lbl.textContent = plzChecked ? plzChecked + (BZ.cities[plzChecked] ? ' ' + BZ.cities[plzChecked] : '') : L('setPlz');
    if (!plzChecked) { res.textContent = ''; return; }
    res.className = 'res ok'; res.textContent = L('plzOk', plzChecked, BZ.cities[plzChecked] || '', BZ.dayLabel(BZ.days(1)[0], lang));
  }

  /* ---------- static text, theme, language ---------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => { const v = L(el.dataset.i18n); if (typeof v === 'string') el.textContent = v; });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = L(el.dataset.i18nPh); });
    $('#langBtn').textContent = L('lang'); showPlz();
  }
  function setTheme(v) { if (v) document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme; }
  setTheme(BZ.load('bz_theme', null));
  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark'; setTheme(next); BZ.save('bz_theme', next);
  });
  $('#langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'de' : 'en'; BZ.save('bz_lang', lang); renderAll(); });

  /* ---------- overlays ---------- */
  let waTimer = null;
  function openEl(el) { closeAll(true); el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); }
  function closeAll(keepScrim) {
    ['#drawer', '#pm', '#waModal'].forEach((s) => { const el = $(s); el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); });
    if (!keepScrim) $('#scrim').classList.remove('on');
    clearInterval(waTimer); waTimer = null;
  }
  $('#scrim').addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); $('#sug').hidden = true; } });

  /* ---------- product card ---------- */
  function tagsHtml(p) {
    const t = [];
    if (p.deal) t.push(`<span class="tag off">−${p.deal}%</span>`);
    if (p.isNew) t.push(`<span class="tag new">${lang === 'de' ? 'Neu' : 'New'}</span>`);
    if (p.diet === 'vegan') t.push(`<span class="tag ok">${esc(L('vegan'))}</span>`);
    else if (p.diet === 'veg') t.push(`<span class="tag ok">${esc(L('veg'))}</span>`);
    if (p.cold) t.push(`<span class="tag cold">${lang === 'de' ? 'Gekühlt' : 'Chilled'}</span>`);
    return t.join('');
  }
  function stockHtml(p, si) {
    const s = BZ.stockOf(p, si);
    if (s <= 0) return `<span class="stk out">${esc(L('soldOut'))}</span>`;
    if (s <= 10) return `<span class="stk low">${esc(L('onlyLeft', s))}</span>`;
    return '';
  }
  function ratingHtml(p) { return `<span class="rate"><b>${p.rating.toFixed(1)} ★</b><span>${esc(L('reviews', p.reviews))}</span></span>`; }
  function priceHtml(p, si, big) {
    const price = BZ.priceOf(p, si), list = BZ.listPrice(p, si); const up = BZ.unitPrice(p, si, lang);
    return `<div class="pr"><span class="price${big ? ' xl' : ''}">${esc(M(price))}</span>${p.deal ? `<s class="was">${esc(M(list))}</s><span class="save">${esc(L('off', p.deal))}</span>` : ''}</div>${up ? `<div class="unitp">${esc(up)}</div>` : ''}<div class="vat">${esc(L('vatIncl'))}</div>`;
  }
  function sizesHtml(p, si, act) {
    return `<div class="sizes">${p.sizes.map((_, i) => {
      const dis = BZ.stockOf(p, i) <= 0;
      return p.sizes.length > 1
        ? `<button type="button" class="sz${i === si ? ' on' : ''}" data-act="${act}" data-si="${i}"${dis ? ' disabled' : ''}>${esc(BZ.qtyLabel(p, i, lang))}</button>`
        : `<span class="sz">${esc(BZ.qtyLabel(p, i, lang))}</span>`;
    }).join('')}</div>`;
  }
  // "Add" turns into a quantity stepper once the item is in the cart
  function actionHtml(p, si) {
    const q = inCart(p.id, si); const k = keyOf(p.id, si);
    if (BZ.stockOf(p, si) <= 0) return `<button type="button" class="btn btn-primary sm" disabled>${esc(L('soldOut'))}</button>`;
    if (q) return `<div class="stepper oncard"><button type="button" data-act="dec" data-k="${k}" aria-label="−">−</button><span>${q}</span><button type="button" data-act="inc" data-k="${k}" aria-label="+">+</button></div>`;
    return `<button type="button" class="btn btn-primary sm" data-act="add">${esc(L('add'))}</button>`;
  }
  function pcardInner(p, si) {
    const out = BZ.stockOf(p, si) <= 0;
    return `<button type="button" class="tile${out ? ' dim' : ''}" data-act="open" aria-label="${esc(p.name[lang])}"><img src="${p.img}" alt="" loading="lazy"><span class="tags">${tagsHtml(p)}</span></button>
      <div class="pbody">
        <button type="button" class="pname" data-act="open">${esc(p.name[lang])}</button>
        ${ratingHtml(p)}
        ${sizesHtml(p, si, 'size')}
        <div class="pfoot"><div>${priceHtml(p, si)}${stockHtml(p, si)}</div>${actionHtml(p, si)}</div>
      </div>`;
  }
  function pcard(p, si) { if (si == null) si = firstInStock(p); return `<article class="card card-clickable pcard" style="${hue(p)}" data-id="${p.id}" data-si="${si}">${pcardInner(p, si)}</article>`; }

  /* ---------- cart ---------- */
  function addToCart(id, si, q, quiet) {
    const p = BZ.byId[id]; const stock = BZ.stockOf(p, si); const k = keyOf(id, si);
    const l = cart.find((x) => x.k === k); const have = l ? l.q : 0;
    if (have + q > stock) { if (!quiet) toast(L('onlyLeft', stock)); return false; }
    if (l) l.q += q; else cart.push({ k, id, si, q });
    persist(); return true;
  }
  function addMany(items) {
    let n = 0; items.forEach(([id, si, q]) => { if (BZ.byId[id] && addToCart(id, si, q, true)) n += q; });
    toast(n ? L('added') + ' · ' + L('itemsN', n) : L('soldOut'));
    if (n) openDrawer();
  }
  function applyCoupon(code) {
    code = String(code || '').trim().toUpperCase();
    if (!BZ.coupons[code]) { toast(L('couponBad')); return; }
    coupon = code; BZ.save('bz_coupon', coupon); toast(L('couponOk', code)); persist();
  }
  function couponHtml() {
    const T = totals();
    if (coupon) return `<div class="cpn on"><span>🏷️ ${esc(coupon)}${T.coupon ? ' · −' + esc(M(T.disc || 0)) : ''}${T.couponMin ? `<br><small>${esc(L('couponMin', BZ.moneyShort(T.couponMin, lang)))}</small>` : ''}</span><button type="button" data-act="coupon-rm">${esc(L('removeCoupon'))}</button></div>`;
    return `<form class="cpn" data-cpn><input type="text" name="code" placeholder="${esc(L('couponPh'))}" aria-label="${esc(L('coupon'))}"><button class="btn sm" type="submit">${esc(L('apply'))}</button></form>`;
  }
  function totalsHtml(T) {
    return `<div class="tot"><span class="muted">${esc(L('subtotal'))}</span><span>${esc(M(T.sub))}</span></div>
      ${T.saved > 0.004 ? `<div class="tot saved"><span>${esc(L('youSave', M(T.saved)))}</span><span></span></div>` : ''}
      ${T.disc ? `<div class="tot saved"><span>${esc(L('discount'))} (${esc(T.coupon)})</span><span>−${esc(M(T.disc))}</span></div>` : ''}
      <div class="tot"><span class="muted">${esc(L('delivery'))}</span><span>${T.fee ? esc(M(T.fee)) : esc(L('free'))}</span></div>
      <div class="tot big"><span>${esc(L('total'))}</span><span>${esc(M(T.total))}</span></div>`;
  }
  function lineHtml(p, l, price) {
    return `<div class="line"><div class="th" style="${hue(p)}"><img src="${p.img}" alt=""></div>
      <div><div class="nm">${esc(p.name[lang])}</div><div class="meta">${esc(BZ.qtyLabel(p, l.si, lang))} · ${esc(M(price))}</div>
      <div class="ctl"><div class="stepper"><button type="button" data-act="dec" data-k="${l.k}" aria-label="−">−</button><span>${l.q}</span><button type="button" data-act="inc" data-k="${l.k}" aria-label="+">+</button></div>
      <button type="button" class="rm" data-act="rm" data-k="${l.k}">${esc(L('remove'))}</button></div></div>
      <div class="price">${esc(M(price * l.q))}</div></div>`;
  }
  function renderDrawer() {
    const T = totals(); const d = $('#drawer');
    const lines = cart.map((l) => lineHtml(BZ.byId[l.id], l, BZ.priceOf(BZ.byId[l.id], l.si))).join('');
    const pct = Math.min(100, (T.sub / BZ.FREE) * 100); const below = T.sub < BZ.MIN;
    d.innerHTML = `<div class="dr-head"><h3>${esc(L('cartTitle'))} <span class="meta">${esc(L('itemsN', T.count))}</span></h3><button type="button" class="icon-btn" data-act="close" aria-label="Close">✕</button></div>
      <div class="dr-body">${cart.length ? lines : `<div class="empty">${esc(L('empty'))}<br><br><a class="btn" href="#/shop" data-act="close">${esc(L('continue'))}</a></div>`}</div>
      ${cart.length ? `<div class="dr-foot">
        <div class="prog"><i style="width:${pct}%"></i></div>
        <div class="meta">${esc(T.fee === 0 && T.sub >= BZ.FREE ? L('freeUnlocked') : L('toFree', M(BZ.FREE - T.sub)))}</div>
        ${couponHtml()}
        ${totalsHtml(T)}
        ${below ? `<div class="meta" style="color:rgb(var(--c-warn))">${esc(L('minOrder', BZ.moneyShort(BZ.MIN, lang)))}</div>` : ''}
        <a class="btn btn-primary block" href="#/checkout" data-act="close"${below ? ' aria-disabled="true" style="opacity:.4;pointer-events:none"' : ''}>${esc(L('checkout'))} · ${esc(M(T.total))}</a>
      </div>` : ''}`;
  }
  function openDrawer() { renderDrawer(); openEl($('#drawer')); }

  /* ---------- product modal ---------- */
  let pmS = { id: null, si: 0, q: 1 };
  function renderPM() {
    const p = BZ.byId[pmS.id]; if (!p) return;
    const si = pmS.si; const stock = BZ.stockOf(p, si); const c = catOf(p.cat);
    if (pmS.q > Math.max(stock, 1)) pmS.q = Math.max(stock, 1);
    const ing = p.ing ? p.ing[lang] : p.name[lang];
    const al = p.a ? p.a.map((k) => BZ.allergens[k][lang]).join(', ') : L('none');
    const others = BZ.products.filter((x) => x.cat === p.cat && x.id !== p.id && BZ.stockOf(x, firstInStock(x)) > 0).slice(0, 3);
    $('#pm').innerHTML = `<button type="button" class="icon-btn x" data-act="close" aria-label="Close">✕</button>
      <div class="pm"><div class="big" style="${hue(p)}"><img src="${p.img}" alt=""><span class="tags">${tagsHtml(p)}</span></div>
      <div class="info"><div class="label-mono">${esc(c[lang])}</div><h2>${esc(p.name[lang])}</h2>${ratingHtml(p)}<p class="muted">${esc(p.d[lang])}</p>
        ${sizesHtml(p, si, 'pm-size')}
        <div>${priceHtml(p, si, true)}<div>${stockHtml(p, si)}</div></div>
        <div class="buy-row">
          <div class="stepper"><button type="button" data-act="pm-dec" aria-label="−">−</button><span>${pmS.q}</span><button type="button" data-act="pm-inc" aria-label="+">+</button></div>
          <button type="button" class="btn btn-primary" data-act="pm-add"${stock <= 0 ? ' disabled' : ''}>${esc(stock <= 0 ? L('soldOut') : L('addToCart'))}</button>
          <button type="button" class="btn btn-buy" data-act="pm-buy"${stock <= 0 ? ' disabled' : ''}>⚡ ${esc(L('buyNow'))}</button>
        </div>
        <div class="label-mono" style="margin-top:6px">${esc(L('details'))}</div>
        <dl><dt>${esc(L('ingredients'))}</dt><dd>${esc(ing)}</dd><dt>${esc(L('allergens'))}</dt><dd>${esc(al)}</dd><dt>${esc(L('origin'))}</dt><dd>${esc(p.o ? p.o[lang] : '')}</dd><dt>${esc(L('storage'))}</dt><dd>${esc(p.cold ? L('chilled') : L('ambient'))}</dd><dt>${esc(L('sku'))}</dt><dd class="mono">${esc(BZ.sku(p, si))}</dd></dl>
        ${others.length ? `<div class="label-mono">${esc(L('fbt'))}</div><div class="fbt">${others.map((o) => { const osi = firstInStock(o); return `<div class="fb"><img src="${o.img}" alt=""><div><div class="nm">${esc(o.name[lang])}</div><div class="meta">${esc(BZ.qtyLabel(o, osi, lang))} · <b>${esc(M(BZ.priceOf(o, osi)))}</b></div></div><button type="button" class="btn sm" data-act="fbt-add" data-id="${o.id}" data-si="${osi}">+ ${esc(L('add'))}</button></div>`; }).join('')}</div>` : ''}
      </div></div>`;
  }
  function openPM(id, si) { pmS = { id, si: si == null ? firstInStock(BZ.byId[id]) : si, q: 1 }; renderPM(); openEl($('#pm')); }

  /* ---------- categories ---------- */
  function renderCatbar(active) {
    $('#catbar').innerHTML = `<a href="#/shop" class="${active === '' ? 'on' : ''}">${esc(L('all'))}</a>` +
      BZ.cats.map((c) => `<a href="#/shop?cat=${c.id}" style="--h:${c.h}" class="${active === c.id ? 'on' : ''}">${c.e} ${esc(c[lang])}</a>`).join('');
  }

  /* ---------- home ---------- */
  let slide = 0, slideTimer = null;
  function renderCarousel() {
    $('#slides').innerHTML = BZ.banners.map((s, i) => { const t = s[lang]; return `<div class="slide${i === slide ? ' on' : ''}" style="--theme:${s.theme}"><img src="${s.img}" alt="" ${i ? 'loading="lazy"' : ''}><div class="sl-in"><div class="label-mono">${esc(t.k)}</div><h2>${esc(t.t)}</h2><p>${esc(t.s)}</p>${s.link === 'wa' ? `<button type="button" class="btn btn-primary" data-act="wa">${esc(t.c)}</button>` : `<a class="btn btn-primary" href="${s.link}">${esc(t.c)}</a>`}</div></div>`; }).join('');
    $('#dots').innerHTML = BZ.banners.map((_, i) => `<button type="button" class="${i === slide ? 'on' : ''}" data-act="dot" data-i="${i}" aria-label="${i + 1}"></button>`).join('');
  }
  function goSlide(i) {
    slide = (i + BZ.banners.length) % BZ.banners.length;
    $$('#slides .slide').forEach((s, j) => s.classList.toggle('on', j === slide));
    $$('#dots button').forEach((d, j) => d.classList.toggle('on', j === slide));
  }
  function startCarousel() { clearInterval(slideTimer); slideTimer = setInterval(() => goSlide(slide + 1), 5000); }
  // deals end at midnight
  function tick() {
    const el = $('#timer'); if (!el) return;
    const now = new Date(); const end = new Date(now); end.setHours(24, 0, 0, 0); const s = Math.max(0, Math.floor((end - now) / 1000));
    el.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  }
  setInterval(tick, 1000);
  function comboHtml(b) {
    const items = b.items.map(([id, si, q]) => ({ p: BZ.byId[id], si, q }));
    const price = items.reduce((a, x) => a + BZ.priceOf(x.p, x.si) * x.q, 0); const list = items.reduce((a, x) => a + BZ.listPrice(x.p, x.si) * x.q, 0);
    return `<div class="card combo"><div class="cimgs">${items.slice(0, 4).map((x) => `<img src="${x.p.img}" alt="" loading="lazy">`).join('')}</div>
      <div class="cbody"><h3>${esc(b[lang])}</h3><div class="meta">${items.map((x) => esc(x.p.name[lang]) + ' ' + esc(BZ.qtyLabel(x.p, x.si, lang)) + (x.q > 1 ? ' ×' + x.q : '')).join(' · ')}</div>
      <div class="pr"><span class="price">${esc(M(price))}</span>${list - price > 0.004 ? `<s class="was">${esc(M(list))}</s><span class="save">${esc(L('comboSave', M(list - price)))}</span>` : ''}</div>
      <button type="button" class="btn btn-primary sm" data-act="combo" data-b="${b.id}">${esc(L('addCombo'))}</button></div></div>`;
  }
  function renderHome() {
    $('#catStrip').innerHTML = BZ.cats.map((c) => `<a href="#/shop?cat=${c.id}" style="--h:${c.h}"><img src="${c.img}" alt=""><span>${esc(c[lang])}</span></a>`).join('');
    renderCarousel(); startCarousel(); tick();
    $('#dealGrid').innerHTML = BZ.products.filter((p) => p.deal).sort((a, b) => b.deal - a.deal).map((p) => pcard(p)).join('');
    const mine = BZ.orders().filter((o) => !o.seed)[0];
    $('#buyAgainSec').hidden = !mine;
    if (mine) { $('#reorderBtn').dataset.id = mine.id; $('#buyAgainGrid').innerHTML = mine.items.filter((l) => BZ.byId[l.id]).map((l) => pcard(BZ.byId[l.id], l.si)).join(''); }
    $('#combos').innerHTML = BZ.bundles.map(comboHtml).join('');
    $('#catGrid').innerHTML = BZ.cats.map((c) => {
      const n = BZ.products.filter((p) => p.cat === c.id).length;
      return `<a class="card card-clickable cat-card" style="--h:${c.h}" href="#/shop?cat=${c.id}"><span class="em">${c.e}</span><span class="nm">${esc(c[lang])}</span><span class="meta">${n} ${esc(L('products'))}</span></a>`;
    }).join('');
    $('#bestGrid').innerHTML = BZ.products.filter((p) => p.best).slice(0, 10).map((p) => pcard(p)).join('');
  }

  /* ---------- search suggestions ---------- */
  function renderSug() {
    const q = $('#q').value.trim().toLowerCase(); const box = $('#sug');
    if (q.length < 2) { box.hidden = true; return; }
    const cats = BZ.cats.filter((c) => c[lang].toLowerCase().includes(q)).slice(0, 3);
    const prods = BZ.products.filter((p) => p.name.en.toLowerCase().includes(q) || p.name.de.toLowerCase().includes(q)).slice(0, 6);
    if (!cats.length && !prods.length) { box.hidden = true; return; }
    box.innerHTML = (cats.length ? `<div class="sg">${esc(L('sugCats'))}</div>` + cats.map((c) => `<a class="si" href="#/shop?cat=${c.id}">${c.e} <span>${esc(c[lang])}</span></a>`).join('') : '') +
      (prods.length ? `<div class="sg">${esc(L('sugProds'))}</div>` + prods.map((p) => `<button type="button" class="si" data-act="sug-open" data-id="${p.id}"><img src="${p.img}" alt=""><span>${esc(p.name[lang])}</span><b>${esc(M(BZ.priceOf(p, firstInStock(p))))}</b></button>`).join('') : '');
    box.hidden = false;
  }

  /* ---------- shop ---------- */
  let shopS = { cat: '', q: '', diet: '', sort: 'feat', stock: false, deals: false };
  function shopFromParams(params) {
    shopS = { cat: params.get('cat') || '', q: (params.get('q') || '').trim(), diet: params.get('diet') || '', sort: params.get('sort') || 'feat', stock: params.get('stock') === '1', deals: params.get('deals') === '1' };
  }
  function shopSync() {
    const p = new URLSearchParams();
    if (shopS.cat) p.set('cat', shopS.cat); if (shopS.q) p.set('q', shopS.q); if (shopS.diet) p.set('diet', shopS.diet);
    if (shopS.sort !== 'feat') p.set('sort', shopS.sort); if (shopS.stock) p.set('stock', '1'); if (shopS.deals) p.set('deals', '1');
    const qs = p.toString(); history.replaceState(null, '', '#/shop' + (qs ? '?' + qs : ''));
    renderCatbar(shopS.cat);
  }
  function shopTitle() { const S = shopS; return S.cat ? catOf(S.cat)[lang] : S.q ? `“${S.q}”` : S.deals ? L('deals') : L('all'); }
  function renderShop() {
    const S = shopS;
    $('#shopTitle').textContent = shopTitle();
    $('#filters').innerHTML = `
      <label><span class="label-mono">${esc(L('filterCat'))}</span><select data-f="cat"><option value="">${esc(L('all'))}</option>${BZ.cats.map((x) => `<option value="${x.id}"${S.cat === x.id ? ' selected' : ''}>${esc(x[lang])}</option>`).join('')}</select></label>
      <label><span class="label-mono">${esc(L('filterDiet'))}</span><select data-f="diet"><option value="">${esc(L('anyDiet'))}</option><option value="veg"${S.diet === 'veg' ? ' selected' : ''}>${esc(L('veg'))}</option><option value="vegan"${S.diet === 'vegan' ? ' selected' : ''}>${esc(L('vegan'))}</option></select></label>
      <label><span class="label-mono">${esc(L('sort'))}</span><select data-f="sort">${[['feat', 'sFeat'], ['low', 'sLow'], ['high', 'sHigh'], ['name', 'sName']].map(([v, k]) => `<option value="${v}"${S.sort === v ? ' selected' : ''}>${esc(L(k))}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" data-f="deals"${S.deals ? ' checked' : ''}> 🔥 ${esc(L('onlyDeals'))}</label>
      <label class="chk"><input type="checkbox" data-f="stock"${S.stock ? ' checked' : ''}> ${esc(L('stockOnly'))}</label>
      <button type="button" class="btn sm" data-act="clear">${esc(L('clear'))}</button>`;
    renderShopGrid();
  }
  function renderShopGrid() {
    const S = shopS; const q = S.q.toLowerCase();
    const list = BZ.products.filter((p) => (!S.cat || p.cat === S.cat) &&
      (!S.diet || (S.diet === 'vegan' ? p.diet === 'vegan' : true)) &&
      (!S.deals || p.deal) &&
      (!q || p.name.en.toLowerCase().includes(q) || p.name.de.toLowerCase().includes(q) || p.id.includes(q)) &&
      (!S.stock || p.sizes.some((_, i) => BZ.stockOf(p, i) > 0)));
    const minP = (p) => Math.min(...p.sizes.map((_, i) => BZ.priceOf(p, i)));
    if (S.sort === 'low') list.sort((a, b) => minP(a) - minP(b));
    else if (S.sort === 'high') list.sort((a, b) => minP(b) - minP(a));
    else if (S.sort === 'name') list.sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang));
    else list.sort((a, b) => (b.best || 0) - (a.best || 0) || (b.deal || 0) - (a.deal || 0) || a.n - b.n);
    $('#shopCount').textContent = L('results', list.length) + ' · ' + BZ.skuCount() + ' SKUs (demo)';
    $('#shopGrid').innerHTML = list.length ? list.map((p) => pcard(p)).join('') : `<div class="empty" style="grid-column:1/-1">${esc(L('noResults'))}</div>`;
  }

  /* ---------- checkout ---------- */
  let co = { day: null, win: null, pay: 'paypal' };
  function summaryHtml() {
    const T = totals();
    const lines = cart.map((l) => { const p = BZ.byId[l.id]; return `<div class="line"><div class="th" style="${hue(p)}"><img src="${p.img}" alt=""></div><div><div class="nm">${esc(p.name[lang])}</div><div class="meta">${esc(BZ.qtyLabel(p, l.si, lang))} × ${l.q}</div></div><div class="price" style="font-size:14px">${esc(M(BZ.priceOf(p, l.si) * l.q))}</div></div>`; }).join('');
    return `<h3>${esc(L('summary'))}</h3>${lines}<div class="tots">${couponHtml()}${totalsHtml(T)}
      <div class="note">${[7, 19].filter((r) => T.vat[r] > 0.004).map((r) => esc(L('vatLine', r)) + ': ' + esc(M(T.vat[r]))).join(' · ')}</div></div>`;
  }
  function renderCheckout() {
    const v = $('#view-checkout');
    if (!cart.length) { v.innerHTML = `<div class="empty" style="padding:80px 0">${esc(L('empty'))}<br><br><a class="btn btn-primary" href="#/shop">${esc(L('continue'))}</a></div>`; return; }
    const days = BZ.days(4); if (!co.day || !days.includes(co.day)) { co.day = days[0]; co.win = null; }
    const plz = BZ.load('bz_plz', '');
    const pays = [['paypal', 'pPaypal'], ['card', 'pCard'], ['sepa', 'pSepa'], ['klarna', 'pKlarna'], ['apple', 'pApple']];
    v.innerHTML = `<form class="co" id="coForm" novalidate>
      <div>
        <h1 class="page-title" style="margin-bottom:20px">${esc(L('coTitle'))}</h1>
        <div class="label-mono" style="margin-bottom:6px">${esc(L('expressNote'))}</div>
        <div class="express"><button type="button" class="xbtn black" data-act="express">Apple Pay</button><button type="button" class="xbtn white" data-act="express">Google Pay</button><button type="button" class="xbtn paypal" data-act="express">PayPal</button></div>
        <div class="divider">${esc(L('or'))}</div>
        <fieldset><legend>${esc(L('contact'))}</legend>
          <label class="fld"><span class="label-mono">${esc(L('email'))}</span><input type="email" name="email" required autocomplete="email" placeholder="name@example.com"></label>
          <label class="fld"><span class="label-mono">${esc(L('phone'))}</span><input type="tel" name="phone" autocomplete="tel" placeholder="+49 151 2345678"></label>
          <label class="chk"><input type="checkbox" name="wa" checked> <span>${esc(L('waOpt'))}</span></label>
        </fieldset>
        <fieldset><legend>${esc(L('address'))}</legend>
          <label class="fld"><span class="label-mono">${esc(L('name'))}</span><input type="text" name="name" required autocomplete="name"></label>
          <label class="fld"><span class="label-mono">${esc(L('street'))}</span><input type="text" name="street" required autocomplete="street-address"></label>
          <div class="plzrow"><label class="fld"><span class="label-mono">${esc(L('plz'))}</span><input type="text" name="plz" required inputmode="numeric" maxlength="5" pattern="[0-9]{5}" autocomplete="postal-code" value="${esc(plz)}"></label>
          <label class="fld"><span class="label-mono">${esc(L('city'))}</span><input type="text" name="city" required autocomplete="address-level2" value="${esc(BZ.cities[plz] || '')}"></label></div>
        </fieldset>
        <fieldset><legend>${esc(L('slot'))}</legend>
          <div class="daytabs" id="dayTabs">${days.map((d) => `<button type="button" class="${d === co.day ? 'on' : ''}" data-act="day" data-d="${d}">${esc(BZ.dayLabel(d, lang))}</button>`).join('')}</div>
          <div class="wins" id="wins">${winsHtml()}</div>
        </fieldset>
        <fieldset><legend>${esc(L('payment'))}</legend>
          <div class="pay">${pays.map(([id, k]) => `<label><input type="radio" name="pay" value="${id}"${co.pay === id ? ' checked' : ''}><span>${esc(L(k))}</span></label>`).join('')}</div>
          <p class="note" style="margin-top:8px">${esc(L('payNote'))}</p>
        </fieldset>
        <label class="terms"><input type="checkbox" name="terms" required> <span>${esc(L('terms'))}</span></label>
        <button type="submit" class="btn btn-primary block">${esc(L('place'))}</button>
      </div>
      <aside class="card sum" id="sum">${summaryHtml()}</aside></form>`;
  }
  function winsHtml() {
    return BZ.windows.map((w) => {
      const left = BZ.slotLeft(co.day, w);
      return `<button type="button" class="win${co.win === w ? ' on' : ''}" data-act="win" data-w="${w}"${left === 0 ? ' disabled' : ''}><b>${w}</b><small>${esc(left === 0 ? L('full') : (left <= 4 ? L('fewLeft', left) : L('inStock')))}</small></button>`;
    }).join('');
  }
  const PAYNAME = { paypal: 'PayPal', card: 'Card', sepa: 'SEPA', klarna: 'Klarna', apple: 'Apple Pay' };
  function placeOrder(form) {
    const T = totals();
    if (T.sub < BZ.MIN) { toast(L('minOrder', BZ.moneyShort(BZ.MIN, lang))); return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!co.win) { toast(L('slot')); $('#wins').scrollIntoView({ block: 'center' }); return; }
    const f = new FormData(form);
    if (f.get('wa') && !String(f.get('phone') || '').trim()) { toast(L('phone')); form.phone.focus(); return; }
    for (const l of cart) { if (BZ.stockOf(BZ.byId[l.id], l.si) < l.q) { toast(L('onlyLeft', BZ.stockOf(BZ.byId[l.id], l.si))); return; } }
    const nums = BZ.orders().map((o) => parseInt(o.id.slice(3), 10)); const id = 'BZ-' + (Math.max(1042, ...nums) + 1);
    const order = { id, ts: Date.now(), name: f.get('name').trim(), email: f.get('email').trim(), phone: String(f.get('phone') || '').trim(), street: f.get('street').trim(), plz: f.get('plz'), city: f.get('city').trim(), day: co.day, win: co.win,
      items: cart.map((l) => ({ id: l.id, si: l.si, q: l.q, p: BZ.priceOf(BZ.byId[l.id], l.si) })), sub: T.sub, disc: T.disc, coupon: T.coupon, fee: T.fee, total: T.total, status: 'new', pay: PAYNAME[f.get('pay')] || 'PayPal', wa: !!f.get('wa') };
    cart.forEach((l) => { const p = BZ.byId[l.id]; BZ.setOvr(BZ.sku(p, l.si), { stock: Math.max(0, BZ.stockOf(p, l.si) - l.q) }); });
    BZ.saveOrders([order].concat(BZ.orders()));
    BZ.save('bz_plz', order.plz); plzChecked = order.plz;
    cart = []; coupon = ''; BZ.save('bz_coupon', ''); co = { day: null, win: null, pay: 'paypal' };
    location.hash = '#/order/' + id; persist();
  }

  /* ---------- order page ---------- */
  function renderOrder(id) {
    const v = $('#view-order'); const o = BZ.orders().find((x) => x.id === id);
    if (!o) { v.innerHTML = `<div class="empty" style="padding:80px 0">—<br><br><a class="btn" href="#/shop">${esc(L('back'))}</a></div>`; return; }
    const si = BZ.STATUS.indexOf(o.status);
    const items = o.items.map((l) => { const p = BZ.byId[l.id]; const price = l.p != null ? l.p : BZ.priceOf(p, l.si); return `<div class="line"><div class="th" style="${hue(p)}"><img src="${p.img}" alt=""></div><div><div class="nm">${esc(p.name[lang])}</div><div class="meta">${esc(BZ.qtyLabel(p, l.si, lang))} × ${l.q}</div></div><div class="price" style="font-size:14px">${esc(M(price * l.q))}</div></div>`; }).join('');
    v.innerHTML = `<div class="ord">
      <div class="label-mono">${esc(L('orderNo'))} · ${esc(o.id)}</div>
      <h1 class="page-title" style="margin:10px 0 4px">${esc(L('thanks', o.name.split(' ')[0]))}</h1>
      <div class="timeline">${BZ.STATUS.map((s, i) => `<div class="tl${i <= si ? ' done' : ''}">${esc(L('st')[s])}</div>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${si < 3 ? `<button type="button" class="btn sm" data-act="advance" data-id="${esc(o.id)}">${esc(L('advance'))}</button>` : ''}<button type="button" class="btn sm" data-act="reorder" data-id="${esc(o.id)}">🔁 ${esc(L('buyAgain'))}</button></div>
      <dl class="kv" style="margin:24px 0"><dt>${esc(L('confirmedFor'))}</dt><dd>${esc(BZ.dayLabel(o.day, lang))}, ${esc(o.win)}</dd>
        <dt>${esc(L('address'))}</dt><dd>${esc(o.name)}, ${esc(o.street)}, ${esc(o.plz)} ${esc(o.city)}</dd>
        <dt>${esc(L('paidVia'))}</dt><dd>${esc(o.pay)}</dd>${o.disc ? `<dt>${esc(L('discount'))}</dt><dd>${esc(o.coupon)} · −${esc(M(o.disc))}</dd>` : ''}<dt>${esc(L('total'))}</dt><dd><b>${esc(M(o.total))}</b> <span class="meta">${esc(L('vatIncl'))}</span></dd></dl>
      <div class="card" style="padding:4px 18px;margin-bottom:24px">${items}</div>
      ${o.wa ? `<div class="label-mono" style="margin-bottom:8px">${esc(L('waPreview'))}</div><div class="card wa-prev" style="padding:14px"><div class="msg biz" style="max-width:100%;animation:none">${esc(L('waConf', o.id, BZ.dayLabel(o.day, lang), o.win))}</div></div>` : ''}
      <p style="margin-top:28px"><a class="btn" href="#/shop">${esc(L('back'))}</a> <a class="btn" href="admin.html">Admin preview →</a></p></div>`;
  }

  /* ---------- WhatsApp mock-up ---------- */
  let waShown = 0;
  function waMsgHtml(m) {
    const [type, body] = m;
    if (type === 'cat') return `<div class="msg biz">${body.map((r) => { const [a, b] = r.split('|'); return `<div class="cr"><span>${esc(a)}</span><b>${esc(b)}</b></div>`; }).join('')}</div>`;
    if (type === 'link') return `<div class="msg biz"><div class="meta" style="margin-bottom:2px">${esc(body[1])}</div><div class="lk">${esc(body[0])} →</div></div>`;
    return `<div class="msg ${type}">${esc(body)}</div>`;
  }
  function renderWA() {
    const msgs = L('waM'); const done = waShown >= msgs.length;
    $('#waModal').innerHTML = `<button type="button" class="icon-btn x" data-act="close" aria-label="Close">✕</button>
      <div class="wa"><div class="side"><div class="label-mono">WhatsApp</div><h2>${esc(L('waTitle'))}</h2>
        <p class="muted">${esc(L('h1'))} ${esc(L('h2'))}</p>
        <div style="display:flex;gap:8px"><button type="button" class="btn btn-primary" data-act="wa-next"${done ? ' disabled' : ''}>${esc(done ? L('waDone') : L('waNext'))}</button><button type="button" class="btn" data-act="wa-restart">${esc(L('waRestart'))}</button></div>
        <p class="note">${esc(L('waNote'))}</p></div>
      <div class="phone"><div class="ph-head"><div class="av">B</div><div><div style="font-weight:600;font-size:14px">${esc(L('waName'))}</div><div class="meta">${esc(L('waSub'))}</div></div></div>
      <div class="chat" id="chat">${msgs.slice(0, waShown).map(waMsgHtml).join('')}</div></div></div>`;
    const ch = $('#chat'); if (ch) ch.scrollTop = ch.scrollHeight;
  }
  function waAdvance() { if (waShown < L('waM').length) { waShown++; renderWA(); } else { clearInterval(waTimer); waTimer = null; } }
  function openWA() {
    waShown = 0; renderWA(); openEl($('#waModal'));
    clearInterval(waTimer); waTimer = setInterval(waAdvance, 1300); setTimeout(waAdvance, 250);
  }

  /* ---------- routing ---------- */
  function parseHash() { const h = location.hash.replace(/^#/, '') || '/'; const [path, qs] = h.split('?'); return { path, params: new URLSearchParams(qs || '') }; }
  let current = 'home';
  function renderView() {
    const { path, params } = parseHash();
    $$('main > section').forEach((s) => (s.hidden = true));
    let view = 'home';
    if (path === '/shop') view = 'shop'; else if (path === '/checkout') view = 'checkout'; else if (path.startsWith('/order/')) view = 'order';
    current = view; $('#view-' + view).hidden = false;
    clearInterval(slideTimer);
    renderCatbar(view === 'shop' ? (params.get('cat') || '') : null); $('#catbar').hidden = view === 'home';
    if (view === 'home') renderHome();
    else if (view === 'shop') { shopFromParams(params); renderShop(); $('#q').value = shopS.q; }
    else if (view === 'checkout') renderCheckout();
    else renderOrder(decodeURIComponent(path.slice(7)));
  }
  function route() { closeAll(); $('#sug').hidden = true; renderView(); window.scrollTo(0, 0); }
  function renderAll() {
    applyStatic(); renderBadge(); renderView();
    if ($('#drawer').classList.contains('on')) renderDrawer();
    if ($('#pm').classList.contains('on')) renderPM();
    if ($('#waModal').classList.contains('on')) renderWA();
  }
  window.addEventListener('hashchange', route);

  /* ---------- events ---------- */
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); $('#sug').hidden = true; const q = $('#q').value.trim(); location.hash = '#/shop' + (q ? '?q=' + encodeURIComponent(q) : ''); if (current === 'shop') route(); });
  $('#q').addEventListener('input', renderSug);
  $('#q').addEventListener('focus', renderSug);
  $('#cartBtn').addEventListener('click', openDrawer);
  $('#cartbar').addEventListener('click', openDrawer);
  $('#waBtn').addEventListener('click', openWA);
  $('#plzBtn').addEventListener('click', () => { if (current !== 'home') location.hash = '#/'; setTimeout(() => { const i = $('#plzIn'); i.scrollIntoView({ block: 'center', behavior: 'smooth' }); i.focus(); }, 50); });
  $('#plzForm').addEventListener('submit', (e) => {
    e.preventDefault(); const v = $('#plzIn').value.trim(); const res = $('#plzRes');
    if (!/^\d{5}$/.test(v)) { res.className = 'res bad'; res.textContent = L('plzBad'); return; }
    BZ.save('bz_plz', v); plzChecked = v; showPlz();
  });
  document.addEventListener('change', (e) => {
    const f = e.target.dataset && e.target.dataset.f;
    if (f) { shopS[f] = (f === 'stock' || f === 'deals') ? e.target.checked : e.target.value; shopSync(); $('#shopTitle').textContent = shopTitle(); renderShopGrid(); }
    if (e.target.name === 'pay') co.pay = e.target.value;
  });
  document.addEventListener('input', (e) => {
    if (e.target.name === 'plz' && e.target.form && e.target.form.id === 'coForm') { const c = BZ.cities[e.target.value]; if (c && !e.target.form.city.value) e.target.form.city.value = c; }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'coForm') { e.preventDefault(); placeOrder(e.target); }
    else if (e.target.matches('[data-cpn]')) { e.preventDefault(); applyCoupon(e.target.code.value); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) $('#sug').hidden = true;
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act; const card = b.closest('.pcard');
    if (act === 'close') { closeAll(); return; }
    if (act === 'wa') { openWA(); return; }
    if (act === 'size' && card) { card.dataset.si = b.dataset.si; card.innerHTML = pcardInner(BZ.byId[card.dataset.id], +b.dataset.si); return; }
    if (act === 'open' && card) { openPM(card.dataset.id, +card.dataset.si); return; }
    if (act === 'sug-open') { $('#sug').hidden = true; openPM(b.dataset.id); return; }
    if (act === 'add' && card) {
      const id = card.dataset.id; const si = +card.dataset.si;
      if (addToCart(id, si, 1)) toast(L('added') + ': ' + BZ.byId[id].name[lang]);
      return;
    }
    if (act === 'fbt-add') { if (addToCart(b.dataset.id, +b.dataset.si, 1)) toast(L('added') + ': ' + BZ.byId[b.dataset.id].name[lang]); return; }
    if (act === 'combo') { const bd = BZ.bundles.find((x) => x.id === b.dataset.b); if (bd) addMany(bd.items); return; }
    if (act === 'reorder') { const o = BZ.orders().find((x) => x.id === b.dataset.id); if (o) addMany(o.items.map((l) => [l.id, l.si, l.q])); return; }
    if (act === 'inc' || act === 'dec' || act === 'rm') {
      const l = cart.find((x) => x.k === b.dataset.k); if (!l) return;
      if (act === 'inc') { if (l.q + 1 > BZ.stockOf(BZ.byId[l.id], l.si)) { toast(L('onlyLeft', BZ.stockOf(BZ.byId[l.id], l.si))); return; } l.q++; }
      else if (act === 'dec') l.q--;
      else l.q = 0;
      cart = cart.filter((x) => x.q > 0); persist();
      return;
    }
    if (act === 'coupon-rm') { coupon = ''; BZ.save('bz_coupon', ''); persist(); return; }
    if (act === 'pm-size') { pmS.si = +b.dataset.si; pmS.q = 1; renderPM(); return; }
    if (act === 'pm-inc') { pmS.q = Math.min(pmS.q + 1, Math.max(1, BZ.stockOf(BZ.byId[pmS.id], pmS.si))); renderPM(); return; }
    if (act === 'pm-dec') { pmS.q = Math.max(1, pmS.q - 1); renderPM(); return; }
    if (act === 'pm-add') { if (addToCart(pmS.id, pmS.si, pmS.q)) { toast(L('added')); openDrawer(); } return; }
    if (act === 'pm-buy') { if (addToCart(pmS.id, pmS.si, pmS.q)) { closeAll(); location.hash = '#/checkout'; } return; }
    if (act === 'clear') { shopS = { cat: '', q: '', diet: '', sort: 'feat', stock: false, deals: false }; $('#q').value = ''; shopSync(); renderShop(); return; }
    if (act === 'day') { co.day = b.dataset.d; co.win = null; $$('#dayTabs button').forEach((x) => x.classList.toggle('on', x.dataset.d === co.day)); $('#wins').innerHTML = winsHtml(); return; }
    if (act === 'win') { co.win = b.dataset.w; $('#wins').innerHTML = winsHtml(); return; }
    if (act === 'express') { toast(lang === 'de' ? 'Demo: im Live-Shop schließt dies die Bestellung mit einem Tipp ab' : 'Demo: in the live shop this completes the order in one tap'); return; }
    if (act === 'advance') {
      const orders = BZ.orders(); const o = orders.find((x) => x.id === b.dataset.id);
      if (o) { o.status = BZ.STATUS[Math.min(3, BZ.STATUS.indexOf(o.status) + 1)]; BZ.saveOrders(orders); renderOrder(o.id); }
      return;
    }
    if (act === 'c-prev') { goSlide(slide - 1); startCarousel(); return; }
    if (act === 'c-next') { goSlide(slide + 1); startCarousel(); return; }
    if (act === 'dot') { goSlide(+b.dataset.i); startCarousel(); return; }
    if (act === 'wa-next') { waAdvance(); return; }
    if (act === 'wa-restart') { openWA(); return; }
  });

  /* ---------- go ---------- */
  applyStatic(); renderBadge(); route();
})();
