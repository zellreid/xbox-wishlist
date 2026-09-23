# Document #4 — Feature Breakdown Document
> *Divide big features into small tasks*

---

## Currently Pending (Carry-over from v1.4)

---

### F-15 — Accordion Label/Title Styling Polish

**Goal:** The title-above-button (Xbox SelectionDropdown style) accordion layout renders correctly but needs final CSS polish.

**Status (v1.5.26266.11):** Done (superseded) - the title-above-button layout below was never built (`.ifc-accordion-title-container` does not exist); the shipped accordion is a single-row Xbox-style header (title left, chevron right) that was visually confirmed on live xbox.com in Edge on 2026-09-23. Step 4 (`IMGExpand` ↔ `IMGCollapse` alternation) is implemented in `createFilterBlock()`. The remaining steps are obsolete.

| Step | Task |
|------|------|
| 1 | Verify `.ifc-accordion-title-container` renders label above chevron button |
| 2 | Confirm `font-size: 0.8125rem`, `color: rgba(245,245,245,0.7)` on label |
| 3 | Confirm hover state lifts label to `rgba(245,245,245,0.9)` |
| 4 | Test expand/collapse with SVG alternation (`IMGExpand` ↔ `IMGCollapse`) |
| 5 | Ensure padding `12px 4px 0 4px` on title, `8px 4px 12px 4px` on button |

---

### F-16 — Dynamic Price Slider Max

**Goal:** Replace hard-coded `R3,000` max with the actual highest price in the loaded wishlist.

**Status (v1.5.26266.5):** Done - max derives from item prices with no 3000 floor (3000 kept only as the no-priced-items fallback); the slider re-ranges live as items render, keeping an active selection clamped. A saved `priceRange` never reaches the slider (`addPriceRangeFilter()` recalculates on build), so no restore clamp was needed. The discount slider got the same live re-ranging and a `max <= min` guard (T-03) in v1.5.26266.7; on both sliders an active selection edge left at the old min/max stays pinned to the new one.

| Step | Task |
|------|------|
| 1 | After `collectItemData()`, compute `Math.ceil(Math.max(...items.map(i => i.price)))` |
| 2 | Round up to nearest 100 for a clean slider end value |
| 3 | Re-initialise noUiSlider with new max if different from current |
| 4 | Update the displayed range label `R 0.00 — R {max}` |
| 5 | Handle edge case: price is `null` or `0` (free/Game Pass items) |

---

### F-17 — Public Wishlist Button Injection

**Goal:** Inject filter/sort buttons on a shared/public wishlist URL where the normal button container doesn't exist.

**Status (v1.5.26266.4):** Done - the shared core creates its own button container when the native menu container is missing ("public wishlist mode").

| Step | Task |
|------|------|
| 1 | Detect public wishlist: `!document.querySelector(CONFIG.selectors.buttonsArea)` |
| 2 | Find stable parent: try `[class*="WishlistPage-module__header"]` or `[class*="SortAndFilters-module__"]` |
| 3 | Create `div.ifc-injected-btn-bar` with appropriate positioning |
| 4 | Insert fallback container into the found parent |
| 5 | Proceed with normal `buildFloatButtons()` using the fallback container |
| 6 | Test on: `xbox.com/en-ZA/wishlist/{longHash}?ocid=...` |
| 7 | Ensure filter/sort panels still position correctly relative to new container |

---

### F-18 — Clear All Filters Button

**Goal:** Single button to reset all active filters to default state.

**Status (v1.5.26266.4):** Done - `clearAllFilters()` in the shared core; persistence goes through the storage adapter rather than `GM_setValue` directly (step 4).

| Step | Task |
|------|------|
| 1 | Add `[Clear All]` button at bottom of filter panel |
| 2 | On click: reset all checkbox states, sliders to full range, publishers to none |
| 3 | Call `applyFilters()` and `updateTags()` |
| 4 | Clear persisted filter state via `GM_setValue(CONFIG.storage.filterState, null)` |
| 5 | Style: subtle ghost button, red-tinted on hover |

---

## Near-Term Features (v1.5)

---

### F-19 — Quick Filter Presets Bar

**Goal:** One-click preset buttons above/below the main button bar.

**Status (v1.5.26266.6):** Done - presets are "Owned", "Not Owned", "On Sale", "≥50% Off" (disabled when no item reaches 50%) and "Cheap" (bottom third of this wishlist's own price spread, replacing the currency-specific "Under R500"). Pills toggle off on a second click and show a filled active state derived from `state.filters` (`getQuickFilterPresets()` / `updateQuickFilterStates()` in the shared core). Since v1.5.26266.8 all quick filter states persist across reloads (range filters are restored too, and the extension no longer overwrites saved state on load).

| Step | Task |
|------|------|
| 1 | Define preset configs array: `[{ label, filterState }, ...]` |
| 2 | Render as a horizontal pill bar injected just below the main button row |
| 3 | On click: apply that filter state, show pills as filled/active |
| 4 | "On Sale" = `discountMin: 1` |
| 5 | "Under R500" = `priceMax: 500` |
| 6 | "≥50% Off" = `discountMin: 50` |
| 7 | "Not Owned" = `notOwned: true` |
| 8 | Clicking active preset toggles it off (reset to default) |

---

### F-20 — Publisher Typeahead Search

**Goal:** Text input at top of Publishers accordion to live-filter the publisher list.

**Status (v1.5.26266.18):** Done - generic `createListSearch()` / `applyListSearch()` in the shared core, used by Publishers and (since v1.5.26266.18) Genres; case-insensitive match, re-applied after every list rebuild. Terms live in `state.ui.listSearch` per list: they only narrow the checkbox list (not a filter), so they aren't saved and Clear All leaves them alone; a ticked option hidden by the search still applies.

| Step | Task |
|------|------|
| 1 | Add `<input type="text" placeholder="Search publishers...">` at top of Publishers content panel |
| 2 | On `input` event: filter visible publisher checkboxes by matching text (case-insensitive) |
| 3 | Hide non-matching publishers, show matching ones |
| 4 | Clear input resets visibility |
| 5 | Style input to match Xbox dark theme |

---

### F-21 — Filtered Result Count in Panel Header

**Goal:** Show active filter impact in the panel title, e.g. "Filters (245 / 298)".

**Status (v1.5.26266.12):** Done (already met) - the "Viewing X of Y results" label (`updateFilterLabels()`) updates on every refresh and sits directly above the open panel, so a second count in the panel heading would duplicate it. Not built; reopen if the heading count is still wanted.

| Step | Task |
|------|------|
| 1 | After each `applyFilters()`, count visible items (`items.filter(i => i.element.style.display !== 'none').length`) |
| 2 | Update panel header text: `Filters (${visible} / ${total})` |
| 3 | Style the count as secondary text colour, smaller font |

---

### F-22 — Active Sort Indicator Badge

**Goal:** Sort button shows a green dot when a non-default sort is active.

**Status (v1.5.26266.12):** Done - `updateSortIndicator()` (from `updateScreen()` and every sort control) shows a `span.ifc-badge-dot` when the sort isn't exactly Default ↓, including a sort restored on load; the button's label becomes "Sort (custom sort active)". A real element rather than `::after` (step 3), because Xbox's button classes use `::after` for their keyboard focus ring.

| Step | Task |
|------|------|
| 1 | After applying sort, check if current sort differs from default (`id desc`) |
| 2 | If non-default: add `.ifc-badge-active` class to sort button |
| 3 | `.ifc-badge-active::after` CSS: small `6px` green circle, `position: absolute`, top-right of button |
| 4 | If default: remove the class |

---

### F-23 — Save/Load Filter Presets

**Goal:** Named filter combinations that persist via `GM_setValue`.

**Status (v1.5.26266.12):** Done - a "Saved filters" block at the bottom of the filter panel: name input + Save (Enter also saves), saved presets as pills with ×. A preset stores Owned/Publishers/Subscriptions and the price/discount ranges (not the search text or the sort); saved in the same storage record as the filters (`presets`). Applying replaces the current filters, with ranges re-fit to the page via `rerangeSelection()`; a pill is green while the filters match it and a second click clears them. Same name (case-insensitive) overwrites; max 20 presets, 30-char names; malformed stored presets are cleaned or dropped on load.

**Note:** Since v1.5 all persistence goes through the shared core's storage adapter (`chrome.storage.local` in the extension, `GM_setValue` in the userscript). Read every `GM_setValue` below as "adapter storage". The same applies to F-25 to F-28.

| Step | Task |
|------|------|
| 1 | Add "Save as preset" input + button at bottom of filter panel |
| 2 | On save: store current filter state under name in `xbw_filter_presets` |
| 3 | Load saved presets from storage on init, render as named pill buttons |
| 4 | On click: apply that preset's filter state |
| 5 | Add × on each saved preset pill to delete it |

---

### F-24 — Export Wishlist Data

**Goal:** Download the filtered wishlist as CSV or JSON.

**Status (v1.5.26266.13):** Done - Export button after Sort (`addExportButton()`), menu "Export N items as CSV / JSON". Exports only the visible items (current filters), in the current sort order. Columns: `title, publisher, price, originalPrice, discountPercent, owned, unpurchasable, url` (no-price items export empty price fields). CSV has a UTF-8 BOM, RFC-4180 quoting and formula-injection protection. Icon: Tabler Icons `file-export` (`shared/icons/export.svg`, resource key `IMGExport`), forced to `fill: none` because Xbox's icon classes fill SVGs.

| Step | Task |
|------|------|
| 1 | Add Export button (icon) to the main button bar |
| 2 | On click: show small dropdown — "Export CSV" / "Export JSON" |
| 3 | CSV: `title,publisher,price,originalPrice,discount,owned` headers + rows |
| 4 | JSON: array of item data model objects |
| 5 | Use `Blob` + `URL.createObjectURL` + `<a download>` trigger |
| 6 | Filename: `xbox-wishlist-{YYYY-MM-DD}.csv` |

---

### F-32 - Refresh Wishlist Data

**Goal:** Re-read the wishlist without a manual page reload.

**Status (v1.5.26266.14):** v1 done - Refresh button (`addRefreshButton()`) saves state and reloads; verified in the mock harness that filters, sort (2 levels), tags, visible count and order come back identical. Steps 1 and 3 below (the fetch-and-parse data layer) remain for F-26 onwards.

**Findings (2026-09-23):** The wishlist page HTML embeds a large preloaded-state JSON (`window.__PRELOADED_STATE__`, about 2.4 MB) that includes the wishlist and per-product data - structured data, independent of Xbox's hashed CSS classes. Swapping fetched item markup into the live list is not viable: that list is owned by Xbox's React app, and foreign nodes would lose React's event handling (BUY/DETAILS) and be undone on the next re-render.

| Step | Task |
|------|------|
| 1 | Live check first: confirm `fetch(location.href)` from the page returns HTML that still contains the preloaded state (the mocks are saved post-render) |
| 2 | v1 Refresh button = persist state (already automatic) + `location.reload()` - zero risk, filters/sort/presets survive |
| 3 | Later, as the data layer for F-26 to F-28: fetch the page, extract and parse the preloaded state, read wishlist + prices, compare with stored prices (no DOM swapping) |
| 4 | Icon: Xbox refresh icon (bundle module #17915) |

---

### F-33 - Product Data Enrichment

**Goal:** Richer per-item data (rating, genres, release date, platforms, pass inclusion, size, ...) for new filters, sorts, columns and price tracking.

**Status (v1.5.26266.16):** Done - loaded once on start; per-item `data-ifc-rating/-rating-count/-genres/-release-date/-deal-ends/-in-pass/-state-price/-state-msrp` via `setProductDataAttributes()`; Rating / Release Date / Deal Ends sorts, Genres filter, "In a pass" quick filter, deal-end badge, export columns; persisted and included in saved filters. Deal start date is not in the data (see F-26). Field inventory: `docs/07-DATA-FIELDS.md`.

**Findings:** The wishlist page's embedded state already holds a product summary for every wishlisted item, so one read (no per-item requests) covers the list. Product pages add only extras (additional information, full ratings/reviews). Fetching every product page would mean hundreds of multi-MB requests - slow and likely to trip rate limiting - so per-item fetches should be lazy, cached and throttled, and only for fields the summary lacks.

| Step | Task |
|------|------|
| 1 | Live checks: embedded-state script present on the live page after load; a fetched page still contains it |
| 2 | Decide which fields to surface first (e.g. rating sort, genre filter, release-date sort, "included with Game Pass" filter) |
| 3 | Decide when to load: on init (cheap, local) vs on demand; `fresh` on Refresh |
| 4 | Copy chosen fields onto items as `data-ifc-*` in `setContainerData()` so filtering/sorting keep reading data attributes |
| 5 | Optional: save a product page as a mock to build/test a lazy per-item fetch for the extras |

---

### F-34 - Deal Types and Product Indicators

**Goal:** Show which deals and product features apply per item ("Just for you" with its reason, On sale with end date, Pre-order, platforms, Optimised for Xbox Series X|S, Smart Delivery, Xbox Play Anywhere), with matching icons.

**Status (v1.5.26266.17):** Done for everything the wishlist page provides - deal type (`personal` / `sale` / `member`), "Just for you" reason, pre-order, platforms; item pills ("Just for you" with reason tooltip, "Pre-order" with Xbox's calendar icon `preorder.svg`); "Just for you" / "Pre-order" quick filters; Platforms filter; export columns; persisted and in saved filters. The badge codes turned out to be subscription logos, not capabilities, so X|S / Smart Delivery / Play Anywhere move to **F-36** (needs product page requests).

**Findings (2026-09-23, wishlist page state):**

| Indicator | From the wishlist page? | Notes |
|---|---|---|
| Just for you (personal offer) | Yes | Marked on the offer, with the reason text ("Because of your loyalty to the franchise"), discount and end date. Personal to the signed-in user. |
| On sale + ends | Yes | Discount % and deal end (already used by F-33) |
| Member prices (Game Pass / PC Game Pass / EA Play) | Yes | With their own message text |
| Pre-order | Yes | Per SKU flag + future release date |
| Platforms | Yes | Xbox One, Xbox Series X\|S, PC, Handheld (multi) |
| Pass inclusion + date added to the pass | Yes | Pass ids only - names not in the data |
| Age rating (board, age, icon) | Yes | |
| Optimised for X\|S, Smart Delivery, Play Anywhere, 4K... | Codes only | Stored as numeric badge codes (0-11); the code-to-name mapping lives in the product page's code, not the wishlist page's |
| Capabilities (4K, 60 fps, single player, PC game pad) | No | Product page only |
| Reviews text | No | Product page only |
| Deal start date | No | Not in the data anywhere - can only be recorded as "first seen" (F-26) |
| Icons for these badges | No | Not in the wishlist page's bundles - expected in the product page's |

| Step | Task |
|------|------|
| 1 | Go through the mocks in `mock_examples/#products` (20 captured) - their state has named capabilities (Optimized for X\|S, Smart Delivery, Play Anywhere, 4K, 60 fps, ...) |
| 2 | Map the wishlist page's badge codes to those names by comparing the same products; extract the badge icons (X\|S, Smart Delivery, Play Anywhere, pre-order, sale tag) from the product pages' code into the icon catalogue |
| 3 | Add per-item fields: dealType (just-for-you / sale / member), dealReason, preorder, platforms, badges |
| 4 | UI: small indicator icons on items + quick filters (e.g. "Just for you", "Pre-order") + Platforms filter; export columns |

---

### F-36 - Product Capabilities via Product Page (lazy)

**Goal:** Per-item Optimized for X|S, Smart Delivery, Xbox Play Anywhere (and other capabilities: 4K, 60 fps, co-op, ...) as indicators and filters.

**Constraint:** Only the product page carries capabilities - one multi-MB request per item (~310 on the mocks). Needs a deliberate fetch strategy.

**Status (v1.5.26266.19):** Done with option (c) - opt-in "Load details" in the Capabilities section: sequential same-origin product page fetches (~2 s apart, shown items first), progress + Cancel, stops on HTTP 429; per-product cache under its own storage key, 7-day expiry, failures retried next run. Capabilities filter (ALL selected must match) with search, tags, persistence, saved filters; X|S / Smart Delivery chips and Play Anywhere chip with Xbox's icon; export column. Harness: fetch pointed at the `#products` mocks (7 of this wishlist's games) - load, cancel, filter, chips, cache-after-reload verified. Other sources checked and rejected: wishlist / deals / browse-games state (no capabilities); the store's bulk product lookup (separate service, needs the user's auth token + new host permission).

| Step | Task |
|------|------|
| 1 | Decide the strategy: (a) on demand per item (click/expand), (b) background fill for visible items, throttled, (c) opt-in "Load details" button - all cached by product id in storage with a TTL |
| 2 | `fetchPageState(product url)` -> read the page product's capabilities -> cache |
| 3 | Indicators: Play Anywhere (Xbox sphere icon #19522 - `node tools/icons/catalogue.js export 19522 play-anywhere`), X\|S and Smart Delivery as text chips (their store images are Microsoft branding) |
| 4 | Capabilities filter; harness test against the `#products` mocks |

---

### F-35 - Deals and Games Browse Page Support

**Goal:** Bring the filter/sort tooling to xbox.com's "Game deals" and "Browse all games" pages (mocks in `mock_examples/#deals` and `#games`).

| Step | Task |
|------|------|
| 1 | Examine both mocks: item markup (class prefixes) and whether the same embedded state is present |
| 2 | Decide scope: those pages already have native sort/filters (platform, genre, price, ...) - add only what they lack (e.g. deal ends, rating, "In a pass", export) |
| 3 | Match patterns / host permissions for the new URLs (manifest change - HITL approval required) |
| 4 | Harness fixtures for those page types |

---

## Future Features (v2.0+)

---

### F-25 — Highlight / Flag Items

| Step | Task |
|------|------|
| 1 | Inject a `★` toggle button on each wishlist item card |
| 2 | On click: toggle flag, update `xbw_flagged_items` array in `GM_setValue` |
| 3 | Flagged items get a visible star indicator and optional highlight border |
| 4 | Sort option: "Flagged first" added to sort field dropdown |

---

### F-26 — Last Seen Price Annotation

| Step | Task |
|------|------|
| 1 | On each page load, read previous prices from `xbw_price_history` |
| 2 | Compare current price to last recorded price per item |
| 3 | If price dropped: show green `▼ was R{x}` badge on item |
| 4 | If price rose: show red `▲ was R{x}` badge |
| 5 | Write current prices back to `xbw_price_history` with today's date |

---

### F-27 — Price History Tracking

| Step | Task |
|------|------|
| 1 | Extend F-26: store full array of `[{ date, price }]` per item |
| 2 | Hover tooltip on price badge shows mini price history list |
| 3 | Prune history entries older than 90 days to avoid storage bloat |

---

### F-28 — Deal Alerts / Notifications

| Step | Task |
|------|------|
| 1 | On page load, compare current prices to previous (from F-26/F-27) |
| 2 | For each flagged item (F-25) where price has dropped ≥ 10% |
| 3 | Fire `GM_notification()` with item name and new price |
| 4 | Add user-configurable threshold (default 10%) |

---

## Open Issues

---

### T-05 - Items with no price sort among the priced items

**Status (v1.5.26266.12):** Done - `applySorting()` sorts items with no price last on the Price, Discount % and Discount Amount levels in either direction, then falls through to the next level.

With a sort such as Discount % ↓ then Price ↑, un-purchasable items (no price) land between the discounted and the non-discounted items: `applySorting()` reads a missing price as `0` and they carry a 0% discount.

| Step | Task |
|------|------|
| 1 | In `applySorting()`, treat a missing value on `ifcPrice`, `ifcPriceDiscountPercent` and `ifcPriceDiscountAmount` (item has no numeric `ifcPrice`) as "missing" |
| 2 | Missing sorts last regardless of asc/desc, then fall through to the next sort level |
| 3 | Leave `ifcId`, name and publisher sorting unchanged |
| 4 | Mock harness: Discount % ↓ + Price ↑ puts every no-price item at the end; Price ↑ and Price ↓ both put them last |

---

### T-10 - Icon set: adopt Xbox icons where they add value

A consolidated catalogue (custom `shared/icons` + icons extracted from both mocks' Xbox bundles and rendered pages) showed no Xbox equivalents for filter, sort or export, so those stay custom; expand/collapse already are Xbox's.

**Status (v1.5.26266.14):** Done for the chosen set - `refresh.svg`, `close.svg` (×) and `plus.svg` (+) adopted from xbox.com's icon set; × and + rendered via `setGlyph()` with a text fallback. Brand badges (Game Pass, EA Play) remain runtime-clone only if ever needed. Icon provenance: expand/collapse/close/plus/refresh = xbox.com; export = Tabler Icons `file-export`; filter/sort = likely iconfont.cn (not recorded at the time).

| Step | Task |
|------|------|
| 1 | Decide which generic Xbox icons to adopt (candidates: refresh for F-32, close/× for tag and preset removal, plus for "+ Add Sort Level") |
| 2 | Brand badges (Game Pass, EA Play): do not bundle - clone the badge the page already renders at runtime (no redistribution of trademarked artwork, always current) |
| 3 | Add each adopted icon as `shared/icons/<name>.svg` + extension `RESOURCE_MAP` + userscript `@resource`; no manifest change (glob covers it) |

---

> **Benefit:** Breaking features into small steps helps AI build **step-by-step, like a developer.**
