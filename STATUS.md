---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of toolbar buttons on a shared wishlist (v1.5.26268.5); then pick next (F-38 needs manifest approval, or F-25/F-26)
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-25
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live at v1.5.26268.5. T-22 dead-style cleanup done (2026-09-25).
- Fix: toolbar buttons on shared (public) wishlists had no background (no Xbox menu buttons there to copy); they now use their own style mirroring Xbox's in both themes. Needs a live check.
- Mock harness has a new ?public option to simulate a shared wishlist.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-17 | Toolbar buttons styled on shared (public) wishlists | Medium | In Progress | Live check on a shared wishlist in dark and light: backgrounds, hover, open-panel highlight |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json (there since the first commit) | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-25: Shared-wishlist toolbar fix (v1.5.26268.5): fallback button/icon classes mirroring Xbox secondary icon button per theme when the menu-button class is absent; harness ?public option; PASS on all 5 mocks normal and ?public
- 2026-09-25: T-22 (v1.5.26268.4): removed 62 lines of dead CSS and PREFIXES.primaryText; computed styles identical before/after (light 1603, dark 1032); mock harness PASS on all 5 mocks
- 2026-09-25: F-40 0-count fix confirmed live; stale-code scan (functions, constants, config, prefixes, icons, CSS classes/ids/vars): dead CSS + PREFIXES.primaryText logged as T-22; confirmed userscript is generated from the one core
- 2026-09-25: F-40 confirmed live; fix (v1.5.26268.3): a loaded add-ons count of 0 (store flag stale, e.g. Torchlight II, store shows "Failed to Get Channel") removes the chip and the Has add-ons match; mock harness PASS on all 5 mocks
- 2026-09-25: T-19 + F-39 confirmed live; F-40 add-ons (v1.5.26268.2): chip-link, count via Load details / refresh (only-missing fetch), Has add-ons quick filter, export; mock harness PASS on all 5 mocks incl. DOA6 add-ons page
