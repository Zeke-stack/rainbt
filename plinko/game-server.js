// Rainbet Plinko - Local Game Server
// Serves the captured plinko page with local assets and game API
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const PLINKO_DIR = __dirname;
const FILES_DIR = path.join(PLINKO_DIR, 'plinko_files');

// Dynamic origin helper for deployment (Vercel etc.)
function getOrigin(req) {
  if (req) {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (host) return proto + '://' + host;
  }
  return 'http://localhost:' + PORT;
}
let _currentOrigin = 'http://localhost:' + PORT;

// Request log file (skipped on Vercel â€” read-only filesystem)
const IS_VERCEL = !!process.env.VERCEL;
const LOG_FILE = IS_VERCEL ? null : path.join(PLINKO_DIR, 'server.log');
if (LOG_FILE) try { fs.writeFileSync(LOG_FILE, `Server started at ${new Date().toISOString()}\n`); } catch(e) {}
function log(msg) {
  const line = `[${new Date().toISOString().substr(11,8)}] ${msg}\n`;
  process.stdout.write(line);
  if (LOG_FILE) try { fs.appendFileSync(LOG_FILE, line); } catch(e) {}
}
const CAPTURE_DIR = path.join(PLINKO_DIR, 'plinko-capture');
const CAPTURE_FILES = path.join(CAPTURE_DIR, 'files');

// Build sprite URL Ã¢â€ â€™ local file lookup from url-map.json
// The capture tool saves colliding filenames with suffixes (_1, _2, etc.) but
// the suffix for each sprite group varies per frame number, so we need a full lookup.
const SPRITE_URL_MAP = {};
try {
  const urlMap = JSON.parse(fs.readFileSync(path.join(CAPTURE_DIR, 'url-map.json'), 'utf8'));
  for (const [url, localFile] of Object.entries(urlMap)) {
    try {
      const u = new URL(url);
      SPRITE_URL_MAP[u.pathname] = localFile;
    } catch (e) {}
  }
  log(`Loaded SPRITE_URL_MAP: ${Object.keys(SPRITE_URL_MAP).length} entries`);
} catch (e) {
  log(`Warning: Could not load url-map.json: ${e.message}`);
}

// ============================================================
// PLINKO MULTIPLIER TABLES (rows 8â€”16, risk low/medium/high/rain)
// Extracted directly from chunk 3556 (module 7687)
// ============================================================
const MULTIPLIERS = {
  low: {
    8:  [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    9:  [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    11: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    13: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
    14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    15: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    9:  [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
    10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    11: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    13: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
    14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    15: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  high: {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    9:  [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
    10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
    11: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    13: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
    14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
    15: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  },
  rain: {
    8:  [22, -1, 0.9, 0.4, 0.2, 0.4, 0.9, -1, 22],
    9:  [30, -1, 2.2, 0.7, 0.2, 0.2, 0.7, 2.2, -1, 30],
    10: [45, -1, 3.1, 1.2, 0.4, 0.2, 0.4, 1.2, 3.1, -1, 45],
    11: [65, 10, -1, 1.4, 0.5, 0.2, 0.2, 0.5, 1.4, -1, 10, 65],
    12: [100, 15, -1, 3.1, 0.6, 0.3, 0.2, 0.3, 0.6, 3.1, -1, 15, 100],
    13: [175, 25, 4, -1, 1, 0.3, 0.2, 0.2, 0.3, 1, -1, 4, 25, 175],
    14: [250, 35, 11, -1, 1.8, 0.5, 0.3, 0.2, 0.3, 0.5, 1.8, -1, 11, 35, 250],
    15: [400, 40, 17, -1, 2.3, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 2.3, -1, 17, 40, 400],
    16: [500, 42, 22, 4, -1, 2, 0.3, 0.2, 0.2, 0.2, 0.3, 2, -1, 4, 22, 42, 500]
  }
};

// Rain roulette multiplier weights
const RAIN_ROULETTE_WEIGHTS = [
  { mult: 2, weight: 22.09 }, { mult: 3, weight: 25.115 }, { mult: 4, weight: 10 },
  { mult: 5, weight: 13 }, { mult: 6, weight: 6 }, { mult: 7, weight: 4 },
  { mult: 8, weight: 2.5 }, { mult: 9, weight: 2.5 }, { mult: 10, weight: 3.5 },
  { mult: 11, weight: 1.5 }, { mult: 12, weight: 1.2 }, { mult: 13, weight: 1.2 },
  { mult: 14, weight: 1 }, { mult: 15, weight: 1.4 }, { mult: 16, weight: 0.8 },
  { mult: 17, weight: 0.4 }, { mult: 18, weight: 0.4 }, { mult: 19, weight: 0.4 },
  { mult: 20, weight: 0.7 }, { mult: 25, weight: 0.4 }, { mult: 30, weight: 0.4 },
  { mult: 35, weight: 0.3 }, { mult: 40, weight: 0.2 }, { mult: 45, weight: 0.2 },
  { mult: 50, weight: 0.5 }, { mult: 60, weight: 0.065 }, { mult: 70, weight: 0.05 },
  { mult: 80, weight: 0.04 }, { mult: 90, weight: 0.04 }, { mult: 100, weight: 0.1 }
];

function pickRainRouletteMultiplier() {
  const total = RAIN_ROULETTE_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of RAIN_ROULETTE_WEIGHTS) { r -= w.weight; if (r <= 0) return w.mult; }
  return 2;
}

// ============================================================
// PLAYER STATE (persisted to player-state.json)
// ============================================================
const STATE_FILE = path.join(PLINKO_DIR, 'player-state.json');
let playerBalance = 10000.00;
let vaultBalance = 0;
let promotionalBalance = 0;
let totalBets = 0;
let totalWagered = 0;
let totalProfit = 0;
let totalDeposited = 0;
let totalWithdrawn = 0;
const betHistory = [];
const transactionHistory = [];

// Load persisted state on startup
try {
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (saved.playerBalance !== undefined) playerBalance = saved.playerBalance;
    if (saved.vaultBalance !== undefined) vaultBalance = saved.vaultBalance;
    if (saved.promotionalBalance !== undefined) promotionalBalance = saved.promotionalBalance;
    if (saved.totalBets !== undefined) totalBets = saved.totalBets;
    if (saved.totalWagered !== undefined) totalWagered = saved.totalWagered;
    if (saved.totalProfit !== undefined) totalProfit = saved.totalProfit;
    if (saved.totalDeposited !== undefined) totalDeposited = saved.totalDeposited;
    if (saved.totalWithdrawn !== undefined) totalWithdrawn = saved.totalWithdrawn;
    if (Array.isArray(saved.betHistory)) betHistory.push(...saved.betHistory);
    if (Array.isArray(saved.transactionHistory)) transactionHistory.push(...saved.transactionHistory);
    log(`Loaded saved state: $${playerBalance.toFixed(2)} balance, ${totalBets} bets`);
  }
} catch(e) { log('Could not load saved state: ' + e.message); }

// Save state to disk (debounced to avoid excessive writes)
let _saveTimer = null;
function saveState() {
  if (IS_VERCEL) return; // read-only filesystem on Vercel
  if (_saveTimer) clearTimeout(_saveTimer); // reschedule to capture latest state
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    try {
      const state = {
        playerBalance, vaultBalance, promotionalBalance,
        totalBets, totalWagered, totalProfit, totalDeposited, totalWithdrawn,
        betHistory: betHistory.slice(0, 100), // keep last 100
        transactionHistory: transactionHistory.slice(0, 100),
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch(e) { log('Failed to save state: ' + e.message); }
  }, 500);
}

// ---- Plinko cheat: server-side target bucket ----
let _plinkoTargetBucket = null; // Set by /api/plinko/set-target, consumed by handleDropBall

// Provably fair seeds
const serverSeed = crypto.randomBytes(32).toString('hex');
const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
let clientSeed = crypto.randomBytes(16).toString('hex');
let nonce = 0;

// ============================================================
// PLINKO GAME LOGIC
// ============================================================
function generateTargetedPath(rowCount, targetBucket) {
  // Generate a random path that ends at exactly targetBucket
  // bucketIndex = sum of 1s in path, so we need exactly targetBucket 1s
  const ones = Math.max(0, Math.min(targetBucket, rowCount));
  const arr = [];
  for (let i = 0; i < ones; i++) arr.push(1);
  for (let i = ones; i < rowCount; i++) arr.push(0);
  // Fisher-Yates shuffle to randomize the path
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function simulatePlinko(rowCount, riskType, targetBucket) {
  const multipliers = MULTIPLIERS[riskType]?.[rowCount];
  if (!multipliers) throw new Error(`Invalid rowCount=${rowCount} or riskType=${riskType}`);
  const pathResults = [];
  let accumulatedMultiplier = 1;
  const MAX_RAIN_REDROPS = 200; // safety cap

  const hasTarget = targetBucket !== undefined && targetBucket !== null && targetBucket >= 0 && targetBucket < multipliers.length;

  for (let drop = 0; drop <= MAX_RAIN_REDROPS; drop++) {
    // Keep targeting the -1 bucket to stack roulette multipliers; once at 10000x cap, random drop to land
    const useTarget = hasTarget && accumulatedMultiplier < 10000;
    const path = useTarget
      ? generateTargetedPath(rowCount, targetBucket)
      : (() => { const p = []; for (let i = 0; i < rowCount; i++) p.push(Math.random() < 0.5 ? 0 : 1); return p; })();
    const bucketIndex = path.reduce((sum, v) => sum + v, 0);
    const bucketMultiplier = multipliers[bucketIndex];

    if (riskType === 'rain' && bucketMultiplier === -1) {
      const rouletteMultiplier = pickRainRouletteMultiplier();
      accumulatedMultiplier = Math.min(accumulatedMultiplier * rouletteMultiplier, 10000);
      pathResults.push({ path, bucketMultiplier: -1, bucketIndex, rouletteMultiplier, accumulatedMultiplier });
      continue; // iterative re-drop (no recursion)
    } else {
      const finalMult = riskType === 'rain' ? bucketMultiplier * accumulatedMultiplier : bucketMultiplier;
      pathResults.push({
        path, bucketMultiplier, bucketIndex,
        rouletteMultiplier: false,
        accumulatedMultiplier: riskType === 'rain' ? Math.min(finalMult, 10000) : bucketMultiplier
      });
      break; // landed on a real bucket
    }
  }
  const finalMultiplier = pathResults[pathResults.length - 1].accumulatedMultiplier;
  return { pathResult: pathResults, multiplier: finalMultiplier };
}

function handleDropBall(body, isFreeplay) {
  // Accept both betAmount and bet_amount field names
  const amount = isFreeplay ? 0 : (parseFloat(body.betAmount || body.bet_amount) || 0);
  const rows = parseInt(body.rowCount || body.rows) || 8;
  const risk = body.riskType || body.risk || 'low';
  const currency = body.currency || 'USD';

  if (!isFreeplay && amount <= 0) return { error: 'Invalid bet amount', status: 400 };
  if (!isFreeplay && amount > playerBalance) return { error: 'Insufficient balance', status: 400 };
  if (rows < 8 || rows > 16) return { error: 'Rows must be 8-16', status: 400 };
  if (!['low', 'medium', 'high', 'rain'].includes(risk)) return { error: 'Invalid risk type', status: 400 };

  if (!isFreeplay) playerBalance -= amount;
  // Use server-side target if set (from /api/plinko/set-target), otherwise check body
  let targetBucket = _plinkoTargetBucket;
  if (targetBucket === null && body.targetBucket !== undefined && body.targetBucket !== null) {
    targetBucket = parseInt(body.targetBucket);
  }
  if (targetBucket !== null && targetBucket !== undefined) {
    log(`CHEAT: Using target bucket ${targetBucket}`);
  }
  const { pathResult, multiplier } = simulatePlinko(rows, risk, targetBucket !== null ? targetBucket : undefined);
  const payout = isFreeplay ? 0 : parseFloat((amount * multiplier).toFixed(2));
  if (!isFreeplay) playerBalance = parseFloat((playerBalance + payout).toFixed(2));
  totalBets++;
  totalWagered += amount;
  totalProfit += (payout - amount);

  const betId = crypto.randomUUID();
  betHistory.unshift({
    id: betId, game: 'plinko', amount, currency,
    multiplier, payout, profit: payout - amount, riskType: risk, rowCount: rows,
    timestamp: new Date().toISOString()
  });
  if (betHistory.length > 100) betHistory.pop();

  log(`BET: $${amount} ${risk} ${rows}rows Ã¢â€ â€™ ${multiplier}x = $${payout} (balance: $${playerBalance})`);

  return {
    result: { riskType: risk, currency_payout: payout, bet_id: betId, multiplier, pathResult },
    balance: playerBalance
  };
}

// ============================================================
// MIME TYPES
// ============================================================
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};
const getMime = f => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';

// ============================================================
// PERFORMANCE: IN-MEMORY CACHES
// ============================================================
const fileContentCache = new Map();  // absolutePath -> Buffer
const STATIC_CACHE_HEADER = 'public, max-age=31536000, immutable'; // 1 year for hashed assets

// Read file with in-memory caching (for static assets that never change)
function cachedReadFile(filePath) {
  if (fileContentCache.has(filePath)) return fileContentCache.get(filePath);
  const data = fs.readFileSync(filePath);
  fileContentCache.set(filePath, data);
  return data;
}

// HTML page caches (invalidated when balance changes)
let _homepageCache = null;
let _plinkoCache = null;
let _ccCache = null;
let _minesCache = null;
let _bjCache = null;

// Per-page balance keys â€” each page tracks when IT was last built
let _homepageBK = '';
let _plinkoBK = '';
let _ccBK = '';
let _bjBK = '';

function getBalanceKey() {
  return `${playerBalance}|${promotionalBalance}|${vaultBalance}`;
}

function invalidatePageCaches() {
  _homepageCache = null;
  _homepageCacheGz = null;
  _plinkoCache = null;
  _plinkoCacheGz = null;
  _ccCache = null;
  _ccCacheGz = null;
  _minesCache = null;
  _bjCache = null;
  _bjCacheGz = null;
  _homepageBK = '';
  _plinkoBK = '';
  _ccBK = '';
  _bjBK = '';
}

// Pre-compressed gzip caches for large HTML pages
let _homepageCacheGz = null;
let _plinkoCacheGz = null;
let _ccCacheGz = null;
let _bjCacheGz = null;

// Stripped _buildManifest.js (cached, game routes removed)
let _strippedBuildManifest = null;

// Send response with gzip if client supports it
function sendHTML(req, res, html, gzCache) {
  const ae = req.headers['accept-encoding'] || '';
  if (ae.includes('gzip') && gzCache) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
    res.end(gzCache);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

// Inject <link rel="preload" as="script"> for every local <script src=...> tag.
// Browsers download preloaded resources in parallel with HTML parsing,
// so JS chunks start loading immediately instead of waiting for the parser
// to reach the <script> tags at the bottom of the body.
function injectPreloadHints(html) {
  const srcs = [];
  const re = /<script[^>]*\ssrc="(\/[^"]+\.js[^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!srcs.includes(m[1])) srcs.push(m[1]);
  }
  if (!srcs.length) return html;
  const hints = srcs.map(s => `<link rel="preload" as="script" href="${s}">`).join('');
  return html.replace(/<head>/i, '<head>' + hints);
}

// ============================================================
// FILE-LOOKUP INDEX (URL path -> local file)
// Build once on startup so we don't scan directories on every request
// ============================================================
const fileIndex = new Map(); // url-path-component -> absolute path

function indexFiles() {
  // Index plinko_files
  if (fs.existsSync(FILES_DIR)) {
    for (const f of fs.readdirSync(FILES_DIR)) {
      fileIndex.set(f, path.join(FILES_DIR, f));
      // Also index URL-encoded variants for bracket names
      if (f.includes('[') || f.includes(']')) {
        fileIndex.set(encodeURIComponent(f), path.join(FILES_DIR, f));
        const encoded = f.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
        fileIndex.set(encoded, path.join(FILES_DIR, f));
      }
    }
  }
  // Index plinko-capture/files
  if (fs.existsSync(CAPTURE_FILES)) {
    for (const f of fs.readdirSync(CAPTURE_FILES)) {
      if (!fileIndex.has(f)) fileIndex.set(f, path.join(CAPTURE_FILES, f));
      // Decode URL-encoded filenames from capture
      const decoded = decodeURIComponent(f);
      if (decoded !== f && !fileIndex.has(decoded)) {
        fileIndex.set(decoded, path.join(CAPTURE_FILES, f));
      }
    }
  }
  // Index chicken-cross_files (strip hash prefix: "9d95661016__app-xxx.js" â†’ "_app-xxx.js")
  if (fs.existsSync(CC_ASSETS_DIR)) {
    for (const f of fs.readdirSync(CC_ASSETS_DIR)) {
      const absPath = path.join(CC_ASSETS_DIR, f);
      // Strip the 10-char hash prefix + underscore: "9d95661016_filename" â†’ "filename"
      const stripped = f.replace(/^[a-f0-9]{10}_/, '');
      if (stripped !== f && !fileIndex.has(stripped)) {
        fileIndex.set(stripped, absPath);
      }
      // Also index URL-decoded variant for files with %5B etc.
      try {
        const decoded = decodeURIComponent(stripped);
        if (decoded !== stripped && !fileIndex.has(decoded)) {
          fileIndex.set(decoded, absPath);
        }
      } catch(e) {}
      // Index the full name too (with prefix)
      if (!fileIndex.has(f)) fileIndex.set(f, absPath);
    }
  }
  // Index blackjack_files (plain hash names, no prefix stripping needed)
  if (fs.existsSync(BJ_ASSETS_DIR)) {
    for (const f of fs.readdirSync(BJ_ASSETS_DIR)) {
      const absPath = path.join(BJ_ASSETS_DIR, f);
      if (!fileIndex.has(f)) fileIndex.set(f, absPath);
      // Also index URL-decoded variant for files with %5B etc.
      try {
        const decoded = decodeURIComponent(f);
        if (decoded !== f && !fileIndex.has(decoded)) {
          fileIndex.set(decoded, absPath);
        }
      } catch(e) {}
    }
  }
  // Index mines_files (same pattern as chicken-cross: hash prefix + underscore)
  if (fs.existsSync(MINES_ASSETS_DIR)) {
    for (const f of fs.readdirSync(MINES_ASSETS_DIR)) {
      const absPath = path.join(MINES_ASSETS_DIR, f);
      const stripped = f.replace(/^[a-f0-9]{10}_/, '');
      if (stripped !== f && !fileIndex.has(stripped)) {
        fileIndex.set(stripped, absPath);
      }
      try {
        const decoded = decodeURIComponent(stripped);
        if (decoded !== stripped && !fileIndex.has(decoded)) {
          fileIndex.set(decoded, absPath);
        }
      } catch(e) {}
      if (!fileIndex.has(f)) fileIndex.set(f, absPath);
    }
  }
  // Index homepage_files (same pattern as chicken-cross: hash prefix + underscore)
  if (fs.existsSync(HOMEPAGE_ASSETS_DIR)) {
    for (const f of fs.readdirSync(HOMEPAGE_ASSETS_DIR)) {
      const absPath = path.join(HOMEPAGE_ASSETS_DIR, f);
      const stripped = f.replace(/^[a-f0-9]{10}_/, '');
      if (stripped !== f && !fileIndex.has(stripped)) {
        fileIndex.set(stripped, absPath);
      }
      try {
        const decoded = decodeURIComponent(stripped);
        if (decoded !== stripped && !fileIndex.has(decoded)) {
          fileIndex.set(decoded, absPath);
        }
      } catch(e) {}
      if (!fileIndex.has(f)) fileIndex.set(f, absPath);
    }
  }
  log(`Indexed ${fileIndex.size} files (plinko + chicken-cross + blackjack + mines + homepage)`);
}

// Resolve a filename against our index, trying multiple patterns
function resolveFile(filename) {
  // Exact match
  if (fileIndex.has(filename)) return fileIndex.get(filename);
  // URL-decoded
  const decoded = decodeURIComponent(filename);
  if (fileIndex.has(decoded)) return fileIndex.get(decoded);
  // For chunks like "3556.2e3e555fe7d4cf85.js" stored as "3556-2e3e555fe7d4cf85.js"
  const dashVersion = filename.replace(/^(\d+)\.([a-f0-9]+\.js)$/, '$1-$2');
  if (dashVersion !== filename && fileIndex.has(dashVersion)) return fileIndex.get(dashVersion);
  // Reverse: "3612-ba078ead1dd49bb7.js" stored as "3612.ba078ead1dd49bb7.js"
  const dotVersion = filename.replace(/^(\d+)-([a-f0-9]+\.js)$/, '$1.$2');
  if (dotVersion !== filename && fileIndex.has(dotVersion)) return fileIndex.get(dotVersion);
  // For pages/ paths: pages/casino/originals/[game]-hash.js -> [game]-hash.js
  const basename = path.basename(filename);
  if (fileIndex.has(basename)) return fileIndex.get(basename);
  const decodedBase = decodeURIComponent(basename);
  if (fileIndex.has(decodedBase)) return fileIndex.get(decodedBase);
  // For Next.js hashed media: "name.HASH.ext" -> try "name.ext" or "name.webp"
  const nameHashMatch = basename.match(/^(.+)\.[a-f0-9]{8}\.(png|jpg|svg|webp|gif)$/);
  if (nameHashMatch) {
    const [, name, ext] = nameHashMatch;
    for (const tryExt of [ext, 'webp', 'svg', 'png', 'jpg']) {
      const tryName = name + '.' + tryExt;
      if (fileIndex.has(tryName)) return fileIndex.get(tryName);
    }
  }
  return null;
}

// ============================================================
// BUILD THE PATCHED HTML
// ============================================================

// ============================================================
// UNIVERSAL NAVIGATION SCRIPT (injected into all game pages)
// ============================================================
function buildNavScript(currentGame) {
  // currentGame: 'plinko' | 'chicken-cross' | 'blackjack' | 'mines-game' | 'homepage'
  const gameRouteMap = {
    'plinko':        '/casino/originals/plinko',
    'chicken-cross': '/casino/originals/chicken-cross',
    'blackjack':     '/casino/originals/blackjack',
    'mines-game':    '/casino/originals/mines-game',
    'homepage':      '/casino',
  };
  const currentPath = gameRouteMap[currentGame] || '/';
  const isHomepage = currentGame === 'homepage';

  return `<script id="nav-intercept">
(function() {
  var CURRENT_GAME = ${JSON.stringify(currentGame)};
  var CURRENT_PATH = ${JSON.stringify(currentPath)};

  // Detect Safari standalone mode (PWA / Add to Home Screen)
  var IS_PWA = (window.navigator.standalone === true) || (window.matchMedia('(display-mode: standalone)').matches);

  // --- Debug logging to localStorage (survives page navigations) ---
  function __navLog(type, msg) {
    try {
      var logs = JSON.parse(localStorage.getItem('__navDebugLog') || '[]');
      logs.push({ t: Date.now(), ts: new Date().toLocaleTimeString(), type: type, msg: msg, page: CURRENT_GAME, path: location.pathname, pwa: IS_PWA });
      if (logs.length > 200) logs = logs.slice(-200);
      localStorage.setItem('__navDebugLog', JSON.stringify(logs));
    } catch(e) {}
  }
  __navLog('load', 'Page loaded: ' + location.href + ' | game=' + CURRENT_GAME);

  // --- Balance sync with localStorage (for Vercel where server-side storage is ephemeral) ---
  var BALANCE_KEY = '__rainbet_balance';
  function saveBalanceToStorage(bal) {
    try { localStorage.setItem(BALANCE_KEY, JSON.stringify({ balance: bal, ts: Date.now() })); } catch(e) {}
  }
  function getStoredBalance() {
    try {
      var d = JSON.parse(localStorage.getItem(BALANCE_KEY) || '{}');
      if (d.balance && d.ts && (Date.now() - d.ts) < 86400000) return d.balance; // Valid for 24h
    } catch(e) {}
    return null;
  }
  // Sync on page load
  (function syncBalance() {
    var stored = getStoredBalance();
    fetch('/api/sync-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: stored || 0 })
    }).then(function(r) { return r.json(); }).then(function(data) {
      if (data.balance) {
        saveBalanceToStorage(data.balance);
        window.__SYNCED_BALANCE__ = data.balance;
        __navLog('sync', 'Balance synced: $' + data.balance);
      }
    }).catch(function() {});
  })();
  // Global function for game engines to call after balance changes
  window.__saveBalance = function(bal) { saveBalanceToStorage(bal); };
  // Intercept fetch to capture balance from API responses
  var _origFetchForBalance = window.fetch;
  window.fetch = function(url, opts) {
    return _origFetchForBalance.apply(this, arguments).then(function(resp) {
      var u = typeof url === 'string' ? url : (url && url.url ? url.url : '');
      // Clone to read body without consuming
      if (u.includes('/api/') || u.includes('/v1/')) {
        resp.clone().json().then(function(data) {
          var bal = null;
          if (data && typeof data.balance === 'number') bal = data.balance;
          else if (data && data.wallet && data.wallet.active && typeof data.wallet.active.primary === 'number') bal = data.wallet.active.primary;
          else if (data && data.gameState && data.gameState.wallet && typeof data.gameState.wallet.active.primary === 'number') bal = data.gameState.wallet.active.primary;
          if (bal !== null && bal > 0) saveBalanceToStorage(bal);
        }).catch(function() {});
      }
      return resp;
    });
  };

  var GAME_ROUTES = {
    '/casino/originals/plinko': true,
    '/en/casino/originals/plinko': true,
    '/casino/originals/chicken-cross': true,
    '/en/casino/originals/chicken-cross': true,
    '/casino/originals/blackjack': true,
    '/en/casino/originals/blackjack': true,
    '/casino/originals/mines-game': true,
    '/en/casino/originals/mines-game': true,
  };
  var GAME_SLUGS = {
    '/casino/originals/plinko': 'plinko',
    '/casino/originals/chicken-cross': 'chicken-cross',
    '/casino/originals/blackjack': 'blackjack',
    '/casino/originals/mines-game': 'mines-game',
  };
  var HOME_ROUTES = { '/': true, '/casino': true, '/casino/originals': true, '/home': true, '/en/casino': true, '/en': true };
  var IS_HOMEPAGE = ${isHomepage};

  // â”€â”€ Navigate helper (force full page load) â”€â”€
  function navigateTo(path) {
    if (window.__NAV_IN_PROGRESS__) return;
    window.__NAV_IN_PROGRESS__ = true;
    __navLog('nav', 'navigateTo: ' + path + ' (from ' + location.pathname + ') pwa=' + IS_PWA);
    // For Safari PWA, use location.replace
    if (IS_PWA) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
    setTimeout(function() {
      var norm = location.pathname.replace(/^\\/en\\//, '/');
      if (norm === path || norm === path.replace(/^\\/en\\//, '/')) {
        location.reload();
      }
    }, 100);
  }

  // â”€â”€ 1. Click interceptor: force full page reload for game nav â”€â”€
  // Use both click AND touchend for mobile reliability
  function handleNavClick(e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;

    // Let wallet/auth modal links pass through to React's router
    if (href.indexOf('modal=wallet') !== -1 || href.indexOf('modal=auth') !== -1) {
      return; // don't intercept â€” let Next.js handle it
    }

    var localPath = href.replace(/^https?:\\/\\/[a-z0-9.-]*rainbet\\.com/, '');
    localPath = localPath.split('?')[0].split('#')[0];
    // Normalise /en/ prefix
    var normPath = localPath.replace(/^\\/en\\//, '/');
    __navLog('click', 'Link clicked: href=' + href + ' norm=' + normPath + ' isGame=' + !!GAME_SLUGS[normPath] + ' isHome=' + !!HOME_ROUTES[normPath] + ' pwa=' + IS_PWA);

    // PWA MODE: intercept ALL internal links to prevent Next.js client-side nav
    if (IS_PWA && localPath.startsWith('/') && !href.startsWith('http')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo(normPath || localPath);
      return false;
    }

    // Intercept home/casino links
    if ((HOME_ROUTES[normPath] || HOME_ROUTES[localPath]) && !IS_HOMEPAGE) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo('/casino');
      return false;
    }
    if (GAME_SLUGS[normPath] && normPath !== CURRENT_PATH) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo(normPath);
      return false;
    }
    // Also intercept "Games you might like" links
    if (GAME_ROUTES[localPath]) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo(localPath.replace(/^\\/en\\//, '/'));
      return false;
    }
    // Catch-all: any /casino/... link not in known routes → homepage (prevents Next.js 404 on mobile)
    if ((normPath.startsWith('/casino/') || localPath.startsWith('/casino/')) && !GAME_ROUTES[normPath] && !HOME_ROUTES[normPath]) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      __navLog('catch-all', 'Click: unknown casino route ' + normPath + ' -> /casino');
      navigateTo('/casino');
      return false;
    }
  }
  document.addEventListener('click', handleNavClick, true);
  // touchend fires before click on mobile â€” intercept early
  document.addEventListener('touchend', function(e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.indexOf('modal=wallet') !== -1 || href.indexOf('modal=auth') !== -1) return;
    var localPath = href.replace(/^https?:\\/\\/[a-z0-9.-]*rainbet\\.com/, '');
    localPath = localPath.split('?')[0].split('#')[0];
    var normPath = localPath.replace(/^\\/en\\//, '/');
    // PWA MODE: intercept ALL internal links
    if (IS_PWA && localPath.startsWith('/')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo(normPath || localPath);
      return;
    }
    if ((GAME_ROUTES[normPath] || GAME_SLUGS[normPath]) && normPath !== CURRENT_PATH) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo(normPath);
    } else if ((HOME_ROUTES[normPath] || HOME_ROUTES[localPath]) && !IS_HOMEPAGE) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      navigateTo('/casino');
    } else if ((normPath.startsWith('/casino/') || localPath.startsWith('/casino/')) && !GAME_ROUTES[normPath] && !HOME_ROUTES[normPath]) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      __navLog('catch-all', 'Touch: unknown casino route ' + normPath + ' -> /casino');
      navigateTo('/casino');
    }
  }, true);

  // â”€â”€ 1b. Intercept history.pushState/replaceState so Next.js client-side nav triggers reload â”€â”€
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  function checkNavChange(url) {
    if (!url) return false;
    var path = String(url);
    try { path = new URL(path, location.origin).pathname; } catch(e) {}
    var norm = path.replace(/^\\/en\\//, '/');
    __navLog('pushState', 'checkNavChange: url=' + url + ' norm=' + norm + ' isGame=' + !!GAME_ROUTES[norm] + ' isHome=' + !!HOME_ROUTES[norm]);
    if (GAME_ROUTES[norm] && norm !== CURRENT_PATH) {
      navigateTo(norm);
      return true;
    }
    if (HOME_ROUTES[norm] && !IS_HOMEPAGE) {
      navigateTo('/casino');
      return true;
    }
    // Catch-all: any /casino/... route not in our map → redirect to homepage
    // Prevents Next.js 404 component showing for unsupported routes (sports, promotions, etc)
    if (norm.startsWith('/casino') && !GAME_ROUTES[norm] && !HOME_ROUTES[norm]) {
      __navLog('block-unknown', 'Blocked unknown route: ' + norm + ' -> /casino');
      navigateTo('/casino');
      return true;
    }
    return false;
  }
  history.pushState = function(state, title, url) {
    if (checkNavChange(url)) return;
    return origPush.apply(this, arguments);
  };
  history.replaceState = function(state, title, url) {
    if (checkNavChange(url)) return;
    return origReplace.apply(this, arguments);
  };
  window.addEventListener('popstate', function() {
    var norm = location.pathname.replace(/^\\/en\\//, '/');
    if (GAME_ROUTES[norm] && norm !== CURRENT_PATH) {
      navigateTo(norm);
    } else if (HOME_ROUTES[norm] && !IS_HOMEPAGE) {
      navigateTo('/casino');
    }
  });

  // â”€â”€ 1c. URL-change polling fallback (catches mobile client-side nav that bypasses interceptors) â”€â”€
  var _lastHref = location.href;
  setInterval(function() {
    if (window.__NAV_IN_PROGRESS__) return;
    if (location.href !== _lastHref) {
      _lastHref = location.href;
      var norm = location.pathname.replace(/^\\/en\\//, '/');
      if (GAME_ROUTES[norm] && norm !== CURRENT_PATH) {
        location.reload();
        return;
      }
      if (HOME_ROUTES[norm] && !IS_HOMEPAGE) {
        window.location.href = '/casino';
        return;
      }
    }
  }, 150);

  // ---- 1d. Kill Next.js client-side router ---- force full page loads for game navigation
  function killNextRouter() {
    if (!window.next || !window.next.router) return;
    var r = window.next.router;
    if (r.__killed) return;
    r.__killed = true;
    var origPushR = r.push;
    r.push = function(url) {
      var p = typeof url === 'string' ? url : (url && (url.pathname || url.href || url.asPath) ? (url.pathname || url.href || url.asPath) : String(url));
      var norm = p.replace(/^\\/en\\//, '/').split('?')[0].split('#')[0];
      if (GAME_ROUTES[norm] && norm !== CURRENT_PATH) { navigateTo(norm); return Promise.resolve(true); }
      if (HOME_ROUTES[norm] && !IS_HOMEPAGE) { navigateTo('/casino'); return Promise.resolve(true); }
      return origPushR.apply(this, arguments);
    };
    var origRepR = r.replace;
    r.replace = function(url) {
      var p = typeof url === 'string' ? url : (url && (url.pathname || url.href || url.asPath) ? (url.pathname || url.href || url.asPath) : String(url));
      var norm = p.replace(/^\\/en\\//, '/').split('?')[0].split('#')[0];
      if (GAME_ROUTES[norm] && norm !== CURRENT_PATH) { navigateTo(norm); return Promise.resolve(true); }
      if (HOME_ROUTES[norm] && !IS_HOMEPAGE) { navigateTo('/casino'); return Promise.resolve(true); }
      return origRepR.apply(this, arguments);
    };
    r.prefetch = function() { return Promise.resolve(); };
  }
  killNextRouter();
  var _krCount = 0;
  var _krTid = setInterval(function() {
    killNextRouter();
    if (++_krCount > 60) clearInterval(_krTid);
  }, 200);

  // ---- 1e. Intercept _next/data fetches ---- redirect game route client-nav to full page load
  var _outerFetch = window.fetch;
  window.fetch = function(url, opts) {
    var u = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    if (u.includes('/_next/data/')) {
      var dataPath = u.replace(/.*\\/_next\\/data\\/[^/]+/, '').replace(/\\.json.*$/, '');
      var normData = dataPath.replace(/^\\/en\\//, '/');
      __navLog('fetch', '_next/data fetch: ' + u + ' -> normData=' + normData + ' isGame=' + !!GAME_ROUTES[normData] + ' isHome=' + !!HOME_ROUTES[normData]);
      if (GAME_ROUTES[normData] && normData !== CURRENT_PATH) { navigateTo(normData); return new Promise(function(){}); }
      if (HOME_ROUTES[normData] && !IS_HOMEPAGE) { navigateTo('/casino'); return new Promise(function(){}); }
    }
    return _outerFetch.apply(this, arguments);
  };

  // â”€â”€ 2. Active state + sidebar injection (runs after DOM ready) â”€â”€
  function fixSidebar() {
    // Set data-active on all sidebar game links
    var allLinks = document.querySelectorAll('a[href*="/casino/originals/"]');
    allLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var norm = href.replace(/^https?:\\/\\/[a-z0-9.-]*rainbet\\.com/, '').replace(/^\\/en\\//, '/');
      norm = norm.split('?')[0].split('#')[0];
      if (GAME_SLUGS[norm]) {
        link.setAttribute('data-active', norm === CURRENT_PATH ? 'true' : 'false');
      }
    });

    // Open the Originals accordion if it's closed
    var accordionItems = document.querySelectorAll('[data-orientation="vertical"][data-state]');
    accordionItems.forEach(function(item) {
      // Look for accordion items that contain "Originals" text
      var btn = item.querySelector('button[data-state]');
      if (!btn) return;
      if (!btn.textContent.includes('Originals')) return;
      // Open it
      item.setAttribute('data-state', 'open');
      var buttons = item.querySelectorAll('button[data-state]');
      buttons.forEach(function(b) {
        b.setAttribute('data-state', 'open');
        b.setAttribute('aria-expanded', 'true');
      });
      var region = item.querySelector('[role="region"]');
      if (region) {
        region.setAttribute('data-state', 'open');
        region.removeAttribute('hidden');
        // If the region is empty (chicken-cross), inject game links
        if (!region.querySelector('a[href*="/casino/originals/"]')) {
          injectGameLinks(region);
        }
      }
    });
  }

  function injectGameLinks(region) {
    var container = document.createElement('div');
    container.className = 'flex flex-col gap-1 p-1 pt-[5px]';
    var games = [
      { slug: 'chicken-cross', name: 'Chicken Cross', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path fill="#fff" d="M16.968 9.627c.58 1.218.452 2.706.229 3.75-.207.966-1.231 2.181-2.822 2.909a1.39 1.39 0 0 1-.72 1.044l-.005.003a1 1 0 0 1-.066.033l.196 1.146.05.297h.003l-.037-.301.838-.203a.614.614 0 0 1 .757.602.617.617 0 0 1-.586.618l-2.052.092a.42.42 0 0 1-.116-.828l.455-.11-.144-1.19a1.37 1.37 0 0 1-1.098-.641c-.367.013-.728.005-1.066-.016-.225.46-.694.776-1.236.776h-.034l-.003.015-.215 1.067.859.075a.618.618 0 1 1-.22 1.211l-.294-.084-1.682-.482a.42.42 0 0 1 .15-.823l.465.04.223-1.109a.76.76 0 0 1-.26-.357 1.4 1.4 0 0 1-.364-.896c-3.202-1.437-3.37-4.786-3.376-5.36-.115.031-.183.029-.183.029s-1.99.237-2.113-.658c-.037-.684 1.203-.819 1.263-.825-.056.004-1.141.075-1.213-.824.098-.741 1.237-.344 1.256-.338-.017-.017-.732-.78-.732-1.482s1.033-2.094 2.22-1.197c.645.548 1.104 2.31 1.12 2.546.562-.247 1.154-.366 1.154-.366 1.099-.292 2.248-.407 3.296-.424.359-.62.374-1.508.612-3.269q.03-.215.074-.402c-.23-.2-.938-.154-.835-.877.177-1.234 1.35-.65 1.35-.65s-.791-.89-.315-1.37c.766-.798 1.534.485 1.534.485S13.23 0 14.149 0c.92 0 .846 1.574.846 1.574s.54-.552.91-.277c.495.848-.228 1.193-.457 1.456.175.32.271.68.33 1.01.053.012.105.045.17.06.41.098 1.134.08 1.552.707l-.24.082c-.31.1-.615.16-.91.226-.095.022-.19.046-.258.071l.068.112.193.244c.187.25.329.444.28.543-.142.327-.407.094-.587-.027.198.915.458 1.326.661 1.949.274.842.473 1.749.261 1.896zm-5.13 5.312q.311-.122.575-.303c-2.241.314-2.871-.3-2.871-.3.137-.036 1.144-.69 1.144-.69-2.065.15-2.72-1.282-2.72-1.282.263-.025 1.261-.484 1.261-.484-2.322-.97-2.05-1.897-2.042-2.187-.243-.075-.789-.164-1.014-.331 0 0-.296 1.748 1.59 2.471 0 0-.812.295-.975.105 0 0 .174 1.802 2.238 1.963 0 0-.774.339-.914.354 0 0 1.063 1.726 3.728.684"></path></svg>' },
      { slug: 'plinko', name: 'Plinko', svg: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.75 4.60938C11.75 6.12816 10.5188 7.35938 9 7.35938C7.48122 7.35938 6.25 6.12816 6.25 4.60938C6.25 3.09059 7.48122 1.85937 9 1.85937C10.5188 1.85937 11.75 3.09059 11.75 4.60938Z" stroke="#E8E5FF" stroke-opacity="0.5" stroke-width="1.5"></path><path d="M4 16.6094C5.933 16.6094 7.5 15.0424 7.5 13.1094C7.5 11.1764 5.933 9.60938 4 9.60938C2.067 9.60938 0.5 11.1764 0.5 13.1094C0.5 15.0424 2.067 16.6094 4 16.6094Z" fill="#E8E5FF" fill-opacity="0.5"></path><path d="M14 16.6094C15.933 16.6094 17.5 15.0424 17.5 13.1094C17.5 11.1764 15.933 9.60938 14 9.60938C12.067 9.60938 10.5 11.1764 10.5 13.1094C10.5 15.0424 12.067 16.6094 14 16.6094Z" fill="#E8E5FF" fill-opacity="0.5"></path></svg>' },
      { slug: 'blackjack', name: 'Blackjack', svg: '<svg width="25" height="25" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><rect fill="none" height="256" width="256"></rect><path d="M232,140a56,56,0,0,1-56,56,55.2,55.2,0,0,1-25.9-6.4L162,225.5a7.8,7.8,0,0,1-1.1,7.2,7.9,7.9,0,0,1-6.4,3.3h-53a7.9,7.9,0,0,1-6.4-3.3,7.8,7.8,0,0,1-1.1-7.2l11.9-35.9A55.2,55.2,0,0,1,80,196a56,56,0,0,1-56-56C24,86.4,121.7,23.3,125.8,20.6a4.3,4.3,0,0,1,4.4,0C134.3,23.3,232,86.4,232,140Z"></path></svg>' },
      { slug: 'mines-game', name: 'Mines', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" fill="none" viewBox="0 0 18 16"><path fill="#7D7E97" d="M17.713 1.501c-1.559-.998-2.886-.799-4.042-.14C12.66.497 11.711.47 11.711.47l-1.443 1.443C7.601.63 4.308 1.086 2.098 3.296a7.167 7.167 0 0 0 10.135 10.135c2.21-2.21 2.668-5.504 1.386-8.17l1.443-1.443s-.02-.678-.545-1.498c.799-.384 1.59-.373 2.526.227a.622.622 0 0 0 .67-1.046M6.667 3.925c-.14.03-3.457.766-3.91 3.833a.621.621 0 1 1-1.23-.184c.582-3.934 4.712-4.83 4.888-4.866a.623.623 0 0 1 .645.95.62.62 0 0 1-.393.267m2.128-.395a.615.615 0 1 1-.87-.87.615.615 0 0 1 .87.87"></path></svg>' },
    ];
    var linkClass = 'relative inline-flex items-center gap-2 border whitespace-nowrap rounded-md text-[13px] transition-[background-color,color,fill,stroke] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-transparent focus-visible:transition-none disabled:pointer-events-none disabled:opacity-[0.333] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden z-0 [&:disabled]:cursor-not-allowed [&:disabled]:select-none bg-transparent py-2 group border-transparent border-solid data-[active=false]:hover:border-[#7C83B1]/10 data-[active=false]:hover:bg-[#7C83B1]/10 data-[active=true]:border-[#85C7FF]/15 data-[active=true]:bg-[#51AFFF]/15 justify-between h-[38px] min-h-[38px] w-full px-2.5';
    var iconWrapClass = 'group-data-[active=true]:[&_path]:fill-[url(#gradient)] group-data-[active=false]:[&_path]:fill-[#7D7E97] flex w-[18px] h-[18px] [&_svg]:!w-[18px] [&_svg]:!h-[18px] [&_svg]:shrink-0';
    var iconInnerClass = 'GamesIcons_value-icon__p9Oky GamesIcons_no-glow__5IRNV GamesIcons_has-custom-color__2sPCl !w-auto';
    var spanClass = 'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-[18px] group-data-[active=true]:bg-gradient-to-r group-data-[active=true]:from-[#85C7FF] group-data-[active=true]:to-[#99D0FF] group-data-[active=true]:bg-clip-text group-data-[active=true]:text-transparent';
    games.forEach(function(g) {
      var a = document.createElement('a');
      a.setAttribute('data-active', g.slug === CURRENT_GAME ? 'true' : 'false');
      a.className = linkClass;
      a.href = '/casino/originals/' + g.slug;
      a.innerHTML = '<div class="flex items-center gap-2 min-w-0">' +
        '<div class="' + iconWrapClass + '"><div class="' + iconInnerClass + '">' + g.svg + '</div></div>' +
        '<span class="' + spanClass + '">' + g.name + '</span></div>';
      container.appendChild(a);
    });
    region.appendChild(container);
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixSidebar);
  } else {
    fixSidebar();
  }
  // Also run after a short delay to catch React-rendered sidebars
  setTimeout(fixSidebar, 1500);
  setTimeout(fixSidebar, 4000);

  // ---- 3. Nuclear fallback: MutationObserver detects 404 page rendering ----
  // If Next.js somehow renders a 404/error page, immediately reload to let
  // the server serve the correct HTML page.
  var _notFoundObserver = new MutationObserver(function(mutations) {
    if (window.__NAV_IN_PROGRESS__) return;
    for (var i = 0; i < mutations.length; i++) {
      var nodes = mutations[i].addedNodes;
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        if (node.nodeType !== 1) continue;
        // Rainbet 404 page has "Page Not Found" h1 or specific error text
        var text = node.textContent || '';
        if (text.indexOf('Page Not Found') !== -1 || text.indexOf('page not found') !== -1) {
          // Check it's actually a full-page 404, not just a random text node
          var h1 = node.querySelector ? node.querySelector('h1, h2') : null;
          if (h1 && (h1.textContent.indexOf('Not Found') !== -1 || h1.textContent.indexOf('404') !== -1)) {
            __navLog('404-detect', '404 page detected in DOM! h1=' + h1.textContent + ' url=' + location.href);
            console.log('[NAV] 404 page detected, reloading...');
            _notFoundObserver.disconnect();
            window.location.reload();
            return;
          }
        }
      }
    }
  });
  // Start observing after hydration completes
  setTimeout(function() {
    _notFoundObserver.observe(document.body || document.documentElement, {
      childList: true, subtree: true
    });
  }, 2000);

  // ---- 4. Log errors for debugging ----
  window.addEventListener('error', function(e) {
    __navLog('error', (e.message || 'unknown') + ' @ ' + (e.filename || '?') + ':' + (e.lineno || '?'));
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason ? (e.reason.message || String(e.reason)) : 'unknown';
    __navLog('reject', msg.substring(0, 200));
  });

})();
</script>`;
}

// ============================================================
// CHICKEN CROSS GAME ENGINE
// ============================================================
const CC_BASE_DIR = path.join(__dirname, '..');
const CC_ASSETS_DIR = path.join(CC_BASE_DIR, 'chicken-cross_files');
const CC_HTML_FILE = path.join(CC_BASE_DIR, 'index.html');

const CC_DIFFICULTY = {
  easy:   { factor: 1,  maxRounds: 24 },
  medium: { factor: 3,  maxRounds: 22 },
  hard:   { factor: 5,  maxRounds: 20 },
  expert: { factor: 10, maxRounds: 15 },
};

function ccCalcMultiplier(round, difficultyFactor) {
  var n = 1;
  for (var i = 0; i < round; i++) {
    var a = 25 - difficultyFactor - i;
    var o = 25 - i;
    n = n * (a / o);
  }
  var l = n * 100;
  var mult = 96 / l;
  return Math.floor(mult * 100) / 100;
}

function ccCalcWinPercentage(round, difficultyFactor) {
  var n = 1;
  for (var i = 0; i < round; i++) {
    var a = 25 - difficultyFactor - i;
    var o = 25 - i;
    n = n * (a / o);
  }
  return (n * 100).toFixed(4);
}

var ccActiveSession = null;

function ccMakeGameResponse(session) {
  return {
    game_result: {
      game_over: session.gameOver,
      multiplier: session.currentMultiplier,
      payout: session.payout,
      game_history_id: session.id,
      game_name: 'chicken-cross',
      currency: session.currency,
      bet_amount: session.betAmount,
    },
    chicken_cross_result: session.results,
    chicken_cross_difficulty: session.difficulty,
    wallet: {
      active: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance, currency: 'USD' }
    },
    balance: playerBalance,
  };
}

// Index chicken-cross asset files
const CC_FILE_INDEX = {};
if (fs.existsSync(CC_ASSETS_DIR)) {
  for (const file of fs.readdirSync(CC_ASSETS_DIR)) {
    const match = file.match(/^[a-f0-9]+_(.+)$/);
    if (match) CC_FILE_INDEX[match[1]] = file;
    CC_FILE_INDEX[file] = file;
  }
  log('Indexed ' + Object.keys(CC_FILE_INDEX).length + ' chicken-cross assets');
}

function ccResolveAssetFile(name) {
  var direct = path.join(CC_ASSETS_DIR, name);
  if (fs.existsSync(direct)) return direct;
  if (CC_FILE_INDEX[name]) return path.join(CC_ASSETS_DIR, CC_FILE_INDEX[name]);
  var enc = name.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
  if (CC_FILE_INDEX[enc]) return path.join(CC_ASSETS_DIR, CC_FILE_INDEX[enc]);
  try { var dec = decodeURIComponent(name); if (CC_FILE_INDEX[dec]) return path.join(CC_ASSETS_DIR, CC_FILE_INDEX[dec]); } catch(e) {}
  return null;
}

// ============================================================
// BLACKJACK GAME ENGINE
// ============================================================
const BJ_BASE_DIR = path.join(__dirname, '..', 'rainbet', 'public');
const BJ_ASSETS_DIR = path.join(BJ_BASE_DIR, 'blackjack_files');
const BJ_HTML_FILE = path.join(BJ_BASE_DIR, 'blackjack.html');

// ============================================================
// HOMEPAGE
// ============================================================
const HOMEPAGE_BASE_DIR = path.join(__dirname, '..', 'homepage');
const HOMEPAGE_ASSETS_DIR = path.join(HOMEPAGE_BASE_DIR, 'homepage_files');
const HOMEPAGE_HTML_FILE = path.join(HOMEPAGE_BASE_DIR, 'homepage.html');

// ============================================================
// MINES GAME ENGINE
// ============================================================
const MINES_BASE_DIR = path.join(__dirname, '..', 'mines');
const MINES_ASSETS_DIR = path.join(MINES_BASE_DIR, 'mines_files');
const MINES_HTML_FILE = path.join(MINES_BASE_DIR, 'mines.html');

// Mines game state
var minesActiveSession = null;

function minesGenerateField(mineCount, totalTiles) {
  totalTiles = totalTiles || 25;
  // Place mines randomly
  var minePositions = new Set();
  while (minePositions.size < mineCount) {
    minePositions.add(Math.floor(Math.random() * totalTiles));
  }
  // Display board: random non-zero ints for ALL tiles (mines hidden)
  var displayBoard = [];
  for (var i = 0; i < totalTiles; i++) {
    displayBoard.push(Math.floor(Math.random() * 90) + 10);
  }
  return { displayBoard: displayBoard, minePositions: minePositions };
}

function minesCalcMultiplier(gemsRevealed, mineCount, totalTiles) {
  totalTiles = totalTiles || 25;
  var safeTiles = totalTiles - mineCount;
  if (gemsRevealed <= 0) return 1;
  var multiplier = 1;
  for (var i = 0; i < gemsRevealed; i++) {
    multiplier *= (totalTiles - i) / (safeTiles - i);
  }
  // Apply 3% house edge
  multiplier *= 0.97;
  return Math.floor(multiplier * 100) / 100;
}

function minesGetVisibleBoard(session) {
  // Build the board the client sees
  var board = [];
  for (var i = 0; i < session.tiles; i++) {
    if (session.gameOver) {
      // Show everything: gems as 0, mines as 'M'
      if (session.minePositions.has(i)) {
        board.push('M');
      } else if (session.revealed.has(i)) {
        board.push(0);
      } else {
        board.push(session.displayBoard[i]);
      }
    } else if (session.revealed.has(i)) {
      board.push(0); // revealed gem
    } else {
      board.push(session.displayBoard[i]); // hidden (non-zero int, same for mines and gems)
    }
  }
  return board;
}

function minesGetFullBoard(session) {
  // Full reveal board: gems = 0, mines = 'M'
  var board = [];
  for (var i = 0; i < session.tiles; i++) {
    board.push(session.minePositions.has(i) ? 'M' : 0);
  }
  return board;
}

function minesStartGame(betAmount, mineCount, totalTiles, currency) {
  totalTiles = totalTiles || 25;
  mineCount = mineCount || 5;
  currency = currency || 'USD';

  // Deduct bet
  playerBalance = Math.round((playerBalance - betAmount) * 100) / 100;
  totalBets++;
  totalWagered = Math.round((totalWagered + betAmount) * 100) / 100;

  var field = minesGenerateField(mineCount, totalTiles);
  var session = {
    id: crypto.randomUUID(),
    displayBoard: field.displayBoard,
    minePositions: field.minePositions,
    tiles: totalTiles,
    mines: mineCount,
    betAmount: betAmount,
    currency: currency,
    revealed: new Set(),
    revealedCellsCount: 0,
    multiplier: 1,
    payout: 0,
    gameOver: false,
    cashedOut: false,
    startTime: Date.now()
  };

  minesActiveSession = session;

  betHistory.push({
    id: session.id,
    game: 'mines',
    amount: betAmount,
    currency: currency,
    result: 'pending',
    multiplier: 0,
    payout: 0,
    timestamp: new Date().toISOString()
  });

  transactionHistory.push({
    type: 'bet',
    game: 'mines',
    amount: -betAmount,
    balance: playerBalance,
    timestamp: new Date().toISOString()
  });

  return session;
}

function minesRevealTile(session, index) {
  if (session.gameOver) return { success: false, error: 'Game is over' };
  if (index < 0 || index >= session.tiles) return { success: false, error: 'Invalid tile' };
  if (session.revealed.has(index)) return { success: false, error: 'Already revealed' };

  var isMine = session.minePositions.has(index);
  session.revealed.add(index);
  session.revealedCellsCount++;

  if (isMine) {
    // Hit a mine - loss
    session.gameOver = true;
    session.payout = 0;
    minesActiveSession = null;
    for (var i = betHistory.length - 1; i >= 0; i--) {
      if (betHistory[i].id === session.id) { betHistory[i].result = 'loss'; betHistory[i].multiplier = 0; betHistory[i].payout = 0; break; }
    }
    totalProfit = Math.round((totalProfit - session.betAmount) * 100) / 100;
    return { success: true, cell: 'M', board: minesGetFullBoard(session), multiplier: 0, revealedCellsCount: session.revealedCellsCount, payout: 0, win: false };
  }

  // Gem found
  session.multiplier = minesCalcMultiplier(session.revealedCellsCount, session.mines, session.tiles);

  // Auto-win if all safe tiles found
  var safeTiles = session.tiles - session.mines;
  if (session.revealedCellsCount >= safeTiles) {
    session.gameOver = true;
    session.cashedOut = true;
    session.payout = Math.round(session.betAmount * session.multiplier * 100) / 100;
    playerBalance = Math.round((playerBalance + session.payout) * 100) / 100;
    minesActiveSession = null;
    var profit = session.payout - session.betAmount;
    totalProfit = Math.round((totalProfit + profit) * 100) / 100;
    for (var i = betHistory.length - 1; i >= 0; i--) {
      if (betHistory[i].id === session.id) { betHistory[i].result = 'win'; betHistory[i].multiplier = session.multiplier; betHistory[i].payout = session.payout; break; }
    }
    transactionHistory.push({ type: 'win', game: 'mines', amount: session.payout, balance: playerBalance, timestamp: new Date().toISOString() });
    return { success: true, cell: 0, board: minesGetFullBoard(session), multiplier: session.multiplier, revealedCellsCount: session.revealedCellsCount, payout: session.payout, win: true };
  }

  return { success: true, cell: 0, multiplier: session.multiplier, revealedCellsCount: session.revealedCellsCount, payout: 0, win: false };
}

function minesCashout(session) {
  if (session.gameOver) return { success: false, error: 'Game already over' };
  if (session.revealedCellsCount === 0) return { success: false, error: 'Must reveal at least one tile' };

  session.gameOver = true;
  session.cashedOut = true;
  session.payout = Math.round(session.betAmount * session.multiplier * 100) / 100;
  playerBalance = Math.round((playerBalance + session.payout) * 100) / 100;
  minesActiveSession = null;

  var profit = session.payout - session.betAmount;
  totalProfit = Math.round((totalProfit + profit) * 100) / 100;
  for (var i = betHistory.length - 1; i >= 0; i--) {
    if (betHistory[i].id === session.id) { betHistory[i].result = 'win'; betHistory[i].multiplier = session.multiplier; betHistory[i].payout = session.payout; break; }
  }
  transactionHistory.push({ type: 'cashout', game: 'mines', amount: session.payout, balance: playerBalance, timestamp: new Date().toISOString() });

  return { board: minesGetFullBoard(session), win: true, multiplier: session.multiplier, payout: session.payout };
}

// Index mines asset files
const MINES_FILE_INDEX = {};
if (fs.existsSync(MINES_ASSETS_DIR)) {
  for (const file of fs.readdirSync(MINES_ASSETS_DIR)) {
    const match = file.match(/^[a-f0-9]+_(.+)$/);
    if (match) MINES_FILE_INDEX[match[1]] = file;
    MINES_FILE_INDEX[file] = file;
  }
  log('Indexed ' + Object.keys(MINES_FILE_INDEX).length + ' mines assets');
}

function minesResolveAssetFile(name) {
  var direct = path.join(MINES_ASSETS_DIR, name);
  if (fs.existsSync(direct)) return direct;
  if (MINES_FILE_INDEX[name]) return path.join(MINES_ASSETS_DIR, MINES_FILE_INDEX[name]);
  var enc = name.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
  if (MINES_FILE_INDEX[enc]) return path.join(MINES_ASSETS_DIR, MINES_FILE_INDEX[enc]);
  try { var dec = decodeURIComponent(name); if (MINES_FILE_INDEX[dec]) return path.join(MINES_ASSETS_DIR, MINES_FILE_INDEX[dec]); } catch(e) {}
  return null;
}

const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['h','d','c','s'];
const SUIT_NAMES = { h:'heart', d:'diamond', c:'club', s:'spade' };

function bjCardValue(rank) {
  if (rank === 'A') return 11;
  if ('TJQK'.includes(rank)) return 10;
  return parseInt(rank);
}

function bjParseCard(code) {
  if (!code) return { code:'', rank:'', suit:'', value:0, hidden:false, faceDown:true };
  return { code, rank: code[0], suit: SUIT_NAMES[code[1]], value: bjCardValue(code[0]), hidden:false, faceDown:false };
}

function bjFaceDown() {
  return { code:'', rank:'', suit:'', value:0, faceDown:true };
}

function bjMakeShoe() {
  const shoe = [];
  for (let d = 0; d < 8; d++) {
    for (const s of SUITS) for (const r of RANKS) shoe.push(r + s);
  }
  // Fisher-Yates shuffle
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

function bjHandTotal(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    const v = bjCardValue(c[0]);
    if (c[0] === 'A') aces++;
    total += v;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function bjAvailableActions(hand) {
  if (!hand.isActive || hand.isBust || hand.isStand) return { hit:false, stand:false, double:false, split:false };
  const canDouble = hand.cards.length === 2 && !hand.isDoubled;
  const canSplit = hand.cards.length === 2 && !hand.isSplit &&
    bjCardValue(hand.cards[0][0]) === bjCardValue(hand.cards[1][0]);
  return { hit:true, stand:true, double:canDouble, split:canSplit };
}

function bjMakeHandState(hand, reveal) {
  return {
    handId: hand.handId,
    cards: hand.cards.map(c => bjParseCard(c)),
    isStand: hand.isStand,
    isBust: hand.isBust,
    isDoubled: hand.isDoubled,
    isActive: hand.isActive,
    availableActions: bjAvailableActions(hand),
    result: hand.result,
  };
}

function bjMakeDealerState(session, reveal) {
  const cards = [];
  if (session.dealerCards.length > 0) cards.push(bjParseCard(session.dealerCards[0]));
  if (session.dealerCards.length > 1) {
    cards.push(reveal ? bjParseCard(session.dealerCards[1]) : bjFaceDown());
  }
  if (reveal && session.dealerCards.length > 2) {
    for (let i = 2; i < session.dealerCards.length; i++) cards.push(bjParseCard(session.dealerCards[i]));
  }
  return { cards, isRevealed: reveal };
}

function bjMakeGameState(session) {
  const finished = session.status === 'finished';
  return {
    game_history_id: session.gameHistoryId,
    game_action_id: session.gameActionId,
    status: session.status,
    betAmount: session.betAmount,
    currency: session.currency,
    playerHands: session.hands.map(h => bjMakeHandState(h, finished)),
    dealerHand: bjMakeDealerState(session, finished),
    currentHandIndex: session.currentHandIndex,
    isSplit: session.isSplit,
    insuranceOffered: session.insuranceOffered,
    insuranceTaken: session.insuranceTaken,
    insuranceWon: session.insuranceWon,
    // Include wallet so client can update balance display
    wallet: {
      active: {
        primary: playerBalance,
        promotional: promotionalBalance,
        vault: vaultBalance,
        currency: 'USD'
      }
    },
    balance: playerBalance,
  };
}

function bjDealerPlay(session) {
  // Reveal and draw until >= 17
  while (bjHandTotal(session.dealerCards) < 17) {
    session.dealerCards.push(session.deck.shift());
  }
  const dealerTotal = bjHandTotal(session.dealerCards);
  const dealerBust = dealerTotal > 21;

  for (const hand of session.hands) {
    if (hand.isBust) { hand.result = 'lose'; continue; }
    const playerTotal = bjHandTotal(hand.cards);
    if (dealerBust) { hand.result = 'win'; }
    else if (playerTotal > dealerTotal) { hand.result = 'win'; }
    else if (playerTotal < dealerTotal) { hand.result = 'lose'; }
    else { hand.result = 'push'; }
  }
  session.status = 'finished';
}

function bjCalcPayout(session) {
  let payout = 0;
  for (const hand of session.hands) {
    const bet = hand.isDoubled ? session.betAmount * 2 : session.betAmount;
    if (hand.result === 'win') {
      // Check for natural blackjack (2 cards, total 21, not split)
      const isNatural = hand.cards.length === 2 && bjHandTotal(hand.cards) === 21 && !session.isSplit;
      payout += isNatural ? bet + bet * 1.5 : bet * 2;
    } else if (hand.result === 'push') {
      payout += bet;
    }
    // lose = 0
  }
  // Insurance payout
  if (session.insuranceTaken && session.insuranceWon) {
    payout += session.betAmount * 0.5 * 2; // insurance costs 0.5Ã—bet, pays 2:1
  }
  return Math.round(payout * 100) / 100;
}

function bjAdvanceHand(session) {
  // Find next active hand
  for (let i = session.currentHandIndex + 1; i < session.hands.length; i++) {
    if (!session.hands[i].isStand && !session.hands[i].isBust) {
      session.currentHandIndex = i;
      session.hands[i].isActive = true;
      return;
    }
  }
  // No more hands â€” check if any non-bust hand exists
  const anyAlive = session.hands.some(h => !h.isBust);
  if (anyAlive) {
    session.status = 'dealerTurn';
    bjDealerPlay(session);
  } else {
    session.status = 'finished';
  }
  // Calculate payout and credit balance
  if (session.status === 'finished') {
    const payout = bjCalcPayout(session);
    if (payout > 0) {
      playerBalance = Math.round((playerBalance + payout) * 100) / 100;
    }
    session.payout = payout;
    bjActiveSession = null;
  }
}

var bjActiveSession = null;

function bjStartGame(betAmount, currency) {
  const deck = bjMakeShoe();
  const playerCard1 = deck.shift();
  const dealerCard1 = deck.shift();
  const playerCard2 = deck.shift();
  const dealerCard2 = deck.shift();

  const session = {
    gameHistoryId: crypto.randomUUID(),
    gameActionId: crypto.randomUUID(),
    deck,
    betAmount,
    currency: currency || 'USD',
    status: 'playerTurn',
    hands: [{
      handId: 0,
      cards: [playerCard1, playerCard2],
      isStand: false,
      isBust: false,
      isDoubled: false,
      isActive: true,
      isSplit: false,
      result: null,
    }],
    dealerCards: [dealerCard1, dealerCard2],
    currentHandIndex: 0,
    isSplit: false,
    insuranceOffered: false,
    insuranceTaken: false,
    insuranceWon: false,
    payout: 0,
  };

  // Deduct bet
  playerBalance = Math.round((playerBalance - betAmount) * 100) / 100;

  const playerTotal = bjHandTotal([playerCard1, playerCard2]);
  const dealerTotal = bjHandTotal([dealerCard1, dealerCard2]);
  const dealerUpValue = bjCardValue(dealerCard1[0]);

  // Check naturals
  if (playerTotal === 21 && dealerTotal === 21) {
    // Both blackjack â€” push
    session.hands[0].result = 'push';
    session.hands[0].isActive = false;
    session.status = 'finished';
    const payout = bjCalcPayout(session);
    playerBalance = Math.round((playerBalance + payout) * 100) / 100;
    session.payout = payout;
  } else if (playerTotal === 21) {
    // Player blackjack
    session.hands[0].result = 'win';
    session.hands[0].isActive = false;
    session.status = 'finished';
    const payout = bjCalcPayout(session);
    playerBalance = Math.round((playerBalance + payout) * 100) / 100;
    session.payout = payout;
  } else if (dealerUpValue === 10) {
    // Dealer shows 10-value â€” peek for blackjack
    if (dealerTotal === 21) {
      session.hands[0].result = 'lose';
      session.hands[0].isActive = false;
      session.status = 'finished';
      session.payout = 0;
    }
  } else if (dealerCard1[0] === 'A') {
    // Dealer shows Ace â€” offer insurance
    session.insuranceOffered = true;
  }

  if (session.status === 'finished') {
    bjActiveSession = null;
  } else {
    bjActiveSession = session;
  }

  betHistory.unshift({ id: session.gameHistoryId, game: 'blackjack', amount: betAmount, currency: session.currency, time: Date.now() });

  return session;
}

function bjDoAction(session, actionObj) {
  session.gameActionId = crypto.randomUUID();

  // Insurance decision
  if (session.insuranceOffered && (actionObj.insurance === true || actionObj.insurance === false)) {
    if (actionObj.insurance === true) {
      session.insuranceTaken = true;
      playerBalance = Math.round((playerBalance - session.betAmount * 0.5) * 100) / 100;
    }
    session.insuranceOffered = false;

    // Check dealer blackjack
    const dealerTotal = bjHandTotal(session.dealerCards);
    if (dealerTotal === 21) {
      for (const h of session.hands) { h.result = 'lose'; h.isActive = false; }
      if (session.insuranceTaken) session.insuranceWon = true;
      session.status = 'finished';
      const payout = bjCalcPayout(session);
      if (payout > 0) playerBalance = Math.round((playerBalance + payout) * 100) / 100;
      session.payout = payout;
      bjActiveSession = null;
    }
    return session;
  }

  const hand = session.hands[session.currentHandIndex];
  if (!hand || !hand.isActive) return session;

  if (actionObj.hit) {
    const card = session.deck.shift();
    hand.cards.push(card);
    const total = bjHandTotal(hand.cards);
    if (total > 21) {
      hand.isBust = true;
      hand.isActive = false;
      hand.result = 'lose';
      bjAdvanceHand(session);
    } else if (total === 21) {
      hand.isActive = false;
      bjAdvanceHand(session);
    }
  } else if (actionObj.stand) {
    hand.isStand = true;
    hand.isActive = false;
    bjAdvanceHand(session);
  } else if (actionObj.double) {
    if (hand.cards.length !== 2) return session;
    hand.isDoubled = true;
    playerBalance = Math.round((playerBalance - session.betAmount) * 100) / 100;
    const card = session.deck.shift();
    hand.cards.push(card);
    const total = bjHandTotal(hand.cards);
    if (total > 21) {
      hand.isBust = true;
      hand.result = 'lose';
    }
    hand.isActive = false;
    bjAdvanceHand(session);
  } else if (actionObj.split) {
    if (hand.cards.length !== 2) return session;
    if (bjCardValue(hand.cards[0][0]) !== bjCardValue(hand.cards[1][0])) return session;
    session.isSplit = true;
    playerBalance = Math.round((playerBalance - session.betAmount) * 100) / 100;

    const card1 = hand.cards[0];
    const card2 = hand.cards[1];
    const bothAces = card1[0] === 'A' && card2[0] === 'A';
    const newCard1 = session.deck.shift();
    const newCard2 = session.deck.shift();

    hand.cards = [card1, newCard1];
    hand.isSplit = true;
    const hand2 = {
      handId: session.hands.length,
      cards: [card2, newCard2],
      isStand: false, isBust: false, isDoubled: false,
      isActive: false, isSplit: true, result: null,
    };
    session.hands.push(hand2);

    if (bothAces) {
      // Split aces: each gets one card, auto-stand
      hand.isStand = true; hand.isActive = false;
      hand2.isStand = true; hand2.isActive = false;
      session.status = 'dealerTurn';
      bjDealerPlay(session);
      if (session.status === 'finished') {
        const payout = bjCalcPayout(session);
        if (payout > 0) playerBalance = Math.round((playerBalance + payout) * 100) / 100;
        session.payout = payout;
        bjActiveSession = null;
      }
    } else {
      // Check if first hand is 21
      if (bjHandTotal(hand.cards) === 21) {
        hand.isActive = false;
        // Activate second hand
        session.currentHandIndex = 1;
        hand2.isActive = true;
        if (bjHandTotal(hand2.cards) === 21) {
          hand2.isActive = false;
          session.status = 'dealerTurn';
          bjDealerPlay(session);
          if (session.status === 'finished') {
            const payout = bjCalcPayout(session);
            if (payout > 0) playerBalance = Math.round((playerBalance + payout) * 100) / 100;
            session.payout = payout;
            bjActiveSession = null;
          }
        }
      } else {
        // First hand still active, continue playing
      }
    }
  }

  return session;
}

// ---- BUILD HOMEPAGE HTML ----

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
  }).join('\n  ');
  const p2i = JSON.stringify(Object.fromEntries(GAMES.map(g => [g.path, g.id])));
  const i2p = JSON.stringify(Object.fromEntries(GAMES.map(g => [g.id, g.path])));
  const allIds = JSON.stringify(GAMES.map(g => g.id));
  const html = `<!DOCTYPE html>
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
  ${iframes}
  <div id="rb-loader"><div class="rb-spinner"></div></div>
<script>
(function(){
  var P2I = ${p2i};
  var I2P = ${i2p};
  var ALL = ${allIds};
  var activeId = ${JSON.stringify(activeId)};
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
    var path = String(e.data.path || '').replace(/^\/en\//, '/').split('?')[0].split('#')[0];
    var id = P2I[path];
    if (id) show(id, true);
  });

  // Back/forward button
  window.addEventListener('popstate', function(e) {
    var id = (e.state && e.state.rbId) || P2I[location.pathname.replace(/^\/en\//,'/')] || 'plinko';
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
<\/script>
</body></html>`;
  _shellCache[activeGame] = html;
  return html;
}

function buildHomepageHTML() {
  let html = fs.readFileSync(HOMEPAGE_HTML_FILE, 'utf8');

  // Rewrite asset paths: ./homepage_files/ -> /homepage_files/
  html = html.replace(/\.\/homepage_files\//g, '/homepage_files/');

  // â”€â”€ 1. Patch __NEXT_DATA__ â”€â”€
  const ndTag = 'id="__NEXT_DATA__"';
  const ndStart = html.indexOf(ndTag);
  if (ndStart >= 0) {
    const jsonStart = html.indexOf('>', ndStart) + 1;
    const jsonEnd = html.indexOf('</script>', jsonStart);
    try {
      const nd = JSON.parse(html.substring(jsonStart, jsonEnd));
      const pp = nd.props.pageProps;
      pp.wallet = { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } };
      pp.userData = pp.userData || {};
      pp.userData.public_id = pp.userData.public_id || 'LOCAL_PLAYER_001';
      pp.userData.currency = 'USD';
      pp.userData.username = pp.userData.username || 'Player';
      pp.userData.preferences = pp.userData.preferences || {};
      pp.userData.auth = pp.userData.auth || { type: 'local', email_verified_at: new Date().toISOString(), has_2fa: 0 };
      pp.userData.kyc_level = pp.userData.kyc_level || 2;
      if (nd.runtimeConfig) nd.runtimeConfig.apiUrl = _currentOrigin;
      if (nd.publicRuntimeConfig) nd.publicRuntimeConfig.apiUrl = _currentOrigin;
      html = html.substring(0, jsonStart) + JSON.stringify(nd) + html.substring(jsonEnd);
    } catch (e) { console.error('NEXT_DATA patch failed (homepage):', e.message); }
  }

  // -- 1b. Kill preloader --
  const earlyCSS = '<style id="kill-preloader">' +
    'section.fixed[class*="z-[9999]"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
    'img[src*="preloader"]{display:none!important}' +
    'svg.animate-spin{display:none!important}' +
    '#loader-external-login{display:none!important}' +
    '</style>';
  html = html.replace(/<head>/i, '<head>' + earlyCSS);

  // â”€â”€ 2. Remove third-party/tracking scripts â”€â”€
  html = html.replace(/<script[^>]*id="gtm-head"[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*><\/script>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/challenges\.cloudflare\.com[^"]*"[^>]*><\/script>/gi, '');
  html = html.replace(/<script[^>]*id="turnstile-script"[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<link[^>]*challenges\.cloudflare\.com[^>]*>/gi, '');
  html = html.replace(/<iframe[^>]*id="intercom-frame"[^>]*>[^<]*<\/iframe>/gi, '');
  html = html.replace(/<iframe[^>]*id="intercom-frame"[^>]*>/gi, '');
  html = html.replace(/<script[^>]*anj-seal[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*id="no-logs"[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/[^"]*\.(cloudflare|intercom|facebook|google)[^"]*"[^>]*><\/script>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/[^"]*\.(cloudflare|intercom|facebook|google)[^"]*"[^>]*>/gi, '');

  // â”€â”€ 2b. Rewrite CDN image URLs to local â”€â”€
  html = html.replace(/https?:\/\/cdn\.rainbet\.com\//g, '/cdn/');
  html = html.replace(/https?:\/\/assets\.rbgcdn\.com\/[^/]+\/max-w-\d+\//g, '/cdn/');

  // â”€â”€ 3. Inject local runtime patches â”€â”€
  const patches = `
<script id="local-runtime-patches">
(function() {
  'use strict';

  // -- DOM tolerance patches (prevent React hydration crashes) --
  var _origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child && child.parentNode !== this) return child;
    return _origRemoveChild.call(this, child);
  };
  var _origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, refNode) {
    if (refNode && refNode.parentNode !== this) return _origInsertBefore.call(this, newNode, null);
    return _origInsertBefore.call(this, newNode, refNode);
  };

  window.__LOCAL_BALANCE__ = ${playerBalance};
  window.__LOCAL_API__ = window.location.origin;

  Object.defineProperty(navigator, 'onLine', { get: function() { return true; }, configurable: true });

  var offlineStyle = document.createElement('style');
  offlineStyle.textContent = '[class*="InternetConnection"], [class*="offline"], [class*="internet-connection"] { display: none !important; }';
  document.head.appendChild(offlineStyle);

  if (window.log) console.log = window.log;

  // â”€â”€ Intercept XMLHttpRequest â”€â”€
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string') {
      url = url.replace(/https?:\\/\\/[a-z0-9.-]*rainbet\\.com/g, '');
    }
    var args = Array.prototype.slice.call(arguments);
    args[1] = url;
    return _xhrOpen.apply(this, args);
  };

  // â”€â”€ Mock socket.io â”€â”€
  function MockSocket(nsp) {
    var s = {
      _h: {}, id: 'mock-' + Math.random().toString(36).substr(2,9),
      connected: true, disconnected: false, nsp: nsp || '/',
      io: { engine: { transport: { name: 'websocket' }, on: function(){return this}, once: function(){return this} } },
      on: function(e,f) { (s._h[e]=s._h[e]||[]).push(f); return s },
      off: function() { return s }, once: function(e,f) { return s.on(e,f) },
      emit: function(e) { var a=Array.prototype.slice.call(arguments,1); (s._h[e]||[]).forEach(function(f){try{f.apply(null,a)}catch(x){}}); return s },
      removeListener: function(){return s}, removeAllListeners: function(){s._h={};return s},
      listeners: function(e){return s._h[e]||[]}, hasListeners: function(e){return(s._h[e]||[]).length>0},
      connect: function(){s.connected=true;return s}, disconnect: function(){s.connected=false;return s},
      close: function(){return s.disconnect()}, open: function(){return s.connect()},
      volatile: null, compress: function(){return s}, timeout: function(){return s}
    };
    s.volatile = s;
    setTimeout(function(){ s.emit('connect'); }, 50);
    return s;
  }
  function MockManager(url, opts) {
    var m = Object.create(MockSocket('/'));
    m._sockets = {};
    m.socket = function(nsp) { return m._sockets[nsp] = m._sockets[nsp] || MockSocket(nsp); };
    m.reconnection = function(){return m};
    return m;
  }
  window.io = function(url, opts) { return MockSocket('/'); };
  window.io.Manager = MockManager;
  window.io.Socket = MockSocket;
  window.io.connect = window.io;
  window.io.protocol = 5;

  // â”€â”€ Block external WebSocket â”€â”€
  var _OrigWS = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string' && (url.includes('rainbet.com') || url.includes('intercom') || url.includes('facebook') || url.includes('google'))) {
      var fake = { readyState: 3, CONNECTING:0, OPEN:1, CLOSING:2, CLOSED:3,
        send:function(){}, close:function(){this.readyState=3;}, addEventListener:function(){}, removeEventListener:function(){},
        onopen:null, onclose:null, onmessage:null, onerror:null, url:url, protocol:'', extensions:'', bufferedAmount:0, binaryType:'blob'
      };
      return fake;
    }
    if (protocols !== undefined) return new _OrigWS(url, protocols);
    return new _OrigWS(url);
  };
  window.WebSocket.prototype = _OrigWS.prototype;
  window.WebSocket.CONNECTING = 0; window.WebSocket.OPEN = 1; window.WebSocket.CLOSING = 2; window.WebSocket.CLOSED = 3;

  // â”€â”€ Mock Turnstile â”€â”€
  window.turnstile = {
    render: function(el,o){if(o&&o.callback)setTimeout(function(){o.callback('mock-token')},100);return'w'},
    reset:function(){}, remove:function(){}, getResponse:function(){return'mock-token'}, isExpired:function(){return false}
  };
  window.onLoadTurnstile = function(){};

  // â”€â”€ Intercept fetch â”€â”€
  var _fetch = window.fetch;
  window.fetch = function(url, opts) {
    var u = typeof url === 'string' ? url : (url && url.url ? url.url : '');

    if (u.includes('rainbet.com')) {
      try { var p = new URL(u); url = p.pathname + p.search; u = url; } catch(e){}
    }

    if (u.includes('/api/auth') || u.includes('/session') || u.includes('next-auth')) {
      return Promise.resolve(new Response(JSON.stringify({
        user: { name: 'Player' }, expires: new Date(Date.now()+86400000).toISOString()
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }

    if (u.includes('/_next/data/')) {
      var _ndIdx = u.indexOf('/_next/data/');
      var _dp = '';
      if (_ndIdx !== -1) { var _slashPos = u.indexOf('/', _ndIdx + 12); if (_slashPos !== -1) { var _jsonPos = u.indexOf('.json', _slashPos); _dp = _jsonPos !== -1 ? u.substring(_slashPos, _jsonPos) : u.substring(_slashPos); var _qPos = _dp.indexOf('?'); if (_qPos !== -1) _dp = _dp.substring(0, _qPos); if (_dp.substring(0,4) === '/en/') _dp = _dp.substring(3); } }
      var _gr = {'/casino/originals/plinko':1,'/casino/originals/chicken-cross':1,'/casino/originals/mines-game':1,'/casino/originals/blackjack':1};
      var _hr = {'/':1,'/casino':1,'/casino/originals':1,'/home':1};
      var _cp = window.location.pathname; if (_cp.substring(0,4) === '/en/') _cp = _cp.substring(3);
      if (_gr[_dp] && _dp !== _cp) { window.location.href = _dp; return new Promise(function(){}); }
      if (_hr[_dp] && !_hr[_cp]) { window.location.href = '/casino'; return new Promise(function(){}); }
      return Promise.resolve(new Response(JSON.stringify({
        pageProps: {}, __N_SSP: true
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }

    if (u.includes('/_next/image')) {
      try {
        var imgUrl = new URL(u, window.location.origin);
        var realUrl = imgUrl.searchParams.get('url');
        if (realUrl) return _fetch(realUrl, opts);
      } catch(e) {}
    }

    if (u.includes('challenges.cloudflare.com') || u.includes('googletagmanager') ||
        u.includes('facebook.net') || u.includes('intercom') || u.includes('anj-seal')) {
      return Promise.resolve(new Response('', { status: 200 }));
    }

    return _fetch(url, opts);
  };

  // â”€â”€ Remove preloader / overlays after load â”€â”€
  window.addEventListener('load', function() {
    setTimeout(function() {
      document.querySelectorAll('[class*="captcha"],[class*="Captcha"],[class*="turnstile"],[class*="Turnstile"]').forEach(function(el){
        el.style.display='none';
      });
    }, 500);
  });

  // â”€â”€ Error collector â”€â”€
  window.__CLIENT_ERRORS__ = [];
  window.__CLIENT_LOGS__ = [];
  var _origConsoleError = console.error;
  console.error = function() {
    var msg = Array.prototype.slice.call(arguments).map(function(a){return typeof a === 'string' ? a : JSON.stringify(a)}).join(' ');
    window.__CLIENT_ERRORS__.push(msg.substring(0, 500));
    if (window.__CLIENT_ERRORS__.length > 50) window.__CLIENT_ERRORS__.shift();
    return _origConsoleError.apply(console, arguments);
  };

  // â”€â”€ Suppress harmless errors â”€â”€
  var blockList = ['intercom','gtm','fbevents','google','turnstile','cloudflare','socket.io','anj-seal','facebook'];
  window.addEventListener('error', function(e) {
    var msg = e.message || '';
    if (blockList.some(function(w){return msg.toLowerCase().includes(w)})) { e.preventDefault(); return true; }
    window.__CLIENT_ERRORS__.push('GLOBAL: ' + msg + (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : ''));
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && (e.reason.message || String(e.reason)) || '';
    if (blockList.some(function(w){return msg.toLowerCase().includes(w)}) || msg.includes('Failed to fetch')) { e.preventDefault(); return; }
    window.__CLIENT_ERRORS__.push('REJECTION: ' + msg.substring(0, 300));
  });

  setInterval(function() {
    if (window.__CLIENT_ERRORS__.length > 0) {
      var errors = window.__CLIENT_ERRORS__.splice(0);
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/client-errors', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ errors: errors }));
      } catch(x) {}
    }
  }, 3000);

  console.log('%c RAINBET HOMEPAGE â€” LOCAL MODE ', 'background:#6c5ce7;color:white;font-size:16px;padding:4px 12px;border-radius:4px');
  console.log('%c Balance: $' + window.__LOCAL_BALANCE__.toFixed(2), 'color:#00b894;font-size:14px');

})();
</script>
`;
  html = html.replace('<head>', function() { return '<head>\n' + patches; });

  // Inject universal navigation script
  html = html.replace('</head>', function() { return buildNavScript('homepage') + '</head>'; });

  // -- Unregister service workers --
  var swKill = '<script>if(navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(w){w.unregister()})});<\/script>';
  html = html.replace('</head>', swKill + '</head>');

  return html;
}

/*--- REMOVED INLINE TEMPLATE (now reads from file) ---*/

let cachedHTML = null;

function buildPlinkoHTML() {
  // Re-read if balance changed or not cached
  let html = fs.readFileSync(path.join(CAPTURE_DIR, 'plinko.html'), 'utf8');

  // Ã¢â€â‚¬Ã¢â€â‚¬ 1. Patch __NEXT_DATA__ Ã¢â€â‚¬Ã¢â€â‚¬
  const ndTag = 'id="__NEXT_DATA__"';
  const ndStart = html.indexOf(ndTag);
  if (ndStart >= 0) {
    const jsonStart = html.indexOf('>', ndStart) + 1;
    const jsonEnd = html.indexOf('</script>', jsonStart);
    try {
      const nd = JSON.parse(html.substring(jsonStart, jsonEnd));
      const pp = nd.props.pageProps;
      pp.wallet = { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } };
      pp.userData = pp.userData || {};
      pp.userData.public_id = pp.userData.public_id || 'LOCAL_PLAYER_001';
      pp.userData.currency = 'USD';
      pp.userData.username = pp.userData.username || 'Player';
      pp.userData.preferences = pp.userData.preferences || {};
      pp.userData.auth = pp.userData.auth || { type: 'local', email_verified_at: new Date().toISOString(), has_2fa: 0 };
      pp.userData.kyc_level = pp.userData.kyc_level || 2;
      // Ensure API base URL points to our server
      if (nd.runtimeConfig) nd.runtimeConfig.apiUrl = _currentOrigin;
      if (nd.publicRuntimeConfig) nd.publicRuntimeConfig.apiUrl = _currentOrigin;
      html = html.substring(0, jsonStart) + JSON.stringify(nd) + html.substring(jsonEnd);
    } catch (e) { console.error('NEXT_DATA patch failed:', e.message); }
  }

  // -- 1b. Kill preloader: inject <style> in <head> before any scripts --
  const earlyCSS = '<style id="kill-preloader">' +
    'section.fixed[class*="z-[9999]"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
    'img[src*="preloader"]{display:none!important}' +
    'svg.animate-spin{display:none!important}' +
    '#loader-external-login{display:none!important}' +
    '</style>';
  html = html.replace(/<head>/i, '<head>' + earlyCSS);

  // Ã¢â€â‚¬Ã¢â€â‚¬ 2. Remove third-party/tracking scripts Ã¢â€â‚¬Ã¢â€â‚¬
  // Remove inline GTM
  html = html.replace(/<script[^>]*id="gtm-head"[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove loading of GTM, Facebook, Intercom, Google scripts
  html = html.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*><\/script>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*>/gi, '');
  // Remove Cloudflare turnstile scripts (BLOCKING - defer="false" async="false")
  html = html.replace(/<script[^>]*src="https?:\/\/challenges\.cloudflare\.com[^"]*"[^>]*><\/script>/gi, '');
  html = html.replace(/<script[^>]*id="turnstile-script"[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove Cloudflare turnstile preload/preconnect
  html = html.replace(/<link[^>]*challenges\.cloudflare\.com[^>]*>/gi, '');
  // Remove Intercom iframes
  html = html.replace(/<iframe[^>]*id="intercom-frame"[^>]*>[^<]*<\/iframe>/gi, '');
  html = html.replace(/<iframe[^>]*id="intercom-frame"[^>]*>/gi, '');
  // Remove anj-seal
  html = html.replace(/<script[^>]*anj-seal[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove no-logs script (which disables console.log)
  html = html.replace(/<script[^>]*id="no-logs"[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove any remaining external scripts that would fail/block
  html = html.replace(/<script[^>]*src="https?:\/\/[^"]*\.(cloudflare|intercom|facebook|google)[^"]*"[^>]*><\/script>/gi, '');
  html = html.replace(/<script[^>]*src="https?:\/\/[^"]*\.(cloudflare|intercom|facebook|google)[^"]*"[^>]*>/gi, '');

  // Ã¢â€â‚¬Ã¢â€â‚¬ 2b. Rewrite CDN image URLs to local Ã¢â€â‚¬Ã¢â€â‚¬
  // cdn.rainbet.com/currencies/XXX.svg Ã¢â€ â€™ /cdn/currencies/XXX.svg
  html = html.replace(/https?:\/\/cdn\.rainbet\.com\//g, '/cdn/');
  // assets.rbgcdn.com/HASH/max-w-NN/TYPE Ã¢â€ â€™ /cdn/TYPE
  html = html.replace(/https?:\/\/assets\.rbgcdn\.com\/[^/]+\/max-w-\d+\//g, '/cdn/');

  // Ã¢â€â‚¬Ã¢â€â‚¬ 3. Inject local runtime patches Ã¢â€â‚¬Ã¢â€â‚¬
  const patches = `
<script id="local-runtime-patches">
(function() {
  'use strict';
  // -- DOM tolerance patches (prevent React hydration crashes) --
  var _origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child && child.parentNode !== this) return child;
    return _origRemoveChild.call(this, child);
  };
  var _origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, refNode) {
    if (refNode && refNode.parentNode !== this) return _origInsertBefore.call(this, newNode, null);
    return _origInsertBefore.call(this, newNode, refNode);
  };


  // Ã¢â€â‚¬Ã¢â€â‚¬ Balance tracking Ã¢â€â‚¬Ã¢â€â‚¬
  window.__LOCAL_BALANCE__ = ${playerBalance};
  window.__LOCAL_API__ = window.location.origin;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Force online status Ã¢â€â‚¬Ã¢â€â‚¬
  Object.defineProperty(navigator, 'onLine', { get: function() { return true; }, configurable: true });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Hide offline notification banner via CSS Ã¢â€â‚¬Ã¢â€â‚¬
  var offlineStyle = document.createElement('style');
  offlineStyle.textContent = '[class*="InternetConnection"], [class*="offline"], [class*="internet-connection"] { display: none !important; }';
  document.head.appendChild(offlineStyle);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Restore console Ã¢â€â‚¬Ã¢â€â‚¬
  if (window.log) console.log = window.log;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Intercept XMLHttpRequest to redirect API calls to local server Ã¢â€â‚¬Ã¢â€â‚¬
  // The game framework uses axios (which uses XHR) to call originals.rainbet.com
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string') {
      // Redirect ALL rainbet.com subdomains to localhost
      url = url.replace(/https?:\\/\\/[a-z0-9.-]*rainbet\\.com/g, '');
    }
    var args = Array.prototype.slice.call(arguments);
    args[1] = url;
    return _xhrOpen.apply(this, args);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Mock socket.io Ã¢â€â‚¬Ã¢â€â‚¬
  function MockSocket(nsp) {
    var s = {
      _h: {}, id: 'mock-' + Math.random().toString(36).substr(2,9),
      connected: true, disconnected: false, nsp: nsp || '/',
      io: { engine: { transport: { name: 'websocket' }, on: function(){return this}, once: function(){return this} } },
      on: function(e,f) { (s._h[e]=s._h[e]||[]).push(f); return s },
      off: function() { return s }, once: function(e,f) { return s.on(e,f) },
      emit: function(e) { var a=Array.prototype.slice.call(arguments,1); (s._h[e]||[]).forEach(function(f){try{f.apply(null,a)}catch(x){}}); return s },
      removeListener: function(){return s}, removeAllListeners: function(){s._h={};return s},
      listeners: function(e){return s._h[e]||[]}, hasListeners: function(e){return(s._h[e]||[]).length>0},
      connect: function(){s.connected=true;return s}, disconnect: function(){s.connected=false;return s},
      close: function(){return s.disconnect()}, open: function(){return s.connect()},
      volatile: null, compress: function(){return s}, timeout: function(){return s}
    };
    s.volatile = s;
    setTimeout(function(){ s.emit('connect'); }, 50);
    return s;
  }
  function MockManager(url, opts) {
    var m = Object.create(MockSocket('/'));
    m._sockets = {};
    m.socket = function(nsp) { return m._sockets[nsp] = m._sockets[nsp] || MockSocket(nsp); };
    m.reconnection = function(){return m};
    return m;
  }
  window.io = function(url, opts) { return MockSocket('/'); };
  window.io.Manager = MockManager;
  window.io.Socket = MockSocket;
  window.io.connect = window.io;
  window.io.protocol = 5;

  // -- Block external WebSocket connections --
  var _OrigWS = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string' && (url.includes('rainbet.com') || url.includes('intercom') || url.includes('facebook') || url.includes('google'))) {
      var fake = { readyState: 3, CONNECTING:0, OPEN:1, CLOSING:2, CLOSED:3,
        send:function(){}, close:function(){this.readyState=3;}, addEventListener:function(){}, removeEventListener:function(){},
        onopen:null, onclose:null, onmessage:null, onerror:null, url:url, protocol:'', extensions:'', bufferedAmount:0, binaryType:'blob'
      };
      return fake;
    }
    if (protocols !== undefined) return new _OrigWS(url, protocols);
    return new _OrigWS(url);
  };
  window.WebSocket.prototype = _OrigWS.prototype;
  window.WebSocket.CONNECTING = 0; window.WebSocket.OPEN = 1; window.WebSocket.CLOSING = 2; window.WebSocket.CLOSED = 3;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Mock Turnstile Ã¢â€â‚¬Ã¢â€â‚¬
  window.turnstile = {
    render: function(el,o){if(o&&o.callback)setTimeout(function(){o.callback('mock-token')},100);return'w'},
    reset:function(){}, remove:function(){}, getResponse:function(){return'mock-token'}, isExpired:function(){return false}
  };
  window.onLoadTurnstile = function(){};

  // Ã¢â€â‚¬Ã¢â€â‚¬ Intercept fetch â€” redirect API calls to local server Ã¢â€â‚¬Ã¢â€â‚¬
  var _fetch = window.fetch;
  window.fetch = function(url, opts) {
    var u = typeof url === 'string' ? url : (url && url.url ? url.url : '');

    // Rewrite any rainbet.com domain calls to local (strip origin, keep path)
    if (u.includes('rainbet.com')) {
      try { var p = new URL(u); url = p.pathname + p.search; u = url; } catch(e){}
    }

    // Auth / session (intercept before it hits server)
    if (u.includes('/api/auth') || u.includes('/session') || u.includes('next-auth')) {
      return Promise.resolve(new Response(JSON.stringify({
        user: { name: 'Player' }, expires: new Date(Date.now()+86400000).toISOString()
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }

    // _next/data (Next.js client navigation)
    if (u.includes('/_next/data/')) {
      var _ndIdx = u.indexOf('/_next/data/');
      var _dp = '';
      if (_ndIdx !== -1) { var _slashPos = u.indexOf('/', _ndIdx + 12); if (_slashPos !== -1) { var _jsonPos = u.indexOf('.json', _slashPos); _dp = _jsonPos !== -1 ? u.substring(_slashPos, _jsonPos) : u.substring(_slashPos); var _qPos = _dp.indexOf('?'); if (_qPos !== -1) _dp = _dp.substring(0, _qPos); if (_dp.substring(0,4) === '/en/') _dp = _dp.substring(3); } }
      var _gr = {'/casino/originals/plinko':1,'/casino/originals/chicken-cross':1,'/casino/originals/mines-game':1,'/casino/originals/blackjack':1};
      var _hr = {'/':1,'/casino':1,'/casino/originals':1,'/home':1};
      var _cp = window.location.pathname; if (_cp.substring(0,4) === '/en/') _cp = _cp.substring(3);
      if (_gr[_dp] && _dp !== _cp) { window.location.href = _dp; return new Promise(function(){}); }
      if (_hr[_dp] && !_hr[_cp]) { window.location.href = '/casino'; return new Promise(function(){}); }
      return Promise.resolve(new Response(JSON.stringify({
        pageProps: {}, __N_SSP: true
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }

    // _next/image proxy
    if (u.includes('/_next/image')) {
      try {
        var imgUrl = new URL(u, window.location.origin);
        var realUrl = imgUrl.searchParams.get('url');
        if (realUrl) return _fetch(realUrl, opts);
      } catch(e) {}
    }

    // Block remaining external requests that would fail
    if (u.includes('challenges.cloudflare.com') || u.includes('googletagmanager') ||
        u.includes('facebook.net') || u.includes('intercom') || u.includes('anj-seal')) {
      return Promise.resolve(new Response('', { status: 200 }));
    }

    // Everything else goes to our local server
    return _fetch(url, opts);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Balance display updater Ã¢â€â‚¬Ã¢â€â‚¬
  function updateBalanceDisplay(bal) {
    // Try to find and update the balance element
    var els = document.querySelectorAll('[class*="balance"], [class*="Balance"]');
    els.forEach(function(el) {
      if (el.textContent && /\\$[\\d,.]+/.test(el.textContent)) {
        el.textContent = '$' + bal.toFixed(2);
      }
    });
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Remove preloader / overlays after load Ã¢â€â‚¬Ã¢â€â‚¬
  window.addEventListener('load', function() {
    setTimeout(function() {
      // Hide any captcha/turnstile overlays
      document.querySelectorAll('[class*="captcha"],[class*="Captcha"],[class*="turnstile"],[class*="Turnstile"]').forEach(function(el){
        el.style.display='none';
      });
    }, 500);
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Error collector for diagnostics Ã¢â€â‚¬Ã¢â€â‚¬
  window.__CLIENT_ERRORS__ = [];
  window.__CLIENT_LOGS__ = [];
  var _origConsoleError = console.error;
  console.error = function() {
    var msg = Array.prototype.slice.call(arguments).map(function(a){return typeof a === 'string' ? a : JSON.stringify(a)}).join(' ');
    window.__CLIENT_ERRORS__.push(msg.substring(0, 500));
    if (window.__CLIENT_ERRORS__.length > 50) window.__CLIENT_ERRORS__.shift();
    return _origConsoleError.apply(console, arguments);
  };
  var _origConsoleWarn = console.warn;
  console.warn = function() {
    var msg = Array.prototype.slice.call(arguments).map(function(a){return typeof a === 'string' ? a : JSON.stringify(a)}).join(' ');
    window.__CLIENT_LOGS__.push('[warn] ' + msg.substring(0, 300));
    if (window.__CLIENT_LOGS__.length > 50) window.__CLIENT_LOGS__.shift();
    return _origConsoleWarn.apply(console, arguments);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Suppress harmless errors Ã¢â€â‚¬Ã¢â€â‚¬
  var blockList = ['intercom','gtm','fbevents','google','turnstile','cloudflare','socket.io','anj-seal','facebook'];
  window.addEventListener('error', function(e) {
    var msg = e.message || '';
    if (blockList.some(function(w){return msg.toLowerCase().includes(w)})) { e.preventDefault(); return true; }
    window.__CLIENT_ERRORS__.push('GLOBAL: ' + msg + (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : ''));
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && (e.reason.message || String(e.reason)) || '';
    if (blockList.some(function(w){return msg.toLowerCase().includes(w)}) || msg.includes('Failed to fetch')) { e.preventDefault(); return; }
    window.__CLIENT_ERRORS__.push('REJECTION: ' + msg.substring(0, 300));
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Report errors to server Ã¢â€â‚¬Ã¢â€â‚¬
  setInterval(function() {
    if (window.__CLIENT_ERRORS__.length > 0) {
      var errors = window.__CLIENT_ERRORS__.splice(0);
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/client-errors', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ errors: errors }));
      } catch(x) {}
    }
  }, 3000);

  console.log('%c RAINBET PLINKO â€” LOCAL MODE ', 'background:#6c5ce7;color:white;font-size:16px;padding:4px 12px;border-radius:4px');
  console.log('%c Balance: $' + window.__LOCAL_BALANCE__.toFixed(2), 'color:#00b894;font-size:14px');

})();
</script>
`;
  html = html.replace('<head>', function() { return '<head>\n' + patches; });

  // Inject universal navigation script
  html = html.replace('</head>', function() { return buildNavScript('plinko') + '</head>'; });

  // -- Inject plinko cheat panel (Right Shift to toggle) --
  const cheatPanel = `<script id="plinko-cheat-panel">
(function() {
  'use strict';
  window.__PLINKO_TARGET_BUCKET__ = null;
  var panelOpen = false;
  var activeBtn = null;

  // Known multiplier arrays (16-row defaults for each risk)
  var MULTS = {
    low:    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high:   [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  };

  // Try to read multipliers from the actual DOM buckets
  function readDOMMults() {
    var buckets = document.querySelectorAll('[id^="bucket-"]');
    if (buckets.length < 5) return null;
    var arr = [];
    buckets.forEach(function(b) {
      arr.push(parseFloat(b.getAttribute('data-multiplier')) || 0);
    });
    return arr;
  }

  // --- Server target API ---
  function setServerTarget(idx) {
    var x = new XMLHttpRequest();
    x.open('POST', '/api/plinko/set-target', true);
    x.setRequestHeader('Content-Type', 'application/json');
    x.onload = function() {
      try {
        var r = JSON.parse(x.responseText);
        console.log('%c[CHEAT] Server target set: bucket ' + r.target, 'color:#FFD700;font-weight:bold');
      } catch(e) {}
    };
    x.send(JSON.stringify({ target: idx }));
  }
  function clearServerTarget() {
    var x = new XMLHttpRequest();
    x.open('POST', '/api/plinko/set-target', true);
    x.setRequestHeader('Content-Type', 'application/json');
    x.onload = function() { console.log('%c[CHEAT] Target cleared', 'color:#FFD700'); };
    x.send(JSON.stringify({ target: null }));
  }

  // --- Build the panel ---
  var panel = document.createElement('div');
  panel.id = 'cheat-panel';
  panel.style.cssText = 'position:fixed;top:50%;right:16px;transform:translateY(-50%);background:rgba(20,20,30,0.95);border:2px solid #FFD700;border-radius:12px;padding:12px;z-index:999999;display:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;min-width:200px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.6);backdrop-filter:blur(8px);';

  var title = document.createElement('div');
  title.style.cssText = 'font-size:13px;font-weight:700;color:#FFD700;margin-bottom:8px;text-align:center;letter-spacing:1px;';
  title.textContent = 'PLINKO TARGET';
  panel.appendChild(title);

  var hint = document.createElement('div');
  hint.style.cssText = 'font-size:10px;color:#aaa;text-align:center;margin-bottom:8px;';
  hint.textContent = 'Right Shift to toggle';
  panel.appendChild(hint);

  var status = document.createElement('div');
  status.id = 'cheat-status';
  status.style.cssText = 'font-size:11px;color:#aaa;text-align:center;margin-bottom:8px;padding:4px;border-radius:4px;';
  status.textContent = 'No target set';
  panel.appendChild(status);

  var grid = document.createElement('div');
  grid.id = 'cheat-grid';
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(48px,1fr));gap:4px;';
  panel.appendChild(grid);

  var clearBtn = document.createElement('button');
  clearBtn.textContent = 'CLEAR';
  clearBtn.style.cssText = 'width:100%;margin-top:8px;padding:6px;background:#333;color:#ff4444;border:1px solid #ff4444;border-radius:6px;font-weight:700;font-size:11px;cursor:pointer;';
  clearBtn.addEventListener('click', function() {
    window.__PLINKO_TARGET_BUCKET__ = null;
    activeBtn = null;
    clearServerTarget();
    updateButtons();
    status.textContent = 'No target set';
    status.style.color = '#aaa';
    // Also unhighlight DOM buckets
    document.querySelectorAll('[id^="bucket-"]').forEach(function(b) {
      b.style.outline = ''; b.style.boxShadow = ''; b.style.transform = '';
    });
    var ind = document.getElementById('target-indicator');
    if (ind) ind.style.display = 'none';
  });
  panel.appendChild(clearBtn);

  // --- Populate buttons from multipliers ---
  function populateGrid() {
    grid.innerHTML = '';
    var mults = readDOMMults() || MULTS.low;
    for (var i = 0; i < mults.length; i++) {
      (function(idx, mult) {
        var btn = document.createElement('button');
        btn.className = 'cheat-bucket-btn';
        btn.setAttribute('data-idx', idx);
        btn.textContent = mult + 'x';
        btn.style.cssText = 'padding:6px 2px;background:#1a1a2e;color:#ddd;border:1px solid #444;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center;';
        // Color-code by multiplier value
        if (mult >= 10) { btn.style.borderColor = '#FFD700'; btn.style.color = '#FFD700'; }
        else if (mult >= 3) { btn.style.borderColor = '#FFA500'; btn.style.color = '#FFA500'; }
        else if (mult >= 1.5) { btn.style.borderColor = '#4CAF50'; btn.style.color = '#4CAF50'; }
        else { btn.style.borderColor = '#666'; btn.style.color = '#999'; }

        btn.addEventListener('mouseenter', function() { btn.style.opacity = '0.8'; });
        btn.addEventListener('mouseleave', function() { btn.style.opacity = '1'; });
        btn.addEventListener('click', function() {
          if (window.__PLINKO_TARGET_BUCKET__ === idx) {
            window.__PLINKO_TARGET_BUCKET__ = null;
            activeBtn = null;
            clearServerTarget();
            status.textContent = 'No target set';
            status.style.color = '#aaa';
          } else {
            window.__PLINKO_TARGET_BUCKET__ = idx;
            activeBtn = idx;
            setServerTarget(idx);
            status.textContent = 'Target: Bucket ' + idx + ' (' + mult + 'x)';
            status.style.color = '#FFD700';
            // Highlight the actual DOM bucket too
            highlightDOMBucket(idx);
          }
          updateButtons();
        });
        grid.appendChild(btn);
      })(i, mults[i]);
    }
  }

  function updateButtons() {
    var btns = grid.querySelectorAll('.cheat-bucket-btn');
    btns.forEach(function(b) {
      var idx = parseInt(b.getAttribute('data-idx'));
      if (idx === activeBtn) {
        b.style.background = '#FFD700';
        b.style.color = '#000';
        b.style.fontWeight = '800';
        b.style.transform = 'scale(1.1)';
        b.style.boxShadow = '0 0 10px rgba(255,215,0,0.6)';
      } else {
        b.style.background = '#1a1a2e';
        b.style.fontWeight = '600';
        b.style.transform = 'scale(1)';
        b.style.boxShadow = 'none';
        // Restore original color
        var mult = parseFloat(b.textContent);
        if (mult >= 10) b.style.color = '#FFD700';
        else if (mult >= 3) b.style.color = '#FFA500';
        else if (mult >= 1.5) b.style.color = '#4CAF50';
        else b.style.color = '#999';
      }
    });
  }

  function highlightDOMBucket(idx) {
    document.querySelectorAll('[id^="bucket-"]').forEach(function(b) {
      b.style.outline = ''; b.style.boxShadow = ''; b.style.transform = '';
    });
    var el = document.getElementById('bucket-' + idx);
    if (el) {
      el.style.outline = '3px solid #FFD700';
      el.style.boxShadow = '0 0 16px rgba(255,215,0,0.7)';
      el.style.transform = 'scale(1.15)';
    }
    // Floating indicator
    var ind = document.getElementById('target-indicator');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'target-indicator';
      ind.style.cssText = 'position:fixed;top:12px;right:12px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;padding:6px 14px;border-radius:8px;font-weight:700;font-size:13px;z-index:999998;box-shadow:0 2px 12px rgba(255,165,0,0.4);font-family:-apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none;';
      document.body.appendChild(ind);
    }
    var mult = el ? (el.getAttribute('data-multiplier') || '?') : '?';
    ind.textContent = 'TARGET: ' + mult + 'x';
    ind.style.display = 'block';
  }

  // --- Toggle panel with Right Shift ---
  document.addEventListener('keydown', function(e) {
    if (e.code === 'ShiftRight') {
      e.preventDefault();
      panelOpen = !panelOpen;
      panel.style.display = panelOpen ? 'block' : 'none';
      if (panelOpen) populateGrid();
      console.log('%c[CHEAT] Panel ' + (panelOpen ? 'OPENED' : 'CLOSED'), 'color:#FFD700');
    }
  });

  // --- Refresh multipliers when rows/risk change ---
  if (window.MutationObserver) {
    var refreshTimer = null;
    var obs = new MutationObserver(function() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function() {
        if (panelOpen) populateGrid();
      }, 500);
    });
    setTimeout(function() {
      var target = document.querySelector('[class*="buckets-container"]') || document.getElementById('__next') || document.body;
      obs.observe(target, { childList: true, subtree: true, attributes: true });
    }, 2000);
  }

  // Append panel to body once ready
  function attachPanel() {
    if (document.body) {
      document.body.appendChild(panel);
      console.log('%c[CHEAT] Plinko cheat panel ready — press Right Shift to open', 'color:#FFD700;font-weight:bold');
    } else {
      setTimeout(attachPanel, 100);
    }
  }
  attachPanel();
})();
</script>`;
  html = html.replace('</head>', function() { return cheatPanel + '</head>'; });

  // -- Cache-bust JS chunk URLs to prevent stale browser cache --
  var cacheBuster = '?v=' + Date.now();
  html = html.replace(/(src|href)="(\/_next\/static\/[^"]+\.js)"/g, function(m, attr, url) {
    return attr + '="' + url + cacheBuster + '"';
  });

  // -- Unregister service workers to prevent chunk caching --
  var swKill = '<script>if(navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(w){w.unregister()})});<\/script>';
  html = html.replace('</head>', swKill + '</head>');

  // Add preload hints for JS chunks
  html = injectPreloadHints(html);

  return html;
}

// ============================================================
// JSON BODY PARSER HELPER
// ============================================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch(e) { reject(e); } });
  });
}

// 1px transparent PNG (fallback for missing images)
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=', 'base64');

// ============================================================
// HTTP SERVER
// ============================================================
async function handleRequest(req, res) {
  _currentOrigin = getOrigin(req);
  const url = new URL(req.url, _currentOrigin);
  let pathname = decodeURIComponent(url.pathname);

  // Normalize: strip /casino/originals prefix so /casino/originals/v1/... Ã¢â€ â€™ /v1/...
  pathname = pathname.replace(/^\/casino\/originals/, '');

  // --- Cookie-based persistence (survives Vercel cold starts) ---
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
          // deck was serialized as flat string "2hAcKs..." to save cookie space — restore to array
          if (typeof _parsed.deck === 'string') {
            _parsed.deck = _parsed.deck.match(/.{2}/g) || [];
          }
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
        // Pack deck as flat string ("2hAcKs...") to stay well under 4KB cookie limit
        const _sesClone = Object.assign({}, bjActiveSession);
        _sesClone.deck = Array.isArray(_sesClone.deck) ? _sesClone.deck.join('') : '';
        const _sesJson = encodeURIComponent(JSON.stringify(_sesClone));
        _cookies.push('rb_session=' + _sesJson + '; Path=/; Max-Age=86400; SameSite=Lax');
      } catch(e) {}
    } else {
      // Clear session cookie when game is over
      _cookies.push('rb_session=; Path=/; Max-Age=0; SameSite=Lax');
    }
    _h['Set-Cookie'] = _cookies;
    return _origWriteHead(statusCode, _h);
  };
  // -- end cookie persistence --

  // Auto-save state after any POST request (balance may have changed)
  if (req.method === 'POST') {
    res.on('finish', saveState);
  }

  // Log requests (skip noisy ones)
  if (!pathname.includes('.map') && !pathname.includes('favicon') && !pathname.includes('/cdn/'))
    log(`${req.method} ${pathname}`);

  // â”€â”€ AstroPay success redirect page â”€â”€
  if (pathname === '/astropay-success') {
    const amt = url.searchParams.get('amount') || '0';
    const referer = req.headers.referer || _currentOrigin + '/casino';
    // Parse referer to get the game page path (strip query params)
    const backUrl = referer.split('?')[0].replace(/https?:\/\/[^/]+/, '');
    const finalUrl = backUrl || '/casino';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Deposit Successful</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0D0F1A;color:#E8E5FF;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}
.card{background:#1A1D2E;border:1px solid rgba(124,131,177,0.2);border-radius:12px;padding:40px 50px;text-align:center;max-width:420px}
.check{width:64px;height:64px;margin:0 auto 20px;background:rgba(133,240,116,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center}
.check svg{width:32px;height:32px}
h1{font-size:24px;margin-bottom:8px}p{color:#7C83B1;margin-bottom:20px;font-size:15px}
.amount{font-size:32px;font-weight:700;color:#85F074;margin-bottom:24px}
a{display:inline-block;background:linear-gradient(135deg,#5B6EF5,#7B4FD4);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;transition:opacity 0.2s}a:hover{opacity:0.85}
</style></head><body>
<div class="card">
<div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="#85F074" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
<h1>Deposit Successful</h1>
<p>Your AstroPay deposit has been processed</p>
<div class="amount">+$${amt}</div>
<a href="${finalUrl}">Return to Game</a>
</div>
<script>setTimeout(function(){window.location.href='${finalUrl}'},5000)</script>
</body></html>`);
    return;
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ API Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  // Plinko cheat: set/clear target bucket
  if (pathname === '/api/plinko/set-target' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (body.target === null || body.target === undefined || body.target === -1) {
        _plinkoTargetBucket = null;
        log('CHEAT: Target cleared');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, target: null }));
      } else {
        _plinkoTargetBucket = parseInt(body.target);
        log(`CHEAT: Target set to bucket ${_plinkoTargetBucket}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, target: _plinkoTargetBucket }));
      }
    } catch(e) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }
  if (pathname === '/api/plinko/get-target') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ target: _plinkoTargetBucket }));
    return;
  }

  // Plinko drop-ball
  if ((pathname === '/api/plinko/drop-ball' || pathname === '/api/v1/original-games/plinko/drop-ball') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = handleDropBall(body, false);
      if (result.error) {
        res.writeHead(result.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      } else {
        // Game expects response.data.result â€” axios unwraps to response.data
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: result.result }));
      }
    } catch(e) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // Plinko free-drop-ball
  if ((pathname === '/api/plinko/free-drop-ball' || pathname === '/api/v1/original-games/plinko/free-drop-ball') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = handleDropBall(body, true);
      if (result.error) {
        res.writeHead(result.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: result.result }));
      }
    } catch(e) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // Plinko active-session (no active sessions in plinko)
  if (pathname === '/api/v1/original-games/plinko/active-session') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: { error: 'er_no_active_session' } }));
    return;
  }

  // Plinko freeplays
  if (pathname === '/api/v1/original-games/plinko/freeplays') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ game: null, freeplays: [] }));
    return;
  }

  // (v1/auth/me is handled below with full user profile + wallet data)


  // Ping
  if (pathname === '/api/ping' || pathname === '/ping') {
    if (req.method === 'HEAD') {
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ pong: true }));
    }
    return;
  }

  // â”€â”€ Chicken Cross: active-session â”€â”€
  if (pathname === '/api/v1/original-games/chicken-cross/active-session') {
    if (ccActiveSession && !ccActiveSession.gameOver) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(ccMakeGameResponse(ccActiveSession)));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'no_active_session' }));
    }
    return;
  }

  // â”€â”€ Chicken Cross: play (start new game) â”€â”€
  if (pathname === '/api/v1/original-games/chicken-cross/play' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (ccActiveSession && !ccActiveSession.gameOver) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'er_active_game' }));
        return;
      }
      const betAmount = parseFloat(body.bet_amount) || 1;
      const difficulty = body.difficulty || 'easy';
      const currency = body.currency || 'USD';
      if (betAmount > playerBalance) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'er_insufficient_balance' }));
        return;
      }
      if (!CC_DIFFICULTY[difficulty]) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'er_invalid_difficulty' }));
        return;
      }
      playerBalance = parseFloat((playerBalance - betAmount).toFixed(2));
      totalBets++;
      totalWagered = parseFloat((totalWagered + betAmount).toFixed(2));
      log('CC BET: -' + betAmount.toFixed(2) + ' ' + difficulty + ' | Balance: ' + playerBalance.toFixed(2));
      ccActiveSession = {
        id: crypto.randomUUID(),
        betAmount: betAmount, balanceType: body.balance_type || 'primary',
        currency: currency, difficulty: difficulty, round: 0,
        currentMultiplier: 0, payout: '0', gameOver: false, results: [],
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(ccMakeGameResponse(ccActiveSession)));
    } catch(e) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // â”€â”€ Chicken Cross: autoplay â”€â”€
  if (pathname === '/api/v1/original-games/chicken-cross/autoplay' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (ccActiveSession && !ccActiveSession.gameOver) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'er_active_game' }));
        return;
      }
      const betAmount = parseFloat(body.bet_amount) || 1;
      const difficulty = body.difficulty || 'easy';
      const currency = body.currency || 'USD';
      const maxRounds = (body.lane_index || 0) + 1;
      if (betAmount > playerBalance) { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'er_insufficient_balance'})); return; }
      if (!CC_DIFFICULTY[difficulty]) { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'er_invalid_difficulty'})); return; }
      playerBalance = parseFloat((playerBalance - betAmount).toFixed(2));
      totalBets++;
      totalWagered = parseFloat((totalWagered + betAmount).toFixed(2));
      const diff = CC_DIFFICULTY[difficulty];
      const session = { id: crypto.randomUUID(), betAmount, currency, difficulty, round: 0, currentMultiplier: 0, payout: '0', gameOver: false, results: [] };
      for (let r = 1; r <= maxRounds && r <= diff.maxRounds; r++) {
        const mult = ccCalcMultiplier(r, diff.factor);
        const winPct = ccCalcWinPercentage(r, diff.factor);
        const threshold = parseFloat(winPct);
        const roll = Math.random() * 100;
        const didLose = roll >= threshold;
        const actionId = crypto.randomUUID();
        if (didLose) {
          session.round = r; session.currentMultiplier = 0; session.gameOver = true;
          session.results.push({ win_percentage: winPct, multiplier: 0, can_cashout: false, game_action_id: actionId });
          break;
        } else {
          session.round = r; session.currentMultiplier = mult;
          session.results.push({ win_percentage: winPct, multiplier: mult, can_cashout: true, game_action_id: actionId });
        }
      }
      if (!session.gameOver) {
        session.gameOver = true;
        const payout = parseFloat((betAmount * session.currentMultiplier).toFixed(2));
        session.payout = payout.toFixed(2);
        playerBalance = parseFloat((playerBalance + payout).toFixed(2));
        totalProfit = parseFloat((totalProfit + payout - betAmount).toFixed(2));
        log('CC AUTOPLAY WIN: ' + betAmount.toFixed(2) + ' -> ' + session.payout + ' (' + session.currentMultiplier + 'x) | Balance: ' + playerBalance.toFixed(2));
      } else {
        totalProfit = parseFloat((totalProfit - betAmount).toFixed(2));
        log('CC AUTOPLAY LOSS: ' + betAmount.toFixed(2) + ' round ' + session.round + ' | Balance: ' + playerBalance.toFixed(2));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(ccMakeGameResponse(session)));
    } catch(e) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // â”€â”€ Chicken Cross: action (cross a lane) â”€â”€
  {
    const actionMatch = pathname.match(/^\/api\/v1\/original-games\/chicken-cross\/([a-f0-9-]+)\/action$/);
    if (actionMatch && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!ccActiveSession || ccActiveSession.gameOver || ccActiveSession.id !== actionMatch[1]) {
          res.writeHead(200, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: 'er_no_active_session' }));
          return;
        }
        const diff = CC_DIFFICULTY[ccActiveSession.difficulty];
        const nextRound = ccActiveSession.round + 1;
        if (nextRound > diff.maxRounds) {
          res.writeHead(200, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: 'er_max_rounds' }));
          return;
        }
        const mult = ccCalcMultiplier(nextRound, diff.factor);
        const winPct = ccCalcWinPercentage(nextRound, diff.factor);
        const threshold = parseFloat(winPct);
        const roll = Math.random() * 100;
        const didLose = roll >= threshold;
        const actionId = crypto.randomUUID();
        if (didLose) {
          ccActiveSession.round = nextRound;
          ccActiveSession.currentMultiplier = 0;
          ccActiveSession.gameOver = true;
          ccActiveSession.results.push({ win_percentage: winPct, multiplier: 0, can_cashout: false, game_action_id: actionId });
          totalProfit = parseFloat((totalProfit - ccActiveSession.betAmount).toFixed(2));
          log('CC LOSS: Round ' + nextRound + ' | ' + ccActiveSession.betAmount.toFixed(2) + ' lost | Balance: ' + playerBalance.toFixed(2));
        } else {
          ccActiveSession.round = nextRound;
          ccActiveSession.currentMultiplier = mult;
          ccActiveSession.results.push({ win_percentage: winPct, multiplier: mult, can_cashout: true, game_action_id: actionId });
          log('CC WIN: Round ' + nextRound + ' | ' + mult + 'x | Potential: ' + (ccActiveSession.betAmount * mult).toFixed(2));
        }
        const resp = ccMakeGameResponse(ccActiveSession);
        if (ccActiveSession.gameOver) ccActiveSession = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
      } catch(e) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
      return;
    }
  }

  // â”€â”€ Chicken Cross: cashout â”€â”€
  {
    const cashoutMatch = pathname.match(/^\/api\/v1\/original-games\/chicken-cross\/([a-f0-9-]+)\/cashout$/);
    if (cashoutMatch && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!ccActiveSession || ccActiveSession.gameOver || ccActiveSession.id !== cashoutMatch[1]) {
          res.writeHead(200, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: 'er_no_active_session' }));
          return;
        }
        if (ccActiveSession.round === 0) {
          res.writeHead(200, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: 'er_cannot_cashout' }));
          return;
        }
        const payout = parseFloat((ccActiveSession.betAmount * ccActiveSession.currentMultiplier).toFixed(2));
        ccActiveSession.payout = payout.toFixed(2);
        ccActiveSession.gameOver = true;
        playerBalance = parseFloat((playerBalance + payout).toFixed(2));
        totalProfit = parseFloat((totalProfit + payout - ccActiveSession.betAmount).toFixed(2));
        log('CC CASHOUT: ' + ccActiveSession.betAmount.toFixed(2) + ' -> ' + ccActiveSession.payout + ' (' + ccActiveSession.currentMultiplier + 'x) | Balance: ' + playerBalance.toFixed(2));
        const resp = ccMakeGameResponse(ccActiveSession);
        ccActiveSession = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
      } catch(e) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
      return;
    }
  }


  // (v1/crypto is handled below with full currency list)

  // â”€â”€ Blackjack: active-session â”€â”€
  if (pathname === '/api/v1/original-games/blackjack/active-session') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (bjActiveSession) {
      res.end(JSON.stringify({ gameState: bjMakeGameState(bjActiveSession), wallet: { active: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance, currency: 'USD' } } }));
    } else {
      res.end(JSON.stringify({}));
    }
    return;
  }

  // â”€â”€ Blackjack: play (start new game) â”€â”€
  if (pathname === '/api/v1/original-games/blackjack/play' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const betAmount = parseFloat(body.bet_amount || '10');
      if (isNaN(betAmount) || betAmount <= 0) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: 'Invalid bet amount' }));
        return;
      }
      if (betAmount > playerBalance) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: 'Insufficient balance' }));
        return;
      }
      if (bjActiveSession) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: 'er_active_game_exists' }));
        return;
      }
      const session = bjStartGame(betAmount, body.currency || 'USD');
      log(`BJ DEAL: bet=${betAmount} status=${session.status} balance=${playerBalance.toFixed(2)}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ gameState: bjMakeGameState(session), wallet: { active: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance, currency: 'USD' } } }));
    } catch(e) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // â”€â”€ Blackjack: freeplay â”€â”€
  if (pathname === '/api/v1/original-games/blackjack/freeplay' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (bjActiveSession) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: 'er_active_game_exists' }));
        return;
      }
      const session = bjStartGame(10, 'USD');
      session.isFreeplay = true;
      // Don't deduct from balance for freeplays â€” re-add the amount
      playerBalance = Math.round((playerBalance + 10) * 100) / 100;
      log(`BJ FREEPLAY: status=${session.status} balance=${playerBalance.toFixed(2)}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const state = bjMakeGameState(session);
      state.is_freeplay = true;
      res.end(JSON.stringify({ gameState: state, wallet: { active: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance, currency: 'USD' } } }));
    } catch(e) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // â”€â”€ Blackjack: action (hit/stand/double/split/insurance) â”€â”€
  {
    const bjActionMatch = pathname.match(/^\/api\/v1\/original-games\/blackjack\/([a-f0-9-]+)\/([a-f0-9-]+)\/action$/);
    if (bjActionMatch && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!bjActiveSession || bjActiveSession.gameHistoryId !== bjActionMatch[1]) {
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: 'er_no_active_game' }));
          return;
        }
        const actionObj = body.action_name || {};
        const actionName = Object.keys(actionObj)[0] || 'unknown';
        const sessionRef = bjActiveSession; // keep reference before it might get nulled
        bjDoAction(sessionRef, actionObj);
        log(`BJ ACTION: ${actionName} status=${sessionRef.status} balance=${playerBalance.toFixed(2)}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ gameState: bjMakeGameState(sessionRef), wallet: { active: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance, currency: 'USD' } } }));
      } catch(e) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
      return;
    }
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MINES API ENDPOINTS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // Mines: active session check
  if ((pathname === '/v1/games/mines/active-session' || pathname === '/api/v1/original-games/mines-game/active-session') && req.method === 'GET') {
    if (minesActiveSession && !minesActiveSession.gameOver) {
      var visBoard = minesGetVisibleBoard(minesActiveSession);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        isPreviousGame: true,
        board: visBoard,
        mines: minesActiveSession.mines,
        tiles: minesActiveSession.tiles,
        revealedCellsCount: minesActiveSession.revealedCellsCount,
        betAmount: minesActiveSession.betAmount,
        currency: minesActiveSession.currency
      }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'er_no_active_game' }));
    }
    return;
  }

  // Mines: new game (manual play)
  if (pathname === '/v1/games/mines/new-game' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const betAmount = parseFloat(body.betAmount || body.bet_amount || '0.10');
      const mineCount = parseInt(body.mines || body.mine_count || '5', 10);
      const totalTiles = parseInt(body.tiles || '25', 10);
      const currency = body.currency || 'USD';

      if (isNaN(betAmount) || betAmount <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid bet amount' }));
        return;
      }
      if (betAmount > playerBalance) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Insufficient balance' }));
        return;
      }
      // If there's already an active game, return it
      if (minesActiveSession && !minesActiveSession.gameOver) {
        var visBoard = minesGetVisibleBoard(minesActiveSession);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          isPreviousGame: true,
          board: visBoard,
          mines: minesActiveSession.mines,
          tiles: minesActiveSession.tiles,
          revealedCellsCount: minesActiveSession.revealedCellsCount,
          betAmount: minesActiveSession.betAmount,
          currency: minesActiveSession.currency
        }));
        return;
      }
      if (![25, 36, 49, 64].includes(totalTiles)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid grid size' }));
        return;
      }
      if (mineCount < 1 || mineCount >= totalTiles) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid mine count' }));
        return;
      }

      var session = minesStartGame(betAmount, mineCount, totalTiles, currency);
      var visBoard = minesGetVisibleBoard(session);
      log('[MINES] NEW GAME: bet=' + betAmount + ' mines=' + mineCount + ' tiles=' + totalTiles + ' balance=' + playerBalance.toFixed(2));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        board: visBoard,
        tiles: totalTiles,
        mines: mineCount
      }));
    } catch(e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Mines: auto-bet game
  if (pathname === '/v1/games/mines/new-game-auto' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const betAmount = parseFloat(body.betAmount || body.bet_amount || '0.10');
      const mineCount = parseInt(body.mines || body.mine_count || '5', 10);
      const totalTiles = parseInt(body.tiles || '25', 10);
      const currency = body.currency || 'USD';
      const selectedTiles = body.selectedTiles || [];

      if (isNaN(betAmount) || betAmount <= 0 || betAmount > playerBalance) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: betAmount > playerBalance ? 'Insufficient balance' : 'Invalid bet amount' }));
        return;
      }
      if (minesActiveSession && !minesActiveSession.gameOver) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'er_active_game_exists' }));
        return;
      }

      var session = minesStartGame(betAmount, mineCount, totalTiles, currency);

      // Reveal all selected tiles
      var hitMine = false;
      for (var i = 0; i < selectedTiles.length; i++) {
        var idx = parseInt(selectedTiles[i], 10);
        if (session.minePositions.has(idx)) {
          hitMine = true;
          session.revealed.add(idx);
          session.revealedCellsCount++;
          break;
        }
        session.revealed.add(idx);
        session.revealedCellsCount++;
      }

      if (hitMine) {
        session.gameOver = true;
        session.payout = 0;
        minesActiveSession = null;
        totalProfit = Math.round((totalProfit - betAmount) * 100) / 100;
        for (var j = betHistory.length - 1; j >= 0; j--) {
          if (betHistory[j].id === session.id) { betHistory[j].result = 'loss'; break; }
        }
        log('[MINES] AUTO-BET LOSS: bet=' + betAmount + ' balance=' + playerBalance.toFixed(2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ board: minesGetFullBoard(session), multiplier: 0, payout: 0, error: null }));
      } else {
        // All safe - auto cash out
        session.multiplier = minesCalcMultiplier(session.revealedCellsCount, mineCount, totalTiles);
        session.payout = Math.round(betAmount * session.multiplier * 100) / 100;
        session.gameOver = true;
        session.cashedOut = true;
        playerBalance = Math.round((playerBalance + session.payout) * 100) / 100;
        minesActiveSession = null;
        var profit = session.payout - betAmount;
        totalProfit = Math.round((totalProfit + profit) * 100) / 100;
        for (var j = betHistory.length - 1; j >= 0; j--) {
          if (betHistory[j].id === session.id) { betHistory[j].result = 'win'; betHistory[j].multiplier = session.multiplier; betHistory[j].payout = session.payout; break; }
        }
        transactionHistory.push({ type: 'win', game: 'mines', amount: session.payout, balance: playerBalance, timestamp: new Date().toISOString() });
        log('[MINES] AUTO-BET WIN: bet=' + betAmount + ' mult=' + session.multiplier + ' payout=' + session.payout + ' balance=' + playerBalance.toFixed(2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ board: minesGetFullBoard(session), multiplier: session.multiplier, payout: session.payout, error: null }));
      }
    } catch(e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Mines: reveal tile
  if (pathname === '/v1/games/mines/reveal' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const index = parseInt(body.index, 10);

      if (!minesActiveSession || minesActiveSession.gameOver) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'er_no_active_game' }));
        return;
      }

      var result = minesRevealTile(minesActiveSession, index);
      if (!result.success && result.error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: result.error }));
        return;
      }

      log('[MINES] REVEAL: index=' + index + ' cell=' + result.cell + ' mult=' + result.multiplier + ' revealed=' + result.revealedCellsCount + (result.cell === 'M' ? ' BOOM!' : '') + ' balance=' + playerBalance.toFixed(2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch(e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Mines: cashout
  if (pathname === '/v1/games/mines/cashout' && req.method === 'GET') {
    if (!minesActiveSession || minesActiveSession.gameOver) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'er_no_active_game' }));
      return;
    }

    var result = minesCashout(minesActiveSession);
    log('[MINES] CASHOUT: mult=' + result.multiplier + ' payout=' + result.payout + ' balance=' + playerBalance.toFixed(2));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // Client error reporting
  if (pathname === '/api/client-errors' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.errors) body.errors.forEach(e => log(`[CLIENT-ERROR] ${e}`));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Balance endpoints (game calls these via SWR after each bet) Ã¢â€â‚¬Ã¢â€â‚¬
  // /v1/user/balance/primary/USD Ã¢â€ â€™ { amount: N }
  if (pathname.match(/^\/(?:api\/)?v1\/user\/balance\/(primary|promotional|vault)\/\w+$/)) {
    const type = pathname.match(/(primary|promotional|vault)/)[1];
    const amount = type === 'primary' ? playerBalance : type === 'vault' ? vaultBalance : promotionalBalance;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ amount }));
    return;
  }

  // /v1/user/wallet Ã¢â€ â€™ full wallet shape
  if (pathname === '/v1/user/wallet' || pathname === '/api/v1/user/wallet') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      active: {
        primary: playerBalance,
        promotional: promotionalBalance,
        vault: vaultBalance,
        currency: 'USD'
      }
    }));
    return;
  }

  // Local convenience endpoints
  if (pathname === '/api/balance') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ amount: playerBalance, balance: playerBalance, currency: 'USD' }));
    return;
  }

  if (pathname === '/api/bet-history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ bets: betHistory }));
    return;
  }

  if (pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ totalBets, totalWagered: +totalWagered.toFixed(2), totalProfit: +totalProfit.toFixed(2), balance: +playerBalance.toFixed(2), recentBets: betHistory.slice(0, 20) }));
    return;
  }

  if (pathname === '/api/set-balance' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (body.balance !== undefined) playerBalance = parseFloat(body.balance) || 10000;
      if (body.vault !== undefined) vaultBalance = parseFloat(body.vault) || 0;
      if (body.promotional !== undefined) promotionalBalance = parseFloat(body.promotional) || 0;
      invalidatePageCaches();
      saveState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ amount: playerBalance, balance: playerBalance, vault: vaultBalance, promotional: promotionalBalance }));
    } catch(e) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // Sync balance with client localStorage (for Vercel where fs is read-only)
  if (pathname === '/api/sync-balance' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const clientBalance = parseFloat(body.balance);
      // If server is at default (10000) and client has a saved balance, use client's
      if (!isNaN(clientBalance) && clientBalance > 0 && Math.abs(playerBalance - 10000) < 0.01) {
        playerBalance = clientBalance;
        log('[SYNC] Restored balance from client: $' + playerBalance.toFixed(2));
        invalidatePageCaches();
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ balance: playerBalance, vault: vaultBalance, promotional: promotionalBalance }));
    } catch(e) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // Crypto/currencies endpoint (must return array for .reduce())
  if (pathname === '/v1/crypto' || pathname === '/api/v1/crypto') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { code: 'BTC', name: 'Bitcoin', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/btc.svg', networks: [{network:'BTC',deposit:1,withdrawal:1},{network:'Lightning',deposit:1,withdrawal:0}] },
      { code: 'ETH', name: 'Ethereum', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/eth.svg', networks: [{network:'ERC20',deposit:1,withdrawal:1}] },
      { code: 'USDT', name: 'Tether', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/usdt.svg', networks: [{network:'ERC20',deposit:1,withdrawal:1},{network:'TRC20',deposit:1,withdrawal:1},{network:'SOL',deposit:1,withdrawal:1}] },
      { code: 'USDC', name: 'USD Coin', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/usdc.svg', networks: [{network:'ERC20',deposit:1,withdrawal:1},{network:'SOL',deposit:1,withdrawal:1}] },
      { code: 'SOL', name: 'Solana', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/sol.svg', networks: [{network:'SOL',deposit:1,withdrawal:1}] },
      { code: 'LTC', name: 'Litecoin', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/ltc.svg', networks: [{network:'LTC',deposit:1,withdrawal:1}] },
      { code: 'DOGE', name: 'Dogecoin', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/doge.svg', networks: [{network:'DOGE',deposit:1,withdrawal:1}] },
      { code: 'XRP', name: 'Ripple', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/xrp.svg', networks: [{network:'XRP',deposit:1,withdrawal:1}] },
      { code: 'TRX', name: 'Tron', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/trx.svg', networks: [{network:'TRC20',deposit:1,withdrawal:1}] },
      { code: 'BNB', name: 'BNB', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/bnb.svg', networks: [{network:'BSC',deposit:1,withdrawal:1}] },
      { code: 'ADA', name: 'Cardano', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/ada.svg', networks: [{network:'ADA',deposit:1,withdrawal:1}] },
      { code: 'MATIC', name: 'Polygon', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/matic.svg', networks: [{network:'POLYGON',deposit:1,withdrawal:1}] },
      { code: 'AVAX', name: 'Avalanche', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/avax.svg', networks: [{network:'AVAX',deposit:1,withdrawal:1}] },
      { code: 'DOT', name: 'Polkadot', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/dot.svg', networks: [{network:'DOT',deposit:1,withdrawal:1}] },
      { code: 'SHIB', name: 'Shiba Inu', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/shib.svg', networks: [{network:'ERC20',deposit:1,withdrawal:1}] },
      { code: 'APE', name: 'ApeCoin', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/ape.svg', networks: [{network:'ERC20',deposit:1,withdrawal:1}] },
      { code: 'USD', name: 'US Dollar', symbol: '\$', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/usd.svg', fiat: true },
      { code: 'EUR', name: 'Euro', symbol: '\u20ac', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/eur.svg', fiat: true },
      { code: 'GBP', name: 'British Pound', symbol: '\u00a3', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/gbp.svg', fiat: true },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C\$', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/cad.svg', fiat: true },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R\$', icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/brl.svg', fiat: true }
    ]));
    return;
  }

  // Public currencies (must be object keyed by currency code, NOT array)
  if (pathname === '/v1/public/currencies' || pathname === '/api/v1/public/currencies') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      USD: { rate: 1, display: { isDefault: true, prepend: '$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/usd.svg', decimals: 2, status: 'active' } },
      EUR: { rate: 0.8504, display: { prepend: 'â‚¬', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/eur.svg', decimals: 2, status: 'active' } },
      GBP: { rate: 0.7436, display: { prepend: 'Â£', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/gbp.svg', decimals: 2, status: 'active' } },
      CAD: { rate: 1.3693, display: { prepend: 'C$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/cad.svg', decimals: 2, status: 'active' } },
      AUD: { rate: 1.4174, display: { prepend: 'A$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/aud.svg', decimals: 2, status: 'active' } },
      BRL: { rate: 5.2131, display: { prepend: 'R$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/brl.svg', decimals: 2, status: 'active' } },
      JPY: { rate: 155.572, display: { prepend: 'Â¥', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/jpy.svg', decimals: 0, status: 'active' } },
      CNY: { rate: 6.9088, display: { prepend: 'Â¥', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/cny.svg', decimals: 2, status: 'active' } },
      MXN: { rate: 17.2553, display: { prepend: 'MX$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/mxn.svg', decimals: 2, status: 'active' } },
      CHF: { rate: 0.7754, display: { prepend: 'CHF', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/chf.svg', decimals: 2, status: 'active' } },
      TRY: { rate: 43.8157, display: { prepend: 'â‚º', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/try.svg', decimals: 2, status: 'active' } },
      ARS: { rate: 1390.49, display: { prepend: 'AR$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/ars.svg', decimals: 2, status: 'active' } },
      SEK: { rate: 9.0644, display: { prepend: 'kr', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/sek.svg', decimals: 2, status: 'active' } },
      DKK: { rate: 6.3533, display: { prepend: 'kr.', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/dkk.svg', decimals: 2, status: 'active' } },
      SGD: { rate: 1.2693, display: { prepend: 'S$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/sgd.svg', decimals: 2, status: 'active' } },
      HKD: { rate: 7.8148, display: { prepend: 'HK$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/hkd.svg', decimals: 2, status: 'active' } },
      RUB: { rate: 76.8704, display: { prepend: 'â‚½', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/rub.svg', decimals: 2, status: 'active' } },
      PHP: { rate: 58.1965, display: { prepend: 'â‚±', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/php.svg', decimals: 2, status: 'active' } }
    }));
    return;
  }

  // Public IP
  if (pathname === '/v1/public/ip' || pathname === '/api/v1/public/ip') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip: '127.0.0.1', country: 'US' }));
    return;
  }

  // Public ranks
  if (pathname === '/v1/public/ranks' || pathname === '/api/v1/public/ranks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { name: 'Bronze', level: 1, wagered: 0, icon: '/cdn/rewards/ranks/bronze.svg' },
      { name: 'Silver', level: 2, wagered: 10000, icon: '/cdn/rewards/ranks/silver.svg' },
      { name: 'Gold', level: 3, wagered: 50000, icon: '/cdn/rewards/ranks/gold.svg' },
      { name: 'Platinum', level: 4, wagered: 250000, icon: '/cdn/rewards/ranks/platinum.svg' },
      { name: 'Diamond', level: 5, wagered: 1000000, icon: '/cdn/rewards/ranks/diamond.svg' }
    ]));
    return;
  }

  // User endpoints
  if (pathname === '/v1/user' || pathname === '/api/v1/user') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'local-player-001',
      public_id: 'LOCAL_PLAYER_001',
      username: 'Player',
      email: 'player@localhost',
      email_verified_at: new Date().toISOString(),
      currency: 'USD',
      rank: { name: 'Bronze', level: 1, wagered: totalWagered },
      kyc_level: 2,
      has_2fa: false,
      preferences: { currency: 'USD', hide_balance: false, anonymous: false, theme: 'dark', language: 'en' },
      wallet: { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } },
      balances: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance },
      statistics: { total_bets: totalBets, total_wagered: totalWagered, total_profit: totalProfit },
      created_at: '2024-01-01T00:00:00.000Z'
    }));
    return;
  }

  // User seeds (provably fair)
  if (pathname === '/v1/user/seeds' || pathname === '/api/v1/user/seeds') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      server_seed_hash: serverSeedHash,
      client_seed: clientSeed,
      nonce: nonce,
      previous_server_seed: null,
      previous_server_seed_hash: null,
      previous_client_seed: null
    }));
    return;
  }

  // Rotate seeds
  if ((pathname === '/v1/user/rotate-seeds' || pathname === '/api/v1/user/rotate-seeds') && req.method === 'POST') {
    const body = await parseBody(req);
    const oldServerSeed = serverSeed;
    const newSS = crypto.randomBytes(32).toString('hex');
    const newSSH = crypto.createHash('sha256').update(newSS).digest('hex');
    clientSeed = body.client_seed || crypto.randomBytes(16).toString('hex');
    nonce = 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      server_seed_hash: newSSH,
      client_seed: clientSeed,
      nonce: 0,
      previous_server_seed: oldServerSeed,
      previous_server_seed_hash: serverSeedHash,
      previous_client_seed: clientSeed
    }));
    return;
  }

  // Game seeds verification
  if (pathname.includes('/game-seeds') || pathname.includes('/game-results')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Currency switch
  if (pathname === '/v1/user/currency/switch' || pathname === '/api/v1/user/currency/switch') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, currency: 'USD' }));
    return;
  }

  // â”€â”€ Crypto deposit addresses â”€â”€
  if ((pathname === '/v1/crypto/deposit-addresses' || pathname === '/api/v1/crypto/deposit-addresses') && req.method === 'POST') {
    const body = await parseBody(req);
    const currency = (body.currency || 'BTC').toUpperCase();
    const network = body.network || 'default';
    // Generate a deterministic fake address per currency
    const fakeAddresses = {
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      USDT: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
      USDC: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      LTC: 'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kgmn4n9',
      DOGE: 'D7Y55tRGzFaJjCah9mPcbKGEqvyBkRqHjH',
      XRP: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      TRX: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
      BNB: 'bnb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      ADA: 'addr1qxhgr7c2q0a900fq3r7q0sd3wse4e5d8gcfke6m47h',
      MATIC: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      AVAX: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    };
    const address = fakeAddresses[currency] || '0x' + crypto.randomBytes(20).toString('hex');
    log('CRYPTO DEPOSIT ADDRESS: ' + currency + '/' + network + ' -> ' + address);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      address: address,
      currency: currency,
      network: network,
      minimum_deposit: currency === 'BTC' ? '0.0001' : '1',
      confirmations_required: currency === 'BTC' ? 3 : 12,
      tag: currency === 'XRP' ? '12345678' : null
    }));
    return;
  }

  // â”€â”€ Crypto withdraw â”€â”€
  if ((pathname === '/v1/crypto/withdraw' || pathname === '/api/v1/crypto/withdraw') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    const currency = (body.currency || 'USD').toUpperCase();
    const address = body.address || body.wallet_address || '0x0000';
    const network = body.network || 'default';
    if (amount <= 0 || amount > playerBalance) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: amount > playerBalance ? 'Insufficient balance' : 'Invalid amount' }));
      return;
    }
    playerBalance = parseFloat((playerBalance - amount).toFixed(2));
    totalWithdrawn = parseFloat((totalWithdrawn + amount).toFixed(2));
    const txId = crypto.randomUUID();
    transactionHistory.unshift({ id: txId, type: 'crypto_withdraw', amount, currency, network, address, status: 'completed', timestamp: new Date().toISOString() });
    log('CRYPTO WITHDRAW: -$' + amount + ' to ' + address + ' (' + currency + '/' + network + ') balance: $' + playerBalance);
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, transaction_id: txId, amount, currency, network, address, balance: playerBalance, status: 'completed' }));
    return;
  }

  // â”€â”€ Currency swap â”€â”€
  if ((pathname === '/v1/swap' || pathname === '/api/v1/swap' || pathname === '/v1/user/currency/swap' || pathname === '/api/v1/user/currency/swap') && req.method === 'POST') {
    const body = await parseBody(req);
    const from = (body.from || body.from_currency || 'BTC').toUpperCase();
    const to = (body.to || body.to_currency || 'USD').toUpperCase();
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid amount' }));
      return;
    }
    // Simulate swap: amount stays same (since we're USD-based)
    const txId = crypto.randomUUID();
    transactionHistory.unshift({ id: txId, type: 'swap', from, to, amount, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log('SWAP: ' + amount + ' ' + from + ' -> ' + to + ' (balance unchanged: $' + playerBalance + ')');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, transaction_id: txId, from, to, amount, received: amount, rate: 1, balance: playerBalance }));
    return;
  }

  // â”€â”€ Mesh (third-party wallet connect) â”€â”€
  if (pathname === '/v1/mesh/access' || pathname === '/api/v1/mesh/access') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ catalogLink: null, integrationId: null }));
    return;
  }
  if (pathname === '/v1/mesh/connection' || pathname === '/api/v1/mesh/connection') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connections: [] }));
    return;
  }
  if (pathname === '/v1/mesh/deposit-link' || pathname === '/api/v1/mesh/deposit-link') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ link: null }));
    return;
  }
  if (pathname === '/v1/mesh/tokens' || pathname === '/api/v1/mesh/tokens') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tokens: [] }));
    return;
  }

  // â”€â”€ Catalog / transfers (Mesh broker connect) â”€â”€
  if (pathname.startsWith('/api/v1/catalog/')) {
    const body = req.method === 'POST' ? await parseBody(req) : {};
    if (pathname.includes('/transfers/quote')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ quotes: [], fee: '0', rate: '1' }));
      return;
    }
    if (pathname.includes('/transfers/preview')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ preview: { amount: body.amount || 0, fee: 0, total: body.amount || 0, currency: 'USD' } }));
      return;
    }
    if (pathname.includes('/transfers/execute') || pathname.includes('/transfers/bridgeandexecute') || pathname.includes('/transfers/swapandexecute')) {
      const amount = parseFloat(body.amount) || 100;
      playerBalance = parseFloat((playerBalance + amount).toFixed(2));
      totalDeposited = parseFloat((totalDeposited + amount).toFixed(2));
      transactionHistory.unshift({ id: crypto.randomUUID(), type: 'deposit', amount, currency: 'USD', method: 'catalog_transfer', status: 'completed', timestamp: new Date().toISOString() });
      invalidatePageCaches();
      log('CATALOG DEPOSIT: +$' + amount + ' (balance: $' + playerBalance + ')');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, status: 'completed', balance: playerBalance }));
      return;
    }
    if (pathname.includes('/transfers/tradingPairs')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ pairs: [] }));
      return;
    }
    if (pathname.includes('/transfers/networkPriority') || pathname.includes('/transfers/getBestNetworkForCrypto')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ network: 'ERC20', priority: ['ERC20', 'TRC20', 'SOL'] }));
      return;
    }
    if (pathname.includes('/transfers/countryToFiat')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ currency: 'USD', country: 'US' }));
      return;
    }
    if (pathname.includes('/transfers/configure') || pathname.includes('/transfers/register') || pathname.includes('/transfers/preregister') || pathname.includes('/transfers/update') || pathname.includes('/transfers/checkConnect') || pathname.includes('/transfers/updateConnect')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    if (pathname.includes('/authenticate')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token: 'mock-catalog-token-' + Date.now() }));
      return;
    }
    if (pathname.includes('/pay')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, status: 'completed' }));
      return;
    }
    if (pathname.includes('/cryptocurrencyFunding')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ options: [], success: true }));
      return;
    }
    // Catch-all catalog
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // â”€â”€ Payment methods (AstroPay) â”€â”€
  if ((pathname === '/v1/payment-methods' || pathname === '/api/v1/payment-methods') && (req.method === 'GET' || req.method === 'POST')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      payment_methods: [
        {
          name: 'astropay',
          deposit: 'enabled',
          withdrawal: 'enabled',
          currencies: ['USD', 'BRL', 'CAD', 'EUR', 'ARS', 'CLP', 'COP', 'MXN', 'UYU'],
          countries: ['CA', 'AR', 'CL', 'CO', 'EC', 'MX', 'UY', 'CM', 'CI', 'GH', 'KE', 'NG', 'TZ', 'BR']
        }
      ],
      recommended: {
        deposit: ['astropay'],
        withdrawal: ['astropay']
      }
    }));
    return;
  }

  // â”€â”€ AstroPay deposit â”€â”€
  if ((pathname === '/v1/astropay/deposit' || pathname === '/api/v1/astropay/deposit') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'er_invalid_amount' }));
      return;
    }
    // Credit balance immediately (local mode â€” no real AstroPay redirect)
    playerBalance = parseFloat((playerBalance + amount).toFixed(2));
    totalDeposited = parseFloat((totalDeposited + amount).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'astropay_deposit', amount, currency: body.currency || 'USD', status: 'completed', timestamp: new Date().toISOString() });
    invalidatePageCaches();
    log('ASTROPAY DEPOSIT: +$' + amount + ' (balance: $' + playerBalance + ')');
    // Return a local redirect URL that the React code will window.location.href to
    const successUrl = _currentOrigin + '/astropay-success?amount=' + amount;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url: successUrl }));
    return;
  }

  // â”€â”€ AstroPay withdrawal â”€â”€
  if ((pathname === '/v1/astropay/withdrawal' || pathname === '/api/v1/astropay/withdrawal') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0 || amount > playerBalance) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: amount > playerBalance ? 'Insufficient balance' : 'Invalid amount' }));
      return;
    }
    playerBalance = parseFloat((playerBalance - amount).toFixed(2));
    totalWithdrawn = parseFloat((totalWithdrawn + amount).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'astropay_withdraw', amount, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log('ASTROPAY WITHDRAW: -$' + amount + ' (balance: $' + playerBalance + ')');
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, balance: playerBalance }));
    return;
  }

  // â”€â”€ User settings â”€â”€
  if (pathname === '/v1/user/settings' || pathname === '/api/v1/user/settings') {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      currency: 'USD',
      theme: 'dark',
      language: 'en',
      notifications: { email: true, push: true, marketing: false },
      privacy: { hide_stats: false, hide_bets: false, anonymous: false },
      sound: true,
      animations: true,
      self_excluded: false,
      two_factor_enabled: false
    }));
    return;
  }

  // â”€â”€ User recent games â”€â”€
  if (pathname === '/v1/user/recent-games' || pathname === '/api/v1/user/recent-games') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { slug: 'plinko', name: 'Plinko', type: 'originals', icon: '/cdn/games/plinko.svg', last_played: new Date().toISOString() },
      { slug: 'chicken-cross', name: 'Chicken Cross', type: 'originals', icon: '/cdn/games/chicken-cross.svg', last_played: new Date(Date.now()-86400000).toISOString() },
      { slug: 'blackjack', name: 'Blackjack', type: 'originals', icon: '/cdn/games/blackjack.svg', last_played: new Date(Date.now()-172800000).toISOString() },
      { slug: 'mines-game', name: 'Mines', type: 'originals', icon: '/cdn/games/mines.svg', last_played: new Date(Date.now()-259200000).toISOString() }
    ]));
    return;
  }

  // â”€â”€ User transaction history (paginated) â”€â”€
  if (pathname === '/v1/user/transaction-history' || pathname === '/v1/user/transaction-history/' || pathname === '/api/v1/user/transaction-history' || pathname === '/api/v1/user/transaction-history/') {
    const qType = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page') || url.searchParams.get('limit')) || 20;
    let filtered = transactionHistory;
    if (qType) filtered = transactionHistory.filter(t => t.type === qType || t.type.includes(qType));
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: items, total: filtered.length, page, per_page: perPage, last_page: Math.ceil(filtered.length / perPage) }));
    return;
  }

  // â”€â”€ User bet history (paginated) â”€â”€
  if (pathname === '/v1/user/bet-history' || pathname.startsWith('/v1/user/bet-history/') || pathname === '/api/v1/user/bet-history' || pathname.startsWith('/api/v1/user/bet-history/')) {
    if (pathname.includes('/casino/games')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(['plinko', 'chicken-cross', 'blackjack', 'mines']));
      return;
    }
    if (pathname.includes('/sportsbook/sports')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page') || url.searchParams.get('limit')) || 20;
    const gameFilter = url.searchParams.get('game');
    let filtered = betHistory;
    if (gameFilter) filtered = betHistory.filter(b => (b.game || '').toLowerCase().includes(gameFilter.toLowerCase()));
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage).map(b => ({
      id: b.id,
      game: b.game || 'plinko',
      game_name: (b.game || 'plinko').charAt(0).toUpperCase() + (b.game || 'plinko').slice(1),
      bet_amount: b.amount,
      currency: 'USD',
      payout: b.payout || 0,
      multiplier: b.multiplier || 0,
      profit: (b.payout || 0) - b.amount,
      status: b.payout > 0 ? 'win' : 'loss',
      created_at: b.timestamp || new Date().toISOString()
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: items, total: filtered.length, page, per_page: perPage, last_page: Math.ceil(filtered.length / perPage) }));
    return;
  }

  // â”€â”€ Raffles â”€â”€
  if (pathname === '/v1/raffles/active' || pathname === '/api/v1/raffles/active') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }
  if (pathname === '/v1/raffles/my-tickets' || pathname === '/v1/raffles/my-tickets/' || pathname === '/api/v1/raffles/my-tickets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], total: 0 }));
    return;
  }
  if (pathname === '/v1/raffles/my-winner-tickets' || pathname === '/api/v1/raffles/my-winner-tickets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], total: 0 }));
    return;
  }
  if (pathname.startsWith('/v1/raffles/winners') || pathname.startsWith('/api/v1/raffles/winners')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], total: 0 }));
    return;
  }
  if ((pathname === '/v1/raffles/free-ticket' || pathname === '/api/v1/raffles/free-ticket') && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, ticket_id: crypto.randomUUID() }));
    return;
  }
  if ((pathname === '/v1/raffles/claim-all-rewards' || pathname === '/api/v1/raffles/claim-all-rewards') && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, claimed: 0, amount: 0 }));
    return;
  }

  // â”€â”€ Public content / translations / languages â”€â”€
  if (pathname === '/v1/public/content' || pathname === '/api/v1/public/content') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ pages: {}, banners: [], announcements: [] }));
    return;
  }
  if (pathname === '/v1/public/languages' || pathname === '/api/v1/public/languages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ code: 'en', name: 'English', native: 'English', default: true }]));
    return;
  }
  if (pathname === '/v1/public/translations' || pathname === '/api/v1/public/translations') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({}));
    return;
  }
  if (pathname === '/v1/public/active-races' || pathname === '/api/v1/public/active-races') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }
  if (pathname.startsWith('/v1/public/races') || pathname.startsWith('/api/v1/public/races')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], total: 0 }));
    return;
  }

  // â”€â”€ Games random â”€â”€
  if (pathname === '/v1/games/random' || pathname === '/api/v1/games/random') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { slug: 'plinko', name: 'Plinko', type: 'originals', provider: 'rainbet' },
      { slug: 'chicken-cross', name: 'Chicken Cross', type: 'originals', provider: 'rainbet' },
      { slug: 'blackjack', name: 'Blackjack', type: 'originals', provider: 'rainbet' },
      { slug: 'mines-game', name: 'Mines', type: 'originals', provider: 'rainbet' }
    ]));
    return;
  }

  // â”€â”€ Calendar / events â”€â”€
  if (pathname.startsWith('/v1/calendar') || pathname.startsWith('/api/v1/calendar')) {
    if (req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events: [], rewards: [] }));
    return;
  }

  // â”€â”€ Email validation â”€â”€
  if (pathname.startsWith('/v1/email') || pathname.startsWith('/api/v1/email')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, verified: true }));
    return;
  }

  // â”€â”€ Sportsbook initiate â”€â”€
  if (pathname === '/v1/sportsbook/initiate' || pathname === '/api/v1/sportsbook/initiate') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url: null, token: null }));
    return;
  }

  // â”€â”€ Hardware wallet â”€â”€
  if (pathname.startsWith('/api/v1/hardware-wallets') || pathname.startsWith('/v1/hardware-wallets')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ otp: 'mock-otp-' + Date.now(), success: true }));
    return;
  }

  // â”€â”€ Connected accounts / MFA â”€â”€
  if (pathname.startsWith('/api/v1/connectedAccountDetail') || pathname.startsWith('/v1/connectedAccountDetail')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ mfa_enabled: false, status: 'not_bound', success: true }));
    return;
  }

  // â”€â”€ Change locale â”€â”€
  if (pathname === '/api/change-locale') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, locale: 'en' }));
    return;
  }

  // â”€â”€ Auth endpoints â”€â”€
  if (pathname === '/v1/auth/me' || pathname === '/api/v1/auth/me') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'local-player-001',
      public_id: 'LOCAL_PLAYER_001',
      username: 'Player',
      email: 'player@localhost',
      email_verified_at: new Date().toISOString(),
      currency: 'USD',
      rank: { name: 'Bronze', level: 1 },
      kyc_level: 2,
      has_2fa: false,
      preferences: { currency: 'USD', theme: 'dark', language: 'en' },
      wallet: { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } },
      balances: { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance }
    }));
    return;
  }
  if (pathname === '/v1/auth/refresh-token' || pathname === '/api/v1/auth/refresh-token') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token: 'mock-jwt-' + Date.now(), expires_in: 86400 }));
    return;
  }
  if (pathname === '/v1/auth/logout' || pathname === '/api/v1/auth/logout') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }
  if (pathname === '/v1/auth/log-in' || pathname === '/api/v1/auth/log-in' || pathname === '/v1/auth/sign-up' || pathname === '/api/v1/auth/sign-up') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token: 'mock-jwt-' + Date.now(), user: { id: 'local-player-001', username: 'Player', currency: 'USD' } }));
    return;
  }
  if (pathname.startsWith('/v1/auth/') || pathname.startsWith('/api/v1/auth/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }



  // Ã¢â€â‚¬Ã¢â€â‚¬ Vault deposit/withdraw Ã¢â€â‚¬Ã¢â€â‚¬

  // -- Next-auth session endpoints (used by Next.js frontend) --
  if (pathname === '/api/auth/session' || pathname.includes('/next-auth/session')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user: { name: 'DemoPlayer', email: 'demo@local.dev', image: null },
      expires: '2099-12-31T23:59:59.999Z'
    }));
    return;
  }
  if (pathname.startsWith('/api/auth/') || pathname.includes('/next-auth/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user: { name: 'DemoPlayer' }, expires: '2099-12-31T23:59:59.999Z' }));
    return;
  }
  if ((pathname === '/v1/vault/deposit' || pathname === '/api/v1/vault/deposit') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0 || amount > playerBalance) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid amount' }));
      return;
    }
    playerBalance = parseFloat((playerBalance - amount).toFixed(2));
    vaultBalance = parseFloat((vaultBalance + amount).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'vault_deposit', amount, currency: 'USD', timestamp: new Date().toISOString() });
    log(`VAULT DEPOSIT: $${amount} (balance: $${playerBalance}, vault: $${vaultBalance})`);
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, balance: playerBalance, vault: vaultBalance }));
    return;
  }

  if ((pathname === '/v1/vault/withdraw' || pathname === '/api/v1/vault/withdraw') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0 || amount > vaultBalance) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid amount' }));
      return;
    }
    vaultBalance = parseFloat((vaultBalance - amount).toFixed(2));
    playerBalance = parseFloat((playerBalance + amount).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'vault_withdraw', amount, currency: 'USD', timestamp: new Date().toISOString() });
    log(`VAULT WITHDRAW: $${amount} (balance: $${playerBalance}, vault: $${vaultBalance})`);
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, balance: playerBalance, vault: vaultBalance }));
    return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Custom deposit (add money) Ã¢â€â‚¬Ã¢â€â‚¬
  if ((pathname === '/api/deposit' || pathname === '/v1/deposit') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid amount' }));
      return;
    }
    playerBalance = parseFloat((playerBalance + amount).toFixed(2));
    totalDeposited = parseFloat((totalDeposited + amount).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'deposit', amount, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log(`DEPOSIT: +$${amount} (balance: $${playerBalance})`);
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, amount: playerBalance, balance: playerBalance }));
    return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Custom withdraw (remove money â€” goes to nothing) Ã¢â€â‚¬Ã¢â€â‚¬
  if ((pathname === '/api/withdraw' || pathname === '/v1/withdraw') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    if (amount <= 0 || amount > playerBalance) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: amount > playerBalance ? 'Insufficient balance' : 'Invalid amount' }));
      return;
    }
    playerBalance = parseFloat((playerBalance - amount).toFixed(2));
    totalWithdrawn = parseFloat((totalWithdrawn + amount).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'withdraw', amount, currency: 'USD', status: 'completed', address: '0x0000...void', timestamp: new Date().toISOString() });
    log(`WITHDRAW: -$${amount} (balance: $${playerBalance})`);
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, amount: playerBalance, balance: playerBalance }));
    return;
  }


  // Promo / Bonus code endpoints
  if ((pathname === '/promotions/enable' || pathname === '/api/promotions/enable' || pathname === '/v1/promotions/enable') && req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.promo_code || body.code || 'unknown';
    const amounts = [1000, 2000, 3000, 4000, 5000];
    const reward = amounts[Math.floor(Math.random() * amounts.length)];
    playerBalance = parseFloat((playerBalance + reward).toFixed(2));
    promotionalBalance = parseFloat((promotionalBalance + reward).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'promo_code', code, amount: reward, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log('PROMO CODE "' + code + '" REDEEMED: +' + reward + ' (balance: ' + playerBalance + ')');
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, promotion: { code, reward, status: 'active', type: 'wager-locked-1' }, balance: playerBalance, promotional: promotionalBalance }));
    return;
  }

  if ((pathname === '/promotions/cancel' || pathname === '/api/promotions/cancel') && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (pathname === '/promotions/list' || pathname === '/api/promotions/list') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ promotions: {} }));
    return;
  }

  if ((pathname === '/v1/affiliate/redeem-code' || pathname === '/api/v1/affiliate/redeem-code') && req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.affiliate_code || body.code || 'unknown';
    const amounts = [1000, 2000, 3000, 4000, 5000];
    const reward = amounts[Math.floor(Math.random() * amounts.length)];
    playerBalance = parseFloat((playerBalance + reward).toFixed(2));
    promotionalBalance = parseFloat((promotionalBalance + reward).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'affiliate_code', code, amount: reward, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log('AFFILIATE CODE "' + code + '" REDEEMED: +' + reward + ' (balance: ' + playerBalance + ')');
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, reward, balance: playerBalance, promotional: promotionalBalance }));
    return;
  }

  if ((pathname === '/v1/user/affilka/set-tag' || pathname === '/api/v1/user/affilka/set-tag') && req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.code || 'unknown';
    const amounts = [1000, 2000, 3000, 4000, 5000];
    const reward = amounts[Math.floor(Math.random() * amounts.length)];
    playerBalance = parseFloat((playerBalance + reward).toFixed(2));
    promotionalBalance = parseFloat((promotionalBalance + reward).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'bonus_code', code, amount: reward, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log('BONUS CODE "' + code + '" REDEEMED: +' + reward + ' (balance: ' + playerBalance + ')');
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, reward, balance: playerBalance, promotional: promotionalBalance }));
    return;
  }

  // Generic code catch-all (any POST to /redeem, /coupon, /promo, /bonus)
  if ((pathname.includes('/redeem') || pathname.includes('/coupon') || pathname.includes('/promo') || pathname.includes('/bonus')) && req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.code || body.promo_code || body.affiliate_code || body.coupon || 'unknown';
    const amounts = [1000, 2000, 3000, 4000, 5000];
    const reward = amounts[Math.floor(Math.random() * amounts.length)];
    playerBalance = parseFloat((playerBalance + reward).toFixed(2));
    promotionalBalance = parseFloat((promotionalBalance + reward).toFixed(2));
    transactionHistory.unshift({ id: crypto.randomUUID(), type: 'bonus_code', code, amount: reward, currency: 'USD', status: 'completed', timestamp: new Date().toISOString() });
    log('CODE "' + code + '" REDEEMED (catch-all): +' + reward + ' (balance: ' + playerBalance + ')');
    invalidatePageCaches();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, reward, balance: playerBalance, promotional: promotionalBalance }));
    return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Transaction history Ã¢â€â‚¬Ã¢â€â‚¬
  if (pathname === '/api/transactions') {
    const qType = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page') || url.searchParams.get('limit')) || 50;
    let filtered = transactionHistory;
    if (qType) filtered = transactionHistory.filter(t => t.type === qType || t.type.includes(qType));
    const start = (page - 1) * perPage;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ transactions: filtered.slice(start, start + perPage), total: filtered.length, page }));
    return;
  }

  // Guard: don't let broad API stubs intercept static file requests
  const isStaticAsset = pathname.startsWith('/blackjack_files/') ||
                        pathname.startsWith('/chicken-cross_files/') ||
                        pathname.startsWith('/_next/') ||
                        pathname.startsWith('/plinko_files/') ||
                        pathname.startsWith('/mines_files/') ||
                        pathname.startsWith('/homepage_files/') ||
                        /\.(js|css|woff2?|png|jpe?g|svg|webp|gif|mp3|ogg|wav|ico|map)$/i.test(pathname);

  // User favorites
  if (!isStaticAsset && pathname.includes('/user/favorites')) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // User update-settings
  if (!isStaticAsset && (pathname.includes('/user/update-settings') || pathname.includes('/update-settings'))) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Promotions
  if (!isStaticAsset && (pathname.includes('/promotions') || pathname.includes('/promo'))) {
    if (req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Raffles
  if (!isStaticAsset && pathname.includes('/raffle')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(pathname.includes('/list') || pathname.includes('/active') ? [] : { entries: 0, tickets: 0 }));
    return;
  }

  // Gift cards / redeem
  if (!isStaticAsset && (pathname.includes('/gift-card') || pathname.includes('/redeem'))) {
    if (req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Redeemed' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Affiliate
  if (!isStaticAsset && pathname.includes('/affiliate')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: '', referrals: 0, earnings: 0 }));
    return;
  }

  // Notifications
  if (!isStaticAsset && pathname.includes('/notification')) {
    if (req.method === 'POST' || req.method === 'PUT') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Leaderboard
  if (!isStaticAsset && pathname.includes('/leaderboard')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Chat / messages
  if (!isStaticAsset && (pathname.includes('/chat') || pathname.includes('/messages'))) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Tips (with balance deduction)
  if (!isStaticAsset && pathname.includes('/tip') && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount) || 0;
    const recipient = body.username || body.user || body.recipient || 'unknown';
    if (amount > 0 && amount <= playerBalance) {
      playerBalance = parseFloat((playerBalance - amount).toFixed(2));
      transactionHistory.unshift({ id: crypto.randomUUID(), type: 'tip', amount, currency: 'USD', recipient, status: 'completed', timestamp: new Date().toISOString() });
      log('TIP: -$' + amount + ' to ' + recipient + ' (balance: $' + playerBalance + ')');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, balance: playerBalance }));
    return;
  }

  // Game history (POST with body) â€” game expects a plain array
  if (!isStaticAsset && pathname.includes('/game-history')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const historyItems = betHistory.slice(0, 20).map(b => ({
      id: b.id,
      currencyAmount: b.amount,
      currency: 'USD',
      value: b.amount,
      currencyPayout: b.payout,
      payout: b.payout,
      multiplier: b.multiplier,
      user: { id: 'local-player', username: 'Player', rank: 'bronze-1' },
      game: { name: 'Plinko', icon: '/games/plinko/icon.png' }
    }));
    res.end(JSON.stringify(historyItems));
    return;
  }

  // Freeplays
  if (!isStaticAsset && pathname.includes('/freeplays')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ game: null, freeplays: [] }));
    return;
  }

  // Slots/providers â€” game expects { providers: [] }
  if (!isStaticAsset && pathname.includes('/slots/providers')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ providers: [] }));
    return;
  }

  // Slots/details â€” game expects object with game info
  if (!isStaticAsset && pathname.includes('/slots/details')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      promo_balance_eligible: false,
      type: 'originals',
      producer: 'rainbet',
      title: 'Plinko',
      heading: 'Plinko',
      rtp: '97.00',
      statistics: { round_count: totalBets }
    }));
    return;
  }

  // Rewards/ranks/races/calendar
  if (!isStaticAsset && (pathname.includes('/rewards') || pathname.includes('/ranks') || pathname.includes('/races'))) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (pathname.includes('/status')) {
      res.end(JSON.stringify({ rank: { name: 'Bronze', level: 1, wagered: totalWagered }, next: { name: 'Silver', level: 2, wagered: 10000 } }));
    } else if (pathname.includes('/list') || pathname.includes('/active')) {
      res.end(JSON.stringify([]));
    } else if (pathname.includes('/available') || pathname.includes('/calendar') || pathname.includes('/history')) {
      res.end(JSON.stringify([]));
    } else {
      res.end(JSON.stringify([]));
    }
    return;
  }

  // Public endpoints
  if (!isStaticAsset && pathname.includes('/public/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Catch-all for any Rainbet API paths â€” return empty object
  if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/') || pathname.startsWith('/v1/')) {
    log(`[API-CATCHALL] ${req.method} ${pathname}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({}));
    return;
  }


  // -- Chicken Cross page -- â”€â”€
  if (pathname === '/casino/originals/chicken-cross' || pathname === '/en/casino/originals/chicken-cross' || pathname === '/chicken-cross') {
    try {
      const bk = getBalanceKey();
      if (!_ccCache || _ccBK !== bk) {
        let ccHtml = fs.readFileSync(CC_HTML_FILE, 'utf8');

        // Patch __NEXT_DATA__ with current balance
        const ccNdTag = 'id="__NEXT_DATA__"';
        const ccNdStart = ccHtml.indexOf(ccNdTag);
        if (ccNdStart >= 0) {
          const ccJsonStart = ccHtml.indexOf('>', ccNdStart) + 1;
          const ccJsonEnd = ccHtml.indexOf('</script>', ccJsonStart);
          try {
            const ccNd = JSON.parse(ccHtml.substring(ccJsonStart, ccJsonEnd));
            if (ccNd.props && ccNd.props.pageProps) {
              ccNd.props.pageProps.wallet = { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } };
              ccNd.props.pageProps.balances = { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance };
            }
            ccHtml = ccHtml.substring(0, ccJsonStart) + JSON.stringify(ccNd) + ccHtml.substring(ccJsonEnd);
          } catch(e) { log('[CC] __NEXT_DATA__ patch error: ' + e.message); }
        }

        // Inject early CSS to hide preloader/spinner before any JS runs
        const ccEarlyCSS = '<style id="cc-kill-preloader">' +
          'section.fixed[class*="z-[9999]"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
          'img[src*="preloader"]{display:none!important}' +
          'svg.animate-spin{display:none!important}' +
          '#loader-external-login{display:none!important}' +
          '[class*="LoadingSpinner"]{opacity:0!important;animation:fadeInSpinner 0.3s ease-in 0.8s forwards!important}' +
          '@keyframes fadeInSpinner{to{opacity:1!important}}' +
          '[class*="scene-loading-overlay"],[class*="scene-loading-inner"]{transition:opacity 0.3s ease-in!important}' +
          '</style>';
        ccHtml = ccHtml.replace(/<head>/i, '<head>' + ccEarlyCSS);
        // Inject universal navigation script
        ccHtml = ccHtml.replace('</head>', function() { return buildNavScript('chicken-cross') + '</head>'; });
        ccHtml = injectPreloadHints(ccHtml);
        _ccCache = ccHtml;
        _ccCacheGz = zlib.gzipSync(ccHtml);
        _ccBK = bk;
      }
      sendHTML(req, res, _ccCache, _ccCacheGz);
    } catch(e) { res.writeHead(500, {'Content-Type':'text/plain'}); res.end('Error: ' + e.stack); }
    return;
  }

  // â”€â”€ Mines page â”€â”€
  if (pathname === '/casino/originals/mines-game' || pathname === '/en/casino/originals/mines-game' || pathname === '/mines' || pathname === '/mines-game') {
    try {
      let minesHtml = fs.readFileSync(MINES_HTML_FILE, 'utf8');
      // Patch __NEXT_DATA__
      const ndTag = 'id="__NEXT_DATA__"';
      const ndStart = minesHtml.indexOf(ndTag);
      if (ndStart >= 0) {
        const jsonStart = minesHtml.indexOf('>', ndStart) + 1;
        const jsonEnd = minesHtml.indexOf('</script>', jsonStart);
        try {
          const nd = JSON.parse(minesHtml.substring(jsonStart, jsonEnd));
          nd.asPath = '/casino/originals/mines-game';
          nd.page = '/casino/originals/[game]';
          nd.query = { game: 'mines-game' };
          if (nd.props && nd.props.pageProps) {
            nd.props.pageProps.wallet = { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } };
            nd.props.pageProps.balances = { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance };
            nd.props.pageProps.userData = nd.props.pageProps.userData || {};
            nd.props.pageProps.userData.currency = 'USD';
            nd.props.pageProps.userData.public_id = nd.props.pageProps.userData.public_id || 'LOCAL_PLAYER_001';
            nd.props.pageProps.userData.username = nd.props.pageProps.userData.username || 'Player';
            nd.props.pageProps.userData.preferences = nd.props.pageProps.userData.preferences || {};
            nd.props.pageProps.userData.auth = nd.props.pageProps.userData.auth || { type: 'local', email_verified_at: new Date().toISOString(), has_2fa: 0 };
            nd.props.pageProps.userData.kyc_level = nd.props.pageProps.userData.kyc_level || 2;
            nd.props.pageProps.currencies = nd.props.pageProps.currencies || [{ code: 'USD', type: 'fiat', name: 'US Dollar' }];
            nd.props.pageProps.session = {
              user: { access_token: 'demo-token', name: 'DemoPlayer', email: 'demo@local.dev' },
              expires: '2099-12-31T23:59:59.999Z'
            };
            if (!nd.props.pageProps.gameDetails) nd.props.pageProps.gameDetails = {};
            nd.props.pageProps.gameDetails.identifier = 'mines-game';
            nd.props.pageProps.gameDetails.gameUrl = 'mines-game';
            nd.props.pageProps.gameDetails.title = 'Mines';
            nd.props.pageProps.gameDetails.type = 'originals';
            nd.props.pageProps.gameDetails.provider = 'rainbet';
            // Set minesCheckData to reflect current game state
            if (minesActiveSession && !minesActiveSession.gameOver) {
              var visBoard = minesGetVisibleBoard(minesActiveSession);
              nd.props.pageProps.minesCheckData = {
                isPreviousGame: true,
                board: visBoard,
                mines: minesActiveSession.mines,
                tiles: minesActiveSession.tiles,
                revealedCellsCount: minesActiveSession.revealedCellsCount,
                betAmount: minesActiveSession.betAmount,
                currency: minesActiveSession.currency
              };
            } else {
              nd.props.pageProps.minesCheckData = { error: 'er_no_active_game' };
            }
            // Set game limits
            nd.props.pageProps.gameLimits = nd.props.pageProps.gameLimits || {
              USD: { min_bet: 0.1, max_bet: 6000, max_payout: 1000000 },
              EUR: { min_bet: 0.1, max_bet: 6000, max_payout: 1000000 }
            };
          }
          if (nd.runtimeConfig) nd.runtimeConfig.apiUrl = _currentOrigin;
          if (nd.publicRuntimeConfig) nd.publicRuntimeConfig.apiUrl = _currentOrigin;
          minesHtml = minesHtml.substring(0, jsonStart) + JSON.stringify(nd) + minesHtml.substring(jsonEnd);
        } catch(e) { log('[MINES] __NEXT_DATA__ patch error: ' + e.message); }
      }

      // Inject early CSS to hide preloader
      const minesEarlyCSS = '<style id="mines-kill-preloader">' +
        'section.fixed[class*="z-[9999]"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
        'img[src*="preloader"]{display:none!important}' +
        'svg.animate-spin{display:none!important}' +
        '#loader-external-login{display:none!important}' +
        '[class*="LoadingSpinner"]{opacity:0!important;animation:fadeInSpinner 0.3s ease-in 0.8s forwards!important}' +
        '@keyframes fadeInSpinner{to{opacity:1!important}}' +
        '</style>';
      minesHtml = minesHtml.replace(/<head>/i, '<head>' + minesEarlyCSS);

      // Remove tracking scripts
      minesHtml = minesHtml.replace(/<script[^>]*id="gtm-head"[^>]*>[\s\S]*?<\/script>/gi, '');
      minesHtml = minesHtml.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*><\/script>/gi, '');
      minesHtml = minesHtml.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*>/gi, '');
      minesHtml = minesHtml.replace(/<script[^>]*src="https?:\/\/challenges\.cloudflare\.com[^"]*"[^>]*><\/script>/gi, '');
      minesHtml = minesHtml.replace(/<script[^>]*id="turnstile-script"[^>]*>[\s\S]*?<\/script>/gi, '');
      minesHtml = minesHtml.replace(/<link[^>]*challenges\.cloudflare\.com[^>]*>/gi, '');

      // Remove inline Facebook pixel script (fbq) - use specific marker
      minesHtml = minesHtml.replace(/<script>\s*!function\(f,b,e,v,n,t,s\)[\s\S]{0,2000}?<\/script>/gi, '');

      // Remove Facebook signals/config script
      minesHtml = minesHtml.replace(/<script[^>]*src="https?:\/\/connect\.facebook\.net\/signals\/config[^"]*"[^>]*><\/script>/gi, '');
      minesHtml = minesHtml.replace(/<script[^>]*src="https?:\/\/connect\.facebook\.net\/signals\/config[^"]*"[^>]*>/gi, '');

      // Remove noscript tracking pixels (bounded to avoid backtracking)
      minesHtml = minesHtml.replace(/<noscript><img[^>]*(?:facebook|googletagmanager)[^>]*><\/noscript>/gi, '');

      // Remove intercom elements
      minesHtml = minesHtml.replace(/<iframe[^>]*intercom-frame[^>]*><\/iframe>/gi, '');
      minesHtml = minesHtml.replace(/<div class="intercom-lightweight-app">[\s\S]{0,5000}?<\/div><!-- \/ intercom -->/gi, '');

      // Remove no-logs script
      minesHtml = minesHtml.replace(/<script[^>]*id="no-logs"[^>]*>[\s\S]*?<\/script>/gi, '');

      // Rewrite asset paths: ./mines_files/ -> /mines_files/
      minesHtml = minesHtml.replace(/\.\/mines_files\//g, '/mines_files/');

      // Inject local game patches script
      const minesPatchScript = `<script>
// === MINES LOCAL PATCHES ===

// -- DOM tolerance patches --
// Prevents React crashes when ad blockers or DOM modifications remove nodes
(function() {
  var _origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child && child.parentNode !== this) {
      return child;
    }
    return _origRemoveChild.call(this, child);
  };
  var _origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, refNode) {
    if (refNode && refNode.parentNode !== this) {
      return _origInsertBefore.call(this, newNode, null);
    }
    return _origInsertBefore.call(this, newNode, refNode);
  };
})();

// Fix URL for Next.js router
if (window.location.pathname === '/mines' || window.location.pathname === '/mines-game') {
  window.history.replaceState({}, '', '/casino/originals/mines-game');
}

// Force online status
Object.defineProperty(navigator, 'onLine', { get: function() { return true; }, configurable: true });

// Restore console if overridden
if (window.log) console.log = window.log;

// Mock Turnstile
window.turnstile = {
  render: function(el,o){if(o&&o.callback)setTimeout(function(){o.callback('mock-token')},100);return'w'},
  reset:function(){}, remove:function(){}, getResponse:function(){return'mock-token'}, isExpired:function(){return false}
};
window.onLoadTurnstile = function(){};

// Stub Facebook pixel so inline fbq script bails out immediately
window.fbq = function() {};
window._fbq = window.fbq;

// Stub Google Tag Manager
window.dataLayer = window.dataLayer || [];
window.gtag = function() {};

// Suppress external errors
window.addEventListener('error', function(e) {
  if (e.filename && (e.filename.includes('google') || e.filename.includes('facebook') || e.filename.includes('intercom') || e.filename.includes('cloudflare'))) {
    e.preventDefault();
    return true;
  }
});

// Stub socket.io with proper event emission
if (!window.io) {
  function _minesSocket(nsp) {
    var _h = {}, s = { _h: _h, id: 'local-mines-' + Math.random().toString(36).substr(2,9), connected: true, disconnected: false, nsp: nsp || '/',
      on: function(e,f){(_h[e]=_h[e]||[]).push(f);return s},
      off: function(){return s}, once: function(e,f){return s.on(e,f)},
      emit: function(e){var a=Array.prototype.slice.call(arguments,1);(_h[e]||[]).forEach(function(f){try{f.apply(null,a)}catch(x){}});return s},
      removeListener: function(){return s}, removeAllListeners: function(){_h={};return s},
      connect: function(){s.connected=true;return s}, disconnect: function(){s.connected=false;return s},
      close: function(){return s.disconnect()}, open: function(){return s.connect()},
      volatile: null, compress: function(){return s}, timeout: function(){return s}
    };
    s.volatile = s;
    setTimeout(function(){ s.emit('connect'); }, 60);
    return s;
  }
  window.io = function(){ return _minesSocket('/'); };
  window.io.connect = window.io;
  window.io.Manager = function(){ return Object.create(_minesSocket('/')); };
  window.io.Socket = _minesSocket;
  window.io.protocol = 5;
}

// Block external WebSocket connections (return OPEN stub so games don't show 'offline')
var _OrigWS = window.WebSocket;
window.WebSocket = function(url, protocols) {
  if (typeof url === 'string' && (url.includes('rainbet.com') || url.includes('intercom') || url.includes('facebook') || url.includes('google'))) {
    var _wsh = {};
    var _ws = { readyState: 1, CONNECTING:0, OPEN:1, CLOSING:2, CLOSED:3,
      send: function(){}, close: function(){ _ws.readyState = 3; },
      addEventListener: function(t,f){ (_wsh[t]=_wsh[t]||[]).push(f); },
      removeEventListener: function(){},
      dispatchEvent: function(){},
      onopen: null, onclose: null, onmessage: null, onerror: null,
      url: url, protocol: '', extensions: '', bufferedAmount: 0, binaryType: 'blob'
    };
    setTimeout(function(){
      if (_ws.onopen) _ws.onopen({type:'open'});
      (_wsh['open']||[]).forEach(function(f){try{f({type:'open'})}catch(e){}});
    }, 80);
    return _ws;
  }
  if (protocols !== undefined) return new _OrigWS(url, protocols);
  return new _OrigWS(url);
};
window.WebSocket.prototype = _OrigWS.prototype;
window.WebSocket.CONNECTING = 0; window.WebSocket.OPEN = 1; window.WebSocket.CLOSING = 2; window.WebSocket.CLOSED = 3;

// XHR interceptor - rewrite rainbet.com API calls to localhost
(function() {
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string') {
      url = url.replace(/https?:\\/\\/[a-z0-9.-]*rainbet\\.com/g, '');
    }
    var args = Array.prototype.slice.call(arguments);
    args[1] = url;
    return origOpen.apply(this, args);
  };
})();

// Fetch interceptor
(function() {
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var u = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    // Rewrite rainbet.com domain calls to local
    if (typeof input === 'string' && input.includes('rainbet.com')) {
      try { var p = new URL(input); input = p.pathname + p.search; u = input; } catch(e){}
    }
    // Auth / session stubs
    if (u.includes('/api/auth') || u.includes('/session') || u.includes('next-auth')) {
      return Promise.resolve(new Response(JSON.stringify({
        user: { name: 'Player' }, expires: new Date(Date.now()+86400000).toISOString()
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }
    // _next/data (Next.js client navigation)
    if (u.includes('/_next/data/')) {
      var _ndIdx = u.indexOf('/_next/data/');
      var _dp = '';
      if (_ndIdx !== -1) { var _slashPos = u.indexOf('/', _ndIdx + 12); if (_slashPos !== -1) { var _jsonPos = u.indexOf('.json', _slashPos); _dp = _jsonPos !== -1 ? u.substring(_slashPos, _jsonPos) : u.substring(_slashPos); var _qPos = _dp.indexOf('?'); if (_qPos !== -1) _dp = _dp.substring(0, _qPos); if (_dp.substring(0,4) === '/en/') _dp = _dp.substring(3); } }
      var _gr = {'/casino/originals/plinko':1,'/casino/originals/chicken-cross':1,'/casino/originals/mines-game':1,'/casino/originals/blackjack':1};
      var _hr = {'/':1,'/casino':1,'/casino/originals':1,'/home':1};
      var _cp = window.location.pathname; if (_cp.substring(0,4) === '/en/') _cp = _cp.substring(3);
      if (_gr[_dp] && _dp !== _cp) { window.location.href = _dp; return new Promise(function(){}); }
      if (_hr[_dp] && !_hr[_cp]) { window.location.href = '/casino'; return new Promise(function(){}); }
      return Promise.resolve(new Response(JSON.stringify({
        pageProps: {}, __N_SSP: true
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }
    // Block tracking/analytics
    if (u.includes('google') || u.includes('facebook') || u.includes('intercom') || u.includes('sentry') || u.includes('turnstile')) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return origFetch.call(this, input, init).catch(function(err) {
      if (u.includes('google') || u.includes('facebook') || u.includes('intercom') || u.includes('sentry')) {
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw err;
    });
  };
})();

// Navigation interceptor moved to universal buildNavScript()

// CSS cleanup
var style = document.createElement('style');
style.textContent = [
  'a[href*="modal=auth"][href*="tab=login"], a[href*="modal=auth"][href*="tab=register"] { display: none !important; }',
  '[class*="auth-modal"], [class*="AuthModal"], [class*="login-modal"] { display: none !important; }',
  '#loader-external-login { display: none !important; }',
  'section.fixed[class*="z-[9999]"] { display: none !important; visibility: hidden !important; }',
  'img[src*="preloader"] { display: none !important; }',
  'body { overflow: auto !important; }',
  '[class*="InternetConnection"], [class*="offline"] { display: none !important; }',
  '[class*="country-block"], [class*="Blocker"], [class*="restricted"] { display: none !important; }',
].join('\\n');
document.head.appendChild(style);

// Remove preloader overlays
(function() {
  var removePreloader = function() {
    document.querySelectorAll('section.fixed').forEach(function(s) {
      if (s.className && s.className.includes && s.className.includes('z-[9999]')) {
        s.remove();
      }
    });
  };
  removePreloader();
  setTimeout(removePreloader, 500);
  setTimeout(removePreloader, 1500);
  setTimeout(removePreloader, 3000);
})();

console.log('[Mines] Local patches loaded');
</script>`;

      // Insert patch script right after <head> + early CSS
      minesHtml = minesHtml.replace('</head>', function() { return minesPatchScript + buildNavScript('mines-game') + '</head>'; });
      minesHtml = injectPreloadHints(minesHtml);

      const ae = req.headers['accept-encoding'] || '';
      if (ae.includes('gzip')) {
        const gz = zlib.gzipSync(minesHtml);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
        res.end(gz);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(minesHtml);
      }
    } catch(e) { res.writeHead(500, {'Content-Type':'text/plain'}); res.end('Error: ' + e.stack); }
    return;
  }

  // â”€â”€ Blackjack page â”€â”€
  if (pathname === '/casino/originals/blackjack' || pathname === '/en/casino/originals/blackjack' || pathname === '/blackjack') {
    try {
      const bk = getBalanceKey();
      if (!_bjCache || _bjBK !== bk) {
      let bjHtml = fs.readFileSync(BJ_HTML_FILE, 'utf8');
      // Patch wallet/balance data in __NEXT_DATA__
      const ndTag = 'id="__NEXT_DATA__"';
      const ndStart = bjHtml.indexOf(ndTag);
      if (ndStart >= 0) {
        const jsonStart = bjHtml.indexOf('>', ndStart) + 1;
        const jsonEnd = bjHtml.indexOf('</script>', jsonStart);
        try {
          const nd = JSON.parse(bjHtml.substring(jsonStart, jsonEnd));
          // Fix routing - set proper asPath and query (avoid modal=fairplay from capture)
          nd.asPath = '/casino/originals/blackjack';
          nd.page = '/casino/originals/[game]';
          nd.query = { game: 'blackjack' };
          if (nd.props && nd.props.pageProps) {
            nd.props.pageProps.wallet = { active: { currency: 'USD', primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance } };
            nd.props.pageProps.balances = { primary: playerBalance, promotional: promotionalBalance, vault: vaultBalance };
            nd.props.pageProps.userData = nd.props.pageProps.userData || {};
            nd.props.pageProps.userData.currency = 'USD';
            nd.props.pageProps.currencies = nd.props.pageProps.currencies || [{ code: 'USD', type: 'fiat', name: 'US Dollar' }];
            // Inject session for demo mode
            nd.props.pageProps.session = {
              user: { access_token: 'demo-token', name: 'DemoPlayer', email: 'demo@local.dev' },
              expires: '2099-12-31T23:59:59.999Z'
            };
            // Ensure gameDetails
            if (!nd.props.pageProps.gameDetails) nd.props.pageProps.gameDetails = {};
            nd.props.pageProps.gameDetails.identifier = 'blackjack';
            nd.props.pageProps.gameDetails.gameUrl = 'blackjack';
            nd.props.pageProps.gameDetails.title = 'Blackjack';
            nd.props.pageProps.gameDetails.type = 'originals';
            nd.props.pageProps.gameDetails.provider = 'rainbet';
          }
          bjHtml = bjHtml.substring(0, jsonStart) + JSON.stringify(nd) + bjHtml.substring(jsonEnd);
        } catch(e) { log('[BJ] __NEXT_DATA__ patch error: ' + e.message); }
      }

      // Strip third-party tracking scripts
      bjHtml = bjHtml.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*><\/script>/gi, '');
      bjHtml = bjHtml.replace(/<script[^>]*src="https?:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|widget\.intercom\.io)[^"]*"[^>]*>/gi, '');
      bjHtml = bjHtml.replace(/<script[^>]*src="https?:\/\/challenges\.cloudflare\.com[^"]*"[^>]*><\/script>/gi, '');
      bjHtml = bjHtml.replace(/<script[^>]*id="turnstile-script"[^>]*>[\s\S]*?<\/script>/gi, '');
      bjHtml = bjHtml.replace(/<noscript><img[^>]*(?:facebook|googletagmanager)[^>]*><\/noscript>/gi, '');

      // Inject runtime patches (XHR/fetch interceptor, WebSocket blocker, etc.)
      const bjPatchScript = `<script id="bj-local-patches">
(function() {
  'use strict';
  window.__LOCAL_BALANCE__ = ${playerBalance};

  // Force online
  Object.defineProperty(navigator, 'onLine', { get: function() { return true; }, configurable: true });

  // XHR interceptor â€” redirect rainbet.com API calls to localhost
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string') {
      url = url.replace(/https?:\\/\\/[a-z0-9.-]*rainbet\\.com/g, '');
    }
    var args = Array.prototype.slice.call(arguments);
    args[1] = url;
    return _xhrOpen.apply(this, args);
  };

  // Fetch interceptor
  var _fetch = window.fetch;
  window.fetch = function(url, opts) {
    var u = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    if (u.includes('rainbet.com')) {
      try { var p = new URL(u); url = p.pathname + p.search; u = url; } catch(e){}
    }
    if (u.includes('/api/auth') || u.includes('/session') || u.includes('next-auth')) {
      return Promise.resolve(new Response(JSON.stringify({
        user: { name: 'Player' }, expires: new Date(Date.now()+86400000).toISOString()
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }
    if (u.includes('/_next/data/')) {
      var _ndIdx = u.indexOf('/_next/data/');
      var _dp = '';
      if (_ndIdx !== -1) { var _slashPos = u.indexOf('/', _ndIdx + 12); if (_slashPos !== -1) { var _jsonPos = u.indexOf('.json', _slashPos); _dp = _jsonPos !== -1 ? u.substring(_slashPos, _jsonPos) : u.substring(_slashPos); var _qPos = _dp.indexOf('?'); if (_qPos !== -1) _dp = _dp.substring(0, _qPos); if (_dp.substring(0,4) === '/en/') _dp = _dp.substring(3); } }
      var _gr = {'/casino/originals/plinko':1,'/casino/originals/chicken-cross':1,'/casino/originals/mines-game':1,'/casino/originals/blackjack':1};
      var _hr = {'/':1,'/casino':1,'/casino/originals':1,'/home':1};
      var _cp = window.location.pathname; if (_cp.substring(0,4) === '/en/') _cp = _cp.substring(3);
      if (_gr[_dp] && _dp !== _cp) { window.location.href = _dp; return new Promise(function(){}); }
      if (_hr[_dp] && !_hr[_cp]) { window.location.href = '/casino'; return new Promise(function(){}); }
      return Promise.resolve(new Response(JSON.stringify({
        pageProps: {}, __N_SSP: true
      }), { status: 200, headers: {'content-type':'application/json'} }));
    }
    return _fetch.call(window, url, opts).then(function(resp) {
      // Clone response to read body for balance sync without consuming it
      if (u.includes('/v1/') || u.includes('/api/')) {
        var clone = resp.clone();
        clone.json().then(function(data) {
          // Sync balance from wallet endpoint
          if (data && data.active && data.active.primary !== undefined) {
            window.__LOCAL_BALANCE__ = data.active.primary;
          }
          // Sync balance from game responses that include wallet
          if (data && data.wallet && data.wallet.active && data.wallet.active.primary !== undefined) {
            window.__LOCAL_BALANCE__ = data.wallet.active.primary;
          }
          // Sync from gameState.wallet
          if (data && data.gameState && data.gameState.wallet && data.gameState.wallet.active) {
            window.__LOCAL_BALANCE__ = data.gameState.wallet.active.primary;
          }
        }).catch(function(){});
      }
      return resp;
    }).catch(function(err) {
      if (u.includes('google') || u.includes('facebook') || u.includes('intercom') || u.includes('sentry')) {
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw err;
    });
  };

  // Mock socket.io
  function MockSocket(nsp) {
    var s = { _h: {}, id: 'mock-'+Math.random().toString(36).substr(2,9), connected: true, disconnected: false, nsp: nsp||'/',
      io: { engine: { transport: { name: 'websocket' }, on: function(){return this}, once: function(){return this} } },
      on: function(e,f){(s._h[e]=s._h[e]||[]).push(f);return s}, off: function(){return s}, once: function(e,f){return s.on(e,f)},
      emit: function(e){var a=Array.prototype.slice.call(arguments,1);(s._h[e]||[]).forEach(function(f){try{f.apply(null,a)}catch(x){}});return s},
      removeListener: function(){return s}, removeAllListeners: function(){s._h={};return s},
      listeners: function(e){return s._h[e]||[]}, hasListeners: function(e){return(s._h[e]||[]).length>0},
      connect: function(){s.connected=true;return s}, disconnect: function(){s.connected=false;return s},
      close: function(){return s.disconnect()}, open: function(){return s.connect()},
      volatile: null, compress: function(){return s}, timeout: function(){return s} };
    s.volatile = s;
    setTimeout(function(){ s.emit('connect'); }, 50);
    return s;
  }
  window.io = function(){ return MockSocket('/'); };
  window.io.Manager = function(){ return Object.create(MockSocket('/')); };
  window.io.Socket = MockSocket;
  window.io.connect = window.io;
  window.io.protocol = 5;

  // Block external WebSocket connections (return OPEN stub so app doesn't show offline/network error)
  var _OrigWS = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string' && (url.includes('rainbet.com') || url.includes('intercom') || url.includes('facebook') || url.includes('google'))) {
      var _bwsh = {};
      var _bws = { readyState: 1, CONNECTING:0, OPEN:1, CLOSING:2, CLOSED:3,
        send:function(){}, close:function(){_bws.readyState=3;},
        addEventListener:function(t,f){(_bwsh[t]=_bwsh[t]||[]).push(f);},
        removeEventListener:function(){}, dispatchEvent:function(){},
        onopen:null, onclose:null, onmessage:null, onerror:null,
        url:url, protocol:'', extensions:'', bufferedAmount:0, binaryType:'blob' };
      setTimeout(function(){
        if (_bws.onopen) _bws.onopen({type:'open'});
        (_bwsh['open']||[]).forEach(function(f){try{f({type:'open'})}catch(e){}});
      }, 80);
      return _bws;
    }
    if (protocols !== undefined) return new _OrigWS(url, protocols);
    return new _OrigWS(url);
  };
  window.WebSocket.prototype = _OrigWS.prototype;
  window.WebSocket.CONNECTING=0; window.WebSocket.OPEN=1; window.WebSocket.CLOSING=2; window.WebSocket.CLOSED=3;

  // Mock Turnstile
  window.turnstile = { render:function(el,o){if(o&&o.callback)setTimeout(function(){o.callback('mock-token')},100);return'w'},
    reset:function(){}, remove:function(){}, getResponse:function(){return'mock-token'}, isExpired:function(){return false} };
  window.onLoadTurnstile = function(){};

  // Stub fbq
  window.fbq = function(){};

  // CSS cleanup
  var style = document.createElement('style');
  style.textContent = [
    'a[href*="modal=auth"][href*="tab=login"], a[href*="modal=auth"][href*="tab=register"] { display: none !important; }',
    '[class*="auth-modal"], [class*="AuthModal"], [class*="login-modal"] { display: none !important; }',
    '#loader-external-login { display: none !important; }',
    'section.fixed[class*="z-[9999]"] { display: none !important; visibility: hidden !important; }',
    'body { overflow: auto !important; }',
    '[class*="InternetConnection"], [class*="offline"] { display: none !important; }',
    '[class*="country-block"], [class*="Blocker"], [class*="restricted"] { display: none !important; }',
  ].join('\\n');
  document.head.appendChild(style);

  // Suppress harmless errors
  var blockList = ['intercom','gtm','fbevents','google','turnstile','cloudflare','socket.io','facebook','sentry'];
  window.addEventListener('error', function(e) {
    var msg = e.message || '';
    if (blockList.some(function(w){return msg.toLowerCase().includes(w)})) { e.preventDefault(); return true; }
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && (e.reason.message || String(e.reason)) || '';
    if (blockList.some(function(w){return msg.toLowerCase().includes(w)}) || msg.includes('Failed to fetch')) { e.preventDefault(); }
  });

  // Remove preloader
  function removePreloader() {
    document.querySelectorAll('section.fixed').forEach(function(s) {
      if (s.className.includes('z-[9999]')) { s.remove(); document.body.style.overflow = ''; }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removePreloader);
  } else { removePreloader(); }
  setTimeout(removePreloader, 2000);

  console.log('%c RAINBET BLACKJACK â€” LOCAL MODE ', 'background:#e17055;color:white;font-size:16px;padding:4px 12px;border-radius:4px');
})();
</script>`;
      bjHtml = bjHtml.replace(/<head>/i, '<head>' + bjPatchScript);

      // Inject universal navigation script
      bjHtml = bjHtml.replace('</head>', function() { return buildNavScript('blackjack') + '</head>'; });
      bjHtml = injectPreloadHints(bjHtml);
      _bjCache = bjHtml;
      _bjCacheGz = zlib.gzipSync(bjHtml);
      _bjBK = bk;
      }
      sendHTML(req, res, _bjCache, _bjCacheGz);
    } catch(e) { res.writeHead(500, {'Content-Type':'text/plain'}); res.end('Error: ' + e.stack); }
    return;
  }

  // â”€â”€ Chicken Cross static assets â”€â”€
  if (pathname.startsWith('/chicken-cross_files/')) {
    let fp = path.join(CC_BASE_DIR, pathname);
    // If decoded path doesn't match (e.g. %5B decoded to [), try raw URL path
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      const rawPath = url.pathname.replace(/^\/casino\/originals/, '');
      fp = path.join(CC_BASE_DIR, rawPath);
    }
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      res.writeHead(200, { 'Content-Type': getMime(fp), 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(cachedReadFile(fp));
      return;
    }
  }

  // â”€â”€ Blackjack static assets â”€â”€
  if (pathname.startsWith('/blackjack_files/')) {
    let fp = path.join(BJ_BASE_DIR, pathname);
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      const rawPath = url.pathname.replace(/^\/casino\/originals/, '');
      fp = path.join(BJ_BASE_DIR, rawPath);
    }
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      let content;
      if (pathname.includes('framework-') && pathname.endsWith('.js')) {
        const cacheKey = fp + '::patched';
        if (fileContentCache.has(cacheKey)) { content = fileContentCache.get(cacheKey); }
        else {
          let js = fs.readFileSync(fp, 'utf8');
          js = js.replace(
            /n\.hydrateRoot=r\.hydrateRoot/g,
            'n.hydrateRoot=function(c,e,o){c.innerHTML="";var _r=r.createRoot(c,o);_r.render(e);return _r}'
          );
          content = Buffer.from(js);
          fileContentCache.set(cacheKey, content);
          log('[BJ] Patched framework chunk: hydrateRoot -> createRoot wrapper');
        }
      } else {
        content = cachedReadFile(fp);
      }
      res.writeHead(200, { 'Content-Type': getMime(fp), 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(content);
      return;
    }
  }

  // â”€â”€ Mines static assets â”€â”€
  if (pathname.startsWith('/mines_files/')) {
    let fp = path.join(MINES_BASE_DIR, pathname.replace('/mines_files/', 'mines_files/'));
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      const rawPath = url.pathname.replace(/^\/casino\/originals/, '');
      fp = path.join(MINES_BASE_DIR, rawPath);
    }
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      let content;
      // Patch framework chunk: replace hydrateRoot with createRoot wrapper
      // to prevent React hydration mismatch errors (#418/#423)
      if (pathname.includes('framework-') && pathname.endsWith('.js')) {
        const cacheKey = fp + '::patched';
        if (fileContentCache.has(cacheKey)) { content = fileContentCache.get(cacheKey); }
        else {
          let js = fs.readFileSync(fp, 'utf8');
          js = js.replace(
            /n\.hydrateRoot=r\.hydrateRoot/g,
            'n.hydrateRoot=function(c,e,o){c.innerHTML="";var _r=r.createRoot(c,o);_r.render(e);return _r}'
          );
          content = Buffer.from(js);
          fileContentCache.set(cacheKey, content);
          log('[MINES] Patched framework chunk: hydrateRoot -> createRoot wrapper');
        }
      } else {
        content = cachedReadFile(fp);
      }
      res.writeHead(200, { 'Content-Type': getMime(fp), 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(content);
      return;
    }
  }

  // -- Homepage static assets --
  if (pathname.startsWith('/homepage_files/')) {
    let fp = path.join(HOMEPAGE_BASE_DIR, pathname.replace(/^\//, ''));
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      let content;
      if (pathname.includes('framework-') && pathname.endsWith('.js')) {
        const cacheKey = fp + '::patched';
        if (fileContentCache.has(cacheKey)) { content = fileContentCache.get(cacheKey); }
        else {
          let js = fs.readFileSync(fp, 'utf8');
          js = js.replace(
            /n\.hydrateRoot=r\.hydrateRoot/g,
            'n.hydrateRoot=function(c,e,o){c.innerHTML="";var _r=r.createRoot(c,o);_r.render(e);return _r}'
          );
          content = Buffer.from(js);
          fileContentCache.set(cacheKey, content);
          log('[HOMEPAGE] Patched framework chunk: hydrateRoot -> createRoot wrapper');
        }
      } else {
        content = cachedReadFile(fp);
      }
      res.writeHead(200, { 'Content-Type': getMime(fp), 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(content);
      return;
    }
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MAIN PAGE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // ---- DEBUG PAGE ----
  if (pathname === '/debug') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nav Debug</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d0f1a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,monospace;font-size:13px;padding:10px;padding-bottom:80px}
  h2{color:#85c7ff;margin-bottom:6px;font-size:18px}
  .sub{color:#888;font-size:12px;margin-bottom:12px}
  #log{background:#151829;border:1px solid #333;border-radius:8px;padding:8px;max-height:65vh;overflow-y:auto;font-size:12px}
  .entry{border-bottom:1px solid #1e2040;padding:3px 0;line-height:1.4}
  .ts{color:#555;font-size:11px}
  .t-load{color:#80ff80} .t-nav{color:#f0c040} .t-click{color:#ff9040}
  .t-fetch{color:#40c0f0} .t-pushState{color:#c080ff} .t-404-detect{color:#ff3030;font-weight:bold}
  .t-error{color:#ff6060} .t-reject{color:#ff8080} .t-info{color:#80ff80}
  .pg{color:#666;font-size:11px}
  .bar{position:fixed;bottom:0;left:0;right:0;background:#1a1d2e;border-top:1px solid #333;padding:8px;display:flex;flex-wrap:wrap;gap:5px;z-index:999}
  .bar a{background:#1e2038;color:#85c7ff;padding:8px 12px;border-radius:6px;text-decoration:none;border:1px solid #333;font-size:13px;white-space:nowrap}
  .bar a:active{background:#2e3058}
  .btn{background:#2a2d45;color:#fff;border:1px solid #555;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:13px}
  .btn:active{background:#3a3d55}
  .btn.red{background:#5a2020;border-color:#833}
  .status{background:#1a2a1a;border:1px solid #2a4a2a;border-radius:6px;padding:8px;margin-bottom:10px;font-size:12px}
  .status b{color:#85c7ff}
</style>
</head><body>
<h2>Nav Debug Panel</h2>
<p class="sub">Navigate to any game, then come back here. All navigation events are logged across page loads via localStorage.</p>
<div class="status" id="status"></div>
<div style="margin-bottom:8px;display:flex;gap:5px;flex-wrap:wrap">
  <button class="btn" onclick="refreshLog()">Refresh</button>
  <button class="btn" onclick="copyLog()">Copy Log</button>
  <button class="btn red" onclick="clearLog()">Clear Log</button>
</div>
<div id="log"></div>
<div class="bar">
  <a href="/casino">Home</a>
  <a href="/casino/originals/plinko">Plinko</a>
  <a href="/casino/originals/chicken-cross">Chicken</a>
  <a href="/casino/originals/blackjack">Blackjack</a>
  <a href="/casino/originals/mines-game">Mines</a>
</div>
<script>
var logEl=document.getElementById('log');
var statusEl=document.getElementById('status');
var TYPE_COLORS={'load':'t-load','nav':'t-nav','click':'t-click','fetch':'t-fetch','pushState':'t-pushState','404-detect':'t-404-detect','error':'t-error','reject':'t-reject','info':'t-info'};

function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

function refreshLog(){
  var logs=[];
  try{logs=JSON.parse(localStorage.getItem('__navDebugLog')||'[]')}catch(e){}
  statusEl.innerHTML='<b>Entries:</b> '+logs.length+' | <b>UA:</b> '+navigator.userAgent.substring(0,80);
  logEl.innerHTML='';
  if(!logs.length){logEl.innerHTML='<div class="entry" style="color:#666">No logs yet. Open a game page and navigate around, then come back.</div>';return}
  for(var i=0;i<logs.length;i++){
    var e=logs[i];
    var cls=TYPE_COLORS[e.type]||'t-info';
    var d=document.createElement('div');
    d.className='entry';
    d.innerHTML='<span class="ts">'+esc(e.ts||'?')+'</span> <span class="'+cls+'">['+esc(e.type)+']</span> '+esc(e.msg||'')+' <span class="pg">('+esc(e.page||'?')+' @ '+esc(e.path||'?')+')</span>';
    logEl.appendChild(d);
  }
  logEl.scrollTop=logEl.scrollHeight;
}
function copyLog(){
  var logs=[];try{logs=JSON.parse(localStorage.getItem('__navDebugLog')||'[]')}catch(e){}
  var text=logs.map(function(e){return e.ts+' ['+e.type+'] '+e.msg+' ('+e.page+' @ '+e.path+')'}).join('\\n');
  text='UA: '+navigator.userAgent+'\\n\\n'+text;
  navigator.clipboard.writeText(text).then(function(){alert('Copied '+logs.length+' entries!')}).catch(function(){
    var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('Copied!')
  });
}
function clearLog(){localStorage.removeItem('__navDebugLog');refreshLog()}
refreshLog();
setInterval(refreshLog,2000);
</script>
</body></html>`);
    return;
  }

  // ---- HOMEPAGE ----
  if (pathname === '/' || pathname === '' || pathname === '/casino' || pathname === '/casino/originals' || pathname === '/home' || pathname === '/en/casino' || pathname === '/en/casino/originals') {
    try {
      const bk = getBalanceKey();
      if (!_homepageCache || _homepageBK !== bk) {
        _homepageCache = buildHomepageHTML();
        _homepageCacheGz = zlib.gzipSync(_homepageCache);
        _homepageBK = bk;
      }
      sendHTML(req, res, _homepageCache, _homepageCacheGz);
    } catch(e) { res.writeHead(500, {'Content-Type':'text/plain'}); res.end('Error: ' + e.stack); }
    return;
  }

  // ---- PLINKO PAGE ----
  if (pathname === '/casino/originals/plinko' || pathname === '/plinko' || pathname === '/en/casino/originals/plinko') {
    try {
      const bk = getBalanceKey();
      if (!_plinkoCache || _plinkoBK !== bk) {
        _plinkoCache = buildPlinkoHTML();
        _plinkoCacheGz = zlib.gzipSync(_plinkoCache);
        _plinkoBK = bk;
      }
      sendHTML(req, res, _plinkoCache, _plinkoCacheGz);
    } catch(e) { res.writeHead(500, {'Content-Type':'text/plain'}); res.end('Error: ' + e.stack); }
    return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ NEXT.JS STATIC ASSETS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  // JS chunks: /_next/static/chunks/...
  if (pathname.startsWith('/_next/static/chunks/')) {
    let chunkPath = pathname.replace('/_next/static/chunks/', '');
    // Strip pages/ prefix: pages/casino/originals/[game]-hash.js Ã¢â€ â€™ [game]-hash.js
    chunkPath = chunkPath.replace(/^pages\/(?:casino\/originals\/)?/, '');

    const filePath = resolveFile(chunkPath);
    if (filePath && fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(cachedReadFile(filePath));
      return;
    }

    // For truly missing chunks, return empty webpack chunk stub
    const chunkMatch = chunkPath.match(/^(\d+)/);
    if (chunkMatch) {
      log(`[STUB] Missing chunk: ${chunkPath}`);
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(`(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[${chunkMatch[1]}],{}]);`);
      return;
    }
    // Missing non-numeric chunk
    log(`[404] Chunk: ${chunkPath}`);
    res.writeHead(404); res.end('Not found'); return;
  }

  // CSS: /_next/static/css/...
  if (pathname.startsWith('/_next/static/css/')) {
    const cssFile = pathname.replace('/_next/static/css/', '');
    const filePath = resolveFile(cssFile);
    if (filePath && fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(cachedReadFile(filePath));
      return;
    }
    log(`[404] CSS: ${cssFile}`);
    res.writeHead(200, { 'Content-Type': 'text/css' }); res.end('/* not found */'); return;
  }

  // Media (fonts): /_next/static/media/...
  if (pathname.startsWith('/_next/static/media/')) {
    const mediaFile = pathname.replace('/_next/static/media/', '');
    const filePath = resolveFile(mediaFile);
    if (filePath && fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(cachedReadFile(filePath));
      return;
    }
    log(`[404] Media: ${mediaFile}`);
    res.writeHead(404); res.end('Not found'); return;
  }

  // Build manifests: /_next/static/BUILD_ID/_buildManifest.js & _ssgManifest.js
  // Serve a STRIPPED _buildManifest that removes game/casino page routes.
  // This prevents Next.js from attempting client-side navigation to other pages
  // (which would render a 404 since each game is a separate HTML page).
  if (pathname.includes('_buildManifest.js')) {
    if (!_strippedBuildManifest) {
      const filePath = resolveFile('_buildManifest.js');
      if (filePath) {
        let src = cachedReadFile(filePath).toString();
        // Remove routes that would trigger client-side nav to other pages:
        // /casino/originals/[game], /casino/[type], /casino, /, etc.
        // Keep /_error, /404, and non-game routes intact
        const routesToStrip = [
          '/casino/originals/[game]', '/casino/originals/[game]/[case]',
          '/casino/[type]', '/casino/[type]/[slug]', '/casino/[type]/[slug]/[game]',
          '/casino', '/casino/originals', '/',
          '/casino/originals/case-battles/create-battle', '/casino/originals/case-battles/[lobby]',
        ];
        for (const route of routesToStrip) {
          // Find the route key and balanced-bracket remove its array value
          const key = '"' + route + '"';
          let idx = src.indexOf(key);
          while (idx !== -1) {
            const arrStart = src.indexOf('[', idx + key.length);
            if (arrStart === -1) break;
            // Balance brackets to find end of array (handles strings containing ] )
            let depth = 0, inStr = false, j;
            for (j = arrStart; j < src.length; j++) {
              if (inStr) { if (src[j] === '"' && src[j-1] !== '\\\\') inStr = false; continue; }
              if (src[j] === '"') { inStr = true; continue; }
              if (src[j] === '[') depth++;
              if (src[j] === ']') { depth--; if (depth === 0) break; }
            }
            // Remove from key start to end of array, plus trailing/leading comma
            let removeStart = idx;
            let removeEnd = j + 1;
            if (removeStart > 0 && src[removeStart - 1] === ',') removeStart--;
            else if (removeEnd < src.length && src[removeEnd] === ',') removeEnd++;
            src = src.substring(0, removeStart) + src.substring(removeEnd);
            idx = src.indexOf(key);
          }
        }
        // Clean up any leading commas after removal
        src = src.replace(/\{,/g, '{');
        _strippedBuildManifest = src;
      }
    }
    if (_strippedBuildManifest) {
      res.writeHead(200, {'Content-Type':'application/javascript', 'Cache-Control': STATIC_CACHE_HEADER});
      res.end(_strippedBuildManifest);
      return;
    }
  }
  if (pathname.includes('_ssgManifest.js')) {
    const filePath = resolveFile('_ssgManifest.js');
    if (filePath) { res.writeHead(200, {'Content-Type':'application/javascript', 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }
  }

  // /_next/image proxy
  if (pathname === '/_next/image') {
    const imgUrl = url.searchParams.get('url');
    if (imgUrl) {
      // Try static media first
      if (imgUrl.startsWith('/_next/static/media/')) {
        const mediaFile = imgUrl.replace('/_next/static/media/', '');
        const filePath = resolveFile(mediaFile);
        if (filePath) { res.writeHead(200, {'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }
      }
      // Try to find matching file by name from plinko_files
      const imageName = path.basename(imgUrl).split('?')[0];
      const filePath = resolveFile(imageName);
      if (filePath) { res.writeHead(200, {'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }
      // Fallback to CDN for game thumbnails
      if (imgUrl.includes('cdn.rainbet.com') || imgUrl.includes('rbgcdn.com')) {
        // Look for matching webp/svg in plinko_files
        const gameName = imgUrl.match(/\/([^/]+)\.(png|jpg|webp|svg)/);
        if (gameName) {
          const localWebp = resolveFile(gameName[1] + '.webp');
          const localSvg = resolveFile(gameName[1] + '.svg');
          if (localWebp) { res.writeHead(200, {'Content-Type':'image/webp', 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(localWebp)); return; }
          if (localSvg) { res.writeHead(200, {'Content-Type':'image/svg+xml', 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(localSvg)); return; }
        }
      }
    }
    // Transparent pixel fallback
    res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(PIXEL); return;
  }

  // /_next/data (Next.js client-side navigation data) — redirect game routes to full page
  if (pathname.startsWith('/_next/data/')) {
    // Extract target path: /_next/data/BUILD_ID/casino/originals/plinko.json → /casino/originals/plinko
    const dataPath = pathname.replace(/^\/_next\/data\/[^/]+/, '').replace(/\.json$/, '');
    const normData = dataPath.replace(/^\/en\//, '/');
    const gameDataRoutes = {'/casino/originals/plinko':1,'/casino/originals/chicken-cross':1,'/casino/originals/blackjack':1,'/casino/originals/mines-game':1,'/casino':1,'/':1};
    if (gameDataRoutes[normData]) {
      // Return valid JSON so Next.js doesn't 404 — client-side interceptors handle the actual navigation
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ pageProps: {}, __N_SSP: true }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ pageProps: {}, __N_SSP: true }));
    return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CDN ASSETS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // /cdn/currencies/XXX.svg, /cdn/icons/XXX.svg, /cdn/rewards/ranks/XXX.svg, /cdn/games/XXX.png
  if (pathname.startsWith('/cdn/')) {
    const fileName = path.basename(pathname);
    const filePath = resolveFile(fileName);
    if (filePath) { res.writeHead(200, {'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }
    // Try without extension variants
    const nameNoExt = fileName.replace(/\.[^.]+$/, '');
    for (const ext of ['.svg', '.webp', '.png', '.jpg']) {
      const fp = resolveFile(nameNoExt + ext);
      if (fp) { res.writeHead(200, {'Content-Type': getMime(fp), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(fp)); return; }
    }
    res.writeHead(200, {'Content-Type':'image/png'}); res.end(PIXEL); return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PLINKO SPRITE ANIMATIONS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Uses url-map.json for per-frame lookup (suffix varies by frame number)
  if (pathname.includes('/games/')) {
    const spriteLocalFile = SPRITE_URL_MAP[pathname];
    if (spriteLocalFile) {
      const fp = path.join(CAPTURE_FILES, path.basename(spriteLocalFile));
      if (fs.existsSync(fp)) { res.writeHead(200, {'Content-Type': getMime(fp), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(fp)); return; }
    }
    // Single-file assets (orb.png, ball-texture-1.png, corner frames, etc.)
    const fileName = path.basename(pathname);
    const filePath = resolveFile(fileName);
    if (filePath) { res.writeHead(200, {'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }
    res.writeHead(200, {'Content-Type':'image/png'}); res.end(PIXEL); return;
  }

  // Images/icons from direct CDN paths
  if (pathname.includes('/icons/') || pathname.includes('/brand/') || pathname.includes('/currencies/') || pathname.includes('/rewards/')) {
    const fileName = path.basename(pathname);
    const filePath = resolveFile(fileName);
    if (filePath) { res.writeHead(200, {'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }
    res.writeHead(200, {'Content-Type':'image/png'}); res.end(PIXEL); return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ AUDIO FILES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (pathname.startsWith('/audios/') || pathname.includes('/sounds/')) {
    const audioDir = path.join(PLINKO_DIR, '..', 'audios');
    const audioFile = path.join(audioDir, path.basename(pathname));
    if (fs.existsSync(audioFile)) { res.writeHead(200, {'Content-Type': getMime(audioFile), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(audioFile)); return; }
    res.writeHead(204); res.end(); return;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MISC Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }

  // socket.io polling fallback
  if (pathname.startsWith('/socket.io')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sid: 'mock-sid', upgrades: [], pingInterval: 25000, pingTimeout: 5000 }));
    return;
  }

  // Turnstile API mock
  if (pathname.includes('turnstile') || pathname.includes('api.js')) {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end('window.turnstile=window.turnstile||{render:function(e,o){if(o&&o.callback)setTimeout(function(){o.callback("mock-token")},100);return"w"},reset:function(){},remove:function(){},getResponse:function(){return"mock-token"},isExpired:function(){return false}};');
    return;
  }

  // /Images/ static assets (footer icons etc)
  if (pathname.startsWith('/Images/')) {
    const imgFile = path.join(PLINKO_DIR, '..', 'Images', path.basename(pathname));
    if (fs.existsSync(imgFile)) {
      res.writeHead(200, { 'Content-Type': getMime(imgFile), 'Cache-Control': STATIC_CACHE_HEADER });
      res.end(cachedReadFile(imgFile));
      return;
    }
  }

  // Try plinko_files as fallback by basename
  const fileName = path.basename(pathname);
  const filePath = resolveFile(fileName);
  if (filePath) { res.writeHead(200, {'Content-Type': getMime(filePath), 'Cache-Control': STATIC_CACHE_HEADER}); res.end(cachedReadFile(filePath)); return; }

  // If it looks like a page route (no file extension), redirect to /casino rather than bare 404
  if (!pathname.includes('.') || pathname.endsWith('/')) {
    log(`[REDIRECT] Unknown page: ${pathname} -> /casino`);
    res.writeHead(302, { 'Location': '/casino' });
    res.end();
    return;
  }
  // Asset 404
  if (!pathname.includes('.map') && !pathname.includes('favicon'))
    log(`[404] ${pathname}`);
  res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found: ' + pathname);
}

// ============================================================
// EXPORTS (for Vercel serverless function)
// ============================================================
module.exports = handleRequest;

// ============================================================
// STARTUP
// ============================================================
log('Indexing files...');
indexFiles();

// Pre-warm HTML caches at startup so first page load is instant
log('Pre-warming page caches...');
try {
  _homepageCache = buildHomepageHTML();
  _homepageCacheGz = zlib.gzipSync(_homepageCache);
  _homepageBK = getBalanceKey();
  log('  Homepage cached (' + Math.round(_homepageCache.length/1024) + 'KB raw, ' + Math.round(_homepageCacheGz.length/1024) + 'KB gzip)');
} catch(e) { log('  Homepage cache failed: ' + e.message); }
try {
  _plinkoCache = buildPlinkoHTML();
  _plinkoCacheGz = zlib.gzipSync(_plinkoCache);
  _plinkoBK = getBalanceKey();
  log('  Plinko cached (' + Math.round(_plinkoCache.length/1024) + 'KB raw, ' + Math.round(_plinkoCacheGz.length/1024) + 'KB gzip)');
} catch(e) { log('  Plinko cache failed: ' + e.message); }
log('');

if (require.main === module) {
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  log('\u2551       RAINBET PLINKO \u2014 LOCAL SERVER          \u2551');
  log('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563');
  log(`\u2551  URL: http://localhost:${PORT}                  \u2551`);
  log(`\u2551  Balance: $${playerBalance.toFixed(2).padEnd(32)}\u2551`);
  log('\u2551                                              \u2551');
  log('\u2551  Game API:                                   \u2551');
  log('\u2551    POST /api/plinko/drop-ball   \u2014 Play       \u2551');
  log('\u2551    GET  /api/balance            \u2014 Balance    \u2551');
  log('\u2551    GET  /api/stats              \u2014 Stats      \u2551');
  log('\u2551    POST /api/set-balance        \u2014 Set $      \u2551');
  log('\u2551                                              \u2551');
  log('\u2551  Wallet: Rainbet native (built-in)            \u2551');
  log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d');

  // Warm up BJ and CC caches via self-requests (they build inline in handleRequest)
  const warmPaths = ['/casino/originals/blackjack', '/casino/originals/chicken-cross', '/casino/originals/mines-game'];
  warmPaths.forEach(function(p) {
    setTimeout(function() {
      http.get('http://localhost:' + PORT + p, { headers: { 'accept-encoding': 'gzip' } }, function(res) {
        res.resume(); // discard body, just warm the cache
        log('  Cache warmed: ' + p + ' (' + res.statusCode + ')');
      }).on('error', function(err) {
        log('  Cache warmup failed: ' + p + ' - ' + err.message);
      });
    }, 200);
  });
});

// Save state on clean shutdown (force immediate write, bypass debounce)
function saveStateSync() {
  if (IS_VERCEL) return;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = null;
  try {
    const state = {
      playerBalance, vaultBalance, promotionalBalance,
      totalBets, totalWagered, totalProfit, totalDeposited, totalWithdrawn,
      betHistory: betHistory.slice(0, 100),
      transactionHistory: transactionHistory.slice(0, 100),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    log('State saved on shutdown: $' + playerBalance.toFixed(2));
  } catch(e) { log('Failed to save state on shutdown: ' + e.message); }
}
process.on('SIGINT', () => { saveStateSync(); process.exit(0); });
process.on('SIGTERM', () => { saveStateSync(); process.exit(0); });
} // end if (require.main === module)
