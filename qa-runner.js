const http = require('http');
const fs = require('fs');
const path = require('path');

const fsp = fs.promises;
const publicDir = path.join(__dirname, 'public');
const tmpDir = path.join(__dirname, 'tmp');

const MIME_MAP = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
};

function sanitizePath(requestUrl) {
  const base = (requestUrl || '/').split('?')[0];
  const normalized = base.replace(/\\/g, '/').replace(/\.{2,}/g, '').replace(/^\/+/, '');
  return normalized || 'index.html';
}

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      let safePath = sanitizePath(req.url);
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
      const type = MIME_MAP[ext] || 'text/html';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Server error</title></head><body><main><h1>Server error</h1><pre>' + String(err && err.message) + '</pre></main></body></html>');
    }
  });
}

async function runWithServer(executor) {
  const server = createStaticServer();
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const ctx = { origin: `http://localhost:${address.port}`, port: address.port };
      executor(ctx)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          server.close();
        });
    });
  });
}

function parseArgs(argv) {
  const options = {};
  const positional = [];
  for (const token of argv) {
    if (token.startsWith('--')) {
      const stripped = token.slice(2);
      const idx = stripped.indexOf('=');
      if (idx === -1) {
        options[stripped] = true;
      } else {
        const key = stripped.slice(0, idx);
        const value = stripped.slice(idx + 1);
        options[key] = value;
      }
    } else {
      positional.push(token);
    }
  }
  return { options, positional };
}

function printUsage() {
  console.log('Usage: node qa-runner.js <command> [options]');
  console.log('Commands:');
  console.log('  smoke             Quick smoke check for index.html');
  console.log('  axe               Run axe-core accessibility scan');
  console.log('  visual            Capture responsive screenshots');
  console.log('  lighthouse        Run Lighthouse audit (html + json reports)');
  console.log('  all               Run smoke, axe, axe --targeted, visual, lighthouse sequentially');
  console.log('Options:');
  console.log('  --force-theme=<light|dark>  Force theme via localStorage and query param when supported');
  console.log('  --targeted                  For axe command: hit /index.html with forced light theme');
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function launchBrowser() {
  const puppeteer = require('puppeteer');
  return puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

async function attachThemePreload(page, theme) {
  if (!theme) return;
  await page.evaluateOnNewDocument(t => {
    try {
      localStorage.setItem('theme', t);
    } catch (e) {}
  }, theme);
}

function resolveThemeOption(options, fallback) {
  return options['force-theme'] || options.force_theme || options.forceTheme || fallback;
}

async function runSmoke(options) {
  const forceTheme = resolveThemeOption(options);
  await runWithServer(async ({ origin }) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));
    if (forceTheme) await attachThemePreload(page, forceTheme);
    const query = forceTheme ? `?force_theme=${forceTheme}` : '';
    const targetUrl = `${origin}/index.html${query}`;
    try {
      const resp = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const info = await page.evaluate(() => ({
        title: document.title || null,
        lang: document.documentElement.lang || null,
        hasMain: !!document.querySelector('main'),
        hasH1: !!document.querySelector('h1'),
        h1Text: (document.querySelector('h1') && document.querySelector('h1').innerText) || null
      }));
      const status = resp && typeof resp.status === 'function' ? resp.status() : null;
      console.log('Smoke status:', status);
      console.log('Smoke info:', info);
      if (logs.length) console.log('Page logs:', logs);
    } finally {
      await browser.close();
    }
  });
}

async function runAxe(options) {
  const targeted = !!options.targeted || !!options.t;
  const forceTheme = resolveThemeOption(options, targeted ? 'light' : undefined);
  await ensureDir(path.join(tmpDir, 'axe'));
  await runWithServer(async ({ origin }) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    if (forceTheme) await attachThemePreload(page, forceTheme);
    const query = forceTheme ? `?force_theme=${forceTheme}` : '';
    const targetPath = targeted ? '/index.html' : '/';
    const targetUrl = `${origin}${targetPath}${query}`;
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const axeSource = require('axe-core').source;
      await page.evaluate(axeSource);
      const results = await page.evaluate(async () => {
        return await window.axe.run();
      });
      const fileName = targeted ? 'axe-results-targeted.json' : 'axe-results.json';
      const outPath = path.join(tmpDir, 'axe', fileName);
      await fsp.writeFile(outPath, JSON.stringify(results, null, 2));
      console.log('Axe results saved to', outPath);
    } finally {
      await browser.close();
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVisual(options) {
  const forceTheme = resolveThemeOption(options, 'light');
  const outDir = path.join(tmpDir, 'screenshots');
  await ensureDir(outDir);
  await runWithServer(async ({ origin }) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));
    if (forceTheme) await attachThemePreload(page, forceTheme);
    const query = forceTheme ? `?force_theme=${forceTheme}` : '';
    const viewports = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 812 }
    ];
    const results = [];
    try {
      for (const vp of viewports) {
        await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
        try {
          const resp = await page.goto(`${origin}/index.html${query}`, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(800);
          const screenshotPath = path.join(outDir, `${vp.name}-${vp.width}x${vp.height}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          const status = resp && typeof resp.status === 'function' ? resp.status() : null;
          results.push({ viewport: vp, screenshot: screenshotPath, status });
          console.log('Captured', screenshotPath);
        } catch (err) {
          console.error('Error capturing', vp.name, err && err.message);
          results.push({ viewport: vp, error: err && err.message });
        }
        await sleep(300);
      }
    } finally {
      await browser.close();
    }
    const report = {
      url: `${origin}/index.html${query}`,
      generatedAt: new Date().toISOString(),
      results,
      logs
    };
    const reportPath = path.join(outDir, 'report.json');
    await fsp.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log('Visual QA report saved to', reportPath);
  });
}

async function runLighthouse(options) {
  const forceTheme = resolveThemeOption(options, 'light');
  const outDir = path.join(tmpDir, 'lighthouse');
  await ensureDir(outDir);
  await runWithServer(async ({ origin }) => {
    const chromeLauncher = require('chrome-launcher');
    const lighthouseModule = await import('lighthouse');
    const lighthouse = lighthouseModule.default || lighthouseModule;
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const query = forceTheme ? `?force_theme=${forceTheme}` : '';
    const url = `${origin}/index.html${query}`;
    try {
      const options = { port: chrome.port, output: 'html', onlyCategories: ['accessibility', 'performance', 'best-practices', 'seo'] };
      const runnerResult = await lighthouse(url, options);
      const reportHtml = runnerResult.report;
      const reportPath = path.join(outDir, 'lighthouse-report.html');
      await fsp.writeFile(reportPath, reportHtml);
      await fsp.writeFile(path.join(outDir, 'lighthouse-result.json'), JSON.stringify(runnerResult.lhr, null, 2));
      const summary = runnerResult.lhr.categories;
      const scores = Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, value.score]));
      console.log('Lighthouse report saved to', reportPath);
      console.log('Category scores:', scores);
    } finally {
      await chrome.kill();
    }
  });
}

async function runAll(options) {
  await runSmoke(options);
  await runAxe(options);
  await runAxe({ ...options, targeted: true });
  await runVisual(options);
  await runLighthouse(options);
}

const HANDLERS = {
  smoke: runSmoke,
  axe: runAxe,
  visual: runVisual,
  lighthouse: runLighthouse,
  all: runAll
};

(async () => {
  try {
    const argv = process.argv.slice(2);
    const command = argv.shift();
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      printUsage();
      process.exit(0);
    }
    const { options, positional } = parseArgs(argv);
    if (positional.length) {
      options._ = positional;
    }
    const handler = HANDLERS[command];
    if (!handler) {
      console.error('Unknown command:', command);
      printUsage();
      process.exit(1);
    }
    await handler(options);
  } catch (err) {
    console.error('QA runner failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
