const debug = require('../utils/debug');
const { emit, convertToBoolean } = require('../utils');
const adapters = require('./adapters/');
const validAdapters = Object.keys(adapters.adapters); //[ 'mongoose', 'sequelize' ];

module.exports = {
  getAdapter,

  get validAdapters() {
    return validAdapters;
  },
};

function getAdapter(key) {
  debug(`Setting adapter: "${key}"...`);
  const DataStore = adapters.getAdapter(key.toLowerCase());
  debug(`Adapter "${key}" set`);

  debug('Initializing store from adapter...');
  const store = new DataStore(emit, debug, convertToBoolean);
  debug('Store initialization complete');

  return store;
}
