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

function getValidId(id) {
  if(!id) { // handle null and undefined cases
    return ''.trim();
  }

  switch(typeof id) {
  case 'string': return id.trim();
  case 'object': return id.toString().trim();
  case 'number': return id;
  default      : return ''.trim();
  }
}

module.exports = {
  emit,
  userModule,
  getValidId,
  convertToBoolean,
};
