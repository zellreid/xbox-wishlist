---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26272.8 (Age rating filter, Install Size sort, Handheld optimised, developer search)
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
- v1.5.26272.8: T-44 - Age rating filter (by minimum age, all boards together), Install Size sort (size from store pages via Load details / item refresh, cached), Handheld optimised three-state quick filter, developer in search, six new export columns. 46/46 harness PASS plus targeted checks.
- Field check: `isAvailableOnGarrison` means "available in the Xbox PC app", not cloud gaming (from Xbox's own code) - exported only; docs/08 corrected.
- Install sizes: the wishlist page has almost none (1 of 307), so the sort is only useful after "Load details" (or an item's refresh) has read the store pages.
- Live-confirmed today: T-45 three-state quick filters, "New in pass", T-31 "In my pass". "Leaving pass soon" waits for Xbox to announce a departure.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-42 | Delete the HAR in mock_examples/_inbox/ (holds a sign-in token in a request body) and the session tool-output file be0f3qu57.txt | High | Blocked | Both still on disk; delete by hand, optionally sign out and back in on xbox.com |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-44 | Live check age rating, install size, handheld, developer search | Medium | Not started | Filters > Age rating: tick "Ages 16+"; quick filter Handheld optimised; search a developer name; run Load details, then Sort by Install Size |
| T-43 | Live check "Leaving pass soon" | Low | Not started | Greyed out until Xbox announces a departure; then the chip shows the date and the filter lists it |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-46 | Show the install size on each item (e.g. "94 GB" chip) once known | Low | Todo | Assume a quiet chip in the tag row, only when the size is known |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 5 more: F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-29: v1.5.26272.8 - T-44 age rating filter, Install Size sort (store-page size cached), Handheld optimised filter, developer search, export columns; garrison = Xbox PC app (not cloud); T-45 / New in pass confirmed; 46/46 harness PASS
- 2026-09-29: v1.5.26272.6 - T-43 leaving / new in pass (chips, filters, export; handles passes with no dates); three-state quick filters via a FLAG_FILTERS table plus discountBelow for On Sale / >=50% Off; T-31 confirmed live; 46/46 harness PASS
- 2026-09-29: v1.5.26272.5 - T-31 "In my pass" (filter, chip, export); docs/08-XBOX-REQUESTS.md request and page-data catalogue; found a sign-in token in the HAR's request bodies (delete it); 46/46 harness PASS
- 2026-09-29: T-27/T-34 live resync and T-41 confirmed live (removal dropped); T-40 owned tick skipped after endpoint check (productActions needs the sign-in token; HAR was a sanitized export); no code change
- 2026-09-29: v1.5.26272.4 - heart opens the wishlist in a new tab; T-36, T-20, T-37 confirmed live; T-27 failed live (removal proposed); owned tick assessed (no data on browse pages); 46/46 harness PASS
