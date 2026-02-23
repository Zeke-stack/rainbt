// Vercel serverless function — single entry point for all requests
const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  return handler(req, res);
};
