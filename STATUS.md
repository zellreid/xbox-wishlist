---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: T-05 no-price items sort last, then F-21 result count and F-22 sort badge
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
- Live at v1.5.26266.11: one shared core drives both the MV3 extension and the userscript. ISSUE-001 resolved; popup/service worker removed.
- Shipped in v1.5: public wishlist buttons (F-17), Clear All (F-18), wishlist search (F-31), dynamic price slider max (F-16), quick filters (F-19), publisher search (F-20); F-15 closed as superseded.
- T-04 confirmed on live Edge: filters and sort persist, Default sort keeps the wishlist order. Chrome and the userscript not yet checked live.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-05 | Items with no price sort among priced items (e.g. Discount % desc + Price asc) | Medium | Todo | In applySorting(), sort missing price/discount values last regardless of direction |
| F-21 | Filtered result count in panel header | Medium | Todo | Count visible items after applyFilters(), show "Filters (x / y)" |
| F-22 | Active sort indicator badge | Medium | Todo | Toggle .ifc-badge-active on sort button when sort is non-default |
| F-23 | Save/load named filter presets | Medium | Todo | Store named filter states via the storage adapter |
| F-24 | Export wishlist as CSV/JSON | Medium | Todo | Add export button using Blob + a[download] |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Repeat the T-04 persistence and Default-sort steps in Chrome and Tampermonkey |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 7 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-25 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: F-20 publisher search (v1.5.26266.11); F-15 closed as superseded; T-04 confirmed live in Edge; T-05 logged; mock harness PASS
- 2026-09-23: Default sort keeps original wishlist order - ifcId assigned once per item (v1.5.26266.10); mock harness PASS, persist round-trip PASS, late-item case PASS
- 2026-09-23: Sort criteria now saved and restored (v1.5.26266.9); mock harness PASS, persist round-trip PASS (sort, sort+filter, level removal, bad-data fallback)
- 2026-09-23: Filters persist across reload - fixed load race that wiped saved filters, range filters now restored (v1.5.26266.8); harness gets async storage + ?persist mode; mock harness PASS, persist round-trip PASS
- 2026-09-23: Discount slider label/re-range fix, pinned range edges, T-03 guard (v1.5.26266.7); mock harness PASS, T-03 edge not covered by the fixture
