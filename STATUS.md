---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of F-33 (v1.5.26266.16), then F-34 starting with the #products mocks
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
- Live at v1.5.26266.16: F-33 product data - Rating / Release Date / Deal Ends sorts, Genres filter, "In a pass" quick filter, deal-end badges, export columns. Mock harness PASS on both wishlist mocks incl. saved-filter and reload round-trips; not yet checked live.
- Mocks reorganised into mock_examples/#wishlist, #products (20), #deals, #games; harness follows the new layout.
- Field inventory written (docs/07-DATA-FIELDS.md): most item data is free from the wishlist page; named capabilities (X|S optimised, Smart Delivery, Play Anywhere, 4K, 60 fps), bundle contents, editions, languages, system requirements need the product page.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-13 | Live check of F-33 in Edge (v1.5.26266.16) | High | Todo | Reload the extension; try Rating/Release Date/Deal Ends sorts, Genres, "In a pass", deal-end badges, export |
| F-34 | Deal types and product indicators (Just for you, pre-order, platforms, X\|S, Smart Delivery, Play Anywhere) | Medium | Todo | Go through the #products mocks: map badge codes to capability names, extract badge icons |
| T-12 | Live check of the saved-filter styling fix | Low | Todo | Both halves of a saved-filter button match and go green together |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Examine the #deals and #games mocks: do they embed the same state and item markup? |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: F-33 complete (v1.5.26266.16) incl. deal-end consistency fix; harness moved to #wishlist layout; docs/07-DATA-FIELDS.md; mock harness PASS on both mocks, saved-filter + ?persist reload PASS
- 2026-09-23: F-33 coded (sorts, Genres, In a pass, deal-end badges, export columns); F-34 data investigated
- 2026-09-23: Saved-filter styling fix; F-33 product-data reader (v1.5.26266.15); harness keeps embedded state; mock harness PASS on both mocks, 100% product match
- 2026-09-23: F-32 v1 Refresh button, Xbox refresh/close/plus icons, mutually exclusive toolbar panels (v1.5.26266.14); mock harness PASS on both mocks, ?persist refresh round-trip PASS
- 2026-09-23: Harness for mock 20260923_1032 (PASS, 310 items); consolidated icon catalogue (custom + Xbox); F-32 refresh investigated; T-09 confirmed live; no product code changed
