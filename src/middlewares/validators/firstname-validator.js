const { body } = require('express-validator');

module.exports = () => {
  return [
    body('firstname').trim()
      .isLength({ min: 3 })
      .withMessage('The firstname must be at least 3 characters')
      .escape()
  ];
};
