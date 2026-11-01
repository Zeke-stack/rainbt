const crypto = require('crypto');

const MAX_ROUNDS = 10;
const MAX_MULT = 1e4;
const RISKS = {
  low: [[0, 0.2], [1.1, 0.44], [1.2, 0.24], [1.4, 0.08], [2, 0.04]],
  medium: [[0, 0.4], [1.2, 0.32], [1.5, 0.16], [2.2, 0.08], [4, 0.04]],
  high: [[0, 0.6], [1.5, 0.16], [2, 0.12], [3, 0.08], [6, 0.04]],
  risky: [[0, 0.84], [2, 0.04], [3, 0.04], [4, 0.04], [15, 0.04]],
};

const r2 = (n) => Math.round(n * 100) / 100;
const rand = () => crypto.randomInt(0, 1e9) / 1e9;

let active = null;

module.exports = function (ctx) {
  const { getBal, setBal, addStats, log } = ctx;

  const send = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  const base = (risk) => RISKS[risk].map((x) => x[0]);

  // Plays one round against the current multipliers (leading 0 included) and returns the round record.
  function spinRound(risk, mults) {
    let u = rand();
    let rank = 0;
    for (; rank < RISKS[risk].length - 1; rank++) {
      u -= RISKS[risk][rank][1];
      if (u < 0) break;
    }
    const result = mults[rank];
    const next = rank === 0 ? mults : mults.map((m) => Math.min(MAX_MULT, r2(m * RISKS[risk][rank][0])));
    return {
      next,
      round: {
        game_action_id: crypto.randomUUID(),
        risk_level: risk,
        round_multipliers: (rank === 0 ? mults : next).filter((m) => m !== 0),
        wheel_result: result,
      },
    };
  }

  function gameResult(s, over, payout) {
    return {
      bet_amount: s.stake.toFixed(2),
      currency: s.currency,
      game_history_id: s.id,
      game_name: 'wheel',
      game_over: over,
      multiplier: over ? (s.stake > 0 ? r2(payout / s.stake) : 0) : s.cum,
      payout: over ? payout.toFixed(2) : '0.00',
    };
  }

  function finish(s, payout) {
    payout = r2(payout);
    if (payout > 0) setBal(r2(getBal() + payout));
    addStats(s.stake, payout);
    log('WHEEL: bet=' + s.stake.toFixed(2) + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
    if (active === s) active = null;
  }

  function response(s, over) {
    const payout = over ? r2(s.stake * s.cum) : 0;
    if (over) finish(s, payout);
    return { game_result: gameResult(s, over, payout), wheel_result: s.rounds, wallet: wallet(), balance: getBal() };
  }

  // Runs one round; ends the game on a miss or after the final round.
  function advance(s) {
    const { next, round } = spinRound(s.risk, s.mults);
    s.rounds.push(round);
    s.cum = round.wheel_result;
    s.mults = next;
    return round.wheel_result === 0 || s.rounds.length >= MAX_ROUNDS;
  }

  function validate(b, free) {
    const risk = RISKS[b.risk_level] ? b.risk_level : null;
    if (!risk) return { error: 'er_invalid_risk_level' };
    const stake = free ? 0 : r2(parseFloat(b.bet_amount) || 0);
    if (!free) {
      if (!(stake > 0)) return { error: 'er_invalid_bet_amount' };
      if (stake > getBal()) return { error: 'er_insufficient_balance' };
    }
    return { risk, stake };
  }

  function newGame(b, free) {
    const v = validate(b, free);
    if (v.error) return v;
    return {
      id: crypto.randomUUID(), risk: v.risk, stake: v.stake, currency: b.currency || 'USD',
      mults: base(v.risk), rounds: [], cum: 0,
    };
  }

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/wheel\/(.+)$/);
    if (!m) return false;
    const rest = m[1];
    try {
      if (req.method === 'GET') {
        if (rest === 'active-session') {
          if (active) send(res, response(active, false));
          else send(res, { error: 'no_active_session' });
          return true;
        }
        if (rest === 'freeplays') return send(res, { game: null, freeplays: [] }), true;
        return false;
      }
      if (req.method !== 'POST') return false;
      const b = await ctx.parseBody(req);

      if (rest === 'play' || rest === 'freeplay') {
        const free = rest === 'freeplay';
        const s = newGame(b, free);
        if (s.error) return send(res, s), true;
        if (!free) setBal(r2(getBal() - s.stake));
        const over = advance(s);
        if (!over) active = s;
        send(res, response(s, over));
        return true;
      }

      if (rest === 'autoplay') {
        const s = newGame(b, false);
        if (s.error) return send(res, s), true;
        const maxRounds = Math.min(MAX_ROUNDS, Math.max(1, parseInt(b.max_rounds, 10) || 1));
        setBal(r2(getBal() - s.stake));
        while (!advance(s) && s.rounds.length < maxRounds);
        send(res, response(s, true));
        return true;
      }

      const sp = rest.match(/^([^/]+)\/([^/]+)\/spin$/);
      if (sp) {
        if (!active || active.id !== sp[1]) return send(res, { error: 'er_no_active_session' }), true;
        const over = advance(active);
        send(res, response(active, over));
        return true;
      }

      const co = rest.match(/^([^/]+)\/cashout$/);
      if (co) {
        if (!active || active.id !== co[1] || !active.rounds.length) return send(res, { error: 'er_no_active_session' }), true;
        send(res, response(active, true));
        return true;
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return true;
    }
    return false;
  };
};
