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

  function renderProjectsWithImages(repos, images){
    projectsGrid.innerHTML = '';
    repos.forEach((r, i) => {
      const img = images[i] || null;
      const card = createProjectCard(r, img);
      projectsGrid.appendChild(card);
    });
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
      renderProjects(cached);
      renderSkillsFromRepos(cached);
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
        topics: r.topics || []
      }));
      saveCache(filtered);
      renderProjects(filtered);
      renderSkillsFromRepos(filtered);
      // fetch images in parallel
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
        topics: r.topics || []
      }));
      saveCache(filtered);
      // refresh UI silently
      renderProjects(filtered);
      renderSkillsFromRepos(filtered);
      fetchAndAttachImages(filtered);
    }catch(e){ console.debug('Background refresh failed', e); }
  }

  async function fetchAndAttachImages(repos){
    const images = await Promise.all(repos.map(r => fetchReadmeImage(r)));
    renderProjectsWithImages(repos, images);
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    // ensure fallback areas exist
    if(!projectsGrid) return;
    if(!skillsGrid) return;
    fetchRepos();
  });

})();
