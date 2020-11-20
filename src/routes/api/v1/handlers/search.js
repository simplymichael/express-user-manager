const db = require('../../../../databases/');
const publicFields = require('./_public-fields');
const debugLog = require('../../../../utils/debug');
const { statusCodes } = require('../../../../utils/http');
const User = db.getDriver();

module.exports = searchUsers;

/* Search for users */
async function searchUsers(req, res) {
  try {
    let { query, page = 1, limit = 20, sort } = req.query;

    if(!query || query.trim().length === 0) {
      return res.status(statusCodes.badRequest).json({
        errors: [{
          location: 'query',
          msg: 'Please specify the query to search by',
          param: 'query'
        }]
      });
    }

    const users = [];
    const results = await User.searchUsers({ query, page, limit, sort});

    results.users.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    return res.status(statusCodes.ok).json({
      data: {
        total: results.total,
        length: results.length,
        users,
      }
    });
  } catch(err) {
    debugLog(`User search error: ${err}`);

    return res.status(statusCodes.serverError).json({
      errors: [{
        msg: 'There was an error processing your request. Please, try again',
      }]
    });
  }
}
