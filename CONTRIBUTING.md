# Contributing to Xbox Wishlist

Thanks for considering a contribution. This project ships as two parallel
distributions of the same feature set — a Tampermonkey/Greasemonkey
userscript (`xbox-wishlist.user.js`, primary) and a Chrome/Edge Manifest V3
extension (`browser-extension/`, secondary, not yet at parity). Read
[docs/02-SYSTEM-DESIGN.md](docs/02-SYSTEM-DESIGN.md) and
[AGENTS.md](AGENTS.md) before making changes — they're the source of truth
for architecture, coding standards, and constraints, for humans and AI
agents alike.

## Before you start

1. Check [docs/04-FEATURE-BREAKDOWN.md](docs/04-FEATURE-BREAKDOWN.md) for
   the current backlog — please work from an existing feature ID (F-xx)
   or open an issue to get one assigned before starting on something new.
2. Check open [Issues](https://github.com/zellreid/xbox-wishlist/issues)
   tagged "Accepted".
3. Decide which channel you're targeting (userscript, extension, or both —
   most fixes should land in the userscript first, then be ported).

## Development setup

**Userscript:**
- Install [Tampermonkey](https://www.tampermonkey.net/), then create a new
  script and paste the contents of `xbox-wishlist.user.js`, or point
  Tampermonkey at your local file during development.
- No build step. Edit the `.js` file directly and reload the Xbox wishlist
  page to test.

**Browser extension:**
- No build step currently exists (raw JS loaded directly by the browser).
- Load unpacked: `chrome://extensions` (or `edge://extensions`) → enable
  Developer mode → Load unpacked → select `browser-extension/src/`.
- Reload the extension after each change.

## Coding standards

Full detail lives in [AGENTS.md](AGENTS.md) §2.4, summarized here:

- Vanilla JavaScript (ES2020+) only. No frameworks, no build tooling, unless
  explicitly agreed first (see AGENTS.md's HITL triggers).
- 4-space indentation, single quotes, semicolons required. Match existing
  style — don't reformat unrelated code in the same change.
- Never hard-code Xbox's hashed CSS module class names — always resolve via
  `resolveClass(prefix)` / the `PREFIXES` map.
- No inline event handlers (`onclick=...`) — CSP blocks them in the
  extension and they're avoided in the userscript for consistency. Use
  `addEventListener`.
- camelCase for functions/state, `ifc_`/`ifc-` prefixes for injected
  DOM IDs/classes, `data-ifc-*` for data attributes.

## Versioning

Bump `xbox-wishlist.user.js`'s `@version` header
(`major.minor.YYDDD.revision`) with every meaningful userscript change, and
add an entry to [CHANGELOG.md](CHANGELOG.md). Extension changes get their
own CHANGELOG.md entry under the "Browser Extension" section.

## Submitting changes

1. Branch from `main`: `feature/`, `fix/`, or `chore/` prefix.
2. Commit format: `<type>(<scope>): <description>`
   (types: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`; scopes:
   `content`, `popup`, `background`, `manifest`, `styles`, `icons`,
   `userscript`, `docs`).
3. Test manually against the checklist in
   [docs/06-TESTING.md](docs/06-TESTING.md) before opening a PR — there is
   no automated test suite yet.
4. Open a PR against `main` (protected — no direct pushes). Describe what
   you tested and on which browser(s).

## Reporting bugs

See [SECURITY.md](SECURITY.md) for security issues. For everything else,
[open an issue](https://github.com/zellreid/xbox-wishlist/issues) and
include: script/extension version, browser + userscript manager (if
applicable), steps to reproduce, and any console errors.
