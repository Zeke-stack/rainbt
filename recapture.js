#!/usr/bin/env node
// Full-site recapture: records every network response while loading each page
// (desktop + mobile), then crawls the saved JS/CSS/HTML for any referenced
// asset that was never requested (lazy chunks, css maps, fonts, images, lottie).
//
// Usage: node recapture.js [--only=home,mines] [--cookies] [--out=recapture]
// Runs headed (Cloudflare blocks headless). --cookies injects cookie-header.txt (usually unnecessary).
// Output per target: <out>/<name>/page.html, rendered.html, url-map.json, files/...
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ORIGIN = 'https://rainbet.com';
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));

const TARGETS = {
  home: '/',
  casino: '/casino',
  plinko: '/casino/originals/plinko',
  'chicken-cross': '/casino/originals/chicken-cross',
  mines: '/casino/originals/mines-game',
  blackjack: '/casino/originals/blackjack',
};

const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const HEADLESS = args.includes('--headless');
const USE_COOKIES = args.includes('--cookies');
const OUT = path.resolve(__dirname, opt('out', 'recapture'));
const ONLY = opt('only', '') ? opt('only', '').split(',') : Object.keys(TARGETS);

const SKIP_HOST = /google|facebook|fbcdn|intercom|doubleclick|hotjar|sentry|cloudflare|turnstile|clarity|tiktok|snap|twitter/i;
const ASSET_EXT = /\.(js|css|json|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf|mp3|ogg|wav|mp4|webm|lottie|atlas|skel|wasm)(\?|$)/i;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

function loadCookies() {
  const out = [];
  const hdr = path.join(__dirname, 'cookie-header.txt');
  if (fs.existsSync(hdr)) {
    for (const pair of fs.readFileSync(hdr, 'utf8').split(';')) {
      const i = pair.indexOf('=');
      if (i > 0) out.push({ name: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim(), domain: '.rainbet.com', path: '/' });
    }
  }
  return out;
}
const COOKIES = loadCookies();
const COOKIE_HEADER = COOKIES.map(c => c.name + '=' + c.value).join('; ');

function localPathFor(filesDir, url) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index';
  p = p.replace(/[<>:"|?*]/g, '_');
  if (u.search) {
    const h = crypto.createHash('md5').update(u.search).digest('hex').slice(0, 8);
    const ext = path.extname(p);
    p = ext ? p.slice(0, -ext.length) + '__' + h + ext : p + '__' + h;
  }
  return path.join(filesDir, u.hostname, p);
}

function save(ctx, url, buf, contentType) {
  if (ctx.map.has(url)) return;
  const file = localPathFor(ctx.filesDir, url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  ctx.map.set(url, { file: path.relative(ctx.dir, file).replace(/\\/g, '/'), type: contentType || '', size: buf.length });
}

function normalize(raw, base) {
  try {
    raw = raw.replace(/&amp;/g, '&').replace(/\\u002F/g, '/').replace(/\\\//g, '/');
    const u = new URL(raw, base);
    if (!/^https?:$/.test(u.protocol) || SKIP_HOST.test(u.hostname)) return null;
    u.hash = '';
    return u.toString();
  } catch (e) { return null; }
}

// Pull every URL-looking reference out of a text file.
function extractRefs(text, baseUrl, ctx) {
  const found = new Set();
  const add = (s, b) => { const n = normalize(s, b || baseUrl); if (n) found.add(n); };

  // Next.js static paths in any form (absolute, relative, inside strings)
  for (const m of text.matchAll(/(?:https?:)?\/?_next\/(?:static|image)\/[A-Za-z0-9_\-./%\[\]()@~+=,]+/g)) {
    let s = m[0];
    if (!s.startsWith('http') && !s.startsWith('/')) s = '/' + s;
    add(s, ORIGIN);
  }
  // Webpack runtime chunk literals: "static/chunks/1234-abcd.js", "static/css/x.css", "static/media/x.woff2"
  for (const m of text.matchAll(/["'`]((?:static\/(?:chunks|css|media|[A-Za-z0-9_-]+)\/)[A-Za-z0-9_\-./\[\]%@~+=,]+)["'`]/g)) {
    add('/_next/' + m[1], ORIGIN);
  }
  // Webpack css-chunk map: "static/css/"+({...})[e]+".css" and chunk-name maps
  for (const m of text.matchAll(/static\/css\/["']\s*\+\s*(?:\(?\{[^}]*\}\[e\]\s*\|\|\s*e\)?|e)\s*\+\s*["']\.?["']?\s*\+?\s*\(?\{([^}]*)\}\)?\[e\]\s*\+\s*["']\.css["']/g)) {
    for (const kv of m[1].matchAll(/["']?([\w-]+)["']?\s*:\s*"([0-9a-f]{8,})"/g)) add('/_next/static/css/' + kv[2] + '.css', ORIGIN);
  }
  // Generic: { id: "hash" } map right after a "static/css/" literal
  let ci = text.indexOf('static/css/');
  while (ci !== -1) {
    const slice = text.slice(ci, ci + 6000);
    for (const kv of slice.matchAll(/(?:^|[,{])\s*["']?[\w-]+["']?\s*:\s*"([0-9a-f]{16})"/g)) add('/_next/static/css/' + kv[1] + '.css', ORIGIN);
    ci = text.indexOf('static/css/', ci + 11);
  }
  // CSS url(...)
  for (const m of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) if (!m[1].startsWith('data:')) add(m[1]);
  // src / href / srcset / content attributes
  for (const m of text.matchAll(/\b(?:src|href|data-src|poster|content)=["']([^"']+)["']/g)) if (ASSET_EXT.test(m[1])) add(m[1]);
  for (const m of text.matchAll(/\bsrcset=["']([^"']+)["']/g)) for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0]);
  // Quoted absolute URLs / root-relative paths with an asset extension inside JS/JSON
  for (const m of text.matchAll(/["'`]((?:https?:)?\/\/[^"'`\s\\]+?\.(?:js|css|json|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|mp3|ogg|wav|mp4|webm|lottie|wasm)(?:\?[^"'`\s\\]*)?)["'`]/gi)) add(m[1].startsWith('//') ? 'https:' + m[1] : m[1]);
  for (const m of text.matchAll(/["'`](\/[A-Za-z0-9_\-./%@~+=,]+?\.(?:js|css|json|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|mp3|ogg|wav|mp4|webm|lottie|wasm)(?:\?[^"'`\s\\]*)?)["'`]/gi)) add(m[1], ORIGIN);
  return found;
}

async function fetchMissing(ctx, url) {
  try {
    if (ctx.fetchPage && new URL(url).hostname.endsWith('rainbet.com')) {
      const r = await ctx.fetchPage.evaluate(async (u) => {
        try {
          const res = await fetch(u, { credentials: 'include' });
          if (!res.ok) return { status: res.status };
          const b = new Uint8Array(await res.arrayBuffer());
          let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768));
          return { status: 200, b64: btoa(s), type: res.headers.get('content-type') || '' };
        } catch (e) { return { status: 'err ' + e.message }; }
      }, url);
      if (r.status !== 200) { ctx.failed.set(url, r.status); return null; }
      const buf = Buffer.from(r.b64, 'base64');
      // Cloudflare/Next fallbacks can return an HTML page for a missing asset
      if (/text\/html/i.test(r.type) && !/\.html?(\?|$)/i.test(url)) { ctx.failed.set(url, 'html-fallback'); return null; }
      save(ctx, url, buf, r.type);
      return buf;
    }
    const res = await fetch(url, { headers: { 'User-Agent': UA, Cookie: COOKIE_HEADER, Referer: ORIGIN + '/' }, redirect: 'follow' });
    if (!res.ok) { ctx.failed.set(url, res.status); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    save(ctx, url, buf, res.headers.get('content-type'));
    return buf;
  } catch (e) { ctx.failed.set(url, e.message); return null; }
}

async function crawl(ctx, baseUrl) {
  const scanned = new Set();
  for (let round = 1; round <= 6; round++) {
    const queue = [];
    for (const [url, info] of ctx.map) {
      if (scanned.has(url)) continue;
      scanned.add(url);
      if (!/(javascript|css|json|html|text|xml)/i.test(info.type) && !/\.(js|css|json|html)(\?|$)/i.test(url)) continue;
      let text;
      try { text = fs.readFileSync(path.join(ctx.dir, info.file), 'utf8'); } catch (e) { continue; }
      for (const ref of extractRefs(text, url, ctx)) if (!ctx.map.has(ref) && !ctx.failed.has(ref)) queue.push(ref);
    }
    const uniq = [...new Set(queue)];
    if (!uniq.length) break;
    console.log(`    crawl round ${round}: ${uniq.length} new references`);
    let i = 0;
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (i < uniq.length) await fetchMissing(ctx, uniq[i++]);
    }));
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(res => {
      let y = 0;
      const t = setInterval(() => {
        window.scrollBy(0, 600); y += 600;
        if (y >= document.body.scrollHeight + 1200) { clearInterval(t); window.scrollTo(0, 0); res(); }
      }, 150);
    });
  });
}

async function capturePass(browser, ctx, url, profile) {
  const page = await browser.newPage();
  if (profile.ua) await page.setUserAgent(profile.ua);
  await page.setViewport(profile.viewport);
  await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  if (USE_COOKIES && COOKIES.length) { try { await page.setCookie(...COOKIES); } catch (e) {} }

  const pending = [];
  page.on('response', resp => {
    pending.push((async () => {
      try {
        const u = resp.url();
        if (u.startsWith('data:') || u.startsWith('blob:') || SKIP_HOST.test(new URL(u).hostname)) return;
        const st = resp.status();
        if (st < 200 || st >= 300) return;
        const buf = await resp.buffer();
        const ct = resp.headers()['content-type'] || '';
        if (resp.request().resourceType() === 'document' && u.split('#')[0] === url && !ctx.rawHtml) ctx.rawHtml = buf;
        save(ctx, u, buf, ct);
      } catch (e) { /* redirects / empty bodies */ }
    })());
  });

  console.log(`  [${profile.name}] loading ${url}`);
  try { await page.goto(url, { waitUntil: 'load', timeout: 45000 }); } catch (e) { console.log('    goto warning: ' + e.message); }

  // Wait out a Cloudflare challenge (solve manually in headed mode)
  for (let i = 0; i < 60; i++) {
    const title = await page.title().catch(() => '');
    if (!/just a moment|attention required|checking your browser/i.test(title)) break;
    if (i === 0) console.log('    Cloudflare challenge detected - solve it in the browser window...');
    await new Promise(r => setTimeout(r, 2000));
  }
  try { await page.waitForNetworkIdle({ idleTime: 2000, timeout: 30000 }); } catch (e) {}
  console.log('    scrolling');
  await Promise.race([autoScroll(page).catch(() => {}), new Promise(r => setTimeout(r, 15000))]);
  console.log('    scrolled');
  await new Promise(r => setTimeout(r, 2500));
  try { await page.waitForNetworkIdle({ idleTime: 1500, timeout: 20000 }); } catch (e) {}

  console.log('    snapshotting');
  const rendered = await page.content();
  if (profile.name === 'desktop') fs.writeFileSync(path.join(ctx.dir, 'rendered.html'), rendered);
  else fs.writeFileSync(path.join(ctx.dir, 'rendered-mobile.html'), rendered);
  await Promise.race([Promise.all(pending), new Promise(r => setTimeout(r, 20000))]);
  await page.close();
}

async function main() {
  if (!CHROME) throw new Error('Chrome/Edge not found');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: HEADLESS,
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1440,900'],
  });

  const profiles = [
    { name: 'desktop', ua: null, viewport: { width: 1440, height: 900 } },
    { name: 'mobile', ua: MOBILE_UA, viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  ];

  const summary = {};
  for (const name of ONLY) {
    if (!TARGETS[name]) { console.log('Unknown target: ' + name); continue; }
    const url = ORIGIN + TARGETS[name];
    const dir = path.join(OUT, name);
    const ctx = { dir, filesDir: path.join(dir, 'files'), map: new Map(), failed: new Map(), rawHtml: null };
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(ctx.filesDir, { recursive: true });
    console.log(`\n== ${name} (${url})`);

    for (const p of profiles) await capturePass(browser, ctx, url, p);
    const afterBrowser = ctx.map.size;
    if (ctx.rawHtml) fs.writeFileSync(path.join(dir, 'page.html'), ctx.rawHtml);
    ctx.fetchPage = await browser.newPage();
    try { await ctx.fetchPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) {}
    await crawl(ctx, url);
    await ctx.fetchPage.close().catch(() => {});
    ctx.fetchPage = null;
    fs.writeFileSync(path.join(dir, 'url-map.json'), JSON.stringify(Object.fromEntries(ctx.map), null, 2));
    if (ctx.failed.size) fs.writeFileSync(path.join(dir, 'failed.json'), JSON.stringify(Object.fromEntries(ctx.failed), null, 2));
    summary[name] = { fromBrowser: afterBrowser, fromCrawl: ctx.map.size - afterBrowser, total: ctx.map.size, failed: ctx.failed.size };
    console.log(`  saved ${ctx.map.size} files (${afterBrowser} from browser, ${ctx.map.size - afterBrowser} from crawl, ${ctx.failed.size} failed)`);
  }
  await browser.close();
  console.log('\nSummary:'); console.table(summary);
  console.log('Output: ' + OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
