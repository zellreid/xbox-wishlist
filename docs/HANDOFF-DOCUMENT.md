# Project Handoff Document - Xbox Wishlist v1.4

## Current Status

**Date:** February 26, 2026
**Version:** 1.4.26056.5
**Status:** Production - filtering, sorting, public wishlist support

---

## Architecture Overview

### File Structure
```
C:\Dev\zellreid\xbox-wishlist\
├── xbox-wishlist.user.js    # Main userscript (1041 lines)
├── xbox-wishlist.user.css   # Stylesheet (751 lines, loaded via @resource)
├── filter.svg               # Filter button icon
├── sort.svg                 # Sort button icon
├── expand.svg               # Accordion expand chevron
├── collapse.svg             # Accordion collapse chevron
├── README.md                # Project overview
├── HANDOFF-DOCUMENT.md      # This file
├── LICENSE                  # MIT License
└── *.md                     # Legacy v1.2 docs (kept for history)
```

### Resilient Selector System
Xbox uses CSS modules with hashed class names that change on every rebuild (e.g. `WishlistPage-module__itemContainer___Ab12c`). The script resolves these at runtime:

```javascript
const PREFIXES = {
    itemContainer: 'WishlistPage-module__itemContainer',
    menuContainer: 'WishlistPage-module__menuContainer',
    imageContainer: 'WishlistPage-module__imageContainer',
    productDetails: 'WishlistPage-module__productDetails',
    // ... more prefixes
};

function resolveClass(prefix) {
    // Scans document.styleSheets for any class starting with prefix
    // Caches result for subsequent lookups
}
```

### State Structure (v1.4)
```javascript
state = {
    info: { script: { version, name, description } },
    containers: [],       // All wishlist item containers
    cache: { elements: Map(), classes: Map() },
    ui: {
        floatButtons, lblFilter, btnFilter, btnSort,
        divFilter, divSort, divFilterShow, divSortShow
    },
    filters: {
        totalCount, filteredCount, activeTags: [],
        owned:     { selected: [], options: ['Owned','Not Owned','Un-Purchasable'] },
        publishers: { selected: [], list: Map() },
        priceRange:    { min, max, currentMin, currentMax, enabled },
        discountRange: { min, max, currentMin, currentMax, enabled }
    },
    sort: {
        criteria: [{ field, order, label }],  // Up to 3 levels
        fields: [
            { value: 'ifcId', label: 'Default' },
            { value: 'ifcName', label: 'Name' },
            { value: 'ifcPublisher', label: 'Publisher' },
            { value: 'ifcPrice', label: 'Price' },
            { value: 'ifcPriceDiscountPercent', label: 'Discount %' },
            { value: 'ifcPriceDiscountAmount', label: 'Discount Amount' }
        ]
    }
};
```

---

## Key Functions Reference

| Function | Purpose |
|----------|---------|
| `resolveClass(prefix)` | Finds hashed CSS module class from stable prefix |
| `floatButtons()` | Injects Filter/Sort buttons (handles public wishlists) |
| `createFilterBlock(id, text, collapsible)` | Creates accordion or static filter group |
| `addFilterContainerOwned()` | Owned checkbox filter |
| `addFilterContainerPublishers()` | Publisher multi-select filter |
| `addPriceRangeFilter()` | Dual-handle price slider |
| `addDiscountRangeFilter()` | Dual-handle discount slider |
| `shouldShowContainer(container)` | Master filter logic (inverted: none = all) |
| `toggleContainers()` | Applies all filters, updates counts/tags |
| `renderSortCriteria()` | Renders multi-level sort UI |
| `applySorting()` | DOM reorder based on sort criteria |
| `loadSVGIntoContainer()` | Loads SVG icons from GM resources |
| `setContainerData()` | Reads prices/publishers/ownership into data attributes |

---

## Version History

### v1.4.26056.5 (Feb 2026)
- Public/shared wishlist support (injected button container)
- Expand/collapse chevron icon toggle fix
- Price slider max always reaches R 3,000
- Checkbox colors reverted to white, scrollbar to green
- BUY AS A GIFT button detection for public wishlists

### v1.3 (Jan 2026)
- Multi-level sort (up to 3 criteria)
- Resilient CSS module class resolution
- SVG icon resources (filter, sort, expand, collapse)
- Accordion-based collapsible filter groups

### v1.2 (Nov 2025)
- Select2 multi-select dropdowns
- Active filter tag display with one-click removal
- Inverted filter logic (none selected = show all)
- Price and discount range sliders

### v1.1 (Nov 2025) - Publisher filtering
### v1.0 (Nov 2025) - Price precision, discount badges

---

## Design Principles

1. **Match Xbox native styling** - buttons, fonts, colors blend seamlessly
2. **Inverted filter logic** - none selected = show all (industry standard)
3. **Resilient selectors** - survives Xbox site rebuilds
4. **Real-time feedback** - instant filtering and sorting
5. **Minimal dependencies** - jQuery + Select2, auto-loaded
6. **Dark mode support** - both themes work correctly

## Xbox Theme Colors
- Green: `#107c10` (primary accent, scrollbar, tags)
- Yellow: `#ffd800` (discount badges)
- Background: `#1a1a1a` / `#262626` (dark theme)
- Text: `#f5f5f5` / `#ffffff`

## Technical Stack
- Vanilla JavaScript (ES6+), HTML5 range inputs, CSS3
- jQuery 3.6.0 (for Select2), Select2 4.0.13
- Tampermonkey GM APIs: `GM_getResourceURL`, `GM_getValue`, `GM_setValue`
- SVG icons loaded via `@resource` declarations

## How to Continue Development

**Local dev path:** `C:\Dev\zellreid\xbox-wishlist` (accessible via Desktop Commander)
**Repository:** https://github.com/zellreid/xbox-wishlist
**GitHub raw URLs:**
- JS: `https://github.com/zellreid/xbox-wishlist/raw/refs/heads/main/xbox-wishlist.user.js`
- CSS: `https://github.com/zellreid/xbox-wishlist/raw/refs/heads/main/xbox-wishlist.user.css`
**Target site:** https://www.xbox.com/*/wishlist
**Xbox browse reference:** https://www.xbox.com/en-ZA/games/browse?noSplash=1

Provide Claude with:
- The GitHub raw URLs or local path for JS and CSS
- This handoff document for context
- Describe the feature or fix needed

---

*Last updated: February 26, 2026 - v1.4.26056.5*
