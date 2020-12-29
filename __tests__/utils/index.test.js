const chai = require('chai');
const spies = require('chai-spies');
const mongoose = require('mongoose');
const {
  emit,
  userModule,
  getValidId,
  convertToBoolean
} = require('../../src/utils');

const { expect } = chai;

chai.use(spies);

describe('Utils', () => {
  specify('emit() should be invoked on userModule', () => {
    const spy = chai.spy.on(userModule, 'emit');
    const emitName = 'testEmission';
    const emitData = { name: 'test emission', value: '10' };

    emit(emitName, emitData);

    expect(spy).to.have.been.called.with(emitName, emitData);

    chai.spy.restore();
  });

  describe('getValidId()', () => {
    it('should return an empty string if passed no argument', () => {
      expect(getValidId()).to.equal('');
    });

    it('should return an empty string if NULL is passed', () => {
      expect(getValidId(null)).to.equal('');
    });

    it('should return an empty string if undefined is passed', () => {
      expect(getValidId(undefined)).to.equal('');
    });

    it('should return a trimmed string if passed a string', () => {
      expect(getValidId(' 1234 ')).to.equal('1234');
      expect(getValidId(' 1234 ')).not.to.equal(' 1234 ');
    });

    it('should return a string representation if passed an object', () => {
      const stringId = '5d6ede6a0ba62570afcedd3a';
      const objectId = mongoose.Types.ObjectId(stringId);
      const convertedId = getValidId(objectId);

      expect(typeof stringId).to.equal('string');
      expect(typeof objectId).to.equal('object');
      expect(typeof convertedId).to.equal('string');
      expect(convertedId).to.equal(stringId);
      expect(convertedId).to.equal(objectId.toString());
      expect(convertedId).not.to.equal(objectId);
    });

    it('should return a number if passed a number', () => {
      expect(getValidId(5)).to.equal(5);
      expect(typeof getValidId(5)).to.equal('number');
      expect(typeof getValidId(5)).not.to.equal(typeof '5');
      expect(getValidId(5)).not.to.equal('5');
    });

    it('should return an empty string if passed any type apart from string, number, or object', () => {
      expect(getValidId(true)).to.equal('');
      expect(getValidId(false)).to.equal('');
      expect(getValidId('true')).to.equal('true');
      expect(getValidId('false')).to.equal('false');
    });
  });

  describe('convertToBoolean()', () => {
    it('should return boolean false if passed the string "false"', () => {
      const convertedValue = convertToBoolean('false');

      expect(typeof convertedValue).to.equal('boolean');
      expect(convertedValue).to.equal(false);
      expect(convertedValue).not.to.equal('false');
    });

    it('should return boolean false if passed the boolean false', () => {
      const convertedValue = convertToBoolean(false);

      expect(typeof convertedValue).to.equal('boolean');
      expect(convertedValue).to.equal(false);
      expect(convertedValue).not.to.equal('false');
    });

    it('should return boolean false if passed the string "0" (zero)', () => {
      const convertedValue = convertToBoolean('0');

      expect(typeof convertedValue).to.equal('boolean');
      expect(convertedValue).to.equal(false);
      expect(convertedValue).not.to.equal('0');
    });

    it('should return boolean false if passed the number 0 (zero)', () => {
      const convertedValue = convertToBoolean(0);

      expect(typeof convertedValue).to.equal('boolean');
      expect(convertedValue).to.equal(false);
      expect(convertedValue).not.to.equal(0);
    });

    it('should return boolean false if passed NULL', () => {
      expect(convertToBoolean(null)).to.equal(false);
    });

    it('should return boolean false if passed undefined', () => {
      expect(convertToBoolean(undefined)).to.equal(false);
    });

    it('should return boolean false if passed no value', () => {
      expect(convertToBoolean()).to.equal(false);
    });

    it('should return boolean true if passed the string "true"', () => {
      const convertedValue = convertToBoolean('true');

      expect(typeof convertedValue).to.equal('boolean');
      expect(convertedValue).to.equal(true);
      expect(convertedValue).not.to.equal('true');
    });

    it('should return boolean true if passed the boolean true', () => {
      const convertedValue = convertToBoolean(true);

      expect(typeof convertedValue).to.equal('boolean');
      expect(convertedValue).to.equal(true);
      expect(convertedValue).not.to.equal('true');
    });

    it('should return boolean true if passed any string apart from "false" or "0" (zero)', () => {
      expect(convertToBoolean('1')).to.equal(true);
      expect(convertToBoolean('yes')).to.equal(true);
      expect(convertToBoolean('me')).to.equal(true);
      expect(convertToBoolean('-')).to.equal(true);
      expect(convertToBoolean('#')).to.equal(true);
      expect(convertToBoolean('$')).to.equal(true);
      expect(convertToBoolean('false')).not.to.equal(true);
      expect(convertToBoolean('false')).to.equal(false);
      expect(convertToBoolean('0')).not.to.equal(true);
      expect(convertToBoolean('0')).to.equal(false);
    });

    it('should return boolean true if passed any integer apart from 0', () => {
      expect(convertToBoolean(1)).to.equal(true);
      expect(convertToBoolean(2)).to.equal(true);
      expect(convertToBoolean(-1)).to.equal(true);
      expect(convertToBoolean(-5)).to.equal(true);
    });

    it('should return boolean true if passed an object', () => {
      expect(convertToBoolean({})).to.equal(true);
    })
  });
});
