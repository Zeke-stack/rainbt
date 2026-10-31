#!/usr/bin/env node
// ===========================================================
// build-mines.js  –  compiles mines.html + mines_files/ into
// a single fully self-contained HTML file.
// Run: node build-mines.js
// ===========================================================
'use strict';
const fs   = require('fs');
const path = require('path');

const SRC_HTML   = path.resolve(__dirname, '../mines/mines.html');
const ASSETS_DIR = path.resolve(__dirname, '../mines/mines_files');
const OUT_FILE   = path.resolve(__dirname, 'mines-standalone.html');
const API_ORIGIN = 'https://rainbt.vercel.app';   // all relative API calls re-pointed here

// ──────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────
const MIME = {
  '.js'   : 'application/javascript',
  '.css'  : 'text/css',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.gif'  : 'image/gif',
  '.svg'  : 'image/svg+xml',
  '.webp' : 'image/webp',
  '.ico'  : 'image/x-icon',
  '.woff' : 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf'  : 'font/ttf',
  '.otf'  : 'font/otf',
  '.mp3'  : 'audio/mpeg',
  '.ogg'  : 'audio/ogg',
  '.wav'  : 'audio/wav',
  '.json' : 'application/json',
};
function mimeOf(f) { return MIME[path.extname(f).toLowerCase()] || 'application/octet-stream'; }

// Build index of all files in mines_files/
const assetIndex = {};   // basename → absolute path
for (const f of fs.readdirSync(ASSETS_DIR)) {
  assetIndex[f] = path.join(ASSETS_DIR, f);
  // Also index without the hash prefix (hex_name.ext → name.ext)
  const noHash = f.replace(/^[0-9a-f]+_/, '');
  if (noHash !== f) assetIndex[noHash] = path.join(ASSETS_DIR, f);
}

function resolveAsset(ref) {
  // ref is whatever comes after ./mines_files/ or mines_files/
  const base = path.basename(ref.split('?')[0]);
  return assetIndex[base] || assetIndex[decodeURIComponent(base)] || null;
}

const fileCache = {};
function readAsset(absPath) {
  if (fileCache[absPath]) return fileCache[absPath];
  const buf = fs.readFileSync(absPath);
  fileCache[absPath] = buf;
  return buf;
}

function toDataUri(absPath) {
  const buf  = readAsset(absPath);
  const mime = mimeOf(absPath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Patch JS/CSS text: inline any sub-references to mines_files assets as data URIs
function patchText(text, isCSS) {
  // url('./mines_files/...') or url("./mines_files/...")
  text = text.replace(/url\((['"]?)(?:\.\/)?mines_files\/([^)'"]+)\1\)/g, (_, q, ref) => {
    const abs = resolveAsset(ref);
    if (!abs) return _;
    return `url(${toDataUri(abs)})`;
  });
  // src: "..." in @font-face
  text = text.replace(/src:\s*url\((['"]?)(?:\.\/)?mines_files\/([^)'"]+)\1\)/g, (_, q, ref) => {
    const abs = resolveAsset(ref);
    if (!abs) return _;
    return `src: url(${toDataUri(abs)})`;
  });
  // string references like "/_next/static/..." that appear inside JS we leave as-is (handled by server)
  return text;
}

// Patch API calls: relative fetch/axios calls → absolute to API_ORIGIN
// Matches fetch('/api/...') fetch('/v1/...) and axios.get('/v1/...') etc.
function patchApiCalls(js) {
  return js.replace(/(["'`])(\/(?:api|v1|v2)\/[^"'`\s)]+)\1/g, (m, q, p) => {
    // Don't double-patch already absolute URLs
    if (p.startsWith('http')) return m;
    return `${q}${API_ORIGIN}${p}${q}`;
  });
}

// ──────────────────────────────────────────────────────────
// main compilation
// ──────────────────────────────────────────────────────────
console.log('Reading ' + SRC_HTML + ' …');
let html = fs.readFileSync(SRC_HTML, 'utf8');

// ── 1. Inline <link rel="stylesheet" href="./mines_files/..."> ──
html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi, (tag, href) => {
  if (!href.includes('mines_files/')) return tag;
  const abs = resolveAsset(href);
  if (!abs) { console.warn('  CSS not found:', href); return tag; }
  let css = readAsset(abs).toString('utf8');
  css = patchText(css, true);
  console.log('  inline CSS:', path.basename(abs), Math.round(css.length/1024) + 'KB');
  return `<style data-src="${path.basename(abs)}">${css}</style>`;
});

// Also handle <link href="..." rel="stylesheet"> (attr order flipped)
html = html.replace(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*\/?>/gi, (tag, href) => {
  if (!href.includes('mines_files/')) return tag;
  const abs = resolveAsset(href);
  if (!abs) { console.warn('  CSS not found:', href); return tag; }
  let css = readAsset(abs).toString('utf8');
  css = patchText(css, true);
  console.log('  inline CSS:', path.basename(abs), Math.round(css.length/1024) + 'KB');
  return `<style data-src="${path.basename(abs)}">${css}</style>`;
});

// ── 2. Inline <script src="./mines_files/..."> ──
html = html.replace(/<script([^>]*)\ssrc=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, pre, src, post) => {
  if (!src.includes('mines_files/')) {
    // External CDN scripts (gtm, intercom, fb, etc.) – drop them silently (tracking noise)
    if (src.startsWith('http') && !src.includes('rainbet')) return '';
    return tag;
  }
  const abs = resolveAsset(src);
  if (!abs) { console.warn('  JS not found:', src); return tag; }
  let js = readAsset(abs).toString('utf8');
  js = patchApiCalls(js);
  // Attributes minus src – keep type, defer, etc.
  const attrs = (pre + post).replace(/\s*src=["'][^"']*["']/g, '').trim();
  console.log('  inline JS:', path.basename(abs), Math.round(js.length/1024) + 'KB');
  return `<script ${attrs} data-src="${path.basename(abs)}">${js}</script>`;
});

// ── 3. Replace image src="./mines_files/..." with data URIs ──
html = html.replace(/src=["']((?:\.\/)?mines_files\/[^"'?]+)/g, (m, ref) => {
  const abs = resolveAsset(ref);
  if (!abs) return m;
  return `src="${toDataUri(abs)}"`;
});

// ── 4. srcset="./mines_files/..." ──
html = html.replace(/srcset=["']([^"']+)["']/g, (m, srcset) => {
  if (!srcset.includes('mines_files/')) return m;
  const patched = srcset.replace(/((?:\.\/)?mines_files\/[^\s,?"']+)/g, (ref) => {
    const abs = resolveAsset(ref);
    return abs ? toDataUri(abs) : ref;
  });
  return `srcset="${patched}"`;
});

// ── 5. imagesrcset="..." (preload links) ──
html = html.replace(/imagesrcset=["']([^"']+)["']/g, (m, srcset) => {
  if (!srcset.includes('mines_files/')) return m;
  const patched = srcset.replace(/((?:\.\/)?mines_files\/[^\s,?"']+)/g, (ref) => {
    const abs = resolveAsset(ref);
    return abs ? toDataUri(abs) : ref;
  });
  return `imagesrcset="${patched}"`;
});

// ── 6. href="./mines_files/..." for icons/fonts ──
html = html.replace(/href=["']((?:\.\/)?mines_files\/[^"'?]+)/g, (m, ref) => {
  const abs = resolveAsset(ref);
  if (!abs) return m;
  const mime = mimeOf(abs);
  if (mime.startsWith('image') || mime.startsWith('font')) {
    return `href="${toDataUri(abs)}"`;
  }
  return m; // CSS already handled above
});

// ── 7. <link rel="preload" as="font" href="..."> font references ──
// Already handled by step 6.

// ── 8. Patch remaining inline API calls in the HTML's inline scripts ──
html = html.replace(/(<script(?:[^>]*)>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => {
  // Don't touch scripts that already have a data-src (already inlined)
  if (open.includes('data-src')) return m;
  const patched = patchApiCalls(body);
  return open + patched + close;
});

// ── 9. Inject a thin shim at the top of <body> to handle credentials ──
// The game needs cookies on rainbt.vercel.app – use SameSite=None so cross-origin fetch works.
// We also inject a global BASE_URL so any remaining relative XHR still works.
const SHIM = `<script id="rb-shim">
// Standalone mines shim – redirect all relative API fetches to rainbt.vercel.app
(function(){
  var BASE = '${API_ORIGIN}';
  var _nf = window.fetch;
  window.fetch = function(url, opts){
    if(typeof url === 'string' && url.charAt(0) === '/'){
      url = BASE + url;
      opts = Object.assign({ credentials: 'include' }, opts || {});
    }
    return _nf.call(this, url, opts);
  };
  // Patch XMLHttpRequest too (some chunks use axios which falls back to XHR)
  var _xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u){
    if(typeof u === 'string' && u.charAt(0) === '/') u = BASE + u;
    this.withCredentials = true;
    return _xo.apply(this, [m, u].concat(Array.prototype.slice.call(arguments, 2)));
  };
})();
</script>`;
html = html.replace(/<body[^>]*>/, m => m + SHIM);

// ── 10. Remove noisy external tracker scripts left in head/body ──
html = html.replace(/<script[^>]+src=["']https:\/\/(?:www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"']*["'][^>]*><\/script>/g, '');
html = html.replace(/<script[^>]+src=["']https:\/\/(?:www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"']*["'][^>]*\/>/g, '');

// ── 11. Drop broken <link rel="preload"> for /_next/image (CDN) ──
html = html.replace(/<link[^>]+rel=["']preload["'][^>]+href=["']\/_next\/image[^"']*["'][^>]*\/?>/g, '');
html = html.replace(/<link[^>]+href=["']\/_next\/image[^"']*["'][^>]+rel=["']preload["'][^>]*\/?>/g, '');

// ──────────────────────────────────────────────────────────
// write output
// ──────────────────────────────────────────────────────────
fs.writeFileSync(OUT_FILE, html, 'utf8');
const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
console.log(`\n✅  Written: ${OUT_FILE}`);
console.log(`   Size: ${kb} KB  (${Math.round(kb/1024*10)/10} MB)`);
