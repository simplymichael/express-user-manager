#!/usr/bin/env node

const env = require('./dotenv');
const db = require('./databases');
const debug = require('./utils/debug');
const hooks = require('./utils/hooks');
const setupRouting = require('./routes');
const prepare = require('./utils/prepare');
const userModule = require('./user-module');
const middlewares = require('./middlewares');
const { generateRoute } = require('./utils');
const defaults = require('./routes/defaults');
const appName = 'express-user-manager';
const validAdapters = db.validAdapters;
const validAdaptersMsg = `Valid adapters include: ${validAdapters.join(', ')}`;

// Augment the userModule with midddlewares
userModule.set('middlewares', middlewares);

userModule.init = init;
userModule.config = config;
userModule.listen = listen;
userModule.getDbAdapter = getDbAdapter;
userModule.addRequestHook = addRequestHook;
userModule.addResponseHook = addResponseHook;
userModule.removeRequestHook = removeRequestHook;
userModule.removeResponseHook = removeResponseHook;

/**
 * Export userModule singleton instance
 * to enable clients (emit and) respond to events emitted by the route handlers:
 * userModule.on(eventType, data);
 */
module.exports = userModule;

/**
 * Add configuration properties to the express-user-manager object.
 * This is a higher-precedence alternative to using environment variables
 *
 * @param opts object with members:
 *   - apiMountPoint {string} The base route under which to listen for API requests
 *   - password {object} for password configuration, with members:
 *       - minLength {number} minimum length of user passwords, default: 6,
 *       - maxLength: {number} maximum length of user passwords, default: 20
 *       - disallowed: {string | array} comma-separated string or array of strings considered weak/non-secure passwords
 *  - routes {object} for configuring custom routes, with members:
 *      - list {string} specifies the path for getting users listing
 *      - search {string} specifies the path for searching users
 *      - getUser {string} specifies the path for getting a user's details via their username, a /:{username} is appended to this path
 *      - signup {string} specifies the user registration path
 *      - login {string} specifies user authentication path,
 *      - logout {string} defines the logout path
 *      - updateUser {string} defines the path for updating user data
 *      - deleteUser {string} specifies the path for deleting a user, a /:{userId} is appended to this path
 *  - db {object} for configuring the database connection
 *      - adapter {string} the adapter to use. valid values include 'mongoose', 'sequelize'
 *      - host {string | number} the database host
 *      - port {number} the database port
 *      - user {string} the database user
 *      - pass {string} the database user's password
 *      - engine {string} the database engine. Supported values include: 'memory', 'mariadb', 'mongodb', 'mssql', 'mysql', 'postgres', 'sqlite'
 *      - dbName {string} The name of the database to connect to
 *      - storagePath {string} the database storage path, only valid when "engine" is "sqlite"
 *      - debug {boolean} a value of true outputs database debug info
 *      - exitOnFail {boolean} set to true to kill the Node process if database connection fails
 * -  security {object} for configuring security
 *      - sessionSecret {string} a key for encrypting the session
 *      - authTokenSecret {string} a key for signing the authorization token
 *      - authTokenExpiry {number} the expiry time of the authorization token (in seconds)
 *
 */
function config(options) {
  if(!options || typeof options !== 'object') {
    throw new Error(`${appName}::config: expects an object as the first argument`);
  }

  debug('Setting up configuration properties...');
  for(let [key, value] of Object.entries(options)) {
    debug(`Configuring ${key} with value ${value}...`);
    userModule.set(key, value);
    debug(`${key} configuration done`);
  }
  debug('Configuration setup complete');
}

/**
 * Run initialization and start-up codes
 * then start listening for requests
 * @param app Express.js app
 * @param options configuration options passed to config()
 */
async function init(app, options) {
  if(!app || typeof app.use !== 'function') {
    throw new Error(`${appName}::setup: expects an Express app as the first argument`);
  }

  if(!options || typeof options !== 'object') {
    throw new Error(`${appName}::setup: expects an object as the second argument`);
  }

  debug('Setup process started...');
  // Add configuration properties to the userModule object
  config(options);

  // Begin mount point setup
  // Ensure we have a valid mount point
  let apiMountPoint = userModule.get('apiMountPoint');

  apiMountPoint = typeof apiMountPoint === 'string'
    ? apiMountPoint
    : env.API_MOUNT_POINT;

  apiMountPoint = (
    typeof apiMountPoint === 'string'
      ? apiMountPoint
      : ''
  ).trim();

  apiMountPoint = apiMountPoint.length > 0 ? apiMountPoint : defaults.base;
  // Mount point setup complete

  // Begin routing setup
  // Ensure we have valid routes
  const routes = {};
  const defaultRoutes = defaults.paths;
  const customRoutes = userModule.get('routes');

  // Setup custom routing allowing the user to overwrite the default routes
  for(const pathName in defaultRoutes) {
    if(pathName in customRoutes) {
      let path = customRoutes[pathName];

      path = (typeof path === 'string' ? path : '').trim();
      routes[pathName] = path || defaultRoutes[pathName];
    }
  }
  // Routing setup complete

  // Begin database setup
  // Ensure we have a valid adapter
  const dbConfig = userModule.get('db');
  const adapter = dbConfig.adapter || env.DB_ADAPTER;

  if(!validAdapters.includes(adapter)) {
    throw new Error(`${appName}::setup: invalid adapter ${adapter}. ${validAdaptersMsg}`);
  }

  const store = userModule.getDbAdapter(adapter);

  await store.connect(prepareConnectionParameters(dbConfig));
  // Database setup complete

  // Begin listening for requests on specified routes under mountPoint
  userModule.listen(app, apiMountPoint, routes);
  debug('Setup complete. Your application is ready');
}

/**
 * Returns an adapter (store) object for working with the database
 */
function getDbAdapter(adapter) {
  const dbConfig = userModule.get('db');

  if(typeof adapter === 'string') {
    adapter = adapter.trim();
  } else if(dbConfig && dbConfig.adapter) {
    adapter = dbConfig.adapter;
  } else if(!adapter || typeof adapter !== 'string') {
    adapter = env.DB_ADAPTER;
  }

  if(!adapter || typeof adapter !== 'string') {
    const msg = `${appName}::getDbAdapter: no adapter found via config or environment variable. ` +
    `Pass a string as the first argument. ${validAdaptersMsg}`;
    throw new Error(msg);
  }

  adapter = adapter.toLowerCase();

  if(!validAdapters.includes(adapter)) {
    throw new Error(`${appName}::getAdapter: invalid adapter ${adapter}. ${validAdaptersMsg}`);
  }

  const store = db.getAdapter(adapter);
  const clonedStore = { ...store };
  const storeMethods = [
    'disconnect',
    'createUser',
    'getUsers',
    'searchUsers',
    'findByEmail',
    'findByUsername',
    'findById',
    'updateUser',
    'deleteUser'
  ];

  for(let key of storeMethods) {
    clonedStore[key] = store[key];
  }

  clonedStore.connect = connect;

  debug('Registering the store...');
  userModule.set('store', clonedStore);
  debug('Store registration complete');

  return clonedStore;

  /**
   * Supply connection options
   * Or search through configuration userModule.get('db')
   * Or look for them in environment variables
   */
  async function connect(opts) {
    const dbConfig = userModule.get('db');
    opts = opts || dbConfig;

    return await store.connect(prepareConnectionParameters(opts));
  }
}

/**
 * Setup (API) routing table
 * @param an express app
 *
 * This allows us to automatically create user routes for the client
 * that works on the client's (host and) port.
 */
function listen(app, baseApiRoute = '/api/users', customRoutes = {}) {
  debug('Setting up routing...');

  debug('Setting up path listeners...');
  const routeListener = setupRouting(customRoutes);
  debug('Path listeners setup complete');

  debug('Setting up express middlewares...');
  let sessionSecret = (userModule.get('security') || {}).sessionSecret;
  app = prepare(app, sessionSecret || env.SESSION_SECRET);
  debug('Express middlewares setup complete');

  debug('Setting up mount point...');
  app.use(new RegExp(`${baseApiRoute}`, 'i'), routeListener);
  debug(`Routing setup complete. Listening for requests at ${baseApiRoute}`);
}

/**
 * Add a request hook
 *
 * @param target {mixed} string | array: the values of target can be:
 *   - * : to add the hook to every request (path)
 *   - pathName: to add the hook to specified path
 *   - array of pathNames: to add the hook to every path in the array
 * @param fn {mixed} function | array (of functions):
 *   the function identifiers to be associated with (each) target route hook
 */
function addRequestHook(target, fn) {
  addHook('request', target, fn);
}

/**
 * Add a response hook
 *
 * @param target {mixed} string | array: the values of target can be:
 *   - * : to add the hook to every path
 *   - pathName: to add the hook to specified path
 *   - array of pathNames: to add the hook to every path in the array
 * @param fn {mixed} function | array (of functions):
 *   the function identifiers to be associated with (each) target route hook
 */
function addResponseHook(target, fn) {
  addHook('response', target, fn);
}

/**
 * Unregister request hooks
 *
 * @param target {mixed} string | array: the values of target can be:
 *   - * : to unregister every request hook
 *   - pathName: to unregister the hook to specified path
 *   - array of pathNames: to unregister the hook to every path in the array
 * @param fn {mixed} function | array (of functions):
 *   the function identifiers associated with the target route hook
 */
function removeRequestHook(target, fn) {
  removeHook('request', target, fn);
}

/**
 * Unregister response hooks
 *
 * @param target {mixed} string | array: the values of target can be:
 *   - * : to unregister every response hook
 *   - pathName: to unregister the hook to specified path
 *   - array of pathNames: to unregister the hook to every path in the array
 * @param fn {mixed} function | array (of functions):
 *   the function identifiers associated with the target route hook
 */
function removeResponseHook(target, fn) {
  removeHook('response', target, fn);
}

// Private helper functions

function addHook(type, target, fn) {
  const routes = { ...userModule.get('routes') }; //{ ...defaults.paths };
  const validRoutes = Object.keys(routes);
  const sentenceType = type[0].toUpperCase() + type.substring(1);

  if(typeof target === 'string') {
    target = target.trim();

    if(target === '*') {
      for(const pathName in routes) {
        hooks.add(type, generateRoute(pathName), fn);
      }
    } else {
      if(!validRoutes.includes(target)) {
        throw new Error(`${appName}::add${sentenceType}Hook: invalid hook target "${target}"`);
      }

      if(Array.isArray(fn)) {
        for(let i = 0; i < fn.length; i++) {
          hooks.add(type, generateRoute(target), fn[i]);
        }
      } else {
        hooks.add(type, generateRoute(target), fn);
      }
    }
  } else if(Array.isArray(target)) {
    target = target.map(val => val.trim());

    if(Array.isArray(fn)) {
      for(let i = 0; i < target.length; i++) {
        if(validRoutes.includes(target[i])) {
          hooks.add(type, generateRoute(target[i]), fn[i]);
        }
      }
    } else {
      for(const route of target) {
        if(validRoutes.includes(route)) {
          hooks.add(type, generateRoute(route), fn);
        }
      }
    }
  }
}

function removeHook(type, target, fn) {
  const routes = { ...userModule.get('routes') };

  if(typeof target === 'string') {
    target = target.trim();

    if(target === '*') {
      for(const pathName in routes) {
        hooks.remove(type, generateRoute(pathName), fn);
      }
    } else {
      if(Array.isArray(fn)) {
        for(let i = 0; i < fn.length; i++) {
          hooks.remove(type, generateRoute(target), fn[i]);
        }
      } else {
        hooks.remove(type, generateRoute(target), fn);
      }
    }
  } else if(Array.isArray(target)) {
    target = target.map(val => val.trim());

    if(Array.isArray(fn)) {
      for(let i = 0; i < target.length; i++) {
        hooks.remove(type, generateRoute(target[i]), fn[i]);
      }
    } else {
      for(const route of target) {
        hooks.remove(type, generateRoute(route), fn);
      }
    }
  }
}

/**
 * Lets us look for connection parameters in :
 *   - userModule (set via config())
 *   - environment variables
 */
function prepareConnectionParameters(opts) {
  const dbConfig = opts || {};

  const adapter = dbConfig.adapter || env.DB_ADAPTER;
  const host = dbConfig.host || env.DB_HOST;
  const port = dbConfig.port || env.DB_PORT;
  const user = dbConfig.user || env.DB_USERNAME;
  const pass = dbConfig.pass || env.DB_PASSWORD;
  const engine = dbConfig.engine || env.DB_ENGINE;
  const dbName = dbConfig.dbName || env.DB_DBNAME;
  const storagePath = dbConfig.storagePath || env.DB_STORAGE_PATH;
  const debug = dbConfig.debug || env.DB_DEBUG;
  const exitOnFail = dbConfig.exitOnFail || env.EXIT_ON_DB_CONNECT_FAIL;

  return {
    adapter,
    host, port, user, pass,
    engine, dbName, storagePath,
    debug, exitOnFail,
  };
}
