const validHookTypes = ['req', 'request', 'res', 'response'];

const hooks = {
  request: {},
  response: {},
  get validTypes() {
    return validHookTypes;
  },

  /**
   * Add a new hook
   * @param type {string} 'req', 'request', 'res', 'response'
   * @param target {string} the target of the hook
   * @param fn {function} callback to be executed when the hook executes/fires
   * @return hooks {object} allows for chaining/fluent interface
   * @throws {error} if passed an unknown/invalid hook type
   */
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
    default: throw new Error(
      'hooks::add: unknown hook type: ' + type +  'Valid types are ' +
      this.validTypes.join(','));
    }
  },

  get: function(type, target) {
    return target ? this[type][target] : this[type];
  },

  execute: function(type, target, req, res, next) {
    switch(type.toLowerCase()) {
    case 'req':
    case 'request': executeRequestHooks(target, req, res, next); break;
    case 'res':
    case 'response': executeResponseHooks(target, req, res, next); break;
    }
  },

  /**
   * Remove a hook
   * @param type {string} 'request', 'req', 'response', 'res'
   * @param target {string} the target (path) of the hook
   * @param fn {function} callback to be executed when the hook executes/fires
   *
   * @return void (undefined)
   *
   * If "fn" is specified, only remove that function from the hooks callbacks
   * Otherwise, remove the hook and all its associated callbacks.
   */
  remove: function(type, target, fn) {
    type = (typeof type === 'string' ? type : '').trim();

    switch(type.toLowerCase()) {
    case 'req':
    case 'request': type = 'request'; break;
    case 'res':
    case 'response': type = 'response'; break;
    default: type = ''; break;
    }

    if(!this[type] || !this[type][target]) {
      return;
    }

    if(fn) {
      this[type][target] = this[type][target].filter(cb => cb !== fn);
    } else {
      this[type][target] = [];
    }

    if(this[type][target].length === 0) {
      delete this[type][target];
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
  if(listeners.length === 0) {
    next();
  }

  /*
  listeners.shift()(req, res, next);

  if (listeners.length > 0) {
    callHookListeners(listeners, req, res, next);
  }*/

  while(listeners.length > 0) {
    /**
     * If we still have more than one hooks in the chain,
     * next() should be a dummy function,
     * otherwise, next() should be the express middleware's next() function.
     *
     * Without this safeguard, calling next() will jump to the 404 handler,
     * and return a 404 response
     * when there are more than one hooks registered for a given route.
     */
    if(listeners.length === 1) {
      listeners.shift()(req, res, next);
    } else {
      listeners.shift()(req, res, contrivedNext);
    }
  }

  /**
   * Creates a dummy next() for when we have more than one hook in the chain.
   * However, if at any point any hook calls next(err) with an error,
   * then that next(err) should be executed
   */
  function contrivedNext(err) {
    if(err) {
      next(err);
    }
  }
}
