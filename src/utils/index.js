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
  /**
   * We are not using defaults.routes (src/routes/defaults.js)
   * Since that would only give us the default routes,
   * but not the dynamic routes which can be set by the user if they so decide.
   * By using userModule.get('routes')
   *    - which was set during route setup by routes/index.js::setupRouting() -
   * we ensure we get the routes currently in use (default or dynamic)
   * and we can properly add hooks to those routes.
   *
   * To aid working with hooks is the reason this function was originally created.
   */
  const routes = userModule.get('routes');

  switch(target) {
  case 'list':
  case 'search':
  case 'getUser':
  case 'logout': return `GET ${routes[target]}`;

  case 'signup':
  case 'login': return `POST ${routes[target]}`;

  case 'updateUser': return `PUT ${routes[target]}`;
  case 'deleteUser': return `DELETE ${routes[target]}`;
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
