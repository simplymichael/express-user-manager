const http = require('http');
const express = require('express');
const env = require('../src/dotenv');
const userManager = require('../src/index');
const { setupDB } = require('./_test-setup');

const MongooseStore = require('../src/lib/stores/mongoose');

const app = express();
const userModule = userManager.listen(app);
userModule.set('store', new MongooseStore());
userModule.set('dbDriver', 'mongoose');

setupDB(userModule.get('store'), userModule.get('dbDriver'), {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  pass: env.DB_PASSWORD,
  dbName: env.DB_DBNAME,
  debug: env.DB_DEBUG,
});

const server = http.createServer(app);

module.exports = {
  server,
  userModule,
  apiUrl: '/api/v1',
  apiPort: 3000, // for now only NOT used in fetch.test.js
  env, // for now only used in login.test.js
}
