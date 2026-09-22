# Document #2 — System Design Document
> *This tells AI **HOW** to build it*

---

## Architecture Overview

The project ships two distributions from **one shared, platform-agnostic
core** — no backend, no npm-based build pipeline, no server:

```
xbox-wishlist/
├── xbox-wishlist.user.js          # Userscript (Tampermonkey/Greasemonkey) — GENERATED, do not hand-edit
├── browser-extension/             # Chrome/Edge MV3 extension
│   └── src/
│       ├── manifest.json
│       ├── content.js             # Thin adapter: builds chrome.* adapter, calls XboxWishlistCore.init()
│       ├── background.js
│       ├── popup.html / popup.js
│       ├── icons/                 # Toolbar action icon only
│       └── shared/                # Shared with the userscript build
│           ├── xbox-wishlist.core.js   # All filtering/sorting/DOM logic - the single source of truth
│           ├── styles.css
│           └── icons/             # Filter/sort/expand/collapse SVGs
├── tools/
│   ├── userscript/                # header.template.js + adapter.js + build.js + bump-version.js
│   │                               # concatenate into xbox-wishlist.user.js - see tools/userscript/README.md
│   └── mock-harness/              # Offline test fixture built from a saved wishlist page
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

Both channels now share one version number and one feature set - see
`tools/userscript/README.md` for the build/publish flow. `AGENTS.md` §2.3 is
authoritative for the file/layer map and architectural rules; this document
covers the shared core's design and logic in detail.

---

## Userscript Metadata Header

```js
// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.5.26265.1
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
// @author       ZellReid
// @match        https://www.xbox.com/*/wishlist*
// @run-at       document-body
// @resource     CSSFilter   https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/styles.css?ver=1.5.26265.1
// @resource     IMGFilter   https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/filter.svg
// @resource     IMGSort     https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/sort.svg
// @resource     IMGExpand   https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// ==/UserScript==
```

This header (`tools/userscript/header.template.js`) is only a third of the
generated file. `tools/userscript/build.js` appends `shared/xbox-wishlist.core.js`
in full, then `tools/userscript/adapter.js` (the `GM_*` adapter), into the
`xbox-wishlist.user.js` at the repo root — see `tools/userscript/README.md`.
There is no `@require` for the shared core itself: GreasyFork's code rules
only allow `@require` for well-known third-party libraries, not your own
application logic, so it's inlined instead. The CSS is fetched from the
GitHub raw URL via `@resource CSSFilter` and injected with a small
`addStyle()` helper (not the `GM_addStyle` API).

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

State is persisted via a **single** call through the shared core's
`saveFilterState()`, storing one JSON blob under the key `ifc_xbox_wishlist`
— not multiple top-level keys. The blob contains filter state, sort
criteria, and UI preferences together, read back via `loadFilterState()` on
init. The core itself never calls `GM_*` or `chrome.*` directly - it goes
through the `adapter.storage.save`/`load` callbacks supplied by
`xbox-wishlist.user.js` (`GM_setValue`/`GM_getValue`) or `content.js`
(`chrome.storage.local`) - so both channels persist identically by
construction, not by convention.

Planned features that need new persisted data (flagged items — F-25, price
history — F-27, saved filter presets — F-23) should extend this same blob
rather than introduce parallel storage keys.

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
