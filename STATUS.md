---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26272.6 (three-state quick filters; leaving / new in pass); then T-44 extra data columns
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
- v1.5.26272.6: T-43 - "Leaving pass soon" (amber chip + quick filter) and "New in pass" (green chip + quick filter) from each game's pass join/leave dates; export passJoined / passLeaves. Quick filters now cycle off -> "is" -> "is not" -> off (On Sale -> "Not on sale", Cheap -> "Not cheap", and so on); Owned / Not Owned stay two-state. 46/46 harness PASS plus cycle, saved-state, saved-filter and injected-date checks.
- Your current data has no announced pass exits and nothing new in the last 30 days, so those two buttons show greyed out until Xbox announces something.
- T-31 "In my pass" confirmed live. docs/08-XBOX-REQUESTS.md holds the request and page-data catalogue.
- The HAR (with a sign-in token in a request body) and the tool-output file are still on disk (T-42).

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-42 | Delete the HAR in mock_examples/_inbox/ (holds a sign-in token in a request body) and the session tool-output file be0f3qu57.txt | High | Blocked | Delete both by hand; optionally sign out and back in on xbox.com |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-45 | Live check three-state quick filters | High | Not started | Click "In a pass" three times: green / red-outlined "Not in a pass" / off, with the list and tag following; same for On Sale ("Not on sale") and Cheap; reload keeps a "Not" state |
| T-43 | Live check leaving / new in pass | Medium | Not started | Buttons greyed out until Xbox announces an exit or a new addition; when one appears, the chip shows the date and the filter lists it |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-44 | Extra columns/filters from existing data: install size, age rating, developer, cloud playable, handheld verified | Low | Todo | Pick which; confirm isAvailableOnGarrison / hhVerified meanings first |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-29: v1.5.26272.6 - T-43 leaving / new in pass (chips, filters, export; handles passes with no dates); three-state quick filters via a FLAG_FILTERS table plus discountBelow for On Sale / >=50% Off; T-31 confirmed live; 46/46 harness PASS
- 2026-09-29: v1.5.26272.5 - T-31 "In my pass" (filter, chip, export); docs/08-XBOX-REQUESTS.md request and page-data catalogue; found a sign-in token in the HAR's request bodies (delete it); 46/46 harness PASS
- 2026-09-29: T-27/T-34 live resync and T-41 confirmed live (removal dropped); T-40 owned tick skipped after endpoint check (productActions needs the sign-in token; HAR was a sanitized export); no code change
- 2026-09-29: v1.5.26272.4 - heart opens the wishlist in a new tab; T-36, T-20, T-37 confirmed live; T-27 failed live (removal proposed); owned tick assessed (no data on browse pages); 46/46 harness PASS
- 2026-09-29: v1.5.26272.3 - wishlist hearts on store/browse/deals/add-on cards (filled heart, "On your wish list since", links to the locale's wishlist; data fetched per page, memory only); harness server serves /<locale>/wishlist
