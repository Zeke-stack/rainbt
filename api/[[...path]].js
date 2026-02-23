// Vercel catch-all serverless function
// Routes ALL requests through the game-server handler
const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  return handler(req, res);
};
