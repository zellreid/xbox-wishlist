---
project: Xbox Wishlist
label: Personal
priority: Medium
phase: Live
next_milestone: T-62 and T-59 live check in Edge; T-55 native review; T-06 Chrome / Tampermonkey
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-10-06
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- v1.5.26279.4: Filters panel dividers tidied (CSS only): a divider above and below the tag row; none above Saved filters, above Owned, below Capabilities or below Subscriptions; the one above Stored data stays. Harness (en-ZA, ar-SA, de-DE, he-IL and the minified build) PASS.
- v1.5.26279.3: T-62 built: the Filters panel has four looping tabs (Quick, Game, Store, Price). Header, search and the active-filter tags stay above the strip; accordions start closed; arrows at each end, Left / Right / Home / End keys (mirrored in right-to-left), swipe on touch; a count badge on each tab for filters set in it; the open tab is remembered. Quick = Saved filters + Quick filters; Game = Genres, Platforms, Type, Age rating, Capabilities; Store = Owned, Publishers, Subscriptions; Price = Price and Discount range; Stored data stays pinned. 5 new text keys in all 42 languages (first-pass). Harness: 15 fixtures + he-IL PASS with a new tabs check, and the minified build PASSes too.
- T-60 built (no extension code change, so no version bump): esbuild added as a dev dependency (package.json, exact 0.28.2); `npm run build` writes the minified extension to dist/extension/ (git-ignored): core 292 KB to 123 KB, whole extension 742 KB to 522 KB. Harness `?dist` runs the minified build: en-ZA, de-DE, ar-SA and en-US market checks PASS. The Greasy Fork userscript stays readable.
- T-57 (right-to-left), T-26 (languages), T-60 (minified build) and T-58 (details cache) confirmed live by the owner on 2026-10-06.
- v1.5.26279.2: T-59 built: price history moved into the same IndexedDB (one record per product and market, key <market>|<product id>); a market's old chrome.storage blob migrates once and is removed; changed records only are written. Also fixes a T-58 flaw seen live: a product cached in Arabic showed Arabic capability text on en-ZA; text now falls back to English first, and Load details treats a record without the page language's text as stale so it refetches. Harness: all 15 desktop wishlist fixtures PASS, plus en-US and de-DE market checks and a migration test (blob to rows, old entry dropped).
- v1.5.26279.1: T-58 built: the details cache (capabilities, add-ons count, install size) moved from one chrome.storage blob to IndexedDB. The master record per product holds capability keys only; labels live in a per-locale table, so a fetch in any language or region fills the same record. Filters and saved filters now hold keys (old label selections migrate). Harness: 15 of 17 wishlist fixtures PASS at desktop width (the 2 phone-width variants were not run), plus a cross-locale and legacy-migration check. Prices are still per-market blobs (T-59).
- v1.5.26278.14: right-to-left pages (T-57) built: toolbar, panels, Export menu, hearts and discount dot mirror to the inline end (left in Arabic / Hebrew); logical CSS; sliders stay left to right; bidi isolation of filled-in values; new harness "direction" check. 46/46 fixtures and Hebrew (`?locale=he-IL`) pass.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-62 | Filters panel tabs live in Edge: npm run build, reload the extension from dist/extension (v1.5.26279.4 also has the divider clean-up) | Medium | Not started | Open Filter: check the dividers (above and below the tags; none above Saved filters, above Owned, below Capabilities, below Subscriptions); search and tags above the strip; the arrows and Left / Right keys loop; set filters on different tabs and check the badges; close and reopen (the last tab is remembered); try /ar-SA/wishlist (mirrored); check long languages (de, fi, ru) for cut-off tab names |
| T-59 | Price history in IndexedDB live | High | Not started | Reload the extension in Edge; open the wishlist: price-change badges and sale-start info should still show (your old per-market history migrates once); switch xbox.com to another region and back: each region keeps its own history; Clear cached data empties it |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey (the userscript's IndexedDB lives in the xbox.com origin) |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-61 | Minified userscript release (future): a second, minified .user.js for GitHub releases or direct install; the Greasy Fork file stays readable | Low | Todo | Add a minify step in tools/userscript/ that keeps the ==UserScript== header, writes a separate file (e.g. dist/xbox-wishlist.min.user.js), and test it in Tampermonkey |
| T-55 | Native review of the translations (all 42 are first-pass; most worth checking: ar, he, ja, ko, zh-Hans, zh-Hant, th, ka, mt, is, sq, mk) | Medium | Todo | Hand each file to a native speaker (shared/i18n/<code>.json, 163 short texts, check.js shows coverage); fix in place, keep placeholders like {n} |

Backlog beyond the tables above (5 more): F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-06: v1.5.26279.4 - Filters panel divider clean-up (CSS only); computed-style check per tab, 4 fixtures + minified build PASS
- 2026-10-06: v1.5.26279.3 - T-62: Filters panel tabs (looping, badges, remembered, RTL, swipe); 5 keys x 42 languages; harness tabs check; 15 fixtures + he-IL + minified build PASS
- 2026-10-06: Filters panel tabs proposed (T-62, awaiting your choice); no code changes
- 2026-10-06: T-60 and T-58 confirmed live; how to inspect the IndexedDB explained; open backlog listed; no code changes
- 2026-10-06: T-60 - esbuild dev dependency, tools/build.js (npm run build -> dist/extension, 742 to 522 KB), harness ?dist (4 checks PASS on the minified build), AGENTS.md deployment docs; T-61 minified userscript recorded for later
