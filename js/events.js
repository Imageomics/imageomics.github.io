document.addEventListener('DOMContentLoaded', () => {
    const events = [
        {
            title: 'Experiential Introduction to AI and Ecology Course - Part 2: Field Course',
            date: 'Mon, Jan 4 - Sun, Jan 24 2027, All day (Tentative Dates for Field Course Portion)',
            url: 'events/experiential-introduction-ai-ecology-field-course.html'
        },
    ];

    const main = document.querySelector('main');
    if (!main) return;

    const renderEvent = (event) => {
        return `
            <a class="stub-card" href="${event.url}">
                <p class="stub-kicker">${event.date}</p>
                <h2>${event.title}</h2>
            </a>
        `;
    };

    const eventsMarkup = events.length
        ? events.map(renderEvent).join('')
        : '<p>New events will be posted here soon.</p>';

    main.className = 'page-shell';
    main.innerHTML = `
        <section class="stub-hero">
            <span class="stub-kicker">Events</span>
            <h1>Events</h1>
            <p>Explore upcoming Imageomics Institute talks, workshops, conferences, and community gatherings.</p>
        </section>
        <section class="stub-page" aria-label="Events list">
            <div class="stub-grid">
                ${eventsMarkup}
            </div>
        </section>
    `;
});
