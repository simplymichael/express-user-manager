const env = require('../../dotenv');
const debugLog = require('../../utils/debug');
const { emit, userModule } = require('../../utils');
const { statusCodes } = require('../../utils/http');

// Fields to return to the client when a new user is created
// or when user data is requested
const publicFields = [
  'id', 'firstname', 'lastname', 'fullname',
  'email', 'username', 'signupDate'
];

module.exports = {
  env,
  emit,
  publicFields,
  debugLog,
  statusCodes,
  appModule: userModule,
};
