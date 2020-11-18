const env = ('./dotenv'); // Wow! Discovered a short-cut method to 'require('./dotenv')'
const port = env.PORT || '3001';
const userModule = require('../src/index');
const { setupDB } = require('./_test-setup');
setupDB({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  pass: env.DB_PASSWORD,
  dbName: env.DB_DBNAME,
  debug: env.DB_DEBUG,
});

const server = userModule.initServer({
  port: port,
});


module.exports = server;
