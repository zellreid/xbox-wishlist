#!/usr/bin/env node
// Icon catalogue for the xbox-wishlist project.
//
// Builds one browsable catalogue of every icon available to us:
//   - our own icons (browser-extension/src/shared/icons/*.svg)
//   - icons in Xbox's JS bundles (React createElement("svg") modules) saved with the mocks
//   - inline <svg> elements in the saved Xbox pages (rendered DOM)
// ...and exports a chosen Xbox icon into shared/icons/ in the repo's SVG format.
//
// Usage:
//   node tools/icons/catalogue.js [build]                  -> tools/icons/out/icon-catalogue.html + .json
//   node tools/icons/catalogue.js export <id> <name> [--force]
//        <id> is the catalogue id shown in the gallery (e.g. 72012 for bundle module #72012)
//        writes browser-extension/src/shared/icons/<name>.svg
//
// View the gallery through the mock-harness server (serves the repo root):
//   node tools/mock-harness/server.js  ->  http://localhost:8792/tools/icons/out/icon-catalogue.html
//
// Inputs come from mock_examples/ (git-ignored, personal captures); so does the
// output (tools/icons/out/, git-ignored) - it contains Xbox's full icon set.
// Only icons deliberately exported into shared/icons/ are committed.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MOCK_DIR = path.join(REPO_ROOT, 'mock_examples');
const ICON_DIR = path.join(REPO_ROOT, 'browser-extension', 'src', 'shared', 'icons');
const OUT_DIR = path.join(__dirname, 'out');
const OUT_HTML = path.join(OUT_DIR, 'icon-catalogue.html');
const OUT_JSON = path.join(OUT_DIR, 'icon-catalogue.json');

// ==================== EXTRACTION ====================
const pathKey = (svg) => [...svg.matchAll(/\sd="([^"]+)"/g)].map(m => m[1]).join('|');

function customIcons() {
    if (!fs.existsSync(ICON_DIR)) return [];
    return fs.readdirSync(ICON_DIR).filter(f => f.endsWith('.svg')).map(f => {
        const svg = fs.readFileSync(path.join(ICON_DIR, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
        return { kind: 'custom', id: f.replace(/\.svg$/, ''), name: f, svg, key: pathKey(svg) || svg, source: `repo: ${f}` };
    });
}

// Webpack modules look like `123(e,t,n){...}`; keep the small ones that render an <svg>
function bundleIcons(file, label) {
    const js = fs.readFileSync(file, 'utf8');
    const parts = js.split(/[,{](\d+)\([a-z],[a-z],[a-z]\)\{/);
    const found = [];
    for (let i = 1; i < parts.length; i += 2) {
        const body = parts[i + 1];
        if (body.length > 6000 || !/createElement\("svg"/.test(body)) continue;
        const vb = (body.match(/viewBox:"([^"]+)"/) || [])[1];
        const paths = [...body.matchAll(/\bd:"([^"]+)"/g)].map(m => m[1]);
        if (!vb || !paths.length) continue;
        const rule = (body.match(/fillRule:"([^"]+)"/) || [])[1] || 'nonzero';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="1em" height="1em" fill="currentColor">${paths.map(d => `<path d="${d}" fill-rule="${rule}"/>`).join('')}</svg>`;
        found.push({ kind: 'xbox-bundle', id: parts[i], name: `#${parts[i]}`, svg, key: paths.join('|'), source: label });
    }
    return found;
}

function pageIcons(file, label) {
    const html = fs.readFileSync(file, 'utf8');
    const found = [];
    for (const m of html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)) {
        const svg = m[0];
        if (svg.length > 20000 || !/<path|<rect|<circle|<polygon/.test(svg)) continue;
        const name = (svg.match(/aria-label="([^"]+)"/) || svg.match(/<title>([^<]+)</) || [, ''])[1];
        found.push({ kind: 'xbox-page', id: null, name, svg, key: pathKey(svg) || svg, source: label });
    }
    return found;
}

// Every saved page (*.html, not our *.harness.html) and its *_files bundles, per mock folder.
// Bundles are shared between captures (same hashed file name) - read each once.
function mockInputs() {
    const pages = [], bundles = new Map();
    if (!fs.existsSync(MOCK_DIR)) return { pages, bundles: [] };
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            const rel = path.relative(MOCK_DIR, full).split(path.sep).join('/');
            if (entry.isDirectory()) {
                if (entry.name.endsWith('_files')) {
                    for (const f of fs.readdirSync(full)) {
                        if (!/\.js(\.download)?$/.test(f)) continue;
                        const base = f.replace(/\.download$/, '');
                        if (!bundles.has(base)) bundles.set(base, { file: path.join(full, f), label: `${rel.split('/')[0]} bundle ${base}` });
                    }
                } else walk(full);
            } else if (entry.name.endsWith('.html') && !entry.name.endsWith('.harness.html')) {
                pages.push({ file: full, label: `page ${rel}` });
            }
        }
    };
    walk(MOCK_DIR);
    return { pages, bundles: [...bundles.values()] };
}

function build() {
    const { pages, bundles } = mockInputs();
    const icons = [], byKey = new Map();
    const add = (icon) => {
        const existing = byKey.get(icon.key);
        if (existing) { if (!existing.sources.includes(icon.source)) existing.sources.push(icon.source); if (!existing.id && icon.id) existing.id = icon.id; return; }
        icon.sources = [icon.source]; delete icon.source;
        byKey.set(icon.key, icon); icons.push(icon);
    };
    const custom = customIcons();
    bundles.forEach(b => bundleIcons(b.file, b.label).forEach(add));
    pages.forEach(p => pageIcons(p.file, p.label).forEach(add));
    // Mark Xbox icons already exported into the repo (same path data)
    custom.forEach(c => { const x = byKey.get(c.key); if (x) x.inRepo = c.name; });
    custom.forEach(c => { if (!byKey.has(c.key)) { c.sources = [c.source]; delete c.source; icons.push(c); } });
    icons.forEach((ic, i) => { if (!ic.id) ic.id = `p${i + 1}`; });   // page-only icons get a stable-per-build id

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(icons.map(({ key, ...rest }) => rest), null, 1));
    fs.writeFileSync(OUT_HTML, renderHtml(icons, { pages: pages.length, bundles: bundles.length }));
    const count = k => icons.filter(i => i.kind === k).length;
    console.log(`Scanned ${pages.length} pages + ${bundles.length} bundles.`);
    console.log(`Icons: ${count('xbox-bundle')} Xbox bundle, ${count('xbox-page')} Xbox page-only, ${count('custom')} custom-only; ${icons.filter(i => i.inRepo).length} Xbox icons already in shared/icons.`);
    console.log(`Wrote ${path.relative(REPO_ROOT, OUT_HTML)}`);
}

// ==================== GALLERY ====================
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function renderHtml(icons, counts) {
    const cell = ic => {
        const svg = ic.svg.replace(/\swidth="[^"]*"/, ' width="28"').replace(/\sheight="[^"]*"/, ' height="28"');
        const repoTerms = ic.inRepo ? `in repo ${ic.inRepo}` : ic.kind === 'custom' ? 'in repo custom' : '';
        const search = [ic.id, ic.name, repoTerms, ...ic.sources].join(' ').toLowerCase();
        return `<div class="c ${ic.kind}${ic.inRepo ? ' repo' : ''}" data-id="${esc(ic.id)}" data-search="${esc(search)}" title="${esc(ic.sources.join('\n'))}">`
            + `<div class="i">${svg}</div><b>${esc(ic.id)}</b><span>${esc(ic.inRepo ? `in repo: ${ic.inRepo}` : ic.name)}</span></div>`;
    };
    const section = (kind, title) => {
        const list = icons.filter(i => i.kind === kind);
        return `<h3>${title} (${list.length})</h3><div class="g">${list.map(cell).join('')}</div>`;
    };
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Icon catalogue - xbox-wishlist</title>
<style>
body{background:#1f1f1f;color:#ddd;font:11px 'Segoe UI',sans-serif;margin:12px}
header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
input{background:#2d2d2d;border:1px solid #555;color:#eee;padding:5px 8px;border-radius:4px;width:260px}
h3{font-size:13px;margin:16px 0 6px}.g{display:flex;flex-wrap:wrap;gap:6px}
.c{width:92px;display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid #333;padding:4px;text-align:center;cursor:pointer;overflow:hidden}
.c:hover{border-color:#888}.c.repo{border-color:#107c10}.c.copied{background:#107c10}
.i{height:32px;display:flex;align-items:center;color:#f5f5f5}.i svg{max-width:64px;max-height:28px}
span{font-size:9px;color:#aaa;word-break:break-all}small{color:#888}
</style></head><body>
<header><strong>Icon catalogue</strong><input id="q" placeholder="Search id, name, source, repo file..." autofocus>
<small>${counts.pages} pages, ${counts.bundles} bundles scanned. Green = already in shared/icons. Click to copy the id; export with <code>node tools/icons/catalogue.js export &lt;id&gt; &lt;name&gt;</code></small></header>
${section('xbox-bundle', 'Xbox JS bundles')}${section('xbox-page', 'Xbox page inline SVG (rendered DOM)')}${section('custom', 'Custom only (not from Xbox)')}
<script>
document.getElementById('q').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.c').forEach(c => { c.style.display = !q || c.dataset.search.includes(q) ? '' : 'none'; });
});
document.querySelectorAll('.c').forEach(c => c.addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText(c.dataset.id);
    c.classList.add('copied'); setTimeout(() => c.classList.remove('copied'), 400);
}));
</script></body></html>`;
}

// ==================== EXPORT ====================
function exportIcon(id, name, force) {
    if (!id || !name || !/^[a-z0-9-]+$/.test(name)) {
        console.error('Usage: node tools/icons/catalogue.js export <id> <name>   (name: lower-case, digits, hyphens)');
        process.exit(1);
    }
    if (!fs.existsSync(OUT_JSON)) { console.error('No catalogue yet - run: node tools/icons/catalogue.js build'); process.exit(1); }
    const icons = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
    const icon = icons.find(i => String(i.id) === String(id).replace(/^#/, ''));
    if (!icon) { console.error(`No icon with id "${id}" in the catalogue.`); process.exit(1); }
    if (icon.kind === 'custom') { console.error(`"${id}" is already a repo icon (${icon.name}).`); process.exit(1); }
    const target = path.join(ICON_DIR, `${name}.svg`);
    if (fs.existsSync(target) && !force) { console.error(`${path.relative(REPO_ROOT, target)} exists - pass --force to overwrite.`); process.exit(1); }
    // Repo format: same attributes as the existing shared icons, plus a provenance comment
    const vb = (icon.svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 2048 2048';
    const paths = [...icon.svg.matchAll(/\sd="([^"]+)"/g)].map(m => m[1]);
    const rule = (icon.svg.match(/fill-rule="(evenodd)"/) || [])[1];
    const where = icon.kind === 'xbox-bundle' ? `Xbox's JS bundle, module #${icon.id}` : "a saved Xbox page's inline SVG";
    const today = new Date().toISOString().slice(0, 10);
    const out = `<!-- Source: xbox.com icon set (extracted from ${where}, ${today}) - ${name} -->\n`
        + `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="1em" height="1em" style="vertical-align: middle; fill: currentColor;">`
        + paths.map(d => `<path d="${d}"${rule ? ` fill-rule="${rule}"` : ''} />`).join('') + '</svg>\n';
    fs.writeFileSync(target, out);
    const key = 'IMG' + name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
    console.log(`Wrote ${path.relative(REPO_ROOT, target)}`);
    console.log('To use it, register it on both platforms:');
    console.log(`  browser-extension/src/content.js RESOURCE_MAP:  ${key}: 'shared/icons/${name}.svg',`);
    console.log(`  tools/userscript/header.template.js:           // @resource     ${key} https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/${name}.svg`);
    console.log('No manifest change needed (shared/icons/*.svg is already web-accessible).');
}

// ==================== MAIN ====================
const [cmd = 'build', ...args] = process.argv.slice(2);
if (cmd === 'build') build();
else if (cmd === 'export') exportIcon(args[0], args[1], args.includes('--force'));
else { console.error(`Unknown command "${cmd}". Use: build | export <id> <name> [--force]`); process.exit(1); }
