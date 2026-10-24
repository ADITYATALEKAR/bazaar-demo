/* Bazaar demo — sample data, shared helpers and translations.
   Everything here is placeholder content for the client demo. */
(function () {
  const BZ = (window.BZ = {});

  /* ---------- storage helpers (safe in private windows) ---------- */
  BZ.load = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  BZ.save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ---------- business rules used in the demo ---------- */
  BZ.FREE = 50;      // free delivery from (EUR)
  BZ.FEE = 4.9;      // delivery fee below that
  BZ.MIN = 15;       // minimum order value

  /* ---------- categories ----------
     h: hue (0–360) used for the category's colour tint in the UI */
  BZ.cats = [
    { id: 'rice',   e: '🍚', h: 42,  code: 'RIC', en: 'Rice & Grains',       de: 'Reis & Getreide' },
    { id: 'dal',    e: '🥣', h: 18,  code: 'DAL', en: 'Lentils & Pulses',    de: 'Linsen & Hülsenfrüchte' },
    { id: 'flour',  e: '🌾', h: 262, code: 'FLR', en: 'Flours',              de: 'Mehle' },
    { id: 'spice',  e: '🌶️', h: 352, code: 'SPC', en: 'Spices',              de: 'Gewürze' },
    { id: 'oil',    e: '🧈', h: 72,  code: 'OIL', en: 'Oils & Ghee',         de: 'Öle & Ghee' },
    { id: 'dairy',  e: '🥛', h: 205, code: 'DRY', en: 'Dairy & Paneer',      de: 'Milch & Paneer' },
    { id: 'snack',  e: '🥜', h: 30,  code: 'SNK', en: 'Snacks',              de: 'Snacks' },
    { id: 'sweet',  e: '🍮', h: 322, code: 'SWT', en: 'Sweets',              de: 'Süßes' },
    { id: 'tea',    e: '🍵', h: 168, code: 'TEA', en: 'Tea & Drinks',        de: 'Tee & Getränke' },
    { id: 'pickle', e: '🥫', h: 286, code: 'PCK', en: 'Pickles & Sauces',    de: 'Pickles & Saucen' },
    { id: 'frozen', e: '❄️', h: 192, code: 'FRZ', en: 'Frozen',              de: 'Tiefkühl' },
    { id: 'fresh',  e: '🥬', h: 128, code: 'FSH', en: 'Fresh Vegetables',    de: 'Frisches Gemüse' }
  ];
  // one product photo stands in for each category
  const CAT_IMG = { rice: 'basmati', dal: 'toor', flour: 'atta', spice: 'turmeric', oil: 'ghee', dairy: 'paneer', snack: 'bhujia', sweet: 'gulab', tea: 'chai', pickle: 'mangopickle', frozen: 'samosa', fresh: 'okra' };
  BZ.cats.forEach((c) => { c.img = 'assets/img/' + CAT_IMG[c.id] + '.jpg'; });

  /* ---------- offers (dummy, for the demo) ---------- */
  // percentage off the list price, shown as a deal badge and strike-through price
  const DEALS = { basmati: 15, atta: 20, toor: 10, ghee: 12, paneer: 15, bhujia: 25, gulab: 20, assam: 18, mangopickle: 15, paratha: 20, sunflower: 10, chai: 30, samosa: 15, rajma: 10, makhana: 20, lassi: 10 };
  // coupon codes entered in the cart: pct = % off, off = fixed EUR off, ship = free delivery; min = minimum subtotal
  BZ.coupons = { WELCOME10: { pct: 10, min: 20 }, FREESHIP: { ship: true, min: 25 }, DIWALI5: { off: 5, min: 40 } };
  // home-page banner carousel; theme is an rgb triplet for the text overlay
  BZ.banners = [
    { img: 'assets/img/b_diwali.jpg', theme: '59 10 69', link: '#/shop?deals=1',
      en: { k: 'Festive sale', t: 'Diwali Sale: up to 30% off', s: 'Sweets, snacks, ghee and spices at festival prices. Ends Sunday.', c: 'Shop the deals' },
      de: { k: 'Festtags-Sale', t: 'Diwali-Sale: bis zu 30 % Rabatt', s: 'Süßes, Snacks, Ghee und Gewürze zu Festpreisen. Nur bis Sonntag.', c: 'Angebote ansehen' } },
    { img: 'assets/img/b_thali.jpg', theme: '0 90 70', link: '#/shop',
      en: { k: 'Delivery', t: 'Free delivery from €50', s: 'Rider delivery in 2-hour windows, from tomorrow. Chilled and frozen items stay cold.', c: 'Start shopping' },
      de: { k: 'Lieferung', t: 'Kostenlose Lieferung ab 50 €', s: 'Eigene Fahrer, 2-Stunden-Fenster ab morgen. Gekühltes bleibt kalt.', c: 'Jetzt einkaufen' } },
    { img: 'assets/img/b_spice.jpg', theme: '160 20 40', link: '#/shop?cat=spice',
      en: { k: 'New customers', t: '10% off your first order', s: 'Use code WELCOME10 at checkout on orders over €20.', c: 'Browse spices' },
      de: { k: 'Neukunden', t: '10 % auf die erste Bestellung', s: 'Code WELCOME10 an der Kasse eingeben, ab 20 € Bestellwert.', c: 'Gewürze entdecken' } },
    { img: 'assets/img/b_biryani.jpg', theme: '10 60 50', link: 'wa',
      en: { k: 'WhatsApp', t: 'Order in a chat', s: 'Browse the catalogue, build your basket and pay through a secure checkout link.', c: 'See how it works' },
      de: { k: 'WhatsApp', t: 'Im Chat bestellen', s: 'Katalog ansehen, Warenkorb füllen und über einen sicheren Link bezahlen.', c: 'So funktioniert es' } }
  ];
  // combo packs: a one-tap basket of several items
  BZ.bundles = [
    { id: 'dal', en: 'Dal Tadka kit', de: 'Dal-Tadka-Set', items: [['toor', 1, 1], ['ghee', 0, 1], ['garam', 0, 1], ['jeera', 0, 1]] },
    { id: 'chai', en: 'Chai time box', de: 'Chai-Time-Box', items: [['assam', 1, 1], ['cardamom', 0, 1], ['bhujia', 1, 1], ['soan', 0, 1]] },
    { id: 'weekly', en: 'Weekly essentials', de: 'Wochen-Grundausstattung', items: [['basmati', 1, 1], ['atta', 0, 1], ['toor', 1, 1], ['sunflower', 0, 1], ['turmeric', 0, 1]] },
    { id: 'snack', en: 'Snack night', de: 'Snack-Abend', items: [['samosa', 0, 1], ['mangopickle', 0, 1], ['murukku', 0, 1], ['mangojuice', 0, 2]] }
  ];

  BZ.allergens = {
    gluten:  { en: 'Gluten',     de: 'Gluten' },
    milk:    { en: 'Milk',       de: 'Milch' },
    peanut:  { en: 'Peanuts',    de: 'Erdnüsse' },
    mustard: { en: 'Mustard',    de: 'Senf' },
    sesame:  { en: 'Sesame',     de: 'Sesam' },
    nuts:    { en: 'Tree nuts',  de: 'Schalenfrüchte' }
  };

  /* ---------- products ----------
     sizes: [quantity in g / ml / pieces, price EUR incl. VAT]
     vat: German rate (7 % food, 19 % most drinks)  unit: kg | l | pc (base for unit price) */
  const P = (id, cat, e, name, vat, diet, unit, sizes, d, x) => ({ id, cat, e, name: { en: name[0], de: name[1] }, vat, diet, unit, sizes, d: { en: d[0], de: d[1] }, ...(x || {}) });
  const IN = { en: 'India', de: 'Indien' };
  BZ.products = [
    // Rice & grains
    P('basmati', 'rice', '🍚', ['Basmati Rice', 'Basmati-Reis'], 7, 'vegan', 'kg', [[1000, 3.99], [5000, 14.99], [10000, 27.99]], ['Long-grain aged basmati with a delicate aroma.', 'Langkorniger, gereifter Basmati mit feinem Aroma.'], { best: 1, o: IN }),
    P('sona', 'rice', '🌾', ['Sona Masoori Rice', 'Sona-Masoori-Reis'], 7, 'vegan', 'kg', [[5000, 12.99], [10000, 23.99]], ['Light medium-grain rice for everyday South Indian meals.', 'Leichter, mittelkörniger Reis für die südindische Alltagsküche.'], { o: IN }),
    P('poha', 'rice', '🥣', ['Poha (Flattened Rice)', 'Poha (Reisflocken)'], 7, 'vegan', 'kg', [[500, 2.29]], ['Flattened rice for a quick breakfast poha.', 'Reisflocken für ein schnelles Poha-Frühstück.'], { o: IN }),
    P('sooji', 'rice', '🌾', ['Semolina (Sooji)', 'Weizengrieß (Sooji)'], 7, 'vegan', 'kg', [[500, 1.79]], ['Fine semolina for upma, halwa and idli.', 'Feiner Grieß für Upma, Halwa und Idli.'], { a: ['gluten'], o: IN }),
    // Lentils & pulses
    P('toor', 'dal', '🥣', ['Toor Dal', 'Toor Dal'], 7, 'vegan', 'kg', [[500, 2.49], [1000, 4.49]], ['Split pigeon peas, the base of everyday dal.', 'Gelbe Taubenerbsen, die Basis für Dal.'], { best: 1, o: IN }),
    P('moong', 'dal', '🟢', ['Moong Dal', 'Moong Dal'], 7, 'vegan', 'kg', [[500, 2.59], [1000, 4.79]], ['Split yellow moong, quick-cooking and mild.', 'Gelbe Mungbohnen, schnell gar und mild.'], { o: IN }),
    P('chanadal', 'dal', '🟡', ['Chana Dal', 'Chana Dal'], 7, 'vegan', 'kg', [[500, 2.19], [1000, 3.99]], ['Split chickpeas for dal, snacks and sweets.', 'Geschälte Kichererbsen für Dal, Snacks und Süßes.'], { o: IN }),
    P('masoor', 'dal', '🟠', ['Red Lentils (Masoor)', 'Rote Linsen (Masoor)'], 7, 'vegan', 'kg', [[500, 1.99], [1000, 3.49]], ['Red lentils that cook in about 15 minutes.', 'Rote Linsen, in etwa 15 Minuten gar.'], { o: IN }),
    P('kabuli', 'dal', '🌰', ['Kabuli Chana (Chickpeas)', 'Kabuli Chana (Kichererbsen)'], 7, 'vegan', 'kg', [[500, 2.29], [1000, 3.99]], ['Large pale chickpeas for chana masala.', 'Große helle Kichererbsen für Chana Masala.'], { o: IN }),
    P('rajma', 'dal', '🔴', ['Rajma (Kidney Beans)', 'Rajma (Kidneybohnen)'], 7, 'vegan', 'kg', [[500, 2.69], [1000, 4.79]], ['Red kidney beans for rajma chawal.', 'Rote Kidneybohnen für Rajma Chawal.'], { o: IN }),
    // Flours
    P('atta', 'flour', '🌾', ['Whole Wheat Atta', 'Weizenvollkornmehl (Atta)'], 7, 'vegan', 'kg', [[5000, 9.99], [10000, 17.99]], ['Stone-ground whole wheat flour for roti and paratha.', 'Vollkornweizenmehl für Roti und Paratha.'], { a: ['gluten'], best: 1, o: IN }),
    P('besan', 'flour', '🌼', ['Besan (Gram Flour)', 'Besan (Kichererbsenmehl)'], 7, 'vegan', 'kg', [[500, 2.29], [1000, 3.99]], ['Gram flour for pakoras, kadhi and sweets.', 'Kichererbsenmehl für Pakoras, Kadhi und Süßes.'], { o: IN }),
    P('riceflour', 'flour', '🍚', ['Rice Flour', 'Reismehl'], 7, 'vegan', 'kg', [[500, 1.99], [1000, 3.49]], ['Fine rice flour for dosa, idli and snacks.', 'Feines Reismehl für Dosa, Idli und Snacks.'], { o: IN }),
    // Spices
    P('turmeric', 'spice', '🌼', ['Turmeric Powder', 'Kurkuma gemahlen'], 7, 'vegan', 'kg', [[100, 1.49], [200, 2.49]], ['Ground turmeric with a deep golden colour.', 'Gemahlene Kurkuma mit intensiver Farbe.'], { best: 1, o: IN }),
    P('chilli', 'spice', '🌶️', ['Red Chilli Powder', 'Chilipulver rot'], 7, 'vegan', 'kg', [[100, 1.79], [200, 2.99]], ['Hot red chilli powder.', 'Scharfes rotes Chilipulver.'], { o: IN }),
    P('jeera', 'spice', '🌰', ['Cumin Seeds (Jeera)', 'Kreuzkümmel (Jeera)'], 7, 'vegan', 'kg', [[100, 1.99], [200, 3.49]], ['Whole cumin seeds for tempering.', 'Ganzer Kreuzkümmel zum Anrösten.'], { o: IN }),
    P('coriander', 'spice', '🌿', ['Coriander Powder', 'Koriander gemahlen'], 7, 'vegan', 'kg', [[100, 1.49], [200, 2.49]], ['Ground coriander seeds, mild and citrusy.', 'Gemahlener Koriander, mild und zitronig.'], { o: IN }),
    P('garam', 'spice', '🍂', ['Garam Masala', 'Garam Masala'], 7, 'vegan', 'kg', [[100, 2.49], [200, 3.99]], ['A warming spice blend to finish curries.', 'Wärmende Gewürzmischung zum Abschmecken von Currys.'], { ing: { en: 'Coriander, cumin, black pepper, cardamom, cinnamon, clove', de: 'Koriander, Kreuzkümmel, schwarzer Pfeffer, Kardamom, Zimt, Nelke' }, o: IN }),
    P('mustardseed', 'spice', '🟤', ['Mustard Seeds', 'Senfsaat'], 7, 'vegan', 'kg', [[100, 1.49]], ['Black mustard seeds for tempering.', 'Schwarze Senfsaat zum Anrösten.'], { a: ['mustard'], o: IN }),
    P('cardamom', 'spice', '🌱', ['Green Cardamom', 'Grüner Kardamom'], 7, 'vegan', 'kg', [[50, 3.99]], ['Whole green cardamom pods for chai and sweets.', 'Ganze grüne Kardamomkapseln für Chai und Süßes.'], { o: IN }),
    // Oils & ghee
    P('ghee', 'oil', '🧈', ['Pure Ghee', 'Reines Ghee'], 7, 'veg', 'kg', [[500, 7.99], [1000, 14.99]], ['Clarified butter for cooking and finishing.', 'Butterschmalz zum Kochen und Verfeinern.'], { a: ['milk'], best: 1, o: { en: 'Germany', de: 'Deutschland' } }),
    P('sunflower', 'oil', '🧴', ['Sunflower Oil', 'Sonnenblumenöl'], 7, 'vegan', 'l', [[1000, 2.99], [5000, 12.99]], ['Neutral oil for everyday cooking.', 'Neutrales Öl für die tägliche Küche.'], { o: { en: 'EU', de: 'EU' } }),
    P('coconutoil', 'oil', '🥥', ['Coconut Oil', 'Kokosöl'], 7, 'vegan', 'l', [[500, 4.99], [1000, 8.99]], ['Refined coconut oil for South Indian dishes.', 'Raffiniertes Kokosöl für südindische Gerichte.'], { o: { en: 'Sri Lanka', de: 'Sri Lanka' } }),
    P('sesameoil', 'oil', '🧴', ['Sesame Oil', 'Sesamöl'], 7, 'vegan', 'l', [[500, 5.99]], ['Toasted sesame oil with a nutty flavour.', 'Geröstetes Sesamöl mit nussigem Aroma.'], { a: ['sesame'], o: IN }),
    // Dairy
    P('paneer', 'dairy', '🧀', ['Paneer', 'Paneer'], 7, 'veg', 'kg', [[200, 2.99], [500, 6.49]], ['Fresh Indian cheese for curries and grills.', 'Frischer indischer Käse für Currys und Grill.'], { a: ['milk'], cold: 1, best: 1, o: { en: 'Germany', de: 'Deutschland' } }),
    P('dahi', 'dairy', '🥛', ['Natural Yoghurt (Dahi)', 'Naturjoghurt (Dahi)'], 7, 'veg', 'kg', [[500, 1.89], [1000, 2.99]], ['Mild set yoghurt.', 'Milder Naturjoghurt.'], { a: ['milk'], cold: 1, o: { en: 'Germany', de: 'Deutschland' } }),
    P('lassi', 'dairy', '🥭', ['Mango Lassi', 'Mango-Lassi'], 7, 'veg', 'l', [[330, 1.99]], ['Sweet mango yoghurt drink.', 'Süßes Mango-Joghurtgetränk.'], { a: ['milk'], cold: 1, isNew: 1, ing: { en: 'Yoghurt, mango pulp, sugar', de: 'Joghurt, Mangomark, Zucker' }, o: { en: 'Germany', de: 'Deutschland' } }),
    // Snacks
    P('bhujia', 'snack', '🥨', ['Bhujia Sev', 'Bhujia Sev'], 7, 'vegan', 'kg', [[200, 1.99], [400, 3.49]], ['Crispy gram-flour noodles, a classic tea-time snack.', 'Knusprige Kichererbsen-Nudeln, ein Klassiker zum Tee.'], { ing: { en: 'Gram flour, vegetable oil, spices, salt', de: 'Kichererbsenmehl, Pflanzenöl, Gewürze, Salz' }, best: 1, o: IN }),
    P('peanuts', 'snack', '🥜', ['Masala Peanuts', 'Masala-Erdnüsse'], 7, 'vegan', 'kg', [[200, 2.29]], ['Spiced roasted peanuts.', 'Gewürzte geröstete Erdnüsse.'], { a: ['peanut'], ing: { en: 'Peanuts, gram flour, spices, salt', de: 'Erdnüsse, Kichererbsenmehl, Gewürze, Salz' }, o: IN }),
    P('papad', 'snack', '🥞', ['Papad', 'Papad'], 7, 'vegan', 'kg', [[200, 2.49]], ['Thin lentil wafers, roast or fry.', 'Dünne Linsenfladen zum Rösten oder Frittieren.'], { ing: { en: 'Lentil flour, salt, spices', de: 'Linsenmehl, Salz, Gewürze' }, o: IN }),
    P('murukku', 'snack', '🥨', ['Murukku', 'Murukku'], 7, 'vegan', 'kg', [[200, 2.29]], ['Crunchy rice and lentil spirals.', 'Knusprige Reis-Linsen-Spiralen.'], { a: ['sesame'], ing: { en: 'Rice flour, lentil flour, sesame, oil, salt', de: 'Reismehl, Linsenmehl, Sesam, Öl, Salz' }, o: IN }),
    P('makhana', 'snack', '🥜', ['Makhana (Fox Nuts)', 'Makhana (Lotussamen)'], 7, 'vegan', 'kg', [[100, 3.49]], ['Puffed lotus seeds, a light roasted snack.', 'Gepuffte Lotussamen, ein leichter, gerösteter Snack.'], { isNew: 1, o: IN }),
    // Sweets
    P('gulab', 'sweet', '🍮', ['Gulab Jamun (tin)', 'Gulab Jamun (Dose)'], 7, 'veg', 'kg', [[500, 4.99]], ['Milk-solid dumplings in rose syrup.', 'Milchklößchen in Rosensirup.'], { a: ['milk', 'gluten'], ing: { en: 'Sugar, milk solids, wheat flour, water, rose essence', de: 'Zucker, Milchfeststoffe, Weizenmehl, Wasser, Rosenaroma' }, best: 1, o: IN }),
    P('rasgulla', 'sweet', '🍮', ['Rasgulla (tin)', 'Rasgulla (Dose)'], 7, 'veg', 'kg', [[500, 4.49]], ['Soft cheese balls in light syrup.', 'Weiche Frischkäsebällchen in leichtem Sirup.'], { a: ['milk'], ing: { en: 'Sugar, milk solids, water', de: 'Zucker, Milchfeststoffe, Wasser' }, o: IN }),
    P('jaggery', 'sweet', '🍬', ['Jaggery (Gur)', 'Jaggery (Gur)'], 7, 'vegan', 'kg', [[500, 2.99]], ['Unrefined cane sugar block.', 'Unraffinierter Rohrzucker im Block.'], { o: IN }),
    P('soan', 'sweet', '🍬', ['Soan Papdi', 'Soan Papdi'], 7, 'veg', 'kg', [[250, 3.49]], ['Flaky gram-flour sweet with cardamom.', 'Blättriges Süßgebäck aus Kichererbsenmehl mit Kardamom.'], { a: ['gluten', 'milk', 'nuts'], ing: { en: 'Sugar, gram flour, wheat flour, ghee, pistachio, cardamom', de: 'Zucker, Kichererbsenmehl, Weizenmehl, Ghee, Pistazie, Kardamom' }, o: IN }),
    // Tea & drinks
    P('assam', 'tea', '🍵', ['Assam CTC Tea', 'Assam-CTC-Tee'], 7, 'vegan', 'kg', [[250, 2.79], [500, 4.99]], ['Strong Assam tea for masala chai.', 'Kräftiger Assam-Tee für Masala Chai.'], { best: 1, o: IN }),
    P('chai', 'tea', '☕', ['Masala Chai Blend', 'Masala-Chai-Mischung'], 7, 'vegan', 'kg', [[250, 3.49]], ['Tea blended with ginger and spices.', 'Tee mit Ingwer und Gewürzen.'], { ing: { en: 'Black tea, ginger, cardamom, cinnamon, clove', de: 'Schwarztee, Ingwer, Kardamom, Zimt, Nelke' }, o: IN }),
    P('mangopulp', 'tea', '🥭', ['Mango Pulp (tin)', 'Mangomark (Dose)'], 7, 'vegan', 'kg', [[850, 3.99]], ['Sweet mango pulp for desserts and drinks.', 'Süßes Mangomark für Desserts und Getränke.'], { ing: { en: 'Mango pulp, sugar', de: 'Mangomark, Zucker' }, o: IN }),
    P('mangojuice', 'tea', '🥤', ['Mango Juice Drink', 'Mango-Fruchtsaftgetränk'], 19, 'vegan', 'l', [[1000, 2.29]], ['Mango nectar drink.', 'Mangonektar.'], { ing: { en: 'Water, mango pulp, sugar', de: 'Wasser, Mangomark, Zucker' }, o: IN }),
    // Pickles & sauces
    P('mangopickle', 'pickle', '🥫', ['Mango Pickle', 'Mango-Pickle'], 7, 'vegan', 'kg', [[300, 2.99], [500, 4.29]], ['Spicy mango pickle in oil.', 'Scharfes Mango-Pickle in Öl.'], { a: ['mustard'], ing: { en: 'Raw mango, vegetable oil, spices, salt', de: 'Rohe Mango, Pflanzenöl, Gewürze, Salz' }, best: 1, o: IN }),
    P('mixpickle', 'pickle', '🥫', ['Mixed Pickle', 'Gemischtes Pickle'], 7, 'vegan', 'kg', [[300, 2.99]], ['Mixed vegetable pickle.', 'Gemüse-Pickle gemischt.'], { a: ['mustard'], ing: { en: 'Vegetables, vegetable oil, spices, salt', de: 'Gemüse, Pflanzenöl, Gewürze, Salz' }, o: IN }),
    P('tamarind', 'pickle', '🍂', ['Tamarind Paste', 'Tamarindenpaste'], 7, 'vegan', 'kg', [[200, 1.99]], ['Tamarind paste for chutneys and sambar.', 'Tamarindenpaste für Chutneys und Sambar.'], { o: IN }),
    P('tikka', 'pickle', '🥫', ['Tikka Masala Paste', 'Tikka-Masala-Paste'], 7, 'veg', 'kg', [[283, 2.79]], ['Ready curry paste for a quick tikka masala.', 'Fertige Currypaste für ein schnelles Tikka Masala.'], { a: ['milk'], ing: { en: 'Tomato, cream, spices, oil, salt', de: 'Tomate, Sahne, Gewürze, Öl, Salz' }, o: IN }),
    // Frozen
    P('paratha', 'frozen', '🥙', ['Plain Paratha (5 pcs)', 'Paratha natur (5 Stk.)'], 7, 'veg', 'kg', [[400, 2.99]], ['Frozen layered flatbread, ready in minutes.', 'Tiefgekühltes Blätterteig-Fladenbrot, in Minuten fertig.'], { a: ['gluten'], cold: 1, ing: { en: 'Wheat flour, vegetable oil, salt, water', de: 'Weizenmehl, Pflanzenöl, Salz, Wasser' }, best: 1, o: IN }),
    P('samosa', 'frozen', '🥟', ['Vegetable Samosa', 'Gemüse-Samosa'], 7, 'vegan', 'pc', [[12, 3.99]], ['Bake or fry straight from frozen.', 'Direkt aus dem Tiefkühler backen oder frittieren.'], { a: ['gluten'], cold: 1, ing: { en: 'Wheat flour, potato, peas, oil, spices', de: 'Weizenmehl, Kartoffel, Erbsen, Öl, Gewürze' }, o: IN }),
    P('peas', 'frozen', '🥦', ['Green Peas', 'Erbsen grün'], 7, 'vegan', 'kg', [[450, 1.99]], ['Frozen garden peas.', 'Tiefgekühlte Gartenerbsen.'], { cold: 1, o: { en: 'EU', de: 'EU' } }),
    P('coconutgrated', 'frozen', '🥥', ['Grated Coconut', 'Kokosraspel frisch'], 7, 'vegan', 'kg', [[300, 2.49]], ['Frozen grated coconut for chutneys and curries.', 'Tiefgekühlte Kokosraspel für Chutneys und Currys.'], { cold: 1, o: { en: 'Sri Lanka', de: 'Sri Lanka' } }),
    // Fresh
    P('okra', 'fresh', '🌿', ['Okra (Bhindi)', 'Okra (Bhindi)'], 7, 'vegan', 'kg', [[250, 2.49], [500, 3.99]], ['Fresh okra, ideal for bhindi masala.', 'Frische Okraschoten, ideal für Bhindi Masala.'], { o: { en: 'EU', de: 'EU' } }),
    P('greenchilli', 'fresh', '🌶️', ['Green Chillies', 'Grüne Chilis'], 7, 'vegan', 'kg', [[100, 0.99], [250, 1.99]], ['Fresh green chillies.', 'Frische grüne Chilis.'], { o: { en: 'EU', de: 'EU' } }),
    P('ginger', 'fresh', '🌱', ['Ginger', 'Ingwer'], 7, 'vegan', 'kg', [[250, 1.49], [500, 2.49]], ['Fresh ginger root.', 'Frische Ingwerwurzel.'], { o: { en: 'Imported', de: 'Import' } }),
    P('curryleaf', 'fresh', '🍃', ['Curry Leaves (bunch)', 'Curryblätter (Bund)'], 7, 'vegan', 'pc', [[1, 1.49]], ['Fresh curry leaves, small bunch.', 'Frische Curryblätter, kleines Bund.'], { o: { en: 'Imported', de: 'Import' } }),
    P('karela', 'fresh', '🥒', ['Bitter Gourd (Karela)', 'Bittergurke (Karela)'], 7, 'vegan', 'kg', [[500, 3.49]], ['Fresh bitter gourd.', 'Frische Bittergurke.'], { o: { en: 'Imported', de: 'Import' } }),
    P('brinjal', 'fresh', '🍆', ['Small Aubergines', 'Kleine Auberginen'], 7, 'vegan', 'kg', [[500, 2.49]], ['Small Indian-style aubergines for stuffed curries.', 'Kleine Auberginen für gefüllte Currys.'], { o: { en: 'EU', de: 'EU' } })
  ];
  BZ.byId = {};
  BZ.products.forEach((p, i) => { p.n = i + 1; BZ.byId[p.id] = p; });

  /* ---------- SKU / stock / price (with admin overrides) ---------- */
  const hash = (s) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
  BZ.hash = hash;
  // photo, deal and a deterministic dummy rating per product
  BZ.products.forEach((p) => {
    p.img = 'assets/img/' + p.id + '.jpg'; p.deal = DEALS[p.id] || 0;
    p.rating = Math.min(5, 3.8 + (hash(p.id + 'r') % 13) / 10); p.reviews = 8 + (hash(p.id + 'n') % 420);
  });
  BZ.sku = (p, si) => {
    const c = BZ.cats.find((c) => c.id === p.cat).code;
    return c + '-' + String(p.n).padStart(3, '0') + '-' + (si + 1);
  };
  const SPECIAL = { 'okra|0': 6, 'karela|0': 4, 'curryleaf|0': 0, 'paratha|0': 0, 'lassi|0': 9 };
  BZ.baseStock = (p, si) => (SPECIAL[p.id + '|' + si] !== undefined ? SPECIAL[p.id + '|' + si] : 14 + (hash(p.id + si) % 70));
  BZ.ovr = () => BZ.load('bz_ovr', {});
  BZ.stockOf = (p, si) => { const o = BZ.ovr()[BZ.sku(p, si)]; return o && o.stock !== undefined ? o.stock : BZ.baseStock(p, si); };
  // list price (what the admin edits) and the selling price after the deal
  BZ.listPrice = (p, si) => { const o = BZ.ovr()[BZ.sku(p, si)]; return o && o.price !== undefined ? o.price : p.sizes[si][1]; };
  BZ.priceOf = (p, si) => { const l = BZ.listPrice(p, si); return p.deal ? Math.round(l * (100 - p.deal)) / 100 : l; };
  BZ.setOvr = (sku, patch) => { const o = BZ.ovr(); o[sku] = Object.assign({}, o[sku], patch); BZ.save('bz_ovr', o); };
  BZ.skuCount = () => BZ.products.reduce((n, p) => n + p.sizes.length, 0);

  /* ---------- formatting ---------- */
  BZ.loc = (lang) => (lang === 'de' ? 'de-DE' : 'en-IE');
  BZ.money = (v, lang) => new Intl.NumberFormat(BZ.loc(lang), { style: 'currency', currency: 'EUR' }).format(v);
  BZ.moneyShort = (v, lang) => new Intl.NumberFormat(BZ.loc(lang), { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(v) ? 0 : 2 }).format(v);
  BZ.num = (v, lang) => new Intl.NumberFormat(BZ.loc(lang), { maximumFractionDigits: 2 }).format(v);
  BZ.qtyLabel = (p, si, lang) => {
    const q = p.sizes[si][0];
    if (p.unit === 'pc') return q + (lang === 'de' ? ' Stück' : ' pcs');
    if (p.unit === 'l') return q >= 1000 ? BZ.num(q / 1000, lang) + ' l' : q + ' ml';
    return q >= 1000 ? BZ.num(q / 1000, lang) + ' kg' : q + ' g';
  };
  // Grundpreis (unit price) as required by the German Price Indication Ordinance
  BZ.unitPrice = (p, si, lang) => {
    if (p.unit === 'pc') return p.sizes[si][0] > 1 ? BZ.money(BZ.priceOf(p, si) / p.sizes[si][0], lang) + ' / ' + (lang === 'de' ? 'Stück' : 'piece') : '';
    const per = BZ.priceOf(p, si) / (p.sizes[si][0] / 1000);
    return '1 ' + (p.unit === 'l' ? 'l' : 'kg') + ' = ' + BZ.money(per, lang);
  };

  /* ---------- totals ---------- */
  BZ.totals = (cart, code) => {
    let sub = 0, list = 0; const vat = { 7: 0, 19: 0 }; let count = 0;
    cart.forEach((l) => {
      const p = BZ.byId[l.id]; if (!p) return;
      const v = BZ.priceOf(p, l.si) * l.q; sub += v; list += BZ.listPrice(p, l.si) * l.q; count += l.q; vat[p.vat] += v * p.vat / (100 + p.vat);
    });
    let fee = sub === 0 ? 0 : (sub >= BZ.FREE ? 0 : BZ.FEE);
    const c = code && BZ.coupons[code]; const active = !!(c && sub >= c.min); let disc = 0;
    if (active) { if (c.pct) disc = Math.round(sub * c.pct) / 100; if (c.off) disc = Math.min(sub, c.off); if (c.ship) fee = 0; }
    if (disc) { const f = 1 - disc / sub; vat[7] *= f; vat[19] *= f; }
    vat[19] += fee * 19 / 119;
    return { sub, list, saved: list - sub, disc, fee, total: sub - disc + fee, vat, count, coupon: active ? code : '', couponMin: c && !active ? c.min : 0 };
  };

  /* ---------- delivery ---------- */
  BZ.windows = ['08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00', '16:00–18:00', '18:00–20:00'];
  BZ.days = (n) => {
    const out = []; const d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < (n || 4)) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) out.push(d.toISOString().slice(0, 10)); }
    return out;
  };
  BZ.slotLeft = (day, w) => { const h = BZ.hash(day + w) % 9; return h === 0 ? 0 : h + 2; };
  BZ.cities = { '60311': 'Frankfurt am Main', '10115': 'Berlin', '80331': 'München', '40213': 'Düsseldorf', '50667': 'Köln', '20095': 'Hamburg', '70173': 'Stuttgart', '30159': 'Hannover', '90402': 'Nürnberg', '04109': 'Leipzig' };
  BZ.dayLabel = (iso, lang) => new Date(iso + 'T12:00:00').toLocaleDateString(BZ.loc(lang), { weekday: 'short', day: 'numeric', month: 'short' });

  /* ---------- orders (stored in the browser only) ---------- */
  BZ.STATUS = ['new', 'packed', 'out', 'delivered'];
  BZ.orders = () => BZ.load('bz_orders', []);
  BZ.saveOrders = (o) => BZ.save('bz_orders', o);
  BZ.ensureSeed = () => {
    if (BZ.load('bz_seeded', false)) return;
    const d = BZ.days(3);
    const mk = (n, name, street, plz, city, day, win, items, status, pay) => {
      const cart = items.map(([id, si, q]) => ({ id, si, q }));
      const t = BZ.totals(cart);
      return { id: 'BZ-' + n, ts: Date.now() - (1043 - n) * 36e5 * 3, name, email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com', phone: '', street, plz, city, day, win, items: cart, sub: t.sub, fee: t.fee, total: t.total, status, pay, wa: n % 2 === 0, seed: true };
    };
    BZ.saveOrders([
      mk(1042, 'Anna Becker', 'Beispielstraße 12', '60311', 'Frankfurt am Main', d[0], BZ.windows[1], [['basmati', 1, 1], ['toor', 1, 2], ['turmeric', 1, 1], ['paneer', 0, 2]], 'new', 'PayPal'),
      mk(1041, 'Mehmet Kaya', 'Musterweg 5', '60313', 'Frankfurt am Main', d[0], BZ.windows[1], [['atta', 0, 1], ['ghee', 1, 1], ['assam', 1, 1]], 'new', 'SEPA'),
      mk(1040, 'Sarah Neumann', 'Teststraße 88', '60385', 'Frankfurt am Main', d[0], BZ.windows[3], [['gulab', 0, 2], ['bhujia', 1, 2], ['mangopulp', 0, 1]], 'packed', 'Card'),
      mk(1039, 'Priya Sharma', 'Probeallee 3', '60486', 'Frankfurt am Main', d[1], BZ.windows[0], [['sona', 1, 1], ['moong', 1, 1], ['okra', 1, 2], ['ginger', 1, 1], ['curryleaf', 0, 1]], 'new', 'Klarna'),
      mk(1038, 'Jonas Weber', 'Demogasse 21', '63065', 'Offenbach', d[1], BZ.windows[4], [['paratha', 0, 3], ['samosa', 0, 2], ['dahi', 1, 1]], 'new', 'PayPal'),
      mk(1037, 'Elena Fischer', 'Beispielplatz 1', '60311', 'Frankfurt am Main', d[0], BZ.windows[0], [['besan', 1, 1], ['jeera', 1, 1], ['garam', 1, 1]], 'delivered', 'Apple Pay')
    ]);
    BZ.save('bz_seeded', true);
  };

  /* ---------- translations ---------- */
  BZ.i18n = {
    en: {
      demoBanner: 'Demo preview · sample products and placeholder brand · no real orders or payments',
      search: 'Search products…', cart: 'Cart', all: 'All products', shop: 'Shop',
      kicker: 'Indian grocery · Germany',
      heroTitle: 'Indian groceries, delivered to your door.',
      heroSub: 'Rice, dals, spices and fresh vegetables. Order on the web or on WhatsApp, pay securely and choose your delivery window.',
      shopNow: 'Shop now', orderWa: 'Order on WhatsApp',
      plzTitle: 'Check delivery to your postcode', plzPh: 'Postcode, e.g. 60311', check: 'Check',
      plzBad: 'Please enter a 5-digit German postcode.',
      plzOk: (plz, city, day) => `We deliver to ${plz}${city ? ' ' + city : ''}. Next available slot: ${day}.`,
      fDelivery: 'Delivery', fDeliveryV: (fee, free) => `${fee} · free from ${free}`,
      fSlots: 'Slots', fSlotsV: '2-hour windows, from the next day',
      fPay: 'Payment', fPayV: 'PayPal, SEPA, card, Klarna, Apple Pay',
      fPrices: 'Prices', fPricesV: 'Incl. VAT, unit price on every item',
      byCat: 'Shop by category', products: 'products', best: 'Bestsellers', viewAll: 'View all',
      how: 'How it works',
      h1t: 'Choose', h1: 'Browse the web shop or the WhatsApp catalogue.',
      h2t: 'Pay', h2: 'Secure checkout with PayPal, SEPA direct debit, card, Klarna or Apple Pay.',
      h3t: 'Receive', h3: 'Pick a delivery window and follow your order.',
      waBandT: 'Prefer WhatsApp?', waBand: 'Browse the catalogue, build your basket and pay through a secure checkout link, all from the chat.', waSee: 'See how it works',
      add: 'Add', added: 'Added to cart', soldOut: 'Sold out', onlyLeft: (n) => `Only ${n} left`, inStock: 'In stock',
      from: 'from', vegan: 'Vegan', veg: 'Vegetarian', cold: 'Chilled / frozen',
      filterCat: 'Category', filterDiet: 'Diet', anyDiet: 'Any', sort: 'Sort', sFeat: 'Featured', sLow: 'Price: low to high', sHigh: 'Price: high to low', sName: 'Name A–Z', stockOnly: 'In stock only',
      results: (n) => `${n} product${n === 1 ? '' : 's'}`, noResults: 'No products match your filters.', clear: 'Clear filters',
      vatIncl: 'incl. VAT', qty: 'Quantity', size: 'Size', details: 'Product information', ingredients: 'Ingredients', allergens: 'Allergens', none: 'None', origin: 'Origin', sku: 'Article no.', storage: 'Storage', chilled: 'Keep chilled / frozen', ambient: 'Store in a cool, dry place', addToCart: 'Add to cart',
      cartTitle: 'Your cart', empty: 'Your cart is empty.', continue: 'Continue shopping', subtotal: 'Subtotal', delivery: 'Delivery', free: 'Free', total: 'Total', checkout: 'Checkout',
      toFree: (v) => `Add ${v} more for free delivery`, freeUnlocked: 'You have free delivery', minOrder: (v) => `Minimum order value ${v}`, remove: 'Remove',
      coTitle: 'Checkout', contact: 'Contact', email: 'Email', phone: 'Mobile (for WhatsApp updates)', waOpt: 'Send me order updates on WhatsApp (optional)',
      address: 'Delivery address', name: 'Full name', street: 'Street and number', plz: 'Postcode', city: 'City',
      slot: 'Delivery window', fewLeft: (n) => `${n} left`, full: 'Full',
      payment: 'Payment', expressNote: 'Express checkout', or: 'or pay below',
      pPaypal: 'PayPal', pCard: 'Credit / debit card', pSepa: 'SEPA direct debit', pKlarna: 'Klarna (pay later)', pApple: 'Apple Pay / Google Pay',
      payNote: 'Demo only. No payment is taken and no data is sent anywhere.',
      terms: 'I accept the terms and conditions and have read the privacy policy and cancellation policy.',
      place: 'Place order with obligation to pay',
      summary: 'Order summary', vatLine: (r) => `VAT ${r} % included`,
      thanks: (n) => `Thank you, ${n}`, orderNo: 'Order number', confirmedFor: 'Delivery', paidVia: 'Payment', status: 'Status',
      st: { new: 'Order received', packed: 'Packed', out: 'Out for delivery', delivered: 'Delivered' },
      advance: 'Demo: move to next status', waPreview: 'WhatsApp confirmation (preview)',
      waConf: (id, day, win) => `Hello! Your order ${id} is confirmed. Delivery ${day}, ${win}. Track it here: bazaar.example/o/${id}`,
      back: 'Back to shop', lang: 'DE',
      footNote: 'Placeholder brand and sample data. Legal pages (imprint, terms, privacy, cancellation) are provided by the client.',
      imprint: 'Imprint', tos: 'Terms', privacy: 'Privacy', withdrawal: 'Cancellation policy', shipping: 'Shipping & payment',
      deals: 'Deals of the day', dealsEnd: 'Ends in', off: (n) => `${n}% off`, reviews: (n) => `${n} reviews`, onlyDeals: 'Deals only',
      combos: 'Combo packs', comboSub: 'Everything for one dish, one tap', comboSave: (v) => `Save ${v}`, addCombo: 'Add all to cart', itemsN: (n) => `${n} items`,
      buyAgain: 'Buy again', buyAgainSub: 'From your last order', reorder: 'Add all again', buyNow: 'Buy now', fbt: 'Frequently bought together',
      coupon: 'Coupon code', couponPh: 'e.g. WELCOME10', apply: 'Apply', couponOk: (c) => `Coupon ${c} applied`, couponBad: 'This code is not valid', couponMin: (v) => `Order ${v} or more to use this coupon`, discount: 'Coupon discount', removeCoupon: 'Remove', youSave: (v) => `You save ${v} on deals`,
      deliverTo: 'Deliver to', setPlz: 'Enter postcode', viewCart: 'View cart',
      promo1t: 'off your first order', promo1: 'Code WELCOME10 at checkout, from €20', promo2t: 'Free delivery', promo2: 'On every order over €50', promo3t: 'Check delivery to your postcode',
      sugCats: 'Categories', sugProds: 'Products',
      waTitle: 'Order on WhatsApp', waName: 'Bazaar', waSub: 'Business account', waNext: 'Next step', waRestart: 'Restart', waDone: 'End of demo',
      waNote: 'Mock-up. In production this runs on the WhatsApp Business Platform with the catalogue synced from Shopify.',
      waM: [
        ['me', 'Hello'],
        ['biz', 'Welcome to Bazaar! Browse our catalogue or send us your order.'],
        ['cat', ['Basmati Rice 5 kg|€14,99', 'Toor Dal 1 kg|€4,49', 'Paneer 200 g|€2,99']],
        ['me', '1× Basmati 5 kg, 1× Toor Dal, 2× Paneer'],
        ['biz', 'Your basket: 4 items · €25,46 + €4,90 delivery = €30,36 incl. VAT. Delivery is free from €50.'],
        ['link', ['Pay securely', 'Opens the Shopify checkout: Apple Pay, PayPal, SEPA, card, Klarna']],
        ['biz', 'Order BZ-1043 confirmed. Delivery tomorrow, 10:00–12:00.'],
        ['biz', 'Your driver is on the way. Track your order: bazaar.example/o/BZ-1043']
      ]
    },
    de: {
      demoBanner: 'Demo-Vorschau · Beispielprodukte und Platzhalter-Marke · keine echten Bestellungen oder Zahlungen',
      search: 'Produkte suchen…', cart: 'Warenkorb', all: 'Alle Produkte', shop: 'Shop',
      kicker: 'Indische Lebensmittel · Deutschland',
      heroTitle: 'Indische Lebensmittel, direkt zu Ihnen nach Hause.',
      heroSub: 'Reis, Linsen, Gewürze und frisches Gemüse. Bestellen Sie im Web oder per WhatsApp, zahlen Sie sicher und wählen Sie Ihr Lieferfenster.',
      shopNow: 'Jetzt einkaufen', orderWa: 'Per WhatsApp bestellen',
      plzTitle: 'Lieferung an Ihre Postleitzahl prüfen', plzPh: 'PLZ, z. B. 60311', check: 'Prüfen',
      plzBad: 'Bitte geben Sie eine 5-stellige deutsche Postleitzahl ein.',
      plzOk: (plz, city, day) => `Wir liefern nach ${plz}${city ? ' ' + city : ''}. Nächstes freies Fenster: ${day}.`,
      fDelivery: 'Lieferung', fDeliveryV: (fee, free) => `${fee} · kostenlos ab ${free}`,
      fSlots: 'Lieferfenster', fSlotsV: '2-Stunden-Fenster, ab dem nächsten Tag',
      fPay: 'Zahlung', fPayV: 'PayPal, SEPA, Karte, Klarna, Apple Pay',
      fPrices: 'Preise', fPricesV: 'Inkl. MwSt., Grundpreis bei jedem Artikel',
      byCat: 'Nach Kategorie einkaufen', products: 'Produkte', best: 'Bestseller', viewAll: 'Alle ansehen',
      how: 'So funktioniert es',
      h1t: 'Auswählen', h1: 'Im Webshop oder im WhatsApp-Katalog stöbern.',
      h2t: 'Bezahlen', h2: 'Sicher bezahlen mit PayPal, SEPA-Lastschrift, Karte, Klarna oder Apple Pay.',
      h3t: 'Erhalten', h3: 'Lieferfenster wählen und die Bestellung verfolgen.',
      waBandT: 'Lieber über WhatsApp?', waBand: 'Katalog ansehen, Warenkorb füllen und über einen sicheren Checkout-Link bezahlen, alles im Chat.', waSee: 'So funktioniert es',
      add: 'Hinzufügen', added: 'In den Warenkorb gelegt', soldOut: 'Ausverkauft', onlyLeft: (n) => `Nur noch ${n}`, inStock: 'Auf Lager',
      from: 'ab', vegan: 'Vegan', veg: 'Vegetarisch', cold: 'Gekühlt / tiefgekühlt',
      filterCat: 'Kategorie', filterDiet: 'Ernährung', anyDiet: 'Alle', sort: 'Sortierung', sFeat: 'Empfohlen', sLow: 'Preis aufsteigend', sHigh: 'Preis absteigend', sName: 'Name A–Z', stockOnly: 'Nur verfügbare',
      results: (n) => `${n} Produkt${n === 1 ? '' : 'e'}`, noResults: 'Keine Produkte für diese Filter gefunden.', clear: 'Filter zurücksetzen',
      vatIncl: 'inkl. MwSt.', qty: 'Menge', size: 'Größe', details: 'Produktinformationen', ingredients: 'Zutaten', allergens: 'Allergene', none: 'Keine', origin: 'Herkunft', sku: 'Artikelnr.', storage: 'Lagerung', chilled: 'Gekühlt / tiefgekühlt lagern', ambient: 'Kühl und trocken lagern', addToCart: 'In den Warenkorb',
      cartTitle: 'Ihr Warenkorb', empty: 'Ihr Warenkorb ist leer.', continue: 'Weiter einkaufen', subtotal: 'Zwischensumme', delivery: 'Lieferung', free: 'Kostenlos', total: 'Gesamt', checkout: 'Zur Kasse',
      toFree: (v) => `Noch ${v} bis zur kostenlosen Lieferung`, freeUnlocked: 'Sie erhalten kostenlose Lieferung', minOrder: (v) => `Mindestbestellwert ${v}`, remove: 'Entfernen',
      coTitle: 'Kasse', contact: 'Kontakt', email: 'E-Mail', phone: 'Mobilnummer (für WhatsApp-Updates)', waOpt: 'Bestell-Updates per WhatsApp senden (optional)',
      address: 'Lieferadresse', name: 'Vor- und Nachname', street: 'Straße und Hausnummer', plz: 'PLZ', city: 'Ort',
      slot: 'Lieferfenster', fewLeft: (n) => `${n} frei`, full: 'Voll',
      payment: 'Zahlung', expressNote: 'Express-Kasse', or: 'oder unten bezahlen',
      pPaypal: 'PayPal', pCard: 'Kredit- / Debitkarte', pSepa: 'SEPA-Lastschrift', pKlarna: 'Klarna (Kauf auf Rechnung)', pApple: 'Apple Pay / Google Pay',
      payNote: 'Nur Demo. Es wird keine Zahlung ausgeführt und keine Daten werden übertragen.',
      terms: 'Ich akzeptiere die AGB und habe die Datenschutzerklärung und die Widerrufsbelehrung gelesen.',
      place: 'Zahlungspflichtig bestellen',
      summary: 'Bestellübersicht', vatLine: (r) => `enthaltene MwSt. ${r} %`,
      thanks: (n) => `Vielen Dank, ${n}`, orderNo: 'Bestellnummer', confirmedFor: 'Lieferung', paidVia: 'Zahlung', status: 'Status',
      st: { new: 'Bestellung eingegangen', packed: 'Gepackt', out: 'In Zustellung', delivered: 'Geliefert' },
      advance: 'Demo: nächster Status', waPreview: 'WhatsApp-Bestätigung (Vorschau)',
      waConf: (id, day, win) => `Hallo! Ihre Bestellung ${id} ist bestätigt. Lieferung ${day}, ${win} Uhr. Verfolgen: bazaar.example/o/${id}`,
      back: 'Zurück zum Shop', lang: 'EN',
      footNote: 'Platzhalter-Marke und Beispieldaten. Rechtstexte (Impressum, AGB, Datenschutz, Widerruf) liefert der Kunde.',
      imprint: 'Impressum', tos: 'AGB', privacy: 'Datenschutz', withdrawal: 'Widerrufsbelehrung', shipping: 'Versand & Zahlung',
      deals: 'Angebote des Tages', dealsEnd: 'Endet in', off: (n) => `${n} % Rabatt`, reviews: (n) => `${n} Bewertungen`, onlyDeals: 'Nur Angebote',
      combos: 'Kombi-Pakete', comboSub: 'Alles für ein Gericht, mit einem Tipp', comboSave: (v) => `${v} sparen`, addCombo: 'Alles in den Warenkorb', itemsN: (n) => `${n} Artikel`,
      buyAgain: 'Erneut kaufen', buyAgainSub: 'Aus Ihrer letzten Bestellung', reorder: 'Alles erneut hinzufügen', buyNow: 'Jetzt kaufen', fbt: 'Wird oft zusammen gekauft',
      coupon: 'Gutscheincode', couponPh: 'z. B. WELCOME10', apply: 'Einlösen', couponOk: (c) => `Gutschein ${c} eingelöst`, couponBad: 'Dieser Code ist ungültig', couponMin: (v) => `Ab ${v} Bestellwert einlösbar`, discount: 'Gutschein', removeCoupon: 'Entfernen', youSave: (v) => `Sie sparen ${v} durch Angebote`,
      deliverTo: 'Lieferung nach', setPlz: 'PLZ eingeben', viewCart: 'Warenkorb ansehen',
      promo1t: 'auf die erste Bestellung', promo1: 'Code WELCOME10 an der Kasse, ab 20 €', promo2t: 'Kostenlose Lieferung', promo2: 'Bei jeder Bestellung ab 50 €', promo3t: 'Lieferung an Ihre PLZ prüfen',
      sugCats: 'Kategorien', sugProds: 'Produkte',
      waTitle: 'Per WhatsApp bestellen', waName: 'Bazaar', waSub: 'Business-Konto', waNext: 'Nächster Schritt', waRestart: 'Neu starten', waDone: 'Ende der Demo',
      waNote: 'Mock-up. Im Echtbetrieb läuft dies über die WhatsApp Business Platform mit dem aus Shopify synchronisierten Katalog.',
      waM: [
        ['me', 'Hallo'],
        ['biz', 'Willkommen bei Bazaar! Stöbern Sie im Katalog oder senden Sie uns Ihre Bestellung.'],
        ['cat', ['Basmati-Reis 5 kg|14,99 €', 'Toor Dal 1 kg|4,49 €', 'Paneer 200 g|2,99 €']],
        ['me', '1× Basmati 5 kg, 1× Toor Dal, 2× Paneer'],
        ['biz', 'Ihr Warenkorb: 4 Artikel · 25,46 € + 4,90 € Lieferung = 30,36 € inkl. MwSt. Ab 50 € ist die Lieferung kostenlos.'],
        ['link', ['Sicher bezahlen', 'Öffnet den Shopify-Checkout: Apple Pay, PayPal, SEPA, Karte, Klarna']],
        ['biz', 'Bestellung BZ-1043 bestätigt. Lieferung morgen, 10:00–12:00 Uhr.'],
        ['biz', 'Ihr Fahrer ist unterwegs. Bestellung verfolgen: bazaar.example/o/BZ-1043']
      ]
    }
  };
  BZ.t = (lang, key, ...a) => { const v = BZ.i18n[lang][key]; return typeof v === 'function' ? v(...a) : v; };
})();
