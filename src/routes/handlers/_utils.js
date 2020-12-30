const env = require('../../dotenv');
const debugLog = require('../../utils/debug');
const { emit, getValidId, userModule, generateRoute } = require('../../utils');
const { statusCodes } = require('../../utils/http');
const hooks = require('../../utils/hooks');

// Fields to return to the client when a new user is created
// or when user data is requested
const publicFields = [
  'id', 'firstname', 'lastname', 'fullname',
  'email', 'username', 'signupDate'
];

module.exports = {
  env,
  emit,
  hooks,
  publicFields,
  debugLog,
  statusCodes,
  getValidId,
  generateRoute,
  appModule: userModule,
};
