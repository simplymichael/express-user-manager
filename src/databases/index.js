const env = require('../dotenv');
const drivers = require('./drivers/');

module.exports = {
  getDriver,
  connect,
};

function getDriver(key = env.DB_DRIVER) {
  return drivers.getDriver(key.toLowerCase());
}

async function connect(connectionOptions = {}) {
  const driver = connectionOptions.driver || env.DB_DRIVER;

  if(connectionOptions.driver) {
    delete connectionOptions.driver;
  }

  return await getDriver(driver).connect(connectionOptions);
}
