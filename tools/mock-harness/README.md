# Mock wishlist test harness

Boots the real extension code (`browser-extension/src/shared/xbox-wishlist.core.js`
+ `browser-extension/src/content.js`) against a frozen, offline copy of a real
Xbox wishlist page, so a change can be sanity-checked without touching
xbox.com or waiting on the Chrome Web Store / Tampermonkey update cycle.

## Mock layout

`mock_examples/` (git-ignored - personal browsing data) is split by page type:

| Folder | Contents | Harness checks |
|---|---|---|
| `#wishlist/<market>/` | Wishlist page captures, named `yyyyMMdd_HHmm` | Full: items, publishers, a real filter round trip |
| `#deals/<market>/`, `#games/<market>/` | Game deals and Browse all games pages, named `yyyyMMdd_HHmm` | Smoke |
| `#products/<market>/` | Product pages, named `{product id}_{yyyyMMdd}_{HHmm}_{slug}` (e.g. `9nm79b7n9jm6_20260923_1313_street-fighter-6`) | Smoke |
| `#addons/<market>/` | "Add-ons for this game" pages, same naming as products | Smoke |
| `_locale/<market>/` | The change-locale page - source of `locales.json` (see below) | None |

`<market>` is the lower-case locale folder (`en-za`). The date and time are the capture's created time; the
slug is the product's address slug (max 70 characters). **Smoke** means the page freezes, the extension loads
and leaves it alone (the extension does not act on these pages yet: F-35, F-38), the embedded page state
reads, and its locale matches the folder.

`#` starts a URL fragment, so encode it as `%23` in harness URLs.

## Locales

`locales.json` lists every language and region xbox.com offers (94 locales, 41 languages, 87 regions), built by
`node tools/mock-harness/extract-locales.js` from the newest capture under `mock_examples/_locale/`. The page
gives country and language names, not codes, so codes come from the locale table in the page's own bundle;
14 names are mapped by hand in the script. `sr-Cyrl-RS` ("Srbija - Srpski") is assumed, not confirmed.

## Adding a new fixture

1. On the Xbox page, `Ctrl+S` -> "Webpage, Complete" -> save into
   `mock_examples/#<type>/<market>/` (e.g. `#wishlist/en-za`), named as in the table above; this produces
   `<name>.html` + a `<name>_files/` folder. If the browser saves the `_files` folder under the page title,
   rename both and replace the folder name inside the .html.
2. Prepare it:
   ```
   node tools/mock-harness/prepare-fixture.js "mock_examples/#wishlist/en-za/<name>.html"
   ```
   This strips the page's own `<script>` tags (otherwise the live React app
   re-hydrates on load, its API calls fail offline, and it wipes the saved
   item list back to an empty shell), links the extension's own
   `shared/styles.css` (the real extension gets this from `manifest.json`;
   the harness has no manifest, so it links it explicitly), and appends a
   small harness script that loads the real extension code against the
   frozen DOM and runs a few sanity checks (wishlist pages: item count, publisher
   collection, an actual filter interaction). Output goes to
   `mock_examples/#wishlist/<market>/<name>.harness.html` - **next to** the raw capture, not a
   separate folder, because the saved page's own asset links are relative
   (`./<name>_files/...`) and only resolve if the fixture stays alongside
   its `_files` sibling. Git-ignored - regenerate any time from the raw
   capture.

   Omit the argument to prepare every `.html` capture under every
   `mock_examples/#<type>/<market>/` in one pass (33 today). The fixture keeps Xbox's embedded
   page-state script (as inert `text/plain`) so the product-data reader works
   offline; every other script is stripped.

## Running it

```
node tools/mock-harness/server.js        # serves the repo at :8792
```

Then open `http://localhost:8792/mock_examples/%23wishlist/en-za/<name>.harness.html`.
A banner at the top of the page turns green ("HARNESS PASS") or red
("HARNESS FAIL") with details; the same summary is logged to the console as
`[HARNESS RESULT] {...}` for scripted checks.

The `chrome.storage` stand-in answers asynchronously (like the real one) and
keeps its data in `sessionStorage`. By default every load starts with an
empty store, so the sanity checks always see a clean slate.

**Testing another market:** add `?locale=xx-YY` (e.g. `?locale=en-US`, or `?realpath` for the capture's own
locale). The harness rewrites the address bar to the capture's real path with that locale
(`/en-US/wishlist`), so the core sees that market as it does live; only the address changes, the page stays
the capture's. On wishlist fixtures the run then checks the price history was saved under that market
(`..._prices_US`). Do not reload afterwards (Refresh): the server has no such path.

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
