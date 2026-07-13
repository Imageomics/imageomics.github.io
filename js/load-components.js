
(function() {
    'use strict';

    const COMPONENT_CACHE_VERSION = '3';

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

    function getCachedComponent(url) {
        try {
            const absoluteUrl = new URL(url, window.location.href).href;
            return window.sessionStorage.getItem(
                `imageomics-component:${COMPONENT_CACHE_VERSION}:${absoluteUrl}`
            );
        } catch (error) {
            return null;
        }
    }

    function cacheComponent(url, html) {
        try {
            const absoluteUrl = new URL(url, window.location.href).href;
            window.sessionStorage.setItem(
                `imageomics-component:${COMPONENT_CACHE_VERSION}:${absoluteUrl}`,
                html
            );
        } catch (error) {
            // Storage may be unavailable in private browsing or restricted contexts.
        }
    }

    function renderComponent(html, targetId) {
        const target = document.getElementById(targetId);
        if (!target) {
            console.error(`Target element #${targetId} not found`);
            return;
        }

        const prefix = getPathPrefix();
        target.innerHTML = adjustPaths(html, prefix);

        if (targetId === 'header-placeholder') {
            if (typeof window.initHamburger === 'function') {
                window.initHamburger();
            }
            if (typeof window.initSearchUI === 'function') {
                window.initSearchUI();
            }
            if (typeof window.initActiveNav === 'function') {
                window.initActiveNav();
            }
        }

        window.requestAnimationFrame(() => {
            target.classList.add('is-ready');
        });
    }

    function loadComponent(url, targetId) {
        const cachedHtml = getCachedComponent(url);
        if (cachedHtml) {
            renderComponent(cachedHtml, targetId);
            return;
        }

        fetch(url, { cache: 'force-cache' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status}`);
                }
                return response.text();
            })
            .then((html) => {
                cacheComponent(url, html);
                renderComponent(html, targetId);
            })
            .catch((error) => {
                console.error(`Error loading component from ${url}:`, error);
            });
    }

    function initComponents() {
        const prefix = getPathPrefix();
        const componentsPath = `${prefix}html/components/`;

        loadComponent(`${componentsPath}header.html`, 'header-placeholder');
        loadComponent(`${componentsPath}footer.html`, 'footer-placeholder');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }
})();
