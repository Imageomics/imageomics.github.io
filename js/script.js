window.ImageomicsStates = {
    create(type, message, options = {}) {
        const state = document.createElement(options.tagName || 'div');
        state.className = `content-state content-state--${type}${options.className ? ` ${options.className}` : ''}`;
        state.textContent = message;
        state.setAttribute('role', type === 'error' ? 'alert' : 'status');
        state.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        return state;
    },

    render(container, type, message, options = {}) {
        if (!container) return null;
        const state = this.create(type, message, options);
        container.replaceChildren(state);
        container.setAttribute('aria-busy', String(type === 'loading'));
        return state;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const scriptElement = document.querySelector('script[src*="js/script.js"]');
    const scriptUrl = new URL(scriptElement?.src || 'js/script.js', window.location.href);
    const siteRootUrl = new URL('../', scriptUrl);
    const searchIndexUrl = new URL('data/search-index.json', siteRootUrl);
    let searchIndexPromise;

    const normalizeSearchValue = (value) => String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    const getSearchTerms = (value) => normalizeSearchValue(value).match(/[a-z0-9]+/g) || [];

    const getSectionLabel = (url) => {
        if (url === 'index.html') return 'Home';
        const section = url.split('/')[1] || '';
        return {
            about: 'About',
            conference: 'Conference',
            events: 'Events',
            news: 'News',
            research: 'Research',
            'tools-resources': 'Tools & Resources'
        }[section] || 'Page';
    };

    const loadSearchIndex = () => {
        if (!searchIndexPromise) {
            searchIndexPromise = fetch(searchIndexUrl)
                .then((response) => {
                    if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
                    return response.json();
                })
                .then((pages) => pages.map((page) => {
                    const normalizedTitle = normalizeSearchValue(page.title);
                    const normalizedUrl = normalizeSearchValue(page.url);
                    const normalizedText = normalizeSearchValue(page.text);
                    return {
                        ...page,
                        section: getSectionLabel(page.url),
                        normalizedTitle,
                        normalizedUrl,
                        normalizedText,
                        titleWords: [...new Set(getSearchTerms(page.title))],
                        words: [...new Set(getSearchTerms(`${page.title} ${page.text}`))]
                    };
                }))
                .catch((error) => {
                    searchIndexPromise = null;
                    throw error;
                });
        }

        return searchIndexPromise;
    };

    function initSearchUI() {
        const searchContainer = document.getElementById('searchContainer');
        const searchIconBtn = document.getElementById('searchIconBtn');
        const searchBar = document.getElementById('searchBar');
        const searchResults = document.getElementById('searchResults');

        if (!searchContainer || !searchIconBtn || !searchBar || !searchResults || searchBar.dataset.bound === 'true') {
            return;
        }

        searchBar.dataset.bound = 'true';
        searchBar.setAttribute('autocomplete', 'off');
        searchBar.setAttribute('aria-controls', 'searchResults');
        searchBar.setAttribute('aria-expanded', 'false');
        searchBar.setAttribute('aria-autocomplete', 'list');
        searchBar.setAttribute('role', 'combobox');
        searchResults.setAttribute('role', 'listbox');
        searchResults.setAttribute('aria-label', 'Search results');
        searchResults.setAttribute('aria-live', 'polite');
        let searchRequest = 0;
        let searchTimer;
        let activeResultIndex = -1;
        let renderedQuery = '';

        const closeResults = () => {
            window.clearTimeout(searchTimer);
            searchResults.classList.remove('is-visible');
            searchResults.replaceChildren();
            searchBar.setAttribute('aria-expanded', 'false');
            searchBar.removeAttribute('aria-activedescendant');
            activeResultIndex = -1;
            renderedQuery = '';
        };

        const showResults = () => {
            searchResults.classList.add('is-visible');
            searchBar.setAttribute('aria-expanded', 'true');
        };

        const renderStatus = (message, className = '') => {
            const status = document.createElement('div');
            status.className = `search-no-results content-state content-state--empty ${className}`.trim();
            status.setAttribute('role', 'status');
            status.textContent = message;
            searchResults.replaceChildren(status);
            showResults();
        };

        const boundedEditDistance = (left, right, limit) => {
            if (Math.abs(left.length - right.length) > limit) return limit + 1;
            let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

            for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
                const current = [leftIndex];
                let rowMinimum = current[0];
                for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
                    const substitution = previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
                    current[rightIndex] = Math.min(
                        previous[rightIndex] + 1,
                        current[rightIndex - 1] + 1,
                        substitution
                    );
                    rowMinimum = Math.min(rowMinimum, current[rightIndex]);
                }
                if (rowMinimum > limit) return limit + 1;
                previous = current;
            }

            return previous[right.length];
        };

        const findFuzzyWord = (page, term) => {
            if (term.length < 4) return null;
            const tolerance = term.length >= 7 ? 2 : 1;
            const isMatch = (word) => (
                word.length >= 3 && boundedEditDistance(term, word, tolerance) <= tolerance
            );
            const titleWord = page.titleWords.find(isMatch);
            if (titleWord) return { word: titleWord, inTitle: true };
            const bodyWord = page.words.find(isMatch);
            return bodyWord ? { word: bodyWord, inTitle: false } : null;
        };

        const scorePage = (page, query, terms) => {
            const titleIndex = page.normalizedTitle.indexOf(query);
            const textIndex = page.normalizedText.indexOf(query);
            const urlIndex = page.normalizedUrl.indexOf(query);
            const fuzzyWords = [];
            let score = 0;

            if (!terms.length && titleIndex < 0 && textIndex < 0 && urlIndex < 0) return null;

            for (const term of terms) {
                if (page.normalizedTitle.includes(term)) score += 120;
                else if (page.normalizedUrl.includes(term)) score += 70;
                else if (page.normalizedText.includes(term)) score += 35;
                else {
                    const fuzzyWord = findFuzzyWord(page, term);
                    if (!fuzzyWord) return null;
                    fuzzyWords.push(fuzzyWord.word);
                    score += fuzzyWord.inTitle ? 90 : 8;
                }
            }

            if (page.normalizedTitle === query) score += 1200;
            else if (titleIndex === 0) score += 700;
            else if (titleIndex > 0) score += 480;
            if (urlIndex >= 0) score += 220;
            if (textIndex >= 0) score += 180;
            if (terms.length > 1 && terms.every((term) => page.normalizedTitle.includes(term))) score += 260;

            return { page, score, fuzzyWords };
        };

        const createSnippet = (page, query, terms, fuzzyWords) => {
            const text = page.text || '';
            const normalizedText = page.normalizedText;
            let matchIndex = normalizedText.indexOf(query);
            if (matchIndex < 0) {
                matchIndex = [...terms, ...fuzzyWords].reduce((best, term) => {
                    const index = normalizedText.indexOf(term);
                    return index >= 0 && (best < 0 || index < best) ? index : best;
                }, -1);
            }

            if (matchIndex < 0) matchIndex = 0;

            const start = Math.max(0, matchIndex - 85);
            const end = Math.min(text.length, matchIndex + query.length + 145);
            return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
        };

        const appendHighlightedText = (element, text, highlights) => {
            const escapedTerms = [...new Set(highlights.filter(Boolean))]
                .sort((left, right) => right.length - left.length)
                .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            if (!escapedTerms.length) {
                element.textContent = text;
                return;
            }

            const expression = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
            text.split(expression).forEach((part) => {
                if (expression.test(part)) {
                    const mark = document.createElement('mark');
                    mark.textContent = part;
                    element.append(mark);
                } else {
                    element.append(document.createTextNode(part));
                }
                expression.lastIndex = 0;
            });
        };

        const renderResults = (matches, query, terms) => {
            renderedQuery = query;
            if (!matches.length) {
                const empty = document.createElement('div');
                empty.className = 'search-empty';
                const title = document.createElement('strong');
                title.textContent = `No results for “${searchBar.value.trim()}”`;
                const hint = document.createElement('span');
                hint.textContent = 'Try fewer words, a different spelling, or a broader phrase.';
                empty.append(title, hint);
                searchResults.replaceChildren(empty);
                showResults();
                return;
            }

            const visibleMatches = matches.slice(0, 12);
            const panelHeader = document.createElement('div');
            panelHeader.className = 'search-results-header';
            const resultCount = document.createElement('strong');
            resultCount.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}`;
            panelHeader.append(resultCount);

            const list = document.createElement('div');
            list.className = 'search-results-list';
            list.setAttribute('role', 'presentation');
            visibleMatches.forEach(({ page, fuzzyWords }, index) => {
                const link = document.createElement('a');
                link.className = 'search-result-item';
                link.href = new URL(page.url, siteRootUrl).href;
                link.id = `search-result-${index}`;
                link.setAttribute('role', 'option');
                link.setAttribute('aria-selected', 'false');

                const meta = document.createElement('div');
                meta.className = 'search-result-meta';
                const section = document.createElement('span');
                section.className = 'search-result-section';
                section.textContent = page.section;
                const path = document.createElement('span');
                path.className = 'search-result-path';
                path.textContent = page.url === 'index.html' ? 'imageomics.org' : page.url.replace(/^html\//, '').replace(/\.html$/, '');
                meta.append(section, path);

                const title = document.createElement('div');
                title.className = 'search-result-title';
                appendHighlightedText(title, page.title, terms);

                const snippet = document.createElement('div');
                snippet.className = 'search-result-snippet';
                appendHighlightedText(snippet, createSnippet(page, query, terms, fuzzyWords), [...terms, ...fuzzyWords]);

                link.append(meta, title, snippet);
                link.addEventListener('mouseenter', () => setActiveResult(index));
                list.append(link);
            });

            searchResults.replaceChildren(panelHeader, list);
            activeResultIndex = -1;
            searchBar.removeAttribute('aria-activedescendant');
            showResults();
        };

        const getResultLinks = () => [...searchResults.querySelectorAll('.search-result-item')];

        const setActiveResult = (index) => {
            const links = getResultLinks();
            if (!links.length) return;
            activeResultIndex = (index + links.length) % links.length;
            links.forEach((link, linkIndex) => {
                const isActive = linkIndex === activeResultIndex;
                link.classList.toggle('is-active', isActive);
                link.setAttribute('aria-selected', String(isActive));
            });
            searchBar.setAttribute('aria-activedescendant', links[activeResultIndex].id);
            links[activeResultIndex].scrollIntoView({ block: 'nearest' });
        };

        const runSearch = async () => {
            const request = ++searchRequest;
            const query = normalizeSearchValue(searchBar.value);
            if (!query) {
                closeResults();
                return;
            }

            renderStatus('Searching…', 'search-loading');

            try {
                const pages = await loadSearchIndex();
                if (request !== searchRequest) return;
                const terms = getSearchTerms(query);
                const matches = pages
                    .map((page) => scorePage(page, query, terms))
                    .filter(Boolean)
                    .sort((left, right) => right.score - left.score || left.page.title.localeCompare(right.page.title));

                renderResults(matches, query, terms);
            } catch (error) {
                console.error('Unable to load the search index:', error);
                if (request === searchRequest) renderStatus('Search is temporarily unavailable. Please try again.');
            }
        };

        const scheduleSearch = () => {
            window.clearTimeout(searchTimer);
            if (!searchBar.value.trim()) {
                searchRequest += 1;
                closeResults();
                return;
            }
            searchTimer = window.setTimeout(runSearch, 90);
        };

        searchContainer.addEventListener('submit', (event) => {
            event.preventDefault();
            const links = getResultLinks();
            const currentQuery = normalizeSearchValue(searchBar.value);
            if (links.length && currentQuery === renderedQuery) {
                links[activeResultIndex >= 0 ? activeResultIndex : 0].click();
            } else if (searchBar.value.trim()) {
                window.clearTimeout(searchTimer);
                runSearch();
            } else {
                searchBar.focus();
            }
        });

        searchBar.addEventListener('input', scheduleSearch);
        searchBar.addEventListener('focus', () => {
            if (searchBar.value.trim()) scheduleSearch();
        });

        document.addEventListener('click', (event) => {
            if (!searchContainer.contains(event.target)) {
                closeResults();
            }
        });

        searchBar.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                searchRequest += 1;
                closeResults();
                searchBar.blur();
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveResult(activeResultIndex + 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveResult(activeResultIndex - 1);
            }
        });

        document.addEventListener('keydown', (event) => {
            const target = event.target;
            const isTyping = target instanceof HTMLElement && (
                target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
            );
            const usesSearchShortcut = (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !isTyping);
            if (!usesSearchShortcut) return;
            event.preventDefault();
            searchBar.focus();
            searchBar.select();
        });
    }

    window.initHamburger = function initHamburger() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.querySelector('.nav');
        const header = document.querySelector('.header');

        if (!hamburger || !navMenu || hamburger.dataset.bound === 'true') {
            return;
        }

        hamburger.dataset.bound = 'true';
        navMenu.id = navMenu.id || 'site-navigation';
        hamburger.setAttribute('aria-controls', navMenu.id);
        hamburger.setAttribute('aria-expanded', 'false');

        const mobileNavQuery = window.matchMedia('(max-width: 768px), (max-width: 1024px) and (orientation: portrait)');
        const isMobileNav = () => mobileNavQuery.matches;
        let lockedScrollPosition = 0;

        const setPageContentInert = (isInert) => {
            document.querySelectorAll('main, #footer-placeholder, footer').forEach((region) => {
                if (!region.closest('.header')) {
                    region.inert = isInert;
                }
            });
        };

        const updateMenuPosition = () => {
            if (!header || !isMobileNav()) return;
            navMenu.style.setProperty('--mobile-nav-top', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
        };

        const lockPageScroll = () => {
            if (document.body.style.position === 'fixed') return;
            lockedScrollPosition = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${lockedScrollPosition}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
        };

        const unlockPageScroll = () => {
            if (document.body.style.position !== 'fixed') return;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';

            const previousScrollBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = 'auto';
            window.scrollTo(0, lockedScrollPosition);
            document.documentElement.style.scrollBehavior = previousScrollBehavior;
        };

        const setMenuOpen = (isOpen) => {
            if (isOpen) {
                updateMenuPosition();
                lockPageScroll();
            } else {
                unlockPageScroll();
            }
            setPageContentInert(isOpen);
            hamburger.classList.toggle('active', isOpen);
            navMenu.classList.toggle('active', isOpen);
            document.body.classList.toggle('menu-open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        };

        hamburger.addEventListener('click', function() {
            setMenuOpen(!navMenu.classList.contains('active'));
        });

        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') &&
                !navMenu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                setMenuOpen(false);
            }
        });

        const links = navMenu.querySelectorAll('a');
        links.forEach((link) => {
            link.addEventListener('click', function() {
                if (link.hasAttribute('href') || !link.closest('.dropdown') || !isMobileNav()) {
                    setMenuOpen(false);
                }
            });
        });

        const dropdowns = navMenu.querySelectorAll('.dropdown');
        const closeTimers = new Map();

        const cancelDropdownClose = (dropdown) => {
            const timer = closeTimers.get(dropdown);
            if (timer) {
                clearTimeout(timer);
                closeTimers.delete(dropdown);
            }
        };

        const openDesktopDropdown = (dropdown) => {
            if (isMobileNav()) return;

            cancelDropdownClose(dropdown);
            closeDesktopDropdowns(dropdown);
            dropdown.classList.add('is-open');
            dropdown.querySelector(':scope > a')?.setAttribute('aria-expanded', 'true');
        };

        const scheduleDesktopDropdownClose = (dropdown) => {
            if (isMobileNav()) return;

            cancelDropdownClose(dropdown);
            closeTimers.set(dropdown, setTimeout(() => {
                dropdown.classList.remove('is-open');
                dropdown.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
                closeTimers.delete(dropdown);
            }, 180));
        };

        const closeDesktopDropdowns = (exceptDropdown = null) => {
            dropdowns.forEach((dropdown) => {
                if (dropdown !== exceptDropdown) {
                    cancelDropdownClose(dropdown);
                    dropdown.classList.remove('is-open');
                    dropdown.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
                }
            });
        };

        dropdowns.forEach((dropdown, index) => {
            const link = dropdown.querySelector(':scope > a');
            const dropdownMenu = dropdown.querySelector(':scope > .dropdown-menu');
            if (!link || !dropdownMenu) return;

            dropdownMenu.id = dropdownMenu.id || `site-submenu-${index + 1}`;

            link.setAttribute('role', 'button');
            link.setAttribute('tabindex', '0');
            link.setAttribute('aria-expanded', 'false');
            link.setAttribute('aria-controls', dropdownMenu.id);

            link.addEventListener('click', function(e) {
                if (isMobileNav()) {
                    e.preventDefault();
                    const shouldOpen = !dropdown.classList.contains('active');
                    dropdowns.forEach((item) => {
                        const isOpen = shouldOpen && item === dropdown;
                        item.classList.toggle('active', isOpen);
                        item.querySelector(':scope > a')?.setAttribute('aria-expanded', String(isOpen));
                    });
                    return;
                }

                e.preventDefault();
                const shouldOpen = !dropdown.classList.contains('is-open');
                closeDesktopDropdowns(dropdown);
                dropdown.classList.toggle('is-open', shouldOpen);
                link.setAttribute('aria-expanded', String(shouldOpen));
            });

            link.addEventListener('keydown', function(e) {
                if (!['Enter', ' '].includes(e.key)) return;
                e.preventDefault();
                link.click();
            });

            dropdown.addEventListener('mouseenter', function() {
                openDesktopDropdown(dropdown);
            });

            dropdown.addEventListener('mouseleave', function(e) {
                const dropdownMenu = dropdown.querySelector('.dropdown-menu');

                if (!isMobileNav() &&
                    dropdownMenu &&
                    !dropdownMenu.contains(e.relatedTarget)) {
                    scheduleDesktopDropdownClose(dropdown);
                }
            });

            dropdownMenu.addEventListener('mouseenter', function() {
                openDesktopDropdown(dropdown);
            });

            dropdownMenu.addEventListener('mouseleave', function(e) {
                if (!isMobileNav() &&
                    !dropdown.contains(e.relatedTarget)) {
                    scheduleDesktopDropdownClose(dropdown);
                }
            });
        });

        document.addEventListener('click', function(e) {
            if (!isMobileNav() && !navMenu.contains(e.target)) {
                closeDesktopDropdowns();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const focusedDropdown = document.activeElement?.closest('.dropdown.is-open');
                closeDesktopDropdowns();
                if (navMenu.classList.contains('active')) {
                    setMenuOpen(false);
                    hamburger.focus();
                } else if (focusedDropdown) {
                    focusedDropdown.querySelector(':scope > a')?.focus();
                }
            }
        });

        mobileNavQuery.addEventListener('change', () => {
            setMenuOpen(false);
            navMenu.style.removeProperty('--mobile-nav-top');
        });

        window.addEventListener('resize', () => {
            if (navMenu.classList.contains('active')) updateMenuPosition();
        }, { passive: true });
    };

    window.initActiveNav = function initActiveNav() {
        const navMenu = document.querySelector('.nav');
        if (!navMenu) return;

        const currentUrl = new URL(window.location.href);
        const currentPath = currentUrl.pathname.replace(/\/index\.html$/, '/');
        const links = navMenu.querySelectorAll('a[href]');

        const getLinkPath = (link) => {
            const linkUrl = new URL(link.getAttribute('href'), window.location.href);
            return linkUrl.pathname.replace(/\/index\.html$/, '/');
        };

        links.forEach((link) => {
            const linkPath = getLinkPath(link);

            if (linkPath === currentPath) {
                link.classList.add('is-current');
                link.setAttribute('aria-current', 'page');

                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    parentDropdown.classList.add('is-current-section');
                }
            }
        });

        const sectionMatch = currentPath.match(/\/html\/(about|research|tools-resources|events|news|conference)(?:\/|\.html$)/);
        if (!sectionMatch) return;

        const section = sectionMatch[1] === 'conference' ? 'events' : sectionMatch[1];
        const dropdownBySection = {
            about: '.dropdown-about',
            research: '.dropdown-research',
            'tools-resources': '.dropdown-tools'
        };

        if (dropdownBySection[section]) {
            navMenu.querySelector(dropdownBySection[section])?.classList.add('is-current-section');
            return;
        }

        const sectionIndexPath = `/html/${section}.html`;
        const sectionLink = Array.from(links).find((link) => getLinkPath(link).endsWith(sectionIndexPath));
        if (sectionLink) {
            sectionLink.classList.add('is-current');
            sectionLink.setAttribute('aria-current', 'page');
        }
    };

    window.initHamburger();
    window.initSearchUI = initSearchUI;
    window.initSearchUI();
    window.initActiveNav();
});

(function initExternalLinkBehavior() {
    'use strict';

    function updateLink(link) {
        const href = link.getAttribute('href');
        if (!href) return;

        let url;
        try {
            url = new URL(href, window.location.href);
        } catch (error) {
            return;
        }

        const isWebLink = url.protocol === 'http:' || url.protocol === 'https:';
        const isExternal = isWebLink && url.origin !== window.location.origin;

        if (!isExternal) return;

        link.setAttribute('target', '_blank');

        const relValues = new Set(
            (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean)
        );
        relValues.add('noopener');
        relValues.add('noreferrer');
        link.setAttribute('rel', Array.from(relValues).join(' '));
    }

    window.initExternalLinks = function initExternalLinks(root = document) {
        if (root.nodeType === Node.ELEMENT_NODE && root.matches('a[href]')) {
            updateLink(root);
        }

        if (typeof root.querySelectorAll === 'function') {
            root.querySelectorAll('a[href]').forEach(updateLink);
        }
    };

    function startWatchingLinks() {
        window.initExternalLinks(document);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    updateLink(mutation.target);
                    return;
                }

                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        window.initExternalLinks(node);
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['href'],
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWatchingLinks);
    } else {
        startWatchingLinks();
    }
})();
