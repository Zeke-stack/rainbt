const crypto = require('crypto');

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['c', 'd', 'h', 's'];
const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i]));
const SIDE_TYPES = ['tie', 'coloured_tie'];
const SIDE_MULT = { tie: 11, coloured_tie: 50 };
const MAX_TIES = 4;

const r2 = (n) => Math.round(n * 100) / 100;
const cmp = (a, b) => RANK_VALUE[a[0]] - RANK_VALUE[b[0]];
const colour = (c) => (c[1] === 'h' || c[1] === 'd' ? 'red' : 'black');

function newShoe() {
  const cards = [];
  for (let d = 0; d < 8; d++) for (const s of SUITS) for (const r of RANKS) cards.push([r, s]);
  return cards;
}

module.exports = function createWar(ctx) {
  const { getBal, setBal, addStats, log } = ctx;

  let session = null;

  const reply = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const wallet = () => ({ active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } });

  function draw(s) {
    const i = crypto.randomInt(0, s.shoe.length);
    const c = s.shoe[i];
    s.shoe[i] = s.shoe[s.shoe.length - 1];
    s.shoe.pop();
    return c;
  }

  function view(s, status, over, payout) {
    const staked = s.bet + s.raise;
    return {
      game_result: {
        bet_amount: s.bet.toFixed(2),
        currency: s.currency,
        game_history_id: s.id,
        game_name: 'war',
        game_over: over,
        multiplier: over && s.bet > 0 ? r2(payout / s.bet) : 0,
        payout: payout.toFixed(2),
        side_bets_result: s.sideResults,
        total_bet_amount: staked.toFixed(2),
      },
      war_result: {
        game_action_id: s.actionId,
        open_deal: { dealer_card: s.dealer[0], player_card: s.player[0] },
        round_status: status,
        war_rounds: s.warRounds,
      },
      wallet: wallet(),
      balance: getBal(),
    };
  }

  function finish(s, status, payout) {
    session = null;
    s.actionId = crypto.randomUUID();
    setBal(r2(getBal() + payout));
    addStats(s.bet + s.raise + s.sideStake, payout + s.sidePayout);
    log('WAR: bet=' + s.bet.toFixed(2) + ' raise=' + s.raise.toFixed(2) + ' status=' + status + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
    return view(s, status, true, payout);
  }

  function deal(b, stake, sides) {
    const s = {
      id: crypto.randomUUID(),
      actionId: crypto.randomUUID(),
      bet: stake,
      raise: 0,
      currency: b.currency || 'USD',
      shoe: newShoe(),
      player: [],
      dealer: [],
      warRounds: [],
      sideStake: 0,
      sidePayout: 0,
      sideResults: [],
    };
    s.player.push(draw(s));
    s.dealer.push(draw(s));
    const tie = cmp(s.player[0], s.dealer[0]) === 0;
    const sameColour = tie && colour(s.player[0]) === colour(s.dealer[0]);
    for (const [type, amount] of sides) {
      const win = type === 'tie' ? tie : sameColour;
      const payout = win ? r2(amount * SIDE_MULT[type]) : 0;
      s.sideStake += amount;
      s.sidePayout += payout;
      s.sideResults.push({
        multiplier: win ? String(SIDE_MULT[type]) : '0',
        payout: payout.toFixed(2),
        sub_type: win ? type : null,
        type,
      });
    }
    if (s.sidePayout > 0) setBal(r2(getBal() + s.sidePayout));
    return { s, tie };
  }

  function goToWar(s) {
    s.raise = s.bet;
    let status = 'player-war-max-ties';
    let payout = r2(s.bet * 2);
    for (let t = 1; t < MAX_TIES; t++) {
      const round = {
        dealer_burned_cards: [draw(s), draw(s), draw(s)],
        dealer_card: null,
        player_burned_cards: [draw(s), draw(s), draw(s)],
        player_card: null,
      };
      round.player_card = draw(s);
      round.dealer_card = draw(s);
      s.warRounds.push(round);
      const c = cmp(round.player_card, round.dealer_card);
      if (c > 0) { status = 'player-war-win'; payout = r2(s.bet * 3); break; }
      if (c < 0) { status = 'player-war-lose'; payout = 0; break; }
    }
    return finish(s, status, payout);
  }

  function surrender(s) {
    return finish(s, 'player-surrender', r2(s.bet / 2));
  }

  function parseSides(b) {
    const out = [];
    const sb = b.side_bets;
    if (sb && typeof sb === 'object') {
      for (const type of SIDE_TYPES) {
        const amt = r2(parseFloat(sb[type]) || 0);
        if (amt > 0) out.push([type, amt]);
      }
    }
    return out;
  }

  // Validates the stake, debits it and deals the opening cards; returns { s, tie } or { error }.
  function start(b) {
    if (session) return { error: 'er_active_game' };
    const stake = r2(parseFloat(b.bet_amount) || 0);
    if (!(stake > 0)) return { error: 'er_invalid_bet_amount' };
    const sides = parseSides(b);
    const total = r2(stake + sides.reduce((a, x) => a + x[1], 0));
    if (total > getBal()) return { error: 'er_insufficient_balance' };
    setBal(r2(getBal() - total));
    return deal(b, stake, sides);
  }

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/war\/(active-session|play|autoplay|[\w-]+\/[\w-]+\/action)$/);
    if (!m) return false;
    const route = m[1];
    try {
      if (route === 'active-session') {
        if (!session) return reply(res, { error: 'no_active_session' }), true;
        return reply(res, view(session, 'war-pending', false, 0)), true;
      }
      if (req.method !== 'POST') return false;
      const b = await ctx.parseBody(req);

      if (route === 'play' || route === 'autoplay') {
        const r = start(b);
        if (r.error) return reply(res, { error: r.error }), true;
        const { s, tie } = r;
        if (!tie) {
          const win = cmp(s.player[0], s.dealer[0]) > 0;
          return reply(res, finish(s, win ? 'player-win' : 'player-lose', win ? r2(s.bet * 2) : 0)), true;
        }
        if (route === 'autoplay' && (b.action === 'go-to-war' || b.action === 'surrender')) {
          if (b.action === 'surrender') return reply(res, surrender(s)), true;
          if (s.bet > getBal()) {
            // Not enough for the raise: fall back to surrender so the stake is never stranded.
            return reply(res, surrender(s)), true;
          }
          setBal(r2(getBal() - s.bet));
          return reply(res, goToWar(s)), true;
        }
        session = s;
        return reply(res, view(s, 'war-pending', false, 0)), true;
      }

      const s = session;
      if (!s) return reply(res, { error: 'er_no_active_game' }), true;
      if (b.action === 'surrender') return reply(res, surrender(s)), true;
      if (b.action === 'go-to-war') {
        if (s.bet > getBal()) return reply(res, { error: 'er_insufficient_balance' }), true;
        setBal(r2(getBal() - s.bet));
        return reply(res, goToWar(s)), true;
      }
      return reply(res, { error: 'er_invalid_action' }), true;
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return true;
    }
  };
};
