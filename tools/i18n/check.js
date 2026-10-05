#!/usr/bin/env node
// Language catalogue check (T-26).
//
// The English catalogue lives in the core (shared/xbox-wishlist.core.js, `const EN = {...}`); each other language
// is shared/i18n/<code>.json holding only the keys it translates (a missing key shows English). This lists, for
// every language the core knows (`I18N_CODES`), how much is translated and what is wrong:
//   - a file that is missing or is not valid JSON
//   - a key the core does not have
//   - a text whose {placeholders} differ from the English text's
//   - an empty text
//   - an en or em dash (plain hyphens only, repo rule)
//
// Usage:
//   node tools/i18n/check.js            -> one row per language, exit code 1 when anything is wrong
//   node tools/i18n/check.js de         -> the keys still missing for one language
//   node tools/i18n/check.js --keys     -> the English catalogue as key = text

const fs = require('fs');
const path = require('path');

const SHARED = path.resolve(__dirname, '..', '..', 'browser-extension', 'src', 'shared');
const core = fs.readFileSync(path.join(SHARED, 'xbox-wishlist.core.js'), 'utf8');

function block(marker, open, close) {
    const a = core.indexOf(marker);
    if (a < 0) throw new Error('not found in the core: ' + marker);
    const start = core.indexOf(open, a), end = core.indexOf(close, start);
    return core.slice(start, end + close.length);
}
const EN = Function('return ' + block('const EN = {', '{', '\n        }'))();
const CODES = Function('return ' + block('const I18N_CODES = [', '[', ']'))();
const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

if (process.argv.includes('--keys')) {
    Object.entries(EN).forEach(([k, v]) => console.log(k + ' = ' + v));
    process.exit(0);
}

const only = process.argv.slice(2).find(a => !a.startsWith('-'));
const keys = Object.keys(EN);
let problems = 0;
const rows = [];

for (const code of only ? [only] : CODES) {
    const file = path.join(SHARED, 'i18n', code + '.json');
    const issues = [];
    let messages = {};
    if (!fs.existsSync(file)) issues.push('file missing');
    else {
        try { messages = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (ex) { issues.push('invalid JSON: ' + ex.message); }
    }
    Object.entries(messages).forEach(([k, v]) => {
        if (!(k in EN)) issues.push('unknown key ' + k);
        else if (typeof v !== 'string' || !v.trim()) issues.push('empty ' + k);
        else if (/[\u2013\u2014]/.test(v)) issues.push('en/em dash in ' + k);
        else if (placeholders(v) !== placeholders(EN[k])) issues.push('placeholders differ in ' + k + ' (' + placeholders(v) + ' vs ' + placeholders(EN[k]) + ')');
    });
    const done = Object.keys(messages).filter(k => k in EN).length;
    if (only) {
        const missing = keys.filter(k => !(k in messages));
        console.log(code + ': ' + done + ' / ' + keys.length + ' translated; missing (shown in English):\n  ' + missing.join('\n  '));
    }
    rows.push({ code, done, issues });
    problems += issues.length;
}

if (!only) {
    console.log('language'.padEnd(10) + 'translated'.padEnd(14) + 'issues');
    rows.forEach(r => console.log(r.code.padEnd(10) + (r.done + ' / ' + keys.length).padEnd(14) + (r.issues.length ? r.issues.slice(0, 3).join('; ') + (r.issues.length > 3 ? ' ... +' + (r.issues.length - 3) : '') : '')));
    console.log('\n' + CODES.length + ' languages, ' + keys.length + ' keys, ' + problems + ' problems');
}
process.exit(problems ? 1 : 0);
