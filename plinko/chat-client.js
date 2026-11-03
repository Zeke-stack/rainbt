function chatClient() {
  var BALANCE_KEY = '__rainbet_balance';
  var USERNAME = 'LTTCMARKETONTOP';
  var ranks = ['bronze', 'bronze', 'bronze', 'silver', 'silver', 'gold', 'platinum', 'diamond'];
  var players = [
    'AceOfSpades7','xXBigWinzXx','NeonPanda','LuckyLynx','RogueRaven','MiaMoolah','CryptoKiwi','BettyBlitz','TurboTurtle','SilentSnipe',
    'MoonshotMike','NovaNina','ChipsAhoy','RollinRiley','GhostedGG','QueenOfClovers','WagerWiz','PixelPirate','CloverClub','EZDoesIt',
    'ValkyrieV','LilacLuck','StackedSam','NightOwl88','CobaltKing','HoneyBadger','SpinCycle','RTP_Ranger','GoldRushGG','JinxNoMore',
    'SakuraSpin','BigDipper','MintCondition','LuckyStrikes','TundraWolf','CardShark42','MangoMaverick','RedlineRex','OrbitOllie','VelvetAce'
  ];
  var chatLines = [
    'ggs, that was close 😅','anyone else on originals tonight?','nice hit!!','good luck everyone 🍀','that multiplier is wild','just one more round lol',
    'morning chat ☕','clean win, congrats','what are you all playing?','rain would be clutch right now 🌧️','gg wp','been a good session so far',
    'that animation never gets old','small bets big dreams ✨','lets gooo','anyone tried the new games?','beautiful hit 🔥','we take those',
    'good vibes in here','brb grabbing coffee','almost had it','nice run!','this chat is lucky today','GL all','solid game tbh','wowwww'
  ];
  var singleton = null, active = false, rainState = null, rainTimer = 0, chatterTimer = 0, messageId = 0;
  var rawFetch = window.fetch;
  var ownMessages = Object.create(null);

  function readBalance() {
    try {
      var stored = JSON.parse(localStorage.getItem(BALANCE_KEY) || '{}');
      if (typeof stored.balance === 'number' && stored.ts && Date.now() - stored.ts < 86400000) return stored.balance;
    } catch (e) {}
    return null;
  }
  function writeBalance(amount) {
    amount = Math.max(0, Math.round(Number(amount) * 100) / 100);
    try { localStorage.setItem(BALANCE_KEY, JSON.stringify({ balance: amount, ts: Date.now() })); } catch (e) {}
    try { if (typeof window.__saveBalance === 'function') window.__saveBalance(amount); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('rainbet:balance', { detail: { balance: amount } })); } catch (e) {}
    return amount;
  }
  function rankFor(index) { return ranks[index % ranks.length]; }
  function makeMessage(text, player, at, extra) {
    var item = { id: 'local-chat-' + (++messageId), time: at || Date.now(), username: player.name, rank: player.rank, message: text };
    if (extra) item.details = extra;
    return item;
  }
  function randomPlayer(index) { return { name: players[(index + Math.floor(Math.random() * players.length)) % players.length], rank: rankFor(index + Math.floor(Math.random() * 5)) }; }
  function recentHistory() {
    var output = [];
    for (var i = 0; i < 30; i++) {
      var p = randomPlayer(i), text = chatLines[(i * 7 + Math.floor(Math.random() * chatLines.length)) % chatLines.length];
      if (i === 8) text = 'gg, that was a spicy hit 🔥';
      if (i === 21) text = 'rain soon? 🌧️';
      var item = makeMessage(text, p, Date.now() - (30 - i) * (18000 + Math.floor(Math.random() * 12000)));
      output.push(item);
    }
    var giver = randomPlayer(31);
    output.splice(15, 0, makeMessage('', giver, Date.now() - 260000, {
      amount: 0.75, from: { user: giver.name, rank: giver.rank, currency: 'USD' },
      to: { user: USERNAME, rank: 'bronze' }
    }));
    return output.slice(-30);
  }
  function deliver(event, data) {
    if (!singleton) return;
    var callbacks = (singleton._handlers[event] || []).slice();
    callbacks.forEach(function (callback) { try { callback.call(singleton, data); } catch (e) {} });
  }
  function addPlayerMessage() {
    var p = randomPlayer(Math.floor(Math.random() * players.length));
    if (Math.random() < 0.1) {
      var amount = (0.1 + Math.random() * 1.4).toFixed(2);
      deliver('newMessage', makeMessage('', p, Date.now(), {
        amount: Number(amount), from: { user: p.name, rank: p.rank, currency: 'USD' },
        to: { user: USERNAME, rank: 'bronze' }
      }));
    } else {
      deliver('newMessage', makeMessage(chatLines[Math.floor(Math.random() * chatLines.length)], p));
    }
    scheduleChatter();
  }
  function scheduleChatter() {
    clearTimeout(chatterTimer);
    if (active) chatterTimer = setTimeout(addPlayerMessage, 9000 + Math.floor(Math.random() * 11000));
  }
  function announceRain() {
    var amount = Number((0.05 + Math.random() * 0.16).toFixed(2));
    rainState = { id: 'rain-' + Date.now(), amount: amount, claimed: false, expires: Date.now() + 45000 };
    deliver('newMessage', makeMessage('🌧️ Rain event! Join now to claim your share — limited time!', { name: 'Rainbet', rank: 'diamond' }));
    renderRainWidget();
    clearTimeout(rainTimer);
    rainTimer = setTimeout(function () { if (rainState && !rainState.claimed) { rainState = null; renderRainWidget(); } }, 45000);
  }
  function scheduleRain() {
    clearTimeout(rainTimer);
    if (!active) return;
    rainTimer = setTimeout(function () { announceRain(); if (active) rainTimer = setTimeout(function repeatRain() { announceRain(); if (active) rainTimer = setTimeout(repeatRain, 100000 + Math.floor(Math.random() * 50000)); }, 100000 + Math.floor(Math.random() * 50000)); }, 18000 + Math.floor(Math.random() * 8000));
  }
  function createSocket() {
    var events = Object.create(null), engineEvents = Object.create(null), engine = {
      readyState: 'open', on: function (name, fn) { (engineEvents[name] = engineEvents[name] || []).push(fn); return this; },
      once: function (name, fn) { var self = this; function one() { self.off(name, one); fn.apply(null, arguments); } return this.on(name, one); },
      off: function (name, fn) { if (!name) { engineEvents = Object.create(null); return this; } engineEvents[name] = (engineEvents[name] || []).filter(function (x) { return x !== fn; }); return this; },
      close: function () { this.readyState = 'closed'; return this; }
    };
    var manager = {
      engine: engine, on: function () { return this; }, once: function () { return this; }, off: function () { return this; },
      close: function () { engine.close(); return this; }, _close: function () { engine.close(); return this; }
    };
    var socket = {
      id: 'local-chat-socket', nsp: '/chat', connected: true, disconnected: false, active: true, auth: {}, io: manager,
      _handlers: events,
      on: function (name, fn) { (events[name] = events[name] || []).push(fn); return this; },
      once: function (name, fn) { var self = this; function one() { self.off(name, one); fn.apply(self, arguments); } one.fn = fn; return this.on(name, one); },
      off: function (name, fn) { if (!name) { events = Object.create(null); this._handlers = events; return this; } events[name] = (events[name] || []).filter(function (x) { return x !== fn && x.fn !== fn; }); return this; },
      removeListener: function (name, fn) { return this.off(name, fn); },
      removeAllListeners: function (name) { if (name) delete events[name]; else events = Object.create(null); this._handlers = events; return this; },
      listeners: function (name) { return events[name] || []; }, hasListeners: function (name) { return !!(events[name] && events[name].length); },
      emit: function (name, payload) {
        if (name === 'joinChannel') {
          active = true;
          setTimeout(function () { deliver('initialMessages', recentHistory()); scheduleChatter(); scheduleRain(); }, 40);
        }
        if (name === 'sendMessage' && payload && payload.message) window.__rainbetChatSend(payload.message);
        return this;
      },
      connect: function () {
        var self = this;
        if (self.connected) return self;
        self.connected = true; self.disconnected = false; self.active = true; engine.readyState = 'open';
        setTimeout(function () { (engineEvents.open || []).slice().forEach(function (fn) { try { fn(); } catch (e) {} }); deliver('connect'); }, 30);
        return self;
      },
      disconnect: function () { return this; },
      close: function () { return this; }, open: function () { return this; },
      compress: function () { return this; }, timeout: function () { return this; }, volatile: null
    };
    socket.volatile = socket;
    return socket;
  }
  window.__rainbetChatSocket = function () { if (!singleton) singleton = createSocket(); return singleton; };
  window.__rainbetChatSend = function (text) {
    text = String(text || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 225);
    if (!text) return;
    var self = { name: USERNAME, rank: 'bronze' };
    deliver('newMessage', makeMessage(text, self));
  };
  window.__rainbetChatTip = function (username, amount) {
    var recipient = players.indexOf(username), rank = recipient >= 0 ? rankFor(recipient) : 'bronze';
    var from = { user: USERNAME, rank: 'bronze', currency: 'USD' }, to = { user: username, rank: rank };
    deliver('newMessage', makeMessage('', { name: USERNAME, rank: 'bronze' }, Date.now(), { amount: Number(amount), from: from, to: to }));
  };

  function claimRain() {
    if (!rainState || rainState.claimed) return;
    var amount = rainState.amount, old = readBalance();
    if (old === null) old = Number(window.__LOCAL_BALANCE__) || 9000;
    var next = writeBalance(old + amount), state = rainState;
    state.claimed = true;
    if (rawFetch) rawFetch.call(window, '/api/chat/rain-claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amount, balance: next }) }).catch(function () {});
    deliver('newMessage', makeMessage('claimed $' + amount.toFixed(2) + ' from Rain 🌧️', { name: USERNAME, rank: 'bronze' }));
    renderRainWidget();
    setTimeout(function () { if (rainState === state) { rainState = null; renderRainWidget(); } }, 5000);
  }
  function renderRainWidget() {
    var textarea = document.querySelector('textarea[name="message"]');
    if (!textarea) return;
    var form = textarea.closest('form'), parent = form && form.parentElement;
    if (!parent) return;
    var bar = parent.querySelector('[data-rainbet-rain-widget]');
    if (!rainState) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement('div'); bar.setAttribute('data-rainbet-rain-widget', '1');
      bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 10px 8px;padding:10px 12px;border:1px solid rgba(85,214,177,.35);border-radius:8px;background:linear-gradient(100deg,rgba(20,103,105,.34),rgba(46,69,137,.32));color:#edf7ff;font:500 12px/1.3 system-ui,sans-serif;';
      parent.insertBefore(bar, form);
    }
    bar.innerHTML = '<span>🌧️ <strong>RAIN</strong> · Share the drop</span>';
    var button = document.createElement('button'); button.type = 'button'; button.textContent = rainState.claimed ? 'Claimed' : 'Join · $' + rainState.amount.toFixed(2);
    button.disabled = rainState.claimed;
    button.style.cssText = 'border:0;border-radius:6px;padding:7px 10px;background:#29c6a5;color:#09221e;font:700 12px system-ui,sans-serif;cursor:pointer;white-space:nowrap;';
    button.addEventListener('click', claimRain);
    bar.appendChild(button);
  }
  function addTipActions() {
    var list = document.querySelector('ul[role="list"]');
    if (!list) return;
    list.querySelectorAll('li').forEach(function (row) {
      if (row.querySelector('[data-rainbet-tip]')) return;
      var spans = Array.prototype.slice.call(row.querySelectorAll('span'));
      var nameSpan = spans.find(function (span) { return /:$/.test((span.textContent || '').trim()) && span.className.indexOf('font-semibold') >= 0; });
      if (!nameSpan) return;
      var username = nameSpan.textContent.trim().replace(/:$/, '');
      if (!username || username === USERNAME || username === 'Rainbet') return;
      row.style.position = 'relative';
      var button = document.createElement('button');
      button.type = 'button'; button.textContent = 'Tip'; button.setAttribute('data-rainbet-tip', '1'); button.setAttribute('aria-label', 'Tip ' + username);
      button.style.cssText = 'position:absolute;right:30px;top:7px;z-index:2;border:1px solid rgba(255,255,255,.2);border-radius:5px;padding:3px 7px;background:#252b4a;color:#fff;font:600 10px system-ui,sans-serif;opacity:.72;cursor:pointer;';
      button.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); location.href = location.pathname + '?modal=wallet&tab=tip&user=' + encodeURIComponent(username); });
      row.appendChild(button);
    });
  }
  function patchDisabledComposer() {
    var area = document.querySelector('textarea[name="message"]');
    if (area && area.disabled) area.disabled = false;
    if (area && area.placeholder === 'You are not able to type in chat') area.placeholder = 'Send a message';
    renderRainWidget(); addTipActions();
  }
  var observer = new MutationObserver(function () { patchDisabledComposer(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(patchDisabledComposer, 1500);

  function updateFromResponse(url, method, data, body) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.balance === 'number') writeBalance(data.balance);
    if (data.wallet && data.wallet.active && typeof data.wallet.active.primary === 'number') writeBalance(data.wallet.active.primary);
    if (/\/v1\/user\/tip(?:[/?]|$)/.test(url) && data.success && body) window.__rainbetChatTip(body.username || 'Player', body.amount || 0);
    if (/\/v1\/chat\/messages(?:[/?]|$)/.test(url) && method === 'POST' && body && body.message) window.__rainbetChatSend(body.message);
  }
  function parseBody(body) { try { return typeof body === 'string' ? JSON.parse(body) : body; } catch (e) { return null; } }
  if (rawFetch) window.fetch = function (input, options) {
    options = options || {};
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = String(options.method || (input && input.method) || 'GET').toUpperCase();
    var body = parseBody(options.body);
    if (/\/v1\/user\/tip(?:[/?]|$)/.test(url) && body) { body.balance = readBalance(); options = Object.assign({}, options, { body: JSON.stringify(body) }); }
    return rawFetch.call(this, input, options).then(function (response) {
      if (/\/v1\/user\/tip|\/v1\/chat\/messages/.test(url) && response.ok) response.clone().json().then(function (data) { updateFromResponse(url, method, data, body); }).catch(function () {});
      if (method === 'GET' && /\/v1\/user(?:\?|$)|\/v1\/user\/balance\/primary|\/v1\/user\/wallet/.test(url)) {
        return response.clone().json().then(function (data) {
          var stored = readBalance();
          if (stored === null) return response;
          if (data.wallet && data.wallet.active) data.wallet.active.primary = stored;
          if (data.balances) data.balances.primary = stored;
          if (data.active && typeof data.active.primary === 'number') data.active.primary = stored;
          if (typeof data.amount === 'number') data.amount = stored;
          return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: response.headers });
        }).catch(function () { return response; });
      }
      return response;
    });
  };
  var xhrOpen = XMLHttpRequest.prototype.open, xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) { this.__rainbetChatMethod = String(method || 'GET').toUpperCase(); this.__rainbetChatURL = String(url || ''); return xhrOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (body) {
    var url = this.__rainbetChatURL || '', method = this.__rainbetChatMethod || 'GET', parsed = parseBody(body), xhr = this;
    if (/\/v1\/user\/tip(?:[/?]|$)/.test(url) && parsed && typeof body === 'string') { parsed.balance = readBalance(); body = JSON.stringify(parsed); }
    if (/\/v1\/user\/tip|\/v1\/chat\/messages/.test(url)) this.addEventListener('loadend', function () { if (xhr.status >= 200 && xhr.status < 300) { try { updateFromResponse(url, method, JSON.parse(xhr.responseText), parsed); } catch (e) {} } }, { once: true });
    return xhrSend.call(this, body);
  };
  window.__rainbetChat = { players: players.slice(), claimRain: claimRain, startRain: announceRain, getSocket: window.__rainbetChatSocket };
}
module.exports = '(' + chatClient.toString() + ')();';
