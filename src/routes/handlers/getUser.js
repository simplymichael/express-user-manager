const { keys: routeKeys } = require('../defaults');
const {
  emit,
  hooks,
  statusCodes,
  publicFields,
  generateRoute,
} = require('./_utils');
let responseData;

module.exports = getUser;

/* GET user data */
async function getUser(req, res, next) {
  const user = {};

  // Populate the user variable with values we want to return to the client
  // req.user comes from the loadUser middleware
  publicFields.forEach(key => {
    user[key] = req.user[key];
  });

  responseData = {
    data: { user }
  };

  res.body = responseData;

  hooks.execute('response', generateRoute(routeKeys.getUser), req, res, next);

  emit('getUserSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
}
