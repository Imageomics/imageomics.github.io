(function initPersonaPicker() {
    'use strict';

    function bindPersonaPicker() {
        const picker = document.querySelector('[data-persona-picker]');
        if (!picker) return;

        const tabs = Array.from(picker.querySelectorAll('[data-persona]'));
        const panels = Array.from(picker.querySelectorAll('[data-persona-panel]'));

        const activatePersona = (persona, moveFocus = false) => {
            tabs.forEach((tab) => {
                const isActive = tab.dataset.persona === persona;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
                tab.tabIndex = isActive ? 0 : -1;

                if (isActive && moveFocus) tab.focus();
            });

            panels.forEach((panel) => {
                const isActive = panel.dataset.personaPanel === persona;
                panel.classList.toggle('is-active', isActive);
                panel.setAttribute('aria-hidden', String(!isActive));
                panel.inert = !isActive;
            });
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activatePersona(tab.dataset.persona));

            tab.addEventListener('keydown', (event) => {
                if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;

                event.preventDefault();
                let nextIndex = index;

                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = tabs.length - 1;

                activatePersona(tabs[nextIndex].dataset.persona, true);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindPersonaPicker);
    } else {
        bindPersonaPicker();
    }
})();

(function initHomeUpdates() {
    'use strict';

    function getPageUrl(item) {
        if (/^https?:\/\//.test(item.url || '')) return item.url;
        return `html/${String(item.url || '').replace(/^\/?html\//, '')}`;
    }

    function makeSnippet(value, maximumLength = 135) {
        const normalized = String(value || 'Read the latest update from the Imageomics community.')
            .replace(/\s+/g, ' ')
            .replace(/[.…]+$/, '')
            .trim();
        const shortened = normalized.length > maximumLength
            ? normalized.slice(0, maximumLength).replace(/\s+\S*$/, '')
            : normalized;
        return `${shortened}...`;
    }

    function createUpdateLink(item, includeSnippet) {
        const link = document.createElement('a');
        link.href = getPageUrl(item);

        const date = document.createElement('time');
        date.textContent = item.date || '';
        if (item.startDate) date.dateTime = item.startDate;

        const title = document.createElement('strong');
        title.textContent = item.title;

        link.append(date, title);

        if (includeSnippet) {
            const snippet = document.createElement('p');
            snippet.textContent = makeSnippet(item.description);
            link.append(snippet);
        }

        return link;
    }

    function renderList(list, items, includeSnippet) {
        if (!items.length) {
            window.ImageomicsStates?.render(
                list,
                'empty',
                includeSnippet ? 'No news is available right now.' : 'No upcoming events are scheduled right now.',
                { tagName: 'li' }
            );
            return;
        }

        list.replaceChildren();
        list.setAttribute('aria-busy', 'false');

        items.forEach((item) => {
            const listItem = document.createElement('li');
            listItem.append(createUpdateLink(item, includeSnippet));
            list.append(listItem);
        });
    }

    async function loadHomeUpdates() {
        const newsList = document.querySelector('[data-latest-news-list]');
        const eventsList = document.querySelector('[data-upcoming-events-list]');
        if (!newsList || !eventsList) return;

        const loadItems = async (url, label) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`${label} request failed with status ${response.status}`);
            const items = await response.json();
            if (!Array.isArray(items)) throw new TypeError(`${label} data must be an array.`);
            return items;
        };

        const [newsResult, eventsResult] = await Promise.allSettled([
            loadItems('data/news.json', 'News'),
            loadItems('data/events.json', 'Events')
        ]);

        const parseDate = (value) => {
            const parsed = new Date(value || 0).getTime();
            return Number.isNaN(parsed) ? 0 : parsed;
        };

        if (newsResult.status === 'fulfilled') {
            const latestNews = [...newsResult.value]
                .filter((item) => item.title && item.url)
                .sort((a, b) => parseDate(b.date) - parseDate(a.date))
                .slice(0, 3);

            renderList(newsList, latestNews, true);
        } else {
            console.error('Unable to load homepage news.', newsResult.reason);
            window.ImageomicsStates?.render(newsList, 'error', 'News is temporarily unavailable.', { tagName: 'li' });
        }

        if (eventsResult.status === 'fulfilled') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTime = today.getTime();
            const upcomingEvents = [...eventsResult.value]
                .filter((item) => item.title && item.url && parseDate(item.endDate || item.startDate) >= todayTime)
                .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))
                .slice(0, 3);

            renderList(eventsList, upcomingEvents, false);
        } else {
            console.error('Unable to load homepage events.', eventsResult.reason);
            window.ImageomicsStates?.render(eventsList, 'error', 'Events are temporarily unavailable.', { tagName: 'li' });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHomeUpdates);
    } else {
        loadHomeUpdates();
    }
})();

(function initHeroNewsCarousel() {
    'use strict';

    const featuredItems = [
        {
            category: 'Recent publication',
            title: 'Beyond Flat Labels: Level-Restricted Contrastive Learning for Hierarchical Fine-Grained Vision Classification',
            description: 'Explore a hierarchy-aware approach to fine-grained visual classification that learns beyond flat category labels.',
            url: 'https://doi.org/10.48550/arXiv.2606.21838',
            image: 'images/research/imageomics-foundation-model-hero.png',
            cta: 'Read the publication'
        },
        {
            category: 'Software product',
            title: 'Repository Exporter: A New Python Package',
            description: 'Collect key metadata from GitHub and Hugging Face organizations and export it to a color-coded Google Sheet.',
            url: 'https://pypi.org/project/repo-exporter/',
            placeholder: true,
            cta: 'View the package'
        },
        {
            category: 'In the news',
            title: 'Can AI Unlock the Hidden Data in Biological Collections?',
            description: 'Discover how artificial intelligence can help reveal scientific information held within digitized biological collections.',
            url: 'https://www.neonscience.org/impact/observatory-blog/can-ai-unlock-hidden-data-biological-collections',
            image: 'images/news-images/new-field-science-global-biodiversity.jpg',
            cta: 'Read the story'
        },
        {
            category: 'Conference and workshop',
            title: 'FloraPalooza 2026',
            description: 'A collaborative workshop exploring how plant imagery can answer biological and ecological questions at scale.',
            url: 'news/florapalooza-2026.html',
            image: 'images/news-images/florapalooza-2026.png',
            imageFit: 'contain',
            cta: 'Explore the workshop'
        }
    ];

    function selectCarouselItems(events, now = new Date()) {
        const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const today = dateKey(now);
        const horizon = new Date(now);
        horizon.setDate(horizon.getDate() + 14);

        const upcomingEvent = events
            .filter((event) => event.title && event.url &&
                /^\d{4}-\d{2}-\d{2}$/.test(event.startDate || '') &&
                event.startDate <= dateKey(horizon) &&
                (event.endDate || event.startDate) >= today)
            .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

        if (!upcomingEvent) return [...featuredItems];

        return [
            {
                ...upcomingEvent,
                category: `Upcoming event${upcomingEvent.date ? ` · ${upcomingEvent.date}` : ''}`,
                placeholder: !upcomingEvent.image,
                cta: 'View the event'
            },
            ...featuredItems
        ];
    }

    async function bindNewsCarousel() {
        const carousel = document.querySelector('[data-news-carousel]');
        if (!carousel) return;

        const track = carousel.querySelector('[data-news-track]');
        const previousButton = carousel.querySelector('[data-news-previous]');
        const nextButton = carousel.querySelector('[data-news-next]');
        const dots = carousel.querySelector('[data-news-dots]');
        const counter = carousel.querySelector('[data-news-counter]');
        const toggle = carousel.querySelector('[data-news-toggle]');
        const toggleIcon = carousel.querySelector('[data-news-toggle-icon]');
        const toggleLabel = carousel.querySelector('[data-news-toggle-label]');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let stories = [];
        let slides = [];
        let activeIndex = 0;
        let physicalIndex = 1;
        let userPaused = prefersReducedMotion;
        let rotationTimer = null;

        const getStoryUrl = (story) => {
            if (/^https?:\/\//.test(story.url || '')) return story.url;
            return `html/${String(story.url || '').replace(/^\/?html\//, '')}`;
        };

        const createSlide = (story, isClone = false) => {
            const slide = document.createElement('a');
            slide.className = 'hero-news-slide';
            slide.href = getStoryUrl(story);
            if (/^https?:\/\//.test(story.url || '')) {
                slide.target = '_blank';
                slide.rel = 'noopener noreferrer';
            }

            if (isClone) {
                slide.setAttribute('aria-hidden', 'true');
                slide.tabIndex = -1;
            }

            const image = document.createElement('span');
            image.className = 'hero-news-slide__image';
            image.setAttribute('aria-hidden', 'true');
            if (story.imageFit === 'contain') {
                image.classList.add('hero-news-slide__image--contain');
            }

            if (story.placeholder) {
                image.classList.add('hero-news-slide__image--placeholder');
                image.innerHTML = '<svg viewBox="0 0 48 48"><rect x="10" y="12" width="28" height="24" rx="2"></rect><circle cx="19" cy="21" r="3"></circle><path d="m13 32 8-7 6 5 4-4 4 4"></path></svg>';
            } else {
                const storyImage = document.createElement('img');
                storyImage.src = String(story.image || '').replace(/^\.\.\//, '');
                storyImage.alt = '';
                storyImage.loading = 'lazy';
                image.append(storyImage);
            }

            const content = document.createElement('span');
            content.className = 'hero-news-slide__content';

            const category = document.createElement('small');
            category.textContent = story.category;

            const title = document.createElement('strong');
            title.textContent = story.title;

            const description = document.createElement('span');
            description.textContent = story.description || 'Read the latest from the Imageomics community.';

            const readMore = document.createElement('b');
            readMore.className = 'hero-news-slide__read-more';
            readMore.textContent = story.cta || 'Read more';

            const arrow = document.createElement('span');
            arrow.className = 'hero-news-slide__read-more-icon';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';

            readMore.append(arrow);
            content.append(category, title, description, readMore);
            slide.append(image, content);
            return slide;
        };

        const getStep = () => {
            const firstSlide = track.querySelector('.hero-news-slide');
            if (!firstSlide) return 0;

            const styles = window.getComputedStyle(track);
            const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
            return firstSlide.getBoundingClientRect().width + gap;
        };

        const positionTrack = (animate = true) => {
            if (!animate) track.style.transition = 'none';
            track.style.transform = `translate3d(-${physicalIndex * getStep()}px, 0, 0)`;

            if (!animate) {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => track.style.removeProperty('transition'));
                });
            }
        };

        const updateStatus = () => {
            counter.value = `${String(activeIndex + 1).padStart(2, '0')} / ${String(stories.length).padStart(2, '0')}`;
            counter.textContent = counter.value;

            dots.querySelectorAll('button').forEach((dot, index) => {
                dot.setAttribute('aria-current', String(index === activeIndex));
            });

            slides.forEach((slide, index) => {
                slide.tabIndex = index === activeIndex ? 0 : -1;
                slide.setAttribute('aria-current', String(index === activeIndex));
            });
        };

        const stopRotation = () => {
            window.clearInterval(rotationTimer);
            rotationTimer = null;
        };

        const startRotation = () => {
            stopRotation();
            if (userPaused || prefersReducedMotion || stories.length < 2 || carousel.matches(':hover') || carousel.contains(document.activeElement)) return;
            rotationTimer = window.setInterval(() => move(1, false), 5500);
        };

        const updatePauseButton = () => {
            carousel.dataset.paused = String(userPaused);
            toggle.setAttribute('aria-pressed', String(userPaused));
            toggleIcon.textContent = userPaused ? '▶' : 'Ⅱ';
            toggleLabel.textContent = userPaused ? 'Play' : 'Pause';
        };

        const move = (direction, restart = true) => {
            if (direction > 0) {
                physicalIndex += 1;
                activeIndex = (activeIndex + 1) % stories.length;
            } else {
                physicalIndex -= 1;
                activeIndex = (activeIndex - 1 + stories.length) % stories.length;
            }

            updateStatus();
            positionTrack();

            if (restart) startRotation();
        };

        const goToStory = (index) => {
            activeIndex = index;
            physicalIndex = index + 1;
            updateStatus();
            positionTrack();
            startRotation();
        };

        try {
            let eventItems = [];
            try {
                const response = await fetch('data/events.json');
                if (!response.ok) throw new Error(`Events request failed with status ${response.status}`);
                const result = await response.json();
                if (!Array.isArray(result)) throw new TypeError('Event data must be an array.');
                eventItems = result;
            } catch (error) {
                console.warn('Upcoming events could not be added to the carousel.', error);
            }

            const refreshStories = () => {
                const nextStories = selectCarouselItems(eventItems);
                const nextUrls = nextStories.map((story) => story.url).join('|');
                const currentUrls = stories.map((story) => story.url).join('|');
                if (nextUrls === currentUrls && track.dataset.loaded) return;

                const currentUrl = stories[activeIndex]?.url;
                const hadSlideFocus = slides.includes(document.activeElement);
                stopRotation();
                stories = nextStories;
                const preservedIndex = stories.findIndex((story) => story.url === currentUrl);
                activeIndex = preservedIndex >= 0 ? preservedIndex : 0;
                physicalIndex = activeIndex + 1;
                track.dataset.loaded = 'true';
                track.setAttribute('aria-busy', 'false');
                dots.replaceChildren();
                slides = stories.map((story) => createSlide(story));
                track.replaceChildren(
                    createSlide(stories[stories.length - 1], true),
                    ...slides,
                    createSlide(stories[0], true)
                );

                stories.forEach((story, index) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.setAttribute('aria-label', `Show item ${index + 1}: ${story.title}`);
                    dot.addEventListener('click', () => goToStory(index));
                    dots.append(dot);
                });

                previousButton.disabled = stories.length < 2;
                nextButton.disabled = stories.length < 2;
                toggle.disabled = prefersReducedMotion || stories.length < 2;
                updateStatus();
                positionTrack(false);
                if (hadSlideFocus) slides[activeIndex]?.focus();
                startRotation();
            };

            refreshStories();
            window.setInterval(refreshStories, 60000);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) refreshStories();
            });

            track.addEventListener('transitionend', (event) => {
                if (event.propertyName !== 'transform') return;

                if (physicalIndex === 0) {
                    physicalIndex = stories.length;
                    positionTrack(false);
                } else if (physicalIndex === stories.length + 1) {
                    physicalIndex = 1;
                    positionTrack(false);
                }
            });

            previousButton.disabled = stories.length < 2;
            nextButton.disabled = stories.length < 2;
            previousButton.addEventListener('click', () => move(-1));
            nextButton.addEventListener('click', () => move(1));

            if (prefersReducedMotion) {
                toggle.disabled = true;
                toggleIcon.textContent = '■';
                toggleLabel.textContent = 'Motion off';
            } else {
                toggle.disabled = stories.length < 2;
                userPaused = false;
                updatePauseButton();

                toggle.addEventListener('click', () => {
                    userPaused = !userPaused;
                    updatePauseButton();
                    if (userPaused) stopRotation();
                    else startRotation();
                });

                carousel.addEventListener('mouseenter', stopRotation);
                carousel.addEventListener('mouseleave', startRotation);
                carousel.addEventListener('focusin', stopRotation);
                carousel.addEventListener('focusout', (event) => {
                    if (!carousel.contains(event.relatedTarget)) startRotation();
                });
            }

            window.addEventListener('resize', () => positionTrack(false));
            startRotation();
        } catch (error) {
            console.error('Unable to load homepage news carousel.', error);
            window.ImageomicsStates?.render(
                track,
                'error',
                'Featured stories are temporarily unavailable.',
                { className: 'hero-news-carousel__state' }
            );
            track.style.transform = 'none';
            dots.replaceChildren();
            counter.value = 'Unavailable';
            counter.textContent = 'Unavailable';
            previousButton.disabled = true;
            nextButton.disabled = true;
            toggle.disabled = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindNewsCarousel);
    } else {
        bindNewsCarousel();
    }
})();
