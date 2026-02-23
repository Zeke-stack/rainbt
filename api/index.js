const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  // Vercel rewrites /:path* → /api?__vercel_path=:path*
  // Extract original path from query param
  const idx = (req.url || '').indexOf('?');
  if (idx >= 0) {
    const params = new URLSearchParams((req.url || '').slice(idx + 1));
    const p = params.get('__vercel_path');
    if (p !== null) {
      params.delete('__vercel_path');
      const remaining = params.toString();
      req.url = '/' + p + (remaining ? '?' + remaining : '');
    }
  }
  // Default: if no __vercel_path, serve root
  if (!req.url || req.url === '/api' || req.url === '/api/') {
    req.url = '/';
  }
  return handler(req, res);
};
