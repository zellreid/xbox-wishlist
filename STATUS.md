---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26272.5 ("In my pass" filter and chip); then pick from the data ideas in docs/08-XBOX-REQUESTS.md
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
- v1.5.26272.5: T-31 "In my pass" - quick filter, green "In your pass" chip (renews / until date on hover), export columns; from the wishlist page's entitlements. 46/46 harness PASS; 23 products on the en-ZA capture, matching the raw data.
- docs/08-XBOX-REQUESTS.md written: every request xbox.com makes on the wishlist, store, browse, deals, add-on and search flows (purpose, payload shape), the page-data fields, entitlements (T-40 answer), and a list of further data ideas.
- The HAR's sign-in call body holds a Microsoft sign-in token (sanitized exports keep request bodies) - delete the HAR now that the doc exists (T-42).
- Live-confirmed earlier today: live add/remove resync (T-27/T-34), card hearts (T-37) in a new tab (T-41), theme on the wishlist only (T-36), T-20.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-42 | Delete the HAR in mock_examples/_inbox/ (holds a sign-in token in a request body) | High | Blocked | Delete it by hand; also the session tool-output file that printed part of it (path in this session's summary) |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-31 | Live check "In my pass" | Medium | Not started | On the wishlist: pass games show a green "In your pass" chip (hover: renews date); Filters > quick filter "In my pass" shows only those; export has inMyPass / myPassEnds |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-43 | "Leaving Game Pass soon" filter + "Leaves {date}" chip, and "New to Game Pass" | Medium | Todo | Read passMetadataByPassProductId entry/exit dates (future exit within 30 days / entry within 30 days) |
| T-44 | Extra columns/filters from existing data: install size, age rating, developer, cloud playable, handheld verified | Low | Todo | Pick which; confirm isAvailableOnGarrison / hhVerified meanings first |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-29: v1.5.26272.5 - T-31 "In my pass" (filter, chip, export); docs/08-XBOX-REQUESTS.md request and page-data catalogue; found a sign-in token in the HAR's request bodies (delete it); 46/46 harness PASS
- 2026-09-29: T-27/T-34 live resync and T-41 confirmed live (removal dropped); T-40 owned tick skipped after endpoint check (productActions needs the sign-in token; HAR was a sanitized export); no code change
- 2026-09-29: v1.5.26272.4 - heart opens the wishlist in a new tab; T-36, T-20, T-37 confirmed live; T-27 failed live (removal proposed); owned tick assessed (no data on browse pages); 46/46 harness PASS
- 2026-09-29: v1.5.26272.3 - wishlist hearts on store/browse/deals/add-on cards (filled heart, "On your wish list since", links to the locale's wishlist; data fetched per page, memory only); harness server serves /<locale>/wishlist
- 2026-09-29: v1.5.26272.2 - theme only on wishlist pages (Xbox's own restored elsewhere); T-28b folders deleted by user; card heart proposal assessed (2 decisions open); 46/46 harness PASS
