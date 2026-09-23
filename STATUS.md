---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Run T-17 diagnostic v2 live (v1.5.26266.24) and decide; then T-19 light mode fix
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
- Live at v1.5.26266.24. T-16 and T-18 confirmed on live Edge; the re-attach after in-app Back (v1.5.26266.23) still needs a live check (it is T-17 step 1).
- T-17 diagnostic v2 built ("Test: faster lookup (T-17 v2, temporary)" in the Capabilities section): per-game lookup with the API-version header and no Authorization header, 3-game timing, two labelled many-ids guesses, store-page comparison; waiting on the live run.
- Logged, not started: T-19 light mode styling (mock 20260923_1603 was saved with our old panel injected), F-39 light/dark toggle, F-38 run on product pages (manifest change - HITL), F-40 DLC indicator / count / link.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-17 | Spike: can the store's product-data service replace per-page Load details? | High | In Progress | Run diagnostic v2 live (v1.5.26266.24) and paste the redacted report; then decide (HITL) |
| T-19 | Light mode styling fix | High | Todo | Harness for #wishlist/20260923_1603.html; list clashes; move colours to themed CSS variables |
| F-40 | DLC for wishlist games: has-DLC chip, add-ons link, DLC count | Medium | Todo | Build the free part (flag + link) first; count via add-ons page, cached |
| F-39 | Light / dark mode toggle button | Medium | Todo | Decide scope: override our UI only vs switch the whole page; builds on T-19 |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |

+ 6 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (E-06, T-02, F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-23: T-17 diagnostic v2 (v1.5.26266.24): version header, no auth, per-game + many-ids guesses, store-page comparison, tighter redaction; mock harness PASS on all 3 mocks, v2 tested against a stand-in service (4 scenarios, no auth header ever sent)
- 2026-09-23: T-17 first live run analysed: failure due to a missing API-version header, not access; CORS allowed; data is per-product (~0.3 MB) - diagnostic v2 proposed; no code changed
- 2026-09-23: Re-attach after in-app navigation (v1.5.26266.23), found at T-17 step 3; mock harness PASS on both mocks incl. simulated leave / rebuild / Back round-trip
- 2026-09-23: Logged T-19 light mode, F-39 theme toggle, F-38 product-page support, F-40 DLC indicator (researched DOA6 mocks: has-add-ons flag free, add-ons page gives total); no code changed
- 2026-09-23: T-17 lookup diagnostic (v1.5.26266.22); T-18 confirmed live; mock harness PASS on both mocks, diagnostic tested against a stand-in service (found / not found / 404 / redaction)
