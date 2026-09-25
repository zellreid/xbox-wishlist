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
| Repo | `C:\Dev\zellreid\_personal\XBOX\xbox-wishlist` / `github.com/zellreid/xbox-wishlist` |

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

### ✅ Implemented (v1.5.26268.8 - Current)

| ID | Feature | Version Introduced |
|----|---------|-------------------|
| F-01 | Injected button bar (Filter, Sort) into Xbox action area | v1.2 |
| F-02 | Filter panel — Owned / Not Owned / Un-Purchasable checkboxes (with counts since v1.5.26268.6) | v1.2 |
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
| F-17 | Public wishlist button injection (fallback container) | v1.5 |
| F-18 | Clear All Filters button | v1.5 |
| F-31 | Wishlist text search (matches title and publisher) | v1.5 |
| F-16 | Price slider max derived from actual item prices | v1.5 |
| F-19 | Quick filter presets (toggle, active state) | v1.5 |
| F-15 | Accordion header styling (superseded by single-row Xbox-style header) | v1.5 |
| F-20 | Publisher typeahead search (also on Genres since v1.5.26266.18) | v1.5 |
| F-21 | Filtered result count (met by the existing "Viewing X of Y results" label) | v1.5 |
| F-22 | Active sort indicator dot on the sort button (and on the filter button while filters apply, since v1.5.26268.7) | v1.5 |
| F-25 | Flag games with a star: highlight, "Flagged" quick filter and sort, export column | v1.5 |
| F-26 | Price change since the last visit (7-day badge) and "on sale since" date, stored per game id | v1.5 |
| F-23 | Save/load named filter presets | v1.5 |
| F-24 | Export the visible (filtered, sorted) items as CSV or JSON | v1.5 |
| F-32 | Refresh button (v1: persist state + reload) | v1.5 |
| F-33 | Product data: rating / release date / deal-ends sorts, Genres filter, "In a pass" quick filter, deal-end badges | v1.5 |
| F-34 | "Just for you" / pre-order pills and quick filters, Platforms filter, deal type | v1.5 |
| F-36 | Capabilities filter + X\|S / Smart Delivery / Play Anywhere chips via opt-in "Load details" (cached 7 days); per-item refresh | v1.5 |
| F-37 | Type filter (Game / DLC / Consumable) + DLC chip | v1.5 |
| F-40 | Add-ons for games: "Add-ons (N)" chip-link to the store's add-ons list, "Has add-ons" quick filter, count via Load details / per-item refresh | v1.5 |
| F-39 | Light / dark toggle for the whole page (saved), with themed extension UI (T-19) | v1.5 |

### ⚠️ In Progress / Partially Done

| ID | Feature | Issue | Target |
|----|---------|-------|--------|
| - | None | - | - |

### ❌ Planned — Not Yet Started

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| F-27 | Price history tracking | 🟢 Future | Store price snapshots over time in `GM_setValue` |
| F-28 | Deal alerts / notifications | 🟢 Future | Browser notification when a flagged item drops in price |
| F-29 | Comparison mode | 🟢 Future | Select 2–3 games and compare side-by-side |
| F-30 | Wishlist statistics dashboard | 🟢 Future | Analytics panel: total value, % on sale, avg discount, etc. |

---

## Golden Rule

> A clear PRD = **70% of the work already done.**
> Never start coding without confirming this document reflects the current intent.
