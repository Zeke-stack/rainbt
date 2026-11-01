const crypto = require('crypto');

const MAX_ROUNDS = 20;
const MAX_MULT = 1e4;
const HANDS = ['R', 'P', 'S'];
const BEATS = { R: 'S', P: 'R', S: 'P' };

const r2 = (n) => Math.round(n * 100) / 100;
const streakMult = (n) => (n <= 0 ? 1.96 : Math.min(MAX_MULT, r2(1.96 * Math.pow(2, n))));
const resultOf = (p, h) => (p === h ? 'draw' : BEATS[p] === h ? 'win' : 'lose');
const normHand = (v) => {
  const s = String(v || '').trim().toUpperCase();
  return HANDS.includes(s) ? s : (({ ROCK: 'R', PAPER: 'P', SCISSORS: 'S' })[s] || null);
};

let active = null;

module.exports = function (ctx) {
  const { getBal, setBal, addStats, log } = ctx;

  const send = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  // Plays one hand against a random house hand; after a loss (auto mode) rounds are recorded but ignored.
  function playRound(s, bet) {
    const house = HANDS[crypto.randomInt(0, 3)];
    const result = resultOf(bet, house);
    const mult = streakMult(s.streak);
    if (!s.lost) {
      if (result === 'win') {
        s.streak += 1;
        s.won = true;
        s.cur = mult;
      } else if (result === 'lose') {
        s.lost = true;
        s.cur = 0;
      }
    }
    const round = {
      can_cashout: s.won,
      game_action_id: crypto.randomUUID(),
      house_bet: house,
      multiplier: mult,
      player_bet: bet,
      round_result: result,
      streak_index: s.streak,
    };
    s.rounds.push(round);
    return round;
  }

  const isOver = (s) => s.lost || s.cur >= MAX_MULT || s.rounds.length >= MAX_ROUNDS;
  const finalMult = (s) => (s.lost ? 0 : s.won ? Math.min(s.cur, MAX_MULT) : 0.98);

  function build(s, over, mult) {
    const payout = over ? r2(s.stake * mult) : 0;
    return {
      game_result: {
        bet_amount: s.stake.toFixed(2),
        currency: s.currency,
        game_history_id: s.id,
        game_name: 'rps',
        game_over: over,
        multiplier: over ? mult : s.cur,
        payout: payout.toFixed(2),
      },
      rps_result: s.rounds,
      wallet: wallet(),
      balance: getBal(),
    };
  }

  function end(s, mult) {
    const payout = r2(s.stake * mult);
    if (payout > 0) setBal(r2(getBal() + payout));
    addStats(s.stake, payout);
    log('RPS: bet=' + s.stake.toFixed(2) + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
    if (active === s) active = null;
    return build(s, true, mult);
  }

  function newSession(b, free) {
    const stake = free ? 0 : r2(parseFloat(b.bet_amount) || 0);
    if (!free) {
      if (!(stake > 0)) return { error: 'er_invalid_bet_amount' };
      if (stake > getBal()) return { error: 'er_insufficient_balance' };
    }
    return {
      id: crypto.randomUUID(), stake, currency: b.currency || 'USD', free,
      rounds: [], streak: 0, cur: 1, won: false, lost: false,
    };
  }

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/rps\/(.+)$/);
    if (!m) return false;
    const rest = m[1];
    try {
      if (req.method === 'GET') {
        if (rest === 'active-session') {
          if (active) send(res, build(active, false));
          else send(res, { error: 'no_active_session' });
          return true;
        }
        if (rest === 'freeplays') return send(res, { game: null, freeplays: [] }), true;
        return false;
      }
      if (req.method !== 'POST') return false;
      const b = await ctx.parseBody(req);

      if (rest === 'start-game' || rest === 'freeplay') {
        const s = newSession(b, rest === 'freeplay');
        if (s.error) return send(res, s), true;
        setBal(r2(getBal() - s.stake));
        active = s;
        send(res, build(s, false));
        return true;
      }

      if (rest === 'autoplay') {
        const s = newSession(b, false);
        if (s.error) return send(res, s), true;
        const bets = (Array.isArray(b.bets) ? b.bets : []).map(normHand);
        if (!bets.length || bets.some((x) => !x)) return send(res, { error: 'er_invalid_bets' }), true;
        setBal(r2(getBal() - s.stake));
        for (const bet of bets.slice(0, MAX_ROUNDS)) {
          playRound(s, bet);
          if (!s.lost && s.cur >= MAX_MULT) break;
        }
        s.rounds[s.rounds.length - 1].can_cashout = s.won;
        send(res, end(s, finalMult(s)));
        return true;
      }

      const bm = rest.match(/^([^/]+)\/bet$/);
      if (bm) {
        if (!active || active.id !== bm[1]) return send(res, { error: 'er_no_active_session' }), true;
        const bet = normHand(b.bet);
        if (!bet) return send(res, { error: 'er_invalid_bet' }), true;
        playRound(active, bet);
        if (isOver(active)) send(res, end(active, finalMult(active)));
        else send(res, build(active, false));
        return true;
      }

      const cm = rest.match(/^([^/]+)\/cashout$/);
      if (cm) {
        if (!active || active.id !== cm[1] || !active.won) return send(res, { error: 'er_cannot_cashout' }), true;
        send(res, end(active, Math.min(active.cur, MAX_MULT)));
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
