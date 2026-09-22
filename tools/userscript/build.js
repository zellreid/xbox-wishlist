#!/usr/bin/env node
// Builds the single, self-contained xbox-wishlist.user.js at the repo root
// from three source pieces:
//   1. header.template.js - the userscript metadata block
//   2. browser-extension/src/shared/xbox-wishlist.core.js - the shared logic
//   3. adapter.js - the Tampermonkey (GM_*) adapter that boots it
//
// Why inlined instead of @require-d from GitHub: GreasyFork's code rules
// only allow @require for well-known third-party libraries, not for your
// own application logic pulled from your own repo - the reviewed/published
// code has to be the code that actually runs, not a pointer to something
// that could change independently after publishing. Inlining also means
// there's exactly one file to paste into GreasyFork's code editor and one
// file to install directly, instead of a require chain that needs the
// GitHub raw CDN to be reachable at runtime.
//
// The root xbox-wishlist.user.js is therefore a GENERATED file - edit the
// three sources above, not it directly, then rebuild:
//   node tools/userscript/build.js
//
// See tools/userscript/README.md for the full version+publish workflow.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HEADER_TEMPLATE = path.join(__dirname, 'header.template.js');
const ADAPTER = path.join(__dirname, 'adapter.js');
const VERSION_FILE = path.join(__dirname, 'version.json');
const CORE_JS = path.join(REPO_ROOT, 'browser-extension', 'src', 'shared', 'xbox-wishlist.core.js');
const OUT_FILE = path.join(REPO_ROOT, 'xbox-wishlist.user.js');

function build() {
    const { version } = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    const header = fs.readFileSync(HEADER_TEMPLATE, 'utf8').replace(/\{\{VERSION\}\}/g, version);
    const core = fs.readFileSync(CORE_JS, 'utf8');
    const adapter = fs.readFileSync(ADAPTER, 'utf8');

    const output = [
        header.trimEnd(),
        '',
        '// ============================================================================',
        '// GENERATED FILE - do not edit directly.',
        '// Source: tools/userscript/header.template.js + browser-extension/src/shared/',
        '// xbox-wishlist.core.js + tools/userscript/adapter.js, joined by',
        '// tools/userscript/build.js. Edit those, then run:',
        '//   node tools/userscript/build.js',
        '// ============================================================================',
        '',
        core.trimEnd(),
        '',
        adapter.trimEnd(),
        ''
    ].join('\n');

    fs.writeFileSync(OUT_FILE, output);
    console.log(`Built xbox-wishlist.user.js (v${version})`);
}

build();
