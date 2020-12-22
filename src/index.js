#!/usr/bin/env node

const db = require('./databases');
const debug = require('./utils/debug');
const setupRouting = require('./routes');
const prepare = require('./utils/prepare');
const userModule = require('./user-module');
const middlewares = require('./middlewares');
const appName = 'express-user-manager';

// Augment the userModule with midddlewares
userModule.set('middlewares', middlewares);

userModule.listen = listen;
userModule.getDbAdapter = getDbAdapter;

/**
 * Export userModule singleton instance
 * to enable clients (emit and) respond to events emitted by the route handlers:
 * userModule.on(eventType, data);
 */
module.exports = userModule;

/**
 * Returns an adapter (store) object for working with the database
 */
function getDbAdapter(adapter) {
  const validAdapters = [ 'mongoose', 'sequelize' ];
  const validAdaptersMsg = `Valid adapters include: ${validAdapters.join(', ')}`;

  if(!adapter) {
    throw new Error(`${appName}: getDbAdapter expects an "adapter" parameter.`);
  }

  if(typeof adapter !== 'string') {
    const msg = `${appName}: The "adapter" parameter expects a string. ${validAdaptersMsg}`;
    throw new Error(msg);
  }

  adapter = adapter.toLowerCase();

  if(!validAdapters.includes(adapter)) {
    throw new Error(`${appName}: Invalid adapter ${adapter}. ${validAdaptersMsg}`);
  }

  debug(`Setting adapter: "${adapter}"...`);
  const DataStore = db.getAdapter(adapter);
  debug(`Adapter "${adapter}" set`);

  debug('Initializing store from adapter...');
  const store = new DataStore();
  debug('Store initialization complete');

  debug('Registering the store...');
  userModule.set('store', store);
  debug('Store registration complete');

  return store;
}

/**
 * Setup (API) routing table
 * @param an express app
 *
 * This allows us to automatically create user routes for the client
 * that works on the client's (host and) port.
 */
function listen(app, baseApiRoute = '/api/users', customRoutes = {}) {
  debug('Setting up routes...');
  const routeListener = setupRouting(customRoutes);
  debug('Routes setup complete');

  debug('Setting up express middlewares...');
  app = prepare(app);
  debug('Express middlewares setup complete');

  app.use(new RegExp(`${baseApiRoute}`, 'i'), routeListener);
  debug(`Listening for requests at ${baseApiRoute}`);
}
