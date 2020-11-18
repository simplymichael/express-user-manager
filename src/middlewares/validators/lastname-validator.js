const { body } = require('express-validator');

module.exports = () => {
  return [
    body('lastname').trim()
      .isLength({ min: 3 })
      .withMessage('The lastname must be at least 3 characters')
      .escape()
  ];
};
