// Browser-side Log out handling, injected into every served page <head> as an inline script.
// Intercepts the Log out menu item before the client sees it, asks for confirmation, then resets
// the fake account on the server and reloads the lobby with fresh defaults.
function logoutClient() {
  if (window.__rbLogoutGuard) return;
  window.__rbLogoutGuard = true;
  var busy = false;

  function isLogout(t) {
    if (!t || !t.closest) return false;
    var el = t.closest('button,a,[role="menuitem"],li,div');
    for (var i = 0; el && i < 4; i++, el = el.parentElement) {
      if (el.closest && el.closest('#rb-logout-modal')) return false;
      var tag = el.tagName;
      var clickable = tag === 'BUTTON' || tag === 'A' || el.getAttribute('role') === 'menuitem';
      if (!clickable) continue;
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(log ?out|sign ?out)$/i.test(txt)) return true;
      if (el.querySelector('img[src*="logout-icon"],svg[src*="logout-icon"]') && txt.length < 20) return true;
      return false;
    }
    return false;
  }

  function close() {
    var m = document.getElementById('rb-logout-modal');
    if (m) m.remove();
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }

  function reset() {
    if (busy) return;
    busy = true;
    var ok = document.getElementById('rb-logout-ok');
    if (ok) { ok.textContent = 'Resetting...'; ok.disabled = true; }
    var done = function () { location.replace('/casino'); };
    fetch('/api/account/reset', { method: 'POST', cache: 'no-store', credentials: 'same-origin' })
      .then(done, done);
  }

  function show() {
    if (document.getElementById('rb-logout-modal')) return;
    var wrap = document.createElement('div');
    wrap.id = 'rb-logout-modal';
    wrap.setAttribute('style', 'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,6,15,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);font-family:inherit');
    wrap.innerHTML =
      '<div role="dialog" aria-modal="true" style="width:100%;max-width:400px;box-sizing:border-box;background:#14172a;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:22px 20px 18px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.6)">' +
      '<div style="font-size:18px;font-weight:700;margin-bottom:8px">Log out?</div>' +
      '<div style="font-size:14px;line-height:1.45;color:rgba(232,229,255,.75);margin-bottom:20px">This will reset your balance, stats and history.</div>' +
      '<div style="display:flex;gap:10px">' +
      '<button id="rb-logout-cancel" type="button" style="flex:1;height:42px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:14px;font-weight:600;cursor:pointer;touch-action:manipulation">Cancel</button>' +
      '<button id="rb-logout-ok" type="button" style="flex:1.4;height:42px;border-radius:8px;border:0;background:#ef4444;color:#fff;font-size:14px;font-weight:700;cursor:pointer;touch-action:manipulation">Log out &amp; reset</button>' +
      '</div></div>';
    wrap.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target === wrap || e.target.id === 'rb-logout-cancel') close();
      else if (e.target.id === 'rb-logout-ok') reset();
    });
    document.body.appendChild(wrap);
    document.addEventListener('keydown', onKey, true);
  }

  function swallow(e) {
    if (!isLogout(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    return true;
  }

  window.addEventListener('click', function (e) {
    if (swallow(e)) show();
  }, true);
  // Keep the client from starting its own logout on press/release of the same tap
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(function (t) {
    window.addEventListener(t, function (e) { if (isLogout(e.target)) e.stopPropagation(); }, true);
  });
}

module.exports = '(' + logoutClient.toString() + ')();';
