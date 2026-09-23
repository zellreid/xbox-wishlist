---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Decide F-33 fields and load timing, then build the first data-driven filter/sort
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-23
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live at v1.5.26266.15. v1.5.26266.14 (Refresh, Xbox icons, exclusive panels) confirmed on live Edge except the saved-filter styling, fixed in .15.
- F-33 groundwork: the core can read Xbox's embedded page state; the wishlist page already carries summaries for every item (100% matched on both mocks). Not yet used by the UI.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-33 | Product data enrichment - pick fields and load timing | Medium | In Progress | Run the two live console checks; choose the first fields (e.g. rating sort, genre filter, Game Pass filter) |
| T-12 | Live check of the saved-filter styling fix (v1.5.26266.15) | Low | Todo | Reload the extension; check both halves of a saved-filter button match and go green together |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation | Low | Todo | Store per-item price by product id (F-33 reader gives prices by id) |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: Saved-filter styling fix; F-33 product-data reader (v1.5.26266.15); harness keeps embedded state; mock harness PASS on both mocks, 100% product match
- 2026-09-23: F-32 v1 Refresh button, Xbox refresh/close/plus icons, mutually exclusive toolbar panels (v1.5.26266.14); mock harness PASS on both mocks, ?persist refresh round-trip PASS
- 2026-09-23: Harness for mock 20260923_1032 (PASS, 310 items); consolidated icon catalogue (custom + Xbox); F-32 refresh investigated; T-09 confirmed live; no product code changed
- 2026-09-23: F-24 export of visible items as CSV/JSON (v1.5.26266.13); icon sources traced; mock harness PASS on the 20260922 mock
- 2026-09-23: T-05 no-price items sort last, F-22 sort dot, F-23 saved filter presets, F-21 closed as already met (v1.5.26266.12); mock harness PASS, ?persist round-trips PASS; T-07 confirmed live in Edge
