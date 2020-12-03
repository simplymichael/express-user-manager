#!/usr/bin/env node

const env = require('./dotenv');
const apiVersion = env.API_VERSION;
const prepare = require('./utils/prepare');
const createError = require('http-errors');
const userModule = require('./user-module');
const apiRoutes = require(`./routes/api-v${apiVersion}`);
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
    const regexp = route === 'index'
      ? `/api/v${apiVersion}/?`
      : `/api/v${apiVersion}/${route}`;

    app.use(new RegExp(regexp, 'i'), apiRoutes[route]);
  }

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res) {
    res.status(err.status || 500).json({error: err.message});
  });
}
