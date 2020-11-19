#!/usr/bin/env node

const app = require('./app');
const http = require('http');
const env = require('./dotenv');
const db = require('./databases');
const debugLog = require('./utils/debug');
const userModule = {
  async initDb(opts = {}) {
    return await db.connect(opts);
  },

  initServer(options = {}) {
    const port = normalizePort(options.port || env.PORT || '3000');
    app.set('port', port);

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
};

/**
 * Normalize a port into a string, number, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  return (isNaN(port) ? val : (port >= 0 ? port : false));
}

// If invoked directly, e.g via node index.js
// Use data from environment variable or .env file for both initialisation tasks
if(require.main === module) {
  (async function() {
    await userModule.initDb(); // Ensure db is running before starting server
    userModule.initServer();
  })();
}

module.exports = userModule;
