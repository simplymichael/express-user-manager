const { body } = require('express-validator');

module.exports = () => {
  return [
    body('username').trim()
      .isLength({ min: 3 })
      .withMessage('The username must be at least 3 characters')
      .escape()
  ];
};
