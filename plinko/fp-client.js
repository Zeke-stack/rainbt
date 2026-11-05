// Browser-side Fair Play link handling, injected into every new-build page <head> as an inline script.
// Never opens the fair play modal; arms the rig instead and labels the link "Fair Play." while rigged.
function fpClient() {
  var SEL = 'a[href*="modal=fairplay"]';
  var active = false, lastArm = 0, pollTimer = 0, painting = false;

  function game() { return location.pathname.split('/').filter(Boolean).pop() || ''; }

  function strip() {
    try {
      var u = new URL(location.href);
      if (u.searchParams.get('modal') === 'fairplay') {
        ['modal', 'tab', 'gameName'].forEach(function (k) { u.searchParams.delete(k); });
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }
    } catch (e) { /* ignore */ }
  }
  strip();
  window.addEventListener('popstate', strip);

  function paint() {
    painting = true;
    try {
      document.querySelectorAll(SEL).forEach(function (a) {
        var w = document.createTreeWalker(a, 4), n, t = null;
        while ((n = w.nextNode())) { if (n.nodeValue.trim()) t = n; }
        if (!t) return;
        var v = t.nodeValue;
        var base = v.replace(/\.(\s*)$/, '$1');
        var nv = active ? base.replace(/(\S)(\s*)$/, '$1.$2') : base;
        if (nv !== v) t.nodeValue = nv;
      });
    } catch (e) { /* ignore */ }
    painting = false;
  }

  var rawFetch = window.fetch;
  function poll() {
    rawFetch.call(window, '/api/fp-state?game=' + encodeURIComponent(game()), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) { active = !!(j && j.active); paint(); })
      .catch(function () { /* ignore */ });
  }
  function pollSoon() {
    if (pollTimer) return;
    pollTimer = setTimeout(function () { pollTimer = 0; poll(); }, 120);
  }

  function arm() {
    var now = Date.now();
    if (now - lastArm < 600) return;
    lastArm = now;
    rawFetch.call(window, '/api/fp-arm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: game() }), keepalive: true
    }).then(poll, poll);
  }

  function intercept(e) {
    var t = e.target;
    var a = t && t.closest ? t.closest(SEL) : null;
    if (!a) return;
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'click' || e.type === 'touchend') arm();
  }
  ['click', 'auxclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'dblclick']
    .forEach(function (type) {
      document.addEventListener(type, intercept, { capture: true, passive: false });
    });
  document.addEventListener('keydown', function (e) {
    if ((e.key === '>' || e.key === '.') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      arm();
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.closest && e.target.closest(SEL)) {
      e.preventDefault(); e.stopImmediatePropagation(); arm();
    }
  }, true);

  window.fetch = function (input) {
    var p = rawFetch.apply(this, arguments);
    try {
      var u = String((input && input.url) || input);
      if (u.indexOf('fp-state') < 0 && u.indexOf('fp-arm') < 0) p.then(pollSoon, pollSoon);
    } catch (e) { /* ignore */ }
    return p;
  };
  var xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) {
    try {
      if (String(u).indexOf('/original-games/') > -1 || String(u).indexOf('/api/') > -1) this.addEventListener('loadend', pollSoon);
    } catch (e) { /* ignore */ }
    return xo.apply(this, arguments);
  };

  new MutationObserver(function () { if (!painting) paint(); })
    .observe(document, { childList: true, subtree: true, characterData: true });
  setInterval(poll, 1000);
  poll();
}

module.exports = '(' + fpClient.toString() + ')();';
