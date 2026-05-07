# Document #1 — Product Requirement Document (PRD)
> *This tells AI **WHAT** to build*

---

## Problem Statement

The Xbox wishlist page (`xbox.com/*/wishlist`) provides no native filtering, sorting, or organisational tools beyond basic item display. Users with large wishlists (100–300+ items) have no way to filter by price range, discount, publisher, or ownership status, and cannot sort items by any meaningful criteria. This userscript injects a fully functional filter and sort UI directly into the Xbox wishlist page without modifying any Xbox source code.

---

## Target Users

- Xbox gamers maintaining large wishlists (50–300+ items)
- Deal hunters wanting to filter by discount percentage or price range
- Collectors tracking owned vs. not-owned items
- Users viewing shared/public wishlists via a link

---

## Tech Preferences

| Area | Choice |
|------|--------|
| Delivery | Tampermonkey userscript (`.user.js` + `.user.css`) |
| Language | Vanilla JavaScript (ES2020+), no frameworks |
| Styling | Injected CSS, Xbox design language (dark theme, green `#107C10` accents) |
| Icons | SVG resources via `GM_getResourceURL` |
| Persistence | `GM_setValue` / `GM_getValue` for user preferences |
| Versioning | `major.minor.YYDDD.revision` (e.g. `1.4.26056.5`) |
| Repo | `C:\Dev\zellreid\XBOX\xbox-wishlist` / `github.com/zellreid/xbox-wishlist` |

---

## User Flow (Step-by-Step Journey)

1. User navigates to `xbox.com/en-ZA/wishlist` (own) or a shared wishlist URL
2. Tampermonkey detects the URL match and injects the script
3. Script waits for the wishlist DOM to fully render
4. Injected button bar appears in the top-right action area
5. User clicks **Filter** → filter panel slides open from the right
6. User adjusts checkboxes, sliders, or publisher list → wishlist items filter in real time
7. User clicks **Sort** → sort panel opens in the same position (filter panel closes)
8. User selects sort field(s) and direction → wishlist re-orders in real time
9. Active filter tags appear at the top of the panel for quick removal
10. All selections persist across page refreshes via `GM_setValue`

---

## Feature List

### ✅ Implemented (v1.4.26056.5 — Current)

| ID | Feature | Version Introduced |
|----|---------|-------------------|
| F-01 | Injected button bar (Filter, Sort) into Xbox action area | v1.2 |
| F-02 | Filter panel — Owned / Not Owned / Un-Purchasable checkboxes | v1.2 |
| F-03 | Filter panel — Publishers multi-select accordion | v1.2 |
| F-04 | Filter panel — Price Range dual-handle slider | v1.2 |
| F-05 | Filter panel — Discount Range dual-handle slider | v1.2 |
| F-06 | Active filter tags with individual × removal | v1.2 |
| F-07 | Inverted filter logic (no selection = show all) | v1.2 |
| F-08 | Sort panel — multi-level sort (up to 3 criteria) | v1.3 |
| F-09 | Sort panel — per-level asc/desc toggle | v1.3 |
| F-10 | Sort/Filter containers share same position (mutually exclusive) | v1.3 |
| F-11 | Resilient CSS selectors (survives Xbox DOM updates) | v1.4 |
| F-12 | Xbox-themed styling (dark bg, green accents, Segoe UI) | v1.2+ |
| F-13 | Accordion sections for filter groups (expand/collapse) | v1.4 |
| F-14 | SVG icon alternation on accordion expand/collapse | v1.4 |

### ⚠️ In Progress / Partially Done

| ID | Feature | Issue | Target |
|----|---------|-------|--------|
| F-15 | Accordion label/title styling | Layout built, styling polish pending | v1.4.x |
| F-16 | Price slider dynamic max | Hard-coded at R3,000; should derive from actual item prices | v1.4.x |

### ❌ Planned — Not Yet Started

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| F-17 | Public wishlist button injection | 🔴 High | Shared URL has no `WishlistPage-module__wishlistMenuButton___` container — need fallback creation |
| F-18 | Clear All Filters button | 🔴 High | Single click to reset all active filters |
| F-19 | Quick filter presets | 🟡 Medium | One-click buttons: "On Sale", "Under R500", "Heavily Discounted (≥50%)", "Not Owned" |
| F-20 | Publisher typeahead search | 🟡 Medium | Text input at top of Publishers accordion to live-filter the list |
| F-21 | Filtered result count in panel header | 🟡 Medium | Show "Filters (245 / 298)" so user sees impact |
| F-22 | Active sort indicator badge | 🟡 Medium | Sort button shows green dot when non-default sort is active |
| F-23 | Save/load filter presets | 🟡 Medium | Persist named filter combos via `GM_setValue` |
| F-24 | Export wishlist data | 🟡 Medium | Download filtered list as CSV or JSON |
| F-25 | Highlight/flag items | 🟢 Nice | Star/flag per item, persisted, sortable |
| F-26 | Last seen price annotation | 🟢 Nice | Show price delta on each item since last visit |
| F-27 | Price history tracking | 🟢 Future | Store price snapshots over time in `GM_setValue` |
| F-28 | Deal alerts / notifications | 🟢 Future | Browser notification when a flagged item drops in price |
| F-29 | Comparison mode | 🟢 Future | Select 2–3 games and compare side-by-side |
| F-30 | Wishlist statistics dashboard | 🟢 Future | Analytics panel: total value, % on sale, avg discount, etc. |

---

## Golden Rule

> A clear PRD = **70% of the work already done.**
> Never start coding without confirming this document reflects the current intent.
