// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.1.25326.5
// @description  A Tampermonkey userscript to add additional functionality to the XBOX Wishlist
// @author       ZellReid
// @homepage     https://github.com/zellreid/xbox-wishlist
// @supportURL   https://github.com/zellreid/xbox-wishlist/issues
// @license      MIT
// @match        https://www.xbox.com/*/wishlist
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xbox.com
// @run-at       document-body
// @resource     JSJQuery https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js?ver=@version
// @resource     JSBootstrap https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.min.js?ver=@version
// @resource     JSSelect2 https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js?ver=@version
// @resource     CSSSelect2 https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css?ver=@version
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/xbox-wishlist.user.css?ver=@version
// @resource     IMGFilter https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/filter.svg?ver=@version
// @resource     IMGSort https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/sort.svg?ver=@version
// @resource     IMGExpand https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/expand.svg?ver=@version
// @resource     IMGCollapse https://raw.githubusercontent.com/zellreid/xbox-wishlist/main/collapse.svg?ver=@version
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
            filterButton: 'ifc_btn_Filter'
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
            complete: false
        },
        filters: {
            totalCount: 0,
            filteredCount: 0,
            owned: {
                isOwned: true,
                ownedCount: 0,
                notOwned: true,
                notOwnedCount: 0,
                isUnPurchasable: true,
                unPurchasableCount: 0
            },
            publishers: {
                list: new Map(), // Map<publisherName, {enabled: boolean, count: number}>
                allEnabled: true
            },
            subscriptions: {
                gamePass: true,
                gamePassCount: 0,
                eaPlus: true,
                eaPlusCount: 0,
                ubisoftPlus: true,
                ubisoftPlusCount: 0,
                nonSubscription: true,
                nonSubscriptionCount: 0
            },
            discounts: {
                discounted: true,
                discountedCount: 0,
                notDiscounted: true,
                notDiscountedCount: 0,
                discountScale: 0
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
            GM_setValue(CONFIG.storage.key, JSON.stringify(state.filters));
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
                // Validate structure before applying
                if (parsed && typeof parsed === 'object') {
                    state.filters = { ...state.filters, ...parsed };
                }
            }
        } catch (ex) {
            console.error('Failed to load filter state:', ex);
        }
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
        label.textContent = text; // Use textContent instead of innerHTML for safety
        
        if (id) {
            label.id = `ifc_lbl_${id}`;
        }
        
        return label;
    }

    /**
     * Create checkbox element
     */
    function createCheckbox(id, text, initial, onChange) {
        const label = document.createElement('label');
        applyStyles(label, {
            marginLeft: '5px',
            marginRight: '5px'
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = initial;
        applyStyles(checkbox, { marginRight: '3px' });
        
        if (onChange) {
            checkbox.addEventListener('change', onChange);
        }

        if (id) {
            label.id = `ifc_lbl_${id}`;
            checkbox.id = `ifc_cbx_${id}`;
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(text));

        return label;
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
            // Check if already exists
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

            const filterGroups = document.createElement('ul');
            filterGroups.classList.add('filter-groups', 'SortAndFilters-module__filterList___T81LH');

            filterList.appendChild(heading);
            filterList.appendChild(filterGroups);
            filterContainer.appendChild(filterList);
            document.body.appendChild(filterContainer);

            // Add event listener to filter button
            const filterButton = getElement(`#${CONFIG.ids.filterButton}`);
            if (filterButton) {
                filterButton.addEventListener('click', toggleFilterContainer);
            }

            state.ui.divFilter = true;
        } catch (ex) {
            console.error('Failed to add filter container:', ex);
        }
    }

    /**
     * Create filter block structure
     */
    function createFilterBlock(id = null, text = '') {
        const groupContainer = document.createElement('li');
        if (id) groupContainer.id = `ifc_group_${id}`;
        groupContainer.classList.add('filter-block', 'SortAndFilters-module__li___aV+Oo');

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

        const itemsContainer = document.createElement('ul');
        if (id) itemsContainer.id = `ifc_group_menu_list_items_${id}`;
        itemsContainer.classList.add('filter-options', 'Selections-module__options___I24e7');
        itemsContainer.setAttribute('role', 'listbox');

        listContainer.appendChild(itemsContainer);
        menuContainer.appendChild(menuButton);
        menuContainer.appendChild(listContainer);
        groupContainer.appendChild(menuContainer);

        menuContainer.addEventListener('click', toggleFilterMenuListContainer);

        return groupContainer;
    }

    /**
     * Add filter option to container
     */
    function addFilterOption(container, control) {
        if (!container || !control) return;

        const optionsContainer = safeQuerySelector(container, '.filter-options');
        if (!optionsContainer) return;

        const li = document.createElement('li');
        li.appendChild(control);
        optionsContainer.appendChild(li);
    }

    /**
     * Collect unique publishers from all wishlist items
     */
    function collectPublishers() {
        const publishers = new Map();
        const containers = document.getElementsByClassName(CONFIG.selectors.items);
        
        Array.from(containers).forEach(container => {
            const publisher = container.dataset.ifcPublisher;
            
            // Only add valid, non-null publishers (case-sensitive)
            if (publisher && publisher !== 'null' && publisher.trim() !== '') {
                const publisherName = publisher.trim();
                
                if (!publishers.has(publisherName)) {
                    publishers.set(publisherName, {
                        enabled: state.filters.publishers.list.get(publisherName)?.enabled ?? true,
                        count: 0
                    });
                }
                
                const publisherData = publishers.get(publisherName);
                publisherData.count++;
            }
        });
        
        // Sort publishers alphabetically (case-sensitive)
        const sortedPublishers = new Map(
            Array.from(publishers.entries()).sort((a, b) => a[0].localeCompare(b[0]))
        );
        
        state.filters.publishers.list = sortedPublishers;
        return sortedPublishers;
    }

    /**
     * Add publisher filter group
     */
    function addFilterContainerPublishers() {
        if (!state.ui.divFilter) return;

        const groupName = 'Publishers';
        
        try {
            // Check if already exists
            if (getElement(`#ifc_group_${groupName}`, false)) {
                // Update existing checkboxes
                updatePublisherCheckboxes();
                return;
            }

            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            const filterBlock = createFilterBlock(groupName, 'Publishers');
            filterGroups.appendChild(filterBlock);

            // Populate with publisher checkboxes
            updatePublisherCheckboxes();
        } catch (ex) {
            console.error('Failed to add publishers filter:', ex);
        }
    }

    /**
     * Update publisher checkboxes dynamically
     */
    function updatePublisherCheckboxes() {
        const listContainer = getElement(`#ifc_group_menu_list_Publishers`);
        if (!listContainer) return;

        const optionsContainer = listContainer.querySelector('.filter-options');
        if (!optionsContainer) return;

        // Clear existing checkboxes
        optionsContainer.innerHTML = '';

        // Collect current publishers
        const publishers = collectPublishers();

        // Add checkbox for each unique publisher
        publishers.forEach((data, publisherName) => {
            const checkboxId = `Publisher_${publisherName.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const checkbox = createCheckbox(
                checkboxId,
                `${publisherName} (${data.count})`,
                data.enabled,
                (event) => togglePublisher(publisherName, event.target.checked)
            );
            addFilterOption(listContainer, checkbox);
        });

        // If no publishers found, show message
        if (publishers.size === 0) {
            const li = document.createElement('li');
            li.style.padding = '8px';
            li.style.fontSize = '0.75rem';
            li.style.color = '#999';
            li.textContent = 'No publishers found';
            optionsContainer.appendChild(li);
        }
    }

    /**
     * Toggle publisher filter
     */
    function togglePublisher(publisherName, enabled) {
        try {
            const publisherData = state.filters.publishers.list.get(publisherName);
            if (publisherData) {
                publisherData.enabled = enabled;
            }
            updateScreen();
        } catch (ex) {
            console.error(`Failed to toggle publisher ${publisherName}:`, ex);
        }
    }

    /**
     * Add owned filter group
     */
    function addFilterContainerOwned() {
        if (!state.ui.divFilter) return;

        const groupName = 'Owned';
        
        try {
            if (getElement(`#ifc_group_${groupName}`, false)) return;

            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            const filterBlock = createFilterBlock(groupName, 'Owned');
            filterGroups.appendChild(filterBlock);

            const listContainer = getElement(`#ifc_group_menu_list_${groupName}`);
            if (!listContainer) return;

            // Add checkboxes
            addFilterOption(
                listContainer,
                createCheckbox(groupName, 'Owned', state.filters.owned.isOwned, toggleOwned)
            );
            addFilterOption(
                listContainer,
                createCheckbox('NotOwned', 'Not Owned', state.filters.owned.notOwned, toggleNotOwned)
            );
            addFilterOption(
                listContainer,
                createCheckbox('UnPurchasable', 'Un-Purchasable', state.filters.owned.isUnPurchasable, toggleUnPurchasable)
            );
        } catch (ex) {
            console.error('Failed to add owned filter:', ex);
        }
    }

    /**
     * Add all filter controls
     */
    function addFilterControls() {
        try {
            addFilterLabel();
            addFilterButton();
            addFilterContainer();
            addFilterContainerOwned();
            addFilterContainerPublishers();
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
            } else {
                const img = imgContainer.querySelector('img');
                if (img) {
                    if (isExpanded) {
                        img.src = GM_getResourceURL('IMGExpand');
                        img.alt = img.title = 'Expand';
                    } else {
                        img.src = GM_getResourceURL('IMGCollapse');
                        img.alt = img.title = 'Collapse';
                    }
                }
            }

            menuButton.setAttribute('aria-expanded', (!isExpanded).toString());
            listContainer.style.display = isExpanded ? 'none' : null;
        } catch (ex) {
            console.error('Failed to toggle filter menu:', ex);
        }
    }

    /**
     * Generic filter toggle handler
     */
    function createToggleHandler(filterPath) {
        return (event) => {
            try {
                const keys = filterPath.split('.');
                let obj = state.filters;
                
                for (let i = 0; i < keys.length - 1; i++) {
                    obj = obj[keys[i]];
                }
                
                obj[keys[keys.length - 1]] = event.target.checked;
                updateScreen();
            } catch (ex) {
                console.error(`Failed to toggle filter ${filterPath}:`, ex);
            }
        };
    }

    const toggleOwned = createToggleHandler('owned.isOwned');
    const toggleNotOwned = createToggleHandler('owned.notOwned');
    const toggleUnPurchasable = createToggleHandler('owned.isUnPurchasable');

    // ==================== ITEM FILTERING ====================

    /**
     * Inject discount percentage badge into item card
     */
    function injectDiscountBadge(container, discountPercent) {
        try {
            // Check if badge already exists
            const existingBadge = container.querySelector('.ifc-discount-badge');
            if (existingBadge) {
                // Update existing badge
                existingBadge.textContent = `-${discountPercent}%`;
                return;
            }

            // Find the product details section (where price info is)
            const productDetails = safeQuerySelector(container, CONFIG.selectors.productDetails);
            if (!productDetails) return;

            // Create discount badge
            const badge = document.createElement('span');
            badge.className = 'ifc-discount-badge Price-module__discountTag___OjGFy typography-module__xdsBody2___RNdGY';
            badge.textContent = `-${discountPercent}%`;
            badge.setAttribute('aria-label', `${discountPercent}% discount`);
            badge.style.marginLeft = '8px';
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';

            // Find the price container and inject badge next to it
            const priceContainer = productDetails.querySelector('div');
            if (priceContainer) {
                // Insert badge after the price display
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

        // Image
        const img = safeQuerySelector(container, CONFIG.selectors.imageContainer);
        setDataAttribute(container, 'ifcImage', img?.src);

        // Product details
        const link = safeQuerySelector(container, CONFIG.selectors.productLink);
        setDataAttribute(container, 'ifcName', link?.innerText);
        setDataAttribute(container, 'ifcUri', link?.href);

        const publisher = safeQuerySelector(container, CONFIG.selectors.productPublisher);
        setDataAttribute(container, 'ifcPublisher', publisher?.innerText);

        // Prices
        const prices = container.querySelectorAll(CONFIG.selectors.productPrices);
        
        const priceBase = prices[0] ? parseFloat(prices[0].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
        const priceDiscount = prices[1] ? parseFloat(prices[1].innerText.replace(/[^0-9.,-]/g, '').replace(',', '.')) : null;
        
        // Round prices to 2 decimal places
        const priceBaseRounded = priceBase ? Math.round(priceBase * 100) / 100 : null;
        const priceDiscountRounded = priceDiscount ? Math.round(priceDiscount * 100) / 100 : null;
        
        setDataAttribute(container, 'ifcPriceBase', priceBaseRounded);
        setDataAttribute(container, 'ifcPriceDiscount', priceDiscountRounded);
        setDataAttribute(container, 'ifcPrice', priceDiscountRounded ?? priceBaseRounded);

        // Discount calculations
        if (priceDiscountRounded && priceDiscountRounded > 0 && priceBaseRounded) {
            const discountAmount = priceBaseRounded - priceDiscountRounded;
            const discountPercent = (discountAmount / priceBaseRounded) * 100;
            
            // Round discount amount to 2 decimals, percentage to integer
            const discountAmountRounded = Math.round(discountAmount * 100) / 100;
            const discountPercentRounded = Math.round(discountPercent);
            
            setDataAttribute(container, 'ifcPriceDiscountAmount', discountAmountRounded);
            setDataAttribute(container, 'ifcPriceDiscountPercent', discountPercentRounded);
            
            // Inject discount badge if it has a value
            if (discountPercentRounded > 0) {
                injectDiscountBadge(container, discountPercentRounded);
            }
        } else {
            setDataAttribute(container, 'ifcPriceDiscountAmount', 0);
            setDataAttribute(container, 'ifcPriceDiscountPercent', 0);
        }

        // Subscription
        setDataAttribute(container, 'ifcSubscription', prices[2]?.innerText);

        // Ownership status
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

        // Purchasability status
        const isUnPurchasable = !isOwned && container.dataset.ifcPrice === 'null';
        
        if (isUnPurchasable) {
            container.classList.add('ifc-UnPurchasable');
            setDataAttribute(container, 'ifcUnpurchasable', true);
        } else {
            setDataAttribute(container, 'ifcUnpurchasable', false);
        }
    }

    /**
     * Validate if container should be shown based on filters
     */
    function shouldShowContainer(container) {
        const isOwned = container.dataset.ifcOwned === 'true';
        const isUnPurchasable = container.dataset.ifcUnpurchasable === 'true';
        const publisher = container.dataset.ifcPublisher;

        // Check owned filters
        if (!state.filters.owned.isOwned && isOwned) return false;
        if (!state.filters.owned.notOwned && !isOwned && !isUnPurchasable) return false;
        if (!state.filters.owned.isUnPurchasable && isUnPurchasable) return false;

        // Check publisher filter (case-sensitive)
        if (publisher && publisher !== 'null' && publisher.trim() !== '') {
            const publisherName = publisher.trim();
            const publisherData = state.filters.publishers.list.get(publisherName);
            
            // If publisher exists in filter list and is disabled, hide item
            if (publisherData && !publisherData.enabled) {
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
        
        // First pass: collect data from all containers
        Array.from(containers).forEach((container, index) => {
            setContainerData(container, containers.length - index);
        });

        // Update publisher filter list based on current items
        collectPublishers();
        updatePublisherCheckboxes();

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
     * Update entire screen (filter + labels + save)
     */
    function updateScreen() {
        try {
            toggleContainers();
            updateFilterLabels();
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
    function onDOMReady() {
        if (!getElement(`.${CONFIG.selectors.items}`, false)) return;

        try {
            floatButtons();
            addFilterControls();
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
