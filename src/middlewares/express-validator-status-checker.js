const { emit, statusCodes } = require('./_utils');
const { validationResult } = require('express-validator');

module.exports = checkExpressValidatorStatus;

function checkExpressValidatorStatus(eventName) {
  return function expressValidatorStatusChecker(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const data = {
        errors: errors.array()
      };

      emit(eventName, data);

      return res.status(statusCodes.badRequest).json(data);
    } else {
      next();
    }
  };
}
