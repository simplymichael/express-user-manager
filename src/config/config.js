const env = require('../dotenv');
const dsn = env.DB_USERNAME.trim().length > 0
  ? `mongodb://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_DBNAME}`
  : `mongodb://${env.DB_HOST}:${env.DB_PORT}/${env.DB_DBNAME}`;

module.exports = {
  db: { dsn, debug: env.DEBUG },
};
