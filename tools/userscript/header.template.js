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
// @resource     IMGExpand https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @downloadURL  https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.user.js
// @updateURL    https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.meta.js
// ==/UserScript==
