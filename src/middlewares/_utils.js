const { emit } = require('../utils');
const userModule = require('../user-module');
const { statusCodes } = require('../utils/http');

module.exports = {
  emit,
  statusCodes,
  appModule: userModule,
};
