const {
  emit,
  hooks,
  appModule,
  statusCodes,
  publicFields,
  generateRoute,
} = require('./_utils');

let responseData;

module.exports = getUsers;

/* GET users listing. */
async function getUsers(req, res, next) {
  const store = appModule.get('store');
  const routes = appModule.get('routes');
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

  res.body = responseData;

  hooks.execute('response', generateRoute(routes.list), req, res, next);

  emit('getUsersSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
}
