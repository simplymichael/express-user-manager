const {
  emit,
  hooks,
  appModule,
  statusCodes,
  publicFields,
  generateRoute
} = require('./_utils');
const errorName = 'searchUsersError';
let responseData;

module.exports = searchUsers;

/* Search for users */
async function searchUsers(req, res, next) {
  const store = appModule.get('store');
  const routes = appModule.get('routes');
  let { query, by = '', page = 1, limit = 20, sort = '' } = req.query;

  if(!query || query.trim().length === 0) {
    responseData = {
      errors: [{
        location: 'query',
        msg: 'Please specify the query to search by',
        param: 'query'
      }]
    };


    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
    return;
  }

  const users = [];
  const results = await store.searchUsers({ query, by, page, limit, sort});

  results.users.forEach(user => {
    const currUser = {};

    // Populate the user variable with values we want to return to the client
    publicFields.forEach(key => currUser[key] = user[key]);

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

  hooks.execute('response', generateRoute(routes.search), req, res, next);

  emit('searchUsersSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
  return;
}
