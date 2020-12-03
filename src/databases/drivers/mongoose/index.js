const util = require('util');
const mongoose = require('mongoose');
const DbInterface = require('../db-interface');
const debugLog = require('../../../utils/debug');
const User = require('./data/models/user-model');
const { emit, convertToBoolean } = require('../../_utils');

// we put this here, rather than make it a property of the class instance
// to avoid accidentally overriding it outside the class
let db = null;

class MongooseStore extends DbInterface {
  constructor(...args) {
    super(args);

    if(args) {
      this.connect(args);
    }
  }

  /**
   * Start a (MongoDB) DB server instance
   * @param object with members:
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
   * @return {resource} a (mongoose) connection instance
   */
  async connect (options){
    const { host, port, user, pass, dbName, debug } = options;

    const dsn = user.trim().length > 0
      ? `mongodb://${user}:${pass}@${host}:${port}/${dbName}`
      : `mongodb://${host}:${port}/${dbName}`;

    try {
      mongoose.set('debug', convertToBoolean(debug));

      db = await mongoose.connect(dsn, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      });

      debugLog('Successfully connected to MongoDB server');

      emit('dbConnection', db);

      return db;
    } catch(err) {
      debugLog(`Failed to connect to MongoDB server:
      message: ${err.message}
      reason: ${util.format(err.reason)}
      `);

      process.exit(1);
    }
  }

  async disconnect() {
    await db.disconnect();
    emit('dbDisconnect');
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
  async createUser(userData) {
    const { firstname, lastname, email, username, password } = userData;

    try {
      const onCreateData = await User.create({
        email,
        username,
        password,
        name: {
          first: firstname,
          last: lastname
        },
      });

      emit('createUser', onCreateData);
      return onCreateData;
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

  async getUsers (options){
    return await User.generateQuery(options).exec();
  }

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
  async searchUsers(options) {
    let { query, by = '', page = 1, limit = 20, sort = ''} = options;
    by = by.trim();
    sort = sort.trim();
    query = query.trim();

    if(!query || query.length === 0) {
      throw new Error('Please specify the search term');
    }

    // Prepare the orderBy clause
    let orderBy = {};

    //?sort=firstname:desc=lastname=email:asc
    if(sort && sort.length > 0) {
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

    const regex = new RegExp(query, 'i');
    const queryParams = { by, page, limit, orderBy };

    // Prepare the searchBy clause
    let searchBy = [];

    //?by=firstname:lastname:username
    if(by && by.length > 0) {
      const byData = by.split(':');

      byData.forEach(key => {
        key = key.trim();

        if(key) {
          switch(key.toLowerCase()) {
          case 'firstname' : searchBy.push({ 'name.first': regex }); break;
          case 'lastname'  : searchBy.push({ 'name.last': regex }); break;
          default          : searchBy.push({ [key]: regex }); break;
          }
        }
      });
    } else {
      searchBy = [
        { username: regex },
        { email: regex },
        { 'name.first': regex },
        { 'name.last': regex }
      ];
    }


    const where = searchBy.length === 1 ? searchBy[0] : { '$or': searchBy };
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
  async findByEmail(email) {
    return (await User.generateQuery({ where: {email} }).exec())[0];
  }

  /**
   * @return user object
   */
  async findByUsername(username) {
    return (await User.generateQuery({ where: {username} }).exec())[0];
  }

  async findById(userId) {
    return await User.getById(userId);
  }
}

module.exports = MongooseStore;
