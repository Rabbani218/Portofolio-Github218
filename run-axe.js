// run-axe.js
// Runs axe-core accessibility checks using Puppeteer and saves report to tmp/axe
const http = require('http');
const fs = require('fs');
const path = require('path');
// intentionally avoid relying on external mime implementations to keep the server robust
const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;

const port = process.env.PORT || 3003;
const publicDir = path.join(__dirname, 'public');
const outDir = path.join(__dirname, 'tmp', 'axe');
fs.mkdirSync(outDir, { recursive: true });

const server = http.createServer((req, res) => {
  try {
    const safePath = req.url.split('?')[0].replace(/\.\./g, '');
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

(async () => {
  server.listen(port, async () => {
    console.log(`Static server started at http://localhost:${port}`);
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const url = `http://localhost:${port}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      // inject axe
      await page.evaluate(axeSource);
      const results = await page.evaluate(async () => {
        return await window.axe.run();
      });
      fs.writeFileSync(path.join(outDir, 'axe-results.json'), JSON.stringify(results, null, 2));
      console.log('Axe results saved to', outDir);
    } catch (e) {
      console.error('Axe run failed:', e);
    } finally {
      await browser.close();
      server.close();
    }
  });
})();
