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

## v1.5.26268.7 (Sep 2026) - Flag games (F-25), filter button dot

- New star next to each item's refresh button: click it to flag the game.
  Flagged games get a gold star and a gold bar down the tile's left edge,
  and stay flagged across visits (saved per game, so every copy of the
  game - and the same game on a shared wishlist - shows it).
- New quick filter "Flagged", sort option "Flagged" (flagged first), and
  a `flagged` export column.
- The filter button now shows the same green dot as the sort button while
  any filter (including a search) is applied, and drops it when none is.

## v1.5.26268.6 (Sep 2026) - Counts on the Owned filter

- The Owned, Not Owned and Un-Purchasable checkboxes now show how many
  items each covers, like the other filter groups (e.g. "Not Owned (252)"),
  and their active tags carry the count too.

## v1.5.26268.5 (Sep 2026) - Toolbar buttons on shared wishlists

- Fixed: on a shared (public) wishlist the toolbar buttons had no
  background and, in dark mode, near-invisible icons. That page has no menu
  buttons of its own to copy the look from, so the buttons now use their
  own style mirroring Xbox's (same size, corners and colours per theme,
  lighter on hover, darker when pressed, focus outline). The open-panel
  highlight (green / white) works there too.

## v1.5.26268.4 (Sep 2026) - Remove dead styles (T-22)

- Removed about 60 lines of unused styles (old subscription and discount
  tile tints, empty and unused panel rules, two unread colour variables,
  dark-mode copies identical to the normal rule) and one unused class-name
  prefix. No visible change: computed styles on the panels, toolbar and
  tiles are identical before and after in light and dark.

## v1.5.26268.3 (Sep 2026) - Add-ons: hide games that list none

- Fixed: some games (e.g. Torchlight II) are marked by the store as having
  add-ons, but their add-ons page lists none (the store itself shows
  "Failed to Get Channel (0 games)"). Once "Load details" or the refresh
  button finds 0, the "Add-ons" link is removed and the game no longer
  counts for the "Has add-ons" quick filter. Export shows hasAddOns false,
  addOnsCount 0.

## v1.5.26268.2 (Sep 2026) - Add-ons for wishlist games (F-40)

- Games that have add-ons (DLC) on the store now show an "Add-ons" link
  under the title; it opens the store's list of that game's add-ons in a
  new tab. No extra requests - the page already says which games have them.
- "Load details" and the per-game refresh button also read how many add-ons
  there are, so the link becomes "Add-ons (462)". Kept for 7 days like the
  capabilities; games that already have details only need the count.
- New quick filter "Has add-ons", and two new export columns (hasAddOns,
  addOnsCount).

## v1.5.26268.1 (Sep 2026) - Theme switch: header bar, footer, active icons

- Fixed: on a page switched to light, the bar behind the Microsoft header
  was grey (and the footer stayed black). The store app marks its header
  and footer wrappers as dark on a dark page; the switch now updates that
  mark too, so both look exactly as on a natively light page.
- Fixed: the icon on an open panel's toolbar button had the wrong colour on
  the live site (dark on green in light mode, white on white in dark mode):
  Xbox's own menu button colours were winning because its stylesheet loads
  after the extension's. The extension's colours now take priority.

## v1.5.26267.10 (Sep 2026) - Active buttons match Xbox's own

- An open panel's toolbar button (Filter, Sort, Export) now looks like
  Xbox's own active "Edit wishlist" button: white with a dark icon on a
  dark page, green with a white icon on a light page. It was always green
  before. Follows the Theme switch too.

## v1.5.26267.9 (Sep 2026) - Theme switch keeps the site header intact

- Fixed: after switching theme, the Microsoft site header's menu fell
  apart (items scattered over two rows, a second row overlapping the list,
  a grey bar). The header rebuilds itself when its own theme setting
  changes, so the extension no longer touches that setting. It now only
  changes the header's colours - through the colour settings the header
  itself provides, with the values read from Xbox's own stylesheets - and
  its logos.

## v1.5.26267.8 (Sep 2026) - Theme switch: logos and Xbox colours on the live site

- Fixed: after switching theme, the Microsoft and Xbox logos in the site
  header stayed in the other theme's version (white logos on a white
  header). They are images with a light and a dark version; the page
  carries both, and the switch now uses the right one.
- Fixed: on the live site, Xbox's own colours for the other theme (the BUY
  buttons and the toolbar button backgrounds) still didn't load after a
  switch. Xbox keeps its scripts and stylesheets in different folders on
  its asset server, and the extension only looked in one of them.

## v1.5.26267.7 (Sep 2026) - Crisper Export and Filter icons

- Fixed: the Export icon's folded corner looked like it spilled over the
  top and right edges. The overlapping square line ends at the fold are
  replaced by clean pointed corners, and the icon is re-laid on the
  toolbar's pixel grid so its straight lines fall on whole pixels (they
  were half a pixel off, which blurred them across two pixels).
- The Filter icon's three lines also sit on whole pixels now, evenly spaced.

## v1.5.26267.6 (Sep 2026) - Filter and Sort icons match the Xbox icons

- The Filter and Sort icons are redrawn in Xbox's icon style too, so all of
  our toolbar icons now share Xbox's line weight, square line ends and
  size (14 px, 1 px in from the edge, like Xbox's share icon).
- Fixed: the Sort icon was drawn too large for its button, pushed off
  centre and cropped (the file had no scaling information). It is now the
  standard down-and-up arrows sort symbol.
- The Export icon is now exactly the same height as the others, centred.

## v1.5.26267.5 (Sep 2026) - Export icon matches the Xbox icons

- The Export button's icon was drawn in a different icon style (thicker,
  rounded lines). It is now redrawn in Xbox's own icon style - same
  design, with the thinner lines and square ends of the other toolbar
  icons - and takes their colours like the rest (white when active).

## v1.5.26267.4 (Sep 2026) - Theme switch fixes

- Fixed: after switching to light, the Microsoft site header (Game Pass,
  Games, Devices...) was white on white. Its links take their colour from
  a theme setting on the header itself, which the switch now updates too.
- Fixed: after a switch, Xbox's own BUY / DETAILS buttons and the toolbar
  button backgrounds lost their colours. Xbox only loads the colours for
  the theme the page opened in; the extension now loads Xbox's own colour
  sheet for the other theme when you switch (found on the page each time,
  so it keeps working after Xbox updates its site). If that ever fails, the
  page stays usable and only those Xbox colours are missing.

## v1.5.26267.3 (Sep 2026) - Light / dark toggle

- New "Theme" button in the toolbar, before Refresh, switches the whole
  wishlist page between light and dark (xbox.com has no switch of its own).
  The choice is remembered, and re-applied if the store app resets the
  theme while you browse within the tab.
- Known limit: Xbox only loads the colours for the theme the page opened
  in, so after switching, Xbox's own buttons (BUY, DETAILS) show without
  their colours until the page is opened in that theme. The extension's own
  panels, chips and menus switch fully.

## v1.5.26267.2 (Sep 2026) - Drop hard-coded Xbox class names and dead CSS

- No visible change. The filter and sort panels no longer carry Xbox's
  hashed class names (for example `SortAndFilters-module__container___...`),
  and two stylesheet rules written against hashed Xbox names are gone. Xbox
  had already re-hashed or dropped every one of them, so none had any effect,
  and hard-coded hashed names break whenever Xbox rebuilds its site.
- Removed the unused select2 styles (the extension never used select2).

## v1.5.26267.1 (Sep 2026) - Light mode

- Our panels, pills, chips and menus now follow Xbox's light or dark theme.
  On a light page the filter and sort panels are a light frosted card with
  dark text instead of a see-through dark grey, and chips, deal-end badges,
  the export menu, checkboxes and sliders use colours that read on white.
  Dark mode looks exactly as before.
- Active (green) toolbar buttons now always show a white icon.
- Fixed: the toolbar buttons could appear twice when the page already held
  a set from another copy of the extension (for example the extension and
  the userscript both installed). Leftovers are now cleared, leaving one
  working set.

## v1.5.26266.26 (Sep 2026) - Faster "Load details"; lookup test removed

- "Load details" now reads about one game a second instead of one every
  2 seconds, roughly halving the time for a full wishlist. If Xbox answers
  with an error or slowly, it automatically waits longer between games (up
  to 8 seconds), then speeds back up once answers are normal again. If Xbox
  says it's limiting requests, the run still stops.
- Removed the temporary "Test: faster lookup" block (T-17). The test showed
  the store pages remain the right source: the store's own product service
  works but isn't faster, and the public catalogue is fast but doesn't carry
  all the capabilities the store pages show.

## v1.5.26266.25 (Sep 2026) - Lookup test v3 (T-17, temporary)

- The v2 live run showed the product-data service wants one more header: a
  request-tracing id (MS-CV). It's a random id the site makes up for each
  request, not a login, so the test now makes its own. Still GET only, still
  never an Authorization header.
- Added a labelled guess that POSTs a list of games to the service's
  "products" address (v2 showed that address exists but refuses GET).
- Added one probe of Microsoft's public product catalogue, which answers
  up to 20 games per request without sign-in. It only counts as usable if
  it has every capability the store page shows for the same game, and the
  report lists anything missing.

## v1.5.26266.24 (Sep 2026) - Lookup test v2 (T-17, temporary)

- The temporary "Test: faster lookup" in the Capabilities section is now v2,
  based on the first live run: it recognises the store app's per-game
  product-data request, and repeats it for games on your wishlist with the
  API-version header the service requires, GET only, and never an
  Authorization header (first without cookies, then with). It then times
  3 more games, tries two clearly labelled guesses at a many-games-at-once
  request, and compares size, time and capability count with the same game's
  store page. Games already known (from "Load details") to have capabilities
  are tested first.
- The report is stricter about privacy: addresses inside error messages are
  masked too, and a pasted request must be a full https address.

## v1.5.26266.23 (Sep 2026) - Survive in-app navigation (open a game, then Back)

- Fixed: opening a game from the wishlist in the same tab and pressing Back
  left the plain Xbox wishlist - no toolbar buttons, filters or badges. Not
  caching: the store app switches pages without a reload and rebuilds the
  wishlist from scratch on Back (new toolbar, new item elements), while our
  one-time setup had already finished. A light once-a-second check now re-runs
  the normal setup when the toolbar is missing on a wishlist page (filters,
  sort, saved filters and cached details all re-apply; items are re-numbered
  from page order so Default sort stays correct), and closes our panels while
  you're on another page.
- Fixed underneath it: the element lookup cache could hand back an element
  the page had since removed (here the old toolbar), so new buttons went into
  a detached element. Cached elements are now reused only while still attached.
- Filter / Sort buttons now wire their own clicks (the panels survive the
  rebuild); the Export menu's page-wide click / Escape handlers are registered
  once and no longer point at an old menu.

---

## v1.5.26266.22 (Sep 2026) - T-17 lookup test (temporary diagnostic)

- Added a temporary **"Test: faster lookup (T-17)"** block at the bottom of the
  Capabilities section. It answers whether the store app's own bulk product
  lookup could replace per-page "Load details": it discovers the request from
  the page's own request log (or a URL pasted from DevTools), replays it three
  ways without any Authorization header (as seen; POST with 20 product ids, no
  cookies; the same with cookies), checks whether the browser allows it, how
  many products come back and how many carry capabilities, times one store
  page fetch for comparison, and gives a verdict. The report is shown in a box
  with **Copy report** and logged to the console - redacted by design (no
  addresses, product ids, titles or tokens).
- To be removed once T-17 is decided (section marked in the core).

---

## v1.5.26266.21 (Sep 2026) - Handle the extension being reloaded under an open tab

- Fixed (extension only): after the extension was reloaded or updated while a
  wishlist tab stayed open, the tab's old copy kept running and every action
  (e.g. an item's refresh button) threw "Extension context invalidated" -
  several errors per click on the extensions page. The adapter now detects the
  lost connection (`isAlive()`) and makes its chrome.* calls no-ops; the core
  stops once and cleanly: stops watching the page, cancels a running "Load
  details", disables its controls, and replaces "Viewing X of Y" with
  "Xbox Wishlist Manager was updated - reload this page to keep using it".
  The userscript can't hit this and is unchanged.
- Mock harness: the fake `chrome` now has `runtime.id` (delete it to simulate
  an extension reload).

---

## v1.5.26266.20 (Sep 2026) - Per-item refresh, DLC / Type filter

- Every item's tag row now starts with a small **refresh** button. It reads
  that game's store page and updates **every item with the same product id**:
  capabilities (cached like "Load details") plus, for this session, rating,
  deal, pre-order, platforms and type. Busy spinner while loading; the tooltip
  says when it last refreshed or why it failed (click to retry). The click
  never triggers Xbox's own item link. The shown price is Xbox's markup and
  still only changes on a page reload.
- New **Type** filter (Game / DLC / Consumable, from the product kind in the
  page's data - no extra requests), with a **DLC** / **Consumable** chip on
  those items. Tags, Clear All, persistence and saved filters as usual; export
  gets a `type` column.
- Correction to v1.5.26266.19's notes: the store's internal bulk product
  lookup attaches the signed-in user's authorization *when available* but does
  not require it. It remains unused - it's an undocumented separate service -
  pending a live check of whether it returns capabilities (T-17).

---

## v1.5.26266.19 (Sep 2026) - Capabilities via "Load details" (F-36)

- New **Capabilities** filter section (Optimized for Xbox Series X|S, Smart
  Delivery, Xbox Play Anywhere, 4K, 60 fps+, HDR, co-op / multiplayer modes,
  ...). These exist only on each game's store page, so they're loaded on
  request: **"Load details"** reads the store pages one at a time (about every
  2 seconds, shown games first), with progress and Cancel, and stops if Xbox
  rate-limits. Results are cached per product for 7 days (own storage key), so
  they show immediately on later visits; failed pages are retried next time.
- An item must have **all** selected capabilities; items without loaded
  details don't match. Tags, Clear All, persistence and saved filters as usual;
  the section has its own search box.
- Items with loaded details show **X|S**, **Smart Delivery** and **Play
  Anywhere** (Xbox's icon, new `play-anywhere.svg` - exported with the new
  icon catalogue tool) chips. Export: new `capabilities` column.
- Fixed: a failed icon download was cached as the icon (the error page's
  text), so the icon stayed broken until reload. Failures are no longer cached.
- Confirmed the product page is the only usable source: the wishlist, deals
  and browse-games pages don't carry capabilities, and the store's own bulk
  product lookup is a separate service that needs the signed-in user's token
  (not something the extension should handle) plus a new host permission.

---

## v1.5.26266.18 (Sep 2026) - Genre search

- The Genres section now has a "Search genres..." box, like Publishers: it
  narrows the genre checkboxes as you type (case-insensitive), survives the
  list being rebuilt, and isn't a filter itself - a ticked genre hidden by
  the search still applies; not saved, and Clear All leaves it alone.
- Publishers and Genres now share one typeahead helper
  (`createListSearch()` / `applyListSearch()`); publisher search behaves as
  before.

---

## v1.5.26266.17 (Sep 2026) - "Just for you", pre-order, platforms (F-34)

- Each item now knows its deal type from the page's product data: a personal
  **"Just for you"** offer (with its reason, e.g. "Because of your loyalty to
  the franchise"), a public sale, or a member price - only for discounts the
  page actually shows.
- Items show a magenta **"Just for you"** pill (reason on hover) and a
  **"Pre-order"** pill with Xbox's own calendar icon (new `preorder.svg`).
- New quick filters **"Just for you"** and **"Pre-order"**, and a
  **Platforms** filter (Xbox Series X|S, Xbox One, PC, Handheld; an item
  matches if it's on any selected platform). All show tags, are cleared by
  Clear All, persist and are included in saved filters.
- Export: new columns dealType, dealReason, preorder, platforms.
- Findings: the wishlist page's numeric badge codes are subscription logos
  (Game Pass / EA Play / Ubisoft+ / GTA+), not capabilities. Optimized for
  X|S, Smart Delivery and Play Anywhere exist only on product pages - planned
  as F-36 (needs a per-item fetch strategy). `docs/07-DATA-FIELDS.md` updated.

---

## v1.5.26266.16 (Sep 2026) - Product data: rating, genres, release date, deal ends, "In a pass" (F-33)

- Product data from the wishlist page's embedded state is now loaded once on
  start (local, ~20 ms, no network) and attached to every item.
- Sort: new **Rating**, **Release Date** and **Deal Ends** options. Items
  without a value (unrated, no release date, no current deal) sort last in
  either direction.
- Filter: new **Genres** section (an item matches if it has any selected
  genre) and an **"In a pass"** quick filter - games included with a
  subscription pass right now (distinct from the Subscriptions filter, which
  reads "with <pass>" member-price badges). Both show tags, are cleared by
  Clear All, persist across reloads and are included in saved filters
  (saved filters from before this version still load).
- Items with a current deal get an "Ends 24 Sep" badge next to the discount
  (amber "Ends in 5h" within 24 hours). Only deals the page actually shows
  the viewer count, so the badge, the Deal Ends sort and export agree.
- Export: new columns rating, ratingCount, genres, releaseDate, dealEnds, inPass.
- The offer's list price and MSRP are also stored per item for a future
  in-place price update (F-26); not shown yet.
- Mock harness: follows the new `mock_examples/#wishlist|#products|#deals|#games`
  layout (fixtures in `#wishlist`, opened as `%23wishlist` in URLs).
- New `docs/07-DATA-FIELDS.md`: which item fields come free from the wishlist
  page and which need a product page request.

---

## v1.5.26266.15 (Sep 2026) - Saved-filter styling fix; product data reader

- Fixed: since v1.5.26266.14 the × half of a saved-filter button was shorter
  than its name half (the icon is smaller than the text it replaced) and
  stayed grey when the filter was active. Both halves now share one height,
  and the × turns green with an active filter (red on hover still means delete).
- Added (F-33, groundwork): a product-data reader in the shared core. Xbox
  pages embed their app state in an inline script; the reader parses it from
  the script text (content scripts can't read page globals), from the current
  page or a freshly fetched one. The wishlist page's state carries a summary
  for every wishlisted product (rating, categories, release date, platforms,
  passes, install size, descriptions, ...), matched to items by product id.
  Not used by the UI yet - available as `window.injected.debug` for
  inspection until a feature consumes it.
- Mock harness: fixtures now keep the embedded-state script (as inert
  `text/plain`) so the reader can be tested offline.

---

## v1.5.26266.14 (Sep 2026) - Refresh button, Xbox icons, exclusive panels

- Added (F-32 v1): a Refresh button at the end of the toolbar that saves the
  current state and reloads the page. Filters, sort and saved filters are
  persisted, so everything comes back as it was.
- Adopted three icons from xbox.com's own icon set (T-10), each noting its
  source in the file: `refresh.svg`, `close.svg` (replaces the text "×" on
  tag remove, saved-filter delete and sort-level remove) and `plus.svg`
  (the "+" in "Add Sort Level"). The text glyph shows at once and stays if
  an icon can't load.
- Filter, Sort and the Export menu are now mutually exclusive - opening any
  one closes the other two - and the Export button gets the same active
  (green) look as Filter/Sort while its menu is open.
- Sort-level remove buttons now have an accessible label.

---

## v1.5.26266.13 (Sep 2026) - Export (F-24)

- Added an Export button after Sort. Its menu offers "Export N items as
  CSV" or "as JSON", where N is the number of items currently shown - only
  the visible items are exported (current filters), in the current sort
  order. File name `xbox-wishlist-YYYY-MM-DD.csv|json`. Columns: title,
  publisher, price, originalPrice, discountPercent, owned, unpurchasable,
  url. The CSV opens cleanly in Excel (UTF-8 BOM, proper quoting) and values
  that look like formulas are neutralised.
- New icon `shared/icons/export.svg` (Tabler Icons `file-export`), added to
  the extension's resource map and the userscript's `@resource` list. The
  userscript fetches it from GitHub `main`, so it shows there once pushed.

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
