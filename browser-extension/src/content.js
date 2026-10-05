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
        IMGHeart: 'shared/icons/heart.svg',
        IMGExpand: 'shared/icons/expand.svg',
        IMGCollapse: 'shared/icons/collapse.svg',
        // One catalogue per language, loaded for the page's language only (T-26)
        I18N_ar: 'shared/i18n/ar.json',
        I18N_bg: 'shared/i18n/bg.json',
        I18N_bs_Latn: 'shared/i18n/bs-Latn.json',
        I18N_cs: 'shared/i18n/cs.json',
        I18N_da: 'shared/i18n/da.json',
        I18N_de: 'shared/i18n/de.json',
        I18N_el: 'shared/i18n/el.json',
        I18N_es: 'shared/i18n/es.json',
        I18N_et: 'shared/i18n/et.json',
        I18N_fi: 'shared/i18n/fi.json',
        I18N_fr: 'shared/i18n/fr.json',
        I18N_he: 'shared/i18n/he.json',
        I18N_hr: 'shared/i18n/hr.json',
        I18N_hu: 'shared/i18n/hu.json',
        I18N_id: 'shared/i18n/id.json',
        I18N_is: 'shared/i18n/is.json',
        I18N_it: 'shared/i18n/it.json',
        I18N_ja: 'shared/i18n/ja.json',
        I18N_ka: 'shared/i18n/ka.json',
        I18N_ko: 'shared/i18n/ko.json',
        I18N_lt: 'shared/i18n/lt.json',
        I18N_lv: 'shared/i18n/lv.json',
        I18N_mk: 'shared/i18n/mk.json',
        I18N_mt: 'shared/i18n/mt.json',
        I18N_nb: 'shared/i18n/nb.json',
        I18N_nl: 'shared/i18n/nl.json',
        I18N_pl: 'shared/i18n/pl.json',
        I18N_pt: 'shared/i18n/pt.json',
        I18N_ro: 'shared/i18n/ro.json',
        I18N_ru: 'shared/i18n/ru.json',
        I18N_sk: 'shared/i18n/sk.json',
        I18N_sl: 'shared/i18n/sl.json',
        I18N_sq: 'shared/i18n/sq.json',
        I18N_sr_Cyrl: 'shared/i18n/sr-Cyrl.json',
        I18N_sr_Latn: 'shared/i18n/sr-Latn.json',
        I18N_sv: 'shared/i18n/sv.json',
        I18N_th: 'shared/i18n/th.json',
        I18N_tr: 'shared/i18n/tr.json',
        I18N_uk: 'shared/i18n/uk.json',
        I18N_vi: 'shared/i18n/vi.json',
        I18N_zh_Hans: 'shared/i18n/zh-Hans.json',
        I18N_zh_Hant: 'shared/i18n/zh-Hant.json',
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
            },
            // Every stored key (optional; the core uses it to find price history saved for other markets)
            remove: (key) => { if (isAlive()) chrome.storage.local.remove(key); },
            keys: (callback) => {
                if (!isAlive()) { callback([]); return; }
                chrome.storage.local.get(null, (all) => callback(Object.keys(all || {})));
            }
        }
    };

    window.XboxWishlistCore.init(adapter);
})();
