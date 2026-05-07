# Document #2 — System Design Document
> *This tells AI **HOW** to build it*

---

## Architecture Overview

This is a **single-page userscript injection** — no backend, no build pipeline, no server. Two files compose the entire system:

```
xbox-wishlist/
├── xbox-wishlist.user.js     # Core logic (currently ~1041 lines)
├── xbox-wishlist.user.css    # Injected styles (currently ~751 lines)
├── HANDOFF-DOCUMENT.md       # Session continuity doc
├── README.md                 # Public-facing docs
└── docs/
    ├── 01-PRD.md
    ├── 02-SYSTEM-DESIGN.md
    ├── 03-UI-UX-WIREFRAMES.md
    ├── 04-FEATURE-BREAKDOWN.md
    └── 05-MASTER-PROMPT.md
```

---

## Script Metadata Header

```js
// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.4.26056.5
// @description  Advanced filtering and sorting suite
// @author       ZellReid
// @match        https://www.xbox.com/*/wishlist*
// @require      https://cdn.jsdelivr.net/.../noUiSlider.min.js
// @resource     IMGFilter   ./assets/filter.svg
// @resource     IMGSort     ./assets/sort.svg
// @resource     IMGExpand   ./assets/expand.svg
// @resource     IMGCollapse ./assets/collapse.svg
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceURL
// ==/UserScript==
```

**URL match pattern:** `https://www.xbox.com/*/wishlist*`
- `/*/` captures locale (en-ZA, en-US, etc.)
- trailing `*` captures own wishlist AND public shared wishlist URLs

---

## CONFIG Object (Single Source of Truth)

All IDs, selectors, and constants live in one `CONFIG` object at the top of the script:

```js
const CONFIG = {
  version: '1.4.26056.5',
  ids: {
    filterContainer:  'ifc_filter_container',
    sortContainer:    'ifc_sort_container',
    filterBtn:        'ifc_btn_filter',
    sortBtn:          'ifc_btn_sort',
    tagContainer:     'ifc_tag_container',
  },
  selectors: {
    // Resilient selectors — match by partial class name using [class*=]
    wishlistItem:     '[class*="WishlistItem-module__"]',
    buttonsArea:      '[class*="WishlistPage-module__wishlistMenuButton"]',
    itemTitle:        '[class*="ProductCard-module__title"]',
    itemPrice:        '[class*="Price-module__"]',
    itemPublisher:    '[class*="ProductCard-module__developerName"]',
    itemImage:        '[class*="ProductCard-module__image"]',
  },
  storage: {
    filterState:      'xbw_filter_state',
    sortState:        'xbw_sort_state',
    flaggedItems:     'xbw_flagged_items',
    priceHistory:     'xbw_price_history',
    filterPresets:    'xbw_filter_presets',
  },
  defaults: {
    priceMax:         3000,   // Overridden at runtime by dynamic calculation (F-16)
    discountMax:      100,
  }
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

### Public / Shared Wishlist (F-17)
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

All state persisted via `GM_setValue` as JSON strings:

| Key | Contents |
|-----|----------|
| `xbw_filter_state` | `{ owned, notOwned, unPurchasable, publishers[], priceMin, priceMax, discountMin, discountMax }` |
| `xbw_sort_state` | `[ { field, direction }, ... ]` (up to 3) |
| `xbw_flagged_items` | `[ id, id, ... ]` |
| `xbw_price_history` | `{ [id]: [ { date, price }, ... ] }` |
| `xbw_filter_presets` | `{ [name]: filterState }` |

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
