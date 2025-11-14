/*
 * main.js
 * Consolidated client-side logic for the portfolio site.
 */
(() => {
    'use strict';

    const GITHUB_USER = 'Rabbani218';
    const CACHE_KEY = 'portfolio:repos:v2';
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
    const PAGE_SIZE = 6;

    const state = {
        allRepos: [],
        filteredRepos: [],
        visibleCount: PAGE_SIZE
    };

    let reposPromise = null;
    let dateFormatter;

    ready(() => {
        initTheme();
        initNav();
        initSmoothScroll();
        initImageFallback();
        initSnapshot();
        initProjects();
        logTokenHint();
    });

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    /* --------------------------- Theme & Navigation ---------------------- */
    function initTheme() {
        const body = document.body;
        const toggle = document.getElementById('themeToggle');
        if (!body || !toggle) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const forced = params.get('force_theme') || params.get('theme');
        const stored = safeStorage('get', 'theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = forced || stored || (prefersDark ? 'dark' : 'light');

        applyTheme(initial);
        if (forced) {
            safeStorage('set', 'theme', forced);
        }

        toggle.addEventListener('click', () => {
            const next = body.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(next);
            safeStorage('set', 'theme', next);
        });
    }

    function applyTheme(theme) {
        const body = document.body;
        const toggle = document.getElementById('themeToggle');
        body.classList.toggle('dark-theme', theme === 'dark');
        body.classList.toggle('light-theme', theme === 'light');
        if (toggle) {
            toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    function initNav() {
        const toggle = document.getElementById('navToggle');
        const nav = document.getElementById('navLinks');
        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', () => {
            const active = nav.classList.toggle('active');
            toggle.setAttribute('aria-expanded', active ? 'true' : 'false');
        });
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', ev => {
                const href = anchor.getAttribute('href');
                if (!href || href === '#') {
                    return;
                }
                const target = document.querySelector(href);
                if (!target) {
                    return;
                }
                ev.preventDefault();
                const offset = target.offsetTop - 72;
                window.scrollTo({ top: Math.max(offset, 0), behavior: 'smooth' });
                const nav = document.getElementById('navLinks');
                if (nav) {
                    nav.classList.remove('active');
                }
            });
        });
    }

    function initImageFallback() {
        const profile = document.querySelector('.profile-img');
        if (!profile) {
            return;
        }
        profile.addEventListener('error', () => {
            profile.src = './assets/images/fallback.jpg';
        }, { once: true });
    }

    /* --------------------------- Snapshot & Skills ---------------------- */
    function initSnapshot() {
        const metricsContainer = document.getElementById('snapshot-metrics');
        const langList = document.getElementById('lang-list');
        const barsContainer = document.getElementById('skill-bars');
        const badgesContainer = document.getElementById('skill-badges');

        if (!metricsContainer && !barsContainer) {
            return;
        }

        loadRepos()
            .then(repos => {
                if (metricsContainer || langList) {
                    renderSnapshot(repos, { metricsContainer, langList });
                }
                if (barsContainer || badgesContainer) {
                    renderSkillStrip(repos, { barsContainer, badgesContainer });
                }
            })
            .catch(err => {
                console.error('Failed to load snapshot data:', err);
                if (metricsContainer) {
                    metricsContainer.innerHTML = '<div class="stat-card">Unable to load GitHub data.</div>';
                }
                if (langList) {
                    langList.textContent = 'Unavailable';
                }
                if (barsContainer && badgesContainer) {
                    setSkillError(barsContainer, badgesContainer, 'Unable to sync with GitHub.');
                }
            });
    }

    function renderSnapshot(repos, { metricsContainer, langList }) {
        if (!repos || !repos.length) {
            if (metricsContainer) {
                metricsContainer.innerHTML = '<div class="stat-card">No public repositories found.</div>';
            }
            if (langList) {
                langList.textContent = 'Unavailable';
            }
            return;
        }

        const repoCount = repos.length;
        const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
        const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        const activeCount = repos.filter(repo => new Date(repo.updated_at).getTime() >= oneYearAgo).length;
        const topLanguages = getTopLanguages(repos, 5);

        if (metricsContainer) {
            const loadingCard = document.getElementById('metric-loading');
            if (loadingCard) {
                loadingCard.remove();
            }
            metricsContainer.innerHTML = [
                makeMetricCard('Projects shipped', repoCount, 'linear-gradient(135deg,#0ea5a4,#60a5fa)'),
                makeMetricCard('Total stars', totalStars, 'linear-gradient(135deg,#f97316,#f43f5e)'),
                makeMetricCard('Active (12mo)', activeCount, 'linear-gradient(135deg,#10b981,#84cc16)'),
                makeMetricCard('Total forks', totalForks, 'linear-gradient(135deg,#3b82f6,#8b5cf6)')
            ].join('');
        }

        if (langList) {
            langList.innerHTML = topLanguages
                .map(({ lang, count }) => `<span class="badge">${lang} (${count})</span>`)
                .join('');
        }
    }

    function renderSkillStrip(repos, { barsContainer, badgesContainer }) {
        if (!repos || !repos.length) {
            if (barsContainer && badgesContainer) {
                setSkillError(barsContainer, badgesContainer, 'No public repositories found.');
            }
            return;
        }

        const total = repos.length || 1;
        const pythonPct = percentageMatch(repos, repo => includesAny(repo, ['python']));
        const sqlPct = percentageMatch(repos, repo => includesAny(repo, ['sql', 'mysql', 'postgres', 'plsql']));
        const mlPct = percentageMatch(repos, repo => includesAny(repo, ['ml', 'machine learning', 'pytorch', 'tensorflow', 'scikit']));

        if (barsContainer) {
            barsContainer.innerHTML = [
                makeSkillBar('Python', pythonPct, 'python'),
                makeSkillBar('SQL', sqlPct, 'sql'),
                makeSkillBar('ML & Prototyping', mlPct, 'ml')
            ].join('');
        }

        if (badgesContainer) {
            const languages = getTopLanguages(repos, 5).map(({ lang, count }) => ({ label: `${lang} (${count})` }));
            const availability = ['Remote OK', 'Immediate', 'English', 'Japanese (Beginner)'].map(label => ({ label }));
            badgesContainer.innerHTML = [...languages, ...availability]
                .map(({ label }) => `<span class="badge">${label}</span>`)
                .join('');
        }
    }

    function setSkillError(barsContainer, badgesContainer, message) {
        if (barsContainer) {
            barsContainer.innerHTML = `<div class="muted-small error-text">${message}</div>`;
        }
        if (badgesContainer) {
            badgesContainer.innerHTML = '<span class="badge badge-error">Unavailable</span>';
        }
    }

    function percentageMatch(repos, predicate) {
        const matches = repos.filter(repo => predicate(repo)).length;
        return Math.round((matches / (repos.length || 1)) * 100);
    }

    function includesAny(repo, keywords) {
        const haystack = `${repo.language || ''} ${repo.name || ''} ${repo.description || ''}`.toLowerCase();
        return keywords.some(keyword => haystack.includes(keyword));
    }

    function makeMetricCard(label, value, gradient) {
        return `
            <div class="metric-card" style="background:${gradient};color:#fff;">
                <div style="font-size:1.2rem;font-weight:700;">${value}</div>
                <div style="font-size:0.9rem;">${label}</div>
            </div>`;
    }

    function makeSkillBar(label, pct, key) {
        const clamped = Math.min(100, Math.max(0, pct));
        return `
            <div class="skill-bar">
                <div class="skill-bar__meta">
                    <span>${label}</span>
                    <span class="muted-small">${clamped}%</span>
                </div>
                <div class="skill-bar__track">
                    <div class="skill-bar__progress skill-bar__progress--${key}" style="width:${clamped}%"></div>
                </div>
            </div>`;
    }

    function getTopLanguages(repos, limit) {
        const counts = new Map();
        repos.forEach(repo => {
            const lang = repo.language || 'Other';
            counts.set(lang, (counts.get(lang) || 0) + 1);
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([lang, count]) => ({ lang, count }));
    }

    /* --------------------------- Projects list ------------------------- */
    function initProjects() {
        const grid = document.getElementById('projects-grid');
        const template = document.getElementById('project-card-template');
        if (!grid || !template) {
            return;
        }

        grid.setAttribute('aria-busy', 'true');
        const loadMoreBtn = document.getElementById('projects-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                state.visibleCount += PAGE_SIZE;
                renderProjects();
            });
        }

        const applyBtn = document.getElementById('projects-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyProjectFilters);
        }
        const resetBtn = document.getElementById('projects-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                resetProjectFilters();
                applyProjectFilters();
            });
        }

        loadRepos()
            .then(repos => {
                state.allRepos = transformRepos(repos);
                populateLanguageFilter(state.allRepos);
                applyProjectFilters();
            })
            .catch(err => {
                console.error('Failed to load projects:', err);
                setProjectsError('Unable to fetch repositories. You might be offline or rate-limited.');
            });
    }

    function transformRepos(repos) {
        return repos
            .filter(repo => !repo.fork && !repo.archived)
            .map(repo => ({
                id: repo.id,
                name: repo.name,
                description: repo.description || 'No description provided yet.',
                language: repo.language || 'Other',
                updatedAt: repo.updated_at,
                stars: repo.stargazers_count || 0,
                forks: repo.forks_count || 0,
                htmlUrl: repo.html_url,
                homepage: repo.homepage && repo.homepage.trim() ? repo.homepage : '',
                topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 6) : [],
                visibility: repo.private ? 'Private' : 'Public'
            }));
    }

    function populateLanguageFilter(repos) {
        const select = document.getElementById('projects-filter');
        if (!select) {
            return;
        }
        const languages = Array.from(new Set(repos.map(repo => repo.language).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            select.appendChild(option);
        });
    }

    function applyProjectFilters() {
        const languageSelect = document.getElementById('projects-filter');
        const sortSelect = document.getElementById('projects-sort');
        const minStarsInput = document.getElementById('projects-minstars');
        const searchInput = document.getElementById('projects-search');

        const language = languageSelect ? languageSelect.value : 'all';
        const sortBy = sortSelect ? sortSelect.value : 'updated';
        const minStars = minStarsInput ? Number.parseInt(minStarsInput.value, 10) || 0 : 0;
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let filtered = [...state.allRepos];

        if (language && language !== 'all') {
            filtered = filtered.filter(repo => repo.language === language);
        }
        if (minStars > 0) {
            filtered = filtered.filter(repo => repo.stars >= minStars);
        }
        if (query) {
            filtered = filtered.filter(repo => `${repo.name} ${repo.description}`.toLowerCase().includes(query));
        }

        if (sortBy === 'stars') {
            filtered.sort((a, b) => b.stars - a.stars);
        } else if (sortBy === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        state.filteredRepos = filtered;
        state.visibleCount = PAGE_SIZE;
        renderProjects();
    }

    function resetProjectFilters() {
        const languageSelect = document.getElementById('projects-filter');
        const sortSelect = document.getElementById('projects-sort');
        const minStarsInput = document.getElementById('projects-minstars');
        const searchInput = document.getElementById('projects-search');
        if (languageSelect) languageSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'updated';
        if (minStarsInput) minStarsInput.value = '0';
        if (searchInput) searchInput.value = '';
    }

    function renderProjects() {
        const grid = document.getElementById('projects-grid');
        const template = document.getElementById('project-card-template');
        const emptyState = document.getElementById('projects-empty');
        const loadMoreBtn = document.getElementById('projects-load-more');
        if (!grid || !template) {
            return;
        }

        grid.innerHTML = '';
        grid.setAttribute('aria-busy', 'true');

        const visible = state.filteredRepos.slice(0, state.visibleCount);

        if (!visible.length) {
            grid.setAttribute('aria-busy', 'false');
            if (emptyState) {
                emptyState.classList.remove('visually-hidden');
            }
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            return;
        }

        if (emptyState) {
            emptyState.classList.add('visually-hidden');
        }

        visible.forEach(repo => {
            const card = template.content.firstElementChild.cloneNode(true);
            hydrateProjectCard(card, repo);
            grid.appendChild(card);
        });

        grid.setAttribute('aria-busy', 'false');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = state.filteredRepos.length > state.visibleCount ? 'inline-flex' : 'none';
        }
    }

    function hydrateProjectCard(card, repo) {
        const title = card.querySelector('.project-title');
        const description = card.querySelector('.project-description');
        const langEl = card.querySelector('.project-lang');
        const updatedEl = card.querySelector('.project-updated');
        const starsEl = card.querySelector('.project-stars');
        const forksEl = card.querySelector('.project-forks');
        const viewCode = card.querySelector('.view-code');
        const repoBtn = card.querySelector('.project-card__links .btn-secondary');
        const liveBtn = card.querySelector('.project-card__links .btn-accent');
        const badges = card.querySelector('.project-badges');

        if (title) title.textContent = repo.name;
        if (description) description.textContent = repo.description;
        if (langEl) langEl.textContent = repo.language;
        if (updatedEl) {
            updatedEl.dateTime = repo.updatedAt;
            updatedEl.textContent = formatDate(repo.updatedAt);
        }
        if (starsEl) starsEl.textContent = `★ ${repo.stars}`;
        if (forksEl) forksEl.textContent = `⑂ ${repo.forks}`;
        if (viewCode) {
            viewCode.href = repo.htmlUrl;
        }
        if (repoBtn) {
            repoBtn.href = repo.htmlUrl;
        }
        if (liveBtn) {
            if (repo.homepage) {
                liveBtn.href = repo.homepage;
                liveBtn.style.display = 'inline-flex';
            } else {
                liveBtn.style.display = 'none';
            }
        }
        if (badges) {
            badges.innerHTML = '';
            const topics = repo.topics.length ? repo.topics : [repo.language];
            topics.filter(Boolean).slice(0, 4).forEach(topic => {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = topic;
                badges.appendChild(badge);
            });
        }
    }

    function setProjectsError(message) {
        const grid = document.getElementById('projects-grid');
        if (!grid) {
            return;
        }
        grid.setAttribute('aria-busy', 'false');
        grid.innerHTML = `<div class="stat-card">${message}</div>`;
        const loadMoreBtn = document.getElementById('projects-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    function formatDate(value) {
        if (!value) {
            return 'Unknown';
        }
        if (!dateFormatter) {
            dateFormatter = new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        return dateFormatter.format(new Date(value));
    }

    /* --------------------------- GitHub fetch --------------------------- */
    function loadRepos() {
        if (reposPromise) {
            return reposPromise;
        }
        reposPromise = (async () => {
            const cached = readCache();
            if (cached) {
                return cached;
            }
            const fresh = await fetchReposFromGithub();
            writeCache(fresh);
            return fresh;
        })();
        return reposPromise;
    }

    async function fetchReposFromGithub() {
        const headers = {
            Accept: 'application/vnd.github+json'
        };
        const token = getStoredToken();
        if (token) {
            headers.Authorization = `token ${token}`;
        }

        const perPage = 100;
        const collected = [];
        let page = 1;

        while (true) {
            const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/repos?per_page=${perPage}&page=${page}&sort=updated`;
            const response = await fetch(url, { headers });
            if (!response.ok) {
                const message = response.status === 403 ? 'GitHub rate limit. Add a personal access token.' : `GitHub API error (${response.status})`;
                throw new Error(message);
            }
            const data = await response.json();
            collected.push(...data);
            if (!Array.isArray(data) || data.length < perPage) {
                break;
            }
            page += 1;
        }

        return collected.filter(repo => !repo.fork);
    }

    function getStoredToken() {
        return safeStorage('get', 'github_token');
    }

    function readCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.timestamp || !Array.isArray(parsed.repos)) {
                return null;
            }
            if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
                return null;
            }
            return parsed.repos;
        } catch (err) {
            console.debug('Failed to read cache:', err);
            return null;
        }
    }

    function writeCache(repos) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), repos }));
        } catch (err) {
            console.debug('Failed to write cache:', err);
        }
    }

    function safeStorage(action, key, value) {
        try {
            if (!('localStorage' in window)) {
                return null;
            }
            if (action === 'get') {
                return window.localStorage.getItem(key);
            }
            if (action === 'set') {
                window.localStorage.setItem(key, value);
            }
        } catch (err) {
            console.debug('Storage access error:', err);
        }
        return null;
    }

    function logTokenHint() {
        console.info('GitHub API calls are unauthenticated by default. Set a personal access token to raise the rate limit:');
        console.info("localStorage.setItem('github_token', 'ghp_yourTokenHere');");
    }
})();
