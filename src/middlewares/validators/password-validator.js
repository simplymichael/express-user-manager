const { env } = require('../_utils');
const { body } = require('express-validator');

const [ MIN ] = [ env.PASSWORD_MIN_LENGTH ].map(parseInt).map(val => {
  return typeof val === 'number' ? val : 6;
});

const [ MAX ] = [ env.PASSWORD_MAX_LENGTH ].map(parseInt).map(val => {
  return typeof val === 'number' ? val : 20;
});

const PASSWORD_BLACKLIST = env.PASSWORD_BLACK_LIST.split(',').map(str => str.trim());

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
      .not().isIn(PASSWORD_BLACKLIST).withMessage('Do not use a common word as the password')
      .escape()
  ];
};
