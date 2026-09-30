document.addEventListener('DOMContentLoaded', async () => {
    const FIRST_PAGE_REGULAR_CARD_COUNT = 9;
    const FOLLOWING_PAGE_CARD_COUNT = 9;

    const main = document.querySelector('main');
    if (!main) return;

    const loadState = document.querySelector('#events-load-state');
    main.setAttribute('aria-busy', 'true');

    let eventItems;
    try {
        const response = await fetch("../data/events.json");
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        eventItems = await response.json();
        if (!Array.isArray(eventItems)) throw new TypeError("Event data must be an array.");
    } catch (error) {
        console.error("Unable to load event data.", error);
        const errorState = window.ImageomicsStates?.create(
            'error',
            'Events are temporarily unavailable. Please try again later.',
            { tagName: 'p', className: 'events-load-state' }
        );
        if (loadState && errorState) loadState.replaceWith(errorState);
        main.setAttribute('aria-busy', 'false');
        return;
    }

    const splitDateEntries = (dateString) => {
        if (!dateString) return [];

        return dateString
            .split(/,\s+(?=(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+)/)
            .map((date) => date.trim())
            .filter(Boolean);
    };

    const getUniqueValues = (values) => [...new Set(values.filter(Boolean))];

    const formatDateSummary = (dates) => {
        const uniqueDates = getUniqueValues(dates);

        if (uniqueDates.length <= 1) return uniqueDates[0] || '';
        if (uniqueDates.length === 2) return uniqueDates.join(', ');

        return `${uniqueDates[0]} - ${uniqueDates[uniqueDates.length - 1]} (${uniqueDates.length} dates)`;
    };

    const formatEventSchedule = (item) => {
        const scheduleParts = [item.date, item.time].filter(Boolean);
        return scheduleParts.join(' • ');
    };

    const getUniqueEventItems = (items) => {
        const uniqueItems = new Map();

        items.forEach((item) => {
            const key = item.url || `${item.title}-${item.date}`;
            const itemDates = splitDateEntries(item.date);

            if (!uniqueItems.has(key)) {
                uniqueItems.set(key, {
                    ...item,
                    dateEntries: itemDates,
                    allDatesText: item.date || ''
                });
                return;
            }

            const existingItem = uniqueItems.get(key);
            existingItem.dateEntries = getUniqueValues([...existingItem.dateEntries, ...itemDates]);
            existingItem.allDatesText = getUniqueValues([
                existingItem.allDatesText,
                item.date
            ]).join(', ');

            if (!existingItem.description && item.description) {
                existingItem.description = item.description;
            }

            if (!existingItem.image && item.image) {
                existingItem.image = item.image;
                existingItem.imageAlt = item.imageAlt;
            }

            if (!existingItem.time && item.time) {
                existingItem.time = item.time;
            }
        });

        return [...uniqueItems.values()].map((item) => ({
            ...item,
            date: formatDateSummary(item.dateEntries)
        }));
    };

    const COURSE_MODULE_URL_MARKER = 'ai-and-ecology-course-module-';
    const COURSE_SERIES_URL = 'tools-resources/experiential-introduction-ai-ecology-course-2026-2027.html';
    const FEATURED_UPCOMING_WINDOW_DAYS = 14;
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

    const collapseCourseSeries = (items) => {
        const seriesItems = items
            .filter((item) => item.url?.includes(COURSE_MODULE_URL_MARKER))
            .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (seriesItems.length < 2) return items;

        const firstSession = seriesItems[0];
        const lastSession = seriesItems[seriesItems.length - 1];
        const seriesTimes = getUniqueValues(seriesItems.map((item) => item.time));
        const lastDateWithoutWeekday = lastSession.date.replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+/, '');
        const seriesItem = {
            title: 'Experiential Introduction to AI and Ecology',
            url: COURSE_SERIES_URL,
            date: `${firstSession.date} - ${lastDateWithoutWeekday} (${seriesItems.length} sessions)`,
            description: 'Weekly virtual course sessions from August through November 2026.',
            image: firstSession.image,
            imageAlt: firstSession.imageAlt,
            startDate: firstSession.startDate,
            endDate: lastSession.startDate,
            time: seriesTimes.length === 1 ? seriesTimes[0] : '',
            allDatesText: seriesItems.map((item) => formatEventSchedule({
                ...item,
                date: item.allDatesText || item.date
            })).join(', '),
            searchText: seriesItems.map((item) => `${item.title} ${item.description || ''}`).join(' '),
            seriesItems
        };

        return items
            .filter((item) => !item.url?.includes(COURSE_MODULE_URL_MARKER))
            .concat(seriesItem);
    };

    const parseEventDate = (startDate) => {
        const parsedDate = new Date(`${startDate}T00:00:00`);
        return Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
    };

    const getToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const getFeaturedEventSelection = (items) => {
        const today = getToday();
        const featureCandidates = items.flatMap((item) => item.seriesItems?.length ? item.seriesItems : [item]);
        const timedCandidates = featureCandidates.map((item) => {
            const startDate = parseEventDate(item.startDate);
            const endDate = parseEventDate(item.endDate || item.startDate);
            return { item, startDate, endDate };
        });

        const happeningNow = timedCandidates
            .filter(({ startDate, endDate }) => startDate <= today && endDate >= today)
            .sort((a, b) => b.startDate - a.startDate)[0];

        if (happeningNow) {
            return { item: happeningNow.item, status: 'Happening Now' };
        }

        const nextUpcoming = timedCandidates
            .filter(({ startDate }) => startDate > today)
            .sort((a, b) => a.startDate - b.startDate)[0];

        if (!nextUpcoming) return null;

        const daysUntilStart = Math.round((nextUpcoming.startDate - today) / MILLISECONDS_PER_DAY);
        const status = daysUntilStart <= FEATURED_UPCOMING_WINDOW_DAYS
            ? 'Happening Soon'
            : 'Upcoming Event';

        return { item: nextUpcoming.item, status };
    };

    const uniqueEventItems = collapseCourseSeries(getUniqueEventItems(eventItems))
        .sort((a, b) => parseEventDate(b.startDate) - parseEventDate(a.startDate));
    let filteredEventItems = [...uniqueEventItems];
    let selectedYear = '';
    let featuredEvent = null;
    let featuredEventStatus = '';
    let regularEventItems = [];

    loadState?.remove();
    main.setAttribute('aria-busy', 'false');

    const gradientStage = main.querySelector('.news-gradient-stage');
    const featuredSlot = document.createElement('div');
    featuredSlot.className = 'event-featured-slot';
    if (gradientStage) {
        gradientStage.appendChild(featuredSlot);
    }

    const controlsSection = document.createElement('section');
    controlsSection.className = 'news-controls-section';
    controlsSection.setAttribute('aria-label', 'Events search and filters');
    controlsSection.innerHTML = `
        <form class="news-search" role="search">
            <label for="events-search-input">Search events</label>
            <input id="events-search-input" type="search" placeholder="Search events" autocomplete="off" />
            <div class="news-year-dropdown" id="events-year-filter">
                <button class="news-year-toggle" type="button" aria-haspopup="listbox" aria-expanded="false">
                    <span>All years</span>
                </button>
                <div class="news-year-menu" role="listbox" aria-label="Filter events by year"></div>
            </div>
        </form>
        <p class="news-results-count" id="events-results-count" aria-live="polite"></p>
    `;

    const listSection = document.createElement('section');
    listSection.className = 'stub-page news-list-section';
    listSection.setAttribute('aria-label', 'Events list');

    const eventsList = document.createElement('div');
    eventsList.className = 'news-grid';
    eventsList.id = 'events-list';

    const paginationControls = [
        createPagination('Events pages', 'news-pagination news-pagination-bottom-previous news-pagination-previous')
    ];

    listSection.appendChild(eventsList);
    paginationControls.forEach((pagination) => {
        listSection.appendChild(pagination);
    });
    main.appendChild(controlsSection);
    main.appendChild(listSection);

    const eventSearch = controlsSection.querySelector('.news-search');
    const searchInput = controlsSection.querySelector('#events-search-input');
    const yearFilter = controlsSection.querySelector('#events-year-filter');
    const yearToggle = yearFilter?.querySelector('.news-year-toggle');
    const yearToggleLabel = yearToggle?.querySelector('span');
    const yearMenu = yearFilter?.querySelector('.news-year-menu');
    const resultsCount = controlsSection.querySelector('#events-results-count');

    function createPagination(label, className) {
        const nav = document.createElement('nav');
        nav.className = className;
        nav.setAttribute('aria-label', label);
        return nav;
    }

    const getPageFromUrl = () => {
        const page = Number.parseInt(new URLSearchParams(window.location.search).get('page'), 10);
        return Number.isInteger(page) && page > 0 ? page : 1;
    };

    const getItemYears = (item) => [...new Set((item.allDatesText || item.date).match(/\b20\d{2}\b/g) || [])];

    const getFilteredEventItems = () => {
        const query = searchInput?.value.trim().toLowerCase() || '';

        return uniqueEventItems.filter((item) => {
            const itemYears = getItemYears(item);
            const searchableDateText = item.allDatesText || item.date;
            const matchesYear = !selectedYear || itemYears.includes(selectedYear);
            const matchesQuery = !query ||
                item.title.toLowerCase().includes(query) ||
                String(item.description || '').toLowerCase().includes(query) ||
                String(item.searchText || '').toLowerCase().includes(query) ||
                String(item.time || '').toLowerCase().includes(query) ||
                searchableDateText.toLowerCase().includes(query);

            return matchesYear && matchesQuery;
        });
    };

    const updateFilteredEventItems = () => {
        filteredEventItems = getFilteredEventItems();
    };

    const updateFeaturedAndRegularEvents = () => {
        const featuredSelection = getFeaturedEventSelection(filteredEventItems);
        featuredEvent = featuredSelection?.item || null;
        featuredEventStatus = featuredSelection?.status || '';
        regularEventItems = featuredEvent
            ? filteredEventItems.filter((item) => item !== featuredEvent)
            : filteredEventItems;
    };

    const renderResultsCount = () => {
        if (!resultsCount) return;

        const hasActiveFilter = Boolean(searchInput?.value.trim() || selectedYear);
        if (!hasActiveFilter) {
            resultsCount.textContent = '';
            return;
        }

        const resultLabel = filteredEventItems.length === 1 ? 'result' : 'results';
        resultsCount.textContent = `${filteredEventItems.length} ${resultLabel}`;
    };

    const populateYearFilter = () => {
        if (!yearMenu) return;

        const yearOptions = [...new Set(uniqueEventItems.flatMap(getItemYears))]
            .sort((a, b) => Number(b) - Number(a))
            .map((year) => `<button type="button" role="option" data-year="${year}" aria-selected="false">${year}</button>`)
            .join('');

        yearMenu.innerHTML = `<button type="button" role="option" data-year="" aria-selected="true">All years</button>${yearOptions}`;
    };

    const getTotalPages = () => {
        if (!featuredEvent) {
            return Math.max(Math.ceil(regularEventItems.length / FOLLOWING_PAGE_CARD_COUNT), 1);
        }

        if (regularEventItems.length <= FIRST_PAGE_REGULAR_CARD_COUNT) return 1;

        return 1 + Math.ceil((regularEventItems.length - FIRST_PAGE_REGULAR_CARD_COUNT) / FOLLOWING_PAGE_CARD_COUNT);
    };

    const getEventsForPage = (page) => {
        if (featuredEvent && page === 1) {
            return regularEventItems.slice(0, FIRST_PAGE_REGULAR_CARD_COUNT);
        }

        const startIndex = featuredEvent
            ? FIRST_PAGE_REGULAR_CARD_COUNT + ((page - 2) * FOLLOWING_PAGE_CARD_COUNT)
            : (page - 1) * FOLLOWING_PAGE_CARD_COUNT;

        return regularEventItems.slice(startIndex, startIndex + FOLLOWING_PAGE_CARD_COUNT);
    };

    const getFeaturedDateParts = (dateString) => {
        const monthMatch = dateString.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\b/i);
        const yearMatch = dateString.match(/\b(20\d{2})\b/);

        return {
            month: monthMatch?.[1]?.slice(0, 3).toUpperCase() || 'EVENT',
            day: monthMatch?.[2] || '',
            year: yearMatch?.[1] || ''
        };
    };

    const setImagePresentation = (image, imageWrap, baseClassName) => {
        const updateImagePresentation = () => {
            const ratio = image.naturalWidth / image.naturalHeight;
            const isSmallAsset = image.naturalWidth <= 180 && image.naturalHeight <= 180;
            const isAwkwardCardRatio = ratio < 1.25 || ratio > 2.1;

            if (isSmallAsset) {
                imageWrap.classList.add(`${baseClassName}--contain`, `${baseClassName}--logo`);
                return;
            }

            if (isAwkwardCardRatio) {
                imageWrap.classList.add(`${baseClassName}--contain`);
            }
        };

        if (image.complete && image.naturalWidth) {
            updateImagePresentation();
        } else {
            image.addEventListener('load', updateImagePresentation, { once: true });
        }
    };

    const renderFeaturedEvent = (item) => {
        if (!item) {
            featuredSlot.innerHTML = '';
            return;
        }

        const dateParts = getFeaturedDateParts(item.date);
        const card = document.createElement('a');
        card.className = `event-featured-card event-featured-card--calendar${item.image ? '' : ' event-featured-card--no-image'}`;
        card.href = item.url;

        const date = document.createElement('div');
        date.className = 'event-featured-date';
        date.innerHTML = `
            <span>${dateParts.month}</span>
            ${dateParts.day ? `<strong>${dateParts.day}</strong>` : ''}
            ${dateParts.year ? `<span>${dateParts.year}</span>` : ''}
        `;

        const content = document.createElement('div');
        content.className = 'event-featured-content';

        const label = document.createElement('p');
        label.className = 'event-featured-label';
        label.textContent = featuredEventStatus;
        content.appendChild(label);

        const title = document.createElement('h2');
        title.textContent = item.title;
        content.appendChild(title);

        if (item.date || item.time) {
            const meta = document.createElement('p');
            meta.className = 'event-featured-meta';
            meta.textContent = formatEventSchedule(item);
            content.appendChild(meta);
        }

        if (item.description) {
            const description = document.createElement('p');
            description.textContent = item.description;
            content.appendChild(description);
        }

        const cta = document.createElement('span');
        cta.className = 'event-featured-cta';
        cta.setAttribute('aria-hidden', 'true');
        cta.innerHTML = '<span>View event</span><span class="event-featured-cta-icon">&rarr;</span>';
        content.appendChild(cta);

        card.appendChild(date);
        card.appendChild(content);

        if (item.image) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'event-featured-image';

            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.imageAlt || item.title;
            image.loading = 'lazy';

            setImagePresentation(image, imageWrap, 'event-featured-image');
            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        }

        featuredSlot.replaceChildren(card);
    };

    const renderEventCard = (item) => {
        if (item.seriesItems?.length) {
            const card = document.createElement('article');
            card.className = 'news-card event-series-card';

            if (item.image) {
                const imageLink = document.createElement('a');
                imageLink.className = 'news-card-image event-series-image';
                imageLink.href = item.url;
                imageLink.setAttribute('aria-label', `Learn more about ${item.title}`);

                const image = document.createElement('img');
                image.src = item.image;
                image.alt = item.imageAlt || item.title;
                image.loading = 'lazy';

                setImagePresentation(image, imageLink, 'news-card-image');
                imageLink.appendChild(image);
                card.appendChild(imageLink);
            }

            const content = document.createElement('div');
            content.className = 'news-card-content';

            const date = document.createElement('p');
            date.className = 'news-card-date';
            date.textContent = formatEventSchedule(item);
            content.appendChild(date);

            const title = document.createElement('h2');
            const titleLink = document.createElement('a');
            titleLink.href = item.url;
            titleLink.textContent = item.title;
            title.appendChild(titleLink);
            content.appendChild(title);

            const description = document.createElement('p');
            description.textContent = item.description;
            content.appendChild(description);

            const sessionDetails = document.createElement('details');
            sessionDetails.className = 'event-series-sessions';

            const summary = document.createElement('summary');
            summary.textContent = `View ${item.seriesItems.length} sessions`;
            sessionDetails.appendChild(summary);

            const sessionList = document.createElement('ol');
            item.seriesItems.forEach((session) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = session.url;
                link.textContent = session.title;

                const sessionDate = document.createElement('span');
                sessionDate.textContent = formatEventSchedule(session);

                listItem.appendChild(link);
                listItem.appendChild(sessionDate);
                sessionList.appendChild(listItem);
            });

            sessionDetails.appendChild(sessionList);
            content.appendChild(sessionDetails);
            card.appendChild(content);
            return card;
        }

        const card = document.createElement('a');
        card.className = 'news-card';
        card.href = item.url;

        if (item.image) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'news-card-image';

            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.imageAlt || item.title;
            image.loading = 'lazy';

            setImagePresentation(image, imageWrap, 'news-card-image');
            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        }

        const content = document.createElement('div');
        content.className = 'news-card-content';

        if (item.date || item.time) {
            const date = document.createElement('p');
            date.className = 'news-card-date';
            date.textContent = formatEventSchedule(item);
            content.appendChild(date);
        }

        const title = document.createElement('h2');
        title.textContent = item.title;
        content.appendChild(title);

        if (item.description) {
            const description = document.createElement('p');
            description.textContent = item.description;
            content.appendChild(description);
        }

        card.appendChild(content);
        return card;
    };

    const renderPaginationButtons = (currentPage, totalPages) => {
        const isMobile = window.matchMedia('(max-width: 760px)').matches;
        const visiblePages = isMobile
            ? new Set([1, totalPages, currentPage])
            : new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

        if (isMobile && currentPage === 1) {
            visiblePages.add(2);
        } else if (isMobile && currentPage === totalPages) {
            visiblePages.add(totalPages - 1);
        } else if (!isMobile && currentPage <= 3) {
            [2, 3, 4].forEach((page) => visiblePages.add(page));
        }

        if (!isMobile && currentPage >= totalPages - 2) {
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
            return `<button class="news-pagination-page" type="button" data-page="${item}" aria-label="Go to page ${item}"${currentPageAttribute}>${item}</button>`;
        }).join('');

        return `
            <button class="news-pagination-control" type="button" data-page="${Math.max(currentPage - 1, 1)}" aria-label="Previous events page" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            ${pageButtonMarkup}
            <button class="news-pagination-control" type="button" data-page="${Math.min(currentPage + 1, totalPages)}" aria-label="Next events page" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
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
        if (!filteredEventItems.length) {
            renderFeaturedEvent(null);
            const hasActiveFilter = Boolean(searchInput?.value.trim() || selectedYear);
            window.ImageomicsStates?.render(
                eventsList,
                'empty',
                hasActiveFilter ? 'No events matched your search.' : 'No events are available right now.',
                { tagName: 'p' }
            );
            paginationControls.forEach((pagination) => {
                pagination.innerHTML = '';
            });
            renderResultsCount();
            return;
        }

        const totalPages = getTotalPages();
        const currentPage = Math.min(page, totalPages);
        const pageEvents = getEventsForPage(currentPage);

        renderFeaturedEvent(currentPage === 1 ? featuredEvent : null);
        eventsList.innerHTML = '';
        eventsList.setAttribute('aria-busy', 'false');
        pageEvents.forEach((item) => {
            eventsList.appendChild(renderEventCard(item));
        });

        renderPagination(currentPage, totalPages);
        renderResultsCount();

        if (currentPage !== page) {
            const nextUrl = new URL(window.location.href);

            if (currentPage === 1) {
                nextUrl.searchParams.delete('page');
            } else {
                nextUrl.searchParams.set('page', currentPage);
            }

            window.history.replaceState({}, '', nextUrl);
        }
    };

    const goToPage = (page) => {
        const totalPages = getTotalPages();
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const nextUrl = new URL(window.location.href);

        if (currentPage === 1) {
            nextUrl.searchParams.delete('page');
        } else {
            nextUrl.searchParams.set('page', currentPage);
        }

        window.history.pushState({}, '', nextUrl);
        renderPage(currentPage);
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
        updateFilteredEventItems();
        updateFeaturedAndRegularEvents();

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

    const getYearOptions = () => [...(yearMenu?.querySelectorAll('button[data-year]') || [])];

    const focusYearOption = (index) => {
        const options = getYearOptions();
        if (!options.length) return;

        const wrappedIndex = (index + options.length) % options.length;
        options[wrappedIndex].focus();
    };

    yearToggle?.addEventListener('click', () => {
        if (yearFilter?.classList.contains('is-open')) {
            closeYearMenu();
        } else {
            openYearMenu();
        }
    });

    yearToggle?.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        openYearMenu();

        const options = getYearOptions();
        const selectedIndex = options.findIndex((option) => option.getAttribute('aria-selected') === 'true');

        if (event.key === 'End') {
            focusYearOption(options.length - 1);
        } else if (event.key === 'ArrowUp') {
            focusYearOption(selectedIndex >= 0 ? selectedIndex : options.length - 1);
        } else {
            focusYearOption(event.key === 'Home' ? 0 : Math.max(selectedIndex, 0));
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

    yearMenu?.addEventListener('keydown', (event) => {
        const option = event.target.closest('button[data-year]');
        if (!option) return;

        const options = getYearOptions();
        const currentIndex = options.indexOf(option);

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeYearMenu();
            yearToggle?.focus();
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            option.click();
            yearToggle?.focus();
            return;
        }

        const destinationByKey = {
            ArrowDown: currentIndex + 1,
            ArrowUp: currentIndex - 1,
            Home: 0,
            End: options.length - 1
        };

        if (!(event.key in destinationByKey)) return;

        event.preventDefault();
        focusYearOption(destinationByKey[event.key]);
    });

    document.addEventListener('click', (event) => {
        if (!yearFilter?.contains(event.target)) {
            closeYearMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeYearMenu();
    });

    eventSearch?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    window.addEventListener('popstate', () => {
        renderPage(getPageFromUrl());
    });

    populateYearFilter();
    updateFilteredEventItems();
    updateFeaturedAndRegularEvents();
    renderPage(getPageFromUrl());
});
