# Security Policy

## Scope

This project injects UI and reads DOM data on `xbox.com/*/wishlist` pages,
in two forms:

- **Userscript** (`xbox-wishlist.user.js`) — runs inside your userscript
  manager's sandbox (Tampermonkey/Greasemonkey), scoped to the `@match`
  pattern in the script header.
- **Browser extension** (`browser-extension/`) — runs as a Manifest V3
  content script, scoped to the `host_permissions` in `manifest.json`.

Neither component talks to any backend of ours — there is no server. All
data (prices, titles, ownership status) is read live from the Xbox wishlist
page's DOM and never leaves the browser except via the two calls below.

## Data handling

- **Persistence:** filter/sort preferences only, stored locally
  (`GM_setValue`/`GM_getValue` for the userscript, `chrome.storage.local`
  for the extension). No wishlist contents, account data, or purchase
  history are ever persisted.
- **Network:** the userscript fetches its CSS and SVG icon resources from
  this repo's GitHub raw URLs via `@resource` (standard userscript
  mechanism, declared in the script header). Neither channel makes any
  other outbound request.
- **Permissions:** the extension requests the minimum permissions needed —
  `storage`, plus `host_permissions` scoped to `xbox.com/*/wishlist*` and
  `displaycatalog.mp.microsoft.com` (used for game metadata already exposed
  to the page). See [AGENTS.md](AGENTS.md) §2.6 for the internal data
  classification tiers this project follows when handling anything touching
  Xbox's APIs.

## Supported versions

Only the latest published userscript version (via
[Greasy Fork](https://greasyfork.org/en/scripts/567587-xbox-wishlist)) and
the current `main` branch of the extension receive fixes. There is no LTS
branch.

## Reporting a vulnerability

If you find a security issue — e.g. a way the script could leak data, be
hijacked via a compromised CDN/resource URL, or bypass Xbox's CSP in an
unsafe way — please **do not** open a public GitHub issue.

Instead, report it privately via GitHub's
[private vulnerability reporting](https://github.com/zellreid/xbox-wishlist/security/advisories/new)
on this repository. Include:

- Affected channel (userscript, extension, or both)
- Steps to reproduce
- Potential impact

You should get an acknowledgement within a few days. This is a small,
unfunded open-source project — there's no bug bounty, but confirmed reports
will be credited in the fix's changelog entry (unless you'd prefer
otherwise).
