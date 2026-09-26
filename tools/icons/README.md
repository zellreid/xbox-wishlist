# Icon catalogue

One browsable catalogue of every icon available to this project, plus an
exporter that turns a chosen Xbox icon into a repo icon.

## What it scans

| Source | Where |
|---|---|
| Our icons | `browser-extension/src/shared/icons/*.svg` |
| Xbox JS bundles | every `*_files/*.js` saved with the mocks in `mock_examples/` (`wishlist`, `products`, `deals`, `games`) - each bundle read once |
| Xbox page inline SVG | every saved page `mock_examples/**/*.html` (rendered DOM - catches icons that exist only at runtime) |

Icons are de-duplicated by their path data; each keeps the list of places it
was found (hover a tile). Xbox icons already exported into `shared/icons` are
outlined green and labelled `in repo: <file>`.

## Usage

```
node tools/icons/catalogue.js build
node tools/mock-harness/server.js
```

Open `http://localhost:8792/tools/icons/out/icon-catalogue.html`. Search by id,
name, source or repo file; click a tile to copy its id.

Export an Xbox icon into the repo:

```
node tools/icons/catalogue.js export 72012 preorder
```

This writes `browser-extension/src/shared/icons/preorder.svg` in the repo's
format with a provenance comment (refuses to overwrite without `--force`) and
prints the two lines needed to register it (`content.js` `RESOURCE_MAP` and the
userscript `@resource`). No manifest change is needed.

## Notes

- `tools/icons/out/` is git-ignored: it is generated from the local mocks
  (also git-ignored) and contains Xbox's full icon set. Rebuild it any time.
- Bundle icons are identified by their webpack module id (`#72012`), which is
  stable only as long as Xbox doesn't rebuild that bundle - re-save mocks and
  rebuild if ids stop matching.
- Some store badges are not SVG: Optimized for Xbox Series X|S and Smart
  Delivery are embedded PNG images of Microsoft branding - use text instead of
  bundling them. Brand logos (Game Pass, EA Play) should be reused from the live
  page at runtime rather than bundled.
- Provenance of the current repo icons: expand, collapse, close, plus, refresh,
  preorder = xbox.com; export = Tabler Icons `file-export`; filter, sort =
  likely iconfont.cn (not recorded at the time).
