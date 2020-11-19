const env = ('./dotenv'); // Wow! Discovered a short-cut method to 'require('./dotenv')'
const app = require('../src/app');
const { setupDB } = require('./_test-setup');
const { createServer } = require('../src/utils/server');
setupDB({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  pass: env.DB_PASSWORD,
  dbName: env.DB_DBNAME,
  debug: env.DB_DEBUG,
});

const server = createServer(app.getDefaultApp(env.PORT || '3001'));

module.exports = server;
