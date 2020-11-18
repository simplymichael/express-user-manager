const mongoose = require('mongoose');
const config = require('../src/config');
const { debugLog } = config;

module.exports = {
  setupDB: (options = {}) => {
    let db;
    const { debug = config.db.debug, dsn = config.db.dsn } = options;

    // Connect to DB
    before(async () => {
      db = await config.initDb({ debug, dsn });
    });

    // Disconnect from DB
    after(async () => {
      await db.disconnect();
      debugLog('Successfully disconnected from MongoDB server');
    });
  }
};
