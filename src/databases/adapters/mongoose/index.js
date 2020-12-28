const mongoose = require('mongoose');
const User = require('./data/models/user-model');


// we put this here, rather than make it a property of the class instance
// to avoid accidentally overriding it outside the class
let db = null;

class MongooseStore {
  constructor(emit, debug, convertToBoolean) {
    this.emit = emit;
    this.debug = debug;
    this.toBoolean = convertToBoolean;
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
   *   - exitOnFail {boolean} specifies whether to exit the program if DB connection fails
   *
   * Parameters can be supplied via different methods:
   *  - By specifying the connection parameters as env variables
   *     (e.g, using the .env file (default))
   *  - By specifying them when calling the function (overrides the env variables)
   *
   * @return {resource} a (mongoose) connection instance
   */
  async connect (options){
    const {
      host = 'localhost',
      port = 27017,
      user = '',
      pass = '',
      dbName = 'users',
      debug = false,
      exitOnFail = true
    } = options;

    const dsn = user && user.trim().length > 0
      ? `mongodb://${user}:${pass}@${host}:${port}/${dbName}`
      : `mongodb://${host}:${port}/${dbName}`;

    try {
      mongoose.set('debug', this.toBoolean(debug));

      db = await mongoose.connect(dsn, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      });

      this.debug('Successfully connected to MongoDB server');

      this.emit('dbConnection', db);

      return db;
    } catch(err) {
      this.debug(`Failed to connect to MongoDB server: ${err}`);

      if(this.toBoolean(exitOnFail)) {
        process.exit(1);
      }
    }
  }

  async disconnect() {
    await db.disconnect();
    this.emit('dbDisconnect');
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

      this.emit('createUser', onCreateData);
      return onCreateData;
    } catch(err) {
      if (err.code === 11000) {
        throw {
          type: 'USER_EXISTS_ERROR',
          error: err,
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

  /**
   * @param object with members:
   *   - firstname {string} filter by users with matching firstnames (optional)
   *   - lastname {string} get users with matching lastnames (optional)
   *   - page {number} the page to return, for pagination purposes (optional, default 1)
   *   - limit {number} the number of results to return, for pagination purposes (optional, default 20)
   *   - sort {string} determines the sort order of returned users (optional)
   *
   * @return object with members:
   *   - total {number} the total number of users that match the specified firstname and/or lastname filters
   *   - length {number} the number of results returned for the current page and limit
   *   - users {array} the actual list of returned users that match the search term
   */
  async getUsers (options){
    options = options || {};
    let {
      firstname = '',
      lastname = '',
      page = 1,
      limit = 20,
      sort = ''
    } = options;

    firstname = (typeof firstname === 'string' ? firstname : '').trim();
    lastname = (typeof lastname === 'string' ? lastname : '').trim();
    sort = (typeof sort === 'string' ? sort : '').trim();

    let where = {};
    const searchBy = [];
    const firstnameRegex = new RegExp(firstname, 'i');
    const lastnameRegex = new RegExp(lastname, 'i');

    if(firstname.length > 0 && lastname.length > 0) {
      searchBy.push({ 'name.first': firstnameRegex });
      searchBy.push({ 'name.last': lastnameRegex });
    } else if(firstname.length > 0) {
      searchBy.push({ 'name.first': firstnameRegex });
    } else if(lastname.length > 0) {
      searchBy.push({ 'name.last': lastnameRegex });
    }

    if(searchBy.length > 0) {
      where = searchBy.length === 1 ? searchBy[0] : { '$or': searchBy };
    }

    const orderBy = MongooseStore.generateOrderBy(sort);
    const queryParams = { where, page, limit, orderBy };
    const allUsersCount = await User.countUsers(where);
    const results = await User.generateQuery(queryParams).exec();

    return{
      total: allUsersCount,
      length: results.length,
      users: results,
    };
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
    options = options || {};
    let { query, by = '', page = 1, limit = 20, sort = ''} = options;
    by = (typeof by === 'string' ? by : '').trim();
    sort = (typeof sort === 'string' ? sort : '').trim();
    query = (typeof query === 'string' ? query : '').trim();

    if(!query || query.length === 0) {
      throw new Error('Please specify the search term');
    }

    const orderBy = MongooseStore.generateOrderBy(sort);
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

  async updateUser(userId, updateData) {
    const name = {};

    if(updateData.firstname) {
      name.first = updateData.firstname;
    }

    if(updateData.lastname) {
      name.last = updateData.lastname;
    }

    if(Object.keys(name).length > 0) {
      updateData.name = name;
    }

    return await User.updateUser(userId, updateData);
  }

  async deleteUser(userId) {
    return await User.deleteUser(userId);
  }

  // Private helper methods
  static generateOrderBy(sort) {
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

    return orderBy;
  }
}

module.exports = MongooseStore;
