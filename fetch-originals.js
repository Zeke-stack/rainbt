// No-browser capture of Rainbet Originals pages + every referenced asset.
// Usage: node fetch-originals.js [slug,slug,...]
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ORIGIN = 'https://rainbet.com';
const ROOT = path.join(__dirname, 'new-build', 'root');
const PAGES = path.join(__dirname, 'new-build', 'pages');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ALL = ['dice', 'limbo', 'keno', 'hilo', 'tower', 'coinflip', 'wheel', 'roulette', 'moles', 'war', 'baccarat', 'rock-paper-scissors', 'case-opening', 'case-battles'];
const slugs = process.argv[2] ? process.argv[2].split(',') : ALL;

const seen = new Set();
let fetched = 0, failed = [];

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const r = await new Promise(res => execFile('curl.exe', ['-sL', '-A', UA, '-w', '\n%{http_code}', url], { encoding: 'buffer', maxBuffer: 1 << 28 }, (e, out) => res(e ? null : out)));
    if (r) {
      const nl = r.lastIndexOf(10), code = r.slice(nl + 1).toString();
      if (code === '404') return null;
      if (code === '200') return r.slice(0, nl);
    }
    await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}

function refs(text) {
  const out = new Set();
  const re = /(?:\/_next\/)?static\/(?:chunks|media|css)\/[A-Za-z0-9_\-.~%\[\]]+\.(?:js|css|woff2?|png|svg|webp|jpe?g|json|mp3|wav|ogg|ico|wasm)/g;
  for (const m of text.matchAll(re)) out.add('/_next/' + m[0].replace(/^\/_next\//, ''));
  for (const m of text.matchAll(/["'(](\/(?:audios|Images|api\/translations)\/[A-Za-z0-9_\-./%]+\.(?:mp3|wav|ogg|png|svg|webp|jpe?g|json))/g)) out.add(m[1]);
  return out;
}

async function crawl(queue) {
  let idx = 0;
  const worker = async () => {
    while (idx < queue.length) {
      const p = queue[idx++];
      if (seen.has(p)) continue;
      seen.add(p);
      const file = path.join(ROOT, decodeURIComponent(p.split('?')[0]));
      let buf;
      if (fs.existsSync(file)) buf = fs.readFileSync(file);
      else {
        buf = await get(ORIGIN + p);
        if (!buf) { failed.push(p); continue; }
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
        fetched++;
      }
      if (/\.(js|css|json)$/.test(p)) for (const r of refs(buf.toString('utf8'))) if (!seen.has(r)) queue.push(r);
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
}

(async () => {
  fs.mkdirSync(PAGES, { recursive: true });
  const queue = [];
  for (const s of slugs) {
    const buf = await get(`${ORIGIN}/casino/originals/${s}`);
    if (!buf) { console.log('PAGE FAIL', s); continue; }
    fs.writeFileSync(path.join(PAGES, s + '.html'), buf);
    for (const r of refs(buf.toString('utf8'))) queue.push(r);
    console.log('page', s, buf.length);
  }
  await crawl(queue);
  console.log(`done: ${fetched} new files, ${seen.size} refs checked, ${failed.length} missing`);
  if (failed.length) fs.writeFileSync(path.join(__dirname, 'fetch-missing.txt'), failed.join('\n'));
})();
