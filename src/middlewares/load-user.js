const debugLog = require('../utils/debug');
const { appModule, emit, statusCodes } = require('./_utils');

module.exports = loadUser;

async function loadUser(req, res, next) {
  const db = appModule.get('store');
  const username = req.params.username;

  try {
    const user = await db.findByUsername(username);

    if (!user) {
      res.status(statusCodes.notFound).json({});
      return;
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
