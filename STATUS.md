---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of F-36 "Load details" on the real wishlist (v1.5.26266.19)
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
- Live at v1.5.26266.19. T-12, T-14, T-15 confirmed on live Edge.
- F-36 done (option c): Capabilities filter and X|S / Smart Delivery / Play Anywhere chips, loaded on request from each game's store page ("Load details", ~2 s apart, cached 7 days). Harness-verified against the #products mocks; the real-site run (rate limits, timing over ~300 pages) is still unverified.
- Confirmed the product page is the only usable capability source (other pages lack it; the store's bulk lookup needs the user's auth token - not used).

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-16 | Live check of F-36 in Edge (v1.5.26266.19) | High | Todo | Reload the extension; open Capabilities, Load details, watch progress, try Cancel, filter by Play Anywhere, reload the page |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: F-36 capabilities via opt-in Load details (v1.5.26266.19) + icon-cache fix; T-12/T-15 confirmed live; mock harness PASS on both mocks, Load details tested via #products mocks incl. cancel and ?persist cache reload
- 2026-09-23: Genres typeahead search via shared list-search helper (v1.5.26266.18); T-14 confirmed live; mock harness PASS on both mocks
- 2026-09-23: Icon catalogue moved into the repo as tools/icons/catalogue.js (build gallery from all mocks + shared/icons, export into shared/icons); output git-ignored; no product code changed, tested build/search/export
- 2026-09-23: F-34 Just for you / pre-order / platforms (v1.5.26266.17); badge codes found to be subscription logos, capabilities split to F-36; mock harness PASS on both mocks, saved-filter + ?persist reload PASS
- 2026-09-23: F-33 complete (v1.5.26266.16) incl. deal-end consistency fix; harness moved to #wishlist layout; docs/07-DATA-FIELDS.md; mock harness PASS on both mocks, saved-filter + ?persist reload PASS
