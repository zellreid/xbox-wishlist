# Document #3 — UI/UX Wireframes
> *AI needs visual clarity*

---

## Design Language

| Token | Value |
|-------|-------|
| Background | `#1a1a2e` (dark navy, Xbox dark theme) |
| Accent / Primary | `#107C10` (Xbox green) |
| Text Primary | `rgba(245,245,245,1.0)` |
| Text Secondary | `rgba(245,245,245,0.7)` |
| Border | `rgba(117,117,117,0.3)` |
| Font | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` |
| Scrollbar | Green thumb `#107C10`, dark track |
| Checkboxes | White border, green checked state |
| Slider | Green range fill, white handles |
| Border Radius | `4px` panels, `2px` buttons |

---

## Screen 1 — Own Wishlist (Default State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Xbox Wishlist                          Viewing 298 of 298 results  [🖊][⚙][🗑][▼][✎] │
│                                                                             │
│  ┌────────────────────────────────────────────────────────┐                 │
│  │ 🖼  Nice Day for Fishing — Epic Edition      R212,50  [BUY]             │
│  │     Team17                              ████ -50%                       │
│  ├────────────────────────────────────────────────────────┤                 │
│  │ 🖼  SCARLET NEXUS Pre-Order Bundle          R89,00   [BUY]              │
│  │     BANDAI NAMCO Entertainment                                           │
│  └────────────────────────────────────────────────────────┘                 │
│  ...                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

Top-right injected button bar:
  [🔍 Filter]  [↕ Sort]  (existing Xbox icons preserved)

Position: appended after WishlistPage-module__wishlistMenuButton container
```

---

## Screen 2 — Filter Panel (Open)

```
┌──────────────────────────────────────────┐  ┌─────────────────────┐
│  Xbox Wishlist items (scrollable)        │  │  Filters            │
│                                          │  │  ┌──────────────┐   │
│  ...                                     │  │  │ Not Owned  × │   │  ← active tag
│                                          │  │  └──────────────┘   │
│                                          │  │                     │
│                                          │  │  Owned          ∧   │  ← expanded
│                                          │  │  ─────────────────  │
│                                          │  │  ☐ Owned            │
│                                          │  │  ☑ Not Owned        │
│                                          │  │  ☐ Un-Purchasable   │
│                                          │  │                     │
│                                          │  │  Publishers     ∨   │  ← collapsed
│                                          │  │                     │
│                                          │  │  Price Range        │
│                                          │  │  R 0.00 — R 3,000   │
│                                          │  │  ●━━━━━━━━━━━━━━━●  │
│                                          │  │                     │
│                                          │  │  Discount Range     │
│                                          │  │  0% — 100%          │
│                                          │  │  ●━━━━━━━━━━━━━━━●  │
│                                          │  │                     │
│                                          │  │  [Clear All]        │  ← F-18
└──────────────────────────────────────────┘  └─────────────────────┘

Panel: fixed position, right edge, top: 155px
Width: ~280px
Scrollable if content overflows
```

---

## Screen 3 — Sort Panel (Open)

```
                                            ┌─────────────────────┐
                                            │  Sort               │
                                            │                     │
                                            │  Sort by            │
                                            │  [Default (ID) ▼] [↑↓] │
                                            │                     │
                                            │  Then by            │
                                            │  [Price      ▼] [↑↓] │
                                            │  [+ Add level]      │
                                            │                     │
                                            │  Then by            │
                                            │  [Discount   ▼] [↑↓] │
                                            │  [× Remove]         │
                                            └─────────────────────┘

Sort panel opens at SAME position as filter panel.
Only one panel open at a time.
Sort button shows green dot badge when non-default sort active (F-22).
```

---

## Screen 4 — Publishers Accordion (Expanded with Typeahead — F-20)

```
│  Publishers     ∧   │
│  ─────────────────  │
│  [🔍 Search...   ]  │  ← typeahead input (F-20)
│  ☑ BANDAI NAMCO     │
│  ☐ Capcom           │
│  ☐ Maximum Ent.     │
│  ☑ SEGA             │
│  ☐ Square Enix      │
│  ... (scrollable)   │
│  (12 publishers)    │  ← count badge (F-21)
```

---

## Screen 5 — Quick Filter Presets Bar (F-19)

```
┌──────────────────────────────────────────────────────────┐
│  [On Sale]  [Under R500]  [≥50% Off]  [Not Owned]  [+]  │
└──────────────────────────────────────────────────────────┘

Position: horizontal bar above or below the injected button bar
Style: pill-shaped green-outlined buttons, filled when active
```

---

## Screen 6 — Public / Shared Wishlist (F-17)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Xbox wishlist                                                       │
│  (No edit/delete buttons — public view)                              │
│                                                                      │
│                              [🔍 Filter]  [↕ Sort]  ← injected     │
│                              (fallback container created by script)  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐            │
│  │ 🖼  Nice Day for Fishing     R212,50    [BUY AS GIFT]│            │
│  └──────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screen 7 — Flagged Items & Price Annotation (F-25, F-26)

```
│ 🖼  TMNT: Splintered Fate — Gold   ★  R169,75  ▼ was R679,00  -75%  [BUY] │
│     Super Evil Megacorp                         📅 Last seen: R679 (7d ago) │
```

- `★` = flagged/starred by user (click to toggle, stored in `GM_setValue`)
- `▼ was R679,00` = price annotation from stored history
- `📅 Last seen` tooltip on hover

---

## Key Design Rules

1. **Never break Xbox's own layout** — all injected elements are `position: fixed` or appended, not inserted mid-flow
2. **Panel is scrollable** — filter panel must scroll internally for large publisher lists
3. **Accordion chevron alternates** — ∧ when open, ∨ when closed (SVG swap)
4. **Active state is always visible** — filter tags, sort badge, preset pill fill
5. **Checkbox colours** — white border, white tick, green background when checked
6. **Scrollbar** — custom green thumb throughout filter/sort panels

---

> **Insight:** Better UI clarity = **less rework later**
