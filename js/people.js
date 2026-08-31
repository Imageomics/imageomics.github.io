document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.people-grid .person-card'));
    if (!cards.length) return;

    const mobileDirectory = window.matchMedia('(max-width: 620px)');

    const setExpanded = (card, isExpanded) => {
        const button = card.querySelector('.person-card-toggle');
        const affiliation = card.querySelector('.person-affiliation');
        const name = card.querySelector('h3')?.textContent.trim() || 'this person';

        card.classList.toggle('is-expanded', isExpanded);
        button?.setAttribute('aria-expanded', String(isExpanded));
        if (button) {
            button.textContent = isExpanded ? 'Close details' : 'Details';
            button.setAttribute('aria-label', `${isExpanded ? 'Hide' : 'Show'} details for ${name}`);
        }

        if (affiliation) {
            affiliation.hidden = mobileDirectory.matches && !isExpanded;
        }
    };

    cards.forEach((card, index) => {
        const affiliation = card.querySelector('.person-affiliation');
        if (!affiliation) return;

        affiliation.id = affiliation.id || `person-affiliation-${index + 1}`;

        const button = document.createElement('button');
        button.className = 'person-card-toggle';
        button.type = 'button';
        button.setAttribute('aria-controls', affiliation.id);
        card.appendChild(button);

        button.addEventListener('click', () => {
            if (!mobileDirectory.matches) return;

            const shouldExpand = !card.classList.contains('is-expanded');
            cards.forEach((item) => setExpanded(item, shouldExpand && item === card));
        });
    });

    const updateDirectoryMode = () => {
        cards.forEach((card) => {
            const button = card.querySelector('.person-card-toggle');
            if (button) button.hidden = !mobileDirectory.matches;
            setExpanded(card, false);
        });
    };

    mobileDirectory.addEventListener('change', updateDirectoryMode);
    updateDirectoryMode();
});
