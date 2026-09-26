---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of v1.5.26269.3 on en-ZA and en-US (price history, price range per currency, currency format); then T-29 (Owned from page data) and the date added / pass entitlement features
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
- Live at v1.5.26269.3. T-25 built: the price range is saved per currency (page currency code), saved filters remember their price currency, prices show in the page's currency and locale style (R 948,27 / $948.27). Tested in the harness with a rand store opened as a dollar page (range off, rand range kept, old preset applies without its price part, back on rand everything intact); harness PASS on all mocks tried (10). Needs a live check on en-ZA (same look, slightly different number style) and en-US.
- Page data review (docs/07-DATA-FIELDS.md): a free, language-free read also gives Owned (entitlements isOwned), date added to the wishlist (all 310 items), and which games your pass covers now with its end date. Ranked list in the doc.
- Mocks: folders are now mock_examples/<type>/<market>/ (no # prefix, locale not _locale); tools and docs follow. New real captures wishlist/en-gb and wishlist/en-us (2026-09-26 14:11) pass the harness with ?realpath: GBP and USD detected, prices parse, ranges and history keyed per market. New captures: save into mock_examples/_inbox/, run `node tools/mock-harness/file-mocks.js --prepare`. Harness: `?realpath`, `?locale=xx-YY&currency=ZZZ`.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-27 | Live check of v1.5.26269.3: per-market price history, price range per currency, currency format | High | In Progress | en-ZA: old history and range intact, number style R 948,27; en-US: empty history, no price filter, $ prices; switch back and check the rand range returned |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters); detection stays language-free via T-29 | Low | Todo | After T-29: decide whether our labels stay English or follow the page language; keep stored filter values as stable keys |
| T-29 | Owned from the page data (entitlements isOwned) instead of the word "Owned" and the BUY text | Medium | Todo | Capture a wishlist with several owned games and a Game Pass one first; switch, keep the text check as fallback |
| T-30 | Date added: sort and "added in the last N days" filter (state addedDate, all items) | Medium | Todo | Decide the shape (sort only, or sort plus quick filters like Last 30 days) |
| T-31 | "In my pass" from entitlements (satisfyingProductId, endDate): filter and end-date chip | Medium | Todo | Decide: replace or sit beside the existing "In a pass"; show the pass end date |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; 26 product mocks are ready as harness fixtures, replace their smoke check with real ones |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL); deals and games mocks are harness fixtures (smoke only) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| T-28 | Mock tidy-up: confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed); 2 orphan Batman "Return to Arkham" _files folders with no page | Low | Todo | Recapture the Serbian locale in Cyrillic to confirm; delete or recapture the two orphan folders |
| T-32 | Save more wishlist mocks (list in chat): non-English markets (de-DE, fr-FR, pt-BR, ja-JP, ar-SA), owned-heavy, empty, tiny, partial "Viewing 20 of N", shared, narrow window | Medium | Todo | Save into mock_examples/_inbox/ (use --tag for same-day variants), run file-mocks.js --prepare |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-26: Followed the mock folder renames (no # prefix, locale); analysed the new en-gb/en-us wishlist captures (harness PASS, GBP/USD detected); recommended further wishlist mocks (T-32)
- 2026-09-26: T-25 done (v1.5.26269.3): price range per currency, presets remember currency, Intl price format; harness ?currency; page data review found addedDate, pass entitlements, isOwned; changelog and docs/07 updated
- 2026-09-26: T-25 analysis: found language-free ownership (state entitlements isOwned) and a per-price currency code in the page data; no code changed
- 2026-09-26: Mock intake: file-mocks.js names and files captures from mock_examples/_inbox by the address they were saved from; mock conventions documented in tools/mock-harness/README.md, pointer in docs/06-TESTING.md
- 2026-09-26: Harness extended to all mock areas (33 fixtures, all PASS), ?locale rewrite tested, product mocks renamed {id}_{date}_{time}_{slug} + #addons, locales.json (94 locales), getMarket handles script codes (v1.5.26269.2)
