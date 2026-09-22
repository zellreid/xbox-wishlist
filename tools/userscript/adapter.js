// Tampermonkey adapter - wires the shared core (inlined above by
// tools/userscript/build.js from browser-extension/src/shared/xbox-wishlist.core.js)
// to this platform's storage/resource APIs.
(function () {
    'use strict';

    const adapter = {
        getVersion: () => (typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown'),
        getResourceUrl: (key) => GM_getResourceURL(key),
        storage: {
            save: (key, value) => GM_setValue(key, value),
            load: (key, callback) => callback(GM_getValue(key) ?? null)
        }
    };

    window.XboxWishlistCore.init(adapter);
})();
