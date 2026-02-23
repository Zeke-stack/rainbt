const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  // Vercel rewrites /(.*) → /api/$1
  // So req.url = /api/casino/originals/plinko → strip /api prefix
  if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4);
  } else if (req.url === '/api') {
    req.url = '/';
  }
  return handler(req, res);
};
