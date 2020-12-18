const debugLog = require('../src/utils/debug');
const mongooseHelper = require('./db-helpers/mongoose-helper');
const mysqlHelper = require('./db-helpers/mysql-helper');

async function pruneTables (dbDriver, db) {
  let helper;

  switch(dbDriver.toLowerCase()) {
    case 'mongoose': helper = mongooseHelper; break;
    case 'mysql'   : helper = mysqlHelper; break;
    default        : helper = null; break;
  }

  if(helper) {
    return await helper.pruneCollections(db);
  }
}

async function dropAllTables (dbDriver, db) {
  let helper;

  switch(dbDriver.toLowerCase()) {
    case 'mongoose': helper = mongooseHelper; break;
    case 'mysql'   : helper = mysqlHelper; break;
    default        : helper = null; break;
  }

  if(helper) {
    return await helper.dropAllCollections(db);
  }
}

module.exports = {
  setupDB: (store, dbDriver, connectionOptions) => {
    let db;

    // Connect to DB
    before(async () => db = await store.connect(connectionOptions));

    // Clean up database between each test
    afterEach(async () => {
      if(process.env.NODE_ENV.toLowerCase() !== 'production') {
        await pruneTables(dbDriver, db);
      }
    });

    // Drop database and disconnect from DB
    after(async () => {
      if(process.env.NODE_ENV.toLowerCase() !== 'production') {
        await dropAllTables(dbDriver, db);
        store.disconnect().then(() => {
          debugLog(`Successfully disconnected from "${dbDriver}" server`);
        });
      }
    });
  }
};
