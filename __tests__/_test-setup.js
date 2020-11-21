const debugLog = require('../src/utils/debug');
const {
  pruneCollections,
  dropAllCollections
} = require('./db-helpers/mongoose-helper');

async function pruneTables (dbDriver) {
  switch(dbDriver.toLowerCase()) {
    case 'mongoose':
    default        : pruneCollections();
  }
}

async function dropAllTables (dbDriver) {
  switch(dbDriver.toLowerCase()) {
    case 'mongoose':
    default        : dropAllCollections();
  }
}

module.exports = {
  setupDB: (store, dbDriver, connectionOptions) => {
    let db;

    // Connect to DB
    before(async () => db = await store.connect(connectionOptions));

    // Clean up database between each test
    afterEach(async () => {
      await pruneTables(dbDriver)
    });

    // Drop database and disconnect from DB
    after(async () => {
      await dropAllTables(dbDriver);
      await store.disconnect(); //OR db.disconnect();
      debugLog('Successfully disconnected from MongoDB server');
    });
  }
};
