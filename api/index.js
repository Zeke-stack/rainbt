// Vercel serverless function — single entry point for all requests
const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  // Vercel rewrite sends /(.*) → /api?__path=/$1
  // Reconstruct req.url from the __path query param so the handler sees the original URL
  const qIdx = req.url.indexOf('?');
  if (qIdx >= 0) {
    const params = new URLSearchParams(req.url.slice(qIdx));
    const originalPath = params.get('__path');
    if (originalPath) {
      params.delete('__path');
      const remaining = params.toString();
      req.url = originalPath + (remaining ? '?' + remaining : '');
    }
  }
  return handler(req, res);
};
