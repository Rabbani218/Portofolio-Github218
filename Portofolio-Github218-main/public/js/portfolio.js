// portfolio.js -- Fetch GitHub repos and populate Projects and Skills sections
(function () {
  const GITHUB_USER = 'Rabbani218';
  const projectsGrid = document.getElementById('projects-grid');
  const skillsGrid = document.getElementById('skills-grid');
  const DOWNLOAD_PDF_BTN_ID = 'downloadCvPdf';
  const RESUME_TXT_PATH = './assets/Rabbani_CV_2025.txt';

  // Caching config
  const CACHE_KEY = 'gh_repos_cache_v1';
  const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  function el(tag, attrs = {}, text = '') {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text) e.textContent = text;
    return e;
  }

  function showError(container, message) {
    if (!container) return;
    container.innerHTML = '';
    const card = el('div', { class: 'stat-card' }, message);
    container.appendChild(card);
  }

  function getToken() {
    try {
      return localStorage.getItem('github_token');
    } catch (e) {
      return null;
    }
  }

  function saveCache(repos) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), repos }));
    } catch (e) { /* ignore storage errors */ }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.ts || !parsed.repos) return null;
      if ((Date.now() - parsed.ts) > CACHE_TTL_MS) return null;
      return parsed.repos;
    } catch (e) { return null; }
  }

  async function fetchRepos() {
    // Try cache first
    const cached = loadCache();
    if (cached) return cached.filter(r => !r.fork);

    const token = getToken();
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, { headers });
      if (!res.ok) {
        // helpful error messages
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          const msg = (body && body.message) ? body.message : 'Rate limit or access denied';
          showError(projectsGrid, `GitHub API error: ${msg}. To avoid rate limits, add a personal access token in your browser console: localStorage.setItem('github_token','YOUR_TOKEN') then reload.`);
          showError(skillsGrid, `GitHub API error: ${msg}.`);
          return null;
        }
        throw new Error('GitHub API error: ' + res.status);
      }
      const repos = await res.json();
      const filtered = repos.filter(r => !r.fork);
      saveCache(filtered);
      return filtered;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function renderProjects(repos) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    if (!repos || repos.length === 0) {
      showError(projectsGrid, 'No projects found on GitHub.');
      return;
    }

    // Sort by stargazers + forks
    repos.sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count));
    const top = repos.slice(0, 8);
    top.forEach(repo => {
      const card = el('div', { class: 'project-card' });
      const title = el('h3', {}, repo.name.replace(/[-_]/g, ' '));
      const desc = el('p', { class: 'project-desc' }, repo.description || 'No description provided.');
      const meta = el('div', { class: 'project-meta' });
      if (repo.language) meta.appendChild(el('span', {}, repo.language));
      meta.appendChild(el('span', {}, `Updated ${new Date(repo.pushed_at).toLocaleDateString()}`));
      const actions = el('div', { class: 'project-actions' });
      const view = el('a', { href: repo.html_url, target: '_blank', rel: 'noopener noreferrer' }, 'View Code');
      actions.appendChild(view);
      if (repo.homepage) actions.appendChild(el('a', { href: repo.homepage, target: '_blank', rel: 'noopener noreferrer' }, 'Live Demo'));
      const stats = el('div', { class: 'project-stats' });
      stats.innerHTML = `⭐ ${repo.stargazers_count} • Forks ${repo.forks_count}`;

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(desc);
      card.appendChild(actions);
      card.appendChild(stats);
      projectsGrid.appendChild(card);
    });
  }

  function renderSkills(repos) {
    if (!skillsGrid) return;
    skillsGrid.innerHTML = '';
    const counts = {};
    (repos || []).forEach(r => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1;
      }
    });
    // fallback static skills if none
    if (Object.keys(counts).length === 0) {
      const fallback = ['Python', 'JavaScript', 'HTML', 'CSS', 'MySQL'];
      fallback.forEach(s => {
        const b = el('div', { class: 'skill-badge' }, s);
        skillsGrid.appendChild(b);
      });
      return;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([lang, count]) => {
      const badge = el('div', { class: 'skill-badge' }, lang);
      const cspan = el('span', { class: 'skill-count' }, `x${count}`);
      badge.appendChild(cspan);
      skillsGrid.appendChild(badge);
    });
  }

  // PDF resume generation using jsPDF
  async function generatePdfFromTxt(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not fetch resume file');
      const text = await res.text();
      // Use jsPDF (UMD) available as window.jspdf
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) throw new Error('jsPDF not available');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      const lineHeight = 12;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const lines = doc.splitTextToSize(text, pageWidth);
      let cursor = margin;
      doc.setFontSize(11);
      for (let i = 0; i < lines.length; i++) {
        if (cursor > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursor = margin;
        }
        doc.text(lines[i], margin, cursor);
        cursor += lineHeight;
      }
      doc.save('Rabbani_CV_2025.pdf');
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF: ' + (e.message || e));
    }
  }

  async function init() {
    if (projectsGrid) projectsGrid.innerHTML = '<div class="stat-card">Fetching projects & languages from GitHub...</div>';
    if (skillsGrid) skillsGrid.innerHTML = '<div class="stat-card">Analyzing skills based on GitHub activity...</div>';

    const repos = await fetchRepos();
    if (!repos) {
      if (projectsGrid) showError(projectsGrid, 'Could not fetch GitHub data. You may be offline or rate-limited.');
      if (skillsGrid) showError(skillsGrid, 'Could not fetch GitHub data for skills.');
      return;
    }

    renderProjects(repos);
    renderSkills(repos);

    // Attach resume PDF generator button
    try {
      const pdfBtn = document.getElementById(DOWNLOAD_PDF_BTN_ID) || document.getElementById('downloadCvPdf');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', (e) => {
          e.preventDefault();
          generatePdfFromTxt(RESUME_TXT_PATH);
        });
      }
    } catch (e) { /* ignore */ }

    // Helpful hint about token usage
    console.info('If you hit GitHub rate limits, you can set a personal access token in the browser:');
    console.info("localStorage.setItem('github_token','YOUR_TOKEN') ; then reload the page.");
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
