// run-visual-qa.js
// Small visual QA runner: serves ./public and captures screenshots at multiple viewports

const http = require('http');
const fs = require('fs');
const path = require('path');
// intentionally avoid relying on external mime implementations to keep the server robust
const port = process.env.PORT || 3001;
const publicDir = path.join(__dirname, 'public');

// Simple static server
const server = http.createServer((req, res) => {
  try {
    // Normalize the request path and strip any leading slash to avoid path.join treating it as absolute
    let safePath = req.url.split('?')[0].replace(/\.\./g, '');
    safePath = safePath.replace(/^\//, '');
    if (!safePath) safePath = 'index.html';
    let filePath = path.join(publicDir, safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Not found</title></head><body><main><h1>Not found</h1><p>File not found</p></main></body></html>');
      return;
    }
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const map = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf'};
    const type = map[ext] || 'text/html';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Server error</title></head><body><main><h1>Server error</h1><pre>' + String(e && e.message) + '</pre></main></body></html>');
  }
});

server.listen(port, async () => {
  console.log(`Static server started at http://localhost:${port}`);
  await runPuppeteer(`http://localhost:${port}`);
  server.close();
});

async function runPuppeteer(url) {
  const puppeteer = require('puppeteer');
  const outDir = path.join(__dirname, 'tmp', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // collect console messages and page errors
  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  const results = [];
  // Ensure deterministic light theme for visual QA to avoid gradient-based incompletes
  try {
    // Set theme in localStorage before any page scripts run
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('theme', 'light'); } catch (e) { /* ignore */ }
    });
  } catch (e) { /* continue without forcing if not supported */ }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    // Force light theme for deterministic visuals
    const target = `${url}?force_theme=light`;
    try {
      const resp = await page.goto(target, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(800); // allow animations to settle
      const p = path.join(outDir, `${vp.name}-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: p, fullPage: false });
      results.push({ viewport: vp, screenshot: p, status: resp && resp.status() });
      console.log(`Captured ${p}`);
    } catch (e) {
      console.error('Error capturing', vp, e && e.message);
      results.push({ viewport: vp, error: e && e.message });
    }
    // small pause
    await sleep(300);
  }

  await browser.close();

  // Write a simple report
  const report = {
    url,
    generatedAt: new Date().toISOString(),
    results,
    logs
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log('Visual QA complete. Screenshots and report saved to', outDir);
}
