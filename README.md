# Bazaar store demo

A clickable demo of the Germany-focused Indian grocery store: web shop, WhatsApp ordering mock-up, checkout, order tracking and a vendor admin preview. It is plain HTML, CSS and JavaScript, so it runs on GitHub Pages with no build step.

**Everything here is sample data and a placeholder brand ("Bazaar").** No orders, payments or personal data leave the browser.

## Running it

- Online: the GitHub Pages URL of this repository (Settings → Pages).
- Locally: open `index.html` in a browser, or serve the folder with any static file server.

## What the demo shows

| Page | What to point out to the client |
|---|---|
| Home | Category strip, offer banner carousel, promo tiles (coupon, free delivery, postcode check), deals of the day with countdown, combo packs, "buy again" after a first order, bestsellers |
| Shop | Search with live suggestions, category / diet / sort / deals / stock filters, size variants, ratings, deal badges and strike-through prices, unit price (Grundpreis) and "incl. VAT" on every item, low-stock and sold-out states |
| Product | Photo, "Buy now" shortcut to checkout, ingredients, allergens, origin, storage, article number, "frequently bought together" |
| Cart | "Add" turns into a quantity stepper on the card, coupon codes (`WELCOME10`, `FREESHIP`, `DIWALI5`), deal savings, free-delivery progress bar, minimum order value, sticky cart bar on mobile |
| Checkout | One page, guest checkout, 2-hour delivery windows, German payment mix (PayPal, SEPA, card, Klarna, Apple/Google Pay), WhatsApp opt-in, "Zahlungspflichtig bestellen" button |
| Order page | Status timeline, "buy again", WhatsApp confirmation preview (use the "move to next status" button) |
| WhatsApp (header button) | Scripted chat: catalogue, basket, secure checkout link, confirmation, driver message |
| Admin preview | Orders, inventory (edit stock and list price and see the shop change), delivery runs per time window with CSV export |

The language follows the browser (German first, English otherwise); the **DE / EN** button switches it. The half-circle button toggles dark mode. Orders placed in the shop appear in the admin preview (they are stored in the browser's local storage).

## What is real and what is a stand-in

| Demo | In production |
|---|---|
| Storefront pages and checkout | Custom Shopify theme and Shopify checkout (payments, VAT, receipts) |
| Deals, coupons, ratings, combos | Shopify discounts, product reviews app, bundles app |
| WhatsApp chat mock-up | WhatsApp Business Platform with the catalogue synced from Shopify |
| Admin preview | Shopify admin (products, stock, orders) |
| Delivery runs and CSV | Route-planning / rider tool fed by Shopify orders |
| 54 sample products, 82 SKUs | The vendor's 2,000–3,000 SKUs imported by spreadsheet |
| Photos from Wikipedia / Wikimedia Commons (see `assets/img/CREDITS.md`) | The vendor's own product photos |

## Editing the demo

- Products, prices, deals, coupons, banners, combo packs, categories, translations, delivery fee, free-delivery threshold and minimum order are all in `assets/data.js`.
- Product photos are `assets/img/<product id>.jpg` (640×640); banners are `assets/img/b_*.jpg` (1400×560).
- Look and feel (colours, fonts, spacing) is in `assets/style.css`: Bricolage Grotesque headings, Plus Jakarta Sans text, aubergine ink on warm cream, hot-pink primary with marigold / saffron / violet accents. Each category has its own colour (`h`, a hue from 0–360, in `BZ.cats`).
- To reset the demo data in your browser, clear the site's local storage.
