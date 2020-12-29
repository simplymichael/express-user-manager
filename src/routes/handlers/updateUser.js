const { emit, hooks, appModule, statusCodes, publicFields } = require('./_utils');
const errorName = 'updateUserError';
let responseData;

module.exports = updateUser;

/* Update user */
async function updateUser(req, res, next) {
  const store = appModule.get('store');
  const routes = appModule.get('routes');
  const { id, firstname, lastname, username, email } = req.body;
  const userData = await store.findById(id);

  if(!userData) {
    responseData = {
      errors: [{
        msg: 'User not found.',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.notFound).json(responseData);
    return;
  }

  await store.updateUser(id, {
    firstname,
    lastname,
    username,
    email
  });

  const user = {};
  const updatedUser = await store.findById(id);

  // Populate the post variable with values we want to return to the client
  publicFields.forEach(key => user[key] = updatedUser[key]);

  responseData = {
    data: { user }
  };

  res.body = responseData;

  hooks.execute('response', routes.updateUser, req, res, next);

  emit('updateUserSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
  return;
}
