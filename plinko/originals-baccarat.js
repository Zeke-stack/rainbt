const crypto = require('crypto');

const r2 = (n) => Math.round(n * 100) / 100;
const MAIN = ['player', 'tie', 'banker'];
const SIDE = ['player_pair', 'player_bonus', 'perfect_pair', 'banker_pair', 'banker_bonus', 'either_pair'];
// Total-return multipliers (stake included)
const MAIN_MULT = { banker: 1.95, player: 2, tie: 9 };
const SIDE_MULT = { player_pair: 12, banker_pair: 12, either_pair: 6, perfect_pair: 26 };
// Bonus: net payout by winning margin of a non-natural win (natural win pays 1:1, natural tie pushes)
const BONUS_NET = { 4: 1, 5: 2, 6: 4, 7: 6, 8: 10, 9: 30 };

const VAL = { A: 1, T: 0, J: 0, Q: 0, K: 0 };
const val = (c) => (c[0] in VAL ? VAL[c[0]] : Number(c[0]));
const total = (h) => h.reduce((s, c) => s + val(c), 0) % 10;

function newShoe() {
  const cards = [];
  for (let d = 0; d < 8; d++) {
    for (const s of ['c', 'd', 'h', 's']) {
      for (const r of ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']) cards.push(r + s);
    }
  }
  return cards;
}

function dealRound() {
  const shoe = newShoe();
  const draw = () => {
    const i = crypto.randomInt(0, shoe.length);
    return shoe.splice(i, 1)[0];
  };
  const p = [draw()];
  const b = [draw()];
  p.push(draw());
  b.push(draw());
  let pt = total(p);
  let bt = total(b);
  if (!(pt >= 8 || bt >= 8)) {
    let third = null;
    if (pt <= 5) { third = draw(); p.push(third); pt = total(p); }
    let bankerDraws;
    if (bt >= 7) bankerDraws = false;
    else if (third === null) bankerDraws = bt <= 5;
    else {
      const t = val(third);
      if (bt <= 2) bankerDraws = true;
      else if (bt === 3) bankerDraws = t !== 8;
      else if (bt === 4) bankerDraws = t >= 2 && t <= 7;
      else if (bt === 5) bankerDraws = t >= 4 && t <= 7;
      else bankerDraws = t === 6 || t === 7;
    }
    if (bankerDraws) { b.push(draw()); bt = total(b); }
  }
  const winner = pt === bt ? 'tie' : pt > bt ? 'player' : 'banker';
  return { playerCards: p, bankerCards: b, playerTotal: pt, bankerTotal: bt, winner };
}

const pair = (h) => h[0][0] === h[1][0];
const perfect = (h) => pair(h) && h[0][1] === h[1][1];

function bonusMult(round, side) {
  const [mine, other] = side === 'player' ? [round.playerCards, round.bankerCards] : [round.bankerCards, round.playerCards];
  const mt = side === 'player' ? round.playerTotal : round.bankerTotal;
  const ot = side === 'player' ? round.bankerTotal : round.playerTotal;
  void mine; void other;
  if (round.winner !== side) {
    const natural = round.playerCards.length === 2 && round.bankerCards.length === 2 && mt >= 8;
    return natural && mt === ot ? 1 : 0;
  }
  const natural = (side === 'player' ? round.playerCards : round.bankerCards).length === 2 && mt >= 8;
  if (natural) return 2;
  const net = BONUS_NET[mt - ot];
  return net ? net + 1 : 0;
}

function spotMult(type, round) {
  if (MAIN.includes(type)) {
    if (type === round.winner) return MAIN_MULT[type];
    return round.winner === 'tie' ? 1 : 0;
  }
  switch (type) {
    case 'player_pair': return pair(round.playerCards) ? SIDE_MULT.player_pair : 0;
    case 'banker_pair': return pair(round.bankerCards) ? SIDE_MULT.banker_pair : 0;
    case 'either_pair': return pair(round.playerCards) || pair(round.bankerCards) ? SIDE_MULT.either_pair : 0;
    case 'perfect_pair': return perfect(round.playerCards) || perfect(round.bankerCards) ? SIDE_MULT.perfect_pair : 0;
    case 'player_bonus': return bonusMult(round, 'player');
    case 'banker_bonus': return bonusMult(round, 'banker');
    default: return 0;
  }
}

module.exports = function createBaccarat(ctx) {
  const { getBal, setBal, addStats, log } = ctx;

  const reply = (res, obj) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  function play(wagers, currency) {
    const bets = [];
    for (const w of wagers) {
      const type = String(w.selection || '').replace(/-/g, '_');
      const amount = r2(parseFloat(w.amount));
      if (!(MAIN.includes(type) || SIDE.includes(type)) || !(amount > 0)) return { error: 'er_invalid_bet' };
      const ex = bets.find((x) => x.type === type);
      if (ex) ex.amount = r2(ex.amount + amount); else bets.push({ type, amount });
    }
    if (!bets.length) return { error: 'er_invalid_bet' };
    const stake = r2(bets.reduce((s, x) => s + x.amount, 0));
    if (stake > getBal()) return { error: 'er_insufficient_balance' };

    const round = dealRound();
    let payout = 0;
    const betResults = bets.map((x) => {
      const m = spotMult(x.type, round);
      const p = r2(x.amount * m);
      payout += p;
      return { amount: x.amount.toFixed(2), multiplier: m > 0 ? String(m) : '0', payout: p > 0 ? p.toFixed(2) : '0.00', type: x.type, won: m === 1 ? null : m > 1 };
    });
    payout = r2(payout);
    setBal(r2(getBal() - stake + payout));
    addStats(stake, payout);
    log('BACCARAT: bet=' + stake.toFixed(2) + ' ' + round.winner + ' payout=' + payout.toFixed(2) + ' bal=' + getBal().toFixed(2));
    return {
      baccarat_result: {
        banker_cards: round.bankerCards,
        banker_total: round.bankerTotal,
        bet_results: betResults,
        game_action_id: crypto.randomUUID(),
        player_cards: round.playerCards,
        player_total: round.playerTotal,
        winner: round.winner,
      },
      game_result: {
        bet_amount: stake,
        currency: currency || 'USD',
        game_history_id: crypto.randomUUID(),
        game_name: 'baccarat',
        game_over: true,
        multiplier: stake > 0 ? Number((payout / stake).toFixed(3)) : 0,
        payout: payout.toFixed(2),
      },
      wallet: { active: { primary: getBal(), promotional: 0, vault: 0, currency: 'USD' } },
      balance: getBal(),
    };
  }

  return async function handle(req, res, pathname) {
    const m = pathname.match(/^\/api\/v[12]\/original-games\/baccarat\/(play|freeplay|active-session)\/?$/);
    if (!m) return false;
    try {
      if (m[1] === 'active-session') {
        reply(res, { error: 'er_no_active_game' });
        return true;
      }
      if (req.method !== 'POST') return false;
      const b = await ctx.parseBody(req);
      if (m[1] === 'freeplay') {
        reply(res, { error: 'er_freeplay_no_results' });
        return true;
      }
      reply(res, play(Array.isArray(b.wagers) ? b.wagers : [], b.currency));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  };
};
