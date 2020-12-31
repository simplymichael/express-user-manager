const emailValidator = require('email-validator');
const { checkPassword, generateAuthToken } = require('../../utils/auth');
const { keys: routeKeys } = require('../defaults');
const {
  env,
  emit,
  hooks,
  appModule,
  statusCodes,
  publicFields,
  generateRoute
} = require('./_utils');
const errorName = 'loginError';
let responseData;

module.exports = login;

async function login(req, res, next) {
  const store = appModule.get('store');
  const { login, password } = req.body;
  const isEmail = emailValidator.validate(login);
  const userData = isEmail
    ? await store.findByEmail(login)
    : await store.findByUsername(login);

  if(!userData) {
    responseData = {
      errors: [{
        msg: 'User not found!',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.notFound).json(responseData);
    return;
  }

  if(!(await checkPassword(password, userData.password))) {
    responseData = {
      errors: [{
        msg: 'The username or password you have provided is invalid',
        param: 'password'
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.notFound).json(responseData);
    return;
  }

  const user = {};

  // Populate the user variable with values we want to return to the client
  publicFields.forEach(key => user[key] = userData[key]);

  req.session.user = user; // Maintain the user's data in current session

  // Create an auth token for the user so we can validate future requests
  const { authTokenSecret, authTokenExpiry } = appModule.get('security') || {};
  const tokenSecret = authTokenSecret || env.AUTH_TOKEN_SECRET;
  const tokenExpiry = authTokenExpiry || env.AUTH_TOKEN_EXPIRY;
  const { token, expiry } = generateAuthToken(
    user.id, user.email, tokenSecret, eval(tokenExpiry) + 's'
  );
  const authorization = { token: `Bearer ${token}`, expiresIn: expiry };

  responseData = {
    data: { user,  authorization }
  };

  res.body = responseData;

  hooks.execute('response', generateRoute(routeKeys.login), req, res, next);

  emit('loginSuccess', res.body);
  res.status(statusCodes.ok).json(res.body);
  return;
}
