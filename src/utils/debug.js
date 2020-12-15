const userModule = require('../utils').userModule;
const debug = require('debug')(userModule.get('appName') || 'user-manager');

module.exports = debug;
