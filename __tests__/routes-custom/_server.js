const http = require('http');
const express = require('express');
const env = require('../../src/dotenv');
const userModule = require('../../src/index');
const { setupDB } = require('../_test-setup');
const dbAdapter = env.DB_ADAPTER;
const store = userModule.getDbAdapter(dbAdapter);
const customRoutes = {
  list       : '/getUsers',
  search     : '/searchUsers',
  getUser    : '/getUser',
  signup     : '/register',
  login      : '/auth',
  logout     : '/signout',
  updateUser : '/update',
  deleteUser : '/user',
};

const app = express();
const apiUrl = '/api/v1';
userModule.listen(app, apiUrl, customRoutes);

setupDB(store, dbAdapter, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  pass: env.DB_PASSWORD,
  engine: env.DB_ENGINE,
  dbName: env.DB_DBNAME,
  storagePath: env.DB_STORAGE_PATH || '../../.data/sqlite',
  debug: env.DB_DEBUG,
  exitOnFail: env.EXIT_ON_DB_CONNECT_FAIL,
});

const server = http.createServer(app);

module.exports = {
  server,
  userModule,
  apiUrl,
  apiPort: 3001,
  env, // for now only used in login.test.js
  customRoutes,
}
