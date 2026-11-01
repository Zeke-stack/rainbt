const crypto = require('crypto');
const KENO = require('./keno-paytable.json');

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const ROUL_NET = {
  'straight-up': 35, 'split': 17, 'zero-split': 17, 'street': 11, 'zero-trio': 11, 'six-line': 5,
  'corner': 8, 'first-four': 8, 'low': 1, 'high': 1, 'even': 1, 'odd': 1, 'red': 1, 'black': 1,
  'first-dozen': 2, 'second-dozen': 2, 'third-dozen': 2, 'first-column': 2, 'second-column': 2, 'third-column': 2,
};

const rand = () => crypto.randomInt(0, 1e9) / 1e9;
const r2 = (n) => Math.round(n * 100) / 100;

function rouletteTypes(n) {
  if (n === 0) return [];
  const t = [RED.has(n) ? 'red' : 'black', n % 2 === 0 ? 'even' : 'odd', n <= 18 ? 'low' : 'high'];
  t.push(n <= 12 ? 'first-dozen' : n <= 24 ? 'second-dozen' : 'third-dozen');
  const m = n % 3;
  t.push(m === 1 ? 'first-column' : m === 2 ? 'second-column' : 'third-column');
  return t;
}

function binom(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

function coinflipMultiplier(coins, target) {
  let p = 0;
  for (let i = target; i <= coins; i++) p += binom(coins, i);
  p /= Math.pow(2, coins);
  return Math.floor((0.99 / p) * 10000) / 10000;
}

module.exports = function createOriginals(ctx) {
  const { getBal, setBal, addStats, log } = ctx;

  const reply = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const err = (res, code) => reply(res, { error: code });

  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  // Debits the stake, credits the payout and returns the standard game_result block.
  function settle(name, stake, payout, currency, multiplier) {
    setBal(r2(getBal() - stake + payout));
    addStats(stake, payout);
    log(name.toUpperCase() + ': bet=' + stake.toFixed(2) + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
    return {
      bet_amount: stake.toFixed(2),
      currency: currency || 'USD',
      game_history_id: crypto.randomUUID(),
      game_name: name,
      game_over: true,
      multiplier,
      payout: payout.toFixed(2),
    };
  }

  const handlers = {
    'dice/roll': (b, stake) => {
      const over = !!b.over;
      const roll = Math.round(Number(b.roll) * 100);
      if (!(roll >= 100 && roll <= 9800)) return { error: 'er_invalid_roll' };
      const rollResult = Math.floor(rand() * 10000);
      const win = over ? rollResult >= roll : rollResult < roll;
      const chance = (over ? 10000 - roll : roll) / 10000;
      const mult = Math.floor((0.99 / chance) * 10000) / 10000;
      const payout = win ? r2(stake * mult) : 0;
      const gr = settle('dice', stake, payout, b.currency, win ? mult : 0);
      return { result: { ...gr, roll, over, roll_result: rollResult, roll_convert: rollResult / 100, payout, win }, game_result: gr, wallet: wallet(), balance: getBal() };
    },
    'limbo/jump': (b, stake) => {
      const target = Number(b.target_multiplier);
      if (!(target >= 1.01 && target <= 1000000)) return { error: 'er_invalid_target' };
      const u = rand();
      const m = Math.max(1, Math.floor((0.99 / (1 - u)) * 100) / 100);
      const win = m >= target;
      const payout = win ? r2(stake * target) : 0;
      const gr = settle('limbo', stake, payout, b.currency, win ? target : 0);
      return { result: { ...gr, multiplier: m, target_multiplier: target, payout, win }, game_result: gr, wallet: wallet(), balance: getBal() };
    },
    'keno/play': (b, stake) => {
      const diff = KENO[10] && ['classic', 'low', 'medium', 'high', 'extreme'].includes(b.difficulty) ? b.difficulty : 'classic';
      const grid = diff === 'extreme' ? 56 : 40;
      let sel = b.selected_numbers;
      if (sel && !Array.isArray(sel)) sel = Object.keys(sel).filter((k) => sel[k]).map(Number);
      sel = [...new Set((sel || []).map(Number))].filter((n) => n >= 1 && n <= grid);
      if (sel.length < 1 || sel.length > 10) return { error: 'er_invalid_selection' };
      const pool = Array.from({ length: grid }, (_, i) => i + 1);
      const drawn = [];
      for (let i = 0; i < 10; i++) drawn.push(pool.splice(crypto.randomInt(0, pool.length), 1)[0]);
      const matches = sel.filter((n) => drawn.includes(n)).sort((a, c) => a - c);
      const mult = (KENO[sel.length][diff] || [])[matches.length] || 0;
      const payout = r2(stake * mult);
      const gr = settle('keno', stake, payout, b.currency, mult);
      return {
        game_result: gr,
        keno_result: { difficulty: diff, drawn_numbers: drawn, matches, selected_numbers: sel },
        wallet: wallet(), balance: getBal(),
      };
    },
    'coinflip/play': (b, stake) => {
      const sideOf = (s) => (s === 'tails' ? 'tails' : 'heads');
      const flip = () => (rand() < 0.5 ? 'heads' : 'tails');
      let coins, target, results, win, side, sides;
      if (b.mode === 'classic') {
        sides = (b.sides || []).map(sideOf);
        coins = sides.length;
        if (coins < 1 || coins > 20) return { error: 'er_invalid_coins' };
        target = coins;
        results = sides.map(flip);
        win = results.every((r, i) => r === sides[i]);
      } else {
        coins = Number(b.coins); target = Number(b.target); side = sideOf(b.side);
        if (!(coins >= 1 && coins <= 20 && target >= 1 && target <= coins)) return { error: 'er_invalid_coins' };
        results = Array.from({ length: coins }, flip);
        win = results.filter((r) => r === side).length >= target;
      }
      const mult = coinflipMultiplier(coins, target);
      const payout = win ? r2(stake * mult) : 0;
      const gr = settle('coinflip', stake, payout, b.currency, win ? mult : 0);
      const cf = { mode: b.mode === 'classic' ? 'classic' : 'target', results };
      if (b.mode === 'classic') cf.sides = sides; else { cf.side = side; cf.target = target; cf.sides = results.map(() => side); }
      return { game_result: gr, coinflip_result: cf, wallet: wallet(), balance: getBal() };
    },
    'roulette/play': (b) => {
      const bets = (b.bets || []).map((x) => ({ amount: Number(x.amount), numbers: x.numbers || [], type: x.type }));
      if (!bets.length || bets.some((x) => !(x.amount > 0) || !(x.type in ROUL_NET))) return { error: 'er_invalid_bet' };
      const stake = r2(bets.reduce((s, x) => s + x.amount, 0));
      if (stake > getBal()) return { error: 'er_insufficient_balance' };
      const n = crypto.randomInt(0, 37);
      const types = rouletteTypes(n);
      let payout = 0;
      for (const x of bets) {
        const hit = ['straight-up', 'split', 'zero-split', 'street', 'zero-trio', 'six-line', 'corner', 'first-four'].includes(x.type)
          ? x.numbers.includes(n) : types.includes(x.type);
        if (hit) payout += x.amount * (ROUL_NET[x.type] + 1);
      }
      payout = r2(payout);
      const gr = settle('roulette', stake, payout, b.currency, stake > 0 ? payout / stake : 0);
      return {
        game_result: gr,
        roulette_result: { bets: bets.map((x) => ({ amount: x.amount.toFixed(2), numbers: x.numbers, type: x.type })), winning_number: n, winning_types: types },
        wallet: wallet(), balance: getBal(),
      };
    },
  };

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v1\/original-games\/(dice\/roll|limbo\/jump|keno\/play|coinflip\/play|roulette\/play)$/);
    if (!m || req.method !== 'POST') return false;
    try {
      const b = await ctx.parseBody(req);
      const stake = r2(parseFloat(b.bet_amount) || 0);
      if (m[1] !== 'roulette/play') {
        if (!(stake > 0)) return err(res, 'er_invalid_bet_amount'), true;
        if (stake > getBal()) return err(res, 'er_insufficient_balance'), true;
      }
      reply(res, handlers[m[1]](b, stake));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  };
};
