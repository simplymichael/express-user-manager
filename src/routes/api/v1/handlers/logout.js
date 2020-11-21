const { emit } = require('./_utils');
const { statusCodes } = require('../../../../utils/http');

module.exports = logout;

function logout(req, res) {
  req.session.destroy();

  emit('logoutSuccess');
  return res.status(statusCodes.ok).json({});
}
