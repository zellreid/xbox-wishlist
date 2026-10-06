#!/usr/bin/env node
// Turns a raw "Save As -> Webpage, Complete" capture of the Xbox wishlist page
// (dropped in mock_examples/wishlist/<market>/, e.g. en-za) into a frozen test fixture that boots
// the real extension core against it. mock_examples/ also holds products,
// deals, games and addons captures (smoke checks only, see below).
//
// Why: opening the raw saved page directly lets its original React bundles
// re-execute (browsers run classic <script> tags regardless of file
// extension/MIME), which re-hydrates the app, its API calls fail offline,
// and the saved item list gets wiped back to an empty shell. Stripping the
// <script> tags freezes the DOM exactly as captured.
//
// Usage:
//   node tools/mock-harness/prepare-fixture.js "mock_examples/wishlist/en-za/20260922_1138.html"  (one capture)
//   node tools/mock-harness/prepare-fixture.js "mock_examples/wishlist"                            (a directory: every
//                                                                                                    capture under it)
//   node tools/mock-harness/prepare-fixture.js "mock_examples"                                     (everything filed)
//   node tools/mock-harness/prepare-fixture.js            (no argument: mock_examples/_inbox/ - see file-mocks.js)
// Open via the server, e.g. /mock_examples/wishlist/en-za/<name>.harness.html

const fs = require('fs');
const path = require('path');
const { classify } = require('./classify-capture');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MOCK_ROOT = path.join(REPO_ROOT, 'mock_examples');
const INBOX = path.join(MOCK_ROOT, '_inbox');
// Page types with harness fixtures: mock_examples/<type>/<market>/<capture>.html
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
    // ?currency=USD (and ?locale=xx-YY) also rewrite the currency code and locale in the embedded page state, which is
    // where the core reads them from. Prices stay the capture's numbers; only their labels change.
    // ?nostate removes the page state altogether, to test the fallback to what the tiles say.
    const STATE_EDIT = { currency: new URLSearchParams(location.search).get('currency'), locale: new URLSearchParams(location.search).get('locale'), nostate: new URLSearchParams(location.search).has('nostate') };
    (function () {
        if (!STATE_EDIT.currency && !STATE_EDIT.locale && !STATE_EDIT.nostate) return;
        const el = document.querySelector('script[data-harness-kept="preloaded-state"]');
        if (!el) return;
        if (STATE_EDIT.nostate) { el.remove(); return; }
        let t = el.textContent;
        if (STATE_EDIT.currency) t = t.replace(/"currency":"[A-Za-z]{3}"/g, '"currency":"' + STATE_EDIT.currency.toUpperCase() + '"');
        if (STATE_EDIT.locale) t = t.replace(/"locale":"[A-Za-z-]+"/g, '"locale":"' + STATE_EDIT.locale + '"');
        el.textContent = t;
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
    // T-60: ?dist runs the minified build (npm run build) instead of browser-extension/src/
    const DIST = new URLSearchParams(location.search).has('dist');
    const srcUrl = (u) => DIST ? u.replace('browser-extension/src/', 'dist/extension/') : u;
    if (DIST) document.querySelectorAll('link[rel=stylesheet]').forEach(l => { const h = l.getAttribute('href') || ''; if (h.includes('browser-extension/src/')) l.setAttribute('href', srcUrl(h)); });
    const STORE_KEY = 'ifc_harness_store';
    const PERSIST_MODE = new URLSearchParams(location.search).has('persist');
    let memoryStore = {};
    try { memoryStore = PERSIST_MODE ? JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') : {}; } catch (e) { memoryStore = {}; }
    const persist = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(memoryStore)); } catch (e) { /* memory only */ } };
    window.chrome = {
        runtime: {
            id: 'harness-extension',   // content.js treats a missing id as "extension reloaded"; delete it to simulate that
            getManifest: () => ({ version: 'harness-test' }),
            getURL: (p) => abs(srcUrl('${toUrlPath(path.relative(outDir, path.join(REPO_ROOT, 'browser-extension', 'src')))}/') + p)
        },
        storage: {
            local: {
                set: (obj) => { Object.assign(memoryStore, obj); persist(); },
                remove: (key) => { [].concat(key).forEach(k => delete memoryStore[k]); persist(); },
                get: (keys, cb) => {
                    const result = {};
                    // get(null) returns everything, like chrome.storage.local
                    (keys === null ? Object.keys(memoryStore) : keys).forEach(k => { if (k in memoryStore) result[k] = memoryStore[k]; });
                    setTimeout(() => cb(result), 50);
                }
            }
        }
    };

    // T-58: the item cache is IndexedDB, which outlives the page, so it starts empty like the store above (unless ?persist)
    function resetCacheDb() {
        if (PERSIST_MODE) return Promise.resolve();
        return new Promise(resolve => {
            try { const q = indexedDB.deleteDatabase('ifc_xbox_wishlist_cache'); q.onsuccess = q.onerror = q.onblocked = () => resolve(); } catch (e) { resolve(); }
        });
    }

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

    // Non-wishlist pages: the extension runs there since F-38/F-35 but builds no UI of its own
    // (only the card hearts, F-38b/F-35b, which carry classes, not ifc_ ids), so this checks that
    // it loads quietly and that the capture is what its folder says (market, page state).
    async function runSmoke() {
        const failures = [], errors = [];
        window.addEventListener('error', e => errors.push(e.message));
        const lines = ['page type: ' + META.type, 'capture: ' + cleanCapture(), 'address seen by the core: ' + location.pathname];
        try {
            await resetCacheDb();
            await loadScript(abs(srcUrl('${coreUrl}')));
            await loadScript(abs(srcUrl('${contentUrl}')));
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
            if (!STATE_EDIT.locale && String(mi.locale || '').toLowerCase() !== META.folder) failures.push('page state locale ' + mi.locale + ' does not match folder ' + META.folder);
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
            await resetCacheDb();
            await loadScript(abs(srcUrl('${coreUrl}')));
            await loadScript(abs(srcUrl('${contentUrl}')));
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

        // Payload first: every value taken from the page data must equal what the tile itself says
        // (price, original price). Skipped with ?nostate, where both come from the tiles.
        if (!STATE_EDIT.nostate && state.debug && state.debug.scrape) {
            const cs = Array.from(document.querySelectorAll('[data-ifc-product-id]')), miss = [];
            let fromData = 0;
            cs.forEach(c => {
                const s = state.debug.scrape.prices(c), name = c.dataset.ifcName;
                const base = c.dataset.ifcPriceBase === 'null' ? null : parseFloat(c.dataset.ifcPriceBase);
                const disc = c.dataset.ifcPriceDiscount === 'null' ? null : parseFloat(c.dataset.ifcPriceDiscount);
                if (c.dataset.ifcPriceShownFor !== 'null') fromData++;
                if (s.base !== base || s.discount !== disc) miss.push('price ' + name + ': data ' + base + '/' + disc + ' tile ' + s.base + '/' + s.discount);
                // Owned: the tile's own "Owned" text is English-only (the scrape fallback, used only
                // when the page has no entitlements for this item), so it must equal the DOM only
                // then - not on a non-English capture where the payload (language-free) is used and
                // correctly disagrees with the tile's own localised word (e.g. German "Im Besitz").
                const payloadOwned = state.debug.payload && state.debug.payload.owned(c.dataset.ifcProductId);
                const expectedOwned = payloadOwned !== null && payloadOwned !== undefined ? payloadOwned : state.debug.scrape.owned(c);
                if (expectedOwned !== (c.dataset.ifcOwned === 'true')) miss.push('owned ' + name);
            });
            lines.push('payload vs tiles: ' + cs.length + ' items, ' + fromData + ' priced from the data, ' + miss.length + ' differences');
            miss.slice(0, 5).forEach(m => failures.push(m));
            if (miss.length > 5) failures.push('... and ' + (miss.length - 5) + ' more');
        }

        // T-54, details stability: loading a store page's details (Load details) for every item must not change
        // what the list was built from - whether an item can be bought (red), owned, its price. A store page is
        // faked here with just the fields it adds (install size, capabilities, an add-ons count).
        if (!STATE_EDIT.nostate && state.debug && state.debug.applyStorePage && state.debug.updateScreen && document.querySelector('[data-ifc-product-id]')) {
            const snap = () => new Map(Array.from(document.querySelectorAll('[data-ifc-product-id]')).map(c => [c.dataset.ifcId, c.dataset.ifcUnpurchasable + '/' + c.dataset.ifcOwned + '/' + c.dataset.ifcPrice]));
            const before = snap();
            document.querySelectorAll('[data-ifc-product-id]').forEach(c => {
                const id = (c.dataset.ifcProductId || '').toUpperCase();
                if (!id || id === 'NULL') return;
                state.debug.applyStorePage(id, { core2: { products: { productSummaries: { [id]: { productId: id, maxInstallSize: 5e9, capabilities: { PC: 'PC' } } } } } });
                state.capCache[id] = { caps: ['PC'], at: Date.now(), size: 5e9, addOns: 3 };
            });
            state.debug.updateScreen();
            const after = snap();
            let changed = 0;
            before.forEach((v, k) => { if (after.get(k) !== v) changed++; });
            lines.push('details stability: ' + before.size + ' items, ' + changed + ' changed');
            if (changed) failures.push(changed + ' items changed after loading details');
        }

        // T-26, language: the page's language file must have loaded (a missing or broken file would quietly fall
        // back to English), and none of our texts may show a raw catalogue key ("section.owned")
        if (state.debug && state.debug.language) {
            const lang = state.debug.language();
            const keyLike = /^[a-z][A-Za-z]*(\\.[A-Za-z-]+)+$/;
            const raw = [];
            document.querySelectorAll('[id^="ifc_"], [class*="ifc-"]').forEach(el => {
                const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ');
                [own, el.getAttribute('title'), el.getAttribute('aria-label'), el.getAttribute('placeholder')].forEach(t => { if (t && keyLike.test(t)) raw.push(t); });
            });
            lines.push('language: ' + lang.code + ' (page ' + lang.locale + '), ' + raw.length + ' raw keys');
            if (lang.code !== lang.expected) failures.push('language file for ' + lang.expected + ' did not load (using ' + lang.code + ')');
            if (raw.length) failures.push('raw catalogue keys shown: ' + raw.slice(0, 5).join(', '));
        }

        // T-57, direction: the toolbar sits at the inline end (right in a left-to-right page, left in a right-to-left
        // one, clear of Xbox's page title), and the price sliders stay left to right
        const bar = document.getElementById('ifc_ButtonContainer');
        if (bar) {
            const dir = getComputedStyle(bar).direction, r = bar.getBoundingClientRect(), mid = (r.left + r.right) / 2;
            const side = mid < window.innerWidth / 2 ? 'left' : 'right';
            lines.push('direction: ' + dir + ', toolbar on the ' + side);
            if (side !== (dir === 'rtl' ? 'left' : 'right')) failures.push('toolbar is on the ' + side + ' in a ' + dir + ' page');
            const track = document.querySelector('.ifc-slider-track');
            if (track && getComputedStyle(track).direction !== 'ltr') failures.push('price slider is not left to right');
        }

        // Per-market storage: with ?locale=xx-YY the price history must be saved under that market
        lines.push('address seen by the core: ' + location.pathname);
        const wanted = new URLSearchParams(location.search).get('locale');
        if (wanted) {
            const region = wanted.split('-').pop().toUpperCase();
            // T-59: price history is in the cache database, one record per '<market>|<product id>'
            const priceKeys = () => new Promise(resolve => {
                try {
                    const o = indexedDB.open('ifc_xbox_wishlist_cache');
                    o.onerror = () => resolve([]);
                    o.onsuccess = () => {
                        const db = o.result;
                        if (!db.objectStoreNames.contains('prices')) { db.close(); resolve([]); return; }
                        const q = db.transaction('prices').objectStore('prices').getAllKeys();
                        q.onsuccess = () => { db.close(); resolve(q.result.map(String)); };
                        q.onerror = () => { db.close(); resolve([]); };
                    };
                } catch (e) { resolve([]); }
            });
            let keys = [];
            for (let i = 0; i < 40 && !keys.some(k => k.startsWith(region + '|')); i++) { keys = await priceKeys(); if (!keys.some(k => k.startsWith(region + '|'))) await new Promise(r => setTimeout(r, 100)); }
            if (keys.some(k => k.startsWith(region + '|'))) lines.push('price history saved under market ' + region + ' (?locale=' + wanted + ')');
            else failures.push('no price history saved under market ' + region + '; price keys: ' + keys.slice(0, 5).join(', '));
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
    const sourceUrl = (html.slice(0, 800).match(/saved from url=\(\d+\)(\S+)/) || [])[1] || '';
    let sourcePath = '/en-ZA/wishlist';
    try { sourcePath = new URL(sourceUrl).pathname; } catch (ex) { console.warn(`  no source address in ${base}, using ${sourcePath}`); }
    // Page type and market: prefer the folder (mock_examples/<type>/<market>/, the reliable case -
    // it also confirms the capture is filed where it says it is); fall back to the capture's own
    // saved-from address (classify(), shared with file-mocks.js) for one sitting anywhere else,
    // such as _inbox/ before it has been filed.
    const rel = path.relative(MOCK_ROOT, inputPath).split(path.sep);
    let type = PAGE_TYPES.includes(rel[0]) ? rel[0] : null, market = type ? rel[1] : null;
    if (!type) {
        const c = classify(sourceUrl);
        if (c) { type = c.type; market = c.market; }
        else console.warn(`  could not tell what page ${base} is (saved from "${sourceUrl || 'unknown'}"); treating it as wishlist`);
    }
    const meta = { type: type || 'wishlist', folder: market || 'xx', sourceUrl, sourcePath };
    const harnessBlock = buildHarnessBlock(outDir, meta);
    const withHarness = /<\/body>/i.test(stripped)
        ? stripped.replace(/<\/body>/i, `${harnessBlock}</body>`)
        : stripped + harnessBlock;
    fs.writeFileSync(outPath, withHarness);
    console.log(`Prepared: ${path.relative(REPO_ROOT, inputPath)} -> ${path.relative(REPO_ROOT, outPath)}`);
}

// Every .html capture under a directory (recursive), skipping already-built fixtures and asset folders
function findCaptures(dir) {
    const found = [];
    (function walk(d) {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) { if (!entry.name.endsWith('_files')) walk(full); }
            else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.endsWith('.harness.html')) found.push(full);
        }
    })(dir);
    return found;
}

function main() {
    // No argument: mock_examples/_inbox/, where file-mocks.js drops newly saved captures before
    // filing them. Pass a single .html file for one capture, or any directory (e.g. mock_examples
    // for everything already filed, or mock_examples/wishlist for just one page type) for every
    // capture under it.
    const arg = process.argv[2];
    const target = arg ? path.resolve(REPO_ROOT, arg) : INBOX;
    let st;
    try { st = fs.statSync(target); } catch (ex) {
        console.error(`Not found: ${path.relative(REPO_ROOT, target)}` + (arg ? '' : ' (save captures there, or pass a file/directory)'));
        process.exit(1);
    }
    if (st.isFile()) { prepareOne(target); return; }
    const candidates = findCaptures(target);
    if (!candidates.length) {
        console.error(`No .html captures found under ${path.relative(REPO_ROOT, target)}`);
        process.exit(1);
    }
    candidates.forEach(prepareOne);
}

main();
