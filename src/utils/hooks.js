const validHookTypes = ['req', 'request', 'res', 'response'];

const hooks = {
  request: {},
  response: {},

  add: function(type, target, fn) {
    if(typeof target !== 'string') {
      throw new Error(
        `hooks::add: second parameter expects a string: ${typeof target} given`);
    }

    if(typeof fn !== 'function') {
      throw new Error(
        `hooks::add: third parameter expects a function: ${typeof fn} given`);
    }

    switch(type.toLowerCase()) {
    case 'req':
    case 'request': return addRequestHook(target, fn);
    case 'res':
    case 'response': return addResponseHook(target, fn);
    default: throw new Error(`hooks::add: unknown hook type: ${type}.
      Valid types are ${validHookTypes.join(',')}`);
    }
  },

  execute: function(type, target, req, res, next) {
    switch(type.toLowerCase()) {
    case 'req':
    case 'request': executeRequestHooks(target, req, res, next); break;
    case 'res':
    case 'response': executeResponseHooks(target, req, res, next); break;
    }
  }
};

module.exports = hooks;


function addRequestHook(name, callback) {
  hooks.request = hooks.request || {};
  (hooks.request[name] = hooks.request[name] || []).push(callback);

  return hooks;
}

function addResponseHook(name, callback) {
  hooks.response = hooks.response || {};
  (hooks.response[name] = hooks.response[name] || []).push(callback);

  return hooks;
}

function executeRequestHooks(name, req, res, next) {
  if (hooks.request[name]) {
    callHookListeners(hooks.request[name], req, res, next);
  } else { // If there's no registered hooks, just invoke next() so that processing can continue
    next();
  }
}

function executeResponseHooks(name, req, res, next) {
  if (hooks.response[name]) {
    callHookListeners(hooks.response[name], req, res, next);
  } else { // If there's no registered hooks, just invoke next() so that processing can continue
    next();
  }
}

function callHookListeners(listeners, req, res, next) {
  listeners.shift()(req, res, next);

  if (listeners.length > 0) {
    callHookListeners(listeners, req, res, next);
  }
}
