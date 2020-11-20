const EventEmitter = require('events').EventEmitter;

/**
 * Allows us to emit events.
 * Events are mainly emitted by route handlers (and middlewares).
 * The singleton ensures that any event emitted can be trapped
 * by any code that requires this module without fearing that it may be
 * a different instance
 */
class UserModule extends EventEmitter {
  constructor(...args) {
    if (!UserModule.instance) {
      super(...args);
      UserModule.instance = this;
    }

    return UserModule.instance;
  }

  static getInstance() {
    return new UserModule();
  }
}

module.exports = UserModule.getInstance();
