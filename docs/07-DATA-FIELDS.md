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

Verified against the mocks in `mock_examples/wishlist` (2 captures) and `mock_examples/products` (KINGDOM HEARTS Collection) on 2026-09-23.

---

## Available from the Wishlist Page (no extra requests)

| Field | Source | Used today | Notes |
|---|---|---|---|
| Title, publisher, image, store URL, product id | DOM | Yes | Product id links DOM items to the embedded state |
| Current price, original price, discount % / amount | DOM | Yes | Shown price, including member prices the viewer sees |
| Owned | State (`core2.products.entitlements[id].data.isOwned`) | No - still read from the DOM text "Owned" (T-29) | Language-free. Matched the DOM exactly on the 4 mocks that have an owned game (1 owned item each) |
| Un-purchasable | DOM | Yes | No price shown (price is null), no language involved |
| Available through your pass | State (`entitlements[id].data`: `isOwned: false`, `isSatisfyingEntitlement: true`, `satisfyingProductId` = the pass, `endDate`, `status`, `isTrial`, `autoRenew`) | No | 24 of 310 on the mocks, by 4 different passes; the wishlist's own `actions` reads `BuyToOwn` for these (`Buy` for normal, `View` for owned and unpurchasable). Pass ids match `includedWithPassesProductIds`. Not the same as "In a pass", which is any pass |
| Date added to the wishlist | State (`core2.wishlist.wishlists[0].products[].addedDate`) | No | All 310 items, 2018 to 2026, language-free. Enables a Date added sort and "added recently" filter. The wishlist name in the same object is personal - never store it |
| Currency code and locale | State (a price's `currency`, `appContext.marketInfo.locale`) | Yes (T-25): price range and formatting | `ZAR`, `en-ZA`. Identifies the currency without reading symbols |
| Member-price badges ("with Game Pass", "with EA Play") | DOM | Yes (Subscriptions filter) | |
| Average rating, rating count | State | Yes (F-33 sort, export) | 0 ratings = unrated |
| Genres (categories) | State | Yes (F-33 filter, export) | 16 genres on the mocks; items can have several |
| Release date | State | Yes (F-33 sort, export) | Missing for unannounced/unreleased titles |
| Included with a pass | State | Yes (F-33 "In a pass") | Pass ids only - names not in the data |
| Date added to a pass | State | No | Per pass |
| Deal end date | State | Yes (F-33 badge, sort, export) | Only meaningful on discounted offers; full-price offers carry far-future placeholders |
| Offer list price / MSRP | State | Stored (`data-ifc-state-price`, `-msrp`) | Numbers, no text parsing. Checked on the 2026-09-23 wishlist: MSRP equals the DOM original price on 252 of 252 items; the lowest list price equals the DOM price on 251 of 252. The exception has a second, eligibility-based offer (20% off) that the store does not show the viewer, so a state-based price must pick the offer the store displays, not the lowest |
| "Just for you" personal offer + reason | State | Yes (F-34 pill, quick filter, export) | Deal type `personal`; reason text ("Because of your loyalty to the franchise"), discount, end date |
| Deal type (personal / sale / member) | State | Yes (F-34 filter, export) | Only for discounts the page shows the viewer |
| Product kind (Game / DLC / Consumable) | State | Yes (Type filter, chip, export) | `Durable` = add-on / DLC, `Consumable` = in-game items |
| Member-price offer type + message | State | Deal type `member` only | Game Pass / PC Game Pass / EA Play |
| Pre-order | State | Yes (F-34 pill, quick filter, export) | Per edition (SKU) flag + future release date |
| Platforms | State | Yes (F-34 filter, export) | Xbox One, Xbox Series X\|S, PC, Handheld (multi) |
| Age rating | State | No | Board (e.g. PEGI), age text, icon URL, descriptors |
| Developer | State | No | |
| Short / full description | State | No | |
| Max install size | State | No | |
| Images, videos | State | No | |
| Has add-ons | State | Yes (F-40 "Add-ons" chip-link, "Has add-ons" quick filter, export) | `hasAddOns`, set on games only. Can be stale: some flagged games list none (count 0), so a loaded count of 0 overrides it |
| Add-ons count | Add-ons page (1 request per game) | Yes (F-40 chip "Add-ons (N)", export) | `core2.channels.channelData["BROWSE_CHANNELID=PRODUCTADDONS_<id>_FILTERS="].data.totalItems` on `/<locale>/games/browse/ProductAddOns_<id>`; fetched by "Load details" / the per-item refresh, cached with the capabilities (7 days) |
| Product kind / family | State | Kind: yes (F-37 Type filter); family: no | |
| Subscription badge codes | State - codes | Via DOM instead | Numeric codes 0-11 that the store turns into subscription logos (Game Pass tiers, EA Play, Ubisoft+, GTA+) - **not** capabilities (checked against 15 product pages). The Subscriptions filter already reads these logos from the DOM. |

---

## Needs the Product Page (one request per item)

| Field | Notes |
|---|---|
| **Capabilities (named)** | 24 seen across the `products` mocks: **Optimized for Xbox Series X\|S**, **Smart Delivery**, **Xbox Play Anywhere**, Xbox One X Enhanced, FPS Boost, 4K Ultra HD, 60 fps+, HDR10, Variable Refresh Rate, Dolby Atmos, Spatial Sound, Single player, online / local / cross-platform co-op and multiplayer, shared/split screen, cross-gen multiplayer, achievements, cloud saves, presence, PC Game Pad. Also not on the deals / browse-games pages. The product page's header tags (X\|S, Smart Delivery, Play Anywhere, cloud, X Enhanced) are driven by these. |
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
| Deal start date | Recorded ourselves since F-26: "first seen on sale" per game, exact only for sales that start after the game was first seen |
| Pass names for most pass ids | Only three ids name their type via member offers; the Subscriptions filter reads names from DOM badges |
| Reviews text | Product page state has an empty reviews section in the mocks - likely loaded separately |
| Vector icons for X\|S and Smart Delivery | The product page draws both as embedded PNG images of Microsoft branding - use text chips, don't bundle the logos. Pre-order, sale tag, Play Anywhere, new release, bundle and languages icons *are* Xbox SVG icons (see `shared/icons`; browse / export all of them with `tools/icons/catalogue.js`) |

---

## Guidance

- Prefer the wishlist page state: one free read covers every item. Everything in the "Available from the Wishlist Page" table marked State comes from that one read (about 2.4 MB; product summaries 1.5 MB, wishlist 33 KB, entitlements 7 KB), with no network.
- Ranked by value for effort, still unused: date added (sort, recently added), pass entitlement with end date ("playable now with my pass", "pass ends soon"), Owned from the state (T-29), developer, age rating, install size (sort or filter). Prices could also come from the state instead of parsing text, but only with the store's own offer choice (see the price row).
- Use the product page only for fields in the second table, loaded lazily, cached per product id and throttled - never for the whole list at once (hundreds of multi-MB requests).
- Capabilities cannot be derived from the wishlist page (its badge codes are subscription logos). They are loaded per item from the product page on request ("Load details", F-36), cached 7 days per product.
- The store app also has an internal bulk product lookup (many ids per request). It is a separate Xbox service; the app attaches the signed-in user's authorization when available but marks it **not required**. Not used yet: it is undocumented and can change without notice, its address isn't in the saved pages (resolved at runtime), a cross-origin call from the content script only works if that service allows the xbox.com origin (unverified), and whether its response includes capabilities is unverified. Reading or forwarding the user's token ourselves stays off-limits (TIER 1). See T-17 for the live check.
- `mock_examples/deals` and `games` embed the same kind of state (25 products each) but without capabilities, and the deals page carries no personal offers.
