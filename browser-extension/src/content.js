// Chrome extension adapter - wires the shared core (shared/xbox-wishlist.core.js,
// loaded first by manifest.json) to this platform's storage/resource APIs.
(function () {
    'use strict';

    const RESOURCE_MAP = {
        IMGFilter: 'shared/icons/filter.svg',
        IMGSort: 'shared/icons/sort.svg',
        IMGExport: 'shared/icons/export.svg',
        IMGRefresh: 'shared/icons/refresh.svg',
        IMGTheme: 'shared/icons/theme.svg',
        IMGClose: 'shared/icons/close.svg',
        IMGPlus: 'shared/icons/plus.svg',
        IMGPreorder: 'shared/icons/preorder.svg',
        IMGPlayAnywhere: 'shared/icons/play-anywhere.svg',
        IMGStar: 'shared/icons/star.svg',
        IMGStarFilled: 'shared/icons/star-filled.svg',
        IMGExpand: 'shared/icons/expand.svg',
        IMGCollapse: 'shared/icons/collapse.svg',
        CSSFilter: null // already declared in manifest.json's content_scripts.css
    };

    // When the extension is reloaded or updated while a wishlist tab stays open, this
    // (old) content script keeps running but every chrome.* call throws "Extension context
    // invalidated". chrome.runtime.id disappears at that point, so check it first and let
    // the core stop cleanly (see isAlive) instead of throwing on every refresh.
    const isAlive = () => { try { return !!(chrome.runtime && chrome.runtime.id); } catch (e) { return false; } };

    const adapter = {
        isAlive,
        getVersion: () => (isAlive() ? chrome.runtime.getManifest().version : 'unknown'),
        getResourceUrl: (key) => {
            const path = RESOURCE_MAP[key];
            return path && isAlive() ? chrome.runtime.getURL(path) : null;
        },
        storage: {
            save: (key, value) => { if (isAlive()) chrome.storage.local.set({ [key]: value }); },
            load: (key, callback) => {
                if (!isAlive()) { callback(null); return; }
                chrome.storage.local.get([key], (result) => callback(result[key] ?? null));
            }
        }
    };

    window.XboxWishlistCore.init(adapter);
})();
