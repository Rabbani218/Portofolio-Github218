// run-smoke-page.js
// Quick smoke checks: open /index.html and report document.title, html.lang, presence of main/h1, and console/page errors.
const http = require('http');
const fs = require('fs');
const path = require('path');
// avoid external mime dependency here; use a small extension map below
const puppeteer = require('puppeteer');

const port = process.env.PORT || 3005;
const publicDir = path.join(__dirname, 'public');

const server = http.createServer((req, res) => {
  try {
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
    res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Server error</title></head><body><main><h1>Server error</h1><pre>' + String(e.message) + '</pre></main></body></html>');
  }
});

(async () => {
  server.listen(port, async () => {
    console.log(`Static server started at http://localhost:${port}`);
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const url = `http://localhost:${port}/index.html`;

    const logs = [];
    page.on('console', msg => logs.push({ type: 'console', text: msg.text() }));
    page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));

    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle2' });
      const info = await page.evaluate(() => {
        return {
          title: document.title || null,
          lang: document.documentElement.lang || null,
          hasMain: !!document.querySelector('main'),
          hasH1: !!document.querySelector('h1'),
          h1Text: (document.querySelector('h1') && document.querySelector('h1').innerText) || null
        };
      });
        const fullHtml = await page.content();
        console.log('full HTML returned by server:\n', fullHtml);
      console.log('response status:', resp && resp.status());
      console.log('page info:', info);
      console.log('console/page logs:', logs);
    } catch (e) {
      console.error('Smoke test failed:', e && e.message);
    } finally {
      await browser.close();
      server.close();
    }
  });
})();
