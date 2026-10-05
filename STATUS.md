---
project: Xbox Wishlist
label: Personal
phase: Live
priority: Medium
next_milestone: Live check T-46 chip and agree T-50 phase 2a; T-06 Chrome / Tampermonkey
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
- v1.5.26278.3: T-46 install size chip in code (chip appears once Load details / refresh has cached the size); 46/46 harness PASS. Not yet seen live.
- T-50 phase 1 audit done (findings in the T-50 row): Xbox exposes ~700 --gds-* design tokens on body[data-theme], so tokens, not hashed classes, are the safer route.
- v1.5.26278.2: panels 320px wide; filter-section / filter-groups / filter-list / filter-text-heading renamed to ifc-*; 46/46 harness PASS.
- v1.5.26278.1: T-47 done in code - every layout size in styles.css is on the 4px grid (strokes and the checkbox tick left as is); 46/46 harness PASS. Not yet seen live in Edge.
- T-42 done (both files deleted). T-47 and the 320px panels confirmed live in Edge.

## Blocked
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-32 | Save the remaining wishlist mocks: owned-heavy, empty, tiny, partial, shared, signed-out | Medium | Blocked | Capture into mock_examples/_inbox/, run file-mocks.js --prepare |
| T-48 | 40px toolbar: move the "Viewing X of Y" label into the Filter panel header | Low | Blocked | Your call: keep the two-row 64px bar, or move the label and go to one 40px row |
| T-28 | Confirm the Serbian Cyrillic locale code (sr-Cyrl-RS assumed) | Low | Blocked | Likely IP-gated; recapture over a Serbian VPN endpoint |

## Testing
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-46 | Live check the install size chip | Low | Not started | Reload the extension, open a wishlist, click Load details, look for a "94 GB"-style chip after the badges on each item; hover for the tooltip; items without a size show none |
| T-06 | Live check in Chrome and the Tampermonkey userscript (Edge done) | Low | Not started | Repeat the Edge checks in Chrome and Tampermonkey |

## TODO
| ID | Item | Priority | Status | Next action |
|---|---|---|---|---|
| T-50 | Use Xbox's own styling in place of our custom styles | Medium | In Progress | Phase 1 audit DONE: bundle has Button / Icon / Price / CustomAccordion / SelectionDropdown / Picker / Tabs / Alert / FiltersPanel / SortAndFilters classes but no checkbox or range slider; ~700 --gds-* tokens (colours, type ramp, button heights, radii, focus ring) sit on body[data-theme]. Phase 2a (your OK needed): point our --ifc-* theme tokens at var(--gds-*, current value) so colours follow Xbox with our values as fallback. Phase 2b: buttons via resolveClass(). Confirm dark tokens live first (my harness read of dark came back empty) |
| T-38 | Hearts on store-page edition cards (EditionCard, not ProductCard) | Low | Todo | Add the edition card prefix and its link pattern to updateCardHearts |
| T-26 | Localise our own UI labels (Owned, Not Owned, quick filters) | Low | Todo | Assume labels follow the page language; keep stored filter values as stable keys |

+ 5 more: F-28 to F-30 in docs/01-PRD.md, Ubisoft+ / gift price ideas in docs/08-XBOX-REQUESTS.md section 9, and Firefox/Safari support (planned in AGENTS.md)

## Recent sessions
- 2026-10-05: v1.5.26278.3 - T-46 install size chip; T-50 phase 1 audit (gds tokens found); T-48 explained; 46/46 harness PASS
- 2026-10-05: T-42, T-47 confirmed; T-50 (use Xbox classes over custom styles) added after a feasibility discussion; no code change
- 2026-10-05: v1.5.26278.2 - panels 320px; unprefixed classes renamed to ifc-*; 46/46 harness PASS
- 2026-10-05: v1.5.26278.1 - T-47 layout sizes in styles.css on the 4px grid; T-42 HAR confirmed deleted; 46/46 harness PASS
- 2026-10-05: T-43, T-44, T-49 confirmed live; handover written (docs/HANDOFF-DOCUMENT.md rewritten for v1.5); licensing / selling question answered (MIT today; Microsoft unlikely buyer); no code change
