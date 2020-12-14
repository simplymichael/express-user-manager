const { emit, statusCodes } = require('./_utils');

module.exports = logout;

function logout(req, res) {
  req.session.destroy();

  emit('logoutSuccess');
  return res.status(statusCodes.ok).json({});
}
