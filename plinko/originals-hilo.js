const crypto = require('crypto');

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
const SUITS = ['h', 'd', 'c', 's'];
const VALUE = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, T: 10, J: 11, Q: 12, K: 13 };
const MAX_SKIPS = 10;
const HOUSE_EDGE = 0.96;

const r2 = (n) => Math.round(n * 100) / 100;
const floor2 = (n) => Math.floor(n * 100 + 1e-9) / 100;
const ceil2 = (n) => Math.ceil(n * 100 - 1e-9) / 100;

const randomCard = () => RANKS[crypto.randomInt(0, 13)] + SUITS[crypto.randomInt(0, 4)];
const normCard = (c) => {
  if (Array.isArray(c)) c = c.join('');
  return typeof c === 'string' && c.length === 2 && VALUE[c[0]] && SUITS.includes(c[1]) ? c : null;
};

// Backend action for a high/low choice depends on the current rank (A/K are edge cases).
function actionFor(choice, card) {
  const rank = card[0];
  if (rank === 'A') return choice === 'high' ? 'higher' : 'same';
  if (rank === 'K') return choice === 'high' ? 'same' : 'lower';
  return choice === 'high' ? 'higher-same' : 'lower-same';
}

// Number of winning ranks out of 13 for an action.
function outcomes(rank, action) {
  const v = VALUE[rank];
  const edge = rank === 'A' || rank === 'K';
  if (action === 'higher-same' && !edge) return 13 - v + 1;
  if (action === 'lower-same' && !edge) return v;
  if ((action === 'higher' && rank === 'A') || (action === 'lower' && rank === 'K')) return 12;
  if (action === 'same' && edge) return 1;
  return 0;
}

function isWin(cur, next, action) {
  const a = VALUE[cur[0]];
  const b = VALUE[next[0]];
  if (action === 'same') return a === b;
  if (action === 'higher-same') return b >= a;
  if (action === 'lower-same') return b <= a;
  if (action === 'higher') return b > a;
  if (action === 'lower') return b < a;
  return false;
}

function stepMultiplier(rank, action, prev) {
  const n = outcomes(rank, action);
  if (!n) return 0;
  let m = 13 / n;
  if (prev === 1) m *= HOUSE_EDGE;
  return floor2(m * prev);
}

function betActions(card, wins, skipsUsed, prevMult) {
  const acts = ['high', 'low'].map((c) => {
    const action = actionFor(c, card);
    return {
      action,
      multiplier: stepMultiplier(card[0], action, prevMult),
      win_percentage: ceil2((outcomes(card[0], action) / 13) * 100),
    };
  });
  return { bet_actions: acts, can_cashout: wins > 0, skips_remaining: Math.max(0, MAX_SKIPS - skipsUsed) };
}

module.exports = function createHilo(ctx) {
  const { getBal, setBal, addStats, log } = ctx;
  let session = null;

  if (ctx.rig) {
    ctx.rig.onArm('hilo', () => {
      if (session && !session.rigged) { session.rigged = true; return true; }
      return false;
    });
  }

  const winningCard = (cur, action) => {
    const wins = RANKS.filter((r) => isWin(cur, r + 'h', action));
    if (!wins.length) return randomCard();
    return wins[crypto.randomInt(0, wins.length)] + SUITS[crypto.randomInt(0, 4)];
  };

  const reply = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  function view(s, over) {
    const last = s.results[s.results.length - 1];
    const payout = over ? s.payout : r2(s.stake * s.mult);
    return {
      current_card: last.card,
      game_result: {
        bet_amount: s.stake.toFixed(2),
        currency: s.currency,
        game_history_id: s.id,
        game_name: 'hilo',
        game_over: !!over,
        multiplier: over ? s.finalMult : s.mult,
        payout: payout.toFixed(2),
      },
      hilo_actions: over
        ? { bet_actions: [], can_cashout: false, skips_remaining: 0 }
        : betActions(last.card, s.wins, s.skips, s.mult),
      hilo_result: s.results,
      wallet: wallet(),
      balance: getBal(),
    };
  }

  function finish(s, payout, finalMult) {
    s.payout = payout;
    s.finalMult = finalMult;
    setBal(r2(getBal() + payout));
    addStats(s.stake, payout);
    log('HILO: bet=' + s.stake.toFixed(2) + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
    session = null;
  }

  const newAction = () => 'ga_' + crypto.randomUUID();

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/hilo\/(.+)$/);
    if (!m) return false;
    const rest = m[1];
    try {
      if (rest === 'active-session') {
        reply(res, session ? view(session, false) : { error: 'no_active_session' });
        return true;
      }
      if (req.method !== 'POST') return false;

      if (rest === 'play' || rest === 'freeplay') {
        const b = await ctx.parseBody(req);
        if (session) return reply(res, { error: 'er_active_game' }), true;
        const stake = r2(parseFloat(b.bet_amount) || 0);
        if (!(stake > 0)) return reply(res, { error: 'er_invalid_bet_amount' }), true;
        if (stake > getBal()) return reply(res, { error: 'er_insufficient_balance' }), true;
        const card = normCard(b.starting_card) || randomCard();
        setBal(r2(getBal() - stake));
        session = {
          id: crypto.randomUUID(), stake, currency: b.currency || 'USD', mult: 1, wins: 0, skips: 0,
          results: [{ action: 'higher-same', card, game_action_id: newAction(), multiplier: 1 }],
        };
        if (ctx.rig && ctx.rig.consume('hilo')) session.rigged = true;
        reply(res, view(session, false));
        return true;
      }

      const am = rest.match(/^([\w-]+)\/([\w-]+)\/action$/);
      const cm = rest.match(/^([\w-]+)\/cashout$/);
      if (!am && !cm) return false;
      const id = (am || cm)[1];
      if (!session || session.id !== id) return reply(res, { error: 'er_no_active_game' }), true;
      const s = session;

      if (cm) {
        if (s.wins < 1) return reply(res, { error: 'er_cannot_cashout' }), true;
        finish(s, r2(s.stake * s.mult), s.mult);
        reply(res, view(s, true));
        return true;
      }

      const b = await ctx.parseBody(req);
      const cur = s.results[s.results.length - 1].card;
      if (b.action === 'skip') {
        if (s.skips >= MAX_SKIPS) return reply(res, { error: 'er_no_skips_remaining' }), true;
        s.skips++;
        s.results.push({ action: 'skip', card: randomCard(), game_action_id: newAction(), multiplier: s.mult });
        reply(res, view(s, false));
        return true;
      }
      if (!outcomes(cur[0], b.action)) return reply(res, { error: 'er_invalid_action' }), true;
      const next = s.rigged ? winningCard(cur, b.action) : randomCard();
      if (isWin(cur, next, b.action)) {
        s.mult = stepMultiplier(cur[0], b.action, s.mult);
        s.wins++;
        s.results.push({ action: b.action, card: next, game_action_id: newAction(), multiplier: s.mult });
        reply(res, view(s, false));
      } else {
        s.results.push({ action: b.action, card: next, game_action_id: newAction(), multiplier: 0 });
        finish(s, 0, 0);
        reply(res, view(s, true));
      }
      return true;
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return true;
    }
  };
};
