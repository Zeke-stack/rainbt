const crypto = require('crypto');

const ROWS = 8;
// tiles per row and whether exactly one tile is safe (win-index) or exactly one is a trap (lose-index)
const DIFF = {
  easy: { tiles: 4, safe: 3 },
  medium: { tiles: 3, safe: 2 },
  hard: { tiles: 2, safe: 1 },
  expert: { tiles: 3, safe: 1 },
  master: { tiles: 4, safe: 1 },
};

const r2 = (n) => Math.round(n * 100) / 100;

function roundMultiplier(diff, round) {
  const { tiles, safe } = DIFF[diff];
  const v = Math.pow(tiles / safe, round - 1) * ((tiles * 0.96) / safe);
  return Math.floor(v * 100 + 1e-6) / 100;
}

function rollRow(diff) {
  const { tiles, safe } = DIFF[diff];
  const arr = Array(tiles).fill(false);
  let n = 0;
  while (n < safe) {
    const i = crypto.randomInt(0, tiles);
    if (!arr[i]) { arr[i] = true; n++; }
  }
  return arr;
}

module.exports = function createTower(ctx) {
  const { getBal, setBal, addStats, log } = ctx;
  let session = null;

  const reply = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  const entry = (diff, tileResult, idx, round) => {
    const win = !!tileResult[idx];
    return {
      difficulty: diff,
      game_action_id: 'ta_' + crypto.randomUUID(),
      multiplier: win ? roundMultiplier(diff, round) : 0,
      player_round_win: win,
      round_tile_result: tileResult,
      selected_tile_index: idx,
    };
  };

  // Fills remaining rows after a loss so the client can reveal them.
  const reveal = (results, diff) => {
    const out = results.slice();
    while (out.length < ROWS) {
      const tr = rollRow(diff);
      out.push(entry(diff, tr, crypto.randomInt(0, tr.length), out.length + 1));
    }
    return out;
  };

  function result(s, over, results, mult, payout) {
    return {
      game_result: {
        bet_amount: s.stake.toFixed(2),
        currency: s.currency,
        game_history_id: s.id,
        game_name: 'towers',
        game_over: over,
        multiplier: mult,
        payout: payout.toFixed(2),
      },
      tower_result: results,
      tower_difficulty: s.difficulty,
      wallet: wallet(),
      balance: getBal(),
    };
  }

  const lastMult = (s) => {
    const l = s.results[s.results.length - 1];
    return l ? l.multiplier : 0;
  };

  function settle(s, payout) {
    setBal(r2(getBal() + payout));
    addStats(s.stake, payout);
    log('TOWER: bet=' + s.stake.toFixed(2) + ' ' + s.difficulty + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
  }

  function validateStart(b) {
    if (session) return 'er_active_game';
    const stake = r2(parseFloat(b.bet_amount) || 0);
    if (!(stake > 0)) return 'er_invalid_bet_amount';
    if (stake > getBal()) return 'er_insufficient_balance';
    if (!DIFF[b.difficulty || 'easy']) return 'er_invalid_difficulty';
    return null;
  }

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/tower\/(.+)$/);
    if (!m) return false;
    const rest = m[1];
    try {
      if (rest === 'active-session') {
        if (!session) return reply(res, { error: 'no_active_session' }), true;
        reply(res, result(session, false, session.results, lastMult(session), r2(session.stake * lastMult(session))));
        return true;
      }
      if (req.method !== 'POST') return false;

      if (rest === 'start-game' || rest === 'freeplay') {
        const b = await ctx.parseBody(req);
        const e = validateStart(b);
        if (e) return reply(res, { error: e }), true;
        const stake = r2(parseFloat(b.bet_amount));
        setBal(r2(getBal() - stake));
        session = {
          id: crypto.randomUUID(), stake, currency: b.currency || 'USD',
          difficulty: b.difficulty || 'easy', results: [],
        };
        reply(res, result(session, false, [], 0, 0));
        return true;
      }

      if (rest === 'autoplay') {
        const b = await ctx.parseBody(req);
        const e = validateStart(b);
        if (e) return reply(res, { error: e }), true;
        const picks = Array.isArray(b.selected_tile_indexes) ? b.selected_tile_indexes : [];
        const diff = b.difficulty || 'easy';
        if (!picks.length) return reply(res, { error: 'er_invalid_selection' }), true;
        const tiles = DIFF[diff].tiles;
        const s = {
          id: crypto.randomUUID(), stake: r2(parseFloat(b.bet_amount)), currency: b.currency || 'USD',
          difficulty: diff, results: [],
        };
        let lost = false;
        for (let i = 0; i < Math.min(picks.length, ROWS); i++) {
          const idx = Math.min(Math.max(0, Number(picks[i]) | 0), tiles - 1);
          const ent = entry(diff, rollRow(diff), idx, i + 1);
          s.results.push(ent);
          if (!ent.player_round_win) { lost = true; break; }
        }
        const mult = lost ? 0 : lastMult(s);
        const payout = r2(s.stake * mult);
        setBal(r2(getBal() - s.stake));
        settle(s, payout);
        reply(res, result(s, true, lost ? reveal(s.results, diff) : s.results, mult, payout));
        return true;
      }

      const bm = rest.match(/^([\w-]+)\/bet$/);
      const cm = rest.match(/^([\w-]+)\/cashout$/);
      if (!bm && !cm) return false;
      const id = (bm || cm)[1];
      if (!session || session.id !== id) return reply(res, { error: 'er_no_active_game' }), true;
      const s = session;

      if (cm) {
        if (!s.results.length) return reply(res, { error: 'er_cannot_cashout' }), true;
        const mult = lastMult(s);
        const payout = r2(s.stake * mult);
        session = null;
        settle(s, payout);
        reply(res, result(s, true, s.results, mult, payout));
        return true;
      }

      const b = await ctx.parseBody(req);
      const idx = Number(b.selected_tile_index);
      if (!Number.isInteger(idx) || idx < 0 || idx >= DIFF[s.difficulty].tiles) {
        return reply(res, { error: 'er_invalid_tile' }), true;
      }
      if (s.results.length >= ROWS) return reply(res, { error: 'er_game_over' }), true;
      const ent = entry(s.difficulty, rollRow(s.difficulty), idx, s.results.length + 1);
      s.results.push(ent);
      if (!ent.player_round_win) {
        session = null;
        settle(s, 0);
        reply(res, result(s, true, reveal(s.results, s.difficulty), 0, 0));
      } else if (s.results.length >= ROWS) {
        const payout = r2(s.stake * ent.multiplier);
        session = null;
        settle(s, payout);
        reply(res, result(s, true, s.results, ent.multiplier, payout));
      } else {
        reply(res, result(s, false, s.results, ent.multiplier, r2(s.stake * ent.multiplier)));
      }
      return true;
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return true;
    }
  };
};
