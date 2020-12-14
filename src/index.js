#!/usr/bin/env node

const db = require('./databases');
const setupRouting = require('./routes');
const prepare = require('./utils/prepare');
const userModule = require('./user-module');
const middlewares = require('./middlewares');

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
function listen(app, baseApiRoute = '/api/users', customRoutes = {}) {
  const routeListener = setupRouting(customRoutes);

  app = prepare(app);
  app.use(new RegExp(`${baseApiRoute}`, 'i'), routeListener);
}
