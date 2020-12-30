const {
  emit,
  hooks,
  appModule,
  getValidId,
  statusCodes,
  generateRoute,
} = require('./_utils');
const errorName = 'deleteUserError';
let responseData;

module.exports = deleteUser;

async function deleteUser(req, res, next) {
  const routes = appModule.get('routes');

  if(!req.params.userId || !req.body.userId) {
    responseData = {
      errors: [{
        msg: 'The user id must be specified in the request url and request body!',
      }]
    };

    res.body = responseData;

    hooks.execute('response', generateRoute(routes.deleteUser), req, res, next);

    emit(errorName, res.body);
    res.status(statusCodes.badRequest).json(res.body);
    return;
  }

  if(req.params.userId.toString() !== req.body.userId.toString()) {
    responseData = {
      errors: [{
        msg: 'The user id must be specified in the request url and request body!',
      }]
    };

    res.body = responseData;

    hooks.execute('response', generateRoute(routes.deleteUser), req, res, next);

    emit(errorName, res.body);
    res.status(statusCodes.badRequest).json(res.body);
    return;
  }

  const store = appModule.get('store');
  const { userId } = req.body;
  const userData = await store.findById(userId);

  if(!userData) {
    responseData = {
      errors: [{
        msg: 'User not found!',
      }]
    };

    res.body = responseData;

    hooks.execute('response', generateRoute(routes.deleteUser), req, res, next);

    emit(errorName, res.body);
    res.status(statusCodes.notFound).json(res.body);
    return;
  }

  await store.deleteUser(userId);

  /**
   * If a user is deleting their own account,
   * this should happen in cases where it is not an admin user
   * that is deleting another user.
   * In such cases, once the user deletes their account, we log them out.
   */
  if(getValidId(req.session.user.id) === getValidId(userId)) {
    req.session.user = null; // Kill the user's session
  }

  responseData = {};

  res.body = responseData;

  hooks.execute('response', generateRoute(routes.deleteUser), req, res, next);

  emit('deleteUserSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
  return;
}
