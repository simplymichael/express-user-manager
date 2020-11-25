const handlers = require('./handlers');
const router = require('express').Router();
const loadUser = require('../../../middlewares/load-user');
const notLoggedIn = require('../../../middlewares/not-logged-in');
const validator = require('../../../middlewares/validators/_validator');
const checkExpressValidatorStatus = require('../../../middlewares/express-validator-status-checker');

/* GET users listing. */
router.get('/', handlers.get);

/* Search for users */
router.get('/search', handlers.search);

/* Get a user by username */
router.get('/:username', loadUser, handlers.getUser);

/* Create (i.e, register) a new user */
router.post('/',
  notLoggedIn,
  validator.validate('firstname', 'lastname', 'username', 'email', 'password', 'confirmPassword'),
  checkExpressValidatorStatus('signupError'),
  handlers.create
);

/* Authenticate a user(, and return an authorization key)*/
router.post('/login',
  notLoggedIn,
  validator.validate('login', 'password'),
  checkExpressValidatorStatus('loginError'),
  handlers.login
);

router.get('/logout', handlers.logout);

module.exports = router;
