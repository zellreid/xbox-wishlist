// Works out what kind of Xbox page a saved capture is, from the address it was saved from.
// Shared by file-mocks.js (naming/filing new captures) and prepare-fixture.js (falling back to
// this when a capture isn't sitting in its mock_examples/<type>/<market>/ folder yet, e.g. one
// still in _inbox/). Keeping one copy avoids the two scripts drifting apart on what a "product"
// or "add-ons" address looks like.

// Returns { type, dir, market, id?, slug? } from the page's own address, or null if the address
// doesn't match a page type this project has mocks for.
function classify(url) {
    let u;
    try { u = new URL(url); } catch (ex) { return null; }
    const parts = u.pathname.split('/').filter(Boolean);
    const loc = parts.shift();
    if (!/^[a-z]{2,3}(-[a-z]{4})?-[a-z]{2}$/i.test(loc || '')) return null;
    const market = loc.toLowerCase(), rest = parts.join('/').toLowerCase();
    let m;
    if (rest === 'wishlist' || rest.startsWith('wishlist/')) return { type: 'wishlist', dir: 'wishlist', market };
    if (rest === 'shell/changelocale') return { type: 'locale', dir: 'locale', market };
    if (rest === 'games/browse/dynamicchannel.gamedeals') return { type: 'deals', dir: 'deals', market };
    if (rest === 'games/browse') return { type: 'games', dir: 'games', market };
    if ((m = /^games\/browse\/productaddons_([0-9a-z]{12})$/.exec(rest))) return { type: 'addons', dir: 'addons', market, id: m[1] };
    if ((m = /^games\/store\/([^/]+)\/([0-9a-z]{12})/.exec(rest))) return { type: 'products', dir: 'products', market, id: m[2], slug: m[1] };
    return null;
}

module.exports = { classify };
