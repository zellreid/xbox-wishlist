# Userscript build & publish

`xbox-wishlist.user.js` at the repo root is a **generated file**. Don't edit
it directly - edit one of these three sources, then rebuild:

1. [`header.template.js`](header.template.js) - the `==UserScript==` metadata
   block (`{{VERSION}}` gets substituted in)
2. [`../../browser-extension/src/shared/xbox-wishlist.core.js`](../../browser-extension/src/shared/xbox-wishlist.core.js) - all the actual filtering/sorting/DOM logic, shared with the browser extension
3. [`adapter.js`](adapter.js) - the small `GM_*` adapter that boots the core

```
node tools/userscript/build.js
```

concatenates them, in that order, into `xbox-wishlist.user.js`.

## Why the core is inlined instead of `@require`-d

An earlier version of this pulled the shared core in at runtime via
`@require https://raw.githubusercontent.com/.../xbox-wishlist.core.js`.
That works fine for a personal install, but GreasyFork's code rules only
allow `@require` for well-known third-party libraries - not for your own
application logic fetched from your own repo. The concern is supply-chain
integrity: the code GreasyFork reviews and publishes has to be the code
that actually runs, not a pointer to something on GitHub that could change
independently after publishing. (I wasn't able to load greasyfork.org's
help pages directly to re-confirm the exact current wording - it sits
behind a bot-check wall from this environment - so if you want to
double-check before relying on this, look at
`https://greasyfork.org/en/help/code-rules` yourself. Inlining is the safe
default either way: it also means there's exactly one file to hand to
GreasyFork, with no runtime dependency on GitHub's raw CDN being reachable.)

`@resource` (for `styles.css` and the four control SVGs) is a different
mechanism - it fetches static, non-executable assets, which GreasyFork does
allow from external URLs. Those stay as `@resource` lines pointing at
`raw.githubusercontent.com`.

## Version scheme

`major.minor.YYDDD.revision` (documented in [CHANGELOG.md](../../CHANGELOG.md)):
- `YYDDD` = 2-digit year + 3-digit day-of-year, e.g. 2026-09-22 -> `26265`
- `revision` resets to `1` whenever `YYDDD` changes, otherwise increments

The version also drives the `?ver=` cache-buster on the `CSSFilter`
`@resource` URL, so bumping it is what makes Tampermonkey/GreasyFork
actually pick up a changed `styles.css` - without it, the URL is unchanged
and the old cached copy can stick around. (The SVG icons aren't versioned
this way since they essentially never change; if that ever stops being
true, give them the same `?ver=` treatment in `header.template.js`.)

## Publishing a new version

1. Make your changes to the core, the extension, or the userscript-only
   adapter/header.
2. Bump the version and rebuild in one step:
   ```
   node tools/userscript/bump-version.js          # same major.minor, today's YYDDD
   node tools/userscript/bump-version.js 1.5       # start a new major.minor (e.g. 1.4 -> 1.5)
   ```
   This updates `version.json` and regenerates `xbox-wishlist.user.js`.
3. Sanity-check it against the mock harness (see
   [`../mock-harness/README.md`](../mock-harness/README.md)) or install it
   locally in Tampermonkey and try the real wishlist page.
4. Commit (`version.json` + the regenerated `xbox-wishlist.user.js`) and
   push to `main`.
5. On [greasyfork.org](https://greasyfork.org/en/scripts/567587), open the
   script's edit page and paste the full contents of the regenerated
   `xbox-wishlist.user.js` into the code editor, then publish. GreasyFork
   reads the `@version` from the pasted code for its version history - it
   has to match what you just bumped to, which is why the build script
   keeps them in sync automatically rather than needing a manual edit.

## Testing locally without publishing

Point Tampermonkey at the raw GitHub URL of `xbox-wishlist.user.js` on your
branch/fork to install it directly, or just drag-and-drop the local file
into Tampermonkey's dashboard. Since it's fully self-contained, no
`@require` fetch is involved and it behaves identically to what you'd get
from GreasyFork.
