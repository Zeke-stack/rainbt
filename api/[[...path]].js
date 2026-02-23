// Vercel catch-all serverless function
// Routes ALL requests through the game-server handler
const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  // Vercel rewrites "/(.*)" → "/api/[[...path]]", which prepends "/api" to req.url.
  // Strip it so handleRequest sees the original path (e.g. "/casino/originals/plinko").
  // Requests to the actual /api/* endpoints become /api/api/* after rewrite,
  // so stripping one /api prefix restores them correctly.
  if (req.url && req.url.startsWith('/api/')) {
    req.url = req.url.slice(4); // "/api/foo" → "/foo"
  } else if (req.url === '/api') {
    req.url = '/';
  }
  return handler(req, res);
};
