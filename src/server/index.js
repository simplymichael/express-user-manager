const http = require('http');
const env = require('../dotenv');
const express = require('express');
const userModule = require('../index');
const serverMethods = require('./server-methods');
const { onError, onListening, normalizePort } = serverMethods;
const port = normalizePort(env.PORT);
const dbDriver = env.DB_DRIVER || 'mongoose';
const DataStore = userModule.getDbDriver(dbDriver);
const defaultRoutes = require('../routes/defaults');

const app = express();
const apiUrl = defaultRoutes.base;
const customRoutes = defaultRoutes.paths;
const store = new DataStore();
userModule.set('store', store);
userModule.listen(app, apiUrl, customRoutes);

(async function() {
  const server = http.createServer(app);

  // Ensure the db is running before binding the server to the port
  await store.connect({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    pass: env.DB_PASSWORD,
    dbName: env.DB_DBNAME,
    debug: env.DB_DEBUG,
    exitOnFail: env.EXIT_ON_DB_CONNECT_FAIL,
  });

  // Listen on provided port, on all network interfaces.
  server.listen(port);
  server.on('error', (error) => onError(error, port));
  server.on('listening', () => onListening(server));
})();
