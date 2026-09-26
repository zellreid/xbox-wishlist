---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of per-market price history (v1.5.26269.2) on en-ZA and en-US; then T-25 (price range per market) and T-26 (localise Owned and other labels)
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
- Live at v1.5.26269.2 (locale detection now handles codes like sr-Latn-RS). Price history is saved per market (region in the URL), the currency symbol comes from the page, and prices like $1,299.00 parse correctly. Needs a live check on en-ZA (old history still shows) and en-US (starts empty, dollar prices).
- Mock harness now covers every mock area: 33 fixtures (5 wishlist full checks, 28 smoke on deals, games, products, add-ons), all PASS. `?locale=en-US` rewrites the address so the core sees that market; verified it saves price history under `_prices_US`. Product mocks are named {id}_{date}_{time}_{slug}; `tools/mock-harness/locales.json` lists all 94 xbox.com locales.
- Next: T-25 (saved price range and saved filters are still one set for all markets) and T-26 (localise Owned and other fixed English labels).

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-27 | Per-market price history, currency symbol and price parsing | High | In Progress | Live check: en-ZA keeps old history, en-US starts empty with $ prices and a correct price slider |
| T-25 | Saved price range and saved filters per market | Medium | Todo | Decide: key filter state by market, or clear the price range when the market changes |
| T-26 | Localise Owned and other fixed English labels | Medium | Todo | List the labels the page shows per language (Owned, "with", Add-ons); decide detection from the page text or URL language |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; 26 product mocks are ready as harness fixtures, replace their smoke check with real ones |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL); deals and games mocks are harness fixtures (smoke only) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| T-28 | Mock tidy-up: confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed); 2 orphan Batman "Return to Arkham" _files folders with no page | Low | Todo | Recapture the Serbian locale in Cyrillic to confirm; delete or recapture the two orphan folders |

+ 4 more: F-28 to F-30 in docs/01-PRD.md, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-09-26: Harness extended to all mock areas (33 fixtures, all PASS), ?locale rewrite tested, product mocks renamed {id}_{date}_{time}_{slug} + #addons, locales.json (94 locales), getMarket handles script codes (v1.5.26269.2)
- 2026-09-26: Mock layout: renamed deals/games captures to 20260923_1319 / 20260923_1320 (+ _files, 76 internal links); prepare-fixture, server and README follow #type/market/; harness PASS
- 2026-09-26: Per-market price history and currency (v1.5.26269.1): region-keyed storage, page currency symbol, fixed $1,299.00 parsing; T-24/F-26/F-27 confirmed; mock harness PASS on all 5 mocks
- 2026-09-25: Filter panel (v1.5.26268.14): range sections equal and tighter (151 -> 110px), panel foot trimmed to its 15px padding; slider still filters; mock harness PASS on all 5 mocks
- 2026-09-25: Filter panel (v1.5.26268.13): removed the divider under the last group (Discount Range); mock harness PASS on all 5 mocks
