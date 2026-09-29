---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26272.1 in Edge (add on a store page -> open wishlist tab resyncs; runs quietly on store/browse/deals pages); then decide F-38/F-35 page tooling
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
- v1.5.26272.1 built, not yet live-checked. HITL-approved manifest changes done: F-38 (store pages) and F-35 (browse, all-games, add-ons, sales pages) added to content_scripts matches and userscript @match - the core runs there with no UI yet; T-20 removed the unused displaycatalog host permission.
- T-35 done from the 2026-09-29 HAR: add = PUT, remove = DELETE to /xboxcomfd/wishlist/default/product/{id}/{sku}, no body. Watcher matcher tightened to that. Key finding: adds happen on the store page, so an add there is now recorded and an open wishlist tab resyncs when it comes back into view.
- Harness: all 46 fixtures PASS (20 wishlist, 26 smoke); targeted checks PASS (store-page add records the change, wishlist resyncs on view only when newer, tab arriving from elsewhere fetches wishlist data once).

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| F-38b | Decide what to show on store pages | Medium | Blocked | Your call; suggestion: an "On your wishlist since" chip plus the T-17 diagnostic |
| F-35b | Decide what to add on browse/deals pages (they have native filters) | Medium | Blocked | Your call; suggestion: "In a pass", Deal ends, flag, export only |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28b | Delete the 2 orphan Batman "Return to Arkham" _files folders | Low | Blocked | Agent delete was refused by the permission guard; delete them by hand (mock_examples/products/en-za/) |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-27 | Live check v1.5.26272.1 in Edge: wishlist add/remove resync | High | Not started | Wishlist open in tab 1; add a game on its store page in tab 2; switch back - item appears without Refresh; remove one on the wishlist - updates on its own |
| T-36 | Live check store/browse/deals pages: runs quietly, no console errors | Medium | Not started | Open a store page, /games/browse, /promotions/sales; no ifc UI, no errors; then click through to Wishlist - full UI appears |
| T-20 | Live check Load details and per-item refresh after the host permission removal | Medium | Not started | Filters > Capabilities > Load details, and one item refresh button - both still work |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-31 | "In my pass" from entitlements (satisfyingProductId, endDate): filter and end-date chip | Medium | Todo | Assume it sits beside "In a pass"; build in the core with the pass end date chip |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-29: v1.5.26272.1 - F-38/F-35 matches (store, browse, deals pages; no UI there yet), T-20 displaycatalog permission removed, T-35 watcher tightened from HAR, cross-tab wishlist-change resync; 46/46 harness PASS
- 2026-09-28: Status review and cross-repo prompt for the Blocked/Testing/TODO format; no code change
- 2026-09-28: Adopted the new Blocked/Testing/TODO STATUS.md format (root AGENTS.md 1.9 update); reclassified this file's rows accordingly, no code change
- 2026-09-28: T-34 option C done (v1.5.26271.2): page-world request-watcher.js notices a wishlist add/remove, resyncs data via a tagged postMessage bridge; prepare-fixture.js takes a file/directory (default _inbox), classify-capture.js shared with file-mocks.js; 10 new market mocks prepared, harness false-positive on Owned fixed; all 21 fixtures PASS
- 2026-09-28: T-27 confirmed - v1.5.26271.1 checked live in Edge (Date Added sort/filter, per-currency prices, Stored data buttons)
