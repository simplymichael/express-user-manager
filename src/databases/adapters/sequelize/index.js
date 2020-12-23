const { Op, Sequelize } = require('sequelize');
const createUserModel = require('./user-model');


// we put this here, rather than make it a property of the class instance
// to avoid accidentally overriding it outside the class
let db = null;
let User = null;

class SequelizeStore {
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
   *   - engine {string} the database engine to use
   *       Possible values are: memory | mariadb | mssql | mysql | postgres | sqlite
   *       Not required when using the `mongoose` adapter
   *   - storagePath {string} The storage location when the `engine` is set to `postgres`.
   *       The value is combined with the `dbName` option to set the storage: `${storagePath}/${dbName}.sqlite`
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
  async connect (options) {
    let sequelize = null;
    let {
      host = 'localhost',
      port = 3306,
      user = 'root',
      pass = '',
      engine = 'memory',
      dbName = 'users',
      storagePath = '', // for sqlite engines
      debug = false,
      exitOnFail = true
    } = options;

    engine = engine.toLowerCase();
    const logger = this.toBoolean(debug) ? console.log : false;

    try {
      switch(engine) {
      case 'sqlite'   : sequelize = connectSqlite(storagePath); break;
      case 'mariadb'  :
      case 'mssql'    :
      case 'mysql'    :
      case 'postgres' : sequelize = connectGeneric(engine); break;
      case 'memory'   :
      default         : engine = 'in:memory';
        sequelize = connectMemory(); break;
      }

      await sequelize.authenticate();

      db = sequelize;
      this.debug(`Successfully connected to "${engine}" database server`);
      this.emit('dbConnection', db);

      User = await createUserModel(db, 'users');

      return db;
    } catch(err) {
      this.debug(`Failed to connect to MySQL server: ${err}`);

      if(this.toBoolean(exitOnFail)) {
        process.exit(1);
      }
    }

    function connectMemory() {
      return new Sequelize('sqlite::memory:', {
        logging: logger,
      });
    }

    function connectSqlite(storagePath) {
      storagePath = storagePath.trim();

      if(storagePath.length === 0) {
        throw new Error(
          'The "storagePath" must be specified when using the "sqlite" engine'
        );
      }

      return new Sequelize({
        dialect: 'sqlite',
        storage: `${storagePath}/${dbName}.sqlite`,
        logging: logger,
      });
    }

    function connectGeneric(engine) {
      return new Sequelize({
        host,
        port,
        database: dbName,
        dialect: engine,
        username: user,
        password: pass,
        logging: logger,
      });
    }
  }

  async disconnect() {
    await db.close();
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
   */
  async createUser(userData) {
    try {
      const onCreateData = await User.create(userData);

      this.emit('createUser', onCreateData.toJSON());
      return onCreateData;
    } catch(err) {
      throw {
        type: 'VALIDATION_ERROR',
        error: err,
      };
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
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const OFFSET = ((typeof page === 'number' && page > 0) ? page - 1 : 0);
    const LIMIT = ((typeof limit === 'number' && limit > 0) ? limit : 0);
    const orderBy = SequelizeStore.generateOrderBy(sort);

    // Prepare the searchBy clause
    let where = {};
    const searchBy = [];
    const firstnameRegex = `%${firstname}%`;
    const lastnameRegex = `%${lastname}%`;

    if(firstname.length > 0 && lastname.length > 0) {
      searchBy.push({
        firstname: { [Op.like]: firstnameRegex }
      });

      searchBy.push({
        lastname: { [Op.like]: lastnameRegex }
      });
    } else if(firstname.length > 0) {
      searchBy.push({
        firstname: { [Op.like]: firstnameRegex }
      });
    } else if(lastname.length > 0) {
      searchBy.push({
        lastname: { [Op.like]: lastnameRegex }
      });
    }

    if(searchBy.length > 0) {
      where = searchBy.length === 1 ? searchBy[0] : { [Op.or]: searchBy };
    }

    const queryParams = {
      where,
      offset: OFFSET,
    };

    if(orderBy.length > 0) {
      queryParams.order = orderBy;
    }

    if(LIMIT > 0) {
      queryParams.limit = LIMIT;
    }

    const allUsersCount = await User.count({ where });
    const results = await User.findAll(queryParams);

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
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const OFFSET = ((typeof page === 'number' && page > 0) ? page - 1 : 0);
    const LIMIT = ((typeof limit === 'number' && limit > 0) ? limit : 0);

    if(!query || query.length === 0) {
      throw new Error('Please specify the search term');
    }

    const orderBy = SequelizeStore.generateOrderBy(sort);
    const regex = `%${query}%`;

    // Prepare the searchBy clause
    let searchBy = [];

    //?by=firstname:lastname:username
    if(by && by.length > 0) {
      const byData = by.split(':');

      byData.forEach(key => {
        key = key.trim();

        if(key) {
          searchBy.push({
            [key]: {
              [Op.like]: regex
            }
          });
        }
      });
    } else {
      searchBy = [
        {
          username: {
            [Op.like]: regex
          }
        },
        {
          email: {
            [Op.like]: regex
          }
        },
        {
          firstname: {
            [Op.like]: regex
          }
        },
        {
          lastname: {
            [Op.like]: regex
          }
        }
      ];
    }


    const where = searchBy.length === 1 ? searchBy[0] : { [Op.or]: searchBy };
    const queryParams = {
      where,
      offset: OFFSET,
    };

    if(orderBy.length > 0) {
      queryParams.order = orderBy;
    }

    if(LIMIT > 0) {
      queryParams.limit = LIMIT;
    }

    const allUsersCount = await User.count({ where });
    const results = await User.findAll(queryParams);

    return {
      total: allUsersCount,
      length: results.length,
      users: results,
    };
  }

  /**
   * @return user object
   */
  async findByEmail(email) {
    return (await User.findAll({ where: { email } }))[0];
  }

  /**
   * @return user object
   */
  async findByUsername(username) {
    return (await User.findAll({ where: { username } }))[0];
  }

  async findById(userId) {
    return (await User.findAll({ where: { id: userId } }))[0];
  }

  async deleteUser(userId) {
    return await User.destroy({ where: { id: userId } });
  }

  // Private helper methods
  static generateOrderBy(sort) {
    // Prepare the orderBy clause
    let orderBy = [];

    sort = (typeof sort === 'string' ? sort : '').trim();

    //?sort=firstname:desc=lastname=email:asc
    if(sort && sort.length > 0) {
      const sortData = sort.split('=');

      orderBy = sortData.reduce((acc, val) => {
        const data = val.split(':');
        const key = data[0].toLowerCase();
        const orderKey = key === 'signupdate' ? 'createdAt' : key;
        const orderValue = data.length > 1 ? data[1].toUpperCase() : 'DESC';

        acc.push([ orderKey, orderValue ]);

        return acc;
      }, []);
    }

    return orderBy;
  }
}

module.exports = SequelizeStore;
