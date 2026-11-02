'use strict';
// Mock API for the Rainbet account area (profile, bets, transactions, affiliates,
// verification, vault, rewards, settings). Hooked from game-server.js.
const crypto = require('crypto');

const USER = {
  id: 'local-player-001',
  public_id: 'LOCAL_PLAYER_001',
  username: 'Player',
  email: 'player@localhost',
  registered_at: '2024-01-01T12:00:00.000Z',
  affiliate_code: 'PLAYER',
};

// Rank ladder (USD wagered thresholds)
const LADDER = [];
(function build() {
  const t = {
    bronze: [1000, 2500, 5000, 10000],
    silver: [25000, 50000, 100000, 175000],
    gold: [250000, 400000, 600000, 850000],
    platinum: [1200000, 1800000, 2500000, 3500000],
    diamond: [5000000, 7500000, 10000000, 15000000],
    infernal: [25000000, 35000000, 50000000, 75000000],
  };
  const roman = ['I', 'II', 'III', 'IV'];
  let id = 1;
  for (const name of Object.keys(t)) {
    t[name].forEach((th, i) => LADDER.push({
      id: id++, name, division: roman[i], threshold: th, threshold_promotional: th * 4,
      reward: Math.round(th * 0.004 * 100) / 100,
    }));
  }
  LADDER.push({ id: id++, name: 'infernal-diamond', division: 'I', threshold: 100000000, threshold_promotional: 400000000, reward: 400000 });
})();

function rankFor(wagered) {
  let cur = null;
  let idx = -1;
  for (let i = 0; i < LADDER.length; i++) if (wagered >= LADDER[i].threshold) { cur = LADDER[i]; idx = i; }
  const next = LADDER[idx + 1] || null;
  let pct = 100;
  if (next) {
    const base = cur ? cur.threshold : 0;
    pct = Math.max(0, Math.min(100, ((wagered - base) / (next.threshold - base)) * 100));
  }
  return { cur, next, idx, pct };
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n) => Math.round(n * 100) / 100;
const iso = (ms) => new Date(ms).toISOString();

const GAMES = ['Plinko', 'Mines', 'Chicken Cross', 'Blackjack', 'Hilo', 'Tower', 'Wheel', 'Baccarat', 'Moles', 'War'];
const gameLabel = (g) => {
  const k = String(g || 'plinko').toLowerCase();
  const m = { 'mines-game': 'Mines', mines: 'Mines', plinko: 'Plinko', 'chicken-cross': 'Chicken Cross', chicken: 'Chicken Cross', blackjack: 'Blackjack' };
  return m[k] || (k.charAt(0).toUpperCase() + k.slice(1));
};

module.exports = function (ctx) {
  const S = {
    twoFA: false,
    emailStatsAt: null,
    settings: { tip_notifications: true, mobile_hide_logo: false, hide_balance: false, anonymous: false, language: 'en', timezone: 'UTC', marketing_emails: false },
    affiliateCode: USER.affiliate_code,
    affiliateBalance: 38.42,
    claimed: { daily: 0, weekly: 0, monthly: 0, 'pre-monthly': 0, rakeback: 0, weekly_free_chest: 0 },
    calClaimed: {},
    rankClaimed: {},
    sessions: [
      { id: 'sess-current', current: true, ip: '127.0.0.1', city: 'Local', country: 'US', device: 'Chrome on Windows', browser: 'Chrome', os: 'Windows', created_at: iso(Date.now() - 3600e3), last_active_at: iso(Date.now() - 60e3) },
      { id: 'sess-2', current: false, ip: '192.168.1.24', city: 'Local', country: 'US', device: 'Safari on iOS', browser: 'Safari', os: 'iOS', created_at: iso(Date.now() - 4 * 86400e3), last_active_at: iso(Date.now() - 2 * 86400e3) },
    ],
  };

  const stats = () => ctx.getStats();
  const rewardTotal = () => ctx.getStats().totalWagered;

  function send(res, obj, code) {
    res.writeHead(code || 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
    return true;
  }

  function userObj() {
    const st = stats();
    const rk = rankFor(st.totalWagered);
    const cur = rk.cur;
    const remaining = rk.next ? Math.max(0, r2(rk.next.threshold - st.totalWagered)) : 0;
    return {
      id: USER.id,
      public_id: USER.public_id,
      username: USER.username,
      email: USER.email,
      email_verified_at: USER.registered_at,
      currency: 'USD',
      requires_kyc: false,
      deleted: false,
      missing_fields: [],
      fingerprint_event_required: false,
      intercom: { user_hash: crypto.createHash('sha256').update(USER.id).digest('hex') },
      error: null,
      kyc_level: 4,
      has_2fa: S.twoFA,
      auth: { has_2fa: S.twoFA, email_verified_at: USER.registered_at, type: 'email' },
      tags: [],
      rank: {
        bet_rank: cur ? cur.name : 'unranked',
        bet_rank_division: cur ? cur.division : null,
        next_rank: rk.next ? rk.next.name : null,
        next_rank_division: rk.next ? rk.next.division : null,
        percentage: r2(rk.pct),
        required_to_next_rank_usd: remaining,
        required_to_next_rank_promotional: r2(remaining * 4),
        name: cur ? cur.name : 'unranked',
        level: rk.idx + 1,
        wagered: st.totalWagered,
      },
      profile: {
        registered_at: USER.registered_at,
        bet_count: st.totalBets,
        bet_count_promotional: 0,
        wagered_amount: r2(st.totalWagered),
        wagered_amount_promotional: 0,
        stats_email_next_available_at: S.emailStatsAt,
      },
      preferences: Object.assign({ currency: 'USD', theme: 'dark' }, S.settings),
      affiliate: { balance: S.affiliateBalance, balance_promotional: 0, code: S.affiliateCode, type: 'standard', referred_by: null },
      wallet: { active: { currency: 'USD', primary: ctx.getBal(), promotional: ctx.getPromo(), vault: ctx.getVault() } },
      balances: { primary: ctx.getBal(), promotional: ctx.getPromo(), vault: ctx.getVault() },
      statistics: { total_bets: st.totalBets, total_wagered: st.totalWagered, total_profit: st.totalProfit },
      created_at: USER.registered_at,
    };
  }

  // ---------- bets ----------
  function allBets() {
    const real = ctx.betHistory().map((b) => {
      const ts = b.timestamp ? Date.parse(b.timestamp) : (b.time || Date.now());
      const amount = Number(b.amount) || 0;
      const payout = Number(b.payout) || 0;
      return {
        id: b.id || crypto.randomUUID(),
        game_name: gameLabel(b.game),
        updated_at: iso(ts),
        currency: 'USD',
        currency_amount: amount,
        usd_value: amount,
        currency_payout: payout,
        usd_payout: payout,
        multiplier: Number(b.multiplier) || (amount ? r2(payout / amount) : 0),
        status: b.result === 'pending' ? 'pending' : 'completed',
        balance_type: 'primary',
        _ts: ts,
      };
    });
    const oldest = real.length ? Math.min.apply(null, real.map((r) => r._ts)) : Date.now();
    const rnd = mulberry(1337);
    const filler = [];
    let t = oldest - 5 * 60e3;
    for (let i = 0; i < 80; i++) {
      t -= Math.floor(20e3 + rnd() * 25 * 60e3);
      const amount = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25][Math.floor(rnd() * 8)];
      const win = rnd() < 0.46;
      const mult = win ? r2(1 + rnd() * (rnd() < 0.1 ? 12 : 1.6)) : 0;
      filler.push({
        id: 'g' + Math.floor(rnd() * 1e15).toString(36) + i,
        game_name: GAMES[Math.floor(rnd() * 4)],
        updated_at: iso(t), currency: 'USD', currency_amount: amount, usd_value: amount,
        currency_payout: r2(amount * mult), usd_payout: r2(amount * mult), multiplier: mult,
        status: 'completed', balance_type: 'primary', _ts: t,
      });
    }
    return real.concat(filler);
  }

  // ---------- transactions ----------
  const DEP = ['crypto_deposit', 'deposit', 'astropay_deposit'];
  const WD = ['crypto_withdraw', 'withdraw', 'astropay_withdraw'];
  const RW = ['promo_code', 'bonus_code', 'affiliate_code'];
  function cat(t) { return DEP.includes(t) ? 'deposit' : WD.includes(t) ? 'withdrawal' : RW.includes(t) ? 'reward' : 'other'; }

  function allTx() {
    const rows = [];
    for (const t of ctx.transactionHistory()) {
      if (!t.timestamp || ['bet', 'win', 'cashout'].includes(t.type) || t.amount === undefined) continue;
      const type = cat(t.type);
      const amount = Math.abs(Number(t.amount) || 0);
      const crypto_ = t.type.startsWith('crypto');
      const method = crypto_ ? (t.currency && t.currency !== 'USD' ? String(t.currency).toLowerCase() === 'btc' ? 'bitcoin' : String(t.currency).toLowerCase() : 'bitcoin')
        : t.type === 'vault_deposit' ? 'vault_deposit' : t.type === 'vault_withdraw' ? 'vault_withdraw'
        : t.type === 'swap' ? 'swap' : t.type === 'tip' ? 'tip_sent'
        : RW.includes(t.type) ? 'promotional_code' : type === 'deposit' ? 'card' : 'bank_transfer';
      rows.push({
        id: t.id || crypto.randomUUID(), method, type, status: t.status === 'completed' || !t.status ? 'complete' : t.status,
        usd_value: amount, currency: 'USD', currency_amount: amount, value_promotional: 0,
        updated_at: t.timestamp, external_amount: crypto_ ? amount : null, external_currency: crypto_ ? 'USD' : null,
        external_tx_id: t.txid || null, external_tx_url: null, counter_party: null, _ts: Date.parse(t.timestamp),
      });
    }
    for (const c of ctx.cryptoTx()) {
      const confirmed = true;
      rows.push({
        id: c.id, method: 'bitcoin', type: 'deposit', status: confirmed ? 'complete' : 'pending',
        usd_value: c.usd, currency: 'USD', currency_amount: c.usd, value_promotional: 0,
        updated_at: iso(c.ts), external_amount: c.btc, external_currency: 'BTC',
        external_tx_id: c.txid, external_tx_url: c.txid ? 'https://mempool.space/tx/' + c.txid : null, counter_party: null, _ts: c.ts,
      });
    }
    // believable older history
    const rnd = mulberry(4242);
    const now = Date.now();
    const rewards = ['daily_reward', 'weekly_reward', 'monthly_reward', 'rakeback', 'rank_up_reward', 'vip_reload', 'lossback'];
    for (let i = 0; i < 40; i++) {
      const ts = now - (i + 1) * 86400e3 * (0.6 + rnd() * 1.4) - 3600e3;
      const amt = r2(0.2 + rnd() * 12);
      const m = rewards[Math.floor(rnd() * rewards.length)];
      rows.push({ id: 'r' + i + Math.floor(rnd() * 1e9).toString(36), method: m, type: 'reward', status: 'complete', usd_value: amt, currency: 'USD', currency_amount: amt, value_promotional: 0, updated_at: iso(ts), external_amount: null, external_currency: null, external_tx_id: null, external_tx_url: null, counter_party: null, _ts: ts });
    }
    for (let i = 0; i < 8; i++) {
      const ts = now - (i + 2) * 5 * 86400e3 - rnd() * 86400e3;
      const usd = Math.round(50 + rnd() * 450);
      const coin = [['bitcoin', 'BTC', 64000], ['ethereum', 'ETH', 3200], ['litecoin', 'LTC', 85], ['usdt', 'USDT', 1]][i % 4];
      const base = { currency: 'USD', value_promotional: 0, updated_at: iso(ts), external_currency: coin[1], external_amount: +(usd / coin[2]).toFixed(coin[2] > 1 ? 6 : 2), external_tx_id: crypto.randomBytes(32).toString('hex'), external_tx_url: null, counter_party: null, _ts: ts, usd_value: usd, currency_amount: usd };
      rows.push(Object.assign({ id: 'd' + i + Math.floor(rnd() * 1e9).toString(36), method: coin[0], type: 'deposit', status: 'complete' }, base));
      if (i % 2 === 0) rows.push(Object.assign({}, base, { id: 'w' + i + Math.floor(rnd() * 1e9).toString(36), type: 'withdrawal', method: coin[0], usd_value: Math.round(usd * 0.6), currency_amount: Math.round(usd * 0.6), external_amount: +(usd * 0.6 / coin[2]).toFixed(coin[2] > 1 ? 6 : 2), _ts: ts + 3 * 86400e3, updated_at: iso(ts + 3 * 86400e3), external_tx_id: crypto.randomBytes(32).toString('hex') }));
    }
    const other = ['tip_sent', 'tip_received', 'vault_deposit', 'vault_withdraw'];
    for (let i = 0; i < 6; i++) {
      const ts = now - (i + 1) * 3 * 86400e3 - rnd() * 86400e3;
      const amt = r2(1 + rnd() * 20);
      const m = other[i % 4];
      rows.push({ id: 'o' + i + Math.floor(rnd() * 1e9).toString(36), method: m, type: 'other', status: 'complete', usd_value: amt, currency: 'USD', currency_amount: amt, value_promotional: 0, updated_at: iso(ts), external_amount: null, external_currency: null, external_tx_id: null, external_tx_url: null, counter_party: m.startsWith('tip') ? { username: 'luckyfox', public_id: 'LUCKYFOX01' } : null, _ts: ts });
    }
    return rows;
  }

  function paginate(list, url, per) {
    const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
    const n = parseInt(url.searchParams.get('num') || url.searchParams.get('per_page')) || per;
    return { items: list.slice((page - 1) * n, page * n), meta: { total: list.length, total_pages: Math.max(1, Math.ceil(list.length / n)), page, per_page: n } };
  }
  const strip = (arr) => arr.map((o) => { const c = Object.assign({}, o); delete c._ts; return c; });

  // ---------- rewards ----------
  function rewardsAvailable() {
    const now = Date.now();
    const st = stats();
    const rk = rankFor(st.totalWagered);
    const chest = (k, period) => {
      const last = S.claimed[k];
      const claimable = last && now - last < period ? iso(last + period) : iso(now - 1000);
      return { claimable, status: last && now - last < period ? 'CLAIMED' : 'AVAILABLE' };
    };
    return {
      chest_rewards: {
        daily: chest('daily', 86400e3),
        weekly: chest('weekly', 7 * 86400e3),
        monthly: chest('monthly', 30 * 86400e3),
        pre_monthly: chest('pre-monthly', 30 * 86400e3),
      },
      rakeback: { claimable: iso(S.claimed.rakeback ? S.claimed.rakeback + 4 * 3600e3 : now - 1000), sufficient_funds: true, status: 'AVAILABLE', amount: r2(st.totalWagered * 0.0005 + 1.25) },
      rakeback_boost: null,
      calendar: true,
      special_rewards: {
        vip_reload: { claimable: iso(now + 2 * 86400e3), next_amount: rk.cur ? r2(rk.cur.reward / 2) : 0, total_pending: 0, status: 'NOT_CLAIMABLE' },
        weekly_free_chest: { claimable: iso(now + 3 * 86400e3), next_amount: 0, total_pending: 0, status: 'NOT_CLAIMABLE' },
      },
      race_rewards: [],
      kick_drops: [],
      raffle_tickets: 0,
    };
  }
  function calendar() {
    const out = [];
    const d0 = new Date();
    d0.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const day = new Date(d0.getTime() + i * 86400e3);
      const ds = day.toISOString().slice(0, 10);
      const slot = (n, h, amt) => {
        const key = ds + n;
        return { claimed: S.calClaimed[key] ? 1 : 0, claimable: iso(day.getTime() + h * 3600e3 - (i === 0 ? 24 * 3600e3 : 0)), currency_amount: amt };
      };
      out.push({ date: ds, currency_reward: 0.75 + i * 0.25, morning: slot('m', 0, 0.25 + i * 0.05), afternoon: slot('a', 8, 0.25 + i * 0.05), evening: slot('e', 16, 0.25 + i * 0.05) });
    }
    return out;
  }
  function claimResult(amount) {
    ctx.setBal(r2(ctx.getBal() + amount));
    ctx.invalidate();
    return { success: true, currency_calendar_reward: 0, currency_instant_reward: amount, currency_amount_redeemed: amount };
  }

  const reRoute = /^\/(?:api\/)?(v1\/.*)$/;

  return async function handle(req, res, pathname, url) {
    const m = pathname.match(reRoute);
    if (!m) return false;
    const p = '/' + m[1].replace(/\/+$/, '');
    const method = req.method;

    if (p === '/v1/user' && method === 'GET') return send(res, userObj());
    if (p === '/v1/auth/me' && method === 'GET') return send(res, userObj());
    if (p === '/v1/public/ranks') {
      return send(res, { ranks: LADDER.map((r) => ({ id: r.id, name: r.name, division: r.division, threshold: r.threshold, threshold_promotional: r.threshold_promotional, reward: r.reward })) });
    }
    if (p === '/v1/user/verification') return send(res, { level: 4, status: 'complete', data: { country: 'US', first_name: 'Local', last_name: 'Player', date_of_birth: '1995-04-12', address: '1 Main St', city: 'Austin', postal_code: '73301', document_type: 'passport' } });
    if (p === '/v1/user/get-verification-details') return send(res, { level: 4, status: 'complete', verified: true });
    if (p === '/v1/user/personal-information') return send(res, { success: true });

    // rewards
    if (p === '/v1/rewards/ranks/status') {
      const rk = rankFor(rewardTotal());
      return send(res, {
        ranks: LADDER.map((r, i) => {
          const claimed = i <= rk.idx;
          const gotIt = S.rankClaimed[r.id] || (claimed && i < rk.idx);
          return { rank_name: r.name, rank_division: r.division, rank_id: r.id, status: gotIt ? 'CLAIMED' : claimed ? 'AVAILABLE' : 'NOT_CLAIMABLE', rank_claimed_amount: gotIt ? r.reward : 0, rank_claimed_amount_promotional: 0 };
        }),
      });
    }
    if (p === '/v1/rewards/rank-claim' && method === 'POST') {
      const rk = rankFor(rewardTotal());
      const r = rk.cur;
      if (r) { S.rankClaimed[r.id] = true; return send(res, claimResult(r.reward)); }
      return send(res, { error: 'er_not_claimable' }, 400);
    }
    if (p === '/v1/rewards/available') return send(res, rewardsAvailable());
    if (p === '/v1/rewards/calendar') return send(res, calendar());
    if (p === '/v1/rewards/calendar-claim' && method === 'POST') {
      const b = await ctx.parseBody(req);
      const key = String(b.date || '') + (b.slot || 'm');
      S.calClaimed[key] = true;
      return send(res, claimResult(0.25));
    }
    if (p === '/v1/rewards/history') {
      const c = (n) => r2(n);
      return send(res, { daily_reward: c(14.5), weekly_reward: c(22), monthly_reward: c(35), premonthly_reward: c(0), rakeback_reward: c(rewardTotal() * 0.0005 + 8), ranks_reward: c(5), other_rewards: c(12), total_rewards: c(96.5 + rewardTotal() * 0.0005) });
    }
    if (p === '/v1/rewards/chest-claim' && method === 'POST') {
      const b = await ctx.parseBody(req);
      const k = b.type || 'daily';
      S.claimed[k] = Date.now();
      const amt = { daily: 0.5, weekly: 2.5, monthly: 10, 'pre-monthly': 5 }[k] || 0.5;
      return send(res, claimResult(amt));
    }
    if (p === '/v1/rewards/rakeback' && method === 'POST') {
      S.claimed.rakeback = Date.now();
      return send(res, claimResult(r2(stats().totalWagered * 0.0005 + 1.25)));
    }
    if (p === '/v1/weekly-free-chest/claim' && method === 'POST') return send(res, claimResult(1));

    // bets
    if (p === '/v1/user/bet-history/casino/csv-download') {
      const csv = 'id,game,time,amount,multiplier,payout\n' + strip(allBets()).map((b) => [b.id, b.game_name, b.updated_at, b.currency_amount, b.multiplier, b.currency_payout].join(',')).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv' });
      res.end(csv);
      return true;
    }
    if (p === '/v1/user/bet-history/sportsbook/sports') return send(res, []);
    if (p === '/v1/user/bet-history/casino/games' || p === '/v1/user/recent-games') {
      return send(res, GAMES.slice(0, 4).map((g, i) => ({ id: i + 1, name: g, slug: g.toLowerCase().replace(/ /g, '-') })));
    }
    if (p === '/v1/user/bet-history/casino' || p === '/v1/user/bet-history') {
      let list = allBets();
      const sort = url.searchParams.get('sort_by') || 'recent';
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const status = url.searchParams.get('status');
      const game = url.searchParams.get('game_id') || url.searchParams.get('game');
      if (search) list = list.filter((b) => b.game_name.toLowerCase().includes(search) || String(b.id).toLowerCase().includes(search));
      if (game) list = list.filter((b) => b.game_name.toLowerCase().replace(/ /g, '-') === String(game).toLowerCase() || String(GAMES.indexOf(b.game_name) + 1) === String(game));
      if (status === 'win') list = list.filter((b) => b.currency_payout > b.currency_amount);
      else if (status === 'loss') list = list.filter((b) => b.currency_payout < b.currency_amount);
      list.sort((a, b) => sort === 'oldest' ? a._ts - b._ts : sort === 'biggest_win' || sort === 'profit' ? (b.currency_payout - b.currency_amount) - (a.currency_payout - a.currency_amount) : sort === 'amount' ? b.currency_amount - a.currency_amount : b._ts - a._ts);
      const pg = paginate(list, url, 10);
      return send(res, { bets: strip(pg.items), meta: pg.meta });
    }

    // transactions
    let tm = p.match(/^\/v1\/user\/transaction-history\/(deposit|withdrawal|reward|other)(\/filters)?$/);
    if (tm) {
      const all = allTx().filter((t) => t.type === tm[1]);
      if (tm[2]) return send(res, Array.from(new Set(all.map((t) => t.method))));
      let list = all;
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const filter = url.searchParams.get('filter');
      if (filter && filter !== 'all') list = list.filter((t) => t.method === filter);
      if (search) list = list.filter((t) => t.method.includes(search) || String(t.id).includes(search) || String(t.external_tx_id || '').includes(search));
      const oldest = url.searchParams.get('sort_by') === 'oldest';
      list.sort((a, b) => oldest ? a._ts - b._ts : b._ts - a._ts);
      const pg = paginate(list, url, 10);
      return send(res, { transactions: strip(pg.items), meta: pg.meta });
    }

    // affiliates
    if (p === '/v1/affiliate/details') {
      const list = affiliates();
      return send(res, {
        referral_code: S.affiliateCode, referral_count: list.length,
        total_wagered: r2(list.reduce((a, b) => a + b.wagered_amount, 0)), total_wagered_promotional: 0,
        total_earnings: r2(list.reduce((a, b) => a + b.income, 0)), total_earnings_promotional: 0,
      });
    }
    if (p === '/v1/affiliate/list') {
      let list = affiliates();
      const search = (url.searchParams.get('search') || '').toLowerCase();
      if (search) list = list.filter((a) => a.username.toLowerCase().includes(search));
      const sort = url.searchParams.get('sort_by');
      list.sort((a, b) => sort === 'income' ? b.income - a.income : Date.parse(b.referred_at) - Date.parse(a.referred_at));
      const pg = paginate(list, url, 10);
      return send(res, { referred_players: pg.items, meta: pg.meta });
    }
    if (p === '/v1/affiliate/set' && method === 'POST') {
      const b = await ctx.parseBody(req);
      const code = String(b.affiliate_code || '').trim();
      if (!/^[A-Za-z0-9_-]{3,20}$/.test(code)) return send(res, { error: 'er_invalid_affiliate_code' }, 400);
      S.affiliateCode = code;
      ctx.invalidate();
      return send(res, { success: true, referral_code: code });
    }
    if (p === '/v1/affiliate/claim' && method === 'POST') {
      const amt = S.affiliateBalance;
      S.affiliateBalance = 0;
      ctx.setBal(r2(ctx.getBal() + amt));
      ctx.invalidate();
      return send(res, { amount_redeemed: amt, amount_redeemed_promotional: 0 });
    }

    // settings & security
    if (p === '/v1/user/settings') {
      if (method === 'PATCH' || method === 'POST' || method === 'PUT') {
        const b = await ctx.parseBody(req);
        Object.assign(S.settings, b);
        ctx.invalidate();
        return send(res, { success: true });
      }
      return send(res, Object.assign({ currency: 'USD', has_2fa: S.twoFA, two_factor_enabled: S.twoFA }, S.settings));
    }
    if (p === '/v1/user/email/statistics' && method === 'POST') {
      S.emailStatsAt = iso(Date.now() + 3600e3);
      return send(res, { success: true });
    }
    if (p === '/v1/auth/sessions') {
      if (method === 'DELETE') { S.sessions = S.sessions.filter((s) => s.current); return send(res, { success: true }); }
      return send(res, { sessions: S.sessions });
    }
    if (p === '/v1/user/settings/setup-2fa') {
      const secret = 'JBSWY3DPEHPK3PXP';
      if (method === 'POST') { S.twoFA = true; ctx.invalidate(); return send(res, { success: true, backup_codes: ['a1b2-c3d4', 'e5f6-a7b8', 'c9d0-e1f2', 'a3b4-c5d6'] }); }
      return send(res, { secret, qr_code: 'otpauth://totp/Rainbet:' + USER.email + '?secret=' + secret + '&issuer=Rainbet', otpauth_url: 'otpauth://totp/Rainbet:' + USER.email + '?secret=' + secret + '&issuer=Rainbet' });
    }
    if (p === '/v1/user/settings/disable-2fa' && method !== 'GET') { S.twoFA = false; ctx.invalidate(); return send(res, { success: true }); }
    if (p === '/v1/auth/change-password' && method !== 'GET') return send(res, { success: true });
    if (p === '/v1/email/resend-validation') return send(res, { success: true });
    if (p === '/v1/user/loss-limit' || p === '/v1/user/loss-limit/check') return send(res, { loss_limit: null, limit: null, enabled: false, active: false });
    if (p === '/v1/user/self-exclusion') return send(res, { self_excluded: false, excluded_until: null });
    if (p === '/v1/user/kick/link/status' || p === '/v1/user/kick/link') return send(res, { linked: false, username: null });
    return false;
  };

  function affiliates() {
    const rnd = mulberry(99);
    const names = ['luckyfox', 'nightowl88', 'cryptoking', 'spinmaster', 'betty_b', 'highroller7', 'dicedan', 'stakeless', 'moonwalker', 'redrum'];
    return names.map((n, i) => {
      const w = r2(300 + rnd() * 24000);
      return { username: n, wagered_amount: w, wagered_amount_promotional: 0, income: r2(w * 0.005), income_promotional: 0, referred_at: iso(Date.now() - (i + 1) * 9 * 86400e3) };
    });
  }
};
