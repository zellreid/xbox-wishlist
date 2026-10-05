---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Your OK on the manifest line, then live check of the languages (T-26); T-55 native review; T-06 Chrome / Tampermonkey
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
- v1.5.26278.12: T-26 done in code - every text we show comes from a catalogue (163 keys, built-in English plus 42 language files in shared/i18n/); the page's locale picks the language; stored values and export columns stay English. All 42 languages and all 46 fixtures pass the harness (language file loads, no raw keys). Translations are first-pass, unreviewed by native speakers.
- The extension cannot load the language files until one manifest line is added (HITL): see the first Blocked row. The userscript has an @resource per language.
- T-52, T-53, T-54 confirmed live.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-56 | Approve one manifest.json change: add "shared/i18n/*.json" to web_accessible_resources (HITL: manifest change, AGENTS 2.7 #10). No new permission or host permission | High | Blocked | Say yes and I'll make the one-line edit (then Edge can load the language files); the userscript already works |
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-26 | Live check the languages: with the manifest line in, open a wishlist at /de-DE/wishlist, /ja-JP/, /ar-SA/ (right to left), check the toolbar, Filter / Sort panels, chips, tooltips and Export menu are translated and nothing looks cut off; also a store page for the hearts | Medium | Not started | Reload the extension, switch xbox.com to each language, look at the panels and chips; long languages (de, fi, ru) may need wider buttons |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-55 | Native review of the translations (all 42 are first-pass; most worth checking: ar, he, ja, ko, zh-Hans, zh-Hant, th, ka, mt, is, sq, mk) | Medium | Todo | Hand each file to a native speaker (shared/i18n/<code>.json, 163 short texts, check.js shows coverage); fix in place, keep placeholders like {n} |

Backlog beyond the tables above (5 more): F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.12 - T-26: all UI text localised (163 keys, 42 language catalogues, tools/i18n/check.js, harness language checks); manifest line awaits approval; T-52/53/54 confirmed live
- 2026-10-05: v1.5.26278.10 - T-54 (merge on Load details, ownership kept, one price, stability check); data-model doc and diagram; Un-Purchasable stays tile-based (tested)
- 2026-10-05: v1.5.26278.9 - Load details label shortened; item data audit written up (T-54 proposed); 46/46 harness PASS
- 2026-10-05: v1.5.26278.8 - fixed unpurchasable items losing their highlight after Load details; T-38 confirmed live; T-26 and the Load details button scoped, awaiting decisions
- 2026-10-05: v1.5.26278.7 - T-38 hearts on edition cards (THIS EDITION excluded); 46/46 harness PASS
