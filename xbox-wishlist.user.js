// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.4.26056.4
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/xbox-wishlist.user.css
// @resource     IMGFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/filter.svg
// @resource     IMGSort https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/sort.svg
// @resource     IMGExpand https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/expand.svg
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/collapse.svg
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL  https://github.com/zellreid/xbox-wishlist/raw/refs/heads/main/xbox-wishlist.user.js
// @updateURL    https://github.com/zellreid/xbox-wishlist/raw/refs/heads/main/xbox-wishlist.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ==================== RESILIENT SELECTOR RESOLVER ====================
    // Xbox uses CSS module hashes that change on every rebuild.
    // This resolver finds the actual class name by matching the prefix before the hash.
    // e.g. "WishlistProductItem-module__itemContainer___" matches regardless of hash suffix.

    const SELECTOR_CACHE = new Map();

    /**
     * Find the actual class name on the page that matches a CSS module prefix.
     * @param {string} prefix - The class prefix before the hash, e.g. "WishlistProductItem-module__itemContainer___"
     * @returns {string|null} - The full class name found on the page, or null
     */
    function resolveClass(prefix) {
        if (SELECTOR_CACHE.has(prefix)) {
            return SELECTOR_CACHE.get(prefix);
        }

        // Search all elements for a class starting with this prefix
        const el = document.querySelector(`[class*="${prefix}"]`);
        if (el) {
            const match = Array.from(el.classList).find(c => c.startsWith(prefix));
            if (match) {
                SELECTOR_CACHE.set(prefix, match);
                return match;
            }
        }
        SELECTOR_CACHE.set(prefix, null);
        return null;
    }

    /**
     * Clear the selector cache (call if DOM changes drastically)
     */
    function clearSelectorCache() {
        SELECTOR_CACHE.clear();
    }

    // ==================== SELECTOR PREFIXES ====================
    // These are the stable parts of Xbox's CSS module class names.
    // The hash suffix (e.g. ___kQvra) will change but these prefixes won't.

    const PREFIXES = {
        itemContainer:      'WishlistProductItem-module__itemContainer___',
        menuContainer:      'WishlistPage-module__menuContainer___',
        imageContainer:     'WishlistProductItem-module__imageContainer___',
        productDetails:     'WishlistProductItem-module__productDetails___',
        primaryText:        'WishlistProductItem-module__primaryText___',
        altText:            'WishlistProductItem-module__altText___',
        priceBaseContainer: 'Price-module__priceBaseContainer___',
        originalPrice:      'Price-module__originalPrice___',
        discountPrice:      'Price-module__listedDiscountPrice___',
        boldText:           'Price-module__boldText___',
        menuButton:         'WishlistPage-module__wishlistMenuButton___',
        pageIcon:           'WishlistPage-module__icon___',
        // Button classes (these seem stable but include for completeness)
        btnIconBase:        'Button-module__iconButtonBase___',
        btnBorderRadius:    'Button-module__basicBorderRadius___',
        btnSizeIcon:        'Button-module__sizeIconButtonMedium___',
        btnBase:            'Button-module__buttonBase___',
        btnNoUnderline:     'Button-module__textNoUnderline___',
        btnTypeSecondary:   'Button-module__typeSecondary___',
        btnOverlaySolid:    'Button-module__overlayModeSolid___',
        btnIcon:            'Button-module__buttonIcon___',
        btnNoMargin:        'Button-module__noMargin___',
        iconBase:           'Icon-module__icon___',
        iconXXSmall:        'Icon-module__xxSmall___',
        // Discount tag
        discountTag:        'Price-module__discountTag___',
    };

    // ==================== CONFIGURATION ====================
    // Selectors are resolved dynamically at runtime using PREFIXES above.
    // CONFIG.selectors holds the *resolved* class names (populated in initialize()).

    const CONFIG = {
        selectors: {
            content: 'PageContent',
            // These will be populated by resolveSelectors()
            items: null,
            buttons: null,
            imageContainer: null,
            productDetails: null,
            productLink: null,
            productPublisher: null,
            productPrices: null,
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
            ownedSelect: 'ifc_select_owned',
            publishersSelect: 'ifc_select_publishers',
            priceSlider: 'ifc_slider_price',
            discountSlider: 'ifc_slider_discount'
        },
        classes: {
            // These will be populated by resolveSelectors()
            button: [],
            svgIcon: [],
            activeButton: null
        },
        storage: {
            key: 'ifc_xbox_wishlist'
        },
        ui: {
            buttonContainer: {
                position: 'fixed',
                top: '100px',
                right: '100px',
                zIndex: '998'
            }
        }
    };

    /**
     * Resolve all selectors from the live DOM.
     * Returns true if critical selectors were found.
     */
    function resolveSelectors() {
        clearSelectorCache();

        const itemClass = resolveClass(PREFIXES.itemContainer);
        const menuClass = resolveClass(PREFIXES.menuContainer);
        const imgContainerClass = resolveClass(PREFIXES.imageContainer);
        const prodDetailsClass = resolveClass(PREFIXES.productDetails);
        const altTextClass = resolveClass(PREFIXES.altText);
        const priceContainerClass = resolveClass(PREFIXES.priceBaseContainer);
        const originalPriceClass = resolveClass(PREFIXES.originalPrice);
        const discountPriceClass = resolveClass(PREFIXES.discountPrice);
        const boldTextClass = resolveClass(PREFIXES.boldText);

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

        // Resolve button classes
        const btnClasses = [
            resolveClass(PREFIXES.menuButton),
            resolveClass(PREFIXES.btnIconBase),
            resolveClass(PREFIXES.btnBorderRadius),
            resolveClass(PREFIXES.btnSizeIcon),
            resolveClass(PREFIXES.btnBase),
            resolveClass(PREFIXES.btnNoUnderline),
            resolveClass(PREFIXES.btnTypeSecondary),
            resolveClass(PREFIXES.btnOverlaySolid)
        ].filter(Boolean);
        CONFIG.classes.button = btnClasses;

        // SVG icon classes
        const svgClasses = [
            resolveClass(PREFIXES.btnIcon),
            resolveClass(PREFIXES.btnNoMargin),
            resolveClass(PREFIXES.pageIcon),
            resolveClass(PREFIXES.iconBase),
            resolveClass(PREFIXES.iconXXSmall)
        ].filter(Boolean);
        CONFIG.classes.svgIcon = svgClasses;

        // Active button - we construct a likely name; if it doesn't exist we'll style it ourselves
        CONFIG.classes.activeButton = 'ifc-active-button';

        console.log('[XBOX Wishlist] Selectors resolved successfully:', {
            items: CONFIG.selectors.items,
            buttons: CONFIG.selectors.buttons,
            buttonClasses: CONFIG.classes.button.length
        });

        return true;
    }

    // ==================== STATE MANAGEMENT ====================
    const state = {
        info: GM_info,
        scripts: [],
        styles: [],
        svgCache: new Map(),
        elementCache: new Map(),
        ui: {
            floatButtons: false,
            lblFilter: false,
            btnFilter: false,
            btnSort: false,
            divFilter: false,
            divSort: false,
            divFilterShow: false,
            divSortShow: false,
            tagContainer: false,
            // select2 removed in v1.4.25226.2
            complete: false
        },
        filters: {
            totalCount: 0,
            filteredCount: 0,
            activeTags: [],
            owned: {
                selected: [],
                options: ['Owned', 'Not Owned', 'Un-Purchasable']
            },
            publishers: {
                selected: [],
                list: new Map()
            },
            priceRange: {
                min: 0,
                max: 1000,
                currentMin: 0,
                currentMax: 1000,
                enabled: false
            },
            discountRange: {
                min: 0,
                max: 100,
                currentMin: 0,
                currentMax: 100,
                enabled: false
            }
        },
        sort: {
            criteria: [
                { field: 'ifcId', order: 'desc', label: 'Default' }
            ],
            fields: [
                { value: 'ifcId', label: 'Default' },
                { value: 'ifcName', label: 'Name' },
                { value: 'ifcPublisher', label: 'Publisher' },
                { value: 'ifcPrice', label: 'Price' },
                { value: 'ifcPriceDiscountPercent', label: 'Discount %' },
                { value: 'ifcPriceDiscountAmount', label: 'Discount Amount' }
            ]
        }
    };

    // Make state available globally for backward compatibility
    window.injected = state;

    // ==================== UTILITY FUNCTIONS ====================

    function getElement(selector, useCache = true) {
        if (!selector) return null;
        if (useCache && state.elementCache.has(selector)) {
            return state.elementCache.get(selector);
        }
        const element = document.querySelector(selector);
        if (element && useCache) {
            state.elementCache.set(selector, element);
        }
        return element;
    }

    function clearElementCache() {
        state.elementCache.clear();
    }

    function addClasses(element, classes) {
        if (!element || !classes || !classes.length) return;
        element.classList.add(...classes);
    }

    function applyStyles(element, styles) {
        if (!element || !styles) return;
        Object.assign(element.style, styles);
    }

    function setDataAttribute(element, key, value) {
        try {
            element.dataset[key] = value ?? null;
        } catch (ex) {
            console.error(`Failed to set data attribute ${key}:`, ex);
            element.dataset[key] = null;
        }
    }

    function safeQuerySelector(container, selector, defaultValue = null) {
        try {
            return container.querySelector(selector) ?? defaultValue;
        } catch (ex) {
            console.error(`Query selector failed for ${selector}:`, ex);
            return defaultValue;
        }
    }

    function formatCurrency(value) {
        return `R ${value.toFixed(2)}`;
    }

    function formatPercentage(value) {
        return `${Math.round(value)}%`;
    }

    // ==================== RESOURCE MANAGEMENT ====================

    async function addScript(src) {
        if (!src || isResourceAdded(state.scripts, src)) {
            return { success: true };
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.onload = () => {
                state.scripts.push(script);
                resolve({ success: true });
            };
            script.onerror = () => reject(new Error(`Script load error: ${src}`));
            document.head.appendChild(script);
        });
    }

    async function addStyle(href) {
        if (!href || isResourceAdded(state.styles, href)) {
            return { success: true };
        }
        return new Promise((resolve, reject) => {
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = href;
            style.onload = () => {
                state.styles.push(style);
                resolve({ success: true });
            };
            style.onerror = () => reject(new Error(`Style load error: ${href}`));
            document.head.appendChild(style);
        });
    }

    function isResourceAdded(resourceArray, url) {
        if (!resourceArray || !Array.isArray(resourceArray)) return false;
        return resourceArray.some(resource => resource.src === url || resource.href === url);
    }

    async function getSVG(src) {
        if (state.svgCache.has(src)) {
            return state.svgCache.get(src);
        }
        try {
            const response = await fetch(src);
            const text = await response.text();
            state.svgCache.set(src, text);
            return text;
        } catch (ex) {
            console.error(`Failed to fetch SVG from ${src}:`, ex);
            return null;
        }
    }

    // ==================== STATE PERSISTENCE ====================

    function saveFilterState() {
        try {
            const publishersArray = Array.from(state.filters.publishers.list.entries());
            const saveData = {
                ...state.filters,
                publishers: {
                    selected: state.filters.publishers.selected,
                    list: publishersArray
                }
            };
            GM_setValue(CONFIG.storage.key, JSON.stringify(saveData));
        } catch (ex) {
            console.error('Failed to save filter state:', ex);
        }
    }

    function loadFilterState() {
        try {
            const saved = GM_getValue(CONFIG.storage.key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.owned) {
                        state.filters.owned.selected = Array.isArray(parsed.owned.selected)
                            ? parsed.owned.selected : [];
                        if (Array.isArray(parsed.owned.options)) {
                            state.filters.owned.options = parsed.owned.options;
                        }
                    }
                    if (parsed.publishers) {
                        state.filters.publishers.selected = Array.isArray(parsed.publishers.selected)
                            ? parsed.publishers.selected : [];
                        if (Array.isArray(parsed.publishers.list)) {
                            state.filters.publishers.list = new Map(parsed.publishers.list);
                        }
                    }
                    if (parsed.priceRange && typeof parsed.priceRange === 'object') {
                        const { enabled, ...priceRangeWithoutEnabled } = parsed.priceRange;
                        state.filters.priceRange = { ...state.filters.priceRange, ...priceRangeWithoutEnabled, enabled: false };
                    }
                    if (parsed.discountRange && typeof parsed.discountRange === 'object') {
                        const { enabled, ...discountRangeWithoutEnabled } = parsed.discountRange;
                        state.filters.discountRange = { ...state.filters.discountRange, ...discountRangeWithoutEnabled, enabled: false };
                    }
                    if (typeof parsed.totalCount === 'number') {
                        state.filters.totalCount = parsed.totalCount;
                    }
                    if (typeof parsed.filteredCount === 'number') {
                        state.filters.filteredCount = parsed.filteredCount;
                    }
                    if (Array.isArray(parsed.activeTags)) {
                        state.filters.activeTags = parsed.activeTags;
                    }
                }
            }
        } catch (ex) {
            console.error('Failed to load filter state:', ex);
            state.filters.owned.selected = state.filters.owned.selected || [];
            state.filters.publishers.selected = state.filters.publishers.selected || [];
        }
    }

    // ==================== TAG MANAGEMENT ====================

    function updateActiveTags() {
        const tags = [];

        if (state.filters.owned.selected.length > 0) {
            state.filters.owned.selected.forEach(item => {
                tags.push({ type: 'owned', value: item, label: item });
            });
        }

        if (state.filters.publishers.selected.length > 0) {
            state.filters.publishers.selected.forEach(pub => {
                const count = state.filters.publishers.list.get(pub) || 0;
                tags.push({ type: 'publisher', value: pub, label: `${pub} (${count})` });
            });
        }

        if (state.filters.priceRange.enabled) {
            const { currentMin, currentMax } = state.filters.priceRange;
            tags.push({
                type: 'price', value: 'price',
                label: `Price: ${formatCurrency(currentMin)} - ${formatCurrency(currentMax)}`
            });
        }

        if (state.filters.discountRange.enabled) {
            const { currentMin, currentMax } = state.filters.discountRange;
            tags.push({
                type: 'discount', value: 'discount',
                label: `Discount: ${formatPercentage(currentMin)} - ${formatPercentage(currentMax)}`
            });
        }

        state.filters.activeTags = tags;
        renderTags();
    }

    function renderTags() {
        const tagContainer = getElement(`#${CONFIG.ids.tagContainer}`);
        if (!tagContainer) return;

        tagContainer.innerHTML = '';

        if (state.filters.activeTags.length === 0) {
            tagContainer.style.display = 'none';
            return;
        }

        tagContainer.style.display = 'flex';

        state.filters.activeTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'ifc-filter-tag';
            tagElement.textContent = tag.label;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'ifc-tag-remove';
            removeBtn.textContent = '\u00d7';
            removeBtn.setAttribute('aria-label', `Remove ${tag.label}`);
            removeBtn.onclick = () => removeTag(tag);

            tagElement.appendChild(removeBtn);
            tagContainer.appendChild(tagElement);
        });
    }

    function removeTag(tag) {
        switch (tag.type) {
            case 'owned':
                state.filters.owned.selected = state.filters.owned.selected.filter(v => v !== tag.value);
                updateCheckboxes(CONFIG.ids.ownedSelect, state.filters.owned.selected);
                break;
            case 'publisher':
                state.filters.publishers.selected = state.filters.publishers.selected.filter(v => v !== tag.value);
                updateCheckboxes(CONFIG.ids.publishersSelect, state.filters.publishers.selected);
                break;
            case 'price':
                state.filters.priceRange.enabled = false;
                resetPriceSlider();
                break;
            case 'discount':
                state.filters.discountRange.enabled = false;
                resetDiscountSlider();
                break;
        }
        updateScreen();
    }

    /**
     * Update checkboxes to match state
     */
    function updateCheckboxes(containerId, selectedValues) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = selectedValues.includes(cb.value);
        });
    }

    // ==================== CHECKBOX LIST CREATION ====================

    /**
     * Create a checkbox list container
     */
    function createCheckboxList(id, options, selected = [], onChange) {
        const container = document.createElement('div');
        container.id = id;
        container.className = 'ifc-checkbox-list';

        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'ifc-checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option.value;
            checkbox.checked = selected.includes(option.value);
            checkbox.className = 'ifc-checkbox';

            checkbox.addEventListener('change', () => {
                if (onChange) onChange();
            });

            const span = document.createElement('span');
            span.className = 'ifc-checkbox-label';
            span.textContent = option.label;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });

        return container;
    }

    /**
     * Get selected values from a checkbox list
     */
    function getCheckboxValues(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
    }

    // ==================== UI CREATION HELPERS ====================

    function createLabel(id, text) {
        const label = document.createElement('label');
        applyStyles(label, { marginLeft: '5px', marginRight: '5px' });
        label.textContent = text;
        if (id) label.id = `ifc_lbl_${id}`;
        return label;
    }

    // createSelect2Multi removed in v1.4.25226.2 - replaced by createCheckboxList

    function createRangeSlider(id, min, max, currentMin, currentMax, onChange) {
        const container = document.createElement('div');
        container.className = 'ifc-slider-container';
        container.id = `${id}_container`;

        const label = document.createElement('div');
        label.className = 'ifc-slider-label';
        label.id = `${id}_label`;
        container.appendChild(label);

        const track = document.createElement('div');
        track.className = 'ifc-slider-track';

        const range = document.createElement('div');
        range.className = 'ifc-slider-range';
        range.id = `${id}_range`;
        track.appendChild(range);

        const minSlider = document.createElement('input');
        minSlider.type = 'range';
        minSlider.className = 'ifc-slider ifc-slider-min';
        minSlider.id = `${id}_min`;
        minSlider.min = min;
        minSlider.max = max;
        minSlider.value = currentMin;
        minSlider.step = Math.max(1, Math.round((max - min) / 100));

        const maxSlider = document.createElement('input');
        maxSlider.type = 'range';
        maxSlider.className = 'ifc-slider ifc-slider-max';
        maxSlider.id = `${id}_max`;
        maxSlider.min = min;
        maxSlider.max = max;
        maxSlider.value = currentMax;
        maxSlider.step = Math.max(1, Math.round((max - min) / 100));

        track.appendChild(minSlider);
        track.appendChild(maxSlider);
        container.appendChild(track);

        let isUserInteraction = false;

        const updateSlider = () => {
            let minVal = parseFloat(minSlider.value);
            let maxVal = parseFloat(maxSlider.value);

            if (minVal > maxVal - (max - min) * 0.01) {
                minVal = maxVal - (max - min) * 0.01;
                minSlider.value = minVal;
            }

            const minPercent = ((minVal - min) / (max - min)) * 100;
            const maxPercent = ((maxVal - min) / (max - min)) * 100;
            range.style.left = `${minPercent}%`;
            range.style.width = `${maxPercent - minPercent}%`;

            if (onChange && isUserInteraction) {
                onChange(minVal, maxVal);
            }
        };

        const enableUserTracking = () => { isUserInteraction = true; };

        minSlider.addEventListener('mousedown', enableUserTracking);
        minSlider.addEventListener('touchstart', enableUserTracking);
        maxSlider.addEventListener('mousedown', enableUserTracking);
        maxSlider.addEventListener('touchstart', enableUserTracking);

        minSlider.addEventListener('input', updateSlider);
        maxSlider.addEventListener('input', updateSlider);

        updateSlider();
        return container;
    }

    function createImageButton(id, src, text, type) {
        const button = document.createElement('button');
        if (id) button.id = `ifc_btn_${id}`;
        addClasses(button, CONFIG.classes.button);
        button.title = text;
        button.setAttribute('aria-label', text);
        button.setAttribute('aria-pressed', 'false');

        const imgContainer = createImageContainer(id, src, text, type);
        button.appendChild(imgContainer);
        return button;
    }

    function createImageContainer(id, src, text, type) {
        const container = document.createElement('div');
        if (id) container.id = `ifc_img_${id}`;
        container.setAttribute('data-ifc-type', type);
        if (type === 'svg') {
            loadSVGIntoContainer(container, src, id);
        } else {
            const img = document.createElement('img');
            img.src = src;
            img.alt = text;
            img.title = text;
            container.appendChild(img);
        }
        return container;
    }

    async function loadSVGIntoContainer(container, src, targetId) {
        try {
            const svgText = await getSVG(src);
            if (!svgText) return;
            container.innerHTML = svgText;
            const svg = container.querySelector('svg');
            if (svg) {
                addClasses(svg, CONFIG.classes.svgIcon);
                svg.setAttribute('data-ifc-target', targetId);
            }
        } catch (ex) {
            console.error('Failed to load SVG into container:', ex);
        }
    }

    async function updateSVGIcon(containerId, resourceKey, targetId) {
        try {
            const svgText = await getSVG(GM_getResourceURL(resourceKey));
            if (!svgText) return;
            const container = getElement(`#ifc_img_${containerId}`, false);
            if (!container) return;
            container.innerHTML = svgText;
            const svg = container.querySelector('svg');
            if (svg) {
                addClasses(svg, CONFIG.classes.svgIcon);
                svg.setAttribute('data-ifc-target', targetId);
            }
        } catch (ex) {
            console.error('Failed to update SVG icon:', ex);
        }
    }

    // ==================== FILTER UI CREATION ====================

    function floatButtons() {
        if (state.ui.floatButtons) return;
        try {
            const buttonContainer = getElement(`.${CSS.escape(CONFIG.selectors.buttons)}`, false);
            if (!buttonContainer) return;
            buttonContainer.id = CONFIG.ids.buttonContainer;
            applyStyles(buttonContainer, CONFIG.ui.buttonContainer);
            state.ui.floatButtons = true;
        } catch (ex) {
            console.error('Failed to float buttons:', ex);
        }
    }

    function addFilterLabel() {
        if (state.ui.lblFilter) return;
        try {
            const buttonContainer = getElement(`#${CONFIG.ids.buttonContainer}`);
            if (!buttonContainer) return;
            const label = createLabel(
                'Filter',
                `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`
            );
            buttonContainer.insertBefore(label, buttonContainer.firstChild);
            state.ui.lblFilter = true;
        } catch (ex) {
            console.error('Failed to add filter label:', ex);
        }
    }

    function addFilterButton() {
        if (state.ui.btnFilter) return;
        try {
            const buttonContainer = getElement(`#${CONFIG.ids.buttonContainer}`);
            if (!buttonContainer) return;
            const button = createImageButton('Filter', GM_getResourceURL('IMGFilter'), 'Filter', 'svg');
            buttonContainer.appendChild(button);
            state.ui.btnFilter = true;
        } catch (ex) {
            console.error('Failed to add filter button:', ex);
        }
    }

    function addSortButton() {
        if (state.ui.btnSort) return;
        try {
            const buttonContainer = getElement(`#${CONFIG.ids.buttonContainer}`);
            if (!buttonContainer) return;
            const button = createImageButton('Sort', GM_getResourceURL('IMGSort'), 'Sort', 'svg');
            buttonContainer.appendChild(button);
            state.ui.btnSort = true;
        } catch (ex) {
            console.error('Failed to add sort button:', ex);
        }
    }

    function addFilterContainer() {
        if (state.ui.divFilter) return;
        try {
            if (getElement(`#${CONFIG.ids.filterContainer}`, false)) return;

            const filterContainer = document.createElement('div');
            filterContainer.id = CONFIG.ids.filterContainer;
            filterContainer.classList.add('filter-section', 'SortAndFilters-module__container___yA+Vp');
            filterContainer.style.display = 'none';

            const filterList = document.createElement('div');
            filterList.classList.add('filter-list', 'SortAndFilters-module__filterList___T81LH');

            const heading = document.createElement('h2');
            heading.classList.add(
                'filter-text-heading',
                'typography-module__spotLightSubtitlePortrait___RB7M0',
                'SortAndFilters-module__filtersText___8OwXG'
            );
            heading.textContent = 'Filters';

            const tagContainer = document.createElement('div');
            tagContainer.id = CONFIG.ids.tagContainer;
            tagContainer.className = 'ifc-tag-container';
            tagContainer.style.display = 'none';

            const filterGroups = document.createElement('ul');
            filterGroups.classList.add('filter-groups', 'SortAndFilters-module__filterList___T81LH');

            filterList.appendChild(heading);
            filterList.appendChild(tagContainer);
            filterList.appendChild(filterGroups);
            filterContainer.appendChild(filterList);
            document.body.appendChild(filterContainer);

            const filterButton = getElement(`#${CONFIG.ids.filterButton}`);
            if (filterButton) {
                filterButton.addEventListener('click', toggleFilterContainer);
            }

            state.ui.divFilter = true;
            state.ui.tagContainer = true;
        } catch (ex) {
            console.error('Failed to add filter container:', ex);
        }
    }

    function createFilterBlock(id = null, text = '', collapsible = true) {
        const groupContainer = document.createElement('li');
        if (id) groupContainer.id = `ifc_group_${id}`;
        groupContainer.className = 'ifc-accordion-group';

        if (!collapsible) {
            const contentContainer = document.createElement('div');
            contentContainer.className = 'ifc-filter-block-static';
            if (id) contentContainer.id = `ifc_group_content_${id}`;

            const heading = document.createElement('h3');
            heading.className = 'ifc-filter-static-heading';
            heading.textContent = text;

            contentContainer.appendChild(heading);
            groupContainer.appendChild(contentContainer);
            return groupContainer;
        }

        // Xbox-style accordion header with SVG expand/collapse icons
        const headerButton = document.createElement('button');
        headerButton.className = 'ifc-accordion-header';
        headerButton.setAttribute('aria-expanded', 'false');

        const headerText = document.createElement('span');
        headerText.className = 'ifc-accordion-title';
        headerText.textContent = text;

        const chevronContainer = document.createElement('div');
        chevronContainer.className = 'ifc-accordion-chevron';
        chevronContainer.id = `ifc_accordion_icon_${id}`;
        loadSVGIntoContainer(chevronContainer, GM_getResourceURL('IMGExpand'), `accordion_${id}`);

        headerButton.appendChild(headerText);
        headerButton.appendChild(chevronContainer);

        // Collapsible content panel
        const contentPanel = document.createElement('div');
        contentPanel.className = 'ifc-accordion-content';
        if (id) contentPanel.id = `ifc_group_content_${id}`;
        contentPanel.style.display = 'none';

        headerButton.addEventListener('click', async () => {
            const isExpanded = headerButton.getAttribute('aria-expanded') === 'true';
            headerButton.setAttribute('aria-expanded', (!isExpanded).toString());
            contentPanel.style.display = isExpanded ? 'none' : 'block';
            // Swap SVG icon
            const resourceKey = isExpanded ? 'IMGExpand' : 'IMGCollapse';
            await updateSVGIcon(`accordion_icon_${id}`, resourceKey, `accordion_${id}`);
        });

        groupContainer.appendChild(headerButton);
        groupContainer.appendChild(contentPanel);
        return groupContainer;
    }

    async function addFilterContainerOwned() {
        if (!state.ui.divFilter) return;
        const groupName = 'Owned';
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) return;

            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            if (!state.filters.owned.selected) state.filters.owned.selected = [];
            if (!Array.isArray(state.filters.owned.options)) {
                state.filters.owned.options = ['Owned', 'Not Owned', 'Un-Purchasable'];
            }

            const filterBlock = createFilterBlock(groupName, 'Owned', true);
            const contentContainer = filterBlock.querySelector('.ifc-accordion-content');

            if (contentContainer) {
                const options = state.filters.owned.options.map(opt => ({ value: opt, label: opt }));
                const checkboxList = createCheckboxList(
                    CONFIG.ids.ownedSelect,
                    options,
                    state.filters.owned.selected,
                    () => {
                        state.filters.owned.selected = getCheckboxValues(CONFIG.ids.ownedSelect);
                        updateScreen();
                    }
                );
                contentContainer.appendChild(checkboxList);
            }

            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('Failed to add owned filter:', ex);
        }
    }

    function collectPublishers() {
        const publishers = new Map();
        const containers = document.getElementsByClassName(CONFIG.selectors.items);

        Array.from(containers).forEach(container => {
            const publisher = container.dataset.ifcPublisher;
            if (publisher && publisher !== 'null' && publisher.trim() !== '') {
                const publisherName = publisher.trim();
                publishers.set(publisherName, (publishers.get(publisherName) || 0) + 1);
            }
        });

        const sortedPublishers = new Map(
            Array.from(publishers.entries()).sort((a, b) => a[0].localeCompare(b[0]))
        );

        state.filters.publishers.list = sortedPublishers;
        return sortedPublishers;
    }

    async function addFilterContainerPublishers() {
        if (!state.ui.divFilter) return;
        const groupName = 'Publishers';
        try {
            const existing = getElement(`#ifc_group_${groupName}`, false);
            if (existing) {
                updatePublishersCheckboxes();
                return;
            }

            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            const filterBlock = createFilterBlock(groupName, 'Publishers', true);
            const contentContainer = filterBlock.querySelector('.ifc-accordion-content');

            if (contentContainer) {
                // Create a scrollable container for potentially many publishers
                const scrollContainer = document.createElement('div');
                scrollContainer.id = CONFIG.ids.publishersSelect;
                scrollContainer.className = 'ifc-checkbox-list ifc-checkbox-list-scrollable';
                contentContainer.appendChild(scrollContainer);
            }

            filterGroups.appendChild(filterBlock);
            updatePublishersCheckboxes();
        } catch (ex) {
            console.error('Failed to add publishers filter:', ex);
        }
    }

    function updatePublishersCheckboxes() {
        if (!Array.isArray(state.filters.publishers.selected)) {
            state.filters.publishers.selected = [];
        }

        const publishers = collectPublishers();
        const container = document.getElementById(CONFIG.ids.publishersSelect);
        if (!container) return;

        // Clear existing
        container.innerHTML = '';

        publishers.forEach((count, name) => {
            const label = document.createElement('label');
            label.className = 'ifc-checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = name;
            checkbox.checked = state.filters.publishers.selected.includes(name);
            checkbox.className = 'ifc-checkbox';

            checkbox.addEventListener('change', () => {
                state.filters.publishers.selected = getCheckboxValues(CONFIG.ids.publishersSelect);
                updateScreen();
            });

            const span = document.createElement('span');
            span.className = 'ifc-checkbox-label';
            span.textContent = `${name} (${count})`;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    function calculatePriceRange() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        let min = Infinity, max = 0;

        Array.from(containers).forEach(container => {
            const price = parseFloat(container.dataset.ifcPrice);
            if (!isNaN(price) && price > 0) {
                min = Math.min(min, price);
                max = Math.max(max, price);
            }
        });

        if (min === Infinity) min = 0;
        if (max < min) max = min;
        if (min === 0 && max === 0) max = 1000;

        min = Math.floor(min / 10) * 10;
        max = Math.ceil(max / 10) * 10;
        return { min, max };
    }

    function calculateDiscountRange() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        let min = 100, max = 0;

        Array.from(containers).forEach(container => {
            const discount = parseInt(container.dataset.ifcPriceDiscountPercent);
            if (!isNaN(discount) && discount > 0) {
                min = Math.min(min, discount);
                max = Math.max(max, discount);
            }
        });

        if (min === 100) min = 0;
        if (max < min) max = min;
        if (min === 0 && max === 0) max = 100;

        min = Math.floor(min / 5) * 5;
        max = Math.ceil(max / 5) * 5;
        return { min, max };
    }

    function addPriceRangeFilter() {
        if (!state.ui.divFilter) return;
        const groupName = 'PriceRange';
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) {
                updatePriceSlider();
                return;
            }
            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            const { min, max } = calculatePriceRange();
            state.filters.priceRange = { min, max, currentMin: min, currentMax: max, enabled: false };

            const filterBlock = createFilterBlock(groupName, 'Price Range', false);
            const contentContainer = filterBlock.querySelector('.ifc-filter-block-static');

            if (contentContainer) {
                const slider = createRangeSlider(
                    CONFIG.ids.priceSlider, min, max, min, max,
                    (minVal, maxVal) => {
                        state.filters.priceRange.currentMin = minVal;
                        state.filters.priceRange.currentMax = maxVal;
                        state.filters.priceRange.enabled = true;
                        const label = getElement(`#${CONFIG.ids.priceSlider}_label`);
                        if (label) label.textContent = `${formatCurrency(minVal)} - ${formatCurrency(maxVal)}`;
                        updateScreen();
                    }
                );
                contentContainer.appendChild(slider);
                const label = slider.querySelector('.ifc-slider-label');
                if (label) label.textContent = `${formatCurrency(min)} - ${formatCurrency(max)}`;
            }
            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('Failed to add price range filter:', ex);
        }
    }

    function updatePriceSlider() {
        const { min, max } = calculatePriceRange();
        if (state.filters.priceRange.min !== min || state.filters.priceRange.max !== max) {
            state.filters.priceRange = {
                ...state.filters.priceRange, min, max,
                currentMin: Math.max(state.filters.priceRange.currentMin, min),
                currentMax: Math.min(state.filters.priceRange.currentMax, max)
            };
            const minSlider = getElement(`#${CONFIG.ids.priceSlider}_min`);
            const maxSlider = getElement(`#${CONFIG.ids.priceSlider}_max`);
            if (minSlider && maxSlider) {
                minSlider.min = min; minSlider.max = max;
                maxSlider.min = min; maxSlider.max = max;
                minSlider.value = state.filters.priceRange.currentMin;
                maxSlider.value = state.filters.priceRange.currentMax;
                minSlider.dispatchEvent(new Event('input'));
            }
        }
    }

    function resetPriceSlider() {
        const { min, max } = state.filters.priceRange;
        state.filters.priceRange.currentMin = min;
        state.filters.priceRange.currentMax = max;
        state.filters.priceRange.enabled = false;
        const minSlider = getElement(`#${CONFIG.ids.priceSlider}_min`);
        const maxSlider = getElement(`#${CONFIG.ids.priceSlider}_max`);
        if (minSlider && maxSlider) {
            minSlider.value = min;
            maxSlider.value = max;
            minSlider.dispatchEvent(new Event('input'));
        }
    }

    function addDiscountRangeFilter() {
        if (!state.ui.divFilter) return;
        const groupName = 'DiscountRange';
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) {
                updateDiscountSlider();
                return;
            }
            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            const { min, max } = calculateDiscountRange();
            state.filters.discountRange = { min, max, currentMin: min, currentMax: max, enabled: false };

            const filterBlock = createFilterBlock(groupName, 'Discount Range', false);
            const contentContainer = filterBlock.querySelector('.ifc-filter-block-static');

            if (contentContainer) {
                const slider = createRangeSlider(
                    CONFIG.ids.discountSlider, min, max, min, max,
                    (minVal, maxVal) => {
                        state.filters.discountRange.currentMin = minVal;
                        state.filters.discountRange.currentMax = maxVal;
                        state.filters.discountRange.enabled = true;
                        const label = getElement(`#${CONFIG.ids.discountSlider}_label`);
                        if (label) label.textContent = `${formatPercentage(minVal)} - ${formatPercentage(maxVal)}`;
                        updateScreen();
                    }
                );
                contentContainer.appendChild(slider);
                const label = slider.querySelector('.ifc-slider-label');
                if (label) label.textContent = `${formatPercentage(min)} - ${formatPercentage(max)}`;
            }
            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('Failed to add discount range filter:', ex);
        }
    }

    function updateDiscountSlider() {
        const { min, max } = calculateDiscountRange();
        if (state.filters.discountRange.min !== min || state.filters.discountRange.max !== max) {
            state.filters.discountRange = {
                ...state.filters.discountRange, min, max,
                currentMin: Math.max(state.filters.discountRange.currentMin, min),
                currentMax: Math.min(state.filters.discountRange.currentMax, max)
            };
            const minSlider = getElement(`#${CONFIG.ids.discountSlider}_min`);
            const maxSlider = getElement(`#${CONFIG.ids.discountSlider}_max`);
            if (minSlider && maxSlider) {
                minSlider.min = min; minSlider.max = max;
                maxSlider.min = min; maxSlider.max = max;
                minSlider.value = state.filters.discountRange.currentMin;
                maxSlider.value = state.filters.discountRange.currentMax;
                minSlider.dispatchEvent(new Event('input'));
            }
        }
    }

    function resetDiscountSlider() {
        const { min, max } = state.filters.discountRange;
        state.filters.discountRange.currentMin = min;
        state.filters.discountRange.currentMax = max;
        state.filters.discountRange.enabled = false;
        const minSlider = getElement(`#${CONFIG.ids.discountSlider}_min`);
        const maxSlider = getElement(`#${CONFIG.ids.discountSlider}_max`);
        if (minSlider && maxSlider) {
            minSlider.value = min;
            maxSlider.value = max;
            minSlider.dispatchEvent(new Event('input'));
        }
    }

    async function addFilterControls() {
        try {
            addFilterLabel();
            addFilterButton();
            addSortButton();
            addFilterContainer();
            addSortContainer();
            await addFilterContainerOwned();
            await addFilterContainerPublishers();
            addPriceRangeFilter();
            addDiscountRangeFilter();
        } catch (ex) {
            console.error('Failed to add filter controls:', ex);
        }
    }

    // ==================== FILTER TOGGLE HANDLERS ====================

    function toggleFilterContainer() {
        try {
            state.ui.divFilterShow = !state.ui.divFilterShow;
            const filterContainer = getElement(`#${CONFIG.ids.filterContainer}`);
            const filterButton = getElement(`#${CONFIG.ids.filterButton}`);
            if (!filterContainer || !filterButton) return;

            if (state.ui.divSortShow) toggleSortContainer();

            if (state.ui.divFilterShow) {
                filterContainer.style.display = null;
                filterButton.setAttribute('aria-pressed', 'true');
                filterButton.classList.add(CONFIG.classes.activeButton);
            } else {
                filterContainer.style.display = 'none';
                filterButton.setAttribute('aria-pressed', 'false');
                filterButton.classList.remove(CONFIG.classes.activeButton);
            }
        } catch (ex) {
            console.error('Failed to toggle filter container:', ex);
        }
    }

    // ==================== SORT CONTAINER ====================

    function addSortContainer() {
        if (state.ui.divSort) return;
        try {
            if (getElement(`#${CONFIG.ids.sortContainer}`, false)) return;

            const sortContainer = document.createElement('div');
            sortContainer.id = CONFIG.ids.sortContainer;
            sortContainer.classList.add('filter-section', 'SortAndFilters-module__container___yA+Vp');
            sortContainer.style.display = 'none';

            const sortList = document.createElement('div');
            sortList.classList.add('filter-list', 'SortAndFilters-module__filterList___T81LH');

            const heading = document.createElement('h2');
            heading.classList.add(
                'filter-text-heading',
                'typography-module__spotLightSubtitlePortrait___RB7M0',
                'SortAndFilters-module__filtersText___8OwXG'
            );
            heading.textContent = 'Sort';

            const sortCriteriaContainer = document.createElement('div');
            sortCriteriaContainer.id = 'ifc_sort_criteria_container';
            sortCriteriaContainer.className = 'ifc-sort-criteria-container';

            sortList.appendChild(heading);
            sortList.appendChild(sortCriteriaContainer);
            sortContainer.appendChild(sortList);
            document.body.appendChild(sortContainer);

            const sortButton = getElement(`#${CONFIG.ids.sortButton}`);
            if (sortButton) {
                sortButton.addEventListener('click', toggleSortContainer);
            }

            renderSortCriteria();
            state.ui.divSort = true;
        } catch (ex) {
            console.error('Failed to add sort container:', ex);
        }
    }

    function toggleSortContainer() {
        try {
            state.ui.divSortShow = !state.ui.divSortShow;
            const sortContainer = getElement(`#${CONFIG.ids.sortContainer}`);
            const sortButton = getElement(`#${CONFIG.ids.sortButton}`);
            if (!sortContainer || !sortButton) return;

            if (state.ui.divFilterShow) toggleFilterContainer();

            if (state.ui.divSortShow) {
                sortContainer.style.display = null;
                sortButton.setAttribute('aria-pressed', 'true');
                sortButton.classList.add(CONFIG.classes.activeButton);
            } else {
                sortContainer.style.display = 'none';
                sortButton.setAttribute('aria-pressed', 'false');
                sortButton.classList.remove(CONFIG.classes.activeButton);
            }
        } catch (ex) {
            console.error('Failed to toggle sort container:', ex);
        }
    }

    function renderSortCriteria() {
        const container = getElement('#ifc_sort_criteria_container');
        if (!container) return;
        container.innerHTML = '';

        state.sort.criteria.forEach((criterion, index) => {
            const criterionRow = document.createElement('div');
            criterionRow.className = 'ifc-sort-criterion';

            const select = document.createElement('select');
            select.className = 'ifc-sort-select';

            state.sort.fields.forEach(field => {
                const option = document.createElement('option');
                option.value = field.value;
                option.textContent = field.label;
                option.selected = field.value === criterion.field;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                state.sort.criteria[index].field = e.target.value;
                const selectedField = state.sort.fields.find(f => f.value === e.target.value);
                if (selectedField) state.sort.criteria[index].label = selectedField.label;
                applySorting();
            });

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'ifc-sort-toggle';
            toggleBtn.textContent = criterion.order === 'asc' ? '\u2191' : '\u2193';
            toggleBtn.title = criterion.order === 'asc' ? 'Ascending' : 'Descending';

            toggleBtn.addEventListener('click', () => {
                state.sort.criteria[index].order = criterion.order === 'asc' ? 'desc' : 'asc';
                toggleBtn.textContent = state.sort.criteria[index].order === 'asc' ? '\u2191' : '\u2193';
                toggleBtn.title = state.sort.criteria[index].order === 'asc' ? 'Ascending' : 'Descending';
                applySorting();
            });

            criterionRow.appendChild(select);
            criterionRow.appendChild(toggleBtn);

            if (index > 0) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'ifc-sort-remove';
                removeBtn.textContent = '\u00d7';
                removeBtn.title = 'Remove sort criterion';
                removeBtn.addEventListener('click', () => {
                    state.sort.criteria.splice(index, 1);
                    renderSortCriteria();
                    applySorting();
                });
                criterionRow.appendChild(removeBtn);
            }

            container.appendChild(criterionRow);
        });

        if (state.sort.criteria.length < 3) {
            const addBtn = document.createElement('button');
            addBtn.className = 'ifc-sort-add';
            addBtn.textContent = '+ Add Sort Level';
            addBtn.addEventListener('click', () => {
                if (state.sort.criteria.length < 3) {
                    state.sort.criteria.push({ field: 'ifcName', order: 'asc', label: 'Name' });
                    renderSortCriteria();
                    applySorting();
                }
            });
            container.appendChild(addBtn);
        }
    }

    function applySorting() {
        try {
            const containers = Array.from(document.getElementsByClassName(CONFIG.selectors.items));
            const parent = containers[0]?.parentElement;
            if (!parent) return;

            containers.sort((a, b) => {
                for (const criterion of state.sort.criteria) {
                    const aVal = a.dataset[criterion.field];
                    const bVal = b.dataset[criterion.field];
                    let comparison = 0;

                    if (['ifcId', 'ifcPrice', 'ifcPriceDiscountPercent', 'ifcPriceDiscountAmount'].includes(criterion.field)) {
                        const aNum = parseFloat(aVal) || 0;
                        const bNum = parseFloat(bVal) || 0;
                        comparison = aNum - bNum;
                    } else {
                        const aStr = (aVal || '').toString().toLowerCase();
                        const bStr = (bVal || '').toString().toLowerCase();
                        comparison = aStr.localeCompare(bStr);
                    }

                    if (comparison !== 0) {
                        return criterion.order === 'asc' ? comparison : -comparison;
                    }
                }
                return 0;
            });

            containers.forEach(container => parent.appendChild(container));
        } catch (ex) {
            console.error('Failed to apply sorting:', ex);
        }
    }

    async function toggleFilterMenuListContainer(event) {
        try {
            const target = event.target.getAttribute('data-ifc-target');
            if (!target) return;
            const groupContainer = getElement(`#ifc_${target}`, false);
            if (!groupContainer) return;

            const menuButton = groupContainer.querySelector('.filter-block-button');
            const imgContainer = groupContainer.querySelector(`#ifc_img_${target}`);
            const listContainer = groupContainer.querySelector('.filter-block-content');
            if (!menuButton || !imgContainer || !listContainer) return;

            const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
            const type = imgContainer.dataset.ifcType;

            if (type === 'svg') {
                const resourceKey = isExpanded ? 'IMGExpand' : 'IMGCollapse';
                await updateSVGIcon(target, resourceKey, target);
            }

            menuButton.setAttribute('aria-expanded', (!isExpanded).toString());
            listContainer.style.display = isExpanded ? 'none' : null;
        } catch (ex) {
            console.error('Failed to toggle filter menu:', ex);
        }
    }

    // ==================== ITEM FILTERING ====================

    function injectDiscountBadge(container, discountPercent) {
        try {
            const existingBadge = container.querySelector('.ifc-discount-badge');
            if (existingBadge) {
                existingBadge.textContent = `-${discountPercent}%`;
                return;
            }

            const productDetails = safeQuerySelector(container, CONFIG.selectors.productDetails);
            if (!productDetails) return;

            const badge = document.createElement('span');
            badge.className = 'ifc-discount-badge';
            // Also try to pick up Xbox's own discount tag styling
            const discountTagClass = resolveClass(PREFIXES.discountTag);
            if (discountTagClass) badge.classList.add(discountTagClass);
            badge.textContent = `-${discountPercent}%`;
            badge.setAttribute('aria-label', `${discountPercent}% discount`);
            badge.style.marginLeft = '8px';
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';

            const priceContainer = productDetails.querySelector('div');
            if (priceContainer) {
                priceContainer.style.display = 'flex';
                priceContainer.style.alignItems = 'center';
                priceContainer.appendChild(badge);
            }
        } catch (ex) {
            console.error('Failed to inject discount badge:', ex);
        }
    }

    function setContainerData(container, id) {
        setDataAttribute(container, 'ifcId', id);

        const img = CONFIG.selectors.imageContainer
            ? safeQuerySelector(container, CONFIG.selectors.imageContainer)
            : null;
        setDataAttribute(container, 'ifcImage', img?.src);

        const link = CONFIG.selectors.productLink
            ? safeQuerySelector(container, CONFIG.selectors.productLink)
            : null;
        setDataAttribute(container, 'ifcName', link?.innerText);
        setDataAttribute(container, 'ifcUri', link?.href);

        const publisher = CONFIG.selectors.productPublisher
            ? safeQuerySelector(container, CONFIG.selectors.productPublisher)
            : null;
        setDataAttribute(container, 'ifcPublisher', publisher?.innerText);

        // Price extraction - use the new Price-module classes for more reliable parsing
        let priceBase = null;
        let priceDiscount = null;

        // Try new Price-module structure first
        const originalPriceClass = resolveClass(PREFIXES.originalPrice);
        const discountPriceClass = resolveClass(PREFIXES.discountPrice);
        const boldTextClass = resolveClass(PREFIXES.boldText);

        if (originalPriceClass) {
            const origEl = container.querySelector(`.${CSS.escape(originalPriceClass)}`);
            if (origEl) {
                priceBase = parseFloat(origEl.innerText.replace(/[^0-9.,-]/g, '').replace(',', '.'));
            }
        }

        if (discountPriceClass) {
            const discEl = container.querySelector(`.${CSS.escape(discountPriceClass)}`);
            if (discEl) {
                priceDiscount = parseFloat(discEl.innerText.replace(/[^0-9.,-]/g, '').replace(',', '.'));
            }
        }

        // If no original price found but there's a bold text price (non-discounted item), use that
        if (priceBase === null && priceDiscount === null && boldTextClass) {
            const boldEl = container.querySelector(`.${CSS.escape(boldTextClass)}`);
            if (boldEl) {
                priceBase = parseFloat(boldEl.innerText.replace(/[^0-9.,-]/g, '').replace(',', '.'));
            }
        }

        // Fallback to old span-based method
        if (priceBase === null && priceDiscount === null && CONFIG.selectors.productPrices) {
            const prices = container.querySelectorAll(CONFIG.selectors.productPrices);
            priceBase = prices[0] ? parseFloat(prices[0].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
            priceDiscount = prices[1] ? parseFloat(prices[1].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
        }

        const priceBaseRounded = priceBase && !isNaN(priceBase) ? Math.round(priceBase * 100) / 100 : null;
        const priceDiscountRounded = priceDiscount && !isNaN(priceDiscount) ? Math.round(priceDiscount * 100) / 100 : null;

        setDataAttribute(container, 'ifcPriceBase', priceBaseRounded);
        setDataAttribute(container, 'ifcPriceDiscount', priceDiscountRounded);
        setDataAttribute(container, 'ifcPrice', priceDiscountRounded ?? priceBaseRounded);

        if (priceDiscountRounded && priceDiscountRounded > 0 && priceBaseRounded) {
            const discountAmount = priceBaseRounded - priceDiscountRounded;
            const discountPercent = (discountAmount / priceBaseRounded) * 100;
            const discountAmountRounded = Math.round(discountAmount * 100) / 100;
            const discountPercentRounded = Math.round(discountPercent);

            setDataAttribute(container, 'ifcPriceDiscountAmount', discountAmountRounded);
            setDataAttribute(container, 'ifcPriceDiscountPercent', discountPercentRounded);

            if (discountPercentRounded > 0) {
                injectDiscountBadge(container, discountPercentRounded);
            }
        } else {
            setDataAttribute(container, 'ifcPriceDiscountAmount', 0);
            setDataAttribute(container, 'ifcPriceDiscountPercent', 0);
        }

        // Subscription info (third span)
        if (CONFIG.selectors.productPrices) {
            const prices = container.querySelectorAll(CONFIG.selectors.productPrices);
            setDataAttribute(container, 'ifcSubscription', prices[2]?.innerText);
        }

        const button = safeQuerySelector(container, 'button');
        const buttonText = button?.innerText;
        const hasOwnedText = container.innerText.indexOf('Owned') !== -1;
        const isBuyButton = buttonText === 'BUY' || buttonText === 'BUY TO OWN';
        const isOwned = hasOwnedText && !isBuyButton;

        if (isOwned) {
            container.classList.add('ifc-Owned');
            setDataAttribute(container, 'ifcOwned', true);
        } else {
            setDataAttribute(container, 'ifcOwned', false);
        }

        const isUnPurchasable = !isOwned && container.dataset.ifcPrice === 'null';

        if (isUnPurchasable) {
            container.classList.add('ifc-UnPurchasable');
            setDataAttribute(container, 'ifcUnpurchasable', true);
        } else {
            setDataAttribute(container, 'ifcUnpurchasable', false);
        }
    }

    function shouldShowContainer(container) {
        const isOwned = container.dataset.ifcOwned === 'true';
        const isUnPurchasable = container.dataset.ifcUnpurchasable === 'true';
        const publisher = container.dataset.ifcPublisher;
        const price = parseFloat(container.dataset.ifcPrice);
        const discount = parseInt(container.dataset.ifcPriceDiscountPercent);

        if (state.filters.owned.selected.length > 0) {
            let matchesOwned = false;
            if (state.filters.owned.selected.includes('Owned') && isOwned) matchesOwned = true;
            if (state.filters.owned.selected.includes('Not Owned') && !isOwned && !isUnPurchasable) matchesOwned = true;
            if (state.filters.owned.selected.includes('Un-Purchasable') && isUnPurchasable) matchesOwned = true;
            if (!matchesOwned) return false;
        }

        if (state.filters.publishers.selected.length > 0) {
            if (publisher && publisher !== 'null' && publisher.trim() !== '') {
                if (!state.filters.publishers.selected.includes(publisher.trim())) return false;
            } else {
                return false;
            }
        }

        if (state.filters.priceRange.enabled && !isNaN(price) && price > 0) {
            if (price < state.filters.priceRange.currentMin || price > state.filters.priceRange.currentMax) return false;
        }

        if (state.filters.discountRange.enabled && !isNaN(discount) && discount > 0) {
            if (discount < state.filters.discountRange.currentMin || discount > state.filters.discountRange.currentMax) return false;
        }

        return true;
    }

    function toggleContainers() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);

        Array.from(containers).forEach((container, index) => {
            setContainerData(container, containers.length - index);
        });

        collectPublishers();
        updatePublishersCheckboxes();
        updatePriceSlider();
        updateDiscountSlider();

        Array.from(containers).forEach((container) => {
            try {
                const shouldShow = shouldShowContainer(container);
                if (shouldShow) {
                    container.style.display = null;
                    container.classList.add('ifc-Show');
                    container.classList.remove('ifc-Hide');
                    setDataAttribute(container, 'ifcShow', true);
                } else {
                    container.style.display = 'none';
                    container.classList.add('ifc-Hide');
                    container.classList.remove('ifc-Show');
                    setDataAttribute(container, 'ifcShow', false);
                }
            } catch (ex) {
                console.error('Failed to toggle container:', ex);
            }
        });
    }

    function updateFilterCounts() {
        const selector = `.${CSS.escape(CONFIG.selectors.items)}`;
        state.filters.totalCount = document.querySelectorAll(selector).length;
        state.filters.filteredCount = document.querySelectorAll(`${selector}.ifc-Show`).length;
    }

    function updateFilterLabels() {
        updateFilterCounts();
        const label = getElement(`#${CONFIG.ids.filterLabel}`);
        if (label) {
            label.textContent = `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`;
        }
    }

    function updateScreen() {
        try {
            toggleContainers();
            updateFilterLabels();
            updateActiveTags();
            applySorting();
            saveFilterState();
        } catch (ex) {
            console.error('Failed to update screen:', ex);
        }
    }

    // ==================== CLEANUP ====================

    function removeUnwantedControls() {
        try {
            document.querySelectorAll('.hr.border-neutral-200').forEach(el => el.remove());
        } catch (ex) {
            console.error('Failed to remove unwanted controls:', ex);
        }
    }

    // ==================== INITIALIZATION ====================

    async function onDOMReady() {
        // Try to resolve selectors dynamically from the live DOM
        if (!resolveSelectors()) return;

        if (!document.getElementsByClassName(CONFIG.selectors.items).length) return;

        try {
            floatButtons();
            await addFilterControls();
            removeUnwantedControls();
            state.ui.complete = true;
            updateScreen();
            console.log('[XBOX Wishlist] v' + state.info.script.version + ' initialized successfully!');
        } catch (ex) {
            console.error('Failed to initialize UI:', ex);
        }

        observer.disconnect();
    }

    /**
     * Inject inline CSS for checkbox styles and container backgrounds
     */
    async function initialize() {
        try {
            // Load external CSS stylesheet
            await addStyle(GM_getResourceURL('CSSFilter'));

            loadFilterState();

            const contentElement = getElement(`#${CONFIG.selectors.content}`, false);
            if (contentElement) {
                observer.observe(contentElement, { childList: true, subtree: true });
            }
        } catch (ex) {
            console.error('Failed to initialize script:', ex);
        }
    }

    // ==================== START ====================

    const observer = new MutationObserver(onDOMReady);
    initialize();

})();
