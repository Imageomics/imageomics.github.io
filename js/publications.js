document.addEventListener('DOMContentLoaded', () => {
    const yearNav = document.querySelector('.publications-year-nav');
    const yearSections = [...document.querySelectorAll('.publication-year')];
    const searchForm = document.querySelector('.publications-toolbar');
    const searchInput = document.querySelector('#publications-search');
    const resultsCount = document.querySelector('.publications-results-count');
    const yearsContainer = document.querySelector('.publications-years');
    if (!yearNav || !yearSections.length || !searchInput) return;

    const MOBILE_PAGE_SIZE = 6;
    const mobilePublications = window.matchMedia('(max-width: 760px)');
    const availableYears = new Set(yearSections.map((section) => section.dataset.year));
    const emptyState = document.createElement('p');
    const pagination = document.createElement('nav');
    let activeYear = '';
    let activePage = 1;

    emptyState.className = 'publications-empty-state content-state content-state--empty';
    emptyState.textContent = 'No publications match this search.';
    emptyState.setAttribute('role', 'status');
    emptyState.setAttribute('aria-live', 'polite');
    emptyState.hidden = true;
    pagination.className = 'publications-pagination';
    pagination.setAttribute('aria-label', 'Publication pages');
    yearsContainer?.append(emptyState, pagination);

    yearSections.forEach((section) => {
        const year = section.dataset.year;
        const publicationCount = section.querySelectorAll('.publications-list > p').length;
        const button = document.createElement('button');
        const yearLabel = document.createElement('span');
        const countLabel = document.createElement('span');

        button.type = 'button';
        button.className = 'publications-year-button';
        button.dataset.year = year;
        button.setAttribute('aria-controls', `publications-${year}`);
        button.setAttribute('aria-pressed', 'false');

        yearLabel.textContent = year;
        countLabel.className = 'publications-year-count';
        countLabel.textContent = publicationCount;
        countLabel.setAttribute('aria-label', `${publicationCount} publications`);

        button.append(yearLabel, countLabel);
        yearNav.appendChild(button);
        section.id = `publications-${year}`;
    });

    const applySearch = () => {
        const activeSection = yearSections.find((section) => section.dataset.year === activeYear);
        if (!activeSection) return;

        const query = searchInput.value.trim().toLowerCase();
        const publications = [...activeSection.querySelectorAll('.publications-list > p')];
        const matchingPublications = publications.filter((publication) => (
            !query || publication.textContent.toLowerCase().includes(query)
        ));
        const totalPages = mobilePublications.matches
            ? Math.max(Math.ceil(matchingPublications.length / MOBILE_PAGE_SIZE), 1)
            : 1;
        activePage = Math.min(activePage, totalPages);
        const firstVisibleIndex = (activePage - 1) * MOBILE_PAGE_SIZE;
        const visiblePublications = mobilePublications.matches
            ? matchingPublications.slice(firstVisibleIndex, firstVisibleIndex + MOBILE_PAGE_SIZE)
            : matchingPublications;
        const visibleSet = new Set(visiblePublications);

        publications.forEach((publication) => {
            publication.hidden = !visibleSet.has(publication);
        });

        if (resultsCount) {
            resultsCount.textContent = query
                ? `${matchingPublications.length} of ${publications.length} publications`
                : `${publications.length} publications`;
        }

        emptyState.hidden = matchingPublications.length !== 0;

        if (!mobilePublications.matches || totalPages <= 1 || !matchingPublications.length) {
            pagination.innerHTML = '';
            return;
        }

        const pageOptions = Array.from({ length: totalPages }, (_, index) => index + 1)
            .map((page) => `<option value="${page}"${page === activePage ? ' selected' : ''}>${page}</option>`)
            .join('');

        pagination.innerHTML = `
            <button type="button" data-publications-page="${Math.max(activePage - 1, 1)}" aria-label="Previous publications page" ${activePage === 1 ? 'disabled' : ''}>Previous</button>
            <label>
                <span>Page</span>
                <select aria-label="Choose publications page">${pageOptions}</select>
                <span>of ${totalPages}</span>
            </label>
            <button type="button" data-publications-page="${Math.min(activePage + 1, totalPages)}" aria-label="Next publications page" ${activePage === totalPages ? 'disabled' : ''}>Next</button>
        `;
    };

    const showPublicationPage = (page) => {
        activePage = page;
        applySearch();

        const heading = yearSections.find((section) => section.dataset.year === activeYear)?.querySelector('h2');
        if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const showYear = (year) => {
        activeYear = year;
        activePage = 1;

        yearSections.forEach((section) => {
            section.hidden = section.dataset.year !== year;
        });

        yearNav.querySelectorAll('.publications-year-button').forEach((button) => {
            const isActive = button.dataset.year === year;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        searchInput.placeholder = `Search ${year} titles, authors, or venues`;
        applySearch();

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('year', year);
        window.history.replaceState({}, '', nextUrl);
    };

    yearNav.addEventListener('click', (event) => {
        const button = event.target.closest('.publications-year-button');
        if (!button) return;

        showYear(button.dataset.year);
    });

    searchForm?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    searchInput.addEventListener('input', () => {
        activePage = 1;
        applySearch();
    });

    pagination.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-publications-page]');
        if (!button || button.disabled) return;

        showPublicationPage(Number.parseInt(button.dataset.publicationsPage, 10));
    });

    pagination.addEventListener('change', (event) => {
        const select = event.target.closest('select');
        if (!select) return;

        showPublicationPage(Number.parseInt(select.value, 10));
    });

    mobilePublications.addEventListener('change', () => {
        activePage = 1;
        applySearch();
    });

    const requestedYear = new URLSearchParams(window.location.search).get('year');
    showYear(availableYears.has(requestedYear) ? requestedYear : yearSections[0].dataset.year);
});
