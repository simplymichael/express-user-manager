const chai = require('chai');
const mongoose = require('mongoose');
const hooks = require('../../src/utils/hooks');
const { expect } = chai;

let testValue = 0;

describe('Hooks', () => {
  describe('add()', () => {
    it('should throw an error if given an invalid hook type', () => {
     const type = 'fetch';

      try {
        hooks.add(type, '/', function(req, res, next) {});
      } catch(err) {
        expect(typeof err).to.equal('object');
        expect(err).to.match(new RegExp(`hooks::add: unknown hook type: ${type}`));
        expect(hooks.request).to.deep.equal({});
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
         expect(hooks.request).to.deep.equal({});
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
         expect(hooks.request).to.deep.equal({});
       }
    });

    it('should add a hook if type is "req" and "target" and "fn" are valid', () => {
      const target = '/';
      const callback = function(req, res, next) {
        testValue++;
      };

      hooks.add('req', target, callback);
      const hookKeys = Object.keys(hooks.request);

      expect(hookKeys).to.have.lengthOf(1);
      expect(hookKeys[0]).to.equal(target);
      expect(hooks.request[target]).to.be.an('array');
      expect(hooks.request[target]).to.have.lengthOf(1);
      expect(typeof hooks.request[target][0]).to.equal('function');
      expect(hooks.request[target][0]).to.equal(callback);
    });

    it('should add a hook if type is "request" and "target" and "fn" are valid', () => {
      const target = '/';
      const callback = function(req, res, next) {
        testValue++;
      };

      hooks.add('request', target, callback);
      const hookKeys = Object.keys(hooks.request);

      expect(hookKeys).to.have.lengthOf(1);
      expect(hookKeys[0]).to.equal(target);
      expect(hooks.request[target]).to.be.an('array');
      expect(hooks.request[target]).to.have.lengthOf(2);
      expect(typeof hooks.request[target][1]).to.equal('function');
      expect(hooks.request[target][1]).to.equal(callback);
    });
  });

  describe('execute()', () => {
    it('should invoke registered callbacks when "execute" is called', () => {
      const target = '/';
      const callback = function(req, res, next) {
        testValue++;
      };

      hooks.add('request', target, callback);
      const hookKeys = Object.keys(hooks.request);

      expect(hookKeys).to.have.lengthOf(1);
      expect(hookKeys[0]).to.equal(target);
      expect(hooks.request[target]).to.be.an('array');
      expect(hooks.request[target]).to.have.lengthOf(3);
      expect(typeof hooks.request[target][2]).to.equal('function');
      expect(hooks.request[target][2]).to.equal(callback);

      hooks.execute('request', target, {}, {}, function() {});

      expect(testValue).to.equal(3);
    });
  });
});
