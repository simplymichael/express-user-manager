const userModule = require('../user-module');

function emit(event, ...data) {
  userModule.emit(event, ...data);
}

module.exports = emit;
