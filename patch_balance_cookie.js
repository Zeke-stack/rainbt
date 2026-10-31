const fs = require('fs');
const path = 'c:/Users/zekef/Downloads/chicken-cross/plinko/game-server.js';
let src = fs.readFileSync(path, 'utf8');

// Find the insertion point: after pathname.replace(/^\/casino\/originals/, '');
const anchor = "pathname = pathname.replace(/^\\/casino\\/originals/, '');";
const idx = src.indexOf(anchor);
if (idx === -1) { console.error('ANCHOR NOT FOUND'); process.exit(1); }

const insertPos = idx + anchor.length;

const cookieCode = `

  // --- Cookie-based balance persistence (survives Vercel cold starts) ---
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

src = src.slice(0, insertPos) + cookieCode + src.slice(insertPos);
fs.writeFileSync(path, src, 'utf8');
console.log('Patched at offset', insertPos);
