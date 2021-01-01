//const http = require('http');
const chai = require('chai');
const spies = require('chai-spies');
const express = require('express');
//const env = require('../src/dotenv');
const userManager = require('../src');
const { generateRoute } = require('../src/utils');
const hooks = require('../src/utils/hooks');
const { keys: routeKeys } = require('../src/routes/defaults');
const appName = 'express-user-manager';
const { expect, should } = chai;

const app = express();

/**
 * userManager.listen(app) has to first be called to - among other things -
 * setup routing.
 * Hooks cannot be added before setting up routing because we need to know
 * which routes (default or custom) to add hooks to
 */
userManager.listen(app);

should();
chai.use(spies);

describe(appName, () => {
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
