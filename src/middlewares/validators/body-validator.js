/**
 * Validate and sanitize question/answer body
 */

const { body } = require('express-validator');

module.exports = () => {
  return [
    body('body').trim()
      .isLength({ min: 10 })
      .withMessage('The body field is required')
      .escape()
  ];
};
