// crypt/api/balance.js
// Serverless function: stores Rainbet gaming balance in a cookie (crypt_bal)
// so it persists across Vercel cold starts.
// CORS is open to the Rainbet app so the browser can call this from rainbt.vercel.app.

const RAINBET_ORIGIN = 'https://rainbt.vercel.app';
const COOKIE_NAME    = 'crypt_bal';
const DEFAULT_BAL    = 500.00;   // starting gaming wallet (USD)
const MAX_AGE        = 60 * 60 * 24 * 90; // 90 days

function corsHeaders(origin) {
  // Allow the Rainbet origin *and* the crypt's own origin for same-site calls.
  const allowed = [RAINBET_ORIGIN, 'https://l-jet-gamma.vercel.app'];
  const use = allowed.includes(origin) ? origin : RAINBET_ORIGIN;
  return {
    'Access-Control-Allow-Origin':      use,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type',
  };
}

function parseCookies(header) {
  var result = {};
  (header || '').split(';').forEach(function(kv) {
    var eq = kv.indexOf('=');
    if (eq < 0) return;
    result[kv.slice(0, eq).trim()] = kv.slice(eq + 1).trim();
  });
  return result;
}

function readBalance(req) {
  var cookies = parseCookies(req.headers.cookie);
  var v = parseFloat(cookies[COOKIE_NAME]);
  return isNaN(v) ? DEFAULT_BAL : v;
}

function balCookie(val) {
  return COOKIE_NAME + '=' + val.toFixed(4) +
    '; Path=/; Max-Age=' + MAX_AGE + '; SameSite=None; Secure';
}

function readBody(req) {
  return new Promise(function(resolve) {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(body)); }
      catch(e) { resolve({}); }
    });
    req.on('error', function() { resolve({}); });
  });
}

module.exports = async function(req, res) {
  var origin = req.headers.origin || '';
  var cors = corsHeaders(origin);

  // Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  // GET – return current gaming balance
  if (req.method === 'GET') {
    var bal = readBalance(req);
    res.writeHead(200, Object.assign({}, cors, {
      'Content-Type': 'application/json',
      'Set-Cookie':   balCookie(bal),
      'Cache-Control': 'no-store',
    }));
    res.end(JSON.stringify({ gaming_balance: bal }));
    return;
  }

  // POST – update gaming balance
  if (req.method === 'POST') {
    var body = await readBody(req);
    var cur  = readBalance(req);

    // Accept either an absolute new balance or a signed delta
    var newBal;
    if (typeof body.gaming_balance === 'number') {
      newBal = body.gaming_balance;               // absolute set
    } else if (typeof body.delta === 'number') {
      newBal = cur + body.delta;                  // delta update (win / loss)
    } else {
      res.writeHead(400, Object.assign({}, cors, { 'Content-Type': 'application/json' }));
      res.end(JSON.stringify({ error: 'provide gaming_balance or delta' }));
      return;
    }

    if (newBal < 0) newBal = 0;
    newBal = Math.round(newBal * 10000) / 10000;  // 4 decimal places

    res.writeHead(200, Object.assign({}, cors, {
      'Content-Type': 'application/json',
      'Set-Cookie':   balCookie(newBal),
      'Cache-Control': 'no-store',
    }));
    res.end(JSON.stringify({ gaming_balance: newBal }));
    return;
  }

  res.writeHead(405, cors);
  res.end();
};
