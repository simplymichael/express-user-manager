const { statusCodes } = require('../utils/http');
const { validationResult } = require('express-validator');

module.exports = expressValidatorStatusChecker;

function expressValidatorStatusChecker(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(statusCodes.badRequest).json({
      errors: errors.array()
    });
  } else {
    next();
  }
}
