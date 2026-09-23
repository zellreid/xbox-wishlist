---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Verify F-16/F-19 in real Chrome and Edge, then F-15 visual check
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
- Live at v1.5.26266.10: one shared core drives both the MV3 extension and the userscript. ISSUE-001 resolved; popup/service worker removed.
- Shipped in v1.5: public wishlist buttons (F-17), Clear All (F-18), wishlist search (F-31), dynamic price slider max (F-16), quick filter toggles with active state (F-19).
- Filter and sort persistence confirmed on live Edge (v1.5.26266.9). That exposed a Default-sort bug (ifcId re-numbered from sorted order); fixed in v1.5.26266.10, harness-verified, needs a live re-check.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-04 | Live re-check of v1.5.26266.10 (Default sort after a restored sort; Chrome and userscript not yet checked) | High | In Progress | Save Price sort, reload, switch to Default, compare with the unmodified xbox.com order |
| F-15 | Accordion label/title styling polish | Medium | Todo | Visual check in Chrome and Edge against docs/04 F-15 steps |
| F-20 | Publisher typeahead search | Medium | Todo | Add search input at top of Publishers accordion |
| F-21 | Filtered result count in panel header | Medium | Todo | Count visible items after applyFilters(), show "Filters (x / y)" |
| F-22 | Active sort indicator badge | Medium | Todo | Toggle .ifc-badge-active on sort button when sort is non-default |
| F-23 | Save/load named filter presets | Medium | Todo | Store named filter states via the storage adapter |
| F-24 | Export wishlist as CSV/JSON | Medium | Todo | Add export button using Blob + a[download] |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 7 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-25 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: Default sort keeps original wishlist order - ifcId assigned once per item (v1.5.26266.10); mock harness PASS, persist round-trip PASS, late-item case PASS
- 2026-09-23: Sort criteria now saved and restored (v1.5.26266.9); mock harness PASS, persist round-trip PASS (sort, sort+filter, level removal, bad-data fallback)
- 2026-09-23: Filters persist across reload - fixed load race that wiped saved filters, range filters now restored (v1.5.26266.8); harness gets async storage + ?persist mode; mock harness PASS, persist round-trip PASS
- 2026-09-23: Discount slider label/re-range fix, pinned range edges, T-03 guard (v1.5.26266.7); mock harness PASS, T-03 edge not covered by the fixture
- 2026-09-23: F-19 - quick filter toggles, active state, Not Owned and 50% Off presets (v1.5.26266.6); mock harness PASS, 50% Off disabled state not covered by the fixture
