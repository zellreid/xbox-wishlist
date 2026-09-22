#!/usr/bin/env node
// Bumps the userscript version following the scheme documented in
// CHANGELOG.md: major.minor.YYDDD.revision
//   YYDDD = 2-digit year + 3-digit day-of-year (e.g. 2026-02-26 -> 26057)
//   revision = resets to 1 whenever YYDDD changes, otherwise increments
//
// Then rebuilds xbox-wishlist.user.js so @version and the CSS resource's
// ?ver= cache-buster stay in sync automatically - see tools/userscript/README.md.
//
// Also writes the same version string into browser-extension/src/manifest.json
// ("version" is 1-4 dot-separated integers <= 65535 per the Chrome manifest
// spec, which major.minor.YYDDD.revision satisfies) so the extension and
// userscript stop versioning independently - previously tracked as tech
// debt in CHANGELOG.md.
//
// Usage:
//   node tools/userscript/bump-version.js            # same major.minor, bump YYDDD/revision to today
//   node tools/userscript/bump-version.js 1.5         # new major.minor, YYDDD=today, revision=1

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const VERSION_FILE = path.join(__dirname, 'version.json');
const BUILD_SCRIPT = path.join(__dirname, 'build.js');
const MANIFEST_FILE = path.join(__dirname, '..', '..', 'browser-extension', 'src', 'manifest.json');

function todayYYDDD() {
    const now = new Date();
    const year = now.getFullYear() % 100;
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
    return `${String(year).padStart(2, '0')}${String(dayOfYear).padStart(3, '0')}`;
}

function main() {
    const { version: current } = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    const match = current.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!match) throw new Error(`Unexpected version format in version.json: ${current}`);
    let [, major, minor, ydd, revision] = match;

    const override = process.argv[2];
    const today = todayYYDDD();

    if (override) {
        const parts = override.split('.');
        if (parts.length !== 2 || parts.some(p => !/^\d+$/.test(p))) {
            throw new Error(`Expected "major.minor" (e.g. "1.5"), got "${override}"`);
        }
        [major, minor] = parts;
        ydd = today;
        revision = '1';
    } else if (ydd === today) {
        revision = String(Number(revision) + 1);
    } else {
        ydd = today;
        revision = '1';
    }

    const next = `${major}.${minor}.${ydd}.${revision}`;
    fs.writeFileSync(VERSION_FILE, JSON.stringify({ version: next }, null, 2) + '\n');
    console.log(`Version: ${current} -> ${next}`);

    // Surgical string replace (not JSON.parse/stringify) so manifest.json's
    // existing formatting - blank lines between sections, compact arrays -
    // is left untouched; only the version value itself changes.
    const manifestText = fs.readFileSync(MANIFEST_FILE, 'utf8');
    const versionLine = manifestText.match(/^(\s*"version"\s*:\s*")([^"]*)(")/m);
    if (!versionLine) throw new Error(`Could not find a "version" field in ${MANIFEST_FILE}`);
    const manifestBefore = versionLine[2];
    fs.writeFileSync(MANIFEST_FILE, manifestText.replace(versionLine[0], `${versionLine[1]}${next}${versionLine[3]}`));
    console.log(`manifest.json version: ${manifestBefore} -> ${next}`);

    execFileSync(process.execPath, [BUILD_SCRIPT], { stdio: 'inherit' });
}

main();
