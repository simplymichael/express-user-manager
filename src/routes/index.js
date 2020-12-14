const handlers = require('./handlers');
const express = require('express');
//const router = require('express').Router();
const loadUser = require('../middlewares/load-user');
const loggedIn = require('../middlewares/logged-in');
const authorized = require('../middlewares/authorized');
const notLoggedIn = require('../middlewares/not-logged-in');
const validator = require('../middlewares/validators/_validator');
const checkExpressValidatorStatus = require('../middlewares/express-validator-status-checker');
const apiPaths = {
  list: '/',
  search: '/search',
  getUser: '/user',
  signup: '/',
  login: '/login',
  logout: '/logout',
  deleteUser: '/user',
};

function setupRouting(customRoutes = {}) {
  const router = express.Router();
  const routes = { ...apiPaths };

  // Setup custom routing allowing the user to overwrite the default routes
  for(const pathName in routes) {
    if(pathName in customRoutes) {
      let path = customRoutes[pathName];

      path = (typeof path === 'string' ? path : '').trim();
      routes[pathName] = path || routes[pathName];
    }
  }

  /* GET users listing. */
  router.get(routes.list, handlers.get);

  /* Search for users */
  router.get(routes.search, handlers.search);

  /* Get a user by username */
  router.get(`${routes.getUser}/:username`, loadUser, handlers.getUser);

  /* Create (i.e, register) a new user */
  router.post(routes.signup,
    notLoggedIn,
    validator.validate('firstname', 'lastname', 'username', 'email', 'password', 'confirmPassword'),
    checkExpressValidatorStatus('signupError'),
    handlers.create
  );

  /* Authenticate a user(, and return an authorization key)*/
  router.post(routes.login,
    notLoggedIn,
    validator.validate('login', 'password'),
    checkExpressValidatorStatus('loginError'),
    handlers.login
  );

  router.get(routes.logout, handlers.logout);

  /**
   * DANGER: Delete user by id
   * This was created so we can delete user we created during tests
   * Use with CAUTION
   */
  router.delete(`${routes.deleteUser}/:userId`,
    loggedIn,
    authorized,
    handlers.deleteUser
  );

  return router;
}

module.exports = setupRouting;
