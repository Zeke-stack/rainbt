const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { updateBetLimits, updatePageBetLimits } = require('./game-bet-limits');

for (const game of ['roulette', 'blackjack', 'baccarat']) {
  test(`${game} page and navigation data have no practical stake cap`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'new-build', 'pages', `${game}.html`), 'utf8');
    const extract = (s) => JSON.parse(s.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]).props.pageProps;
    const original = extract(html);
    const page = extract(updatePageBetLimits(game, html));
    const navigation = updateBetLimits(game, extract(html));
    for (const currency of Object.keys(original.gameLimits)) {
      const before = original.gameLimits[currency];
      for (const props of [page, navigation]) {
        const after = props.gameLimits[currency];
        assert.equal(after.min_bet, before.min_bet);
        assert.deepEqual(after.max_payout, before.max_payout);
        const limits = typeof after.max_bet === 'object' ? Object.values(after.max_bet) : [after.max_bet];
        assert.ok(limits.length > 0);
        for (const limit of limits) assert.equal(limit, Number.MAX_SAFE_INTEGER);
      }
    }
  });
}

test('other games retain their existing limits', () => {
  const props = { gameLimits: { USD: { min_bet: 0.1, max_bet: 6000 } } };
  updateBetLimits('mines', props);
  assert.equal(props.gameLimits.USD.max_bet, 6000);
});

for (const [game, factory, body] of [
  ['roulette', require('./originals-extra'), { bets: [{ amount: 150000, type: 'red' }] }],
  ['baccarat', require('./originals-baccarat'), { wagers: [{ amount: 150000, selection: 'player' }] }],
]) {
  test(`${game} accepts large wagers but still enforces the balance`, async () => {
    let balance = 200000;
    const handler = factory({
      getBal: () => balance,
      setBal: (value) => { balance = value; },
      addStats: () => {},
      log: () => {},
      rig: { consume: () => false },
      parseBody: async () => body,
    });
    const request = async () => {
      let payload;
      const res = { writeHead: () => {}, end: (value) => { payload = JSON.parse(value); } };
      assert.equal(await handler({ method: 'POST' }, res, `/api/v1/original-games/${game}/play`), true);
      return payload;
    };
    const accepted = await request();
    assert.equal(accepted.error, undefined);
    assert.equal(Number(accepted.game_result.bet_amount), 150000);
    balance = 100;
    assert.equal((await request()).error, 'er_insufficient_balance');
    assert.equal(balance, 100);
  });
}
