# Document #5 — Master Prompt
> *Your secret weapon — paste this at the start of any new chat*

---

## Project Overview

I am continuing work on **Xbox Wishlist Enhanced** — a Tampermonkey userscript that injects advanced filtering and sorting UI into `xbox.com/*/wishlist`.

**Repo:** `C:\Dev\zellreid\_personal\XBOX\xbox-wishlist` (local) / `github.com/zellreid/xbox-wishlist`
**Current Version:** see [CHANGELOG.md](../CHANGELOG.md) for the current version
**Files:**
- `xbox-wishlist.user.js` — main userscript, vanilla JS
- CSS is injected via `@resource CSSFilter` (no separate `.user.css` file on disk — see `docs/02-SYSTEM-DESIGN.md`)

> **Note:** This document predates `AGENTS.md`, which is now the primary,
> authoritative agent-context file for this repo (guardrails, HITL matrix,
> skills). Use this file only for the userscript-specific quick-reference
> tables below; defer to `AGENTS.md` for anything about process or the
> browser extension.

---

## Strict Instructions

1. **Always read the files first** before making any changes — use Desktop Commander `read_file` on both `.user.js` and `.user.css`
2. **Never guess file contents** — always verify line numbers before using `edit_block` or `str_replace`
3. **All documentation must be `.md` files** — never create `.docx` for dev docs
4. **Versioning:** bump the `@version` field using `major.minor.YYDDD.revision` format after every meaningful change
5. **One feature at a time** — complete, test, then move to next
6. **Show a plan first** — outline exactly what you'll change before touching any file
7. **Resilient selectors only** — always use `[class*="PartialName"]` pattern, never exact class names that Xbox might change
8. **Xbox design language** — all injected UI must match dark theme: `#107C10` green accents, `rgba(245,245,245,x)` text, `Segoe UI` font
9. **Preserve existing behaviour** — no regressions; if touching a working feature, re-test it in the plan
10. **Persistence via GM_setValue** — use `CONFIG.storage.*` keys for all stored state

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Script delivery | Tampermonkey `.user.js` |
| Language | Vanilla JavaScript ES2020+ |
| Styling | Injected CSS via `.user.css` + `GM_addStyle` |
| Sliders | Native HTML5 dual-range inputs (custom-styled, no external slider library) |
| Icons | SVG resources via `GM_getResourceURL` |
| Persistence | `GM_getValue` / `GM_setValue` under a single key, `CONFIG.storage.key` |
| Environment | Chrome + Tampermonkey on Windows (MSI-2025, user: zellr) |

---

## Code Style Guidelines

- `const CONFIG = { ... }` — single source of truth at top of file for all IDs, selectors, keys
- Functions named in camelCase: `buildFilterPanel()`, `applyFilters()`, `collectItemData()`
- DOM IDs prefixed with `ifc_` (injected filter container)
- CSS classes prefixed with `ifc-`
- Comments on every major function block
- No jQuery, no React, no build step — pure browser JS
- `async/await` for any async operations (e.g. `GM_getResourceURL`)
- Error handling with `try/catch` around DOM queries that may fail

---

## Current Known Issues / In Progress

See `docs/04-FEATURE-BREAKDOWN.md` for the live backlog. F-15 through F-17
(accordion polish, dynamic price slider max, public wishlist support) shipped
in v1.4 — current pending work starts at F-18 (Clear All Filters).

---

## Output Format

- All code changes delivered as `str_replace` / `edit_block` diffs against the actual file
- Bump version string in `@version` header with every commit-worthy change
- After changes: confirm new version, lines changed, and a one-line summary of what was done
- Documentation changes go in `docs/*.md` files in the repo

---

## Session Start Checklist

Before writing a single line of code, confirm:

- [ ] Read current `xbox-wishlist.user.js` (Desktop Commander)
- [ ] Read current `xbox-wishlist.user.css` (Desktop Commander)
- [ ] Confirm current version from `@version` header
- [ ] Identify which feature from `04-FEATURE-BREAKDOWN.md` we're targeting
- [ ] Show plan → get approval → execute

---

## Quick Reference — Key Selectors

```js
buttonsArea:   '[class*="WishlistPage-module__wishlistMenuButton"]'
wishlistItem:  '[class*="WishlistItem-module__"]'
itemTitle:     '[class*="ProductCard-module__title"]'
itemPrice:     '[class*="Price-module__"]'
itemPublisher: '[class*="ProductCard-module__developerName"]'
```

## Quick Reference — Storage

```js
CONFIG.storage.key  // 'ifc_xbox_wishlist' — single JSON blob holding
                     // filter state, sort criteria, and UI prefs
```

Future features that need new persisted structures (flagged items, price
history, saved presets — see F-23/F-25/F-27 in `04-FEATURE-BREAKDOWN.md`)
should extend this JSON blob rather than introduce new top-level keys,
unless there's a size/perf reason to split them out.

---

> **This decides:** Random code ❌ OR Production-ready output ✅
