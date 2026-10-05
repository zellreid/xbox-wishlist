---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check T-50 phase 2b; T-06 Chrome / Tampermonkey
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
- v1.5.26278.6: T-50 phase 2b in code - Clear All, quick-filter pills (Save, saved filters, Load details), Sort toggle / remove / add and Export items wear Xbox's own button classes via styleAsXboxButton() (basic ifc-btn-plain look if the classes can't be found); 46/46 harness PASS, dark and light checked in the harness. Not yet seen live.
- T-51, T-50 phase 2a and T-46 confirmed live. T-48 closed (keep the two-row 64px toolbar).

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-50 | Live check phase 2b: Filter panel (Clear All, pills grey / green when active, armed red, "is not" outline, Save and saved filters), Sort panel (green toggle, grey remove, Add Sort Level), Export menu; both themes | Medium | Not started | Reload the extension, open Filter / Sort / Export, toggle the theme, click through each; say if the 4px pills, grey remove button or 12px pill text should change |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 5 more: F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.6 - T-50 phase 2b (Xbox button classes on panel buttons); T-51, T-50 2a, T-46 confirmed live; 46/46 harness PASS
- 2026-10-05: v1.5.26278.5 - T-51 heart now Xbox's own icon; T-48 closed (keep 64px toolbar); 46/46 harness PASS
- 2026-10-05: v1.5.26278.4 - T-50 phase 2a (Xbox --gds-* tokens, --ifc-brand); size chip after the flag; heart question answered; 46/46 harness PASS
- 2026-10-05: v1.5.26278.3 - T-46 install size chip; T-50 phase 1 audit (gds tokens found); T-48 explained; 46/46 harness PASS
- 2026-10-05: T-42, T-47 confirmed; T-50 (use Xbox classes over custom styles) added after a feasibility discussion; no code change
