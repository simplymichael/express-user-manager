const http = require('http');
const chai = require('chai');
const crypto = require('crypto');
const spies = require('chai-spies');
const express = require('express');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const env = require('../src/dotenv');
const userManager = require('../src');
const db = require('../src/databases');
const { keys: routeKeys } = require('../src/routes/defaults');
const { convertToBoolean, generateRoute } = require('../src/utils');
const debug = require('../src/utils/debug');
const hooks = require('../src/utils/hooks');
const { deleteApiTestUser } = require('./_api-utils');

const appName = 'express-user-manager';
const validAdapters = db.validAdapters;
const validAdaptersMsg = `Valid adapters include: ${validAdapters.join(', ')}`;
const { expect, should } = chai;

const app = express();
const configObj = {
  apiMountPoint: '/api/v2',
  password: {
    minLength  : 7,
    maxLength  : 25,
    disallowed : ['password', 'pass', 'password123', 'mypassword']
  },
  routes: {
    list       : '/users',
    search     : '/search',
    getUser    : '/user',
    signup     : '/register',
    login      : '/signin',
    logout     : '/signout',
    updateUser : '/update',
    deleteUser : '/delete'
  },
  db: {
    adapter     : 'sequelize',
    host        : 'localhost',
    port        : 3306,
    user        : '',
    pass        : '',
    engine      : 'memory',
    dbName      : 'users',
    storagePath : '',
    debug       : false,
    exitOnFail  : true,
  },
  security: {
    sessionSecret   : crypto.randomBytes(32).toString('hex'),
    authTokenSecret : crypto.randomBytes(32).toString('hex'),
    authTokenExpiry : 60 * 60 * 24
  }
};

/**
 * userManager.listen(app) has to first be called to - among other things -
 * setup routing.
 * Hooks cannot be added before setting up routing because we need to know
 * which routes (default or custom) to add hooks to
 */
userManager.listen(app);

should();
chai.use(spies);
chai.use(chaiHttp);

describe.only(appName, () => {
  describe('config()', () => {
    it('should throw an error if no parameter is passed', () => {
      try {
        userManager.config();
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::config: expects an object as the first argument`
        ));
      }
    });

    it('should throw an error if a non-object is passed as the first parameter', () => {
      try {
        userManager.config(true);
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::config: expects an object as the first argument`
        ));
      }
    });

    it('should throw an error if null is passed as the first parameter', () => {
      try {
        userManager.config(null);
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::config: expects an object as the first argument`
        ));
      }
    });

    it(`should set configuration parameters on the ${appName} object`, () => {
      userManager.config(configObj);

      userManager.get('apiMountPoint').should.equal(configObj.apiMountPoint);

      for(let [key, value] of Object.entries(configObj)) {
        if(key === 'apiMountPoint') {
          continue;
        }

        userManager.get(key).should.deep.equal(value);
      }
    });
  });

  describe('getDbAdapter()', () => {
    const envAdapter = env.DB_ADAPTER;
    const storeMethods = [
      'emit',
      'debug',
      'toBoolean',
      'connect',
      'disconnect',
      'createUser',
      'getUsers',
      'searchUsers',
      'findByEmail',
      'findByUsername',
      'findById',
      'updateUser',
      'deleteUser'
    ];

    it('should throw an error if passed an invalid adapter', () => {
      const adapter = 'database';

      try {
        const store = userManager.getDbAdapter(adapter);
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::getAdapter: invalid adapter ${adapter}. ${validAdaptersMsg}`
        ));
      }
    });

    it('should return a db connector and manipulation object (store) based on a passed valid adapter', () => {
      const store = userManager.getDbAdapter('mongoose');
      store.should.be.an('object');

      for(let method of storeMethods) {
        store.should.have.property(method);
        store[method].should.be.a('function');
      }
    });

    it('should return a db connector and manipulation object (store) based on configuration-specified adapter', () => {
     let store = null;

      // Remove adapters set via env and config;
      userManager.set('db', null);
      delete process.env.DB_ADAPTER;

      expect(userManager.get('db')).to.equal(null);
      expect(env.DB_ADAPTER).to.be.undefined;

      try {
        store = userManager.getDbAdapter();
      } catch(err) {
        (typeof err).should.equal('object');
        err.should.match(new RegExp(
          `${appName}::getDbAdapter: no adapter found via config or environment variable. ` +
          `Pass a string as the first argument. ${validAdaptersMsg}`
        ));
        expect(store).to.equal(null);

        userManager.config(configObj);

        /**
         * getDbAdapter() will search in:
         *   - passed string (undefined, nothing passed as argument)
         *   - configObj.db - which we just set by calling config() -
         *       finds and uses a valid adapter
         */
        store = userManager.getDbAdapter();

        store.should.be.an('object');

        for(let method of storeMethods) {
          store.should.have.property(method);
          store[method].should.be.a('function');
        }
      }
    });

    it('should return a db connector and manipulation object (store) based on ENV-specified adapter', () => {
     let store = null;

      // Remove adapters set via env and config;
      userManager.set('db', null);
      delete process.env.DB_ADAPTER;

      expect(userManager.get('db')).to.equal(null);
      expect(env.DB_ADAPTER).to.be.undefined;

      try {
        store = userManager.getDbAdapter();
      } catch(err) {
        (typeof err).should.equal('object');
        err.should.match(new RegExp(
          `${appName}::getDbAdapter: no adapter found via config or environment variable. ` +
          `Pass a string as the first argument. ${validAdaptersMsg}`
        ));
        expect(store).to.equal(null);

        // Restore the adapter set in the environment variable
        process.env.DB_ADAPTER = envAdapter;

        /**
         * getDbAdapter() will search in:
         *   - passed string (undefined, nothing passed as argument)
         *   - configurationObject.db (null, as we set it to null above)
         *   - environment variable DB_ADAPTER, finds nd uses a valid adapter
         */
        store = userManager.getDbAdapter();

        store.should.be.an('object');

        for(let method of storeMethods) {
          store.should.have.property(method);
          store[method].should.be.a('function');
        }
      }
    });
  });

  describe('init()', () => {
    it('should throw an error if the "app" parameter is not passed', async () => {
      try {
        await userManager.init();
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::init: expects an Express app as the first argument`
        ));
      }
    });

    it('should throw an error if the "app" parameter is not an Express.js app', async () => {
      let server = null;

      try {
        server = http.createServer(app);
        await userManager.init(server);
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::init: expects an Express app as the first argument`
        ));

        server.close();
      }
    });

    it('should throw an error if the "options" parameter is not passed', async () => {
      try {
        await userManager.init(app);
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::init: expects an object as the second argument`
        ));
      }
    });

    it('should throw an error if the "options" parameter is not an object', async () => {
      try {
        await userManager.init(app, function() {});
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::init: expects an object as the second argument`
        ));
      }
    });

    it('should throw an error if the configuration db adapter is invalid', async () => {
      const adapter = 'database';
      configObj.db.adapter = adapter;

      try {
        await userManager.init(app, configObj);
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          `${appName}::init: invalid adapter "${adapter}". ${validAdaptersMsg}`
        ));
      }
    });

    it('should run initialization code and start listening for requests', async () => {
      const port = 3000;
      const requestPath = `${configObj.apiMountPoint}${configObj.routes.signup}`;
      const requestUrl = `http://localhost:${port}${requestPath}`;
      const createData = {
        firstname: 'majik',
        lastname: 'johnson',
        username: 'majikj',
        email: 'majikj@johnsonfamily.com',
        password: '123Secret#',
        confirmPassword: '123Secret#'
      };
      let server = null;
      let result = null;

      // Reset the adapter which was changed in the previous test
      configObj.db.adapter = 'sequelize';

      /**
       * Create server and listen, without calling userManager.init()
       * As a result, the routes for handling users is not bound to the server,
       * consequently requests to the users' routes will return 404
       */
      server = http.createServer(app);
      server.listen(port);

      result = await fetch(requestUrl, {
        method: 'post',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      });

      (typeof result).should.equal('object');
      result.should.have.property('status', 404);

      server.close();
      server = null;

      /**
       * Create server, listen, and call userManager.init()
       * to run initialization and start listening for user requests
       * As a result, the routes for handling users is bound to the server,
       * and we can make user-related requests and get back expected responses.
       */
      server = http.createServer(app);
      server.listen(port);
      await userManager.init(app, configObj);

      result = await fetch(requestUrl, {
        method: 'post',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      });

      (typeof result).should.equal('object');
      result.should.have.property('status', 200);

      const jsonResult = await result.json();

      (typeof jsonResult).should.equal('object');
      jsonResult.should.have.property('data');
      jsonResult.data.should.have.property('user');

      const user = jsonResult.data.user;

      (typeof user).should.equal('object');
      user.should.have.property('id');
      user.should.have.property('firstname', createData.firstname);
      user.should.have.property('lastname', createData.lastname);
      user.should.have.property('username', createData.username);
      user.should.have.property('fullname',
        [createData.firstname, createData.lastname].join(' '));
      user.should.have.property('email', createData.email);
      user.should.have.property('signupDate');

      // Set the password to login and delete the user
      user.password = createData.password;

      await deleteApiTestUser(
        user,
        server,
        `${configObj.apiMountPoint}${configObj.routes.login}`,
        `${configObj.apiMountPoint}${configObj.routes.deleteUser}/${user.id}`
      );

      server.close();
      server = null;
    });
  });

  describe('addRequestHook', () => {
    const hookType = 'request';

    it('should throw an error if "target" parameter is not a valid route', () => {
     const target = '/fun';

      try {
        userManager.addRequestHook(target, function(req, res, next) {});
      } catch(err) {
        (typeof err).should.equal('object');
        err.should.match(new RegExp(
          `${appName}::addRequestHook: invalid hook target "${target}"`
        ));
      }
    });

    specify('* should add the hook to every route', () => {
      const callback = function(req, res, next) {};
      let attachedHooks = hooks.get(hookType);

      attachedHooks.should.be.an('object');
      Object.keys(attachedHooks).length.should.equal(0);

      userManager.addRequestHook('*', callback);

      attachedHooks = hooks.get(hookType);

      attachedHooks.should.be.an('object');
      Object.keys(attachedHooks).length.should.equal(Object.keys(routeKeys).length);

      for(let key of Object.keys(routeKeys)) {
        Object.keys(attachedHooks).should.include(generateRoute(key));
      }

      userManager.removeRequestHook('*');
    });

    specify('a single named route should add the hook to just that route', () => {
      const target = 'login';
      const callback = function(req, res, next) {};
      let attachedHooks = hooks.get(hookType, generateRoute(target));

      expect(attachedHooks).to.be.undefined;

      userManager.addRequestHook(target, callback);

      attachedHooks = hooks.get(hookType, generateRoute(target));

      attachedHooks.should.be.an('array');
      attachedHooks.length.should.equal(1);
      attachedHooks[0].should.be.a('function');
      attachedHooks[0].should.equal(callback);

      const requestHooks = Object.keys(hooks.get(hookType));

      requestHooks.should.be.an('array');
      requestHooks.should.have.lengthOf(1);
      requestHooks[0].should.equal(generateRoute(target));

      userManager.removeRequestHook(target, callback);
      hooks.remove(target);
    });

    specify('a single named route and an array of hooks should add the hooks to the route', () => {
      const target = 'signup';
      const callbacks = [
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
      ];

      let requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(0);

      userManager.addRequestHook(target, callbacks);

      requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(1);

      const routeHooks = hooks.get(hookType, generateRoute(target));
      routeHooks.should.be.an('array');
      routeHooks.should.have.lengthOf(callbacks.length);

      for(let i = 0; i < callbacks.length; i++) {
        const callback = callbacks[i];

        routeHooks[i].should.be.a('function');
        routeHooks[i].should.equal(callback);
      }

      userManager.removeRequestHook(target, callbacks);
    });

    specify('an array of routes and a single hook should add the hook to just those routes', () => {
      const targets = ['login', 'signup', 'list', 'search'];
      const callback = function(req, res, next) {};
      let requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(0);

      userManager.addRequestHook(targets, callback);

      requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(targets.length);

      for(let route of targets) {
        const routeHooks = hooks.get(hookType, generateRoute(route));

        routeHooks.should.be.an('array');
        routeHooks.should.have.lengthOf(1);
        routeHooks[0].should.be.a('function');
        routeHooks[0].should.equal(callback);
      }

      userManager.removeRequestHook(targets, callback);
    });

    specify('an array of routes and an array of hooks should add the corresponding hooks to the routes', () => {
      const targets = ['login', 'signup', 'list', 'search'];
      const callbacks = [
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
      ];

      let requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(0);

      userManager.addRequestHook(targets, callbacks);

      requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(targets.length);

      for(let i = 0; i < targets.length; i++) {
        const route = targets[i];
        const callback = callbacks[i];

        const routeHooks = hooks.get(hookType, generateRoute(route));

        routeHooks.should.be.an('array');
        routeHooks.should.have.lengthOf(1);
        routeHooks[0].should.be.a('function');
        routeHooks[0].should.equal(callback);
      }

      userManager.removeRequestHook(targets, callbacks);
    });
  });

  describe('addResponseHook', () => {
    const hookType = 'response';

    it('should throw an error if "target" parameter is not a valid route', () => {
     const target = '/fun';

      try {
        userManager.addResponseHook(target, function(req, res, next) {});
      } catch(err) {
        (typeof err).should.equal('object');
        err.should.match(new RegExp(
          `${appName}::addResponseHook: invalid hook target "${target}"`
        ));
      }
    });

    specify('* should add the hook to every route', () => {
      const callback = function(req, res, next) {};
      let attachedHooks = hooks.get(hookType);

      attachedHooks.should.be.an('object');
      Object.keys(attachedHooks).length.should.equal(0);

      userManager.addResponseHook('*', callback);

      attachedHooks = hooks.get(hookType);

      attachedHooks.should.be.an('object');
      Object.keys(attachedHooks).length.should.equal(Object.keys(routeKeys).length);

      for(let key of Object.keys(routeKeys)) {
        Object.keys(attachedHooks).should.include(generateRoute(key));
      }

      userManager.removeResponseHook('*');
    });

    specify('a single named route should add the hook to just that route', () => {
      const target = 'login';
      const callback = function(req, res, next) {};
      let attachedHooks = hooks.get(hookType, generateRoute(target));

      expect(attachedHooks).to.be.undefined;

      userManager.addResponseHook(target, callback);

      attachedHooks = hooks.get(hookType, generateRoute(target));

      attachedHooks.should.be.an('array');
      attachedHooks.length.should.equal(1);
      attachedHooks[0].should.be.a('function');
      attachedHooks[0].should.equal(callback);

      const requestHooks = Object.keys(hooks.get(hookType));

      requestHooks.should.be.an('array');
      requestHooks.should.have.lengthOf(1);
      requestHooks[0].should.equal(generateRoute(target));

      userManager.removeResponseHook(target, callback);
      hooks.remove(target);
    });

    specify('a single named route and an array of hooks should add the hooks to the route', () => {
      const target = 'signup';
      const callbacks = [
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
      ];

      let responseHooks = hooks.get(hookType);

      responseHooks.should.be.an('object');
      Object.keys(responseHooks).should.have.lengthOf(0);

      userManager.addResponseHook(target, callbacks);

      responseHooks = hooks.get(hookType);

      responseHooks.should.be.an('object');
      Object.keys(responseHooks).should.have.lengthOf(1);

      const routeHooks = hooks.get(hookType, generateRoute(target));
      routeHooks.should.be.an('array');
      routeHooks.should.have.lengthOf(callbacks.length);

      for(let i = 0; i < callbacks.length; i++) {
        const callback = callbacks[i];

        routeHooks[i].should.be.a('function');
        routeHooks[i].should.equal(callback);
      }

      userManager.removeResponseHook(target, callbacks);
    });

    specify('an array of routes and a single hook should add the hook to just those routes', () => {
      const targets = ['login', 'signup', 'list', 'search'];
      const callback = function(req, res, next) {};
      let requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(0);

      userManager.addResponseHook(targets, callback);

      requestHooks = hooks.get(hookType);

      requestHooks.should.be.an('object');
      Object.keys(requestHooks).should.have.lengthOf(targets.length);

      for(let route of targets) {
        const routeHooks = hooks.get(hookType, generateRoute(route));

        routeHooks.should.be.an('array');
        routeHooks.should.have.lengthOf(1);
        routeHooks[0].should.be.a('function');
        routeHooks[0].should.equal(callback);
      }

      userManager.removeResponseHook(targets, callback);
    });

    specify('an array of routes and an array of hooks should add the corresponding hooks to the routes', () => {
      const targets = ['login', 'signup', 'list', 'search'];
      const callbacks = [
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
        function(req, res, next) {},
      ];

      let responseHooks = hooks.get(hookType);

      responseHooks.should.be.an('object');
      Object.keys(responseHooks).should.have.lengthOf(0);

      userManager.addResponseHook(targets, callbacks);

      responseHooks = hooks.get(hookType);

      responseHooks.should.be.an('object');
      Object.keys(responseHooks).should.have.lengthOf(targets.length);

      for(let i = 0; i < targets.length; i++) {
        const route = targets[i];
        const callback = callbacks[i];

        const routeHooks = hooks.get(hookType, generateRoute(route));

        routeHooks.should.be.an('array');
        routeHooks.should.have.lengthOf(1);
        routeHooks[0].should.be.a('function');
        routeHooks[0].should.equal(callback);
      }

      userManager.removeResponseHook(targets, callbacks);
    });
  });
});
