// ==UserScript==
// @name         XBOX Wishlist
// @namespace    https://github.com/zellreid/xbox-wishlist
// @version      1.0.25325.1
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
// ==/UserScript==

(function() {
    `use strict`;

    const CONFIG = {
        selectors: {
            content: `PageContent`,
            items: `WishlistProductItem-module__itemContainer___weUfG`,
            buttons: `WishlistPage-module__menuContainer___MNCGP`
        },
        storage: {
            key: `ifc_xbox_wishlist`
        }
    };

    window.injected = {
        info: GM_info,
        scripts: [],
        styles: [],
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
                UnPurchasableCount: 0
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

    addScript(GM_getResourceURL (`JSJQuery`));
    //addScript(GM_getResourceURL (`JSBootstrap`));
    //addScript(GM_getResourceURL (`JSSelect2`));

    //addStyle(GM_getResourceURL (`CSSSelect2`));
    addStyle(GM_getResourceURL (`CSSFilter`));

    function addScript(src){
        return new Promise(function (resolve, reject) {
            var loadScript = !isScriptAdded(src);

            if (loadScript) {
                let script = document.createElement(`script`);
                script.type = `text/javascript`;
                script.src = src;

                script.onload = () => resolve({ success: true });
                script.onerror = () => reject(new Error(`Script load error: ${src}`));

                document.head.appendChild(script);
                window.injected.scripts.push(script);
            } else {
                resolve({ success: true });
            }
        });
    }

    function isScriptAdded(src) {
        var added = false;

        window.injected.scripts.forEach(
            function (script) {
                if (script.src === src) {
                    added = true;
                }
            });

        return added;
    };

    function addStyle(href){
        return new Promise(function (resolve, reject) {
            var loadStyle = !isStyleAdded(href);

            if (loadStyle) {
                let style = document.createElement(`link`);
                style.rel = `stylesheet`;
                style.type = `text/css`;
                style.href = href;
                document.head.appendChild(style);
                window.injected.styles.push(style);
                resolve({ success: true });
            } else {
                resolve({ success: true });
            }
        });
    }

    function isStyleAdded(href) {
        var added = false;

        window.injected.styles.forEach(
            function (style) {
                if (style.href === href) {
                    added = true;
                }
            });

        return added;
    };

    // Persist filter state
    function saveFilterState() {
        GM_setValue(CONFIG.storage.key, JSON.stringify(window.injected.filters));
    }
    
    function loadFilterState() {
        const saved = GM_getValue(CONFIG.storage.key);
        if (saved) {
            window.injected.filters = JSON.parse(saved);
        }
    }

    function doControlsExist(container, controlQuery) {
        return container.querySelector(controlQuery);
    }

    function uiInjections() {
        floatButtons();
    }

    function floatButtons() {
        var buttonContainerTarget = `.${CONFIG.selectors.buttons}`;

        if ((!window.injected.ui.floatButtons)
        && (doControlsExist(document.body, buttonContainerTarget))) {
            var buttonContainer = document.querySelector(buttonContainerTarget);
            buttonContainer.id = `ifc_ButtonContainer`;
            buttonContainer.style.position = `fixed`;
            buttonContainer.style.top = `100px`;
            buttonContainer.style.right = `100px`;
            buttonContainer.style.zIndex = `998`;
            window.injected.ui.floatButtons = true;
        }
    }

    function addFilterControls() {
        addFilterLabel();
        addFilterButton();
        addFilterContainer();
        addFilterContainerOwned();
    }

    function addFilterLabel() {
        if (!window.injected.ui.lblFilter) {
            var lblContainer = createLabel(`Filter`, `Viewing ${window.injected.filters.filteredCount} of ${window.injected.filters.totalCount} results`);
            var buttonContainer = document.querySelector(`#ifc_ButtonContainer`);
            buttonContainer.insertBefore(lblContainer, buttonContainer.firstChild);
            window.injected.ui.lblFilter = true;
        }
    }

    function addFilterButton() {
        if (!window.injected.ui.btnFilter) {
            var imgContainer = createImageButton(`Filter`, GM_getResourceURL (`IMGFilter`), `Filter`, `svg`);
            var buttonContainer = document.querySelector(`#ifc_ButtonContainer`);
            buttonContainer.appendChild(imgContainer);
            window.injected.ui.btnFilter = true;
        }
    }

    function addFilterContainer() {
        if ((!window.injected.ui.divFilter)
        && (!doControlsExist(document.body, `#injectedFilterControls`))) {
            var filterContainer = document.createElement(`div`);
            filterContainer.id = `injectedFilterControls`;
            filterContainer.classList.add(`filter-section`);
            filterContainer.classList.add(`SortAndFilters-module__container___yA+Vp`);
            filterContainer.style.display = `none`;

            var filterListContainer = document.createElement(`div`);
            filterListContainer.classList.add(`filter-list`);
            filterListContainer.classList.add(`SortAndFilters-module__filterList___T81LH`);

            var filterListHeading = document.createElement(`h2`);
            filterListHeading.classList.add(`filter-text-heading`);
            filterListHeading.classList.add(`typography-module__spotLightSubtitlePortrait___RB7M0`);
            filterListHeading.classList.add(`SortAndFilters-module__filtersText___8OwXG`);

            var filterListHeadingText = document.createTextNode(`Filters`);
            filterListHeading.appendChild(filterListHeadingText);

            var ulContainer = document.createElement(`ul`);
            ulContainer.classList.add(`filter-groups`);
            ulContainer.classList.add(`SortAndFilters-module__filterList___T81LH`);

            filterListContainer.appendChild(filterListHeading);
            filterListContainer.appendChild(ulContainer);

            filterContainer.appendChild(filterListContainer);
            document.body.appendChild(filterContainer);
            window.injected.ui.divFilter = true;

            var imgContainer = document.querySelector(`#ifc_btn_Filter`);
            imgContainer.addEventListener(`click`, toggleFilterContainer);
        }
    }

    function addFilterContainerOwned() {
        if (window.injected.ui.divFilter) {
            var containerName = `Owned`
            if (!doControlsExist(document.body, `#ifc_group_${containerName}`)) {
                var mainContainer = document.querySelector(`#injectedFilterControls .filter-groups`);
                var divContainer = createFilterBlock(`${containerName}`, `Owned`);
                mainContainer.appendChild(divContainer);

                //Owned
                var checkboxOwned = createCheckbox(`${containerName}`, `Owned`, window.injected.filters.owned.isOwned, toggleOwned);
                addFilterOption(document.getElementById(`ifc_group_menu_list_${containerName}`), checkboxOwned);

                var checkboxNotOwned = createCheckbox(`NotOwned`, `Not Owned`, window.injected.filters.owned.notOwned, toggleNotOwned);
                addFilterOption(document.getElementById(`ifc_group_menu_list_${containerName}`), checkboxNotOwned);

                var checkboxUnPurchasable = createCheckbox(`UnPurchasable`, `Un-Purchasable`, window.injected.filters.owned.isUnPurchasable, toggleUnPurchasable);
                addFilterOption(document.getElementById(`ifc_group_menu_list_${containerName}`), checkboxUnPurchasable);
            }
        }
    }

    function createFilterBlock(id, text) {
        var groupContainer = document.createElement(`li`);

        if (id != null) {
            groupContainer.id = `ifc_group_${id}`;
        }

        groupContainer.classList.add(`filter-block`);
        groupContainer.classList.add(`SortAndFilters-module__li___aV+Oo`);

        var groupMenuContainer = document.createElement(`div`);

        if (id != null) {
            groupMenuContainer.id = `ifc_group_menu_${id}`;
        }

        groupMenuContainer.classList.add(`SelectionDropdown-module__container___XzkIx`);

        var groupMenuButton = document.createElement(`button`);
        groupMenuButton.classList.add(`filter-block-button`);
        groupMenuButton.classList.add(`SelectionDropdown-module__titleContainer___YyoD0`);
        groupMenuButton.setAttribute(`aria-expanded`, `false`);
        groupMenuButton.setAttribute(`data-ifc-target`, `group_${id}`);

        var groupMenuHeading = document.createElement(`span`);
        groupMenuHeading.classList.add(`filter-text-heading-group`);
        groupMenuHeading.classList.add(`typography-module__xdsSubTitle2___6d6Da`);
        groupMenuHeading.classList.add(`SelectionDropdown-module__titleText___PN6s9`);
        groupMenuHeading.setAttribute(`data-ifc-target`, `group_${id}`);

        var groupMenuHeadingText = document.createTextNode(text);
        groupMenuHeading.appendChild(groupMenuHeadingText);

        var groupMenuButtonImageContainer = document.createElement(`div`);
        groupMenuButtonImageContainer.classList.add(`SelectionDropdown-module__filterInfoContainer___7ktfT`);
        groupMenuButtonImageContainer.setAttribute(`data-ifc-target`, `group_${id}`);

        var imgContainer = createImageContainer(`group_${id}`, GM_getResourceURL (`IMGExpand`), `Expand`, `svg`);
        imgContainer.setAttribute(`data-ifc-target`, `group_${id}`);

        groupMenuButton.appendChild(groupMenuHeading);
        groupMenuButton.appendChild(imgContainer);

        var groupMenuListContainer = document.createElement(`div`);

        if (id != null) {
            groupMenuListContainer.id = `ifc_group_menu_list_${id}`;
        }

        groupMenuListContainer.classList.add(`filter-block-content`);
        groupMenuListContainer.style.maxHeight = `20rem`;
        groupMenuListContainer.style.overflowY = `auto`;
        groupMenuListContainer.style.display = `none`;

        var groupMenuListItemsContainer = document.createElement(`ul`);

        if (id != null) {
            groupMenuListItemsContainer.id = `ifc_group_menu_list_items_${id}`;
        }

        groupMenuListItemsContainer.classList.add(`filter-options`);
        groupMenuListItemsContainer.classList.add(`Selections-module__options___I24e7`);
        groupMenuListItemsContainer.setAttribute(`role`, `listbox`);

        groupMenuListContainer.appendChild(groupMenuListItemsContainer);

        groupMenuContainer.appendChild(groupMenuButton);
        groupMenuContainer.appendChild(groupMenuListContainer);

        groupContainer.appendChild(groupMenuContainer);
        groupMenuContainer.addEventListener(`click`, toggleFilterMenuListContainer);

        return groupContainer;
    }

    function addFilterOption(container, control) {
        var optionsContainer = container.querySelector(`.filter-options`);
        var liContainer = document.createElement(`li`);
        liContainer.appendChild(control);
        optionsContainer.appendChild(liContainer);
    }

    function createLabel(id, text) {
        var labelContainer = document.createElement(`label`);
        labelContainer.style.marginLeft = `5px`;
        labelContainer.style.marginRight = `5px`;
        labelContainer.innerHTML = text;

        if (id != null) {
            labelContainer.id = `ifc_lbl_${id}`;
        }

        return labelContainer;
    }

    function createImageLink(id, src, text) {
        var aContainer = document.createElement(`a`);

        if (id != null) {
            aContainer.id = `ifc_btn_${id}`;
        }

        var imgContainer = document.createElement(`img`);
        imgContainer.src = src;
        imgContainer.alt = text;
        imgContainer.title = text;

        aContainer.appendChild(imgContainer);
        return aContainer;
    }

    function createImageButton(id, src, text, type) {
        var buttonContainer = document.createElement(`button`);

        if (id != null) {
            buttonContainer.id = `ifc_btn_${id}`;
        }

        buttonContainer.classList.add(`WishlistPage-module__wishlistMenuButton___pmqaD`);
        buttonContainer.classList.add(`Button-module__iconButtonBase___uzoKc`);
        buttonContainer.classList.add(`Button-module__basicBorderRadius___TaX9J`);
        buttonContainer.classList.add(`Button-module__sizeIconButtonMedium___WJrxo`);
        buttonContainer.classList.add(`Button-module__buttonBase___olICK`);
        buttonContainer.classList.add(`Button-module__textNoUnderline___kHdUB`);
        buttonContainer.classList.add(`Button-module__typeSecondary___Cid02`);
        buttonContainer.classList.add(`Button-module__overlayModeSolid___v6EcO`);
        buttonContainer.title = text;

        buttonContainer.setAttribute(`aria-label`, text);
        buttonContainer.setAttribute(`aria-pressed`, `false`);

        var imgContainer = createImageContainer(id, src, text, type);
        buttonContainer.appendChild(imgContainer);
        return buttonContainer;
    }

    function createImageContainer(id, src, text, type) {
        var divContainer = document.createElement(`div`);

        if (id != null) {
            divContainer.id = `ifc_img_${id}`;
        }

        divContainer.setAttribute(`data-ifc-type`, type);

        switch(type)
        {
            case `svg`:
                getText(src).then(function(dataText) {
                    divContainer = document.querySelector(`#ifc_img_${id}`);
                    divContainer.innerHTML = dataText;
                    var parentNodeType = divContainer.parentElement.nodeName;
                    var svgContainer = divContainer.querySelector(`svg`);
                    svgContainer.classList.add(`Button-module__buttonIcon___540Jm`);
                    svgContainer.classList.add(`Button-module__noMargin___5UbzU`);
                    svgContainer.classList.add(`WishlistPage-module__icon___yWWwy`);
                    svgContainer.classList.add(`Icon-module__icon___6ICyA`);
                    svgContainer.classList.add(`Icon-module__xxSmall___vViZA`);
                    svgContainer.setAttribute(`data-ifc-target`, `${id}`);
                });
                break;
            default:
            case `img`:
                var imgContainer = document.createElement(type);
                imgContainer.src = src;
                imgContainer.alt = text;
                imgContainer.title = text;
                divContainer.appendChild(imgContainer);
                break;
        }

        return divContainer;
    }

    async function getText(src) {
        let dataObject = await fetch(src);
        let dataText = await dataObject.text();
        return dataText;
    }

    function createCheckbox(id, text, initial, onChange) {
        var labelContainer = document.createElement(`label`);
        labelContainer.style.marginLeft = `5px`;
        labelContainer.style.marginRight = `5px`;

        var checkboxContainer = document.createElement(`input`);
        checkboxContainer.type = `checkbox`;
        checkboxContainer.checked = initial;
        checkboxContainer.style.marginRight = `3px`;
        checkboxContainer.addEventListener(`change`, onChange);

        if (id != null) {
            labelContainer.id = `ifc_lbl_${id}`;
            checkboxContainer.id = `ifc_cbx_${id}`;
        }

        labelContainer.appendChild(checkboxContainer);

        var textContainer = document.createTextNode(text);
        labelContainer.appendChild(textContainer);

        return labelContainer;
    }

    function removeUnwantedControls() {
        document.querySelectorAll(`.hr.border-neutral-200`).forEach(element => element.remove());
    }

    function toggleFilterContainer(event) {
        window.injected.ui.divFilterShow = !window.injected.ui.divFilterShow;
        var mainContainer = document.querySelector(`#injectedFilterControls`);
        var buttonContainer = document.querySelector(`#ifc_btn_Filter`);

        if (!window.injected.ui.divFilterShow) {
            mainContainer.style.display = `none`;
            buttonContainer.setAttribute(`aria-pressed`, `false`);
            buttonContainer.classList.remove(`WishlistPage-module__activeWishlistMenuButton___3V2d8`);
        } else {
            mainContainer.style.display = null;
            buttonContainer.setAttribute(`aria-pressed`, `true`);
            buttonContainer.classList.add(`WishlistPage-module__activeWishlistMenuButton___3V2d8`);
        }
    }

    function toggleFilterMenuListContainer(event) {
        var target = event.target.getAttribute(`data-ifc-target`);
        var groupContainer = document.querySelector(`#ifc_${target}`);
        var groupMenuButton = groupContainer.querySelector(`.filter-block-button`);
        var imgContainer = groupMenuButton.querySelector(`#ifc_img_${target}`);
        var type = imgContainer.dataset.ifcType;
        var groupMenuListContainer = groupContainer.querySelector(`.filter-block-content`);
        var ariaExpanded = groupMenuButton.getAttribute(`aria-expanded`);

        switch(type)
        {
            case `svg`:
                if (ariaExpanded === `true`) {
                    getText(GM_getResourceURL (`IMGExpand`)).then(function(dataText) {
                        imgContainer = document.querySelector(`#ifc_img_${target}`);
                        imgContainer.innerHTML = dataText;
                        var svgContainer = imgContainer.querySelector(`svg`);
                        svgContainer.classList.add(`Button-module__buttonIcon___540Jm`);
                        svgContainer.classList.add(`Button-module__noMargin___5UbzU`);
                        svgContainer.classList.add(`WishlistPage-module__icon___yWWwy`);
                        svgContainer.classList.add(`Icon-module__icon___6ICyA`);
                        svgContainer.classList.add(`Icon-module__xxSmall___vViZA`);
                        svgContainer.setAttribute(`data-ifc-target`, `${target}`);
                    });
                } else {
                    getText(GM_getResourceURL (`IMGCollapse`)).then(function(dataText) {
                        imgContainer = document.querySelector(`#ifc_img_${target}`);
                        imgContainer.innerHTML = dataText;
                        var svgContainer = imgContainer.querySelector(`svg`);
                        svgContainer.classList.add(`Button-module__buttonIcon___540Jm`);
                        svgContainer.classList.add(`Button-module__noMargin___5UbzU`);
                        svgContainer.classList.add(`WishlistPage-module__icon___yWWwy`);
                        svgContainer.classList.add(`Icon-module__icon___6ICyA`);
                        svgContainer.classList.add(`Icon-module__xxSmall___vViZA`);
                        svgContainer.setAttribute(`data-ifc-target`, `${target}`);
                    });
                }
                break;
            default:
            case `img`:
                imgContainer = imgContainer.querySelector(`img`);

                if (ariaExpanded === `true`) {
                    imgContainer.setAttribute(`src`, GM_getResourceURL (`IMGExpand`));
                    imgContainer.setAttribute(`alt`, `Expand`);
                    imgContainer.setAttribute(`title`, `Expand`);
                } else {
                    imgContainer.setAttribute(`src`, GM_getResourceURL (`IMGCollapse`));
                    imgContainer.setAttribute(`alt`, `Collapse`);
                    imgContainer.setAttribute(`title`, `Collapse`);
                }
                break;
        }

        if (ariaExpanded === `true`) {
            groupMenuButton.setAttribute(`aria-expanded`, `false`);
            groupMenuListContainer.style.display = `none`;
        } else {
            groupMenuButton.setAttribute(`aria-expanded`, `true`);
            groupMenuListContainer.style.display = null;
        }
    }

    function toggleOwned(event) {
        window.injected.filters.owned.isOwned = event.target.checked;
        updateScreen();
    }

    function toggleNotOwned(event) {
        window.injected.filters.owned.notOwned = event.target.checked;
        updateScreen();
    }

    function toggleUnPurchasable(event) {
        window.injected.filters.owned.isUnPurchasable = event.target.checked;
        updateScreen();
    }

    function setContainerData(container, id) {
        try {
            container.dataset.ifcId = id;
        } catch (ex) {
            container.dataset.ifcId = `null`;
        }

        try {
            container.dataset.ifcImage = container.querySelector(`.WishlistProductItem-module__imageContainer___lY7BQ a img`).src;
        } catch (ex) {
            container.dataset.ifcImage = `null`;
        }

        try {
            container.dataset.ifcName = container.querySelector(`.WishlistProductItem-module__productDetails___RquZp a`).innerText;
        } catch (ex) {
            container.dataset.ifcName = `null`;
        }

        try {
            container.dataset.ifcUri = container.querySelector(`.WishlistProductItem-module__productDetails___RquZp a`).href;
        } catch (ex) {
            container.dataset.ifcUri = `null`;
        }

        try {
            container.dataset.ifcPublisher = container.querySelector(`.WishlistProductItem-module__productDetails___RquZp p`).innerText;
        } catch (ex) {
            container.dataset.ifcPublisher = `null`;
        }

        var prices = container.querySelectorAll(`.WishlistProductItem-module__productDetails___RquZp div span`);

        try {
            container.dataset.ifcPriceBase = parseFloat(prices[0].innerText.replace(/[^0-9.,-]/g, ``).replace(`,`, `.`));
        } catch (ex) {
            container.dataset.ifcPriceBase = `null`;
        }

        try {
            container.dataset.ifcPriceDiscount = parseFloat(prices[1].innerText.replace(/[^0-9.,-]/g, ``).replace(`,`, `.`));
        } catch (ex) {
            container.dataset.ifcPriceDiscount = `null`;
        }

        try {
            container.dataset.ifcPrice = container.dataset.ifcPriceDiscount !== `null` ? container.dataset.ifcPriceDiscount : container.dataset.ifcPriceBase;
        } catch (ex) {
            container.dataset.ifcPrice = `null`;
        }

        if ((container.dataset.ifcPriceDiscount !== `null`) && (container.dataset.ifcPriceDiscount > 0)) {
            container.dataset.ifcPriceDiscountAmount = container.dataset.ifcPriceBase - container.dataset.ifcPriceDiscount;
            container.dataset.ifcPriceDiscountPercent = (container.dataset.ifcPriceDiscountAmount / container.dataset.ifcPriceBase) * 100;
        } else {
            container.dataset.ifcPriceDiscountAmount = 0;
            container.dataset.ifcPriceDiscountPercent = 0;
        }

        try {
            //ToDo: Fix the subscription data
            container.dataset.ifcSubscription = prices[2].innerText;
        } catch (ex) {
            container.dataset.ifcSubscription = `null`;
        }

        var isOwned = false;

        try {
            isOwned = (container.innerText.indexOf(`Owned`) !== -1 && (container.querySelector(`button`).innerText != `BUY` || container.querySelector(`button`).innerText != `BUY TO OWN`));
        } catch (ex) {
        }

        if (isOwned && !container.classList.contains(`ifc-Owned`)) {
            container.classList.add(`ifc-Owned`);
            container.dataset.ifcOwned = true;
        } else {
            container.dataset.ifcOwned = false;
        }

        var isUnPurchasable = false;

        try {
            isUnPurchasable = (!isOwned && container.dataset.ifcPrice === `null`);
        } catch (ex) {
        }

        if (isUnPurchasable && !container.classList.contains(`ifc-UnPurchasable`)) {
            container.classList.add(`ifc-UnPurchasable`);
            container.dataset.ifcUnpurchasable = true;
        } else {
            container.dataset.ifcUnpurchasable = false;
        }
    }

    function validateOwned(container, showContainer) {
        var isOwned = container.dataset.ifcOwned;
        var isNotOwned = !isOwned;
        var isUnPurchasable = container.dataset.ifcUnpurchasable;

        if ((!showContainer) && (window.injected.filters.owned.isOwned && isOwned)) {
            showContainer = true;
        }

        if ((!showContainer) && (window.injected.filters.owned.notOwned && isNotOwned)) {
            showContainer = true;
        }

        if ((!showContainer) && (window.injected.filters.owned.isUnPurchasable && isUnPurchasable)) {
            showContainer = true;
        }

        if ((showContainer) && (!window.injected.filters.owned.isUnPurchasable && isUnPurchasable)) {
            showContainer = false;
        }

        return showContainer;
    }

    function toggleContainers(containerClassQuery) {
        var containers = document.getElementsByClassName(containerClassQuery);
        var containersCount = containers.length;

        for (let container of containers) {
            var id = containersCount;
            setContainerData(container, id);
            var showContainer = false;

            try {
                showContainer = validateOwned(container, showContainer);
                containersCount--;
            } catch (ex) {
                console.log(`${ex}`);
            }

            if (!showContainer) {
                container.style.display = `none`;
                container.classList.add(`ifc-Hide`);
                container.dataset.ifcShow = false;

                if (container.classList.contains(`ifc-Show`)) {
                    container.classList.remove(`ifc-Show`);
                }
            } else {
                container.style.display = null;
                container.classList.add(`ifc-Show`);
                container.dataset.ifcShow = true;

                if (container.classList.contains(`ifc-Hide`)) {
                    container.classList.remove(`ifc-Hide`);
                }
            }
        }
    }

    function updateFilterCounts() {
        window.injected.filters.totalCount = document.querySelectorAll(`.${CONFIG.selectors.items}`).length;
        window.injected.filters.filteredCount = document.querySelectorAll(`.${CONFIG.selectors.items}.ifc-Show`).length;
    }

    function updateFilterLabels() {
        updateFilterCounts();
        var labelContainer = document.querySelector(`#ifc_lbl_Filter`);
        labelContainer.innerHTML = `Viewing ${window.injected.filters.filteredCount} of ${window.injected.filters.totalCount} results`;
    }

    function updateScreen() {
        toggleContainers(`${CONFIG.selectors.items}`);
        updateFilterLabels();
    }

    function onBodyChange(mut) {
        if (doControlsExist(document, `.${CONFIG.selectors.items}`)) {
            uiInjections();
            addFilterControls();
            removeUnwantedControls();
            window.injected.ui.complete = true;
            updateScreen();
        }

        mo.disconnect();
    }

    var mo = new MutationObserver(onBodyChange);
    mo.observe(document.querySelector(`#${CONFIG.selectors.content}`), {childList: true, subtree: true});
})();
