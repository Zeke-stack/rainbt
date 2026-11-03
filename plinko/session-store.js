// Per-game session persistence for serverless hosts (Vercel): every game's session lives in memory AND is
// mirrored into an encrypted, compressed cookie (rb_s_<game>, chunked when large) so any instance can resume it.
// Each cookie carries a version; a stale cookie never overrides newer in-memory state (same idea as rb_balv).
// The cookie also carries the "last finished" result so a replayed cashout/action is answered idempotently.
const crypto = require('crypto');
const zlib = require('zlib');

const KEY = crypto.createHash('sha256').update(process.env.SESSION_SECRET || 'rainbet-local-session-v1').digest();
const CHUNK = 3000;
const MAX_CHUNKS = 3;
const ACTIVE_AGE = 86400;
const LAST_AGE = 600;

const stores = [];
let getBal = null;

function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([c.update(zlib.deflateRawSync(Buffer.from(JSON.stringify(obj)))), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url');
}

function open(token) {
  try {
    const buf = Buffer.from(token, 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    const raw = Buffer.concat([d.update(buf.subarray(28)), d.final()]);
    return JSON.parse(zlib.inflateRawSync(raw).toString('utf8'));
  } catch (e) { return null; }
}

function parseCookies(req) {
  if (req._rbCookies) return req._rbCookies;
  const out = {};
  for (const part of String(req.headers.cookie || '').split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i)] = part.slice(i + 1);
  }
  return (req._rbCookies = out);
}

const nameOf = (game, i) => 'rb_s_' + game + (i ? '_' + i : '');

function register(game, opts) {
  const st = {
    game, ver: 0, ser: null, last: null,
    get: opts.get, set: opts.set,
    pack: opts.pack || ((s) => s), unpack: opts.unpack || ((s) => s),
    // Idempotent answer for a request whose session id is the one that just finished
    replay(id, kind) {
      if (!st.last || st.last.id !== id || !st.last.r) return null;
      if (kind && st.last.k && st.last.k !== kind) return null;
      const r = JSON.parse(JSON.stringify(st.last.r));
      if (getBal) {
        if (r.wallet && r.wallet.active) r.wallet.active.primary = getBal();
        if (typeof r.balance === 'number') r.balance = getBal();
      }
      return r;
    },
    setLast(id, r, kind) { st.last = { id, r: JSON.parse(JSON.stringify(r)), k: kind || null }; },
    reset() { st.set(null); st.last = null; },
  };
  stores.push(st);
  st.ser = JSON.stringify(stateOf(st));
  return st;
}

const stateOf = (st, dropLast) => ({
  s: st.pack(st.get()),
  l: st.last ? (dropLast ? { id: st.last.id } : st.last) : null,
});

// Load newer cookie state into memory; call once at the start of each request.
function begin(req) {
  const ck = parseCookies(req);
  req._rbSess = {};
  for (const st of stores) {
    let token = ck[nameOf(st.game, 0)] || '';
    let n = token ? 1 : 0;
    if (token) for (let i = 1; ck[nameOf(st.game, i)] !== undefined; i++) { token += ck[nameOf(st.game, i)]; n++; }
    const info = (req._rbSess[st.game] = { ver: 0, chunks: n });
    if (!token) continue;
    const p = open(token);
    if (process.env.SSDBG) console.error('BEGIN', st.game, token.length, !!p, p && p.v, st.ver);
    if (!p || typeof p.v !== 'number') continue;
    info.ver = p.v;
    if (p.v > st.ver) {
      st.set(st.unpack(p.s));
      st.last = p.l || null;
      st.ver = p.v;
      st.ser = JSON.stringify(stateOf(st));
    }
  }
}

// Set-Cookie strings for every game whose session changed during this request (or whose cookie was stale).
function flush(req) {
  const out = [];
  const info = req._rbSess || {};
  for (const st of stores) {
    const seen = info[st.game] || { ver: 0, chunks: 0 };
    let state = stateOf(st);
    let ser = JSON.stringify(state);
    if (ser !== st.ser) { st.ver = Math.max(st.ver + 1, Date.now()); st.ser = ser; }
    if (st.ver === seen.ver) continue;
    const empty = state.s == null && state.l == null;
    let n = 0;
    if (!empty) {
      let token = seal({ v: st.ver, s: state.s, l: state.l });
      if (token.length > CHUNK * MAX_CHUNKS) token = seal({ v: st.ver, s: state.s, l: stateOf(st, true).l });
      const age = state.s != null ? ACTIVE_AGE : LAST_AGE;
      for (let i = 0; i * CHUNK < token.length; i++, n++) {
        out.push(nameOf(st.game, i) + '=' + token.slice(i * CHUNK, (i + 1) * CHUNK) + '; Path=/; Max-Age=' + age + '; SameSite=Lax');
      }
    }
    for (let i = n; i < seen.chunks; i++) {
      out.push(nameOf(st.game, i) + '=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
    }
    seen.ver = st.ver; seen.chunks = n;
    info[st.game] = seen;
  }
  return out;
}

function resetAll() { for (const st of stores) st.reset(); }

module.exports = { register, begin, flush, resetAll, setBalanceGetter: (fn) => { getBal = fn; } };
