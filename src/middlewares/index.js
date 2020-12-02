const authorized = require('./authorized');
const loadUser = require('./load-user');
const loggedIn = require('./logged-in');
const notLoggedIn = require('./not-logged-in');
const restrictUserToSelf = require('./restrict-user-to-self');

module.exports = {
  authorized,
  loadUser,
  loggedIn,
  notLoggedIn,
  restrictUserToSelf
};
