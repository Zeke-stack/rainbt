'use strict';

const CHAT_USERS = [
  'AceOfSpades7', 'xXBigWinzXx', 'NeonPanda', 'LuckyLynx', 'RogueRaven', 'MiaMoolah', 'CryptoKiwi', 'BettyBlitz',
  'TurboTurtle', 'SilentSnipe', 'MoonshotMike', 'NovaNina', 'ChipsAhoy', 'RollinRiley', 'GhostedGG', 'QueenOfClovers',
  'WagerWiz', 'PixelPirate', 'CloverClub', 'EZDoesIt', 'ValkyrieV', 'LilacLuck', 'StackedSam', 'NightOwl88', 'CobaltKing',
  'HoneyBadger', 'SpinCycle', 'RTP_Ranger', 'GoldRushGG', 'JinxNoMore', 'SakuraSpin', 'BigDipper', 'MintCondition',
  'LuckyStrikes', 'TundraWolf', 'CardShark42', 'MangoMaverick', 'RedlineRex', 'OrbitOllie', 'VelvetAce'
];

module.exports = function createChatApi(ctx) {
  function send(res, value, status) {
    res.writeHead(status || 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
    return true;
  }
  function finite(value) { return Number.isFinite(Number(value)); }
  function round2(value) { return Math.round(Number(value) * 100) / 100; }
  function rankFor(username) {
    const index = CHAT_USERS.indexOf(username);
    return index >= 34 ? 'diamond' : index >= 28 ? 'platinum' : index >= 21 ? 'gold' : index >= 13 ? 'silver' : 'bronze';
  }

  return async function handle(req, res, pathname, url) {
    const route = pathname.match(/^\/(?:api\/)?(v1\/.*)$/);
    const p = route ? '/' + route[1].replace(/\/+$/, '') : pathname.replace(/\/+$/, '');
    const method = req.method;

    if (p === '/v1/user/tip' && method === 'POST') {
      const body = await ctx.parseBody(req);
      const amount = Number(body.amount);
      const balance = typeof body.balance === 'number' && Number.isFinite(body.balance) ? Math.max(0, body.balance) : ctx.getBal();
      const username = String(body.username || '').trim().slice(0, 40);
      if (!username) return send(res, { error: 'er_incorrect_parameter' }, 400);
      if (!Number.isFinite(amount) || amount < 0.1) return send(res, { error: 'er_minimum_tip_is' }, 400);
      if (amount > balance) return send(res, { error: 'er_low_amount' }, 400);
      const next = round2(balance - amount);
      ctx.setBal(next);
      ctx.invalidate();
      return send(res, { success: true, balance: next, amount: round2(amount), username, currency: body.currency || 'USD', tip_id: 'tip-local-' + Date.now() }, 201);
    }

    if (p === '/v1/chat/messages' && method === 'POST') {
      const body = await ctx.parseBody(req);
      const message = String(body.message || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 225);
      if (!message) return send(res, { error: 'er_incorrect_parameter' }, 400);
      return send(res, { success: true, id: 'chat-local-' + Date.now() }, 201);
    }
    if (p === '/v1/chat/messages' && method === 'GET') return send(res, { items: [], next_cursor: null });
    if (p === '/v1/chat/messages' && method === 'DELETE') return send(res, { success: true });
    if (p === '/v1/chat/users' && method === 'GET') {
      const q = String(url.searchParams.get('q') || '').toLowerCase();
      const username = CHAT_USERS.find((name) => name.toLowerCase() === q) || CHAT_USERS.find((name) => name.toLowerCase().includes(q));
      return send(res, username ? { public_id: 'local-chat-' + CHAT_USERS.indexOf(username), username, rank: rankFor(username) } : {});
    }
    if (p === '/v1/chat/moderation/users' && method === 'GET') {
      const id = String(url.searchParams.get('public_id') || url.searchParams.get('user') || '');
      const index = Number(id.replace(/^local-chat-/, ''));
      const username = CHAT_USERS[index] || CHAT_USERS[0];
      return send(res, [{
        ban_history: [], messages: { items: [], next_cursor: null }, moderation_status: null,
        user: { bet_count: 38, rank: rankFor(username), registered_time: '2024-06-01T12:00:00.000Z', username, wagered_amount: 18450 }
      }]);
    }
    if (p === '/v1/chat/bans' && method === 'GET') return send(res, []);
    if (p.startsWith('/v1/chat/unban/') && method === 'POST') return send(res, { success: true });

    if (p === '/api/chat/rain-claim' && method === 'POST') {
      const body = await ctx.parseBody(req);
      const amount = Math.max(0, Math.min(1, Number(body.amount) || 0));
      const balance = typeof body.balance === 'number' && Number.isFinite(body.balance) ? Math.max(0, body.balance) : round2(ctx.getBal() + amount);
      ctx.setBal(round2(balance));
      ctx.invalidate();
      return send(res, { success: true, amount: round2(amount), balance: round2(balance) });
    }
    return false;
  };
};
