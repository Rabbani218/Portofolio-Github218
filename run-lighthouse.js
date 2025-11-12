// run-lighthouse.js
// Launch a headless chrome and run Lighthouse accessibility/performance audit on the local static server
const chromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');
const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const port = process.env.PORT || 3002;
const publicDir = path.join(__dirname, 'public');
const outDir = path.join(__dirname, 'tmp', 'lighthouse');
fs.mkdirSync(outDir, { recursive: true });

const server = http.createServer((req, res) => {
  try {
    const safePath = req.url.split('?')[0].replace(/\.\./g, '');
    let filePath = path.join(publicDir, safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const data = fs.readFileSync(filePath);
    const type = mime.getType(filePath) || 'text/html';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch (e) {
    res.writeHead(500);
    res.end('Server error');
  }
});

(async () => {
  server.listen(port, async () => {
    console.log(`Static server started at http://localhost:${port}`);

    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const options = { port: chrome.port, output: 'html', onlyCategories: ['accessibility', 'performance', 'best-practices', 'seo'] };
  // Force the light theme for Lighthouse runs to avoid gradient-based incomplete contrast results
  const url = `http://localhost:${port}/?force_theme=light`;

    try {
      const runnerResult = await lighthouse(url, options);
      const reportHtml = runnerResult.report;
      const reportPath = path.join(outDir, 'lighthouse-report.html');
      fs.writeFileSync(reportPath, reportHtml);
      fs.writeFileSync(path.join(outDir, 'lighthouse-result.json'), JSON.stringify(runnerResult.lhr, null, 2));
      console.log('Lighthouse report saved to', reportPath);
      const summary = runnerResult.lhr.categories;
      console.log('Category scores:', Object.fromEntries(Object.entries(summary).map(([k,v])=>[k, v.score])));
    } catch (e) {
      console.error('Lighthouse run failed:', e);
    } finally {
      await chrome.kill();
      server.close();
    }
  });
})();
