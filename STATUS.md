---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check of light mode (T-19, v1.5.26267.1); then F-40 DLC indicator
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
- Live at v1.5.26267.2. T-19 light mode built: theme tokens in styles.css (dark set = previous values, light set from Xbox's body data-theme="light"), white icons on active toolbar buttons; needs a live check in light and dark.
- Fixed: duplicate toolbar buttons when the page already holds a set (saved capture, or extension + userscript both installed). The harness now cleans captures saved with the extension running (?keepCapture keeps them).
- T-17 closed (v1.5.26266.26): store pages stay; Load details uses a 1 s gap with back-off.
- T-21 done (v1.5.26267.2): stale hard-coded Xbox class names and unused select2 CSS removed; computed styles identical before and after in light and dark.

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-19 | Light mode styling fix | High | In Progress | Live check on xbox.com in light and dark mode (panels, chips, export menu, active buttons) |
| F-40 | DLC for wishlist games: has-DLC chip, add-ons link, DLC count | Medium | Todo | Build the free part (flag + link) first; count via add-ons page, cached |
| F-39 | Light / dark mode toggle button | Medium | Todo | Decide scope: override our UI only vs switch the whole page; builds on T-19 |
| F-38 | Run on product pages (diagnostics first) | Medium | Todo | HITL: approve manifest/@match change for /games/store/*; DOA6 product mock as fixture |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Todo | Push the new icons, then repeat the Edge checks in Chrome and Tampermonkey |
| F-35 | Deals / games browse page support | Low | Todo | Same state kind as wishlist (no capabilities); decide scope, needs manifest change (HITL) |
| T-20 | Remove the unused public-catalogue host permission from manifest.json (there since the first commit) | Low | Todo | HITL: approve the manifest change, then check Load details and refresh still work |
| F-25 | Highlight / flag items | Low | Todo | Star toggle per item, persisted via the storage adapter, "Flagged first" sort |
| F-26 | Last seen price annotation (+ deal "first seen" date) | Low | Todo | Store per-item price and first-seen deal date by product id |
| F-27 | Price history tracking | Low | Todo | Extend F-26 to a dated history with 90-day pruning |

+ 6 more in docs/04-FEATURE-BREAKDOWN.md and docs/01-PRD.md (E-06, T-02, F-28 to F-30, Firefox/Safari support)

## Recent sessions
- 2026-09-24: T-21 (v1.5.26267.2): removed 7 stale hashed Xbox class names from the panels, 2 hashed-class CSS rules and the unused select2 CSS; 0 computed-style differences (32,614 properties each) on light and dark mocks; mock harness PASS on all 3 mocks
- 2026-09-24: T-19 light mode (v1.5.26267.1): theme tokens (dark unchanged, verified), white icons on active buttons, duplicate-toolbar fix, harness cleans captures saved with the extension (?keepCapture); mock harness PASS on all 3 mocks, light mock screenshots checked
- 2026-09-23: T-17 closed (v1.5.26266.26): kept store pages, removed the diagnostic, Load details gap 2 s -> 1 s with back-off to 8 s on errors/slow answers; mock harness PASS on all 3 mocks, back-off verified with a failure/success/429 shim
- 2026-09-23: T-17 v3 live report analysed: per-game service usable without login but not faster; catalogue fast but lacks FPS Boost; POST route exists. Recommended keeping store pages and removing the diagnostic; no code changed (harness not run, no version bump)
- 2026-09-23: T-17 v2 live run analysed (refused only for the MS-CV tracing header); diagnostic v3 (v1.5.26266.25) adds MS-CV, a POST guess and a public catalogue probe; mock harness PASS on all 3 mocks, v3 tested against a stand-in (catalogue complete / missing a capability; POST blocked; no auth header sent). Digital Unite fit assessed.
