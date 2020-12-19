const adapters = require('./adapters/');

module.exports = {
  getAdapter,
};

function getAdapter(key) {
  return adapters.getAdapter(key.toLowerCase());
}
