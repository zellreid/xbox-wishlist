// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.4.26057.1
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @require      https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/xbox-wishlist.core.js?ver=1.4.26057.1
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/styles.css?ver=1.4.26057.1
// @resource     IMGFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/filter.svg
// @resource     IMGSort https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/sort.svg
// @resource     IMGExpand https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @downloadURL  https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.user.js
// @updateURL    https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.meta.js
// ==/UserScript==

// Tampermonkey adapter - wires the shared core (pulled in above via @require)
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
