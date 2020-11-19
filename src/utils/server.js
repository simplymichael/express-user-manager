const http = require('http');
const env = require('../dotenv');
const debugLog = require('./debug');
const apiVersion = env.API_VERSION;
const apiRoutes = require(`../routes/api-v${apiVersion}`);

module.exports = {
  initApiRoutes,
  createServer,
  normalizePort,
};

/**
 * Setup (API) routing table
 * @param an express app (not an express server)
 *   i.e, we have not called http.createServer(app) on the app
 *
 * This allows us to automatically create user routes for the client
 * that works on the client's (host and) port.
 */
function initApiRoutes(app) {
  for(const route in apiRoutes) {
    const regexp = route === 'index'
      ? `/api/v${apiVersion}/?`
      : `/api/v${apiVersion}/${route}`;

    app.use(new RegExp(regexp, 'i'), apiRoutes[route]);
  }
}

function createServer(app, port) {
  port = normalizePort(port || app.get('port'));
  const server = http.createServer(app);

  server.listen(port);
  server.on('error', function onError(error) {
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    if (error.syscall !== 'listen') {
      throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges'); break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use'); break;
    default:
      throw error;
    }

    process.exit(1);
  });
  server.on('listening', function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    const currentEnv = app.get('env') || env.NODE_ENV;

    debugLog(`User Management is running in ${currentEnv} mode`);
    debugLog(`User Management server listening on ${bind}`);
  });

  return server;
}

/**
 * Normalize a port into a string, number, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  return (isNaN(port) ? val : (port >= 0 ? port : false));
}
