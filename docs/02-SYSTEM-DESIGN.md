# Document #2 — System Design Document
> *This tells AI **HOW** to build it*

---

## Architecture Overview

The project ships as **two parallel, independently-maintained distributions**
of the same feature set — no backend, no shared build pipeline, no server:

```
xbox-wishlist/
├── xbox-wishlist.user.js          # Userscript (Tampermonkey/Greasemonkey) — primary/live channel
├── browser-extension/             # Chrome/Edge MV3 extension — secondary/unpublished channel
│   └── src/
│       ├── manifest.json
│       ├── content.js             # Ported from xbox-wishlist.user.js
│       ├── background.js
│       ├── popup.html / popup.js
│       ├── styles.css
│       └── icons/
├── AGENTS.md                      # Authoritative AI agent context (guardrails, HITL, extension architecture)
├── CHANGELOG.md                   # Canonical version history for both channels
├── README.md                      # Public-facing docs
└── docs/
    ├── 01-PRD.md
    ├── 02-SYSTEM-DESIGN.md        # This file
    ├── 03-UI-UX-WIREFRAMES.md
    ├── 04-FEATURE-BREAKDOWN.md
    └── 05-MASTER-PROMPT.md
```

The two channels currently drift out of sync — the userscript is the more
advanced/live one. See `AGENTS.md` §2.1 for the tracked parity gap and
`CHANGELOG.md` for what shipped where. This document covers the **userscript**
system design in detail; for the extension's architecture, layer map, and
coding standards, `AGENTS.md` §2.2–2.4 is authoritative.

---

## Userscript Metadata Header

```js
// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.4.26057.1
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
// @author       ZellReid
// @match        https://www.xbox.com/*/wishlist*
// @run-at       document-body
// @resource     CSSFilter   https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/xbox-wishlist.user.css?ver=1.4.26057.1
// @resource     IMGFilter   https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/filter.svg
// @resource     IMGSort     https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/sort.svg
// @resource     IMGExpand   https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
```

There is no `@require` for an external slider library — the price/discount
range sliders are native HTML5 dual-range `<input type="range">` elements,
custom-styled via the injected CSS resource. The CSS itself is not a local
`.user.css` file; it's fetched from the GitHub raw URL via `@resource
CSSFilter` and injected with `GM_addStyle`.

**URL match pattern:** `https://www.xbox.com/*/wishlist*`
- `/*/` captures locale (en-ZA, en-US, etc.)
- trailing `*` captures own wishlist AND public shared wishlist URLs

---

## CONFIG Object (Single Source of Truth)

All IDs, selectors, and constants live in one `CONFIG` object at the top of the script:

This is a simplified illustration of the pattern, not a verbatim excerpt —
see `xbox-wishlist.user.js` (search `const CONFIG`) for the exact current
shape:

```js
const CONFIG = {
  selectors: {
    // Resilient selectors — match by partial class name using [class*=]
    wishlistItem:     '[class*="WishlistItem-module__"]',
    buttonsArea:      '[class*="WishlistPage-module__wishlistMenuButton"]',
    itemTitle:        '[class*="ProductCard-module__title"]',
    itemPrice:        '[class*="Price-module__"]',
    itemPublisher:    '[class*="ProductCard-module__developerName"]',
  },
  storage: {
    key:              'ifc_xbox_wishlist',  // single JSON blob — see Persistence below
  },
};
```

---

## Data Flow

```
Page Load
    │
    ▼
waitForDOM()  ← MutationObserver watches for wishlist items
    │
    ▼
collectItemData()  ← Scrapes all WishlistItem nodes into JS objects
    │              ← Stores: title, publisher, price, originalPrice,
    │                         discount, owned, purchasable, id
    ▼
buildUI()  ← Injects button bar, filter panel, sort panel
    │      ← Reads saved state from GM_getValue
    │
    ▼
applyFilters() + applySort()  ← Called on any user interaction
    │                         ← Mutates DOM display (show/hide items)
    ▼
updateTags()  ← Reflects active filter state as removable tags
    │
    ▼
GM_setValue()  ← Persists state for next page load
```

---

## DOM Injection Strategy

### Own Wishlist (normal)
- Target: `[class*="WishlistPage-module__wishlistMenuButton"]`
- Append our button bar directly after this container

### Public / Shared Wishlist (F-17 — shipped v1.4)
- The `wishlistMenuButton` container does **not** exist
- Fallback: create a new `div.ifc-injected-btn-bar` and insert it into the nearest stable parent (`[class*="WishlistPage-module__header"]` or similar)
- Detection: `if (!document.querySelector(CONFIG.selectors.buttonsArea)) { createFallbackContainer(); }`

---

## Item Data Model

```js
{
  id:            String,   // Unique Xbox product ID from DOM
  title:         String,
  publisher:     String,
  price:         Number,   // Current price in ZAR (parsed float)
  originalPrice: Number,   // Before discount
  discount:      Number,   // Percentage (0–100)
  owned:         Boolean,
  purchasable:   Boolean,
  element:       HTMLElement  // Reference to the actual DOM node
}
```

---

## Filter Logic

- **Checkbox filters** (Owned / Not Owned / Un-Purchasable): OR within group, AND across groups
- **No selection in a group = show all** (inverted/permissive logic)
- **Price/Discount sliders**: inclusive range filter `price >= min && price <= max`
- **Publisher list**: OR across selected publishers; none selected = show all

---

## Sort Logic

- Up to **3 sort levels** applied sequentially (primary → secondary → tertiary)
- Each level: `{ field: String, direction: 'asc'|'desc' }`
- Default sort: `{ field: 'id', direction: 'desc' }` (original Xbox order)
- Sort mutates the DOM node order directly via `parentNode.appendChild()`

---

## Persistence

State is persisted via a **single** `GM_setValue(CONFIG.storage.key, ...)`
call, storing one JSON blob under the key `ifc_xbox_wishlist` — not multiple
top-level keys. The blob contains filter state, sort criteria, and UI
preferences together, read back with `GM_getValue` on init.

Planned features that need new persisted data (flagged items — F-25, price
history — F-27, saved filter presets — F-23) should extend this same blob
rather than introduce parallel storage keys, to keep the userscript and the
extension's `chrome.storage.local` equivalent easy to keep in sync.

---

## Versioning Convention

`major.minor.YYDDD.revision`

| Part | Meaning | Example |
|------|---------|---------|
| major | Breaking change or full rebuild | `1` |
| minor | Feature additions | `4` |
| YYDDD | Year + day-of-year | `26056` = day 56 of 2026 |
| revision | Fix within a day | `5` |

---

## Outcome

> Clean, structured, and **resilient** code that survives Xbox DOM updates via partial class matching (`[class*=]`), with a single CONFIG object as the only place selectors ever need updating.
