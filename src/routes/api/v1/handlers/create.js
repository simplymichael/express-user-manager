const { appModule, emit, publicFields } = require('./_utils');
const debugLog = require('../../../../utils/debug');
const { statusCodes } = require('../../../../utils/http');
const { hashPassword } = require('../../../../utils/auth');
const errorName = 'signupError';
let responseData;

module.exports = createUser;

/* Create (i.e, register) a new user */
async function createUser(req, res) {
  const store = appModule.get('store');
  const { firstname, lastname, username, email, password } = req.body;

  try {
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

    emit('signupSuccess', responseData);
    res.status(statusCodes.ok).json(responseData);
    return;
  } catch(err) {
    if (err.type === 'USER_EXISTS_ERROR') {
      responseData = {
        errors: [{
          value: '',
          location: 'body',
          msg: 'The email or username you are trying to use is not available',
          param: 'email or username',
        }]
      };

      emit(errorName, responseData);
      res.status(statusCodes.conflict).json(responseData);

    } else if (err.type === 'VALIDATION_ERROR') {
      responseData = { errors: err.errors || [] };

      emit(errorName, responseData);
      res.status(statusCodes.badRequest).json(responseData);
    } else {
      responseData = {
        errors: [{ msg: 'There was an error saving the user' }]
      };

      emit(errorName, responseData);
      res.status(statusCodes.serverError).json(responseData);
      debugLog(`Error saving the user: ${err}`);
    }
  }
}
