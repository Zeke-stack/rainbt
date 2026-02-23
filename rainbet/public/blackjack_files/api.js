/* Cloudflare Turnstile stub - prevents endless retry errors */
window.turnstile = {
  render: function() { return 'stub'; },
  reset: function() {},
  remove: function() {},
  getResponse: function() { return 'stub-token'; },
  isExpired: function() { return false; }
};
if (typeof window.onLoadTurnstile === 'function') {
  try { window.onLoadTurnstile(); } catch(e) {}
}
