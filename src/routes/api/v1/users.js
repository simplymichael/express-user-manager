const router = require('express').Router();
const { validationResult } = require('express-validator');
const emailValidator = require('email-validator');
const debugLog = require('../../../utils/debug');
const notLoggedIn = require('../../../middlewares/not-logged-in');
const { statusCodes } = require('../../../utils/http');
const {
  hashPassword,
  checkPassword,
  generateAuthToken
} = require('../../../utils/auth');
const validator = require('../../../middlewares/validators/_validator');
const db = require('../../../databases/');
const User = db.getDriver();

// Fields to return to the client when a new user is created
// or when user data is requested
const publicFields = [
  'id', 'firstname', 'lastname', 'fullname',
  'email', 'username', 'signupDate'
];

/* GET users listing. */
router.get('/', async function(req, res) {
  try {
    const users = [];
    const results = await User.getUsers({});

    results.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    res.status(statusCodes.ok).json({
      data: { users }
    });
  } catch(err) {
    res.status(statusCodes.serverError).json({
      errors: [{ msg: 'There was an error retrieving users' }]
    });

    debugLog(`Error retrieving users: ${err}`);
    return;
  }
});

/* Search for users */
router.get('/search', async (req, res) => {
  try {
    let { query, page = 1, limit = 20, sort } = req.query;

    if(!query || query.trim().length === 0) {
      return res.status(statusCodes.badRequest).json({
        errors: [{
          location: 'query',
          msg: 'Please specify the query to search by',
          param: 'query'
        }]
      });
    }

    const users = [];
    const results = await User.searchUsers({ query, page, limit, sort});

    results.users.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    return res.status(statusCodes.ok).json({
      data: {
        total: results.total,
        length: results.length,
        users,
      }
    });
  } catch(err) {
    debugLog(`User search error: ${err}`);

    return res.status(statusCodes.serverError).json({
      errors: [{
        msg: 'There was an error processing your request. Please, try again',
      }]
    });
  }
});

/* Create (i.e, register) a new user */
router.post('/', notLoggedIn,
  validator.validate('firstname', 'lastname', 'username', 'email', 'password', 'confirmPassword'),
  async function(req, res) {
    const { firstname, lastname, username, email, password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(statusCodes.badRequest).json({
        errors: errors.array()
      });
    }

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
  });

router.post('/login', notLoggedIn, validator.validate('login', 'password'),
  async function(req, res) {
    try {
      const errors = validationResult(req);
      const { login, password } = req.body;
      const isEmail = emailValidator.validate(login);

      if (!errors.isEmpty()) {
        return res.status(statusCodes.badRequest).json({
          errors: errors.array()
        });
      }

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
  });

router.get('/logout', function(req, res) {
  req.session.destroy();

  return res.status(statusCodes.ok).json({});
});

module.exports = router;
