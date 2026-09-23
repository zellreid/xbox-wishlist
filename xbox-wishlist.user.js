// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.5.26266.11
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/browser-extension/src/shared/styles.css?ver=1.5.26266.11
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
            ui: {
                floatButtons: false, lblFilter: false, btnFilter: false, btnSort: false,
                divFilter: false, divSort: false, divFilterShow: false, divSortShow: false,
                tagContainer: false, complete: false, lowestItemId: null,
                publisherSearch: ''
            },
            filters: {
                totalCount: 0, filteredCount: 0, activeTags: [],
                search: { term: '' },
                owned: { selected: [], options: ['Owned', 'Not Owned', 'Un-Purchasable'] },
                publishers: { selected: [], list: new Map() },
                subscriptions: { selected: [], list: new Map() },
                priceRange: { min: 0, max: 3000, currentMin: 0, currentMax: 3000, enabled: false },
                discountRange: { min: 0, max: 100, currentMin: 0, currentMax: 100, enabled: false }
            },
            sort: {
                criteria: [{ field: 'ifcId', order: 'desc', label: 'Default' }],
                fields: [
                    { value: 'ifcId', label: 'Default' }, { value: 'ifcName', label: 'Name' },
                    { value: 'ifcPublisher', label: 'Publisher' }, { value: 'ifcPrice', label: 'Price' },
                    { value: 'ifcPriceDiscountPercent', label: 'Discount %' },
                    { value: 'ifcPriceDiscountAmount', label: 'Discount Amount' }
                ]
            }
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
                tagContainer: 'ifc_tag_container',
                clearButton: 'ifc_btn_ClearAll',
                searchInput: 'ifc_input_search',
                publisherSearch: 'ifc_input_publisher_search',
                quickFilters: 'ifc_quick_filters',
                ownedSelect: 'ifc_select_owned',
                publishersSelect: 'ifc_select_publishers',
                subscriptionsSelect: 'ifc_select_subscriptions',
                priceSlider: 'ifc_slider_price',
                discountSlider: 'ifc_slider_discount'
            },
            classes: { button: [], svgIcon: [], activeButton: null },
            storage: { key: 'ifc_xbox_wishlist' }
        };

        // ==================== SELECTOR PREFIXES ====================
        const PREFIXES = {
            itemContainer: 'WishlistProductItem-module__itemContainer___',
            menuContainer: 'WishlistPage-module__menuContainer___',
            imageContainer: 'WishlistProductItem-module__imageContainer___',
            productDetails: 'WishlistProductItem-module__productDetails___',
            primaryText: 'WishlistProductItem-module__primaryText___',
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
        };

        // ==================== INITIALIZATION ====================
        async function initialize() {
            try {
                await addStyle(adapter.getResourceUrl('CSSFilter'));
                await loadFilterState();
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

            CONFIG.classes.button = [
                resolveClass(PREFIXES.menuButton), resolveClass(PREFIXES.btnIconBase),
                resolveClass(PREFIXES.btnBorderRadius), resolveClass(PREFIXES.btnSizeIcon),
                resolveClass(PREFIXES.btnBase), resolveClass(PREFIXES.btnNoUnderline),
                resolveClass(PREFIXES.btnTypeSecondary), resolveClass(PREFIXES.btnOverlaySolid)
            ].filter(Boolean);

            CONFIG.classes.svgIcon = [
                resolveClass(PREFIXES.btnIcon), resolveClass(PREFIXES.btnNoMargin),
                resolveClass(PREFIXES.pageIcon), resolveClass(PREFIXES.iconBase),
                resolveClass(PREFIXES.iconXXSmall)
            ].filter(Boolean);

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
            if (useCache && state.elementCache.has(selector)) return state.elementCache.get(selector);
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
                    publishers: { selected: state.filters.publishers.selected, list: Array.from(state.filters.publishers.list.entries()) },
                    subscriptions: { selected: state.filters.subscriptions.selected, list: Array.from(state.filters.subscriptions.list.entries()) },
                    sort: { criteria: state.sort.criteria }
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
            state.filters.owned.selected.forEach(item => tags.push({ type: 'owned', value: item, label: item }));
            state.filters.publishers.selected.forEach(pub => {
                const count = state.filters.publishers.list.get(pub) || 0;
                tags.push({ type: 'publisher', value: pub, label: `${pub} (${count})` });
            });
            state.filters.subscriptions.selected.forEach(sub => {
                const count = state.filters.subscriptions.list.get(sub) || 0;
                tags.push({ type: 'subscription', value: sub, label: `${sub} (${count})` });
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
                removeBtn.className = 'ifc-tag-remove'; removeBtn.textContent = '×';
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
                bc.appendChild(createImageButton('Filter', adapter.getResourceUrl('IMGFilter'), 'Filter', 'svg'));
                state.ui.btnFilter = true;
            } catch (ex) { console.error('Failed to add filter button:', ex); }
        }
        function addSortButton() {
            if (state.ui.btnSort) return;
            try {
                const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
                bc.appendChild(createImageButton('Sort', adapter.getResourceUrl('IMGSort'), 'Sort', 'svg'));
                state.ui.btnSort = true;
            } catch (ex) { console.error('Failed to add sort button:', ex); }
        }

        function addFilterContainer() {
            if (state.ui.divFilter) return;
            try {
                if (getElement(`#${CONFIG.ids.filterContainer}`, false)) return;
                const fc = document.createElement('div');
                fc.id = CONFIG.ids.filterContainer;
                fc.classList.add('filter-section', 'SortAndFilters-module__container___yA+Vp', 'ifc-hidden');
                const fl = document.createElement('div');
                fl.classList.add('filter-list', 'SortAndFilters-module__filterList___T81LH');
                const headerRow = document.createElement('div');
                headerRow.className = 'ifc-filter-header-row';
                const h = document.createElement('h2');
                h.classList.add('filter-text-heading', 'typography-module__spotLightSubtitlePortrait___RB7M0', 'SortAndFilters-module__filtersText___8OwXG');
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
                fg.classList.add('filter-groups', 'SortAndFilters-module__filterList___T81LH');
                fl.appendChild(headerRow); fl.appendChild(tc); fl.appendChild(fg); fc.appendChild(fl);
                document.body.appendChild(fc);
                const fb = getElement(`#${CONFIG.ids.filterButton}`);
                if (fb) fb.addEventListener('click', toggleFilterContainer);
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
                state.filters.search.term = '';
                updateCheckboxes(CONFIG.ids.ownedSelect, []);
                updateCheckboxes(CONFIG.ids.publishersSelect, []);
                updateCheckboxes(CONFIG.ids.subscriptionsSelect, []);
                const searchInput = getElement(`#${CONFIG.ids.searchInput}`);
                if (searchInput) searchInput.value = '';
                resetPriceSlider();
                resetDiscountSlider();
                updateScreen();
            } catch (ex) { console.error('Failed to clear filters:', ex); }
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
                    const sw = document.createElement('div');
                    sw.className = 'ifc-search-wrapper';
                    const si = document.createElement('input');
                    si.type = 'text';
                    si.id = CONFIG.ids.publisherSearch;
                    si.className = 'ifc-search-input';
                    si.placeholder = 'Search publishers...';
                    si.setAttribute('aria-label', 'Search publishers');
                    si.value = state.ui.publisherSearch;
                    si.addEventListener('input', (e) => { state.ui.publisherSearch = e.target.value; applyPublisherSearch(); });
                    sw.appendChild(si); cc.appendChild(sw);
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
            applyPublisherSearch();
        }

        // Narrows the visible publisher checkboxes only - it is not a filter, so it
        // doesn't change which items show; a ticked publisher hidden here still applies.
        function applyPublisherSearch() {
            const container = document.getElementById(CONFIG.ids.publishersSelect);
            if (!container) return;
            const term = state.ui.publisherSearch.trim().toLowerCase();
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
                addFilterLabel(); addFilterButton(); addSortButton();
                addFilterContainer(); addSortContainer();
                addSearchFilter(); addQuickFilters();
                await addFilterContainerOwned(); await addFilterContainerPublishers(); await addFilterContainerSubscriptions();
                addPriceRangeFilter(); addDiscountRangeFilter();
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
                sc.classList.add('filter-section', 'SortAndFilters-module__container___yA+Vp', 'ifc-hidden');
                const sl = document.createElement('div');
                sl.classList.add('filter-list', 'SortAndFilters-module__filterList___T81LH');
                const h = document.createElement('h2');
                h.classList.add('filter-text-heading', 'typography-module__spotLightSubtitlePortrait___RB7M0', 'SortAndFilters-module__filtersText___8OwXG');
                h.textContent = 'Sort';
                const scc = document.createElement('div');
                scc.id = 'ifc_sort_criteria_container'; scc.className = 'ifc-sort-criteria-container';
                sl.appendChild(h); sl.appendChild(scc); sc.appendChild(sl);
                document.body.appendChild(sc);
                const sb = getElement(`#${CONFIG.ids.sortButton}`);
                if (sb) sb.addEventListener('click', toggleSortContainer);
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
                    removeBtn.textContent = '×'; removeBtn.title = 'Remove sort criterion';
                    removeBtn.addEventListener('click', () => { state.sort.criteria.splice(index, 1); renderSortCriteria(); onSortChanged(); });
                    row.appendChild(removeBtn);
                }
                container.appendChild(row);
            });
            if (state.sort.criteria.length < 3) {
                const addBtn = document.createElement('button'); addBtn.className = 'ifc-sort-add';
                addBtn.textContent = '+ Add Sort Level';
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
        function onSortChanged() { applySorting(); saveFilterState(); }

        function applySorting() {
            try {
                const containers = Array.from(document.getElementsByClassName(CONFIG.selectors.items));
                const parent = containers[0]?.parentElement; if (!parent) return;
                containers.sort((a, b) => {
                    for (const c of state.sort.criteria) {
                        const aVal = a.dataset[c.field], bVal = b.dataset[c.field];
                        let cmp = 0;
                        if (['ifcId', 'ifcPrice', 'ifcPriceDiscountPercent', 'ifcPriceDiscountAmount'].includes(c.field)) {
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
            collectPublishers(); updatePublishersCheckboxes(); updateSubscriptionsCheckboxes(); updatePriceSlider(); updateDiscountSlider();
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
        function updateScreen() {
            try { toggleContainers(); updateFilterLabels(); updateActiveTags(); updateQuickFilterStates(); applySorting(); saveFilterState(); }
            catch (ex) { console.error('Failed to update screen:', ex); }
        }

        // ==================== CLEANUP ====================
        function removeUnwantedControls() {
            try { document.querySelectorAll('.hr.border-neutral-200').forEach(el => el.remove()); }
            catch (ex) { console.error('Failed to remove unwanted controls:', ex); }
        }

        // ==================== START ====================
        const observer = new MutationObserver(onDOMReady);
        initialize().then(() => {
            onDOMReady();
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
