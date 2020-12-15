const userModule = require('../user-module');

function emit(event, ...data) {
  userModule.emit(event, ...data);
}

function convertToBoolean(data) {
  if(data === 'false') {
    return false;
  }

  const parsedData = parseInt(data);
  return (isNaN(parsedData) ? Boolean(data) : !!parsedData);
}

module.exports = {
  emit,
  userModule,
  convertToBoolean,
};
