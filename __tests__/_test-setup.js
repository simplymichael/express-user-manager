const mongoose = require('mongoose');
const debugLog = require('../src/utils/debug');
//const userModule = require('../src/index');

async function removeAllCollections () {
  const collections = Object.keys(mongoose.connection.collections)
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName]
    await collection.deleteMany()
  }
}

async function dropAllCollections () {
  const collections = Object.keys(mongoose.connection.collections)
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName]
    try {
      await collection.drop()
    } catch (error) {
      // Sometimes this error happens, but you can safely ignore it
      if (error.message === 'ns not found') {
        return;
      }

      // This error occurs when you use it.todo. You can
      // safely ignore this error too
      if (error.message.includes('a background operation is currently running')) {
        return;
      }
    }
  }
}

module.exports = {
  setupDB: (store, connectionOptions) => {
    let db;

    // Connect to DB
    before(async () => db = await store.connect(connectionOptions));

    // Clean up database between each test
    afterEach(async () => {
      await removeAllCollections()
    });

    // Drop database and disconnect from DB
    after(async () => {
      await dropAllCollections();
      await store.disconnect(); //OR db.disconnect();
      debugLog('Successfully disconnected from MongoDB server');
    });
  }
};
