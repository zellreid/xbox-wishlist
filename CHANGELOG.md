# Changelog

Canonical version history for both distribution channels — the userscript
(`xbox-wishlist.user.js`) and the browser extension (`browser-extension/`).
As of v1.5, both are built from one shared core
(`browser-extension/src/shared/xbox-wishlist.core.js`) and share a single
version number, so entries from v1.5 onward apply to both channels
identically unless noted otherwise. Versions before v1.5 are kept below as
historical record of the pre-unification parity gap.

Versioning: `major.minor.YYDDD.revision` (`YYDDD` = 2-digit year +
day-of-year). See [tools/userscript/README.md](tools/userscript/README.md)
for how a version is bumped and published.

---

## v1.5.26266.12 (Sep 2026) - No-price items sort last, sort indicator, saved filters

- Fixed (T-05): items with no price (un-purchasable or unreadable) were read
  as price 0 by the sort, so with e.g. Discount % ↓ then Price ↑ they landed
  between the discounted and undiscounted items. On the Price, Discount % and
  Discount Amount levels they now sort last in either direction.
- Added (F-22): a dot on the sort button whenever the sort isn't Default ↓ -
  including a sort restored on load - and the button's label reads "Sort
  (custom sort active)". It's a real element, not `::after`, which Xbox's
  button classes use for their keyboard focus ring.
- Added (F-23): "Saved filters" at the bottom of the filter panel. Name the
  current filters and Save (or press Enter); saved sets appear as buttons that
  apply them, turn green while the filters match, clear them on a second
  click, and have a × to delete. Saves Owned/Publishers/Subscriptions and the
  price/discount ranges (not the search text or sort); stored with the
  filters, so they persist across reloads. Same name overwrites; max 20.
- F-21 closed as already met by the "Viewing X of Y results" label.

---

## v1.5.26266.11 (Sep 2026) - Publisher search (F-20)

- Added a "Search publishers..." box at the top of the Publishers section
  that live-narrows the publisher checkbox list (case-insensitive). It only
  narrows the list - it isn't a filter, isn't saved, and Clear All leaves it
  alone - and it survives the list being rebuilt on every refresh. A ticked
  publisher hidden by the search still applies (its tag stays visible).
- F-15 closed as superseded: the planned title-above-button accordion was
  never built; the shipped single-row header is the final design.

---

## v1.5.26266.10 (Sep 2026) - "Default" sort keeps the wishlist's own order

- Fixed: the Default sort (`ifcId`, which records the order items were added
  to the wishlist - the page exposes no date-added) could stop restoring that
  order. `toggleContainers()` re-numbered `ifcId` from each item's current DOM
  position on every `updateScreen()`, so once another sort had reordered the
  list, the next refresh baked that order into the ids. It already happened
  after "sort, then touch any filter"; v1.5.26266.9's sort persistence made it
  happen on every load with a saved non-default sort. Each item is now
  numbered once, the first time it's seen (while the list is still in page
  order); items that appear later continue below the lowest id so they sort
  after the rest.

---

## v1.5.26266.9 (Sep 2026) - Sort survives a reload

- Fixed: the sort (all levels, field and direction) was never persisted.
  `saveFilterState()` only saved `state.filters`, and the sort controls
  called `applySorting()` directly rather than `updateScreen()`, so a sort
  change never triggered a save at all. The sort criteria are now saved with
  the filters, every sort control saves via `onSortChanged()`, and
  `loadFilterState()` restores them - accepting only known fields,
  `asc`/`desc`, and up to 3 levels, falling back to the default sort otherwise.

---

## v1.5.26266.8 (Sep 2026) - Filters (and quick filter pills) survive a reload

- Fixed (extension only): saved filters could be wiped on page load.
  `initialize()` didn't wait for `chrome.storage.local.get`, so when the
  wishlist was already rendered the panel was built - and `updateScreen()`
  saved - on the empty defaults before the saved state arrived, overwriting
  it. `loadFilterState()` now returns a Promise that `initialize()` awaits
  (and still resolves if storage throws). The userscript was unaffected
  (`GM_getValue` is synchronous).
- Price and discount range filters are now restored on load, including
  whether they're active, so "On Sale", "≥50% Off" and "Cheap" (and any
  manual slider selection) persist like the checkbox filters. Previously they
  deliberately started fresh each load. The saved selection is re-applied to
  the current page's range by the same `rerangeSelection()` rules used when
  the range shifts. The search box still starts empty.
- Correction to v1.5.26266.6: its note that pills stay in sync with
  "restored filters" only held for checkbox filters, and only in the userscript.
- Mock harness: its `chrome.storage` stand-in now answers asynchronously and
  can keep data across reloads with `?persist` (see
  `tools/mock-harness/README.md`), so both bugs above reproduce there.

---

## v1.5.26266.7 (Sep 2026) - Discount slider label fix; range edges stay pinned

- Fixed: the discount slider label could stay at "0% - 100%" while the
  real range was e.g. 10% - 85%. When the filter panel is built before the
  discount badges render, the slider starts on the 0-100 fallback; the later
  re-range updated the bounds but not the label or step. The discount slider
  now re-ranges the same way the price slider does since F-16.
- Both sliders: when the range changes while a filter is active, a selection
  edge that sat at the old min/max now stays pinned to the new one (so
  "≥50% Off" still means 50% and up after a bigger discount appears);
  edges inside the range are still kept and clamped.
- Fixed (T-03): a wishlist where every discount rounds to the same value
  produced a zero-width discount slider (NaN fill); it now gets a 5-wide range.

---

## v1.5.26266.6 (Sep 2026) - Quick filters toggle and show their state (F-19)

- Quick filters are now toggles: clicking an active one clears just that
  filter. Active pills are filled Xbox green and set `aria-pressed`.
- Active state is derived from the live filter state, so pills stay in sync
  after slider drags, tag removal, checkbox changes, Clear All and restored
  filters. Presets on the same filter replace each other (Owned/Not Owned,
  On Sale/≥50% Off); presets on different filters combine.
- Added "Not Owned" and "≥50% Off" presets. "≥50% Off" is disabled when no
  item on the wishlist is discounted that much. "Under R500" from the
  original spec stays replaced by "Cheap", which is currency-neutral.

---

## v1.5.26266.5 (Sep 2026) - Price slider max follows the wishlist (F-16)

- The price slider's max is now the wishlist's highest price (rounded up to
  10) instead of being floored at 3000. 3000 remains only as the fallback
  when no item has a price; a single-price wishlist gets a 10-wide range
  instead of a zero-width slider.
- As more items render, an untouched price filter now follows the full new
  range (thumbs, step and label all update); an active selection is kept and
  clamped inside it. Previously the label went stale and the fill bar was
  drawn against the slider's original range.
- Fixed: when the range isn't a multiple of the slider step, the browser caps
  the max thumb one partial step short of the true max (e.g. 1950 of 1960),
  so dragging to the end silently hid the most expensive items. The last
  thumb position now counts as the true max. Applies to the discount slider too.

---

## v1.5.26266.4 (Sep 2026) — Remove dead popup/service worker; slider reset bug fix

- Removed `popup.html`, `popup.js`, and `background.js` entirely, along
  with `manifest.json`'s `background` and `action.default_popup` keys.
  They implemented "Quick Filter" presets and a "remember filters" toggle
  that never actually worked (the presets messaged a listener that didn't
  exist; the toggle was saved/read but never consulted), and became fully
  redundant once equivalent Quick Filters/Clear All/persistence landed in
  the shared core - which works in both the extension and the userscript,
  unlike a popup ever could.
- Fixed a real bug: after dragging the price or discount range slider,
  clicking a tag's × or Clear All would not actually remove that filter.
  `createRangeSlider()`'s `isUserInteraction` flag was set true on
  `mousedown`/`touchstart` and never reset, so it latched permanently after
  the first real drag - every later *programmatic* slider sync (a reset, a
  quick filter, Clear All) also dispatches an `input` event to move the
  thumb visually, and with the flag stuck true that re-fired the slider's
  own `onChange`, which set `enabled` back to `true` and undid the reset.
  Fixed by scoping the flag to the actual drag gesture
  (`mousedown`/`touchstart` → `mouseup`/`touchend`).

---

## v1.5.26265.2 (Sep 2026) — Shared core, both channels unified

- Extracted all filtering/sorting/DOM logic out of both the userscript and
  `content.js` into one platform-agnostic core,
  `browser-extension/src/shared/xbox-wishlist.core.js`, driven through a
  small adapter (storage + resource-URL callbacks) so it never calls
  `chrome.*` or `GM_*` directly. `content.js` and `xbox-wishlist.user.js`
  are now thin adapters only.
- `xbox-wishlist.user.js` is now a **generated** file
  (`tools/userscript/build.js`), inlining the shared core rather than
  `@require`-ing it from GitHub — GreasyFork's code rules only allow
  `@require` for well-known third-party libraries, not your own app logic.
- Added `tools/userscript/bump-version.js` — bumps `major.minor.YYDDD.revision`,
  rebuilds the userscript, and writes the same version into
  `browser-extension/src/manifest.json`, ending the two channels' previously
  independent versioning.
- Added `tools/mock-harness/` — turns a locally saved wishlist page into an
  offline fixture that boots the real extension code against it, for
  regression-testing changes without touching xbox.com.
- Fixed **ISSUE-001**: `popup.js`'s `persistFilters` setting moved from
  `chrome.storage.sync` to `chrome.storage.local`, matching the core.
- Fixed a Filter/Sort panel bug: opening one while the other was open closed
  both instead of switching, due to the two toggle functions recursively
  calling each other. Split into non-recursive `setFilterVisible`/
  `setSortVisible` setters.
- Moved the "Viewing X of Y results" label above the filter/sort buttons,
  and moved several hard-coded inline styles (button container position,
  discount badge margin, panel show/hide) out of JS and into `styles.css`.
- Docs audit: brought `SKILL.md` and `docs/02-SYSTEM-DESIGN.md` in line with
  the shared-core architecture (they still described the old
  independently-maintained content.js/userscript split).

---

## Userscript

### v1.4.26057.1 (Feb 2026)
- Housekeeping revision on top of v1.4.26056.5 (resource/version bump).

### v1.4.26056.5 (Feb 2026)
- Public/shared wishlist support — injects a fallback button container when
  the native `wishlistMenuButton` container is absent (F-17).
- Expand/collapse chevron icon toggle fix on accordion sections.
- Price slider max now derives from the loaded wishlist's actual prices
  instead of a hard-coded ceiling (F-16).
- Checkbox colors reverted to white, scrollbar to Xbox green.
- "BUY AS A GIFT" button detection added for public wishlists.

### v1.3 (Jan 2026)
- Multi-level sort — up to 3 criteria, each with independent asc/desc (F-08, F-09).
- Resilient CSS module class resolution via `resolveClass()` (F-11).
- SVG icon resources for filter/sort/expand/collapse, loaded via `@resource`.
- Accordion-based collapsible filter groups (F-13, F-14).

### v1.2 (Nov 2025)
- Select2 multi-select dropdowns for publisher filtering.
- Active filter tag bar with one-click removal (F-06).
- Inverted filter logic — no selection in a group shows all (F-07).
- Price and discount range dual-handle sliders (F-04, F-05).

### v1.1 (Nov 2025)
- Publisher filtering added.

### v1.0 (Nov 2025)
- Initial release: price precision fixes, discount badges injected on items.

---

## Browser Extension

### v1.4.0 (May 2026) — unpublished, not yet at userscript parity
Initial port of the v1.4 userscript to a Chrome/Edge Manifest V3 extension.

- Ported core filtering/sorting logic from the userscript into `content.js`,
  swapping Tampermonkey `GM_*` APIs for Chrome extension APIs
  (`chrome.storage`, `chrome.runtime.getURL`).
- Added `popup.html`/`popup.js` — quick filter presets (Owned, Discounted,
  Cheap) and a "remember filters" toggle, not present in the userscript.
- Added `background.js` service worker for popup ↔ content-script messaging.
- Generated toolbar icon set (16/48/128/192px, Xbox green with white X mark).
- Fixed CSP violation: replaced inline `onclick` handlers in `popup.html`
  with `data-filter` attributes + `addEventListener` in `popup.js` (MV3
  blocks inline event handlers).
- Removed the deprecated `webRequest` permission from `manifest.json` (not
  valid in Manifest V3).
- **Known gap (resolved in v1.5):** this port predated the userscript's
  F-16/F-17 work (dynamic price slider max, public wishlist support) and had
  a storage split between `chrome.storage.sync` in `popup.js` and
  `chrome.storage.local` in `content.js` (ISSUE-001). Both were closed by
  the v1.5 shared-core unification above.
- Not yet submitted to the Chrome Web Store — sideload only
  (`chrome://extensions` → Load unpacked → `browser-extension/src`).

---

## Unreleased / In Progress

- Repo documentation audit: consolidated redundant status docs, corrected
  stale local-path references, added `CONTRIBUTING.md`, `SECURITY.md`, and
  `docs/06-TESTING.md`.
