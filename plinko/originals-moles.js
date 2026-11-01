const crypto = require('crypto');

const HOLES = 7;
const MAX_ROUNDS = 9;
const MAX_MULT = 1e6;
const EDGE = 0.96;

const r2 = (n) => Math.round(n * 100) / 100;
const floor2 = (n) => Math.floor(n * 100 + 1e-9) / 100;

function roundMultiplier(moleCount, round) {
  if (round <= 0 || moleCount <= 0) return 0;
  const m = Math.pow(HOLES / moleCount, round - 1) * ((HOLES * EDGE) / moleCount);
  return floor2(Math.min(m, MAX_MULT));
}

function drawMoles(count) {
  const pool = Array.from({ length: HOLES }, (_, i) => i);
  const out = [];
  for (let i = 0; i < count; i++) out.push(pool.splice(crypto.randomInt(0, pool.length), 1)[0]);
  return out.sort((a, b) => a - b);
}

module.exports = function createMoles(ctx) {
  const { getBal, setBal, addStats, log } = ctx;

  let session = null;

  if (ctx.rig) {
    ctx.rig.onArm('moles', () => {
      if (session && !session.rigged) { session.rigged = true; return true; }
      return false;
    });
  }
  const reply = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  const lastMult = (rounds) => {
    for (let i = rounds.length - 1; i >= 0; i--) if (rounds[i].player_round_win) return Number(rounds[i].multiplier);
    return 0;
  };

  function gameResult(s, over, mult, payout) {
    return {
      bet_amount: s.bet.toFixed(2),
      currency: s.currency,
      game_history_id: s.id,
      game_name: 'moles',
      game_over: over,
      multiplier: mult,
      payout: payout.toFixed(2),
    };
  }

  function view(s, over, mult, payout) {
    return {
      game_result: gameResult(s, over, mult, payout),
      mole_count: s.moleCount,
      moles_result: s.rounds,
      wallet: wallet(),
      balance: getBal(),
    };
  }

  function playRound(s, hole, rigged) {
    const round = s.rounds.length + 1;
    let moleIndexes = drawMoles(s.moleCount);
    // In this game a round is won when the picked hole is among mole_indexes
    if (rigged && !moleIndexes.includes(hole)) {
      moleIndexes[crypto.randomInt(0, moleIndexes.length)] = hole;
      moleIndexes.sort((a, b) => a - b);
    }
    const win = moleIndexes.includes(hole);
    const entry = {
      game_action_id: crypto.randomUUID(),
      mole_count: s.moleCount,
      mole_indexes: moleIndexes,
      multiplier: win ? roundMultiplier(s.moleCount, round).toFixed(2) : '0',
      player_round_win: win,
      selected_hole_index: hole,
    };
    s.rounds.push(entry);
    return entry;
  }

  function finish(s, payout) {
    session = null;
    setBal(r2(getBal() + payout));
    addStats(s.bet, payout);
    log('MOLES: bet=' + s.bet.toFixed(2) + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
  }

  const parseCount = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
  };

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/moles\/([\w-]+)(?:\/(action|cashout))?$/);
    if (!m) return false;
    const seg = m[1];
    const sub = m[2];
    try {
      if (!sub && seg === 'active-session') {
        if (!session) return reply(res, { error: 'no_active_session' }), true;
        const s = session;
        return reply(res, view(s, false, lastMult(s.rounds), 0)), true;
      }

      if (req.method !== 'POST') return false;
      const b = await ctx.parseBody(req);

      if (!sub && seg === 'play') {
        if (session) return reply(res, { error: 'er_active_game' }), true;
        const stake = r2(parseFloat(b.bet_amount) || 0);
        const moleCount = parseCount(b.mole_count);
        if (!(stake > 0)) return reply(res, { error: 'er_invalid_bet_amount' }), true;
        if (moleCount === null) return reply(res, { error: 'er_invalid_mole_count' }), true;
        if (stake > getBal()) return reply(res, { error: 'er_insufficient_balance' }), true;
        setBal(r2(getBal() - stake));
        session = { id: crypto.randomUUID(), bet: stake, currency: b.currency || 'USD', moleCount, rounds: [] };
                if (ctx.rig && ctx.rig.consume('moles')) session.rigged = true;
                return reply(res, view(session, false, 0, 0)), true;
      }

      if (!sub && seg === 'autoplay') {
        const stake = r2(parseFloat(b.bet_amount) || 0);
        const moleCount = parseCount(b.mole_count);
        const picks = Array.isArray(b.selected_hole_indexes) ? b.selected_hole_indexes.map(Number) : [];
        if (!(stake > 0)) return reply(res, { error: 'er_invalid_bet_amount' }), true;
        if (moleCount === null) return reply(res, { error: 'er_invalid_mole_count' }), true;
        if (!picks.length || picks.length > MAX_ROUNDS || picks.some((p) => !Number.isInteger(p) || p < 0 || p >= HOLES)) {
          return reply(res, { error: 'er_invalid_selection' }), true;
        }
        if (stake > getBal()) return reply(res, { error: 'er_insufficient_balance' }), true;
        setBal(r2(getBal() - stake));
        const s = { id: crypto.randomUUID(), bet: stake, currency: b.currency || 'USD', moleCount, rounds: [] };
        const rigged = !!(ctx.rig && ctx.rig.consume('moles'));
        for (const p of picks) if (!playRound(s, p, rigged).player_round_win) break;
        const won = s.rounds.every((r) => r.player_round_win);
        const mult = won ? lastMult(s.rounds) : 0;
        const payout = won ? r2(stake * mult) : 0;
        setBal(r2(getBal() + payout));
        addStats(stake, payout);
        log('MOLES AUTO: bet=' + stake.toFixed(2) + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
        return reply(res, view(s, true, mult, payout)), true;
      }

      if (sub === 'action') {
        const s = session;
        if (!s || s.id !== seg) return reply(res, { error: 'er_no_active_game' }), true;
        const hole = Number(b.selected_hole_index);
        if (!Number.isInteger(hole) || hole < 0 || hole >= HOLES) return reply(res, { error: 'er_invalid_hole' }), true;
        const entry = playRound(s, hole, s.rigged);
        if (!entry.player_round_win) {
          finish(s, 0);
          return reply(res, view(s, true, 0, 0)), true;
        }
        const mult = Number(entry.multiplier);
        if (s.rounds.length >= MAX_ROUNDS || mult >= MAX_MULT) {
          const payout = r2(s.bet * mult);
          finish(s, payout);
          return reply(res, view(s, true, mult, payout)), true;
        }
        return reply(res, view(s, false, mult, 0)), true;
      }

      if (sub === 'cashout') {
        const s = session;
        if (!s || s.id !== seg) return reply(res, { error: 'er_no_active_game' }), true;
        const mult = lastMult(s.rounds);
        if (!(mult > 0)) return reply(res, { error: 'er_cashout_unavailable' }), true;
        const payout = r2(s.bet * mult);
        finish(s, payout);
        return reply(res, view(s, true, mult, payout)), true;
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return true;
    }
    return false;
  };
};
