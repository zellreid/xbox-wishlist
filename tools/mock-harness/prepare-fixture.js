#!/usr/bin/env node
// Turns a raw "Save As -> Webpage, Complete" capture of the Xbox wishlist page
// (dropped in mock_examples/) into a frozen test fixture that boots the real
// extension core against it.
//
// Why: opening the raw saved page directly lets its original React bundles
// re-execute (browsers run classic <script> tags regardless of file
// extension/MIME), which re-hydrates the app, its API calls fail offline,
// and the saved item list gets wiped back to an empty shell. Stripping the
// <script> tags freezes the DOM exactly as captured.
//
// Usage:
//   node tools/mock-harness/prepare-fixture.js mock_examples/20260922_1138.html
//   node tools/mock-harness/prepare-fixture.js            (prepares every *.html directly in mock_examples/)

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MOCK_DIR = path.join(REPO_ROOT, 'mock_examples');
const CORE_JS = path.join(REPO_ROOT, 'browser-extension', 'src', 'shared', 'xbox-wishlist.core.js');
const CONTENT_JS = path.join(REPO_ROOT, 'browser-extension', 'src', 'content.js');
const STYLES_CSS = path.join(REPO_ROOT, 'browser-extension', 'src', 'shared', 'styles.css');

function toUrlPath(p) {
    return p.split(path.sep).join('/');
}

function stripScripts(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '');
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
</style>
<div id="ifc-harness-banner">Harness: booting extension core against this fixture...</div>
<script>
(function () {
    'use strict';
    const banner = document.getElementById('ifc-harness-banner');
    function report(ok, lines) {
        banner.className = ok ? 'pass' : 'fail';
        banner.textContent = (ok ? 'HARNESS PASS\\n' : 'HARNESS FAIL\\n') + lines.join('\\n');
        window.__harnessResult = { ok, lines };
        console.log('[HARNESS RESULT] ' + JSON.stringify({ ok, lines }));
    }

    // In-memory chrome.storage stand-in (no persistence needed between runs)
    const memoryStore = {};
    window.chrome = {
        runtime: {
            getManifest: () => ({ version: 'harness-test' }),
            getURL: (p) => '${toUrlPath(path.relative(outDir, path.join(REPO_ROOT, 'browser-extension', 'src')))}/' + p
        },
        storage: {
            local: {
                set: (obj) => Object.assign(memoryStore, obj),
                get: (keys, cb) => {
                    const result = {};
                    keys.forEach(k => { if (k in memoryStore) result[k] = memoryStore[k]; });
                    cb(result);
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

    async function runHarness() {
        const failures = [];
        try {
            await loadScript('${coreUrl}');
            await loadScript('${contentUrl}');
            await waitFor(() => window.injected && window.injected.ui.complete, 8000);
        } catch (ex) {
            report(false, ['Boot failed: ' + ex.message]);
            return;
        }

        const state = window.injected;
        const lines = [];

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
