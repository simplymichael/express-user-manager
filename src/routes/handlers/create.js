const {
  emit,
  hooks,
  appModule,
  statusCodes,
  publicFields,
  generateRoute,
} = require('./_utils');
const { hashPassword } = require('../../utils/auth');
const errorName = 'signupError';
let responseData;

module.exports = createUser;

/* Create (i.e, register) a new user */
async function createUser(req, res, next) {
  const store = appModule.get('store');
  const routes = appModule.get('routes');
  const { firstname, lastname, username, email, password } = req.body;

  if(await store.findByEmail(email)) {
    responseData = {
      errors: [{
        value: email,
        location: 'body',
        msg: 'That email address is not available!',
        param: 'email'
      }]
    };

    emit(errorName, responseData);

    res.status(statusCodes.conflict).json(responseData);
    return;
  }

  if(await store.findByUsername(username)) {
    responseData = {
      errors: [{
        value: username,
        location: 'body',
        msg: 'That username is not available!',
        param: 'username'
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.conflict).json(responseData);
    return;
  }

  const user = {};
  const hashedPassword = await hashPassword(password);
  const data = await store.createUser({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
  });

  // Populate the user variable with values we want to return to the client
  publicFields.forEach(key => user[key] = data[key]);

  responseData = {
    data: { user }
  };

  res.body = responseData;

  hooks.execute('response', generateRoute(routes.signup), req, res, next);

  emit('signupSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
  return;
}
