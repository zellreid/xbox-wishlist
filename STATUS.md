---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Quick live check of the add-ons 0-count fix (v1.5.26268.3); then pick next (F-38 product pages needs manifest approval, or F-25/F-26)
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
- Live at v1.5.26268.3. F-40 add-ons confirmed live (2026-09-25).
- Fix: games the store flags as having add-ons but whose add-ons page lists none (e.g. Torchlight II, count 0) now lose the "Add-ons" link and drop out of "Has add-ons" once the count is loaded. Needs a quick live check.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-40 | Add-ons: hide games whose add-ons page lists none (count 0) | Medium | In Progress | Quick live check: ↻ on Torchlight II removes its "Add-ons" link |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json (there since the first commit) | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-25: F-40 confirmed live; fix (v1.5.26268.3): a loaded add-ons count of 0 (store flag stale, e.g. Torchlight II, store shows "Failed to Get Channel") removes the chip and the Has add-ons match; mock harness PASS on all 5 mocks
- 2026-09-25: T-19 + F-39 confirmed live; F-40 add-ons (v1.5.26268.2): chip-link, count via Load details / refresh (only-missing fetch), Has add-ons quick filter, export; mock harness PASS on all 5 mocks incl. DOA6 add-ons page
- 2026-09-25: F-39 live feedback 4 (v1.5.26268.1): header/footer wrapper uhf-dark mark switched (grey bar), active-button colours id-scoped to beat Xbox's !important menu button rules; harness with light sheet staged, live CSS order and real hover; PASS on all 5 mocks
- 2026-09-24: Active toolbar button mirrors Xbox's active wishlist menu button per theme (v1.5.26267.10); header confirmed live in both modes; mock harness PASS on all 5 mocks
- 2026-09-24: F-39 live feedback 3 (v1.5.26267.9): header menu layout broke on switch (component rebuilds on its theme attribute); now colours via --uhf-header-*-override read through a hidden probe frame, logos by image; harness both directions + saved-theme load + watcher; PASS on all 5 mocks
