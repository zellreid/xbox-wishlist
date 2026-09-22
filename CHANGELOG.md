# Changelog

Canonical version history for both distribution channels — the userscript
(`xbox-wishlist.user.js`, primary/live channel) and the browser extension
(`browser-extension/`, secondary/unpublished channel). Versions are cross-
referenced where the two overlap; see [AGENTS.md](AGENTS.md) §2.1 for the
current parity gap between them.

Userscript versioning: `major.minor.YYDDD.revision` (`YYDDD` = 2-digit year +
day-of-year). The extension currently versions independently (semver-ish),
tracked as tech debt in [docs/04-FEATURE-BREAKDOWN.md](docs/04-FEATURE-BREAKDOWN.md).

---

## Userscript

### v1.4.26057.1 (Feb 2026) — current
- Housekeeping revision on top of v1.4.26056.5 (resource/version bump).

### v1.4.26056.5 (Feb 2026)
- Public/shared wishlist support — injects a fallback button container when
  the native `wishlistMenuButton` container is absent (F-17).
- Expand/collapse chevron icon toggle fix on accordion sections.
- Price slider max now derives from the loaded wishlist's actual prices
  instead of a hard-coded ceiling (F-16).
- Checkbox colors reverted to white, scrollbar to Xbox green.
- "BUY AS A GIFT" button detection added for public wishlists.

### v1.3 (Jan 2026)
- Multi-level sort — up to 3 criteria, each with independent asc/desc (F-08, F-09).
- Resilient CSS module class resolution via `resolveClass()` (F-11).
- SVG icon resources for filter/sort/expand/collapse, loaded via `@resource`.
- Accordion-based collapsible filter groups (F-13, F-14).

### v1.2 (Nov 2025)
- Select2 multi-select dropdowns for publisher filtering.
- Active filter tag bar with one-click removal (F-06).
- Inverted filter logic — no selection in a group shows all (F-07).
- Price and discount range dual-handle sliders (F-04, F-05).

### v1.1 (Nov 2025)
- Publisher filtering added.

### v1.0 (Nov 2025)
- Initial release: price precision fixes, discount badges injected on items.

---

## Browser Extension

### v1.4.0 (May 2026) — unpublished, not yet at userscript parity
Initial port of the v1.4 userscript to a Chrome/Edge Manifest V3 extension.

- Ported core filtering/sorting logic from the userscript into `content.js`,
  swapping Tampermonkey `GM_*` APIs for Chrome extension APIs
  (`chrome.storage`, `chrome.runtime.getURL`).
- Added `popup.html`/`popup.js` — quick filter presets (Owned, Discounted,
  Cheap) and a "remember filters" toggle, not present in the userscript.
- Added `background.js` service worker for popup ↔ content-script messaging.
- Generated toolbar icon set (16/48/128/192px, Xbox green with white X mark).
- Fixed CSP violation: replaced inline `onclick` handlers in `popup.html`
  with `data-filter` attributes + `addEventListener` in `popup.js` (MV3
  blocks inline event handlers).
- Removed the deprecated `webRequest` permission from `manifest.json` (not
  valid in Manifest V3).
- **Known gap:** this port predates the userscript's F-16/F-17 work (dynamic
  price slider max, public wishlist support) — not yet ported. See
  [AGENTS.md](AGENTS.md) §2.1, ISSUE-001 also tracked there (storage split
  between `chrome.storage.sync` in `popup.js` and `chrome.storage.local` in
  `content.js`).
- Not yet submitted to the Chrome Web Store — sideload only
  (`chrome://extensions` → Load unpacked → `browser-extension/src`).

---

## Unreleased / In Progress

- Repo documentation audit: consolidated redundant status docs, corrected
  stale local-path references, added `CONTRIBUTING.md`, `SECURITY.md`, and
  `docs/06-TESTING.md`.
