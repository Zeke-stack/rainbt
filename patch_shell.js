// Patch game-server.js with iframe shell architecture
const fs = require('fs');
const f = 'c:/Users/zekef/Downloads/chicken-cross/plinko/game-server.js';
let src = fs.readFileSync(f, 'utf8');

// ====================================================
// 1. Replace navigateTo to postMessage when in iframe
// ====================================================
const NAV_OLD = [
  `function navigateTo(path) {`,
  `    // Prevent duplicate navigations`,
  `    if (window.__NAV_IN_PROGRESS__) return;`,
  `    window.__NAV_IN_PROGRESS__ = true;`,
  `    __navLog('nav', 'navigateTo: ' + path + ' (from ' + location.pathname + ') pwa=' + IS_PWA);`,
  `    // For Safari PWA, use location.replace to avoid weird back button issues`,
  `    if (IS_PWA) {`,
  `      window.location.replace(path);`,
  `    } else {`,
  `      window.location.href = path;`,
  `    }`,
  `    // Fallback: if location.href didn't navigate (same URL after pushState), force reload`,
  `    setTimeout(function() {`,
  `      var norm = location.pathname.replace(/^\\\\/en\\\\//, '/');`,
  `      if (norm === path || norm === path.replace(/^\\\\/en\\\\//, '/')) {`,
  `        location.reload();`,
  `      }`,
  `    }, 100);`,
  `  }`,
].join('\r\n');

const NAV_NEW = [
  `function navigateTo(path) {`,
  `    if (window.__NAV_IN_PROGRESS__) return;`,
  `    window.__NAV_IN_PROGRESS__ = true;`,
  `    __navLog('nav', 'navigateTo: ' + path + ' iframe=' + (window.self !== window.top));`,
  `    // If inside the shell iframe, message the parent shell to switch frames`,
  `    if (window.self !== window.top) {`,
  `      try {`,
  `        window.parent.postMessage({ type: 'rb-nav', path: path }, '*');`,
  `        window.__NAV_IN_PROGRESS__ = false;`,
  `        return;`,
  `      } catch(e) {}`,
  `    }`,
  `    // Standalone navigation (not inside shell)`,
  `    if (IS_PWA) {`,
  `      window.location.replace(path);`,
  `    } else {`,
  `      window.location.href = path;`,
  `    }`,
  `    setTimeout(function() {`,
  `      var norm = location.pathname.replace(/^\\\\/en\\\\//, '/');`,
  `      if (norm === path || norm === path.replace(/^\\\\/en\\\\//, '/')) {`,
  `        location.reload();`,
  `      }`,
  `    }, 100);`,
  `  }`,
].join('\r\n');

if (!src.includes(NAV_OLD)) { console.error('ERROR: navigateTo not found'); process.exit(1); }
src = src.replace(NAV_OLD, NAV_NEW);
console.log('1. navigateTo patched');

// ====================================================
// 2. Add buildShellHTML before buildHomepageHTML
// ====================================================
const SHELL_MARKER = 'function buildHomepageHTML() {';
if (!src.includes(SHELL_MARKER)) { console.error('ERROR: marker not found'); process.exit(1); }

const SHELL_CODE = `
// ============================================================
// SHELL PAGE — iframe shell that hosts all games simultaneously
// Navigation is handled purely by the shell; games postMessage
// 'rb-nav' events instead of doing full page navigations.
// ============================================================
let _shellCache = {};
function buildShellHTML(activeGame) {
  if (_shellCache[activeGame]) return _shellCache[activeGame];
  const GAMES = [
    { id: 'plinko',        path: '/casino/originals/plinko',       src: '/casino/originals/plinko?iframe=1' },
    { id: 'chicken-cross', path: '/casino/originals/chicken-cross', src: '/casino/originals/chicken-cross?iframe=1' },
    { id: 'blackjack',     path: '/casino/originals/blackjack',     src: '/casino/originals/blackjack?iframe=1' },
    { id: 'mines-game',    path: '/casino/originals/mines-game',    src: '/casino/originals/mines-game?iframe=1' },
    { id: 'home',          path: '/casino',                         src: '/?iframe=1' },
  ];
  const activeId = (activeGame === 'homepage') ? 'home' : (activeGame || 'plinko');
  const iframes = GAMES.map(g => {
    const isActive = g.id === activeId;
    const attrs = isActive ? ('src="' + g.src + '"') : ('data-src="' + g.src + '"');
    return '<iframe id="f-' + g.id + '" class="rb-frame' + (isActive ? ' active' : '') + '" ' + attrs + ' allow="autoplay *; fullscreen *; clipboard-write *" allowfullscreen></iframe>';
  }).join('\\n  ');
  const p2i = JSON.stringify(Object.fromEntries(GAMES.map(g => [g.path, g.id])));
  const i2p = JSON.stringify(Object.fromEntries(GAMES.map(g => [g.id, g.path])));
  const allIds = JSON.stringify(GAMES.map(g => g.id));
  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#0d0f1a">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Rainbet</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0d0f1a}
.rb-frame{position:fixed;top:0;left:0;width:100%;height:100%;border:none;opacity:0;pointer-events:none;z-index:0}
.rb-frame.active{opacity:1;pointer-events:auto;z-index:1}
#rb-loader{position:fixed;inset:0;background:#0d0f1a;display:flex;align-items:center;justify-content:center;z-index:9999;transition:opacity .4s .5s}
#rb-loader.done{opacity:0;pointer-events:none}
.rb-spinner{width:40px;height:40px;border:3px solid #1e2040;border-top-color:#85c7ff;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  \${iframes}
  <div id="rb-loader"><div class="rb-spinner"></div></div>
<script>
(function(){
  var P2I = \${p2i};
  var I2P = \${i2p};
  var ALL = \${allIds};
  var activeId = \${JSON.stringify(activeId)};
  var loaded = {};
  loaded[activeId] = true;

  function show(id, pushHist) {
    if (!I2P[id]) return;
    var frame = document.getElementById('f-'+id);
    if (!frame) return;
    // Lazy-load: set src on first activation
    if (!loaded[id]) { frame.src = frame.getAttribute('data-src'); loaded[id] = true; }
    document.querySelectorAll('.rb-frame').forEach(function(f){ f.classList.remove('active'); });
    frame.classList.add('active');
    activeId = id;
    var newPath = I2P[id];
    if (pushHist !== false && location.pathname !== newPath)
      history.pushState({ rbId: id }, '', newPath);
  }

  // Hide spinner once active frame fires its load event (or fallback after 7s)
  var af = document.getElementById('f-'+activeId);
  function hideLoader() { document.getElementById('rb-loader').classList.add('done'); }
  if (af) { af.addEventListener('load', function h(){ hideLoader(); af.removeEventListener('load',h); }); }
  setTimeout(hideLoader, 7000);

  // Receive navigation requests from inner game iframes
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'rb-nav') return;
    var path = String(e.data.path || '').replace(/^\\/en\\//, '/').split('?')[0].split('#')[0];
    var id = P2I[path];
    if (id) show(id, true);
  });

  // Back/forward button
  window.addEventListener('popstate', function(e) {
    var id = (e.state && e.state.rbId) || P2I[location.pathname.replace(/^\\/en\\//,'/')] || 'plinko';
    show(id, false);
  });

  // Pre-load remaining frames ~4 seconds after initial load (background)
  setTimeout(function(){
    ALL.forEach(function(id){
      if (loaded[id]) return;
      var fr = document.getElementById('f-'+id);
      if (fr) { fr.src = fr.getAttribute('data-src'); loaded[id] = true; }
    });
  }, 4000);
})();
<\\/script>
</body></html>\`;
  _shellCache[activeGame] = html;
  return html;
}

`;

src = src.replace(SHELL_MARKER, SHELL_CODE + SHELL_MARKER);
console.log('2. buildShellHTML inserted');

// ====================================================
// 3. Wrap game page routes: serve shell unless ?iframe=1
// ====================================================
function wrapRoute(oldCondition, gameName) {
  // Find the old route handler and wrap it
  const idx = src.indexOf(oldCondition);
  if (idx < 0) { console.error('ERROR: route not found for', gameName); process.exit(1); }
  // Insert shell check right after the opening `{` of the if block
  const bracePos = src.indexOf('{', idx + oldCondition.length);
  const insertion = `\r\n    if (url.searchParams.get('iframe') !== '1') {\r\n      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});\r\n      res.end(buildShellHTML('${gameName}')); return;\r\n    }`;
  src = src.slice(0, bracePos + 1) + insertion + src.slice(bracePos + 1);
  console.log('3. Route wrapped for', gameName);
}

// Wrap HOMEPAGE (serves shell with plinko active by default)
const homeCondition = "if (pathname === '/' || pathname === '' || pathname === '/casino' || pathname === '/casino/originals' || pathname === '/home' || pathname === '/en/casino' || pathname === '/en/casino/originals')";
{
  const idx = src.indexOf(homeCondition);
  if (idx < 0) { console.error('ERROR: homepage route not found'); process.exit(1); }
  const bracePos = src.indexOf('{', idx + homeCondition.length);
  const insertion = `\r\n    if (url.searchParams.get('iframe') !== '1') {\r\n      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});\r\n      res.end(buildShellHTML('plinko')); return;\r\n    }`;
  src = src.slice(0, bracePos + 1) + insertion + src.slice(bracePos + 1);
  console.log('3a. HOMEPAGE wrapped');
}

// Wrap PLINKO
wrapRoute("if (pathname === '/casino/originals/plinko' || pathname === '/plinko' || pathname === '/en/casino/originals/plinko')", 'plinko');

// Find and wrap CHICKEN-CROSS, BLACKJACK, MINES by searching for their unique page route conditions
const gameRoutes = [
  { search: "'/casino/originals/chicken-cross'", game: 'chicken-cross' },
  { search: "'/casino/originals/blackjack'",     game: 'blackjack' },
  { search: "'/casino/originals/mines-game'",    game: 'mines-game' },
];

for (const { search, game } of gameRoutes) {
  // Find the if-block that is a PAGE route (not just a string reference)
  // Look for the pattern: if (pathname === '/casino/originals/game' || ...
  let idx = 0;
  let found = false;
  while (true) {
    idx = src.indexOf(search, idx);
    if (idx < 0) break;
    // Check if this is a pathname === condition (page route, not array/map reference)
    const lineStart = src.lastIndexOf('\n', idx);
    const linePre = src.slice(lineStart + 1, idx);
    if (linePre.includes('if (pathname') || linePre.includes('|| pathname')) {
      // Find the `{` that opens this if block
      const bracePos = src.indexOf('{', idx + search.length);
      // Make sure there's a try block inside (page routes have try/catch)
      const nextTry = src.indexOf('try', bracePos);
      const nextBrace = src.indexOf('{', bracePos + 1);
      if (nextTry < nextBrace + 200) {
        const insertion = `\r\n    if (url.searchParams.get('iframe') !== '1') {\r\n      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});\r\n      res.end(buildShellHTML('${game}')); return;\r\n    }`;
        src = src.slice(0, bracePos + 1) + insertion + src.slice(bracePos + 1);
        console.log('3. Route wrapped for', game, 'at char', idx);
        found = true;
        break;
      }
    }
    idx++;
  }
  if (!found) { console.error('ERROR: page route not found for', game); process.exit(1); }
}

// ====================================================
// 4. Save
// ====================================================
fs.writeFileSync(f, src, 'utf8');
console.log('\nAll patches applied. File saved.');
