# Portofolio Rabbani

This repository contains a static portfolio website for Muhammad Abdurrahman Rabbani. The site is built with plain HTML/CSS/JavaScript and includes a client-side integration that automatically syncs projects and skills from the GitHub account `Rabbani218`.

What changed and what's included
- Modern homepage focused on Data Analysis, Full‑stack and AI engineering.
- Client-side GitHub sync: `public/js/portfolio.js` fetches public repos, caches them (1 hour) and extracts an image from the README when available.
- Centralized styles in `public/css/portfolio.css` and a light theme `public/css/light-theme.css`.
- Resume: `public/assets/Rabbani_CV_2025.txt` plus included PDF `public/assets/Rabbani_CV_2025.pdf`. A Node script `generate_cv.js` can (re)generate the PDF using `pdfkit`.

Local development / verify
1. Install dependencies (needed only to generate PDF server-side):

   npm install

2. To (re)generate the PDF resume locally:

   npm run build:resume

   This runs `generate_cv.js` and outputs `public/assets/Rabbani_CV_2025.pdf`.

   Alternatively, on Windows PowerShell you can run the script directly:

```powershell
node "c:\Users\DELL\OneDrive\Documents\Project Github\Portofolio-Github218\generate_cv.js"
```

3. Client-side (in-browser) CV generation:

- Open `public/index.html` in a browser (or serve the `public/` folder).
- Use the hero "Generate CV (PDF)" button to download a quick PDF built in the browser via jsPDF.
- Or go to the "Generate a Tailored CV" section, fill the fields (target role, salary, hours, etc.) and click the generate button to receive a tailored PDF.

3. Serve the `public/` folder to view the site (choose one):

   # Option A: PowerShell + Python (needs Python 3)
   python -m http.server 3000 -d .\public

   # Option B: node http-server
   npx http-server .\public -p 3000

Open http://localhost:3000 in your browser to view the site.

Notes about GitHub push
- I cannot push to your `https://github.com/Rabbani218` remote for you. To publish these changes to that repository, run:

  git add -A
  git commit -m "Modernize portfolio, add GitHub sync and resume generation"
  git push origin main

If your default branch is `master` replace `main` with `master`.

Using the optional GitHub token (for higher rate limits)
- To avoid GitHub's unauthenticated rate limit, set a personal access token in your browser's devtools console while running the site:

  localStorage.setItem('github_token', 'ghp_...your_token_here');

This token is only read by client-side code to increase API rate limits; do NOT commit tokens into the repo.

A GitHub Actions workflow has been added at `.github/workflows/ci-deploy-pages.yml`.

Workflow summary:
- Trigger: push to the `main` branch (change the trigger branch by editing the workflow).
- Steps: checkout, setup Node.js, npm ci, run `node generate_cv.js` to regenerate `public/assets/Rabbani_CV_2025.pdf`, upload the `public/` directory as the Pages artifact and deploy it to GitHub Pages.

You can change the branch that triggers the workflow by editing the `on.push.branches` field in the workflow file.

If you'd like, I can also prepare a workflow variant that only runs on `workflow_dispatch` (manual) or creates a PR with the generated PDF instead of automatically deploying — tell me which you prefer.

Automated QA & accessibility note
---------------------------------

To keep automated accessibility and visual checks deterministic, the QA scripts in this repo force the light theme when they run. This avoids gradient-based "bgGradient" inconclusive results during contrast computations and yields consistent screenshots for reviewers.

- To run the targeted axe accessibility check (forces light theme):

```powershell
node run-axe-targeted.js
```

- To run the visual QA runner (captures screenshots in light theme):

```powershell
node run-visual-qa.js
```

Both scripts set `localStorage.theme = 'light'` before the page loads and/or use `?force_theme=light` in the URL to ensure the page loads in light mode. If you want to test dark mode instead, pass `?force_theme=dark` to the page URL or remove the forced setting in the scripts.

Reports are written under `tmp/axe` and `tmp/screenshots` respectively (e.g. `tmp/axe/axe-results-targeted.json`).
