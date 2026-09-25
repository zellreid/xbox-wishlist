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

**Status (v1.5.26266.13):** Done - Export button after Sort (`addExportButton()`), menu "Export N items as CSV / JSON". Exports only the visible items (current filters), in the current sort order. Columns: `title, publisher, price, originalPrice, discountPercent, owned, unpurchasable, url` (no-price items export empty price fields). CSV has a UTF-8 BOM, RFC-4180 quoting and formula-injection protection. Icon: Tabler Icons `file-export` (`shared/icons/export.svg`, resource key `IMGExport`), forced to `fill: none` because Xbox's icon classes fill SVGs. **v1.5.26267.5:** redrawn in the Xbox icon format (2048 grid, filled shapes, 128-unit lines, square ends; same design, credited in the file) because the Tabler stroke icon looked heavier and rounder than its neighbours; the `fill: none` workaround is removed. Harness: at toolbar size it matches Xbox's share / edit / settings icons in line weight, 16 px like Refresh, white on green when active in both themes. **v1.5.26267.6 - all non-Xbox toolbar icons conformed:** measured each icon's drawn area in its 16 px box against Xbox's own (share 14.6x14 at 1,1; edit / settings / refresh full 16x16). `sort.svg` had no `viewBox`, so it rendered 15x19 at 4.5,2.5 - too big, off centre and cropped; `filter.svg` was a 1024-grid icon-font glyph (rounded, curved outlines). Both redrawn in the Xbox format (2048 grid, filled, 128-unit lines, square ends) to 14x14 at 1,1: filter keeps its design (funnel + three lines), sort is now the standard down/up arrows glyph. Export rescaled 0.6% to 14 px tall and centred (11.8x14 at 2.1,1). Result: Filter, Sort, Theme 14x14 at 1,1; Export 14 tall, centred; idle colour white (dark) / Xbox grey (light), white on green when open; the sort indicator dot still shows. Harness PASS on all 5 mocks with the new icons loaded. **v1.5.26267.7 - pixel-level polish (live feedback: export fold "overflows by a pixel" top and right):** two causes - (1) the fold's square line ends poked past the outline at the 45-degree corner; (2) the icon had been scaled to fit, so its straight edges sat on fractional pixels (right side 11.4-12.4 px) and blurred across two pixels. Export is now laid out directly on the 16 px toolbar grid (1 px = 128 units): the page outline is one polyline with mitred corners, the fold lines end flat inside it, every straight edge is on a whole pixel (x 2..14, y 1..15, 2 px margins), lines exactly 128. Filter's first and third list lines moved half a pixel (to rows 8-9 and 14-15) so all three sit on whole pixels, evenly spaced; Sort already did. Rasterised at 16 px: export ink in columns 2-13 / rows 1-14 (nothing at the top row or right columns), soft pixels only on the diagonal and arrowhead. Harness PASS on all 5 mocks.

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

**Status (v1.5.26266.19):** Done with option (c) - opt-in "Load details" in the Capabilities section: sequential same-origin product page fetches (~2 s apart, shown items first), progress + Cancel, stops on HTTP 429; per-product cache under its own storage key, 7-day expiry, failures retried next run. Capabilities filter (ALL selected must match) with search, tags, persistence, saved filters; X|S / Smart Delivery chips and Play Anywhere chip with Xbox's icon; export column. Harness: fetch pointed at the `#products` mocks (7 of this wishlist's games) - load, cancel, filter, chips, cache-after-reload verified. Other sources checked: wishlist / deals / browse-games state (no capabilities). The store's bulk product lookup is a separate, undocumented service (auth attached when available but not required) - not used; live check tracked as T-17. v1.5.26266.20 adds a per-item refresh button (same product page read, updates every item with that product id).

### T-17 - Spike: can the store's bulk product lookup replace per-page "Load details"?

**Why:** One request for many products instead of one multi-MB page per product - seconds instead of ~10 minutes for a full wishlist.

**Status (v1.5.26266.22):** Diagnostic built - "Test: faster lookup (T-17, temporary)" at the bottom of the Capabilities section (`runBulkLookupDiagnostic()` in the core). It discovers the bulk request from the page's own request log (resource timing, watched from page load) or a pasted URL, replays it without an Authorization header (GET as seen; POST 20 ids without / with cookies), reports CORS / status / products / capabilities / timing plus a one-store-page baseline, and gives a verdict. Redacted report (no addresses, ids, titles, tokens), with Copy. Harness-tested against a stand-in service.

| Step | Task |
|------|------|
| 1 | Live: reload the extension and the wishlist tab; open any game from the wishlist in the SAME tab, then press Back (the store app loads product data meanwhile, which the watcher records) |
| 2 | Filters > Capabilities > "Run test"; if it reports "no product-data request seen", paste the full product-details request URL from DevTools > Network (filter "productDetails") and run again |
| 3 | Copy the report and share it (it's redacted) - not DevTools screenshots of request headers |
| 4 | Decide (HITL): switch "Load details" to the service only if the verdict is USABLE (capabilities returned, no Authorization header, allowed by the browser, no manifest change) - otherwise keep the store page approach; then remove the diagnostic |

**First live run (2026-09-23) - NOT USABLE *as tested*, but likely fixable:**
- The store app fetches product data from a separate Xbox service with a **per-product** product-details request (GET, JSON, ~0.3 MB with full detail vs a multi-MB store page), not a bulk one on that page.
- CORS is fine: the service allows the `https://www.xbox.com` origin and the headers we need, so the content script can call it without a new host permission (`allowedByBrowser: true` on every attempt).
- Our replay failed with **400 UnsupportedApiVersion**: the site sends an API-version request header (the service advertises version 2.0 for product details). The POST attempts got 405 - the service only allows GET.
- Open question: whether it answers **without** an Authorization header (the app marks auth optional for product info; product details are public).
- The watcher missed the request because it only matched bulk-style paths - extend it to product-details paths.

**Diagnostic v2 (v1.5.26266.24) - built, waiting on the live run:** "Test: faster lookup (T-17 v2, temporary)". The watcher now also records product-details requests (and prefers them). The test re-uses the seen request's shape for games on this wishlist (games already known from "Load details" to have capabilities go first, since many games have none; the id's letter case is kept): GET with API-version header 2.0, never an Authorization header, first without cookies, then with cookies (1.0 tried only if both fail); then 3 more games back to back (averages); then two clearly labelled GUESSES for a many-ids form (same path with `productIds`, sibling products path with `productIds`); then the same game's store page as baseline (time, size, capability count). Verdicts: USABLE MANY AT ONCE / USABLE ONE GAME PER REQUEST (with a service-vs-store-page comparison) / UNCLEAR (answered but no capabilities recognised - the report lists where capability-like fields sit) / NOT USABLE. Redaction tightened: addresses in error text are masked too (the service echoes its own address in errors), id-like strings are masked in any case, and pasted input must be a full https address. Harness-tested against a stand-in service on another port (CORS preflight, 400 without the version header, 405 for POST, logs any Authorization header): per-game, many-ids, version-rejected and bad-paste scenarios all gave the expected verdicts; the service log confirmed GET only, header present, no Authorization header ever sent.

**v2 live run (2026-09-23) - one header short:** version 2.0 passed the version check and was then refused with "MS-CV header missing" (with and without cookies). MS-CV is a correlation vector: a random request-tracing id the site generates per request, not a credential. Version 1.0 is still unsupported. Many-ids guesses: same path with `productIds` = 404 (no such route); sibling `products` path with GET = 405 (route exists, other method). Baseline store page: ~3.1 s, ~680 KB of text. The store app's own per-game request, seen in DevTools, was ~312 KB transferred and took ~2.4 s, so a per-game switch would save transfer size but not much time. A real win needs a many-at-once source.

**Diagnostic v3 (v1.5.26266.25) - built, waiting on the live run:** "Test: faster lookup (T-17 v3, temporary)". It adds (1) a self-generated MS-CV on every service request (random base plus a counter per request, never copied from the page); (2) a labelled POST guess of 10 ids to the sibling `products` path, which will show as blocked by the browser if CORS doesn't allow a JSON body; (3) one probe of Microsoft's public product catalogue (up to 20 ids per request, no cookies or auth). The catalogue counts as USABLE only if its product attributes include every capability key the store page shows for the same game; missing keys are listed. The report now lists the first game's capability keys from each source (public names such as XPA, never ids). Harness-tested against the stand-in, which now requires MS-CV, disallows Content-Type in CORS, and serves a catalogue-shaped route. Scenario "catalogue complete" gave USABLE MANY AT ONCE; scenario "catalogue missing a capability" named it and fell back to USABLE ONE GAME PER REQUEST; the POST was reported as blocked by the browser. Service log: GET only, a fresh MS-CV per call, no Authorization header.

**v3 live run (2026-09-23) - test concluded:**
- Per-game service: **works without cookies or an Authorization header** (API version 2.0 + a self-made MS-CV). It returned the same capability keys as the store page for 4 of 4 games. It is not faster: 1.3 to 2.5 s per game (average of 3 games 2.5 s) vs ~1.3 s for the store page. Size is about half (~300 KB vs ~680 KB). The response also carries ~149 related product summaries; only the requested game has capabilities.
- Public catalogue: 20 games in ~1.1 s without sign-in, but its product attributes are a different list (e.g. Xbox Live, Broadcast) and lacked the store page's FPS Boost key. Package "capabilities" are app permissions. Not a 1:1 replacement (only one game compared).
- The POST to the sibling `products` path passed the browser's CORS check and was refused only for the API version, so a many-ids route exists. Likely without capabilities: the wishlist page's own summaries (probably from a bulk call) have none.
- Most of the "Load details" duration is our deliberate 2 s gap between games, not the source.

**Decision (2026-09-23) - DONE in v1.5.26266.26:** keep store pages for "Load details" and the per-item refresh. The diagnostic is removed (UI block, request watcher, catalogue call, styles). "Load details" now waits 1 s between games instead of 2 s. After an error or an answer slower than 3 s the gap doubles, up to 8 s; after normal answers it halves back toward 1 s; HTTP 429 still stops the run. About half the time for a full wishlist. Harness: shim with 3 failures, 5 successes, then a 429 measured gaps of 100/200/400 then 200/100/50/50/50 ms (50 ms test base), then a clean stop. The learnings above are kept for Digital Unite, to test there when ready (the v4 ideas, POST with other API versions and per-capability catalogue coverage, fit better there). Note: `manifest.json` has had a host permission for the public catalogue since the initial commit; nothing uses it now. Removing it is a manifest change (HITL).

**Digital Unite (2026-09-23):** the per-game xbox.com service is not suitable for Digital Unite's server-side ingestion. It is an undocumented front end for xbox.com, its CORS rules are built around browser requests from www.xbox.com, it needs site-specific headers, and it serves one game per request. Digital Unite already plans the public catalogue (F2-02). What does carry over from here: capability keys (XPA, ConsoleGen9Optimized, ConsoleCrossGen and others), productKind (Game / Durable / Consumable), offer shapes (`endDateUtc` format, XPrice / GamePass / EAAccess eligibility), and, once the v3 live run reports it, whether the catalogue's attributes match store-page capabilities.

| Step | Task |
|------|------|
| 1 | Decide the strategy: (a) on demand per item (click/expand), (b) background fill for visible items, throttled, (c) opt-in "Load details" button - all cached by product id in storage with a TTL |
| 2 | `fetchPageState(product url)` -> read the page product's capabilities -> cache |
| 3 | Indicators: Play Anywhere (Xbox sphere icon #19522 - `node tools/icons/catalogue.js export 19522 play-anywhere`), X\|S and Smart Delivery as text chips (their store images are Microsoft branding) |
| 4 | Capabilities filter; harness test against the `#products` mocks |

---

### T-19 - Light Mode Styling Fix

**Problem:** Our injected UI hard-codes dark colours, so it clashes when xbox.com is in light mode. Xbox marks its theme on `<body>` (`data-theme="dark"` / `class="theme-dark"`; light is expected to be the `light` equivalent - confirm on the light mock).

| Step | Task |
|------|------|
| 1 | Prepare a harness for the light-mode mock `mock_examples/#wishlist/20260923_1603.html`; screenshot every panel, pill, tag, chip, badge and the export menu to list the clashes |
| 2 | Move `styles.css` colours into CSS variables on our own root, with a dark set (current values) and a light set, chosen from the page's theme attribute |
| 3 | Re-check both mocks (dark `20260923_1032`, light `20260923_1603`) visually |

Note (2026-09-23): the light mock was saved with our panel already injected (old version), and the harness re-uses those saved `ifc_` elements, so it shows the old UI. Fine for the style comparison; for behaviour tests, have `prepare-fixture.js` strip saved `ifc_` elements (or re-save the page with the extension off).

**Status (v1.5.26267.1) - Done, needs a live check:**
- **Theme tokens:** `styles.css` now starts with CSS variables: a dark set (the exact previous values, so dark mode is unchanged - 13 sampled computed colours verified identical) and a light set applied by Xbox's own `body[data-theme="light"]`. 49 hard-coded colours moved to tokens: panel (near-white frosted with a soft shadow instead of see-through dark grey), inputs, pills, chips, deal-end badges, item refresh, capability chips (Xbox green instead of pale green on white), warnings (dark amber instead of yellow), export menu, saved filters, sort selects, slider track, checkboxes. Text we don't colour (accordion headings, checkbox labels) inherits the page colour, so it follows the theme by itself. The existing `.theme-dark` rules are untouched.
- **Active toolbar buttons** (green) now always show a white icon; on a light page they kept Xbox's dark icon (poor contrast on green).
- **Duplicate toolbar buttons (found on the light mock):** the toolbar functions only checked their own "added" flags, not the page, so a page that already held our buttons (saved capture, or extension + userscript both installed) got a second, dead set. `floatButtons()` now clears our leftover toolbar items from the container first - exactly one working set.
- **Harness:** the fixture now removes what an earlier copy of the extension injected into a capture and unmarks Xbox's elements before loading the code (the light mock: 467 elements removed, 399 unmarked); `?keepCapture` keeps them to test the duplicate guard.
- Harness PASS on all 3 mocks; light mock checked by screenshot (filter panel, open accordion with checkbox, active pills and tags, sort panel, export menu, capability / DLC / deal-end chips); `?keepCapture`: one toolbar set, Filter button opens the panel.
- Found in passing (not changed, separate task offered): hard-coded Xbox hashed class names in the core (`addFilterContainer`) and `styles.css`, and an unused select2 CSS block.

---

### T-20 - Remove the Unused Public-Catalogue Host Permission

**Why:** `manifest.json` has listed a host permission for Microsoft's public product catalogue since the initial commit. After T-17 nothing uses it, and unused permissions widen what the extension can reach and draw store-review questions.

| Step | Task |
|------|------|
| 1 | HITL: approve the manifest change (AGENTS 2.7 trigger #10) |
| 2 | Remove the entry from `host_permissions`; reload unpacked; check Load details and the per-item refresh still work (both use same-origin store pages) |

---

### T-21 - Remove Hard-Coded Xbox Class Names and Dead CSS

**Why:** Found during T-19. `addFilterContainer()` in the core adds Xbox hashed classes (`SortAndFilters-module__...`, `typography-module__...`), and `styles.css` styles `.Price-module__discountTag___OjGFy` and `.typography-module__xdsBody2___RNdGY`. AGENTS.md forbids these (they break on every Xbox rebuild). `styles.css` also has an unused `.select2-container--xbox` block (the core never uses select2).

| Step | Task |
|------|------|
| 1 | Check each hard-coded class against the current mocks; drop the ones with no effect, route any still needed through `resolveClass()` / `PREFIXES` |
| 2 | Remove the dead select2 CSS |
| 3 | Harness on all mocks; compare computed styles on panels, toolbar and tiles in light and dark before and after |

**Status (v1.5.26267.2) - Done:** every hard-coded hashed name was stale. None of the exact names exist in the Xbox stylesheets captured in the mocks: `SortAndFilters-module__container`, `__filterList`, `__filtersText` and `typography-module__spotLightSubtitlePortrait` have been re-hashed, `Price-module__discountTag` is gone, and `typography-module__xdsBody2` has been re-hashed. All removed; none re-added through `resolveClass()`, because re-adding would change today's look (Xbox browse-page margins and fonts), and these browse-page classes never appear on the wishlist page, so `resolveClass()` could not resolve them anyway. Our own unprefixed classes (`filter-section`, `filter-list`, `filter-text-heading`, `filter-groups`) stay. Removed the unused select2 block (theme and scrollbars) and `.ifc-select2-multi` (-142 CSS lines). The `PREFIXES` map (hash-free prefixes resolved at runtime) is untouched. Verified: 25 elements (both panels with headings and lists, toolbar, label, 4 buttons, 4 tiles with tag rows, price rows and badges) x ~1,300 computed properties, before vs after, on the light (1603) and dark (1032) mocks: 0 differences in 32,614 properties each; the new stylesheet confirmed loaded (no select2 or hashed rules). Harness PASS on all 3 mocks and `?keepCapture`.

---

### F-39 - Light / Dark Mode Toggle

**Goal:** A toolbar button to switch between light and dark.

| Step | Task |
|------|------|
| 1 | Decide scope (HITL question): follow the site theme automatically and only let the button override **our** UI, or switch the **whole page's** theme (Xbox's own setting lives in the site's settings - changing it may need their settings flow) |
| 2 | Build on T-19's variables: button toggles our root's theme class; persisted (storage adapter) |
| 3 | Icon from the catalogue (`tools/icons`) |

**Status (v1.5.26267.3) - Done, needs a live check (also unblocks the T-19 live check - xbox.com has no theme switch of its own):**
- **Scope: the whole page.** Xbox marks its theme in three places and its CSS (and our T-19 tokens) key off them: `<body>` (`data-theme` + `theme-dark`), the store app's wrapper (`appBackground`, `theme-dark`) and the site header (`uhf-theme--dark|light`; the footer keeps its own mark and is left alone). A toggle for our UI only was rejected: the chips on Xbox's game tiles would then sit on the wrong background.
- **Button** "Theme" before Refresh (order: Filter, Sort, Export, Theme, Refresh), an original half-filled-circle icon in the Xbox icon format (`shared/icons/theme.svg`; the catalogue has no sun/moon). An action button (no green "open" state); tooltip says what a click does. Choice saved as `theme` in the existing saved state (not part of filters, Clear All or saved filters).
- **Kept applied:** set straight after the saved state loads; an observer on `<body>`'s theme attributes re-applies it within milliseconds if Xbox's app resets it (it manages `data-theme` and may on in-app navigation); the 1 s route watcher re-applies it to a re-rendered wrapper or header, on every page of the tab.
- **Selectors:** `appBackground` via a new `PREFIXES` entry and `resolveClass()`; the header as `header[class*="uhf-theme--"]` (a plain `uhf-header` prefix would also match `uhf-header-mode-full` / `uhf-header__container`). The mark names live in one `THEME_MARKS` constant.
- **No manifest change:** the icon is covered by the existing `shared/icons/*.svg` wildcard. Userscript `@resource IMGTheme` added.
- **Known limit (decision pending, F-39b):** Xbox loads only the current theme's colour sheet (613 `--gds-*` design variables per theme, ~27 KB; dark `5398…chunk.css`, light `1950…chunk.css`). After switching, anything Xbox draws with those variables (the BUY / DETAILS buttons, its toolbar button backgrounds) is uncoloured until the page is loaded in that theme natively. Our UI, the page background and text are unaffected.
- Harness: dark -> light -> dark restores every mark exactly; light -> dark reproduces the dark capture's marks; saved choice applied on reload (`?persist`); body reset re-applied within 50 ms; wrapper/header reset re-applied on the next watcher tick; PASS on all 3 mocks, no duplicate ids.

**Live feedback (2026-09-24, mocks `20260924_1542_Dark` / `_Light`, the latter saved after switching) - fixed in v1.5.26267.4:**
- **Site header white on white in light:** the header sits inside a `<uhf-header theme="dark|light">` custom element whose `theme` attribute drives `--uhf-header-link-color`. A fourth mark, now switched too (`THEME_MARKS.headerElement`); `<uhf-footer theme="light">` is the same in every capture and stays untouched.
- **F-39b resolved without copying Xbox's CSS:** Xbox's theme is decided server-side (page state `theme: "Dark"|"Light"`, likely from the browser/OS appearance), so there is no cookie or setting to flip. Its main script holds webpack's stylesheet map (`id:"hash"`) and a theme loader that requests the theme chunks side by side (light 1950, dark 5398, high-contrast others). `loadThemeSheets()` finds the loaded numbered theme chunk, reads the map from Xbox's own script (same asset folder; likely names such as `client` tried first, max 15), collects the ids next to the loader's request for the loaded one, fetches candidates and adds a `<link>` only for a sheet that is purely `body[data-theme=<the theme now shown>]` rules plus fonts - so a wrong guess can never restyle the page. Runs only when Xbox's colour variable is missing after a switch; once per page; failure = one console warning, page unchanged otherwise. No hash hard-coded, no manifest change (the asset host already serves these files cross-site).
- **Harness:** fixtures now keep external scripts as inert `text/plain` placeholders with their `src` (never fetched or run), so the finder sees the page's script addresses. Tested with the missing sheet temporarily staged next to each capture (removed afterwards): dark -> light on `1542_Dark` and on the saved broken `1542_Light` (reproduces the screenshot, then fixes it: BUY `rgb(0,135,70)`, header links `rgb(38,38,38)`, toolbar buttons `rgb(216,218,222)` = native light), light -> dark on `1603` (matches native dark `26,27,30` / `45,48,54`); exactly two fetches per switch (Xbox's main script + the one sheet), none when Xbox's colours are already present; without the staged sheet: one warning, no errors, header still fixed. PASS on all 5 mocks.

**Live feedback 2 (2026-09-24, dark page switched to light) - fixed in v1.5.26267.8:**
- **Header logos:** the Microsoft wordmark and the Xbox logo are images with one version per theme (Microsoft `RE1Mu3b` light / `RE1MmB8` dark; Xbox `RW4ESm` / `RW8TP2`; the nav's `logoimageurl` matches). The page state carries the header markup for both themes (`uhf.data.light|dark.headerHtml`); `headerLogos()` parses both once, pairs images by alt text and maps either version's file name to each theme's URL; `applyHeaderLogos()` swaps the rendered header images and the nav's `logoimageurl` (so a component re-render keeps the right one); `needsThemeMarks()` also checks the logos, so the watcher restores them after a re-render. Other header images (the account avatar) are untouched. The nav's `theme` (`cat-theme-white|transparent`) only makes the header background transparent; the header theme already gives #fff / #1b1b1b, matching the page either way - left alone.
- **Xbox colours still missing live:** the saved captures flatten every asset into one folder, but live the theme sheets are under `static/css/` and the scripts under `static/js/` on Xbox's asset host - `loadThemeSheets()` only looked for scripts in the stylesheet's folder, so it never found the stylesheet map. It now takes scripts from the same host. The host serves its assets cross-origin (Xbox's own tags use `crossorigin`), so the fetches are allowed.
- Harness: a stand-in asset host on another port reproduced the live layout (`/xbox-web/static/css|js/`, CORS) with the capture's theme sheet and main script pointed at it. Dark (1032) -> light: script found in `static/js`, light sheet added from `static/css`, logos swapped and loaded, BUY `rgb(0,135,70)`, toolbar `216,218,222`; back to dark restores everything. Light (1603) -> dark: dark sheet added, white logos, BUY green, toolbar `45,48,54`, page `26,27,30` (= native dark). Saved theme applied at load including logos; a simulated header re-render restoring the old logo is corrected within a watcher tick. PASS on all 5 mocks.

**Live feedback 3 (2026-09-24) - fixed in v1.5.26267.9:** after a dark -> light switch the BUY buttons, logos, toolbar and links were right, but the site header's menu layout broke (items scattered, a second row overlapping the list, a grey bar) and showed "My XBOX", which only exists in the light header variant: the header web component rebuilds itself from the other theme's data when its `theme` attribute changes, and its overflow ("More") layout doesn't recalculate. Its scripts are not in the captures, so this was diagnosed from the evidence rather than reproduced. Fix: never change `<uhf-header theme>` (or the nav's `logoimageurl`). The header stylesheet expresses its theme only as CSS variables with `-override` hooks (`--uhf-header-*`: link, hover, dropdown, flyout, cart, mobile border, background, search, and the skip link - two rules, nothing else keyed on the theme), so `applyHeaderColours()` sets the other theme's values as `--uhf-header-*-override` on the component and removes them for its native theme. The values are read by `readHeaderColours()` from a hidden, empty `srcdoc` frame that loads the page's stylesheets and holds plain probe elements (`.uhf-header` outside / inside `<uhf-header theme="dark">`, plus the skip link) - the component isn't registered there, so nothing is built, and computed values are readable even if a cross-host stylesheet's rules are not. Nothing hard-coded; frame removed afterwards; 5 s cap. **v1.5.26267.10 (live screenshots confirmed the header in both modes):** active toolbar buttons now mirror Xbox's own active wishlist menu button (`WishlistPage-module__activeWishlistMenuButton` in the wishlist page's stylesheet: `#107c10` with a `#fff` icon; under `.theme-dark` `#fff` with a `#303030` icon) - `.ifc-active-button` plus a `.theme-dark` variant with those values, so it follows the theme switch; Xbox's class itself isn't borrowed (its hash is only on the page while Edit mode is on). The "highlight" seen on Xbox's Edit button was this active class, not the generic focus style (`--gds-focus-borderColor`, a ring only). Harness: dark open = white / `rgb(48,48,48)`, light open = green / white, both natively and after a switch; sort dot kept; PASS on all 5 mocks. **v1.5.26268.1 (live feedback 4):** (1) grey bar behind the header on a switched light page: the store app's wrappers `div.uhf-header` / `div.uhf-footer` carry `uhf-dark` on dark pages (none on light), and Xbox's rule `.uhf-header.uhf-dark { background: var(--gds-containerSolidAppBackground) }` turns grey once the light colours load (footer: `#000`). A fifth mark: `THEME_MARKS.shellDark`, wrappers found from the `<uhf-header>` / `<uhf-footer>` elements (`shellWrappers()`), toggled in `applyTheme()` and checked by the watcher. Switched light now equals native light (header wrapper transparent, footer `#f2f2f2`). Reproduced in the harness only with the light sheet staged - offline the variable is undefined, which is why earlier harness runs looked fine. (2) active icon colour wrong live: our buttons carry Xbox's `WishlistPage-module__wishlistMenuButton` class, whose colour rules are `!important` with the same specificity as ours; live the extension's CSS loads first so Xbox's won (harness loads ours last). Now `#ifc_ButtonContainer .ifc-active-button` (id-scoped). Harness with our stylesheet moved first and the button really hovered: light green/white, dark white/`#303030`. PASS on all 5 mocks, both switch directions. The `uhf-theme--` class toggle stays (one rule uses it for header link colours). The watcher checks the overrides (`headerColoursWrong()`) instead of the attribute. Harness: dark -> light: attribute stays `dark`, 14 overrides with the light values (link `#262626` etc.), links `rgb(38,38,38)`, logos swapped, nav attribute untouched; back: overrides removed. Light -> dark: attribute stays `light`, header `#1b1b1b`, links white, white logos; a dropped override restored by the watcher. Saved theme applied at load. PASS on all 5 mocks.

---

### F-38 - Run on Product Pages (starting with diagnostics)

**Goal:** Let the extension (and userscript) run on a game's store page too - first to run tests such as T-17 there, later for product-page features.

| Step | Task |
|------|------|
| 1 | Manifest `content_scripts.matches` + userscript `@match` for `/games/store/*` - **manifest change, HITL approval required** |
| 2 | Core: detect page type (wishlist vs product) and only start the wishlist UI on wishlist pages; on product pages start just the tooling needed (e.g. the T-17 test) |
| 3 | Harness fixture from `mock_examples/#products/DEAD OR ALIVE 6_ Core Fighters _ XBOX.html` (prepare-fixture currently targets `#wishlist` only - extend it) |

---

### F-40 - DLC for Wishlist Games (indicator, count, link)

**Goal:** On a game in the wishlist, show that it has DLC, how many, and a link to browse all of it.

**Findings (DOA6 mocks):**
- **"Has DLC" is free:** every game's summary on the wishlist page has a has-add-ons flag (155 of 242 games on the mock). No request needed.
- **The link is free:** the add-ons page is `https://www.xbox.com/<locale>/games/browse/ProductAddOns_<productId>` - built from the product id.
- **The count costs one request per game:** the add-ons page's embedded state carries the total (462 for DEAD OR ALIVE 6) plus the first 25 add-ons as full summaries. Load it lazily and cache it like capabilities (or as part of "Load details" / the per-item refresh).

| Step | Task |
|------|------|
| 1 | Per item: `data-ifc-has-dlc` from the has-add-ons flag; a "DLC" chip-link on games (not on DLC items themselves) opening the add-ons page in a new tab |
| 2 | Count: fetch the add-ons page via `fetchPageState()`, read its total, cache per product id (own key, TTL); show "DLC (462)"; include in per-item refresh and "Load details" |
| 3 | Filter / quick filter "Has DLC"; export `hasDlc`, `dlcCount` |
| 4 | Harness: use `mock_examples/#products/DEAD OR ALIVE 6_ Core Fighters _ XBOX_Add-ons for this game _ XBOX.html` as the fetched add-ons page |

**Status (v1.5.26268.3) - Done, confirmed live 2026-09-25:**
- **Chip-link "Add-ons" / "Add-ons (462)"** on games whose summary has `hasAddOns` (never on DLC or consumables - they keep the F-37 "DLC" chip; different word to avoid confusion). Opens `https://www.xbox.com/<locale>/games/browse/ProductAddOns_<ID>` in a new tab (locale from the item's own URL; format checked against the real page the capture was saved from). Outlined like the Pre-order chip; scoped `.ifc-item-tags a.ifc-item-tag-addons` because Xbox's `a` / `.theme-dark a` link colours otherwise win (green text).
- **Quick filter "Has add-ons"** (`state.filters.hasAddOns`), wired like Pre-order everywhere: saved state, active tag, Clear All, saved presets (older presets default to off), filtering. Attributes `data-ifc-has-add-ons`, `data-ifc-add-ons-count`; export columns `hasAddOns`, `addOnsCount`.
- **Count:** stored in the capability cache entry (`{ caps, at, addOns }`, same 7-day expiry). `isDetailsFresh()` = capabilities fresh and, for a game with add-ons, count known; "Load details" fetches only what is missing (store page, add-ons page, or both - same pause between the two). Per-item refresh fetches the count too. `fetchAddOnsCount()` reads the channel `PRODUCTADDONS_<ID>` (any PRODUCTADDONS channel as fallback). Existing caches only need the counts, not a full reload.
- **Stale flag (v1.5.26268.3):** some flagged games list no add-ons (Torchlight II: the store's own add-ons page says "Failed to Get Channel (0 games)", channel total 0). A loaded count of 0 therefore clears `data-ifc-has-add-ons`: no chip, not matched by "Has add-ons", export `hasAddOns` false with `addOnsCount` 0. Until the count is loaded the flag is trusted. Harness: stubbed store + add-ons pages with total 0 on Torchlight II -> chip removed (157 -> 156), quick filter 156 of 310 without it, not re-queued by "Load details"; a total of 5 on another game still shows "Add-ons (5)".
- **Cost note:** for games with add-ons (about half a wishlist), "Load details" now makes two requests instead of one on first run.
- Harness (`20260924_1542_Dark`, DOA6 on the wishlist): 157 items flagged, all games, chips 157, none on non-games; quick filter 157 of 310 with tag, cleared back; per-item refresh = exactly store page + add-ons page, chip "Add-ons (462)", cache `{ caps: 9, addOns: 462 }`; "Load details": complete game skipped, fresh-caps-no-count game got only its add-ons page, others their store page; count-only run = 1 request, "Loaded 1 of 1", "Details up to date"; chip colours equal the Pre-order chip in dark and light with our stylesheet loaded first. PASS on all 5 mocks.

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
