const env = require('../src/dotenv');
const http = require('http');
const express = require('express');
const { setupDB } = require('./_test-setup');
const prepare = require('../src/utils/prepare');

setupDB({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  pass: env.DB_PASSWORD,
  dbName: env.DB_DBNAME,
  debug: env.DB_DEBUG,
});

const app = express();
const userModule = require('../src/index').listen(app);
const server = http.createServer(app);

module.exports = {
  server,
  userModule,
  apiUrl: '/api/v1',
  apiPort: 3000, // for now only used in login.test.js
  env, // for now onlyy used in login.test.js
}
