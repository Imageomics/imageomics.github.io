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
    const pagesToIndex = [
        { title: 'About', url: 'html/about.html' },
        { title: 'The Vision of the Imageomics Institute', url: 'html/about/vision.html' },
        { title: 'Community Values', url: 'html/about/community-values.html' },
        { title: 'Code of Conduct', url: 'html/about/code-of-conduct.html' },
        { title: 'Imageomics In the News', url: 'html/about/imageomics-in-the-news.html' },
        { title: 'Institute Faculty & Staff', url: 'html/about/faculty-staff.html' },
        { title: 'NextGens', url: 'html/about/nextgens.html' },
        { title: 'Collaborators', url: 'html/about/collaborators.html' },
        { title: 'Subscribe to our Mailing List', url: 'html/about/mailing-list.html' },
        { title: 'Visitors to Imageomics Institute', url: 'html/about/visitors.html' },
        { title: 'Research', url: 'html/research.html' },
        { title: 'Research Projects', url: 'html/research/projects.html' },
        { title: 'Imageomics Publications', url: 'html/research/publications.html' },
        { title: 'Publication Acknowledgements', url: 'html/research/publication-acknowledgements.html' },
        { title: 'Talks and Presentations', url: 'html/research/talks-presentations.html' },
        { title: 'News', url: 'html/news.html' },
        { title: 'Events', url: 'html/events.html' },
        { title: 'Tools & Resources', url: 'html/tools-resources.html' },
        { title: 'Imageomics Policies & Guidelines', url: 'html/tools-resources/policies-guidelines.html' },
        { title: 'Authorship Guidelines', url: 'html/tools-resources/authorship-guidelines.html' },
        { title: 'Data Code of Conduct Policy', url: 'html/tools-resources/data-code-of-conduct-policy.html' },
        { title: 'Digital Products Release and Licensing Policy', url: 'html/tools-resources/digital-products-release-licensing-policy.html' },
        { title: 'Fieldwork Safety Plan', url: 'html/tools-resources/fieldwork-safety-plan.html' },
        { title: 'Educational Tools & Resources', url: 'html/tools-resources/educational-tools-resources.html' },
        { title: 'Experiential Introduction to AI and Ecology Course 2026-2027', url: 'html/tools-resources/experiential-introduction-ai-ecology-course-2026-2027.html' },
        { title: 'Software Tools & Resources', url: 'html/tools-resources/software-tools-resources.html' },
        { title: 'Tool Tutorials', url: 'html/tools-resources/tool-tutorials.html' },
        { title: 'Team Science Tools & Resources', url: 'html/tools-resources/team-science-tools-resources.html' },
        { title: 'Imageomics Conference', url: 'html/conference.html' },
        { title: 'Conference Overview', url: 'html/conference/overview.html' },
        { title: 'Conference Resources', url: 'html/conference/resources.html' },
        { title: 'Conference Accommodations', url: 'html/conference/accommodations.html' },
        { title: 'Conference Travel Information', url: 'html/conference/travel-information.html' },
        { title: 'Conference Agenda', url: 'html/conference/agenda.html' },
        { title: 'NextGen Day Agenda', url: 'html/conference/nextgen-day-agenda.html' },
        { title: 'The Wilds Field Trip Schedule', url: 'html/conference/the-wilds-field-trip-schedule.html' },
        { title: 'Research Lightning Talk Abstracts', url: 'html/conference/research-lightning-talk-abstracts.html' }
    ];

    function initSearchUI() {
        const searchContainer = document.getElementById('searchContainer');
        const searchIconBtn = document.getElementById('searchIconBtn');
        const searchBar = document.getElementById('searchBar');
        const searchResults = document.getElementById('searchResults');

        if (!searchContainer || !searchIconBtn || !searchBar || !searchResults || searchBar.dataset.bound === 'true') {
            return;
        }

        searchBar.dataset.bound = 'true';

        const closeResults = () => {
            searchResults.classList.remove('is-visible');
            searchResults.innerHTML = '';
        };

        const renderResults = (matches) => {
            if (!matches.length) {
                searchResults.innerHTML = '<div class="search-no-results">No matches found.</div>';
                searchResults.classList.add('is-visible');
                return;
            }

            const resultsMarkup = matches.slice(0, 8).map((page) => `
                <a class="search-result-item" href="${page.url}">
                    <div class="search-result-title">${page.title}</div>
                    <div class="search-result-snippet">${page.url}</div>
                </a>
            `).join('');

            searchResults.innerHTML = `<div class="search-results-list">${resultsMarkup}</div>`;
            searchResults.classList.add('is-visible');
        };

        const runSearch = () => {
            const query = searchBar.value.trim().toLowerCase();
            if (!query) {
                closeResults();
                return;
            }

            const matches = pagesToIndex.filter((page) => (
                page.title.toLowerCase().includes(query) || page.url.toLowerCase().includes(query)
            ));

            renderResults(matches);
        };

        searchIconBtn.addEventListener('click', () => {
            searchBar.focus();
            runSearch();
        });

        searchBar.addEventListener('input', runSearch);

        document.addEventListener('click', (event) => {
            if (!searchContainer.contains(event.target)) {
                closeResults();
            }
        });

        searchBar.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeResults();
                searchBar.blur();
            }
        });
    }

    window.initHamburger = function initHamburger() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.querySelector('.nav');

        if (!hamburger || !navMenu || hamburger.dataset.bound === 'true') {
            return;
        }

        hamburger.dataset.bound = 'true';

        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') &&
                !navMenu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });

        const links = navMenu.querySelectorAll('a');
        links.forEach((link) => {
            link.addEventListener('click', function() {
                if (!link.closest('.dropdown') || window.innerWidth > 768) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
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
            if (window.innerWidth <= 768) return;

            cancelDropdownClose(dropdown);
            closeDesktopDropdowns(dropdown);
            dropdown.classList.add('is-open');
        };

        const scheduleDesktopDropdownClose = (dropdown) => {
            if (window.innerWidth <= 768) return;

            cancelDropdownClose(dropdown);
            closeTimers.set(dropdown, setTimeout(() => {
                dropdown.classList.remove('is-open');
                closeTimers.delete(dropdown);
            }, 180));
        };

        const closeDesktopDropdowns = (exceptDropdown = null) => {
            dropdowns.forEach((dropdown) => {
                if (dropdown !== exceptDropdown) {
                    cancelDropdownClose(dropdown);
                    dropdown.classList.remove('is-open');
                }
            });
        };

        dropdowns.forEach((dropdown) => {
            const link = dropdown.querySelector(':scope > a');
            if (!link) return;

            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                    return;
                }

                e.preventDefault();
                const shouldOpen = !dropdown.classList.contains('is-open');
                closeDesktopDropdowns(dropdown);
                dropdown.classList.toggle('is-open', shouldOpen);
            });

            dropdown.addEventListener('mouseenter', function() {
                openDesktopDropdown(dropdown);
            });

            dropdown.addEventListener('mouseleave', function(e) {
                const dropdownMenu = dropdown.querySelector('.dropdown-menu');

                if (window.innerWidth > 768 &&
                    dropdownMenu &&
                    !dropdownMenu.contains(e.relatedTarget)) {
                    scheduleDesktopDropdownClose(dropdown);
                }
            });

            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.addEventListener('mouseenter', function() {
                    openDesktopDropdown(dropdown);
                });

                dropdownMenu.addEventListener('mouseleave', function(e) {
                    if (window.innerWidth > 768 &&
                        !dropdown.contains(e.relatedTarget)) {
                        scheduleDesktopDropdownClose(dropdown);
                    }
                });
            }
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth > 768 && !navMenu.contains(e.target)) {
                closeDesktopDropdowns();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDesktopDropdowns();
            }
        });
    };

    window.initActiveNav = function initActiveNav() {
        const navMenu = document.querySelector('.nav');
        if (!navMenu) return;

        const currentUrl = new URL(window.location.href);
        const currentPath = currentUrl.pathname.replace(/\/index\.html$/, '/');
        const links = navMenu.querySelectorAll('a[href]');

        links.forEach((link) => {
            const linkUrl = new URL(link.getAttribute('href'), window.location.href);
            const linkPath = linkUrl.pathname.replace(/\/index\.html$/, '/');

            if (linkPath === currentPath) {
                link.classList.add('is-current');
                link.setAttribute('aria-current', 'page');

                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    parentDropdown.classList.add('is-current-section');
                }
            }
        });
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
