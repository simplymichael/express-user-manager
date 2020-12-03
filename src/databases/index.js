const drivers = require('./drivers/');

module.exports = {
  getDriver,
};

function getDriver(key) {
  return drivers.getDriver(key.toLowerCase());
}
