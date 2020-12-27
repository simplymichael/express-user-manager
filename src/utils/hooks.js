const hooks = {
  request: {},

  add: function(type, target, fn) {
    switch(type.toLowerCase()) {
    case 'req':
    case 'request': return addRequestHook(target, fn);
    default: throw new Error(`Unknown hook type: ${type}`);
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
