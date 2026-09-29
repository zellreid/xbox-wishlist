---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: T-31 "In my pass" filter; T-06 Chrome/Tampermonkey live check
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-29
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live-confirmed in Edge at v1.5.26272.4: live add/remove resync (T-27/T-34), wishlist hearts on store/browse/deals cards (T-37) opening in a new tab (T-41), theme only on the wishlist (T-36), displaycatalog permission removal (T-20).
- Owned tick (T-40) skipped: the only ownership endpoint (productActions, per product) needs the sign-in token; the token-free route (each game's store page) is too heavy per card or needs owned ids stored locally.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |
| T-42 | Delete the HAR in mock_examples/_inbox/ when done with it | Low | Blocked | Tokens were stripped, but it still holds your gamertag and account id; delete it by hand (it is git-ignored) |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-31 | "In my pass" from entitlements (satisfyingProductId, endDate): filter and end-date chip | Medium | Todo | Assume it sits beside "In a pass"; build in the core with the pass end date chip |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-29: T-27/T-34 live resync and T-41 confirmed live (removal dropped); T-40 owned tick skipped after endpoint check (productActions needs the sign-in token; HAR was a sanitized export); no code change
- 2026-09-29: v1.5.26272.4 - heart opens the wishlist in a new tab; T-36, T-20, T-37 confirmed live; T-27 failed live (removal proposed); owned tick assessed (no data on browse pages); 46/46 harness PASS
- 2026-09-29: v1.5.26272.3 - wishlist hearts on store/browse/deals/add-on cards (filled heart, "On your wish list since", links to the locale's wishlist; data fetched per page, memory only); harness server serves /<locale>/wishlist
- 2026-09-29: v1.5.26272.2 - theme only on wishlist pages (Xbox's own restored elsewhere); T-28b folders deleted by user; card heart proposal assessed (2 decisions open); 46/46 harness PASS
- 2026-09-29: v1.5.26272.1 - F-38/F-35 matches (store, browse, deals pages; no UI there yet), T-20 displaycatalog permission removed, T-35 watcher tightened from HAR, cross-tab wishlist-change resync; 46/46 harness PASS
