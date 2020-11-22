/**
 * Use to only allow actions when user is not logged in.
 * For example, registration and login routes will use this middleware
 */

const { emit, statusCodes } = require('./_utils');

module.exports = notLoggedIn;

// TO DO:
// Find a (better?) way to track the user's logged-in status,
// maybe store the logged-in status in a data-store of sorts.
// Using sessions means we are unable to test for them
// since plain consoles do not have sessions built-in.
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
