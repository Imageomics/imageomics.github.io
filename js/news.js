document.addEventListener('DOMContentLoaded', () => {
    const FIRST_PAGE_REGULAR_CARD_COUNT = 9;
    const FOLLOWING_PAGE_CARD_COUNT = 12;

    const featuredNewsItem = {
        title: 'Imageomics Digital Digest, Issue 9',
        date: 'Posted: May 26, 2026',
        category: 'Digital Digest Newsletter, Issue 9',
        year: 2026,
        image: '../news-images/2026-news-images/Imageomics-digital-digest-issue-9.png',
        imageAlt: 'Imageomics Digital Digest Newsletter Issue 9 cover',
        description: 'The 9th edition highlights key moments from the Imageomics community, including the Imageomics Conference, recent awards, and community milestones.',
        url: 'news/imageomics-digital-digest-issue-9.html',
        fullIssueUrl: 'https://www.canva.com/design/DAHItrMjkRU/zgB1RAtzRiJrCjmrlbpQ7g/view?utm_content=DAHItrMjkRU&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hff4dc098fe'
    };

    const unsortedNewsItems = [
        featuredNewsItem,
        {
            title: 'Jenna Kline Participates in Global Conference',
            date: 'Posted: May 22, 2026',
            year: 2026,
            description: 'Jenna Kline represented the Imageomics Institute at the Global Conservation Tech and Drone Forum, speaking on how AI and data can scale species protection.',
            url: 'news/jenna-kline-global-conference.html'
        },
        {
            title: 'Inside the First Imageomics Conference',
            date: 'Posted: May 14, 2026',
            year: 2026,
            image: '../news-images/2026-news-images/inside-first-imageomics.jpg',
            imageAlt: 'Group photo from the first Imageomics Conference',
            description: 'Researchers, technologists, conservationists, and students gathered for the first-ever Imageomics Conference to explore how images and machine learning can transform biodiversity science.',
            url: 'news/inside-first-imageomics-conference.html'
        },
        {
            title: 'Imageomics Publication Awarded the Robert May Prize',
            date: 'Posted: April 17, 2026',
            year: 2026,
            image: '../news-images/2026-news-images/robert-may-prize.webp',
            imageAlt: 'Computer vision and drone analysis overlay on animals in a landscape',
            description: 'Imageomics researcher Jenna Kline has been recognized for her work on new methods to study animal behavior using drones, computer vision, and edge AI.',
            url: 'news/robert-may-prize.html'
        },
        {
            title: 'Jenna Kline Named 2025-2026 Presidential Fellow',
            date: 'Posted: January 21, 2026',
            year: 2026,
            image: '../news-images/2026-news-images/O-H-I-O-Kenya.jpg',
            imageAlt: 'Ohio State students and faculty on the Kenya savannah making the O-H-I-O sign',
            description: 'Jenna Kline has been named a 2025-2026 Presidential Fellow, becoming the first Imageomics PhD candidate to receive this prestigious award.',
            url: 'news/jenna-kline-presidential-fellow.html'
        },
        {
            title: 'Imageomics Publication Shortlisted for the Robert May Prize',
            date: 'Posted: March 9, 2026',
            year: 2026,
            image: '../news-images/2026-news-images/zebra_drones.jpg',
            imageAlt: 'Illustration of zebras, drone sensing, and behavior levels',
            description: 'Imageomics researchers have been shortlisted for a major international ecology award for their work on new methods to study animal behavior using advanced technology.',
            url: 'news/robert-may-prize-shortlist.html'
        },
        {
            title: 'Imageomics Digital Digest, Issue 8',
            date: 'Posted: March 9, 2026',
            category: 'Digital Digest Newsletter, Issue 8',
            year: 2026,
            image: '../news-images/2026-news-images/Imageomics-Digital-Digest-Issue%208,%202026_0.png',
            imageAlt: 'Imageomics Digital Digest Newsletter Issue 8 cover',
            description: 'Issue 8 highlights Imageomics milestones across NeurIPS, the First Imageomics Conference, AI-ready ecological data infrastructure, and new computer vision methods.',
            url: 'news/imageomics-digital-digest-issue-8.html',
            fullIssueUrl: 'https://www.canva.com/design/DAHCeBt6Rdo/6ImQ7tJYES6KJh3gmW6M7A/view?utm_content=DAHCeBt6Rdo&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h75ac60b15a'
        }
    ];

    const parseNewsDate = (dateString) => {
        const normalizedDate = dateString?.replace(/^Posted:\s*/i, '') || '';
        const parsedDate = new Date(normalizedDate);
        return Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
    };

    const newsItems = [...unsortedNewsItems].sort((a, b) => parseNewsDate(b.date) - parseNewsDate(a.date));
    const latestNewsItem = newsItems[0];

    const newsList = document.querySelector('#news-list');
    const pagination = document.querySelector('#news-pagination');
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

    const renderNewsItem = (item, isFeatured = false) => {
        if (isFeatured) {
            const imageMarkup = item.image
                ? `
                    <a class="news-featured-image-link" href="${item.url || item.image}" aria-label="Read ${item.title}">
                        <img src="${item.image}" alt="${item.imageAlt || item.title}" />
                    </a>
                `
                : '';
            const metaMarkup = [item.date, item.category]
                .filter(Boolean)
                .map((text) => `<p class="news-featured-meta">${text}</p>`)
                .join('');

            return `
                <article class="news-card news-featured-card">
                    ${imageMarkup}
                    <div class="news-featured-content">
                        <h2>${item.url ? `<a href="${item.url}">${item.title}</a>` : item.title}</h2>
                        ${metaMarkup}
                        <p>${item.description}</p>
                    </div>
                </article>
            `;
        }

        const dateMarkup = item.date
            ? `<p class="news-card-date">${item.date}</p>`
            : '';

        const cardTag = item.url ? 'a' : 'article';
        const hrefAttribute = item.url ? ` href="${item.url}"` : '';

        return `
            <${cardTag} class="news-card${isFeatured ? ' news-featured-card' : ''}"${hrefAttribute}>
                ${dateMarkup}
                <h2>${item.title}</h2>
                <p>${item.description}</p>
            </${cardTag}>
        `;
    };

    const renderPaginationButtons = (currentPage, totalPages) => {
        const pageButtonMarkup = Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const currentPageAttribute = page === currentPage ? ' aria-current="page"' : '';
            return `<button type="button" data-page="${page}"${currentPageAttribute}>${page}</button>`;
        }).join('');

        return `
            <button class="news-pagination-control" type="button" data-page="${Math.max(currentPage - 1, 1)}" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            ${pageButtonMarkup}
            <button class="news-pagination-control" type="button" data-page="${Math.min(currentPage + 1, totalPages)}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        `;
    };

    const renderPagination = (currentPage, totalPages) => {
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        pagination.innerHTML = renderPaginationButtons(currentPage, totalPages);
    };

    const renderPage = (page) => {
        if (!filteredNewsItems.length) {
            newsList.innerHTML = '<p class="news-empty-state">No news matched your search.</p>';
            if (pagination) pagination.innerHTML = '';
            renderResultsCount();
            return;
        }

        const totalPages = getTotalPages(filteredNewsItems);
        const currentPage = Math.min(page, totalPages);
        const { featuredItem, regularItems } = getNewsItemsForPage(currentPage, filteredNewsItems);
        const newsMarkup = [
            featuredItem ? renderNewsItem(featuredItem, true) : '',
            ...regularItems.map((item) => renderNewsItem(item))
        ].join('');

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

    pagination?.addEventListener('click', (event) => {
        const pageButton = event.target.closest('button[data-page]');
        if (!pageButton || pageButton.disabled) return;

        goToPage(Number.parseInt(pageButton.dataset.page, 10));
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
