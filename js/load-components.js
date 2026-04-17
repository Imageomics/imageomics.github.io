(function() {
    'use strict';

    const COMPONENT_TEMPLATES = {
        header: `
<header class="header">
    <div class="logo">
        <a href="index.html">
            <img src="images/Imageomics-logo.png" alt="Imageomics Institute logo" />
        </a>
    </div>

    <nav class="nav">
        <ul class="nav-links">
            <li class="dropdown">
                <a>About</a>
                <ul class="dropdown-menu">
                    <li class="dropdown-parent"><span>About Imageomics Institute</span></li>
                    <li class="dropdown-subitem"><a href="html/about/vision.html">The Vision of the Imageomics Institute</a></li>
                    <li class="dropdown-subitem"><a href="html/about/community-values.html">Community Values</a></li>
                    <li class="dropdown-subitem"><a href="html/about/code-of-conduct.html">Code of Conduct</a></li>
                    <li class="dropdown-subitem"><a href="html/about/imageomics-in-the-news.html">Imageomics In the News</a></li>
                    <li class="dropdown-parent"><span>Institute Team</span></li>
                    <li class="dropdown-subitem"><a href="html/about/faculty-staff.html">Institute Faculty &amp; Staff</a></li>
                    <li class="dropdown-subitem"><a href="html/about/nextgens.html">NextGens</a></li>
                    <li class="dropdown-subitem"><a href="html/about/collaborators.html">Collaborators</a></li>
                    <li class="dropdown-parent"><span>Contact Us</span></li>
                    <li class="dropdown-subitem"><a href="html/about/visitors.html">Visitors to Imageomics Institute</a></li>
                    <li class="dropdown-subitem"><a href="html/about/mailing-list.html">Subscribe to our Mailing List</a></li>
                </ul>
            </li>
            <li class="dropdown">
                <a>Research</a>
                <ul class="dropdown-menu">
                    <li><a href="html/research/projects.html">Research Projects</a></li>
                    <li><a href="html/research/publications.html">Imageomics Publications</a></li>
                    <li><a href="html/research/publication-acknowledgements.html">Publication Acknowledgements</a></li>
                    <li><a href="html/research/talks-presentations.html">Talks and Presentations</a></li>
                </ul>
            </li>
            <li><a href="html/news.html">News</a></li>
            <li><a href="html/events.html">Events</a></li>
            <li class="dropdown">
                <a href="html/tools-resources.html">Tools &amp; Resources</a>
                <ul class="dropdown-menu">
                    <li><a href="html/tools-resources/policies-guidelines.html">Imageomics Policies &amp; Guidelines</a></li>
                    <li><a href="html/tools-resources/authorship-guidelines.html">Authorship Guidelines</a></li>
                    <li><a href="html/tools-resources/data-code-of-conduct-policy.html">Data Code of Conduct Policy</a></li>
                    <li><a href="html/tools-resources/digital-products-release-licensing-policy.html">Digital Products Release and Licensing Policy</a></li>
                    <li><a href="html/tools-resources/fieldwork-safety-plan.html">Fieldwork Safety Plan</a></li>
                    <li><a href="html/tools-resources/educational-tools-resources.html">Educational Tools &amp; Resources</a></li>
                    <li><a href="html/tools-resources/software-tools-resources.html">Software Tools &amp; Resources</a></li>
                    <li><a href="html/tools-resources/tool-tutorials.html">Tool Tutorials</a></li>
                    <li><a href="html/tools-resources/team-science-tools-resources.html">Team Science Tools &amp; Resources</a></li>
                </ul>
            </li>
            <li class="dropdown">
                <a href="html/conference.html">Imageomics Conference</a>
                <ul class="dropdown-menu">
                    <li><a href="html/conference/overview.html">Conference Overview</a></li>
                    <li><a href="html/conference/resources.html">Conference Resources</a></li>
                    <li><a href="html/conference/accommodations.html">Conference Accommodations</a></li>
                    <li><a href="html/conference/travel-information.html">Conference Travel Information</a></li>
                    <li><a href="html/conference/agenda.html">Conference Agenda</a></li>
                    <li><a href="html/conference/nextgen-day-agenda.html">NextGen Day Agenda</a></li>
                    <li><a href="html/conference/the-wilds-field-trip-schedule.html">The Wilds Field Trip Schedule</a></li>
                    <li><a href="html/conference/research-lightning-talk-abstracts.html">Research Lightning Talk Abstracts</a></li>
                </ul>
            </li>
        </ul>
    </nav>

    <div class="search-container" id="searchContainer">
        <button class="search-icon-btn" id="searchIconBtn" aria-label="Search">
            <img src="images/search.png" alt="Search" />
        </button>
        <input type="text" class="search-bar" id="searchBar" placeholder="Search..." />
        <div class="search-results" id="searchResults"></div>
    </div>

    <div class="header-actions">
        <button class="hamburger" id="hamburger" aria-label="Menu">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        </button>
    </div>
</header>`,
        footer: `
<footer class="footer">
    <div class="footer-content">
        <div class="footer-section about">
            <h3>Imageomics Institute</h3>
            <p class="footer-disclaimer">
                The Imageomics Institute is supported by the National Science Foundation under <a href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2118240&HistoricalAwards=false" target="_blank" rel="noopener noreferrer">Award No. 2118240</a> "HDR Institute: Imageomics: A New Frontier of Biological Information Powered by Knowledge-Guided Machine Learning." Any opinions, findings and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.
            </p>

            <div class="nsf-logo-container">
                <img src="images/Imageomics-logo.png" alt="Imageomics Institute logo" />
                <p>Imageomics Institute</p>
            </div>
        </div>
        <div class="footer-section links">
            <h3>Quick Links</h3>
            <ul>
                <li><a href="html/about.html">About</a></li>
                <li><a href="html/research.html">Research</a></li>
                <li><a href="html/news.html">News</a></li>
                <li><a href="html/events.html">Events</a></li>
                <li><a href="html/tools-resources.html">Tools &amp; Resources</a></li>
                <li><a href="html/conference.html">Imageomics Conference</a></li>
            </ul>
        </div>
        <div class="footer-section institutes">
            <h3>Sections</h3>
            <ul>
                <li><a href="html/about/vision.html">About subpages</a></li>
                <li><a href="html/research/projects.html">Research subpages</a></li>
                <li><a href="html/tools-resources/policies-guidelines.html">Tools &amp; Resources subpages</a></li>
                <li><a href="html/conference/overview.html">Conference subpages</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 Imageomics Institute. All Rights Reserved.</p>
    </div>
</footer>`
    };

    function getPathPrefix() {
        const path = window.location.pathname;

        if (path.endsWith('/') || (path.endsWith('/index.html') && !path.includes('/html/'))) {
            return '';
        }

        const htmlIndex = path.indexOf('/html/');
        if (htmlIndex !== -1) {
            const afterHtml = path.substring(htmlIndex + 6);
            const depth = (afterHtml.match(/\//g) || []).length;
            return '../'.repeat(depth + 1);
        }

        return '../';
    }

    function adjustPaths(html, prefix) {
        if (!prefix) return html;

        html = html.replace(/src="(images|css|js|html)\//g, `src="${prefix}$1/`);
        html = html.replace(/href="(images|css|js|html)\//g, `href="${prefix}$1/`);
        html = html.replace(/href="index\.html"/g, `href="${prefix}index.html"`);
        html = html.replace(/href="\.\.\/index\.html"/g, `href="${prefix}index.html"`);

        return html;
    }

    function renderComponent(targetId, html) {
        const target = document.getElementById(targetId);
        if (!target) return;

        const prefix = getPathPrefix();
        target.innerHTML = adjustPaths(html, prefix);

        if (targetId === 'header-placeholder') {
            if (typeof window.initHamburger === 'function') {
                window.initHamburger();
            }
            if (typeof window.initSearchUI === 'function') {
                window.initSearchUI();
            }
        }
    }

    function initComponents() {
        renderComponent('header-placeholder', COMPONENT_TEMPLATES.header);
        renderComponent('footer-placeholder', COMPONENT_TEMPLATES.footer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }
})();
