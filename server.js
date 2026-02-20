const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const CC_ASSETS = path.join(PUBLIC_DIR, 'chicken-cross_files');
const BJ_ASSETS = path.join(PUBLIC_DIR, 'blackjack_files');
const PL_ASSETS = path.join(PUBLIC_DIR, 'plinko_files');

// ═══════════════════════════════════════════════════════════
// SIMULATED USER
// ═══════════════════════════════════════════════════════════
const USER = {
  id: 'demo-user-001',
  public_id: 'demo-pub-001',
  username: 'DemoPlayer',
  email: 'demo@local.dev',
  created_at: '2024-01-01T00:00:00.000Z',
  currency: 'USD',
  balance: 10000.00,
};

function uuid() { return crypto.randomUUID(); }

// ═══════════════════════════════════════════════════════════
// CHICKEN CROSS GAME ENGINE
// ═══════════════════════════════════════════════════════════
const DIFFICULTY = {
  easy:   { factor: 1,  maxRounds: 24 },
  medium: { factor: 3,  maxRounds: 22 },
  hard:   { factor: 5,  maxRounds: 20 },
  expert: { factor: 10, maxRounds: 15 },
};

function calcMultiplier(round, difficultyFactor) {
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

function calcWinPercentage(round, difficultyFactor) {
  var n = 1;
  for (var i = 0; i < round; i++) {
    var a = 25 - difficultyFactor - i;
    var o = 25 - i;
    n = n * (a / o);
  }
  return (n * 100).toFixed(4);
}

var ccActiveSession = null;

function makeCCGameResponse(session) {
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
  };
}

// ═══════════════════════════════════════════════════════════
// PLINKO GAME ENGINE
// ═══════════════════════════════════════════════════════════
const PLINKO_MULTIPLIERS = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [18, 4, 1.9, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.9, 4, 18],
    high: [43, 7, 2, 1.6, 1.2, 1, 0.3, 1, 1.2, 1.6, 2, 7, 43]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [33, 11, 3, 2, 1.5, 1.3, 1.1, 1, 0.7, 1, 1.1, 1.3, 1.5, 2, 3, 11, 33],
    high: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  }
};

function simulatePlinko(rows, risk) {
  var position = rows / 2;
  var path = [];
  for (var i = 0; i < rows; i++) {
    var direction = Math.random() < 0.5 ? -0.5 : 0.5;
    position += direction;
    path.push(direction > 0 ? 'R' : 'L');
  }
  var bucket = Math.round(position);
  var multipliers = PLINKO_MULTIPLIERS[rows][risk];
  var finalBucket = Math.max(0, Math.min(multipliers.length - 1, bucket));
  return { path: path.join(''), bucket: finalBucket, multiplier: multipliers[finalBucket] };
}

var plinkoActiveBet = null;

// ═══════════════════════════════════════════════════════════
// BLACKJACK GAME ENGINE
// ═══════════════════════════════════════════════════════════
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['h','d','c','s'];
const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':10,'Q':10,'K':10,'A':11 };

function createShoe() {
  var shoe = [];
  for (var d = 0; d < 8; d++) {
    for (var r of RANKS) {
      for (var s of SUITS) shoe.push(r + s);
    }
  }
  for (var i = shoe.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shoe[i]; shoe[i] = shoe[j]; shoe[j] = tmp;
  }
  return shoe;
}

function handValue(cards) {
  var total = 0, aces = 0;
  for (var c of cards) {
    var rank = c.slice(0, -1);
    if (rank === 'A') { aces++; total += 11; }
    else { total += RANK_VALUES[rank] || 0; }
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBlackjack(cards) { return cards.length === 2 && handValue(cards) === 21; }
function cardRankValue(card) { return RANK_VALUES[card.slice(0, -1)] || 0; }

var bjActiveGame = null;
var shoe = createShoe();

function dealCard() {
  if (shoe.length < 52) shoe = createShoe();
  return shoe.pop();
}

function makePlayerHand(cards, handId, isActive) {
  var val = handValue(cards);
  return {
    handId: handId, cards: cards.slice(), isStand: false, isBust: val > 21,
    isDoubled: false, isActive: isActive, isWin: false, result: null,
    availableActions: {
      hit: val < 21 && cards.length >= 2, stand: true,
      double: cards.length === 2 && val < 21,
      split: cards.length === 2 && cardRankValue(cards[0]) === cardRankValue(cards[1]),
    }
  };
}

function updateAvailableActions(hand, isSplit) {
  var val = handValue(hand.cards);
  if (hand.isStand || hand.isBust || val === 21) {
    hand.availableActions = { hit: false, stand: false, double: false, split: false };
    return;
  }
  hand.availableActions = {
    hit: val < 21, stand: true,
    double: hand.cards.length === 2 && !hand.isDoubled,
    split: !isSplit && hand.cards.length === 2 && cardRankValue(hand.cards[0]) === cardRankValue(hand.cards[1]),
  };
}

function buildGameState(game) {
  var isRevealed = game.status === 'finished' || game.status === 'dealerTurn';
  var playerHands = game.playerHands.map(function(h) {
    return {
      handId: h.handId, cards: h.cards.slice(), isStand: h.isStand,
      isBust: h.isBust, isDoubled: h.isDoubled, isActive: h.isActive,
      isWin: h.isWin, result: h.result,
      availableActions: Object.assign({}, h.availableActions),
    };
  });
  return {
    game_history_id: game.id, game_action_id: game.actionId,
    status: game.status, playerHands: playerHands,
    dealerHand: { cards: isRevealed ? game.dealerCards.slice() : (game.dealerCards.length > 0 ? [game.dealerCards[0]] : []), isRevealed: isRevealed },
    currentTurn: game.currentTurn, currentHandIndex: game.currentHandIndex,
    insuranceOffered: game.insuranceOffered, insuranceTaken: game.insuranceTaken,
    insuranceWon: game.insuranceWon || false, isSplit: game.isSplit,
    betAmount: game.betAmount, currency: game.currency,
  };
}

function playDealerHand(game) {
  game.status = 'dealerTurn';
  while (handValue(game.dealerCards) < 17) game.dealerCards.push(dealCard());
}

function resolveHands(game) {
  game.status = 'finished';
  var dealerVal = handValue(game.dealerCards);
  var dealerBust = dealerVal > 21;
  var dealerBJ = isBlackjack(game.dealerCards);
  var totalPayout = 0;

  for (var hand of game.playerHands) {
    var playerVal = handValue(hand.cards);
    var playerBJ = isBlackjack(hand.cards) && !game.isSplit;

    if (hand.isBust) { hand.result = 'lose'; hand.isWin = false; }
    else if (playerBJ && dealerBJ) {
      hand.result = 'push'; hand.isWin = false;
      totalPayout += (hand.isDoubled ? game.betAmount * 2 : game.betAmount);
    } else if (playerBJ) {
      hand.result = 'win'; hand.isWin = true;
      totalPayout += game.betAmount + game.betAmount * 1.5;
    } else if (dealerBJ) { hand.result = 'lose'; hand.isWin = false; }
    else if (dealerBust) {
      hand.result = 'win'; hand.isWin = true;
      var bet = hand.isDoubled ? game.betAmount * 2 : game.betAmount;
      totalPayout += bet * 2;
    } else if (playerVal > dealerVal) {
      hand.result = 'win'; hand.isWin = true;
      var bet2 = hand.isDoubled ? game.betAmount * 2 : game.betAmount;
      totalPayout += bet2 * 2;
    } else if (playerVal === dealerVal) {
      hand.result = 'push'; hand.isWin = false;
      totalPayout += (hand.isDoubled ? game.betAmount * 2 : game.betAmount);
    } else { hand.result = 'lose'; hand.isWin = false; }

    hand.isActive = false;
    hand.availableActions = { hit: false, stand: false, double: false, split: false };
  }

  if (game.insuranceTaken && dealerBJ) {
    game.insuranceWon = true;
    totalPayout += game.betAmount * 0.5 * 3;
  }

  if (totalPayout > 0) {
    USER.balance += totalPayout;
    console.log('\x1b[32m[PAYOUT]\x1b[0m $' + totalPayout.toFixed(2) + ' | Balance: $' + USER.balance.toFixed(2));
  } else {
    console.log('\x1b[31m[NO PAYOUT]\x1b[0m Balance: $' + USER.balance.toFixed(2));
  }
  game.totalPayout = totalPayout;
}

function checkAndFinishGame(game) {
  var allDone = game.playerHands.every(function(h) { return h.isStand || h.isBust || handValue(h.cards) === 21; });
  if (allDone) {
    var anyAlive = game.playerHands.some(function(h) { return !h.isBust; });
    if (anyAlive) playDealerHand(game);
    resolveHands(game);
    return true;
  }
  return false;
}

function advanceToNextHand(game) {
  for (var i = game.currentHandIndex + 1; i < game.playerHands.length; i++) {
    if (!game.playerHands[i].isStand && !game.playerHands[i].isBust) {
      game.currentHandIndex = i;
      game.playerHands[i].isActive = true;
      updateAvailableActions(game.playerHands[i], game.isSplit);
      if (game.isSplit && game.playerHands[i].cards.length === 1) {
        var splitRank = game.playerHands[i].cards[0].slice(0, -1);
        game.playerHands[i].cards.push(dealCard());
        if (splitRank === 'A') {
          game.playerHands[i].isStand = true;
          game.playerHands[i].isActive = false;
          game.playerHands[i].availableActions = { hit: false, stand: false, double: false, split: false };
          if (!checkAndFinishGame(game)) advanceToNextHand(game);
          return;
        }
        updateAvailableActions(game.playerHands[i], game.isSplit);
      }
      return;
    }
  }
  checkAndFinishGame(game);
}

// ═══════════════════════════════════════════════════════════
// FILE INDEX - Index both asset directories
// ═══════════════════════════════════════════════════════════
function indexDir(dir) {
  var idx = {};
  if (!fs.existsSync(dir)) return idx;
  for (var file of fs.readdirSync(dir)) {
    var match = file.match(/^[a-f0-9]+_(.+)$/);
    if (match) idx[match[1]] = file;
    idx[file] = file;
  }
  return idx;
}

var CC_INDEX = indexDir(CC_ASSETS);
var BJ_INDEX = indexDir(BJ_ASSETS);
console.log('[Server] Indexed ' + Object.keys(CC_INDEX).length + ' chicken-cross files');
console.log('[Server] Indexed ' + Object.keys(BJ_INDEX).length + ' blackjack files');

function resolveAssetFile(name, assetDir, fileIndex) {
  var direct = path.join(assetDir, name);
  if (fs.existsSync(direct)) return direct;
  if (fileIndex[name]) return path.join(assetDir, fileIndex[name]);
  var hyphenName = name.replace(/^(\d+)\./, '$1-');
  if (fileIndex[hyphenName]) return path.join(assetDir, fileIndex[hyphenName]);
  var enc = name.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
  if (fileIndex[enc]) return path.join(assetDir, fileIndex[enc]);
  try { var dec = decodeURIComponent(name); if (fileIndex[dec]) return path.join(assetDir, fileIndex[dec]); } catch (e) {}
  return null;
}

function resolveAnyAsset(name, preferGame) {
  if (preferGame === 'blackjack') {
    return resolveAssetFile(name, BJ_ASSETS, BJ_INDEX) || resolveAssetFile(name, CC_ASSETS, CC_INDEX);
  }
  return resolveAssetFile(name, CC_ASSETS, CC_INDEX) || resolveAssetFile(name, BJ_ASSETS, BJ_INDEX);
}

function getPreferredGame(req) {
  var ref = req.headers['referer'] || '';
  if (ref.includes('blackjack')) return 'blackjack';
  if (ref.includes('chicken-cross')) return 'chicken-cross';
  return null;
}

var MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.webp': 'image/webp', '.webm': 'video/webm', '.mp4': 'video/mp4', '.avif': 'image/avif',
};

function sendJSON(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req, cb) {
  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() {
    try { cb(null, JSON.parse(body)); } catch(e) { cb(e, null); }
  });
}

function serveFile(res, filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    var ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════
var server = http.createServer(function (req, res) {
  var urlObj = new URL(req.url, 'http://localhost:' + PORT);
  var pathname = decodeURIComponent(urlObj.pathname);
  var preferGame = getPreferredGame(req);

  // CORS + Cache control
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-requested-with');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── Connection check ──
  if (pathname === '/api/ping') { res.writeHead(204); res.end(); return; }

  // ── Client error reporting ──
  if (pathname === '/api/client-error') {
    readBody(req, function(err, d) {
      if (d) console.log('\x1b[31m[CLIENT ERROR]\x1b[0m', d.error);
      res.writeHead(204); res.end();
    });
    return;
  }

  // ══════════════════════════════════════════════════════════
  // AUTH / USER / WALLET ENDPOINTS (shared)
  // ══════════════════════════════════════════════════════════
  
  // Log all API requests for debugging
  if (pathname.startsWith('/api/')) {
    console.log('\x1b[36m[API]\x1b[0m ' + req.method + ' ' + pathname);
  }
  
  if (pathname === '/api/auth/session') {
    return sendJSON(res, {
      user: { access_token: 'demo-token', name: USER.username, email: USER.email, image: null },
      expires: '2099-12-31T23:59:59.999Z'
    });
  }
  if (pathname === '/api/auth/csrf') return sendJSON(res, { csrfToken: 'demo-csrf' });
  if (pathname === '/api/auth/providers') return sendJSON(res, {});
  if (pathname.startsWith('/api/auth/')) return sendJSON(res, {});

  if (pathname === '/v1/user/wallet') {
    return sendJSON(res, {
      active: { primary: USER.balance, promotional: 0, vault: 0, currency: USER.currency }
    });
  }
  if (pathname.startsWith('/v1/user/balance/vault')) return sendJSON(res, { amount: 0 });
  if (pathname.startsWith('/v1/user/balance/')) return sendJSON(res, { amount: USER.balance });

  if (pathname === '/v1/auth/me') {
    return sendJSON(res, { id: USER.id, username: USER.username, email: USER.email, currency: USER.currency });
  }
  if (pathname === '/v1/user' || pathname === '/v1/user/me' || pathname.startsWith('/v1/user?')) {
    return sendJSON(res, {
      username: USER.username, email: USER.email, currency: USER.currency,
      created_at: USER.created_at, deleted: false,
      auth: { type: 'email', email_verified_at: USER.created_at, has_2fa: false },
      profile: { registered_at: USER.created_at, wagered_amount: 0, bet_count: 0 },
      preferences: { language: 'en', public_profile: true, public_statistics: true, default_payment_method: null },
      promotion: { eligible: true },
      affiliate: { eligible: false, referred_by: null },
      chat: { eligible: true, accepted_rules: true },
      rank: { bet_rank: 0, bet_rank_division: 0, next_rank: 1, next_rank_division: 0, required_to_next_rank_usd: 1000, percentage: 0 },
      intercom: null, kyc_level_required_to_deposit: 0, self_exclusion: null,
    });
  }
  if (pathname === '/v1/user/settings') return sendJSON(res, {});
  if (pathname === '/v1/user/recent-games') return sendJSON(res, []);
  if (pathname.startsWith('/v1/user/') && !pathname.includes('balance') && !pathname.includes('wallet')) return sendJSON(res, {});

  // ══════════════════════════════════════════════════════════
  // CHICKEN CROSS GAME ENDPOINTS
  // ══════════════════════════════════════════════════════════
  if (pathname === '/api/v1/original-games/chicken-cross/active-session') {
    if (ccActiveSession && !ccActiveSession.gameOver) {
      return sendJSON(res, makeCCGameResponse(ccActiveSession));
    }
    return sendJSON(res, { error: 'no_active_session' });
  }

  if (pathname === '/api/v1/original-games/chicken-cross/play' && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { error: 'er_general' }, 400);
      if (ccActiveSession && !ccActiveSession.gameOver) return sendJSON(res, { error: 'er_active_game' });
      var betAmount = parseFloat(data.bet_amount) || 1;
      var difficulty = data.difficulty || 'easy';
      if (betAmount > USER.balance) return sendJSON(res, { error: 'er_insufficient_balance' });
      if (!DIFFICULTY[difficulty]) return sendJSON(res, { error: 'er_invalid_difficulty' });
      USER.balance -= betAmount;
      console.log('\x1b[33m[CC BET]\x1b[0m $' + betAmount.toFixed(2) + ' ' + difficulty + ' | Balance: $' + USER.balance.toFixed(2));
      ccActiveSession = {
        id: uuid(), betAmount: betAmount, balanceType: data.balance_type || 'primary',
        currency: data.currency || USER.currency, difficulty: difficulty,
        round: 0, currentMultiplier: 0, payout: '0', gameOver: false, results: [],
      };
      return sendJSON(res, makeCCGameResponse(ccActiveSession));
    });
    return;
  }

  if (pathname === '/api/v1/original-games/chicken-cross/autoplay' && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { error: 'er_general' }, 400);
      if (ccActiveSession && !ccActiveSession.gameOver) return sendJSON(res, { error: 'er_active_game' });
      var betAmount = parseFloat(data.bet_amount) || 1;
      var difficulty = data.difficulty || 'easy';
      var maxRounds = (data.lane_index || 0) + 1;
      if (betAmount > USER.balance) return sendJSON(res, { error: 'er_insufficient_balance' });
      if (!DIFFICULTY[difficulty]) return sendJSON(res, { error: 'er_invalid_difficulty' });
      USER.balance -= betAmount;
      var diff = DIFFICULTY[difficulty];
      var session = { id: uuid(), betAmount: betAmount, currency: data.currency || USER.currency, difficulty: difficulty, round: 0, currentMultiplier: 0, payout: '0', gameOver: false, results: [] };
      for (var r = 1; r <= maxRounds && r <= diff.maxRounds; r++) {
        var mult = calcMultiplier(r, diff.factor);
        var winPct = calcWinPercentage(r, diff.factor);
        var threshold = parseFloat(winPct);
        var roll = Math.random() * 100;
        var didWin = roll >= threshold;
        var actionId = uuid();
        if (didWin) {
          session.round = r; session.currentMultiplier = mult;
          session.results.push({ win_percentage: winPct, multiplier: mult, can_cashout: true, game_action_id: actionId });
        } else {
          session.round = r; session.currentMultiplier = 0; session.gameOver = true;
          session.results.push({ win_percentage: winPct, multiplier: 0, can_cashout: false, game_action_id: actionId });
          break;
        }
      }
      if (!session.gameOver) {
        session.gameOver = true;
        var payout = betAmount * session.currentMultiplier;
        session.payout = payout.toFixed(2);
        USER.balance += payout;
        console.log('\x1b[32m[CC AUTOPLAY WIN]\x1b[0m $' + betAmount.toFixed(2) + ' → $' + session.payout + ' | Balance: $' + USER.balance.toFixed(2));
      } else {
        console.log('\x1b[31m[CC AUTOPLAY LOSS]\x1b[0m $' + betAmount.toFixed(2) + ' | Balance: $' + USER.balance.toFixed(2));
      }
      ccActiveSession = null;
      return sendJSON(res, makeCCGameResponse(session));
    });
    return;
  }

  var ccActionMatch = pathname.match(/^\/api\/v1\/original-games\/chicken-cross\/([a-f0-9-]+)\/action$/);
  if (ccActionMatch && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { error: 'er_general' }, 400);
      if (!ccActiveSession || ccActiveSession.gameOver || ccActiveSession.id !== ccActionMatch[1]) {
        return sendJSON(res, { error: 'er_no_active_session' });
      }
      var diff = DIFFICULTY[ccActiveSession.difficulty];
      var nextRound = ccActiveSession.round + 1;
      if (nextRound > diff.maxRounds) return sendJSON(res, { error: 'er_max_rounds' });
      var mult = calcMultiplier(nextRound, diff.factor);
      var winPct = calcWinPercentage(nextRound, diff.factor);
      var threshold = parseFloat(winPct);
      var roll = Math.random() * 100;
      var didLose = roll >= threshold;
      var actionId = uuid();
      if (didLose) {
        ccActiveSession.round = nextRound; ccActiveSession.currentMultiplier = 0;
        ccActiveSession.gameOver = true;
        ccActiveSession.results.push({ win_percentage: winPct, multiplier: 0, can_cashout: false, game_action_id: actionId });
        console.log('\x1b[31m[CC LOSS]\x1b[0m Round ' + nextRound + ' | Balance: $' + USER.balance.toFixed(2));
      } else {
        ccActiveSession.round = nextRound; ccActiveSession.currentMultiplier = mult;
        ccActiveSession.results.push({ win_percentage: winPct, multiplier: mult, can_cashout: true, game_action_id: actionId });
        console.log('\x1b[32m[CC WIN]\x1b[0m Round ' + nextRound + ' | ' + mult + 'x');
      }
      var resp = makeCCGameResponse(ccActiveSession);
      if (ccActiveSession.gameOver) ccActiveSession = null;
      return sendJSON(res, resp);
    });
    return;
  }

  var ccCashoutMatch = pathname.match(/^\/api\/v1\/original-games\/chicken-cross\/([a-f0-9-]+)\/cashout$/);
  if (ccCashoutMatch && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { error: 'er_general' }, 400);
      if (!ccActiveSession || ccActiveSession.gameOver || ccActiveSession.id !== ccCashoutMatch[1]) {
        return sendJSON(res, { error: 'er_no_active_session' });
      }
      if (ccActiveSession.round === 0) return sendJSON(res, { error: 'er_cannot_cashout' });
      var payout = ccActiveSession.betAmount * ccActiveSession.currentMultiplier;
      ccActiveSession.payout = payout.toFixed(2);
      ccActiveSession.gameOver = true;
      USER.balance += payout;
      console.log('\x1b[32m[CC CASHOUT]\x1b[0m $' + ccActiveSession.betAmount.toFixed(2) + ' → $' + ccActiveSession.payout + ' | Balance: $' + USER.balance.toFixed(2));
      var resp = makeCCGameResponse(ccActiveSession);
      ccActiveSession = null;
      return sendJSON(res, resp);
    });
    return;
  }

  // ══════════════════════════════════════════════════════════
  // PLINKO GAME ENDPOINTS
  // ══════════════════════════════════════════════════════════
  if (pathname === '/api/v1/original-games/plinko/active-session') {
    return sendJSON(res, { data: { error: 'er_no_active_session' } });
  }

  if (pathname === '/api/v1/original-games/plinko/play' && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { error: 'er_general' }, 400);
      var betAmount = parseFloat(data.bet_amount) || 1;
      var rows = parseInt(data.rows) || 16;
      var risk = data.risk || 'low';
      if (betAmount > USER.balance) return sendJSON(res, { error: 'er_insufficient_balance' });
      if (![8, 12, 16].includes(rows)) return sendJSON(res, { error: 'er_invalid_rows' });
      if (!['low', 'medium', 'high'].includes(risk)) return sendJSON(res, { error: 'er_invalid_risk' });
      
      USER.balance -= betAmount;
      var result = simulatePlinko(rows, risk);
      var payout = betAmount * result.multiplier;
      USER.balance += payout;
      
      console.log('\\x1b[35m[PLINKO]\\x1b[0m $' + betAmount.toFixed(2) + ' × ' + result.multiplier + ' = $' + payout.toFixed(2) + ' (rows:' + rows + ' risk:' + risk + ' bucket:' + result.bucket + ') | Balance: $' + USER.balance.toFixed(2));
      
      return sendJSON(res, {
        game_result: {
          game_history_id: uuid(),
          game_name: 'plinko',
          bet_amount: betAmount,
          currency: data.currency || USER.currency,
          payout: payout.toFixed(2),
          multiplier: result.multiplier,
          game_over: true
        },
        plinko_result: {
          path: result.path,
          bucket: result.bucket,
          multiplier: result.multiplier,
          rows: rows,
          risk: risk
        }
      });
    });
    return;
  }

  // ══════════════════════════════════════════════════════════
  // BLACKJACK GAME ENDPOINTS
  // ══════════════════════════════════════════════════════════
  if (pathname === '/api/v1/original-games/blackjack/active-session') {
    if (bjActiveGame && bjActiveGame.status !== 'finished') {
      return sendJSON(res, { data: { gameState: buildGameState(bjActiveGame) } });
    }
    return sendJSON(res, { data: { error: 'er_no_active_game' } });
  }

  if (pathname.match(/^\/api\/v1\/original-games\/[^/]+\/freeplays$/)) {
    return sendJSON(res, { game: null, freeplays: [] });
  }

  if (pathname === '/api/v1/original-games/blackjack/play' && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { data: { error: 'er_general' } }, 400);
      if (bjActiveGame && bjActiveGame.status !== 'finished') return sendJSON(res, { data: { error: 'er_active_game' } });
      var betAmount = parseFloat(data.bet_amount) || 1;
      if (betAmount > USER.balance) return sendJSON(res, { data: { error: 'er_insufficient_balance' } });
      USER.balance -= betAmount;
      console.log('\x1b[33m[BJ BET]\x1b[0m $' + betAmount.toFixed(2) + ' | Balance: $' + USER.balance.toFixed(2));
      var playerCards = [dealCard(), dealCard()];
      var dealerCards = [dealCard(), dealCard()];
      bjActiveGame = {
        id: uuid(), actionId: uuid(), betAmount: betAmount, currency: data.currency || USER.currency,
        status: 'playerTurn', playerHands: [makePlayerHand(playerCards, 0, true)],
        dealerCards: dealerCards, currentTurn: 1, currentHandIndex: 0,
        insuranceOffered: false, insuranceTaken: false, insuranceWon: false, isSplit: false, totalPayout: 0,
      };
      var dealerUpRank = dealerCards[0].slice(0, -1);
      if (dealerUpRank === 'A') bjActiveGame.insuranceOffered = true;
      var playerBJ = isBlackjack(playerCards);
      var dealerBJ = isBlackjack(dealerCards);
      if (playerBJ || dealerBJ) {
        if (dealerBJ && dealerUpRank !== 'A') {
          bjActiveGame.insuranceOffered = false;
          playDealerHand(bjActiveGame); resolveHands(bjActiveGame);
          var r = { data: { gameState: buildGameState(bjActiveGame) } }; bjActiveGame = null; return sendJSON(res, r);
        }
        if (playerBJ && !bjActiveGame.insuranceOffered) {
          playDealerHand(bjActiveGame); resolveHands(bjActiveGame);
          var r2 = { data: { gameState: buildGameState(bjActiveGame) } }; bjActiveGame = null; return sendJSON(res, r2);
        }
        if (playerBJ && !dealerBJ) {
          bjActiveGame.playerHands[0].availableActions = { hit: false, stand: false, double: false, split: false };
        }
      }
      return sendJSON(res, { data: { gameState: buildGameState(bjActiveGame) } });
    });
    return;
  }

  if (pathname === '/api/v1/original-games/blackjack/freeplay' && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { data: { error: 'er_general' } }, 400);
      var playerCards = [dealCard(), dealCard()];
      var dealerCards = [dealCard(), dealCard()];
      bjActiveGame = {
        id: uuid(), actionId: uuid(), betAmount: 10, currency: USER.currency,
        status: 'playerTurn', playerHands: [makePlayerHand(playerCards, 0, true)],
        dealerCards: dealerCards, currentTurn: 1, currentHandIndex: 0,
        insuranceOffered: false, insuranceTaken: false, insuranceWon: false, isSplit: false, totalPayout: 0, isFreeplay: true,
      };
      if (dealerCards[0].slice(0, -1) === 'A') bjActiveGame.insuranceOffered = true;
      return sendJSON(res, { data: { gameState: buildGameState(bjActiveGame) } });
    });
    return;
  }

  var bjActionMatch = pathname.match(/^\/api\/v1\/original-games\/blackjack\/([a-f0-9-]+)\/([a-f0-9-]+)\/action$/);
  if (bjActionMatch && req.method === 'POST') {
    readBody(req, function(err, data) {
      if (err) return sendJSON(res, { data: { error: 'er_general' } }, 400);
      if (!bjActiveGame || bjActiveGame.status === 'finished' || bjActiveGame.id !== bjActionMatch[1]) {
        return sendJSON(res, { data: { error: 'er_no_active_game' } });
      }
      var actionName = data.action_name || {};
      var actionKey = Object.keys(actionName)[0];
      var actionValue = actionName[actionKey];
      bjActiveGame.actionId = uuid();
      console.log('\x1b[36m[BJ ACTION]\x1b[0m ' + actionKey);

      if (actionKey === 'insurance') {
        if (bjActiveGame.insuranceOffered) {
          bjActiveGame.insuranceOffered = false;
          if (actionValue === true) {
            var cost = bjActiveGame.betAmount * 0.5;
            if (cost <= USER.balance) { USER.balance -= cost; bjActiveGame.insuranceTaken = true; }
          }
          var pBJ = isBlackjack(bjActiveGame.playerHands[0].cards);
          var dBJ = isBlackjack(bjActiveGame.dealerCards);
          if (dBJ || pBJ) {
            playDealerHand(bjActiveGame); resolveHands(bjActiveGame);
            var r = { data: { gameState: buildGameState(bjActiveGame) } }; bjActiveGame = null; return sendJSON(res, r);
          }
          return sendJSON(res, { data: { gameState: buildGameState(bjActiveGame) } });
        }
        return sendJSON(res, { data: { error: 'er_general' } });
      }

      var hand = bjActiveGame.playerHands[bjActiveGame.currentHandIndex];
      if (!hand || hand.isStand || hand.isBust) return sendJSON(res, { data: { error: 'er_general' } });

      if (actionKey === 'hit') {
        hand.cards.push(dealCard());
        var val = handValue(hand.cards);
        if (val > 21) {
          hand.isBust = true; hand.isActive = false;
          hand.availableActions = { hit: false, stand: false, double: false, split: false };
          if (!checkAndFinishGame(bjActiveGame)) advanceToNextHand(bjActiveGame);
        } else if (val === 21) {
          hand.isStand = true; hand.isActive = false;
          hand.availableActions = { hit: false, stand: false, double: false, split: false };
          if (!checkAndFinishGame(bjActiveGame)) advanceToNextHand(bjActiveGame);
        } else { updateAvailableActions(hand, bjActiveGame.isSplit); }
      } else if (actionKey === 'stand') {
        hand.isStand = true; hand.isActive = false;
        hand.availableActions = { hit: false, stand: false, double: false, split: false };
        if (!checkAndFinishGame(bjActiveGame)) advanceToNextHand(bjActiveGame);
      } else if (actionKey === 'double') {
        if (hand.cards.length !== 2) return sendJSON(res, { data: { error: 'er_general' } });
        if (bjActiveGame.betAmount > USER.balance) return sendJSON(res, { data: { error: 'er_insufficient_balance' } });
        USER.balance -= bjActiveGame.betAmount;
        hand.isDoubled = true; hand.cards.push(dealCard());
        if (handValue(hand.cards) > 21) hand.isBust = true;
        hand.isStand = true; hand.isActive = false;
        hand.availableActions = { hit: false, stand: false, double: false, split: false };
        if (!checkAndFinishGame(bjActiveGame)) advanceToNextHand(bjActiveGame);
      } else if (actionKey === 'split') {
        if (hand.cards.length !== 2 || cardRankValue(hand.cards[0]) !== cardRankValue(hand.cards[1]) || bjActiveGame.isSplit) {
          return sendJSON(res, { data: { error: 'er_general' } });
        }
        if (bjActiveGame.betAmount > USER.balance) return sendJSON(res, { data: { error: 'er_insufficient_balance' } });
        USER.balance -= bjActiveGame.betAmount;
        bjActiveGame.isSplit = true;
        var c1 = hand.cards[0], c2 = hand.cards[1], sr = c1.slice(0, -1);
        var h1 = makePlayerHand([c1, dealCard()], 0, true);
        var h2 = makePlayerHand([c2], 1, false);
        if (sr === 'A') {
          h1.isStand = true; h1.isActive = false; h1.availableActions = { hit: false, stand: false, double: false, split: false };
          h2.cards.push(dealCard()); h2.isStand = true; h2.isActive = false; h2.availableActions = { hit: false, stand: false, double: false, split: false };
        } else { updateAvailableActions(h1, true); }
        bjActiveGame.playerHands = [h1, h2]; bjActiveGame.currentHandIndex = 0;
        if (sr === 'A') checkAndFinishGame(bjActiveGame);
      } else { return sendJSON(res, { data: { error: 'er_general' } }); }

      var gs = buildGameState(bjActiveGame || { id: bjActionMatch[1], actionId: uuid(), status: 'finished', playerHands: [], dealerCards: [], currentTurn: 0, currentHandIndex: 0, insuranceOffered: false, insuranceTaken: false, insuranceWon: false, isSplit: false, betAmount: 0, currency: USER.currency });
      if (bjActiveGame && bjActiveGame.status === 'finished') bjActiveGame = null;
      return sendJSON(res, { data: { gameState: gs } });
    });
    return;
  }

  if (pathname.startsWith('/api/v1/original-games/freeplays')) return sendJSON(res, { game: null, freeplays: [] });

  // ══════════════════════════════════════════════════════════
  // PUBLIC / MISC ENDPOINTS
  // ══════════════════════════════════════════════════════════
  if (pathname === '/v1/public/currencies') {
    return sendJSON(res, {
      USD: { rate: 1, display: { isDefault: true, prepend: '$', append: null, icon: 'https://assets.rbgcdn.com/223k2P3/raw/currencies/usd.svg' } }
    });
  }
  if (pathname === '/v1/public/ip') return sendJSON(res, { country: 'US', region: '' });
  if (pathname === '/v1/public/ranks') return sendJSON(res, { ranks: [] });
  if (pathname.startsWith('/v1/public/translations')) return sendJSON(res, {});
  if (pathname === '/v1/public/search') return sendJSON(res, {});
  if (pathname === '/v1/slots/list') return sendJSON(res, { count: 0, games: [] });
  if (pathname.startsWith('/v1/slots/')) return sendJSON(res, {});
  if (pathname === '/v1/game-history') return sendJSON(res, []);
  if (pathname === '/v1/raffles/my-tickets') return sendJSON(res, { tickets: [] });
  if (pathname.startsWith('/v1/rewards/')) return sendJSON(res, { rewards: [], total: 0 });
  if (pathname === '/v1/crypto') return sendJSON(res, [
    { code: 'USD', name: 'US Dollar', rate: 1, fiat: true, icon: '' },
    { code: 'BTC', name: 'Bitcoin', rate: 0.0000145, fiat: false, icon: '' },
    { code: 'ETH', name: 'Ethereum', rate: 0.000285, fiat: false, icon: '' },
  ]);
  if (pathname === '/user/update-settings') return sendJSON(res, { success: true });

  // Catch-all API
  if (pathname.startsWith('/api/') || pathname.startsWith('/v1/')) {
    return sendJSON(res, { success: true, result: null });
  }

  // ══════════════════════════════════════════════════════════
  // STATIC FILE SERVING
  // ══════════════════════════════════════════════════════════

  // Game HTML pages
  if (pathname === '/casino/originals/chicken-cross' || pathname === '/en/casino/originals/chicken-cross') {
    return serveFile(res, path.join(PUBLIC_DIR, 'chicken-cross.html')) || send404(res, pathname);
  }
  if (pathname === '/casino/originals/blackjack' || pathname === '/en/casino/originals/blackjack') {
    return serveFile(res, path.join(PUBLIC_DIR, 'blackjack.html')) || send404(res, pathname);
  }
  if (pathname === '/casino/originals/plinko' || pathname === '/en/casino/originals/plinko') {
    return serveFile(res, path.join(PUBLIC_DIR, 'plinko.html')) || send404(res, pathname);
  }

  // Root → launcher page
  if (pathname === '/' || pathname === '/index.html') {
    return serveFile(res, path.join(PUBLIC_DIR, 'index.html')) || send404(res, pathname);
  }

  // Direct asset directory access
  if (pathname.startsWith('/chicken-cross_files/') || pathname.startsWith('/blackjack_files/') || pathname.startsWith('/plinko_files/')) {
    var fp = path.join(PUBLIC_DIR, pathname);
    if (serveFile(res, fp)) return;
    // Try subdirectory (assets/)
    var sub = path.join(PUBLIC_DIR, pathname);
    if (serveFile(res, sub)) return;
  }

  // Resolve bare asset names (e.g. /rainbet-logo.svg, /headset-icon.svg)
  var basename = path.basename(pathname);
  var assetResolved = resolveAnyAsset(basename, preferGame);
  if (assetResolved && serveFile(res, assetResolved)) return;

  // Silent MP3 for missing audio
  if (pathname.endsWith('.mp3') || pathname.endsWith('.wav') || pathname.endsWith('.ogg')) {
    var silentMp3 = Buffer.from('//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVV', 'base64');
    res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
    res.end(silentMp3);
    return;
  }

  // _next/data JSON
  if (pathname.startsWith('/_next/data/')) {
    return sendJSON(res, { pageProps: { session: { user: { access_token: 'demo-token', name: USER.username }, expires: '2099-12-31T23:59:59.999Z' } }, __N_SSP: true });
  }

  // _next asset mapping (webpack chunks, CSS, etc.)
  if (pathname.startsWith('/_next/')) {
    var assetName = path.basename(pathname);
    var resolved = resolveAnyAsset(assetName, preferGame);
    if (!resolved) resolved = resolveAnyAsset(path.basename(urlObj.pathname), preferGame);
    if (resolved && serveFile(res, resolved)) return;
    var ext3 = path.extname(pathname).toLowerCase();
    if (ext3 === '.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); res.end('// not available'); return; }
    if (ext3 === '.css') { res.writeHead(200, { 'Content-Type': 'text/css' }); res.end('/* not available */'); return; }
  }

  // _next/image proxy
  if (pathname.startsWith('/_next/image')) {
    var imgUrl = urlObj.searchParams.get('url');
    if (imgUrl) {
      var imgResolved = resolveAnyAsset(path.basename(imgUrl), preferGame);
      if (imgResolved && serveFile(res, imgResolved)) return;
    }
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    return;
  }

  // Generic file in public/
  var fp3 = path.join(PUBLIC_DIR, pathname);
  if (serveFile(res, fp3)) return;

  send404(res, pathname);
});

function send404(res, pathname) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  console.log('[404] ' + pathname);
  res.end('Not Found: ' + pathname);
}

// Start server only when running locally (not on Vercel)
if (require.main === module) {
  server.listen(PORT, function () {
    console.log('\n  Rainbet Games Server');
    console.log('  =====================');
    console.log('  http://localhost:' + PORT);
    console.log('  http://localhost:' + PORT + '/casino/originals/chicken-cross');
    console.log('  http://localhost:' + PORT + '/casino/originals/blackjack');  console.log('  http://localhost:' + PORT + '/casino/originals/plinko');    console.log('  Balance: $' + USER.balance.toFixed(2) + ' USD');
    console.log('  Mode: DEMO\n');
  });
}

// Export for Vercel serverless functions
module.exports = server;
