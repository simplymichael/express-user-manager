const { body } = require('express-validator');

module.exports = () => {
  return [
    body('id').trim()
      .isLength({ min: 1 })
      .withMessage('The id field is required')
      .escape()
  ];
};
