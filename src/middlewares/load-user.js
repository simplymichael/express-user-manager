const { db, emit, statusCodes } = require('./_utils');
const debugLog = require('../utils/debug');

module.exports = loadUser;

async function loadUser(req, res, next) {
  const username = req.params.username;

  try {
    const user = db.findByUsername(username);

    if (!user) {
      return res.status(statusCodes.notFound).json({});
    } else {
      req.user = user;
      next();
    }
  } catch(err) {
    emit('getUserError', {
      errors: [{
        msg: `There was an error retrieving the user data for ${username}`
      }]
    });
    res.status(statusCodes.serverError).json();
    debugLog(`Error retrieving user data for user: ${err}`);
    return;
  }
}
