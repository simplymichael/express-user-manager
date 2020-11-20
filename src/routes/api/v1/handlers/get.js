const db = require('../../../../databases/');
const publicFields = require('./_public-fields');
const debugLog = require('../../../../utils/debug');
const { statusCodes } = require('../../../../utils/http');
const User = db.getDriver();

module.exports = getUsers;

/* GET users listing. */
async function getUsers(req, res) {
  try {
    const users = [];
    const results = await User.getUsers({});

    results.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    res.status(statusCodes.ok).json({
      data: { users }
    });
  } catch(err) {
    res.status(statusCodes.serverError).json({
      errors: [{ msg: 'There was an error retrieving users' }]
    });

    debugLog(`Error retrieving users: ${err}`);
    return;
  }
}
