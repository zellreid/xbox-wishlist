---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26273.1 (toolbar/panel spacing and click-through) and v1.5.26272.8 (T-44 age rating, install size, handheld, developer)
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-30
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- v1.5.26273.1: toolbar and Filter/Sort panels on a 4px grid - bar 64px tall (24 label + 8 gap + 32 buttons) at 72px, panels 8px below at 144px with 16px padding and 8px corners. Fixed: the full-width toolbar (Xbox's class, ~1,250px) swallowed clicks on items scrolled under it; now content-width and only its buttons take clicks. Fixed: the panel ran 20px off-screen on narrow windows. 46/46 harness PASS, checked in both stylesheet orders.
- 40px toolbar not possible while the "Viewing X of Y" label has its own row (two rows need 64px); one row would collide with Xbox's centred page title. Option: move the label into the Filter panel header, then the bar can be 40px (T-48).
- v1.5.26272.8 (T-44): Age rating filter, Install Size sort (sizes from store pages, cached), Handheld optimised quick filter, developer in search, six export columns. isAvailableOnGarrison = "in the Xbox PC app", not cloud.
- 78 other sizes in styles.css are off the 4px grid (mostly 6, 10, 3, 18px) - logged as T-47.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-42 | Delete the HAR in mock_examples/_inbox/ (holds a sign-in token in a request body) and the session tool-output file be0f3qu57.txt | High | Blocked | Still on disk; delete both by hand, optionally sign out and back in on xbox.com |
| T-48 | 40px toolbar: move the "Viewing X of Y" label into the Filter panel header | Low | Blocked | Your call: keep the two-row 64px bar, or move the label and go to one 40px row |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-49 | Live check toolbar/panel spacing and click-through | High | Not started | Toolbar sits where it did, 8px gap to the open Filter panel; scroll so an item passes under the bar's empty space and click it - the item responds |
| T-44 | Live check age rating, install size, handheld, developer search | Medium | Not started | Filters > Age rating: tick "Ages 16+"; quick filter Handheld optimised; search a developer; run Load details, then Sort by Install Size |
| T-43 | Live check "Leaving pass soon" | Low | Not started | Greyed out until Xbox announces a departure; then the chip shows the date and the filter lists it |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-47 | Put the remaining 78 off-grid sizes in styles.css on the 4px grid | Low | Todo | Assume nearest multiple of 4 (6 -> 4 or 8, 10 -> 8 or 12, 18 -> 16 or 20), checked visually per component |
| T-46 | Show the install size on each item (e.g. "94 GB" chip) once known | Low | Todo | Assume a quiet chip in the tag row, only when the size is known |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 5 more: F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-30: v1.5.26273.1 - toolbar 64px / panels at 144px on a 4px grid; toolbar no longer full-width or click-blocking; narrow-window panel overflow fixed; 46/46 harness PASS
- 2026-09-29: v1.5.26272.8 - T-44 age rating filter, Install Size sort (store-page size cached), Handheld optimised filter, developer search, export columns; garrison = Xbox PC app (not cloud); T-45 / New in pass confirmed; 46/46 harness PASS
- 2026-09-29: v1.5.26272.6 - T-43 leaving / new in pass (chips, filters, export; handles passes with no dates); three-state quick filters via a FLAG_FILTERS table plus discountBelow for On Sale / >=50% Off; T-31 confirmed live; 46/46 harness PASS
- 2026-09-29: v1.5.26272.5 - T-31 "In my pass" (filter, chip, export); docs/08-XBOX-REQUESTS.md request and page-data catalogue; found a sign-in token in the HAR's request bodies (delete it); 46/46 harness PASS
- 2026-09-29: T-27/T-34 live resync and T-41 confirmed live (removal dropped); T-40 owned tick skipped after endpoint check (productActions needs the sign-in token; HAR was a sanitized export); no code change
