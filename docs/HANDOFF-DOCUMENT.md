# Project Handoff Document - Xbox Wishlist v1.5

## Current Status

**Date:** 5 October 2026
**Version:** 1.5.26278.8 (extension and userscript share one version)
**Status:** Live. Everything built up to 2026-10-05 is confirmed in Edge; the Chrome / Tampermonkey pass (T-06) is still to do.
**Live state and open work:** `STATUS.md` (repo root) - always read it first. Full history: `CHANGELOG.md`. Feature detail: `docs/04-FEATURE-BREAKDOWN.md`.

---

## What it is

A Chrome/Edge MV3 extension and a Tampermonkey userscript that add filtering, sorting, export and extra
information to the Xbox wishlist (`xbox.com/{locale}/wishlist`), plus wishlist hearts on store, browse,
deals and add-on pages. Both platforms run the same shared core.

---

## Architecture

```
browser-extension/src/
  manifest.json              MV3: storage permission, host xbox.com/*/wishlist*; content scripts also on
                             /games/store/*, /games/browse*, /games/all-games*, /promotions/sales/*
  content.js                 Extension adapter (chrome.storage.local, chrome.runtime.getURL) -> core
  request-watcher.js         MAIN-world script: notices Xbox's own wishlist PUT/DELETE, posts a tagged message
  shared/xbox-wishlist.core.js   All logic (~3,900 lines) - the single source of truth
  shared/styles.css          All injected styles (~1,300 lines)
  shared/icons/*.svg         Toolbar / chip icons
tools/userscript/            header.template.js + core + adapter.js -> xbox-wishlist.user.js (generated)
tools/mock-harness/          Offline test harness (see "Testing")
mock_examples/               Saved xbox.com pages (git-ignored, personal data)
docs/                        PRD, design, feature breakdown (04), data fields (07), xbox.com requests (08)
```

Rules that matter most (full set in `AGENTS.md`):
- All logic in the core; adapters only wire storage and resources. No `chrome.storage.sync`.
- Xbox class names only via `resolveClass(PREFIXES.x)` - their hashes change on every Xbox release.
- `manifest.json` changes and new permissions need HITL approval.
- Sizes in injected UI on a 4px grid (toolbar 72px top / 64px tall, panels top 144px).
- Never read or forward sign-in tokens (TIER 1). Wishlist data on other pages is fetched same-origin and kept in memory only.

### Core sections (in file order)
State, config, `PREFIXES` -> initialisation -> selector resolver -> persistence -> tags -> filter UI ->
export -> product data (page payload) -> price history -> light/dark theme (wishlist pages only) ->
refresh -> stored data -> saved filters -> Genres / Platforms / Type / Age rating lists -> capabilities and
"Load details" -> sort -> item filtering (`FLAG_FILTERS`, `shouldShowContainer`) -> payload-first item facts ->
context-lost handling -> wishlist hearts on other pages -> in-app navigation watch -> start.

### Key ideas
- **Payload first:** item data comes from the page's embedded state (`__PRELOADED_STATE__`, `core2.products`,
  `core2.wishlist`), not scraped text, so it works in every language. `docs/07` and `docs/08` list the fields.
- **Data attributes:** facts are written to each item as `data-ifc-*` once; filters and sorts read only those.
- **Three-state quick filters:** one `FLAG_FILTERS` table (`true | 'not' | false`); On Sale / >=50% Off use
  `state.filters.discountBelow` for their "is not" step.
- **Store page reads:** "Load details" and the per-item refresh fetch a game's store page (same origin) for
  capabilities, add-on count and install size; cached 7 days under `ifc_xbox_wishlist_caps`.
- **Live wishlist changes:** `request-watcher.js` -> tagged `postMessage` -> core resyncs; other tabs pick it up
  via the `ifc_xbox_wishlist_changed` storage key when they come back into view.

---

## Features (current)

Filters: search (name, publisher, developer), Owned, Publishers, Subscriptions, Genres, Platforms, Type,
Age rating, Capabilities, price and discount sliders. Quick filters (three-state): On Sale, >=50% Off, In a
pass, In my pass, Leaving pass soon, New in pass, Just for you, Pre-order, Added Recently, Has add-ons,
Handheld optimised, Flagged, Cheap; Owned / Not Owned two-state. Saved filters, Clear All, tags.
Sort: up to 3 criteria incl. Date Added, Price, Discount, Rating, Release Date, Deal Ends, Install Size, Flagged.
Item chips: Just for you, In your pass, Leaves pass, New in pass, Pre-order, capabilities, add-ons, DLC,
price change / lowest seen / deal ends. Export CSV/JSON. Light/dark toggle. Flags (stars). Price history.
Other pages: filled heart on wishlisted cards ("On your wish list since"), opens the wishlist in a new tab.

---

## Testing

- **Mock harness:** `node tools/mock-harness/server.js` then open any
  `http://localhost:8792/mock_examples/<type>/<market>/<name>.harness.html`. 46 fixtures (20 wishlist across
  12 markets, 26 smoke checks for store / deals / games / add-ons / locale pages). Run all after every change.
- The server also answers `/<locale>/wishlist` with that market's newest capture (used by the card hearts).
- The harness loads our stylesheet last; the live site loads it first - check CSS in both orders.
- New mocks: save the page (Ctrl+S, complete) into `mock_examples/_inbox/`, run
  `node tools/mock-harness/file-mocks.js --prepare`.
- Live check: Edge, Load unpacked -> `browser-extension/src/`.

## Releasing

1. `node tools/userscript/bump-version.js` (bumps manifest + userscript, rebuilds `xbox-wishlist.user.js`).
2. CHANGELOG entry, STATUS.md update.
3. Commit (`type(scope): description`); pushing and store / GreasyFork publishing are done by hand.

---

## Open items at handover

See `STATUS.md` for the live list. At this date:
- **Do first:** delete `mock_examples/_inbox/20260929_1400-wishlist-add-remove.har` - its sign-in request body
  holds a Microsoft sign-in token (sanitized HAR exports keep request bodies). Everything useful from it is in
  `docs/08-XBOX-REQUESTS.md`.
- Waiting on you: remaining wishlist mocks (T-32), Serbian Cyrillic locale (T-28).
- To check: Chrome + Tampermonkey pass (T-06).
- To do: localised labels (T-26); data ideas in `docs/08` section 9.
- Known limits: install sizes only after "Load details" (the wishlist page has almost none); no owned tick on
  browse cards (needs the sign-in token); "Leaving pass soon" depends on Xbox publishing exit dates.

---

*Last updated: 5 October 2026 - v1.5.26278.8*
