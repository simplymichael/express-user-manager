const db = require('../../../../databases/');
const publicFields = require('./_public-fields');
const debugLog = require('../../../../utils/debug');
const { statusCodes } = require('../../../../utils/http');
const { hashPassword } = require('../../../../utils/auth');
const User = db.getDriver();

module.exports = createUser;

/* Create (i.e, register) a new user */
async function createUser(req, res) {
  const { firstname, lastname, username, email, password } = req.body;

  try {
    if(await User.findByEmail(email)) {
      return res.status(statusCodes.conflict).json({
        errors: [{
          value: email,
          location: 'body',
          msg: 'That email address is not available!',
          param: 'email'
        }]
      });
    }

    if(await User.findByUsername(username)) {
      return res.status(statusCodes.conflict).json({
        errors: [{
          value: username,
          location: 'body',
          msg: 'That username is not available!',
          param: 'username'
        }]
      });
    }

    const user = {};
    const hashedPassword = await hashPassword(password);
    const data = await User.create({
      firstname,
      lastname,
      email,
      username,
      password: hashedPassword,
    });

    // Populate the user variable with values we want to return to the client
    publicFields.forEach(key => user[key] = data[key]);

    return res.status(statusCodes.ok).json({
      data: { user }
    });
  } catch(err) {
    if (err.type === 'USER_EXISTS_ERROR') {
      return res.status(statusCodes.conflict).json({
        errors: [{
          value: '',
          location: 'body',
          msg: 'The email or username you are trying to use is not available',
          param: 'email or username',
        }]
      });
    } else if (err.type === 'VALIDATION_ERROR') {
      return res.status(statusCodes.badRequest).json({
        errors: err.errors || []
      });
    } else {
      res.status(statusCodes.serverError).json({
        errors: [{ msg: 'There was an error saving the user' }]
      });

      debugLog(`Error saving the user: ${err}`);
      return;
    }
  }
}
