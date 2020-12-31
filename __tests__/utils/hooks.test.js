const chai = require('chai');
const spies = require('chai-spies');
const mongoose = require('mongoose');
const hooks = require('../../src/utils/hooks');
const { expect } = chai;
const validHookTypes = hooks.validTypes;

chai.use(spies);

describe('Hooks', () => {
  describe('add()', () => {
    it('should throw an error if given an invalid hook type', () => {
     const type = 'fetch';

      try {
        hooks.add(type, '/', function(req, res, next) {});
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(
          'hooks::add: unknown hook type: ' + type +  'Valid types are ' +
          validHookTypes.join(',')
        ));
        expect(hooks.get('request')).to.deep.equal({});
        expect(hooks.get('response')).to.deep.equal({});
      }
    });

    it('should throw an error if "target" parameter is not a string', () => {
      const target = {};

      try {
         hooks.add('req', target, function(req, res, next) {});
       } catch(err) {
         expect(typeof err).to.equal('object');
         expect(err).to.match(
           /hooks::add: second parameter expects a string: object given/);
         expect(hooks.get('request')).to.deep.equal({});
       }
    });

    it('should throw an error if "fn" parameter is not a function', () => {
      const fn = {};

      try {
         hooks.add('req', '/', fn);
       } catch(err) {
         expect(typeof err).to.equal('object');
         expect(err).to.match(
           /hooks::add: third parameter expects a function: object given/);
         expect(hooks.get('request')).to.deep.equal({});
       }
    });

    it('should add a request hook if type is "req" and "target" and "fn" are valid', () => {
      const type = 'req';
      const target = '/';
      const callback = function(req, res, next) {};

      hooks.add(type, target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(responseHooksKeys).to.have.lengthOf(0);

      hooks.remove(type, target, callback);
    });

    it('should add a request hook if type is "request" and "target" and "fn" are valid', () => {
      const type = 'request';
      const target = '/';
      const callback = function(req, res, next) {};

      hooks.add(type, target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(responseHooksKeys).to.have.lengthOf(0);

      hooks.remove(type, target, callback);
    });

    it('should add a response hook if type is "res" and "target" and "fn" are valid', () => {
      const type = 'res';
      const target = '/';
      const callback = function(req, res, next) {};

      hooks.add(type, target, callback);

      const targetResponseHooks = hooks.get('response', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(responseHooksKeys).to.have.lengthOf(1);
      expect(responseHooksKeys[0]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback);
      expect(requestHooksKeys).to.have.lengthOf(0);

      hooks.remove(type, target, callback);
    });

    it('should add a response hook if type is "response" and "target" and "fn" are valid', () => {
      const type = 'response';
      const target = '/';
      const callback = function(req, res, next) {};

      hooks.add(type, target, callback);

      const targetResponseHooks = hooks.get('response', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(responseHooksKeys).to.have.lengthOf(1);
      expect(responseHooksKeys[0]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback);
      expect(requestHooksKeys).to.have.lengthOf(0);

      hooks.remove(type, target, callback);
    });
  });

  describe('execute()', () => {
    it('should invoke registered callbacks when "execute" is called', () => {
      let testValue = 0;
      const type = 'request';
      const target = '/';
      const callback = function(req, res, next) {
        testValue++;
      };

      hooks.add(type, target, callback);
      hooks.add(type, target, callback);
      hooks.add(type, target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(3);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(typeof targetRequestHooks[1]).to.equal('function');
      expect(typeof targetRequestHooks[2]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(targetRequestHooks[1]).to.equal(callback);
      expect(targetRequestHooks[2]).to.equal(callback);
      expect(responseHooksKeys).to.have.lengthOf(0);

      hooks.execute(type, target, {}, {}, function() {});

      expect(testValue).to.equal(3);

      hooks.remove(type, target, callback);
    });

    it('should invoke registered callbacks and pass "req", "res", and "next" when "execute" is called', () => {
      let testValue = 0;
      const type = 'request';
      const target = '/';
      const statusCode = 200;
      const nextMessage = 'next() called';

      // don't log to the console, so we don't mix the output with the test output
      const original = console.log;
      console.log = function(...args) { return args };
      const callback = function(req, res, next) {
        testValue += req.value;
        console.log(res.statusCode);
        next();
      };
      const spy = chai.spy.on(console, 'log');

      hooks.add(type, target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(spy).to.not.have.been.called;
      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(responseHooksKeys).to.have.lengthOf(0);

      hooks.execute(type,  target,
        { value: 5 },
        { statusCode: statusCode },
        function() {
          console.log(nextMessage);
        }
      );

      expect(testValue).to.equal(5);
      expect(spy).to.have.been.called.twice;
      expect(spy).to.have.been.called.with(statusCode);
      expect(spy).to.have.been.called.with(nextMessage);

      hooks.remove(type, target, callback);
      chai.spy.restore();
      console.log = original;
    });

    it('should call next only for the last hook when multiple hooks are attached to a route', () => {
      const type = 'request';
      const target = '/';
      const nextMessage = 'next() called';

      // don't log to the console, so we don't mix the output with the test output
      const original = console.log;
      console.log = function(...args) { return args };
      const callback = function(req, res, next) {
        next();
      };
      const spy = chai.spy.on(console, 'log');

      hooks.add(type, target, callback);
      hooks.add(type, target, callback);
      hooks.add(type, target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(spy).to.not.have.been.called;
      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(3);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(typeof targetRequestHooks[1]).to.equal('function');
      expect(typeof targetRequestHooks[2]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(targetRequestHooks[1]).to.equal(callback);
      expect(targetRequestHooks[2]).to.equal(callback);
      expect(responseHooksKeys).to.have.lengthOf(0);

      hooks.execute(type, target, {}, {},
        function() {
          console.log(nextMessage);
        }
      );

      expect(spy).to.have.been.called.once;
      expect(spy).to.have.been.called.with(nextMessage);

      hooks.remove(type, target, callback);
      chai.spy.restore();
      console.log = original;
    });

    it('should call next for any route that errors:next(err) when multiple hooks are attached to a route', () => {
      const type = 'request';
      const target = '/';
      const errMessage = 'Error occurred';

      // don't log to the console, so we don't mix the output with the test output
      const original = console.log;
      console.log = function(...args) { return args };
      const callback = function(req, res, next) {
        next(errMessage);
      };
      const callbackNextNoError = function(req, res, next) {
        next();
      };
      const spy = chai.spy.on(console, 'log');

      hooks.add(type, target, callbackNextNoError);
      hooks.add(type, target, callback);
      hooks.add(type, target, callbackNextNoError);
      hooks.add(type, target, callback);
      hooks.add(type, target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(spy).to.not.have.been.called;
      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(5);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(typeof targetRequestHooks[1]).to.equal('function');
      expect(typeof targetRequestHooks[2]).to.equal('function');
      expect(typeof targetRequestHooks[3]).to.equal('function');
      expect(typeof targetRequestHooks[4]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callbackNextNoError);
      expect(targetRequestHooks[1]).to.equal(callback);
      expect(targetRequestHooks[2]).to.equal(callbackNextNoError);
      expect(targetRequestHooks[3]).to.equal(callback);
      expect(targetRequestHooks[4]).to.equal(callback);
      expect(responseHooksKeys).to.have.lengthOf(0);

      hooks.execute(type, target, {}, {},
        function(errMessage) {
          console.log(errMessage);
        }
      );

      expect(spy).to.have.been.called.exactly(3);
      expect(spy).to.have.been.called.with(errMessage);

      hooks.remove(type, target, callback);
      hooks.remove(type, target, callbackNextNoError);
      chai.spy.restore();
      console.log = original;
    });
  });

  describe('remove()', () => {
    it('should should return without removing if "type" parameter is not a valid hook type', () => {
      const target = '/';
      const callback = function(req, res, next) {};

      hooks.add('request', target, callback);
      hooks.add('response', target, callback);

      hooks.remove({}, target, callback);
      hooks.remove(null, target, callback);
      hooks.remove(true, target, callback);
      hooks.remove('', target, callback);

      const targetRequestHooks = hooks.get('request', target);
      const targetResponseHooks = hooks.get('response', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));
      const responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);

      expect(responseHooksKeys).to.have.lengthOf(1);
      expect(responseHooksKeys[0]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback);

      hooks.remove('request', target, callback);
      hooks.remove('response', target, callback);
    });

    it('should should return without removing if "callback" does not match the registered callback', () => {
      const target = '/search';
      const callback = function(req, res, next) {};
      const callback2 = function(req, res, next) {};

      hooks.add('request', target, callback);
      hooks.remove('request', target, callback2);

      const targetRequestHooks = hooks.get('request', target);
      const requestHooksKeys = Object.keys(hooks.get('request'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);

      hooks.remove('request', target, callback);
    });

    it('should remove only request hooks if "type" argument is "req" or "request"', () => {
      const target = '/';
      const target2 = '/users';
      const callback = function(req, res, next) {};
      const callback2 = function(req, res, next) {};

      hooks.add('request', target, callback);
      hooks.add('request', target2, callback2);
      hooks.add('response', target2, callback);
      hooks.add('response', target, callback2)

      let targetRequestHooks = hooks.get('request', target);
      let target2RequestHooks = hooks.get('request', target2);
      let targetResponseHooks = hooks.get('response', target);
      let target2ResponseHooks = hooks.get('response', target2);
      let requestHooksKeys = Object.keys(hooks.get('request'));
      let responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(2);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(requestHooksKeys[1]).to.equal(target2);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(target2RequestHooks).to.be.an('array');
      expect(target2RequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(typeof target2RequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(target2RequestHooks[0]).to.equal(callback2);

      expect(responseHooksKeys).to.have.lengthOf(2);
      expect(responseHooksKeys[0]).to.equal(target2);
      expect(responseHooksKeys[1]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(target2ResponseHooks).to.be.an('array');
      expect(target2ResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(typeof target2ResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback2);
      expect(target2ResponseHooks[0]).to.equal(callback);

      hooks.remove('req', target, callback);

      targetRequestHooks = hooks.get('request', target);
      target2RequestHooks = hooks.get('request', target2);
      targetResponseHooks = hooks.get('response', target);
      target2ResponseHooks = hooks.get('response', target2);
      requestHooksKeys = Object.keys(hooks.get('request'));
      responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(requestHooksKeys[0]).to.equal(target2);
      expect(targetRequestHooks).to.be.undefined;
      expect(target2RequestHooks).to.be.an('array');
      expect(target2RequestHooks).to.have.lengthOf(1);
      expect(typeof target2RequestHooks[0]).to.equal('function');
      expect(target2RequestHooks[0]).to.equal(callback2);

      expect(responseHooksKeys).to.have.lengthOf(2);
      expect(responseHooksKeys[0]).to.equal(target2);
      expect(responseHooksKeys[1]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(target2ResponseHooks).to.be.an('array');
      expect(target2ResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(typeof target2ResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback2);
      expect(target2ResponseHooks[0]).to.equal(callback);

      hooks.remove('request', target2, callback2);

      targetRequestHooks = hooks.get('request', target);
      target2RequestHooks = hooks.get('request', target2);
      targetResponseHooks = hooks.get('response', target);
      target2ResponseHooks = hooks.get('response', target2);;
      requestHooksKeys = Object.keys(hooks.get('request'));
      responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(0);
      expect(targetRequestHooks).to.be.undefined;
      expect(target2RequestHooks).to.be.undefined;
      expect(hooks.get('request')).to.deep.equal({});

      expect(responseHooksKeys).to.have.lengthOf(2);
      expect(responseHooksKeys[0]).to.equal(target2);
      expect(responseHooksKeys[1]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(target2ResponseHooks).to.be.an('array');
      expect(target2ResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(typeof target2ResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback2);
      expect(target2ResponseHooks[0]).to.equal(callback);

      hooks.remove('response', target2, callback);
      hooks.remove('response', target, callback2);
    });

    it('should remove only response hooks if "type" argument is "res" or "response"', () => {
      const target = '/';
      const target2 = '/users';
      const callback = function(req, res, next) {};
      const callback2 = function(req, res, next) {};

      hooks.add('request', target, callback);
      hooks.add('request', target2, callback2);
      hooks.add('response', target2, callback);
      hooks.add('response', target, callback2)

      let targetRequestHooks = hooks.get('request', target);
      let target2RequestHooks = hooks.get('request', target2);
      let targetResponseHooks = hooks.get('response', target);
      let target2ResponseHooks = hooks.get('response', target2);
      let requestHooksKeys = Object.keys(hooks.get('request'));
      let responseHooksKeys = Object.keys(hooks.get('response'));

      expect(requestHooksKeys).to.have.lengthOf(2);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(requestHooksKeys[1]).to.equal(target2);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(target2RequestHooks).to.be.an('array');
      expect(target2RequestHooks).to.have.lengthOf(1);
      expect(typeof targetRequestHooks[0]).to.equal('function');
      expect(typeof target2RequestHooks[0]).to.equal('function');
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(target2RequestHooks[0]).to.equal(callback2);

      expect(responseHooksKeys).to.have.lengthOf(2);
      expect(responseHooksKeys[0]).to.equal(target2);
      expect(responseHooksKeys[1]).to.equal(target);
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(target2ResponseHooks).to.be.an('array');
      expect(target2ResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(typeof target2ResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback2);
      expect(target2ResponseHooks[0]).to.equal(callback);

      hooks.remove('res', target2, callback);

      targetRequestHooks = hooks.get('request', target);
      target2RequestHooks = hooks.get('request', target2);
      targetResponseHooks = hooks.get('response', target);
      target2ResponseHooks = hooks.get('response', target2);
      requestHooksKeys = Object.keys(hooks.get('request'));
      responseHooksKeys = Object.keys(hooks.get('response'));

      expect(responseHooksKeys).to.have.lengthOf(1);
      expect(responseHooksKeys[0]).to.equal(target);
      expect(target2ResponseHooks).to.be.undefined;
      expect(targetResponseHooks).to.be.an('array');
      expect(targetResponseHooks).to.have.lengthOf(1);
      expect(typeof targetResponseHooks[0]).to.equal('function');
      expect(targetResponseHooks[0]).to.equal(callback2);

      expect(requestHooksKeys).to.have.lengthOf(2);
      expect(requestHooksKeys[0]).to.equal(target);
      expect(requestHooksKeys[1]).to.equal(target2);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(1);
      expect(target2RequestHooks).to.be.an('array');
      expect(target2RequestHooks).to.have.lengthOf(1);
      expect(targetRequestHooks[0]).to.equal(callback);
      expect(target2RequestHooks[0]).to.equal(callback2);

      hooks.remove('response', target, callback2);

      targetRequestHooks = hooks.get('request', target);
      target2RequestHooks = hooks.get('request', target2);
      targetResponseHooks = hooks.get('response', target);
      target2ResponseHooks = hooks.get('response', target2);
      requestHooksKeys = Object.keys(hooks.get('request'));
      responseHooksKeys = Object.keys(hooks.get('response'));

      expect(responseHooksKeys).to.have.lengthOf(0);
      expect(targetResponseHooks).to.be.undefined;
      expect(target2ResponseHooks).to.be.undefined;
      expect(hooks.get('response')).to.deep.equal({});

      hooks.remove('request', target, callback);
      hooks.remove('request', target2, callback2);
    });

    it('should should remove all hooks on "target" if "callback" is not specified', () => {
      const target = '/search';
      const callback = function(req, res, next) {};
      const callback2 = function(req, res, next) {};
      const callback3 = function(req, res, next) {};
      const callback4 = function(req, res, next) {};

      hooks.add('request', target, callback);
      hooks.add('request', target, callback2);
      hooks.add('request', target, callback3);
      hooks.add('request', target, callback4);

      let targetRequestHooks = hooks.get('request', target);
      let requestHooksKeys = Object.keys(hooks.get('request'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(4);

      hooks.remove('request', target, callback);

      targetRequestHooks = hooks.get('request', target);
      requestHooksKeys = Object.keys(hooks.get('request'));

      expect(requestHooksKeys).to.have.lengthOf(1);
      expect(targetRequestHooks).to.be.an('array');
      expect(targetRequestHooks).to.have.lengthOf(3);

      hooks.remove('request', target);

      targetRequestHooks = hooks.get('request', target);
      requestHooksKeys = Object.keys(hooks.get('request'));

      expect(requestHooksKeys).to.have.lengthOf(0);
      expect(targetRequestHooks).to.be.undefined;
      expect(hooks.get('request')).to.deep.equal({});
    });
  });
});
