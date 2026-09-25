#!/usr/bin/env node
// Turns a raw "Save As -> Webpage, Complete" capture of the Xbox wishlist page
// (dropped in mock_examples/#wishlist/) into a frozen test fixture that boots
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
//   node tools/mock-harness/prepare-fixture.js "mock_examples/#wishlist/20260922_1138.html"
//   node tools/mock-harness/prepare-fixture.js            (prepares every *.html in mock_examples/#wishlist/)
// Open via the server with "#" URL-encoded, e.g. /mock_examples/%23wishlist/<name>.harness.html

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MOCK_DIR = path.join(REPO_ROOT, 'mock_examples', '#wishlist');
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

function buildHarnessBlock(outDir) {
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
            getURL: (p) => '${toUrlPath(path.relative(outDir, path.join(REPO_ROOT, 'browser-extension', 'src')))}/' + p
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

    async function runHarness() {
        const failures = [];
        const captureCleanup = cleanCapture() + simulatePublic();
        try {
            await loadScript('${coreUrl}');
            await loadScript('${contentUrl}');
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
    const harnessBlock = buildHarnessBlock(outDir);
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
    const candidates = fs.readdirSync(MOCK_DIR).filter(f => f.endsWith('.html') && !f.endsWith('.harness.html'));
    if (!candidates.length) {
        console.error(`No .html files found directly in ${MOCK_DIR}`);
        process.exit(1);
    }
    candidates.forEach(f => prepareOne(path.join(MOCK_DIR, f)));
}

main();
