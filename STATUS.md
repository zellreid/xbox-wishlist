---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check T-38; T-06 Chrome / Tampermonkey
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
- v1.5.26278.7: T-38 in code - the other editions in a game page's Editions carousel get the wishlist heart (id from the carousel item's data-testid; the THIS EDITION card gets none); 46/46 harness PASS, checked on the Final Fantasy Tactics fixture. Not yet seen live.
- T-50 complete (phase 2b confirmed live).

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-38 | Live check the edition hearts | Low | Not started | Reload the extension, open a game page that has an Editions carousel (e.g. Final Fantasy Tactics) where another edition is on your wishlist: that card shows the heart top right, the card marked THIS EDITION shows none; click it (opens the wishlist in a new tab) |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 5 more: F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.7 - T-38 hearts on edition cards (THIS EDITION excluded); 46/46 harness PASS
- 2026-10-05: T-50 phase 2b confirmed live (T-50 complete); T-38 investigated and explained, not started
- 2026-10-05: v1.5.26278.6 - T-50 phase 2b (Xbox button classes on panel buttons); T-51, T-50 2a, T-46 confirmed live; 46/46 harness PASS
- 2026-10-05: v1.5.26278.5 - T-51 heart now Xbox's own icon; T-48 closed (keep 64px toolbar); 46/46 harness PASS
- 2026-10-05: v1.5.26278.4 - T-50 phase 2a (Xbox --gds-* tokens, --ifc-brand); size chip after the flag; heart question answered; 46/46 harness PASS
