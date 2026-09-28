---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26271.1 (Date Added default sort, Added Recently filter); save the requested wishlist mocks (T-32); then T-31 (pass entitlements)
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-26
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live at v1.5.26271.1: T-30 done - "Default" sort renamed **Date Added**, now the real wishlist-add date (not page order), newest first; new Added Recently quick filter (30 days); addedDate export column. Confirmed distinct from release date. Harness PASS on all 7 wishlist captures.
- Page data review (docs/07-DATA-FIELDS.md): a free, language-free read also gives Owned (entitlements isOwned), date added to the wishlist (all 310 items), and which games your pass covers now with its end date. Ranked list in the doc.
- Mocks: folders are now mock_examples/<type>/<market>/ (no # prefix, locale not _locale); tools and docs follow. New real captures wishlist/en-gb and wishlist/en-us (2026-09-26 14:11) pass the harness with ?realpath: GBP and USD detected, prices parse, ranges and history keyed per market. New captures: save into mock_examples/_inbox/, run `node tools/mock-harness/file-mocks.js --prepare`. Harness: `?realpath`, `?locale=xx-YY&currency=ZZZ`.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-27 | Live check of v1.5.26271.1: Date Added sort/filter, plus the earlier per-currency and Stored data items | High | In Progress | Confirm Date Added matches what you remember adding recently; try Added Recently; compare a tile before/after |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters); detection is now language-free (page data) | Low | Todo | Decide whether our labels stay English or follow the page language; keep stored filter values as stable keys |
| T-31 | "In my pass" from entitlements (satisfyingProductId, endDate): filter and end-date chip | Medium | Todo | Decide: replace or sit beside the existing "In a pass"; show the pass end date |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; 26 product mocks are ready as harness fixtures, replace their smoke check with real ones |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL); deals and games mocks are harness fixtures (smoke only) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| T-28 | Mock tidy-up: confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed); 2 orphan Batman "Return to Arkham" _files folders with no page | Low | Todo | Recapture the Serbian locale in Cyrillic to confirm; delete or recapture the two orphan folders |
| T-32 | Save more wishlist mocks: an owned-heavy one first (Owned is now read from the data, and only 1 owned game per capture is tested), then non-English markets (de-DE, pt-BR, ja-JP), empty, tiny, partial, shared, narrow | Medium | Todo | Save into mock_examples/_inbox/, run file-mocks.js --prepare |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-28: T-30 done (v1.5.26271.1): Date Added is the real wishlist-add date, renamed from Default, newest first; Added Recently quick filter (30 days); addedDate export column; harness PASS on 7 wishlist captures
- 2026-09-26: Payload-first item data (v1.5.26269.5): title, publisher, price, discount, owned from the page data, tile fallback; store page reads update the item; userscript grants GM_listValues / GM_deleteValue (T-29, T-33 done); harness parity check, ?nostate, faked store-page test
- 2026-09-26: Stored data section in the filter panel (v1.5.26269.4): Clear cached data / Reset everything, two-click confirm, reload; extension adapter lists keys; tested in the harness; PASS on 8 pages
- 2026-09-26: Followed the mock folder renames (no # prefix, locale); analysed the new en-gb/en-us wishlist captures (harness PASS, GBP/USD detected); recommended further wishlist mocks (T-32)
- 2026-09-26: T-25 done (v1.5.26269.3): price range per currency, presets remember currency, Intl price format; harness ?currency; page data review found addedDate, pass entitlements, isOwned; changelog and docs/07 updated
