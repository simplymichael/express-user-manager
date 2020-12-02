const { emit, statusCodes } = require('./_utils');

module.exports = loggedIn;

function loggedIn(req, res, next) {
  if (!req.session.user) {
    const responseData = {
      errors: [{
        msg: 'Please log in first.'
      }]
    };

    emit('authenticationError', responseData);
    return res.status(statusCodes.forbidden).json(responseData);
  } else {
    next();
  }
}
