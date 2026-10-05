// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      {{VERSION}}
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist*
// @match        https://www.xbox.com/*/games/store/*
// @match        https://www.xbox.com/*/games/browse*
// @match        https://www.xbox.com/*/games/all-games*
// @match        https://www.xbox.com/*/promotions/sales/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/styles.css?ver={{VERSION}}
// @resource     IMGFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/filter.svg
// @resource     IMGSort https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/sort.svg
// @resource     IMGExport https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/export.svg
// @resource     IMGRefresh https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/refresh.svg
// @resource     IMGTheme https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/theme.svg
// @resource     IMGClose https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/close.svg
// @resource     IMGPlus https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/plus.svg
// @resource     IMGPreorder https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/preorder.svg
// @resource     IMGPlayAnywhere https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/play-anywhere.svg
// @resource     IMGStar https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/star.svg
// @resource     IMGStarFilled https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/star-filled.svg
// @resource     IMGHeart https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/heart.svg
// @resource     I18N_ar https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/ar.json
// @resource     I18N_bg https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/bg.json
// @resource     I18N_bs_Latn https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/bs-Latn.json
// @resource     I18N_cs https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/cs.json
// @resource     I18N_da https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/da.json
// @resource     I18N_de https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/de.json
// @resource     I18N_el https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/el.json
// @resource     I18N_es https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/es.json
// @resource     I18N_et https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/et.json
// @resource     I18N_fi https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/fi.json
// @resource     I18N_fr https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/fr.json
// @resource     I18N_he https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/he.json
// @resource     I18N_hr https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/hr.json
// @resource     I18N_hu https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/hu.json
// @resource     I18N_id https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/id.json
// @resource     I18N_is https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/is.json
// @resource     I18N_it https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/it.json
// @resource     I18N_ja https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/ja.json
// @resource     I18N_ka https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/ka.json
// @resource     I18N_ko https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/ko.json
// @resource     I18N_lt https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/lt.json
// @resource     I18N_lv https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/lv.json
// @resource     I18N_mk https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/mk.json
// @resource     I18N_mt https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/mt.json
// @resource     I18N_nb https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/nb.json
// @resource     I18N_nl https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/nl.json
// @resource     I18N_pl https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/pl.json
// @resource     I18N_pt https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/pt.json
// @resource     I18N_ro https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/ro.json
// @resource     I18N_ru https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/ru.json
// @resource     I18N_sk https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/sk.json
// @resource     I18N_sl https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/sl.json
// @resource     I18N_sq https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/sq.json
// @resource     I18N_sr_Cyrl https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/sr-Cyrl.json
// @resource     I18N_sr_Latn https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/sr-Latn.json
// @resource     I18N_sv https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/sv.json
// @resource     I18N_th https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/th.json
// @resource     I18N_tr https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/tr.json
// @resource     I18N_uk https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/uk.json
// @resource     I18N_vi https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/vi.json
// @resource     I18N_zh_Hans https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/zh-Hans.json
// @resource     I18N_zh_Hant https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/i18n/zh-Hant.json
// @resource     IMGExpand https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_info
// @downloadURL  https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.user.js
// @updateURL    https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.meta.js
// ==/UserScript==
