#!/usr/bin/env node

const app = require('./app');
const env = require('./dotenv');
const db = require('./databases');
const { initApiRoutes, createServer } = require('./utils/server');

// If invoked directly, e.g via node index.js
// Use data from environment variable or .env file for both initialisation tasks
if(require.main === module) {
  (async function() {
    await initDb(); // Ensure db is running before starting server
    createServer(app.getDefaultApp(env.PORT));
  })();
}

module.exports = {
  initDb,
  initApiRoutes,
};

async function initDb(opts = {}) {
  return await db.connect(opts);
}
