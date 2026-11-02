// Generates new-build/pages/<slug>.html for the logged-in account routes (the real site redirects
// these to the login modal when unauthenticated, so they cannot be captured with curl) and fills
// in empty route chunks so client-side navigation between pages works.
// Usage: node build-account-pages.js
const fs = require('fs');
const path = require('path');
const CH = path.join(__dirname, 'new-build', 'root', '_next', 'static', 'chunks');
const PAGES = path.join(__dirname, 'new-build', 'pages');
const BUILD = 'atCG64oKVyJonJJvWGau0';

const ROUTES = {
  '/affiliates': { slug: 'affiliates', title: 'Affiliates - Rainbet' },
  '/bets': { slug: 'bets', title: 'Bets - Rainbet' },
  '/rewards': { slug: 'rewards', title: 'Loyalty Program - Rainbet Rewards' },
  '/settings': { slug: 'settings', title: 'Settings - Rainbet' },
  '/transactions': { slug: 'transactions', title: 'Transactions - Rainbet' },
  '/verification': { slug: 'verification', title: 'Verification - Rainbet' },
  '/vip': { slug: 'vip', title: 'VIP Program - Rainbet Casino' },
};

const files = fs.readdirSync(CH).filter(f => f.endsWith('.js'));
const read = f => fs.readFileSync(path.join(CH, f), 'utf8');

// route -> page-entry chunk (defines `let r="/route";(window.__NEXT_P=...`) and turbopack entry listing it
const pageChunk = {};
const turbo = {};
for (const f of files) {
  const t = read(f);
  if (f.startsWith('turbopack-')) {
    const m = t.match(/otherChunks:\[([^\]]*)\]/);
    if (m) turbo[f] = [...m[1].matchAll(/"static\/chunks\/([^"]+)"/g)].map(x => x[1]);
    continue;
  }
  for (const m of t.matchAll(/let ([a-z])="(\/[^"]*)";\(window\.__NEXT_P/g)) pageChunk[m[2]] = f;
}
function turboFor(route) {
  const pc = pageChunk[route];
  return pc && Object.keys(turbo).find(k => turbo[k].includes(pc));
}

// 1) fill empty route chunks from the build manifest
const manifest = fs.readFileSync(path.join(__dirname, 'new-build', 'root', '_next', 'static', BUILD, '_buildManifest.js'), 'utf8');
let filled = 0;
for (const m of manifest.matchAll(/"(\/[^"]*)": \[\s*"static\/chunks\/([^"]+)"/g)) {
  const [, route, chunk] = m;
  const fp = path.join(CH, chunk);
  if (!fs.existsSync(fp) || fs.statSync(fp).size > 0) continue;
  const tf = turboFor(route);
  if (!tf) continue;
  const list = turbo[tf].concat(tf);
  fs.writeFileSync(fp, '__turbopack_load_page_chunks__(' + JSON.stringify(route) + ', [\n' + list.map(x => '  "static/chunks/' + x + '"').join(',\n') + '\n])\n');
  filled++;
}
console.log('route chunks filled:', filled);

// 2) generate HTML from the lobby shell
const lobby = fs.readFileSync(path.join(PAGES, 'lobby.html'), 'utf8');
const sc = [...lobby.matchAll(/<script[^>]*src="([^"]+)"[^>]*>(?:<\/script>)?/g)].map(m => m[1]);
const appEnd = sc.findIndex(s => /chunks\/turbopack-/.test(s));
const appScripts = sc.slice(0, appEnd + 1);
const appSet = new Set(appScripts);
const nextDataRe = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;
const nd0 = JSON.parse(lobby.match(nextDataRe)[1]);

for (const [route, info] of Object.entries(ROUTES)) {
  const tf = turboFor(route);
  if (!tf) { console.log('NO turbopack entry for', route); continue; }
  const routeScripts = turbo[tf].concat(tf).map(x => '/_next/static/chunks/' + x).filter(x => !appSet.has(x));
  const nd = JSON.parse(JSON.stringify(nd0));
  nd.page = route;
  nd.query = {};
  const pp = nd.props.pageProps;
  delete pp.content;
  pp.locale = 'en';
  pp.meta = {
    title: info.title, description: info.title, keywords: '', imageSize: 'small',
    url: 'https://rainbet.com' + route, path: route, jsonSchema: '', indexable: false, robots: 'noindex, nofollow'
  };
  let h = lobby;
  const a = h.indexOf('<div id="__next"');
  const b = h.search(nextDataRe);
  h = h.slice(0, a) + '<div id="__next"></div>' + h.slice(b);
  h = h.replace(nextDataRe, () => '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify(nd).replace(/</g, '\\u003c') + '</script>');
  // drop every script src tag from the shell (keeps analytics/inline ones) and re-add for this route
  h = h.replace(/<script[^>]*src="\/(?:_next\/static\/chunks|svg-bundle|api\/translations)[^"]*"[^>]*>(?:<\/script>)?/g, '');
  h = h.replace(/<link rel="preload"[^>]*as="script"[^>]*>/g, '');
  const tag = s => s.includes('/api/translations/') || s.includes('svg-bundle') ? `<script defer="" src="${s}"></script>` : `<script src="${s}"></script>`;
  const scripts = appScripts.filter(s => /svg-bundle|translations|chunks\//.test(s)).concat(routeScripts).map(tag).join('');
  h = h.replace(/(<script id="__NEXT_DATA__"[\s\S]*?<\/script>)/, (m) => m + scripts);
  h = h.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title data-next-head="">${info.title}</title>`);
  h = h.replace(/<link rel="canonical"[^>]*>/g, '');
  fs.writeFileSync(path.join(PAGES, info.slug + '.html'), h);
  console.log('page', route, '->', info.slug + '.html', 'scripts', appScripts.length + routeScripts.length);
}
