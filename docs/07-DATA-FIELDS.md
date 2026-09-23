# Document #7 - Item Data Fields: Wishlist Page vs Product Page
> *What we can know about a wishlist item, and what it costs to get it*

---

## Sources

| Source | Cost | How the core reads it |
|---|---|---|
| **Wishlist page DOM** | Free - already rendered | `setContainerData()` scrapes each item via resolved class names |
| **Wishlist page embedded state** | Free - already in the page (~2.4 MB JSON in an inline script) | `loadProductData()` (F-33), once on start, ~20 ms, no network |
| **Product page embedded state** | One request per item (multi-MB page each) | `loadDetails()` (F-36): opt-in, sequential, cached 7 days per product |

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
| "Just for you" personal offer + reason | State | Yes (F-34 pill, quick filter, export) | Deal type `personal`; reason text ("Because of your loyalty to the franchise"), discount, end date |
| Deal type (personal / sale / member) | State | Yes (F-34 filter, export) | Only for discounts the page shows the viewer |
| Member-price offer type + message | State | Deal type `member` only | Game Pass / PC Game Pass / EA Play |
| Pre-order | State | Yes (F-34 pill, quick filter, export) | Per edition (SKU) flag + future release date |
| Platforms | State | Yes (F-34 filter, export) | Xbox One, Xbox Series X\|S, PC, Handheld (multi) |
| Age rating | State | No | Board (e.g. PEGI), age text, icon URL, descriptors |
| Developer | State | No | |
| Short / full description | State | No | |
| Max install size | State | No | |
| Images, videos | State | No | |
| Has add-ons, product kind / family | State | No | |
| Subscription badge codes | State - codes | Via DOM instead | Numeric codes 0-11 that the store turns into subscription logos (Game Pass tiers, EA Play, Ubisoft+, GTA+) - **not** capabilities (checked against 15 product pages). The Subscriptions filter already reads these logos from the DOM. |

---

## Needs the Product Page (one request per item)

| Field | Notes |
|---|---|
| **Capabilities (named)** | 24 seen across the `#products` mocks: **Optimized for Xbox Series X\|S**, **Smart Delivery**, **Xbox Play Anywhere**, Xbox One X Enhanced, FPS Boost, 4K Ultra HD, 60 fps+, HDR10, Variable Refresh Rate, Dolby Atmos, Spatial Sound, Single player, online / local / cross-platform co-op and multiplayer, shared/split screen, cross-gen multiplayer, achievements, cloud saves, presence, PC Game Pad. Also not on the deals / browse-games pages. The product page's header tags (X\|S, Smart Delivery, Play Anywhere, cloud, X Enhanced) are driven by these. |
| Accessibility features | Counted by the product page's accessibility tag |
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
| Vector icons for X\|S and Smart Delivery | The product page draws both as embedded PNG images of Microsoft branding - use text chips, don't bundle the logos. Pre-order, sale tag, Play Anywhere, new release, bundle and languages icons *are* Xbox SVG icons (see `shared/icons`; browse / export all of them with `tools/icons/catalogue.js`) |

---

## Guidance

- Prefer the wishlist page state: one free read covers every item.
- Use the product page only for fields in the second table, loaded lazily, cached per product id and throttled - never for the whole list at once (hundreds of multi-MB requests).
- Capabilities cannot be derived from the wishlist page (its badge codes are subscription logos). They are loaded per item from the product page on request ("Load details", F-36), cached 7 days per product.
- The store app also has an internal bulk product lookup (many ids per request), but it is a separate service that attaches the signed-in user's authorization - handling that token is off-limits (TIER 1) and would need a new host permission, so it is deliberately not used.
- `mock_examples/#deals` and `#games` embed the same kind of state (25 products each) but without capabilities, and the deals page carries no personal offers.
