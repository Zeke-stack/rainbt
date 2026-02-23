// Vercel serverless function — single entry point for all requests
const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  // Extract original path from __path query param
  // Set via rewrite: /(.*) → /api?__path=/$1
  // Or via direct fetch: /api?__path=/casino/originals/plinko
  var originalPath = null;

  // Method 1: Vercel auto-parses query into req.query
  if (req.query && req.query.__path) {
    originalPath = req.query.__path;
  }

  // Method 2: Parse from req.url manually
  if (!originalPath) {
    var qIdx = req.url ? req.url.indexOf('?') : -1;
    if (qIdx >= 0) {
      var params = new URLSearchParams(req.url.slice(qIdx));
      originalPath = params.get('__path');
    }
  }

  if (originalPath) {
    req.url = originalPath;
  } else if (req.url && req.url.startsWith('/api')) {
    // Direct hit to /api with no __path — serve homepage
    req.url = '/';
  }

  return handler(req, res);
};
