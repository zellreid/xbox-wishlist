---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Close v1.5.x carry-over (F-19 quick filter polish, F-15 visual check)
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
- Live at v1.5.26266.5: one shared core drives both the MV3 extension and the userscript. ISSUE-001 resolved; popup/service worker removed.
- Shipped in v1.5: public wishlist buttons (F-17), Clear All (F-18), wishlist search (F-31), dynamic price slider max (F-16), quick filters (F-19, partial).
- F-16 also fixed a slider end-of-track bug that hid the most expensive items when dragging the max thumb to the end.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-19 | Quick filter presets polish | Medium | In Progress | Add toggle-off, active pill state; decide on Not Owned / 50% Off presets |
| F-15 | Accordion label/title styling polish | Medium | Todo | Visual check in Chrome and Edge against docs/04 F-15 steps |
| F-20 | Publisher typeahead search | Medium | Todo | Add search input at top of Publishers accordion |
| F-21 | Filtered result count in panel header | Medium | Todo | Count visible items after applyFilters(), show "Filters (x / y)" |
| F-22 | Active sort indicator badge | Medium | Todo | Toggle .ifc-badge-active on sort button when sort is non-default |
| F-23 | Save/load named filter presets | Medium | Todo | Store named filter states via the storage adapter |
| F-24 | Export wishlist as CSV/JSON | Medium | Todo | Add export button using Blob + a[download] |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-03 | Discount slider zero-width range (min == max gives a NaN fill) | Low | Todo | Mirror the price guard (max <= min) in calculateDiscountRange() |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 7 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-25 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: F-16 - dynamic price slider max, live re-ranging, end-of-track fix (v1.5.26266.5)
- 2026-09-23: DOC-1 - synced PRD and feature breakdown with the v1.5 code; seeded this TODO table
- 2026-09-23: Search, clear-all and quick-filter presets; version bumps
- 2026-09-22: Price/discount range filters exclude items with no price
