const { body } = require('express-validator');
const { env, appModule } = require('../_utils');
const passwordConfig = appModule.get('password') || {};
const disallowed = passwordConfig.disallowed;
const minLength = passwordConfig.minLength;
const maxLength = passwordConfig.maxLength;

const [ MIN ] = [ minLength || env.PASSWORD_MIN_LENGTH ]
  .map(parseInt)
  .map(val => typeof val === 'number' ? val : 6);

const [ MAX ] = [ maxLength || env.PASSWORD_MAX_LENGTH ]
  .map(parseInt)
  .map(val => typeof val === 'number' ? val : 20);

let disallowedList = disallowed;

if(typeof disallowedList === 'string') {
  disallowedList = disallowedList.trim();
}

if(!disallowedList || disallowedList.length === 0) {
  disallowedList = env.DISALLOWED_PASSWORDS;
}

const DISALLOWED_LIST = Array.isArray(disallowedList)
  ? disallowedList
  : typeof disallowedList === 'string'
    ? disallowedList.split(',').map(str => str.trim())
    : [];

module.exports = () => {
  return [
    body('password').trim()
      .isLength({
        min: MIN,
        max: MAX
      }).withMessage(`must be between ${MIN} and ${MAX} characters long`)
      .matches(/\d/).withMessage('must contain a number')
      .matches(/[A-Z]+/).withMessage('must contain an uppercase character')
      .matches(/[a-z]+/).withMessage('must contain a lowercase character')
      .not().isIn(DISALLOWED_LIST).withMessage('Do not use a common word as the password')
      .escape()
  ];
};
