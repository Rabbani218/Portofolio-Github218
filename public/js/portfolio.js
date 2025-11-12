/*
  public/js/portfolio.js
  - Fetches public repos from GitHub for user `Rabbani218`.
  - Caches results in localStorage (1 hour TTL).
  - Attempts to extract the first image from the README (raw) and shows it in the project card.
  - Aggregates primary languages into skill badges.
  - Respects an optional personal access token set in localStorage under `github_token`.
*/

(function(){
  const GITHUB_USER = 'Rabbani218';
  const CACHE_KEY = 'gh_repos_cache_v1';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour
  const API_BASE = 'https://api.github.com';
  const projectsGrid = document.getElementById('projects-grid');
  const skillsGrid = document.getElementById('skills-grid');

  // runtime caches & UI refs
  let currentRepos = [];
  const imagesCache = {}; // repo.name -> image url
  let filterSelectElem = null;
  let sortSelectElem = null;
  let minStarsElem = null;

  function el(tag, attrs={}, text) {
    const e = document.createElement(tag);
    for(const k in attrs) {
      if(k === 'class') e.className = attrs[k];
      else if(k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if(text) e.textContent = text;
    return e;
  }

  function loadCache(){
    try{
      const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if(!data) return null;
      if(Date.now() - data.ts > CACHE_TTL) return null;
      return data.value;
    }catch(e){ return null; }
  }

  function saveCache(value){
    try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), value })); }catch(e){}
  }

  function getAuthHeaders(){
    const token = localStorage.getItem('github_token');
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if(token) headers['Authorization'] = 'token ' + token;
    return headers;
  }

  async function fetchJson(url){
    const res = await fetch(url, { headers: getAuthHeaders() });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // Try to fetch raw README and extract first image (supports relative paths)
  async function fetchReadmeImage(repo){
    try{
      const url = `${API_BASE}/repos/${GITHUB_USER}/${repo.name}/readme`;
      const res = await fetch(url, { headers: Object.assign({ 'Accept': 'application/vnd.github.v3.raw' }, getAuthHeaders()) });
      if(!res.ok) return null;
      const text = await res.text();
      // find markdown image ![alt](url) or HTML <img src="...">
      const mdImg = text.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]+")?\)/i);
      if(mdImg && mdImg[1]){
        let src = mdImg[1].trim();
        if(src.startsWith('http')) return src;
        // relative path -> build raw URL
        return `https://raw.githubusercontent.com/${GITHUB_USER}/${repo.name}/${repo.default_branch}/${src.replace(/^\//,'')}`;
      }
      const htmlImg = text.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
      if(htmlImg && htmlImg[1]){
        let src = htmlImg[1].trim();
        if(src.startsWith('http')) return src;
        return `https://raw.githubusercontent.com/${GITHUB_USER}/${repo.name}/${repo.default_branch}/${src.replace(/^\//,'')}`;
      }
      return null;
    }catch(e){ return null; }
  }

  function createProjectCard(repo, image){
    const card = el('article',{class:'project-card'});
    const thumb = el('div',{class:'project-thumb'});
  const img = el('img',{src:image || '/images/P1.png', alt: repo.name});
  img.onerror = ()=> { img.src = '/images/P1.png'; };
    thumb.appendChild(img);

    const body = el('div',{class:'project-body'});
    const title = el('h3',{}, repo.name);
    const desc = el('p',{}, repo.description || 'No description');
    const meta = el('div',{class:'project-meta'});
    const lang = el('span',{class:'lang-badge'}, repo.language || '—');
    const stars = el('span',{class:'meta-item'}, `★ ${repo.stargazers_count}`);
    const link = el('a',{href:repo.html_url, target:'_blank', rel:'noopener', class:'project-link'}, 'View on GitHub');

    meta.appendChild(lang);
    meta.appendChild(stars);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(meta);
    body.appendChild(link);

    card.appendChild(thumb);
    card.appendChild(body);
    return card;
  }

  function renderProjects(repos){
    projectsGrid.innerHTML = '';
    if(!repos || repos.length === 0){
      projectsGrid.appendChild(el('div',{class:'stat-card'}, 'No public projects found.'));
      return;
    }
    repos.forEach(r => {
      const placeholder = createProjectCard(r, null);
      projectsGrid.appendChild(placeholder);
    });
  }

  function renderProjectsWithImagesFromCache(repos){
    projectsGrid.innerHTML = '';
    repos.forEach((r) => {
      const img = imagesCache[r.name] || null;
      const card = createProjectCard(r, img);
      projectsGrid.appendChild(card);
    });
  }

  function renderFiltered(){
    // read current UI filters
    const lang = filterSelectElem ? filterSelectElem.value : 'all';
    const sort = sortSelectElem ? sortSelectElem.value : 'updated';
    const minStars = minStarsElem ? parseInt(minStarsElem.value || '0', 10) : 0;

    let out = currentRepos.slice();
    if(lang && lang !== 'all'){
      out = out.filter(r => (r.language || '').toLowerCase() === lang.toLowerCase());
    }
    if(!Number.isNaN(minStars) && minStars > 0){
      out = out.filter(r => (r.stargazers_count || 0) >= minStars);
    }

    if(sort === 'stars') out.sort((a,b) => (b.stargazers_count||0) - (a.stargazers_count||0));
    else if(sort === 'name') out.sort((a,b) => a.name.localeCompare(b.name));
    else out.sort((a,b) => { return (new Date(b.updated_at||0)) - (new Date(a.updated_at||0)); });

    renderProjectsWithImagesFromCache(out);
  }

  function renderSkillsFromRepos(repos){
    const set = new Set();
    repos.forEach(r => {
      if(r.language) set.add(r.language);
      if(Array.isArray(r.topics)) r.topics.forEach(t => set.add(t));
    });
    skillsGrid.innerHTML = '';
    Array.from(set).sort().forEach(s => {
      const b = el('span',{class:'skill-badge'}, s);
      skillsGrid.appendChild(b);
    });
  }

  async function fetchRepos(){
    // Try cache
    const cached = loadCache();
    if(cached){
      currentRepos = cached;
      renderProjectsWithImagesFromCache(currentRepos);
      renderSkillsFromRepos(currentRepos);
      // populate filter UI options
      populateFilterOptions(currentRepos);
      // still refresh in background
      fetchAndUpdate();
      return;
    }
    // No cache -> fetch
    try{
      const url = `${API_BASE}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;
      const repos = await fetchJson(url);
      // store minimal fields we need
      const filtered = repos.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        default_branch: r.default_branch,
        updated_at: r.updated_at,
        topics: r.topics || []
      }));
      currentRepos = filtered;
      saveCache(filtered);
      renderSkillsFromRepos(filtered);
      populateFilterOptions(filtered);
      // fetch images in parallel and render when available
      fetchAndAttachImages(filtered);
    }catch(err){
      projectsGrid.innerHTML = '';
      projectsGrid.appendChild(el('div',{class:'stat-card'}, 'Tidak dapat mengambil project dari GitHub — periksa koneksi atau limit API.'));
      console.error(err);
    }
  }

  async function fetchAndUpdate(){
    try{
      const url = `${API_BASE}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;
      const repos = await fetchJson(url);
      const filtered = repos.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        default_branch: r.default_branch,
        updated_at: r.updated_at,
        topics: r.topics || []
      }));
      currentRepos = filtered;
      saveCache(filtered);
      renderSkillsFromRepos(filtered);
      populateFilterOptions(filtered);
      fetchAndAttachImages(filtered);
    }catch(e){ console.debug('Background refresh failed', e); }
  }

  async function fetchAndAttachImages(repos){
    // populate imagesCache and then render filtered view
    const pairs = await Promise.all(repos.map(async (r) => {
      try{
        const img = await fetchReadmeImage(r);
        imagesCache[r.name] = img || null;
        return [r.name, img];
      }catch(e){ imagesCache[r.name] = null; return [r.name, null]; }
    }));
    // after caching images, render according to current filters
    renderFiltered();
  }

  function populateFilterOptions(repos){
    try{
      if(!filterSelectElem) filterSelectElem = document.getElementById('projects-filter');
      if(!sortSelectElem) sortSelectElem = document.getElementById('projects-sort');
      if(!minStarsElem) minStarsElem = document.getElementById('projects-minstars');
      if(!filterSelectElem) return;
      const langs = new Set();
      repos.forEach(r => { if(r.language) langs.add(r.language); });
      const prev = filterSelectElem.value || 'all';
      filterSelectElem.innerHTML = '<option value="all">All languages</option>' + Array.from(langs).sort().map(l=>`<option value="${l}">${l}</option>`).join('');
      filterSelectElem.value = prev;
    }catch(e){ /* ignore */ }
  }

  function addFilterUI(){
    filterSelectElem = document.getElementById('projects-filter');
    sortSelectElem = document.getElementById('projects-sort');
    minStarsElem = document.getElementById('projects-minstars');
    if(filterSelectElem) filterSelectElem.addEventListener('change', () => renderFiltered());
    if(sortSelectElem) sortSelectElem.addEventListener('change', () => renderFiltered());
    if(minStarsElem) minStarsElem.addEventListener('input', () => renderFiltered());
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    // ensure fallback areas exist
    if(!projectsGrid) return;
    if(!skillsGrid) return;
    addFilterUI();
    fetchRepos();
    // Wire tailored CV generator
    try{
      const btn = document.getElementById('generateTailoredCv');
      if(btn){
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          await generateTailoredCv();
        });
      }
    }catch(e){ console.debug('CV button wiring failed', e); }
  });

  // Build and download a simple tailored CV using jsPDF
  async function generateTailoredCv(){
    try{
      if(typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF){
        alert('PDF generator not loaded. Please ensure jsPDF is available.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      // Gather form values
      const role = (document.getElementById('cv-target-role') || {}).value || 'general';
      const salary = (document.getElementById('cv-salary') || {}).value || '';
      const hours = (document.getElementById('cv-hours') || {}).value || '';
      const healthExp = (document.getElementById('cv-health-experience') || {}).value || 'no';
      const demos = (document.getElementById('cv-demos') || {}).value || '';
      const editor = (document.getElementById('cv-editor') || {}).value || '';

      // Basic profile info (hard-coded for now)
      const fullName = 'Muhammad Abdurrahman Rabbani';
      const title = (role === 'ai_avatar') ? 'AI Avatar Developer / ML Engineer' : (role === 'data_scientist') ? 'Data Scientist / ML Engineer' : (role === 'fullstack') ? 'Full‑stack Developer' : 'Software Engineer';
      const contactLine = 'Email: Rabbani.office1806@gmail.com  ·  GitHub: https://github.com/Rabbani218  ·  LinkedIn: https://www.linkedin.com/in/muhammad-abdurrahman-rabbani-78b208346';

      // Skills list (from currentRepos topics + languages) - fallback to static list
      const skillSet = new Set();
      currentRepos.forEach(r => { if(r.language) skillSet.add(r.language); if(Array.isArray(r.topics)) r.topics.forEach(t=>skillSet.add(t)); });
      const skills = Array.from(skillSet).slice(0,12);

      // Select top 3 repos by stars
      const topRepos = currentRepos.slice().sort((a,b)=> (b.stargazers_count||0)-(a.stargazers_count||0)).slice(0,3);

      // Tailored summary
      let summary = 'Engineer with experience building data-driven services, APIs and prototyping ML models. Focus on delivering reliable solutions from data to production.';
      if(role === 'ai_avatar'){
        summary = 'Experienced in integrating ML models into products and building interactive experiences. Familiar with avatar/agent pipelines, model inference integration, and productionizing AI features. Comfortable working with cross-platform frameworks and collaborating with designers to ship engaging avatar experiences.';
      } else if(role === 'data_scientist'){
        summary = 'Experienced in exploratory data analysis, feature engineering and model prototyping. I deliver reproducible pipelines and clear visualizations that support product decisions.';
      } else if(role === 'fullstack'){
        summary = 'Full‑stack engineer capable of shipping backend services, APIs and front-end interfaces with maintainability and observability in mind.';
      }

      // Layout
      const margin = 40;
      let y = 60;
      doc.setFontSize(18);
      doc.setFont('helvetica','bold');
      doc.text(fullName, margin, y);
      doc.setFontSize(12);
      doc.setFont('helvetica','normal');
      doc.text(title, margin, y + 20);
      doc.setFontSize(9);
      doc.text(contactLine, margin, y + 40, { maxWidth: 520 });

      y += 70;
      doc.setFontSize(11);
      doc.setFont('helvetica','bold');
      doc.text('Professional Summary', margin, y);
      doc.setFont('helvetica','normal');
      y += 16;
      doc.setFontSize(10);
      doc.text(summary, margin, y, { maxWidth: 520 });

      y += 36;
      doc.setFont('helvetica','bold');
      doc.text('Key Skills', margin, y);
      y += 16;
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.text(skills.join(' • ') || 'Python • SQL • JavaScript', margin, y, { maxWidth: 520 });

      y += 30;
      doc.setFont('helvetica','bold');
      doc.text('Selected Projects (GitHub)', margin, y);
      y += 14;
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      topRepos.forEach(r => {
        const titleLine = `${r.name} (${r.language || '—'}) — ★ ${r.stargazers_count || 0}`;
        doc.text(titleLine, margin, y, { maxWidth: 520 });
        y += 12;
        const desc = r.description || '';
        if(desc) { doc.text(desc, margin + 8, y, { maxWidth: 500 }); y += 14; }
        const link = r.html_url;
        doc.setTextColor(0,102,204);
        doc.text(link, margin + 8, y, { maxWidth: 500 });
        doc.setTextColor(0,0,0);
        y += 18;
      });

      // Demos & role-specific info
      if(demos || salary || hours || editor){
        doc.setFont('helvetica','bold');
        doc.text('Additional details', margin, y);
        y += 14;
        doc.setFont('helvetica','normal');
        if(demos){ doc.text('Demos: ' + demos, margin, y, { maxWidth: 520 }); y += 12; }
        if(salary){ doc.text('Estimated last salary: ' + salary, margin, y, { maxWidth: 520 }); y += 12; }
        if(hours){ doc.text('Available hours/day: ' + hours, margin, y, { maxWidth: 520 }); y += 12; }
        if(editor){ doc.text('Editor: ' + editor, margin, y, { maxWidth: 520 }); y += 12; }
        if(healthExp === 'yes'){ doc.text('Experience in health apps: Yes', margin, y, { maxWidth: 520 }); y += 12; }
      }

      // Footer note
      y = 770;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Generated by portfolio (tailored CV). For more details, see GitHub: https://github.com/Rabbani218', margin, y);

      // Save
      const filename = `Rabbani_CV_${role}.pdf`;
      doc.save(filename);
    }catch(err){
      console.error('CV generation failed', err);
      alert('CV generation failed: ' + (err && err.message));
    }
  }

})();
