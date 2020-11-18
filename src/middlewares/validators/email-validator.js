const { body } = require('express-validator');

module.exports = () => {
  return [
    body('email').isEmail().withMessage('Please enter a valid email')
  ];
};
