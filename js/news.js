document.addEventListener('DOMContentLoaded', () => {
    const newsItems = [
        {
            title: 'Jenna Kline Participates in Global Conference',
            date: 'Posted: May 22, 2026',
            description: ''
        },
        
    ];

    const main = document.querySelector('main');
    if (!main) return;

    const renderNewsItem = (item) => {
        const linkMarkup = item.url
            ? `<a href="${item.url}">${item.linkText || 'Read more'}</a>`
            : '';

        return `
            <article class="stub-card">
                <p class="stub-kicker">${item.date}</p>
                <h2>${item.title}</h2>
                <p>${item.description}</p>
                ${linkMarkup}
            </article>
        `;
    };

    const newsMarkup = newsItems.length
        ? newsItems.map(renderNewsItem).join('')
        : '<p>New stories will be posted here soon.</p>';

    main.className = 'page-shell';
    main.innerHTML = `
        <section class="stub-hero">
            <span class="stub-kicker">News</span>
            <h1>News</h1>
            <p>Read the latest updates, announcements, and stories from the Imageomics Institute.</p>
        </section>
        <section class="stub-page" aria-label="News list">
            <div class="stub-grid">
                ${newsMarkup}
            </div>
        </section>
    `;
});
