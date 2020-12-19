const env = require('../src/dotenv');
const debugLog = require('../src/utils/debug');
const mongooseHelper = require('./db-helpers/mongoose-helper');
const sequelizeHelper = require('./db-helpers/sequelize-helper');

async function pruneTables (dbAdapter, db) {
  let helper;

  switch(dbAdapter.toLowerCase()) {
    case 'mongoose'  : helper = mongooseHelper; break;
    case 'sequelize' : helper = sequelizeHelper; break;
    default          : helper = null; break;
  }

  if(helper) {
    return await helper.pruneCollections(db);
  }
}

async function dropAllTables (dbAdapter, db) {
  let helper;

  switch(dbAdapter.toLowerCase()) {
    case 'mongoose'  : helper = mongooseHelper; break;
    case 'sequelize' : helper = sequelizeHelper; break;
    default          : helper = null; break;
  }

  if(helper) {
    return await helper.dropAllCollections(db);
  }
}

module.exports = {
  setupDB: (store, dbAdapter, connectionOptions) => {
    let db;

    // Connect to DB
    before(async () => db = await store.connect(connectionOptions));

    // Clean up database between each test
    afterEach(async () => {
      if(env.NODE_ENV.toLowerCase() !== 'production') {
        await pruneTables(dbAdapter, db);
      }
    });

    // Drop database and disconnect from DB
    after(async () => {
      if(env.NODE_ENV.toLowerCase() !== 'production') {
        await dropAllTables(dbAdapter, db);
        await store.disconnect();
        const dbServer = env.DB_ADAPTER === 'sequelize'
          ? env.DB_ENGINE
          : 'mongodb';

        debugLog(`Successfully disconnected from "${dbServer}" server`);
        /*store.disconnect().then(() => {
          const dbServer = env.DB_ADAPTER === 'sequelize'
            ? env.DB_ENGINE
            : 'mongodb';

          debugLog(`Successfully disconnected from "${dbServer}" server`);
        });*/
      }
    });
  }
};
