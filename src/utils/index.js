const userModule = require('../user-module');

function emit(event, ...data) {
  userModule.emit(event, ...data);
}

function convertToBoolean(data) {
  data = typeof data === 'string' ? data.toLowerCase() : data;

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

function generateRoute(target) {
  target = target.toLowerCase();
  const routes = { ...userModule.get('routes') };

  switch(target) {
  case routes.list:
  case routes.search:
  case routes.getUser:
  case routes.logout: return `GET ${target}`;

  case routes.signup:
  case routes.login: return `POST ${target}`;

  case routes.updateUser: return `PUT ${target}`;
  case routes.deleteUser: return `DELETE ${target}`;
  default: return '';
  }
}

module.exports = {
  emit,
  userModule,
  getValidId,
  generateRoute,
  convertToBoolean,
};
