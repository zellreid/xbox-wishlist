#!/usr/bin/env node
// Builds the minified browser extension into dist/extension/ from browser-extension/src/.
//   node tools/build.js          (or: npm run build)
//
// Load unpacked from dist/extension/ (chrome://extensions or edge://extensions), or zip its contents
// for a store upload. browser-extension/src/ stays the readable source and still loads unpacked.
//
// Every JS and CSS file is minified with esbuild (a dev dependency - nothing is added to the extension at
// runtime), JSON is re-serialised without whitespace, and everything else (manifest.json, icons, SVGs) is
// copied as is. Files are minified one by one, not bundled: the scripts are plain classic scripts that
// manifest.json lists in order, and top-level names stay as they are. The Greasy Fork userscript is NOT
// built here - it stays readable (tools/userscript/build.js).

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const REPO_ROOT = path.resolve(__dirname, '..');
const SRC = path.join(REPO_ROOT, 'browser-extension', 'src');
const OUT = path.join(REPO_ROOT, 'dist', 'extension');

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walk(full) : [full];
    });
}

function build() {
    fs.rmSync(OUT, { recursive: true, force: true });
    let before = 0, after = 0;
    const kinds = { js: 0, css: 0, json: 0, copied: 0 };
    for (const file of walk(SRC)) {
        const rel = path.relative(SRC, file), dest = path.join(OUT, rel), ext = path.extname(file).toLowerCase();
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const input = fs.readFileSync(file);
        let output = input;
        if (ext === '.js') {
            output = Buffer.from(esbuild.transformSync(input.toString('utf8'), { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code);
            kinds.js++;
        } else if (ext === '.css') {
            output = Buffer.from(esbuild.transformSync(input.toString('utf8'), { loader: 'css', minify: true, legalComments: 'none' }).code);
            kinds.css++;
        } else if (ext === '.json' && rel !== 'manifest.json') {   // the manifest stays readable: stores and reviewers read it
            output = Buffer.from(JSON.stringify(JSON.parse(input.toString('utf8'))));
            kinds.json++;
        } else kinds.copied++;
        fs.writeFileSync(dest, output);
        before += input.length; after += output.length;
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
    console.log(`Built dist/extension (v${manifest.version}): ${kinds.js} js, ${kinds.css} css, ${kinds.json} json minified, ${kinds.copied} copied`);
    console.log(`${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
}

build();
