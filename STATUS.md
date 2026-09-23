---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Decide F-32 refresh approach and T-10 icon adoption, then implement
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
- Live at v1.5.26266.13; F-15 to F-24 complete and confirmed on live Edge (T-07, T-09).
- New mock 20260923_1032 has a harness and passes (310 items); both mocks now available.
- F-32 refresh investigated: the page embeds a preloaded-state JSON with wishlist and product data; recommendation recorded in docs/04-FEATURE-BREAKDOWN.md.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-32 | Refresh wishlist data | Medium | Todo | Run the live fetch check (does a fetched page still contain the preloaded state?), then v1 = persist + reload |
| T-10 | Icon set: adopt Xbox icons where they add value | Low | Todo | Pick which generic Xbox icons to adopt; brand badges via runtime clone only |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Repeat the Edge checks in Chrome and Tampermonkey (after pushing export.svg) |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation | Low | Todo | Store per-item price by product id; could use the F-32 data layer |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: Harness for mock 20260923_1032 (PASS, 310 items); consolidated icon catalogue (custom + Xbox); F-32 refresh investigated; T-09 confirmed live; no product code changed
- 2026-09-23: F-24 export of visible items as CSV/JSON (v1.5.26266.13); icon sources traced; mock harness PASS on the 20260922 mock
- 2026-09-23: T-05 no-price items sort last, F-22 sort dot, F-23 saved filter presets, F-21 closed as already met (v1.5.26266.12); mock harness PASS, ?persist round-trips PASS; T-07 confirmed live in Edge
- 2026-09-23: F-20 publisher search (v1.5.26266.11); F-15 closed as superseded; T-04 confirmed live in Edge; T-05 logged; mock harness PASS
- 2026-09-23: Default sort keeps original wishlist order - ifcId assigned once per item (v1.5.26266.10); mock harness PASS, persist round-trip PASS, late-item case PASS
