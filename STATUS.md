---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Your decisions on T-26; live checks of T-52 / T-53 / T-54; T-06 Chrome / Tampermonkey
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
- v1.5.26278.10: T-54 done in code - Load details merges instead of replacing a game's record, a store page can no longer delete ownership, the unused second price pair is gone, and a harness "details stability" check guards it (46/46 PASS, 0 changed). Un-Purchasable stays tile-based: the data cannot reproduce it (tested on 17 captures).
- New docs/09-ITEM-DATA-MODEL.md: every item attribute and its source, with a relationship diagram and tables.
- Waiting on you: T-26 decisions; live checks T-52 / T-53 / T-54.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-26 | Localise all of our UI text, none hard-coded | Medium | Blocked | Your decisions: which languages (Xbox offers 41), how translations are produced and checked, and whether CSV / JSON column names stay English. Then: catalogue + t() helper, move ~150-250 texts into it, separate stored filter / sort keys from labels (with a migration), page language from the URL locale, English fallback |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-54 | Live check Load details end to end: owned games stay owned, red items stay red, prices and passes unchanged after a full run and after an item's refresh button | Medium | Not started | Reload the extension, note a few owned / red / on-sale items, click Load details and let it finish, compare; then click ↻ on one item |
| T-52 | Live check the shorter Load details button label | Low | Not started | Open the Capabilities section: the button reads Load details on one line beside the status text |
| T-53 | Live check the Load details fix: after Load details, items that cannot be bought (red) stay red and still match the Un-Purchasable filter | Medium | Not started | Reload the extension, open a wishlist with red items, click Load details, let it run (or stop it), confirm they stay red |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

Backlog beyond the tables above (5 more): F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.10 - T-54 (merge on Load details, ownership kept, one price, stability check); data-model doc and diagram; Un-Purchasable stays tile-based (tested)
- 2026-10-05: v1.5.26278.9 - Load details label shortened; item data audit written up (T-54 proposed); 46/46 harness PASS
- 2026-10-05: v1.5.26278.8 - fixed unpurchasable items losing their highlight after Load details; T-38 confirmed live; T-26 and the Load details button scoped, awaiting decisions
- 2026-10-05: v1.5.26278.7 - T-38 hearts on edition cards (THIS EDITION excluded); 46/46 harness PASS
- 2026-10-05: T-50 phase 2b confirmed live (T-50 complete); T-38 investigated and explained, not started
