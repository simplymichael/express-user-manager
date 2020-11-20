/**
 * Use to only allow actions when user is not logged in.
 * For example, registration and login routes will use this middleware
 */

const emit = require('../utils/emit');
const { statusCodes } = require('../utils/http');

module.exports = notLoggedIn;

function notLoggedIn(req, res, next) {
  if (req.session.user) {
    const responseData = {
      errors: [{
        msg: 'User is already logged in'
      }]
    };

    emit('permissionError', responseData);
    res.status(statusCodes.forbidden).json(responseData);
    return;
  } else {
    next();
  }
}
