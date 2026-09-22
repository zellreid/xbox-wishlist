# Document #6 — Testing

There is no automated test suite for this project (see
[AGENTS.md](../AGENTS.md) §2.2 — no framework currently configured, and
`/skill-tdd` in [SKILL.md](../SKILL.md) halts on this until one is selected
via HITL approval). Until that changes, verification is manual. This
checklist is the canonical one — run it before merging any change to either
channel, and extend it when a bug fix warrants a new regression check.

## Userscript — manual QA checklist

Setup: install the script in Tampermonkey pointed at your local
`xbox-wishlist.user.js`, then navigate to your own Xbox wishlist.

- [ ] Script loads with no console errors on `xbox.com/en-ZA/wishlist`
      (and at least one other locale, if the change touches locale-sensitive
      parsing — e.g. price formatting)
- [ ] Filter panel opens, Sort panel opens, and the two are mutually
      exclusive (opening one closes the other)
- [ ] Owned / Not Owned / Un-Purchasable filters — verify inverted logic
      (nothing selected = all items shown)
- [ ] Publisher filter — search, multi-select, and verify OR-within-group
      behavior
- [ ] Price range slider — drag both handles, verify max derives from the
      actual wishlist (not a hard-coded ceiling)
- [ ] Discount range slider — same, 0–100%
- [ ] Active filter tags appear for each active filter and remove correctly
      on click
- [ ] Sort — add up to 3 levels, toggle asc/desc per level, verify DOM
      re-orders correctly and levels apply in priority order
- [ ] Accordion sections expand/collapse with correct chevron icon swap
- [ ] Filter/sort state persists across a page refresh
- [ ] Public/shared wishlist URL — buttons inject via the fallback
      container (no native `wishlistMenuButton` present)
- [ ] Dark mode — visually check contrast and Xbox-green accents

## Browser extension — manual QA checklist

Setup: `chrome://extensions` → enable Developer mode → Load unpacked →
`browser-extension/src/`.

- [ ] Extension loads with no errors on the extension management page
- [ ] Extension icon appears in the toolbar
- [ ] Click icon → popup opens, no CSP console warnings
- [ ] Popup quick-filter buttons (Owned, Discounted, Cheap) apply on click
- [ ] "Remember filters" toggle persists across a reload
- [ ] Content script UI (filter/sort panels) behaves identically to the
      userscript checklist above — run the full list against the extension
      too when validating parity work
- [ ] No errors in the service worker console
      (`chrome://extensions` → extension details → "service worker" link)
- [ ] Re-test in Edge, not just Chrome (both are co-primary targets per
      AGENTS.md §2.2)

## Regression scope

When fixing a bug, re-run the checklist sections adjacent to what changed —
e.g. a sort-related fix should re-verify all sort rows plus persistence, not
just the one broken case. When porting a userscript feature to the
extension (or vice versa), run both checklists and note any behavioral
difference in [CHANGELOG.md](../CHANGELOG.md).

## Future

Introducing an automated test framework (Vitest is the front-runner — see
`SKILL.md`'s `/skill-tdd`) requires HITL approval per AGENTS.md §2.7,
Trigger #2, since it also implies a build step. Tracked as part of Epic 6
(Build/Quality Infrastructure) in the project backlog.
