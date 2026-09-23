---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Run the T-17 lookup test live (v1.5.26266.22) and decide
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
- Live at v1.5.26266.22. T-16 and T-18 (per-item refresh, Type filter, reload notice) confirmed on live Edge.
- T-17 diagnostic built: "Test: faster lookup" in the Capabilities section - discovers the store's bulk request, replays it without auth, reports a redacted verdict. Harness-tested; needs the live run.
- Fixed "Extension context invalidated" errors seen live after reloading the extension with the wishlist tab open: the tab now stops cleanly and asks for a page reload (mock harness verified).
- New: per-item refresh button (updates every item sharing the product id) and Type filter (Game / DLC / Consumable) with DLC chip. Mock harness PASS on both mocks; not yet checked live.
- Corrected: the store's bulk product lookup does not require the user's token - still unused (undocumented separate service, CORS and response contents unverified); live check tracked as T-17.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-17 | Spike: can the store's bulk product lookup replace per-page Load details? | High | In Progress | Live: open a game in the same tab, Back, Filters > Capabilities > Run test; copy the report |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |
| E-06 | Build step, Vitest, CI | Low | Todo | HITL approval required (AGENTS.md 2.7 #2 and #11) |
| T-02 | Commit message hygiene | Low | Todo | Use type(scope): description, not "git add ..." |

+ 4 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: T-17 lookup diagnostic (v1.5.26266.22); T-18 confirmed live; mock harness PASS on both mocks, diagnostic tested against a stand-in service (found / not found / 404 / redaction)
- 2026-09-23: Extension-reloaded-under-open-tab handling (v1.5.26266.21) for the live "Extension context invalidated" errors; mock harness PASS on both mocks incl. simulated reload during item refresh and during Load details
- 2026-09-23: Per-item refresh + Type (DLC) filter (v1.5.26266.20); bulk-lookup finding corrected, T-17 spike logged; T-16 confirmed live; mock harness PASS on both mocks incl. same-id refresh, error path, ?persist reload
- 2026-09-23: F-36 capabilities via opt-in Load details (v1.5.26266.19) + icon-cache fix; T-12/T-15 confirmed live; mock harness PASS on both mocks, Load details tested via #products mocks incl. cancel and ?persist cache reload
- 2026-09-23: Icon catalogue moved into the repo as tools/icons/catalogue.js (build gallery from all mocks + shared/icons, export into shared/icons); output git-ignored; no product code changed, tested build/search/export
