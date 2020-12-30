const {
  emit,
  hooks,
  appModule,
  statusCodes,
  generateRoute
} = require('./_utils');

module.exports = logout;

function logout(req, res, next) {
  req.session.destroy();
  const routes = appModule.get('routes');
  const responseData = {};

  res.body = responseData;

  hooks.execute('response', generateRoute(routes.logout), req, res, next);

  emit('logoutSuccess', res.body);
  return res.status(statusCodes.ok).json(res.body);
}
