const { emit, appModule, statusCodes, publicFields } = require('./_utils');

let responseData;

module.exports = getUsers;

/* GET users listing. */
async function getUsers(req, res) {
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
}
