# Xbox Wishlist UserScript

[![License](https://img.shields.io/github/license/zellreid/xbox-wishlist)](https://github.com/zellreid/xbox-wishlist/blob/main/LICENSE)
[![Other](https://img.shields.io/badge/dynamic/json?style=social&label=Greasy%20Fork&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2F%2Fen%2Fscripts%2F446563-halo-5-guardians-requisitions.json&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3ggEBCQHM3fXsAAAAVdJREFUOMudkz2qwkAUhc/goBaGJBgUtBCZyj0ILkpwAW7Bws4yO3AHLiCtEFD8KVREkoiFxZzX5A2KGfN4F04zMN+ce+5c4LMUgDmANYBnrnV+plBSi+FwyHq9TgA2LQpvCiEiABwMBtzv95RSfoNEHy8DYBzHrNVqVEr9BWKcqNFoxF6vx3a7zc1mYyC73a4MogBg7vs+z+czO50OW60Wt9stK5UKp9Mpj8cjq9WqDTBHnjAdxzGQZrPJw+HA31oulzbAWgLoA0CWZVBKIY5jzGYzdLtdE9DlcrFNrY98zobqOA6TJKHW2jg4nU5sNBpFDp6mhVe5rsvVasUwDHm9Xqm15u12o+/7Hy0gD8KatOd5vN/v1FozTVN6nkchxFuI6hsAAIMg4OPxMJCXdtTbR7JJCMEgCJhlGUlyPB4XfumozInrupxMJpRSRtZlKoNYl+m/6/wDuWAjtPfsQuwAAAAASUVORK5CYII=)](https://greasyfork.org/en/scripts/446563-halo-5-guardians-requisitions)

A Tampermonkey/Greasemonkey userscript that adds advanced filtering and sorting to the Xbox Wishlist page.

## Features

**Filtering**
- Owned status filter - filter by Owned, Not Owned, or Un-Purchasable (inverted logic: none selected = show all)
- Publisher filter - multi-select with search, dynamically populated from your wishlist
- Price range slider - dual-handle slider with auto-detected min/max (up to R 3,000)
- Discount range slider - filter by discount percentage
- Active filter tags - visual tag bar showing all active filters with one-click removal

**Sorting**
- Multi-level sort - up to 3 criteria: Name, Publisher, Price, Discount %, Discount Amount
- Ascending/descending toggle per criterion
- Add/remove sort levels dynamically

**UI Enhancements**
- Collapsible accordion panels for filter groups with expand/collapse icons
- Xbox-native button styling using resilient CSS module class resolution
- Discount badges injected on wishlist items
- Custom Xbox green scrollbar and checkbox styling
- Dark mode support

**Compatibility**
- Resilient selectors - dynamically resolves Xbox's hashed CSS module class names so the script survives site rebuilds
- Public/shared wishlist support - detects when native menu is absent and injects its own button container
- Works on `xbox.com/*/wishlist` and shared wishlist URLs

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome/Edge) or [Greasemonkey](https://www.greasespot.net/) (Firefox)
2. Install the userscript from [Greasy Fork](https://greasyfork.org/en/scripts/446563) or create a new script and paste the contents of `xbox-wishlist.user.js`
3. The CSS is loaded automatically via `@resource` - no manual CSS installation needed
4. Navigate to your [Xbox Wishlist](https://www.xbox.com/en-ZA/wishlist) and the Filter/Sort buttons will appear

## Usage

### Filtering
Click the **Filter** button to open the filter panel:
- **Owned**: Select ownership states to filter (none selected = show all)
- **Publishers**: Search and select publishers (supports multi-select)
- **Price Range**: Drag slider handles to set min/max price
- **Discount Range**: Drag slider handles to set min/max discount percentage

Active filters appear as removable tags at the top of the panel.

### Sorting
Click the **Sort** button to open the sort panel:
- Select a field and toggle ascending or descending
- Click **+ Add Sort Level** for multi-level sorting (up to 3 levels)
- Remove secondary/tertiary sort levels with the remove button

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.4.26056.5 | Feb 2026 | Public wishlist support, expand/collapse icon fix, slider max R 3000, checkbox/scrollbar styling |
| 1.3 | Jan 2026 | Multi-level sorting, resilient selectors, SVG icon resources, accordion UI |
| 1.2 | Nov 2025 | Advanced filtering suite: price/discount sliders, filter tags, inverted logic |
| 1.1 | Nov 2025 | Publisher filtering |
| 1.0 | Nov 2025 | Initial release: price precision, discount badges |

## Technical Notes

- **Resilient Selectors**: Xbox uses CSS modules with hashed class names (e.g. `WishlistPage-module__itemContainer___Ab12c`). The script resolves these at runtime using stable prefixes, so it doesn't break when Xbox rebuilds their site.
- **Version Format**: `MAJOR.MINOR.YYDDD.REVISION` where `YYDDD` is the 2-digit year + day-of-year.
- **Xbox Theme Colors**: Green `#107c10`, Yellow `#ffd800` (discount badges).
- **Dependencies**: jQuery 3.6.0 and Select2 4.0.13 (auto-loaded by the script).

## Issues

If you find a bug, please [report it](https://github.com/zellreid/xbox-wishlist/issues). Include:
- Script version
- Browser and userscript manager
- Steps to reproduce
- Console errors (if any)

## Contributing

This script is open source. Check the [Issues](https://github.com/zellreid/xbox-wishlist/issues) page for open items tagged "Accepted". Fork, branch, fix, and submit a pull request.

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.
