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
                floatButtons: false, lblFilter: false, btnFilter: false, btnSort: false, btnExport: false, btnRefresh: false,
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
                // Parse this page's embedded product data once (local, ~20 ms) so the first
                // updateScreen() can attach rating/genre/release/deal data to every item
                await loadProductData();
                // Capabilities fetched on earlier visits via "Load details" (F-36)
                await loadCapabilityCache();
                startRequestWatch();   // T-17 spike - temporary
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
                    publishers: { selected: state.filters.publishers.selected, list: Array.from(state.filters.publishers.list.entries()) },
                    subscriptions: { selected: state.filters.subscriptions.selected, list: Array.from(state.filters.subscriptions.list.entries()) },
                    genres: { selected: state.filters.genres.selected },   // list is rebuilt from the items
                    platforms: { selected: state.filters.platforms.selected },
                    capabilities: { selected: state.filters.capabilities.selected },
                    types: { selected: state.filters.types.selected },
                    sort: { criteria: state.sort.criteria },
                    presets: state.savedPresets
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
                            if (typeof parsed.preorder === 'boolean') state.filters.preorder = parsed.preorder;
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
            state.filters.owned.selected.forEach(item => tags.push({ type: 'owned', value: item, label: item }));
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
            injectDealEndBadge(container, dealEnds);
            injectItemTags(container, {
                productId: (container.dataset.ifcProductId || '').toUpperCase(), url: container.dataset.ifcUri,
                title: container.dataset.ifcName,
                kindLabel: type === 'DLC' || type === 'Consumable' ? type : null,
                personal: dealType === 'personal', reason: offer.dealReason, preorder: !!(p && p.ifcIsPreorder),
                playAnywhere: capKeys.includes('XPA'), optimizedXS: capKeys.includes('ConsoleGen9Optimized'),
                smartDelivery: capKeys.includes('ConsoleCrossGen')
            });
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
                if (!canRefresh && !info.personal && !info.preorder && !info.playAnywhere && !info.optimizedXS && !info.smartDelivery && !info.kindLabel) { if (row) row.remove(); return; }
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

        // Inspection hooks for DevTools / the mock harness. detailsDelayMs (undefined = 2 s)
        // lets the harness run "Load details" without the real pause between requests.
        state.debug = { loadProductData, getProductData, fetchPageState, loadDetails, detailsDelayMs: undefined };

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
                url: text(c.dataset.ifcUri)
            };
        }

        function toCsv(rows) {
            const cols = ['title', 'publisher', 'price', 'originalPrice', 'discountPercent', 'owned', 'unpurchasable',
                'rating', 'ratingCount', 'genres', 'releaseDate', 'dealEnds', 'inPass', 'dealType', 'dealReason', 'preorder', 'platforms', 'capabilities', 'type', 'url'];
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
                    capabilities: list(f.capabilities),   // before F-36
                    types: list(f.types),                 // before the Type filter
                    priceRange: range(f.priceRange), discountRange: range(f.discountRange)
                }
            };
        }
        function hasPresetableFilters() {
            const f = state.filters;
            return f.owned.selected.length > 0 || f.publishers.selected.length > 0 || f.subscriptions.selected.length > 0
                || f.genres.selected.length > 0 || f.inPass || f.platforms.selected.length > 0 || f.justForYou || f.preorder
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
                && sameSet(f.platforms.selected, pf.platforms) && f.justForYou === pf.justForYou && f.preorder === pf.preorder
                && sameSet(f.capabilities.selected, pf.capabilities) && sameSet(f.types.selected, pf.types)
                && rangeIs(f.priceRange, pf.priceRange) && rangeIs(f.discountRange, pf.discountRange);
        }
        // Replaces the current filter selections with the preset's (search text is left alone)
        function applyPreset(p) {
            try {
                const f = state.filters, pf = p.filters;
                f.owned.selected = [...pf.owned]; f.publishers.selected = [...pf.publishers]; f.subscriptions.selected = [...pf.subscriptions];
                f.genres.selected = [...pf.genres]; f.inPass = pf.inPass;
                f.platforms.selected = [...pf.platforms]; f.justForYou = pf.justForYou; f.preorder = pf.preorder;
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
        const DETAILS_DELAY_MS = 2000, DETAILS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
            const queue = detailsQueue().filter(e => !isCapabilityFresh(e.id));
            Object.assign(d, { running: true, cancel: false, done: 0, total: queue.length, failed: 0, message: '' });
            renderDetailsStatus();
            const delay = typeof state.debug.detailsDelayMs === 'number' ? state.debug.detailsDelayMs : DETAILS_DELAY_MS;
            for (let i = 0; i < queue.length && !d.cancel; i++) {
                if (contextLost()) { handleContextLost(); break; }   // extension reloaded mid-run
                const { id, url } = queue[i];
                try {
                    const summary = productSummariesFrom(await fetchPageState(url)).get(id);
                    const caps = {};
                    if (summary && summary.capabilities && typeof summary.capabilities === 'object') {
                        Object.entries(summary.capabilities).forEach(([k, v]) => { if (typeof v === 'string' && v.trim()) caps[k] = v.trim(); });
                    }
                    // Stored even when empty, so a game with no capabilities isn't re-fetched every time
                    state.capCache[id] = { caps, at: Date.now() };
                } catch (ex) {
                    d.failed++;
                    if (/HTTP 429/.test(ex.message)) { d.message = 'Xbox is limiting requests - stopped; try again later.'; d.done++; break; }
                }
                d.done++;
                if (d.done % 10 === 0) { saveCapabilityCache(); updateScreen(); }
                renderDetailsStatus();
                if (i < queue.length - 1 && !d.cancel) await new Promise(r => setTimeout(r, delay));
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
                const loaded = queue.filter(e => getCachedCapabilities(e.id)).length, stale = queue.filter(e => !isCapabilityFresh(e.id)).length;
                if (d.running) {
                    status.textContent = `Loading details ${d.done} / ${d.total}...`;
                    btn.textContent = 'Cancel'; btn.disabled = false;
                } else {
                    status.textContent = `${d.message ? d.message + ' ' : ''}Details for ${loaded} of ${queue.length} games.`;
                    btn.textContent = stale ? `Load details (${stale})` : 'Details up to date';
                    btn.disabled = stale === 0;
                }
                btn.title = 'Reads each game\'s store page, one about every 2 seconds; results are kept for 7 days.';
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
                    cc.appendChild(createBulkLookupDiagnostic());   // T-17 spike - temporary
                }
                fg.appendChild(fb);
                updateCapabilitiesCheckboxes();
            } catch (ex) { console.error('Failed to add capabilities filter:', ex); }
        }

        // ==================== DIAGNOSTICS: BULK LOOKUP SPIKE (T-17) - TEMPORARY ====================
        // Answers, on the live site: can the store app's own bulk product lookup (many ids per
        // request) replace per-page "Load details"? The service address is never hard-coded -
        // it's discovered from the page's own request log (resource timing), or pasted by the
        // user from DevTools - and the report is redacted: no addresses, product ids, titles or
        // tokens (we never read the user's token; replays send no Authorization header).
        // Remove this section, its UI block and startRequestWatch() once T-17 is decided.
        const t17 = { seen: [] };

        function isBulkCandidate(url) {
            try {
                const u = new URL(url, location.href);
                if (/\/games\/store\//i.test(u.pathname)) return false;
                return /\/products\/?$/i.test(u.pathname) || u.searchParams.has('productIds') || /bulk/i.test(u.pathname);
            } catch (ex) { return false; }
        }
        // Started at init, so requests the store app makes while you browse inside this tab
        // (it switches pages without a full reload) are still on record when you come back.
        function startRequestWatch() {
            try {
                if (performance.setResourceTimingBufferSize) performance.setResourceTimingBufferSize(1000);
                const add = e => { if (isBulkCandidate(e.name) && !t17.seen.includes(e.name)) t17.seen.push(e.name); };
                performance.getEntriesByType('resource').forEach(add);
                new PerformanceObserver(list => list.getEntries().forEach(add)).observe({ type: 'resource', buffered: true });
            } catch (ex) { /* diagnostics only */ }
        }

        // Redacted description of a URL: where it points in general terms, never the address
        function describeRequestUrl(url) {
            const u = new URL(url, location.href);
            return {
                host: u.hostname === location.hostname ? 'this page\'s own host (www.xbox.com)' : 'another Xbox service host (not www.xbox.com)',
                sameOrigin: u.origin === location.origin,
                pathEndsWith: '/' + (u.pathname.split('/').filter(Boolean).pop() || ''),
                queryParameterNames: [...new Set([...u.searchParams.keys()])]
            };
        }

        // Summarises a JSON response: product entries found anywhere in it, and how many carry
        // capabilities - field names and counts only
        function analyseLookupResponse(text) {
            let json;
            try { json = JSON.parse(text); } catch (ex) { return { json: false }; }
            const products = [];
            (function walk(o, depth) {
                if (!o || typeof o !== 'object' || depth > 8) return;
                if (!Array.isArray(o) && typeof o.productId === 'string') { products.push(o); return; }
                Object.values(o).forEach(v => walk(v, depth + 1));
            })(json, 0);
            const withCaps = products.filter(p => p.capabilities && typeof p.capabilities === 'object' && Object.keys(p.capabilities).length);
            return {
                json: true, topLevelKeys: Array.isArray(json) ? ['(array)'] : Object.keys(json).slice(0, 15),
                productsFound: products.length, productsWithCapabilities: withCaps.length,
                productFieldNames: products[0] ? Object.keys(products[0]).sort().slice(0, 40) : [],
                sampleCapabilityNames: withCaps[0] ? Object.values(withCaps[0].capabilities).slice(0, 8) : []
            };
        }

        async function timedFetch(label, input, init) {
            const t0 = performance.now();
            try {
                const r = await fetch(input, init);
                const text = await r.text();
                const res = { attempt: label, allowedByBrowser: true, status: r.status, ok: r.ok, ms: Math.round(performance.now() - t0), bytes: text.length, contentType: r.headers.get('content-type') };
                if (r.ok) Object.assign(res, analyseLookupResponse(text));
                // Error text can help (e.g. a required header) - masked of long ids, truncated
                else res.errorSnippet = text.slice(0, 160).replace(/[A-Z0-9]{10,}/g, '<id>');
                return res;
            } catch (ex) {
                // A TypeError here usually means CORS blocked it (or the network failed)
                return { attempt: label, allowedByBrowser: false, error: `${ex.name}: ${ex.message}`, ms: Math.round(performance.now() - t0) };
            }
        }

        async function runBulkLookupDiagnostic(pastedUrl) {
            const report = { test: 'T-17 bulk product lookup', extensionVersion: adapter.getVersion(), at: new Date().toISOString(),
                bulkRequestsSeenInThisTab: t17.seen.length, steps: [] };
            const url = (pastedUrl || '').trim() || t17.seen[t17.seen.length - 1];
            if (!url) {
                report.steps.push({ step: 'discover', found: false,
                    hint: 'No bulk product request seen in this tab yet. Open any game from this wishlist in THIS tab, then use the browser Back button and run the test again - or paste a request URL copied from DevTools > Network.' });
                return report;
            }
            try { report.steps.push({ step: 'discover', found: true, source: pastedUrl ? 'pasted' : 'seen in this tab', ...describeRequestUrl(url) }); }
            catch (ex) { report.steps.push({ step: 'discover', found: false, error: 'not a valid URL' }); return report; }

            const ids = detailsQueue().slice(0, 20).map(e => e.id);
            const post = (credentials) => ({ method: 'POST', credentials, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: ids }) });
            report.steps.push({ step: 'replay-as-seen (GET, no cookies, no auth)', ...(await timedFetch('GET as seen', url, { credentials: 'omit' })) });
            report.steps.push({ step: `batch of ${ids.length} ids (POST, no cookies, no auth)`, ...(await timedFetch('POST ids, no cookies', url, post('omit'))) });
            report.steps.push({ step: `batch of ${ids.length} ids (POST, cookies, no auth header)`, ...(await timedFetch('POST ids, cookies', url, post('include'))) });

            // Baseline: the current approach for one product
            const first = detailsQueue()[0];
            if (first) {
                const t0 = performance.now();
                try {
                    const summary = productSummariesFrom(await fetchPageState(first.url)).get(first.id);
                    report.steps.push({ step: 'baseline: one store page (current "Load details")', ok: true, ms: Math.round(performance.now() - t0),
                        hasCapabilities: !!(summary && summary.capabilities && Object.keys(summary.capabilities).length) });
                } catch (ex) { report.steps.push({ step: 'baseline: one store page (current "Load details")', ok: false, error: ex.message.replace(/ for https?:\S+/, '') }); }
            }
            const winner = report.steps.find(s => s.productsWithCapabilities > 0);
            report.verdict = winner
                ? `USABLE: "${winner.attempt}" returned capabilities for ${winner.productsWithCapabilities} of ${winner.productsFound} products in ${winner.ms} ms, without an Authorization header.`
                : 'NOT USABLE AS TESTED: no attempt returned capabilities without an Authorization header - keep the store page approach (see steps for why).';
            return report;
        }

        function createBulkLookupDiagnostic() {
            const box = document.createElement('div'); box.className = 'ifc-diag';
            const title = document.createElement('div'); title.className = 'ifc-diag-title';
            title.textContent = 'Test: faster lookup (T-17, temporary)';
            const input = document.createElement('input'); input.type = 'text'; input.className = 'ifc-search-input';
            input.placeholder = 'Optional: paste a request URL from DevTools';
            input.setAttribute('aria-label', 'Optional request URL for the lookup test');
            const run = document.createElement('button'); run.type = 'button'; run.className = 'ifc-quick-filter-btn'; run.textContent = 'Run test';
            const out = document.createElement('textarea'); out.className = 'ifc-diag-output ifc-hidden'; out.readOnly = true;
            out.setAttribute('aria-label', 'Lookup test report');
            const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'ifc-quick-filter-btn ifc-hidden'; copy.textContent = 'Copy report';
            run.addEventListener('click', async () => {
                if (contextLost()) { handleContextLost(); return; }
                run.disabled = true; run.textContent = 'Testing...';
                const report = await runBulkLookupDiagnostic(input.value);
                out.value = JSON.stringify(report, null, 2);
                out.classList.remove('ifc-hidden'); copy.classList.remove('ifc-hidden');
                console.info('[XBOX Wishlist][T-17]', report);
                run.disabled = false; run.textContent = 'Run test again';
            });
            copy.addEventListener('click', () => {
                out.select();
                try { navigator.clipboard.writeText(out.value); copy.textContent = 'Copied'; }
                catch (ex) { document.execCommand && document.execCommand('copy'); copy.textContent = 'Copied'; }
                setTimeout(() => { copy.textContent = 'Copy report'; }, 1500);
            });
            const row = document.createElement('div'); row.className = 'ifc-saved-presets-row';
            row.append(input, run);
            box.append(title, row, out, copy);
            return box;
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
                addFilterLabel(); addFilterButton(); addSortButton(); addExportButton(); addRefreshButton();
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
            collectPublishers(); updatePublishersCheckboxes(); updateSubscriptionsCheckboxes(); updateGenresCheckboxes(); updatePlatformsCheckboxes(); updateTypesCheckboxes(); updateCapabilitiesCheckboxes(); updatePriceSlider(); updateDiscountSlider();
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
            ['floatButtons', 'lblFilter', 'btnFilter', 'btnSort', 'btnExport', 'btnRefresh'].forEach(k => { state.ui[k] = false; });
            state.ui.complete = false;
            state.ui.lowestItemId = null;   // every item is a new element: number them from page order again
            onDOMReady();
        }

        function startRouteWatch() {
            const timer = setInterval(() => {
                try {
                    if (contextLost()) { clearInterval(timer); handleContextLost(); return; }
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
