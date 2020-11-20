const db = require('../../../../databases/');
const publicFields = require('./_public-fields');
const emailValidator = require('email-validator');
const debugLog = require('../../../../utils/debug');
const { statusCodes } = require('../../../../utils/http');
const { checkPassword, generateAuthToken } = require('../../../../utils/auth');
const User = db.getDriver();

module.exports = login;

async function login(req, res) {
  try {
    const { login, password } = req.body;
    const isEmail = emailValidator.validate(login);
    const userData = isEmail
      ? await User.findByEmail(login)
      : await User.findByUsername(login);

    if(!userData) {
      return res.status(statusCodes.notFound).json({
        errors: [{
          msg: 'User not found!',
        }]
      });
    }

    if(!(await checkPassword(password, userData.password))) {
      return res.status(statusCodes.notFound).json({
        errors: [{
          msg: 'The username or password you have provided is invalid',
          param: 'password'
        }]
      });
    }

    const user = {};

    // Populate the user variable with values we want to return to the client
    publicFields.forEach(key => user[key] = userData[key]);

    req.session.user = user; // Maintain the user's data in current session

    // Create an auth token for the user so we can validate future requests
    const { token, expiry } = generateAuthToken(user.id, user.email);
    const authorization = { token: `Bearer ${token}`, expiresIn: expiry };

    return res.status(statusCodes.ok).json({
      data: { user,  authorization }
    });
  } catch(err) {
    res.status(statusCodes.serverError).json({
      errors: [{ msg: 'There was an error logging in the user' }]
    });

    debugLog(`Error authenticating user: ${err}`);
    return;
  }
}
