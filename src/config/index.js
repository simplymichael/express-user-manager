const util = require('util');
const mongoose = require('mongoose');
const config = require('./config');
const debugLog = require('debug')('user-management');

config.debugLog = debugLog;
config.initDb = async (options = {}) => {
  const { debug = config.db.debug, dsn = config.db.dsn } = options;

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
