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
