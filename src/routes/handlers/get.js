const {
  emit,
  appModule,
  debugLog,
  statusCodes,
  publicFields
} = require('./_utils');

let responseData;

module.exports = getUsers;

/* GET users listing. */
async function getUsers(req, res) {
  try {
    const store = appModule.get('store');
    const users = [];
    const results = await store.getUsers(req.query);

    results.users.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    responseData = {
      data: {
        total: results.total,
        length: results.length,
        users,
      }
    };

    emit('getUsersSuccess', responseData);
    res.status(statusCodes.ok).json(responseData);
  } catch(err) {
    responseData = {
      errors: [{ msg: 'There was an error retrieving users' }]
    };

    emit('getUsersError', responseData);
    res.status(statusCodes.serverError).json();

    debugLog(`Error retrieving users: ${err}`);
    return;
  }
}
