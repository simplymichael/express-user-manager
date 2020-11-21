const env = require('../dotenv');
const drivers = require('./drivers/');
const { convertToBoolean } = require('./_utils');

module.exports = {
  getDriver,
  connect,
};

function getDriver(key = env.DB_DRIVER) {
  return drivers.getDriver(key.toLowerCase());
}

/**
 * Connects to a DB server
 * @param object with members:
 *   - driver {string} the db driver
 *   - host {string} the db server host
 *   - port {number} the db server port
 *   - user {string} the db server username
 *   - pass {string} the db server user password
 *   - dbName {string} the name of the database to connect to
 *   - debug {boolean | number(int | 0)} determines whether or not to show debugging output
 *
 * Parameters can be supplied via different methods:
 *  - By specifying the connection parameters as env variables
 *     (e.g, using the .env file (default))
 *  - By specifying them when calling the function (overrides the env variables)
 *
 * @return {resource} a database connection instance
 */
async function connect(connectionOptions = {}) {
  const driver = connectionOptions.driver || env.DB_DRIVER;

  if(connectionOptions.driver) {
    delete connectionOptions.driver;
  }

  if(connectionOptions.debug) {
    connectionOptions.debug = convertToBoolean(connectionOptions.debug);
  }

  return await getDriver(driver).connect(connectionOptions);
}
