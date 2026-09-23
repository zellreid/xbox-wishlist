# Document #7 - Item Data Fields: Wishlist Page vs Product Page
> *What we can know about a wishlist item, and what it costs to get it*

---

## Sources

| Source | Cost | How the core reads it |
|---|---|---|
| **Wishlist page DOM** | Free - already rendered | `setContainerData()` scrapes each item via resolved class names |
| **Wishlist page embedded state** | Free - already in the page (~2.4 MB JSON in an inline script) | `loadProductData()` (F-33), once on start, ~20 ms, no network |
| **Product page embedded state** | One request per item (multi-MB page each) | `fetchPageState(url)` exists; not called per item yet |

The embedded state is Xbox's own app data. It is personal to the signed-in viewer (member prices, "Just for you" offers, ownership), so it is read live and never stored beyond the filter/sort/preset settings.

Verified against the mocks in `mock_examples/#wishlist` (2 captures) and `mock_examples/#products` (KINGDOM HEARTS Collection) on 2026-09-23.

---

## Available from the Wishlist Page (no extra requests)

| Field | Source | Used today | Notes |
|---|---|---|---|
| Title, publisher, image, store URL, product id | DOM | Yes | Product id links DOM items to the embedded state |
| Current price, original price, discount % / amount | DOM | Yes | Shown price, including member prices the viewer sees |
| Owned / Un-purchasable | DOM | Yes | |
| Member-price badges ("with Game Pass", "with EA Play") | DOM | Yes (Subscriptions filter) | |
| Average rating, rating count | State | Yes (F-33 sort, export) | 0 ratings = unrated |
| Genres (categories) | State | Yes (F-33 filter, export) | 16 genres on the mocks; items can have several |
| Release date | State | Yes (F-33 sort, export) | Missing for unannounced/unreleased titles |
| Included with a pass | State | Yes (F-33 "In a pass") | Pass ids only - names not in the data |
| Date added to a pass | State | No | Per pass |
| Deal end date | State | Yes (F-33 badge, sort, export) | Only meaningful on discounted offers; full-price offers carry far-future placeholders |
| Offer list price / MSRP | State | Stored (`data-ifc-state-price`, `-msrp`) | For a future in-place price update (F-26) |
| "Just for you" personal offer + reason | State | No (F-34) | Offer type, reason text ("Because of your loyalty to the franchise"), discount, end date |
| Member-price offer type + message | State | No | Game Pass / PC Game Pass / EA Play |
| Pre-order | State | No (F-34) | Per edition (SKU) flag + future release date |
| Platforms | State | No (F-34) | Xbox One, Xbox Series X\|S, PC, Handheld (multi) |
| Age rating | State | No | Board (e.g. PEGI), age text, icon URL, descriptors |
| Developer | State | No | |
| Short / full description | State | No | |
| Max install size | State | No | |
| Images, videos | State | No | |
| Has add-ons, product kind / family | State | No | |
| Feature badges | State - **codes only** | No (F-34) | Numeric codes 0-11; names are only on the product page (see below) |

---

## Needs the Product Page (one request per item)

| Field | Notes |
|---|---|
| **Capabilities (named)** | e.g. 4K Ultra HD, 60 fps+, Single player, PC Game Pad, **Optimized for Xbox Series X\|S**, **Smart Delivery**, **Xbox Play Anywhere** - the names behind the wishlist page's badge codes |
| Bundle contents | Product ids included in a bundle |
| Editions | Other editions of the product |
| Supported languages | |
| System requirements | PC titles |
| Legal notices | |
| Additional information | Installation terms, permissions, privacy link, publisher website / support contact, in-app purchase flags |

---

## Not Available Anywhere Seen

| Field | Alternative |
|---|---|
| Deal start date | Record "first seen on sale" ourselves (F-26 price history) |
| Pass names for most pass ids | Only three ids name their type via member offers; the Subscriptions filter reads names from DOM badges |
| Reviews text | Product page state has an empty reviews section in the mocks - likely loaded separately |
| Icons for X\|S / Smart Delivery / Play Anywhere / pre-order / sale badges | Expected in the product page's code - extract from the `#products` mocks (F-34) |

---

## Guidance

- Prefer the wishlist page state: one free read covers every item.
- Use the product page only for fields in the second table, loaded lazily, cached per product id and throttled - never for the whole list at once (hundreds of multi-MB requests).
- The badge codes on the wishlist page can likely be mapped to capability names once, by comparing the `#products` mocks with the same products' wishlist entries; if that mapping is stable, most "feature" indicators need no product page request at all.
- `mock_examples/#deals` and `#games` have not been examined yet; if they embed the same state, the same reader could drive filters on those pages.
