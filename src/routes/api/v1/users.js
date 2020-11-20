const handlers = require('./handlers');
const router = require('express').Router();
const notLoggedIn = require('../../../middlewares/not-logged-in');
const validator = require('../../../middlewares/validators/_validator');
const expressValidatorStatusChecker = require('../../../middlewares/express-validator-status-checker');

/* GET users listing. */
router.get('/', handlers.get);

/* Search for users */
router.get('/search', handlers.search);

/* Create (i.e, register) a new user */
router.post('/',
  notLoggedIn,
  validator.validate('firstname', 'lastname', 'username', 'email', 'password', 'confirmPassword'),
  expressValidatorStatusChecker,
  handlers.create
);

/* Authenticate a user(, and return an authorization key)*/
router.post('/login',
  notLoggedIn,
  validator.validate('login', 'password'),
  expressValidatorStatusChecker,
  handlers.login
);

router.get('/logout', handlers.logout);

module.exports = router;
