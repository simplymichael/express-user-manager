const config = require('./config');
const debugLog = require('debug')('user-management');

config.debugLog = debugLog;

module.exports = config;
