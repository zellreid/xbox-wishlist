# Mock wishlist test harness

Boots the real extension code (`browser-extension/src/shared/xbox-wishlist.core.js`
+ `browser-extension/src/content.js`) against a frozen, offline copy of a real
Xbox wishlist page, so a change can be sanity-checked without touching
xbox.com or waiting on the Chrome Web Store / Tampermonkey update cycle.

## Mock layout

`mock_examples/` (git-ignored - personal browsing data) is split by page type:

| Folder | Contents | Harness fixture? |
|---|---|---|
| `#wishlist/` | Wishlist page captures | Yes - `prepare-fixture.js` targets this folder |
| `#products/` | Product page captures | No - reference for product-page-only data (F-34) |
| `#deals/` | Game deals browse page | No - reference for possible future deals-page support |
| `#games/` | Browse all games page | No - reference for possible future games-page support |

`#` starts a URL fragment, so encode it as `%23` in harness URLs.

## Adding a new fixture

1. On the Xbox wishlist page, `Ctrl+S` -> "Webpage, Complete" -> save into
   `mock_examples/#wishlist/` (this produces `<name>.html` + a `<name>_files/` folder).
2. Prepare it:
   ```
   node tools/mock-harness/prepare-fixture.js "mock_examples/#wishlist/<name>.html"
   ```
   This strips the page's own `<script>` tags (otherwise the live React app
   re-hydrates on load, its API calls fail offline, and it wipes the saved
   item list back to an empty shell), links the extension's own
   `shared/styles.css` (the real extension gets this from `manifest.json`;
   the harness has no manifest, so it links it explicitly), and appends a
   small harness script that loads the real extension code against the
   frozen DOM and runs a few sanity checks (item count, publisher
   collection, an actual filter interaction). Output goes to
   `mock_examples/#wishlist/<name>.harness.html` - **next to** the raw capture, not a
   separate folder, because the saved page's own asset links are relative
   (`./<name>_files/...`) and only resolve if the fixture stays alongside
   its `_files` sibling. Git-ignored - regenerate any time from the raw
   capture.

   Omit the argument to prepare every `.html` file directly under
   `mock_examples/#wishlist/` in one pass. The fixture keeps Xbox's embedded
   page-state script (as inert `text/plain`) so the product-data reader works
   offline; every other script is stripped.

## Running it

```
node tools/mock-harness/server.js        # serves the repo at :8792
```

Then open `http://localhost:8792/mock_examples/%23wishlist/<name>.harness.html`.
A banner at the top of the page turns green ("HARNESS PASS") or red
("HARNESS FAIL") with details; the same summary is logged to the console as
`[HARNESS RESULT] {...}` for scripted checks.

The `chrome.storage` stand-in answers asynchronously (like the real one) and
keeps its data in `sessionStorage`. By default every load starts with an
empty store, so the sanity checks always see a clean slate.

**Testing persistence:** add `?persist` to the URL
(`.../<name>.harness.html?persist`). Filters set on one load are then
restored on the next reload. If restored filters are active, the banner
turns amber ("HARNESS SKIPPED") because the sanity checks assume no filters
and would overwrite the state being inspected - inspect the restored UI
manually or by script instead. Closing the tab clears the store.

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
