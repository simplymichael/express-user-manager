const { body } = require('express-validator');

module.exports = () => {
  return [
    body('password').trim()
      .isLength({ min: 6, max: 20 }).withMessage('must be between 6 and 20 characters long')
      .matches(/\d/).withMessage('must contain a number')
      .matches(/[A-Z]+/).withMessage('must contain an uppercase character')
      .matches(/[a-z]+/).withMessage('must contain a lowercase character')
      .not().isIn(['Passw0rd', 'Password123']).withMessage('Do not use a common word as the password')
      .escape()
  ];
};
