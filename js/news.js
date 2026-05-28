document.addEventListener('DOMContentLoaded', () => {
    const newsItems = [
        {
            title: 'Jenna Kline Participates in Global Conference',
            date: 'Posted: May 22, 2026',
            description: ''
        },
        
    ];

    const newsList = document.querySelector('#news-list');
    if (!newsList) return;

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

    newsList.innerHTML = newsMarkup;
});
