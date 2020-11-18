const router = require('express').Router();
const { validationResult } = require('express-validator');
const emailValidator = require('email-validator');
const debug = require('../../../config').debug;
const notLoggedIn = require('../../../middlewares/not-logged-in');
const { statusCodes } = require('../../../utils/http');
const {
  hashPassword,
  checkPassword,
  generateAuthToken
} = require('../../../utils/auth');
const validator = require('../../../middlewares/validators/_validator');
const User = require('../../../data/models/user-model');

// Fields to return to the client when a new user is created
// or when user data is requested
const publicFields = [
  'id', 'firstname', 'lastname', 'fullname',
  'email', 'username', 'signupDate'
];

/* GET users listing. */
router.get('/', async function(req, res) {
  try {
    const results = await User.generateQuery({})
      .exec();

    const users = [];

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

    debug(`Error retrieving users: ${err}`);
    return;
  }
});

/* Search for users */
router.get('/search', async (req, res) => {
  try {
    let { query, page = 1, limit = 20, sort } = req.query;
    let orderBy = {};

    if(!query || query.trim().length === 0) {
      return res.status(statusCodes.badRequest).json({
        errors: [{
          location: 'query',
          msg: 'Please specify the query to search by',
          param: 'query'
        }]
      });
    }

    // firstname:desc=lastname=email:asc
    if(sort && sort.trim().length > 0) {
      sort = sort.trim();
      const sortData = sort.split('=');

      orderBy = sortData.reduce((acc, val) => {
        const data = val.split(':');
        let orderKey = data[0].toLowerCase();

        if(orderKey === 'firstname' || orderKey === 'lastname') {
          orderKey = (orderKey === 'firstname' ? 'name.first' : 'name.last');
        }

        acc[orderKey] = ((data.length > 1) ? data[1] : '');

        return acc;
      }, {});
    }

    query = query.trim();

    const queryParams = { page, limit, orderBy };
    const regex = new RegExp(query, 'i');
    const where = {
      '$or': [
        { username: regex },
        { email: regex },
        { 'name.first': regex },
        { 'name.last': regex }
      ]
    };
    const allUsersCount = await User.countUsers(where);
    const results = await User.generateSearchQuery(query, queryParams)
      .exec();

    const users = [];

    results.forEach(user => {
      const currUser = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => {
        currUser[key] = user[key];
      });

      users.push(currUser);
    });

    return res.status(statusCodes.ok).json({
      data: {
        total: allUsersCount,
        length: results.length,
        users,
      }
    });
  } catch(err) {
    debug(`User search error: ${err}`);

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
      if((await User.generateQuery({ where: {email} }).exec()).length) {
        return res.status(statusCodes.conflict).json({
          errors: [{
            value: email,
            location: 'body',
            msg: 'That email address is not available!',
            param: 'email'
          }]
        });
      }

      if((await User.generateQuery({ where: {username} }).exec()).length) {
        return res.status(statusCodes.conflict).json({
          errors: [{
            value: username,
            location: 'body',
            msg: 'That username is not available!',
            param: 'username'
          }]
        });
      }

      const hashedPassword = await hashPassword(password);
      const registrationData = {
        username: username,
        name: { first: firstname, last: lastname },
        email: email,
        password: hashedPassword,
      };
      const data = await User.create(registrationData);
      const user = {};

      // Populate the user variable with values we want to return to the client
      publicFields.forEach(key => user[key] = data[key]);

      return res.status(statusCodes.ok).json({
        data: { user }
      });
    } catch(err) {
      if (err.code === 11000) {
        return res.status(statusCodes.conflict).json({
          errors: [{
            value: '',
            location: 'body',
            msg: 'The email or username you are trying to use is not available',
            param: 'email or username',
          }]
        });
      } else {
        if (err.name === 'ValidationError') {
          const validationErrors = Object.keys(err.errors).map((field) => {
            return {
              value: field === 'password' ? password : err.errors[field].value,
              location: 'body',
              msg: err.errors[field].message,
              param: field
            };
          });

          return res.status(statusCodes.badRequest).json({
            errors: validationErrors
          });
        } else {
          res.status(statusCodes.serverError).json({
            errors: [{ msg: 'There was an error saving the user' }]
          });

          debug(`Error saving the user: ${err}`);
          return;
        }
      }
    }
  });

router.post('/login', notLoggedIn, validator.validate('login', 'password'),
  async function(req, res) {
    try {
      const errors = validationResult(req);
      const { login, password } = req.body;
      const isEmail = emailValidator.validate(login);
      const whereField = isEmail ? 'email' : 'username';
      const where = {
        [whereField]: login,
      };

      if (!errors.isEmpty()) {
        return res.status(statusCodes.badRequest).json({
          errors: errors.array()
        });
      }

      const users = await User.generateQuery({ where }).exec();

      if(!users.length) {
        return res.status(statusCodes.notFound).json({
          errors: [{
            msg: 'User not found!',
          }]
        });
      }

      const userData = users[0];

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

      debug(`Error authenticating user: ${err}`);
      return;
    }
  });

router.get('/logout', function(req, res) {
  req.session.destroy();

  return res.status(statusCodes.ok).json({});
});

module.exports = router;
