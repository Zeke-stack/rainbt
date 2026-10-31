const fs = require('fs');
const path = 'c:/Users/zekef/Downloads/chicken-cross/plinko/game-server.js';
let src = fs.readFileSync(path, 'utf8');

// ── 1. Upgrade the handleRequest cookie block to also restore/save bjActiveSession
const oldCookieBlock = `  // --- Cookie-based balance persistence (survives Vercel cold starts) ---
  const _rbCookieHdr = req.headers['cookie'] || '';
  const _rbBalMatch = _rbCookieHdr.match(/rb_bal=([0-9.]+)/);
  if (_rbBalMatch) {
    const _cookieBal = parseFloat(_rbBalMatch[1]);
    if (!isNaN(_cookieBal) && _cookieBal >= 0) playerBalance = _cookieBal;
  }
  // Wrap res.writeHead to set rb_bal cookie on every response
  const _origWriteHead = res.writeHead.bind(res);
  res.writeHead = function(statusCode, headers) {
    const _h = Object.assign({}, headers || {});
    _h['Set-Cookie'] = 'rb_bal=' + playerBalance.toFixed(2) + '; Path=/; Max-Age=2592000; SameSite=Lax';
    return _origWriteHead(statusCode, _h);
  };
  // -- end cookie persistence --`;

const newCookieBlock = `  // --- Cookie-based persistence (survives Vercel cold starts) ---
  const _rbCookieHdr = req.headers['cookie'] || '';
  const _rbBalMatch = _rbCookieHdr.match(/rb_bal=([0-9.]+)/);
  if (_rbBalMatch) {
    const _cookieBal = parseFloat(_rbBalMatch[1]);
    if (!isNaN(_cookieBal) && _cookieBal >= 0) playerBalance = _cookieBal;
  }
  // Restore BJ active session from cookie if not already in memory
  if (!bjActiveSession) {
    const _sesMatch = _rbCookieHdr.match(/rb_session=([^;]+)/);
    if (_sesMatch) {
      try {
        const _decoded = decodeURIComponent(_sesMatch[1]);
        const _parsed = JSON.parse(_decoded);
        if (_parsed && _parsed.gameHistoryId && _parsed.status && _parsed.status !== 'finished') {
          bjActiveSession = _parsed;
        }
      } catch(e) { /* corrupt cookie — ignore */ }
    }
  }
  // Wrap res.writeHead to set cookies on every response
  const _origWriteHead = res.writeHead.bind(res);
  res.writeHead = function(statusCode, headers) {
    const _h = Object.assign({}, headers || {});
    const _cookies = [
      'rb_bal=' + playerBalance.toFixed(2) + '; Path=/; Max-Age=2592000; SameSite=Lax',
    ];
    if (bjActiveSession && bjActiveSession.status !== 'finished') {
      try {
        const _sesJson = encodeURIComponent(JSON.stringify(bjActiveSession));
        _cookies.push('rb_session=' + _sesJson + '; Path=/; Max-Age=86400; SameSite=Lax');
      } catch(e) {}
    } else {
      // Clear session cookie when game is over
      _cookies.push('rb_session=; Path=/; Max-Age=0; SameSite=Lax');
    }
    _h['Set-Cookie'] = _cookies;
    return _origWriteHead(statusCode, _h);
  };
  // -- end cookie persistence --`;

if (!src.includes(oldCookieBlock.trim().slice(0, 60))) {
  console.error('OLD COOKIE BLOCK NOT FOUND');
  process.exit(1);
}

src = src.replace(oldCookieBlock, newCookieBlock);
fs.writeFileSync(path, src, 'utf8');
console.log('Patched cookie block to include session persistence');
