const { emit, statusCodes } = require('./_utils');

/**
 * Lets a user only perform actions on their own profiles,
 * not other users'
 */
function restrictUserToSelf(req, res, next) {
  if (!req.session.user || (req.session.user.id !== req.body.id)) {
    const responseData = {
      errors: [{
        msg: 'Unauthorized'
      }]
    };

    emit('authorizationError', responseData);
    return res.status(statusCodes.unauthorized).json(responseData);
  } else {
    next();
  }
}

module.exports = restrictUserToSelf;
