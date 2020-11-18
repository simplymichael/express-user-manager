/**
 * Use to only allow actions when user is not logged in.
 * For example, registration and login routes will use this middleware
 */

const { statusCodes } = require('../utils/http');

function notLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.status(statusCodes.forbidden).json({
      errors: [{
        msg: 'You are already logged in'
      }]
    });
  } else {
    next();
  }
}

module.exports = notLoggedIn;
