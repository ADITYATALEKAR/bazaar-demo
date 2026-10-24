/* Bazaar demo — admin preview. In production this role is played by the Shopify admin
   (products, stock, orders) plus a delivery planner; here it just shows what the vendor sees. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  BZ.ensureSeed();
  let lang = BZ.load('bz_lang', null) || 'en';
  let tab = 'orders'; let runDay = ''; let runWin = ''; let stockQ = ''; let stockLow = false;
  const M = (v) => BZ.money(v, lang);
  const D = {
    en: { banner: 'Admin preview · illustrative · in production this is the Shopify admin plus a delivery planner', title: 'Vendor dashboard', lede: 'What the shop owner and staff would see: incoming orders, stock and prices they can edit, and the delivery run for each time window. Orders placed in the demo shop appear here.', shop: '← Back to shop',
      tabs: { orders: 'Orders', stock: 'Inventory', runs: 'Delivery runs' },
      k: { orders: 'Open orders', today: 'Revenue (all orders)', low: 'Low-stock SKUs', skus: 'SKUs in demo' },
      th: { id: 'Order', when: 'Delivery', cust: 'Customer', plz: 'Postcode', items: 'Items', total: 'Total', pay: 'Payment', status: 'Status', wa: 'WhatsApp' },
      st: { new: 'New', packed: 'Packed', out: 'Out for delivery', delivered: 'Delivered' },
      sku: 'SKU', prod: 'Product', size: 'Size', stock: 'Stock', price: 'Price', search: 'Search product or SKU…', lowOnly: 'Low stock only (≤ 10)', saved: 'Saved', low: 'Low', out: 'Out',
      day: 'Day', win: 'Window', allWin: 'All windows', stops: 'stops', parcels: 'items', csv: 'Export stops (CSV)', noStops: 'No orders for this window.', chill: 'Contains chilled / frozen items', yes: 'Yes', no: '—',
      runNote: 'Stops are ordered by postcode as a simple example. Production would use a route-planning tool.' },
    de: { banner: 'Admin-Vorschau · illustrativ · im Echtbetrieb ist dies das Shopify-Admin plus ein Liefer-Planer', title: 'Händler-Dashboard', lede: 'Das sehen Inhaber und Mitarbeiter: eingehende Bestellungen, bearbeitbarer Bestand und Preise sowie die Lieferfahrt je Zeitfenster. Bestellungen aus dem Demo-Shop erscheinen hier.', shop: '← Zurück zum Shop',
      tabs: { orders: 'Bestellungen', stock: 'Bestand', runs: 'Lieferfahrten' },
      k: { orders: 'Offene Bestellungen', today: 'Umsatz (alle Bestellungen)', low: 'Artikel mit niedrigem Bestand', skus: 'Artikel in der Demo' },
      th: { id: 'Bestellung', when: 'Lieferung', cust: 'Kunde', plz: 'PLZ', items: 'Artikel', total: 'Summe', pay: 'Zahlung', status: 'Status', wa: 'WhatsApp' },
      st: { new: 'Neu', packed: 'Gepackt', out: 'In Zustellung', delivered: 'Geliefert' },
      sku: 'Artikelnr.', prod: 'Produkt', size: 'Größe', stock: 'Bestand', price: 'Preis', search: 'Produkt oder Artikelnr. suchen…', lowOnly: 'Nur niedriger Bestand (≤ 10)', saved: 'Gespeichert', low: 'Niedrig', out: 'Leer',
      day: 'Tag', win: 'Fenster', allWin: 'Alle Fenster', stops: 'Stopps', parcels: 'Artikel', csv: 'Stopps exportieren (CSV)', noStops: 'Keine Bestellungen für dieses Fenster.', chill: 'Enthält gekühlte / tiefgekühlte Ware', yes: 'Ja', no: '—',
      runNote: 'Die Stopps sind als einfaches Beispiel nach PLZ sortiert. Im Echtbetrieb übernimmt ein Routenplaner.' }
  };
  const T = () => D[lang];

  function setTheme(v) { if (v) document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme; }
  setTheme(BZ.load('bz_theme', null));
  $('#themeBtn').addEventListener('click', () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); const n = cur === 'dark' ? 'light' : 'dark'; setTheme(n); BZ.save('bz_theme', n); });
  $('#langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'de' : 'en'; BZ.save('bz_lang', lang); render(); });
  let tt; function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 1500); }

  const skus = () => { const out = []; BZ.products.forEach((p) => p.sizes.forEach((_, i) => out.push({ p, i, sku: BZ.sku(p, i) }))); return out; };
  const stat = (s) => `<select data-st>${BZ.STATUS.map((x) => `<option value="${x}"${x === s ? ' selected' : ''}>${esc(T().st[x])}</option>`).join('')}</select>`;
  const itemCount = (o) => o.items.reduce((a, l) => a + l.q, 0);

  function kpis() {
    const o = BZ.orders(); const open = o.filter((x) => x.status !== 'delivered').length;
    const rev = o.reduce((a, x) => a + x.total, 0); const low = skus().filter((s) => BZ.stockOf(s.p, s.i) <= 10).length;
    $('#kpis').innerHTML = [[T().k.orders, open], [T().k.today, M(rev)], [T().k.low, low], [T().k.skus, BZ.skuCount()]].map(([k, v]) => `<div class="card kpi"><div class="label-mono">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('');
  }
  function tabs() {
    $('#tabs').innerHTML = Object.keys(T().tabs).map((k) => `<button type="button" role="tab" class="${k === tab ? 'on' : ''}" data-tab="${k}">${esc(T().tabs[k])}</button>`).join('');
    ['orders', 'stock', 'runs'].forEach((k) => { $('#tab-' + k).hidden = k !== tab; });
  }
  function ordersTab() {
    const o = BZ.orders().slice().sort((a, b) => b.ts - a.ts);
    $('#tab-orders').innerHTML = `<div class="tw card"><table><thead><tr>${['id', 'when', 'cust', 'plz', 'items', 'total', 'pay', 'wa', 'status'].map((k) => `<th>${esc(T().th[k])}</th>`).join('')}</tr></thead><tbody>${o.map((x) =>
      `<tr data-oid="${esc(x.id)}"><td class="mono"><b>${esc(x.id)}</b></td><td>${esc(BZ.dayLabel(x.day, lang))}<br><span class="meta">${esc(x.win)}</span></td><td>${esc(x.name)}<br><span class="meta">${esc(x.street)}</span></td><td class="mono">${esc(x.plz)}<br><span class="meta">${esc(x.city)}</span></td><td>${itemCount(x)}</td><td>${esc(M(x.total))}</td><td>${esc(x.pay)}</td><td>${x.wa ? '<span class="tag ok">WA</span>' : esc(T().no)}</td><td>${stat(x.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function stockTab() {
    const q = stockQ.toLowerCase();
    const list = skus().filter((s) => (!q || s.p.name.en.toLowerCase().includes(q) || s.p.name.de.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q)) && (!stockLow || BZ.stockOf(s.p, s.i) <= 10));
    $('#tab-stock').innerHTML = `<div class="toolbar"><input type="search" id="sq" placeholder="${esc(T().search)}" value="${esc(stockQ)}"><label class="chk"><input type="checkbox" id="sl"${stockLow ? ' checked' : ''}> ${esc(T().lowOnly)}</label></div>
      <div class="tw card"><table><thead><tr><th>${esc(T().sku)}</th><th>${esc(T().prod)}</th><th>${esc(T().size)}</th><th>${esc(T().stock)}</th><th>${esc(T().price)} (€)</th><th></th></tr></thead><tbody>${list.map((s) => {
        const st = BZ.stockOf(s.p, s.i); const flag = st <= 0 ? `<span class="tag danger">${esc(T().out)}</span>` : st <= 10 ? `<span class="tag warn">${esc(T().low)}</span>` : '';
        return `<tr data-sku="${esc(s.sku)}"><td class="mono">${esc(s.sku)}</td><td><img src="${s.p.img}" alt="" class="tdimg"> ${esc(s.p.name[lang])}</td><td>${esc(BZ.qtyLabel(s.p, s.i, lang))}</td><td><input type="number" min="0" step="1" data-f="stock" value="${st}"></td><td><input type="number" min="0" step="0.01" data-f="price" value="${BZ.listPrice(s.p, s.i).toFixed(2)}">${s.p.deal ? ` <span class="tag off">−${s.p.deal}%</span>` : ''}</td><td>${flag}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }
  function runsTab() {
    const days = BZ.days(4); const all = BZ.orders();
    const orderDays = Array.from(new Set(all.map((o) => o.day).concat(days))).sort();
    if (!runDay || !orderDays.includes(runDay)) runDay = orderDays.includes(days[0]) ? days[0] : orderDays[0];
    const stops = all.filter((o) => o.day === runDay && (!runWin || o.win === runWin) && o.status !== 'delivered').sort((a, b) => a.win.localeCompare(b.win) || a.plz.localeCompare(b.plz));
    const chilled = (o) => o.items.some((l) => BZ.byId[l.id] && BZ.byId[l.id].cold);
    $('#tab-runs').innerHTML = `<div class="toolbar"><select id="rd" aria-label="${esc(T().day)}">${orderDays.map((d) => `<option value="${d}"${d === runDay ? ' selected' : ''}>${esc(BZ.dayLabel(d, lang))}</option>`).join('')}</select>
      <select id="rw" aria-label="${esc(T().win)}"><option value="">${esc(T().allWin)}</option>${BZ.windows.map((w) => `<option${w === runWin ? ' selected' : ''}>${w}</option>`).join('')}</select>
      <span class="meta">${stops.length} ${esc(T().stops)} · ${stops.reduce((a, o) => a + itemCount(o), 0)} ${esc(T().parcels)}</span>
      <button type="button" class="btn sm" id="csv" style="margin-left:auto"${stops.length ? '' : ' disabled'}>${esc(T().csv)}</button></div>
      <div class="card" style="padding:4px 18px">${stops.length ? stops.map((o, i) => `<div class="stop"><div class="n">${i + 1}</div><div><b>${esc(o.name)}</b> <span class="meta mono">${esc(o.id)}</span><br><span class="muted">${esc(o.street)}, ${esc(o.plz)} ${esc(o.city)}</span>${chilled(o) ? ` <span class="tag">${esc(T().chill)}</span>` : ''}</div><div style="text-align:right"><span class="mono">${esc(o.win)}</span><br><span class="meta">${itemCount(o)} ${esc(T().parcels)} · ${esc(T().st[o.status])}</span></div></div>`).join('') : `<div class="empty">${esc(T().noStops)}</div>`}</div>
      <p class="note" style="margin-top:10px">${esc(T().runNote)}</p>`;
    $('#csv') && $('#csv').addEventListener('click', () => {
      const rows = [['stop', 'order', 'name', 'street', 'postcode', 'city', 'window', 'items', 'chilled']].concat(stops.map((o, i) => [i + 1, o.id, o.name, o.street, o.plz, o.city, o.win, itemCount(o), chilled(o) ? 'yes' : 'no']));
      const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'delivery-run-' + runDay + '.csv'; a.click();
    });
    $('#rd').addEventListener('change', (e) => { runDay = e.target.value; runsTab(); });
    $('#rw').addEventListener('change', (e) => { runWin = e.target.value; runsTab(); });
  }
  function render() {
    document.documentElement.lang = lang; $('#langBtn').textContent = lang === 'en' ? 'DE' : 'EN';
    $('#banner').textContent = T().banner; $('#title').textContent = T().title; $('#lede').textContent = T().lede; $('#toShop').textContent = T().shop;
    kpis(); tabs(); ordersTab(); stockTab(); runsTab();
  }

  document.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; tabs(); if (tab === 'runs') runsTab(); } });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-st]')) { const id = t.closest('tr').dataset.oid; const o = BZ.orders(); const x = o.find((y) => y.id === id); if (x) { x.status = t.value; BZ.saveOrders(o); kpis(); toast(T().saved); } }
    else if (t.matches('[data-f]')) {
      const sku = t.closest('tr').dataset.sku; const v = parseFloat(t.value); if (isNaN(v) || v < 0) return;
      BZ.setOvr(sku, t.dataset.f === 'stock' ? { stock: Math.round(v) } : { price: Math.round(v * 100) / 100 }); kpis(); toast(T().saved);
      const s = skus().find((z) => z.sku === sku); const st = BZ.stockOf(s.p, s.i);
      t.closest('tr').lastElementChild.innerHTML = st <= 0 ? `<span class="tag danger">${esc(T().out)}</span>` : st <= 10 ? `<span class="tag warn">${esc(T().low)}</span>` : '';
    } else if (t.id === 'sl') { stockLow = t.checked; stockTab(); }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'sq') { stockQ = e.target.value; const pos = e.target.selectionStart; stockTab(); const n = $('#sq'); n.focus(); n.setSelectionRange(pos, pos); } });

  render();
})();
