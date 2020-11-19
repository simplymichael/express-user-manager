const env = require('../../../dotenv');
const util = require('util');
const mongoose = require('mongoose');
const debugLog = require('../../../utils/debug');
const User = require('./data/models/user-model');

module.exports = {
  connect,
  create,
  getUsers,
  searchUsers,
  findByEmail,
  findByUsername,
};

/**
 * Start a (MongoDB) DB server instance
 * @param object with members:
 *   - host string the db server host
 *   - port number the db server port
 *   - user string the db server username
 *   - pass string the db server user password
 *   - dbName string the name of the database to connect to
 *   - debug boolean determines whether or not to show debugging output
 *
 * Parameters can be supplied ,
 *  - specifying the connection parameters as env variables
 *     (e.g, using the .env file (default))
 *  - when calling the function (overrides the env variables)
 *
 * @return resource a (mongoose) connection instance
 */
async function connect(options = {}){
  const {
    host = env.DB_HOST,
    port = env.DB_PORT,
    user = env.DB_USERNAME,
    pass = env.DB_PASSWORD,
    dbName = env.DB_DBNAME,
    debug = env.DB_DEBUG,
  } = options;

  const dsn = user.trim().length > 0
    ? `mongodb://${user}:${pass}@${host}:${port}/${dbName}`
    : `mongodb://${host}:${port}/${dbName}`;

  try {
    mongoose.set('debug', debug);

    const db = await mongoose.connect(dsn, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    debugLog('Successfully connected to MongoDB server');

    return db;
  } catch(err) {
    debugLog(`Failed to connect to MongoDB server:
    message: ${err.message}
    reason: ${util.format(err.reason)}
    `);

    process.exit(1);
  }
}

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
async function create(userData = {}) {
  const { firstname, lastname, email, username, password } = userData;

  try {
    return await User.create({
      email,
      username,
      password,
      name: {
        first: firstname,
        last: lastname
      },
    });
  } catch(err) {
    if (err.code === 11000) {
      throw {
        type: 'USER_EXISTS_ERROR',
      };
    }

    if (err.name === 'ValidationError') {
      const validationErrors = Object.keys(err.errors).map((currField) => {
        return {
          field: currField === 'password' ? password : err.errors[currField].value,
          location: 'body',
          msg: err.errors[currField].message,
          param: currField
        };
      });

      throw {
        type: 'VALIDATION_ERROR',
        errors: validationErrors,
      };
    }
  }
}

async function getUsers (options = {}){
  return await User.generateQuery(options).exec();
}

/**
 * @param object with members:
 *   - query {string} the search term (required)
 *   - page {number} the page to return, for pagination purposes (optional, default 1)
 *   - limit {number} the number of results to return, for pagination purposes (optional, default 20)
 *   - sort {string} determines the sort order of returned users (optional)
 *
 * @return object with members:
 *   - total {number} the total number of users that match the search term
 *   - length {number} the number of results returned for the current page and limit
 *   - users {array} the actual list of returned users that match the search term
 */
async function searchUsers(options = {}) {
  let { query, page = 1, limit = 20, sort } = options;
  let orderBy = {};

  if(!query || query.trim().length === 0) {
    throw new Error('Please specify the search term');
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

  return{
    total: allUsersCount,
    length: results.length,
    users: results,
  };
}

/**
 * @return user object
 */
async function findByEmail(email) {
  return (await User.generateQuery({ where: {email} }).exec())[0];
}

/**
 * @return user object
 */
async function findByUsername(username) {
  return (await User.generateQuery({ where: {username} }).exec())[0];
}
