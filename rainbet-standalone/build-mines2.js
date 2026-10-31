#!/usr/bin/env node
// build-mines2.js  –  compiles the browser-saved mines page into a single
// fully self-contained HTML with:
//   • every local asset inlined (CSS, JS, images, fonts)
//   • every external link / tracker / CDN reference removed
//   • API calls re-pointed to rainbt.vercel.app
'use strict';
const fs   = require('fs');
const path = require('path');
const https = require('https');

const SRC_HTML   = path.resolve(__dirname, '../mines/mines.html');
const ASSETS_DIR = path.resolve(__dirname, '../mines/mines_files');
const OUT_FILE   = path.resolve(__dirname, 'mines-standalone.html');
const API_ORIGIN = 'https://rainbt.vercel.app';

// ── MIME map ──────────────────────────────────────────────────────────────────
const MIME = {
  '.js'  :'.js.download' ,  // handled below
  '.css' : 'text/css',
  '.png' : 'image/png',     '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',     '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico' : 'image/x-icon',  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf' : 'font/ttf',      '.otf': 'font/otf',
  '.mp3' : 'audio/mpeg',    '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};
function mimeOf(f) {
  const ext = path.extname(f).toLowerCase();
  if (ext === '.download') return 'application/javascript'; // .js.download
  return MIME[ext] || 'application/octet-stream';
}

// ── Asset index ───────────────────────────────────────────────────────────────
const assetIndex = {};
for (const f of fs.readdirSync(ASSETS_DIR)) {
  const full = path.join(ASSETS_DIR, f);
  assetIndex[f] = full;
  // strip .download suffix for lookup
  if (f.endsWith('.download')) assetIndex[f.slice(0, -9)] = full;
  // strip hash prefix: abc123_name.css → name.css
  const noHash = f.replace(/^[0-9a-f]+_/, '');
  if (noHash !== f) {
    assetIndex[noHash] = full;
    if (noHash.endsWith('.download')) assetIndex[noHash.slice(0, -9)] = full;
  }
}

function resolveLocal(ref) {
  // ref = whatever comes after the files-folder name in the href/src
  const bare = path.basename(ref.split('?')[0]);
  return assetIndex[bare]
      || assetIndex[decodeURIComponent(bare)]
      || assetIndex[bare + '.download']
      || null;
}

const fileCache = {};
function readBuf(p) {
  if (!fileCache[p]) fileCache[p] = fs.readFileSync(p);
  return fileCache[p];
}
function toDataUri(p) {
  return `data:${mimeOf(p)};base64,${readBuf(p).toString('base64')}`;
}

// ── Inline any mines_files/ url() refs inside CSS/JS text ────────────────────
function patchSubRefs(text) {
  // url("./mines_files/foo.woff2")  →  url(data:...)
  return text.replace(/url\((['"]?)(?:[^)'"]*mines_files\/)([^)'"]+)\1\)/gi, (_, q, ref) => {
    const abs = resolveLocal(ref);
    return abs ? `url(${toDataUri(abs)})` : _;
  });
}

// ── Patch absolute API calls that still hit rainbet.com ──────────────────────
function patchApiUrls(text) {
  // https://rainbet.com/v1/...  →  https://rainbt.vercel.app/v1/...
  text = text.replace(/https?:\/\/(?:www\.)?rainbet\.com(\/(?:v1|v2|api)\/[^"'`\s)\\]+)/g,
    (_, p) => API_ORIGIN + p);
  // bare relative "/api/..." or "/v1/..." in JS strings (not already absolute)
  text = text.replace(/(["'`])(\/(?:api|v1|v2)\/[^"'`\s)\\]+)\1/g, (m, q, p) => {
    if (p.startsWith('http')) return m;
    return `${q}${API_ORIGIN}${p}${q}`;
  });
  return text;
}

// ── Scripts to skip entirely (break in file:// or not needed) ────────────────
const SKIP_JS_PATTERNS = [
  'api.js',              // Cloudflare Turnstile – throws on file:// URLs
  'turnstile',
  'googletagmanager',
  'intercom',
  'facebook',
  'cloudflare',
];
function shouldSkipJs(name) {
  const lower = path.basename(name).toLowerCase();
  return SKIP_JS_PATTERNS.some(p => lower.includes(p));
}

// ── External URL strippers ────────────────────────────────────────────────────
const DEAD_SCRIPT_HOSTS = [
  'googletagmanager.com','connect.facebook.net','widget.intercom.io',
  'challenges.cloudflare.com','accounts.google.com','apis.google.com',
  'www.google.com','static.cloudflareinsights.com','cdn.rainbet.com',
];
function isDeadExternal(url) {
  try {
    const h = new URL(url).hostname;
    return DEAD_SCRIPT_HOSTS.some(d => h === d || h.endsWith('.' + d));
  } catch { return false; }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
console.log('Reading source…');
let html = fs.readFileSync(SRC_HTML, 'utf8');

// Track inlined scripts to avoid duplicates
const inlinedScripts = new Set();

// 0. Remove the IE "saved from url" comment (causes browser quirks)
html = html.replace(/<!--\s*saved from url[^>]*-->/gi, '');

// 1. Remove ALL tracking / ad-blocking CSS blobs injected by browser extensions
html = html.replace(/<style[^>]*>([\s\S]*?content\.ad\/[\s\S]*?)<\/style>/g, '');

// 2. Inline <link rel="stylesheet" …> for local files
html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*href=["'](\.\/[^"']+)["'][^>]*\/?>/gi, inlineCSS);
html = html.replace(/<link[^>]+href=["'](\.\/[^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, (t,h) => inlineCSS(t, h));
function inlineCSS(tag, href) {
  const abs = resolveLocal(href);
  if (!abs) { console.warn('  CSS not found:', href); return ''; }
  let css = readBuf(abs).toString('utf8');
  css = patchSubRefs(css);
  css = patchApiUrls(css);
  console.log('  CSS:', path.basename(abs), Math.round(css.length/1024)+'KB');
  return `<style>${css}</style>`;
}

// 3. Remove external <link> tags (CDN fonts, preconnect, manifests, canonical, etc.)
html = html.replace(/<link[^>]+href=["']https?:\/\/[^"']+["'][^>]*\/?>/gi, '');
html = html.replace(/<link[^>]+href=["']\/[^.][^"']*["'][^>]*\/?>/gi, '');   // /manifest.json etc.

// 4. Inline JS from <link rel="preload/prefetch" as="script" href="..."> tags
//    (Next.js saves chunks as link hints rather than <script src> tags)
function inlineJsRef(href) {
  if (!href || href.startsWith('http')) return null; // skip external
  if (shouldSkipJs(href)) { console.log('  JS skipped (blocklist):', path.basename(href)); return ''; }
  const abs = resolveLocal(href);
  if (!abs) { console.warn('  JS not found (link-as-script):', href); return ''; }
  if (shouldSkipJs(abs)) { console.log('  JS skipped (blocklist):', path.basename(abs)); return ''; }
  const name = path.basename(abs);
  if (inlinedScripts.has(abs)) return ''; // already inlined
  inlinedScripts.add(abs);
  let js = readBuf(abs).toString('utf8');
  js = patchApiUrls(js);
  console.log('  JS (prefetch):', name, Math.round(js.length/1024)+'KB');
  // If JS contains template literals with ${, base64-encode it so VS Code
  // doesn't try to resolve ${...} as file paths inside the HTML.
  if (js.includes('${')) {
    const b64 = Buffer.from(js).toString('base64');
    return `<script>try{(0,eval)(atob("${b64}"))}catch(e){console.warn("[${name}]",e)}</script>`;
  }
  return `<script>try{${js}}catch(e){console.warn("[${name}]",e)}</script>`;
}

// Collect all prefetch/preload-as-script link tags and build replacement blocks
const jsBlocks = [];
html = html.replace(/<link([^>]+)rel=["'](?:preload|prefetch|modulepreload)["']([^>]*)\/?>/gi, (tag, pre, post) => {
  const attrs = pre + post;
  const asMatch = attrs.match(/\bas=["']script["']/i);
  const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
  if (asMatch && hrefMatch) {
    const block = inlineJsRef(hrefMatch[1]);
    if (block) jsBlocks.push(block);
    return ''; // remove the link tag
  }
  // Non-script preloads (fonts, images, etc.) → just remove them
  return '';
});

// 4b. Also handle any remaining <link as="script"> without rel (some browsers save this way)
html = html.replace(/<link([^>]*)\bas=["']script["']([^>]*)\/?>/gi, (tag, pre, post) => {
  const attrs = pre + post;
  const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
  if (hrefMatch) {
    const block = inlineJsRef(hrefMatch[1]);
    if (block) jsBlocks.push(block);
  }
  return '';
});

// 5. Inline or drop actual <script src="..."> (may be absent in Next.js saved pages)
html = html.replace(/<script([^>]*?)\ssrc=["']([^"']+)["']([^>]*?)>\s*<\/script>/gi, (tag, pre, src, post) => {
  if (src.startsWith('http')) return ''; // drop all external (dead or not)
  if (shouldSkipJs(src)) { console.log('  JS skipped (blocklist):', path.basename(src)); return ''; }
  const abs = resolveLocal(src);
  if (!abs) { console.warn('  JS not found:', src); return ''; }
  if (shouldSkipJs(abs)) { console.log('  JS skipped (blocklist):', path.basename(abs)); return ''; }
  const name = path.basename(abs);
  if (inlinedScripts.has(abs)) return ''; // already inlined via prefetch
  inlinedScripts.add(abs);
  let js = readBuf(abs).toString('utf8');
  js = patchApiUrls(js);
  const attrs = (pre + post).replace(/\s*src=["'][^"']*["']/g, '').trim();
  console.log('  JS:', name, Math.round(js.length/1024)+'KB');
  if (js.includes('${')) {
    const b64 = Buffer.from(js).toString('base64');
    return `<script ${attrs}>try{(0,eval)(atob("${b64}"))}catch(e){console.warn("[${name}]",e)}</script>`;
  }
  return `<script ${attrs}>try{${js}}catch(e){console.warn("[${name}]",e)}</script>`;
});

// 5b. Inject all prefetched JS blocks right before </head> (or at end of <head>)
if (jsBlocks.length > 0) {
  const bundle = jsBlocks.join('\n');
  if (html.includes('</head>')) {
    html = html.replace('</head>', bundle + '\n</head>');
  } else {
    html = html.replace(/(<body[^>]*>)/, bundle + '\n$1');
  }
  console.log(`  Injected ${jsBlocks.length} JS blocks before </head>`);
}

// 6. Convert local image/icon src → data URI
html = html.replace(/src=["'](\.\/[^"'?#]+)["']/g, (m, ref) => {
  const abs = resolveLocal(ref);
  return abs ? `src="${toDataUri(abs)}"` : m;
});

// 7. srcset / imagesrcset with local refs → data URIs
const patchSrcset = (set) =>
  set.replace(/(\.\/[^\s,?"']+)/g, ref => { const a = resolveLocal(ref); return a ? toDataUri(a) : ref; });
html = html.replace(/srcset=["']([^"']+)["']/g, (_, s) => `srcset="${patchSrcset(s)}"`);
html = html.replace(/imagesrcset=["']([^"']+)["']/g, (_, s) => `imagesrcset="${patchSrcset(s)}"`);

// 8. Local href (icons remaining) → data URI
html = html.replace(/href=["'](\.\/[^"'?#]+)["']/g, (m, ref) => {
  const abs = resolveLocal(ref);
  if (!abs) return m;
  const mime = mimeOf(abs);
  if (mime.startsWith('image') || mime.startsWith('font')) return `href="${toDataUri(abs)}"`;
  return m;
});

// 9. Fix remaining absolute rainbet.com API calls inside inline <script>…</script>
html = html.replace(/(<script(?:[^>]*)>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => {
  return open + patchApiUrls(body) + close;
});

// 10. Remove ALL remaining external href links (cdn.rainbet.com, rainbet.com, etc.)
// a) <a href="https://..."> – keep the anchor content but strip the href
html = html.replace(/(<a\s[^>]*)\shref=["']https?:\/\/[^"']*["']([^>]*>)/gi, (_, pre, post) => pre + post);
// b) Remove any remaining <link> pointing externally (double-sweep)
html = html.replace(/<link[^>]+href=["']https?:\/\/[^"']+["'][^>]*\/?>/gi, '');
// c) Remove /_next/image CDN preloads
html = html.replace(/<link[^>]+\/_next\/image[^>]*\/?>/gi, '');
// d) Remove og:image / canonical meta pointing to rainbet.com
html = html.replace(/<meta[^>]+content=["']https?:\/\/cdn\.rainbet\.com[^"']*["'][^>]*\/?>/gi, '');
html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>/gi, '');

// 11. Remove GTM noscript iframe
html = html.replace(/<noscript>[^<]*<iframe[^>]*googletagmanager[^<]*<\/iframe>[^<]*<\/noscript>/gi, '');

// 11b. Remove Cloudflare captcha container (hidden div with external iframe)
html = html.replace(/<div[^>]+id=["']captcha-container["'][^>]*>[\s\S]*?<\/div>\s*(?=<div)/i,
  '<div id="captcha-container" style="display:none"></div>');

// 11c. Strip remaining href="https://rainbet.com/..." (handles &amp; variants)
html = html.replace(/\shref=["']https?:\/\/(?:www\.)?rainbet\.com[^"']*["']/g, '');

// 11d. Remove Cloudflare/external src iframes
html = html.replace(/<iframe[^>]+src=["']https?:\/\/challenges\.cloudflare[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi, '');
html = html.replace(/<iframe[^>]+src=["']https?:\/\/challenges\.cloudflare[^"']*["'][^>]*\/>/gi, '');
// Also strip just the src attribute in case it's inside a shadow-root template
html = html.replace(/\ssrc=["']https?:\/\/challenges\.cloudflare[^"']*["']/gi, '');

// 12. Remove the huge browser-extension ad-blocker <style> block (starts with ":root img[width=")
html = html.replace(/<style[^>]*>[\s\S]*?:root img\[width="728"\][\s\S]*?<\/style>/g, '');

// 13. Inject the fetch/XHR shim immediately after <body …>
const SHIM = `<script id="rb-shim">
// Standalone mines shim – all relative API calls → rainbt.vercel.app
(function(){
  var BASE = '${API_ORIGIN}';
  var _nf = window.fetch;
  window.fetch = function(url, opts){
    if(typeof url === 'string' && url.charAt(0) === '/'){
      url = BASE + url;
      opts = Object.assign({}, opts || {}, { credentials: 'include' });
    } else if(typeof url === 'string' && url.includes('rainbet.com/')){
      url = url.replace(/https?:\\/\\/(?:www\\.)?rainbet\\.com/, BASE);
      opts = Object.assign({}, opts || {}, { credentials: 'include' });
    }
    return _nf.call(this, url, opts);
  };
  var _xopen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u){
    if(typeof u === 'string'){
      if(u.charAt(0) === '/') u = BASE + u;
      else if(u.includes('rainbet.com/')) u = u.replace(/https?:\\/\\/(?:www\\.)?rainbet\\.com/, BASE);
    }
    this.withCredentials = true;
    return _xopen.apply(this, [m, u].concat(Array.prototype.slice.call(arguments, 2)));
  };
  // Silence Next.js router complaints about missing _next/data
  window.__NEXT_DATA__ = window.__NEXT_DATA__ || {
    props:{pageProps:{}}, page:'/casino/originals/mines-game',
    query:{}, buildId:'standalone', isFallback:false, gssp:true
  };
})();
</script>`;
html = html.replace(/(<body[^>]*>)/, m => m + '\n' + SHIM);

// 14. Final sweep: remove any leftover src/href pointing to /_next/static CDN
html = html.replace(/\ssrc=["']\/_next\/[^"']+["']/g, '');
html = html.replace(/\shref=["']\/_next\/[^"']+["']/g, '');

// 15. Final sweep: strip ALL remaining external href/src attributes from any element
//     (covers social links, t.me, x.com, anjcdn.org, whatever wasn't caught above)
html = html.replace(/\shref=["']https?:\/\/(?!(?:rainbt\.vercel\.app))[^"']+["']/g, '');
html = html.replace(/\ssrc=["']https?:\/\/(?!(?:rainbt\.vercel\.app))[^"']+["']/g, '');

// 15b. Remove Intercom widget elements
html = html.replace(/<div[^>]*class="intercom-lightweight-app"[\s\S]*?<\/div>(?:\s*<\/div>)*/gi, '');
html = html.replace(/<iframe[^>]*intercom-frame[^>]*>[\s\S]*?<\/iframe>/gi, '');

// 16. (Removed – template literal escaping now handled via base64 in steps 4/5)

// Write output
fs.writeFileSync(OUT_FILE, html, 'utf8');
const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
console.log(`\nDone → ${OUT_FILE}`);
console.log(`Size: ${kb} KB (${(kb/1024).toFixed(1)} MB)`);
