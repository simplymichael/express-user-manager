const validHookTypes = ['req', 'request'];

const hooks = {
  request: {},

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
    default: throw new Error(`hooks::add: unknown hook type: ${type}.
      Valid types are ${validHookTypes.join(',')}`);
    }
  },

  execute: function(name, req, res, next) {
    return executeRequestHooks(name, req, res, next);
  }
};

module.exports = hooks;


function addRequestHook(name, callback) {
  hooks.request = hooks.request || {};
  (hooks.request[name] = hooks.request[name] || []).push(callback);

  return hooks;
}

function executeRequestHooks(name, req, res, next) {
  if (hooks.request[name]) {
    callHookListeners(hooks.request[name], req, res, next);
  } else { // If there's no registered hooks, just invoke next() so that processing can continue
    next();
  }
}

function callHookListeners(listeners, req, res, next) {
  listeners.shift()(req, res, next);

  if (listeners.length) {
    callHookListeners(listeners, req, res, next);
  }
}
