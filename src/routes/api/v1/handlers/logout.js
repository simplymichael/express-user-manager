const { statusCodes } = require('../../../../utils/http');

module.exports = logout;

function logout(req, res) {
  req.session.destroy();

  return res.status(statusCodes.ok).json({});
}
