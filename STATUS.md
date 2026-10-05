---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Your decisions on T-26 and T-52; live check of the Load details fix; T-06 Chrome / Tampermonkey
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-10-05
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- v1.5.26278.8: fixed unpurchasable items losing their red highlight after Load details (our own "94 GB" / "Add-ons (3)" chips were being read as a price); 46/46 harness PASS, reproduced and re-checked in the harness. T-38 confirmed live.
- T-26 (localise all UI text) is scoped but not started: it needs your decisions on languages and translations. The Load details button layout needs your pick (T-52).

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-26 | Localise all of our UI text, none hard-coded | Medium | Blocked | Your decisions: which languages (Xbox offers 41), how translations are produced and checked, and whether CSV / JSON column names stay English. Then: catalogue + t() helper, move ~150-250 texts into it, separate stored filter / sort keys from labels (with a migration), page language from the URL locale, English fallback |
| T-52 | Load details button wraps to three lines inside a 24px box (caused by phase 2b) | Low | Blocked | Your pick: A) keep side by side, button on one line (smallest change), B) button on its own row above the status text |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-53 | Live check the Load details fix: after Load details, items that cannot be bought (red) stay red and still match the Un-Purchasable filter | Medium | Not started | Reload the extension, open a wishlist with red items, click Load details, let it run (or stop it), confirm they stay red |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

Backlog beyond the tables above (5 more): F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.8 - fixed unpurchasable items losing their highlight after Load details; T-38 confirmed live; T-26 and the Load details button scoped, awaiting decisions
- 2026-10-05: v1.5.26278.7 - T-38 hearts on edition cards (THIS EDITION excluded); 46/46 harness PASS
- 2026-10-05: T-50 phase 2b confirmed live (T-50 complete); T-38 investigated and explained, not started
- 2026-10-05: v1.5.26278.6 - T-50 phase 2b (Xbox button classes on panel buttons); T-51, T-50 2a, T-46 confirmed live; 46/46 harness PASS
- 2026-10-05: v1.5.26278.5 - T-51 heart now Xbox's own icon; T-48 closed (keep 64px toolbar); 46/46 harness PASS
