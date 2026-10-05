---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of the languages and right-to-left in Edge (T-26, T-57); T-55 native review; T-06 Chrome / Tampermonkey
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
- v1.5.26278.14: right-to-left pages (T-57) built: toolbar, panels, Export menu, hearts and discount dot mirror to the inline end (left in Arabic / Hebrew); logical CSS; sliders stay left to right; bidi isolation of filled-in values; new harness "direction" check. 46/46 fixtures and Hebrew (`?locale=he-IL`) pass.
- v1.5.26278.13: the manifest line is in, so the extension can load the 42 language files; reload it in Edge to try them (T-26 live check).

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-57 | Right-to-left layout live: open a wishlist at /ar-SA/wishlist and /he-IL/wishlist | Medium | Not started | Reload the extension; the toolbar and panels should be on the left, clear of the page title and the item names; open Filter, Sort and Export; drag the price slider (green fill follows the thumbs); a size chip reads like "6 GB" |
| T-26 | Live check the languages: with the manifest line in, open a wishlist at /de-DE/wishlist, /ja-JP/, /ar-SA/, check the toolbar, Filter / Sort panels, chips, tooltips and Export menu are translated and nothing looks cut off; also a store page for the hearts | Medium | Not started | Reload the extension, switch xbox.com to each language; long languages (de, fi, ru) may need wider buttons |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-55 | Native review of the translations (all 42 are first-pass; most worth checking: ar, he, ja, ko, zh-Hans, zh-Hant, th, ka, mt, is, sq, mk) | Medium | Todo | Hand each file to a native speaker (shared/i18n/<code>.json, 163 short texts, check.js shows coverage); fix in place, keep placeholders like {n} |

Backlog beyond the tables above (5 more): F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.14 - T-57: right-to-left support (mirrored toolbar and panels, logical CSS, LTR sliders, bidi isolation, harness direction check); 46/46 plus Hebrew pass
- 2026-10-05: v1.5.26278.13 - manifest line for the language files (HITL-approved); RTL investigated; harness not re-run (manifest-only change)
- 2026-10-05: v1.5.26278.12 - T-26: all UI text localised (163 keys, 42 language catalogues, tools/i18n/check.js, harness language checks); manifest line awaits approval; T-52/53/54 confirmed live
- 2026-10-05: v1.5.26278.10 - T-54 (merge on Load details, ownership kept, one price, stability check); data-model doc and diagram; Un-Purchasable stays tile-based (tested)
- 2026-10-05: v1.5.26278.9 - Load details label shortened; item data audit written up (T-54 proposed); 46/46 harness PASS
