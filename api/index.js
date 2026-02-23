const handler = require('../plinko/game-server');

module.exports = (req, res) => {
  req.url = '/';
  return handler(req, res);
};
