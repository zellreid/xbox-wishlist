---
project: Xbox Wishlist
label: Personal
priority: Medium
phase: Live
next_milestone: T-65 live check; T-67 to T-70 browse / deals chips; T-55 native review
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-10-07
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- v1.5.26280.2: T-88 built: the theme-sheet finder remembers the Xbox stylesheet that worked, per theme, under a new chrome.storage.local key (ifc_xbox_wishlist_themesheet; GM storage in the userscript), and tries it first. Before, most chunk ids it probed had no stylesheet, so the console filled with `...chunk.css 404` errors (and up to 15 of Xbox's scripts were fetched) on every theme switch. The remembered file name carries Xbox's hash, so after an Xbox release it misses once, the full search runs again and the new sheet is saved. Harness en-ZA fixture PASS (all checks). The fixture has no dark theme sheet, so the remembered path itself was not exercised there; it needs the live check below. The harness "toolbar on the left" failure noted under v1.5.26280.1 was the browser pane reporting width 0; at 1400 wide it passes with and without the change.
- T-64 (theme-sheet finder, v1.5.26280.1), T-59 (price history in IndexedDB) and T-62 (Filters panel tabs, with the later divider, accordion and Load details changes) confirmed live in Edge by the owner on 2026-10-07.
- v1.5.26280.1: T-64 built: fixes the Edge error "Could not load Xbox's colours for this theme: no numbered stylesheet chunks on the page" (seen on /wishlist?xr=shellnav). The theme-sheet finder needed a loaded "<number>.<hash>.chunk.css"; Xbox now ships those without ".chunk" (or not at all), so it gave up. It now anchors on any hashed Xbox stylesheet and tries every chunk the script requests, keeping only a theme-only sheet for the current theme. Checked against live xbox.com: finds the dark sheet (5398). Harness en-ZA fixture shows "toolbar is on the left in a ltr page" both with and without this change (pre-existing, likely the narrow browser pane; not investigated).
- v1.5.26279.5: T-63 built: only one accordion open at a time across the whole panel (opening one closes the other, clicking the open one closes it; chevron icons load in order so fast clicks cannot leave the wrong icon); the Load details button and its status moved from the Capabilities accordion to the top of Stored data, above Clear cached data / Reset everything. Harness: ar-SA, de-DE, en-US, fr-FR, ja-JP, he-IL and the minified build PASS with a new accordions check.
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
| T-66 | Decide what browse / deals pages get beyond deal-end dates (rating chip, In a pass, export, filters) | Medium | Blocked | Pick from the candidates in docs/04 epic E1 |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |
| T-74 | Deal alerts: choose the mechanism (new manifest permission, GM_notification, or in-page banner) | Low | Blocked | Decide; a permission needs HITL approval |
| T-78 | Comparison mode: choose side-by-side panel or modal, and the fields | Low | Blocked | Decide the design |
| T-75 | Alert threshold setting (default 10%) | Low | Blocked | After T-74 |
| T-76 | Detect price drops on flagged games | Low | Blocked | After T-74 |
| T-77 | Show the alert via an adapter method | Low | Blocked | After T-74 |
| T-79 | Select control on each card (2 to 3 games) | Low | Blocked | After T-78 |
| T-80 | Compare panel | Low | Blocked | After T-78 |
+ 1 more in docs/04-FEATURE-BREAKDOWN.md (T-81)

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-65 | Live-confirm older "needs a live check" entries: F-25, F-26, T-19, T-20, T-23, T-24, F-39 | Medium | In progress | Work through the checklist given in chat on 2026-10-07 (7 items); tell me which pass or fail |
| T-88 | Live-check the remembered theme sheet (v1.5.26280.2) | Medium | Not started | Reload the extension, open /wishlist, DevTools Console + Network, switch theme to dark once (the 404 run happens once and the sheet is saved); reload, switch again: expect one request to the saved chunk.css and no 404s |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-55 | Native review of the 42 translations (all first-pass) | Medium | Todo | Hand each shared/i18n/<code>.json to a native speaker; keep placeholders like {n} |
| T-67 | Browse / deals cards: read product id and price data from the page state (no UI yet) | Medium | Todo | Resolve card prefixes through resolveClass; test on the deals, games and add-ons fixtures |
| T-68 | Deal-end chip on browse / deals cards | Medium | Todo | After T-67 |
| T-69 | Pick up cards that arrive on "load more" scrolling | Medium | Todo | After T-67; MutationObserver on the card list |
| T-70 | Harness checks for the browse / deals chips | Medium | Todo | After T-68 |
| T-87 | Write up T-54 to T-64 in docs/04 and the PRD done table | Medium | Todo | Add the entries; keep the remaining-backlog section in step |
| T-61 | Minified userscript release (separate .min.user.js; Greasy Fork file stays readable) | Low | Todo | Add a minify step in tools/userscript/, test in Tampermonkey |
| T-71 | Ubisoft+ included chip and quick filter | Low | Todo | Read hasUbisoftCrossEntitlementProduct |
| T-72 | Edition name in the list and export | Low | Todo | Read skuSummaries[].skuTitle |
| T-73 | Giftable price / can-gift flag | Low | Todo | Read specificPrices.giftable |
+ 5 more in docs/04-FEATURE-BREAKDOWN.md (T-82 to T-84 statistics, T-85 Firefox spike, T-86 Safari)

## Recent sessions
- 2026-10-07: v1.5.26280.2 - T-88: theme-sheet finder remembers the working stylesheet per theme (fewer 404s, no script fetches); harness en-ZA PASS; live check pending. Also explained that the request-watcher.js errors were a tracker blocker, not our code
- 2026-10-07: T-65 live-check checklist (F-25, F-26, T-19, T-20, T-23, T-24, F-39) given to the owner in chat; no code changes
- 2026-10-07: backlog broken into epics E1 to E7 with IDs T-65 to T-87 (docs/04); PRD planned rows point at them; no code changes
- 2026-10-07: T-64, T-59 and T-62 confirmed live by the owner; no code changes
- 2026-10-07: v1.5.26280.1 - T-64: theme-sheet finder no longer needs a numbered ".chunk.css" anchor; verified against live xbox.com; harness toolbar check fails with and without the change
