#!/usr/bin/env node
// Builds tools/mock-harness/locales.json - every language + region xbox.com offers -
// from a capture of the "change locale" page (xbox.com/<locale>/Shell/ChangeLocale)
// saved to mock_examples/_locale/<market>/<yyyyMMdd_HHmm>.html.
//
// The page lists "Country - Language" buttons per world region but no codes, so each
// button is matched to a code from the locale enum in the page's own JS bundle (by
// native country + language name), with a small hand-kept table for the names that
// do not match (Arabic, Chinese, and a few spelling variants).
//
// Usage: node tools/mock-harness/extract-locales.js [path-to-capture.html]
//        (default: the newest .html under mock_examples/_locale/)

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOCALE_DIR = path.join(REPO_ROOT, 'mock_examples', '_locale');
const OUT = path.join(__dirname, 'locales.json');

// Button labels whose names do not match Intl's native names
const MANUAL = {
    'Bosna-Hersek – Bosanski': 'bs-Latn-BA', 'Česká Republika - Čeština': 'cs-CZ', 'Srbija - Latinica Srpski': 'sr-Latn-RS',
    'Srbija - Srpski': 'sr-Cyrl-RS',   // assumed Cyrillic; not in the enum, so it is reported below
    'Республика Молдова - Русский': 'ru-MD', 'Hong Kong SAR / Macao SAR - English': 'en-HK', 'Indonesia - Bahasa Indonesia': 'id-ID',
    '台灣 - 繁體中文': 'zh-TW', '香港特別行政區/澳門特別行政區 - 繁體中文': 'zh-HK',
    'الجزائر - عربي': 'ar-DZ', 'المغرب - عربي': 'ar-MA', 'البحرين - عربي': 'ar-BH', 'الكويت - عربي': 'ar-KW', 'عمان - عربي': 'ar-OM', 'قطر - عربي': 'ar-QA'
};

function newestCapture() {
    const found = [];
    (function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory() && !e.name.endsWith('_files')) walk(full);
            else if (e.isFile() && e.name.endsWith('.html')) found.push(full);
        }
    })(LOCALE_DIR);
    return found.sort().pop();
}

const decode = s => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

const file = process.argv[2] ? path.resolve(REPO_ROOT, process.argv[2]) : newestCapture();
if (!file) { console.error(`No capture found under ${LOCALE_DIR}`); process.exit(1); }
const html = fs.readFileSync(file, 'utf8');

// The locale enum (e.zhHK="zh-HK", ...) lives in one of the saved bundles
const filesDir = file.replace(/\.html$/, '_files');
let codes = [];
for (const f of fs.readdirSync(filesDir).filter(n => /\.js/.test(n))) {
    const found = [...fs.readFileSync(path.join(filesDir, f), 'utf8').matchAll(/e\.[A-Za-z]+="([a-z]{2,3}(?:-[A-Za-z]{4})?-[A-Z]{2})"/g)].map(m => m[1]);
    if (found.length > codes.length) codes = [...new Set(found)];
}
if (!codes.length) { console.error('No locale enum found in the capture\'s bundles'); process.exit(1); }

const cand = codes.map(code => {
    const parts = code.split('-'), region = parts[parts.length - 1], lang = parts[0];
    let country = '', language = '';
    try { country = new Intl.DisplayNames([code], { type: 'region' }).of(region); language = new Intl.DisplayNames([code], { type: 'language' }).of(lang); } catch (ex) { /* unmatched below */ }
    return { code, country, language };
});

const groups = [];
const re = /<p>([^<]+)<\/p><\/div><\/div>((?:<div class="Row-module__row___r31Z2"><button role="link"[^>]*>[^<]*<\/button><\/div>)+)/g;
let m;
while ((m = re.exec(html))) groups.push([decode(m[1]), [...m[2].matchAll(/>([^<]+)<\/button>/g)].map(x => decode(x[1]))]);

const locales = [], problems = [];
for (const [group, labels] of groups) {
    for (const label of labels) {
        let code = MANUAL[label];
        if (!code) {
            const [country, language] = label.split(/ - (.+)/);
            const hit = cand.filter(c => c.country && norm(c.country) === norm(country) && c.language && norm(c.language).startsWith(norm(language || '').slice(0, 4)));
            if (hit.length === 1) code = hit[0].code; else problems.push(`${label} => ${hit.map(h => h.code).join(',') || 'no match'}`);
        }
        if (!code) continue;
        if (!codes.includes(code)) problems.push(`${label} => ${code} is not in the locale enum`);
        const parts = code.split('-');
        locales.push({ code, language: parts[0], region: parts[parts.length - 1], script: parts.length === 3 ? parts[1] : null, group, label });
    }
}
const unused = codes.filter(c => !locales.some(l => l.code === c));

fs.writeFileSync(OUT, JSON.stringify({ source: path.relative(REPO_ROOT, file).split(path.sep).join('/'), count: locales.length, locales }, null, 2) + '\n');
console.log(`${locales.length} locales -> ${path.relative(REPO_ROOT, OUT)} (from ${path.relative(REPO_ROOT, file)})`);
if (problems.length) console.log('Unmatched:\n  ' + problems.join('\n  '));
if (unused.length) console.log(`In the enum but not on the page (${unused.length}): ${unused.join(', ')}`);
