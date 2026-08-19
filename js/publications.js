document.addEventListener('DOMContentLoaded', () => {
    const yearNav = document.querySelector('.publications-year-nav');
    const yearSections = [...document.querySelectorAll('.publication-year')];
    const searchForm = document.querySelector('.publications-toolbar');
    const searchInput = document.querySelector('#publications-search');
    const resultsCount = document.querySelector('.publications-results-count');
    if (!yearNav || !yearSections.length || !searchInput) return;

    const availableYears = new Set(yearSections.map((section) => section.dataset.year));
    const emptyState = document.createElement('p');
    let activeYear = '';

    emptyState.className = 'publications-empty-state';
    emptyState.textContent = 'No publications match this search.';
    emptyState.hidden = true;
    document.querySelector('.publications-years')?.appendChild(emptyState);

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
        let visibleCount = 0;

        publications.forEach((publication) => {
            const matches = !query || publication.textContent.toLowerCase().includes(query);
            publication.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        if (resultsCount) {
            resultsCount.textContent = query
                ? `${visibleCount} of ${publications.length} publications`
                : `${publications.length} publications`;
        }

        emptyState.hidden = visibleCount !== 0;
    };

    const showYear = (year) => {
        activeYear = year;

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

    searchInput.addEventListener('input', applySearch);

    const requestedYear = new URLSearchParams(window.location.search).get('year');
    showYear(availableYears.has(requestedYear) ? requestedYear : yearSections[0].dataset.year);
});
