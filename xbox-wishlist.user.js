// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.5.26268.6
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/styles.css?ver=1.5.26268.6
// @resource     IMGFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/filter.svg
// @resource     IMGSort https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/sort.svg
// @resource     IMGExport https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/export.svg
// @resource     IMGRefresh https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/refresh.svg
// @resource     IMGTheme https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/theme.svg
// @resource     IMGClose https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/close.svg
// @resource     IMGPlus https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/plus.svg
// @resource     IMGPreorder https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/preorder.svg
// @resource     IMGPlayAnywhere https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/play-anywhere.svg
// @resource     IMGExpand https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/icons/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @downloadURL  https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.user.js
// @updateURL    https://update.greasyfork.org/scripts/567587/XBOX%20Wishlist.meta.js
// ==/UserScript==

// ============================================================================
// GENERATED FILE - do not edit directly.
// Source: tools/userscript/header.template.js + browser-extension/src/shared/
// xbox-wishlist.core.js + tools/userscript/adapter.js, joined by
// tools/userscript/build.js. Edit those, then run:
//   node tools/userscript/build.js
// ============================================================================

// ==================== XBOX WISHLIST - SHARED CORE ====================
// Platform-agnostic filtering/sorting logic shared by the browser extension
// and the Tampermonkey userscript. Neither platform's globals (chrome.*,
// GM_*) are referenced here - callers supply an `adapter`:
//
//   adapter.getVersion()                 -> string
//   adapter.getResourceUrl(key)          -> url string | null
//       keys: 'CSSFilter', 'IMGFilter', 'IMGSort', 'IMGExpand', 'IMGCollapse'
//   adapter.storage.save(key, value)     -> void
//   adapter.storage.load(key, callback)  -> callback(value | null)
//
window.XboxWishlistCore = {
    init(adapter) {
        'use strict';

        // ==================== STATE MANAGEMENT ====================
        const state = {
            scripts: [], styles: [],
            svgCache: new Map(), elementCache: new Map(),
            theme: null,   // F-39: 'light' | 'dark' chosen with the toolbar button; null = follow Xbox
            ui: {
                floatButtons: false, lblFilter: false, btnFilter: false, btnSort: false, btnExport: false, btnTheme: false, btnRefresh: false,
                divFilter: false, divSort: false, divFilterShow: false, divSortShow: false,
                tagContainer: false, complete: false, lowestItemId: null, contextLost: false,
                listSearch: {}   // typeahead text per checkbox list id (Publishers, Genres)
            },
            filters: {
                totalCount: 0, filteredCount: 0, activeTags: [],
                search: { term: '' },
                owned: { selected: [], options: ['Owned', 'Not Owned', 'Un-Purchasable'] },
                publishers: { selected: [], list: new Map() },
                subscriptions: { selected: [], list: new Map() },
                // From the page's embedded product data (F-33)
                genres: { selected: [], list: new Map() },
                inPass: false,
                // F-34
                platforms: { selected: [], list: new Map() },
                justForYou: false,
                preorder: false,
                hasAddOns: false,   // F-40: games with add-ons (DLC) on the store
                // F-36: capability labels; an item must have ALL selected ones
                capabilities: { selected: [], list: new Map() },
                // Item type: Game / DLC / Consumable (any selected matches)
                types: { selected: [], list: new Map() },
                priceRange: { min: 0, max: 3000, currentMin: 0, currentMax: 3000, enabled: false },
                discountRange: { min: 0, max: 100, currentMin: 0, currentMax: 100, enabled: false }
            },
            sort: {
                criteria: [{ field: 'ifcId', order: 'desc', label: 'Default' }],
                fields: [
                    { value: 'ifcId', label: 'Default' }, { value: 'ifcName', label: 'Name' },
                    { value: 'ifcPublisher', label: 'Publisher' }, { value: 'ifcPrice', label: 'Price' },
                    { value: 'ifcPriceDiscountPercent', label: 'Discount %' },
                    { value: 'ifcPriceDiscountAmount', label: 'Discount Amount' },
                    { value: 'ifcRating', label: 'Rating' },
                    { value: 'ifcReleaseDate', label: 'Release Date' },
                    { value: 'ifcDealEnds', label: 'Deal Ends' }
                ]
            },
            // Named filter combinations (F-23): [{ name, filters }] - see snapshotFilters()
            savedPresets: [],
            // Product summaries by upper-case product id (F-33) - see loadProductData(); not persisted
            productData: new Map(), productDataLoadedAt: null,
            // Product-page capabilities by upper-case product id: { caps: { key: label }, at: ms } (F-36)
            capCache: {},
            details: { running: false, cancel: false, done: 0, total: 0, failed: 0, message: '',
                itemStatus: {} }   // per product id: { busy, at, error } for the item refresh buttons
        };
        window.injected = state;

        // ==================== CONFIGURATION ====================
        const CONFIG = {
            selectors: {
                content: 'PageContent',
                items: null, buttons: null, imageContainer: null,
                productDetails: null, productLink: null,
                productPublisher: null, productPrices: null,
                filterGroups: '.filter-groups'
            },
            ids: {
                buttonContainer: 'ifc_ButtonContainer',
                filterContainer: 'injectedFilterControls',
                sortContainer: 'injectedSortControls',
                filterLabel: 'ifc_lbl_Filter',
                filterButton: 'ifc_btn_Filter',
                sortButton: 'ifc_btn_Sort',
                exportButton: 'ifc_btn_Export',
                exportMenu: 'ifc_export_menu',
                refreshButton: 'ifc_btn_Refresh',
                themeButton: 'ifc_btn_Theme',
                tagContainer: 'ifc_tag_container',
                clearButton: 'ifc_btn_ClearAll',
                searchInput: 'ifc_input_search',
                publisherSearch: 'ifc_input_publisher_search',
                genreSearch: 'ifc_input_genre_search',
                quickFilters: 'ifc_quick_filters',
                savedPresets: 'ifc_saved_presets',
                savedPresetsList: 'ifc_saved_presets_list',
                savedPresetName: 'ifc_input_preset_name',
                savedPresetSave: 'ifc_btn_SavePreset',
                ownedSelect: 'ifc_select_owned',
                publishersSelect: 'ifc_select_publishers',
                subscriptionsSelect: 'ifc_select_subscriptions',
                genresSelect: 'ifc_select_genres',
                platformsSelect: 'ifc_select_platforms',
                capabilitiesSelect: 'ifc_select_capabilities',
                typesSelect: 'ifc_select_types',
                detailsButton: 'ifc_btn_LoadDetails',
                detailsStatus: 'ifc_details_status',
                priceSlider: 'ifc_slider_price',
                discountSlider: 'ifc_slider_discount'
            },
            classes: { button: [], svgIcon: [], activeButton: null },
            // capsKey: per-product capability cache (F-36), kept apart from the filter state
            storage: { key: 'ifc_xbox_wishlist', capsKey: 'ifc_xbox_wishlist_caps' }
        };

        // ==================== SELECTOR PREFIXES ====================
        const PREFIXES = {
            itemContainer: 'WishlistProductItem-module__itemContainer___',
            menuContainer: 'WishlistPage-module__menuContainer___',
            imageContainer: 'WishlistProductItem-module__imageContainer___',
            productDetails: 'WishlistProductItem-module__productDetails___',
            altText: 'WishlistProductItem-module__altText___',
            priceBaseContainer: 'Price-module__priceBaseContainer___',
            originalPrice: 'Price-module__originalPrice___',
            discountPrice: 'Price-module__listedDiscountPrice___',
            boldText: 'Price-module__boldText___',
            menuButton: 'WishlistPage-module__wishlistMenuButton___',
            pageIcon: 'WishlistPage-module__icon___',
            btnIconBase: 'Button-module__iconButtonBase___',
            btnBorderRadius: 'Button-module__basicBorderRadius___',
            btnSizeIcon: 'Button-module__sizeIconButtonMedium___',
            btnBase: 'Button-module__buttonBase___',
            btnNoUnderline: 'Button-module__textNoUnderline___',
            btnTypeSecondary: 'Button-module__typeSecondary___',
            btnOverlaySolid: 'Button-module__overlayModeSolid___',
            btnIcon: 'Button-module__buttonIcon___',
            btnNoMargin: 'Button-module__noMargin___',
            iconBase: 'Icon-module__icon___',
            iconXXSmall: 'Icon-module__xxSmall___',
            discountTag: 'Price-module__discountTag___',
            afterPriceTextContainer: 'Price-module__afterPriceTextContainer___',
            appBackground: 'appBackground',   // the store app's wrapper, which carries the dark-theme mark (F-39)
        };

        // ==================== INITIALIZATION ====================
        async function initialize() {
            try {
                await addStyle(adapter.getResourceUrl('CSSFilter'));
                await loadFilterState();
                // The saved light/dark choice (F-39), as early as possible to avoid a flash
                enforceTheme(); watchThemeMarks();
                // Parse this page's embedded product data once (local, ~20 ms) so the first
                // updateScreen() can attach rating/genre/release/deal data to every item
                await loadProductData();
                // Capabilities fetched on earlier visits via "Load details" (F-36)
                await loadCapabilityCache();
                const ce = getElement(`#${CONFIG.selectors.content}`, false);
                const target = ce || document.body;
                observer.observe(target, { childList: true, subtree: true });
            } catch (ex) { console.error('Failed to initialize script:', ex); }
        }

        async function onDOMReady() {
            if (state.ui.complete) return;
            if (!resolveSelectors()) return;
            if (!document.getElementsByClassName(CONFIG.selectors.items).length) return;
            try {
                floatButtons();
                await addFilterControls();
                removeUnwantedControls();
                state.ui.complete = true;
                updateScreen();
                console.log(`[XBOX Wishlist] v${adapter.getVersion()} initialized successfully!`);
            } catch (ex) { console.error('Failed to initialize UI:', ex); }
            observer.disconnect();
        }

        // ==================== RESILIENT SELECTOR RESOLVER ====================
        const SELECTOR_CACHE = new Map();

        function resolveClass(prefix) {
            if (SELECTOR_CACHE.has(prefix)) return SELECTOR_CACHE.get(prefix);
            const el = document.querySelector(`[class*="${prefix}"]`);
            if (el) {
                const match = Array.from(el.classList).find(c => c.startsWith(prefix));
                if (match) { SELECTOR_CACHE.set(prefix, match); return match; }
            }
            SELECTOR_CACHE.set(prefix, null);
            return null;
        }

        function clearSelectorCache() { SELECTOR_CACHE.clear(); }

        function resolveSelectors() {
            clearSelectorCache();
            const itemClass = resolveClass(PREFIXES.itemContainer);
            const menuClass = resolveClass(PREFIXES.menuContainer);
            const imgContainerClass = resolveClass(PREFIXES.imageContainer);
            const prodDetailsClass = resolveClass(PREFIXES.productDetails);
            const altTextClass = resolveClass(PREFIXES.altText);
            resolveClass(PREFIXES.priceBaseContainer);
            resolveClass(PREFIXES.originalPrice);
            resolveClass(PREFIXES.discountPrice);
            resolveClass(PREFIXES.boldText);

            if (!itemClass) {
                console.warn('[XBOX Wishlist] Could not resolve itemContainer class. DOM may not be ready.');
                return false;
            }

            CONFIG.selectors.items = itemClass;
            CONFIG.selectors.buttons = menuClass;
            CONFIG.selectors.imageContainer = imgContainerClass ? `.${CSS.escape(imgContainerClass)} a img` : null;
            CONFIG.selectors.productDetails = prodDetailsClass ? `.${CSS.escape(prodDetailsClass)}` : null;
            CONFIG.selectors.productLink = prodDetailsClass ? `.${CSS.escape(prodDetailsClass)} a` : null;
            CONFIG.selectors.productPublisher = altTextClass ? `.${CSS.escape(altTextClass)}` : (prodDetailsClass ? `.${CSS.escape(prodDetailsClass)} p` : null);
            CONFIG.selectors.productPrices = prodDetailsClass ? `.${CSS.escape(prodDetailsClass)} div span` : null;

            // A shared (public) wishlist has no menu buttons of its own to copy the look from,
            // so our toolbar then uses its own classes, which mirror Xbox's in styles.css
            const menuButtonClass = resolveClass(PREFIXES.menuButton);
            CONFIG.classes.button = menuButtonClass ? [
                menuButtonClass, resolveClass(PREFIXES.btnIconBase),
                resolveClass(PREFIXES.btnBorderRadius), resolveClass(PREFIXES.btnSizeIcon),
                resolveClass(PREFIXES.btnBase), resolveClass(PREFIXES.btnNoUnderline),
                resolveClass(PREFIXES.btnTypeSecondary), resolveClass(PREFIXES.btnOverlaySolid)
            ].filter(Boolean) : ['ifc-toolbar-button'];

            CONFIG.classes.svgIcon = menuButtonClass ? [
                resolveClass(PREFIXES.btnIcon), resolveClass(PREFIXES.btnNoMargin),
                resolveClass(PREFIXES.pageIcon), resolveClass(PREFIXES.iconBase),
                resolveClass(PREFIXES.iconXXSmall)
            ].filter(Boolean) : ['ifc-toolbar-icon'];

            CONFIG.classes.activeButton = 'ifc-active-button';

            console.log('[XBOX Wishlist] Selectors resolved:', {
                items: CONFIG.selectors.items, buttons: CONFIG.selectors.buttons,
                buttonClasses: CONFIG.classes.button.length, isPublicWishlist: !CONFIG.selectors.buttons
            });
            return true;
        }

        // ==================== UTILITY FUNCTIONS ====================
        function getElement(selector, useCache = true) {
            if (!selector) return null;
            // Only reuse a cached element while it's still in the page - the store app re-renders
            // the wishlist on in-app navigation, which detaches (e.g.) the toolbar we cached
            if (useCache && state.elementCache.has(selector)) {
                const cached = state.elementCache.get(selector);
                if (cached && cached.isConnected) return cached;
                state.elementCache.delete(selector);
            }
            const element = document.querySelector(selector);
            if (element && useCache) state.elementCache.set(selector, element);
            return element;
        }
        function clearElementCache() { state.elementCache.clear(); }
        function addClasses(element, classes) { if (element && classes?.length) element.classList.add(...classes); }
        function setDataAttribute(element, key, value) {
            try { element.dataset[key] = value ?? null; }
            catch (ex) { console.error(`Failed to set data attribute ${key}:`, ex); element.dataset[key] = null; }
        }
        function safeQuerySelector(container, selector, defaultValue = null) {
            try { return container.querySelector(selector) ?? defaultValue; }
            catch (ex) { return defaultValue; }
        }
        function formatCurrency(value) { return `R ${value.toFixed(2)}`; }
        function formatPercentage(value) { return `${Math.round(value)}%`; }

        // ==================== RESOURCE MANAGEMENT ====================
        async function addScript(src) {
            if (!src || isResourceAdded(state.scripts, src)) return { success: true };
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.type = 'text/javascript'; script.src = src;
                script.onload = () => { state.scripts.push(script); resolve({ success: true }); };
                script.onerror = () => reject(new Error(`Script load error: ${src}`));
                document.head.appendChild(script);
            });
        }
        async function addStyle(href) {
            if (!href || isResourceAdded(state.styles, href)) return { success: true };
            return new Promise((resolve, reject) => {
                const style = document.createElement('link');
                style.rel = 'stylesheet'; style.type = 'text/css'; style.href = href;
                style.onload = () => { state.styles.push(style); resolve({ success: true }); };
                style.onerror = () => reject(new Error(`Style load error: ${href}`));
                document.head.appendChild(style);
            });
        }
        function isResourceAdded(resourceArray, url) {
            if (!resourceArray || !Array.isArray(resourceArray)) return false;
            return resourceArray.some(r => r.src === url || r.href === url);
        }
        async function getSVG(src) {
            if (state.svgCache.has(src)) return state.svgCache.get(src);
            try {
                const response = await fetch(src);
                // Don't cache an error page as the icon - a later call can retry
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const text = await response.text();
                state.svgCache.set(src, text);
                return text;
            } catch (ex) { console.error(`Failed to fetch SVG from ${src}:`, ex); return null; }
        }

        // ==================== STATE PERSISTENCE ====================
        function saveFilterState() {
            try {
                const saveData = {
                    ...state.filters,
                    owned: { selected: state.filters.owned.selected, options: state.filters.owned.options },   // counts are rebuilt
                    publishers: { selected: state.filters.publishers.selected, list: Array.from(state.filters.publishers.list.entries()) },
                    subscriptions: { selected: state.filters.subscriptions.selected, list: Array.from(state.filters.subscriptions.list.entries()) },
                    genres: { selected: state.filters.genres.selected },   // list is rebuilt from the items
                    platforms: { selected: state.filters.platforms.selected },
                    capabilities: { selected: state.filters.capabilities.selected },
                    types: { selected: state.filters.types.selected },
                    sort: { criteria: state.sort.criteria },
                    presets: state.savedPresets,
                    theme: state.theme
                };
                adapter.storage.save(CONFIG.storage.key, JSON.stringify(saveData));
            } catch (ex) { console.error('Failed to save filter state:', ex); }
        }

        // Resolves once the saved state is in `state` - initialize() awaits this so the
        // UI is never built (and saveFilterState() never runs) on the empty defaults,
        // which used to overwrite the saved filters when chrome.storage answered late.
        function loadFilterState() {
            return new Promise(resolve => { try { adapter.storage.load(CONFIG.storage.key, (saved) => {
                try {
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (parsed && typeof parsed === 'object') {
                            // search.term is intentionally not restored - it starts fresh
                            // each page load. Price/discount ranges ARE restored (including
                            // `enabled`) and re-applied to the live range by rerangeSelection()
                            // when the sliders are built.
                            if (parsed.owned) {
                                state.filters.owned.selected = Array.isArray(parsed.owned.selected) ? parsed.owned.selected : [];
                                if (Array.isArray(parsed.owned.options)) state.filters.owned.options = parsed.owned.options;
                            }
                            if (parsed.publishers) {
                                state.filters.publishers.selected = Array.isArray(parsed.publishers.selected) ? parsed.publishers.selected : [];
                                if (Array.isArray(parsed.publishers.list)) state.filters.publishers.list = new Map(parsed.publishers.list);
                            }
                            if (parsed.subscriptions) {
                                state.filters.subscriptions.selected = Array.isArray(parsed.subscriptions.selected) ? parsed.subscriptions.selected : [];
                                if (Array.isArray(parsed.subscriptions.list)) state.filters.subscriptions.list = new Map(parsed.subscriptions.list);
                            }
                            if (parsed.genres && Array.isArray(parsed.genres.selected)) {
                                state.filters.genres.selected = parsed.genres.selected.filter(g => typeof g === 'string');
                            }
                            if (typeof parsed.inPass === 'boolean') state.filters.inPass = parsed.inPass;
                            if (parsed.platforms && Array.isArray(parsed.platforms.selected)) {
                                state.filters.platforms.selected = parsed.platforms.selected.filter(p => typeof p === 'string');
                            }
                            if (typeof parsed.justForYou === 'boolean') state.filters.justForYou = parsed.justForYou;
                            if (parsed.theme === 'light' || parsed.theme === 'dark') state.theme = parsed.theme;
                            if (typeof parsed.preorder === 'boolean') state.filters.preorder = parsed.preorder;
                            if (typeof parsed.hasAddOns === 'boolean') state.filters.hasAddOns = parsed.hasAddOns;
                            if (parsed.capabilities && Array.isArray(parsed.capabilities.selected)) {
                                state.filters.capabilities.selected = parsed.capabilities.selected.filter(c => typeof c === 'string');
                            }
                            if (parsed.types && Array.isArray(parsed.types.selected)) {
                                state.filters.types.selected = parsed.types.selected.filter(t => typeof t === 'string');
                            }
                            if (parsed.priceRange && typeof parsed.priceRange === 'object') {
                                state.filters.priceRange = { ...state.filters.priceRange, ...parsed.priceRange, enabled: parsed.priceRange.enabled === true };
                            }
                            if (parsed.discountRange && typeof parsed.discountRange === 'object') {
                                state.filters.discountRange = { ...state.filters.discountRange, ...parsed.discountRange, enabled: parsed.discountRange.enabled === true };
                            }
                            if (typeof parsed.totalCount === 'number') state.filters.totalCount = parsed.totalCount;
                            if (typeof parsed.filteredCount === 'number') state.filters.filteredCount = parsed.filteredCount;
                            if (Array.isArray(parsed.activeTags)) state.filters.activeTags = parsed.activeTags;
                            // Only accept known fields/orders (max 3 levels, as the UI allows);
                            // labels come from state.sort.fields, not from storage.
                            if (parsed.sort && Array.isArray(parsed.sort.criteria)) {
                                const criteria = parsed.sort.criteria.slice(0, 3).map(c => {
                                    const sf = c && state.sort.fields.find(f => f.value === c.field);
                                    return sf && (c.order === 'asc' || c.order === 'desc') ? { field: sf.value, order: c.order, label: sf.label } : null;
                                });
                                if (criteria.length > 0 && criteria.every(Boolean)) state.sort.criteria = criteria;
                            }
                            if (Array.isArray(parsed.presets)) {
                                state.savedPresets = parsed.presets.map(normalizePreset).filter(Boolean).slice(0, MAX_SAVED_PRESETS);
                            }
                        }
                    }
                } catch (ex) {
                    console.error('Failed to load filter state:', ex);
                }
                resolve();
            }); } catch (ex) {
                // Storage unavailable (e.g. private mode) - start from defaults rather than block init
                console.error('Failed to load filter state:', ex);
                resolve();
            } });
        }

        // ==================== TAG MANAGEMENT ====================
        function updateActiveTags() {
            const tags = [];
            if (state.filters.search.term.trim() !== '') {
                tags.push({ type: 'search', value: 'search', label: `Search: "${state.filters.search.term.trim()}"` });
            }
            state.filters.owned.selected.forEach(item => {
                const count = state.filters.owned.counts ? (state.filters.owned.counts.get(item) || 0) : null;
                tags.push({ type: 'owned', value: item, label: count === null ? item : `${item} (${count})` });
            });
            state.filters.publishers.selected.forEach(pub => {
                const count = state.filters.publishers.list.get(pub) || 0;
                tags.push({ type: 'publisher', value: pub, label: `${pub} (${count})` });
            });
            state.filters.subscriptions.selected.forEach(sub => {
                const count = state.filters.subscriptions.list.get(sub) || 0;
                tags.push({ type: 'subscription', value: sub, label: `${sub} (${count})` });
            });
            state.filters.genres.selected.forEach(g => {
                const count = state.filters.genres.list.get(g) || 0;
                tags.push({ type: 'genre', value: g, label: `${g} (${count})` });
            });
            if (state.filters.inPass) tags.push({ type: 'inPass', value: 'inPass', label: 'In a pass' });
            state.filters.platforms.selected.forEach(pl => {
                const count = state.filters.platforms.list.get(pl) || 0;
                tags.push({ type: 'platform', value: pl, label: `${pl} (${count})` });
            });
            if (state.filters.justForYou) tags.push({ type: 'justForYou', value: 'justForYou', label: 'Just for you' });
            if (state.filters.preorder) tags.push({ type: 'preorder', value: 'preorder', label: 'Pre-order' });
            if (state.filters.hasAddOns) tags.push({ type: 'hasAddOns', value: 'hasAddOns', label: 'Has add-ons' });
            state.filters.capabilities.selected.forEach(cap => {
                const count = state.filters.capabilities.list.get(cap) || 0;
                tags.push({ type: 'capability', value: cap, label: `${cap} (${count})` });
            });
            state.filters.types.selected.forEach(t => {
                const count = state.filters.types.list.get(t) || 0;
                tags.push({ type: 'itemType', value: t, label: `${t} (${count})` });
            });
            if (state.filters.priceRange.enabled) {
                const { currentMin, currentMax } = state.filters.priceRange;
                tags.push({ type: 'price', value: 'price', label: `Price: ${formatCurrency(currentMin)} - ${formatCurrency(currentMax)}` });
            }
            if (state.filters.discountRange.enabled) {
                const { currentMin, currentMax } = state.filters.discountRange;
                tags.push({ type: 'discount', value: 'discount', label: `Discount: ${formatPercentage(currentMin)} - ${formatPercentage(currentMax)}` });
            }
            state.filters.activeTags = tags;
            renderTags();
            const clearBtn = getElement(`#${CONFIG.ids.clearButton}`);
            if (clearBtn) clearBtn.classList.toggle('ifc-hidden', tags.length === 0);
        }

        function renderTags() {
            const tagContainer = getElement(`#${CONFIG.ids.tagContainer}`);
            if (!tagContainer) return;
            tagContainer.innerHTML = '';
            tagContainer.classList.toggle('ifc-hidden', state.filters.activeTags.length === 0);
            if (state.filters.activeTags.length === 0) return;
            state.filters.activeTags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'ifc-filter-tag'; tagEl.textContent = tag.label;
                const removeBtn = document.createElement('button');
                removeBtn.className = 'ifc-tag-remove'; setGlyph(removeBtn, 'IMGClose', '×');
                removeBtn.setAttribute('aria-label', `Remove ${tag.label}`);
                removeBtn.onclick = () => removeTag(tag);
                tagEl.appendChild(removeBtn); tagContainer.appendChild(tagEl);
            });
        }

        function removeTag(tag) {
            switch (tag.type) {
                case 'owned':
                    state.filters.owned.selected = state.filters.owned.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.ownedSelect, state.filters.owned.selected); break;
                case 'publisher':
                    state.filters.publishers.selected = state.filters.publishers.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.publishersSelect, state.filters.publishers.selected); break;
                case 'subscription':
                    state.filters.subscriptions.selected = state.filters.subscriptions.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.subscriptionsSelect, state.filters.subscriptions.selected); break;
                case 'genre':
                    state.filters.genres.selected = state.filters.genres.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.genresSelect, state.filters.genres.selected); break;
                case 'inPass': state.filters.inPass = false; break;
                case 'platform':
                    state.filters.platforms.selected = state.filters.platforms.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.platformsSelect, state.filters.platforms.selected); break;
                case 'justForYou': state.filters.justForYou = false; break;
                case 'preorder': state.filters.preorder = false; break;
                case 'hasAddOns': state.filters.hasAddOns = false; break;
                case 'capability':
                    state.filters.capabilities.selected = state.filters.capabilities.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.capabilitiesSelect, state.filters.capabilities.selected); break;
                case 'itemType':
                    state.filters.types.selected = state.filters.types.selected.filter(v => v !== tag.value);
                    updateCheckboxes(CONFIG.ids.typesSelect, state.filters.types.selected); break;
                case 'price': state.filters.priceRange.enabled = false; resetPriceSlider(); break;
                case 'discount': state.filters.discountRange.enabled = false; resetDiscountSlider(); break;
                case 'search': {
                    state.filters.search.term = '';
                    const searchInput = getElement(`#${CONFIG.ids.searchInput}`);
                    if (searchInput) searchInput.value = '';
                    break;
                }
            }
            updateScreen();
        }

        function updateCheckboxes(containerId, selectedValues) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = selectedValues.includes(cb.value); });
        }

        // ==================== CHECKBOX LIST CREATION ====================
        function createCheckboxList(id, options, selected = [], onChange) {
            const container = document.createElement('div');
            container.id = id; container.className = 'ifc-checkbox-list';
            options.forEach(option => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.value = option.value;
                checkbox.checked = selected.includes(option.value); checkbox.className = 'ifc-checkbox';
                checkbox.addEventListener('change', () => { if (onChange) onChange(); });
                const span = document.createElement('span');
                span.className = 'ifc-checkbox-label'; span.textContent = option.label;
                label.appendChild(checkbox); label.appendChild(span); container.appendChild(label);
            });
            return container;
        }
        function getCheckboxValues(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return [];
            return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        }

        // ==================== UI CREATION HELPERS ====================
        function createLabel(id, text) {
            const label = document.createElement('label');
            label.textContent = text; if (id) label.id = `ifc_lbl_${id}`;
            return label;
        }

        function createRangeSlider(id, min, max, currentMin, currentMax, onChange) {
            const container = document.createElement('div');
            container.className = 'ifc-slider-container'; container.id = `${id}_container`;
            const label = document.createElement('div');
            label.className = 'ifc-slider-label'; label.id = `${id}_label`;
            container.appendChild(label);
            const track = document.createElement('div'); track.className = 'ifc-slider-track';
            const range = document.createElement('div');
            range.className = 'ifc-slider-range'; range.id = `${id}_range`;
            track.appendChild(range);
            const minSlider = document.createElement('input');
            minSlider.type = 'range'; minSlider.className = 'ifc-slider ifc-slider-min';
            minSlider.id = `${id}_min`; minSlider.min = min; minSlider.max = max;
            minSlider.value = currentMin; minSlider.step = Math.max(1, Math.round((max - min) / 100));
            const maxSlider = document.createElement('input');
            maxSlider.type = 'range'; maxSlider.className = 'ifc-slider ifc-slider-max';
            maxSlider.id = `${id}_max`; maxSlider.min = min; maxSlider.max = max;
            maxSlider.value = currentMax; maxSlider.step = Math.max(1, Math.round((max - min) / 100));
            track.appendChild(minSlider); track.appendChild(maxSlider); container.appendChild(track);
            let isUserInteraction = false;
            const updateSlider = () => {
                let minVal = parseFloat(minSlider.value), maxVal = parseFloat(maxSlider.value);
                // Read the live bounds - updatePriceSlider()/updateDiscountSlider() move them after creation
                const lo = parseFloat(minSlider.min), hi = parseFloat(minSlider.max);
                // When (hi - lo) isn't a multiple of step, the browser caps the thumb one
                // partial step short of hi - treat that last position as hi so the priciest
                // item isn't silently excluded when the thumb is dragged to the end.
                if (maxVal > hi - (parseFloat(maxSlider.step) || 1)) maxVal = hi;
                if (minVal > maxVal - (hi - lo) * 0.01) { minVal = maxVal - (hi - lo) * 0.01; minSlider.value = minVal; }
                const minPercent = ((minVal - lo) / (hi - lo)) * 100;
                const maxPercent = ((maxVal - lo) / (hi - lo)) * 100;
                range.style.left = `${minPercent}%`; range.style.width = `${maxPercent - minPercent}%`;
                if (onChange && isUserInteraction) onChange(minVal, maxVal);
            };
            const enableUserTracking = () => { isUserInteraction = true; };
            // Without this, isUserInteraction latches true forever after the
            // first real drag: every later PROGRAMMATIC sync (resetPriceSlider,
            // Clear All, quick filters, ...) also dispatches 'input' to move the
            // thumbs visually, and with the flag stuck true that re-fires
            // onChange - which sets enabled back to true, undoing the reset and
            // leaving the tag stuck in the tag bar. Scoping the flag to the
            // actual drag gesture (mousedown/touchstart -> mouseup/touchend)
            // fixes this without affecting real dragging, since a drag's
            // 'input' events all land between those two.
            const disableUserTracking = () => { isUserInteraction = false; };
            minSlider.addEventListener('mousedown', enableUserTracking);
            minSlider.addEventListener('touchstart', enableUserTracking);
            maxSlider.addEventListener('mousedown', enableUserTracking);
            maxSlider.addEventListener('touchstart', enableUserTracking);
            minSlider.addEventListener('mouseup', disableUserTracking);
            minSlider.addEventListener('touchend', disableUserTracking);
            maxSlider.addEventListener('mouseup', disableUserTracking);
            maxSlider.addEventListener('touchend', disableUserTracking);
            minSlider.addEventListener('input', updateSlider);
            maxSlider.addEventListener('input', updateSlider);
            updateSlider();
            return container;
        }

        function createImageButton(id, src, text, type) {
            const button = document.createElement('button');
            if (id) button.id = `ifc_btn_${id}`;
            addClasses(button, CONFIG.classes.button);
            button.title = text; button.setAttribute('aria-label', text);
            button.setAttribute('aria-pressed', 'false');
            button.appendChild(createImageContainer(id, src, text, type));
            return button;
        }
        function createImageContainer(id, src, text, type) {
            const container = document.createElement('div');
            if (id) container.id = `ifc_img_${id}`;
            container.setAttribute('data-ifc-type', type);
            if (type === 'svg') { loadSVGIntoContainer(container, src, id); }
            else { const img = document.createElement('img'); img.src = src; img.alt = text; img.title = text; container.appendChild(img); }
            return container;
        }
        async function loadSVGIntoContainer(container, src, targetId) {
            try {
                const svgText = await getSVG(src);
                if (!svgText) return;
                container.innerHTML = svgText;
                const svg = container.querySelector('svg');
                if (svg) { addClasses(svg, CONFIG.classes.svgIcon); svg.setAttribute('data-ifc-target', targetId); }
            } catch (ex) { console.error('Failed to load SVG into container:', ex); }
        }
        // Small inline icon for a glyph button (×, +). The text fallback shows at once and
        // stays if the SVG can't load; getSVG() caches, so frequent re-renders fetch once.
        // Sized by .ifc-glyph, not Xbox's icon classes (those are toolbar-sized).
        function setGlyph(el, resourceKey, fallback) {
            el.textContent = fallback;
            getSVG(adapter.getResourceUrl(resourceKey)).then(svgText => {
                if (!svgText || el.textContent !== fallback) return;
                const holder = document.createElement('span');
                holder.innerHTML = svgText;
                const svg = holder.querySelector('svg');
                if (!svg) return;
                svg.classList.add('ifc-glyph'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
                el.replaceChildren(svg);
            }).catch(() => { /* keep the text fallback */ });
        }
        async function updateSVGIcon(containerId, resourceKey, targetId) {
            try {
                const svgText = await getSVG(adapter.getResourceUrl(resourceKey));
                if (!svgText) return;
                const container = getElement(`#ifc_img_${containerId}`, false);
                if (!container) return;
                container.innerHTML = svgText;
                const svg = container.querySelector('svg');
                if (svg) { addClasses(svg, CONFIG.classes.svgIcon); svg.setAttribute('data-ifc-target', targetId); }
            } catch (ex) { console.error('Failed to update SVG icon:', ex); }
        }

        // ==================== FILTER UI CREATION ====================
        function floatButtons() {
            if (state.ui.floatButtons) return;
            try {
                let buttonContainer = null;
                // Try to find the native Xbox menu container
                if (CONFIG.selectors.buttons) {
                    buttonContainer = getElement(`.${CSS.escape(CONFIG.selectors.buttons)}`, false);
                }
                // Public/shared wishlist: menuContainer doesn't exist, create our own
                if (!buttonContainer) {
                    console.log('[XBOX Wishlist] Native menu container not found - injecting button container (public wishlist mode)');
                    buttonContainer = document.createElement('div');
                    buttonContainer.className = 'ifc-injected-button-container';
                    document.body.appendChild(buttonContainer);
                }
                buttonContainer.id = CONFIG.ids.buttonContainer;
                // Our toolbar items left by another copy of this code (e.g. extension and userscript
                // both installed, or a page saved with them in) would sit beside ours as dead
                // duplicates - clear them so there is exactly one working set
                buttonContainer.querySelectorAll('[id^="ifc_"]').forEach(el => el.remove());
                state.ui.floatButtons = true;
            } catch (ex) { console.error('Failed to float buttons:', ex); }
        }

        function addFilterLabel() {
            if (state.ui.lblFilter) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                const label = createLabel('Filter', `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`);
                bc.insertBefore(label, bc.firstChild);
                state.ui.lblFilter = true;
            } catch (ex) { console.error('Failed to add filter label:', ex); }
        }
        function addFilterButton() {
            if (state.ui.btnFilter) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                const btn = createImageButton('Filter', adapter.getResourceUrl('IMGFilter'), 'Filter', 'svg');
                // Wired here (not with the panel) so a toolbar re-created after the store app
                // re-renders the wishlist still opens the panel that survived in <body>
                btn.addEventListener('click', toggleFilterContainer);
                bc.appendChild(btn);
                state.ui.btnFilter = true;
            } catch (ex) { console.error('Failed to add filter button:', ex); }
        }
        function addSortButton() {
            if (state.ui.btnSort) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                const btn = createImageButton('Sort', adapter.getResourceUrl('IMGSort'), 'Sort', 'svg');
                btn.addEventListener('click', toggleSortContainer);   // see addFilterButton
                bc.appendChild(btn);
                state.ui.btnSort = true;
            } catch (ex) { console.error('Failed to add sort button:', ex); }
        }

        // ==================== EXPORT (F-24) ====================
        // Exports only the items currently shown (filters applied), in the current sort order.
        function addExportButton() {
            if (state.ui.btnExport) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                const btn = createImageButton('Export', adapter.getResourceUrl('IMGExport'), 'Export', 'svg');
                btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false');
                const menu = document.createElement('div');
                menu.id = CONFIG.ids.exportMenu; menu.className = 'ifc-export-menu ifc-hidden';
                menu.setAttribute('role', 'menu');
                [['csv', 'CSV'], ['json', 'JSON']].forEach(([format, label]) => {
                    const item = document.createElement('button');
                    item.type = 'button'; item.className = 'ifc-export-item'; item.setAttribute('role', 'menuitem');
                    item.dataset.ifcFormat = format; item.dataset.ifcLabel = label;
                    item.addEventListener('click', () => { exportVisibleItems(format); setExportMenuOpen(false); });
                    menu.appendChild(item);
                });
                btn.addEventListener('click', (e) => { e.stopPropagation(); setExportMenuOpen(menu.classList.contains('ifc-hidden')); });
                // Page-wide listeners once only, looking the menu up each time - the toolbar (and
                // this menu) is re-created after the store app re-renders the wishlist
                if (!state.ui.exportDocListeners) {
                    document.addEventListener('click', (e) => {
                        const m = getElement(`#${CONFIG.ids.exportMenu}`, false);
                        if (m && !m.contains(e.target)) setExportMenuOpen(false);
                    });
                    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setExportMenuOpen(false); });
                    state.ui.exportDocListeners = true;
                }
                bc.appendChild(btn); bc.appendChild(menu);
                state.ui.btnExport = true;
            } catch (ex) { console.error('Failed to add export button:', ex); }
        }

        function setExportMenuOpen(open) {
            const menu = getElement(`#${CONFIG.ids.exportMenu}`, false), btn = getElement(`#${CONFIG.ids.exportButton}`, false);
            if (!menu || !btn) return;
            if (open) {
                // Toolbar panels are mutually exclusive: opening Export closes Filter and Sort
                if (state.ui.divFilterShow) setFilterVisible(false);
                if (state.ui.divSortShow) setSortVisible(false);
                // Label with the live count so it's clear only the visible items are exported
                const n = getVisibleItems().length;
                menu.querySelectorAll('.ifc-export-item').forEach(item => {
                    item.textContent = `Export ${n} item${n === 1 ? '' : 's'} as ${item.dataset.ifcLabel}`;
                    item.disabled = n === 0;
                });
            }
            menu.classList.toggle('ifc-hidden', !open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.classList[open ? 'add' : 'remove'](CONFIG.classes.activeButton);
        }

        // ==================== PRODUCT DATA (F-33) ====================
        // Xbox pages embed their app state as `window.__PRELOADED_STATE__ = {...}` in an
        // inline script. The extension's content script runs in an isolated world and
        // can't read page globals, so the state is parsed from the script's text - the
        // same code then works on the live page, on a fetched page, and in the userscript.
        // The wishlist page's state already carries a summary for every wishlisted
        // product, so one read covers the whole list. Nothing in the UI calls this yet:
        // which fields to use, and when to load, is decided per feature (F-26+).
        const STATE_MARKER = '__PRELOADED_STATE__';

        function parseEmbeddedState(doc) {
            try {
                const script = Array.from(doc.querySelectorAll('script')).find(s => s.textContent.includes(STATE_MARKER));
                if (!script) return null;
                const text = script.textContent;
                const start = text.indexOf('{', text.indexOf(STATE_MARKER));
                if (start < 0) return null;
                // The object may be followed by more statements, so find its matching
                // closing brace (ignoring braces inside strings) rather than trimming.
                let depth = 0, inString = false, escaped = false;
                for (let i = start; i < text.length; i++) {
                    const c = text[i];
                    if (inString) {
                        if (escaped) escaped = false;
                        else if (c === '\\') escaped = true;
                        else if (c === '"') inString = false;
                    } else if (c === '"') inString = true;
                    else if (c === '{') depth++;
                    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
                }
                return null;
            } catch (ex) { console.error('Failed to parse embedded page state:', ex); return null; }
        }

        // Any Xbox page that embeds its state (wishlist, product pages, ...). DOMParser
        // never runs scripts, so fetched markup is inert.
        async function fetchPageState(url) {
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
            return parseEmbeddedState(new DOMParser().parseFromString(await response.text(), 'text/html'));
        }

        function productSummariesFrom(pageState) {
            const products = pageState && pageState.core2 && pageState.core2.products;
            const summaries = products && products.productSummaries, skus = products && products.skuSummaries;
            const map = new Map();
            if (summaries && typeof summaries === 'object') {
                Object.values(summaries).forEach(p => {
                    if (!p || !p.productId) return;
                    // Pre-order is per edition (SKU), kept alongside the summary as ifcIsPreorder
                    const editions = skus && skus[p.productId] && typeof skus[p.productId] === 'object' ? Object.values(skus[p.productId]) : [];
                    map.set(String(p.productId).toUpperCase(), { ...p, ifcIsPreorder: editions.some(s => s && s.isPreorder === true) });
                });
            }
            return map;
        }

        // Store names for the platform codes in the product data (F-34)
        const PLATFORM_LABELS = { XboxSeriesX: 'Xbox Series X|S', XboxOne: 'Xbox One', PC: 'PC', Handheld: 'Handheld' };
        // Product kinds in the data: Durable = add-on / DLC, Consumable = in-game items
        const PRODUCT_KIND_LABELS = { Game: 'Game', Durable: 'DLC', Consumable: 'Consumable' };

        // fresh: false reads this page as loaded (no network); true re-fetches the
        // wishlist page for current data. Returns the map (also kept in state).
        async function loadProductData({ fresh = false } = {}) {
            try {
                const pageState = fresh ? await fetchPageState(location.href) : parseEmbeddedState(document);
                const map = productSummariesFrom(pageState);
                state.productData = map; state.productDataLoadedAt = Date.now();
                return map;
            } catch (ex) { console.error('Failed to load product data:', ex); return state.productData; }
        }

        // By product id - items carry theirs as data-ifc-product-id (from the store URL)
        function getProductData(productId) {
            return productId ? state.productData.get(String(productId).toUpperCase()) || null : null;
        }

        // Xbox writes offer end dates as "MM/DD/YYYY HH:MM:SS" in UTC. Full-price offers
        // carry far-future placeholders (year 2799 / 9998), so only a discounted offer's
        // date counts as a deal end - and only while it's still in the future.
        function parseOfferEndUtc(s) {
            const m = typeof s === 'string' && s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
            if (!m) return null;
            const ms = Date.UTC(+m[3], +m[1] - 1, +m[2], +m[4], +m[5], +m[6]);
            return +m[3] < 2100 ? ms : null;
        }

        // Price facts from the product data, by offer. The deal end comes from the biggest
        // current discount (earliest end on a tie). The page exposes no deal *start* date.
        function productOfferFacts(p) {
            const offers = (p && p.specificPrices && Array.isArray(p.specificPrices.purchaseable)) ? p.specificPrices.purchaseable : [];
            const now = Date.now();
            let price = null, msrp = null, deal = null;
            // Deal type (F-34): a personal "Just for you" offer wins over a public sale,
            // which wins over a member price (Game Pass / EA Play ...)
            let personal = null, publicSale = false, member = false;
            offers.forEach(o => {
                if (typeof o.listPrice === 'number') price = price === null ? o.listPrice : Math.min(price, o.listPrice);
                if (typeof o.msrp === 'number') msrp = msrp === null ? o.msrp : Math.max(msrp, o.msrp);
                const ends = o.discountPercentage > 0 ? parseOfferEndUtc(o.endDateUtc) : null;
                if (ends !== null && ends > now && (!deal || o.discountPercentage > deal.pct || (o.discountPercentage === deal.pct && ends < deal.ends))) {
                    deal = { pct: o.discountPercentage, ends };
                }
                if (o.discountPercentage > 0) {
                    const e = o.eligibilityInfo || {};
                    if (o.hasXPriceOffer === true || e.type === 'XPrice') { if (!personal) personal = { reason: e.affirmationMessage || '' }; }
                    else if (e.eligibility === 'Affirmation') member = true;
                    else publicSale = true;
                }
            });
            const dealType = personal ? 'personal' : publicSale ? 'sale' : member ? 'member' : null;
            return { price, msrp, dealEnds: deal ? deal.ends : null, dealType, dealReason: personal ? personal.reason : null };
        }

        // Copies the product-data fields used by filtering/sorting/export onto the item as
        // data attributes, so those keep reading data-ifc-* like every other field.
        // Missing values are stored as "null" and treated as missing (sorted last).
        function setProductDataAttributes(container) {
            const p = getProductData(container.dataset.ifcProductId);
            const release = p && p.releaseDate ? Date.parse(p.releaseDate) : NaN;
            const offer = productOfferFacts(p);
            setDataAttribute(container, 'ifcRating', p && p.ratingCount > 0 ? p.averageRating : null);
            setDataAttribute(container, 'ifcRatingCount', p ? (p.ratingCount || 0) : null);
            setDataAttribute(container, 'ifcGenres', JSON.stringify(p && Array.isArray(p.categories) ? p.categories : []));
            setDataAttribute(container, 'ifcReleaseDate', isNaN(release) ? null : release);
            setDataAttribute(container, 'ifcInPass', !!(p && Array.isArray(p.includedWithPassesProductIds) && p.includedWithPassesProductIds.length > 0));
            // Only for deals the page actually shows this viewer (some discounted offers in
            // the data never render a discount), so sort, badge and export agree
            const shownDiscount = parseFloat(container.dataset.ifcPriceDiscountPercent) > 0;
            const dealEnds = shownDiscount ? offer.dealEnds : null;
            setDataAttribute(container, 'ifcDealEnds', dealEnds);
            // Kept for a future in-place price update / tracker (F-26); not shown yet
            setDataAttribute(container, 'ifcStatePrice', offer.price);
            setDataAttribute(container, 'ifcStateMsrp', offer.msrp);
            // F-34: deal type / personal-offer reason (again only for discounts shown), pre-order, platforms
            const dealType = shownDiscount ? offer.dealType : null;
            setDataAttribute(container, 'ifcDealType', dealType);
            setDataAttribute(container, 'ifcDealReason', dealType === 'personal' ? offer.dealReason : null);
            setDataAttribute(container, 'ifcPreorder', !!(p && p.ifcIsPreorder));
            setDataAttribute(container, 'ifcPlatforms', JSON.stringify(p && Array.isArray(p.availableOn)
                ? p.availableOn.map(code => PLATFORM_LABELS[code] || code) : []));
            // F-36: capabilities come from the product-page cache ("Load details"), not this page
            const cached = getCachedCapabilities(container.dataset.ifcProductId);
            const capKeys = cached ? Object.keys(cached) : [];
            // Collapse whitespace - some store names have double spaces ("Online multiplayer  (2-4)")
            setDataAttribute(container, 'ifcCapabilities', JSON.stringify(cached ? Object.values(cached).map(v => String(v).replace(/\s+/g, ' ').trim()) : []));
            setDataAttribute(container, 'ifcDetailsLoaded', !!cached);
            // Item type from the product kind: games, DLC / add-ons, in-game consumables
            const type = p ? (PRODUCT_KIND_LABELS[p.productKind] || p.productKind || null) : null;
            setDataAttribute(container, 'ifcType', type);
            // F-40: add-ons (DLC) for a game - the flag is on this page; the count comes from the
            // game's add-ons page, fetched by "Load details" / the per-item refresh and cached
            // The flag can be stale: some flagged games list none (the store's own add-ons page
            // says "Failed to Get Channel (0 games)"), so a loaded count of 0 means no add-ons
            const flaggedAddOns = !!(p && p.hasAddOns === true);
            const addOnsCount = flaggedAddOns ? getCachedAddOnsCount(container.dataset.ifcProductId) : null;
            const hasAddOns = flaggedAddOns && addOnsCount !== 0;
            setDataAttribute(container, 'ifcHasAddOns', hasAddOns);
            setDataAttribute(container, 'ifcAddOnsCount', addOnsCount);
            injectDealEndBadge(container, dealEnds);
            injectItemTags(container, {
                productId: (container.dataset.ifcProductId || '').toUpperCase(), url: container.dataset.ifcUri,
                title: container.dataset.ifcName,
                kindLabel: type === 'DLC' || type === 'Consumable' ? type : null,
                personal: dealType === 'personal', reason: offer.dealReason, preorder: !!(p && p.ifcIsPreorder),
                playAnywhere: capKeys.includes('XPA'), optimizedXS: capKeys.includes('ConsoleGen9Optimized'),
                smartDelivery: capKeys.includes('ConsoleCrossGen'),
                addOns: hasAddOns ? { count: addOnsCount, url: addOnsUrl(container.dataset.ifcProductId, container.dataset.ifcUri) } : null
            });
        }

        // The store's "add-ons for this game" page, in the item's own locale (F-40)
        function addOnsUrl(productId, itemUrl) {
            try {
                const u = new URL(itemUrl, location.href);
                const isLocale = s => /^[a-z]{2}-[a-z]{2}$/i.test(s || '');
                const fromItem = u.pathname.split('/').filter(Boolean)[0], fromPage = location.pathname.split('/').filter(Boolean)[0];
                const locale = isLocale(fromItem) ? fromItem : isLocale(fromPage) ? fromPage : null;
                if (!productId || !locale) return null;
                return `${u.origin}/${locale}/games/browse/ProductAddOns_${String(productId).toUpperCase()}`;
            } catch (ex) { return null; }
        }

        // Small pills under the title: "Just for you" (reason on hover, styled like Xbox's),
        // "Pre-order" (Xbox's calendar icon) and - once details are loaded (F-36) - Play
        // Anywhere (Xbox's icon) plus X|S / Smart Delivery as text chips (the store draws
        // those two as Microsoft branding images, which we don't bundle). Rebuilt in place.
        function injectItemTags(container, info) {
            try {
                let row = container.querySelector('.ifc-item-tags');
                // The row always leads with the per-item refresh button, so every item with a
                // store page gets one; without a product id / URL there's nothing to refresh
                const canRefresh = !!(info.productId && info.url && info.url !== 'null');
                if (!canRefresh && !info.personal && !info.preorder && !info.playAnywhere && !info.optimizedXS && !info.smartDelivery && !info.kindLabel && !info.addOns) { if (row) row.remove(); return; }
                if (!row) {
                    const pd = CONFIG.selectors.productDetails ? safeQuerySelector(container, CONFIG.selectors.productDetails) : null;
                    if (!pd) return;
                    row = document.createElement('div'); row.className = 'ifc-item-tags';
                    pd.appendChild(row);
                }
                row.replaceChildren();
                if (canRefresh) row.appendChild(createItemRefreshButton(info));
                if (info.kindLabel) {
                    const kind = document.createElement('span'); kind.className = 'ifc-item-tag ifc-item-tag-kind';
                    kind.textContent = info.kindLabel;
                    kind.title = info.kindLabel === 'DLC' ? 'Add-on / downloadable content - needs the base game' : 'In-game consumable item';
                    row.appendChild(kind);
                }
                if (info.personal) {
                    const jfy = document.createElement('span'); jfy.className = 'ifc-item-tag ifc-item-tag-jfy';
                    jfy.textContent = 'Just for you';
                    if (info.reason) { jfy.title = info.reason; jfy.setAttribute('aria-label', `Just for you: ${info.reason}`); }
                    row.appendChild(jfy);
                }
                if (info.preorder) {
                    const pre = document.createElement('span'); pre.className = 'ifc-item-tag ifc-item-tag-preorder';
                    const icon = document.createElement('span'); icon.className = 'ifc-item-tag-icon';
                    setGlyph(icon, 'IMGPreorder', '');
                    pre.append(icon, 'Pre-order');
                    row.appendChild(pre);
                }
                const chip = (cls, text, title, iconKey) => {
                    const el = document.createElement('span'); el.className = `ifc-item-tag ifc-item-tag-cap ${cls}`;
                    el.title = title;
                    if (iconKey) { const icon = document.createElement('span'); icon.className = 'ifc-item-tag-icon'; setGlyph(icon, iconKey, ''); el.append(icon); }
                    el.append(text);
                    row.appendChild(el);
                };
                if (info.optimizedXS) chip('ifc-item-tag-xs', 'X|S', 'Optimized for Xbox Series X|S');
                if (info.smartDelivery) chip('ifc-item-tag-sd', 'Smart Delivery', 'Smart Delivery');
                if (info.playAnywhere) chip('ifc-item-tag-xpa', 'Play Anywhere', 'Xbox Play Anywhere', 'IMGPlayAnywhere');
                // F-40: "Add-ons" / "Add-ons (462)" - a link to the store's add-ons list for this game
                if (info.addOns && info.addOns.url) {
                    const n = info.addOns.count, known = typeof n === 'number';
                    const link = document.createElement('a'); link.className = 'ifc-item-tag ifc-item-tag-addons';
                    link.href = info.addOns.url; link.target = '_blank'; link.rel = 'noopener';
                    link.textContent = known ? `Add-ons (${n})` : 'Add-ons';
                    link.title = known ? `${n} add-on${n === 1 ? '' : 's'} for this game - open the list in a new tab`
                        : 'This game has add-ons - open the list in a new tab (Load details or ↻ adds the count)';
                    // The item card may sit inside Xbox's own click handling - let the link just open
                    link.addEventListener('click', (e) => e.stopPropagation());
                    row.appendChild(link);
                }
            } catch (ex) { console.error('Failed to inject item tags:', ex); }
        }

        // Per-item refresh (rebuilt with the row on every updateScreen, so its state comes
        // from state.details.itemStatus rather than living on the element)
        function createItemRefreshButton(info) {
            const st = state.details.itemStatus[info.productId];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ifc-item-refresh' + (st && st.busy ? ' ifc-busy' : '') + (st && st.error ? ' ifc-error' : '');
            btn.dataset.ifcRefreshId = info.productId;
            btn.disabled = !!(st && st.busy);
            const label = `Refresh details for ${info.title || 'this game'}`;
            btn.setAttribute('aria-label', label);
            btn.title = st && st.busy ? 'Refreshing...'
                : st && st.error ? `Couldn't refresh (${st.error}) - click to retry`
                : st && st.at ? `Refreshed ${new Date(st.at).toLocaleTimeString()} - click to refresh again`
                : `${label} (reads its store page; updates every copy of this game)`;
            setGlyph(btn, 'IMGRefresh', '↻');
            // The item card may sit inside Xbox's own link/click handling - keep the click ours
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); refreshItem(info.productId, info.url); });
            return btn;
        }

        // "Ends 24 Sep" next to the discount badge; "Ends in 5h" (amber) inside 24 hours
        function injectDealEndBadge(container, endsMs) {
            try {
                let badge = container.querySelector('.ifc-deal-ends');
                const discount = container.querySelector('.ifc-discount-badge');
                if (!endsMs || !discount) { if (badge) badge.remove(); return; }
                if (!badge) {
                    badge = document.createElement('span'); badge.className = 'ifc-deal-ends';
                    discount.insertAdjacentElement('afterend', badge);
                }
                const left = endsMs - Date.now(), end = new Date(endsMs);
                const soon = left < 24 * 60 * 60 * 1000;
                badge.textContent = soon ? `Ends in ${Math.max(1, Math.ceil(left / 3600000))}h`
                    : `Ends ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
                badge.classList.toggle('ifc-deal-ends-soon', soon);
                badge.title = `Deal ends ${end.toLocaleString()}`;
            } catch (ex) { console.error('Failed to inject deal end badge:', ex); }
        }

        // Inspection hooks for DevTools / the mock harness. detailsDelayMs (undefined = 1 s base gap)
        // lets the harness run "Load details" without the real pause between requests.
        state.debug = { loadProductData, getProductData, fetchPageState, loadDetails, detailsDelayMs: undefined };

        // ==================== LIGHT / DARK TOGGLE (F-39) ====================
        // Xbox marks its theme on <body> (data-theme="light|dark" + the dark class), on the
        // store app's wrapper (the dark class) and on the site header (a light/dark class), and
        // both its CSS and ours (the T-19 tokens) key off those marks; the toggle rewrites them
        // and remembers the choice. The site header is a web component that rebuilds itself
        // (other theme's menus, broken layout) if its own theme attribute changes, so that is
        // left alone: its colours are switched through its CSS override hooks and its logos by
        // image (see below). The footer keeps its own marks. Xbox's app manages <body>'s
        // data-theme and can reset it on in-app navigation, so enforceTheme() re-applies a
        // saved choice when that happens.
        const THEME_MARKS = { darkClass: 'theme-dark', headerMark: 'uhf-theme--', headerDark: 'uhf-theme--dark', headerLight: 'uhf-theme--light', headerElement: 'uhf-header', footerElement: 'uhf-footer', skipLink: 'uhf-skip-link', shellDark: 'uhf-dark' };
        // The store app's wrappers around the Microsoft header and footer (div.uhf-header / div.uhf-footer)
        // carry the shell dark mark, which paints them in the page colour (grey on a switched light page)
        const shellWrappers = () => [THEME_MARKS.headerElement, THEME_MARKS.footerElement]
            .map(tag => { const el = document.querySelector(tag); return el && el.parentElement && el.parentElement.closest(`.${tag}`); })
            .filter(Boolean);

        function currentTheme() {
            return document.body && document.body.dataset.theme === 'light' ? 'light' : 'dark';
        }
        function applyTheme(theme) {
            const body = document.body; if (!body) return;
            const dark = theme === 'dark';
            if (body.dataset.theme !== theme) body.dataset.theme = theme;
            if (body.classList.contains(THEME_MARKS.darkClass) !== dark) body.classList.toggle(THEME_MARKS.darkClass, dark);
            const appClass = resolveClass(PREFIXES.appBackground);
            if (appClass) Array.from(document.getElementsByClassName(appClass)).forEach(el => {
                if (el.classList.contains(THEME_MARKS.darkClass) !== dark) el.classList.toggle(THEME_MARKS.darkClass, dark);
            });
            document.querySelectorAll(`header[class*="${THEME_MARKS.headerMark}"]`).forEach(el => {
                if (el.classList.contains(THEME_MARKS.headerDark) !== dark) { el.classList.toggle(THEME_MARKS.headerDark, dark); el.classList.toggle(THEME_MARKS.headerLight, !dark); }
            });
            shellWrappers().forEach(el => { if (el.classList.contains(THEME_MARKS.shellDark) !== dark) el.classList.toggle(THEME_MARKS.shellDark, dark); });
            applyHeaderColours(theme);
            applyHeaderLogos(theme);
            ensureThemeSheets();
        }

        // Header colours. Every colour of the header is a CSS variable with an "-override" hook
        // (e.g. --uhf-header-link-color: var(--uhf-header-link-color-override, #262626)), keyed on
        // the component's own theme attribute - which we must not change. So for the other theme
        // its values are set as overrides on the component. Both themes' values are read from
        // Xbox's own stylesheets in a hidden, empty frame holding two plain probe elements (the
        // header component isn't registered there, so nothing is built; computed values are
        // readable even when a stylesheet from another host isn't). Nothing is hard-coded.
        let headerColours = null;          // Promise of { light: { var: value }, dark: {...} }
        let headerColoursKnown = null;     // the same, once read
        const headerNativeTheme = () => {
            const el = document.querySelector(`${THEME_MARKS.headerElement}[theme]`);
            return el && el.getAttribute('theme') === 'dark' ? 'dark' : 'light';
        };
        function readHeaderColours() {
            if (headerColours) return headerColours;
            headerColours = new Promise(resolve => {
                const empty = { light: {}, dark: {} };
                try {
                    const frame = document.createElement('iframe');
                    frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
                    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
                    const sheets = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map(l => l.href).filter(h => /^https?:/i.test(h))
                        .map(h => `<link rel="stylesheet" href="${h.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`).join('');
                    const el = THEME_MARKS.headerElement;
                    frame.srcdoc = `<!doctype html><html><head>${sheets}</head><body>`
                        + `<div class="${el}" id="l"></div><a class="${THEME_MARKS.skipLink}" id="ls"></a>`
                        + `<${el} theme="dark"><div class="${el}" id="d"></div><a class="${THEME_MARKS.skipLink}" id="ds"></a></${el}></body></html>`;
                    let done = false;
                    const finish = () => {
                        if (done) return; done = true;
                        const out = { light: {}, dark: {} };
                        try {
                            const doc = frame.contentDocument, win = frame.contentWindow;
                            [['l', 'd'], ['ls', 'ds']].forEach(([li, di]) => {
                                const ls = win.getComputedStyle(doc.getElementById(li)), ds = win.getComputedStyle(doc.getElementById(di));
                                Array.from(ls).filter(p => p.startsWith('--uhf-') && !p.endsWith('-override')).forEach(p => {
                                    const lv = ls.getPropertyValue(p).trim(), dv = ds.getPropertyValue(p).trim();
                                    if (lv && dv && lv !== dv) { out.light[p] = lv; out.dark[p] = dv; }
                                });
                            });
                        } catch (ex) { console.error('Failed to read the header colours:', ex); }
                        frame.remove();
                        headerColoursKnown = out;
                        resolve(out);
                    };
                    frame.addEventListener('load', finish);
                    setTimeout(finish, 5000);   // never wait on a stylesheet forever
                    document.body.appendChild(frame);
                } catch (ex) { console.error('Failed to read the header colours:', ex); headerColoursKnown = empty; resolve(empty); }
            });
            return headerColours;
        }
        function applyHeaderColours(theme) {
            const host = document.querySelector(`${THEME_MARKS.headerElement}[theme]`); if (!host) return;
            const set = colours => Object.keys(colours.light).forEach(p => {
                const want = theme === headerNativeTheme() ? '' : colours[theme][p];   // native theme: no overrides
                if (host.style.getPropertyValue(`${p}-override`) !== want) {
                    if (want) host.style.setProperty(`${p}-override`, want); else host.style.removeProperty(`${p}-override`);
                }
            });
            if (headerColoursKnown) set(headerColoursKnown);
            else if (theme !== headerNativeTheme()) readHeaderColours().then(set);
        }
        function headerColoursWrong() {
            const host = document.querySelector(`${THEME_MARKS.headerElement}[theme]`);
            if (!host || !headerColoursKnown) return false;
            const native = state.theme === headerNativeTheme();
            return Object.keys(headerColoursKnown.light).some(p => host.style.getPropertyValue(`${p}-override`) !== (native ? '' : headerColoursKnown[state.theme][p]));
        }

        // The header's Microsoft and Xbox logos are images with one version per theme (white ones
        // for dark). The page's embedded state carries the header markup for both themes, so each
        // logo is paired with its other-theme version by its alt text - read from the page, never
        // hard-coded. Keyed by file name, so a local copy of a logo (saved page) still matches.
        let headerLogoMaps = null;
        const logoFile = src => String(src || '').split(/[?#]/)[0].split('/').pop();
        function headerLogos() {
            if (headerLogoMaps) return headerLogoMaps;
            headerLogoMaps = { light: new Map(), dark: new Map() };   // either version's file name -> URL for that theme
            try {
                const pageState = parseEmbeddedState(document);
                const data = pageState && pageState.uhf && pageState.uhf.data;
                const images = t => {
                    const html = data && data[t] && data[t].headerHtml;
                    return typeof html === 'string'
                        ? Array.from(new DOMParser().parseFromString(html, 'text/html').images, i => ({ alt: i.getAttribute('alt') || '', src: i.getAttribute('src') || '' }))
                        : [];
                };
                const dark = images('dark');
                images('light').forEach(l => {
                    const d = dark.find(x => x.alt === l.alt);
                    if (!l.alt || !d || logoFile(d.src) === logoFile(l.src)) return;
                    [l.src, d.src].forEach(src => { headerLogoMaps.light.set(logoFile(src), l.src); headerLogoMaps.dark.set(logoFile(src), d.src); });
                });
            } catch (ex) { console.error('Failed to read the header logos:', ex); }
            return headerLogoMaps;
        }
        function applyHeaderLogos(theme) {
            const map = headerLogos()[theme];
            if (!map || !map.size) return;
            document.querySelectorAll(`${THEME_MARKS.headerElement} img[src]`).forEach(img => {
                const to = map.get(logoFile(img.getAttribute('src')));
                if (to && logoFile(to) !== logoFile(img.getAttribute('src'))) img.setAttribute('src', to);
            });
            // (The nav component's own logo attribute is left alone - changing it makes the
            // component re-render; if it ever does, the watcher swaps the image back.)
        }
        function headerLogosWrong() {
            const map = headerLogos()[state.theme];
            return !!(map && map.size) && Array.from(document.querySelectorAll(`${THEME_MARKS.headerElement} img[src]`))
                .some(img => { const to = map.get(logoFile(img.getAttribute('src'))); return to && logoFile(to) !== logoFile(img.getAttribute('src')); });
        }
        function enforceTheme() {
            try { if (state.theme && (currentTheme() !== state.theme || needsThemeMarks())) applyTheme(state.theme); }
            catch (ex) { console.error('Failed to apply theme:', ex); }
        }
        // The wrapper or header can be re-rendered with Xbox's own marks while <body> stays right
        function needsThemeMarks() {
            const dark = state.theme === 'dark', appClass = resolveClass(PREFIXES.appBackground);
            const wrapperWrong = appClass && Array.from(document.getElementsByClassName(appClass)).some(el => el.classList.contains(THEME_MARKS.darkClass) !== dark);
            const headerWrong = Array.from(document.querySelectorAll(`header[class*="${THEME_MARKS.headerMark}"]`)).some(el => el.classList.contains(THEME_MARKS.headerDark) !== dark);
            const shellWrong = shellWrappers().some(el => el.classList.contains(THEME_MARKS.shellDark) !== dark);
            return !!(wrapperWrong || headerWrong || shellWrong || headerColoursWrong() || headerLogosWrong());
        }

        // Xbox loads only the colour sheet for the theme the page opened in: its design
        // variables (--gds-*), which draw its own buttons (BUY, DETAILS, toolbar). After a
        // switch those are missing, so load Xbox's own sheets for the other themes, found at
        // runtime (their file names change with every Xbox release, so nothing is hard-coded):
        // Xbox's script maps each stylesheet chunk id to its file hash, and its theme loader
        // requests the theme chunks side by side. Each candidate is fetched first and only
        // added if it is purely a theme sheet (rules scoped to body[data-theme=...] plus
        // fonts), so a wrong guess can never restyle the page. Any failure leaves the page as
        // it was (our own UI switches either way).
        const THEME_TOKEN_PROBE = '--gds-backplateSolidBrandRest';
        let themeSheetsLoading = null;

        function ensureThemeSheets() {
            if (themeSheetsLoading || !document.body) return;
            if (getComputedStyle(document.body).getPropertyValue(THEME_TOKEN_PROBE).trim()) return;   // Xbox's colours are there
            themeSheetsLoading = loadThemeSheets(currentTheme())
                .catch(ex => console.warn('[XBOX Wishlist] Could not load Xbox\'s colours for this theme:', ex.message));
        }
        function isThemeOnlySheet(css) {
            const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+\{[^{}]*\}/g) || [];
            return rules.length > 0 && rules.every(r => { const sel = r.slice(0, r.indexOf('{')).trim(); return sel === '@font-face' || /^body\[data-theme=["']?[a-z-]+["']?\]$/.test(sel); })
                && rules.some(r => /^body\[data-theme=/.test(r.trim()));
        }
        async function loadThemeSheets(theme) {
            const forTheme = new RegExp(`body\\[data-theme=["']?${theme}["']?\\]`);
            const chunkName = /\/(\d+)\.([0-9a-f]{8,})\.chunk\.css(?:[?#].*)?$/;
            const loaded = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
                .map(l => ({ href: l.href, m: l.href.match(chunkName) })).filter(x => x.m);
            if (!loaded.length) throw new Error('no numbered stylesheet chunks on the page');
            const base = loaded[0].href.slice(0, loaded[0].href.lastIndexOf('/') + 1);
            // Xbox's own scripts from the same host (live they sit in a different folder from the
            // stylesheets, e.g. static/js vs static/css); the likely home of the stylesheet map
            // (webpack's runtime, usually the main "client" bundle) is tried first
            const host = new URL(base).origin;
            const likely = src => /\/(client|runtime|main)[.-]/i.test(src) ? 0 : 1;
            const scripts = Array.from(document.scripts).map(s => s.src).filter(src => { try { return src && new URL(src).origin === host; } catch (ex) { return false; } })
                .sort((a, b) => likely(a) - likely(b)).slice(0, 15);
            for (const src of scripts) {
                const text = await (await fetch(src)).text();
                for (const { m } of loaded) {
                    // The stylesheet map: a flat {id:"hash",...} holding a sheet we know is loaded
                    const at = text.indexOf(`${m[1]}:"${m[2]}"`); if (at < 0) continue;
                    const hashes = new Map(Array.from(text.slice(text.lastIndexOf('{', at), text.indexOf('}', at)).matchAll(/(\d+):"([0-9a-f]{8,})"/g), x => [x[1], x[2]]));
                    // The theme loader: chunk requests like .e(1950) ... .e(5398) next to each other
                    const call = text.indexOf(`.e(${m[1]})`); if (call < 0) continue;
                    const ids = [...new Set(Array.from(text.slice(Math.max(0, call - 800), call + 800).matchAll(/\.e\((\d+)\)/g), x => x[1]))]
                        .filter(id => id !== m[1] && hashes.has(id));
                    for (const id of ids) {
                        const href = `${base}${id}.${hashes.get(id)}.chunk.css`;
                        if (document.querySelector(`link[href="${CSS.escape(href)}"]`)) continue;
                        const r = await fetch(href); if (!r.ok) continue;
                        const css = await r.text();
                        if (!isThemeOnlySheet(css) || !forTheme.test(css)) continue;   // only the sheet for the theme now shown
                        const link = document.createElement('link');
                        link.rel = 'stylesheet'; link.href = href; link.dataset.ifcThemeSheet = id;
                        document.head.appendChild(link);
                        return;
                    }
                }
            }
            throw new Error('Xbox\'s theme stylesheets were not found');
        }
        function watchThemeMarks() {
            try {
                if (!document.body) return;
                new MutationObserver(enforceTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
            } catch (ex) { console.error('Failed to watch the page theme:', ex); }
        }
        function updateThemeButton() {
            const btn = getElement(`#${CONFIG.ids.themeButton}`, false); if (!btn) return;
            const text = currentTheme() === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
            btn.title = text; btn.setAttribute('aria-label', text);
        }
        function addThemeButton() {
            if (state.ui.btnTheme) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                const btn = createImageButton('Theme', adapter.getResourceUrl('IMGTheme'), 'Switch theme', 'svg');
                btn.removeAttribute('aria-pressed');   // an action, not a panel toggle
                btn.addEventListener('click', () => {
                    if (contextLost()) { handleContextLost(); return; }
                    state.theme = currentTheme() === 'light' ? 'dark' : 'light';
                    applyTheme(state.theme);
                    updateThemeButton();
                    saveFilterState();
                });
                bc.appendChild(btn);
                state.ui.btnTheme = true;
                updateThemeButton();
            } catch (ex) { console.error('Failed to add theme button:', ex); }
        }

        // ==================== REFRESH (F-32 v1) ====================
        // Re-reads the wishlist by reloading the page. Filters, sort and saved filters are
        // persisted, so they come back as they were. (A fetch-and-parse refresh of the
        // page's embedded state is the planned data layer for price tracking, F-26+.)
        function addRefreshButton() {
            if (state.ui.btnRefresh) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                const btn = createImageButton('Refresh', adapter.getResourceUrl('IMGRefresh'), 'Refresh wishlist', 'svg');
                btn.removeAttribute('aria-pressed');   // an action, not a toggle
                btn.addEventListener('click', () => {
                    try {
                        btn.disabled = true; btn.setAttribute('aria-busy', 'true');
                        saveFilterState();
                        location.reload();
                    } catch (ex) { btn.disabled = false; btn.removeAttribute('aria-busy'); console.error('Failed to refresh:', ex); }
                });
                bc.appendChild(btn);
                state.ui.btnRefresh = true;
            } catch (ex) { console.error('Failed to add refresh button:', ex); }
        }

        function getVisibleItems() {
            return Array.from(document.getElementsByClassName(CONFIG.selectors.items)).filter(shouldShowContainer);
        }

        function exportRow(c) {
            const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
            const text = v => (v && v !== 'null') ? v.trim() : '';
            return {
                title: text(c.dataset.ifcName), publisher: text(c.dataset.ifcPublisher),
                price: num(c.dataset.ifcPrice), originalPrice: num(c.dataset.ifcPriceBase),
                discountPercent: num(c.dataset.ifcPrice) === null ? null : (num(c.dataset.ifcPriceDiscountPercent) ?? 0),
                owned: c.dataset.ifcOwned === 'true', unpurchasable: c.dataset.ifcUnpurchasable === 'true',
                // From the page's product data (F-33); dates as ISO strings
                rating: num(c.dataset.ifcRating), ratingCount: num(c.dataset.ifcRatingCount),
                genres: getItemGenres(c),
                releaseDate: num(c.dataset.ifcReleaseDate) === null ? null : new Date(num(c.dataset.ifcReleaseDate)).toISOString().slice(0, 10),
                dealEnds: num(c.dataset.ifcDealEnds) === null ? null : new Date(num(c.dataset.ifcDealEnds)).toISOString(),
                inPass: c.dataset.ifcInPass === 'true',
                // F-34: deal type personal | sale | member (null = no discount shown)
                dealType: text(c.dataset.ifcDealType) || null, dealReason: text(c.dataset.ifcDealReason) || null,
                preorder: c.dataset.ifcPreorder === 'true', platforms: getItemJsonList(c, 'ifcPlatforms'),
                // F-36: empty unless "Load details" has fetched this item's product page
                capabilities: getItemJsonList(c, 'ifcCapabilities'),
                type: text(c.dataset.ifcType) || null,   // Game | DLC | Consumable
                // F-40: count is null until "Load details" / the per-item refresh has read it
                hasAddOns: c.dataset.ifcHasAddOns === 'true', addOnsCount: num(c.dataset.ifcAddOnsCount),
                url: text(c.dataset.ifcUri)
            };
        }

        function toCsv(rows) {
            const cols = ['title', 'publisher', 'price', 'originalPrice', 'discountPercent', 'owned', 'unpurchasable',
                'rating', 'ratingCount', 'genres', 'releaseDate', 'dealEnds', 'inPass', 'dealType', 'dealReason', 'preorder', 'platforms', 'capabilities', 'type', 'hasAddOns', 'addOnsCount', 'url'];
            const cell = v => {
                if (v === null || v === undefined) return '';
                if (Array.isArray(v)) v = v.join('; ');
                let s = String(v);
                // Stop spreadsheet apps treating a value as a formula (CSV injection)
                if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
                return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            };
            return [cols.join(','), ...rows.map(r => cols.map(k => cell(r[k])).join(','))].join('\r\n');
        }

        function downloadFile(filename, mime, content) {
            const url = URL.createObjectURL(new Blob([content], { type: mime }));
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.style.display = 'none';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function exportVisibleItems(format) {
            try {
                const rows = getVisibleItems().map(exportRow);
                if (rows.length === 0) return;
                const d = new Date(), pad = n => String(n).padStart(2, '0');
                const base = `xbox-wishlist-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                if (format === 'json') downloadFile(`${base}.json`, 'application/json', JSON.stringify(rows, null, 2));
                // BOM so Excel reads UTF-8 (™, accented titles) correctly
                else downloadFile(`${base}.csv`, 'text/csv;charset=utf-8', '﻿' + toCsv(rows));
            } catch (ex) { console.error('Failed to export wishlist:', ex); }
        }

        function addFilterContainer() {
            if (state.ui.divFilter) return;
            try {
                if (getElement(`#${CONFIG.ids.filterContainer}`, false)) return;
                const fc = document.createElement('div');
                fc.id = CONFIG.ids.filterContainer;
                fc.classList.add('filter-section', 'ifc-hidden');
                const fl = document.createElement('div');
                fl.classList.add('filter-list');
                const headerRow = document.createElement('div');
                headerRow.className = 'ifc-filter-header-row';
                const h = document.createElement('h2');
                h.classList.add('filter-text-heading');
                h.textContent = 'Filters';
                const clearBtn = document.createElement('button');
                clearBtn.id = CONFIG.ids.clearButton;
                clearBtn.type = 'button';
                clearBtn.className = 'ifc-clear-all-btn ifc-hidden';
                clearBtn.textContent = 'Clear All';
                clearBtn.addEventListener('click', clearAllFilters);
                headerRow.appendChild(h); headerRow.appendChild(clearBtn);
                const tc = document.createElement('div');
                tc.id = CONFIG.ids.tagContainer; tc.className = 'ifc-tag-container ifc-hidden';
                const fg = document.createElement('ul');
                fg.classList.add('filter-groups');
                fl.appendChild(headerRow); fl.appendChild(tc); fl.appendChild(fg); fc.appendChild(fl);
                document.body.appendChild(fc);
                // (the Filter button wires its own click in addFilterButton - see reinitAfterRerender)
                state.ui.divFilter = true; state.ui.tagContainer = true;
            } catch (ex) { console.error('Failed to add filter container:', ex); }
        }

        function createFilterBlock(id = null, text = '', collapsible = true) {
            const groupContainer = document.createElement('li');
            if (id) groupContainer.id = `ifc_group_${id}`;
            groupContainer.className = 'ifc-accordion-group';

            if (!collapsible) {
                const cc = document.createElement('div'); cc.className = 'ifc-filter-block-static';
                if (id) cc.id = `ifc_group_content_${id}`;
                const h = document.createElement('h3'); h.className = 'ifc-filter-static-heading'; h.textContent = text;
                cc.appendChild(h); groupContainer.appendChild(cc);
                return groupContainer;
            }

            const headerButton = document.createElement('button');
            headerButton.className = 'ifc-accordion-header';
            headerButton.setAttribute('aria-expanded', 'false');
            const headerText = document.createElement('span');
            headerText.className = 'ifc-accordion-title'; headerText.textContent = text;
            const chevronContainer = document.createElement('div');
            chevronContainer.className = 'ifc-accordion-chevron';
            chevronContainer.id = `ifc_accordion_icon_${id}`;
            loadSVGIntoContainer(chevronContainer, adapter.getResourceUrl('IMGExpand'), `accordion_${id}`);
            headerButton.appendChild(headerText); headerButton.appendChild(chevronContainer);

            const contentPanel = document.createElement('div');
            contentPanel.className = 'ifc-accordion-content ifc-hidden';
            if (id) contentPanel.id = `ifc_group_content_${id}`;

            // FIX: Load SVG directly into chevronContainer (closure ref) instead of
            // updateSVGIcon which looks for #ifc_img_... prefixed IDs that don't match
            headerButton.addEventListener('click', async () => {
                const isExpanded = headerButton.getAttribute('aria-expanded') === 'true';
                headerButton.setAttribute('aria-expanded', (!isExpanded).toString());
                contentPanel.classList.toggle('ifc-hidden', isExpanded);
                const resourceKey = isExpanded ? 'IMGExpand' : 'IMGCollapse';
                await loadSVGIntoContainer(chevronContainer, adapter.getResourceUrl(resourceKey), `accordion_${id}`);
            });

            groupContainer.appendChild(headerButton); groupContainer.appendChild(contentPanel);
            return groupContainer;
        }

        function addSearchFilter() {
            if (!state.ui.divFilter) return;
            try {
                if (getElement(`#${CONFIG.ids.searchInput}`, false)) return;
                const tc = getElement(`#${CONFIG.ids.tagContainer}`, false);
                if (!tc || !tc.parentNode) return;
                const wrapper = document.createElement('div');
                wrapper.className = 'ifc-search-wrapper';
                const input = document.createElement('input');
                input.type = 'text';
                input.id = CONFIG.ids.searchInput;
                input.className = 'ifc-search-input';
                input.placeholder = 'Search wishlist...';
                input.value = state.filters.search.term;
                input.addEventListener('input', (e) => {
                    state.filters.search.term = e.target.value;
                    updateScreen();
                });
                wrapper.appendChild(input);
                tc.parentNode.insertBefore(wrapper, tc);
            } catch (ex) { console.error('Failed to add search filter:', ex); }
        }

        function addQuickFilters() {
            if (!state.ui.divFilter) return;
            try {
                if (getElement(`#${CONFIG.ids.quickFilters}`, false)) return;
                const tc = getElement(`#${CONFIG.ids.tagContainer}`, false);
                if (!tc || !tc.parentNode) return;
                const row = document.createElement('div');
                row.id = CONFIG.ids.quickFilters;
                row.className = 'ifc-quick-filters';
                getQuickFilterPresets().forEach(preset => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'ifc-quick-filter-btn';
                    btn.dataset.ifcPreset = preset.key;
                    btn.textContent = preset.label;
                    btn.setAttribute('aria-pressed', 'false');
                    btn.addEventListener('click', () => {
                        // Re-resolve on click - the range objects in state are replaced as items render
                        const p = getQuickFilterPresets().find(q => q.key === preset.key);
                        if (!p) return;
                        if (p.isActive()) p.clear(); else p.apply();
                        updateScreen();
                    });
                    row.appendChild(btn);
                });
                tc.parentNode.insertBefore(row, tc);
                updateQuickFilterStates();
            } catch (ex) { console.error('Failed to add quick filters:', ex); }
        }

        // Each preset owns one filter dimension. Its active state is derived from
        // state.filters rather than tracked separately, so the pills stay correct
        // after slider drags, tag removal, checkbox clicks and Clear All.
        function getQuickFilterPresets() {
            const owned = () => state.filters.owned, pr = () => state.filters.priceRange, dr = () => state.filters.discountRange;
            const ownedOnly = (value) => owned().selected.length === 1 && owned().selected[0] === value;
            const setOwned = (selected) => { owned().selected = selected; updateCheckboxes(CONFIG.ids.ownedSelect, selected); };
            const discountFrom = (atLeast) => Math.max(atLeast, dr().min);
            const discountIs = (currentMin) => dr().enabled && dr().currentMin === currentMin && dr().currentMax === dr().max;
            const setDiscount = (currentMin) => {
                dr().enabled = true; dr().currentMin = currentMin; dr().currentMax = dr().max;
                syncDiscountSliderUI();
            };
            // Relative to this wishlist's own price spread, not a fixed
            // currency amount - prices are in the viewer's local currency.
            const cheapMax = () => pr().min + (pr().max - pr().min) / 3;
            return [
                { key: 'owned', label: 'Owned', isActive: () => ownedOnly('Owned'), apply: () => setOwned(['Owned']), clear: () => setOwned([]) },
                { key: 'notOwned', label: 'Not Owned', isActive: () => ownedOnly('Not Owned'), apply: () => setOwned(['Not Owned']), clear: () => setOwned([]) },
                { key: 'onSale', label: 'On Sale', isActive: () => discountIs(discountFrom(1)), apply: () => setDiscount(discountFrom(1)), clear: resetDiscountSlider },
                { key: 'halfOff', label: '≥50% Off', isAvailable: () => dr().max >= 50,
                    isActive: () => discountIs(discountFrom(50)), apply: () => setDiscount(discountFrom(50)), clear: resetDiscountSlider },
                // Included with a subscription pass right now (from the page's product data) -
                // unlike the Subscriptions filter, which reads "with <pass>" member-price badges
                { key: 'inPass', label: 'In a pass', isActive: () => state.filters.inPass === true,
                    apply: () => { state.filters.inPass = true; }, clear: () => { state.filters.inPass = false; } },
                // Personal "Just for you" offers and pre-orders (F-34, from the page's product data)
                { key: 'justForYou', label: 'Just for you', isActive: () => state.filters.justForYou === true,
                    apply: () => { state.filters.justForYou = true; }, clear: () => { state.filters.justForYou = false; } },
                { key: 'preorder', label: 'Pre-order', isActive: () => state.filters.preorder === true,
                    apply: () => { state.filters.preorder = true; }, clear: () => { state.filters.preorder = false; } },
                // Games with add-ons (DLC) on the store (F-40, from the page's product data)
                { key: 'hasAddOns', label: 'Has add-ons', isActive: () => state.filters.hasAddOns === true,
                    apply: () => { state.filters.hasAddOns = true; }, clear: () => { state.filters.hasAddOns = false; } },
                { key: 'cheap', label: 'Cheap',
                    isActive: () => pr().enabled && pr().currentMin === pr().min && pr().currentMax === cheapMax(),
                    apply: () => {
                        pr().enabled = true; pr().currentMin = pr().min; pr().currentMax = cheapMax();
                        syncPriceSliderUI();
                    },
                    clear: resetPriceSlider }
            ];
        }

        function updateQuickFilterStates() {
            try {
                const row = getElement(`#${CONFIG.ids.quickFilters}`, false);
                if (!row) return;
                getQuickFilterPresets().forEach(p => {
                    const btn = row.querySelector(`[data-ifc-preset="${p.key}"]`);
                    if (!btn) return;
                    const available = !p.isAvailable || p.isAvailable();
                    const active = available && p.isActive();
                    btn.disabled = !available;
                    btn.classList.toggle('ifc-Active', active);
                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
            } catch (ex) { console.error('Failed to update quick filter states:', ex); }
        }

        function clearAllFilters() {
            try {
                state.filters.owned.selected = [];
                state.filters.publishers.selected = [];
                state.filters.subscriptions.selected = [];
                state.filters.genres.selected = [];
                state.filters.inPass = false;
                state.filters.platforms.selected = [];
                state.filters.justForYou = false;
                state.filters.preorder = false;
                state.filters.hasAddOns = false;
                state.filters.capabilities.selected = [];
                state.filters.types.selected = [];
                state.filters.search.term = '';
                updateCheckboxes(CONFIG.ids.ownedSelect, []);
                updateCheckboxes(CONFIG.ids.publishersSelect, []);
                updateCheckboxes(CONFIG.ids.subscriptionsSelect, []);
                updateCheckboxes(CONFIG.ids.genresSelect, []);
                updateCheckboxes(CONFIG.ids.platformsSelect, []);
                updateCheckboxes(CONFIG.ids.capabilitiesSelect, []);
                updateCheckboxes(CONFIG.ids.typesSelect, []);
                const searchInput = getElement(`#${CONFIG.ids.searchInput}`);
                if (searchInput) searchInput.value = '';
                resetPriceSlider();
                resetDiscountSlider();
                updateScreen();
            } catch (ex) { console.error('Failed to clear filters:', ex); }
        }

        // ==================== SAVED FILTER PRESETS (F-23) ====================
        // A preset stores the filter selections only - not the search text (typed per
        // visit) and not the sort. Saved alongside the filters by saveFilterState().
        const MAX_SAVED_PRESETS = 20, MAX_PRESET_NAME = 30;

        function snapshotRange(r) {
            return { enabled: r.enabled === true, min: r.min, max: r.max, currentMin: r.currentMin, currentMax: r.currentMax };
        }
        function snapshotFilters() {
            const f = state.filters;
            return {
                owned: [...f.owned.selected], publishers: [...f.publishers.selected], subscriptions: [...f.subscriptions.selected],
                genres: [...f.genres.selected], inPass: f.inPass === true,
                platforms: [...f.platforms.selected], justForYou: f.justForYou === true, preorder: f.preorder === true,
                hasAddOns: f.hasAddOns === true,
                capabilities: [...f.capabilities.selected], types: [...f.types.selected],
                priceRange: snapshotRange(f.priceRange), discountRange: snapshotRange(f.discountRange)
            };
        }
        // Validates a stored preset; anything malformed is dropped (returns null)
        function normalizePreset(p) {
            if (!p || typeof p.name !== 'string' || !p.name.trim() || !p.filters || typeof p.filters !== 'object') return null;
            const list = v => Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
            const range = r => {
                const ok = r && typeof r === 'object' && ['min', 'max', 'currentMin', 'currentMax'].every(k => typeof r[k] === 'number');
                return ok ? snapshotRange(r) : { enabled: false, min: 0, max: 0, currentMin: 0, currentMax: 0 };
            };
            const f = p.filters;
            return {
                name: p.name.trim().slice(0, MAX_PRESET_NAME),
                filters: {
                    owned: list(f.owned), publishers: list(f.publishers), subscriptions: list(f.subscriptions),
                    genres: list(f.genres), inPass: f.inPass === true,   // absent in presets saved before F-33
                    platforms: list(f.platforms), justForYou: f.justForYou === true, preorder: f.preorder === true,   // before F-34
                    hasAddOns: f.hasAddOns === true,      // before F-40
                    capabilities: list(f.capabilities),   // before F-36
                    types: list(f.types),                 // before the Type filter
                    priceRange: range(f.priceRange), discountRange: range(f.discountRange)
                }
            };
        }
        function hasPresetableFilters() {
            const f = state.filters;
            return f.owned.selected.length > 0 || f.publishers.selected.length > 0 || f.subscriptions.selected.length > 0
                || f.genres.selected.length > 0 || f.inPass || f.platforms.selected.length > 0 || f.justForYou || f.preorder || f.hasAddOns
                || f.capabilities.selected.length > 0 || f.types.selected.length > 0
                || f.priceRange.enabled || f.discountRange.enabled;
        }
        // A saved range re-applied to this page's slider bounds (same rules as a restore)
        function presetRangeOnPage(saved, current) {
            return rerangeSelection({ ...current, ...saved }, current.min, current.max);
        }
        function isPresetActive(p) {
            const f = state.filters, pf = p.filters;
            const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
            const rangeIs = (cur, saved) => {
                if (!saved.enabled) return !cur.enabled;
                if (!cur.enabled) return false;
                const e = presetRangeOnPage(saved, cur);
                return cur.currentMin === e.currentMin && cur.currentMax === e.currentMax;
            };
            return sameSet(f.owned.selected, pf.owned) && sameSet(f.publishers.selected, pf.publishers)
                && sameSet(f.subscriptions.selected, pf.subscriptions)
                && sameSet(f.genres.selected, pf.genres) && f.inPass === pf.inPass
                && sameSet(f.platforms.selected, pf.platforms) && f.justForYou === pf.justForYou && f.preorder === pf.preorder && f.hasAddOns === pf.hasAddOns
                && sameSet(f.capabilities.selected, pf.capabilities) && sameSet(f.types.selected, pf.types)
                && rangeIs(f.priceRange, pf.priceRange) && rangeIs(f.discountRange, pf.discountRange);
        }
        // Replaces the current filter selections with the preset's (search text is left alone)
        function applyPreset(p) {
            try {
                const f = state.filters, pf = p.filters;
                f.owned.selected = [...pf.owned]; f.publishers.selected = [...pf.publishers]; f.subscriptions.selected = [...pf.subscriptions];
                f.genres.selected = [...pf.genres]; f.inPass = pf.inPass;
                f.platforms.selected = [...pf.platforms]; f.justForYou = pf.justForYou; f.preorder = pf.preorder; f.hasAddOns = pf.hasAddOns;
                f.capabilities.selected = [...pf.capabilities]; f.types.selected = [...pf.types];
                updateCheckboxes(CONFIG.ids.ownedSelect, f.owned.selected);
                updateCheckboxes(CONFIG.ids.publishersSelect, f.publishers.selected);
                updateCheckboxes(CONFIG.ids.subscriptionsSelect, f.subscriptions.selected);
                updateCheckboxes(CONFIG.ids.genresSelect, f.genres.selected);
                updateCheckboxes(CONFIG.ids.platformsSelect, f.platforms.selected);
                updateCheckboxes(CONFIG.ids.capabilitiesSelect, f.capabilities.selected);
                updateCheckboxes(CONFIG.ids.typesSelect, f.types.selected);
                f.priceRange = presetRangeOnPage(pf.priceRange, f.priceRange);
                f.discountRange = presetRangeOnPage(pf.discountRange, f.discountRange);
                syncPriceSliderUI(); syncDiscountSliderUI();
                updateScreen();
            } catch (ex) { console.error('Failed to apply saved filters:', ex); }
        }

        function saveCurrentAsPreset() {
            try {
                const input = getElement(`#${CONFIG.ids.savedPresetName}`, false);
                const name = input ? input.value.trim().slice(0, MAX_PRESET_NAME) : '';
                if (!name || !hasPresetableFilters()) return;
                const preset = { name, filters: snapshotFilters() };
                const i = state.savedPresets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
                if (i >= 0) state.savedPresets[i] = preset;               // same name overwrites
                else if (state.savedPresets.length < MAX_SAVED_PRESETS) state.savedPresets.push(preset);
                else return;
                if (input) input.value = '';
                saveFilterState(); renderSavedPresets();
            } catch (ex) { console.error('Failed to save filters:', ex); }
        }
        function deletePreset(name) {
            state.savedPresets = state.savedPresets.filter(p => p.name !== name);
            saveFilterState(); renderSavedPresets();
        }

        function addSavedPresets() {
            if (!state.ui.divFilter) return;
            try {
                if (getElement(`#${CONFIG.ids.savedPresets}`, false)) return;
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`, false);
                if (!fg || !fg.parentNode) return;
                const box = document.createElement('div');
                box.id = CONFIG.ids.savedPresets; box.className = 'ifc-saved-presets';
                const heading = document.createElement('div');
                heading.className = 'ifc-saved-presets-heading'; heading.textContent = 'Saved filters';
                const list = document.createElement('div');
                list.id = CONFIG.ids.savedPresetsList; list.className = 'ifc-quick-filters';
                const row = document.createElement('div'); row.className = 'ifc-saved-presets-row';
                const input = document.createElement('input');
                input.type = 'text'; input.id = CONFIG.ids.savedPresetName; input.className = 'ifc-search-input';
                input.maxLength = MAX_PRESET_NAME; input.placeholder = 'Name these filters...';
                input.setAttribute('aria-label', 'Name for saved filters');
                input.addEventListener('input', updateSavedPresetStates);
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveCurrentAsPreset(); } });
                const saveBtn = document.createElement('button');
                saveBtn.type = 'button'; saveBtn.id = CONFIG.ids.savedPresetSave; saveBtn.className = 'ifc-quick-filter-btn';
                saveBtn.textContent = 'Save';
                saveBtn.addEventListener('click', saveCurrentAsPreset);
                row.appendChild(input); row.appendChild(saveBtn);
                box.appendChild(heading); box.appendChild(list); box.appendChild(row);
                fg.parentNode.appendChild(box);
                renderSavedPresets();
            } catch (ex) { console.error('Failed to add saved filters:', ex); }
        }

        function renderSavedPresets() {
            const list = getElement(`#${CONFIG.ids.savedPresetsList}`, false);
            if (!list) return;
            list.innerHTML = '';
            state.savedPresets.forEach(p => {
                const wrap = document.createElement('span'); wrap.className = 'ifc-saved-preset';
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'ifc-quick-filter-btn'; btn.textContent = p.name;
                btn.dataset.ifcSavedPreset = p.name;
                btn.addEventListener('click', () => {
                    const cur = state.savedPresets.find(q => q.name === p.name);
                    if (!cur) return;
                    if (isPresetActive(cur)) clearAllFilters(); else applyPreset(cur);
                });
                const del = document.createElement('button');
                del.type = 'button'; del.className = 'ifc-saved-preset-remove'; setGlyph(del, 'IMGClose', '×');
                del.title = `Delete "${p.name}"`; del.setAttribute('aria-label', `Delete saved filters ${p.name}`);
                del.addEventListener('click', () => deletePreset(p.name));
                wrap.appendChild(btn); wrap.appendChild(del); list.appendChild(wrap);
            });
            list.classList.toggle('ifc-hidden', state.savedPresets.length === 0);
            updateSavedPresetStates();
        }

        function updateSavedPresetStates() {
            try {
                const list = getElement(`#${CONFIG.ids.savedPresetsList}`, false);
                if (list) list.querySelectorAll('[data-ifc-saved-preset]').forEach(btn => {
                    const p = state.savedPresets.find(q => q.name === btn.dataset.ifcSavedPreset);
                    const active = !!p && isPresetActive(p);
                    btn.classList.toggle('ifc-Active', active);
                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                const saveBtn = getElement(`#${CONFIG.ids.savedPresetSave}`, false);
                const input = getElement(`#${CONFIG.ids.savedPresetName}`, false);
                if (saveBtn) {
                    const name = input ? input.value.trim() : '';
                    const full = state.savedPresets.length >= MAX_SAVED_PRESETS && !state.savedPresets.some(p => p.name.toLowerCase() === name.toLowerCase());
                    saveBtn.disabled = !name || !hasPresetableFilters() || full;
                    saveBtn.title = !hasPresetableFilters() ? 'Set some filters first' : full ? `At most ${MAX_SAVED_PRESETS} saved filters` : !name ? 'Enter a name first' : 'Save the current filters';
                }
            } catch (ex) { console.error('Failed to update saved filter states:', ex); }
        }

        async function addFilterContainerOwned() {
            if (!state.ui.divFilter) return;
            const gn = 'Owned';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) return;
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                if (!state.filters.owned.selected) state.filters.owned.selected = [];
                if (!Array.isArray(state.filters.owned.options)) state.filters.owned.options = ['Owned', 'Not Owned', 'Un-Purchasable'];
                const fb = createFilterBlock(gn, 'Owned', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    const options = state.filters.owned.options.map(opt => ({ value: opt, label: opt }));
                    cc.appendChild(createCheckboxList(CONFIG.ids.ownedSelect, options, state.filters.owned.selected, () => {
                        state.filters.owned.selected = getCheckboxValues(CONFIG.ids.ownedSelect); updateScreen();
                    }));
                }
                fg.appendChild(fb);
            } catch (ex) { console.error('Failed to add owned filter:', ex); }
        }

        // Owned / Not Owned / Un-Purchasable counts over all items, like the other groups
        // (same rules as the filter in shouldShowContainer)
        function collectOwnedCounts() {
            const counts = new Map([['Owned', 0], ['Not Owned', 0], ['Un-Purchasable', 0]]);
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                const owned = c.dataset.ifcOwned === 'true', unPurchasable = c.dataset.ifcUnpurchasable === 'true';
                const key = owned ? 'Owned' : (unPurchasable ? 'Un-Purchasable' : 'Not Owned');
                counts.set(key, counts.get(key) + 1);
            });
            state.filters.owned.counts = counts;
            return counts;
        }

        function updateOwnedCounts() {
            const counts = collectOwnedCounts(), container = document.getElementById(CONFIG.ids.ownedSelect);
            if (!container) return;
            container.querySelectorAll('.ifc-checkbox-item').forEach(label => {
                const cb = label.querySelector('input'), span = label.querySelector('.ifc-checkbox-label');
                if (cb && span) span.textContent = `${cb.value} (${counts.get(cb.value) || 0})`;
            });
        }

        function collectPublishers() {
            const publishers = new Map();
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                const p = c.dataset.ifcPublisher;
                if (p && p !== 'null' && p.trim() !== '') { const n = p.trim(); publishers.set(n, (publishers.get(n) || 0) + 1); }
            });
            state.filters.publishers.list = new Map(Array.from(publishers.entries()).sort((a, b) => a[0].localeCompare(b[0])));
            return state.filters.publishers.list;
        }

        // An item's ifcSubscriptions dataset attribute is a JSON-encoded array
        // (see extractSubscriptions()) rather than a single value like publisher,
        // since an item can have zero, one, or more than one subscription attached.
        function getItemSubscriptions(container) {
            try {
                const parsed = JSON.parse(container.dataset.ifcSubscriptions || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (ex) { return []; }
        }

        function collectSubscriptions() {
            const subscriptions = new Map();
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                getItemSubscriptions(c).forEach(name => {
                    if (name) subscriptions.set(name, (subscriptions.get(name) || 0) + 1);
                });
            });
            state.filters.subscriptions.list = new Map(Array.from(subscriptions.entries()).sort((a, b) => a[0].localeCompare(b[0])));
            return state.filters.subscriptions.list;
        }

        async function addFilterContainerPublishers() {
            if (!state.ui.divFilter) return;
            const gn = 'Publishers';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updatePublishersCheckboxes(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const fb = createFilterBlock(gn, 'Publishers', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    cc.appendChild(createListSearch(CONFIG.ids.publishersSelect, CONFIG.ids.publisherSearch, 'publishers'));
                    const sc = document.createElement('div');
                    sc.id = CONFIG.ids.publishersSelect;
                    sc.className = 'ifc-checkbox-list ifc-checkbox-list-scrollable';
                    cc.appendChild(sc);
                }
                fg.appendChild(fb);
                updatePublishersCheckboxes();
            } catch (ex) { console.error('Failed to add publishers filter:', ex); }
        }

        function updatePublishersCheckboxes() {
            if (!Array.isArray(state.filters.publishers.selected)) state.filters.publishers.selected = [];
            const publishers = collectPublishers();
            const container = document.getElementById(CONFIG.ids.publishersSelect);
            if (!container) return;
            container.innerHTML = '';
            publishers.forEach((count, name) => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = name; cb.checked = state.filters.publishers.selected.includes(name);
                cb.className = 'ifc-checkbox';
                cb.addEventListener('change', () => { state.filters.publishers.selected = getCheckboxValues(CONFIG.ids.publishersSelect); updateScreen(); });
                const span = document.createElement('span'); span.className = 'ifc-checkbox-label'; span.textContent = `${name} (${count})`;
                label.appendChild(cb); label.appendChild(span); container.appendChild(label);
            });
            // The list is rebuilt on every updateScreen(), so re-apply the typeahead
            applyListSearch(CONFIG.ids.publishersSelect);
        }

        // Typeahead above a checkbox list (Publishers, Genres). It only narrows the visible
        // checkboxes - not a filter, so it doesn't change which items show, and a ticked
        // option hidden by it still applies. Not persisted; Clear All leaves it alone.
        function createListSearch(listId, inputId, noun) {
            const sw = document.createElement('div');
            sw.className = 'ifc-search-wrapper';
            const si = document.createElement('input');
            si.type = 'text';
            si.id = inputId;
            si.className = 'ifc-search-input';
            si.placeholder = `Search ${noun}...`;
            si.setAttribute('aria-label', `Search ${noun}`);
            si.value = state.ui.listSearch[listId] || '';
            si.addEventListener('input', (e) => { state.ui.listSearch[listId] = e.target.value; applyListSearch(listId); });
            sw.appendChild(si);
            return sw;
        }

        // Lists are rebuilt on every updateScreen(), so their update functions re-apply this
        function applyListSearch(listId) {
            const container = document.getElementById(listId);
            if (!container) return;
            const term = (state.ui.listSearch[listId] || '').trim().toLowerCase();
            container.querySelectorAll('.ifc-checkbox-item').forEach(label => {
                const cb = label.querySelector('input[type="checkbox"]');
                const matches = term === '' || (cb && cb.value.toLowerCase().includes(term));
                label.classList.toggle('ifc-hidden', !matches);
            });
        }

        async function addFilterContainerSubscriptions() {
            if (!state.ui.divFilter) return;
            const gn = 'Subscriptions';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updateSubscriptionsCheckboxes(); return; }
                // NOTE: this runs during initial UI setup, before setContainerData()
                // has scraped ifcSubscriptions onto any item (that happens later, in
                // the first updateScreen() cycle) - so collectSubscriptions() here
                // always sees zero. The group is created unconditionally, like
                // Publishers, and gets populated on that first real refresh
                // (toggleContainers() calls updateSubscriptionsCheckboxes() every cycle).
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const fb = createFilterBlock(gn, 'Subscriptions', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    const sc = document.createElement('div');
                    sc.id = CONFIG.ids.subscriptionsSelect;
                    sc.className = 'ifc-checkbox-list ifc-checkbox-list-scrollable';
                    cc.appendChild(sc);
                }
                fg.appendChild(fb);
                updateSubscriptionsCheckboxes();
            } catch (ex) { console.error('Failed to add subscriptions filter:', ex); }
        }

        function updateSubscriptionsCheckboxes() {
            if (!Array.isArray(state.filters.subscriptions.selected)) state.filters.subscriptions.selected = [];
            const subscriptions = collectSubscriptions();
            const container = document.getElementById(CONFIG.ids.subscriptionsSelect);
            if (!container) return;
            container.innerHTML = '';
            subscriptions.forEach((count, name) => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = name; cb.checked = state.filters.subscriptions.selected.includes(name);
                cb.className = 'ifc-checkbox';
                cb.addEventListener('change', () => { state.filters.subscriptions.selected = getCheckboxValues(CONFIG.ids.subscriptionsSelect); updateScreen(); });
                const span = document.createElement('span'); span.className = 'ifc-checkbox-label'; span.textContent = `${name} (${count})`;
                label.appendChild(cb); label.appendChild(span); container.appendChild(label);
            });
        }

        // ==================== GENRES (F-33) ====================
        // ifcGenres is a JSON-encoded array (an item can have several genres), set from
        // the page's product data in setContainerData(); like Subscriptions, the list is
        // empty at build time and filled on the first updateScreen() cycle.
        // Reads a JSON-array data attribute (genres, platforms) - [] when absent or malformed
        function getItemJsonList(container, key) {
            try {
                const parsed = JSON.parse(container.dataset[key] || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (ex) { return []; }
        }
        function getItemGenres(container) { return getItemJsonList(container, 'ifcGenres'); }

        function collectGenres() {
            const genres = new Map();
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                getItemGenres(c).forEach(g => { if (g) genres.set(g, (genres.get(g) || 0) + 1); });
            });
            state.filters.genres.list = new Map(Array.from(genres.entries()).sort((a, b) => a[0].localeCompare(b[0])));
            return state.filters.genres.list;
        }

        async function addFilterContainerGenres() {
            if (!state.ui.divFilter) return;
            const gn = 'Genres';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updateGenresCheckboxes(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const fb = createFilterBlock(gn, 'Genres', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    cc.appendChild(createListSearch(CONFIG.ids.genresSelect, CONFIG.ids.genreSearch, 'genres'));
                    const gc = document.createElement('div');
                    gc.id = CONFIG.ids.genresSelect;
                    gc.className = 'ifc-checkbox-list ifc-checkbox-list-scrollable';
                    cc.appendChild(gc);
                }
                fg.appendChild(fb);
                updateGenresCheckboxes();
            } catch (ex) { console.error('Failed to add genres filter:', ex); }
        }

        function updateGenresCheckboxes() {
            const genres = collectGenres();
            const container = document.getElementById(CONFIG.ids.genresSelect);
            if (!container) return;
            container.innerHTML = '';
            genres.forEach((count, name) => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = name; cb.checked = state.filters.genres.selected.includes(name);
                cb.className = 'ifc-checkbox';
                cb.addEventListener('change', () => { state.filters.genres.selected = getCheckboxValues(CONFIG.ids.genresSelect); updateScreen(); });
                const span = document.createElement('span'); span.className = 'ifc-checkbox-label'; span.textContent = `${name} (${count})`;
                label.appendChild(cb); label.appendChild(span); container.appendChild(label);
            });
            applyListSearch(CONFIG.ids.genresSelect);
        }

        // ==================== PLATFORMS (F-34) ====================
        // Same pattern as Genres; ifcPlatforms holds store names ("Xbox Series X|S", "PC", ...)
        function collectPlatforms() {
            const platforms = new Map();
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                getItemJsonList(c, 'ifcPlatforms').forEach(p => { if (p) platforms.set(p, (platforms.get(p) || 0) + 1); });
            });
            state.filters.platforms.list = new Map(Array.from(platforms.entries()).sort((a, b) => a[0].localeCompare(b[0])));
            return state.filters.platforms.list;
        }

        async function addFilterContainerPlatforms() {
            if (!state.ui.divFilter) return;
            const gn = 'Platforms';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updatePlatformsCheckboxes(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const fb = createFilterBlock(gn, 'Platforms', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    const pc = document.createElement('div');
                    pc.id = CONFIG.ids.platformsSelect;
                    pc.className = 'ifc-checkbox-list';
                    cc.appendChild(pc);
                }
                fg.appendChild(fb);
                updatePlatformsCheckboxes();
            } catch (ex) { console.error('Failed to add platforms filter:', ex); }
        }

        function updatePlatformsCheckboxes() {
            const platforms = collectPlatforms();
            const container = document.getElementById(CONFIG.ids.platformsSelect);
            if (!container) return;
            container.innerHTML = '';
            platforms.forEach((count, name) => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = name; cb.checked = state.filters.platforms.selected.includes(name);
                cb.className = 'ifc-checkbox';
                cb.addEventListener('change', () => { state.filters.platforms.selected = getCheckboxValues(CONFIG.ids.platformsSelect); updateScreen(); });
                const span = document.createElement('span'); span.className = 'ifc-checkbox-label'; span.textContent = `${name} (${count})`;
                label.appendChild(cb); label.appendChild(span); container.appendChild(label);
            });
        }

        // ==================== TYPE (Game / DLC / Consumable) ====================
        // From the product kind in the page's data (free, no requests); fixed display order
        const TYPE_ORDER = ['Game', 'DLC', 'Consumable'];
        function collectTypes() {
            const types = new Map();
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                const t = c.dataset.ifcType;
                if (t && t !== 'null') types.set(t, (types.get(t) || 0) + 1);
            });
            const rank = t => { const i = TYPE_ORDER.indexOf(t); return i < 0 ? TYPE_ORDER.length : i; };
            state.filters.types.list = new Map(Array.from(types.entries()).sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])));
            return state.filters.types.list;
        }

        async function addFilterContainerTypes() {
            if (!state.ui.divFilter) return;
            const gn = 'Types';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updateTypesCheckboxes(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const fb = createFilterBlock(gn, 'Type', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    const list = document.createElement('div');
                    list.id = CONFIG.ids.typesSelect;
                    list.className = 'ifc-checkbox-list';
                    cc.appendChild(list);
                }
                fg.appendChild(fb);
                updateTypesCheckboxes();
            } catch (ex) { console.error('Failed to add type filter:', ex); }
        }

        function updateTypesCheckboxes() {
            const types = collectTypes();
            const container = document.getElementById(CONFIG.ids.typesSelect);
            if (!container) return;
            container.innerHTML = '';
            types.forEach((count, name) => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = name; cb.checked = state.filters.types.selected.includes(name);
                cb.className = 'ifc-checkbox';
                cb.addEventListener('change', () => { state.filters.types.selected = getCheckboxValues(CONFIG.ids.typesSelect); updateScreen(); });
                const span = document.createElement('span'); span.className = 'ifc-checkbox-label'; span.textContent = `${name} (${count})`;
                label.appendChild(cb); label.appendChild(span); container.appendChild(label);
            });
        }

        // ==================== CAPABILITIES / LOAD DETAILS (F-36) ====================
        // Capabilities (Optimized for X|S, Smart Delivery, Play Anywhere, 4K, co-op, ...) exist
        // only in each game's own store page - not in the wishlist page's data. They're fetched
        // on request ("Load details"), one page at a time with a pause between, and cached per
        // product id so later visits show them straight away. The only source used is the
        // same-origin store page (normal cookies); no tokens, no other hosts.
        // Gap between store page reads: 1 s normally, doubled (up to 8 s) after an error or a slow
        // answer so we ease off when Xbox is struggling, and eased back after normal answers
        const DETAILS_DELAY_MS = 1000, DETAILS_MAX_DELAY_MS = 8000, DETAILS_SLOW_MS = 3000, DETAILS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

        function loadCapabilityCache() {
            return new Promise(resolve => {
                try {
                    adapter.storage.load(CONFIG.storage.capsKey, (saved) => {
                        try {
                            const parsed = saved ? JSON.parse(saved) : null;
                            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) state.capCache = parsed;
                        } catch (ex) { console.error('Failed to read capability cache:', ex); }
                        resolve();
                    });
                } catch (ex) { console.error('Failed to load capability cache:', ex); resolve(); }
            });
        }
        function saveCapabilityCache() {
            try { adapter.storage.save(CONFIG.storage.capsKey, JSON.stringify(state.capCache)); }
            catch (ex) { console.error('Failed to save capability cache:', ex); }
        }
        // { key: label } for a product, or null if never loaded. Expired entries still show
        // (capabilities rarely change) until "Load details" refreshes them.
        function getCachedCapabilities(productId) {
            const entry = productId ? state.capCache[String(productId).toUpperCase()] : null;
            return entry && entry.caps && typeof entry.caps === 'object' ? entry.caps : null;
        }
        function isCapabilityFresh(productId) {
            const entry = state.capCache[String(productId).toUpperCase()];
            return !!(entry && typeof entry.at === 'number' && Date.now() - entry.at < DETAILS_TTL_MS);
        }
        // F-40: a game's add-ons count lives in the same cache entry ({ caps, at, addOns })
        function getCachedAddOnsCount(productId) {
            const entry = productId ? state.capCache[String(productId).toUpperCase()] : null;
            return entry && typeof entry.addOns === 'number' ? entry.addOns : null;
        }
        function needsAddOnsCount(productId) {
            const p = getProductData(productId);
            return !!(p && p.hasAddOns === true);
        }
        // Loaded = capabilities fresh and, for a game with add-ons, its count known
        function isDetailsFresh(productId) {
            return isCapabilityFresh(productId) && (!needsAddOnsCount(productId) || getCachedAddOnsCount(productId) !== null);
        }
        // Reads the total from the game's add-ons page (its browse channel for this product)
        async function fetchAddOnsCount(productId, itemUrl) {
            const url = addOnsUrl(productId, itemUrl);
            if (!url) throw new Error('no add-ons page address');
            const pageState = await fetchPageState(url);
            const channels = pageState && pageState.core2 && pageState.core2.channels && pageState.core2.channels.channelData;
            if (!channels || typeof channels !== 'object') throw new Error('no add-ons list on its page');
            const id = String(productId).toUpperCase(), keys = Object.keys(channels);
            const key = keys.find(k => k.toUpperCase().includes(`PRODUCTADDONS_${id}`)) || keys.find(k => /PRODUCTADDONS_/i.test(k));
            const total = key && channels[key] && channels[key].data ? channels[key].data.totalItems : undefined;
            if (typeof total !== 'number') throw new Error('no add-ons count on its page');
            return total;
        }

        // One entry per product id (several items can share one), shown items first
        function detailsQueue() {
            const seen = new Set(), all = Array.from(document.getElementsByClassName(CONFIG.selectors.items));
            const ordered = [...all.filter(shouldShowContainer), ...all.filter(c => !shouldShowContainer(c))];
            return ordered.map(c => ({ id: (c.dataset.ifcProductId || '').toUpperCase(), url: c.dataset.ifcUri }))
                .filter(e => e.id && e.id !== 'NULL' && e.url && e.url !== 'null' && !seen.has(e.id) && seen.add(e.id));
        }

        async function loadDetails() {
            const d = state.details;
            if (d.running) return;
            if (contextLost()) { handleContextLost(); return; }
            const queue = detailsQueue().filter(e => !isDetailsFresh(e.id));
            Object.assign(d, { running: true, cancel: false, done: 0, total: queue.length, failed: 0, message: '' });
            renderDetailsStatus();
            const delay = typeof state.debug.detailsDelayMs === 'number' ? state.debug.detailsDelayMs : DETAILS_DELAY_MS;
            let gap = delay;
            for (let i = 0; i < queue.length && !d.cancel; i++) {
                if (contextLost()) { handleContextLost(); break; }   // extension reloaded mid-run
                const { id, url } = queue[i];
                const t0 = Date.now();
                let eased = false;
                try {
                    // Only what's missing: the store page (capabilities) and/or the add-ons page (count)
                    const needCaps = !isCapabilityFresh(id);
                    if (needCaps) {
                        const summary = productSummariesFrom(await fetchPageState(url)).get(id);
                        const caps = {};
                        if (summary && summary.capabilities && typeof summary.capabilities === 'object') {
                            Object.entries(summary.capabilities).forEach(([k, v]) => { if (typeof v === 'string' && v.trim()) caps[k] = v.trim(); });
                        }
                        // Stored even when empty, so a game with no capabilities isn't re-fetched every time
                        state.capCache[id] = { caps, at: Date.now() };
                    }
                    if (needsAddOnsCount(id) && (needCaps || getCachedAddOnsCount(id) === null)) {
                        if (needCaps) await new Promise(r => setTimeout(r, gap));   // same pause between the two pages
                        state.capCache[id].addOns = await fetchAddOnsCount(id, url);
                    }
                    eased = Date.now() - t0 < DETAILS_SLOW_MS * (needCaps && needsAddOnsCount(id) ? 2 : 1);
                } catch (ex) {
                    d.failed++;
                    if (/HTTP 429/.test(ex.message)) { d.message = 'Xbox is limiting requests - stopped; try again later.'; d.done++; break; }
                }
                gap = eased ? Math.max(delay, Math.round(gap / 2)) : Math.min(gap * 2, DETAILS_MAX_DELAY_MS);
                d.done++;
                if (d.done % 10 === 0) { saveCapabilityCache(); updateScreen(); }
                renderDetailsStatus();
                if (i < queue.length - 1 && !d.cancel) await new Promise(r => setTimeout(r, gap));
            }
            if (!d.message) d.message = d.cancel ? `Stopped after ${d.done} of ${d.total}.`
                : `Loaded ${d.done - d.failed} of ${d.total}${d.failed ? `, ${d.failed} failed` : ''}.`;
            d.running = false;
            saveCapabilityCache(); updateScreen();
        }

        // Refreshes ONE product from its store page: its capabilities (cached like "Load
        // details") and, for this session, its product data (rating, deal, pre-order,
        // platforms, type) - the store page carries the same summary plus more. Every item
        // sharing the product id picks it up on the updateScreen() below. The shown price
        // itself is Xbox's own markup and only changes on a page reload.
        async function refreshItem(productId, url) {
            const id = String(productId || '').toUpperCase(), status = state.details.itemStatus;
            if (contextLost()) { handleContextLost(); return; }
            if (!id || !url || (status[id] && status[id].busy)) return;
            status[id] = { busy: true };
            updateScreen();
            try {
                const summary = productSummariesFrom(await fetchPageState(url)).get(id);
                if (!summary) throw new Error('no data on its store page');
                state.productData.set(id, summary);
                const caps = {};
                if (summary.capabilities && typeof summary.capabilities === 'object') {
                    Object.entries(summary.capabilities).forEach(([k, v]) => { if (typeof v === 'string' && v.trim()) caps[k] = v.trim(); });
                }
                state.capCache[id] = { caps, at: Date.now() };
                // F-40: and the add-ons count for a game that has add-ons
                if (summary.hasAddOns === true) state.capCache[id].addOns = await fetchAddOnsCount(id, url);
                saveCapabilityCache();
                status[id] = { busy: false, at: Date.now() };
            } catch (ex) {
                status[id] = { busy: false, error: (ex.message || 'failed').replace(/ for https?:\S+/, '') };
            }
            updateScreen();
        }

        function renderDetailsStatus() {
            try {
                const status = getElement(`#${CONFIG.ids.detailsStatus}`, false), btn = getElement(`#${CONFIG.ids.detailsButton}`, false);
                if (!status || !btn) return;
                const d = state.details, queue = detailsQueue();
                const loaded = queue.filter(e => getCachedCapabilities(e.id)).length, stale = queue.filter(e => !isDetailsFresh(e.id)).length;
                if (d.running) {
                    status.textContent = `Loading details ${d.done} / ${d.total}...`;
                    btn.textContent = 'Cancel'; btn.disabled = false;
                } else {
                    status.textContent = `${d.message ? d.message + ' ' : ''}Details for ${loaded} of ${queue.length} games.`;
                    btn.textContent = stale ? `Load details (${stale})` : 'Details up to date';
                    btn.disabled = stale === 0;
                }
                btn.title = 'Reads each game\'s store page (and, for games with add-ons, its add-ons page for the count), about one a second (slower if Xbox is slow to answer); results are kept for 7 days.';
            } catch (ex) { console.error('Failed to render details status:', ex); }
        }

        function collectCapabilities() {
            const caps = new Map();
            Array.from(document.getElementsByClassName(CONFIG.selectors.items)).forEach(c => {
                getItemJsonList(c, 'ifcCapabilities').forEach(k => { if (k) caps.set(k, (caps.get(k) || 0) + 1); });
            });
            state.filters.capabilities.list = new Map(Array.from(caps.entries()).sort((a, b) => a[0].localeCompare(b[0])));
            return state.filters.capabilities.list;
        }

        async function addFilterContainerCapabilities() {
            if (!state.ui.divFilter) return;
            const gn = 'Capabilities';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updateCapabilitiesCheckboxes(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const fb = createFilterBlock(gn, 'Capabilities', true);
                const cc = fb.querySelector('.ifc-accordion-content');
                if (cc) {
                    const bar = document.createElement('div'); bar.className = 'ifc-details-bar';
                    const status = document.createElement('div'); status.id = CONFIG.ids.detailsStatus; status.className = 'ifc-details-status';
                    status.setAttribute('aria-live', 'polite');
                    const btn = document.createElement('button'); btn.type = 'button'; btn.id = CONFIG.ids.detailsButton; btn.className = 'ifc-quick-filter-btn';
                    btn.addEventListener('click', () => { if (state.details.running) state.details.cancel = true; else loadDetails(); });
                    bar.append(status, btn); cc.appendChild(bar);
                    cc.appendChild(createListSearch(CONFIG.ids.capabilitiesSelect, 'ifc_input_capability_search', 'capabilities'));
                    const list = document.createElement('div');
                    list.id = CONFIG.ids.capabilitiesSelect;
                    list.className = 'ifc-checkbox-list ifc-checkbox-list-scrollable';
                    cc.appendChild(list);
                }
                fg.appendChild(fb);
                updateCapabilitiesCheckboxes();
            } catch (ex) { console.error('Failed to add capabilities filter:', ex); }
        }

        function updateCapabilitiesCheckboxes() {
            const caps = collectCapabilities();
            const container = document.getElementById(CONFIG.ids.capabilitiesSelect);
            if (!container) return;
            container.innerHTML = '';
            caps.forEach((count, name) => {
                const label = document.createElement('label'); label.className = 'ifc-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = name; cb.checked = state.filters.capabilities.selected.includes(name);
                cb.className = 'ifc-checkbox';
                cb.addEventListener('change', () => { state.filters.capabilities.selected = getCheckboxValues(CONFIG.ids.capabilitiesSelect); updateScreen(); });
                const span = document.createElement('span'); span.className = 'ifc-checkbox-label'; span.textContent = `${name} (${count})`;
                label.appendChild(cb); label.appendChild(span); container.appendChild(label);
            });
            applyListSearch(CONFIG.ids.capabilitiesSelect);
            renderDetailsStatus();
        }

        // Moves a range filter onto new slider bounds. An inactive filter spans the full
        // new range; an active one keeps the user's selection, clamped inside it. A
        // selection edge left at the old end means "no limit" on that side (e.g.
        // "≥50% Off"), so it stays pinned to the new end instead. Used both when the
        // range shifts as items render and when a saved selection is restored on load.
        function rerangeSelection(prev, min, max) {
            const pinnedMin = !prev.enabled || prev.currentMin === prev.min, pinnedMax = !prev.enabled || prev.currentMax === prev.max;
            const currentMin = pinnedMin ? min : Math.min(Math.max(prev.currentMin, min), max);
            const currentMax = pinnedMax ? max : Math.max(Math.min(prev.currentMax, max), currentMin);
            return { ...prev, min, max, currentMin, currentMax };
        }

        function calculatePriceRange() {
            const containers = document.getElementsByClassName(CONFIG.selectors.items);
            let min = Infinity, max = 0;
            Array.from(containers).forEach(c => {
                const price = parseFloat(c.dataset.ifcPrice);
                if (!isNaN(price) && price > 0) { min = Math.min(min, price); max = Math.max(max, price); }
            });
            // No priced items (all free/Game Pass/unavailable): keep the old default span
            if (min === Infinity) { min = 0; max = 3000; }
            if (max < min) max = min;
            min = Math.floor(min / 10) * 10;
            max = Math.ceil(max / 10) * 10;
            // A single price (or all prices within one rounding bucket) would give a zero-width slider
            if (max <= min) max = min + 10;
            return { min, max };
        }

        function calculateDiscountRange() {
            const containers = document.getElementsByClassName(CONFIG.selectors.items);
            let min = 100, max = 0;
            Array.from(containers).forEach(c => {
                const d = parseInt(c.dataset.ifcPriceDiscountPercent);
                if (!isNaN(d) && d > 0) { min = Math.min(min, d); max = Math.max(max, d); }
            });
            if (min === 100) min = 0;
            if (max < min) max = min;
            if (min === 0 && max === 0) max = 100;
            min = Math.floor(min / 5) * 5; max = Math.ceil(max / 5) * 5;
            // All discounts in one rounding bucket would give a zero-width slider (NaN fill)
            if (max <= min) max = min + 5;
            return { min, max };
        }

        function addPriceRangeFilter() {
            if (!state.ui.divFilter) return;
            const gn = 'PriceRange';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updatePriceSlider(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const { min, max } = calculatePriceRange();
                // Re-applies a restored selection (loadFilterState) to this page's range
                state.filters.priceRange = rerangeSelection(state.filters.priceRange, min, max);
                const { currentMin, currentMax } = state.filters.priceRange;
                const fb = createFilterBlock(gn, 'Price Range', false);
                const cc = fb.querySelector('.ifc-filter-block-static');
                if (cc) {
                    const slider = createRangeSlider(CONFIG.ids.priceSlider, min, max, currentMin, currentMax, (minVal, maxVal) => {
                        state.filters.priceRange.currentMin = minVal; state.filters.priceRange.currentMax = maxVal;
                        state.filters.priceRange.enabled = true;
                        const l = getElement(`#${CONFIG.ids.priceSlider}_label`);
                        if (l) l.textContent = `${formatCurrency(minVal)} - ${formatCurrency(maxVal)}`;
                        updateScreen();
                    });
                    cc.appendChild(slider);
                    const l = slider.querySelector('.ifc-slider-label');
                    if (l) l.textContent = `${formatCurrency(currentMin)} - ${formatCurrency(currentMax)}`;
                }
                fg.appendChild(fb);
            } catch (ex) { console.error('Failed to add price range filter:', ex); }
        }

        function updatePriceSlider() {
            const { min, max } = calculatePriceRange();
            if (state.filters.priceRange.min !== min || state.filters.priceRange.max !== max) {
                // The range moves as more items render
                state.filters.priceRange = rerangeSelection(state.filters.priceRange, min, max);
                const mn = getElement(`#${CONFIG.ids.priceSlider}_min`), mx = getElement(`#${CONFIG.ids.priceSlider}_max`);
                if (mn && mx) {
                    // Same step formula as createRangeSlider() - a stale step from a wider
                    // range could make the new max unreachable by dragging.
                    const step = Math.max(1, Math.round((max - min) / 100));
                    mn.min = min; mn.max = max; mx.min = min; mx.max = max; mn.step = step; mx.step = step;
                    syncPriceSliderUI();
                }
            }
        }
        // Moves the price slider's thumbs/fill/label to match state.filters.priceRange
        // without re-triggering its onChange (mn.dispatchEvent below fires with
        // isUserInteraction still false, since we don't dispatch mousedown first) -
        // used whenever the range is set programmatically rather than by dragging.
        function syncPriceSliderUI() {
            const { currentMin, currentMax } = state.filters.priceRange;
            const mn = getElement(`#${CONFIG.ids.priceSlider}_min`), mx = getElement(`#${CONFIG.ids.priceSlider}_max`);
            if (mn && mx) {
                mn.value = currentMin; mx.value = currentMax; mn.dispatchEvent(new Event('input'));
                const l = getElement(`#${CONFIG.ids.priceSlider}_label`);
                if (l) l.textContent = `${formatCurrency(currentMin)} - ${formatCurrency(currentMax)}`;
            }
        }
        function resetPriceSlider() {
            const { min, max } = state.filters.priceRange;
            state.filters.priceRange.currentMin = min; state.filters.priceRange.currentMax = max; state.filters.priceRange.enabled = false;
            syncPriceSliderUI();
        }

        function addDiscountRangeFilter() {
            if (!state.ui.divFilter) return;
            const gn = 'DiscountRange';
            try {
                if (getElement(`#ifc_group_${gn}`, false)) { updateDiscountSlider(); return; }
                const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
                if (!fg) return;
                const { min, max } = calculateDiscountRange();
                // Re-applies a restored selection (loadFilterState) to this page's range
                state.filters.discountRange = rerangeSelection(state.filters.discountRange, min, max);
                const { currentMin, currentMax } = state.filters.discountRange;
                const fb = createFilterBlock(gn, 'Discount Range', false);
                const cc = fb.querySelector('.ifc-filter-block-static');
                if (cc) {
                    const slider = createRangeSlider(CONFIG.ids.discountSlider, min, max, currentMin, currentMax, (minVal, maxVal) => {
                        state.filters.discountRange.currentMin = minVal; state.filters.discountRange.currentMax = maxVal;
                        state.filters.discountRange.enabled = true;
                        const l = getElement(`#${CONFIG.ids.discountSlider}_label`);
                        if (l) l.textContent = `${formatPercentage(minVal)} - ${formatPercentage(maxVal)}`;
                        updateScreen();
                    });
                    cc.appendChild(slider);
                    const l = slider.querySelector('.ifc-slider-label');
                    if (l) l.textContent = `${formatPercentage(currentMin)} - ${formatPercentage(currentMax)}`;
                }
                fg.appendChild(fb);
            } catch (ex) { console.error('Failed to add discount range filter:', ex); }
        }

        function updateDiscountSlider() {
            const { min, max } = calculateDiscountRange();
            if (state.filters.discountRange.min !== min || state.filters.discountRange.max !== max) {
                // e.g. off the 0-100 fallback used when built before discount badges rendered
                state.filters.discountRange = rerangeSelection(state.filters.discountRange, min, max);
                const mn = getElement(`#${CONFIG.ids.discountSlider}_min`), mx = getElement(`#${CONFIG.ids.discountSlider}_max`);
                if (mn && mx) {
                    const step = Math.max(1, Math.round((max - min) / 100));
                    mn.min = min; mn.max = max; mx.min = min; mx.max = max; mn.step = step; mx.step = step;
                    syncDiscountSliderUI();
                }
            }
        }
        // See syncPriceSliderUI() above for why this is separate from resetDiscountSlider().
        function syncDiscountSliderUI() {
            const { currentMin, currentMax } = state.filters.discountRange;
            const mn = getElement(`#${CONFIG.ids.discountSlider}_min`), mx = getElement(`#${CONFIG.ids.discountSlider}_max`);
            if (mn && mx) {
                mn.value = currentMin; mx.value = currentMax; mn.dispatchEvent(new Event('input'));
                const l = getElement(`#${CONFIG.ids.discountSlider}_label`);
                if (l) l.textContent = `${formatPercentage(currentMin)} - ${formatPercentage(currentMax)}`;
            }
        }
        function resetDiscountSlider() {
            const { min, max } = state.filters.discountRange;
            state.filters.discountRange.currentMin = min; state.filters.discountRange.currentMax = max; state.filters.discountRange.enabled = false;
            syncDiscountSliderUI();
        }

        async function addFilterControls() {
            try {
                addFilterLabel(); addFilterButton(); addSortButton(); addExportButton(); addThemeButton(); addRefreshButton();
                addFilterContainer(); addSortContainer();
                addSearchFilter(); addQuickFilters();
                await addFilterContainerOwned(); await addFilterContainerPublishers(); await addFilterContainerSubscriptions();
                await addFilterContainerGenres(); await addFilterContainerPlatforms(); await addFilterContainerTypes(); await addFilterContainerCapabilities();
                addPriceRangeFilter(); addDiscountRangeFilter();
                addSavedPresets();
            } catch (ex) { console.error('Failed to add filter controls:', ex); }
        }

        // ==================== FILTER TOGGLE HANDLERS ====================
        // Applies filter panel visibility directly, with no side effect on the
        // sort panel - used by toggleFilterContainer() and by
        // toggleSortContainer() when it needs to close this panel, so opening
        // one panel while the other is open can't recurse back and forth.
        function setFilterVisible(show) {
            const fc = getElement(`#${CONFIG.ids.filterContainer}`), fb = getElement(`#${CONFIG.ids.filterButton}`);
            if (!fc || !fb) return;
            state.ui.divFilterShow = show;
            fc.classList.toggle('ifc-hidden', !show);
            fb.setAttribute('aria-pressed', show ? 'true' : 'false');
            fb.classList[show ? 'add' : 'remove'](CONFIG.classes.activeButton);
        }

        function toggleFilterContainer() {
            try {
                const show = !state.ui.divFilterShow;
                if (show && state.ui.divSortShow) setSortVisible(false);
                if (show) setExportMenuOpen(false);
                setFilterVisible(show);
            } catch (ex) { console.error('Failed to toggle filter container:', ex); }
        }

        // ==================== SORT CONTAINER ====================
        function addSortContainer() {
            if (state.ui.divSort) return;
            try {
                if (getElement(`#${CONFIG.ids.sortContainer}`, false)) return;
                const sc = document.createElement('div');
                sc.id = CONFIG.ids.sortContainer;
                sc.classList.add('filter-section', 'ifc-hidden');
                const sl = document.createElement('div');
                sl.classList.add('filter-list');
                const h = document.createElement('h2');
                h.classList.add('filter-text-heading');
                h.textContent = 'Sort';
                const scc = document.createElement('div');
                scc.id = 'ifc_sort_criteria_container'; scc.className = 'ifc-sort-criteria-container';
                sl.appendChild(h); sl.appendChild(scc); sc.appendChild(sl);
                document.body.appendChild(sc);
                // (the Sort button wires its own click in addSortButton - see reinitAfterRerender)
                renderSortCriteria();
                state.ui.divSort = true;
            } catch (ex) { console.error('Failed to add sort container:', ex); }
        }

        // See setFilterVisible() above for why this is separate from toggleSortContainer().
        function setSortVisible(show) {
            const sc = getElement(`#${CONFIG.ids.sortContainer}`), sb = getElement(`#${CONFIG.ids.sortButton}`);
            if (!sc || !sb) return;
            state.ui.divSortShow = show;
            sc.classList.toggle('ifc-hidden', !show);
            sb.setAttribute('aria-pressed', show ? 'true' : 'false');
            sb.classList[show ? 'add' : 'remove'](CONFIG.classes.activeButton);
        }

        function toggleSortContainer() {
            try {
                const show = !state.ui.divSortShow;
                if (show && state.ui.divFilterShow) setFilterVisible(false);
                if (show) setExportMenuOpen(false);
                setSortVisible(show);
            } catch (ex) { console.error('Failed to toggle sort container:', ex); }
        }

        function renderSortCriteria() {
            const container = getElement('#ifc_sort_criteria_container');
            if (!container) return;
            container.innerHTML = '';
            state.sort.criteria.forEach((criterion, index) => {
                const row = document.createElement('div'); row.className = 'ifc-sort-criterion';
                const select = document.createElement('select'); select.className = 'ifc-sort-select';
                state.sort.fields.forEach(field => {
                    const opt = document.createElement('option');
                    opt.value = field.value; opt.textContent = field.label; opt.selected = field.value === criterion.field;
                    select.appendChild(opt);
                });
                select.addEventListener('change', (e) => {
                    state.sort.criteria[index].field = e.target.value;
                    const sf = state.sort.fields.find(f => f.value === e.target.value);
                    if (sf) state.sort.criteria[index].label = sf.label;
                    onSortChanged();
                });
                const toggleBtn = document.createElement('button'); toggleBtn.className = 'ifc-sort-toggle';
                toggleBtn.textContent = criterion.order === 'asc' ? '↑' : '↓';
                toggleBtn.title = criterion.order === 'asc' ? 'Ascending' : 'Descending';
                toggleBtn.addEventListener('click', () => {
                    state.sort.criteria[index].order = criterion.order === 'asc' ? 'desc' : 'asc';
                    toggleBtn.textContent = state.sort.criteria[index].order === 'asc' ? '↑' : '↓';
                    toggleBtn.title = state.sort.criteria[index].order === 'asc' ? 'Ascending' : 'Descending';
                    onSortChanged();
                });
                row.appendChild(select); row.appendChild(toggleBtn);
                if (index > 0) {
                    const removeBtn = document.createElement('button'); removeBtn.className = 'ifc-sort-remove';
                    setGlyph(removeBtn, 'IMGClose', '×'); removeBtn.title = 'Remove sort criterion';
                    removeBtn.setAttribute('aria-label', 'Remove sort criterion');
                    removeBtn.addEventListener('click', () => { state.sort.criteria.splice(index, 1); renderSortCriteria(); onSortChanged(); });
                    row.appendChild(removeBtn);
                }
                container.appendChild(row);
            });
            if (state.sort.criteria.length < 3) {
                const addBtn = document.createElement('button'); addBtn.className = 'ifc-sort-add';
                const plus = document.createElement('span'); plus.className = 'ifc-sort-add-icon';
                setGlyph(plus, 'IMGPlus', '+');
                addBtn.append(plus, ' Add Sort Level');
                addBtn.addEventListener('click', () => {
                    if (state.sort.criteria.length < 3) {
                        state.sort.criteria.push({ field: 'ifcName', order: 'asc', label: 'Name' });
                        renderSortCriteria(); onSortChanged();
                    }
                });
                container.appendChild(addBtn);
            }
        }

        // Sort controls don't go through updateScreen(), so they save explicitly
        function onSortChanged() { applySorting(); updateSortIndicator(); saveFilterState(); }

        function isDefaultSort() {
            const c = state.sort.criteria;
            return c.length === 1 && c[0].field === 'ifcId' && c[0].order === 'desc';
        }

        // Dot on the sort button while a non-default sort is active - including one
        // restored on load, which would otherwise be easy to miss.
        function updateSortIndicator() {
            try {
                const btn = getElement(`#${CONFIG.ids.sortButton}`, false);
                if (!btn) return;
                const custom = !isDefaultSort();
                btn.classList.toggle('ifc-badge-active', custom);
                let dot = btn.querySelector('.ifc-badge-dot');
                if (!dot) {
                    dot = document.createElement('span');
                    dot.className = 'ifc-badge-dot';
                    dot.setAttribute('aria-hidden', 'true');
                    btn.appendChild(dot);
                }
                dot.classList.toggle('ifc-hidden', !custom);
                const label = custom ? 'Sort (custom sort active)' : 'Sort';
                btn.title = label; btn.setAttribute('aria-label', label);
            } catch (ex) { console.error('Failed to update sort indicator:', ex); }
        }

        function applySorting() {
            try {
                const containers = Array.from(document.getElementsByClassName(CONFIG.selectors.items));
                const parent = containers[0]?.parentElement; if (!parent) return;
                containers.sort((a, b) => {
                    for (const c of state.sort.criteria) {
                        // Items with no price (un-purchasable, unreadable) have no meaningful
                        // price or discount - sort them last in either direction instead of
                        // reading them as 0, which put them among the cheapest/undiscounted.
                        if (['ifcPrice', 'ifcPriceDiscountPercent', 'ifcPriceDiscountAmount'].includes(c.field)) {
                            const aMissing = isNaN(parseFloat(a.dataset.ifcPrice)), bMissing = isNaN(parseFloat(b.dataset.ifcPrice));
                            if (aMissing !== bMissing) return aMissing ? 1 : -1;
                            if (aMissing) continue;
                        }
                        // Same for product-data fields: unrated, unreleased or no current deal sorts last
                        if (['ifcRating', 'ifcReleaseDate', 'ifcDealEnds'].includes(c.field)) {
                            const aMissing = isNaN(parseFloat(a.dataset[c.field])), bMissing = isNaN(parseFloat(b.dataset[c.field]));
                            if (aMissing !== bMissing) return aMissing ? 1 : -1;
                            if (aMissing) continue;
                        }
                        const aVal = a.dataset[c.field], bVal = b.dataset[c.field];
                        let cmp = 0;
                        if (['ifcId', 'ifcPrice', 'ifcPriceDiscountPercent', 'ifcPriceDiscountAmount', 'ifcRating', 'ifcReleaseDate', 'ifcDealEnds'].includes(c.field)) {
                            cmp = (parseFloat(aVal) || 0) - (parseFloat(bVal) || 0);
                        } else { cmp = (aVal || '').toString().toLowerCase().localeCompare((bVal || '').toString().toLowerCase()); }
                        if (cmp !== 0) return c.order === 'asc' ? cmp : -cmp;
                    }
                    return 0;
                });
                containers.forEach(c => parent.appendChild(c));
            } catch (ex) { console.error('Failed to apply sorting:', ex); }
        }

        // ==================== ITEM FILTERING ====================
        function injectDiscountBadge(container, discountPercent) {
            try {
                const existing = container.querySelector('.ifc-discount-badge');
                if (existing) { existing.textContent = `-${discountPercent}%`; return; }
                const pd = safeQuerySelector(container, CONFIG.selectors.productDetails); if (!pd) return;
                const badge = document.createElement('span'); badge.className = 'ifc-discount-badge';
                const dtc = resolveClass(PREFIXES.discountTag); if (dtc) badge.classList.add(dtc);
                badge.textContent = `-${discountPercent}%`;
                badge.setAttribute('aria-label', `${discountPercent}% discount`);
                const pc = pd.querySelector('div');
                if (pc) { pc.classList.add('ifc-price-row'); pc.appendChild(badge); }
            } catch (ex) { console.error('Failed to inject discount badge:', ex); }
        }

        // The Xbox store URL is .../store/<slug>/<productId>/<skuIndex>[/<skuId>] -
        // the segment right after the slug is a stable catalog ID, unlike ifcId
        // (a position counter that changes if the list reorders or its length changes).
        function extractProductId(uri) {
            if (!uri) return null;
            const match = uri.match(/\/store\/[^/]+\/([a-z0-9]+)/i);
            return match ? match[1] : null;
        }

        // Subscription badges (Game Pass, EA Play, ...) render inside the price
        // row's "afterPriceTextContainer" span, but not consistently: some carry
        // an icon with a semantic aria-label (Game Pass), others are plain text
        // with no icon at all (EA Play) - so an item can have zero, one, or more
        // than one subscription attached, none of it discoverable from a single
        // fixed selector. Handle both shapes and return every one found.
        function extractSubscriptions(container) {
            const found = [];
            const containerClass = resolveClass(PREFIXES.afterPriceTextContainer);
            if (!containerClass) return found;
            const el = container.querySelector(`.${CSS.escape(containerClass)}`);
            if (!el) return found;
            el.querySelectorAll('[aria-label]').forEach(node => {
                const label = node.getAttribute('aria-label');
                if (label && !found.includes(label)) found.push(label);
            });
            if (found.length === 0) {
                const match = el.textContent.trim().match(/^with\s+(.+)$/i);
                if (match) found.push(match[1].trim());
            }
            return found;
        }

        function setContainerData(container, id) {
            setDataAttribute(container, 'ifcId', id);
            const img = CONFIG.selectors.imageContainer ? safeQuerySelector(container, CONFIG.selectors.imageContainer) : null;
            setDataAttribute(container, 'ifcImage', img?.src);
            const link = CONFIG.selectors.productLink ? safeQuerySelector(container, CONFIG.selectors.productLink) : null;
            setDataAttribute(container, 'ifcName', link?.innerText);
            setDataAttribute(container, 'ifcUri', link?.href);
            setDataAttribute(container, 'ifcProductId', extractProductId(link?.href));
            const publisher = CONFIG.selectors.productPublisher ? safeQuerySelector(container, CONFIG.selectors.productPublisher) : null;
            setDataAttribute(container, 'ifcPublisher', publisher?.innerText);

            let priceBase = null, priceDiscount = null;
            const opc = resolveClass(PREFIXES.originalPrice), dpc = resolveClass(PREFIXES.discountPrice), btc = resolveClass(PREFIXES.boldText);
            if (opc) { const el = container.querySelector(`.${CSS.escape(opc)}`); if (el) priceBase = parseFloat(el.innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')); }
            if (dpc) { const el = container.querySelector(`.${CSS.escape(dpc)}`); if (el) priceDiscount = parseFloat(el.innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')); }
            if (priceBase === null && priceDiscount === null && btc) { const el = container.querySelector(`.${CSS.escape(btc)}`); if (el) priceBase = parseFloat(el.innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')); }
            if (priceBase === null && priceDiscount === null && CONFIG.selectors.productPrices) {
                const prices = container.querySelectorAll(CONFIG.selectors.productPrices);
                priceBase = prices[0] ? parseFloat(prices[0].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
                priceDiscount = prices[1] ? parseFloat(prices[1].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
            }
            const pbr = priceBase && !isNaN(priceBase) ? Math.round(priceBase * 100) / 100 : null;
            const pdr = priceDiscount && !isNaN(priceDiscount) ? Math.round(priceDiscount * 100) / 100 : null;
            setDataAttribute(container, 'ifcPriceBase', pbr);
            setDataAttribute(container, 'ifcPriceDiscount', pdr);
            setDataAttribute(container, 'ifcPrice', pdr ?? pbr);
            if (pdr && pdr > 0 && pbr) {
                const da = pbr - pdr, dp = (da / pbr) * 100;
                const dar = Math.round(da * 100) / 100, dpr = Math.round(dp);
                setDataAttribute(container, 'ifcPriceDiscountAmount', dar);
                setDataAttribute(container, 'ifcPriceDiscountPercent', dpr);
                if (dpr > 0) injectDiscountBadge(container, dpr);
            } else {
                setDataAttribute(container, 'ifcPriceDiscountAmount', 0);
                setDataAttribute(container, 'ifcPriceDiscountPercent', 0);
            }
            setDataAttribute(container, 'ifcSubscriptions', JSON.stringify(extractSubscriptions(container)));
            setProductDataAttributes(container);
            const button = safeQuerySelector(container, 'button');
            const buttonText = button?.innerText;
            const hasOwnedText = container.innerText.indexOf('Owned') !== -1;
            // FIX: Include 'BUY AS A GIFT' for public wishlists
            const isBuyButton = buttonText === 'BUY' || buttonText === 'BUY TO OWN' || buttonText === 'BUY AS A GIFT';
            const isOwned = hasOwnedText && !isBuyButton;
            if (isOwned) { container.classList.add('ifc-Owned'); setDataAttribute(container, 'ifcOwned', true); }
            else { setDataAttribute(container, 'ifcOwned', false); }
            const isUnPurchasable = !isOwned && container.dataset.ifcPrice === 'null';
            if (isUnPurchasable) { container.classList.add('ifc-UnPurchasable'); setDataAttribute(container, 'ifcUnpurchasable', true); }
            else { setDataAttribute(container, 'ifcUnpurchasable', false); }
        }

        function shouldShowContainer(container) {
            const isOwned = container.dataset.ifcOwned === 'true';
            const isUnPurchasable = container.dataset.ifcUnpurchasable === 'true';
            const publisher = container.dataset.ifcPublisher;
            const price = parseFloat(container.dataset.ifcPrice);
            const discount = parseInt(container.dataset.ifcPriceDiscountPercent);
            const searchTerm = state.filters.search.term.trim().toLowerCase();
            if (searchTerm !== '') {
                const name = container.dataset.ifcName;
                const nameMatches = name && name !== 'null' && name.toLowerCase().includes(searchTerm);
                const publisherMatches = publisher && publisher !== 'null' && publisher.toLowerCase().includes(searchTerm);
                if (!nameMatches && !publisherMatches) return false;
            }
            if (state.filters.owned.selected.length > 0) {
                let m = false;
                if (state.filters.owned.selected.includes('Owned') && isOwned) m = true;
                if (state.filters.owned.selected.includes('Not Owned') && !isOwned && !isUnPurchasable) m = true;
                if (state.filters.owned.selected.includes('Un-Purchasable') && isUnPurchasable) m = true;
                if (!m) return false;
            }
            if (state.filters.publishers.selected.length > 0) {
                if (publisher && publisher !== 'null' && publisher.trim() !== '') {
                    if (!state.filters.publishers.selected.includes(publisher.trim())) return false;
                } else return false;
            }
            if (state.filters.subscriptions.selected.length > 0) {
                // An item can carry more than one subscription - match if it has ANY of the selected ones.
                const itemSubscriptions = getItemSubscriptions(container);
                if (!itemSubscriptions.some(s => state.filters.subscriptions.selected.includes(s))) return false;
            }
            if (state.filters.genres.selected.length > 0) {
                // Items can have several genres - match if it has ANY of the selected ones
                if (!getItemGenres(container).some(g => state.filters.genres.selected.includes(g))) return false;
            }
            if (state.filters.inPass && container.dataset.ifcInPass !== 'true') return false;
            if (state.filters.platforms.selected.length > 0) {
                // Multi-platform items - match if it's on ANY of the selected platforms
                if (!getItemJsonList(container, 'ifcPlatforms').some(p => state.filters.platforms.selected.includes(p))) return false;
            }
            if (state.filters.justForYou && container.dataset.ifcDealType !== 'personal') return false;
            if (state.filters.preorder && container.dataset.ifcPreorder !== 'true') return false;
            if (state.filters.hasAddOns && container.dataset.ifcHasAddOns !== 'true') return false;
            if (state.filters.capabilities.selected.length > 0) {
                // Capabilities are features you want together - the item needs ALL selected ones.
                // Items whose details aren't loaded yet have none, so they don't match.
                const caps = getItemJsonList(container, 'ifcCapabilities');
                if (!state.filters.capabilities.selected.every(c => caps.includes(c))) return false;
            }
            if (state.filters.types.selected.length > 0 && !state.filters.types.selected.includes(container.dataset.ifcType)) return false;
            if (state.filters.priceRange.enabled) {
                // No price data at all (e.g. un-purchasable items) can't be "in range" - exclude.
                if (isNaN(price)) return false;
                if (price < state.filters.priceRange.currentMin || price > state.filters.priceRange.currentMax) return false;
            }
            if (state.filters.discountRange.enabled) {
                // No price means no meaningful discount either - exclude, same as above.
                if (isNaN(price)) return false;
                if (discount < state.filters.discountRange.currentMin || discount > state.filters.discountRange.currentMax) return false;
            }
            return true;
        }

        function toggleContainers() {
            const containers = document.getElementsByClassName(CONFIG.selectors.items);
            // ifcId records the wishlist's own order (the order items were added - the
            // page exposes no date-added). Number each item once, the first time it is
            // seen, while the list is still in page order: re-deriving it from DOM
            // position on every update picked up whatever sort was applied last, so
            // "Default" no longer restored the original order. Items that appear later
            // continue below the lowest id, so they sort after the ones already seen.
            const unnumbered = Array.from(containers).filter(c => !c.dataset.ifcId);
            let nextId = (state.ui.lowestItemId ?? unnumbered.length + 1) - 1;
            unnumbered.forEach(c => { c.dataset.ifcId = nextId--; });
            state.ui.lowestItemId = nextId + 1;
            Array.from(containers).forEach(c => setContainerData(c, c.dataset.ifcId));
            updateOwnedCounts(); collectPublishers(); updatePublishersCheckboxes(); updateSubscriptionsCheckboxes(); updateGenresCheckboxes(); updatePlatformsCheckboxes(); updateTypesCheckboxes(); updateCapabilitiesCheckboxes(); updatePriceSlider(); updateDiscountSlider();
            Array.from(containers).forEach(c => {
                try {
                    if (shouldShowContainer(c)) {
                        c.classList.add('ifc-Show'); c.classList.remove('ifc-Hide');
                        setDataAttribute(c, 'ifcShow', true);
                    } else {
                        c.classList.add('ifc-Hide'); c.classList.remove('ifc-Show');
                        setDataAttribute(c, 'ifcShow', false);
                    }
                } catch (ex) { console.error('Failed to toggle container:', ex); }
            });
        }

        function updateFilterCounts() {
            const sel = `.${CSS.escape(CONFIG.selectors.items)}`;
            state.filters.totalCount = document.querySelectorAll(sel).length;
            state.filters.filteredCount = document.querySelectorAll(`${sel}.ifc-Show`).length;
        }
        function updateFilterLabels() {
            updateFilterCounts();
            const l = getElement(`#${CONFIG.ids.filterLabel}`);
            if (l) l.textContent = `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`;
        }
        // ==================== EXTENSION RELOADED UNDER US ====================
        // If the extension is reloaded/updated while this tab stays open, the extension
        // adapter reports isAlive() === false (its chrome.* APIs are gone). Stop cleanly once:
        // no more work, controls disabled, one notice asking for a page reload. Adapters
        // without isAlive (the userscript) can't hit this and count as always alive.
        function contextLost() {
            return typeof adapter.isAlive === 'function' && !adapter.isAlive();
        }
        function handleContextLost() {
            if (state.ui.contextLost) return;
            state.ui.contextLost = true;
            state.details.cancel = true;
            try { observer.disconnect(); } catch (ex) { /* already disconnected */ }
            try {
                setExportMenuOpen(false);
                document.querySelectorAll(`[id^="ifc_btn_"], .ifc-item-refresh, #${CONFIG.ids.filterContainer} input, #${CONFIG.ids.filterContainer} button, #${CONFIG.ids.sortContainer} select, #${CONFIG.ids.sortContainer} button`)
                    .forEach(el => { el.disabled = true; });
                const l = getElement(`#${CONFIG.ids.filterLabel}`, false);
                if (l) { l.textContent = 'Xbox Wishlist Manager was updated - reload this page to keep using it'; l.classList.add('ifc-context-lost'); }
                console.info('[XBOX Wishlist] Extension was reloaded or updated - reload the page to use it again.');
            } catch (ex) { /* best effort - nothing else to do */ }
        }

        function updateScreen() {
            if (contextLost()) { handleContextLost(); return; }
            try { toggleContainers(); updateFilterLabels(); updateActiveTags(); updateQuickFilterStates(); updateSavedPresetStates(); applySorting(); updateSortIndicator(); saveFilterState(); }
            catch (ex) { console.error('Failed to update screen:', ex); }
        }

        // ==================== CLEANUP ====================
        function removeUnwantedControls() {
            try { document.querySelectorAll('.hr.border-neutral-200').forEach(el => el.remove()); }
            catch (ex) { console.error('Failed to remove unwanted controls:', ex); }
        }

        // ==================== IN-APP NAVIGATION (store app re-renders) ====================
        // Opening a game from the wishlist in the same tab doesn't load a new page: the store
        // app swaps the content, and on Back it rebuilds the wishlist from scratch - a new
        // toolbar (our buttons lived inside Xbox's) and new item elements (without our data or
        // tags). Our panels live in <body> and survive. A light once-a-second check re-runs the
        // normal setup when that happens, and closes our panels while we're away from the list.
        function isWishlistPage() { return /wishlist/i.test(location.pathname); }

        function hidePanelsAwayFromWishlist() {
            [[CONFIG.ids.filterContainer, 'divFilterShow'], [CONFIG.ids.sortContainer, 'divSortShow']].forEach(([id, flag]) => {
                const panel = document.getElementById(id);
                if (panel && !panel.classList.contains('ifc-hidden')) panel.classList.add('ifc-hidden');
                state.ui[flag] = false;
            });
        }

        function reinitAfterRerender() {
            ['floatButtons', 'lblFilter', 'btnFilter', 'btnSort', 'btnExport', 'btnTheme', 'btnRefresh'].forEach(k => { state.ui[k] = false; });
            state.ui.complete = false;
            state.ui.lowestItemId = null;   // every item is a new element: number them from page order again
            onDOMReady();
        }

        function startRouteWatch() {
            const timer = setInterval(() => {
                try {
                    if (contextLost()) { clearInterval(timer); handleContextLost(); return; }
                    enforceTheme();   // a saved light/dark choice holds on every page of the tab
                    if (!isWishlistPage()) { hidePanelsAwayFromWishlist(); return; }
                    if (!state.ui.complete || !CONFIG.selectors.items) return;
                    const items = document.getElementsByClassName(CONFIG.selectors.items);
                    if (!items.length) return;
                    if (!document.getElementById(CONFIG.ids.filterButton)) { reinitAfterRerender(); return; }
                    // Toolbar survived (e.g. public wishlist, where it's our own container) but the
                    // list was rebuilt: re-scrape the new items in page order
                    if (Array.from(items).every(c => !c.dataset.ifcId)) { state.ui.lowestItemId = null; updateScreen(); }
                } catch (ex) { console.error('Failed to check for a re-rendered wishlist:', ex); }
            }, 1000);
        }

        // ==================== START ====================
        const observer = new MutationObserver(onDOMReady);
        initialize().then(() => {
            onDOMReady();
            startRouteWatch();
            // SPA retry: items may not be rendered yet when the script starts
            let attempts = 0;
            const retry = setInterval(() => {
                if (state.ui.complete || ++attempts > 20) { clearInterval(retry); return; }
                onDOMReady();
            }, 500);
        });
    }
};

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
