# Mock test harness

Boots the real extension code (`browser-extension/src/shared/xbox-wishlist.core.js`
+ `browser-extension/src/content.js`) against a frozen, offline copy of a real
Xbox wishlist page, so a change can be sanity-checked without touching
xbox.com or waiting on the Chrome Web Store / Tampermonkey update cycle.

## How we do mocks (short version)

A mock is a saved copy of a real Xbox page, kept offline and frozen, so changes can be tested without xbox.com.

1. Open the page in Edge or Chrome (any market or language) and `Ctrl+S` -> **Webpage, Complete**.
2. Save it into `mock_examples/_inbox/` - under the browser's own name (`Game deals _ XBOX.html`) or your own. You get
   `<name>.html` plus a `<name>_files/` folder.
3. Run `node tools/mock-harness/file-mocks.js --prepare`. It works out what the page is from the address it was
   saved from, renames the file and its `_files` folder, fixes the links inside, moves both to the right
   `mock_examples/<type>/<market>/` folder and regenerates the harness pages. It never overwrites, and leaves
   anything it does not recognise in the inbox with the reason.
4. Start the server (`node tools/mock-harness/server.js`) and open the `.harness.html` page (see "Running it").
   The server also answers a real wishlist address (`/en-ZA/wishlist`) with that market's newest wishlist
   capture, which is what the core fetches for the card hearts on store/browse/deals pages.

`mock_examples/` is git-ignored (personal browsing data), so mocks live only on this machine.

### Naming convention

`mock_examples/<type>/<market>/<name>.html` and `<name>_files/`, where `<market>` is the lower-case locale from the
address (`en-za`, `en-us`, `sr-latn-rs`).

| Page | Address after `/<locale>/` | Folder | Name |
|---|---|---|---|
| Wishlist | `wishlist` | `wishlist` | `yyyyMMdd_HHmm` |
| Game deals | `games/browse/DynamicChannel.GameDeals` | `deals` | `yyyyMMdd_HHmm` |
| Browse all games | `games/browse` | `games` | `yyyyMMdd_HHmm` |
| Product | `games/store/<slug>/<id>` | `products` | `<id>_yyyyMMdd_HHmm_<slug>` |
| Add-ons for a game | `games/browse/ProductAddOns_<ID>` | `addons` | `<id>_yyyyMMdd_HHmm_<slug of the product>` |
| Change locale | `Shell/ChangeLocale` | `locale` | `yyyyMMdd_HHmm` |

- The date and time are when the page was saved (the file's created time, or modified time if that is earlier).
  Copying or editing a file changes those times, so file a capture straight after saving it.
- The product id is the 12-character id from the address, lower case. The slug is the address slug, at most 70 characters.
  An add-ons page takes the slug of the product page with the same id, if one is filed.
- A name that already follows the convention is kept as is, including a trailing tag such as `_Dark` or `_Light`
  (`20260924_1542_Dark`). To tag while filing, use `--tag Dark` (non-product pages).
- Files starting with an id are ordered by product, then time: every capture of one game sits together.

### `file-mocks.js`

```
node tools/mock-harness/file-mocks.js [--dry-run] [--prepare] [--tag <Tag>] [paths...]
```

No paths means everything in `mock_examples/_inbox/`. `--dry-run` shows what would happen. `--prepare` runs
`prepare-fixture.js` afterwards. Address shapes it does not know (for example a Game Pass page) are reported and left
alone: add a rule in `classify()` when a new kind of page needs mocks.

## Mock layout

`mock_examples/` (git-ignored - personal browsing data) is split by page type:

| Folder | Contents | Harness checks |
|---|---|---|
| `wishlist/<market>/` | Wishlist page captures, named `yyyyMMdd_HHmm` | Full: items, publishers, a real filter round trip |
| `deals/<market>/`, `games/<market>/` | Game deals and Browse all games pages, named `yyyyMMdd_HHmm` | Smoke |
| `products/<market>/` | Product pages, named `{product id}_{yyyyMMdd}_{HHmm}_{slug}` (e.g. `9nm79b7n9jm6_20260923_1313_street-fighter-6`) | Smoke |
| `addons/<market>/` | "Add-ons for this game" pages, same naming as products | Smoke |
| `locale/<market>/` | The change-locale page - source of `locales.json` (see below) | None |

`<market>` is the lower-case locale folder (`en-za`). The date and time are the capture's created time; the
slug is the product's address slug (max 70 characters). **Smoke** means the page freezes, the extension loads
and leaves it alone (the extension does not act on these pages yet: F-35, F-38), the embedded page state
reads, and its locale matches the folder.

## Locales

`locales.json` lists every language and region xbox.com offers (94 locales, 41 languages, 87 regions), built by
`node tools/mock-harness/extract-locales.js` from the newest capture under `mock_examples/locale/`. The page
gives country and language names, not codes, so codes come from the locale table in the page's own bundle;
14 names are mapped by hand in the script. `sr-Cyrl-RS` ("Srbija - Srpski") is assumed, not confirmed.

## Adding a new fixture by hand

Prefer `file-mocks.js` (above). By hand:

1. Save the capture into `mock_examples/<type>/<market>/` named as in the table above (this produces
   `<name>.html` + a `<name>_files/` folder; rename both and replace the folder name inside the .html if the browser
   used the page title).
2. Prepare it:
   ```
   node tools/mock-harness/prepare-fixture.js "mock_examples/wishlist/en-za/<name>.html"
   ```
   This strips the page's own `<script>` tags (otherwise the live React app
   re-hydrates on load, its API calls fail offline, and it wipes the saved
   item list back to an empty shell), links the extension's own
   `shared/styles.css` (the real extension gets this from `manifest.json`;
   the harness has no manifest, so it links it explicitly), and appends a
   small harness script that loads the real extension code against the
   frozen DOM and runs a few sanity checks (wishlist pages: item count, publisher
   collection, an actual filter interaction). Output goes to
   `mock_examples/wishlist/<market>/<name>.harness.html` - **next to** the raw capture, not a
   separate folder, because the saved page's own asset links are relative
   (`./<name>_files/...`) and only resolve if the fixture stays alongside
   its `_files` sibling. Git-ignored - regenerate any time from the raw
   capture.

   The argument can also be a directory - every `.html` capture under it is prepared (skipping
   `.harness.html` and `_files` folders): `mock_examples` for everything already filed,
   `mock_examples/wishlist` for one page type, and so on. With no argument at all, it defaults to
   `mock_examples/_inbox/` - the same place `file-mocks.js` looks, so running it there prepares
   whatever you just saved before filing (type and market come from the capture's own saved-from
   address in that case, via `classify-capture.js`, the same lookup `file-mocks.js` uses to name
   it - not from the folder, since it isn't filed yet). The fixture keeps Xbox's embedded
   page-state script (as inert `text/plain`) so the product-data reader works
   offline; every other script is stripped.

## Running it

```
node tools/mock-harness/server.js        # serves the repo at :8792
```

Then open `http://localhost:8792/mock_examples/wishlist/en-za/<name>.harness.html`.
A banner at the top of the page turns green ("HARNESS PASS") or red
("HARNESS FAIL") with details; the same summary is logged to the console as
`[HARNESS RESULT] {...}` for scripted checks.

The `chrome.storage` stand-in answers asynchronously (like the real one) and
keeps its data in `sessionStorage`. By default every load starts with an
empty store, so the sanity checks always see a clean slate.

**Details stability (T-54):** every wishlist run also fakes a store page for each item (as Load details would) and fails if any item's Un-Purchasable / owned / price changes ("details stability" line). Fixtures are generated, so after changing `prepare-fixture.js` run `node tools/mock-harness/prepare-fixture.js mock_examples`.

**Language (T-26):** every wishlist run also checks that the page's language file loaded and that no raw catalogue key shows in our UI ("language:" line). With `?locale=de-DE` the same fixture runs in German, `?locale=ja-JP` in Japanese, and so on - all 42 catalogues were run this way (add `?locale=sr-Cyrl-RS` or `zh-TW` for the script variants).

**Direction (T-57):** every wishlist run also reports "direction:" - the toolbar must sit on the inline-end side (right in a left-to-right page, left in a right-to-left one) and the price sliders must stay left to right. The `ar-sa` fixture is right to left; `?locale=he-IL` on it runs Hebrew.

**Testing another market:** add `?locale=xx-YY` (e.g. `?locale=en-US`, or `?realpath` for the capture's own
locale). The harness rewrites the address bar to the capture's real path with that locale
(`/en-US/wishlist`), so the core sees that market as it does live; only the address changes, the page stays
the capture's. On wishlist fixtures the run then checks the price history was saved under that market
(`..._prices_US`). It also rewrites the locale in the embedded page state, where the core reads it. Add `&currency=USD` to relabel
the prices' currency code the same way (the numbers stay the capture's), e.g. `?persist&locale=en-US&currency=USD`
to test per-currency price ranges against a store seeded from the rand page. Do not reload afterwards
(Refresh): the server has no such path.

**Testing the tile fallback:** add `?nostate` to remove the page's embedded data before the extension loads. Title,
publisher, prices and ownership are then read from the tiles, as they are for any product missing from the data.
Without it, wishlist runs also check that every price and ownership value taken from the data equals what the
tile itself says ("payload vs tiles" line; any difference fails).

**Testing a wishlist add/remove (T-34):** `request-watcher.js` (the manifest's page-world script) never
runs in the harness - it is loaded declaratively by the manifest, which the harness has none of. To test the
isolated-world side of the bridge, dispatch the same message by hand from the console:
```js
window.postMessage({ __ifcRequestEvent: true, method: 'POST', url: 'https://emerald.xboxservices.com/xboxcomfd/wishlist/items', status: 200, ok: true, body: { productId: 'ABCDEFGHIJKL' } }, location.origin);
```
`window.injected.requestLog` should gain an entry, and (after ~1.5 s) `window.injected.productDataLoadedAt`
should change (the debounced resync). `ok: false` should log but not resync; a message without the tag or from
another origin should be ignored.

**Testing persistence:** add `?persist` to the URL
(`.../<name>.harness.html?persist`). Filters set on one load are then
restored on the next reload. If restored filters are active, the banner
turns amber ("HARNESS SKIPPED") because the sanity checks assume no filters
and would overwrite the state being inspected - inspect the restored UI
manually or by script instead. Closing the tab clears the store.

**Captures saved with the extension running:** before loading the extension
code, the harness removes whatever an earlier copy of the extension had
injected into the saved page (panels, toolbar buttons, tag rows, badges) and
our marks on Xbox's own elements (item classes and `data-ifc-*` data, the
toolbar id), so the code under test starts from a clean page. The first
result line says what was cleaned ("capture: ..."). Add `?keepCapture` to
skip this and test how the extension copes with a page that already holds
its elements (e.g. no duplicate toolbar buttons).

**Shared (public) wishlists:** add `?public` to make an own-wishlist capture
look like someone else's shared wishlist to the extension: Xbox's wishlist
menu (and its menu buttons) is removed before boot, so the extension builds
its own toolbar container and styles its buttons itself. The first result
line says how many menu elements were removed.

**Scripts:** the fixture strips every script so Xbox's app can't re-render the
frozen page, but keeps external ones as inert `text/plain` placeholders with
their `src` (browsers never fetch or run those). Code that looks up the page's
script addresses - the theme switch's finder for Xbox's colour sheets (F-39) -
then sees them as on the live page. A capture only holds the colour sheet for
the theme it was saved in; to test a switch to the other theme, copy that
sheet (e.g. `1950.<hash>.chunk.css` from a light capture) next to it and
remove it afterwards.

A plain `file://` open won't work reliably (fetching the SVG icons via
`fetch()` is blocked from `file://` origins in most browsers) - always go
through the server.

## Why not just open the raw saved page?

The raw capture still references its original JS bundles. Browsers execute
classic `<script src>` tags regardless of file extension or MIME type, so
those bundles run, the app tries to re-hydrate, its calls to
`xboxservices.com` fail with no network, and the saved wishlist item list
gets replaced with an empty shell before you can inspect it. Stripping the
`<script>` tags freezes the DOM exactly as it was captured.
