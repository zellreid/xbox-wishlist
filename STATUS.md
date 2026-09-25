---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of the filter panel layout (v1.5.26268.14); F-26/F-27 as Xbox prices change; then pick next (F-28 deal alerts, or F-38 needs manifest approval)
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
- Live at v1.5.26268.14. Filter panel: search, Saved filters, Quick filters (new heading), tags, groups; Price and Discount Range now the same tighter size; no extra space at the foot. Needs a quick live check.
- F-26/F-27 price memory and history only show once Xbox prices change between visits.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-26 | Price since last visit + "on sale since" date | Medium | In Progress | Live check over time: change badge after a price moves, "Since" on a new sale |
| F-27 | 90-day price history + lowest price chip | Medium | In Progress | Live check over time: chip after a second price, history on hover |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-24 | Filter panel layout (Saved filters on top, Quick filters heading, dividers) | Low | In Progress | Quick live check with and without an active filter |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json (there since the first commit) | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-25: Filter panel (v1.5.26268.14): range sections equal and tighter (151 -> 110px), panel foot trimmed to its 15px padding; slider still filters; mock harness PASS on all 5 mocks
- 2026-09-25: Filter panel (v1.5.26268.13): removed the divider under the last group (Discount Range); mock harness PASS on all 5 mocks
- 2026-09-25: Filter panel layout (v1.5.26268.12): Saved filters under search, Quick filters heading, section dividers; mock harness PASS on all 5 mocks + ?public
- 2026-09-25: T-23 confirmed; filter panel dividers (v1.5.26268.11): tag row divider moved above it, saved filters divider removed; mock harness PASS on all 5 mocks
- 2026-09-25: Owned-item gap fix (v1.5.26268.10): Xbox p margin cleared before our chip row via p:has(+ .ifc-item-tags); 4px gap on every tile; mock harness PASS on all 5 mocks
