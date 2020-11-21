const env = ('./dotenv'); // Wow! Discovered a short-cut method to 'require('./dotenv')'
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
server.listen(3000);

module.exports = {
  server,
  userModule,
  apiUrl: '/api/v1'
}
