// Chrome extension adapter - wires the shared core (shared/xbox-wishlist.core.js,
// loaded first by manifest.json) to this platform's storage/resource APIs.
(function () {
    'use strict';

    const RESOURCE_MAP = {
        IMGFilter: 'shared/icons/filter.svg',
        IMGSort: 'shared/icons/sort.svg',
        IMGExport: 'shared/icons/export.svg',
        IMGRefresh: 'shared/icons/refresh.svg',
        IMGClose: 'shared/icons/close.svg',
        IMGPlus: 'shared/icons/plus.svg',
        IMGExpand: 'shared/icons/expand.svg',
        IMGCollapse: 'shared/icons/collapse.svg',
        CSSFilter: null // already declared in manifest.json's content_scripts.css
    };

    const adapter = {
        getVersion: () => chrome.runtime.getManifest().version,
        getResourceUrl: (key) => {
            const path = RESOURCE_MAP[key];
            return path ? chrome.runtime.getURL(path) : null;
        },
        storage: {
            save: (key, value) => chrome.storage.local.set({ [key]: value }),
            load: (key, callback) => chrome.storage.local.get([key], (result) => callback(result[key] ?? null))
        }
    };

    window.XboxWishlistCore.init(adapter);
})();
