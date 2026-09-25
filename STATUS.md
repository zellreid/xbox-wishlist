---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of the tag order now, and of F-26/F-27 price badges as Xbox prices change (v1.5.26268.9); then pick next (F-28 deal alerts, or F-38 needs manifest approval)
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
- Live at v1.5.26268.9. Item chips now in a fixed order (ITEM_TAG_ORDER enum).
- F-27 built on F-26: 90-day price points per game, "Lowest seen" / "Low R x" chip with history tooltip, export columns. F-26 and F-27 only show anything once Xbox prices change between visits.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-26 | Price since last visit + "on sale since" date | Medium | In Progress | Live check over time: change badge after a price moves, "Since" on a new sale |
| F-27 | 90-day price history + lowest price chip | Medium | In Progress | Live check over time: chip after a second price, history on hover |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json (there since the first commit) | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-25: Fixed item chip order via ITEM_TAG_ORDER enum; F-27 (v1.5.26268.9): 90-day price points per game with migration from F-26, lowest price chip + history tooltips, export columns; mock harness PASS on all 5 mocks + seeded history
- 2026-09-25: F-25 confirmed; F-26 (v1.5.26268.8): per-game price memory, 7-day change badge, sale-since badge, export columns; mock harness PASS on all 5 mocks + simulated earlier visits
- 2026-09-25: F-02 confirmed; F-25 flags (v1.5.26268.7): star per item, gold highlight, saved per product id, Flagged quick filter/sort/export; filter button dot; mock harness PASS on all 5 mocks + ?public + ?persist
- 2026-09-25: F-17 confirmed live; Owned filter counts (v1.5.26268.6) on checkboxes and tags, counts not saved; mock harness PASS on all 5 mocks + ?persist restore
- 2026-09-25: Shared-wishlist toolbar fix (v1.5.26268.5): fallback button/icon classes mirroring Xbox secondary icon button per theme when the menu-button class is absent; harness ?public option; PASS on all 5 mocks normal and ?public
