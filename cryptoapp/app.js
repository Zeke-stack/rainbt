(function () {
  'use strict';
  var API = window.VL_API || '';
  var COINS = [
    { s: 'BTC', n: 'Bitcoin', c: '#f7931a', d: 8 },
    { s: 'ETH', n: 'Ethereum', c: '#627eea', d: 6 },
    { s: 'SOL', n: 'Solana', c: '#9945ff', d: 4 },
    { s: 'LTC', n: 'Litecoin', c: '#345d9d', d: 4 },
    { s: 'DOGE', n: 'Dogecoin', c: '#c2a633', d: 2 },
    { s: 'USDT', n: 'Tether', c: '#26a17b', d: 2 }
  ];
  var FEE_BTC = 0.00001;
  var CONFS = 3, CONF_MS = 5000;
  var B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  var S = load();
  var prices = { BTC: 67500, ETH: 3450, SOL: 165, LTC: 85, DOGE: 0.16, USDT: 1 };
  var tab = 'home', range = '1W';

  function load() {
    var s;
    try { s = JSON.parse(localStorage.getItem('vl_state') || 'null'); } catch (e) {}
    if (!s) {
      var a = 'bc1q';
      for (var i = 0; i < 38; i++) a += B32[Math.floor(Math.random() * 32)];
      s = { hold: { BTC: 1.2486, ETH: 9.82, SOL: 74.5, LTC: 18.2, DOGE: 6400, USDT: 2150 }, txs: [], addr: a, user: 'Alex Morgan' };
      localStorage.setItem('vl_state', JSON.stringify(s));
    }
    return s;
  }
  function save() { localStorage.setItem('vl_state', JSON.stringify(S)); }
  function $(id) { return document.getElementById(id); }
  function coin(s) { return COINS.filter(function (c) { return c.s === s; })[0]; }
  function usd(n, d) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function amt(n, s) { var c = coin(s); return n.toLocaleString('en-US', { maximumFractionDigits: c ? c.d : 6 }); }
  function total() { return COINS.reduce(function (a, c) { return a + (S.hold[c.s] || 0) * prices[c.s]; }, 0); }

  function rng(seed) { var x = 0; for (var i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  function series(seed, n, endBias) {
    var r = rng(seed), v = 100, out = [];
    for (var i = 0; i < n; i++) { v += (r() - 0.5) * 6 + endBias; out.push(v); }
    return out;
  }
  function change(s) { var r = rng('chg' + s + new Date().toDateString()); return (r() - 0.42) * 8; }
  function path(data, w, h, pad) {
    var mn = Math.min.apply(0, data), mx = Math.max.apply(0, data), sp = mx - mn || 1;
    return data.map(function (v, i) { return (i ? 'L' : 'M') + (i / (data.length - 1) * w).toFixed(1) + ' ' + (pad + (1 - (v - mn) / sp) * (h - pad * 2)).toFixed(1); }).join(' ');
  }
  function spark(s, up) {
    var d = series(s + range, 24, up ? 0.5 : -0.5);
    var col = up ? '#22c55e' : '#ef4444';
    return '<svg class="spark" viewBox="0 0 64 26" preserveAspectRatio="none"><path d="' + path(d, 64, 26, 2) + '" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  function icon(s) { var c = coin(s); return '<div class="coin" style="background:' + c.c + '">' + (s.length > 3 ? s.slice(0, 3) : s) + '</div>'; }
  function toast(t) { var el = $('toast'); el.textContent = t; el.classList.add('on'); setTimeout(function () { el.classList.remove('on'); }, 2200); }

  function confs(tx) { return Math.min(6, Math.floor((Date.now() - tx.ts) / CONF_MS)); }
  function fmtDate(ts) { return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

  // ---------- screens ----------
  function render() {
    var el = $('screen');
    if (tab === 'home') el.innerHTML = home();
    else if (tab === 'markets') el.innerHTML = markets();
    else if (tab === 'activity') el.innerHTML = activity();
    else el.innerHTML = settings();
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
  }
  function home() {
    var t = total(), pct = 2.31, up = pct >= 0;
    var data = series('pf' + range, 60, 0.35); data[data.length - 1] = data[data.length - 1];
    var h = '<div class="top"><div><div class="sub">Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening') + '</div><h1>' + S.user.split(' ')[0] + '</h1></div><div class="avatar">' + S.user.split(' ').map(function (w) { return w[0]; }).join('') + '</div></div>';
    h += '<div class="bal"><div class="sub">Total balance</div><div class="v" id="tot">' + usd(t) + '</div><div class="chg ' + (up ? 'up' : 'dn') + '">' + (up ? '+' : '') + usd(t * pct / 100) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%)</div></div>';
    h += '<div class="chart"><svg viewBox="0 0 340 130" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6" stop-opacity=".35"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs><path d="' + path(data, 340, 130, 8) + ' L340 130 L0 130Z" fill="url(#g)"/><path d="' + path(data, 340, 130, 8) + '" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linejoin="round"/></svg></div>';
    h += '<div class="ranges">' + ['1D', '1W', '1M', '1Y', 'ALL'].map(function (r) { return '<button data-range="' + r + '" class="' + (r === range ? 'on' : '') + '">' + r + '</button>'; }).join('') + '</div>';
    h += '<div class="actions">' + act('send', 'Send', '<path d="M12 19V5M5 12l7-7 7 7"/>') + act('receive', 'Receive', '<path d="M12 5v14M5 12l7 7 7-7"/>') + act('swap', 'Swap', '<path d="M7 4v13M3 13l4 4 4-4M17 20V7M13 11l4-4 4 4"/>') + act('buy', 'Buy', '<path d="M12 5v14M5 12h14"/>') + '</div>';
    h += '<div class="sec"><span>Assets</span></div><div class="list">' + COINS.map(function (c) {
      var q = S.hold[c.s] || 0, ch = change(c.s);
      return '<button class="row" data-asset="' + c.s + '">' + icon(c.s) + '<div class="grow"><div class="nm">' + c.n + '</div><div class="sub">' + amt(q, c.s) + ' ' + c.s + '</div></div><div class="rt"><div class="a">' + usd(q * prices[c.s]) + '</div><div class="sub ' + (ch >= 0 ? 'up' : 'dn') + '">' + (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%</div></div></button>';
    }).join('') + '</div>';
    return h;
  }
  function act(id, l, p) { return '<button data-act="' + id + '"><i><svg viewBox="0 0 24 24">' + p + '</svg></i>' + l + '</button>'; }
  function markets() {
    var h = '<div class="top"><h1>Markets</h1></div><div class="list">';
    COINS.forEach(function (c) {
      var ch = change(c.s);
      h += '<button class="row" data-asset="' + c.s + '">' + icon(c.s) + '<div class="grow"><div class="nm">' + c.n + '</div><div class="sub">' + c.s + '</div></div>' + spark(c.s, ch >= 0) + '<div class="rt" style="min-width:86px"><div class="a">' + usd(prices[c.s], prices[c.s] < 1 ? 4 : 2) + '</div><div class="sub ' + (ch >= 0 ? 'up' : 'dn') + '">' + (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%</div></div></button>';
    });
    return h + '</div>';
  }
  function activity() {
    var h = '<div class="top"><h1>Activity</h1></div>';
    if (!S.txs.length) return h + '<div class="center sub" style="margin-top:80px">No transactions yet</div>';
    h += '<div class="list">' + S.txs.map(function (t, i) {
      var c = confs(t), done = c >= CONFS;
      return '<button class="row" data-tx="' + i + '">' + icon(t.sym) + '<div class="grow"><div class="nm">Sent ' + t.sym + '</div><div class="sub">' + fmtDate(t.ts) + ' · <span class="pill ' + (done ? 'done' : 'pend') + '">' + (done ? 'Confirmed' : 'Pending ' + c + '/' + CONFS) + '</span></div></div><div class="rt"><div class="a">-' + amt(t.amount, t.sym) + '</div><div class="sub">' + usd(t.amount * prices[t.sym]) + '</div></div></button>';
    }).join('') + '</div>';
    return h;
  }
  function settings() {
    function r(l, v) { return '<div class="row"><div class="grow">' + l + '</div><div class="sub">' + (v || '') + '</div></div>'; }
    return '<div class="top"><h1>Profile</h1></div><div class="list" style="margin-bottom:16px"><div class="row"><div class="avatar" style="width:46px;height:46px">' + S.user.split(' ').map(function (w) { return w[0]; }).join('') + '</div><div class="grow"><div class="nm">' + S.user + '</div><div class="sub">Verified · Level 2</div></div></div></div><div class="list">' + r('Security', 'Face ID') + r('Recovery phrase', 'Backed up') + r('Currency', 'USD') + r('Network', 'Mainnet') + r('Notifications', 'On') + r('Help & support') + '</div><div class="center sub" style="margin-top:22px">Vaultline 2.4.1</div>';
  }

  // ---------- sheets ----------
  function openSheet(html) { $('sheet').innerHTML = '<div class="grab"></div>' + html; $('sheet').classList.add('on'); $('sheet-bg').classList.add('on'); $('sheet').scrollTop = 0; }
  function closeSheet() { $('sheet').classList.remove('on'); $('sheet-bg').classList.remove('on'); }
  $('sheet-bg').addEventListener('click', closeSheet);

  function qr(text) {
    var n = 29, r = rng(text), cells = '';
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#000"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#000"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
      if (r() > 0.5) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges">' + cells + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</svg>';
  }

  function receive(sym) {
    sym = sym || 'BTC';
    var addr = sym === 'BTC' ? S.addr : '0x' + S.addr.slice(4).replace(/[^0-9a-f]/g, 'a').padEnd(40, 'c').slice(0, 40);
    openSheet('<div class="sh-t">Receive ' + coin(sym).n + '</div><div class="qr">' + qr(addr) + '</div><div class="addr">' + addr + '</div><div class="center sub" style="margin-bottom:14px">Only send ' + sym + ' to this address.</div><button class="btn" id="cp">Copy address</button>');
    $('cp').onclick = function () { copy(addr); toast('Address copied'); };
  }
  function copy(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(function () {});
    else { var i = document.createElement('input'); i.value = t; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); }
  }

  function validAddr(sym, a) {
    a = a.trim();
    if (sym === 'BTC') return /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(a);
    if (sym === 'ETH' || sym === 'USDT') return /^0x[0-9a-fA-F]{40}$/.test(a);
    if (sym === 'LTC') return /^(ltc1[a-z0-9]{25,62}|[LM][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(a);
    if (sym === 'DOGE') return /^D[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a);
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  }

  function send(sym) {
    sym = sym || 'BTC';
    var c = coin(sym), bal = S.hold[sym] || 0, fee = sym === 'BTC' ? FEE_BTC : 0;
    openSheet('<div class="sh-t">Send ' + c.s + '</div>' +
      '<div class="field"><label>Recipient address</label><div class="in"><input id="sa" placeholder="Paste address" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"><button class="chip" id="paste">Paste</button></div></div>' +
      '<div class="field"><label>Amount (' + c.s + ')</label><div class="in"><input id="sm" inputmode="decimal" placeholder="0.00"><button class="chip" id="max">Max</button></div><div class="sub" style="margin-top:6px" id="eq">≈ $0.00 · Available ' + amt(bal, sym) + ' ' + c.s + '</div></div>' +
      '<div class="err" id="se"></div><button class="btn" id="rv">Review</button>');
    $('paste').onclick = function () {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { $('sa').value = t.trim(); }).catch(function () { toast('Allow paste to continue'); });
      else toast('Long-press the field to paste');
    };
    $('max').onclick = function () { $('sm').value = String(Math.max(0, bal - fee)); upd(); };
    function upd() { var v = parseFloat($('sm').value) || 0; $('eq').textContent = '≈ ' + usd(v * prices[sym]) + ' · Available ' + amt(bal, sym) + ' ' + sym; }
    $('sm').oninput = upd;
    $('rv').onclick = function () {
      var a = $('sa').value.trim(), v = parseFloat($('sm').value), e = $('se');
      if (!validAddr(sym, a)) { e.textContent = 'Enter a valid ' + c.n + ' address.'; return; }
      if (!(v > 0)) { e.textContent = 'Enter an amount to send.'; return; }
      if (v + fee > bal + 1e-12) { e.textContent = 'Insufficient balance.'; return; }
      review(sym, a, v, fee);
    };
  }
  function review(sym, a, v, fee) {
    var p = prices[sym];
    openSheet('<div class="sh-t">Confirm transaction</div><div class="big">' + amt(v, sym) + ' ' + sym + '</div><div class="center sub" style="margin-bottom:16px">≈ ' + usd(v * p) + '</div>' +
      '<div class="kv"><span>To</span><span style="max-width:62%;word-break:break-all;text-align:right;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + a + '</span></div>' +
      '<div class="kv"><span>Network</span><span>' + (sym === 'BTC' ? 'Bitcoin' : coin(sym).n) + '</span></div>' +
      '<div class="kv"><span>Network fee</span><span>' + (fee ? fee + ' BTC (~' + usd(fee * prices.BTC) + ')' : '~$0.40') + '</span></div>' +
      '<div class="kv"><span>Total</span><span>' + amt(v + fee, sym) + ' ' + sym + '</span></div>' +
      '<button class="btn" id="go" style="margin-top:18px">Confirm &amp; send</button><button class="btn ghost" id="bk">Back</button>');
    $('bk').onclick = function () { send(sym); };
    $('go').onclick = function () {
      $('go').disabled = true; $('go').textContent = 'Signing…';
      var done = function (txid) {
        S.hold[sym] = Math.max(0, (S.hold[sym] || 0) - v - fee);
        S.txs.unshift({ sym: sym, amount: v, fee: fee, to: a, ts: Date.now(), txid: txid });
        save(); render(); sent(S.txs[0]);
      };
      if (sym === 'BTC') {
        fetch(API + '/api/crypto/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: a, amount: v }) })
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (j) { done(j.txid); })
          .catch(function () { $('go').disabled = false; $('go').textContent = 'Confirm & send'; toast('Network error. Try again.'); });
      } else {
        setTimeout(function () { done(Array.apply(0, Array(64)).map(function () { return Math.floor(Math.random() * 16).toString(16); }).join('')); }, 900);
      }
    };
  }
  function sent(t) {
    openSheet('<div class="ok"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></div><div class="sh-t" style="margin-bottom:6px">Transaction sent</div><div class="center sub" style="margin-bottom:18px">Your ' + t.sym + ' is on its way. It will confirm after ' + CONFS + ' network confirmations.</div><div class="kv"><span>Amount</span><span>' + amt(t.amount, t.sym) + ' ' + t.sym + '</span></div><div class="kv"><span>Transaction ID</span><span style="font-family:ui-monospace,Menlo,monospace;font-size:12px">' + t.txid.slice(0, 10) + '…' + t.txid.slice(-6) + '</span></div><button class="btn" id="dn" style="margin-top:18px">Done</button>');
    $('dn').onclick = closeSheet;
  }
  function txDetail(i) {
    var t = S.txs[i], c = confs(t), done = c >= CONFS;
    openSheet('<div class="sh-t">Sent ' + t.sym + '</div><div class="big">-' + amt(t.amount, t.sym) + ' ' + t.sym + '</div><div class="center" style="margin-bottom:14px"><span class="pill ' + (done ? 'done' : 'pend') + '">' + (done ? 'Confirmed' : 'Pending ' + c + '/' + CONFS) + '</span></div>' +
      '<div class="kv"><span>Date</span><span>' + fmtDate(t.ts) + '</span></div><div class="kv"><span>To</span><span style="max-width:62%;word-break:break-all;text-align:right;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + t.to + '</span></div><div class="kv"><span>Network fee</span><span>' + (t.fee || 0) + ' BTC</span></div><div class="kv"><span>Transaction ID</span><span style="max-width:62%;word-break:break-all;text-align:right;font-family:ui-monospace,Menlo,monospace;font-size:11px">' + t.txid + '</span></div>');
  }
  function assetSheet(sym) {
    var c = coin(sym), q = S.hold[sym] || 0, ch = change(sym), data = series(sym + range, 50, ch >= 0 ? 0.4 : -0.4);
    openSheet('<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">' + icon(sym) + '<div><div class="nm" style="font-size:18px">' + c.n + '</div><div class="sub">' + sym + '</div></div></div><div class="big" style="text-align:left">' + usd(prices[sym], prices[sym] < 1 ? 4 : 2) + '</div><div class="chg ' + (ch >= 0 ? 'up' : 'dn') + '" style="margin-bottom:6px">' + (ch >= 0 ? '+' : '') + ch.toFixed(2) + '% today</div><div class="chart" style="margin-top:0"><svg viewBox="0 0 340 130" preserveAspectRatio="none"><path d="' + path(data, 340, 130, 8) + '" fill="none" stroke="' + (ch >= 0 ? '#22c55e' : '#ef4444') + '" stroke-width="2.2" stroke-linejoin="round"/></svg></div>' +
      '<div class="list" style="margin:10px 0 16px"><div class="row"><div class="grow sub">Your balance</div><div class="rt"><div class="a">' + amt(q, sym) + ' ' + sym + '</div><div class="sub">' + usd(q * prices[sym]) + '</div></div></div></div><div class="actions" style="grid-template-columns:1fr 1fr;margin:0"><button class="btn" id="as" style="margin:0">Send</button><button class="btn ghost" id="ar" style="margin:0">Receive</button></div>');
    $('as').onclick = function () { send(sym); };
    $('ar').onclick = function () { receive(sym); };
  }

  // ---------- events ----------
  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { tab = b.dataset.tab; render(); $('screen').scrollTop = 0; } });
  $('screen').addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-range]'))) { range = t.dataset.range; render(); }
    else if ((t = e.target.closest('[data-act]'))) {
      var a = t.dataset.act;
      if (a === 'send') send('BTC'); else if (a === 'receive') receive('BTC'); else toast(a === 'swap' ? 'Swaps are unavailable in your region' : 'Buying is unavailable in your region');
    }
    else if ((t = e.target.closest('[data-asset]'))) assetSheet(t.dataset.asset);
    else if ((t = e.target.closest('[data-tx]'))) txDetail(+t.dataset.tx);
  });

  function refreshPrices() {
    fetch(API + '/api/crypto/prices').then(function (r) { return r.json(); }).then(function (p) { Object.keys(p).forEach(function (k) { prices[k] = p[k]; }); if (!$('sheet').classList.contains('on')) render(); }).catch(function () {});
  }
  refreshPrices();
  setInterval(refreshPrices, 60000);
  setInterval(function () { if (tab === 'activity' && !$('sheet').classList.contains('on')) render(); }, 2500);
  render();
})();
