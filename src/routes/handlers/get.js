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
    const results = await store.getUsers({});

    results.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    responseData = {
      data: { users }
    };

    emit('getAllUsersSuccess', responseData);
    res.status(statusCodes.ok).json(responseData);
  } catch(err) {
    responseData = {
      errors: [{ msg: 'There was an error retrieving users' }]
    };

    emit('getAllUsersError', responseData);
    res.status(statusCodes.serverError).json();

    debugLog(`Error retrieving users: ${err}`);
    return;
  }
}
