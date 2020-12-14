#!/usr/bin/env node

const apiRoutes = require('./routes').api;
const prepare = require('./utils/prepare');
const userModule = require('./user-module');
const middlewares = require('./middlewares');
const db = require('./databases');

// Augment the userModule with midddlewares
userModule.set('middlewares', middlewares);

userModule.listen = listen;
userModule.getDbDriver = db.getDriver;

// Export userModule singleton instance
// to enable clients (emit and) respond to events emitted by the route handlers:
// userModule.on(eventType, data);
module.exports = userModule;

/**
 * Setup (API) routing table
 * @param an express app
 *
 * This allows us to automatically create user routes for the client
 * that works on the client's (host and) port.
 */
function listen(app) {
  app = prepare(app);

  for(const route in apiRoutes) {
    const regexp = `/api/${route}`;

    app.use(new RegExp(regexp, 'i'), apiRoutes[route]);
  }
}
