const { keys: routeKeys } = require('../defaults');
const { emit, hooks, statusCodes, generateRoute } = require('./_utils');

module.exports = logout;

function logout(req, res, next) {
  req.session.destroy();
  const responseData = {};

  res.body = responseData;

  hooks.execute('response', generateRoute(routeKeys.logout), req, res, next);

  emit('logoutSuccess', res.body);
  return res.status(statusCodes.ok).json(res.body);
}
