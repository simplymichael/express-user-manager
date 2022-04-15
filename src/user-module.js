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
    super(...args);

    this.store = new Map();
  }

  set(key, value) {
    this.store.set(key, value);
  }

  get(key) {
    return this.contains(key) ? this.store.get(key) : null;
  }

  contains(key) {
    return this.store.has(key);
  }

  delete(key) {
    return this.store.delete(key);
  }

  static getInstance() {
    if (!UserModule.instance) {
      UserModule.instance = new UserModule();
    }

    return UserModule.instance;
  }
}

module.exports = UserModule.getInstance();
