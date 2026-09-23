#!/usr/bin/env node
// Zero-dependency static file server rooted at the repo, for exercising
// prepared mock fixtures (see prepare-fixture.js) and the real extension
// source against them without needing to publish to the Chrome Web Store
// or Tampermonkey to test a change.
//
// Usage:
//   node tools/mock-harness/server.js [port]
//   -> then open http://localhost:<port>/mock_examples/%23wishlist/<name>.harness.html

const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.argv[2]) || 8792;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.normalize(path.join(REPO_ROOT, urlPath));

    if (!filePath.startsWith(REPO_ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`Not found: ${urlPath}`);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Mock harness server running at http://localhost:${PORT}`);
    console.log(`Prepared fixtures: http://localhost:${PORT}/mock_examples/%23wishlist/<name>.harness.html`);
});
