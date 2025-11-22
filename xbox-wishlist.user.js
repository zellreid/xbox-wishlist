// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.2.25326.2
// @description  Advanced filtering suite with Select2, tag display, inverted logic, and range sliders (bug fix: state initialization)
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @resource     JSJQuery https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @resource     JSSelect2 https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js
// @resource     CSSSelect2 https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css
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

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        selectors: {
            content: 'PageContent',
            items: 'WishlistProductItem-module__itemContainer___weUfG',
            buttons: 'WishlistPage-module__menuContainer___MNCGP',
            imageContainer: '.WishlistProductItem-module__imageContainer___lY7BQ a img',
            productDetails: '.WishlistProductItem-module__productDetails___RquZp',
            productLink: '.WishlistProductItem-module__productDetails___RquZp a',
            productPublisher: '.WishlistProductItem-module__productDetails___RquZp p',
            productPrices: '.WishlistProductItem-module__productDetails___RquZp div span',
            filterGroups: '.filter-groups'
        },
        ids: {
            buttonContainer: 'ifc_ButtonContainer',
            filterContainer: 'injectedFilterControls',
            filterLabel: 'ifc_lbl_Filter',
            filterButton: 'ifc_btn_Filter',
            tagContainer: 'ifc_tag_container',
            ownedSelect: 'ifc_select_owned',
            publishersSelect: 'ifc_select_publishers',
            priceSlider: 'ifc_slider_price',
            discountSlider: 'ifc_slider_discount'
        },
        classes: {
            button: [
                'WishlistPage-module__wishlistMenuButton___pmqaD',
                'Button-module__iconButtonBase___uzoKc',
                'Button-module__basicBorderRadius___TaX9J',
                'Button-module__sizeIconButtonMedium___WJrxo',
                'Button-module__buttonBase___olICK',
                'Button-module__textNoUnderline___kHdUB',
                'Button-module__typeSecondary___Cid02',
                'Button-module__overlayModeSolid___v6EcO'
            ],
            svgIcon: [
                'Button-module__buttonIcon___540Jm',
                'Button-module__noMargin___5UbzU',
                'WishlistPage-module__icon___yWWwy',
                'Icon-module__icon___6ICyA',
                'Icon-module__xxSmall___vViZA'
            ],
            activeButton: 'WishlistPage-module__activeWishlistMenuButton___3V2d8'
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
            divFilter: false,
            divFilterShow: false,
            tagContainer: false,
            select2Ready: false,
            complete: false
        },
        filters: {
            totalCount: 0,
            filteredCount: 0,
            activeTags: [], // Active filter tags
            owned: {
                selected: [], // Inverted: empty = show all
                options: ['Owned', 'Not Owned', 'Un-Purchasable']
            },
            publishers: {
                selected: [], // Inverted: empty = show all
                list: new Map() // Map<publisherName, count>
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
        }
    };

    // Make state available globally for backward compatibility
    window.injected = state;

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Get or cache a DOM element
     */
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

    /**
     * Clear element cache
     */
    function clearElementCache() {
        state.elementCache.clear();
    }

    /**
     * Add multiple classes to an element
     */
    function addClasses(element, classes) {
        if (!element || !classes) return;
        element.classList.add(...classes);
    }

    /**
     * Apply multiple styles to an element
     */
    function applyStyles(element, styles) {
        if (!element || !styles) return;
        Object.assign(element.style, styles);
    }

    /**
     * Safe data attribute setter
     */
    function setDataAttribute(element, key, value) {
        try {
            element.dataset[key] = value ?? null;
        } catch (ex) {
            console.error(`Failed to set data attribute ${key}:`, ex);
            element.dataset[key] = null;
        }
    }

    /**
     * Safe querySelector with default
     */
    function safeQuerySelector(container, selector, defaultValue = null) {
        try {
            return container.querySelector(selector) ?? defaultValue;
        } catch (ex) {
            console.error(`Query selector failed for ${selector}:`, ex);
            return defaultValue;
        }
    }

    /**
     * Format currency
     */
    function formatCurrency(value) {
        return `R ${value.toFixed(2)}`;
    }

    /**
     * Format percentage
     */
    function formatPercentage(value) {
        return `${Math.round(value)}%`;
    }

    // ==================== RESOURCE MANAGEMENT ====================

    /**
     * Add external script to page
     */
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

    /**
     * Add external stylesheet to page
     */
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

    /**
     * Check if resource already added
     */
    function isResourceAdded(resourceArray, url) {
        if (!resourceArray || !Array.isArray(resourceArray)) {
            return false;
        }
        return resourceArray.some(resource => 
            resource.src === url || resource.href === url
        );
    }

    /**
     * Fetch and cache SVG content
     */
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

    /**
     * Save filter state to storage
     */
    function saveFilterState() {
        try {
            // Convert Map to array for JSON serialization
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

    /**
     * Load filter state from storage
     */
    function loadFilterState() {
        try {
            const saved = GM_getValue(CONFIG.storage.key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    // Safely merge owned filters
                    if (parsed.owned) {
                        state.filters.owned.selected = Array.isArray(parsed.owned.selected) 
                            ? parsed.owned.selected 
                            : [];
                        if (Array.isArray(parsed.owned.options)) {
                            state.filters.owned.options = parsed.owned.options;
                        }
                    }

                    // Safely merge publishers filters
                    if (parsed.publishers) {
                        state.filters.publishers.selected = Array.isArray(parsed.publishers.selected) 
                            ? parsed.publishers.selected 
                            : [];
                        // Restore publishers Map from array
                        if (Array.isArray(parsed.publishers.list)) {
                            state.filters.publishers.list = new Map(parsed.publishers.list);
                        }
                    }

                    // Safely merge price range
                    if (parsed.priceRange && typeof parsed.priceRange === 'object') {
                        state.filters.priceRange = { ...state.filters.priceRange, ...parsed.priceRange };
                    }

                    // Safely merge discount range
                    if (parsed.discountRange && typeof parsed.discountRange === 'object') {
                        state.filters.discountRange = { ...state.filters.discountRange, ...parsed.discountRange };
                    }

                    // Merge other top-level properties
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
            // Ensure state is valid even if loading fails
            state.filters.owned.selected = state.filters.owned.selected || [];
            state.filters.publishers.selected = state.filters.publishers.selected || [];
        }
    }

    // ==================== TAG MANAGEMENT ====================

    /**
     * Update active filter tags
     */
    function updateActiveTags() {
        const tags = [];

        // Owned filters (inverted: show selected items)
        if (state.filters.owned.selected.length > 0) {
            state.filters.owned.selected.forEach(item => {
                tags.push({ type: 'owned', value: item, label: item });
            });
        }

        // Publisher filters (inverted: show selected items)
        if (state.filters.publishers.selected.length > 0) {
            state.filters.publishers.selected.forEach(pub => {
                const count = state.filters.publishers.list.get(pub) || 0;
                tags.push({ type: 'publisher', value: pub, label: `${pub} (${count})` });
            });
        }

        // Price range filter
        if (state.filters.priceRange.enabled) {
            const { currentMin, currentMax } = state.filters.priceRange;
            tags.push({
                type: 'price',
                value: 'price',
                label: `Price: ${formatCurrency(currentMin)} - ${formatCurrency(currentMax)}`
            });
        }

        // Discount range filter
        if (state.filters.discountRange.enabled) {
            const { currentMin, currentMax } = state.filters.discountRange;
            tags.push({
                type: 'discount',
                value: 'discount',
                label: `Discount: ${formatPercentage(currentMin)} - ${formatPercentage(currentMax)}`
            });
        }

        state.filters.activeTags = tags;
        renderTags();
    }

    /**
     * Render tag display
     */
    function renderTags() {
        const tagContainer = getElement(`#${CONFIG.ids.tagContainer}`);
        if (!tagContainer) return;

        // Clear existing tags
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
            removeBtn.textContent = '×';
            removeBtn.setAttribute('aria-label', `Remove ${tag.label}`);
            removeBtn.onclick = () => removeTag(tag);

            tagElement.appendChild(removeBtn);
            tagContainer.appendChild(tagElement);
        });
    }

    /**
     * Remove a filter tag
     */
    function removeTag(tag) {
        switch (tag.type) {
            case 'owned':
                state.filters.owned.selected = state.filters.owned.selected.filter(v => v !== tag.value);
                updateSelect2(CONFIG.ids.ownedSelect, state.filters.owned.selected);
                break;
            case 'publisher':
                state.filters.publishers.selected = state.filters.publishers.selected.filter(v => v !== tag.value);
                updateSelect2(CONFIG.ids.publishersSelect, state.filters.publishers.selected);
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
     * Update Select2 value programmatically
     */
    function updateSelect2(elementId, values) {
        if (typeof jQuery === 'undefined' || typeof jQuery.fn.select2 === 'undefined') return;
        
        const element = $(`#${elementId}`);
        if (element.length) {
            element.val(values).trigger('change.select2');
        }
    }

    // ==================== SELECT2 INITIALIZATION ====================

    /**
     * Initialize Select2 on an element
     */
    function initSelect2(elementId, options = {}) {
        if (typeof jQuery === 'undefined' || typeof jQuery.fn.select2 === 'undefined') {
            console.error('Select2 not available');
            return;
        }

        const $element = $(`#${elementId}`);
        if (!$element.length) return;

        const defaultOptions = {
            theme: 'xbox',
            width: '100%',
            placeholder: 'Select filters...',
            allowClear: false,
            closeOnSelect: false,
            ...options
        };

        $element.select2(defaultOptions);
    }

    /**
     * Wait for jQuery and Select2 to be ready
     */
    async function waitForSelect2() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined') {
                    clearInterval(checkInterval);
                    state.ui.select2Ready = true;
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    // ==================== UI CREATION HELPERS ====================

    /**
     * Create label element
     */
    function createLabel(id, text) {
        const label = document.createElement('label');
        applyStyles(label, {
            marginLeft: '5px',
            marginRight: '5px'
        });
        label.textContent = text;
        
        if (id) {
            label.id = `ifc_lbl_${id}`;
        }
        
        return label;
    }

    /**
     * Create Select2 multi-select
     */
    function createSelect2Multi(id, options, selected = []) {
        const select = document.createElement('select');
        select.id = id;
        select.multiple = true;
        select.className = 'ifc-select2-multi';

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            if (selected.includes(option.value)) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        return select;
    }

    /**
     * Create range slider
     */
    function createRangeSlider(id, min, max, currentMin, currentMax, onChange) {
        const container = document.createElement('div');
        container.className = 'ifc-slider-container';
        container.id = `${id}_container`;

        // Label
        const label = document.createElement('div');
        label.className = 'ifc-slider-label';
        label.id = `${id}_label`;
        container.appendChild(label);

        // Slider track
        const track = document.createElement('div');
        track.className = 'ifc-slider-track';

        const range = document.createElement('div');
        range.className = 'ifc-slider-range';
        range.id = `${id}_range`;
        track.appendChild(range);

        // Min slider
        const minSlider = document.createElement('input');
        minSlider.type = 'range';
        minSlider.className = 'ifc-slider ifc-slider-min';
        minSlider.id = `${id}_min`;
        minSlider.min = min;
        minSlider.max = max;
        minSlider.value = currentMin;
        minSlider.step = (max - min) / 100;

        // Max slider
        const maxSlider = document.createElement('input');
        maxSlider.type = 'range';
        maxSlider.className = 'ifc-slider ifc-slider-max';
        maxSlider.id = `${id}_max`;
        maxSlider.min = min;
        maxSlider.max = max;
        maxSlider.value = currentMax;
        maxSlider.step = (max - min) / 100;

        track.appendChild(minSlider);
        track.appendChild(maxSlider);
        container.appendChild(track);

        // Update function
        const updateSlider = () => {
            let minVal = parseFloat(minSlider.value);
            let maxVal = parseFloat(maxSlider.value);

            // Ensure min doesn't exceed max
            if (minVal > maxVal - (max - min) * 0.01) {
                minVal = maxVal - (max - min) * 0.01;
                minSlider.value = minVal;
            }

            // Update range display
            const minPercent = ((minVal - min) / (max - min)) * 100;
            const maxPercent = ((maxVal - min) / (max - min)) * 100;
            range.style.left = `${minPercent}%`;
            range.style.width = `${maxPercent - minPercent}%`;

            // Call change handler
            if (onChange) {
                onChange(minVal, maxVal);
            }
        };

        minSlider.addEventListener('input', updateSlider);
        maxSlider.addEventListener('input', updateSlider);

        // Initial update
        updateSlider();

        return container;
    }

    /**
     * Create image button element
     */
    function createImageButton(id, src, text, type) {
        const button = document.createElement('button');
        
        if (id) {
            button.id = `ifc_btn_${id}`;
        }

        addClasses(button, CONFIG.classes.button);
        button.title = text;
        button.setAttribute('aria-label', text);
        button.setAttribute('aria-pressed', 'false');

        const imgContainer = createImageContainer(id, src, text, type);
        button.appendChild(imgContainer);
        
        return button;
    }

    /**
     * Create image container (SVG or IMG)
     */
    function createImageContainer(id, src, text, type) {
        const container = document.createElement('div');
        
        if (id) {
            container.id = `ifc_img_${id}`;
        }
        
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

    /**
     * Load SVG content into container
     */
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
            console.error(`Failed to load SVG into container:`, ex);
        }
    }

    /**
     * Update SVG icon (for expand/collapse toggle)
     */
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

    /**
     * Float the buttons container
     */
    function floatButtons() {
        if (state.ui.floatButtons) return;

        try {
            const buttonContainer = getElement(`.${CONFIG.selectors.buttons}`, false);
            if (!buttonContainer) return;

            buttonContainer.id = CONFIG.ids.buttonContainer;
            applyStyles(buttonContainer, CONFIG.ui.buttonContainer);
            state.ui.floatButtons = true;
        } catch (ex) {
            console.error('Failed to float buttons:', ex);
        }
    }

    /**
     * Add filter label
     */
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

    /**
     * Add filter button
     */
    function addFilterButton() {
        if (state.ui.btnFilter) return;

        try {
            const buttonContainer = getElement(`#${CONFIG.ids.buttonContainer}`);
            if (!buttonContainer) return;

            const button = createImageButton(
                'Filter',
                GM_getResourceURL('IMGFilter'),
                'Filter',
                'svg'
            );
            
            buttonContainer.appendChild(button);
            state.ui.btnFilter = true;
        } catch (ex) {
            console.error('Failed to add filter button:', ex);
        }
    }

    /**
     * Create main filter container
     */
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

            // Tag container
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

    /**
     * Create filter block structure (for sliders)
     */
    function createFilterBlock(id = null, text = '', collapsible = true) {
        const groupContainer = document.createElement('li');
        if (id) groupContainer.id = `ifc_group_${id}`;
        groupContainer.classList.add('filter-block', 'SortAndFilters-module__li___aV+Oo');

        if (!collapsible) {
            // Non-collapsible: just add content directly
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

        // Collapsible version (existing code)
        const menuContainer = document.createElement('div');
        if (id) menuContainer.id = `ifc_group_menu_${id}`;
        menuContainer.classList.add('SelectionDropdown-module__container___XzkIx');

        const menuButton = document.createElement('button');
        menuButton.classList.add('filter-block-button', 'SelectionDropdown-module__titleContainer___YyoD0');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('data-ifc-target', `group_${id}`);

        const heading = document.createElement('span');
        heading.classList.add(
            'filter-text-heading-group',
            'typography-module__xdsSubTitle2___6d6Da',
            'SelectionDropdown-module__titleText___PN6s9'
        );
        heading.setAttribute('data-ifc-target', `group_${id}`);
        heading.textContent = text;

        const imgContainer = createImageContainer(
            `group_${id}`,
            GM_getResourceURL('IMGExpand'),
            'Expand',
            'svg'
        );
        imgContainer.setAttribute('data-ifc-target', `group_${id}`);

        menuButton.appendChild(heading);
        menuButton.appendChild(imgContainer);

        const listContainer = document.createElement('div');
        if (id) listContainer.id = `ifc_group_menu_list_${id}`;
        listContainer.classList.add('filter-block-content');
        applyStyles(listContainer, {
            maxHeight: '20rem',
            overflowY: 'auto',
            display: 'none'
        });

        const itemsContainer = document.createElement('div');
        if (id) itemsContainer.id = `ifc_group_menu_list_items_${id}`;
        itemsContainer.classList.add('filter-options', 'Selections-module__options___I24e7');

        listContainer.appendChild(itemsContainer);
        menuContainer.appendChild(menuButton);
        menuContainer.appendChild(listContainer);
        groupContainer.appendChild(menuContainer);

        menuContainer.addEventListener('click', toggleFilterMenuListContainer);

        return groupContainer;
    }

    /**
     * Add owned filter group with Select2
     */
    async function addFilterContainerOwned() {
        if (!state.ui.divFilter) return;

        const groupName = 'Owned';
        
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) return;

            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            // Ensure state is initialized
            if (!state.filters.owned.selected) {
                state.filters.owned.selected = [];
            }
            if (!Array.isArray(state.filters.owned.options)) {
                state.filters.owned.options = ['Owned', 'Not Owned', 'Un-Purchasable'];
            }

            const filterBlock = createFilterBlock(groupName, 'Owned', false);
            const contentContainer = filterBlock.querySelector('.ifc-filter-block-static');
            
            if (contentContainer) {
                const options = state.filters.owned.options.map(opt => ({ value: opt, label: opt }));
                const select = createSelect2Multi(CONFIG.ids.ownedSelect, options, state.filters.owned.selected);
                contentContainer.appendChild(select);
            }

            filterGroups.appendChild(filterBlock);

            // Initialize Select2 after DOM insertion
            if (state.ui.select2Ready) {
                initSelect2(CONFIG.ids.ownedSelect);
                
                // Attach change handler
                $(`#${CONFIG.ids.ownedSelect}`).on('change', function() {
                    state.filters.owned.selected = $(this).val() || [];
                    updateScreen();
                });
            }
        } catch (ex) {
            console.error('Failed to add owned filter:', ex);
        }
    }

    /**
     * Collect unique publishers
     */
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
        
        // Sort alphabetically
        const sortedPublishers = new Map(
            Array.from(publishers.entries()).sort((a, b) => a[0].localeCompare(b[0]))
        );
        
        state.filters.publishers.list = sortedPublishers;
        return sortedPublishers;
    }

    /**
     * Add publishers filter group with Select2
     */
    async function addFilterContainerPublishers() {
        if (!state.ui.divFilter) return;

        const groupName = 'Publishers';
        
        try {
            const existing = getElement(`#ifc_group_${groupName}`, false);
            if (existing) {
                // Update existing
                updatePublishersSelect();
                return;
            }

            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            const filterBlock = createFilterBlock(groupName, 'Publishers', false);
            const contentContainer = filterBlock.querySelector('.ifc-filter-block-static');
            
            if (contentContainer) {
                const select = createSelect2Multi(CONFIG.ids.publishersSelect, [], state.filters.publishers.selected);
                contentContainer.appendChild(select);
            }

            filterGroups.appendChild(filterBlock);

            // Populate and initialize
            updatePublishersSelect();
        } catch (ex) {
            console.error('Failed to add publishers filter:', ex);
        }
    }

    /**
     * Update publishers Select2
     */
    function updatePublishersSelect() {
        if (!state.ui.select2Ready) return;

        // Ensure state is initialized
        if (!Array.isArray(state.filters.publishers.selected)) {
            state.filters.publishers.selected = [];
        }

        const publishers = collectPublishers();
        const $select = $(`#${CONFIG.ids.publishersSelect}`);
        
        if (!$select.length) return;

        // Destroy existing Select2 if any
        if ($select.data('select2')) {
            $select.select2('destroy');
        }

        // Clear and repopulate
        $select.empty();
        
        publishers.forEach((count, name) => {
            const option = new Option(`${name} (${count})`, name, false, state.filters.publishers.selected.includes(name));
            $select.append(option);
        });

        // Reinitialize
        initSelect2(CONFIG.ids.publishersSelect);
        
        // Attach change handler
        $select.off('change').on('change', function() {
            state.filters.publishers.selected = $(this).val() || [];
            updateScreen();
        });
    }

    /**
     * Calculate price range from items
     */
    function calculatePriceRange() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        let min = Infinity;
        let max = 0;

        Array.from(containers).forEach(container => {
            const price = parseFloat(container.dataset.ifcPrice);
            if (!isNaN(price) && price > 0) {
                min = Math.min(min, price);
                max = Math.max(max, price);
            }
        });

        if (min === Infinity) min = 0;
        
        // Round to nice numbers
        min = Math.floor(min / 10) * 10;
        max = Math.ceil(max / 10) * 10;

        return { min, max };
    }

    /**
     * Calculate discount range from items
     */
    function calculateDiscountRange() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        let min = 100;
        let max = 0;

        Array.from(containers).forEach(container => {
            const discount = parseInt(container.dataset.ifcPriceDiscountPercent);
            if (!isNaN(discount) && discount > 0) {
                min = Math.min(min, discount);
                max = Math.max(max, discount);
            }
        });

        if (min === 100) min = 0;
        
        // Round to nice numbers
        min = Math.floor(min / 5) * 5;
        max = Math.ceil(max / 5) * 5;

        return { min, max };
    }

    /**
     * Add price range slider
     */
    function addPriceRangeFilter() {
        if (!state.ui.divFilter) return;

        const groupName = 'PriceRange';
        
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) {
                // Update existing
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
                    CONFIG.ids.priceSlider,
                    min,
                    max,
                    min,
                    max,
                    (minVal, maxVal) => {
                        state.filters.priceRange.currentMin = minVal;
                        state.filters.priceRange.currentMax = maxVal;
                        state.filters.priceRange.enabled = true;
                        
                        // Update label
                        const label = getElement(`#${CONFIG.ids.priceSlider}_label`);
                        if (label) {
                            label.textContent = `${formatCurrency(minVal)} - ${formatCurrency(maxVal)}`;
                        }
                        
                        updateScreen();
                    }
                );
                contentContainer.appendChild(slider);
                
                // Set initial label
                const label = slider.querySelector('.ifc-slider-label');
                if (label) {
                    label.textContent = `${formatCurrency(min)} - ${formatCurrency(max)}`;
                }
            }

            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('Failed to add price range filter:', ex);
        }
    }

    /**
     * Update price slider
     */
    function updatePriceSlider() {
        const { min, max } = calculatePriceRange();
        
        // Update state if changed
        if (state.filters.priceRange.min !== min || state.filters.priceRange.max !== max) {
            state.filters.priceRange = {
                ...state.filters.priceRange,
                min,
                max,
                currentMin: Math.max(state.filters.priceRange.currentMin, min),
                currentMax: Math.min(state.filters.priceRange.currentMax, max)
            };
            
            // Update slider elements
            const minSlider = getElement(`#${CONFIG.ids.priceSlider}_min`);
            const maxSlider = getElement(`#${CONFIG.ids.priceSlider}_max`);
            
            if (minSlider && maxSlider) {
                minSlider.min = min;
                minSlider.max = max;
                maxSlider.min = min;
                maxSlider.max = max;
                
                minSlider.value = state.filters.priceRange.currentMin;
                maxSlider.value = state.filters.priceRange.currentMax;
                
                // Trigger update
                minSlider.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Reset price slider
     */
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

    /**
     * Add discount range slider
     */
    function addDiscountRangeFilter() {
        if (!state.ui.divFilter) return;

        const groupName = 'DiscountRange';
        
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) {
                // Update existing
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
                    CONFIG.ids.discountSlider,
                    min,
                    max,
                    min,
                    max,
                    (minVal, maxVal) => {
                        state.filters.discountRange.currentMin = minVal;
                        state.filters.discountRange.currentMax = maxVal;
                        state.filters.discountRange.enabled = true;
                        
                        // Update label
                        const label = getElement(`#${CONFIG.ids.discountSlider}_label`);
                        if (label) {
                            label.textContent = `${formatPercentage(minVal)} - ${formatPercentage(maxVal)}`;
                        }
                        
                        updateScreen();
                    }
                );
                contentContainer.appendChild(slider);
                
                // Set initial label
                const label = slider.querySelector('.ifc-slider-label');
                if (label) {
                    label.textContent = `${formatPercentage(min)} - ${formatPercentage(max)}`;
                }
            }

            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('Failed to add discount range filter:', ex);
        }
    }

    /**
     * Update discount slider
     */
    function updateDiscountSlider() {
        const { min, max } = calculateDiscountRange();
        
        if (state.filters.discountRange.min !== min || state.filters.discountRange.max !== max) {
            state.filters.discountRange = {
                ...state.filters.discountRange,
                min,
                max,
                currentMin: Math.max(state.filters.discountRange.currentMin, min),
                currentMax: Math.min(state.filters.discountRange.currentMax, max)
            };
            
            const minSlider = getElement(`#${CONFIG.ids.discountSlider}_min`);
            const maxSlider = getElement(`#${CONFIG.ids.discountSlider}_max`);
            
            if (minSlider && maxSlider) {
                minSlider.min = min;
                minSlider.max = max;
                maxSlider.min = min;
                maxSlider.max = max;
                
                minSlider.value = state.filters.discountRange.currentMin;
                maxSlider.value = state.filters.discountRange.currentMax;
                
                minSlider.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Reset discount slider
     */
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

    /**
     * Add all filter controls
     */
    async function addFilterControls() {
        try {
            addFilterLabel();
            addFilterButton();
            addFilterContainer();
            
            // Wait for Select2 to be ready
            await waitForSelect2();
            
            // Add all filter groups
            await addFilterContainerOwned();
            await addFilterContainerPublishers();
            addPriceRangeFilter();
            addDiscountRangeFilter();
        } catch (ex) {
            console.error('Failed to add filter controls:', ex);
        }
    }

    // ==================== FILTER TOGGLE HANDLERS ====================

    /**
     * Toggle filter container visibility
     */
    function toggleFilterContainer() {
        try {
            state.ui.divFilterShow = !state.ui.divFilterShow;
            
            const filterContainer = getElement(`#${CONFIG.ids.filterContainer}`);
            const filterButton = getElement(`#${CONFIG.ids.filterButton}`);
            
            if (!filterContainer || !filterButton) return;

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

    /**
     * Toggle filter menu list
     */
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

    /**
     * Inject discount percentage badge into item card
     */
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
            badge.className = 'ifc-discount-badge Price-module__discountTag___OjGFy typography-module__xdsBody2___RNdGY';
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

    /**
     * Extract container data from wishlist item
     */
    function setContainerData(container, id) {
        setDataAttribute(container, 'ifcId', id);

        const img = safeQuerySelector(container, CONFIG.selectors.imageContainer);
        setDataAttribute(container, 'ifcImage', img?.src);

        const link = safeQuerySelector(container, CONFIG.selectors.productLink);
        setDataAttribute(container, 'ifcName', link?.innerText);
        setDataAttribute(container, 'ifcUri', link?.href);

        const publisher = safeQuerySelector(container, CONFIG.selectors.productPublisher);
        setDataAttribute(container, 'ifcPublisher', publisher?.innerText);

        const prices = container.querySelectorAll(CONFIG.selectors.productPrices);
        
        const priceBase = prices[0] ? parseFloat(prices[0].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
        const priceDiscount = prices[1] ? parseFloat(prices[1].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
        
        const priceBaseRounded = priceBase ? Math.round(priceBase * 100) / 100 : null;
        const priceDiscountRounded = priceDiscount ? Math.round(priceDiscount * 100) / 100 : null;
        
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

        setDataAttribute(container, 'ifcSubscription', prices[2]?.innerText);

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

    /**
     * Validate if container should be shown based on filters (INVERTED LOGIC)
     */
    function shouldShowContainer(container) {
        const isOwned = container.dataset.ifcOwned === 'true';
        const isUnPurchasable = container.dataset.ifcUnpurchasable === 'true';
        const publisher = container.dataset.ifcPublisher;
        const price = parseFloat(container.dataset.ifcPrice);
        const discount = parseInt(container.dataset.ifcPriceDiscountPercent);

        // INVERTED LOGIC: Owned filter (empty = show all, selections = filter TO those)
        if (state.filters.owned.selected.length > 0) {
            let matchesOwned = false;
            
            if (state.filters.owned.selected.includes('Owned') && isOwned) matchesOwned = true;
            if (state.filters.owned.selected.includes('Not Owned') && !isOwned && !isUnPurchasable) matchesOwned = true;
            if (state.filters.owned.selected.includes('Un-Purchasable') && isUnPurchasable) matchesOwned = true;
            
            if (!matchesOwned) return false;
        }

        // INVERTED LOGIC: Publisher filter (empty = show all, selections = filter TO those)
        if (state.filters.publishers.selected.length > 0) {
            if (publisher && publisher !== 'null' && publisher.trim() !== '') {
                const publisherName = publisher.trim();
                if (!state.filters.publishers.selected.includes(publisherName)) {
                    return false;
                }
            } else {
                // No publisher data, hide if filter is active
                return false;
            }
        }

        // Price range filter
        if (state.filters.priceRange.enabled && !isNaN(price) && price > 0) {
            if (price < state.filters.priceRange.currentMin || price > state.filters.priceRange.currentMax) {
                return false;
            }
        }

        // Discount range filter
        if (state.filters.discountRange.enabled && !isNaN(discount) && discount > 0) {
            if (discount < state.filters.discountRange.currentMin || discount > state.filters.discountRange.currentMax) {
                return false;
            }
        }

        return true;
    }

    /**
     * Toggle visibility of wishlist containers
     */
    function toggleContainers() {
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        
        // First pass: collect data
        Array.from(containers).forEach((container, index) => {
            setContainerData(container, containers.length - index);
        });

        // Update dynamic filters
        collectPublishers();
        updatePublishersSelect();
        updatePriceSlider();
        updateDiscountSlider();

        // Second pass: apply filters
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

    /**
     * Update filter counts
     */
    function updateFilterCounts() {
        const selector = `.${CONFIG.selectors.items}`;
        state.filters.totalCount = document.querySelectorAll(selector).length;
        state.filters.filteredCount = document.querySelectorAll(`${selector}.ifc-Show`).length;
    }

    /**
     * Update filter labels with current counts
     */
    function updateFilterLabels() {
        updateFilterCounts();
        
        const label = getElement(`#${CONFIG.ids.filterLabel}`);
        if (label) {
            label.textContent = `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`;
        }
    }

    /**
     * Update entire screen
     */
    function updateScreen() {
        try {
            toggleContainers();
            updateFilterLabels();
            updateActiveTags();
            saveFilterState();
        } catch (ex) {
            console.error('Failed to update screen:', ex);
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Remove unwanted UI elements
     */
    function removeUnwantedControls() {
        try {
            document.querySelectorAll('.hr.border-neutral-200').forEach(el => el.remove());
        } catch (ex) {
            console.error('Failed to remove unwanted controls:', ex);
        }
    }

    // ==================== INITIALIZATION ====================

    /**
     * Handle DOM changes and initialize UI
     */
    async function onDOMReady() {
        if (!getElement(`.${CONFIG.selectors.items}`, false)) return;

        try {
            floatButtons();
            await addFilterControls();
            removeUnwantedControls();
            state.ui.complete = true;
            updateScreen();
        } catch (ex) {
            console.error('Failed to initialize UI:', ex);
        }

        observer.disconnect();
    }

    /**
     * Initialize the script
     */
    async function initialize() {
        try {
            // Load resources
            await addScript(GM_getResourceURL('JSJQuery'));
            await addScript(GM_getResourceURL('JSSelect2'));
            await addStyle(GM_getResourceURL('CSSSelect2'));
            await addStyle(GM_getResourceURL('CSSFilter'));

            // Load saved filter state
            loadFilterState();

            // Start observing DOM
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
