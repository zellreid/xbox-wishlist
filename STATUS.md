---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26271.2 in Edge (a wishlist add/remove resyncs without Refresh); then T-31 (pass entitlements); T-32 mocks still wanted (owned-heavy, empty, tiny, partial, shared, signed-out)
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-28
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live at v1.5.26271.2. T-34 (option C, HITL-approved) done: a page-world script notices a wishlist add/remove (emerald.xboxservices.com) and resyncs owned/date-added/entitlements without Refresh - still matches only wishlist* pages, no broader site access, no new permission. Not yet checked live.
- Mock tooling: prepare-fixture.js now takes a file or a directory, and defaults to mock_examples/_inbox/ when given neither (file-mocks.js --prepare updated to match); classify-capture.js shares the page-type detection with file-mocks.js.
- Your 10 new wishlist mocks (de-DE, pt-BR, ja-JP, ar-SA, fr-FR, en-IN, en-CA, fr-CA, plus two narrow-window en-ZA captures) are prepared and all PASS. Found and fixed a harness false-positive along the way: the "payload vs tiles" Owned check was comparing against the tile's English-only text on non-English captures (German shows "Im Besitz") instead of against what production actually uses (the data, correctly, on every market).
- Live at v1.5.26271.1, confirmed in Edge (T-27 done): Date Added default sort, Added Recently filter, per-currency prices, currency format, and the Stored data buttons all check out on the real site.
- T-30 done - "Default" sort renamed **Date Added**, now the real wishlist-add date (not page order), newest first; new Added Recently quick filter (30 days); addedDate export column. Confirmed distinct from release date.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-27 | Live check of v1.5.26271.2 in Edge: does a wishlist add/remove resync without Refresh | High | Todo | Add or remove an item on the real wishlist page, watch for owned/added-date updating on its own |
| T-31 | "In my pass" from entitlements (satisfyingProductId, endDate): filter and end-date chip | Medium | Todo | Decide: replace or sit beside the existing "In a pass"; show the pass end date |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Todo | Save into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters); detection is now language-free (page data) | Low | Todo | Decide whether our labels stay English or follow the page language; keep stored filter values as stable keys |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; 26 product mocks are ready as harness fixtures, replace their smoke check with real ones |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL); deals and games mocks are harness fixtures (smoke only) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| T-28 | Mock tidy-up: confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed); 2 orphan Batman "Return to Arkham" _files folders with no page | Low | Todo | Recapture the Serbian locale in Cyrillic to confirm; delete or recapture the two orphan folders |
| T-35 | Confirm the wishlist add/remove request shape (path, body) with a real HAR capture; tighten request-watcher.js's matcher | Low | Todo | DevTools -> Network, filter emerald, add/remove one item, share the HAR |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-28: T-34 option C done (v1.5.26271.2): page-world request-watcher.js notices a wishlist add/remove, resyncs data via a tagged postMessage bridge; prepare-fixture.js takes a file/directory (default _inbox), classify-capture.js shared with file-mocks.js; 10 new market mocks prepared, harness false-positive on Owned fixed; all 21 fixtures PASS
- 2026-09-28: T-27 confirmed - v1.5.26271.1 checked live in Edge (Date Added sort/filter, per-currency prices, Stored data buttons)
- 2026-09-28: T-30 done (v1.5.26271.1): Date Added is the real wishlist-add date, renamed from Default, newest first; Added Recently quick filter (30 days); addedDate export column; harness PASS on 7 wishlist captures
- 2026-09-26: Payload-first item data (v1.5.26269.5): title, publisher, price, discount, owned from the page data, tile fallback; store page reads update the item; userscript grants GM_listValues / GM_deleteValue (T-29, T-33 done); harness parity check, ?nostate, faked store-page test
- 2026-09-26: Followed the mock folder renames (no # prefix, locale); analysed the new en-gb/en-us wishlist captures (harness PASS, GBP/USD detected); recommended further wishlist mocks (T-32)
