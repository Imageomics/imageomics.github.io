document.addEventListener('DOMContentLoaded', async () => {
    const FIRST_PAGE_REGULAR_CARD_COUNT = 9;
    const FOLLOWING_PAGE_CARD_COUNT = 12;

    const main = document.querySelector("main");
    if (!main) return;

    let unsortedNewsItems;
    try {
        const response = await fetch("../data/news.json");
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        unsortedNewsItems = await response.json();
        if (!Array.isArray(unsortedNewsItems)) throw new TypeError("News data must be an array.");
    } catch (error) {
        console.error("Unable to load news data.", error);
        const featuredNews = document.querySelector("#news-featured");
        const newsList = document.querySelector("#news-list");
        if (featuredNews) featuredNews.innerHTML = "";
        if (newsList) {
            newsList.innerHTML = "<p class=\"news-empty-state\">News is temporarily unavailable. Please try again later.</p>";
        }
        return;
    }

    const parseNewsDate = (dateString) => {
        const normalizedDate = dateString || '';
        const parsedDate = new Date(normalizedDate);
        return Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
    };

    const newsItems = [...unsortedNewsItems].sort((a, b) => parseNewsDate(b.date) - parseNewsDate(a.date));
    const latestNewsItem = newsItems[0];

    const newsList = document.querySelector('#news-list');
    const featuredNews = document.querySelector('#news-featured');
    const paginationControls = document.querySelectorAll('.news-pagination');
    const newsSearch = document.querySelector('.news-search');
    const searchInput = document.querySelector('#news-search-input');
    const yearFilter = document.querySelector('#news-year-filter');
    const yearToggle = yearFilter?.querySelector('.news-year-toggle');
    const yearToggleLabel = yearToggle?.querySelector('span');
    const yearMenu = yearFilter?.querySelector('.news-year-menu');
    const resultsCount = document.querySelector('#news-results-count');
    if (!newsList) return;

    let filteredNewsItems = [...newsItems];
    let selectedYear = '';

    const getPageFromUrl = () => {
        const page = Number.parseInt(new URLSearchParams(window.location.search).get('page'), 10);
        return Number.isInteger(page) && page > 0 ? page : 1;
    };

    const getItemYear = (item) => {
        const dateYear = item.date?.match(/\b\d{4}\b/)?.[0];
        return dateYear || String(item.year || '');
    };

    const getFilteredNewsItems = () => {
        const query = searchInput?.value.trim().toLowerCase() || '';

        return newsItems.filter((item) => (
            (!selectedYear || getItemYear(item) === selectedYear) &&
            (
                !query ||
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.date?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query)
            )
        ));
    };

    const updateFilteredNewsItems = () => {
        filteredNewsItems = getFilteredNewsItems();
    };

    const renderResultsCount = () => {
        if (!resultsCount) return;

        const hasActiveFilter = Boolean(searchInput?.value.trim() || selectedYear);
        if (!hasActiveFilter) {
            resultsCount.textContent = '';
            return;
        }

        const resultLabel = filteredNewsItems.length === 1 ? 'result' : 'results';
        resultsCount.textContent = `${filteredNewsItems.length} ${resultLabel}`;
    };

    const populateYearFilter = () => {
        if (!yearMenu) return;

        const yearOptions = [...new Set(newsItems.map(getItemYear).filter(Boolean))]
            .sort((a, b) => b - a)
            .map((year) => `<button type="button" role="option" data-year="${year}" aria-selected="false">${year}</button>`)
            .join('');

        yearMenu.innerHTML = `<button type="button" role="option" data-year="" aria-selected="true">All years</button>${yearOptions}`;
    };

    const hasFeaturedItem = (items) => items.includes(latestNewsItem);

    const getRegularNewsItems = (items) => {
        if (!hasFeaturedItem(items)) return items;

        return items.filter((item) => item !== latestNewsItem);
    };

    const getTotalPages = (items) => {
        if (!hasFeaturedItem(items)) {
            return Math.max(Math.ceil(items.length / FOLLOWING_PAGE_CARD_COUNT), 1);
        }

        const regularItemCount = getRegularNewsItems(items).length;
        if (regularItemCount <= FIRST_PAGE_REGULAR_CARD_COUNT) return 1;

        return 1 + Math.ceil((regularItemCount - FIRST_PAGE_REGULAR_CARD_COUNT) / FOLLOWING_PAGE_CARD_COUNT);
    };

    const getNewsItemsForPage = (page, items) => {
        const regularItems = getRegularNewsItems(items);

        if (page === 1 && hasFeaturedItem(items)) {
            return {
                featuredItem: latestNewsItem,
                regularItems: regularItems.slice(0, FIRST_PAGE_REGULAR_CARD_COUNT)
            };
        }

        const startIndex = hasFeaturedItem(items)
            ? FIRST_PAGE_REGULAR_CARD_COUNT + ((page - 2) * FOLLOWING_PAGE_CARD_COUNT)
            : (page - 1) * FOLLOWING_PAGE_CARD_COUNT;

        return {
            featuredItem: null,
            regularItems: regularItems.slice(startIndex, startIndex + FOLLOWING_PAGE_CARD_COUNT)
        };
    };

    const isExternalUrl = (url) => /^https?:\/\//.test(url || '');

    const getLinkAttributes = (url) => {
        if (!url) return '';

        const externalAttributes = isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return ` href="${url}"${externalAttributes}`;
    };

    const renderNewsItem = (item, isFeatured = false) => {
        if (isFeatured) {
            const imageMarkup = item.image
                ? `
                    <div class="news-featured-image-link" aria-hidden="true">
                        <img src="${item.image}" alt="${item.imageAlt || item.title}" />
                    </div>
                `
                : '';
            const metaMarkup = [item.date, item.category]
                .filter(Boolean)
                .map((text) => `<p class="news-featured-meta">${text}</p>`)
                .join('');
            const cardTag = item.url ? 'a' : 'article';
            const hrefAttribute = getLinkAttributes(item.url);

            return `
                <${cardTag} class="news-card news-featured-card"${hrefAttribute}>
                    ${imageMarkup}
                    <div class="news-featured-content">
                        <h2>${item.title}</h2>
                        ${metaMarkup}
                        <p>${item.description}</p>
                        ${item.url ? '<span class="news-featured-read-more" aria-hidden="true"><span class="news-featured-read-more-icon">&rarr;</span><span>Read more</span></span>' : ''}
                    </div>
                </${cardTag}>
            `;
        }

        const dateMarkup = item.date
            ? `<p class="news-card-date">${item.date}</p>`
            : '';

        const cardTag = item.url ? 'a' : 'article';
        const hrefAttribute = getLinkAttributes(item.url);
        const imageMarkup = item.image
            ? `
                <div class="news-card-image">
                    <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy" />
                </div>
            `
            : '';

        return `
            <${cardTag} class="news-card${isFeatured ? ' news-featured-card' : ''}"${hrefAttribute}>
                ${imageMarkup}
                <div class="news-card-content">
                    ${dateMarkup}
                    <h2>${item.title}</h2>
                    <p>${item.description}</p>
                </div>
            </${cardTag}>
        `;
    };

    const renderPaginationButtons = (currentPage, totalPages) => {
        const visiblePages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

        if (currentPage <= 3) {
            [2, 3, 4].forEach((page) => visiblePages.add(page));
        }

        if (currentPage >= totalPages - 2) {
            [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => visiblePages.add(page));
        }

        const sortedPages = [...visiblePages]
            .filter((page) => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b);

        const paginationItems = [];
        sortedPages.forEach((page, index) => {
            const previousPage = sortedPages[index - 1];

            if (previousPage && page - previousPage === 2) {
                paginationItems.push(previousPage + 1);
            } else if (previousPage && page - previousPage > 2) {
                paginationItems.push(`ellipsis-${previousPage}`);
            }

            paginationItems.push(page);
        });

        const pageButtonMarkup = paginationItems.map((item) => {
            if (typeof item === 'string') {
                return '<span class="news-pagination-ellipsis" aria-hidden="true">&hellip;</span>';
            }

            const currentPageAttribute = item === currentPage ? ' aria-current="page"' : '';
            return `<button type="button" data-page="${item}" aria-label="Go to page ${item}"${currentPageAttribute}>${item}</button>`;
        }).join('');

        return `
            <button class="news-pagination-control" type="button" data-page="${Math.max(currentPage - 1, 1)}" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            ${pageButtonMarkup}
            <button class="news-pagination-control" type="button" data-page="${Math.min(currentPage + 1, totalPages)}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        `;
    };

    const renderPagination = (currentPage, totalPages) => {
        if (totalPages <= 1) {
            paginationControls.forEach((pagination) => {
                pagination.innerHTML = '';
            });
            return;
        }

        const paginationMarkup = renderPaginationButtons(currentPage, totalPages);
        paginationControls.forEach((pagination) => {
            pagination.innerHTML = paginationMarkup;
        });
    };

    const renderPage = (page) => {
        if (!filteredNewsItems.length) {
            if (featuredNews) featuredNews.innerHTML = '';
            newsList.innerHTML = '<p class="news-empty-state">No news matched your search.</p>';
            paginationControls.forEach((pagination) => {
                pagination.innerHTML = '';
            });
            renderResultsCount();
            return;
        }

        const totalPages = getTotalPages(filteredNewsItems);
        const currentPage = Math.min(page, totalPages);
        const { featuredItem, regularItems } = getNewsItemsForPage(currentPage, filteredNewsItems);
        const newsMarkup = regularItems.map((item) => renderNewsItem(item)).join('');

        if (featuredNews) {
            featuredNews.innerHTML = featuredItem ? renderNewsItem(featuredItem, true) : '';
        }
        newsList.innerHTML = newsMarkup;
        renderPagination(currentPage, totalPages);
        renderResultsCount();

        if (currentPage !== page) {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set('page', currentPage);
            window.history.replaceState({}, '', nextUrl);
        }
    };

    const goToPage = (page) => {
        const nextUrl = new URL(window.location.href);

        if (page === 1) {
            nextUrl.searchParams.delete('page');
        } else {
            nextUrl.searchParams.set('page', page);
        }

        window.history.pushState({}, '', nextUrl);
        renderPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    paginationControls.forEach((pagination) => {
        pagination.addEventListener('click', (event) => {
            const pageButton = event.target.closest('button[data-page]');
            if (!pageButton || pageButton.disabled) return;

            goToPage(Number.parseInt(pageButton.dataset.page, 10));
        });
    });

    const applyFilters = () => {
        updateFilteredNewsItems();
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('page');
        window.history.replaceState({}, '', nextUrl);
        renderPage(1);
    };

    searchInput?.addEventListener('input', applyFilters);

    const closeYearMenu = () => {
        yearFilter?.classList.remove('is-open');
        yearToggle?.setAttribute('aria-expanded', 'false');
    };

    const openYearMenu = () => {
        yearFilter?.classList.add('is-open');
        yearToggle?.setAttribute('aria-expanded', 'true');
    };

    yearToggle?.addEventListener('click', () => {
        if (yearFilter?.classList.contains('is-open')) {
            closeYearMenu();
        } else {
            openYearMenu();
        }
    });

    yearMenu?.addEventListener('click', (event) => {
        const option = event.target.closest('button[data-year]');
        if (!option) return;

        selectedYear = option.dataset.year || '';
        if (yearToggleLabel) yearToggleLabel.textContent = selectedYear || 'All years';
        yearMenu.querySelectorAll('button[data-year]').forEach((button) => {
            button.setAttribute('aria-selected', String(button === option));
        });
        closeYearMenu();
        applyFilters();
    });

    document.addEventListener('click', (event) => {
        if (!yearFilter?.contains(event.target)) {
            closeYearMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeYearMenu();
    });

    newsSearch?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    window.addEventListener('popstate', () => {
        renderPage(getPageFromUrl());
    });

    populateYearFilter();
    updateFilteredNewsItems();
    renderPage(getPageFromUrl());
});
