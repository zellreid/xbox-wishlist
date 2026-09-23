---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of F-24 export, then a harness for the 2026-09-23 mock (needs its .html)
target_date: none
hard_deadline: false
blockers: ["New mock 20260923_1002 has only its _files folder - the .html page is missing, so no harness can be built from it yet"]
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-23
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live at v1.5.26266.13: one shared core drives both the MV3 extension and the userscript.
- v1.5 near-term feature set (F-15 to F-24) complete. T-07 confirmed on live Edge, covering everything up to v1.5.26266.12.
- F-24 export is mock-harness verified; not yet checked on live xbox.com. Userscript users get the export icon once export.svg is pushed to GitHub main.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-08 | Harness for the new mock 20260923_1002 | Medium | Blocked | Re-save the page (Ctrl+S, Webpage Complete) so 20260923_1002.html sits next to its _files folder, then run prepare-fixture |
| T-09 | Live check of F-24 export in Edge | High | Todo | Reload the extension, filter, export CSV and JSON, open the CSV in Excel |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Repeat the Edge checks in Chrome and Tampermonkey (after pushing export.svg) |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation | Low | Todo | Store per-item price by product id, show price delta badge on next visit |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: F-24 export of visible items as CSV/JSON (v1.5.26266.13); icon sources traced; new mock found incomplete; mock harness PASS on the 20260922 mock
- 2026-09-23: T-05 no-price items sort last, F-22 sort dot, F-23 saved filter presets, F-21 closed as already met (v1.5.26266.12); mock harness PASS, ?persist round-trips PASS; T-07 confirmed live in Edge
- 2026-09-23: F-20 publisher search (v1.5.26266.11); F-15 closed as superseded; T-04 confirmed live in Edge; T-05 logged; mock harness PASS
- 2026-09-23: Default sort keeps original wishlist order - ifcId assigned once per item (v1.5.26266.10); mock harness PASS, persist round-trip PASS, late-item case PASS
- 2026-09-23: Sort criteria now saved and restored (v1.5.26266.9); mock harness PASS, persist round-trip PASS (sort, sort+filter, level removal, bad-data fallback)
