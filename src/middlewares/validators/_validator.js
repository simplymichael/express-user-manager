const firstnameValidator = require('./firstname-validator');
const lastnameValidator = require('./lastname-validator');
const emailValidator = require('./email-validator');
const usernameValidator = require('./username-validator');
const passwordValidator = require('./password-validator');
const passwordConfirmationValidator = require('./password-confirmation-validator');
const loginValidator = require('./login-validator');

const validators = {
  firstname: firstnameValidator,
  lastname: lastnameValidator,
  email: emailValidator,
  username: usernameValidator,
  password: passwordValidator,
  confirmPassword: passwordConfirmationValidator,
  login: loginValidator
};

module.exports = {
  validate: (...args) => {
    const validations = [];

    args.forEach(arg => {
      const validator = validators[arg];

      if(validator) {
        validations.push(validator());
      }
    });

    return validations;
  },
};
