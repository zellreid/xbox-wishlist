# Xbox.com Requests and Page Data - Reference

What xbox.com loads on the page types this project runs on, what each request is for, its payload,
and what we use (or could use). Written from a browser capture (HAR) taken 2026-09-29 in the en-ZA
market while visiting: wishlist, a store page (reached from a microsoft.com store link), games,
all games / browse, the sales page, the add-ons list, and adding + removing one wishlist item.

**Capture notes**
- The HAR was an Edge "sanitized" export: request headers had no `Authorization` or cookies, and
  response bodies were empty - so this lists **requests, not responses**. Response shapes below come
  from the page data of the saved mocks (`mock_examples/`), which is the same data server-rendered.
- A sanitized export still keeps **request bodies** - including the Microsoft sign-in token sent to
  `xsts.auth.xboxlive.com`. Treat any HAR as a credential and delete it after use.
- No personal values here: account ids, gamertag, device ids and tokens are shown as `{xuid}`,
  `{gamertag}`, `{deviceId}`, `<token>`. Product ids are public catalogue ids.
- Security tiers (AGENTS.md 2.6): endpoint paths are TIER 2 - fine in this repo, generalise them in
  prompts to outside tools. Tokens / account data are TIER 1 - never used by this project.

---

## 1. Page documents (server-rendered HTML + page data)

Every xbox.com page arrives as HTML with the app's state embedded (`__PRELOADED_STATE__`). That
embedded state is our main data source - no extra requests, no sign-in token needed (the server
already rendered it for the signed-in viewer).

| Request | Purpose | Notes |
|---|---|---|
| `GET www.xbox.com/{locale}/wishlist` | Wishlist page | ~3.2 MB. Full wishlist state: products, SKUs, prices, **entitlements for wishlist items**, added dates. Also fetched by us: the T-34 resync and the card hearts (F-38b/F-35b). |
| `GET www.xbox.com/{locale}/games/store/{slug}/{productId}` | Store (product) page | ~1 MB. That game's full detail, its editions, and **its entitlements** (owned / in pass). Used by "Load details" and the per-item refresh. |
| `GET www.xbox.com/{locale}/games` | Games hub | ~0.7 MB. Rows of cards; no entitlements. |
| `GET www.xbox.com/{locale}/games/browse` | Browse all games | ~0.5 MB; first page of cards server-rendered, the rest via `browse` (section 3). |
| `GET www.xbox.com/{locale}/promotions/sales/sales-and-specials` | Sales page | ~0.5 MB; cards come from the `DynamicChannel.GameDeals` browse channel. |
| `GET www.xbox.com/games/all-games` -> 307 -> `/{locale}/games/browse` | Locale-less link | Redirects to the viewer's locale. |
| `GET www.microsoft.com/{locale}/store/p/{slug}/{productId}` -> 302 -> `xbox.com/.../games/store/...` -> 301 -> `www.xbox.com/...` | Old Microsoft Store link | Ends on the xbox.com store page. |

### Page data slices (from the wishlist page state)
- `appContext` (market, locale, language), `user`, `theme`, `experiments`, `uhf` (site header), `content`, `cookies`
- `core2`: `products` (below), `wishlist` (wishlists, default id, `products[] { productId, skuId, addedDate, actions }`),
  `cart`, `channels`, `install`, `userSettings`, `bundleBuilder`, `bnplConfig`, `planPicker`, `search`
- `core2.products`: `productSummaries`, `skuSummaries`, `availabilitySummaries`, `entitlements`,
  `productActions`, `ratingsAndReviews`, `additionalInformation`, `productInfoMetadata`

### Product summary fields (307 on the capture's wishlist)
| Field | Meaning | Used by us |
|---|---|---|
| `productId`, `title`, `publisherName`, `developerName` | Identity | title/publisher yes; developer **no** |
| `productKind` | Game / Durable (DLC) / Consumable | yes (Type filter) |
| `categories` | Genres | yes (Genres filter) |
| `availableOn` | XboxOne / XboxSeriesX / PC / Handheld | yes (Platforms) |
| `averageRating`, `ratingCount` | Star rating | yes |
| `releaseDate` | Release date | yes |
| `specificPrices` | purchaseable / giftable offers: price, msrp, discount, `eligibilityInfo` (sale / member / personal), end dates | yes (prices, deal type, deal ends) |
| `includedWithPassesProductIds` | Passes that include it now | yes ("In a pass") |
| `passMetadataByPassProductId` | Per pass: `entryDateUTC`, `exitDateUTC` - when it joined / leaves each pass (past stints are listed too) | **no** |
| `optimalSatisfyingPassId` | Best pass for this game | **no** |
| `hasAddOns` | Has DLC | yes |
| `contentRating` | Age rating board, rating, descriptors, image | **no** |
| `maxInstallSize` | Install size in bytes | **no** |
| `badges`, `hhVerified` | Store badges; likely "handheld verified" (31 of 307 set) | badges partly; hhVerified **no** |
| `shortDescription`, `description`, `images`, `videos`, `cmsVideos` | Marketing text and media | **no** |
| `productFamily`, `preferredSkuId`, `optimalSkuId` | Family / default edition | **no** |
| `isAvailableOnGarrison` | Likely cloud gaming (xCloud) availability - unconfirmed | **no** |
| `hasUbisoftCrossEntitlementProduct` | Ubisoft+ cross-entitlement | **no** |

SKU summaries: `skuId`, `skuTitle`, `skuDescription`, `isPreorder` (used), `isGamesWithGoldSku`, images.

### Entitlements (`core2.products.entitlements`)
Per product: `{ productId, skuId, isOwned, isSatisfyingEntitlement, satisfyingProductId, status,
endDate, autoRenew, isTrial }`.
- `isOwned: true` - bought (endDate far future). Used for the Owned filter.
- `isOwned: false, isSatisfyingEntitlement: true, satisfyingProductId: <pass id>` - covered by a pass the
  viewer holds; `endDate` = the pass's current term, `autoRenew` = it renews. Used for **In my pass** (T-31).
- Only present for **the products on that page**: the wishlist's own items (24 of 307 in the capture -
  the ones owned or covered by a pass), or a store page's game and editions. Browse / deals / add-on
  pages carry none.

---

## 2. Wishlist

| Request | Purpose | Payload |
|---|---|---|
| `PUT emerald.xboxservices.com/xboxcomfd/wishlist/default/product/{productId}/{skuId}?locale=&deviceType=desktop` | Add to wishlist (store page heart) | No body. 200 JSON (~82 B). |
| `DELETE` same path | Remove from wishlist | No body. 200, empty. |
| `OPTIONS` same path | CORS preflight | - |

Watched (not called) by `request-watcher.js` (T-34/T-35). Needs the sign-in token - we never call it.

## 3. Browse lists: games, deals, add-ons, "load more"

| Request | Purpose | Payload |
|---|---|---|
| `POST emerald.xboxservices.com/xboxcomfd/browse?locale={locale}` | One page (~25) of cards for a channel | JSON body, below |

```json
{ "ChannelId": "DynamicChannel.GameDeals",
  "ChannelKeyToBeUsedInResponse": "BROWSE_CHANNELID=DYNAMICCHANNEL.GAMEDEALS_FILTERS=",
  "Filters": "e30=",
  "ReturnFilters": true }
```
- `ChannelId`: `DynamicChannel.GameDeals` (sales / deals), `ProductAddOns_{PRODUCTID}` (a game's DLC -
  also requested by the store page for its add-ons row), browse-all channels on `/games/browse`.
- `Filters`: base64 JSON of the chosen filters (`e30=` = `{}` - none chosen in the capture).
- `ReturnFilters`: true on the first page (also returns the filter options), false after.
- **"Load more"**: the next pages add `EncodedCT` - base64 JSON
  `{ HasMore, SkipCount, TotalCount, PreviousPageProductIds[] }` (e.g. skip 26 of 708 deals).
- The response (not in the HAR) feeds the cards and their product summaries.
- Sign-in token: sent when available (personal prices), likely not required - untested.

## 4. Search

| Request | Purpose | Payload |
|---|---|---|
| `GET www.microsoft.com/msstoreapiprod/api/autosuggest?market=en-za&sources=xSearch-Products,Microsoft-Terms&counts=5,5&query=dead+or&clientId={id}` | Search box suggestions, per keystroke | Query only. `feature=zerostate&site={page url}` when the box opens empty. ~4 KB JSON. |

(No full search results page was captured.)

## 5. Store page extras

| Request | Purpose | Payload |
|---|---|---|
| `GET emerald.xboxservices.com/xboxcomfd/productActions/{productId}?locale=` | The viewer's actions for the game (Buy / Play / Install / Owned) | Query only. **Per user - needs the sign-in token.** ~750 B. |
| `GET emerald.xboxservices.com/xboxcomfd/ratingsandreviews/summaryandreviews/{productId}?locale=&orderBy=MostHelpful&itemCount=5&starFilter=NoFilter` | Rating summary + top reviews | Query only. ~2.4 KB. |
| `GET emerald.xboxservices.com/xboxcomfd/ratingsandreviews/userreview/{productId}?locale=` | The viewer's own review | Per user. Empty when none. |
| `POST emerald.xboxservices.com/xboxcomfd/browse` with `ProductAddOns_{ID}` | Add-ons row | See section 3. |
| `GET accounts.xboxlive.com/family/memberXuid({xuid})` | Family group (child accounts, purchase approval) | Per user, token. ~120 KB. |
| `GET emerald.xboxservices.com/xboxcomfd/cart/vector` | Cart state | Per user. |

## 6. Catalogue (public)

| Request | Purpose | Payload |
|---|---|---|
| `GET displaycatalog.mp.microsoft.com/v7.0/products?bigIds={id,id,...}&market=ZA&languages=en-za&MS-CV={trace}` | Bulk product details (up to ~20 ids), public catalogue | Query only, no sign-in. ~600 KB for 5 ids. Seen on the games hub. We removed our permission for this host (T-20); same-origin store pages are used instead. |

## 7. Identity and site plumbing (not useful to us)

| Request | Purpose |
|---|---|
| `POST xsts.auth.xboxlive.com/xsts/authorize` | Exchanges the Microsoft sign-in token for an Xbox Live token. **Body carries the sign-in token (TIER 1).** |
| `GET peoplehub-public.xboxlive.com/people/gt({gamertag})` | Header profile (gamertag, picture) |
| `GET images-eds-ssl.xboxlive.com/image` | Gamer picture |
| `GET emerald.xboxservices.com/xboxcomfd/cmscontent?dataId=...&market=&language=` | Site content snippets (payment options, cookie lists) |
| `GET emerald.xboxservices.com/xboxcomfd/experimentation?deviceId=&clientIp=&platform=&appVersion=&env=prod&locale=` | A/B experiment flags (sends device id and IP) |
| `GET emerald.xboxservices.com/xboxcomfd/settings/thirdPartyDataSharingConsent` | Consent setting |
| `GET consent.config.office.com/consentcheckin/v2.0/consents` | Cookie consent |
| `GET www.microsoft.com/store/buy/cartcount`, `.../XboxComMsComCartMuidSync.html`, `.../XboxComMsCom3PAdsOptOutCookieSync.html` | Cart count and cookie sync frames |
| `GET www.xbox.com/{locale}/global-shares/templates/MWF/JS/osg_ratings.json` | Age-rating reference data (~2.3 MB) |
| `GET www.xbox.com/{locale}/games/shared-files/js/xcat-bi-urls2.json` | Catalogue link map |
| `GET store-images.s-microsoft.com/image/...`, `assets-xbxweb.xbox.com/...` | Box art and the site's own scripts/styles |
| `browser.events.data.microsoft.com`, `dc.services.visualstudio.com`, `sentry.io` | Telemetry and error reporting |

---

## 8. Entitlements as a list (T-40)

- **The wishlist page is the list** we can read: `core2.products.entitlements` covers every wishlist item
  the viewer owns or has through a pass. That's what Owned and In my pass use.
- **A game's store page** carries entitlements for that game and its editions.
- **No list endpoint without the token:** `productActions` is per product and per user (token); the
  Xbox "collections" / library services are token-only and on other hosts. Out of bounds (TIER 1).
- So an "owned" tick on browse/deals cards would need either one store page per card (heavy) or
  remembering ownership from store pages the viewer opens anyway (stores owned ids locally -
  needs a SECURITY.md change). Skipped for now.

## 9. Data we could still use

From data already on the wishlist page (no new requests, no new permissions):

| Idea | Source field | Effort |
|---|---|---|
| **Leaving Game Pass soon** filter + "Leaves 1 Oct" chip | `passMetadataByPassProductId[pass].exitDateUTC` | Small |
| **New to Game Pass** (joined in the last 30 days) | `...entryDateUTC` | Small |
| Cloud playable (xCloud) filter / chip - confirm the field first | `isAvailableOnGarrison` | Small |
| Handheld-verified filter | `hhVerified` | Small |
| Install size column + sort ("smallest first") | `maxInstallSize` | Small |
| Age rating filter / column (PEGI, FPB, ESRB...) | `contentRating.boardName` + rating | Small |
| Developer filter / column | `developerName` | Small |
| Ubisoft+ included | `hasUbisoftCrossEntitlementProduct` | Small |
| Giftable price / "can gift" | `specificPrices.giftable` | Medium |
| Edition name in the list / export | `skuSummaries[].skuTitle` | Small |
| Browse/deals: deal end date on cards | `specificPrices` in those pages' state | Medium (needs card chips there) |
| Browse/deals: "load more" awareness | `EncodedCT` paging (TotalCount) | Medium |
