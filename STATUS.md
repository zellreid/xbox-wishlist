---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26266.12 (no-price sort, sort dot, saved filters), then F-24 export
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
- Live at v1.5.26266.12: one shared core drives both the MV3 extension and the userscript. ISSUE-001 resolved; popup/service worker removed.
- v1.5 feature set complete through F-23: search, Clear All, quick filters, publisher search, dynamic price slider, persistence of filters/sort, sort indicator dot, saved filter presets. F-15 and F-21 closed without code (superseded / already met).
- T-05, F-22 and F-23 are mock-harness verified (incl. ?persist reloads); not yet checked on live xbox.com.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-07 | Live check of v1.5.26266.12 in Edge (no-price items last, sort dot, saved filters) | High | Todo | Reload the extension; run your Discount % + Price sort, check the dot, save/apply/delete a preset, reload |
| F-24 | Export wishlist as CSV/JSON | Medium | Todo | Add export button using Blob + a[download]; decide filtered-only vs all items |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Repeat the persistence, Default-sort and saved-filter checks in Chrome and Tampermonkey |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation | Low | Todo | Store per-item price by product id, show price delta badge on next visit |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: T-05 no-price items sort last, F-22 sort dot, F-23 saved filter presets, F-21 closed as already met (v1.5.26266.12); mock harness PASS, ?persist round-trips PASS
- 2026-09-23: F-20 publisher search (v1.5.26266.11); F-15 closed as superseded; T-04 confirmed live in Edge; T-05 logged; mock harness PASS
- 2026-09-23: Default sort keeps original wishlist order - ifcId assigned once per item (v1.5.26266.10); mock harness PASS, persist round-trip PASS, late-item case PASS
- 2026-09-23: Sort criteria now saved and restored (v1.5.26266.9); mock harness PASS, persist round-trip PASS (sort, sort+filter, level removal, bad-data fallback)
- 2026-09-23: Filters persist across reload - fixed load race that wiped saved filters, range filters now restored (v1.5.26266.8); harness gets async storage + ?persist mode; mock harness PASS, persist round-trip PASS
