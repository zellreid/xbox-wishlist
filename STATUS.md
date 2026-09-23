---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26266.14 (Refresh, new icons, exclusive panels), then F-25 or the F-26 data layer
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
- Live at v1.5.26266.14: Refresh button (F-32 v1), Xbox refresh/close/plus icons (T-10), Filter/Sort/Export mutually exclusive.
- F-15 to F-24 confirmed on live Edge; v1.5.26266.14 is mock-harness verified on both mocks, not yet checked live.
- Userscript picks up the new icons (export, refresh, close, plus) once they are pushed to GitHub main.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-11 | Live check of v1.5.26266.14 in Edge (Refresh, icons, exclusive panels) | High | Todo | Reload the extension; open Filter/Sort/Export in turn, use the × and + buttons, press Refresh |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation | Low | Todo | Build the F-32 data layer first: live-check that a fetched page contains the preloaded state |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: F-32 v1 Refresh button, Xbox refresh/close/plus icons, mutually exclusive toolbar panels (v1.5.26266.14); mock harness PASS on both mocks, ?persist refresh round-trip PASS
- 2026-09-23: Harness for mock 20260923_1032 (PASS, 310 items); consolidated icon catalogue (custom + Xbox); F-32 refresh investigated; T-09 confirmed live; no product code changed
- 2026-09-23: F-24 export of visible items as CSV/JSON (v1.5.26266.13); icon sources traced; mock harness PASS on the 20260922 mock
- 2026-09-23: T-05 no-price items sort last, F-22 sort dot, F-23 saved filter presets, F-21 closed as already met (v1.5.26266.12); mock harness PASS, ?persist round-trips PASS; T-07 confirmed live in Edge
- 2026-09-23: F-20 publisher search (v1.5.26266.11); F-15 closed as superseded; T-04 confirmed live in Edge; T-05 logged; mock harness PASS
