const { body } = require('express-validator');

//cf. https://stackoverflow.com/a/46013025/1743192
module.exports = () => {
  return [
    body('password')
      .trim()
      .custom((value, { req }) => {
        if (!req.body.confirmPassword || (value !== req.body.confirmPassword)) {
          throw new Error('Passwords don\'t match');
        } else {
          return value;
        }
      })
  ];
};
