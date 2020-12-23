const { emit, appModule, statusCodes } = require('./_utils');
const errorName = 'deleteUserError';
let responseData;

module.exports = deleteUser;

async function deleteUser(req, res) {
  if(!req.params.userId || !req.body.userId) {
    responseData = {
      errors: [{
        msg: 'The user id must be specified in the request url and request body!',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
    return;
  }

  if(req.params.userId.toString() !== req.body.userId.toString()) {
    responseData = {
      errors: [{
        msg: 'The user id must be specified in the request url and request body!',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
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

    emit(errorName, responseData);
    res.status(statusCodes.notFound).json(responseData);
    return;
  }

  await store.deleteUser(userId);

  req.session.user = null; // Kill the user's session

  responseData = {};

  emit('deleteUserSuccess', responseData);
  res.status(statusCodes.ok).json(responseData);
  return;
}
