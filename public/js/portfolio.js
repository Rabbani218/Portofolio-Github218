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

  // Build a tailored, formatted CV PDF using jsPDF and small layout rules
  async function generateTailoredCvPdf(url, options = {}) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not fetch resume file');
      const baseText = await res.text();
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) throw new Error('jsPDF not available');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      let y = margin;

      // Simple parser: use headings from the text file
      const lines = baseText.split(/\r?\n/).map(l => l.trim());
      // Header: first two non-empty lines are name and subtitle
      const nonEmpty = lines.filter(l => l);
      const name = nonEmpty[0] || 'Name';
      const subtitle = nonEmpty[1] || options.targetRole || '';

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(name, margin, y);
      y += 26;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor('#444');
      doc.text(subtitle, margin, y);
      y += 18;

      // Contact line: attempt to find Contact section
      const contactIndex = lines.findIndex(l => /^Contact$/i.test(l));
      if (contactIndex >= 0) {
        const contactLines = [];
        for (let i = contactIndex + 1; i < lines.length && lines[i]; i++) contactLines.push(lines[i]);
        if (contactLines.length) {
          doc.setTextColor('#000');
          doc.setFontSize(10);
          doc.text(contactLines.join(' · '), margin, y);
          y += 16;
        }
      }

      y += 6;

      // Add a tailored summary based on selected role and other options
      const role = options.targetRole || document.getElementById('cv-target-role')?.value || '';
      const salary = options.salary || document.getElementById('cv-salary')?.value || '';
      const hours = options.hours || document.getElementById('cv-hours')?.value || '';
      const healthExp = options.healthExp || document.getElementById('cv-health-experience')?.value || '';

      const tailoredSummary = [];
      tailoredSummary.push(`Target role: ${role.replace(/_/g, ' ')}`);
      if (salary) tailoredSummary.push(`Previous salary: ${salary}`);
      if (hours) tailoredSummary.push(`Typical workday: ${hours}h`);
      if (healthExp && healthExp !== 'no') tailoredSummary.push('Experience with health apps');

      // Summary section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#0b3d91');
      doc.text('Summary', margin, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor('#222');
      const summaryText = tailoredSummary.join(' · ') || 'See full profile and projects at GitHub.';
      const summaryLines = doc.splitTextToSize(summaryText, pageWidth);
      summaryLines.forEach(ln => { doc.text(ln, margin, y); y += 14; });

      y += 6;

      // Skills: try to read from skills grid in DOM, fallback to text file Skills section
      let skills = [];
      try {
        const sg = document.getElementById('skills-grid');
        if (sg) {
          const badges = Array.from(sg.querySelectorAll('.skill-badge')).map(b => b.firstChild && b.firstChild.nodeValue ? b.firstChild.nodeValue.trim() : b.textContent.trim());
          skills = badges.filter(Boolean);
        }
      } catch (e) { /* ignore */ }

      if (!skills.length) {
        const skillsIdx = lines.findIndex(l => /^Skills$/i.test(l));
        if (skillsIdx >= 0) {
          for (let i = skillsIdx + 1; i < lines.length && lines[i]; i++) {
            const s = lines[i].replace(/^[-•*]\s*/, '');
            skills.push(s);
          }
        }
      }

      if (skills.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor('#0b3d91');
        doc.text('Skills', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const skLine = skills.join(' · ');
        const skLines = doc.splitTextToSize(skLine, pageWidth);
        skLines.forEach(ln => { doc.text(ln, margin, y); y += 12; });
      }

      y += 8;

      // Experience: try to pull Experience & Projects section from text file
      const expIndex = lines.findIndex(l => /^(Experience|Experience & Projects|Projects)$/i.test(l));
      if (expIndex >= 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor('#0b3d91');
        doc.text('Experience', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (let i = expIndex + 1; i < lines.length && lines[i]; i++) {
          const line = lines[i];
          if (y > doc.internal.pageSize.getHeight() - margin - 40) { doc.addPage(); y = margin; }
          if (line.startsWith('-')) {
            const text = line.replace(/^[-]\s*/, '');
            const wrapped = doc.splitTextToSize('• ' + text, pageWidth);
            wrapped.forEach(ln => { doc.text(ln, margin, y); y += 12; });
          } else {
            const wrapped = doc.splitTextToSize(line, pageWidth);
            wrapped.forEach(ln => { doc.text(ln, margin, y); y += 12; });
          }
          y += 2;
        }
      }

      // Footer note
      doc.setFontSize(9);
      doc.setTextColor('#666');
      const footY = doc.internal.pageSize.getHeight() - margin + 10;
      doc.text('Generated from portfolio site — tailor as needed for ATS (convert to DOCX for some ATS systems).', margin, footY - 10);

      // Save
      const filename = (options.filename) ? options.filename : 'Rabbani_Tailored_CV.pdf';
      doc.save(filename);
    } catch (e) {
      console.error('Tailored CV generation failed:', e);
      alert('Failed to generate tailored CV: ' + (e && e.message));
    }
  }

  async function init() {
    if (projectsGrid) projectsGrid.innerHTML = '<div class="stat-card">Fetching projects & languages from GitHub...</div>';
    if (skillsGrid) skillsGrid.innerHTML = '<div class="stat-card">Analyzing skills based on GitHub activity...</div>';

    // --- Prefer pre-generated PDF if available ---
    try {
      const pdfResp = await fetch('./assets/Rabbani_CV_2025.pdf', { method: 'HEAD' });
      const pdfExists = pdfResp && pdfResp.ok;
      if (pdfExists) {
        // update any download links to point to the pre-built PDF
        const txtLink = document.getElementById('downloadCvTxt');
        const pdfLink = document.getElementById('downloadCvBtn');
        if (txtLink) {
          txtLink.setAttribute('href', './assets/Rabbani_CV_2025.pdf');
          txtLink.setAttribute('download', 'Rabbani_CV_2025.pdf');
          txtLink.classList.remove('btn-secondary');
          txtLink.classList.add('btn-primary');
        }
        if (pdfLink) {
          pdfLink.setAttribute('href', './assets/Rabbani_CV_2025.pdf');
          pdfLink.setAttribute('download', 'Rabbani_CV_2025.pdf');
        }
      }
    } catch (e) {
      // ignore fetch errors — we'll keep client PDF generator as fallback
      console.debug('Pre-generated PDF check failed:', e && e.message);
    }

    // Image fallback handler (avoid inline attributes)
    try {
      const pImg = document.querySelector('.profile-img');
      if (pImg) {
        pImg.addEventListener('error', function () {
          this.src = './assets/images/fallback.jpg';
        });
      }
    } catch (e) { /* ignore */ }

    // Theme initialization: respect URL param (force_theme), saved preference, or system preference
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forcedTheme = urlParams.get('force_theme') || urlParams.get('theme'); // support ?force_theme=light
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const body = document.body;
      function applyTheme(t) {
        if (!body) return;
        body.classList.toggle('dark-theme', t === 'dark');
        body.classList.toggle('light-theme', t === 'light');
        const tt = document.getElementById('themeToggle');
        if (tt) {
          tt.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
          tt.textContent = t === 'dark' ? '☀️' : '🌙';
        }
      }
      // Order of precedence: URL param -> saved localStorage -> system preference -> light
      const initial = forcedTheme || saved || (prefersDark ? 'dark' : 'light');
      applyTheme(initial);
      if (forcedTheme) {
        try { localStorage.setItem('theme', forcedTheme); } catch (e) { /* ignore */ }
      }

      // Theme toggle handler
      const themeBtn = document.getElementById('themeToggle');
      if (themeBtn) {
        themeBtn.addEventListener('click', function () {
          const isDark = document.body.classList.contains('dark-theme');
          const next = isDark ? 'light' : 'dark';
          applyTheme(next);
          try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
        });
      }
    } catch (e) { /* ignore theme setup errors */ }

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

    // Mobile nav toggle (moved from inline HTML script)
    try {
      const navToggle = document.getElementById('navToggle');
      if (navToggle) {
        navToggle.addEventListener('click', function () {
          const navLinks = document.getElementById('navLinks');
          if (navLinks) {
            const isActive = navLinks.classList.toggle('active');
            // update aria-expanded on the toggle button
            try { navToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false'); } catch (e) { /* ignore setAttribute errors */ }
          }
        });
      }
    } catch (e) { /* ignore */ }

    // Smooth scrolling for internal anchors
    try {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (ev) {
          const targetId = this.getAttribute('href');
          if (!targetId || targetId === '#') return; // ignore
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            ev.preventDefault();
            window.scrollTo({ top: targetElement.offsetTop - 72, behavior: 'smooth' });
            const navLinks = document.getElementById('navLinks');
            if (navLinks) navLinks.classList.remove('active');
          }
        });
      });
    } catch (e) { /* ignore */ }

    // Tailored CV generator: wire form -> PDF
    try {
      const tailoredBtn = document.getElementById('generateTailoredCv');
      if (tailoredBtn) {
        tailoredBtn.addEventListener('click', async (ev) => {
          ev.preventDefault();
          tailoredBtn.disabled = true;
          tailoredBtn.textContent = 'Generating...';
          const options = {
            targetRole: document.getElementById('cv-target-role')?.value,
            salary: document.getElementById('cv-salary')?.value,
            hours: document.getElementById('cv-hours')?.value,
            healthExp: document.getElementById('cv-health-experience')?.value,
            filename: 'Rabbani_Tailored_CV.pdf'
          };
          await generateTailoredCvPdf(RESUME_TXT_PATH, options);
          tailoredBtn.disabled = false;
          tailoredBtn.textContent = 'カスタム履歴書を生成 (PDF)';
        });
      }
    } catch (e) { console.error(e); }

    // Helpful hint about token usage
  console.info('If you hit GitHub rate limits, you can set a personal access token in the browser:');
  console.info('localStorage.setItem(\'github_token\',\'YOUR_TOKEN\') ; then reload the page.');
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
