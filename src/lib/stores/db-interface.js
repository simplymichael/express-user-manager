const Interface = require('es6-interface');
const DbInterface = {
  /**
   * Connect a DB server instance
   * @param object with members:
   *   - host {string} the db server host
   *   - port {number} the db server port
   *   - user {string} the db server username
   *   - pass {string} the db server user password
   *   - dbName {string} the name of the database to connect to
   *   - debug {boolean | number(int | 0)} determines whether or not to show debugging output
   *
   * @emit a 'connect' event on success with data: db connection instance
   * @return {resource} a database connection instance
   */
  connect: function(options = {}) {}, // eslint-disable-line

  /**
   * @emit a disconnect event
   */
  disconnect: function() {},

  /**
   * @param object with members:
   *   - firstname {string}
   *   - lastname {string}
   *   - email {string}
   *   - username {string}
   *   - password {string}
   *
   * @return object with members:
   *   - total {number} the total number of users that match the search term
   *   - length {number} the number of results returned for the current page and limit
   *   - users {array} the actual list of returned users that match the search term
   */
  createUser: function(userData = {}) {}, // eslint-disable-line

  getUsers: function(options = {}) {}, // eslint-disable-line

  /**
   * @param object with members:
   *   - query {string} the search term (required)
   *   - by {string} whether to search by firstname, lastname, username, email (optional, default searches by all)
   *   - page {number} the page to return, for pagination purposes (optional, default 1)
   *   - limit {number} the number of results to return, for pagination purposes (optional, default 20)
   *   - sort {string} determines the sort order of returned users (optional)
   *
   * @return object with members:
   *   - total {number} the total number of users that match the search term
   *   - length {number} the number of results returned for the current page and limit
   *   - users {array} the actual list of returned users that match the search term
   */
  searchUsers: function(options = {}) {}, // eslint-disable-line

  /**
   * @return user object
   */
  findByEmail: function(email) {}, // eslint-disable-line

  /**
   * @return user object
   */
  findByUsername: function(username) {}, // eslint-disable-line

  /**
   * @return user object
   */
  findById: function(userId) {}, // eslint-disable-line
};

module.exports = Interface(DbInterface);
