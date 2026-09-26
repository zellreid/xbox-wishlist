#!/usr/bin/env node
// Names and files new mock captures. Save an Xbox page with "Webpage, Complete" into
// mock_examples/_inbox/ under any name (or pass paths), then run this: each capture is
// identified from the address it was saved from, renamed by the convention below, its
// <name>_files folder is renamed with it (and the links inside the .html updated), and
// both are moved to mock_examples/#<type>/<market>/. Nothing is ever overwritten.
//
//   Page type   Address after /<locale>/                 Folder      File name
//   wishlist    wishlist                                 #wishlist   yyyyMMdd_HHmm
//   deals       games/browse/DynamicChannel.GameDeals    #deals      yyyyMMdd_HHmm
//   games       games/browse                             #games      yyyyMMdd_HHmm
//   product     games/store/<slug>/<id>                  #products   <id>_yyyyMMdd_HHmm_<slug>
//   add-ons     games/browse/ProductAddOns_<ID>          #addons     <id>_yyyyMMdd_HHmm_<slug of the product>
//   locale      Shell/ChangeLocale                       _locale     yyyyMMdd_HHmm
//
// <market> is the lower-case locale from the address (en-za). The time is the capture's
// created time (or modified time if that is earlier, as for copied files). A name that
// already follows the convention keeps its time and any trailing tag (20260924_1542_Dark).
//
// Usage: node tools/mock-harness/file-mocks.js [--dry-run] [--prepare] [--tag <Tag>] [paths...]
//   paths      .html captures (default: every .html in mock_examples/_inbox/)
//   --dry-run  show what would happen, change nothing
//   --prepare  afterwards run prepare-fixture.js so the harness pages are up to date
//   --tag      suffix for non-product names, e.g. --tag Dark -> 20260924_1542_Dark

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MOCK_ROOT = path.join(REPO_ROOT, 'mock_examples');
const INBOX = path.join(MOCK_ROOT, '_inbox');
const SLUG_MAX = 70;

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const tagIdx = args.indexOf('--tag');
const TAG = tagIdx >= 0 ? args[tagIdx + 1] : '';
const inputs = args.filter((a, i) => !a.startsWith('--') && i !== tagIdx + 1);
const DRY = flag('--dry-run');

const pad = n => String(n).padStart(2, '0');
function stamp(file) {
    const s = fs.statSync(file), d = new Date(Math.min(s.birthtimeMs, s.mtimeMs));
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
const cleanSlug = s => {
    let slug = s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (slug.length > SLUG_MAX) slug = slug.slice(0, SLUG_MAX).replace(/-[^-]*$/, '');
    return slug;
};

// Returns { type, folder, id?, slug? } from the address the page was saved from, or null
function classify(url) {
    let u;
    try { u = new URL(url); } catch (ex) { return null; }
    const parts = u.pathname.split('/').filter(Boolean);
    const loc = parts.shift();
    if (!/^[a-z]{2,3}(-[a-z]{4})?-[a-z]{2}$/i.test(loc || '')) return null;
    const market = loc.toLowerCase(), rest = parts.join('/').toLowerCase();
    let m;
    if (rest === 'wishlist' || rest.startsWith('wishlist/')) return { type: 'wishlist', dir: '#wishlist', market };
    if (rest === 'shell/changelocale') return { type: 'locale', dir: '_locale', market };
    if (rest === 'games/browse/dynamicchannel.gamedeals') return { type: 'deals', dir: '#deals', market };
    if (rest === 'games/browse') return { type: 'games', dir: '#games', market };
    if ((m = /^games\/browse\/productaddons_([0-9a-z]{12})$/.exec(rest))) return { type: 'addons', dir: '#addons', market, id: m[1] };
    if ((m = /^games\/store\/([^/]+)\/([0-9a-z]{12})/.exec(rest))) return { type: 'products', dir: '#products', market, id: m[2], slug: m[1] };
    return null;
}

// Slug for an add-ons page comes from the product page it belongs to (same product id)
function knownSlug(id) {
    const dir = path.join(MOCK_ROOT, '#products');
    if (!fs.existsSync(dir)) return null;
    for (const mk of fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory())) {
        const hit = fs.readdirSync(path.join(dir, mk.name)).find(f => f.startsWith(id + '_') && f.endsWith('.html'));
        if (hit) return hit.replace(/\.html$/, '').replace(/^[0-9a-z]{12}_\d{8}_\d{4}_/, '');
    }
    return null;
}

function targetName(info, file) {
    const base = path.basename(file, '.html');
    if (info.id) {
        if (new RegExp(`^${info.id}_\\d{8}_\\d{4}_.+`).test(base)) return base;
        const slug = cleanSlug(info.slug || knownSlug(info.id) || 'unknown');
        return `${info.id}_${stamp(file)}_${slug}`;
    }
    if (/^\d{8}_\d{4}(_.+)?$/.test(base)) return base;
    return `${stamp(file)}${TAG ? '_' + TAG : ''}`;
}

function collect() {
    if (inputs.length) return inputs.map(p => path.resolve(process.cwd(), p));
    if (!fs.existsSync(INBOX)) { console.log(`Nothing to do: ${path.relative(REPO_ROOT, INBOX)} does not exist. Save captures there (or pass paths).`); return []; }
    return fs.readdirSync(INBOX).filter(f => f.endsWith('.html') && !f.endsWith('.harness.html')).map(f => path.join(INBOX, f));
}

let filed = 0, skipped = 0;
for (const file of collect()) {
    const shown = path.relative(REPO_ROOT, file);
    if (!fs.existsSync(file)) { console.log(`SKIP  ${shown}: not found`); skipped++; continue; }
    const html = fs.readFileSync(file, 'utf8');
    const url = (html.slice(0, 1000).match(/saved from url=\(\d+\)(\S+)/) || [])[1] || '';
    const info = classify(url);
    if (!info) { console.log(`SKIP  ${shown}: cannot tell what page this is (saved from "${url || 'unknown'}"); left where it is`); skipped++; continue; }

    const base = path.basename(file, '.html'), name = targetName(info, file);
    const destDir = path.join(MOCK_ROOT, info.dir, info.market);
    const destHtml = path.join(destDir, name + '.html'), destFiles = path.join(destDir, name + '_files');
    const srcFiles = path.join(path.dirname(file), base + '_files');
    const label = `${info.type}/${info.market}: ${base} -> ${path.relative(MOCK_ROOT, destHtml)}`;
    if (path.resolve(file) === path.resolve(destHtml)) { console.log(`OK    ${shown}: already filed`); continue; }
    if (fs.existsSync(destHtml) || fs.existsSync(destFiles)) { console.log(`SKIP  ${label}: destination exists, not overwritten`); skipped++; continue; }
    if (DRY) { console.log(`WOULD ${label}${fs.existsSync(srcFiles) ? '' : ' (no _files folder)'}`); continue; }

    // Rewrite the links to the _files folder (the browser writes them raw or URL-encoded)
    let out = html, n = 0;
    if (fs.existsSync(srcFiles) && base !== name) {
        const from = base + '_files';
        for (const v of new Set([from, encodeURI(from), encodeURIComponent(from), from.replace(/ /g, '%20')])) {
            const parts = out.split(v); n += parts.length - 1; out = parts.join(name + '_files');
        }
    }
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destHtml, out);
    if (fs.existsSync(srcFiles)) fs.renameSync(srcFiles, destFiles);
    fs.unlinkSync(file);
    console.log(`FILED ${label} (${n} links updated)`);
    filed++;
}
console.log(`${DRY ? 'Dry run: ' : ''}${filed} filed, ${skipped} skipped`);
if (flag('--prepare') && !DRY && filed) {
    spawnSync(process.execPath, [path.join(__dirname, 'prepare-fixture.js')], { stdio: 'inherit' });
}
