// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.4.26056.5
// @description  Advanced filtering and sorting suite with multi-level sort (up to 3 criteria) - Resilient selectors - Public wishlist support
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

    // ==================== SELECTOR PREFIXES ====================
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
        discountTag:        'Price-module__discountTag___',
    };

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
            ownedSelect: 'ifc_select_owned',
            publishersSelect: 'ifc_select_publishers',
            priceSlider: 'ifc_slider_price',
            discountSlider: 'ifc_slider_discount'
        },
        classes: { button: [], svgIcon: [], activeButton: null },
        storage: { key: 'ifc_xbox_wishlist' },
        ui: { buttonContainer: { position: 'fixed', top: '100px', right: '100px', zIndex: '998' } }
    };

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

    // ==================== STATE MANAGEMENT ====================
    const state = {
        info: GM_info, scripts: [], styles: [],
        svgCache: new Map(), elementCache: new Map(),
        ui: {
            floatButtons: false, lblFilter: false, btnFilter: false, btnSort: false,
            divFilter: false, divSort: false, divFilterShow: false, divSortShow: false,
            tagContainer: false, complete: false
        },
        filters: {
            totalCount: 0, filteredCount: 0, activeTags: [],
            owned: { selected: [], options: ['Owned', 'Not Owned', 'Un-Purchasable'] },
            publishers: { selected: [], list: new Map() },
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
    function applyStyles(element, styles) { if (element && styles) Object.assign(element.style, styles); }
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
            const saveData = { ...state.filters,
                publishers: { selected: state.filters.publishers.selected, list: Array.from(state.filters.publishers.list.entries()) }
            };
            GM_setValue(CONFIG.storage.key, JSON.stringify(saveData));
        } catch (ex) { console.error('Failed to save filter state:', ex); }
    }

    function loadFilterState() {
        try {
            const saved = GM_getValue(CONFIG.storage.key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.owned) {
                        state.filters.owned.selected = Array.isArray(parsed.owned.selected) ? parsed.owned.selected : [];
                        if (Array.isArray(parsed.owned.options)) state.filters.owned.options = parsed.owned.options;
                    }
                    if (parsed.publishers) {
                        state.filters.publishers.selected = Array.isArray(parsed.publishers.selected) ? parsed.publishers.selected : [];
                        if (Array.isArray(parsed.publishers.list)) state.filters.publishers.list = new Map(parsed.publishers.list);
                    }
                    if (parsed.priceRange && typeof parsed.priceRange === 'object') {
                        const { enabled, ...rest } = parsed.priceRange;
                        state.filters.priceRange = { ...state.filters.priceRange, ...rest, enabled: false };
                    }
                    if (parsed.discountRange && typeof parsed.discountRange === 'object') {
                        const { enabled, ...rest } = parsed.discountRange;
                        state.filters.discountRange = { ...state.filters.discountRange, ...rest, enabled: false };
                    }
                    if (typeof parsed.totalCount === 'number') state.filters.totalCount = parsed.totalCount;
                    if (typeof parsed.filteredCount === 'number') state.filters.filteredCount = parsed.filteredCount;
                    if (Array.isArray(parsed.activeTags)) state.filters.activeTags = parsed.activeTags;
                }
            }
        } catch (ex) {
            console.error('Failed to load filter state:', ex);
        }
    }

    // ==================== TAG MANAGEMENT ====================
    function updateActiveTags() {
        const tags = [];
        state.filters.owned.selected.forEach(item => tags.push({ type: 'owned', value: item, label: item }));
        state.filters.publishers.selected.forEach(pub => {
            const count = state.filters.publishers.list.get(pub) || 0;
            tags.push({ type: 'publisher', value: pub, label: `${pub} (${count})` });
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
    }

    function renderTags() {
        const tagContainer = getElement(`#${CONFIG.ids.tagContainer}`);
        if (!tagContainer) return;
        tagContainer.innerHTML = '';
        if (state.filters.activeTags.length === 0) { tagContainer.style.display = 'none'; return; }
        tagContainer.style.display = 'flex';
        state.filters.activeTags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'ifc-filter-tag'; tagEl.textContent = tag.label;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'ifc-tag-remove'; removeBtn.textContent = '\u00d7';
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
            case 'price': state.filters.priceRange.enabled = false; resetPriceSlider(); break;
            case 'discount': state.filters.discountRange.enabled = false; resetDiscountSlider(); break;
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
        applyStyles(label, { marginLeft: '5px', marginRight: '5px' });
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
            if (minVal > maxVal - (max - min) * 0.01) { minVal = maxVal - (max - min) * 0.01; minSlider.value = minVal; }
            const minPercent = ((minVal - min) / (max - min)) * 100;
            const maxPercent = ((maxVal - min) / (max - min)) * 100;
            range.style.left = `${minPercent}%`; range.style.width = `${maxPercent - minPercent}%`;
            if (onChange && isUserInteraction) onChange(minVal, maxVal);
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
            const svgText = await getSVG(GM_getResourceURL(resourceKey));
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
            applyStyles(buttonContainer, CONFIG.ui.buttonContainer);
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
            bc.appendChild(createImageButton('Filter', GM_getResourceURL('IMGFilter'), 'Filter', 'svg'));
            state.ui.btnFilter = true;
        } catch (ex) { console.error('Failed to add filter button:', ex); }
    }
    function addSortButton() {
        if (state.ui.btnSort) return;
        try {
            const bc = getElement(`#${CONFIG.ids.buttonContainer}`); if (!bc) return;
            bc.appendChild(createImageButton('Sort', GM_getResourceURL('IMGSort'), 'Sort', 'svg'));
            state.ui.btnSort = true;
        } catch (ex) { console.error('Failed to add sort button:', ex); }
    }

    function addFilterContainer() {
        if (state.ui.divFilter) return;
        try {
            if (getElement(`#${CONFIG.ids.filterContainer}`, false)) return;
            const fc = document.createElement('div');
            fc.id = CONFIG.ids.filterContainer;
            fc.classList.add('filter-section', 'SortAndFilters-module__container___yA+Vp');
            fc.style.display = 'none';
            const fl = document.createElement('div');
            fl.classList.add('filter-list', 'SortAndFilters-module__filterList___T81LH');
            const h = document.createElement('h2');
            h.classList.add('filter-text-heading', 'typography-module__spotLightSubtitlePortrait___RB7M0', 'SortAndFilters-module__filtersText___8OwXG');
            h.textContent = 'Filters';
            const tc = document.createElement('div');
            tc.id = CONFIG.ids.tagContainer; tc.className = 'ifc-tag-container'; tc.style.display = 'none';
            const fg = document.createElement('ul');
            fg.classList.add('filter-groups', 'SortAndFilters-module__filterList___T81LH');
            fl.appendChild(h); fl.appendChild(tc); fl.appendChild(fg); fc.appendChild(fl);
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
        loadSVGIntoContainer(chevronContainer, GM_getResourceURL('IMGExpand'), `accordion_${id}`);
        headerButton.appendChild(headerText); headerButton.appendChild(chevronContainer);

        const contentPanel = document.createElement('div');
        contentPanel.className = 'ifc-accordion-content';
        if (id) contentPanel.id = `ifc_group_content_${id}`;
        contentPanel.style.display = 'none';

        // FIX: Load SVG directly into chevronContainer (closure ref) instead of
        // updateSVGIcon which looks for #ifc_img_... prefixed IDs that don't match
        headerButton.addEventListener('click', async () => {
            const isExpanded = headerButton.getAttribute('aria-expanded') === 'true';
            headerButton.setAttribute('aria-expanded', (!isExpanded).toString());
            contentPanel.style.display = isExpanded ? 'none' : 'block';
            const resourceKey = isExpanded ? 'IMGExpand' : 'IMGCollapse';
            await loadSVGIntoContainer(chevronContainer, GM_getResourceURL(resourceKey), `accordion_${id}`);
        });

        groupContainer.appendChild(headerButton); groupContainer.appendChild(contentPanel);
        return groupContainer;
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
    }

    function calculatePriceRange() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        let min = Infinity, max = 0;
        Array.from(containers).forEach(c => {
            const price = parseFloat(c.dataset.ifcPrice);
            if (!isNaN(price) && price > 0) { min = Math.min(min, price); max = Math.max(max, price); }
        });
        if (min === Infinity) min = 0;
        if (max < min) max = min;
        // FIX: Ensure slider always reaches at least 3000
        max = Math.max(max, 3000);
        min = Math.floor(min / 10) * 10;
        max = Math.ceil(max / 10) * 10;
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
            state.filters.priceRange = { min, max, currentMin: min, currentMax: max, enabled: false };
            const fb = createFilterBlock(gn, 'Price Range', false);
            const cc = fb.querySelector('.ifc-filter-block-static');
            if (cc) {
                const slider = createRangeSlider(CONFIG.ids.priceSlider, min, max, min, max, (minVal, maxVal) => {
                    state.filters.priceRange.currentMin = minVal; state.filters.priceRange.currentMax = maxVal;
                    state.filters.priceRange.enabled = true;
                    const l = getElement(`#${CONFIG.ids.priceSlider}_label`);
                    if (l) l.textContent = `${formatCurrency(minVal)} - ${formatCurrency(maxVal)}`;
                    updateScreen();
                });
                cc.appendChild(slider);
                const l = slider.querySelector('.ifc-slider-label');
                if (l) l.textContent = `${formatCurrency(min)} - ${formatCurrency(max)}`;
            }
            fg.appendChild(fb);
        } catch (ex) { console.error('Failed to add price range filter:', ex); }
    }

    function updatePriceSlider() {
        const { min, max } = calculatePriceRange();
        if (state.filters.priceRange.min !== min || state.filters.priceRange.max !== max) {
            state.filters.priceRange = { ...state.filters.priceRange, min, max,
                currentMin: Math.max(state.filters.priceRange.currentMin, min),
                currentMax: Math.min(state.filters.priceRange.currentMax, max)
            };
            const mn = getElement(`#${CONFIG.ids.priceSlider}_min`), mx = getElement(`#${CONFIG.ids.priceSlider}_max`);
            if (mn && mx) {
                mn.min = min; mn.max = max; mx.min = min; mx.max = max;
                mn.value = state.filters.priceRange.currentMin; mx.value = state.filters.priceRange.currentMax;
                mn.dispatchEvent(new Event('input'));
            }
        }
    }
    function resetPriceSlider() {
        const { min, max } = state.filters.priceRange;
        state.filters.priceRange.currentMin = min; state.filters.priceRange.currentMax = max; state.filters.priceRange.enabled = false;
        const mn = getElement(`#${CONFIG.ids.priceSlider}_min`), mx = getElement(`#${CONFIG.ids.priceSlider}_max`);
        if (mn && mx) { mn.value = min; mx.value = max; mn.dispatchEvent(new Event('input')); }
    }

    function addDiscountRangeFilter() {
        if (!state.ui.divFilter) return;
        const gn = 'DiscountRange';
        try {
            if (getElement(`#ifc_group_${gn}`, false)) { updateDiscountSlider(); return; }
            const fg = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!fg) return;
            const { min, max } = calculateDiscountRange();
            state.filters.discountRange = { min, max, currentMin: min, currentMax: max, enabled: false };
            const fb = createFilterBlock(gn, 'Discount Range', false);
            const cc = fb.querySelector('.ifc-filter-block-static');
            if (cc) {
                const slider = createRangeSlider(CONFIG.ids.discountSlider, min, max, min, max, (minVal, maxVal) => {
                    state.filters.discountRange.currentMin = minVal; state.filters.discountRange.currentMax = maxVal;
                    state.filters.discountRange.enabled = true;
                    const l = getElement(`#${CONFIG.ids.discountSlider}_label`);
                    if (l) l.textContent = `${formatPercentage(minVal)} - ${formatPercentage(maxVal)}`;
                    updateScreen();
                });
                cc.appendChild(slider);
                const l = slider.querySelector('.ifc-slider-label');
                if (l) l.textContent = `${formatPercentage(min)} - ${formatPercentage(max)}`;
            }
            fg.appendChild(fb);
        } catch (ex) { console.error('Failed to add discount range filter:', ex); }
    }

    function updateDiscountSlider() {
        const { min, max } = calculateDiscountRange();
        if (state.filters.discountRange.min !== min || state.filters.discountRange.max !== max) {
            state.filters.discountRange = { ...state.filters.discountRange, min, max,
                currentMin: Math.max(state.filters.discountRange.currentMin, min),
                currentMax: Math.min(state.filters.discountRange.currentMax, max)
            };
            const mn = getElement(`#${CONFIG.ids.discountSlider}_min`), mx = getElement(`#${CONFIG.ids.discountSlider}_max`);
            if (mn && mx) {
                mn.min = min; mn.max = max; mx.min = min; mx.max = max;
                mn.value = state.filters.discountRange.currentMin; mx.value = state.filters.discountRange.currentMax;
                mn.dispatchEvent(new Event('input'));
            }
        }
    }
    function resetDiscountSlider() {
        const { min, max } = state.filters.discountRange;
        state.filters.discountRange.currentMin = min; state.filters.discountRange.currentMax = max; state.filters.discountRange.enabled = false;
        const mn = getElement(`#${CONFIG.ids.discountSlider}_min`), mx = getElement(`#${CONFIG.ids.discountSlider}_max`);
        if (mn && mx) { mn.value = min; mx.value = max; mn.dispatchEvent(new Event('input')); }
    }

    async function addFilterControls() {
        try {
            addFilterLabel(); addFilterButton(); addSortButton();
            addFilterContainer(); addSortContainer();
            await addFilterContainerOwned(); await addFilterContainerPublishers();
            addPriceRangeFilter(); addDiscountRangeFilter();
        } catch (ex) { console.error('Failed to add filter controls:', ex); }
    }

    // ==================== FILTER TOGGLE HANDLERS ====================
    function toggleFilterContainer() {
        try {
            state.ui.divFilterShow = !state.ui.divFilterShow;
            const fc = getElement(`#${CONFIG.ids.filterContainer}`), fb = getElement(`#${CONFIG.ids.filterButton}`);
            if (!fc || !fb) return;
            if (state.ui.divSortShow) toggleSortContainer();
            if (state.ui.divFilterShow) {
                fc.style.display = null; fb.setAttribute('aria-pressed', 'true'); fb.classList.add(CONFIG.classes.activeButton);
            } else {
                fc.style.display = 'none'; fb.setAttribute('aria-pressed', 'false'); fb.classList.remove(CONFIG.classes.activeButton);
            }
        } catch (ex) { console.error('Failed to toggle filter container:', ex); }
    }

    // ==================== SORT CONTAINER ====================
    function addSortContainer() {
        if (state.ui.divSort) return;
        try {
            if (getElement(`#${CONFIG.ids.sortContainer}`, false)) return;
            const sc = document.createElement('div');
            sc.id = CONFIG.ids.sortContainer;
            sc.classList.add('filter-section', 'SortAndFilters-module__container___yA+Vp');
            sc.style.display = 'none';
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

    function toggleSortContainer() {
        try {
            state.ui.divSortShow = !state.ui.divSortShow;
            const sc = getElement(`#${CONFIG.ids.sortContainer}`), sb = getElement(`#${CONFIG.ids.sortButton}`);
            if (!sc || !sb) return;
            if (state.ui.divFilterShow) toggleFilterContainer();
            if (state.ui.divSortShow) {
                sc.style.display = null; sb.setAttribute('aria-pressed', 'true'); sb.classList.add(CONFIG.classes.activeButton);
            } else {
                sc.style.display = 'none'; sb.setAttribute('aria-pressed', 'false'); sb.classList.remove(CONFIG.classes.activeButton);
            }
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
                applySorting();
            });
            const toggleBtn = document.createElement('button'); toggleBtn.className = 'ifc-sort-toggle';
            toggleBtn.textContent = criterion.order === 'asc' ? '\u2191' : '\u2193';
            toggleBtn.title = criterion.order === 'asc' ? 'Ascending' : 'Descending';
            toggleBtn.addEventListener('click', () => {
                state.sort.criteria[index].order = criterion.order === 'asc' ? 'desc' : 'asc';
                toggleBtn.textContent = state.sort.criteria[index].order === 'asc' ? '\u2191' : '\u2193';
                toggleBtn.title = state.sort.criteria[index].order === 'asc' ? 'Ascending' : 'Descending';
                applySorting();
            });
            row.appendChild(select); row.appendChild(toggleBtn);
            if (index > 0) {
                const removeBtn = document.createElement('button'); removeBtn.className = 'ifc-sort-remove';
                removeBtn.textContent = '\u00d7'; removeBtn.title = 'Remove sort criterion';
                removeBtn.addEventListener('click', () => { state.sort.criteria.splice(index, 1); renderSortCriteria(); applySorting(); });
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
                    renderSortCriteria(); applySorting();
                }
            });
            container.appendChild(addBtn);
        }
    }

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
            badge.style.marginLeft = '8px'; badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center'; badge.style.justifyContent = 'center';
            const pc = pd.querySelector('div');
            if (pc) { pc.style.display = 'flex'; pc.style.alignItems = 'center'; pc.appendChild(badge); }
        } catch (ex) { console.error('Failed to inject discount badge:', ex); }
    }

    function setContainerData(container, id) {
        setDataAttribute(container, 'ifcId', id);
        const img = CONFIG.selectors.imageContainer ? safeQuerySelector(container, CONFIG.selectors.imageContainer) : null;
        setDataAttribute(container, 'ifcImage', img?.src);
        const link = CONFIG.selectors.productLink ? safeQuerySelector(container, CONFIG.selectors.productLink) : null;
        setDataAttribute(container, 'ifcName', link?.innerText);
        setDataAttribute(container, 'ifcUri', link?.href);
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
        if (CONFIG.selectors.productPrices) {
            const prices = container.querySelectorAll(CONFIG.selectors.productPrices);
            setDataAttribute(container, 'ifcSubscription', prices[2]?.innerText);
        }
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
        Array.from(containers).forEach((c, i) => setContainerData(c, containers.length - i));
        collectPublishers(); updatePublishersCheckboxes(); updatePriceSlider(); updateDiscountSlider();
        Array.from(containers).forEach(c => {
            try {
                if (shouldShowContainer(c)) {
                    c.style.display = null; c.classList.add('ifc-Show'); c.classList.remove('ifc-Hide');
                    setDataAttribute(c, 'ifcShow', true);
                } else {
                    c.style.display = 'none'; c.classList.add('ifc-Hide'); c.classList.remove('ifc-Show');
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
        try { toggleContainers(); updateFilterLabels(); updateActiveTags(); applySorting(); saveFilterState(); }
        catch (ex) { console.error('Failed to update screen:', ex); }
    }

    // ==================== CLEANUP ====================
    function removeUnwantedControls() {
        try { document.querySelectorAll('.hr.border-neutral-200').forEach(el => el.remove()); }
        catch (ex) { console.error('Failed to remove unwanted controls:', ex); }
    }

    // ==================== INITIALIZATION ====================
    async function onDOMReady() {
        if (!resolveSelectors()) return;
        if (!document.getElementsByClassName(CONFIG.selectors.items).length) return;
        try {
            floatButtons();
            await addFilterControls();
            removeUnwantedControls();
            state.ui.complete = true;
            updateScreen();
            console.log('[XBOX Wishlist] v' + state.info.script.version + ' initialized successfully!');
        } catch (ex) { console.error('Failed to initialize UI:', ex); }
        observer.disconnect();
    }

    async function initialize() {
        try {
            await addStyle(GM_getResourceURL('CSSFilter'));
            loadFilterState();
            const ce = getElement(`#${CONFIG.selectors.content}`, false);
            if (ce) observer.observe(ce, { childList: true, subtree: true });
        } catch (ex) { console.error('Failed to initialize script:', ex); }
    }

    // ==================== START ====================
    const observer = new MutationObserver(onDOMReady);
    initialize();
})();
