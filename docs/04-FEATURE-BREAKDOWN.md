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

**Status (v1.5.26266.11):** Done - `applyPublisherSearch()` in the shared core; case-insensitive match on the publisher name, re-applied after every list rebuild. The term lives in `state.ui.publisherSearch`: it only narrows the checkbox list (not a filter), so it isn't saved and Clear All leaves it alone; a ticked publisher hidden by the search still applies.

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

| Step | Task |
|------|------|
| 1 | After each `applyFilters()`, count visible items (`items.filter(i => i.element.style.display !== 'none').length`) |
| 2 | Update panel header text: `Filters (${visible} / ${total})` |
| 3 | Style the count as secondary text colour, smaller font |

---

### F-22 — Active Sort Indicator Badge

**Goal:** Sort button shows a green dot when a non-default sort is active.

| Step | Task |
|------|------|
| 1 | After applying sort, check if current sort differs from default (`id desc`) |
| 2 | If non-default: add `.ifc-badge-active` class to sort button |
| 3 | `.ifc-badge-active::after` CSS: small `6px` green circle, `position: absolute`, top-right of button |
| 4 | If default: remove the class |

---

### F-23 — Save/Load Filter Presets

**Goal:** Named filter combinations that persist via `GM_setValue`.

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

| Step | Task |
|------|------|
| 1 | Add Export button (icon) to the main button bar |
| 2 | On click: show small dropdown — "Export CSV" / "Export JSON" |
| 3 | CSV: `title,publisher,price,originalPrice,discount,owned` headers + rows |
| 4 | JSON: array of item data model objects |
| 5 | Use `Blob` + `URL.createObjectURL` + `<a download>` trigger |
| 6 | Filename: `xbox-wishlist-{YYYY-MM-DD}.csv` |

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

With a sort such as Discount % ↓ then Price ↑, un-purchasable items (no price) land between the discounted and the non-discounted items: `applySorting()` reads a missing price as `0` and they carry a 0% discount.

| Step | Task |
|------|------|
| 1 | In `applySorting()`, treat a missing value on `ifcPrice`, `ifcPriceDiscountPercent` and `ifcPriceDiscountAmount` (item has no numeric `ifcPrice`) as "missing" |
| 2 | Missing sorts last regardless of asc/desc, then fall through to the next sort level |
| 3 | Leave `ifcId`, name and publisher sorting unchanged |
| 4 | Mock harness: Discount % ↓ + Price ↑ puts every no-price item at the end; Price ↑ and Price ↓ both put them last |

---

> **Benefit:** Breaking features into small steps helps AI build **step-by-step, like a developer.**
