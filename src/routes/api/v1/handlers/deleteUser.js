const { appModule, emit } = require('./_utils');
const debugLog = require('../../../../utils/debug');
const { statusCodes } = require('../../../../utils/http');
const errorName = 'deleteUserError';
let responseData;

module.exports = deleteUser;

async function deleteUser(req, res) {
  try {
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

    responseData = {
      data: {
        user: userData,
      }
    };

    emit('deleteUserSuccess', responseData);
    res.status(statusCodes.ok).json(responseData);
    return;
  } catch(err) {
    responseData = {
      errors: [{ msg: 'There was an error deleting the user' }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.serverError).json(responseData);

    debugLog(`Error deleting user: ${err}`);
    return;
  }
}
