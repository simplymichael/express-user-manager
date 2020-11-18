const env = require('../dotenv');
const util = require('util');
const mongoose = require('mongoose');
const debugLog = require('../utils/debug');
const config = {};

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
 * @return resource a (mongoose) connection instance
 */
config.initDb = async (options = {}) => {
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
};

module.exports = config;
