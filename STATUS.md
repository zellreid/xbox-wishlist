---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Delete the session tool-output file (T-42); confirm T-47 live in Edge; then T-06 Chrome / Tampermonkey
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
- v1.5.26278.1: T-47 done in code - every layout size in styles.css is on the 4px grid (strokes and the checkbox tick left as is); 46/46 harness PASS. Not yet seen live in Edge.
- T-42: the HAR is gone. The session tool-output file be0f3qu57.txt (holds the same token) is still on disk.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-42 | Delete the session tool-output file be0f3qu57.txt (in the Claude project tool-results folder; HAR already deleted) | High | Blocked | Delete it by hand, or tell me to; optionally sign out and back in on xbox.com |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-48 | 40px toolbar: move the "Viewing X of Y" label into the Filter panel header | Low | Blocked | Your call: keep the two-row 64px bar, or move the label and go to one 40px row |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-47 | Visual check of the 4px-grid pass in Edge (chips 20px, refresh / flag 20px, sliders, panels, both themes) | Low | Not started | Reload the extension, open a wishlist, open Filter and Sort, look for cramped or shifted chips and rows |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-46 | Show the install size on each item (e.g. "94 GB" chip) once known | Low | Todo | Assume a quiet chip in the tag row, only when the size is known |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 5 more: F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.1 - T-47 layout sizes in styles.css on the 4px grid; T-42 HAR confirmed deleted; 46/46 harness PASS
- 2026-10-05: T-43, T-44, T-49 confirmed live; handover written (docs/HANDOFF-DOCUMENT.md rewritten for v1.5); licensing / selling question answered (MIT today; Microsoft unlikely buyer); no code change
- 2026-09-30: v1.5.26273.1 - toolbar 64px / panels at 144px on a 4px grid; toolbar no longer full-width or click-blocking; narrow-window panel overflow fixed; 46/46 harness PASS
- 2026-09-29: v1.5.26272.8 - T-44 age rating filter, Install Size sort (store-page size cached), Handheld optimised filter, developer search, export columns; garrison = Xbox PC app (not cloud); T-45 / New in pass confirmed; 46/46 harness PASS
- 2026-09-29: v1.5.26272.6 - T-43 leaving / new in pass (chips, filters, export; handles passes with no dates); three-state quick filters via a FLAG_FILTERS table plus discountBelow for On Sale / >=50% Off; T-31 confirmed live; 46/46 harness PASS
