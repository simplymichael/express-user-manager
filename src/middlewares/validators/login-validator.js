/**
 * Login validator:
 * validates and sanitizes user login string.
 * The string may be the user's username or email
 */

const { body } = require('express-validator');

module.exports = () => {
  return [
    body('login').trim()
      .isLength({ min: 1 })
      .withMessage('The login field is required')
      .escape()
  ];
};
