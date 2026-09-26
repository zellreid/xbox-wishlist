#!/usr/bin/env node
// Turns a raw "Save As -> Webpage, Complete" capture of the Xbox wishlist page
// (dropped in mock_examples/#wishlist/<market>/, e.g. en-za) into a frozen test fixture that boots
// the real extension core against it. mock_examples/ also holds #products,
// #deals and #games captures - reference material, not harness fixtures.
//
// Why: opening the raw saved page directly lets its original React bundles
// re-execute (browsers run classic <script> tags regardless of file
// extension/MIME), which re-hydrates the app, its API calls fail offline,
// and the saved item list gets wiped back to an empty shell. Stripping the
// <script> tags freezes the DOM exactly as captured.
//
// Usage:
//   node tools/mock-harness/prepare-fixture.js "mock_examples/#wishlist/en-za/20260922_1138.html"
//   node tools/mock-harness/prepare-fixture.js            (prepares every *.html in mock_examples/#wishlist/<market>/)
// Open via the server with "#" URL-encoded, e.g. /mock_examples/%23wishlist/en-za/<name>.harness.html

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MOCK_ROOT = path.join(REPO_ROOT, 'mock_examples');
// Page types with harness fixtures: mock_examples/#<type>/<market>/<capture>.html
const PAGE_TYPES = ['wishlist', 'deals', 'games', 'products', 'addons'];
const CORE_JS = path.join(REPO_ROOT, 'browser-extension', 'src', 'shared', 'xbox-wishlist.core.js');
const CONTENT_JS = path.join(REPO_ROOT, 'browser-extension', 'src', 'content.js');
const STYLES_CSS = path.join(REPO_ROOT, 'browser-extension', 'src', 'shared', 'styles.css');

function toUrlPath(p) {
    return p.split(path.sep).join('/');
}

// Strips every <script> except Xbox's embedded app state (window.__PRELOADED_STATE__),
// which is kept as non-executing text/plain so the core's product-data reader can
// parse it exactly as it does on the live page. External scripts are kept as inert
// text/plain placeholders with their src (never fetched or run), so code that looks up
// the page's script addresses (the F-39 theme-sheet finder) sees them as on the live page.
function stripScripts(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, (tag) => {
        if (tag.includes('__PRELOADED_STATE__')) return tag.replace(/^<script[^>]*>/i, '<script type="text/plain" data-harness-kept="preloaded-state">');
        const src = (tag.match(/^<script[^>]*\ssrc="([^"]+)"/i) || [])[1];
        return src ? `<script type="text/plain" data-harness-kept="src" src="${src}"></script>` : '';
    });
}

function buildHarnessBlock(outDir, meta) {
    const coreUrl = toUrlPath(path.relative(outDir, CORE_JS));
    const contentUrl = toUrlPath(path.relative(outDir, CONTENT_JS));
    const stylesUrl = toUrlPath(path.relative(outDir, STYLES_CSS));
    return `
<!-- ============== xbox-wishlist mock test harness (generated) ============== -->
<!-- In the real extension, manifest.json's content_scripts.css injects this.
     There is no manifest here, so the harness links it explicitly. -->
<link rel="stylesheet" href="${stylesUrl}">
<style>
  #ifc-harness-banner {
    position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
    font: 13px/1.4 -apple-system, Segoe UI, sans-serif; padding: 10px 16px;
    color: #fff; background: #555; white-space: pre-wrap;
  }
  #ifc-harness-banner.pass { background: #1a7f37; }
  #ifc-harness-banner.fail { background: #b3261e; }
  #ifc-harness-banner.skip { background: #8a6d00; }
</style>
<div id="ifc-harness-banner">Harness: booting extension core against this fixture...</div>
<script>
(function () {
    'use strict';
    const banner = document.getElementById('ifc-harness-banner');
    // What this capture is: page type, market folder, and the real xbox.com address it was saved from
    const META = ${JSON.stringify(meta)};
    // Relative paths are resolved now, before any address rewrite below changes the base URL
    const ORIGINAL_HREF = location.href;
    const abs = (rel) => new URL(rel, ORIGINAL_HREF).href;
    // ?locale=xx-YY (or ?realpath for the capture's own locale) rewrites the address bar to the real
    // xbox.com path, e.g. /en-US/wishlist, so the core sees its market as it does live. Only the
    // address changes, not the page. Do not reload afterwards (Refresh): the harness server has no such path.
    (function () {
        const q = new URLSearchParams(location.search), loc = q.get('locale');
        if (!loc && !q.has('realpath')) return;
        const parts = META.sourcePath.split('/').filter(Boolean);
        if (loc) parts[0] = loc;
        try { history.replaceState(null, '', '/' + parts.join('/') + location.search); }
        catch (e) { console.warn('[harness] address rewrite failed: ' + e.message); }
    })();
    // ok: true = PASS, false = FAIL, null = SKIPPED (checks deliberately not run)
    function report(ok, lines) {
        banner.className = ok === null ? 'skip' : ok ? 'pass' : 'fail';
        banner.textContent = (ok === null ? 'HARNESS SKIPPED\\n' : ok ? 'HARNESS PASS\\n' : 'HARNESS FAIL\\n') + lines.join('\\n');
        window.__harnessResult = { ok, lines };
        console.log('[HARNESS RESULT] ' + JSON.stringify({ ok, lines }));
    }

    // chrome.storage stand-in that behaves like the real one where it matters:
    // get() answers asynchronously (so load-order races reproduce) and data
    // survives a page reload via sessionStorage (so persistence can be tested).
    // Cleared when the tab closes; falls back to memory if sessionStorage throws.
    // Every load starts from an empty store (so the sanity checks below see a clean
    // slate) unless the URL has ?persist, which keeps the previous load's data.
    const STORE_KEY = 'ifc_harness_store';
    const PERSIST_MODE = new URLSearchParams(location.search).has('persist');
    let memoryStore = {};
    try { memoryStore = PERSIST_MODE ? JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') : {}; } catch (e) { memoryStore = {}; }
    const persist = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(memoryStore)); } catch (e) { /* memory only */ } };
    window.chrome = {
        runtime: {
            id: 'harness-extension',   // content.js treats a missing id as "extension reloaded"; delete it to simulate that
            getManifest: () => ({ version: 'harness-test' }),
            getURL: (p) => abs('${toUrlPath(path.relative(outDir, path.join(REPO_ROOT, 'browser-extension', 'src')))}/' + p)
        },
        storage: {
            local: {
                set: (obj) => { Object.assign(memoryStore, obj); persist(); },
                get: (keys, cb) => {
                    const result = {};
                    keys.forEach(k => { if (k in memoryStore) result[k] = memoryStore[k]; });
                    setTimeout(() => cb(result), 50);
                }
            }
        }
    };

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
    }

    function waitFor(check, timeoutMs) {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            (function poll() {
                if (check()) return resolve();
                if (Date.now() - start > timeoutMs) return reject(new Error('Timed out waiting for condition'));
                setTimeout(poll, 100);
            })();
        });
    }

    // A capture saved while the extension was running still holds what it injected (panels,
    // toolbar buttons, tag rows, badges) and its marks on Xbox's own elements (item classes and
    // data, the toolbar id). Undo both, so the code under test starts from a clean page.
    // ?keepCapture skips this, to test how the code copes with a page that already has them.
    function cleanCapture() {
        if (new URLSearchParams(location.search).has('keepCapture')) return 'kept (?keepCapture)';
        const ours = el => el.id !== 'ifc-harness-banner' && ((/^(ifc_|injected)/.test(el.id) && el.id !== 'ifc_ButtonContainer')
            || (el.classList.length > 0 && [...el.classList].every(c => c.startsWith('ifc-'))));
        let removed = 0, unmarked = 0;
        document.querySelectorAll('body *').forEach(el => { if (el.isConnected && ours(el)) { el.remove(); removed++; } });
        document.querySelectorAll('body *').forEach(el => {
            const before = el.attributes.length + el.classList.length;
            [...el.classList].filter(c => c.startsWith('ifc-')).forEach(c => el.classList.remove(c));
            [...el.attributes].filter(a => a.name.startsWith('data-ifc')).forEach(a => el.removeAttribute(a.name));
            if (el.id === 'ifc_ButtonContainer') el.removeAttribute('id');
            if (el.attributes.length + el.classList.length !== before) unmarked++;
        });
        return removed || unmarked ? 'removed ' + removed + ' injected elements, unmarked ' + unmarked : 'nothing injected';
    }

    // ?public turns an own-wishlist capture into a shared (public) one, as far as the extension
    // can tell: Xbox's own wishlist menu (and with it the menu buttons whose look we copy) is removed.
    function simulatePublic() {
        if (!new URLSearchParams(location.search).has('public')) return '';
        const menus = document.querySelectorAll('[class*="WishlistPage-module__menuContainer___"], [class*="WishlistPage-module__wishlistMenuButton___"]');
        menus.forEach(el => el.remove());
        return ', public (?public): removed ' + menus.length + ' menu elements';
    }

    // Non-wishlist pages: the extension does not act there yet (F-35 deals/games, F-38 product
    // pages), so this only checks that it loads quietly, leaves the page alone and that the
    // capture is what its folder says (market, page state).
    async function runSmoke() {
        const failures = [], errors = [];
        window.addEventListener('error', e => errors.push(e.message));
        const lines = ['page type: ' + META.type, 'capture: ' + cleanCapture(), 'address seen by the core: ' + location.pathname];
        try {
            await loadScript(abs('${coreUrl}'));
            await loadScript(abs('${contentUrl}'));
            await new Promise(r => setTimeout(r, 1500));   // let the core's timers run once or twice
        } catch (ex) { report(false, ['Boot failed: ' + ex.message]); return; }
        let st = null;
        try {
            const raw = document.querySelector('script[data-harness-kept="preloaded-state"]').textContent;
            // the assignment is followed by other statements, so take the balanced {...} (string-aware)
            const start = raw.indexOf('{');
            let depth = 0, inStr = false, end = -1;
            for (let i = start; i < raw.length && end < 0; i++) {
                const c = raw[i];
                if (inStr) { if (c === '\\\\') i++; else if (c === '"') inStr = false; }
                else if (c === '"') inStr = true;
                else if (c === '{') depth++;
                else if (c === '}' && --depth === 0) end = i;
            }
            st = JSON.parse(raw.slice(start, end + 1));
        } catch (ex) { failures.push('embedded page state missing or unreadable'); }
        if (st) {
            const mi = st.appContext && st.appContext.marketInfo || {};
            lines.push('page state market: ' + mi.locale + ' (language ' + mi.language + ', market ' + mi.market + ')');
            if (String(mi.locale || '').toLowerCase() !== META.folder) failures.push('page state locale ' + mi.locale + ' does not match folder ' + META.folder);
        }
        const injected = document.querySelectorAll('[id^="ifc_"]').length;
        lines.push('extension elements on this page: ' + injected);
        if (injected) failures.push('extension injected ' + injected + ' elements on a ' + META.type + ' page');
        if (errors.length) failures.push('page errors: ' + errors.join(' | '));
        report(failures.length === 0, failures.length ? failures : lines);
    }

    async function runHarness() {
        if (META.type !== 'wishlist') return runSmoke();
        const failures = [];
        const captureCleanup = cleanCapture() + simulatePublic();
        try {
            await loadScript(abs('${coreUrl}'));
            await loadScript(abs('${contentUrl}'));
            await waitFor(() => window.injected && window.injected.ui.complete, 8000);
        } catch (ex) {
            report(false, ['Boot failed: ' + ex.message]);
            return;
        }

        const state = window.injected;
        const lines = ['capture: ' + captureCleanup];

        // The checks below assume no filters are active and would also overwrite the
        // restored state being inspected - so skip them when a restore is under test.
        if (PERSIST_MODE && state.filters.filteredCount !== state.filters.totalCount) {
            report(null, ['persist mode: restored filters active, sanity checks not run',
                'items detected: ' + state.filters.totalCount, 'visible after restore: ' + state.filters.filteredCount]);
            return;
        }

        if (!(state.filters.totalCount > 0)) failures.push('totalCount is 0 - no wishlist items detected');
        lines.push('items detected: ' + state.filters.totalCount);

        if (state.filters.filteredCount !== state.filters.totalCount) failures.push('filteredCount should equal totalCount with no filters active');
        lines.push('filtered (no filters): ' + state.filters.filteredCount);

        const publisherCount = state.filters.publishers.list.size;
        if (!(publisherCount > 0)) failures.push('no publishers collected');
        lines.push('publishers collected: ' + publisherCount);

        if (!document.getElementById('ifc_btn_Filter')) failures.push('filter button not injected');
        if (!document.getElementById('ifc_btn_Sort')) failures.push('sort button not injected');

        // Exercise the real filter pipeline end-to-end: tick the first publisher
        // NOTE: updateScreen() fully rebuilds the publishers checkbox list
        // (container.innerHTML = '' + rebuild) on every change, so a saved
        // checkbox reference goes stale after dispatching one 'change' event.
        // Re-query by value from the live DOM before each interaction.
        function findPublisherCheckbox(value) {
            const container = document.getElementById('ifc_select_publishers');
            return container && Array.from(container.querySelectorAll('input[type=checkbox]')).find(c => c.value === value);
        }

        const firstPublisher = Array.from(state.filters.publishers.list.keys())[0];
        if (firstPublisher) {
            const cb = findPublisherCheckbox(firstPublisher);
            if (!cb) {
                failures.push('could not find checkbox for publisher "' + firstPublisher + '"');
            } else {
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
                const expected = state.filters.publishers.list.get(firstPublisher);
                if (state.filters.filteredCount !== expected) {
                    failures.push('filtering by "' + firstPublisher + '" gave ' + state.filters.filteredCount + ', expected ' + expected);
                }
                lines.push('filter test: "' + firstPublisher + '" -> ' + state.filters.filteredCount + ' (expected ' + expected + ')');
                // reset so the fixture is left in a clean state - re-query,
                // the checkbox list was just rebuilt by the change above
                const cbAfter = findPublisherCheckbox(firstPublisher);
                if (cbAfter) {
                    cbAfter.checked = false;
                    cbAfter.dispatchEvent(new Event('change'));
                }
                if (state.filters.filteredCount !== state.filters.totalCount) {
                    failures.push('filter reset did not restore filteredCount to totalCount');
                }
            }
        }

        // Per-market storage: with ?locale=xx-YY the price history must be saved under that market
        lines.push('address seen by the core: ' + location.pathname);
        const wanted = new URLSearchParams(location.search).get('locale');
        if (wanted) {
            const region = wanted.split('-').pop().toUpperCase();
            try {
                await waitFor(() => Object.keys(memoryStore).some(k => k.endsWith('_prices_' + region)), 4000);
                lines.push('price history saved under market ' + region + ' (?locale=' + wanted + ')');
            } catch (ex) { failures.push('no price history saved under market ' + region + '; stored keys: ' + Object.keys(memoryStore).join(', ')); }
        }

        report(failures.length === 0, failures.length ? failures : lines);
    }

    runHarness();
})();
</script>
<!-- ============================================================================ -->
`;
}

function prepareOne(inputPath) {
    const html = fs.readFileSync(inputPath, 'utf8');
    const stripped = stripScripts(html);
    const base = path.basename(inputPath, '.html');
    // Written next to the original (not a separate prepared/ folder): the
    // saved page's own asset links are relative (e.g. "./<name>_files/x.css"),
    // so the fixture must stay in the same directory as that sibling folder.
    const outDir = path.dirname(inputPath);
    const outPath = path.join(outDir, `${base}.harness.html`);
    // Page type and market come from the folder (mock_examples/#<type>/<market>/); the real address from the capture
    const rel = path.relative(MOCK_ROOT, inputPath).split(path.sep);
    const sourceUrl = (html.slice(0, 800).match(/saved from url=\(\d+\)(\S+)/) || [])[1] || '';
    let sourcePath = '/en-ZA/wishlist';
    try { sourcePath = new URL(sourceUrl).pathname; } catch (ex) { console.warn(`  no source address in ${base}, using ${sourcePath}`); }
    const meta = { type: rel[0].replace(/^#/, ''), folder: rel[1], sourceUrl, sourcePath };
    const harnessBlock = buildHarnessBlock(outDir, meta);
    const withHarness = /<\/body>/i.test(stripped)
        ? stripped.replace(/<\/body>/i, `${harnessBlock}</body>`)
        : stripped + harnessBlock;
    fs.writeFileSync(outPath, withHarness);
    console.log(`Prepared: ${path.relative(REPO_ROOT, inputPath)} -> ${path.relative(REPO_ROOT, outPath)}`);
}

function main() {
    const arg = process.argv[2];
    if (arg) {
        prepareOne(path.resolve(REPO_ROOT, arg));
        return;
    }
    // Captures live in mock_examples/#<type>/<market>/ (e.g. #wishlist/en-za/)
    const candidates = [];
    PAGE_TYPES.forEach(type => {
        const typeDir = path.join(MOCK_ROOT, `#${type}`);
        if (!fs.existsSync(typeDir)) return;
        fs.readdirSync(typeDir, { withFileTypes: true }).filter(d => d.isDirectory()).forEach(d => {
            fs.readdirSync(path.join(typeDir, d.name)).filter(f => f.endsWith('.html') && !f.endsWith('.harness.html'))
                .forEach(f => candidates.push(path.join(typeDir, d.name, f)));
        });
    });
    if (!candidates.length) {
        console.error(`No .html captures found in a market folder under ${MOCK_ROOT}`);
        process.exit(1);
    }
    candidates.forEach(prepareOne);
}

main();
