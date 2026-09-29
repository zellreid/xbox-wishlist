// T-34 (option C): observes the wishlist page's own network calls for its wishlist add/remove
// mutations, so the isolated-world core can react without a full reload. Declared in
// manifest.json with "world": "MAIN" - runs in the PAGE's own JS context, not the extension's
// isolated world, so it has no access to chrome.* APIs and reaches the core only via a tagged,
// origin-checked window.postMessage (content.js and xbox-wishlist.core.js run in the isolated
// world and can still receive a page-dispatched postMessage - that's the bridge).
//
// Scope (deliberately narrow - see AGENTS.md HITL note and STATUS.md T-34): only wishlist
// add/remove calls, matched by URL only. Runs on the same pages as the core (wishlist, and since
// F-38/F-35 product, browse and deals pages) - an add is made from a game's store page, not the
// wishlist, so the core there passes it on to an open wishlist tab (see watchPageRequests()).
//
// TIER 1 (AGENTS.md 3.2): never reads or forwards auth headers, cookies, or the full response
// body - only a few known-safe fields, kept for our own use, never sent anywhere else.
(function () {
    'use strict';
    const TAG = '__ifcRequestEvent';
    // The host and path Xbox's own wishlist add/remove calls go through (production + staging),
    // confirmed from a real capture (T-35, 2026-09-29): PUT to add, DELETE to remove, no request
    // body - the product and SKU are in the path, e.g.
    //   /xboxcomfd/wishlist/default/product/BTB7HC3ZDL2V/0001?locale=en-ZA&deviceType=desktop
    const WISHLIST_HOST = /emerald(-staging)?\.xboxservices\.com/i;
    const WISHLIST_PATH = /\/wishlist\/[^/]+\/product\/([0-9a-z]{12})(?:\/([0-9a-z]+))?/i;

    function isWishlistMutation(url, method) {
        try {
            const u = new URL(url, location.href);
            return WISHLIST_HOST.test(u.host) && WISHLIST_PATH.test(u.pathname) && /^(PUT|DELETE)$/i.test(method || 'GET');
        } catch (ex) { return false; }
    }

    // Product and SKU id from the call's own address (public catalogue ids, not account data)
    function idsFrom(url) {
        try {
            const m = WISHLIST_PATH.exec(new URL(url, location.href).pathname);
            return m ? { productId: m[1].toUpperCase(), skuId: m[2] || null } : null;
        } catch (ex) { return null; }
    }

    // Only a few known-safe fields ever leave this function - never the raw body (it could carry
    // account or session detail this feature has no use for and should never touch).
    function safeFields(json) {
        if (!json || typeof json !== 'object') return null;
        const picked = {};
        ['productId', 'skuId', 'wishListId', 'wishlistId', 'success', 'result'].forEach(k => { if (k in json) picked[k] = json[k]; });
        return Object.keys(picked).length ? picked : null;
    }

    function report(method, url, status, ok, body) {
        try { window.postMessage({ [TAG]: true, method: method, url: url, status: status, ok: ok, body: safeFields(body), ids: idsFrom(url) }, location.origin); }
        catch (ex) { /* nothing to log to from here - this runs in the page, not the extension */ }
    }

    const realFetch = window.fetch;
    if (typeof realFetch === 'function') {
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : (input && input.url) || '';
            const method = (init && init.method) || (input && typeof input === 'object' && input.method) || 'GET';
            const result = realFetch.apply(this, arguments);
            if (!isWishlistMutation(url, method)) return result;
            return result.then(function (res) {
                res.clone().json()
                    .then(function (body) { report(method, url, res.status, res.ok, body); })
                    .catch(function () { report(method, url, res.status, res.ok, null); });
                return res;
            }).catch(function (ex) { report(method, url, 0, false, null); throw ex; });
        };
    }

    const realOpen = XMLHttpRequest.prototype.open, realSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__ifcMethod = method; this.__ifcUrl = url;
        return realOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        if (isWishlistMutation(this.__ifcUrl, this.__ifcMethod)) {
            this.addEventListener('loadend', () => {
                let body = null;
                try { body = JSON.parse(this.responseText); } catch (ex) { /* not JSON, or empty */ }
                report(this.__ifcMethod, this.__ifcUrl, this.status, this.status >= 200 && this.status < 300, body);
            });
        }
        return realSend.apply(this, arguments);
    };
})();
