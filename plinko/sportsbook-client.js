/* Rainbet sportsbook widget (replaces the geo-locked Betby renderer). Exposes window.BTRenderer. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var fo = function (o) { return o ? Number(o).toFixed(2) : '–'; };
  var hue = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
  var initials = function (n) { return String(n).split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); };

  var CSS = '\
#sbk{--bg:#0f1328;--p1:#141931;--p2:#1b2140;--p3:#242b50;--tx:#e8e5ff;--mu:#7179a5;--ac:#2b9eff;--gr:#2ecc71;--rd:#ff4e4e;--yl:#ffc93c;color:var(--tx);font-size:14px;line-height:1.35;-webkit-tap-highlight-color:transparent}\
#sbk *{box-sizing:border-box}#sbk button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}#sbk a{color:inherit;text-decoration:none}\
#sbk .wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;padding:12px 10px 90px;max-width:1500px;margin:0 auto}\
#sbk .left,#sbk .right{display:none}\
#sbk .main{min-width:0}\
#sbk .tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}#sbk .tabs::-webkit-scrollbar{display:none}\
#sbk .chip{flex:none;display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;background:var(--p1);color:var(--tx);font-weight:600;font-size:13px;white-space:nowrap;border:1px solid transparent}\
#sbk .chip.on{background:var(--ac);color:#fff}#sbk .chip .n{opacity:.7;font-weight:500;font-size:12px}\
#sbk .chip.sm{padding:6px 10px;font-size:12px;border-radius:8px}\
#sbk .live-dot{width:8px;height:8px;border-radius:50%;background:var(--rd);box-shadow:0 0 0 0 rgba(255,78,78,.7);animation:sbkp 1.6s infinite}@keyframes sbkp{70%{box-shadow:0 0 0 7px rgba(255,78,78,0)}100%{box-shadow:0 0 0 0 rgba(255,78,78,0)}}\
#sbk .search{display:flex;align-items:center;gap:8px;background:var(--p1);border-radius:10px;padding:0 12px;margin-bottom:10px;height:40px}\
#sbk .search input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--tx);font-size:16px;height:100%}#sbk .search input::placeholder{color:var(--mu)}\
#sbk h2.sec{font-size:15px;font-weight:700;margin:14px 2px 8px;display:flex;align-items:center;gap:8px}#sbk h2.sec .n{color:var(--mu);font-weight:500;font-size:13px}\
#sbk .lg-card{background:var(--p1);border-radius:12px;margin-bottom:10px;overflow:hidden}\
#sbk .lg-h{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--p2);font-weight:600;font-size:13px}#sbk .lg-h .c{color:var(--mu);font-weight:500}#sbk .lg-h .sp{margin-left:auto;color:var(--mu);font-weight:500;font-size:12px}\
#sbk .ev{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"meta meta" "teams odds";gap:6px 10px;align-items:center;padding:10px 12px;border-top:1px solid rgba(255,255,255,.05);cursor:pointer}\
#sbk .ev:hover{background:rgba(255,255,255,.025)}\
#sbk .meta{grid-area:meta;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--mu)}#sbk .meta .lv{color:var(--rd);font-weight:700;display:flex;align-items:center;gap:5px}#sbk .meta .mo{margin-left:auto;color:var(--ac);font-weight:600}\
#sbk .star{font-size:15px;color:var(--mu);line-height:1}#sbk .star.on{color:var(--yl)}\
#sbk .teams{grid-area:teams;min-width:0;display:flex;flex-direction:column;gap:6px}\
#sbk .tm{display:flex;align-items:center;gap:8px;min-width:0}#sbk .tm .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}#sbk .tm .sc{min-width:22px;text-align:right;font-weight:800;color:var(--yl)}\
#sbk .lg{width:22px;height:22px;border-radius:50%;object-fit:contain;flex:none;background:rgba(255,255,255,.06)}#sbk .lgi{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}\
#sbk .odds{grid-area:odds;display:flex;gap:6px}#sbk .og{display:flex;gap:4px}#sbk .og.x{display:none}\
#sbk .od{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:56px;height:46px;padding:0 6px;border-radius:8px;background:var(--p3);transition:background .15s}\
#sbk .od:hover{background:#2f3763}#sbk .od .ol{font-size:10px;color:var(--mu);max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#sbk .od .ov{font-weight:700;font-size:14px;color:#fff}\
#sbk .od.on{background:var(--ac)}#sbk .od.on .ol{color:#dbeeff}#sbk .od.lock{opacity:.45;pointer-events:none}\
#sbk .od.up .ov{color:var(--gr)}#sbk .od.dn .ov{color:var(--rd)}#sbk .od.up .ov:after{content:"▲";font-size:8px;margin-left:3px}#sbk .od.dn .ov:after{content:"▼";font-size:8px;margin-left:3px}#sbk .od.on .ov{color:#fff}\
#sbk .more{display:none}\
#sbk .back{display:inline-flex;align-items:center;gap:6px;color:var(--mu);font-weight:600;margin:2px 0 10px}\
#sbk .eh{background:linear-gradient(135deg,#1b2a5a,#141931);border-radius:14px;padding:16px;margin-bottom:12px}\
#sbk .eh .lgn{font-size:12px;color:var(--mu);margin-bottom:10px;display:flex;gap:8px;align-items:center}\
#sbk .eh .row{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;text-align:center}#sbk .eh .tt{display:flex;flex-direction:column;align-items:center;gap:6px;font-weight:700;min-width:0}#sbk .eh .tt .lg,#sbk .eh .tt .lgi{width:44px;height:44px;font-size:15px}#sbk .eh .tt span{max-width:100%;overflow:hidden;text-overflow:ellipsis}\
#sbk .eh .mid{font-size:26px;font-weight:800;color:var(--yl);display:flex;flex-direction:column;gap:2px;align-items:center}#sbk .eh .mid small{font-size:12px;color:var(--rd);font-weight:700}#sbk .eh .mid .vs{color:var(--mu);font-size:15px}\
#sbk .mk{background:var(--p1);border-radius:12px;margin-bottom:10px;overflow:hidden}#sbk .mk h3{margin:0;padding:10px 12px;background:var(--p2);font-size:13px;font-weight:700}\
#sbk .mk .g{display:grid;gap:6px;padding:10px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}#sbk .mk .od{flex-direction:row;justify-content:space-between;width:100%;padding:0 12px;gap:8px}#sbk .mk .od .ol{max-width:none;font-size:12px;color:var(--tx);flex:1;text-align:left}\
#sbk .susp{background:rgba(255,201,60,.12);color:var(--yl);border-radius:8px;padding:8px 12px;margin-bottom:10px;font-weight:600;font-size:13px}\
#sbk .empty{padding:36px 16px;text-align:center;color:var(--mu)}#sbk .empty b{display:block;color:var(--tx);font-size:15px;margin-bottom:4px}\
#sbk .slip{background:var(--p1);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;max-height:100%}\
#sbk .sl-t{display:flex;background:var(--p2)}#sbk .sl-t button{flex:1;padding:12px 8px;font-weight:700;color:var(--mu);border-bottom:2px solid transparent}#sbk .sl-t button.on{color:#fff;border-bottom-color:var(--ac)}#sbk .sl-t .bd{display:inline-block;min-width:18px;padding:1px 5px;margin-left:5px;border-radius:9px;background:var(--ac);color:#fff;font-size:11px}\
#sbk .sl-b{padding:10px;overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}\
#sbk .seg{display:flex;background:var(--p2);border-radius:9px;padding:3px;margin-bottom:10px}#sbk .seg button{flex:1;padding:7px;border-radius:7px;font-weight:600;color:var(--mu)}#sbk .seg button.on{background:var(--p3);color:#fff}\
#sbk .si{background:var(--p2);border-radius:10px;padding:10px;margin-bottom:8px;position:relative}#sbk .si .x{position:absolute;right:8px;top:6px;font-size:18px;color:var(--mu);line-height:1;padding:4px}\
#sbk .si .t1{font-weight:700;padding-right:22px;display:flex;gap:8px;justify-content:space-between}#sbk .si .t1 .o{color:var(--ac);white-space:nowrap}#sbk .si .t2{color:var(--mu);font-size:12px;margin-top:2px}#sbk .si .t3{color:var(--mu);font-size:12px}\
#sbk .si.bad{outline:1px solid var(--rd)}#sbk .si .warn{color:var(--yl);font-size:12px;margin-top:4px}\
#sbk .stake{display:flex;align-items:center;gap:6px;background:var(--bg);border-radius:8px;padding:0 10px;height:40px;margin-top:8px}#sbk .stake span{color:var(--mu)}#sbk .stake input{flex:1;min-width:0;width:100%;background:none;border:0;outline:0;color:var(--tx);font-size:16px;font-weight:600;height:100%}\
#sbk .qs{display:flex;gap:6px;margin-top:6px}#sbk .qs button{flex:1;padding:6px 0;border-radius:7px;background:var(--p3);font-size:12px;font-weight:600}\
#sbk .sum{margin-top:10px;display:grid;gap:5px;font-size:13px}#sbk .sum div{display:flex;justify-content:space-between}#sbk .sum .mu{color:var(--mu)}#sbk .sum b{font-weight:700}\
#sbk .place{width:100%;margin-top:12px;height:46px;border-radius:10px;background:var(--gr);color:#06210f;font-weight:800;font-size:15px}#sbk .place[disabled]{background:var(--p3);color:var(--mu);cursor:not-allowed}\
#sbk .msg{margin-top:8px;padding:8px 10px;border-radius:8px;font-size:13px}#sbk .msg.err{background:rgba(255,78,78,.14);color:#ff8f8f}#sbk .msg.ok{background:rgba(46,204,113,.14);color:#6ee7a1}\
#sbk .clr{display:block;margin:2px auto 0;color:var(--mu);font-size:12px;padding:6px}\
#sbk .bt{background:var(--p2);border-radius:10px;padding:10px;margin-bottom:8px}#sbk .bt .h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:700}\
#sbk .st{padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase}#sbk .st.open{background:rgba(43,158,255,.18);color:var(--ac)}#sbk .st.won{background:rgba(46,204,113,.18);color:var(--gr)}#sbk .st.lost{background:rgba(255,78,78,.16);color:var(--rd)}#sbk .st.void{background:rgba(255,255,255,.1);color:var(--mu)}\
#sbk .bl{padding:5px 0;border-top:1px solid rgba(255,255,255,.06);font-size:13px}#sbk .bl .a{display:flex;justify-content:space-between;gap:8px;font-weight:600}#sbk .bl .b{color:var(--mu);font-size:12px}\
#sbk .bt .f{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);font-size:12px;color:var(--mu)}#sbk .bt .f b{display:block;color:var(--tx);font-size:13px}\
#sbk .fab{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:calc(var(--sbk-off,67px) + env(safe-area-inset-bottom,0px) + 12px);z-index:1001;height:48px;padding:0 18px;border-radius:24px;background:var(--ac);color:#fff;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.45);display:flex;align-items:center;gap:8px}#sbk .fab .bd{background:#fff;color:var(--ac);border-radius:10px;min-width:20px;padding:1px 6px;font-size:12px;text-align:center}\
#sbk .sbk-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5100}#sbk.open .sbk-ov{display:block}\
#sbk .toast{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 80px);transform:translateX(-50%);z-index:5300;background:#1b2140;border:1px solid var(--ac);color:#fff;padding:10px 16px;border-radius:10px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:92vw;text-align:center}#sbk .toast.won{border-color:var(--gr)}#sbk .toast.lost{border-color:var(--rd)}\
@media(max-width:1099px){#sbk .slip{position:fixed;left:0;right:0;bottom:0;z-index:5200;max-height:86dvh;height:auto;border-radius:16px 16px 0 0;transform:translateY(105%);transition:transform .25s;padding-bottom:env(safe-area-inset-bottom,0px);display:flex}#sbk.open .slip{transform:none}#sbk .right{display:block;position:static}#sbk .sl-b{min-height:120px}}\
@media(min-width:700px){#sbk .wrap{padding:16px 16px 40px}#sbk .ev{grid-template-columns:minmax(0,1fr) auto;gap:6px 14px}#sbk .og.x{display:flex}}\
@media(min-width:1100px){#sbk .wrap{grid-template-columns:230px minmax(0,1fr) 330px;gap:16px;padding:16px 20px 40px}#sbk .left{display:block}#sbk .right{display:block;position:sticky;top:78px;align-self:start;max-height:calc(100dvh - 96px);display:flex}#sbk .right .slip{width:100%}#sbk .tabs.sports{display:none}#sbk .fab,#sbk .sbk-ov{display:none!important}#sbk .more{display:block;color:var(--mu);font-size:12px}}\
@media(min-width:1500px){#sbk .ev{grid-template-columns:minmax(0,1fr) auto}}\
#sbk .left .box{background:var(--p1);border-radius:12px;padding:6px;margin-bottom:12px}#sbk .left .li{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:8px;font-weight:600;font-size:13px}#sbk .left .li:hover{background:var(--p2)}#sbk .left .li.on{background:var(--p3)}#sbk .left .li .n{margin-left:auto;color:var(--mu);font-size:12px;font-weight:500}#sbk .left h4{margin:8px 10px 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu)}\
';

  function BTRenderer() {}
  BTRenderer.prototype.initialize = function (opts) {
    opts = opts || {};
    var target = opts.target;
    var base = (opts.basename || '/sportsbook').replace(/\/$/, '');
    if (!document.getElementById('sbk-style')) {
      var st = document.createElement('style'); st.id = 'sbk-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    var S = { feed: null, bets: [], slip: [], mode: 'single', pstake: '', tab: 'slip', open: false, q: '', msg: null, prev: {}, sig: '', betsSig: '', lastPath: null, favs: [], placing: false, nextBets: {}, lastBal: null };
    try { S.favs = JSON.parse(localStorage.getItem('sbk_fav') || '[]'); } catch (e) { /* ignore */ }
    target.innerHTML = '<div id="sbk"><div class="wrap"><aside class="left"></aside><main class="main"></main><aside class="right"><div class="slip"></div></aside></div><div class="sbk-ov"></div><button class="fab" style="display:none"></button></div>';
    var root = target.querySelector('#sbk');
    root.style.setProperty('--sbk-off', (opts.mobileBetslipOffsetBottom || 67) + 'px');
    var $left = root.querySelector('.left'), $main = root.querySelector('.main'), $slip = root.querySelector('.slip'), $fab = root.querySelector('.fab'), $ov = root.querySelector('.sbk-ov');
    var dead = false, timers = [];

    // ---------------------------------------------------------------- routing
    function route() {
      var p = location.pathname;
      var i = p.indexOf(base);
      var rest = i >= 0 ? p.slice(i + base.length) : '';
      var seg = rest.split('/').filter(Boolean).map(decodeURIComponent);
      var r = { view: 'home', seg: seg };
      if (!seg.length) return r;
      if (seg[0] === 'live') r.view = 'live';
      else if (seg[0] === 'bets') r.view = 'bets';
      else if (seg[0] === 'favorites') r.view = 'favs';
      else if (seg[0] === 'event' && seg[1]) { r.view = 'event'; r.id = seg[1]; }
      else { r.view = 'sport'; r.slug = seg[0]; r.league = seg[1] || null; }
      return r;
    }
    function go(path) { history.pushState({}, '', base + path); S.lastPath = location.pathname; S.sig = ''; renderAll(); window.scrollTo(0, 0); var sc = document.querySelector('.main-body-container .body-content-container'); if (sc && sc.scrollTo) sc.scrollTo({ top: 0 }); if (opts.onRouteChange) try { opts.onRouteChange({ path: path }); } catch (e) { /* ignore */ } }

    // ---------------------------------------------------------------- data
    function api(path, init) { return fetch(path, init).then(function (r) { return r.json(); }); }
    function poll() {
      if (dead) return;
      api('/sb-api/feed').then(function (f) {
        if (dead || !f || !f.events) return;
        S.feed = f; applyFeedToSlip(); S.lastBal = f.balance; renderAll(true);
      }).catch(function () { /* retry next tick */ });
    }
    function pollBets() {
      if (dead) return;
      api('/sb-api/bets').then(function (r) {
        if (dead || !r || !r.bets) return;
        r.bets.forEach(function (b) {
          var old = S.nextBets[b.id];
          if (old === 'open' && b.status !== 'open') {
            toast(b.status === 'won' ? 'Bet won! +' + money(b.payout) : b.status === 'void' ? 'Bet voided — stake returned' : 'Bet lost', b.status);
            refreshBalance();
          }
          S.nextBets[b.id] = b.status;
        });
        var sg = JSON.stringify(r.bets);
        if (sg !== S.betsSig) { S.bets = r.bets; S.betsSig = sg; renderSlip(); if (route().view === 'bets') renderMain(); renderFab(); }
      }).catch(function () { /* ignore */ });
    }
    function refreshBalance() { try { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); } catch (e) { /* ignore */ } if (opts.onSessionRefresh) try { opts.onSessionRefresh(); } catch (e) { /* ignore */ } }
    function evById(id) { return S.feed && S.feed.events.filter(function (e) { return e.id === id; })[0]; }
    function sportOf(id) { return S.feed && S.feed.sports.filter(function (s) { return s.id === id; })[0]; }

    function applyFeedToSlip() {
      S.slip.forEach(function (it) {
        var ev = evById(it.eventId);
        if (!ev) { it.gone = true; return; }
        it.gone = false; it.susp = !!ev.suspended;
        var mk = ev.markets.filter(function (m) { return m.id === it.market; })[0];
        var oc = mk && mk.outcomes.filter(function (o) { return o.id === it.outcome; })[0];
        if (!oc || !oc.odds) { it.gone = true; return; }
        if (oc.line !== undefined && oc.line !== it.line) { it.line = oc.line; it.outcomeName = oc.name; it.warn = 'Line updated'; }
        it.odds = oc.odds; it.score = ev.score; it.clock = ev.clock; it.live = ev.status === 'live';
      });
    }

    // ---------------------------------------------------------------- slip logic
    function skey(e, m, o) { return e + '|' + m + '|' + o; }
    function inSlip(k) { return S.slip.some(function (i) { return skey(i.eventId, i.market, i.outcome) === k; }); }
    function toggleSel(eventId, market, outcome) {
      var k = skey(eventId, market, outcome);
      var idx = -1; S.slip.forEach(function (i, n) { if (skey(i.eventId, i.market, i.outcome) === k) idx = n; });
      if (idx >= 0) S.slip.splice(idx, 1);
      else {
        var ev = evById(eventId); if (!ev) return;
        var mk = ev.markets.filter(function (m) { return m.id === market; })[0];
        var oc = mk && mk.outcomes.filter(function (o) { return o.id === outcome; })[0];
        if (!oc || !oc.odds || ev.suspended) return;
        // one selection per market in a slip
        S.slip = S.slip.filter(function (i) { return !(i.eventId === eventId && i.market === market); });
        S.slip.push({ eventId: eventId, market: market, outcome: outcome, line: oc.line, odds: oc.odds, stake: '', marketName: mk.name, outcomeName: oc.name, home: ev.home.n, away: ev.away.n, live: ev.status === 'live' });
        S.msg = null;
        if (S.slip.length === 1 && window.innerWidth < 1100) { /* keep sheet closed; fab shows count */ }
      }
      S.tab = 'slip';
      renderAll(); 
    }
    function dupEvents() { var seen = {}, d = false; S.slip.forEach(function (i) { if (seen[i.eventId]) d = true; seen[i.eventId] = 1; }); return d; }
    function totals() {
      var n = S.slip.length;
      if (S.mode === 'parlay' && n >= 2) {
        var odds = S.slip.reduce(function (a, i) { return a * i.odds; }, 1), st = parseFloat(S.pstake) || 0;
        return { stake: st, odds: odds, win: st * odds, valid: st >= 0.1 && !dupEvents() && !S.slip.some(function (i) { return i.gone || i.susp; }) };
      }
      var stake = 0, win = 0, ok = n > 0;
      S.slip.forEach(function (i) { var s = parseFloat(i.stake) || 0; stake += s; win += s * i.odds; if (s < 0.1 || i.gone || i.susp) ok = false; });
      return { stake: stake, odds: n === 1 ? S.slip[0].odds : 0, win: win, valid: ok };
    }
    function place() {
      if (S.placing) return;
      var t = totals(); if (!t.valid) return;
      S.placing = true; S.msg = null; renderSlip();
      var parlay = S.mode === 'parlay' && S.slip.length >= 2;
      var body = { type: parlay ? 'parlay' : 'single', stake: parlay ? parseFloat(S.pstake) : undefined, items: S.slip.map(function (i) { return { eventId: i.eventId, market: i.market, outcome: i.outcome, line: i.line, odds: i.odds, stake: parseFloat(i.stake) || 0 }; }) };
      api('/sb-api/bet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
        S.placing = false;
        if (r && r.ok) {
          r.bets.forEach(function (b) { S.nextBets[b.id] = 'open'; });
          S.slip = []; S.pstake = '';
          S.msg = { t: 'ok', m: (r.bets.length > 1 ? r.bets.length + ' bets placed' : 'Bet placed') + ' — good luck!' };
          S.lastBal = r.balance; refreshBalance(); pollBets();
        } else if (r && r.error === 'odds_changed') {
          S.slip.forEach(function (i) { if (i.eventId === r.eventId && i.market === r.market) { i.odds = r.odds; i.line = r.line; i.warn = 'Odds changed to ' + fo(r.odds) + ' — confirm to accept'; } });
          S.msg = { t: 'err', m: 'Odds changed. Review and place again.' };
        } else {
          S.msg = { t: 'err', m: (r && r.message) || 'Could not place bet.' };
          if (r && r.eventId) S.slip.forEach(function (i) { if (i.eventId === r.eventId) i.bad = true; });
        }
        renderSlip(); renderFab(); renderMain();
      }).catch(function () { S.placing = false; S.msg = { t: 'err', m: 'Network error.' }; renderSlip(); });
    }

    // ---------------------------------------------------------------- html builders
    function logo(t) {
      if (t.l) return '<img class="lg" loading="lazy" referrerpolicy="no-referrer" src="' + esc(t.l) + '" alt="" onerror="this.outerHTML=\'<span class=lgi style=background:hsl(' + hue(t.n) + ',45%,38%)>' + esc(initials(t.n)) + '</span>\'">';
      return '<span class="lgi" style="background:hsl(' + hue(t.n) + ',45%,38%)">' + esc(initials(t.n)) + '</span>';
    }
    function fmtStart(ts) {
      var d = ts - (S.feed ? S.feed.now : Date.now());
      var t = new Date(ts); var hh = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
      var m = Math.max(0, Math.round(d / 60000));
      return hh + ' · ' + (m < 1 ? 'starting' : 'in ' + m + ' min');
    }
    function olabel(m, o, ev) {
      if (m.id === 'ml' || m.id === 'dc') return o.id === 'h' ? '1' : o.id === 'd' ? 'X' : o.id === 'a' ? '2' : o.id.toUpperCase();
      if (m.id === 'total') return (o.id === 'over' ? 'Over ' : 'Under ') + o.line;
      if (m.id === 'hcap') return (o.id === 'h' ? '1 ' : '2 ') + '(' + (o.id === 'h' ? (o.line > 0 ? '+' : '') + o.line : (-o.line > 0 ? '+' : '') + (-o.line)) + ')';
      return o.name;
    }
    function odd(ev, m, o, full) {
      var k = skey(ev.id, m.id, o.id), lock = ev.suspended || !o.odds, on = inSlip(k);
      var prev = S.prev[k], cls = 'od' + (on ? ' on' : '') + (lock ? ' lock' : '');
      if (prev && o.odds && o.odds > prev) cls += ' up'; else if (prev && o.odds && o.odds < prev) cls += ' dn';
      return '<button class="' + cls + '" data-k="' + esc(k) + '" data-e="' + esc(ev.id) + '" data-m="' + m.id + '" data-o="' + o.id + '"><span class="ol">' + esc(full ? o.name : olabel(m, o, ev)) + '</span><span class="ov">' + (lock ? '🔒' : fo(o.odds)) + '</span></button>';
    }
    function evRow(ev) {
      var fav = S.favs.indexOf(ev.id.split('~')[0]) >= 0;
      var live = ev.status === 'live';
      var ml = ev.markets.filter(function (m) { return m.id === 'ml'; })[0];
      var tot = ev.markets.filter(function (m) { return m.id === 'total'; })[0];
      var hc = ev.markets.filter(function (m) { return m.id === 'hcap'; })[0];
      var sp = sportOf(ev.sportId);
      var h = '<div class="ev" data-ev="' + esc(ev.id) + '"><div class="meta">' + (live ? '<span class="lv"><i class="live-dot"></i>LIVE <span data-clock="' + esc(ev.id) + '">' + esc(ev.clock || '') + '</span></span>' : '<span data-start="' + ev.start + '">' + esc(fmtStart(ev.start)) + '</span>') + '<span>' + (sp ? sp.icon : '') + '</span><button class="star' + (fav ? ' on' : '') + '" data-fav="' + esc(ev.id) + '">' + (fav ? '★' : '☆') + '</button><span class="mo">+' + Math.max(0, ev.markets.length - 1) + ' ›</span></div>';
      h += '<div class="teams"><div class="tm">' + logo(ev.home) + '<span class="nm">' + esc(ev.home.n) + '</span>' + (live ? '<span class="sc" data-sh="' + esc(ev.id) + '">' + (ev.score ? ev.score.h : 0) + '</span>' : '') + '</div><div class="tm">' + logo(ev.away) + '<span class="nm">' + esc(ev.away.n) + '</span>' + (live ? '<span class="sc" data-sa="' + esc(ev.id) + '">' + (ev.score ? ev.score.a : 0) + '</span>' : '') + '</div></div>';
      h += '<div class="odds">';
      if (ml) h += '<div class="og">' + ml.outcomes.map(function (o) { return odd(ev, ml, o); }).join('') + '</div>';
      if (tot) h += '<div class="og x">' + tot.outcomes.map(function (o) { return odd(ev, tot, o); }).join('') + '</div>';
      if (hc) h += '<div class="og x">' + hc.outcomes.map(function (o) { return odd(ev, hc, o); }).join('') + '</div>';
      return h + '</div></div>';
    }
    function groupByLeague(list) {
      var g = {}, order = [];
      list.forEach(function (e) { var k = e.sportId + '|' + e.leagueId; if (!g[k]) { g[k] = { name: e.league, country: e.country, sportId: e.sportId, slug: e.leagueSlug, events: [] }; order.push(k); } g[k].events.push(e); });
      return order.map(function (k) { return g[k]; });
    }
    function leagueBlocks(list) {
      return groupByLeague(list).map(function (g) {
        var sp = sportOf(g.sportId);
        return '<div class="lg-card"><a class="lg-h" href="' + base + '/' + (sp ? sp.slug : '') + '/' + g.slug + '" data-nav="/' + (sp ? sp.slug : '') + '/' + g.slug + '"><span>' + (sp ? sp.icon : '') + '</span><span class="c">' + esc(g.country) + '</span><span>' + esc(g.name) + '</span><span class="sp">' + g.events.length + (g.events.length === 1 ? ' event ' : ' events ') + '›</span></a>' + g.events.map(evRow).join('') + '</div>';
      }).join('');
    }
    function matchQ(e) { if (!S.q) return true; var q = S.q.toLowerCase(); return (e.home.n + ' ' + e.away.n + ' ' + e.league).toLowerCase().indexOf(q) >= 0; }

    function sportTabs(r) {
      var f = S.feed, live = f.events.filter(function (e) { return e.status === 'live'; }).length;
      var h = '<div class="tabs sports"><a class="chip' + (r.view === 'home' ? ' on' : '') + '" href="' + base + '" data-nav="">All</a><a class="chip' + (r.view === 'live' ? ' on' : '') + '" href="' + base + '/live" data-nav="/live"><i class="live-dot"></i>Live <span class="n">' + live + '</span></a>';
      f.sports.forEach(function (s) { if (!s.count) return; h += '<a class="chip' + (r.view === 'sport' && r.slug === s.slug ? ' on' : '') + '" href="' + base + '/' + s.slug + '" data-nav="/' + s.slug + '"><span>' + s.icon + '</span>' + esc(s.name) + ' <span class="n">' + s.count + '</span></a>'; });
      return h + '<a class="chip" href="' + base + '/bets" data-nav="/bets">My Bets</a></div>';
    }
    function renderLeft() {
      if (!S.feed) { $left.innerHTML = ''; return; }
      var r = route(), f = S.feed, live = f.events.filter(function (e) { return e.status === 'live'; }).length;
      var h = '<div class="box"><a class="li' + (r.view === 'home' ? ' on' : '') + '" href="' + base + '" data-nav="">🏠 Home</a><a class="li' + (r.view === 'live' ? ' on' : '') + '" href="' + base + '/live" data-nav="/live"><i class="live-dot"></i>Live now<span class="n">' + live + '</span></a><a class="li' + (r.view === 'favs' ? ' on' : '') + '" href="' + base + '/favorites" data-nav="/favorites">★ Favorites</a><a class="li' + (r.view === 'bets' ? ' on' : '') + '" href="' + base + '/bets" data-nav="/bets">🧾 My Bets</a></div><div class="box"><h4>Sports</h4>';
      f.sports.forEach(function (s) { if (!s.count) return; h += '<a class="li' + (r.view === 'sport' && r.slug === s.slug ? ' on' : '') + '" href="' + base + '/' + s.slug + '" data-nav="/' + s.slug + '"><span>' + s.icon + '</span>' + esc(s.name) + '<span class="n">' + s.count + '</span></a>'; });
      h += '</div>';
      if (r.view === 'sport') {
        var sp = f.sports.filter(function (s) { return s.slug === r.slug; })[0];
        if (sp) {
          h += '<div class="box"><h4>Leagues</h4>';
          groupByLeague(f.events.filter(function (e) { return e.sportId === sp.id; })).forEach(function (g) { h += '<a class="li' + (r.league === g.slug ? ' on' : '') + '" href="' + base + '/' + sp.slug + '/' + g.slug + '" data-nav="/' + sp.slug + '/' + g.slug + '">' + esc(g.name) + '<span class="n">' + g.events.length + '</span></a>'; });
          h += '</div>';
        }
      }
      var sg = h; if (sg !== $left._sg) { $left.innerHTML = h; $left._sg = sg; }
    }

    function viewHtml(r) {
      var f = S.feed;
      if (!f) return '<div class="empty"><b>Loading sportsbook…</b></div>';
      var evs = f.events, h = sportTabs(r);
      var search = '<label class="search"><span>🔍</span><input class="q" placeholder="Search teams or leagues" value="' + esc(S.q) + '"></label>';
      var byStart = function (a, b) { return a.start - b.start; };
      if (r.view === 'home' || r.view === 'live' || r.view === 'sport' || r.view === 'favs') {
        h += search;
        var list = evs.filter(matchQ), title = '';
        if (r.view === 'live') list = list.filter(function (e) { return e.status === 'live'; });
        if (r.view === 'favs') list = list.filter(function (e) { return S.favs.indexOf(e.id.split('~')[0]) >= 0; });
        if (r.view === 'sport') {
          var sp = f.sports.filter(function (s) { return s.slug === r.slug; })[0];
          if (!sp) return h + '<div class="empty"><b>Sport not found</b></div>';
          list = list.filter(function (e) { return e.sportId === sp.id && (!r.league || e.leagueSlug === r.league); });
          title = sp.icon + ' ' + sp.name;
          var lgs = groupByLeague(evs.filter(function (e) { return e.sportId === sp.id; }));
          h += '<div class="tabs sports"><a class="chip sm' + (!r.league ? ' on' : '') + '" href="' + base + '/' + sp.slug + '" data-nav="/' + sp.slug + '">All leagues</a>' + lgs.map(function (g) { return '<a class="chip sm' + (r.league === g.slug ? ' on' : '') + '" href="' + base + '/' + sp.slug + '/' + g.slug + '" data-nav="/' + sp.slug + '/' + g.slug + '">' + esc(g.name) + '</a>'; }).join('') + '</div>';
        }
        var live = list.filter(function (e) { return e.status === 'live'; }).sort(function (a, b) { return a.sportId - b.sportId || byStart(a, b); });
        var pre = list.filter(function (e) { return e.status !== 'live'; }).sort(byStart);
        if (r.view === 'home') pre = pre.slice(0, 60);
        if (!list.length) return h + '<div class="empty"><b>' + (r.view === 'favs' ? 'No favorite events' : 'No events found') + '</b>' + (r.view === 'favs' ? 'Tap ☆ on an event to follow it.' : 'Try another sport or search.') + '</div>';
        if (live.length) h += '<h2 class="sec"><i class="live-dot"></i>Live now <span class="n">' + live.length + '</span></h2>' + leagueBlocks(live);
        if (pre.length) h += '<h2 class="sec">' + (title ? title + ' · ' : '') + 'Upcoming <span class="n">' + pre.length + '</span></h2>' + leagueBlocks(pre);
        return h;
      }
      if (r.view === 'bets') return h + betsHtml(true);
      if (r.view === 'event') {
        var ev = evById(r.id);
        if (!ev) return h + '<a class="back" href="' + base + '" data-nav="">‹ Back to sportsbook</a><div class="empty"><b>Event not available</b>This event has finished or does not exist.</div>';
        var sp2 = sportOf(ev.sportId), live2 = ev.status === 'live';
        h += '<a class="back" href="' + base + '/' + (sp2 ? sp2.slug : '') + '" data-nav="/' + (sp2 ? sp2.slug : '') + '">‹ ' + esc(sp2 ? sp2.name : 'Back') + '</a>';
        h += '<div class="eh"><div class="lgn"><span>' + (sp2 ? sp2.icon : '') + '</span>' + esc(ev.country) + ' · ' + esc(ev.league) + '</div><div class="row"><div class="tt">' + logo(ev.home) + '<span>' + esc(ev.home.n) + '</span></div><div class="mid">' + (live2 ? '<span><span data-sh="' + esc(ev.id) + '">' + ev.score.h + '</span> : <span data-sa="' + esc(ev.id) + '">' + ev.score.a + '</span></span><small><i class="live-dot" style="display:inline-block"></i> <span data-clock="' + esc(ev.id) + '">' + esc(ev.clock) + '</span></small>' : '<span class="vs">VS</span><small style="color:var(--ac)" data-start="' + ev.start + '">' + esc(fmtStart(ev.start)) + '</small>') + '</div><div class="tt">' + logo(ev.away) + '<span>' + esc(ev.away.n) + '</span></div></div></div>';
        h += '<div data-susp="' + esc(ev.id) + '">' + (ev.suspended ? '<div class="susp">Markets are temporarily suspended</div>' : '') + '</div>';
        ev.markets.forEach(function (m) { h += '<div class="mk"><h3>' + esc(m.name) + '</h3><div class="g">' + m.outcomes.map(function (o) { return odd(ev, m, o, true); }).join('') + '</div></div>'; });
        return h;
      }
      return h;
    }

    function betsHtml(page) {
      var open = S.bets.filter(function (b) { return b.status === 'open'; }), done = S.bets.filter(function (b) { return b.status !== 'open'; });
      if (!S.bets.length) return '<div class="empty"><b>No bets yet</b>Your placed bets will appear here.</div>';
      var card = function (b) {
        var legs = b.legs.map(function (l) {
          var ev = evById(l.eventId), live = ev && ev.status === 'live';
          return '<div class="bl"><div class="a"><span>' + esc(l.outcomeName) + '</span><span>' + fo(l.odds) + '</span></div><div class="b">' + esc(l.home) + ' vs ' + esc(l.away) + ' · ' + esc(l.marketName) + (l.status !== 'open' ? ' · <b class="st ' + l.status + '">' + l.status + '</b> ' + (l.result ? '(' + l.result + ')' : '') : live ? ' · LIVE ' + ev.score.h + '-' + ev.score.a + ' ' + esc(ev.clock) : ev ? ' · starts ' + esc(fmtStart(ev.start)) : '') + '</div></div>';
        }).join('');
        var end = 0; b.legs.forEach(function (l) { var ev = evById(l.eventId); if (ev && ev.end > end) end = ev.end; });
        var eta = b.status === 'open' && end && S.feed ? Math.max(0, Math.round((end - S.feed.now) / 1000)) : 0;
        return '<div class="bt"><div class="h"><span>' + (b.type === 'parlay' ? 'Parlay · ' + b.legs.length + ' legs' : 'Single') + '</span><span class="st ' + b.status + '">' + b.status + '</span></div>' + legs + '<div class="f"><span>Stake<b>' + money(b.stake) + '</b></span><span>Odds<b>' + fo(b.odds) + '</b></span><span>' + (b.status === 'open' ? 'To win' : b.status === 'won' ? 'Payout' : 'Return') + '<b>' + money(b.status === 'open' ? b.potential : b.payout) + '</b></span></div>' + (b.status === 'open' ? '<div class="b" style="color:var(--mu);font-size:12px;margin-top:6px">' + (eta ? 'Settles in ~' + Math.floor(eta / 60) + ':' + ('0' + (eta % 60)).slice(-2) : 'Settling…') + '</div>' : '') + '</div>';
      };
      var h = '';
      if (open.length) h += '<h2 class="sec" style="margin-top:4px">Open <span class="n">' + open.length + '</span></h2>' + open.map(card).join('');
      if (done.length) h += '<h2 class="sec">Settled <span class="n">' + done.length + '</span></h2>' + done.slice(0, page ? 100 : 30).map(card).join('');
      return h;
    }

    function slipHtml() {
      var openN = S.bets.filter(function (b) { return b.status === 'open'; }).length;
      var h = '<div class="sl-t"><button data-tab="slip" class="' + (S.tab === 'slip' ? 'on' : '') + '">Bet Slip' + (S.slip.length ? '<span class="bd">' + S.slip.length + '</span>' : '') + '</button><button data-tab="bets" class="' + (S.tab === 'bets' ? 'on' : '') + '">My Bets' + (openN ? '<span class="bd">' + openN + '</span>' : '') + '</button></div><div class="sl-b">';
      if (S.tab === 'bets') return h + betsHtml(false) + '</div>';
      if (!S.slip.length) {
        h += (S.msg ? '<div class="msg ' + S.msg.t + '" style="margin:0 0 10px">' + esc(S.msg.m) + '</div>' : '') + '<div class="empty"><b>Your bet slip is empty</b>Tap on any odds to add a selection.</div></div>';
        return h;
      }
      var many = S.slip.length >= 2;
      h += '<div class="seg"><button data-mode="single" class="' + (S.mode === 'single' || !many ? 'on' : '') + '">Single</button><button data-mode="parlay" class="' + (S.mode === 'parlay' && many ? 'on' : '') + '"' + '>Parlay</button></div>';
      var single = S.mode === 'single' || !many;
      S.slip.forEach(function (i, n) {
        h += '<div class="si' + (i.bad || i.gone || i.susp ? ' bad' : '') + '" data-i="' + n + '"><button class="x" data-rm="' + n + '">×</button><div class="t1"><span>' + esc(i.outcomeName) + '</span><span class="o" data-so="' + n + '">' + fo(i.odds) + '</span></div><div class="t2">' + esc(i.marketName) + '</div><div class="t3">' + esc(i.home) + ' vs ' + esc(i.away) + (i.live ? ' · <span style="color:var(--rd)">LIVE</span>' : '') + '</div>' + (i.gone ? '<div class="warn">No longer available</div>' : i.susp ? '<div class="warn">Suspended</div>' : i.warn ? '<div class="warn">' + esc(i.warn) + '</div>' : '');
        if (single) h += '<div class="stake"><span>$</span><input inputmode="decimal" data-stake="' + n + '" placeholder="Stake" value="' + esc(i.stake) + '"></div>';
        h += '</div>';
      });
      if (!single) {
        h += '<div class="stake"><span>$</span><input inputmode="decimal" data-pstake placeholder="Stake" value="' + esc(S.pstake) + '"></div>';
        if (dupEvents()) h += '<div class="msg err">Selections from the same event can’t be combined in a parlay.</div>';
      }
      h += '<div class="qs">' + [1, 5, 10, 25, 100].map(function (v) { return '<button data-q="' + v + '">+' + v + '</button>'; }).join('') + '<button data-q="max">Max</button></div>';
      var t = totals();
      h += '<div class="sum"><div><span class="mu">Total stake</span><b data-ts>' + money(t.stake) + '</b></div>' + (single && S.slip.length > 1 ? '' : '<div><span class="mu">Total odds</span><b data-to>' + fo(t.odds) + '</b></div>') + '<div><span class="mu">Potential win</span><b data-tw style="color:var(--gr)">' + money(t.win) + '</b></div></div>';
      if (S.msg) h += '<div class="msg ' + S.msg.t + '">' + esc(S.msg.m) + '</div>';
      h += '<button class="place" data-place ' + (t.valid && !S.placing ? '' : 'disabled') + '>' + (S.placing ? 'Placing…' : 'Place bet' + (single && S.slip.length > 1 ? 's' : '')) + '</button><button class="clr" data-clear>Clear slip</button></div>';
      return h;
    }

    // ---------------------------------------------------------------- render
    function mainSig(r) {
      if (!S.feed) return 'load';
      var parts = [r.view, r.slug, r.league, r.id, S.q, S.favs.join(), S.slip.map(function (i) { return skey(i.eventId, i.market, i.outcome); }).join(), S.bets.length];
      S.feed.events.forEach(function (e) { parts.push(e.id + e.status + (e.suspended ? 's' : '') + e.markets.map(function (m) { return m.outcomes.map(function (o) { return o.line === undefined ? '' : o.line; }).join(','); }).join('')); });
      return parts.join('|');
    }
    function patchMain() {
      S.feed.events.forEach(function (ev) {
        var sh = $main.querySelector('[data-sh="' + ev.id + '"]'), sa = $main.querySelector('[data-sa="' + ev.id + '"]'), ck = $main.querySelector('[data-clock="' + ev.id + '"]');
        if (sh && ev.score) sh.textContent = ev.score.h; if (sa && ev.score) sa.textContent = ev.score.a; if (ck) ck.textContent = ev.clock;
        ev.markets.forEach(function (m) { m.outcomes.forEach(function (o) {
          var k = skey(ev.id, m.id, o.id), prev = S.prev[k];
          var btns = $main.querySelectorAll('[data-k="' + k.replace(/"/g, '') + '"]');
          for (var i = 0; i < btns.length; i++) {
            var b = btns[i], v = b.querySelector('.ov'); if (!v) continue;
            v.textContent = ev.suspended || !o.odds ? '🔒' : fo(o.odds);
            b.classList.toggle('lock', !!(ev.suspended || !o.odds));
            b.classList.remove('up', 'dn');
            if (prev && o.odds && o.odds > prev) b.classList.add('up'); else if (prev && o.odds && o.odds < prev) b.classList.add('dn');
          }
        }); });
        var su = $main.querySelector('[data-susp="' + ev.id + '"]'); if (su) su.innerHTML = ev.suspended ? '<div class="susp">Markets are temporarily suspended</div>' : '';
      });
      var st = $main.querySelectorAll('[data-start]'); for (var i = 0; i < st.length; i++) st[i].textContent = fmtStart(+st[i].getAttribute('data-start'));
    }
    function rememberOdds() { if (!S.feed) return; S.feed.events.forEach(function (ev) { ev.markets.forEach(function (m) { m.outcomes.forEach(function (o) { S.prev[skey(ev.id, m.id, o.id)] = o.odds; }); }); }); }
    function renderMain() {
      var r = route(); var sg = mainSig(r);
      var focusQ = document.activeElement && document.activeElement.classList.contains('q');
      $main.innerHTML = viewHtml(r); S.sig = sg;
      if (focusQ) { var q = $main.querySelector('.q'); if (q) { q.focus(); var l = q.value.length; try { q.setSelectionRange(l, l); } catch (e) { /* ignore */ } } }
    }
    function renderSlip() {
      var a = document.activeElement;
      if (a && $slip.contains(a) && a.tagName === 'INPUT') { updateSlipLight(); return; }
      $slip.innerHTML = slipHtml();
    }
    function updateSlipLight() {
      S.slip.forEach(function (i, n) { var el = $slip.querySelector('[data-so="' + n + '"]'); if (el) el.textContent = fo(i.odds); });
      var t = totals(), a = $slip.querySelector('[data-ts]'), b = $slip.querySelector('[data-to]'), c = $slip.querySelector('[data-tw]'), p = $slip.querySelector('[data-place]');
      if (a) a.textContent = money(t.stake); if (b) b.textContent = fo(t.odds); if (c) c.textContent = money(t.win); if (p) p.disabled = !(t.valid && !S.placing);
    }
    function renderFab() {
      var n = S.slip.length;
      $fab.style.display = n && !S.open ? 'flex' : 'none';
      $fab.innerHTML = 'Bet Slip <span class="bd">' + n + '</span>';
    }
    function renderAll(fromPoll) {
      var r = route();
      if (S.lastPath !== location.pathname) { S.lastPath = location.pathname; S.sig = ''; }
      if (S.feed) {
        var sg = mainSig(r);
        if (fromPoll && sg === S.sig) patchMain(); else renderMain();
        rememberOdds(); renderLeft();
      } else renderMain();
      renderSlip(); renderFab();
      root.classList.toggle('open', S.open);
    }

    // ---------------------------------------------------------------- events
    root.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-fav]'))) { e.preventDefault(); e.stopPropagation(); var id = el.getAttribute('data-fav').split('~')[0], i = S.favs.indexOf(id); if (i >= 0) S.favs.splice(i, 1); else S.favs.push(id); try { localStorage.setItem('sbk_fav', JSON.stringify(S.favs)); } catch (x) { /* ignore */ } S.sig = ''; renderMain(); return; }
      if ((el = t.closest('.od[data-k]'))) { e.preventDefault(); e.stopPropagation(); if (el.classList.contains('lock')) return; toggleSel(el.getAttribute('data-e'), el.getAttribute('data-m'), el.getAttribute('data-o')); return; }
      if ((el = t.closest('[data-nav]'))) { e.preventDefault(); go(el.getAttribute('data-nav')); return; }
      if ((el = t.closest('.ev[data-ev]'))) { go('/event/' + encodeURIComponent(el.getAttribute('data-ev'))); return; }
      if ((el = t.closest('[data-tab]'))) { S.tab = el.getAttribute('data-tab'); renderSlip(); if (S.tab === 'bets') pollBets(); return; }
      if ((el = t.closest('[data-mode]'))) { S.mode = el.getAttribute('data-mode'); S.msg = null; renderSlip(); return; }
      if ((el = t.closest('[data-rm]'))) { S.slip.splice(+el.getAttribute('data-rm'), 1); S.msg = null; S.sig = ''; renderAll(); if (!S.slip.length) closeSheet(); return; }
      if (t.closest('[data-clear]')) { S.slip = []; S.msg = null; S.sig = ''; renderAll(); closeSheet(); return; }
      if (t.closest('[data-place]')) { place(); return; }
      if ((el = t.closest('[data-q]'))) {
        var v = el.getAttribute('data-q'), bal = S.lastBal || 0, parlay = S.mode === 'parlay' && S.slip.length >= 2;
        var cur = function (s) { return parseFloat(s) || 0; };
        var apply = function (s) { return v === 'max' ? String(Math.floor(bal * 100) / 100) : String(Math.round((cur(s) + (+v)) * 100) / 100); };
        if (parlay) S.pstake = apply(S.pstake); else { var f0 = $slip.querySelector('[data-stake]:focus'); var idx = f0 ? +f0.getAttribute('data-stake') : -1; S.slip.forEach(function (i, n) { if (idx < 0 || n === idx) i.stake = v === 'max' ? String(Math.floor(bal / S.slip.length * 100) / 100) : apply(i.stake); }); }
        $slip.innerHTML = slipHtml(); return;
      }
      if (t.closest('.fab')) { S.open = true; root.classList.add('open'); renderFab(); return; }
      if (t.closest('.sbk-ov')) closeSheet();
    });
    function closeSheet() { S.open = false; root.classList.remove('open'); renderFab(); }
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.classList.contains('q')) { S.q = t.value; S.sig = ''; renderMain(); return; }
      var clean = function (v) { v = v.replace(/[^0-9.]/g, ''); var p = v.split('.'); if (p.length > 2) v = p[0] + '.' + p.slice(1).join(''); p = v.split('.'); if (p[1] && p[1].length > 2) v = p[0] + '.' + p[1].slice(0, 2); return v; };
      if (t.hasAttribute('data-stake')) { var it = S.slip[+t.getAttribute('data-stake')]; if (it) { it.stake = clean(t.value); t.value = it.stake; it.bad = false; } updateSlipLight(); }
      if (t.hasAttribute('data-pstake')) { S.pstake = clean(t.value); t.value = S.pstake; updateSlipLight(); }
    });
    root.addEventListener('focusout', function () { setTimeout(function () { if (!dead && !($slip.contains(document.activeElement) && document.activeElement.tagName === 'INPUT')) renderSlip(); }, 0); });
    var onPop = function () { renderAll(); };
    window.addEventListener('popstate', onPop);
    timers.push(setInterval(function () { if (dead) return; if (S.lastPath !== location.pathname) { S.sig = ''; renderAll(); } }, 250));
    timers.push(setInterval(poll, 2500));
    timers.push(setInterval(function () { var f = root.querySelectorAll('.od.up,.od.dn'); for (var i = 0; i < f.length; i++) f[i].classList.remove('up', 'dn'); }, 1600));
    timers.push(setInterval(pollBets, 4000));
    renderAll(); poll(); pollBets();

    return {
      kill: function () { dead = true; timers.forEach(clearInterval); window.removeEventListener('popstate', onPop); if (target) target.innerHTML = ''; },
      updateOptions: function (o) { if (o && o.betSlipOffsetBottom !== undefined) root.style.setProperty('--sbk-off', ((o.betSlipOffsetBottom || 67)) + 'px'); },
    };
  };
  window.BTRenderer = window.BTRenderer || BTRenderer;
})();
