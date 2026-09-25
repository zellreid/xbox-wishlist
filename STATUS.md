---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Confirm T-19 + F-39 live (v1.5.26267.10); then F-40 DLC indicator
target_date: none
hard_deadline: false
blockers: []
backlog: docs/04-FEATURE-BREAKDOWN.md
updated: 2026-09-24
---

# STATUS - Xbox Wishlist

> Maintained per root AGENTS.md Section 1.9. Read by the daily pipeline report.
> Never put credentials, keys, connection strings or secrets in this file.

## Now
- Live at v1.5.26267.10 (active toolbar buttons follow Xbox's own: white/dark icon on dark, green/white on light). Site header confirmed correct in both modes in live screenshots. Theme switch no longer touches the site header component's theme setting (it rebuilt itself and broke its menu layout); header colours now go through its CSS override hooks, values read from Xbox's stylesheets. It also swaps the header logos (per-theme images read from the page) and loads Xbox's colours live (scripts and stylesheets are in different folders on its asset host); toolbar icons all in the Xbox style. F-39 theme switch fixed after live feedback: the site header is switched too (it was white on white), and Xbox's own colour sheet for the other theme is loaded at runtime so BUY/DETAILS and toolbar buttons keep their colours (F-39b resolved without copying Xbox CSS). Needs the live check.
- Fixed: duplicate toolbar buttons when the page already holds a set (saved capture, or extension + userscript both installed). The harness now cleans captures saved with the extension running (?keepCapture keeps them).
- T-17 closed (v1.5.26266.26): store pages stay; Load details uses a 1 s gap with back-off.
- T-21 done (v1.5.26267.2): stale hard-coded Xbox class names and unused select2 CSS removed; computed styles identical before and after in light and dark.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-19 | Light mode styling fix (+ F-39 theme switch, toolbar icons) | High | In Progress | Live check on xbox.com with the Theme button: header, BUY buttons, toolbar icons, our panels and chips in both modes |
| F-40 | DLC for wishlist games: has-DLC chip, add-ons link, DLC count | Medium | Todo | Build the free part (flag + link) first; count via add-ons page, cached |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json (there since the first commit) | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |

+ 6 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (E-06, T-02, F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-24: Active toolbar button mirrors Xbox's active wishlist menu button per theme (v1.5.26267.10); header confirmed live in both modes; mock harness PASS on all 5 mocks
- 2026-09-24: F-39 live feedback 3 (v1.5.26267.9): header menu layout broke on switch (component rebuilds on its theme attribute); now colours via --uhf-header-*-override read through a hidden probe frame, logos by image; harness both directions + saved-theme load + watcher; PASS on all 5 mocks
- 2026-09-24: F-39 live feedback 2 (v1.5.26267.8): header logo images swapped per theme from the page's stored header markup; colour-sheet finder now looks across the asset host (static/js vs static/css); verified with a stand-in asset host in both directions + saved-theme load; mock harness PASS on all 5 mocks
- 2026-09-24: Export fold overflow fixed and export/filter aligned to the 16 px pixel grid (v1.5.26267.7); rasterised check: no ink outside the intended box; mock harness PASS on all 5 mocks
- 2026-09-24: Filter and Sort icons redrawn in the Xbox icon format, export fitted (v1.5.26267.6); sort.svg lacked a viewBox (rendered too big and cropped); all toolbar icons measured equal to Xbox's; mock harness PASS on all 5 mocks
